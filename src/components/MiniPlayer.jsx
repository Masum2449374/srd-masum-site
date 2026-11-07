import StudioNowPlaying from "./StudioNowPlaying.jsx";
import { bumpLocal } from "../lib/plays.js";
import { artistHref, isVerified } from "../lib/artists.js";
import { gaEvent } from "../lib/ga.js";
import VerifiedBadge from "./VerifiedBadge.jsx";
import { navigate, spaClick } from "../lib/nav.js";
import { CaretRight as ArtistCaret } from "@phosphor-icons/react";
import { register as exRegister, claim as exClaim } from "../lib/exclusive.js";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Disc, SkipBack, SkipForward, Shuffle, Repeat, RepeatOnce, CaretUp, SpeakerHigh, SpeakerLow, SpeakerX } from "@phosphor-icons/react";

// True on desktop-width screens (>=1024px). Mobile layout is untouched below that.
export function useIsDesktop() {
  const q = "(min-width: 1024px)";
  const [on, setOn] = useState(() => typeof window !== "undefined" && window.matchMedia?.(q).matches);
  useEffect(() => { const m = window.matchMedia(q); const f = () => setOn(m.matches); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);
  return on;
}
import { AnimatePresence } from "framer-motion";
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
import { songFromUrl } from "../lib/share.js";
import { beatPlay, beatStop } from "../lib/beat.js";
import {
  setMediaSessionMetadata,
  setMediaSessionHandlers,
  setMediaSessionState,
  setMediaSessionPosition,
} from "../lib/mediasession.js";

// One <audio> element for the whole site. Rows never own audio, so only one track can ever play.
// preload="none": nothing is fetched until a track is played; durations come from the data lists, so
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
  const listenRef = useRef({ id: null, secs: 0, last: 0, sent: false });
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
  const [volume, setVolumeState] = useState(() => { const v = Number(localStorage.getItem("srd-volume")); return Number.isFinite(v) && v > 0 && v <= 1 ? v : 1; });
  const [muted, setMuted] = useState(false);
  useEffect(() => { const a = audioRef.current; if (a) { a.volume = volume; a.muted = muted; } try { localStorage.setItem("srd-volume", String(volume)); } catch {} }, [volume, muted]);
  const setVolume = useCallback((v) => { setVolumeState(v); if (v > 0) setMuted(false); }, []);
  const toggleMute = useCallback(() => setMuted((m) => !m), []);
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
    listenRef.current.id = null;
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
    // Play counter: each playback session counts once after 3s of actual playback. A new session starts on
    // a new song, on end/loop (onEnded resets), or when playback jumps back to the start (replay/reselect).
    // Pause/resume inside a session never counts again. Repeat listens by the same person all count.
    const el = e.currentTarget, id = trackRef.current?.id, L = listenRef.current;
    if (id && !String(id).startsWith("u")) {
      if (L.id !== id || (el.currentTime < 1 && L.last > 3)) Object.assign(L, { id, secs: 0, last: el.currentTime, sent: false });
      const d = el.currentTime - L.last; L.last = el.currentTime;
      if (!el.paused && d > 0 && d < 1.5) L.secs += d;
      if (!L.sent && L.secs >= 3) {
        L.sent = true;
        { const t = trackRef.current; gaEvent("song_play", { song_id: String(id).toLowerCase(), song_title: t?.title || "", song_artist: t?.artist || "" }); }
        try {
          if (!navigator.webdriver) {
            const sid = String(id).toLowerCase();
            fetch("/api/plays/" + encodeURIComponent(sid), { method: "POST", keepalive: true }).then((r) => r.json()).then((j) => { if (j?.counted) bumpLocal(sid); }).catch(() => {});
          }
        } catch {}
      }
    }
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
    () => ({ track, playing, toggle, step, previous, queue: queueRef.current, current, duration, onScrub, endScrub, seekTo, highlight, shuffle, repeat, toggleShuffle, cycleRepeat, volume, muted, setVolume, toggleMute }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [track, playing, toggle, step, previous, current, duration, scrub, highlight, shuffle, repeat, volume, muted]
  );

  useEffect(() => exRegister("site", () => { const a = audioRef.current; if (a && !a.paused) a.pause(); }), []);
  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="none"
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
      className="srd-mini-player fixed inset-x-0 bottom-0 z-50 cursor-pointer border-t border-hairline bg-sunk px-3 pb-[env(safe-area-inset-bottom)] pt-2"
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
        className="seek w-full lg:hidden"
        style={{ background: `linear-gradient(to right, var(--studio-accent) ${pct}%, #2c2a27 ${pct}%)` }}
      />
      <DeskBar player={player} shown={shown} max={max} pct={pct} onExpand={() => setOpen(true)} />
      <div className="mx-auto flex max-w-6xl items-center gap-3 py-2 lg:hidden">
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
        <button type="button" onClick={() => setOpen(true)} aria-label="Open Now Playing" className="studio-mini-expand"><CaretUp size={18} weight="bold" /></button>
      </div>
      <AnimatePresence>{open ? <NowPlaying player={player} scrub={scrub} onClose={close} onArtist={(href) => { const np = !!history.state?.srdNowPlaying; setOpen(false); navigate(href, { replace: np }); }} /> : null}</AnimatePresence>
    </div>
  );
}

// Desktop (>=1024px) bottom bar: song info left, controls + progress centre, volume + expand right.
function DeskBar({ player, shown, max, pct, onExpand }) {
  const t = player.track;
  const vol = player.muted ? 0 : player.volume;
  const VolIcon = vol === 0 ? SpeakerX : vol < 0.5 ? SpeakerLow : SpeakerHigh;
  const btn = "flex shrink-0 items-center justify-center rounded-full transition-colors";
  return (
    <div className="mx-auto hidden h-[72px] max-w-[1400px] grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] items-center gap-6 px-3 lg:grid">
      <div className="flex min-w-0 items-center gap-3">
        <img src={t.thumb || t.coverSm || t.cover || "/images/avatar.webp"} alt="" aria-hidden="true" className="h-14 w-14 shrink-0 rounded-lg object-cover shadow-lg" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{t.title}</p>
          <a href={artistHref(t)} onClick={(e) => { e.stopPropagation(); spaClick(e); }} className="srd-artist-link flex min-w-0 items-center gap-1 text-xs"><span className="truncate">{t.artist || "SRD Masum"}</span>{isVerified(t) && <VerifiedBadge size={12} />}</a>
        </div>
      </div>
      <div className="flex min-w-0 flex-col items-center gap-1">
        <div className="flex items-center gap-4">
          <button type="button" onClick={player.toggleShuffle} aria-label="Shuffle" aria-pressed={player.shuffle} className={`${btn} h-8 w-8 ${player.shuffle ? "text-accent" : "text-ink/55 hover:text-ink"}`}><Shuffle size={17} weight="bold" /></button>
          <button type="button" onClick={player.previous} aria-label="Previous" className={`${btn} h-9 w-9 text-ink/80 hover:text-accent`}><SkipBack size={20} weight="fill" /></button>
          <button type="button" onClick={() => player.toggle(t)} aria-label={player.playing ? "Pause" : "Play"} className={`${btn} h-10 w-10 bg-accent text-on-accent hover:scale-105 active:scale-95`}>
            {player.playing ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" className="translate-x-[1px]" />}
          </button>
          <button type="button" onClick={() => player.step(1, true)} aria-label="Next" className={`${btn} h-9 w-9 text-ink/80 hover:text-accent`}><SkipForward size={20} weight="fill" /></button>
          <button type="button" onClick={player.cycleRepeat} aria-label={`Repeat: ${player.repeat}`} className={`${btn} h-8 w-8 ${player.repeat !== "off" ? "text-accent" : "text-ink/55 hover:text-ink"}`}>
            {player.repeat === "one" ? <RepeatOnce size={17} weight="bold" /> : <Repeat size={17} weight="bold" />}
          </button>
        </div>
        <div className="flex w-full items-center gap-3 font-mono text-[11px] tabular-nums text-muted">
          <span className="w-10 text-right">{formatTime(shown)}</span>
          <input type="range" min={0} max={max} step={0.1} value={shown}
            onChange={(e) => player.onScrub(Number(e.target.value))} onPointerUp={player.endScrub} onKeyUp={player.endScrub} onBlur={player.endScrub}
            aria-label={`Seek ${t.title}`} className="seek flex-1"
            style={{ background: `linear-gradient(to right, var(--studio-accent) ${pct}%, rgb(var(--hairline)) ${pct}%)` }} />
          <span className="w-10">{formatTime(max)}</span>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={player.toggleMute} aria-label={player.muted ? "Unmute" : "Mute"} aria-pressed={player.muted} className={`${btn} h-8 w-8 text-ink/70 hover:text-ink`}><VolIcon size={19} weight="fill" /></button>
        <input type="range" min={0} max={1} step={0.01} value={vol} onChange={(e) => player.setVolume(Number(e.target.value))} aria-label="Volume"
          className="seek w-28" style={{ background: `linear-gradient(to right, var(--studio-accent) ${vol * 100}%, rgb(var(--hairline)) ${vol * 100}%)` }} />
        <button type="button" onClick={onExpand} aria-label="Open Now Playing" className={`${btn} h-9 w-9 text-ink/70 ring-1 ring-hairline hover:text-accent`}><CaretUp size={18} weight="bold" /></button>
      </div>
    </div>
  );
}

function NowPlaying(props) {
  return <StudioNowPlaying {...props} />;
}
