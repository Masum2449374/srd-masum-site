import ArtistCredit from "./ArtistCredit.jsx";
import { Play, Pause, ArrowUpRight, Info } from "@phosphor-icons/react";
import { usePlayer, formatTime } from "./MiniPlayer.jsx";
import { usePlays, fmtPlays } from "../lib/plays.js";

export function CoverArt({ track, eager = false, className = "" }) {
  return (
    <picture className={className}>
      {track.coverWebp && <source srcSet={track.coverWebp} type="image/webp" />}
      <img
        src={track.cover || track.art || "/images/avatar.webp"}
        alt={`${track.title} cover art`}
        width="512"
        height="512"
        loading={eager ? "eager" : "lazy"}
        fetchpriority={eager ? "high" : "auto"}
        decoding="async"
        draggable={false}
      />
    </picture>
  );
}

export default function MusicCard({ track, list, onInfo, number }) {
  const player = usePlayer(),
    plays = usePlays();
  const active = player?.track?.id === track.id,
    playing = active && player.playing;
  return (
    <article
      className={`music-card${active ? " is-active" : ""}`}
      data-track-row={track.id}
    >
      <div className="music-card-art">
        <CoverArt track={track} />
        {number && (
          <span className="music-card-number">
            {String(number).padStart(2, "0")}
          </span>
        )}
        <button
          type="button"
          onClick={() => player.toggle(track, list)}
          aria-label={`${playing ? "Pause" : "Play"} ${track.title}`}
          className="music-card-play"
        >
          {playing ? (
            <Pause size={22} weight="fill" />
          ) : (
            <Play size={22} weight="fill" />
          )}
        </button>
      </div>
      <div className="music-card-copy">
        <div className="music-card-heading">
          <h3>
            <a href={`/song/${encodeURIComponent(track.id)}/`}>{track.title}</a>
          </h3>
          {onInfo && (
            <button
              type="button"
              onClick={() => onInfo(track)}
              aria-label={`Credits for ${track.title}`}
              className="music-card-info"
            >
              <Info size={18} />
            </button>
          )}
        </div>
        <p><ArtistCredit track={track} /></p>
        <div className="music-card-meta">
          <span>
            {plays
              ? fmtPlays(plays[String(track.id).toLowerCase()])
              : "— plays"}
          </span>
          <span>
            {formatTime(track.duration)}{" "}
            <ArrowUpRight size={12} aria-hidden="true" />
          </span>
        </div>
      </div>
    </article>
  );
}
