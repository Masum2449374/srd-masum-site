import VerifiedBadge from "./VerifiedBadge.jsx";
import { useCallback, useEffect, useState } from "react";
import { Check, X, Trash, SignOut, LockKey } from "@phosphor-icons/react";

const post = (path, body) => fetch("/api/admin/" + path, { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body || {}) });
const TABS = [["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"], ["users", "Users"]];

export default function AdminUploads() {
  const [authed, setAuthed] = useState(null), [pass, setPass] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("pending"), [data, setData] = useState(null);
  useEffect(() => { document.title = "Uploads · Admin · SRD Masum"; fetch("/api/admin/me", { credentials: "same-origin", cache: "no-store" }).then((r) => setAuthed(r.ok)).catch(() => setAuthed(false)); }, []);
  const load = useCallback(() => { if (tab === "users") return; fetch(`/api/admin/uploads?status=${tab}`, { credentials: "same-origin", cache: "no-store" }).then((r) => { if (r.status === 401) { setAuthed(false); return null; } return r.json(); }).then((j) => j && setData(j)); }, [tab]);
  useEffect(() => { if (authed) load(); }, [authed, load]);
  const login = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    const r = await post("login", { passcode: pass }).catch(() => null); setBusy(false);
    if (r?.ok) { setPass(""); setAuthed(true); } else { const j = await r?.json().catch(() => ({})); setErr(j?.error || "Wrong passcode."); }
  };
  const [dlg, setDlg] = useState(null), [reasonTxt, setReasonTxt] = useState(""), [note, setNote] = useState("");
  const EMAIL_MSG = { sent: "Email sent to the uploader.", failed: "Email could not be sent (action still saved).", "skipped: email not verified": "No email sent: uploader's email isn't verified.", "skipped: no email": "No email sent: uploader has no email." };
  const send = async (s, action, reason = "") => {
    setNote("");
    const r = await post("review", { id: s.id, action, reason });
    const j = r.ok ? await r.json().catch(() => ({})) : null;
    if (!r.ok) { alert("Action failed."); return; }
    const verb = action === "approve" ? "Approved" : action === "reject" ? "Rejected" : "Deleted";
    setNote(`${verb} “${s.title}”. ${EMAIL_MSG[j.email] || "No email sent."}`);
    load();
  };
  const act = (s, action) => {
    if (action === "approve") return send(s, "approve");
    if (action === "delete" && s.status !== "approved") { if (confirm(`Delete "${s.title}" permanently?`)) send(s, "delete"); return; }
    setReasonTxt(""); setDlg({ s, action });
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
      <PlaysTable />
      <MiraTable />
      {note && <p role="status" data-testid="admin-note" className="mb-4 rounded-xl bg-sunk/70 px-4 py-3 text-sm text-ink ring-1 ring-hairline">{note}</p>}
      {dlg && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="rj-title" onClick={() => setDlg(null)}>
          <form className="w-full max-w-md rounded-2xl bg-raised p-5 ring-1 ring-hairline" onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); const d = dlg; setDlg(null); send(d.s, d.action, reasonTxt.trim()); }}>
            <h2 id="rj-title" className="font-display text-lg font-bold text-ink">{dlg.action === "reject" ? "Reject" : "Delete"} “{dlg.s.title}”</h2>
            <label htmlFor="rj-reason" className="mt-4 block text-sm font-semibold text-ink">Reason {dlg.action === "delete" && <span className="font-normal text-muted">(optional)</span>}</label>
            <p className="mt-1 text-xs text-muted">{dlg.action === "reject" ? "This is emailed to the uploader so they know what to fix. Be clear and kind." : "If you add a reason, the uploader is emailed that their song was removed. Leave empty to delete silently."}</p>
            <textarea id="rj-reason" autoFocus rows={4} maxLength={300} value={reasonTxt} onChange={(e) => setReasonTxt(e.target.value)}
              placeholder={dlg.action === "reject" ? "e.g. This song appears to be someone else's copyrighted recording. Please upload only music you own." : "e.g. Copyright claim received from the label."}
              className="mt-2 w-full resize-y rounded-xl bg-sunk/70 px-3 py-2.5 text-sm text-ink ring-1 ring-hairline outline-none focus:ring-2 focus:ring-[#3D91F4]" />
            <p className="mt-1 text-right text-[11px] text-muted">{reasonTxt.length}/300</p>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setDlg(null)} className="srd-adm-btn">Cancel</button>
              <button type="submit" className="srd-adm-btn bad">{dlg.action === "reject" ? "Reject & notify" : reasonTxt.trim() ? "Delete & notify" : "Delete"}</button>
            </div>
          </form>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-display text-ink">Uploads</h1>
        <button type="button" onClick={async () => { await post("logout"); setAuthed(false); }} className="srd-search-btn pro-btn text-ink"><SignOut size={16} />Sign out</button>
      </div>
      <div className="srd-up-chips mt-5" role="tablist">
        {TABS.map(([k, l]) => <button key={k} type="button" role="tab" aria-pressed={tab === k} aria-selected={tab === k} onClick={() => { setData(null); setTab(k); }} className="srd-chip">{l}{c[k] ? ` · ${c[k]}` : ""}</button>)}
      </div>
      {tab === "users" ? <UsersPanel onUnauth={() => setAuthed(false)} /> : !data ? <p className="mt-10 text-center text-muted">Loading…</p> : !data.songs.length ? <p className="mt-10 rounded-2xl bg-sunk/60 px-6 py-12 text-center text-muted ring-1 ring-hairline">No {tab} uploads.</p> : (
        <ul className="mt-5 space-y-4">
          {data.songs.map((s) => (
            <li key={s.id} className="srd-adm-card">
              <div className="flex gap-3">
                {s.cover ? <img src={s.cover} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" /> : <span className="srd-tl-art srd-tl-art-ph !h-20 !w-20 !text-2xl">♪</span>}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-ink">{s.title}</p>
                  <p className="truncate text-sm text-muted"><a className="srd-artist-link" href={`/u/${s.uploader?.username}`}>{s.uploader?.displayName} · @{s.uploader?.username}</a></p>
                  <p className="truncate text-xs text-faint">{s.uploader?.email} · {s.language} · {s.type} · {(s.size / 1048576).toFixed(1)} MB</p>
                  <p className="text-xs text-faint">{new Date(s.createdAt).toLocaleString("en-US")}</p>
                </div>
              </div>
              <audio controls preload="none" src={s.audio} className="mt-3 w-full" />
              <p className="srd-adm-decl">✓ “{s.declaration || "I own this song or have the rights to publish it."}” · {s.declaredAt ? new Date(s.declaredAt).toLocaleString("en-US") : ""} · IP #{s.ipHash}</p>
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

function UsersPanel({ onUnauth }) {
  const [q, setQ] = useState(""), [users, setUsers] = useState(null), [msg, setMsg] = useState(""), [busy, setBusy] = useState("");
  const load = useCallback((qq) => {
    fetch(`/api/admin/users?q=${encodeURIComponent(qq || "")}`, { credentials: "same-origin", cache: "no-store" })
      .then((r) => { if (r.status === 401) { onUnauth(); return null; } return r.json(); }).then((j) => j && setUsers(j.users || []));
  }, [onUnauth]);
  useEffect(() => { const id = setTimeout(() => load(q.trim()), 250); return () => clearTimeout(id); }, [q, load]);
  const toggle = async (u) => {
    setBusy(u.username); setMsg("");
    const r = await post("verify", { username: u.username, verified: !u.verified }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setBusy("");
    if (!r || !r.ok) { if (r?.status === 401) onUnauth(); setMsg(j.error || "Could not update."); return; }
    setUsers((list) => list.map((x) => (x.username === u.username ? { ...x, verified: j.verified } : x)));
    setMsg(`@${u.username} is now ${j.verified ? "verified" : "not verified"}.`);
  };
  return (
    <div className="mt-6">
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by username or name" aria-label="Search users"
        className="w-full rounded-full bg-sunk/60 px-4 py-2.5 text-ink ring-1 ring-hairline outline-none focus:ring-2" />
      {msg && <p className="mt-3 text-sm text-muted" role="status">{msg}</p>}
      {!users ? <p className="mt-10 text-center text-muted">Loading…</p> : !users.length ? <p className="mt-10 text-center text-muted">No users found.</p> : (
        <ul className="mt-4 divide-y divide-hairline">
          {users.map((u) => (
            <li key={u.username} className="flex items-center gap-3 py-3">
              {u.avatar ? <img src={u.avatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-sunk text-muted">{(u.displayName || u.username || "?")[0]}</span>}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 font-semibold text-ink"><span className="truncate">{u.displayName}</span>{u.verified && <VerifiedBadge size={14} />}</p>
                <p className="truncate text-xs text-muted">@{u.username}{u.emailVerified ? "" : " · email not confirmed"}</p>
              </div>
              <button type="button" disabled={busy === u.username} onClick={() => toggle(u)} aria-pressed={u.verified}
                className={`srd-chip ${u.verified ? "" : "!bg-[#1d9bf0] !text-white"}`}>{u.verified ? "Unverify" : "Verify"}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PlaysTable() {
  const [rows, setRows] = useState(null);
  useEffect(() => { fetch("/api/admin/plays", { credentials: "same-origin", cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((j) => setRows(j?.plays || [])).catch(() => setRows([])); }, []);
  if (!rows) return null;
  return (
    <section className="mb-8" data-testid="admin-plays">
      <h2 className="font-display text-xl font-bold text-ink">Song plays</h2>
      <p className="mt-1 text-xs text-muted">Counted after 3s of playback; every play counts; bots ignored.</p>
      {rows.length ? (
        <table className="mt-3 w-full text-sm"><thead><tr className="text-left text-muted"><th className="py-1">Song</th><th className="py-1 text-right">Plays</th><th className="py-1 text-right">Unique listeners</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.slug} className="border-t border-hairline"><td className="py-1.5 text-ink">{r.slug}</td><td className="py-1.5 text-right tabular-nums">{r.n}</td><td className="py-1.5 text-right tabular-nums">{r.listeners}</td></tr>)}</tbody></table>
      ) : <p className="mt-3 text-sm text-muted">No plays counted yet.</p>}
    </section>
  );
}

function MiraTable() {
  const [rows, setRows] = useState(null);
  useEffect(() => { fetch("/api/admin/mira", { credentials: "same-origin", cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((j) => setRows(j?.rows || [])).catch(() => setRows([])); }, []);
  if (!rows) return null;
  const T = ["song request", "lyrics", "about site", "other"], days = {};
  for (const r of rows) { const d = (days[r.day] ||= { m: 0, c: 0 }); d.m += r.messages; d.c += r.conversations; d[r.topic] = (d[r.topic] || 0) + r.messages; }
  const list = Object.entries(days).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  const tot = list.reduce((a, [, d]) => { a.m += d.m; a.c += d.c; T.forEach((t) => (a[t] = (a[t] || 0) + (d[t] || 0))); return a; }, { m: 0, c: 0 });
  const td = "py-1.5 text-right tabular-nums";
  return (
    <section className="mb-8" data-testid="admin-mira">
      <h2 className="font-display text-xl font-bold text-ink">Mira usage</h2>
      <p className="mt-1 text-xs text-muted">Last 14 days (Dhaka time). Counts and topic tags only; no message text or IPs stored. Bots and owner chats ignored.</p>
      {list.length ? (
        <div className="overflow-x-auto"><table className="mt-3 w-full text-sm"><thead><tr className="text-left text-muted"><th className="py-1">Day</th><th className="py-1 text-right">Chats</th><th className="py-1 text-right">Msgs</th>{T.map((t) => <th key={t} className="py-1 text-right capitalize">{t}</th>)}</tr></thead>
          <tbody>{list.map(([day, d]) => <tr key={day} className="border-t border-hairline"><td className="py-1.5 text-ink">{day}</td><td className={td}>{d.c}</td><td className={td}>{d.m}</td>{T.map((t) => <td key={t} className={td}>{d[t] || 0}</td>)}</tr>)}
            <tr className="border-t border-hairline font-semibold"><td className="py-1.5 text-ink">Total</td><td className={td}>{tot.c}</td><td className={td}>{tot.m}</td>{T.map((t) => <td key={t} className={td}>{tot[t]}</td>)}</tr></tbody></table></div>
      ) : <p className="mt-3 text-sm text-muted">No Mira chats counted yet.</p>}
    </section>
  );
}
