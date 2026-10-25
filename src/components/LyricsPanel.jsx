import { useEffect, useMemo, useRef } from "react";
import { activeLine, parseLyrics } from "../lib/lyrics.js";

// Scrolling lyrics for the Now Playing sheet. Synced when the track has lyricTimes:
// highlights the current line, auto-scrolls it to center, and seeks on tap.
export default function LyricsPanel({ track, current, duration, onSeek }) {
  const rows = useMemo(
    () => parseLyrics(track.lyrics, track.lyricTimes, track.lyricEnds, duration || track.duration),
    [track.lyrics, track.lyricTimes, track.lyricEnds, duration, track.duration]
  );
  const synced = Array.isArray(track.lyricTimes) && track.lyricTimes.length > 0;
  const active = synced ? activeLine(rows, current) : -1;
  const box = useRef(null);
  const userScroll = useRef(0);

  useEffect(() => {
    if (!synced || active < 0 || !box.current) return;
    if (Date.now() - userScroll.current < 3000) return; // let a manual scroll breathe
    const el = box.current.querySelector(`[data-seq="${active}"]`);
    if (!el) return;
    const c = box.current;
    c.scrollTo({ top: el.offsetTop - c.clientHeight / 2 + el.clientHeight / 2, behavior: "smooth" });
  }, [active, synced]);

  return (
    <div
      ref={box}
      data-testid="np-lyrics-panel"
      lang="bn"
      onPointerDownCapture={(e) => e.stopPropagation()}
      onWheel={() => { userScroll.current = Date.now(); }}
      onTouchMove={() => { userScroll.current = Date.now(); }}
      className="lyrics-scroll relative min-h-0 flex-1 overflow-y-auto overscroll-contain py-[30vh] text-center"
      style={{ fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif", maskImage: "linear-gradient(transparent, #000 15%, #000 85%, transparent)", WebkitMaskImage: "linear-gradient(transparent, #000 15%, #000 85%, transparent)" }}
    >
      {!synced ? <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-muted">Lyrics</p> : null}
      {rows.map((r, i) => {
        if (r.kind === "gap") return <div key={i} className="h-4" />;
        if (r.kind === "label")
          return <p key={i} className="mb-2 mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted/70">{r.text}</p>;
        if (r.kind === "inst") {
          const on = r.seq === active;
          const prog = on ? Math.min(1, Math.max(0, (current - r.t) / Math.max(0.1, r.until - r.t))) : 0;
          return (
            <button key={i} type="button" data-seq={r.seq} data-inst="1" aria-label="Instrumental" aria-current={on ? "true" : undefined}
              onClick={() => { userScroll.current = 0; onSeek?.(r.t); }}
              className={`mx-auto my-2 flex items-center justify-center gap-2 py-1.5 text-[22px] transition-all duration-300 ${on ? "scale-110 text-ink" : "text-ink/35"}`}>
              {[0, 1, 2].map((d) => (
                <span key={d} className={on ? "lyr-note" : ""}
                  style={on ? { animationDelay: `${d * 0.25}s`, opacity: prog * 3 > d ? 1 : 0.35 } : undefined}>♪</span>
              ))}
            </button>
          );
        }
        const on = r.seq != null && r.seq === active;
        const past = synced && active >= 0 && r.seq != null && r.seq < active;
        const cls = `block w-full py-1.5 text-[19px] font-semibold leading-relaxed transition-all duration-300 ${
          on ? "scale-[1.04] text-ink" : synced ? (past ? "text-ink/40" : "text-ink/55") : "text-ink/85"
        }`;
        return synced && r.t != null ? (
          <button key={i} type="button" data-line={r.idx} data-seq={r.seq} aria-current={on ? "true" : undefined}
            onClick={() => { userScroll.current = 0; onSeek?.(r.t); }} className={`${cls} hover:text-accent`}>
            {r.text}
          </button>
        ) : (
          <p key={i} data-line={r.idx} className={cls}>{r.text}</p>
        );
      })}
    </div>
  );
}
