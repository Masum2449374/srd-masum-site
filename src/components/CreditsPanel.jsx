import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  X,
  Article,
  SpotifyLogo,
  YoutubeLogo,
  ArrowUpRight,
} from "@phosphor-icons/react";
import { useDialogFocus } from "../lib/useDialogFocus.js";
export default function CreditsPanel({ t, onClose, onPlay }) {
  const ref = useRef(null),
    reduce = useReducedMotion();
  useDialogFocus(ref, Boolean(t));
  useEffect(() => {
    if (!t) return;
    const key = (e) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", key, true);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key, true);
      document.body.style.overflow = previous;
    };
  }, [Boolean(t)]);
  const own = t && (!t.artist || t.artist === "SRD Masum");
  const rows = t
    ? [
        [own ? "Released by" : "Artist", t.artist || "SRD Masum"],
        ["Release", t.album],
        ["Songwriting", t.writers],
        ["Production", t.producer],
        [
          "Release date",
          t.released &&
            new Date(t.released + "T00:00:00Z").toLocaleDateString("en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            }),
        ],
        ["Label", t.label],
      ].filter(([, value]) => value)
    : [];
  return (
    <AnimatePresence>
      {t && (
        <motion.div
          className="studio-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby="song-info-title"
            data-testid="en-credits"
            className="studio-info-sheet"
            initial={reduce ? { opacity: 0 } : { y: 60 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="studio-sheet-grip" aria-hidden="true" />
            <header>
              <div>
                <p className="studio-kicker">Behind the music</p>
                <span>Song information</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close song information"
                className="studio-player-icon"
              >
                <X size={20} />
              </button>
            </header>
            <div className="studio-info-identity">
              <picture>
                {t.coverWebp && (
                  <source srcSet={t.coverWebp} type="image/webp" />
                )}
                <img
                  src={t.cover || t.art || "/images/avatar.webp"}
                  alt={`${t.title} cover`}
                  width="112"
                  height="112"
                />
              </picture>
              <div>
                <p className="studio-kicker">The music space</p>
                <h2 id="song-info-title">{t.title}</h2>
                <p>{t.artist || "SRD Masum"}</p>
              </div>
            </div>
            <dl className="studio-info-metadata">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {((t.lyrics && onPlay) || t.spotifyUrl || t.youtubeUrl) && (
              <div className="studio-info-services">
                <p className="studio-kicker">Keep listening</p>
                {t.lyrics && onPlay && (
                  <button
                    type="button"
                    onClick={() => {
                      onPlay(t);
                      onClose();
                    }}
                    className="studio-service-link"
                  >
                    <Article size={21} />
                    <span>
                      <strong>Play with lyrics</strong>
                      <small>Follow every line</small>
                    </span>
                    <ArrowUpRight size={17} />
                  </button>
                )}
                {t.spotifyUrl && (
                  <a
                    href={t.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="en-spotify"
                    className="studio-service-link"
                  >
                    <SpotifyLogo size={24} weight="fill" />
                    <span>
                      <strong>Spotify</strong>
                      <small>Listen on Spotify</small>
                    </span>
                    <ArrowUpRight size={17} />
                  </a>
                )}
                {t.youtubeUrl && (
                  <a
                    href={t.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="en-youtube"
                    className="studio-service-link"
                  >
                    <YoutubeLogo size={24} weight="fill" />
                    <span>
                      <strong>YouTube</strong>
                      <small>Watch on YouTube</small>
                    </span>
                    <ArrowUpRight size={17} />
                  </a>
                )}
              </div>
            )}
            <p className="studio-info-footnote">
              A little closer to the music.
            </p>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
