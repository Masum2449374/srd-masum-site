import { useEffect, useMemo, useState } from "react";
import { currentSeason } from "../lib/season.js";
import { playGhost } from "../lib/ghost.js";

const boo = (e) => { e.stopPropagation(); playGhost(e.clientX, e.clientY); };

// Seasonal hero decoration (Halloween pumpkins + bats, Christmas snow). Lives inside the hero only,
// so it never overlaps the player, ads, or lyrics. CSS-only, pointer-events none, paused when the tab is hidden;
// reduced-motion gets a static arrangement.
export function useSeason() {
  const [s] = useState(() => currentSeason());
  useEffect(() => {
    const el = document.documentElement;
    if (s) el.dataset.season = s; else delete el.dataset.season;
  }, [s]);
  return s;
}

export function SeasonBadge({ season }) {
  if (!season) return null;
  return (
    season === "halloween" ? (
      <button type="button" onClick={boo} data-testid="season-badge" aria-label="Happy Halloween — tap for a ghost"
        className="season-badge season-tap mt-3 inline-flex min-h-[44px] self-start items-center gap-2 rounded-full px-4 text-xs font-semibold tracking-wide">
        🎃 Happy Halloween
      </button>
    ) : (
      <p data-testid="season-badge" className="season-badge mt-3 inline-flex self-start items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide">
        🎄 Merry Christmas
      </p>
    )
  );
}

export default function Seasonal({ season }) {
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.hidden);
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  const items = useMemo(() => {
    if (season === "halloween") {
      return Array.from({ length: 7 }, (_, i) => ({
        ch: i % 3 === 0 ? "🎃" : "🦇",
        kind: i % 3 === 0 ? "pumpkin" : "bat",
        left: `${(i * 37 + 6) % 88}%`, top: `${8 + ((i * 23) % 42)}%`, // upper hero only, clear of the buttons
        size: i % 3 === 0 ? 26 + (i % 2) * 6 : 18 + (i % 3) * 4,
        dur: `${10 + (i * 3) % 8}s`, delay: `${-(i * 1.7)}s`,
      }));
    }
    if (season === "christmas") {
      return Array.from({ length: 22 }, (_, i) => ({
        ch: i % 5 === 0 ? "❄" : "", kind: "snow",
        left: `${(i * 43) % 100}%`, top: "-5%",
        size: i % 5 === 0 ? 14 : 3 + (i % 3) * 2,
        dur: `${8 + (i * 5) % 9}s`, delay: `${-((i * 1.3) % 12)}s`,
      }));
    }
    return [];
  }, [season]);
  if (!season) return null;
  return (
    <div aria-hidden="true" data-testid="seasonal" data-season={season}
      className={`seasonal pointer-events-none absolute inset-0 -z-10 overflow-hidden ${hidden ? "seasonal-paused" : ""}`}>
      <div className={`seasonal-tint seasonal-tint-${season}`} />
      {season === "halloween" ? null : items.map((it, i) => (
        <span key={i} className={`season-item season-${it.kind}`}
          style={{ left: it.left, top: it.top, fontSize: it.size, width: it.ch ? undefined : it.size, height: it.ch ? undefined : it.size, animationDuration: it.dur, animationDelay: it.delay }}>
          {it.ch}
        </span>
      ))}
    </div>
  );
}

// Tappable Halloween decorations: sits above the hero content (z-[5]) but the layer itself
// ignores pointers; only each ≥44px decoration catches taps. Kept to the upper hero.
export function SeasonalTaps({ season }) {
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.hidden);
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  if (season !== "halloween") return null;
  const items = Array.from({ length: 7 }, (_, i) => ({
    ch: i % 3 === 0 ? "🎃" : "🦇", kind: i % 3 === 0 ? "pumpkin" : "bat",
    left: `${(i * 37 + 6) % 88}%`, top: `${8 + ((i * 23) % 42)}%`,
    size: i % 3 === 0 ? 26 + (i % 2) * 6 : 18 + (i % 3) * 4,
    dur: `${10 + (i * 3) % 8}s`, delay: `${-(i * 1.7)}s`,
  }));
  return (
    <div data-testid="seasonal-taps" className={`pointer-events-none absolute inset-x-0 top-0 z-[5] h-[60%] overflow-hidden ${hidden ? "seasonal-paused" : ""}`}>
      {items.map((it, i) => (
        <button key={i} type="button" onClick={boo} aria-label={it.kind === "pumpkin" ? "Pumpkin — tap for a ghost" : "Bat — tap for a ghost"}
          data-deco={it.kind}
          className={`season-item season-tap season-${it.kind} pointer-events-auto flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center`}
          style={{ left: it.left, top: it.top, fontSize: it.size, animationDuration: it.dur, animationDelay: it.delay }}>
          {it.ch}
        </button>
      ))}
    </div>
  );
}

// Flying ghosts (Halloween): drift across the upper hero on wavy paths. Each is a ≥44px button;
// a tap plays the ghost sound, spins/fades it out, and it returns after ~1.6s.
const GHOSTS = [
  { top: "6%", size: 34, dur: 19, wave: 3.2, delay: -2, op: 0.55 },
  { top: "22%", size: 26, dur: 25, wave: 2.6, delay: -11, op: 0.45, rev: true },
  { top: "36%", size: 40, dur: 31, wave: 4.1, delay: -6, op: 0.5 },
  { top: "14%", size: 22, dur: 22, wave: 2.2, delay: -17, op: 0.4, rev: true },
];
export function FlyingGhosts({ season }) {
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.hidden);
  const [gone, setGone] = useState({});
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  if (season !== "halloween") return null;
  const tap = (i) => (e) => {
    boo(e);
    if (gone[i]) return;
    setGone((g) => ({ ...g, [i]: true }));
    setTimeout(() => setGone((g) => ({ ...g, [i]: false })), 1600);
  };
  return (
    <div data-testid="flying-ghosts" className={`pointer-events-none absolute inset-x-0 top-0 z-[5] h-[60%] overflow-hidden ${hidden ? "seasonal-paused" : ""}`}>
      {GHOSTS.map((g, i) => (
        <div key={i} className={`fly-ghost-x ${g.rev ? "fly-rev" : ""}`} style={{ top: g.top, animationDuration: `${g.dur}s`, animationDelay: `${g.delay}s` }}>
          <div className="fly-ghost-y" style={{ animationDuration: `${g.wave}s` }}>
            <button type="button" onClick={tap(i)} data-deco="ghost" aria-label="Ghost — tap for a boo"
              className={`season-tap fly-ghost pointer-events-auto flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center ${gone[i] ? "fly-gone" : ""}`}
              style={{ fontSize: g.size, opacity: g.op }}>👻</button>
          </div>
        </div>
      ))}
    </div>
  );
}
