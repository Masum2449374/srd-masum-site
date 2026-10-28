import { useEffect, useState } from "react";
import { MusicNotes, PencilSimple } from "@phosphor-icons/react";
import { useUser, hueOf } from "../lib/auth.js";
import { dominantColor } from "../lib/image.js";
import Avatar from "./Avatar.jsx";
import ProfileEditModal from "./ProfileEditModal.jsx";

export default function ProfilePage({ username, edit = false }) {
  const me = useUser();
  const [d, setD] = useState(null), [nf, setNf] = useState(false), [rgb, setRgb] = useState(null), [editing, setEditing] = useState(edit), [rev, setRev] = useState(0);
  useEffect(() => {
    fetch(`/api/auth/profile/${encodeURIComponent(username)}`, { cache: "no-store" }).then((r) => r.ok ? r.json() : Promise.reject()).then(setD).catch(() => setNf(true));
  }, [username, me?.bio, me?.displayName, me?.avatar, rev]);
  useEffect(() => { if (d?.user) document.title = `${d.user.displayName} (@${d.user.username}) · SRD Masum`; }, [d]);
  useEffect(() => { setRgb(null); if (d?.user?.avatar) dominantColor(d.user.avatar).then(setRgb); }, [d?.user?.avatar]);
  if (nf) return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32 text-center sm:pt-40">
      <h1 className="font-display text-3xl tracking-display text-ink">Profile not found</h1>
      <p className="mt-3 text-muted">There's no SRD Masum member called @{username}.</p>
      <a href="/" className="pro-btn mt-8 inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent">Back to home</a>
    </div>
  );
  const u = d?.user, mine = me && u && me.username === u.username, n = d?.songCount ?? 0;
  const joined = u && new Date(u.joined).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const h = hueOf(username), c = rgb ? `rgb(${rgb})` : `hsl(${h} 45% 38%)`, ca = (a) => (rgb ? `rgba(${rgb}, ${a})` : `hsl(${h} 45% 38% / ${a})`);
  return (
    <div className="pb-24">
      <header className="srd-prof-band pt-28 sm:pt-36" style={{ background: `linear-gradient(180deg, ${c} 0%, ${ca(0.75)} 55%, ${ca(0.35)} 100%)` }}>
        <div className="relative z-[1] mx-auto flex max-w-5xl flex-col items-center gap-5 px-5 pb-8 text-center sm:flex-row sm:items-end sm:gap-8 sm:px-8 sm:text-left">
          {u ? <button type="button" disabled={!mine} onClick={() => setEditing(true)} aria-label={mine ? "Edit profile photo" : undefined} className="group relative shrink-0 rounded-full shadow-[0_8px_40px_rgba(0,0,0,.5)] disabled:cursor-default">
            <Avatar user={u} size={232} className="!h-[168px] !w-[168px] !text-6xl sm:!h-[232px] sm:!w-[232px]" />
            {mine && <span className="absolute inset-0 hidden flex-col items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 sm:flex"><PencilSimple size={44} /><span className="mt-1 text-sm font-semibold">Choose photo</span></span>}
          </button> : <span className="h-[168px] w-[168px] animate-pulse rounded-full bg-black/20 sm:h-[232px] sm:w-[232px]" />}
          <div className="min-w-0 flex-1 text-white">
            <p className="text-sm font-semibold">Profile</p>
            <h1 className="mt-1 break-words font-display text-[2.6rem] font-black leading-[1.02] tracking-tight drop-shadow-sm sm:text-7xl lg:text-8xl">
              {mine ? <button type="button" onClick={() => setEditing(true)} className="text-left hover:underline">{u.displayName}</button> : u?.displayName || "\u00a0"}</h1>
            {u && <p className="mt-3 text-sm font-medium text-white/85">@{u.username} <span aria-hidden="true">·</span> Joined {joined} <span aria-hidden="true">·</span> {n} {n === 1 ? "song" : "songs"}</p>}
          </div>
        </div>
      </header>
      <div style={{ background: `linear-gradient(180deg, ${ca(0.22)}, transparent 220px)` }}>
        <div className="mx-auto max-w-5xl px-5 pt-6 sm:px-8">
          {mine && <button type="button" onClick={() => setEditing(true)} className="srd-search-btn pro-btn text-ink"><PencilSimple size={16} weight="bold" />Edit profile</button>}
          {u && (u.bio || mine) && <p className={`mt-6 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed ${u.bio ? "text-ink/85" : "text-faint"}`}>{u.bio || "Add a short bio so listeners know who you are."}</p>}
          <section className="mt-10">
            <h2 className="font-display text-2xl font-bold tracking-display text-ink">Songs</h2>
            {n ? null : (
              <div className="mt-4 flex flex-col items-center rounded-2xl bg-sunk/60 px-6 py-14 text-center ring-1 ring-hairline">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-raised text-muted shadow-lg ring-1 ring-hairline"><MusicNotes size={28} /></span>
                <p className="mt-5 text-lg font-bold text-ink">{mine ? "Your songs will live here" : "No songs yet"}</p>
                <p className="mt-1 max-w-sm text-sm text-muted">{mine ? "Song uploads are coming soon. Your releases will show up on this page for everyone to hear." : `When ${u?.displayName || "this member"} releases songs, they'll appear here.`}</p>
              </div>
            )}
          </section>
        </div>
      </div>
      {editing && mine && <ProfileEditModal user={me} onClose={() => { setEditing(false); setRev((r) => r + 1); }} />}
    </div>
  );
}
