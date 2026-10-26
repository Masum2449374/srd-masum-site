// Parses a song's lyrics (plain text with [Section] labels) plus optional line start times
// into rows. With times, instrumental gaps (> GAP s without vocals) get a ♪ row, Spotify-style.
// ends[i] (optional) = when sung line i stops; otherwise estimated from its length.
const GAP = 4;
const estEnd = (start, text, next) => Math.min(next, start + Math.max(3, Math.min(9, text.length * 0.3)));

export function parseLyrics(text, times, ends, duration) {
  const rows = [];
  let n = 0;
  for (const raw of String(text || "").split("\n")) {
    const line = raw.trim();
    if (!line) { rows.push({ kind: "gap" }); continue; }
    const m = /^\[(.+)\]$/.exec(line);
    if (m) { rows.push({ kind: "label", text: m[1] }); continue; }
    rows.push({ kind: "line", text: line, idx: n, t: times && times[n] != null ? times[n] : null });
    n++;
  }
  if (!Array.isArray(times) || !times.length) return rows;
  const lines = rows.filter((r) => r.kind === "line" && r.t != null);
  const out = [];
  const inst = (t, until) => ({ kind: "inst", t, until });
  if (lines[0] && lines[0].t >= 3) out.push(inst(0, lines[0].t));
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    out.push(r);
    if (r.kind !== "line" || r.t == null) continue;
    const k = lines.indexOf(r);
    const next = lines[k + 1] ? lines[k + 1].t : duration || r.t + 10;
    const end = ends && ends[r.idx] != null ? ends[r.idx] : estEnd(r.t, r.text, next);
    if (next - end > GAP) out.push(inst(end, next));
  }
  // Number every timed row in order for highlighting.
  let seq = 0;
  for (const r of out) if ((r.kind === "line" || r.kind === "inst") && r.t != null) r.seq = seq++;
  return out;
}
// seq of the active timed row (last one whose start <= t), or -1.
export function activeLine(rows, t) {
  let a = -1;
  for (const r of rows) if (r.seq != null && r.t <= t + 0.15) a = r.seq;
  return a;
}
