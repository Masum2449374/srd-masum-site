import { useEffect, useMemo, useState } from "react";
import { currentSeason } from "../lib/season.js";

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
    <p data-testid="season-badge" className="season-badge mt-3 inline-flex self-start items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide">
      {season === "halloween" ? "🎃 Happy Halloween" : "🎄 Merry Christmas"}
    </p>
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
        left: `${(i * 37 + 6) % 92}%`, top: `${(i * 23 + 8) % 70}%`,
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
      {items.map((it, i) => (
        <span key={i} className={`season-item season-${it.kind}`}
          style={{ left: it.left, top: it.top, fontSize: it.size, width: it.ch ? undefined : it.size, height: it.ch ? undefined : it.size, animationDuration: it.dur, animationDelay: it.delay }}>
          {it.ch}
        </span>
      ))}
    </div>
  );
}
