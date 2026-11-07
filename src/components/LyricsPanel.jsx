import { useEffect, useMemo, useRef, useState } from "react";
import { activeLine, parseLyrics } from "../lib/lyrics.js";
import { lyricScrollTarget } from "../lib/lyric-scroll.js";

// Line-level timing only. Reading and seeking never replace or reload the audio.
export default function LyricsPanel({ track, current, duration, onSeek }) {
  const rows = useMemo(
    () => parseLyrics(track.lyrics, track.lyricTimes, track.lyricEnds, duration || track.duration),
    [track.lyrics, track.lyricTimes, track.lyricEnds, duration, track.duration]
  );
  const synced = Boolean(track.lyricTimes?.length);
  const active = synced ? activeLine(rows, current) : -1;
  const box = useRef(null);
  const resumeTimer = useRef(null);
  const [following, setFollowing] = useState(true);
  const resume = () => {
    clearTimeout(resumeTimer.current);
    setFollowing(true);
  };
  const readManually = () => {
    clearTimeout(resumeTimer.current);
    setFollowing(false);
    resumeTimer.current = setTimeout(() => setFollowing(true), 5000);
  };
  useEffect(() => {
    clearTimeout(resumeTimer.current);
    setFollowing(true);
    box.current?.scrollTo({ top: 0, behavior: "auto" });
    return () => clearTimeout(resumeTimer.current);
  }, [track.id]);
  useEffect(() => {
    if (!synced || !following || active < 0 || !box.current) return;
    const viewport = box.current;
    const line = viewport.querySelector(`[data-seq="${active}"]`);
    if (!line) return;
    viewport.scrollTo({
      top: lyricScrollTarget(viewport, line),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [active, synced, following, track.id]);
  const seek = (time) => { resume(); onSeek?.(time); };
  const lang = track.lyricsLang || (/[\u0980-\u09ff]/.test(track.lyrics || "") ? "bn" : /[\u0400-\u04ff]/.test(track.lyrics || "") ? "ru" : /[\u0900-\u097f]/.test(track.lyrics || "") ? "hi" : "en");
  return (
    <div className="lyrics-reader">
      <div ref={box} data-testid="np-lyrics-panel" lang={lang}
        role="region" aria-label={`Lyrics for ${track.title}`} tabIndex={0}
        onPointerDownCapture={(e) => e.stopPropagation()}
        onWheel={readManually} onTouchMove={readManually}
        onKeyDownCapture={(e) => { if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key) && (e.key !== " " || e.target === box.current)) readManually(); }}
        className="lyrics-scroll">
        <div aria-hidden="true" className="lyrics-leading-space" />
        {rows.map((r, i) => {
          if (r.kind === "gap") return <div key={i} className="lyrics-stanza-space" />;
          if (r.kind === "label") return <p key={i} className="lyrics-section-label">{r.text}</p>;
          if (r.kind === "inst") return (
            <button key={i} type="button" data-seq={r.seq} data-inst="1" disabled={!onSeek}
              aria-label="Instrumental" aria-current={r.seq === active ? "true" : undefined}
              onClick={() => seek(r.t)} className="lyrics-interlude">
              <span className="lyrics-interlude-bars" aria-hidden="true"><i /><i /><i /></span>
              <span>Instrumental</span>
            </button>
          );
          const on = r.seq != null && r.seq === active;
          const past = synced && active >= 0 && r.seq != null && r.seq < active;
          const cls = `lyrics-line ${past ? "is-past" : ""}`;
          return synced && r.t != null ? (
            <button key={i} type="button" data-line={r.idx} data-seq={r.seq} disabled={!onSeek}
              aria-current={on ? "true" : undefined} onClick={() => seek(r.t)} className={cls}>{r.text}</button>
          ) : <p key={i} data-line={r.idx} className={cls}>{r.text}</p>;
        })}
        <div aria-hidden="true" className="lyrics-trailing-space" />
      </div>
      <div className="lyrics-reader-footer">
        <span>{synced && onSeek ? "Tap a line to seek" : "Read along"}</span>
        {synced && (!following ? <button type="button" onClick={resume}>Resume sync <span aria-hidden="true">↗</span></button> : <span className="lyrics-follow-state">Following the music</span>)}
      </div>
    </div>
  );
}
