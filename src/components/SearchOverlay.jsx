import { useEffect, useMemo, useRef, useState } from "react";
import { MagnifyingGlass, X, CaretRight } from "@phosphor-icons/react";
import { AUDIO_TRACKS } from "../data/songs.js";
import { BANGLA_TRACKS } from "../data/bangla-songs.js";
import { ENGLISH_ALL } from "../data/english-songs.js";

const ALL = (() => {
  const seen = new Set();
  return [...AUDIO_TRACKS, ...BANGLA_TRACKS, ...ENGLISH_ALL].filter((t) => t && t.id && !seen.has(t.id) && seen.add(t.id));
})();
const norm = (s) => String(s || "").normalize("NFC").toLowerCase();

export default function SearchOverlay({ onClose }) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); onClose(); } };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("srd-search-open");
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; document.body.classList.remove("srd-search-open"); };
  }, [onClose]);
  const results = useMemo(() => {
    const terms = norm(q).trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    const words = (x) => norm(x).split(/[\s\-–—_.,:;!?'"()\[\]\/&|·]+/).filter(Boolean);
    const out = [];
    for (const t of ALL) {
      const tw = words(t.title), aw = words(t.artist || "SRD Masum");
      if (!terms.every((w) => tw.some((x) => x.startsWith(w)) || aw.some((x) => x.startsWith(w)))) continue;
      const nq = norm(q).trim();
      const rank = norm(t.title).startsWith(nq) ? 0 : terms.every((w) => tw.some((x) => x.startsWith(w))) ? 1 : 2;
      out.push([rank, t]);
    }
    return out.sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  }, [q]);
  return (
    <div className="srd-search" role="dialog" aria-modal="true" aria-label="Search songs">
      <div className="srd-search-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="srd-search-sheet">
        <div className="srd-search-bar">
          <MagnifyingGlass size={20} weight="bold" aria-hidden="true" className="shrink-0 text-muted" />
          <input ref={inputRef} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search songs or artists…" aria-label="Search songs or artists" autoComplete="off" enterKeyHint="search"
            onKeyDown={(e) => { if (e.key === "Enter" && results[0]) location.href = `/song/${results[0].id}/`; }} />
          <button type="button" onClick={onClose} aria-label="Close search" className="srd-menu-close"><X size={18} weight="bold" aria-hidden="true" /></button>
        </div>
        {q.trim() ? <p className="srd-search-count">{`${results.length} result${results.length === 1 ? "" : "s"}`}</p> : <p className="srd-search-hint" style={{textAlign:"center",padding:"28px 16px",fontSize:"14px",opacity:.6}}>Type a song or artist name</p>}
        <ul className="srd-search-list">
          {results.map((t) => (
            <li key={t.id}>
              <a href={`/song/${t.id}/`} className="srd-search-row">
                <img src={t.thumb || t.cover || "/images/avatar.webp"} alt="" width="44" height="44" loading="lazy" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-ink">{t.title}</span>
                  <span className="block truncate text-xs text-muted">{t.artist || "SRD Masum"}</span>
                </span>
                <CaretRight size={16} weight="bold" aria-hidden="true" className="text-muted" />
              </a>
            </li>
          ))}
          {q.trim() && !results.length && <li className="srd-search-empty">No songs found for “{q}”.</li>}
        </ul>
      </div>
    </div>
  );
}
