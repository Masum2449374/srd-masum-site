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
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  const results = useMemo(() => {
    const terms = norm(q).trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return ALL;
    return ALL.filter((t) => { const h = norm(`${t.title} ${t.artist || "SRD Masum"} ${t.album || ""}`); return terms.every((w) => h.includes(w)); });
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
        <p className="srd-search-count">{q.trim() ? `${results.length} result${results.length === 1 ? "" : "s"}` : `All songs · ${ALL.length}`}</p>
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
          {!results.length && <li className="srd-search-empty">No songs found for “{q}”.</li>}
        </ul>
      </div>
    </div>
  );
}
