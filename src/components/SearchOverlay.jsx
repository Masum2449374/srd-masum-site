import VerifiedBadge from "./VerifiedBadge.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { MagnifyingGlass, X, CaretRight } from "@phosphor-icons/react";
import { AUDIO_TRACKS } from "../data/songs.js";
import { BANGLA_TRACKS } from "../data/bangla-songs.js";
import { ENGLISH_ALL } from "../data/english-songs.js";
import Avatar from "./Avatar.jsx";
import { spaClick } from "../lib/nav.js";

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
  const [remote, setRemote] = useState({ q: "", users: [], songs: [] });
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setRemote({ q: term, users: [], songs: [] }); return; }
    const ac = new AbortController();
    const id = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(term)}`, { signal: ac.signal, credentials: "same-origin" })
        .then((r) => (r.ok ? r.json() : { users: [], songs: [] }))
        .then((j) => setRemote({ q: term, users: j.users || [], songs: j.songs || [] }))
        .catch(() => {});
    }, 250);
    return () => { clearTimeout(id); ac.abort(); };
  }, [q]);
  const users = remote.q === q.trim() ? remote.users : [], upSongs = remote.q === q.trim() ? remote.songs : [];
  const total = results.length + upSongs.length;
  return (
    <div className="srd-search" role="dialog" aria-modal="true" aria-label="Search songs and profiles">
      <div className="srd-search-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="srd-search-sheet">
        <div className="srd-search-bar">
          <MagnifyingGlass size={20} weight="bold" aria-hidden="true" className="shrink-0 text-muted" />
          <input ref={inputRef} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search songs, artists or people…" aria-label="Search songs, artists or people" autoComplete="off" enterKeyHint="search"
            onKeyDown={(e) => { if (e.key === "Enter" && results[0]) location.href = `/song/${results[0].id}/`; }} />
          <button type="button" onClick={onClose} aria-label="Close search" className="srd-menu-close"><X size={18} weight="bold" aria-hidden="true" /></button>
        </div>
        {users.length > 0 && <>
          <p className="srd-search-sec">Profiles</p>
          <ul className="srd-search-list srd-search-users" data-testid="search-profiles">
            {users.map((u) => (
              <li key={u.username}>
                <a href={`/u/${u.username}`} onClick={(e) => { spaClick(e); if (e.defaultPrevented) onClose(); }} className="srd-search-row">
                  <Avatar user={u} size={44} className="!h-11 !w-11 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-1 text-[15px] font-semibold text-ink"><span className="truncate">{u.displayName}</span>{u.verified && <VerifiedBadge size={15} />}</span>
                    <span className="block truncate text-xs text-muted">@{u.username} · Profile</span>
                  </span>
                  <CaretRight size={16} weight="bold" aria-hidden="true" className="text-muted" />
                </a>
              </li>
            ))}
          </ul>
        </>}
        {q.trim() ? (total > 0 ? <p className="srd-search-count">{users.length > 0 ? "Songs · " : ""}{`${total} result${total === 1 ? "" : "s"}`}</p> : null) : <p className="srd-search-hint" style={{textAlign:"center",padding:"28px 16px",fontSize:"14px",opacity:.6}}>Type a song or artist name</p>}
        <ul className="srd-search-list">
          {results.map((t) => (
            <li key={t.id}>
              <a href={`/song/${t.id}/`} className="srd-search-row">
                <img src={t.thumb || t.cover || "/images/avatar.webp"} alt="" width="44" height="44" loading="lazy" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-ink">{t.title}</span>
                  <span className="flex min-w-0 items-center gap-1 text-xs text-muted"><span className="truncate">{t.artist || "SRD Masum"}</span>{t.verified !== false && <VerifiedBadge size={12} />}</span>
                </span>
                <CaretRight size={16} weight="bold" aria-hidden="true" className="text-muted" />
              </a>
            </li>
          ))}
          {upSongs.map((t) => (
            <li key={"u" + t.id}>
              <a href={`/u/${t.uploader?.username}`} onClick={(e) => { spaClick(e); if (e.defaultPrevented) onClose(); }} className="srd-search-row">
                <img src={t.cover || "/images/avatar.webp"} alt="" width="44" height="44" loading="lazy" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-ink">{t.title}</span>
                  <span className="flex min-w-0 items-center gap-1 text-xs text-muted"><span className="truncate">{t.uploader?.displayName}</span>{t.uploader?.verified && <VerifiedBadge size={12} />}</span>
                </span>
                <CaretRight size={16} weight="bold" aria-hidden="true" className="text-muted" />
              </a>
            </li>
          ))}
          {q.trim() && !total && !users.length && (q.trim().length < 2 || remote.q === q.trim()) && <li className="srd-search-empty">No results for “{q}”.</li>}
        </ul>
      </div>
    </div>
  );
}
