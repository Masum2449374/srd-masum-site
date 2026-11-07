import { useEffect, useState } from "react";
import { Play, Pause, ArrowLeft, Info, Article } from "@phosphor-icons/react";
import { usePlayer, formatTime } from "./MiniPlayer.jsx";
import { ALL_PLAYLIST } from "./PlaylistSection.jsx";
import { CoverArt } from "./MusicCard.jsx";
import { artistHref } from "../lib/artists.js";
import ShareButton from "./ShareButton.jsx";
import CreditsPanel from "./CreditsPanel.jsx";
import LyricsPanel from "./LyricsPanel.jsx";
import { usePlays, fmtPlays } from "../lib/plays.js";
export default function SongDetail({ id }) {
  const track = ALL_PLAYLIST.find((t) => t.id === id),
    player = usePlayer(),
    plays = usePlays();
  const [info, setInfo] = useState(false);
  const active = player.track?.id === id,
    playing = active && player.playing;
  useEffect(() => {
    if (track)
      document.title = `${track.title} — ${track.artist || "SRD Masum"} | SRD Masum`;
    setInfo(false);
  }, [id]);
  if (!track)
    return (
      <section className="studio-section studio-empty-state">
        <p className="studio-kicker">The music space</p>
        <h1>This track isn’t here.</h1>
        <a href="/" className="studio-button">
          Explore the collection
        </a>
      </section>
    );
  return (
    <>
      <section className="studio-section studio-song-detail">
        <a href="/" className="studio-text-link">
          <ArrowLeft size={16} />
          Back to discovery
        </a>
        <div className="studio-song-hero">
          <CoverArt track={track} eager />
          <div>
            <p className="studio-kicker">Single · The music space</p>
            <h1>{track.title}</h1>
            <a className="studio-song-artist" href={artistHref(track)}>
              {track.artist || "SRD Masum"}
            </a>
            <p className="studio-muted">
              {formatTime(track.duration)}
              {plays && <> · {fmtPlays(plays[String(id).toLowerCase()])}</>}
            </p>
            <div className="studio-song-actions">
              <button
                type="button"
                className="studio-button"
                onClick={() => player.toggle(track, ALL_PLAYLIST)}
              >
                {playing ? (
                  <Pause size={18} weight="fill" />
                ) : (
                  <Play size={18} weight="fill" />
                )}
                {playing ? "Pause" : active ? "Resume listening" : "Play song"}
              </button>
              <button
                type="button"
                className="studio-icon-button"
                aria-label="Song information"
                onClick={() => setInfo(true)}
              >
                <Info size={21} />
              </button>
              <ShareButton track={track} />
            </div>
            {!active && player.playing && (
              <p className="studio-song-continuity">
                Your music keeps playing while you explore.
              </p>
            )}
          </div>
        </div>
      </section>
      {track.lyrics && (
        <section className="studio-section">
          <div className="studio-section-head">
            <div>
              <p className="studio-kicker">
                <Article size={13} />
                Word for word
              </p>
              <h2>Feel every line.</h2>
            </div>
            <span className="studio-interior-badge">{track.lyricTimes?.length ? "Synced lyrics" : "Lyrics"}</span>
          </div>
          <div className="studio-song-lyrics">
            <LyricsPanel
              track={track}
              current={active ? player.current : 0}
              duration={track.duration}
              onSeek={active ? player.seekTo : undefined}
            />
          </div>
          {!active && (
            <p className="studio-lyrics-hint">
              Play this song to follow the lyrics and seek to a line.
            </p>
          )}
        </section>
      )}
      <CreditsPanel t={info ? track : null} onClose={() => setInfo(false)} />
    </>
  );
}
