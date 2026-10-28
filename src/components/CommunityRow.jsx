import { useEffect, useRef, useState } from "react";
import { Play, Pause, CaretLeft, CaretRight, UsersThree } from "@phosphor-icons/react";
import { usePlayer } from "./MiniPlayer.jsx";
import { toTrack } from "./SongList.jsx";
import { spaClick } from "../lib/nav.js";
import VerifiedBadge from "./VerifiedBadge.jsx";

// "Fresh from the community": latest approved user uploads. Hidden when there are none.
export default function CommunityRow() {
  const player = usePlayer();
  const [tracks, setTracks] = useState([]);
  const [edge, setEdge] = useState({ l: false, r: false });
  const ref = useRef(null);
  useEffect(() => {
    let on = true;
    fetch("/api/songs/latest?limit=12").then((r) => (r.ok ? r.json() : null)).then((j) => { if (on && j?.songs) setTracks(j.songs.map(toTrack)); }).catch(() => {});
    return () => { on = false; };
  }, []);
  const upd = () => { const el = ref.current; if (el) setEdge({ l: el.scrollLeft > 4, r: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 }); };
  useEffect(() => { upd(); }, [tracks]);
  if (!tracks.length) return null;
  const scroll = (d) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.85, behavior: "smooth" });
  return (
    <section id="community" className="px-5 pt-10 sm:px-8" data-testid="community-row">
      <div className="mx-auto max-w-3xl lg:max-w-[1240px]">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent"><UsersThree size={14} weight="bold" />New uploads</p>
            <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Fresh from the community</h2>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button type="button" aria-label="Scroll left" disabled={!edge.l} onClick={() => scroll(-1)} className="grid h-9 w-9 place-items-center rounded-full bg-raised text-ink ring-1 ring-hairline transition hover:bg-sunk disabled:opacity-35"><CaretLeft size={16} weight="bold" /></button>
            <button type="button" aria-label="Scroll right" disabled={!edge.r} onClick={() => scroll(1)} className="grid h-9 w-9 place-items-center rounded-full bg-raised text-ink ring-1 ring-hairline transition hover:bg-sunk disabled:opacity-35"><CaretRight size={16} weight="bold" /></button>
          </div>
        </div>
        <ul ref={ref} onScroll={upd} className="srd-hscroll -mx-5 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 sm:-mx-1 sm:scroll-px-1 sm:px-1">
          {tracks.map((t) => {
            const cur = player?.track?.id === t.id, playing = cur && player.playing;
            return (
              <li key={t.id} className="group w-[42vw] max-w-[180px] shrink-0 snap-start sm:w-[180px]">
                <button type="button" onClick={() => player.toggle(t, tracks)} aria-label={`${playing ? "Pause" : "Play"} ${t.title}`}
                  className="relative block aspect-square w-full overflow-hidden rounded-xl bg-sunk shadow-lg ring-1 ring-hairline">
                  <img src={t.cover || "/images/avatar.webp"} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" />
                  <span className={`absolute bottom-2 right-2 grid h-11 w-11 place-items-center rounded-full bg-[#1ed760] text-black shadow-xl transition ${cur ? "opacity-100" : "translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 max-sm:translate-y-0 max-sm:opacity-100 max-sm:scale-90"}`}>
                    {playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
                  </span>
                </button>
                <p className={`mt-2 truncate text-[15px] font-semibold ${cur ? "text-[#1ed760]" : "text-ink"}`}>{t.title}</p>
                <a href={`/u/${encodeURIComponent(t.uploader.username)}/`} onClick={spaClick} className="srd-artist-link mt-0.5 flex min-w-0 items-center gap-1 text-[13px]">
                  <span className="truncate">{t.uploader.displayName}</span>{t.uploader.verified && <VerifiedBadge size={12} />}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
