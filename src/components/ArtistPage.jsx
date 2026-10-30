import VerifiedBadge from "./VerifiedBadge.jsx";
import { useEffect, useState } from "react";
import { Play, Pause } from "@phosphor-icons/react";
import { dominantColor } from "../lib/image.js";
import { artistBySlug } from "../lib/artists.js";
import { usePlayer } from "./MiniPlayer.jsx";
import SongList from "./SongList.jsx";

export default function ArtistPage({ slug }) {
  const a = artistBySlug(slug), player = usePlayer();
  const [rgb, setRgb] = useState(null);
  useEffect(() => { if (a) document.title = `${a.name} · Artist · SRD Masum`; }, [a?.name]);
  const hc = (player?.track && a?.tracks.find((t) => t.id === player.track.id && t.cover)?.cover) || a?.cover;
  useEffect(() => { if (hc) dominantColor(hc).then(setRgb); }, [hc]);
  useEffect(() => {
    const r = document.documentElement;
    if (rgb) r.style.setProperty("--hv2-tint", `rgb(${rgb})`);
    r.classList.add("hv2-onprof");
    return () => { r.classList.remove("hv2-onprof"); r.style.removeProperty("--hv2-tint"); };
  }, [rgb]);
  if (!a) return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32 text-center sm:pt-40">
      <h1 className="font-display text-3xl tracking-display text-ink">Artist not found</h1>
      <a href="/" className="pro-btn mt-8 inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent">Back to home</a>
    </div>
  );
  const c = rgb ? `rgb(${rgb})` : "hsl(215 40% 30%)", ca = (x) => (rgb ? `rgba(${rgb}, ${x})` : `hsl(215 40% 30% / ${x})`);
  const playingHere = player?.playing && a.tracks.some((t) => t.id === player.track?.id);
  const n = a.tracks.length;
  const cur = player?.track && a.tracks.find((t) => t.id === player.track.id && t.cover);
  const hdr = cur?.cover || a.cover;
  const covers = [...new Set(a.tracks.map((t) => t.cover).filter(Boolean))];
  return (
    <div className="pb-24">
      <header className="srd-prof-band pt-10 sm:pt-16" style={{ background: `linear-gradient(180deg, ${c} 0%, ${ca(0.75)} 55%, ${ca(0.35)} 100%)` }}>
        <div className="relative z-[1] mx-auto flex max-w-5xl flex-col items-center gap-5 px-5 pb-8 text-center sm:flex-row sm:items-end sm:gap-8 sm:px-8 sm:text-left">
          {hdr ? <div data-testid="artist-cover" className="relative h-[168px] w-[168px] shrink-0 overflow-hidden rounded-full shadow-[0_8px_40px_rgba(0,0,0,.5)] sm:h-[232px] sm:w-[232px]">
            {covers.map((src) => <img key={src} src={src} alt="" aria-hidden={src !== hdr} loading={src === hdr ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out" style={{ opacity: src === hdr ? 1 : 0 }} />)}
          </div> : null}
          <div className="min-w-0 flex-1 text-white">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold"><VerifiedBadge size={14} />Verified Artist</p>
            <h1 data-testid="artist-name" className="mt-1 break-words font-display text-[2.6rem] font-black leading-[1.02] tracking-tight drop-shadow-sm sm:text-7xl lg:text-8xl">{a.name}</h1>
            <p className="mt-3 text-sm font-medium text-white/85">{n} {n === 1 ? "song" : "songs"} on SRD Masum</p>
          </div>
        </div>
      </header>
      <div style={{ background: `linear-gradient(180deg, ${ca(0.22)}, transparent 220px)` }}>
        <div className="mx-auto max-w-5xl px-5 pt-6 sm:px-8">
          <button type="button" onClick={() => (playingHere ? player.toggle(player.track, a.tracks) : player.toggle(a.tracks[0], a.tracks))}
            aria-label={playingHere ? "Pause" : `Play ${a.name}`} className="srd-big-play">{playingHere ? <Pause size={26} weight="fill" /> : <Play size={26} weight="fill" />}</button>
          <section className="mt-8">
            <h2 className="font-display text-2xl font-bold tracking-display text-ink">Popular</h2>
            <SongList tracks={a.tracks} />
          </section>
        </div>
      </div>
    </div>
  );
}
