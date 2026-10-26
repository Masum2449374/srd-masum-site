import { register as exRegister, claim as exClaim } from "../lib/exclusive.js";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Info, Play, Pause, Disc, SkipBack, SkipForward, Shuffle, Repeat, RepeatOnce, CaretDown } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { FXBackground, FXCover } from "./NowPlayingFX.jsx";
import { AUDIO_TRACKS } from "../data/songs.js";
import { BANGLA_TRACKS } from "../data/bangla-songs.js";

const ALL_TRACKS = [...AUDIO_TRACKS, ...BANGLA_TRACKS];
// Queue = the tapped list first, then every other song, so playback continues across sections.
const fullQueue = (list) => {
  const l = list && list.length ? list : ALL_TRACKS;
  if (l[0]?.playlist) return [...l]; // self-contained playlists (e.g. English page) never spill into other sections
  return [...l, ...ALL_TRACKS.filter((t) => !l.some((x) => x.id === t.id))];
};
const readPref = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const writePref = (k, v) => { try { localStorage.setItem(k, String(v)); } catch { /* ignore */ } };
import ShareButton from "./ShareButton.jsx";
import LyricsPanel from "./LyricsPanel.jsx";
import CreditsPanel from "./CreditsPanel.jsx";
import { songFromUrl } from "../lib/share.js";
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
export const usePlayer = () => useContext(PlayerContext);

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
  const [shuffle, setShuffle] = useState(() => readPref("srd-shuffle", "0") === "1");
  const [repeat, setRepeat] = useState(() => readPref("srd-repeat", "off")); // off | all | one
  const shuffleRef = useRef(shuffle);
  const repeatRef = useRef(repeat);
  const historyRef = useRef([]); // played ids, for "previous" while shuffling
  useEffect(() => { shuffleRef.current = shuffle; writePref("srd-shuffle", shuffle ? "1" : "0"); }, [shuffle]);
  useEffect(() => { repeatRef.current = repeat; writePref("srd-repeat", repeat); }, [repeat]);
  const toggleShuffle = useCallback(() => setShuffle((v) => !v), []);
  const cycleRepeat = useCallback(() => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")), []);

  useEffect(() => () => clearTimeout(scrubTimer.current), []);

  const load = useCallback((t, list, autoplay = true) => {
    const a = audioRef.current;
    if (!a) return;
    if (list || !queueRef.current.length) queueRef.current = fullQueue(list);
    if (trackRef.current && trackRef.current.id !== t.id) historyRef.current = [...historyRef.current.slice(-50), trackRef.current.id];
    trackRef.current = t;
    setTrack(t);
    setCurrent(0);
    setDuration(t.duration || 0);
    setMediaSessionMetadata(t);
    a.src = t.src;
    a.load();
    if (autoplay) a.play().catch(() => {});
  }, []);

  // Shared link (/song/<id>/, ?song=<id> or #song-<id>): cue that track, scroll to it and
  // highlight it. Browsers block autoplay, so one tap on play starts it.
  const [highlight, setHighlight] = useState(null);
  const cue = useCallback((t, list) => load(t, list, false), [load]);
  useEffect(() => {
    const hit = songFromUrl();
    if (!hit) return;
    cue(hit.track, hit.list);
    setHighlight(hit.track.id);
    const id = setTimeout(() => {
      document.querySelector(`[data-track-row="${hit.track.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 600);
    const off = setTimeout(() => setHighlight(null), 6000);
    return () => { clearTimeout(id); clearTimeout(off); };
  }, [cue]);

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
      if (shuffleRef.current && q.length > 1) {
        if (dir < 0) {
          const prevId = historyRef.current.pop();
          const prev = prevId && q.find((x) => x.id === prevId);
          if (prev) { const h = historyRef.current; load(prev, null); historyRef.current = h; return true; }
        } else {
          const others = q.filter((x) => x.id !== t.id);
          load(others[Math.floor(Math.random() * others.length)], null);
          return true;
        }
      }
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
    // Repeat one: replay. Otherwise auto-advance; at the end of the queue wrap only on repeat-all.
    if (repeatRef.current === "one") {
      e.currentTarget.currentTime = 0;
      e.currentTarget.play().catch(() => {});
      return;
    }
    if (!step(1, repeatRef.current === "all")) {
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

  const seekTo = useCallback((t) => {
    const a = audioRef.current;
    if (!a || !Number.isFinite(t)) return;
    a.currentTime = Math.max(0, t);
    setCurrent(a.currentTime);
    if (a.paused) a.play().catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ track, playing, toggle, step, previous, current, duration, onScrub, endScrub, seekTo, highlight, shuffle, repeat, toggleShuffle, cycleRepeat }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [track, playing, toggle, step, previous, current, duration, scrub, highlight, shuffle, repeat]
  );

  useEffect(() => exRegister("site", () => { const a = audioRef.current; if (a && !a.paused) a.pause(); }), []);
  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="auto"
        crossOrigin="anonymous"
        className="hidden"
        onPlay={(e) => { exClaim("site"); onPlay(e); }}
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

export function TrackRow({ track, list, alias = false, fallbackArt }) {
  const player = usePlayer();
  const isActive = player?.track?.id === track.id;
  const isPlaying = isActive && player.playing;
  const shownDuration = isActive && player.duration ? player.duration : track.duration;

  return (
    <div
      data-track-row={alias ? undefined : track.id}
      id={alias ? undefined : `song-${track.id}`}
      className={`flex h-[60px] scroll-mt-24 items-center gap-3 rounded-xl px-2 transition-colors ${
        isActive ? "bg-raised ring-1 ring-accent/40" : "hover:bg-raised/60"
      } ${isPlaying ? "beat-glow beat-card" : ""} ${player?.highlight === track.id ? "ring-2 ring-accent" : ""}`}
    >
      {(track).cover || fallbackArt ? (
          <img src={(track).thumb || (track).cover || fallbackArt} alt="" aria-hidden="true" width="40" height="40" loading="lazy" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
        ) : (
        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent via-[#0a3d91] to-accent-deep"
        >
          <Disc size={18} weight="duotone" className="text-ink/80" />
        </div>
        )}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[15px] font-semibold leading-tight ${isActive ? "text-accent" : "text-ink"}`}>
          {track.title}
        </p>
      </div>
      <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
        {shownDuration ? formatTime(shownDuration) : ""}
      </span>
      <ShareButton track={track} />
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
// Tapping the bar (not a button or the seek bar) opens the full-screen Now Playing view.
function MiniBar({ player, scrub }) {
  const [open, setOpen] = useState(false);
  // Android back closes the view: opening pushes a history entry, popstate closes it.
  useEffect(() => {
    if (!open) return;
    history.pushState({ srdNowPlaying: 1 }, "");
    const onPop = () => setOpen(false);
    window.addEventListener("popstate", onPop);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("popstate", onPop); document.body.style.overflow = prev; };
  }, [open]);
  const close = useCallback(() => {
    if (history.state?.srdNowPlaying) history.back(); // popstate -> setOpen(false)
    else setOpen(false);
  }, []);
  if (!player.track) return null;
  const shown = scrub ?? player.current;
  const max = player.duration || 0;
  const pct = max ? Math.min(100, (shown / max) * 100) : 0;
  return (
    <div
      role="region"
      aria-label="Now playing"
      data-testid="minibar"
      onClick={(e) => { if (!e.target.closest("button,input,a")) setOpen(true); }}
      className="fixed inset-x-0 bottom-0 z-50 cursor-pointer border-t border-hairline bg-sunk px-3 pb-[env(safe-area-inset-bottom)] pt-2"
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
        style={{ background: `linear-gradient(to right, #0b6cf0 ${pct}%, #2c2a27 ${pct}%)` }}
      />
      <div className="mx-auto flex max-w-6xl items-center gap-3 py-2">
        {(player.track).cover ? (
          <img src={(player.track).thumb || (player.track).cover} alt="" aria-hidden="true" width="40" height="40" loading="lazy" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
        ) : (
        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent via-[#0a3d91] to-accent-deep"
        >
          <Disc size={18} weight="duotone" className="text-ink/80" />
        </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{player.track.title}</p>
          <p className="font-mono text-[11px] tabular-nums text-muted">
            {formatTime(shown)} / {formatTime(max)}
          </p>
        </div>
        <button
          type="button"
          onClick={player.toggleShuffle}
          aria-label="Shuffle"
          aria-pressed={player.shuffle}
          data-testid="shuffle"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${player.shuffle ? "text-accent" : "text-ink/50"}`}
        >
          <Shuffle size={16} weight="bold" />
        </button>
        <button
          type="button"
          onClick={player.previous}
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
        <button
          type="button"
          onClick={player.cycleRepeat}
          aria-label={`Repeat: ${player.repeat}`}
          data-testid="repeat"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${player.repeat !== "off" ? "text-accent" : "text-ink/50"}`}
        >
          {player.repeat === "one" ? <RepeatOnce size={16} weight="bold" /> : <Repeat size={16} weight="bold" />}
        </button>
      </div>
      <AnimatePresence>{open ? <NowPlaying player={player} scrub={scrub} onClose={close} /> : null}</AnimatePresence>
    </div>
  );
}

function NowPlaying({ player, scrub, onClose }) {
  const shown = scrub ?? player.current;
  const max = player.duration || 0;
  const pct = max ? Math.min(100, (shown / max) * 100) : 0;
  const t = player.track;
  const art = t.art || t.cover || "/images/avatar.webp";
  const ctl = "flex shrink-0 items-center justify-center rounded-full";
  const hasLyrics = Boolean(t.lyrics);
  const [showLyrics, setShowLyrics] = useState(false);
  const lyricsOn = hasLyrics && showLyrics;
  const [info, setInfo] = useState(null);
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Now Playing"
      data-testid="nowplaying"
      onClick={(e) => e.stopPropagation()}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 32, stiffness: 300 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.6 }}
      dragListener={true}
      onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose(); }}
      className="fixed inset-0 z-[60] flex cursor-default overflow-hidden flex-col bg-canvas text-ink"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className={player.playing ? "" : "np-paused"}><FXBackground src={art} /></div>
      <div className="relative flex items-center justify-between px-4 pt-3">
        <button type="button" onClick={onClose} aria-label="Close" data-testid="np-close" className={`${ctl} h-11 w-11 text-ink/80 hover:text-accent`}>
          <CaretDown size={26} weight="bold" />
        </button>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">Now Playing</p>
        <ShareButton track={t} />
      </div>
      <div className={`relative mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-6 ${lyricsOn ? "pt-2" : "justify-center"}`}>
        {lyricsOn ? (
          <LyricsPanel track={t} current={shown} duration={max} onSeek={player.seekTo} />
        ) : (
          <FXCover src={art} playing={player.playing}>
            <img src={art} alt="" draggable={false}
              className={`h-full w-full rounded-full object-cover shadow-2xl ring-4 ring-accent/40 transition-transform duration-500 ${player.playing ? "scale-100" : "scale-95"}`} />
          </FXCover>
        )}
        <div className={`${lyricsOn ? "mt-4" : "mt-8"} flex items-end justify-between gap-3`}>
          <div className="min-w-0 flex-1">
            <p className="truncate text-2xl font-bold text-ink">{t.title}</p>
            <p className="mt-1 text-sm text-muted">{t.artist || "SRD Masum"}</p>
          </div>
          {hasLyrics ? (
            <button type="button" onClick={() => setShowLyrics((v) => !v)} aria-pressed={lyricsOn} data-testid="np-lyrics"
              onPointerDownCapture={(e) => e.stopPropagation()}
              className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${lyricsOn ? "border-accent bg-accent text-on-accent" : "border-hairline text-ink/80 hover:text-accent"}`}>
              Lyrics
            </button>
          ) : null}
          <button type="button" onClick={() => setInfo(t)} aria-label={`Credits for ${t.title}`} data-testid="np-info"
            onPointerDownCapture={(e) => e.stopPropagation()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/80 ring-1 ring-hairline hover:text-accent">
            <Info size={18} weight="bold" />
          </button>
        </div>
        <div className="mt-6" onPointerDownCapture={(e) => e.stopPropagation()}>
          <input
            type="range" min={0} max={max} step={0.1} value={shown}
            onChange={(e) => player.onScrub(Number(e.target.value))}
            onPointerUp={player.endScrub} onTouchEnd={player.endScrub} onKeyUp={player.endScrub} onBlur={player.endScrub}
            aria-label={`Seek ${t.title}`} data-testid="np-seek"
            className="seek w-full"
            style={{ background: `linear-gradient(to right, #0b6cf0 ${pct}%, rgb(var(--hairline)) ${pct}%)` }}
          />
          <div className="mt-1 flex justify-between font-mono text-xs tabular-nums text-muted">
            <span data-testid="np-elapsed">{formatTime(shown)}</span><span>{formatTime(max)}</span>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button type="button" onClick={player.toggleShuffle} aria-label="Shuffle" aria-pressed={player.shuffle}
            className={`${ctl} h-11 w-11 ${player.shuffle ? "text-accent" : "text-ink/50"}`}><Shuffle size={22} weight="bold" /></button>
          <button type="button" onClick={player.previous} aria-label="Previous" className={`${ctl} h-14 w-14 text-ink`}><SkipBack size={30} weight="fill" /></button>
          <button type="button" onClick={() => player.toggle(t)} aria-label={player.playing ? "Pause" : "Play"} data-testid="np-play"
            className={`${ctl} h-20 w-20 bg-accent text-on-accent shadow-lg active:scale-95`}>
            {player.playing ? <Pause size={34} weight="fill" /> : <Play size={34} weight="fill" className="translate-x-[2px]" />}
          </button>
          <button type="button" onClick={() => player.step(1, true)} aria-label="Next" data-testid="np-next" className={`${ctl} h-14 w-14 text-ink`}><SkipForward size={30} weight="fill" /></button>
          <button type="button" onClick={player.cycleRepeat} aria-label={`Repeat: ${player.repeat}`}
            className={`${ctl} h-11 w-11 ${player.repeat !== "off" ? "text-accent" : "text-ink/50"}`}>
            {player.repeat === "one" ? <RepeatOnce size={22} weight="bold" /> : <Repeat size={22} weight="bold" />}
          </button>
        </div>
      </div>
      <div onPointerDownCapture={(e) => e.stopPropagation()}><CreditsPanel t={info} onClose={() => setInfo(null)} /></div>
    </motion.div>
  );
}
