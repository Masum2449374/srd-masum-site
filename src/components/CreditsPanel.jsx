import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Article, SpotifyLogo, YoutubeLogo } from "@phosphor-icons/react";

function Cover({ t, className = "" }) {
  return (
    <picture>
      {t.coverWebp && <source srcSet={t.coverWebp} type="image/webp" />}
      <img src={t.cover || t.art || "/images/avatar.webp"} alt="" loading="lazy" draggable={false} className={className} />
    </picture>
  );
}

export default function CreditsPanel({ t, onClose, onPlay }) {
  useEffect(() => {
    if (!t) return;
    const k = (e) => { if (e.key === "Escape") { e.stopImmediatePropagation(); onClose(); } };
    window.addEventListener("keydown", k, true);
    return () => window.removeEventListener("keydown", k, true);
  }, [t, onClose]);
  const orig = t && (t.original || !t.artist || t.artist === "SRD Masum");
  return (
    <AnimatePresence>
      {t && (
        <motion.div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={`Credits: ${t.title}`} data-testid="en-credits"
            initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-sunk p-6 ring-1 ring-hairline sm:rounded-3xl">
            <div className="flex items-start gap-4">
              <Cover t={t} className="h-20 w-20 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Credits</p>
                <h3 className="mt-1 truncate font-display text-2xl text-ink">{t.title}</h3>
                <p className="text-sm text-muted">{orig ? "Original by SRD Masum" : t.artist}</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close credits" className="flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-hairline text-muted"><X size={16} weight="bold" /></button>
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-faint">Artist</dt><dd className="text-right text-ink">{t.artist || "SRD Masum"}</dd></div>
              {t.album && <div className="flex justify-between gap-4"><dt className="text-faint">Release</dt><dd className="text-right text-ink">{t.album}</dd></div>}
              {t.writers && <div className="flex justify-between gap-4"><dt className="text-faint">Writers</dt><dd className="text-right text-ink">{t.writers}</dd></div>}
              {t.producer && <div className="flex justify-between gap-4"><dt className="text-faint">Producer</dt><dd className="text-right text-ink">{t.producer}</dd></div>}
              {t.released && <div className="flex justify-between gap-4"><dt className="text-faint">Released</dt><dd className="text-right text-ink">{new Date(t.released + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</dd></div>}
              {t.label && <div className="flex justify-between gap-4"><dt className="text-faint">Label</dt><dd className="text-right text-ink">{t.label}</dd></div>}
            </dl>
            {((t.lyrics && onPlay) || t.spotifyUrl || t.youtubeUrl) && (
              <div className="mt-5 grid grid-cols-2 gap-2">
                {t.lyrics && onPlay && <button type="button" onClick={() => { onPlay(t); onClose(); }} className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-on-accent"><Article size={18} weight="bold" />Play with synced lyrics</button>}
                {t.spotifyUrl && <a href={t.spotifyUrl} target="_blank" rel="noopener noreferrer" data-testid="en-spotify" className="sbtn sbtn-sp"><SpotifyLogo size={20} weight="fill" />Listen on Spotify</a>}
                {t.youtubeUrl && <a href={t.youtubeUrl} target="_blank" rel="noopener noreferrer" data-testid="en-youtube" className="sbtn sbtn-yt"><YoutubeLogo size={20} weight="fill" />Watch on YouTube</a>}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

