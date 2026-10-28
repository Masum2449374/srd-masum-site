import { useEffect, useState } from "react";
// Tiny shared auth store: one /api/auth/me fetch per page load, listeners notified on change.
let state = { user: undefined }; export const authInfo = { mail: true }; const subs = new Set();
const set = (u) => { state = { user: u }; subs.forEach((f) => f(u)); };
let loading = null;
export function loadMe() {
  if (!loading) loading = fetch("/api/auth/me", { credentials: "same-origin" }).then((r) => r.ok ? r.json() : { user: null }).then((d) => { authInfo.mail = d.mail !== false; set(d.user || null); }).catch(() => set(null));
  return loading;
}
export function useUser() {
  const [u, setU] = useState(state.user);
  useEffect(() => { subs.add(setU); loadMe(); return () => subs.delete(setU); }, []);
  return u;
}
export async function api(path, body) {
  const r = await fetch("/api/auth/" + path, { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body || {}) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Something went wrong. Please try again.");
  if ("user" in d) set(d.user);
  return d;
}
export async function signOut() { await api("logout").catch(() => {}); set(null); }
export const openAuth = (mode = "signin") => window.dispatchEvent(new CustomEvent("srd-auth", { detail: mode }));
export const initials = (n = "") => n.trim().split(/\s+/).slice(0, 2).map((w) => [...w][0] || "").join("").toUpperCase() || "?";
export const hueOf = (s = "") => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 210);
