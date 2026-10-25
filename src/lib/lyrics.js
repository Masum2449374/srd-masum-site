// Parses a song's lyrics (plain text with [Section] labels) plus optional line times into rows.
export function parseLyrics(text, times) {
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
  return rows;
}
// Index of the active sung line for time `t` (last line whose start <= t), or -1.
export function activeLine(rows, t) {
  let a = -1;
  for (const r of rows) if (r.kind === "line" && r.t != null && r.t <= t + 0.15) a = r.idx;
  return a;
}
