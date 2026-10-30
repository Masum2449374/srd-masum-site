// Real play counts: one batched GET /api/plays, shared by every list on the page.
import { useEffect, useState } from "react";
let data = null, inflight = null; const subs = new Set();
function load() {
  if (!inflight) inflight = fetch("/api/plays").then((r) => (r.ok ? r.json() : { plays: {} })).then((j) => { data = j.plays || {}; subs.forEach((f) => f(data)); }).catch(() => {});
  return inflight;
}
export function bumpLocal(id) { if (data) { data = { ...data, [id]: (data[id] || 0) + 1 }; subs.forEach((f) => f(data)); } }
export function usePlays() {
  const [p, setP] = useState(data);
  useEffect(() => { subs.add(setP); load(); return () => subs.delete(setP); }, []);
  return p;
}
export const fmtPlays = (n) => {
  n = Number(n) || 0;
  const s = n < 1000 ? String(n) : n < 1e6 ? (n / 1e3).toFixed(n < 1e4 ? 1 : 0).replace(/\.0$/, "") + "K" : (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  return `${s} ${n === 1 ? "play" : "plays"}`;
};
