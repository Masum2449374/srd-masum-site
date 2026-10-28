import { Play, Pause, Trash, Clock } from "@phosphor-icons/react";
import { usePlayer, formatTime } from "./MiniPlayer.jsx";
import { artistHref, artistOf, isVerified } from "../lib/artists.js";
import VerifiedBadge from "./VerifiedBadge.jsx";
import { spaClick } from "../lib/nav.js";

// Spotify-style numbered track list. Works for catalog tracks and user uploads (mapped via toTrack).
export const toTrack = (s) => ({ id: "u" + s.id, songId: s.id, title: s.title, artist: s.uploader?.displayName, uploader: s.uploader, src: s.audio, cover: s.cover, thumb: s.cover, lyrics: s.lyrics || undefined, playlist: true, uploaded: true });

export default function SongList({ tracks, onDelete, status }) {
  const player = usePlayer();
  return (
    <ol className="srd-tl mt-4" data-testid="song-list">
      {tracks.map((t, i) => {
        const active = player?.track?.id === t.id, playing = active && player.playing, st = status?.(t);
        const canPlay = !st || st.playable;
        return (
          <li key={t.id} className={`srd-tl-row${active ? " is-active" : ""}`}>
            <button type="button" disabled={!canPlay} onClick={() => player.toggle(t, tracks.filter((x) => !status || status(x)?.playable !== false))}
              aria-label={playing ? `Pause ${t.title}` : `Play ${t.title}`} className="srd-tl-num">
              <span className="srd-tl-i">{i + 1}</span>
              <span className="srd-tl-p">{playing ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}</span>
            </button>
            {t.thumb || t.cover ? <img src={t.thumb || t.cover} alt="" width="44" height="44" loading="lazy" className="srd-tl-art" /> : <span className="srd-tl-art srd-tl-art-ph" aria-hidden="true">♪</span>}
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-[15px] font-semibold ${active ? "text-accent" : "text-ink"}`}>{t.title}</span>
              <span className="flex min-w-0 items-center gap-2 text-[13px] text-muted">
                {st?.label && <span className={`srd-pill srd-pill-${st.tone}`}>{st.label}</span>}
                <a href={artistHref(t)} onClick={spaClick} className="srd-artist-link inline-flex min-w-0 items-center gap-1"><span className="truncate">{artistOf(t)}</span>{isVerified(t) && <VerifiedBadge size={13} />}</a>
              </span>
              {st?.note && <span className="mt-0.5 block truncate text-xs text-faint">{st.note}</span>}
            </span>
            {t.duration ? <span className="hidden shrink-0 font-mono text-xs tabular-nums text-muted sm:inline"><Clock size={12} className="mr-1 inline" aria-hidden="true" />{formatTime(t.duration)}</span> : null}
            {onDelete && <button type="button" onClick={() => onDelete(t)} aria-label={`Delete ${t.title}`} className="srd-tl-del"><Trash size={17} /></button>}
          </li>
        );
      })}
    </ol>
  );
}
