import { useEffect, useState } from "react";
import { CalendarBlank, MusicNotes, PencilSimple } from "@phosphor-icons/react";
import { useUser } from "../lib/auth.js";
import Avatar from "./Avatar.jsx";

export default function ProfilePage({ username }) {
  const me = useUser();
  const [d, setD] = useState(null), [nf, setNf] = useState(false);
  useEffect(() => {
    fetch(`/api/auth/profile/${encodeURIComponent(username)}`).then((r) => r.ok ? r.json() : Promise.reject()).then(setD).catch(() => setNf(true));
  }, [username, me?.bio, me?.displayName]);
  useEffect(() => { if (d?.user) document.title = `${d.user.displayName} (@${d.user.username}) · SRD Masum`; }, [d]);
  if (nf) return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32 text-center sm:pt-40">
      <h1 className="font-display text-3xl tracking-display text-ink">Profile not found</h1>
      <p className="mt-3 text-muted">There's no SRD Masum member called @{username}.</p>
      <a href="/" className="pro-btn mt-8 inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent">Back to home</a>
    </div>
  );
  const u = d?.user, mine = me && u && me.username === u.username;
  const joined = u && new Date(u.joined).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <section className="pro-card relative overflow-hidden rounded-3xl p-6 ring-1 ring-hairline backdrop-blur sm:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[120%] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex flex-col items-center text-center sm:flex-row sm:items-end sm:gap-7 sm:text-left">
          {u ? <Avatar user={u} size={112} className="text-4xl shadow-2xl" /> : <span className="h-28 w-28 animate-pulse rounded-full bg-sunk" />}
          <div className="mt-5 min-w-0 flex-1 sm:mt-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Member</p>
            <h1 className="mt-2 break-words font-display text-3xl leading-tight tracking-display text-ink sm:text-5xl">{u?.displayName || "\u00a0"}</h1>
            <p className="mt-1 text-muted">{u ? "@" + u.username : "\u00a0"}</p>
          </div>
          {mine && <a href="/account/" className="srd-search-btn pro-btn mt-5 text-ink sm:mt-0"><PencilSimple size={16} weight="bold" />Edit profile</a>}
        </div>
        {u && <p className="relative mt-6 whitespace-pre-line text-[15px] leading-relaxed text-muted">{u.bio || (mine ? "Add a short bio so listeners know who you are." : "")}</p>}
        {u && <p className="relative mt-5 inline-flex items-center gap-2 text-sm text-faint"><CalendarBlank size={16} />Joined {joined}</p>}
      </section>
      <section className="mt-8">
        <h2 className="font-display text-2xl tracking-display text-ink">Songs</h2>
        {d?.songs?.length ? null : (
          <div className="pro-card mt-4 flex flex-col items-center rounded-2xl px-6 py-12 text-center ring-1 ring-hairline">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent ring-1 ring-accent/30"><MusicNotes size={22} /></span>
            <p className="mt-4 font-semibold text-ink">No songs yet</p>
            <p className="mt-1 text-sm text-muted">{mine ? "Song uploads are coming soon." : "Songs from this member will appear here."}</p>
          </div>
        )}
      </section>
    </div>
  );
}
