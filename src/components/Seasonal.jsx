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

// Flying ghosts (Halloween): SVG ghosts idle in place with a gentle bob. A tap plays the ghost sound,
// the ghost unfolds its wings, flaps and flies off on a curved path, then returns (~2.8s) and folds them.
const GHOSTS = [
  { left: "8%", top: "8%", size: 52, bob: 3.2, delay: -0.4, op: 0.8, dir: 1 },
  { left: "68%", top: "20%", size: 44, bob: 2.7, delay: -1.3, op: 0.72, dir: -1 },
  { left: "38%", top: "34%", size: 58, bob: 3.8, delay: -2.1, op: 0.78, dir: 1 },
  { left: "82%", top: "4%", size: 40, bob: 2.4, delay: -0.9, op: 0.68, dir: -1 },
];
const FLY_MS = 2800;
function GhostSvg() {
  return (
    <svg viewBox="-60 -10 220 140" className="ghost-svg" aria-hidden="true">
      <defs>
        <radialGradient id="gb" cx="50%" cy="35%" r="70%"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#d9e2ff" /></radialGradient>
      </defs>
      <g className="wing wing-l"><path d="M28 52 C 8 30, -30 18, -56 26 C -44 36, -46 44, -50 52 C -36 50, -30 58, -32 66 C -18 60, -6 64, 0 72 C 8 62, 20 62, 30 66 Z" fill="#cfd6ff" opacity=".85" /></g>
      <g className="wing wing-r"><path d="M72 52 C 92 30, 130 18, 156 26 C 144 36, 146 44, 150 52 C 136 50, 130 58, 132 66 C 118 60, 106 64, 100 72 C 92 62, 80 62, 70 66 Z" fill="#cfd6ff" opacity=".85" /></g>
      <path d="M50 4 C 22 4, 16 30, 16 56 L 16 112 L 28 102 L 39 114 L 50 102 L 61 114 L 72 102 L 84 112 L 84 56 C 84 30, 78 4, 50 4 Z" fill="url(#gb)" />
      <ellipse cx="38" cy="46" rx="6" ry="8" fill="#1b1430" /><ellipse cx="62" cy="46" rx="6" ry="8" fill="#1b1430" />
      <ellipse cx="50" cy="68" rx="7" ry="9" fill="#1b1430" opacity=".85" />
    </svg>
  );
}
export function FlyingGhosts({ season }) {
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.hidden);
  const [flying, setFlying] = useState({});
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  if (season !== "halloween") return null;
  const tap = (i) => (e) => {
    boo(e);
    if (flying[i]) return;
    setFlying((f) => ({ ...f, [i]: true }));
    setTimeout(() => setFlying((f) => ({ ...f, [i]: false })), FLY_MS);
  };
  return (
    <div data-testid="flying-ghosts" className={`pointer-events-none absolute inset-x-0 top-0 z-[5] h-[60%] ${hidden ? "seasonal-paused" : ""}`}>
      {GHOSTS.map((g, i) => (
        <button key={i} type="button" onClick={tap(i)} data-deco="ghost" data-flying={flying[i] ? "1" : "0"} aria-label="Ghost — tap to make it fly"
          className={`season-tap ghost-btn pointer-events-auto absolute flex min-h-[44px] min-w-[44px] items-center justify-center ${flying[i] ? "is-flying" : ""} ${g.dir < 0 ? "fly-left" : ""}`}
          style={{ left: g.left, top: g.top, width: g.size, height: g.size * 1.15, opacity: g.op }}>
          <span className="ghost-bob" style={{ animationDuration: `${g.bob}s`, animationDelay: `${g.delay}s` }}>
            <span className="ghost-flight"><GhostSvg /></span>
          </span>
        </button>
      ))}
    </div>
  );
}
