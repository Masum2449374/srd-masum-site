// Date-based seasonal decoration, computed client-side in Asia/Dhaka.
// Halloween: Oct 25–31. Christmas: Dec 1 – Jan 6. Override: ?season=halloween|christmas|off
export function currentSeason(now = new Date()) {
  try {
    const q = new URLSearchParams(location.search).get("season");
    if (q === "off") return null;
    if (q === "halloween" || q === "christmas") return q;
  } catch { /* ignore */ }
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka", month: "numeric", day: "numeric" }).formatToParts(now);
  const m = Number(parts.find((p) => p.type === "month").value);
  const d = Number(parts.find((p) => p.type === "day").value);
  if (m === 10 && d >= 25) return "halloween";
  if (m === 12 || (m === 1 && d <= 6)) return "christmas";
  return null;
}
