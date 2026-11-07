import { useEffect, useState } from "react";
import { Play, Pause, Shuffle } from "@phosphor-icons/react";
import { usePlayer } from "./MiniPlayer.jsx";
import { TrackList } from "./PlaylistSection.jsx";
import { FeaturedRelease, StudioHeading } from "./PremiumHome.jsx";
import MusicCard from "./MusicCard.jsx";
import CreditsPanel from "./CreditsPanel.jsx";
import AdSlot from "./AdSlot.jsx";
import {
  ENGLISH_ORIGINALS,
  ENGLISH_TRACKS,
  ENGLISH_ALL,
} from "../data/english-songs.js";

export default function EnglishPage() {
  const player = usePlayer();
  const [info, setInfo] = useState(null);
  useEffect(() => {
    document.title = "The English Rotation | SRD Masum";
  }, []);
  const active =
    player?.track && ENGLISH_ALL.some((t) => t.id === player.track.id);
  const playAll = (shuffle = false) => {
    if (!ENGLISH_ALL.length) return;
    if (active && !shuffle) player.toggle(player.track);
    else
      player.toggle(
        ENGLISH_ALL[
          shuffle ? Math.floor(Math.random() * ENGLISH_ALL.length) : 0
        ],
        ENGLISH_ALL,
      );
  };
  return (
    <>
      <FeaturedRelease track={ENGLISH_ALL[0]} list={ENGLISH_ALL} english />
      {ENGLISH_ORIGINALS.length > 0 && (
        <section id="en-originals" className="studio-section">
          <StudioHeading eyebrow="From the artist" title="SRD Masum releases" />
          <div className="studio-music-grid">
            {ENGLISH_ORIGINALS.map((track) => (
              <MusicCard
                key={track.id}
                track={track}
                list={ENGLISH_ORIGINALS}
                onInfo={setInfo}
              />
            ))}
          </div>
        </section>
      )}
      <section className="studio-section">
        <StudioHeading
          eyebrow="Press play. Stay a while."
          title="In the rotation"
        />
        <div className="studio-music-grid studio-english-grid">
          {ENGLISH_ALL.slice(0, 10).map((track, i) => (
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
      <AdSlot type="banner320" />
      <section id="en-hits" className="studio-section">
        <div className="studio-section-head">
          <div>
            <p className="studio-kicker">
              {ENGLISH_ALL.length} tracks · The complete collection
            </p>
            <h2>Top English Hits</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="en-playall"
              className="studio-button"
              onClick={() => playAll()}
            >
              {active && player.playing ? (
                <Pause size={17} weight="fill" />
              ) : (
                <Play size={17} weight="fill" />
              )}
              {active && player.playing
                ? "Pause"
                : active
                  ? "Resume"
                  : "Play all"}
            </button>
            <button
              type="button"
              className="studio-icon-button"
              aria-label="Shuffle play"
              onClick={() => playAll(true)}
            >
              <Shuffle size={18} />
            </button>
          </div>
        </div>
        <TrackList tracks={ENGLISH_ALL} onInfo={setInfo} testid="en-list" />
        <a className="studio-home-link" data-testid="en-cta" href="/#music">
          <img src="/images/avatar.webp" width="48" height="48" alt="" />
          <span>
            <small>From the artist</small>
            <strong>Discover the sound of SRD Masum →</strong>
          </span>
        </a>
      </section>
      <AdSlot type="native" />
      <AdSlot type="banner300" />
      <CreditsPanel
        t={info}
        onClose={() => setInfo(null)}
        onPlay={(t) => player.toggle(t, ENGLISH_ALL)}
      />
    </>
  );
}
