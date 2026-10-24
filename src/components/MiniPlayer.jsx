import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Disc, SkipBack, SkipForward } from "@phosphor-icons/react";
import { beatPlay, beatStop } from "../lib/beat.js";
import {
  setMediaSessionMetadata,
  setMediaSessionHandlers,
  setMediaSessionState,
  setMediaSessionPosition,
} from "../lib/mediasession.js";

// One <audio> element for the whole site. Rows never own audio, so only one track can ever play.
// preload="auto" fetches the file once a track is chosen; durations come from the data lists, so
// nothing is downloaded just to read a length.
const PlayerContext = createContext(null);
const usePlayer = () => useContext(PlayerContext);

export function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const trackRef = useRef(null);
  const queueRef = useRef([]);
  const scrubRef = useRef(null);
  const scrubTimer = useRef(0);
  const [track, setTrack] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrub, setScrub] = useState(null);

  useEffect(() => () => clearTimeout(scrubTimer.current), []);

  const load = useCallback((t, list) => {
    const a = audioRef.current;
    if (!a) return;
    if (list) queueRef.current = list;
    trackRef.current = t;
    setTrack(t);
    setCurrent(0);
    setDuration(t.duration || 0);
    setMediaSessionMetadata(t);
    a.src = t.src;
    a.load();
    a.play().catch(() => {});
  }, []);

  const toggle = useCallback(
    (t, list) => {
      const a = audioRef.current;
      if (!a) return;
      if (trackRef.current && trackRef.current.id === t.id) {
        if (a.paused) a.play().catch(() => {});
        else a.pause();
      } else {
        load(t, list);
      }
    },
    [load]
  );

  // dir: +1 or -1. wrap: loop around the list (buttons, lock screen) or stop at the ends (track ended).
  const step = useCallback(
    (dir, wrap = true) => {
      const q = queueRef.current;
      const t = trackRef.current;
      if (!t || !q.length) return false;
      let j = q.findIndex((x) => x.id === t.id) + dir;
      if (wrap) j = (j + q.length) % q.length;
      if (j < 0 || j >= q.length) return false;
      load(q[j], q);
      return true;
    },
    [load]
  );

  const previous = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }
    step(-1, true);
  }, [step]);

  const commitSeek = useCallback((v) => {
    const a = audioRef.current;
    if (a && Number.isFinite(v)) a.currentTime = v;
  }, []);

  // Dragging only moves the display. The audio position is written once the drag pauses (150ms)
  // and again on release, so the stream is not re-seeked on every pixel.
  const onScrub = (v) => {
    scrubRef.current = v;
    setScrub(v);
    clearTimeout(scrubTimer.current);
    scrubTimer.current = setTimeout(() => commitSeek(v), 150);
  };
  const endScrub = () => {
    clearTimeout(scrubTimer.current);
    if (scrubRef.current !== null) commitSeek(scrubRef.current);
    scrubRef.current = null;
    setScrub(null);
  };

  // Lock-screen and notification controls. Registered once; they read the live element and queue.
  useEffect(() => {
    setMediaSessionHandlers({
      play: () => audioRef.current?.play().catch(() => {}),
      pause: () => audioRef.current?.pause(),
      nexttrack: () => step(1, true),
      previoustrack: () => previous(),
      seekto: (d) => {
        if (Number.isFinite(d.seekTime)) commitSeek(d.seekTime);
      },
      seekbackward: (d) => {
        const a = audioRef.current;
        if (a) a.currentTime = Math.max(0, a.currentTime - (d.seekOffset || 10));
      },
      seekforward: (d) => {
        const a = audioRef.current;
        if (a) {
          const end = Number.isFinite(a.duration) ? a.duration : Infinity;
          a.currentTime = Math.min(end, a.currentTime + (d.seekOffset || 10));
        }
      },
    });
  }, [step, previous, commitSeek]);

  const onPlay = (e) => {
    setPlaying(true);
    beatPlay(e.currentTarget);
    setMediaSessionState("playing");
    setMediaSessionPosition(e.currentTarget);
  };
  const onPause = (e) => {
    setPlaying(false);
    beatStop(e.currentTarget);
    setMediaSessionState("paused");
  };
  const onEnded = (e) => {
    setPlaying(false);
    beatStop(e.currentTarget);
    // Auto-advance to the next track in the same list. At the end of the list, stop.
    if (!step(1, false)) {
      setCurrent(0);
      setMediaSessionState("paused");
    }
  };
  const onTimeUpdate = (e) => {
    if (scrubRef.current === null) setCurrent(e.currentTarget.currentTime);
    setMediaSessionPosition(e.currentTarget);
  };
  const onDurationChange = (e) => {
    const d = e.currentTarget.duration;
    if (Number.isFinite(d) && d > 0) setDuration(d);
    setMediaSessionPosition(e.currentTarget);
  };

  const value = useMemo(
    () => ({ track, playing, toggle, step, current, duration, onScrub, endScrub }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [track, playing, toggle, step, current, duration, scrub]
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="auto"
        className="hidden"
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onDurationChange}
        onDurationChange={onDurationChange}
      />
      <MiniBar player={value} scrub={scrub} />
    </PlayerContext.Provider>
  );
}

// Compact row: thumb + title + duration + small play button. No seek bar in rows.
// The sticky bar is rendered by PlayerProvider; this export keeps App.jsx imports valid.
export function MiniPlayer() {
  return null;
}

export function TrackRow({ track, list }) {
  const player = usePlayer();
  const isActive = player?.track?.id === track.id;
  const isPlaying = isActive && player.playing;
  const shownDuration = isActive && player.duration ? player.duration : track.duration;

  return (
    <div
      data-track-row={track.id}
      className={`flex h-[60px] items-center gap-3 rounded-xl px-2 transition-colors ${
        isActive ? "bg-raised ring-1 ring-accent/40" : "hover:bg-raised/60"
      } ${isPlaying ? "beat-glow beat-card" : ""}`}
    >
      <div
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent via-[#7a2e6b] to-accent-deep"
      >
        <Disc size={18} weight="duotone" className="text-ink/80" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[15px] font-semibold leading-tight ${isActive ? "text-accent" : "text-ink"}`}>
          {track.title}
        </p>
      </div>
      <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
        {shownDuration ? formatTime(shownDuration) : ""}
      </span>
      <button
        type="button"
        onClick={() => player.toggle(track, list)}
        aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition active:scale-95"
      >
        {isPlaying ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" className="translate-x-[1px]" />}
      </button>
    </div>
  );
}

// Sticky bar at the bottom of the viewport. Shows only while a track is loaded.
function MiniBar({ player, scrub }) {
  if (!player.track) return null;
  const shown = scrub ?? player.current;
  const max = player.duration || 0;
  const pct = max ? Math.min(100, (shown / max) * 100) : 0;
  return (
    <div
      role="region"
      aria-label="Now playing"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-sunk px-3 pb-[env(safe-area-inset-bottom)] pt-2"
    >
      <input
        type="range"
        min={0}
        max={max}
        step={0.1}
        value={shown}
        onChange={(e) => player.onScrub(Number(e.target.value))}
        onPointerUp={player.endScrub}
        onTouchEnd={player.endScrub}
        onKeyUp={player.endScrub}
        onBlur={player.endScrub}
        aria-label={`Seek ${player.track.title}`}
        className="seek w-full"
        style={{ background: `linear-gradient(to right, #ff64c8 ${pct}%, #2c2a27 ${pct}%)` }}
      />
      <div className="mx-auto flex max-w-6xl items-center gap-3 py-2">
        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent via-[#7a2e6b] to-accent-deep"
        >
          <Disc size={18} weight="duotone" className="text-ink/80" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{player.track.title}</p>
          <p className="font-mono text-[11px] tabular-nums text-muted">
            {formatTime(shown)} / {formatTime(max)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => player.step(-1, true)}
          aria-label="Previous"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/80 hover:text-accent"
        >
          <SkipBack size={18} weight="fill" />
        </button>
        <button
          type="button"
          onClick={() => player.toggle(player.track)}
          aria-label={player.playing ? "Pause" : "Play"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent active:scale-95"
        >
          {player.playing ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" className="translate-x-[1px]" />}
        </button>
        <button
          type="button"
          onClick={() => player.step(1, true)}
          aria-label="Next"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/80 hover:text-accent"
        >
          <SkipForward size={18} weight="fill" />
        </button>
      </div>
    </div>
  );
}
