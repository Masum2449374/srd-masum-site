import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Play, Pause, Disc, SkipBack, SkipForward } from "@phosphor-icons/react";
import { beatPlay, beatStop } from "../lib/beat.js";
import { setMediaSession, setMediaSessionState } from "../lib/mediasession.js";

// One <audio> element for the whole site. Rows never own audio, so hundreds of rows stay cheap.
// The shared mini-player shows whichever track is loaded here.
const PlayerContext = createContext(null);

export function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const queueRef = useRef([]); // the list the current track came from (for prev/next)
  const [track, setTrack] = useState(null); // { id, title, src, list }
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const load = useCallback((t, list) => {
    const a = audioRef.current;
    if (!a) return;
    queueRef.current = list || [];
    setTrack(t);
    setCurrent(0);
    setDuration(0);
    a.src = t.src;
    a.load();
    a.play().catch(() => {});
  }, []);

  const toggle = useCallback((t, list) => {
    const a = audioRef.current;
    if (!a) return;
    if (track && track.id === t.id) {
      if (a.paused) a.play().catch(() => {});
      else a.pause();
    } else {
      load(t, list);
    }
  }, [track, load]);

  const step = useCallback((dir) => {
    const q = queueRef.current;
    if (!track || !q.length) return;
    const i = q.findIndex((x) => x.id === track.id);
    const next = q[(i + dir + q.length) % q.length];
    if (next) load(next, q);
  }, [track, load]);

  const seek = useCallback((v) => {
    const a = audioRef.current;
    if (a) a.currentTime = v;
    setCurrent(v);
  }, []);

  const value = useMemo(
    () => ({ track, playing, toggle, step, seek, current, duration }),
    [track, playing, toggle, step, seek, current, duration]
  );

  const onPlay = (e) => {
    setPlaying(true);
    beatPlay(e.currentTarget);
    if (track) setMediaSession(track, e.currentTarget);
    setMediaSessionState("playing");
  };
  const onPause = (e) => {
    setPlaying(false);
    beatStop(e.currentTarget);
    setMediaSessionState("paused");
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="none"
        className="hidden"
        onPlay={onPlay}
        onPause={onPause}
        onEnded={(e) => {
          setPlaying(false);
          beatStop(e.currentTarget);
          setMediaSessionState("paused");
          step(1);
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => {
          if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration);
        }}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}

// Compact row: thumb + title + duration + small play button. No seek bar in rows.
// Renders a fixed-height placeholder until it scrolls near the viewport, so long lists stay light.
export function TrackRow({ track, list, index }) {
  const player = usePlayer();
  const ref = useRef(null);
  const [visible, setVisible] = useState(index < 12);
  const [dur, setDur] = useState(track.duration || 0);

  useEffect(() => {
    if (visible || !ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible]);

  const isActive = player?.track?.id === track.id;
  const isPlaying = isActive && player.playing;

  // Read the length once per visible row. Metadata only, so the page stays light.
  useEffect(() => {
    if (!visible || dur) return;
    const probe = new Audio();
    probe.preload = "metadata";
    const done = () => {
      if (Number.isFinite(probe.duration)) setDur(probe.duration);
    };
    probe.addEventListener("loadedmetadata", done);
    probe.src = track.src;
    return () => {
      probe.removeEventListener("loadedmetadata", done);
      probe.src = "";
    };
  }, [visible, dur, track.src]);

  useEffect(() => {
    if (!isActive || !player.duration || dur) return;
    setDur(player.duration);
  }, [isActive, player?.duration, dur]);

  return (
    <div
      ref={ref}
      data-track-row={track.id}
      className={`relative flex h-[60px] items-center gap-3 rounded-xl px-2 transition-colors ${
        isActive ? "bg-raised ring-1 ring-accent/40" : "hover:bg-raised/60"
      } ${isPlaying ? "beat-glow beat-card" : ""}`}
    >
      {visible ? (
        <>
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
            {track.sub ? <p className="truncate text-xs text-muted">{track.sub}</p> : null}
          </div>
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
            {dur ? formatTime(dur) : ""}
          </span>
          <button
            type="button"
            onClick={() => player.toggle(track, list)}
            aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition active:scale-95"
          >
            {isPlaying ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" className="translate-x-[1px]" />}
          </button>
        </>
      ) : null}
    </div>
  );
}

// Shared sticky bar at the bottom of the viewport. Shows only while a track is loaded.
export function MiniPlayer() {
  const p = usePlayer();
  if (!p || !p.track) return null;
  const pct = p.duration ? Math.min(100, (p.current / p.duration) * 100) : 0;
  return (
    <div
      role="region"
      aria-label="Now playing"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-sunk/95 px-3 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-sm"
    >
      <input
        type="range"
        min={0}
        max={p.duration || 0}
        step={0.1}
        value={p.current}
        onChange={(e) => p.seek(Number(e.target.value))}
        aria-label={`Seek ${p.track.title}`}
        className="seek w-full"
        style={{ background: `linear-gradient(to right, #ff64c8 ${pct}%, #2c2a27 ${pct}%)` }}
      />
      <div className="mx-auto flex max-w-6xl items-center gap-3 py-2">
        <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent via-[#7a2e6b] to-accent-deep">
          <Disc size={18} weight="duotone" className="text-ink/80" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{p.track.title}</p>
          <p className="font-mono text-[11px] tabular-nums text-muted">
            {formatTime(p.current)} / {formatTime(p.duration)}
          </p>
        </div>
        <button type="button" onClick={() => p.step(-1)} aria-label="Previous" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/80 hover:text-accent">
          <SkipBack size={18} weight="fill" />
        </button>
        <button
          type="button"
          onClick={() => p.toggle(p.track)}
          aria-label={p.playing ? "Pause" : "Play"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent active:scale-95"
        >
          {p.playing ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" className="translate-x-[1px]" />}
        </button>
        <button type="button" onClick={() => p.step(1)} aria-label="Next" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/80 hover:text-accent">
          <SkipForward size={18} weight="fill" />
        </button>
      </div>
    </div>
  );
}
