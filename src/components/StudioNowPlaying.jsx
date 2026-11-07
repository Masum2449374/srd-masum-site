import ArtistCredit from "./ArtistCredit.jsx";
import LyricsPanel from "./LyricsPanel.jsx";
import { FXBackground as ClassicLyricsBackground } from "./ProductionLyricsFX.jsx";
import { useEffect, useRef, useState } from "react";
import { motion, useDragControls, useReducedMotion } from "framer-motion";
import {
  CaretDown,
  CaretRight,
  Play,
  Pause,
  Shuffle,
  SkipBack,
  SkipForward,
  Repeat,
  RepeatOnce,
  Article,
  ListNumbers,
  Waveform,
  Info,
  Disc,
} from "@phosphor-icons/react";
import { useDialogFocus } from "../lib/useDialogFocus.js";
import { artistHref } from "../lib/artists.js";
import { navigate } from "../lib/nav.js";
import { formatTime, useIsDesktop } from "./MiniPlayer.jsx";
import { FXBackground, FXCover } from "./NowPlayingFX.jsx";
import CreditsPanel from "./CreditsPanel.jsx";
import ShareButton from "./ShareButton.jsx";

// Presentation only. The shared audio element, queue semantics and listening counters
// stay owned by PlayerProvider. Tabs never load audio or create another player.
export default function StudioNowPlaying({ player, scrub, onClose, onArtist }) {
  const t = player.track;
  const shown = scrub ?? player.current;
  const max = player.duration || 0;
  const pct = max ? Math.min(100, (shown / max) * 100) : 0;
  const art = t.art || t.cover || "/images/avatar.webp";
  const desktop = useIsDesktop(),
    reduce = useReducedMotion();
  const hasLyrics = Boolean(t.lyrics);
  const [view, setView] = useState(() =>
    desktop && hasLyrics ? "lyrics" : "cover",
  );
  const [info, setInfo] = useState(null);
  const ref = useRef(null),
    drag = useDragControls();
  useDialogFocus(ref);
  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  useEffect(() => {
    if (!hasLyrics && view === "lyrics") setView("cover");
  }, [hasLyrics, view]);
  const queue = player.queue || [];
  const index = queue.findIndex((item) => item.id === t.id);
  const tab = (id, label, Icon) => (
    <button
      type="button"
      key={id}
      role="tab"
      id={`player-tab-${id}`}
      aria-selected={view === id}
      tabIndex={view === id ? 0 : -1}
      aria-controls="player-tab-panel"
      onClick={() => setView(id)}
      className={view === id ? "is-selected" : ""}
    >
      <Icon size={17} aria-hidden="true" />
      <span>{label}</span>
      {id === "lyrics" && hasLyrics && <i aria-hidden="true" />}
    </button>
  );
  const cover = (
    <div className="studio-cover-view" data-testid="np-artwork-view">
      <div className="studio-artwork-frame">
        <FXCover src={art} playing={player.playing}>
          <img
            src={art}
            alt={`${t.title} cover artwork`}
            width="512"
            height="512"
            draggable={false}
          />
        </FXCover>
      </div>

    </div>
  );
  const secondary =
    view === "lyrics" && hasLyrics ? (
      <div className="studio-classic-lyrics-view">
        <LyricsPanel track={t} current={shown} duration={max} onSeek={player.seekTo} playing={player.playing} />
      </div>
    ) : view === "queue" ? (
      <div className="studio-queue-view" data-testid="np-queue">
        <div className="studio-interior-section-heading">
          <div>
            <span className="studio-kicker">Keep the feeling going</span>
            <h2>Your listening queue</h2>
          </div>
          <span className="studio-interior-badge">{queue.length} tracks</span>
        </div>
        <p className="studio-queue-note">
          {player.shuffle
            ? "Shuffle is on. The next track may vary."
            : "Your current collection, in playing order."}
        </p>
        <ol className="studio-queue-list">
          {queue.map((item, i) => (
            <li key={item.id} className={item.id === t.id ? "is-current" : ""}>
              <button
                type="button"
                onClick={() => player.toggle(item, queue)}
                aria-label={`${item.id === t.id && player.playing ? "Pause" : "Play"} ${item.title}`}
              >
                <span className="studio-queue-index">
                  {item.id === t.id ? (
                    <Waveform size={16} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <img
                  src={item.thumb || item.cover || "/images/avatar.webp"}
                  alt=""
                  width="44"
                  height="44"
                  loading="lazy"
                />
                <span className="studio-queue-track">
                  <strong>{item.title}</strong>
                  <small><ArtistCredit track={item} /></small>
                </span>
                <span className="studio-queue-duration">
                  {formatTime(item.duration)}
                </span>
                {item.id === t.id && (
                  <span className="studio-queue-current">Current</span>
                )}
              </button>
            </li>
          ))}
        </ol>
        {!queue.length && (
          <p className="studio-queue-note">
            Choose a collection to start your queue.
          </p>
        )}
      </div>
    ) : null;
  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Now Playing"
      data-testid="nowplaying"
      data-view={view}
      className={`studio-now-playing studio-player-v2 ${desktop && secondary ? "has-side-panel" : ""} ${view === "lyrics" ? "is-lyrics-focused" : ""}`}
      initial={reduce ? { opacity: 0 } : { y: "100%" }}
      animate={reduce ? { opacity: 1 } : { y: 0 }}
      exit={reduce ? { opacity: 0 } : { y: "100%" }}
      transition={
        reduce
          ? { duration: 0.15 }
          : { type: "spring", damping: 34, stiffness: 300 }
      }
      drag="y"
      dragControls={drag}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.5 }}
      onDragEnd={(_, details) => {
        if (details.offset.y > 120 || details.velocity.y > 600) onClose();
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`${view === "lyrics" ? "studio-classic-lyrics-atmosphere production-lyrics-scope" : "studio-player-atmosphere"} ${player.playing ? "" : "np-paused"}`}
      >
        {view === "lyrics" ? <ClassicLyricsBackground src={art} /> : <FXBackground src={art} />}
      </div>
      <div
        className="studio-player-grip"
        aria-hidden="true"
        onPointerDown={(e) => drag.start(e)}
      >
        <span />
      </div>
      <header className="studio-player-header">
        <button
          type="button"
          onClick={onClose}
          aria-label="Minimize player"
          data-testid="np-close"
          className="studio-player-icon"
        >
          <CaretDown size={23} weight="bold" />
        </button>
        <div>
          <p>THE MUSIC SPACE</p>
          <span>
            <i />
            Now playing
          </span>
        </div>
        <ShareButton track={t} placement="below" />
      </header>
      <div className="studio-player-layout">
        <div className="studio-player-session">
          <div
            className="studio-player-stage"
            id={desktop && secondary ? undefined : "player-tab-panel"}
            role={desktop && secondary ? undefined : "tabpanel"}
            aria-labelledby={
              desktop && secondary ? undefined : `player-tab-${view}`
            }
          >
            {desktop || !secondary ? cover : secondary}
          </div>
          <div className="studio-player-console" data-testid="np-console">
            <div className="studio-player-track-heading">
              <div>
                <p className="studio-player-release">
                  {t.album || t.label || "Single · SRD Masum music space"}
                </p>
                <h1 data-testid="np-title" title={t.title}>
                  {t.title}
                </h1>
                <a
                  href={artistHref(t)}
                  data-testid="np-artist"
                  onClick={(e) => {
                    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey)
                      return;
                    e.preventDefault();
                    onArtist
                      ? onArtist(artistHref(t))
                      : navigate(artistHref(t));
                  }}
                  className="studio-player-artist"
                >
                  <ArtistCredit track={t} size={13} />
                  <CaretRight size={12} />
                </a>
              </div>
              <button
                type="button"
                onClick={() => setInfo(t)}
                aria-label={`Song information for ${t.title}`}
                data-testid="np-info"
                className="studio-player-icon"
              >
                <Info size={21} />
              </button>
            </div>
            <div className="studio-player-timeline">
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
                aria-label={`Seek ${t.title}`}
                data-testid="np-seek"
                style={{ "--progress": `${pct}%` }}
              />
              <div>
                <span data-testid="np-elapsed">{formatTime(shown)}</span>
                <span>{formatTime(max)}</span>
              </div>
            </div>
            <div className="studio-player-controls">
              <button
                type="button"
                onClick={player.toggleShuffle}
                aria-label="Shuffle"
                aria-pressed={player.shuffle}
                className={`studio-player-icon ${player.shuffle ? "is-enabled" : ""}`}
              >
                <Shuffle size={21} weight="bold" />
              </button>
              <button
                type="button"
                onClick={player.previous}
                aria-label="Previous"
                className="studio-player-icon studio-player-skip"
              >
                <SkipBack size={28} weight="fill" />
              </button>
              <button
                type="button"
                onClick={() => player.toggle(t)}
                aria-label={player.playing ? "Pause" : "Play"}
                data-testid="np-play"
                className="studio-player-primary"
              >
                {player.playing ? (
                  <Pause size={31} weight="fill" />
                ) : (
                  <Play size={31} weight="fill" />
                )}
              </button>
              <button
                type="button"
                onClick={() => player.step(1, true)}
                aria-label="Next"
                data-testid="np-next"
                className="studio-player-icon studio-player-skip"
              >
                <SkipForward size={28} weight="fill" />
              </button>
              <button
                type="button"
                onClick={player.cycleRepeat}
                aria-label={`Repeat: ${player.repeat}`}
                aria-pressed={player.repeat !== "off"}
                className={`studio-player-icon ${player.repeat !== "off" ? "is-enabled" : ""}`}
              >
                {player.repeat === "one" ? (
                  <RepeatOnce size={21} weight="bold" />
                ) : (
                  <Repeat size={21} weight="bold" />
                )}
              </button>
            </div>
          </div>
          <div className="studio-player-bottom" data-testid="np-footer">
            <div
              className="studio-player-tabs"
              role="tablist"
              aria-label="Player views"
              onKeyDown={(e) => {
                if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key))
                  return;
                e.preventDefault();
                const tabs = [
                  "cover",
                  ...(hasLyrics ? ["lyrics"] : []),
                  "queue",
                ];
                const i = tabs.indexOf(view);
                const next =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? tabs.length - 1
                      : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) %
                        tabs.length;
                setView(tabs[next]);
                document.getElementById(`player-tab-${tabs[next]}`)?.focus();
              }}
            >
              {tab("cover", "Listening", Disc)}
              {hasLyrics && tab("lyrics", "Lyrics", Article)}
              {tab("queue", "Queue", ListNumbers)}
            </div>
            <p className="studio-player-position">
              {index >= 0
                ? `${String(index + 1).padStart(2, "0")} / ${String(queue.length).padStart(2, "0")}`
                : "SRD MASUM"}
              <span>YOUR SOUNDTRACK</span>
            </p>
          </div>
        </div>
        {desktop && secondary && (
          <aside
            className="studio-player-side"
            id="player-tab-panel"
            role="tabpanel"
            aria-labelledby={`player-tab-${view}`}
          >
            {secondary}
          </aside>
        )}
      </div>
      <CreditsPanel t={info} onClose={() => setInfo(null)} />
    </motion.div>
  );
}
