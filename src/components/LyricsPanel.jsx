import { useEffect, useMemo, useRef, useState } from "react";
import { MusicNotes } from "@phosphor-icons/react";
import { activeLine, parseLyrics } from "../lib/lyrics.js";
import { lyricScrollTarget } from "../lib/lyric-scroll.js";

// Line-level timing only. Reading and seeking never replace or reload the audio.
export default function LyricsPanel({ track, current, duration, onSeek, playing = false }) {
  const rows = useMemo(
    () => parseLyrics(track.lyrics, track.lyricTimes, track.lyricEnds, duration || track.duration),
    [track.lyrics, track.lyricTimes, track.lyricEnds, duration, track.duration]
  );
  const synced = Boolean(track.lyricTimes?.length);
  const canFollow = typeof onSeek === "function";
  const active = synced && canFollow ? activeLine(rows, current) : -1;
  const box = useRef(null);
  const resumeTimer = useRef(null);
  const lastPosition = useRef(null);
  const [following, setFollowing] = useState(true);
  const resume = () => {
    clearTimeout(resumeTimer.current);
    setFollowing(true);
  };
  const readManually = () => {
    if (!canFollow) return;
    clearTimeout(resumeTimer.current);
    setFollowing(false);
    resumeTimer.current = setTimeout(() => setFollowing(true), 5000);
  };
  useEffect(() => {
    clearTimeout(resumeTimer.current);
    setFollowing(true);
    box.current?.scrollTo({ top: 0, behavior: "auto" });
    return () => clearTimeout(resumeTimer.current);
  }, [track.id, canFollow]);
  useEffect(() => {
    const previous = lastPosition.current;
    const changedTrack = previous?.trackId !== track.id;
    const becameActive = canFollow && !previous?.canFollow;
    const seekJump = previous && !changedTrack && Math.abs(current - previous.current) > 2;
    const changedLine = previous?.active !== active;
    const resumed = following && previous && !previous.following;
    lastPosition.current = { trackId: track.id, current, active, following: changedTrack || becameActive ? true : following, canFollow };
    if (!synced || !canFollow || (!following && !changedTrack && !becameActive) || active < 0 || !box.current) return;
    if (!changedTrack && !becameActive && !changedLine && !resumed && !seekJump) return;
    const viewport = box.current;
    const line = viewport.querySelector(`[data-seq="${active}"]`);
    if (!line) return;
    viewport.scrollTo({
      top: lyricScrollTarget(viewport, line),
      // Opening/track changes and explicit jumps should land at the right moment,
      // not sweep through every inactive chorus/section on the way there.
      behavior: changedTrack || becameActive || seekJump || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [active, synced, following, track.id, current, canFollow]);
  const seek = (time) => { if (!canFollow) return; resume(); onSeek(time); };
  const lang = track.lyricsLang || (/[\u0980-\u09ff]/.test(track.lyrics || "") ? "bn" : /[\u0400-\u04ff]/.test(track.lyrics || "") ? "ru" : /[\u0900-\u097f]/.test(track.lyrics || "") ? "hi" : "en");
  return (
    <div className="lyrics-reader" data-playing={playing ? "true" : "false"}>
      <div ref={box} data-testid="np-lyrics-panel" lang={lang}
        role="region" aria-label={`Lyrics for ${track.title}`} tabIndex={0}
        onPointerDownCapture={(e) => e.stopPropagation()}
        onWheel={readManually} onTouchMove={readManually}
        onKeyDownCapture={(e) => { if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key) && (e.key !== " " || e.target === box.current)) readManually(); }}
        className="lyrics-scroll">
        <div aria-hidden="true" className="lyrics-leading-space" />
        {rows.map((r, i) => {
          if (r.kind === "gap") return <div key={i} className="lyrics-stanza-space" />;
          if (r.kind === "label") return null; // Headings are not timed lyrics.
          if (r.kind === "inst") return r.seq === active ? (
            <button key={i} type="button" data-seq={r.seq} data-inst="1" disabled={!canFollow}
              aria-label="Instrumental break" aria-current="true"
              onClick={() => seek(r.t)} className="lyrics-interlude">
              <span className="lyrics-music-orb" aria-hidden="true">
                <span className="lyrics-music-orbit" />
                <MusicNotes size={38} weight="duotone" className="lyrics-music-icon" />
              </span>
            </button>
          ) : null;
          const on = r.seq != null && r.seq === active;
          const past = synced && active >= 0 && r.seq != null && r.seq < active;
          const cls = `lyrics-line ${past ? "is-past" : ""}`;
          return synced && r.t != null ? (
            <button key={i} type="button" data-line={r.idx} data-seq={r.seq} disabled={!canFollow}
              aria-current={on ? "true" : undefined} onClick={() => seek(r.t)} className={cls}><span className="lyrics-line-text">{r.text}</span></button>
          ) : <p key={i} data-line={r.idx} className={cls}><span className="lyrics-line-text">{r.text}</span></p>;
        })}
        <div aria-hidden="true" className="lyrics-trailing-space" />
      </div>
      {synced && canFollow && !following && (
        <div className="lyrics-reader-footer">
          <button type="button" onClick={resume}>Resume sync <span aria-hidden="true">↗</span></button>
        </div>
      )}
    </div>
  );
}
