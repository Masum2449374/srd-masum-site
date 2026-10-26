import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause, Info, X, Article, SpotifyLogo, YoutubeLogo, Star, Shuffle, MusicNotes } from "@phosphor-icons/react";
import { usePlayer, formatTime } from "./MiniPlayer.jsx";
import { FXCover } from "./NowPlayingFX.jsx";
import { TrackList } from "./PlaylistSection.jsx";
import ShareButton from "./ShareButton.jsx";
import AdSlot from "./AdSlot.jsx";
import { ENGLISH_ORIGINALS, ENGLISH_TRACKS, ENGLISH_ALL } from "../data/english-songs.js";

const Bars = ({ on }) => (
  <span aria-hidden="true" className={`en-bars ${on ? "" : "en-bars-off"}`}><i /><i /><i /><i /></span>
);

function Cover({ t, className = "" }) {
  return (
    <picture>
      {t.coverWebp && <source srcSet={t.coverWebp} type="image/webp" />}
      <img src={t.cover || "/images/avatar.webp"} alt="" loading="lazy" draggable={false} className={className} />
    </picture>
  );
}

function SongCard({ t, list, onInfo, i }) {
  const player = usePlayer();
  const active = player?.track?.id === t.id;
  const playing = active && player.playing;
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: Math.min(i, 6) * 0.06, type: "spring", stiffness: 220, damping: 24 }}
      data-track-row={t.id} id={`song-${t.id}`}
      className={`en-card group relative scroll-mt-24 overflow-hidden rounded-2xl bg-raised ring-1 ${active ? "ring-accent/70 en-card-on" : "ring-hairline"} ${playing ? "beat-card" : ""} ${player?.highlight === t.id ? "ring-2 ring-accent" : ""}`}
    >
      <button type="button" onClick={() => player.toggle(t, list)} aria-label={playing ? `Pause ${t.title}` : `Play ${t.title}`} className="relative block aspect-square w-full overflow-hidden">
        <Cover t={t} className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${playing ? "scale-105" : ""}`} />
        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        {t.original && <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black"><Star size={10} weight="fill" />Original</span>}
        <span className={`absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent shadow-lg shadow-accent/40 transition-transform group-active:scale-90 ${playing ? "en-pulse" : ""}`}>
          {playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" className="translate-x-[1px]" />}
        </span>
        {active && <span className="absolute bottom-4 left-3"><Bars on={playing} /></span>}
      </button>
      <div className="p-3">
        <h3 className={`truncate text-[15px] font-semibold leading-tight ${active ? "text-accent" : "text-ink"}`}>{t.title}</h3>
        <p className="mt-0.5 truncate text-xs text-muted">{t.artist}</p>
        <div className="mt-2 flex items-center gap-1">
          <p className="flex-1 font-mono text-[10px] text-faint">{formatTime(active && player.duration ? player.duration : t.duration)}</p>
          <ShareButton track={t} />
          <button type="button" onClick={() => onInfo(t)} aria-label={`Credits for ${t.title}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted ring-1 ring-hairline hover:text-accent">
            <Info size={16} weight="bold" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function Credits({ t, onClose, onPlay }) {
  useEffect(() => {
    if (!t) return;
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [t, onClose]);
  return (
    <AnimatePresence>
      {t && (
        <motion.div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={`Credits: ${t.title}`} data-testid="en-credits"
            initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-sunk p-6 ring-1 ring-hairline sm:rounded-3xl">
            <div className="flex items-start gap-4">
              <Cover t={t} className="h-20 w-20 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Credits</p>
                <h3 className="mt-1 truncate font-display text-2xl text-ink">{t.title}</h3>
                <p className="text-sm text-muted">{t.original ? "Original by SRD Masum" : t.artist}</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close credits" className="flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-hairline text-muted"><X size={16} weight="bold" /></button>
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-faint">Artist</dt><dd className="text-right text-ink">{t.artist}</dd></div>
              {t.album && <div className="flex justify-between gap-4"><dt className="text-faint">Release</dt><dd className="text-right text-ink">{t.album}</dd></div>}
              {t.writers && <div className="flex justify-between gap-4"><dt className="text-faint">Writers</dt><dd className="text-right text-ink">{t.writers}</dd></div>}
              {t.producer && <div className="flex justify-between gap-4"><dt className="text-faint">Producer</dt><dd className="text-right text-ink">{t.producer}</dd></div>}
              {t.label && <div className="flex justify-between gap-4"><dt className="text-faint">Label</dt><dd className="text-right text-ink">{t.label}</dd></div>}
            </dl>
            {(t.lyrics || (!t.original && (t.spotifyUrl || t.youtubeUrl))) && (
              <div className="mt-5 grid grid-cols-2 gap-2">
                {t.lyrics && <button type="button" onClick={() => { onPlay(t); onClose(); }} className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-on-accent"><Article size={18} weight="bold" />Play with synced lyrics</button>}
                {!t.original && t.spotifyUrl && <a href={t.spotifyUrl} target="_blank" rel="noopener noreferrer" data-testid="en-spotify" className="sbtn sbtn-sp"><SpotifyLogo size={20} weight="fill" />Listen on Spotify</a>}
                {!t.original && t.youtubeUrl && <a href={t.youtubeUrl} target="_blank" rel="noopener noreferrer" data-testid="en-youtube" className="sbtn sbtn-yt"><YoutubeLogo size={20} weight="fill" />Watch on YouTube</a>}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function EnglishPage() {
  const player = usePlayer();
  const [info, setInfo] = useState(null);
  useEffect(() => { document.title = "Top English Hits — SRD Masum"; }, []);
  const enActive = player?.track && ENGLISH_ALL.some((x) => x.id === player.track.id);
  const now = enActive ? player.track : ENGLISH_ALL[0];
  const playing = enActive && player.playing;
  const playAll = (shuffle) => {
    const list = ENGLISH_TRACKS.length ? ENGLISH_TRACKS : ENGLISH_ORIGINALS;
    const t = shuffle ? list[Math.floor(Math.random() * list.length)] : list[0];
    if (enActive) player.toggle(player.track, null); else player.toggle(t, list);
  };
  return (
    <>
      <section id="top" className="en-hero relative overflow-hidden px-5 pb-12 pt-10 sm:px-8">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Cover t={now} className="h-full w-full scale-125 object-cover opacity-40 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/40 to-bg" />
          <div className="en-orb en-orb-a" /><div className="en-orb en-orb-b" />
        </div>
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center sm:flex-row sm:text-left">
          <div className="relative mb-8 mt-6 h-56 w-56 shrink-0 sm:m-10 sm:h-64 sm:w-64">
            <FXCover src={now.cover} playing={playing}>
              <img src={now.cover} alt="" draggable={false} className={`h-full w-full rounded-full object-cover shadow-2xl ring-4 ring-accent/50 transition-transform duration-500 ${playing ? "scale-100 en-spin" : "scale-95"}`} />
            </FXCover>
          </div>
          <div className="min-w-0">
            <p className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-accent sm:justify-start"><MusicNotes size={14} weight="fill" />Playlist · {ENGLISH_ALL.length} {ENGLISH_ALL.length === 1 ? "song" : "songs"}</p>
            <h1 className="en-title mt-3 font-display text-5xl leading-[0.95] tracking-display sm:text-7xl">Top English Hits</h1>
            <p className="mt-4 text-sm text-muted" data-testid="en-now">{playing ? "Now playing" : enActive ? "Paused" : "Up first"}: <span className="font-semibold text-ink">{now.title}</span> · {now.artist}</p>
            <div className="mt-6 flex justify-center gap-3 sm:justify-start">
              <button type="button" onClick={() => playAll(false)} data-testid="en-playall" className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-on-accent shadow-lg shadow-accent/30 active:scale-95">
                {playing ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}{playing ? "Pause" : enActive ? "Resume" : "Play all"}
              </button>
              {ENGLISH_ALL.length > 1 && <button type="button" onClick={() => playAll(true)} aria-label="Shuffle play" className="flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-hairline text-ink active:scale-95"><Shuffle size={18} weight="bold" /></button>}
            </div>
          </div>
        </div>
      </section>

      <AdSlot type="banner320" />

      {ENGLISH_ORIGINALS.length > 0 && (
        <section id="en-originals" className="px-5 py-10 sm:px-8">
          <div className="en-originals mx-auto max-w-6xl rounded-3xl p-5 ring-1 ring-amber-400/40 sm:p-8">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400"><Star size={14} weight="fill" />Exclusive</p>
            <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">SRD Masum Originals</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {ENGLISH_ORIGINALS.map((t, i) => <SongCard key={t.id} t={t} i={i} list={ENGLISH_ORIGINALS} onInfo={setInfo} />)}
            </div>
          </div>
        </section>
      )}

      <section id="en-hits" className="px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">Popular now</p>
          <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Popular English hits</h2>
          <p className="mt-2 text-sm text-muted">Tap a song to play. Songs play one after another.</p>
          <div className="mt-6"><TrackList tracks={ENGLISH_TRACKS} onInfo={setInfo} testid="en-list" /></div>
          <a href="/#music" data-testid="en-cta" className="en-cta mt-10">
            <img src="/images/avatar.webp" alt="" className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white/60" />
            <span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">SRD Masum Originals</span>
            <span className="mt-0.5 block text-lg font-bold text-white">Listen to my own songs →</span></span>
          </a>
        </div>
      </section>

      <AdSlot type="native" />
      <AdSlot type="banner300" />
      <Credits t={info} onClose={() => setInfo(null)} onPlay={(t) => player.toggle(t, t.original ? ENGLISH_ORIGINALS : ENGLISH_TRACKS)} />
    </>
  );
}
