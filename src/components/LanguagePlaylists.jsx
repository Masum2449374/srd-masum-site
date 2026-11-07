import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Play,
  Pause,
  Shuffle,
  GlobeHemisphereWest,
  MusicNotes,
} from "@phosphor-icons/react";
import {
  LANGUAGE_PLAYLISTS,
  CATALOGUE,
  playlistBySlug,
  languageLabel,
} from "../data/language-playlists.js";
import { TrackList } from "./PlaylistSection.jsx";
import { usePlayer } from "./MiniPlayer.jsx";
import CreditsPanel from "./CreditsPanel.jsx";

export function PlaylistArtwork({ tracks, eager = false }) {
  const covers = tracks.slice(0, 4);
  return (
    <div className={`language-artwork has-${covers.length}`} aria-hidden="true">
      {covers.map((t) => (
        <img
          key={t.id}
          src={t.coverWebp || t.cover || t.art}
          alt=""
          width="300"
          height="300"
          loading={eager ? "eager" : "lazy"}
        />
      ))}
    </div>
  );
}
export function LanguagePlaylistCards() {
  return (
    <div className="language-playlist-grid">
      {LANGUAGE_PLAYLISTS.map((p, i) => (
        <a
          href={p.href}
          key={p.slug}
          className={`language-playlist-card tone-${p.tone}`}
        >
          <div className="language-card-heading">
            <span>LANGUAGE PLAYLIST</span>
            <span>
              {String(i + 1).padStart(2, "0")} <ArrowUpRight size={17} />
            </span>
          </div>
          <PlaylistArtwork tracks={p.tracks} />
          <div className="language-card-title">
            <h3>{p.title}</h3>
            <span>
              {p.tracks.length} {p.tracks.length === 1 ? "track" : "tracks"}
            </span>
          </div>
          <p>{p.subtitle}</p>
          {p.slug === "multilingual" && (
            <small>
              {[...new Set(p.tracks.map(languageLabel))].join(" · ")}
            </small>
          )}
        </a>
      ))}
    </div>
  );
}
const totalTime = (tracks) => {
  const mins = Math.round(
    tracks.reduce((s, t) => s + (t.duration || 0), 0) / 60,
  );
  return mins >= 60
    ? `${Math.floor(mins / 60)} hr ${mins % 60} min`
    : `${mins} min`;
};
export default function LanguagePlaylists({ slug }) {
  const playlist = slug ? playlistBySlug(slug) : null;
  const player = usePlayer(),
    [info, setInfo] = useState(null);
  useEffect(() => {
    document.title = slug
      ? `${playlist?.title || "Playlist not found"} playlist | SRD Masum`
      : "Language playlists | SRD Masum";
    setInfo(null);
  }, [slug]);
  if (slug && !playlist)
    return (
      <section className="studio-section studio-empty-state">
        <p className="studio-kicker">The music space</p>
        <h1>This playlist isn’t here.</h1>
        <p className="studio-muted">
          Explore the languages already in the collection.
        </p>
        <a href="/playlists/" className="studio-button">
          Browse playlists
        </a>
      </section>
    );
  if (!slug)
    return (
      <>
        <section className="studio-section language-overview-header">
          <p className="studio-kicker">
            <GlobeHemisphereWest size={15} /> A world of sound
          </p>
          <h1>
            Find your language.
            <br />
            <span>Follow the feeling.</span>
          </h1>
          <p className="studio-muted">
            Different words. The same love for music. Explore the songs already
            here, arranged into language playlists.
          </p>
          <div className="language-overview-stats">
            <span>{LANGUAGE_PLAYLISTS.length} playlists</span>
            <i />
            <span>{CATALOGUE.length} recordings</span>
            <i />
            <span>No duplicates</span>
          </div>
        </section>
        <section className="studio-section language-overview-grid">
          <LanguagePlaylistCards />
        </section>
        <section className="studio-section language-legacy">
          <MusicNotes size={22} />
          <div>
            <h2>Your familiar favorites are still here.</h2>
            <p>
              The original English rotation and full catalogue keep their
              existing order.
            </p>
          </div>
          <a href="/english/" className="studio-text-link">
            English rotation <ArrowUpRight size={15} />
          </a>
          <a href="/#playlist" className="studio-text-link">
            All tracks <ArrowUpRight size={15} />
          </a>
        </section>
      </>
    );
  const inPlaylist =
    player.track &&
    playlist.tracks.some((t) => t.id === player.track.id) &&
    player.queue?.[0]?.playlist === `language:${slug}`;
  return (
    <>
      <section
        className={`studio-section language-detail tone-${playlist.tone}`}
      >
        <a href="/playlists/" className="studio-text-link">
          <ArrowLeft size={16} /> All language playlists
        </a>
        <div className="language-detail-hero">
          <PlaylistArtwork tracks={playlist.tracks} eager />
          <div>
            <p className="studio-kicker">Language playlist · SRD Masum</p>
            <h1>{playlist.title}</h1>
            <p className="language-detail-tagline">{playlist.subtitle}</p>
            <p className="studio-muted">{playlist.description}</p>
            <div className="language-detail-meta">
              <span>
                {playlist.tracks.length}{" "}
                {playlist.tracks.length === 1 ? "track" : "tracks"}
              </span>
              <i />
              <span>{totalTime(playlist.tracks)}</span>
            </div>
            <div className="language-detail-actions">
              <button
                type="button"
                className="studio-button"
                onClick={() =>
                  inPlaylist
                    ? player.toggle(player.track, playlist.tracks)
                    : player.startPlaylist(playlist.tracks)
                }
              >
                {inPlaylist && player.playing ? (
                  <Pause size={18} weight="fill" />
                ) : (
                  <Play size={18} weight="fill" />
                )}
                {inPlaylist
                  ? player.playing
                    ? "Pause"
                    : "Resume"
                  : "Play all"}
              </button>
              {playlist.tracks.length > 1 && (
                <button
                  type="button"
                  className="language-shuffle"
                  onClick={() =>
                    player.startPlaylist(playlist.tracks, { shuffle: true })
                  }
                >
                  <Shuffle size={18} />
                  Shuffle
                </button>
              )}
            </div>
            <p className="language-listen-note">
              Browsing never interrupts your current song.
            </p>
          </div>
        </div>
      </section>
      <section className="studio-section language-detail-list">
        <div className="studio-section-head">
          <div>
            <p className="studio-kicker">Your next listening session</p>
            <h2>The playlist</h2>
          </div>
          <span className="studio-interior-badge">
            {playlist.tracks.length} recordings
          </span>
        </div>
        <TrackList
          tracks={playlist.tracks}
          onInfo={setInfo}
          languageLabels={languageLabel}
          testid="language-track-list"
        />
      </section>
      <section className="studio-section language-other-lists">
        <div className="studio-section-head">
          <h2>Keep exploring</h2>
          <a href="/playlists/" className="studio-text-link">
            All playlists <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="language-switcher">
          {LANGUAGE_PLAYLISTS.filter((p) => p.slug !== slug).map((p) => (
            <a key={p.slug} href={p.href}>
              {p.title}
              <span>{p.tracks.length}</span>
            </a>
          ))}
        </div>
      </section>
      <CreditsPanel t={info} onClose={() => setInfo(null)} />
    </>
  );
}
