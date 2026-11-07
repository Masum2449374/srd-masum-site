// Section labels remain source metadata; sung lines retain their original indices.
// Breaks require explicit vocal-end evidence (or the first timed vocal for an intro).
// Never infer a musical break from a line's character count.
const GAP = 4;
export function parseLyrics(text, times, ends, duration) {
  const rows = [];
  let n = 0;
  for (const raw of String(text || "").split("\n")) {
    const line = raw.trim();
    if (!line) { rows.push({ kind: "gap" }); continue; }
    const label = /^\[(.+)\]$/.exec(line);
    if (label) { rows.push({ kind: "label", text: label[1] }); continue; }
    rows.push({ kind: "line", text: line, idx: n, t: Number.isFinite(times?.[n]) ? times[n] : null });
    n++;
  }
  if (!Array.isArray(times) || !times.length) return rows;
  const lines = rows.filter(r => r.kind === "line" && r.t != null);
  const out = [];
  const inst = (t, until) => ({ kind: "inst", t, until });
  if (lines[0]?.t >= 3) out.push(inst(0, lines[0].t));
  let k = 0;
  for (const r of rows) {
    out.push(r);
    if (r.kind !== "line" || r.t == null) continue;
    const next = lines[k + 1]?.t ?? (Number.isFinite(duration) && duration > r.t ? duration : Infinity);
    const end = ends?.[r.idx];
    const knownBreak = Number.isFinite(end) && end > r.t && end <= next && next - end > GAP && Number.isFinite(next);
    // Short rests retain the current line. Only a known long break replaces it.
    r.until = knownBreak ? end : next;
    if (knownBreak) out.push(inst(end, next));
    k++;
  }
  let seq = 0;
  for (const r of out) if ((r.kind === "line" || r.kind === "inst") && r.t != null) r.seq = seq++;
  return out;
}
// Half-open intervals: [start, until). Recompute from the clock for every seek,
// including backwards; no look-ahead, stale break state, or highlight past the end.
export function activeLine(rows, t) {
  if (!Number.isFinite(t) || t < 0) return -1;
  let active = -1;
  for (const r of rows) {
    if (r.seq != null && r.t <= t && (r.until == null || t < r.until)) active = r.seq;
  }
  return active;
}
