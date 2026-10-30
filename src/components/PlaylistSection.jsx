import { Play, Pause, Info, ListNumbers } from "@phosphor-icons/react";
import { usePlayer, formatTime } from "./MiniPlayer.jsx";
import { AUDIO_TRACKS } from "../data/songs.js";
import { BANGLA_TRACKS } from "../data/bangla-songs.js";
import { ENGLISH_ALL } from "../data/english-songs.js";
import { usePlays, fmtPlays } from "../lib/plays.js";

// The whole site as one serial playlist: English hits first, then SRD Masum's own songs.
// `playlist` on the first item makes the player keep to this list and play it in order.
export const ALL_PLAYLIST = [...ENGLISH_ALL, ...AUDIO_TRACKS, ...BANGLA_TRACKS].map((t, i) => (i === 0 ? { ...t, playlist: t.playlist || "all" } : t));

const Bars = ({ on }) => (<span aria-hidden="true" className={`en-bars ${on ? "" : "en-bars-off"}`}><i /><i /><i /><i /></span>);

export function TrackList({ tracks, onInfo, testid = "playlist" }) {
  const player = usePlayer(), plays = usePlays();
  const list = tracks[0]?.playlist ? tracks : tracks.map((t, i) => (i === 0 ? { ...t, playlist: "list" } : t));
  return (
    <ol data-testid={testid} className="pl-list">
      <li aria-hidden="true" className="pl-head"><span>#</span><span>Title</span><span>Album / Credit</span><span>Time</span></li>
      {list.map((t, i) => {
        const active = player?.track?.id === t.id;
        const playing = active && player.playing;
        return (
          <li key={t.id} className={`pl-row ${active ? "pl-on" : ""}`}>
            <button type="button" onClick={() => player.toggle(t, list)} className="pl-main">
              <span className="sr-only">{playing ? "Pause " : "Play "}</span>
              <span className="pl-num">{active ? <Bars on={playing} /> : i + 1}</span>
              <span className="pl-art">
                <img src={t.thumb || t.coverSm || t.cover || t.art || "/images/avatar.webp"} alt="" width="96" height="96" loading="lazy" decoding="async" draggable={false} />
                <span className="pl-art-ov">{playing ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}</span>
              </span>
              <span className="pl-title min-w-0 flex-1 text-left">
                <span className={`block truncate text-[15px] font-semibold ${active ? "text-accent" : "text-ink"}`}>{t.title}</span>
                <span className="block truncate text-xs text-muted">{t.artist || "SRD Masum"}</span>
                {plays ? <span data-testid="plays" className="block truncate text-[11px] tabular-nums text-faint">{fmtPlays(plays[String(t.id).toLowerCase()])}</span> : null}
              </span>
              <span className="pl-album">{t.album || t.label || (t.artist && t.artist !== "SRD Masum" ? "Single" : "SRD Masum · Release")}</span>
              <span className="pl-time font-mono text-[11px] tabular-nums text-muted">{formatTime(active && player.duration ? player.duration : t.duration)}</span>
            </button>
            <a href={`/song/${encodeURIComponent(t.id)}/`} aria-label={`Details: ${t.title}`} className="shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-muted ring-1 ring-hairline hover:text-accent" >Details</a>
            {onInfo && <button type="button" onClick={() => onInfo(t)} aria-label={`Credits for ${t.title}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted ring-1 ring-hairline"><Info size={16} weight="bold" /></button>}
          </li>
        );
      })}
    </ol>
  );
}

export default function PlaylistSection() {
  const player = usePlayer();
  const inList = player?.track && ALL_PLAYLIST.some((x) => x.id === player.track.id);
  return (
    <section id="playlist" className="scroll-mt-20 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl lg:max-w-[1240px]">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent"><ListNumbers size={14} weight="bold" />Playlist · {ALL_PLAYLIST.length} songs</p>
            <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Play everything</h2>
          </div>
          <button type="button" data-testid="pl-playall" onClick={() => (inList ? player.toggle(player.track, null) : player.toggle(ALL_PLAYLIST[0], ALL_PLAYLIST))}
            className="flex shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent shadow-lg shadow-accent/30 active:scale-95">
            {inList && player.playing ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}{inList && player.playing ? "Pause" : inList ? "Resume" : "Play all"}
          </button>
        </div>
        <div className="mt-5"><TrackList tracks={ALL_PLAYLIST} /></div>
      </div>
    </section>
  );
}
