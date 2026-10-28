import { useEffect, useState } from "react";
import { useUser, api, openAuth } from "../lib/auth.js";
import Avatar from "./Avatar.jsx";

export default function AccountPage() {
  const user = useUser();
  const [f, setF] = useState({ displayName: "", bio: "" }), [msg, setMsg] = useState(null), [busy, setBusy] = useState(false);
  useEffect(() => { if (user) setF({ displayName: user.displayName, bio: user.bio || "" }); }, [user?.username]);
  useEffect(() => { document.title = "Edit profile · SRD Masum"; }, []);
  if (user === undefined) return <div className="min-h-[60vh]" />;
  if (!user) return (
    <div className="mx-auto max-w-md px-5 pb-24 pt-32 text-center sm:pt-40">
      <h1 className="font-display text-3xl tracking-display text-ink">Sign in to edit your profile</h1>
      <button type="button" onClick={() => openAuth("signin")} className="pro-btn mt-8 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-on-accent">Sign in</button>
    </div>
  );
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try { await api("profile", f); setMsg({ ok: true, t: "Profile saved." }); } catch (x) { setMsg({ t: x.message }); } finally { setBusy(false); }
  };
  return (
    <div className="mx-auto max-w-xl px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Account</p>
      <h1 className="mt-3 font-display text-4xl tracking-display text-ink">Edit profile</h1>
      <form onSubmit={save} className="pro-card mt-8 space-y-5 rounded-3xl p-6 ring-1 ring-hairline sm:p-8">
        <div className="flex items-center gap-4">
          <Avatar user={{ ...user, displayName: f.displayName || user.displayName }} size={64} />
          <div className="min-w-0"><p className="truncate font-semibold text-ink">@{user.username}</p><p className="text-xs text-muted">Photo uploads are coming soon.</p></div>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Display name</span>
          <span className="srd-field"><input value={f.displayName} onChange={(e) => setF({ ...f, displayName: e.target.value })} maxLength={40} required /></span>
        </label>
        <label className="block">
          <span className="mb-1.5 flex justify-between text-xs font-semibold uppercase tracking-[0.14em] text-muted">Bio<span className="normal-case tracking-normal text-faint">{f.bio.length}/200</span></span>
          <span className="srd-field !items-start !py-3"><textarea rows={4} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value.slice(0, 200) })} maxLength={200} placeholder="Tell listeners about yourself" /></span>
        </label>
        {msg && <p role="status" className={`rounded-xl px-3 py-2 text-sm ring-1 ${msg.ok ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/30" : "bg-red-500/10 text-red-300 ring-red-400/30"}`}>{msg.t}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={busy} className="pro-btn rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-on-accent disabled:opacity-60">{busy ? "Saving…" : "Save changes"}</button>
          <a href={`/u/${user.username}`} className="srd-search-btn pro-btn !h-auto px-5 py-2.5 text-ink">View profile</a>
        </div>
      </form>
    </div>
  );
}
