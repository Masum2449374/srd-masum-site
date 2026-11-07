import { useEffect } from "react";
import { Play, Pause, ArrowLeft, MusicNotes } from "@phosphor-icons/react";
import { artistBySlug } from "../lib/artists.js";
import { usePlayer } from "./MiniPlayer.jsx";
import { TrackList } from "./PlaylistSection.jsx";
import { NameWithBadge } from "./VerifiedBadge.jsx";

export default function ArtistPage({ slug }) {
  const artist = artistBySlug(slug),
    player = usePlayer();
  useEffect(() => {
    if (artist) document.title = `${artist.name} · Artist · SRD Masum`;
  }, [artist?.name]);
  if (!artist)
    return (
      <section className="studio-section studio-empty-state">
        <p className="studio-kicker">The music space</p>
        <h1>Artist not found.</h1>
        <a href="/" className="studio-button">
          Back to discovery
        </a>
      </section>
    );
  const current =
    player?.track && artist.tracks.find((t) => t.id === player.track.id);
  const cover = current?.cover || artist.cover;
  const playing = player?.playing && Boolean(current);
  const back = (e) => {
    if (history.state?.srdSpa) {
      e.preventDefault();
      history.back();
    }
  };
  return (
    <>
      <section className="studio-section studio-artist-page">
        <a href="/" onClick={back} className="studio-text-link">
          <ArrowLeft size={16} />
          Back to discovery
        </a>
        <div className="studio-artist-hero">
          <div className="studio-artist-cover" data-testid="artist-cover">
            <img
              src={cover || "/images/avatar.webp"}
              width="512"
              height="512"
              alt={`${current?.title || artist.name} artwork`}
              decoding="async"
            />
          </div>
          <div>
            <p className="studio-kicker">
              Artist collection
            </p>
            <h1 data-testid="artist-name"><NameWithBadge name={artist.name} verified={artist.verified} size={13} /></h1>
            <p className="studio-muted">
              {artist.tracks.length}{" "}
              {artist.tracks.length === 1 ? "track" : "tracks"} in the SRD Masum
              music space
            </p>
            <button
              type="button"
              className="studio-button"
              onClick={() =>
                playing
                  ? player.toggle(player.track)
                  : player.toggle(current || artist.tracks[0], artist.tracks)
              }
              aria-label={playing ? "Pause" : `Play ${artist.name}`}
            >
              {playing ? (
                <Pause size={18} weight="fill" />
              ) : (
                <Play size={18} weight="fill" />
              )}
              {playing ? "Pause" : "Listen to collection"}
            </button>
          </div>
        </div>
      </section>
      <section className="studio-section">
        <div className="studio-section-head">
          <div>
            <p className="studio-kicker">
              <MusicNotes size={13} />
              Explore the catalogue
            </p>
            <h2>Tracks & releases</h2>
          </div>
        </div>
        <TrackList tracks={artist.tracks} testid="artist-tracks" />
      </section>
    </>
  );
}
