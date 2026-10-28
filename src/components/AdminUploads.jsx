import { useCallback, useEffect, useState } from "react";
import { Check, X, Trash, SignOut, LockKey } from "@phosphor-icons/react";

const post = (path, body) => fetch("/api/admin/" + path, { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body || {}) });
const TABS = [["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]];

export default function AdminUploads() {
  const [authed, setAuthed] = useState(null), [pass, setPass] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("pending"), [data, setData] = useState(null);
  useEffect(() => { document.title = "Uploads · Admin · SRD Masum"; fetch("/api/admin/me", { credentials: "same-origin", cache: "no-store" }).then((r) => setAuthed(r.ok)).catch(() => setAuthed(false)); }, []);
  const load = useCallback(() => { fetch(`/api/admin/uploads?status=${tab}`, { credentials: "same-origin", cache: "no-store" }).then((r) => { if (r.status === 401) { setAuthed(false); return null; } return r.json(); }).then((j) => j && setData(j)); }, [tab]);
  useEffect(() => { if (authed) load(); }, [authed, load]);
  const login = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    const r = await post("login", { passcode: pass }).catch(() => null); setBusy(false);
    if (r?.ok) { setPass(""); setAuthed(true); } else { const j = await r?.json().catch(() => ({})); setErr(j?.error || "Wrong passcode."); }
  };
  const act = async (s, action) => {
    let reason = "";
    if (action === "reject") { reason = prompt("Reason for rejecting (optional):", "") ?? null; if (reason === null) return; }
    if (action === "delete" && !confirm(`Delete "${s.title}" permanently?`)) return;
    const r = await post("review", { id: s.id, action, reason });
    if (r.ok) load(); else alert("Action failed.");
  };
  if (authed === null) return <div className="pt-40 text-center text-muted">Loading…</div>;
  if (!authed) return (
    <form onSubmit={login} className="mx-auto mt-28 max-w-sm px-5 sm:mt-36" data-testid="admin-login">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-raised ring-1 ring-hairline"><LockKey size={26} className="text-ink" /></span>
      <h1 className="mt-5 text-center font-display text-2xl font-bold tracking-display text-ink">Admin sign in</h1>
      <p className="mt-1 text-center text-sm text-muted">Enter the owner passcode to review uploads.</p>
      <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" placeholder="Owner passcode" className="srd-adm-input mt-6" autoFocus />
      {err && <p role="alert" className="srd-up-err mt-3">{err}</p>}
      <button type="submit" disabled={busy || !pass} className="srd-up-cta mt-4 w-full">{busy ? "Checking…" : "Sign in"}</button>
    </form>
  );
  const c = data?.counts || {};
  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-24 sm:px-8 sm:pt-28" data-testid="admin-page">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-display text-ink">Uploads</h1>
        <button type="button" onClick={async () => { await post("logout"); setAuthed(false); }} className="srd-search-btn pro-btn text-ink"><SignOut size={16} />Sign out</button>
      </div>
      <div className="srd-up-chips mt-5" role="tablist">
        {TABS.map(([k, l]) => <button key={k} type="button" role="tab" aria-pressed={tab === k} aria-selected={tab === k} onClick={() => { setData(null); setTab(k); }} className="srd-chip">{l}{c[k] ? ` · ${c[k]}` : ""}</button>)}
      </div>
      {!data ? <p className="mt-10 text-center text-muted">Loading…</p> : !data.songs.length ? <p className="mt-10 rounded-2xl bg-sunk/60 px-6 py-12 text-center text-muted ring-1 ring-hairline">No {tab} uploads.</p> : (
        <ul className="mt-5 space-y-4">
          {data.songs.map((s) => (
            <li key={s.id} className="srd-adm-card">
              <div className="flex gap-3">
                {s.cover ? <img src={s.cover} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" /> : <span className="srd-tl-art srd-tl-art-ph !h-20 !w-20 !text-2xl">♪</span>}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-ink">{s.title}</p>
                  <p className="truncate text-sm text-muted"><a className="srd-artist-link" href={`/u/${s.uploader?.username}`}>{s.uploader?.displayName} · @{s.uploader?.username}</a></p>
                  <p className="truncate text-xs text-faint">{s.uploader?.email} · {s.language} · {s.type} · {(s.size / 1048576).toFixed(1)} MB</p>
                  <p className="text-xs text-faint">{new Date(s.createdAt).toLocaleString("en-GB")}</p>
                </div>
              </div>
              <audio controls preload="none" src={s.audio} className="mt-3 w-full" />
              <p className="srd-adm-decl">✓ “{s.declaration || "I own this song or have the rights to publish it."}” · {s.declaredAt ? new Date(s.declaredAt).toLocaleString("en-GB") : ""} · IP #{s.ipHash}</p>
              {s.reason && <p className="mt-1 text-xs text-[#ff6b6b]">Reason: {s.reason}</p>}
              {s.lyrics && <details className="mt-2 text-sm text-muted"><summary className="cursor-pointer">Lyrics</summary><pre className="mt-2 whitespace-pre-wrap font-sans">{s.lyrics}</pre></details>}
              <div className="mt-3 flex flex-wrap gap-2">
                {s.status !== "approved" && <button type="button" onClick={() => act(s, "approve")} className="srd-adm-btn ok"><Check size={16} weight="bold" />Approve</button>}
                {s.status !== "rejected" && <button type="button" onClick={() => act(s, "reject")} className="srd-adm-btn"><X size={16} weight="bold" />Reject</button>}
                <button type="button" onClick={() => act(s, "delete")} className="srd-adm-btn bad"><Trash size={16} />Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
