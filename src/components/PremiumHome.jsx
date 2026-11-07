import { spaClick } from "../lib/nav.js";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Play,
  Pause,
  Headphones,
  CheckCircle,
  Waveform,
  MusicNotes,
  GlobeHemisphereWest,
  MicrophoneStage,
} from "@phosphor-icons/react";
import { usePlayer, formatTime } from "./MiniPlayer.jsx";
import MusicCard, { CoverArt } from "./MusicCard.jsx";
import PlaylistSection, {
  TrackList,
  ALL_PLAYLIST,
} from "./PlaylistSection.jsx";
import CreditsPanel from "./CreditsPanel.jsx";
import AdSlot from "./AdSlot.jsx";
import { AUDIO_TRACKS } from "../data/songs.js";
import { BANGLA_TRACKS } from "../data/bangla-songs.js";
import { ENGLISH_ALL } from "../data/english-songs.js";
import { SPOTIFY_ARTIST_URL } from "../data/videos.js";
import { usePlays, fmtPlays } from "../lib/plays.js";

const OFFICIAL = [...BANGLA_TRACKS, ...AUDIO_TRACKS, ...ENGLISH_ALL].filter(
  (t) => t.artist === "SRD Masum" || !t.artist,
);
export function StudioHeading({ eyebrow, title, href, link = "Explore all" }) {
  return (
    <div className="studio-section-head">
      <div>
        <p className="studio-kicker">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {href && (
        <a
          className="studio-text-link"
          href={href}
          onClick={href.startsWith("/artist/") ? spaClick : undefined}
        >
          {link}
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
export function FeaturedRelease({ track, list, english = false }) {
  const player = usePlayer(),
    plays = usePlays();
  if (!track) return null;
  const active = player?.track?.id === track.id,
    playing = active && player.playing;
  return (
    <section
      id="top"
      className={`studio-hero ${english ? "studio-hero-english" : ""}`}
    >
      <div className="studio-hero-copy">
        <p className="studio-kicker">
          <span className="studio-live-dot" />
          {english
            ? "The international collection"
            : "Your world. Your soundtrack."}
        </p>
        <h1>
          {english ? (
            <>
              Good music.
              <br />
              <span>No borders.</span>
            </>
          ) : (
            <>
              Find your
              <br />
              <span>next feeling.</span>
            </>
          )}
        </h1>
        <p className="studio-hero-description">
          {english
            ? "From the songs you know by heart to the ones you’re about to discover. Press play and stay a little longer."
            : "Original sounds. Global favorites. A space to get lost in the music — and find something that stays with you."}
        </p>
        <div className="studio-hero-actions">
          <button
            type="button"
            className="studio-button"
            onClick={() => player.toggle(track, list)}
          >
            {playing ? (
              <Pause weight="fill" size={18} />
            ) : (
              <Play weight="fill" size={18} />
            )}
            {playing ? "Pause listening" : "Start listening"}
          </button>
          <a
            href={english ? "#en-hits" : "#collections"}
            className="studio-text-link"
          >
            Explore music
            <ArrowRight size={17} />
          </a>
        </div>
        <div className="studio-hero-foot">
          <span>
            <Headphones size={16} />
            Made for your everyday.
          </span>
          <span className="studio-hero-line" />
          English · Hindi · Bangla
        </div>
      </div>
      <div className={`studio-feature${playing ? " is-playing" : ""}`}>
        <div className="studio-feature-top">
          <span>
            <span className="studio-live-dot" />
            {english ? "First in the playlist" : "In the spotlight"}
          </span>
          <Waveform size={18} aria-hidden="true" />
        </div>
        <button
          type="button"
          className="studio-feature-art"
          aria-label={`${playing ? "Pause" : "Play"} ${track.title}`}
          onClick={() => player.toggle(track, list)}
        >
          <CoverArt track={track} eager />
          <span className="studio-feature-art-play">
            {playing ? (
              <Pause size={30} weight="fill" />
            ) : (
              <Play size={30} weight="fill" />
            )}
          </span>
        </button>
        <div className="studio-feature-details">
          <div>
            <p className="studio-kicker">
              {track.artist === "SRD Masum"
                ? "SRD Masum · Official release"
                : track.artist}
            </p>
            <h2>{track.title}</h2>
            <p>
              {plays
                ? fmtPlays(plays[String(track.id).toLowerCase()])
                : "Listen now"}
              <span>·</span>
              {formatTime(track.duration)}
              {track.lyrics && (
                <>
                  <span>·</span>Synced lyrics
                </>
              )}
            </p>
          </div>
          <a
            href={`/song/${track.id}/`}
            aria-label={`Details: ${track.title}`}
            className="studio-icon-button"
          >
            <ArrowUpRight size={22} />
          </a>
        </div>
      </div>
    </section>
  );
}

export default function PremiumHome() {
  const player = usePlayer();
  const [info, setInfo] = useState(null);
  const collections = [
    {
      title: "English rotation",
      sub: "International favorites",
      list: ENGLISH_ALL,
      href: "/english/",
      Icon: GlobeHemisphereWest,
      tone: "violet",
    },
    {
      title: "Hindi favorites",
      sub: "Melodies that stay",
      list: AUDIO_TRACKS,
      href: "#audio-songs",
      Icon: MicrophoneStage,
      tone: "rose",
    },
    {
      title: "Bangla essentials",
      sub: "A little closer to home",
      list: BANGLA_TRACKS,
      href: "#bangla-songs",
      Icon: MusicNotes,
      tone: "mint",
    },
  ];
  return (
    <>
      <FeaturedRelease track={OFFICIAL[0]} list={OFFICIAL} />
      <section id="music" className="studio-section">
        <StudioHeading
          eyebrow="From the artist"
          title="This is SRD Masum."
          href="/artist/srd-masum/"
          link="Meet the artist"
        />
        <div className="studio-official-layout">
          <div className="studio-artist-card">
            <img
              src="/images/avatar.webp"
              alt="SRD Masum artist avatar"
              width="500"
              height="600"
              loading="lazy"
            />
            <div>
              <p className="studio-kicker">
                <CheckCircle weight="fill" size={14} />
                Official artist
              </p>
              <h3>
                A sound of
                <br />
                his own.
              </h3>
              <a
                href={SPOTIFY_ARTIST_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Follow on Spotify <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
          <div className="studio-official-tracks">
            {OFFICIAL.map((track) => (
              <MusicCard
                key={track.id}
                track={track}
                list={OFFICIAL}
                onInfo={setInfo}
              />
            ))}
          </div>
        </div>
      </section>
      <section id="english" className="studio-section">
        <StudioHeading
          eyebrow="On your radar"
          title="The English rotation"
          href="/english/"
          link="View collection"
        />
        <div className="studio-music-grid">
          {ENGLISH_ALL.slice(0, 5).map((track, i) => (
            <MusicCard
              key={track.id}
              track={track}
              list={ENGLISH_ALL}
              number={i + 1}
              onInfo={setInfo}
            />
          ))}
        </div>
      </section>
      <AdSlot type="leader" />
      <section id="collections" className="studio-section">
        <StudioHeading eyebrow="Find your frequency" title="A world of sound" />
        <div className="studio-collections">
          {collections.map(({ title, sub, list, href, Icon, tone }) => (
            <a key={title} href={href} className={`studio-collection ${tone}`}>
              <div className="studio-collection-top">
                <Icon size={25} weight="duotone" />
                <span>
                  {list.length} tracks
                  <ArrowUpRight size={18} />
                </span>
              </div>
              <div className="studio-collection-art">
                {list.slice(0, 3).map((t) => (
                  <img
                    src={t.coverWebp || t.cover}
                    alt=""
                    key={t.id}
                    width="200"
                    height="200"
                    loading="lazy"
                  />
                ))}
              </div>
              <div>
                <h3>{title}</h3>
                <p>{sub}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
      <PlaylistSection />
      <AdSlot type="native" />
      <section id="audio-songs" className="studio-section">
        <StudioHeading eyebrow="Explore the catalogue" title="Hindi & beyond" />
        <TrackList tracks={AUDIO_TRACKS} onInfo={setInfo} />
      </section>
      <section id="bangla-songs" className="studio-section">
        <StudioHeading eyebrow="Close to home" title="Bangla essentials" />
        <TrackList tracks={BANGLA_TRACKS} onInfo={setInfo} />
      </section>
      <AdSlot type="banner300" />
      <CreditsPanel
        t={info}
        onClose={() => setInfo(null)}
        onPlay={(t) => player.toggle(t, ALL_PLAYLIST)}
      />
    </>
  );
}
