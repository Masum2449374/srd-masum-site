// Adsterra Smartlink: opens in a NEW tab on a real user click/tap (also covers play buttons),
// at most once per SMARTLINK_INTERVAL_MIN per visitor. Never on /admin/ pages.
export const SMARTLINK_URL = "https://auctionr.org/4/1634ebe4a29898706c5e5062103a2477";
export const SMARTLINK_INTERVAL_MIN = 15; // minutes between opens — change this one number
const KEY = "srd-sl-last";
// The first click of each browser-tab session is left to the Adsterra Popunder, so one click never opens two tabs.
const FIRST = "srd-sl-first-click-done";

export function maybeOpenSmartlink() {
  try {
    if (location.pathname.startsWith("/admin")) return;
    if (!sessionStorage.getItem(FIRST)) { sessionStorage.setItem(FIRST, "1"); return; }
    const now = Date.now();
    const last = Number(localStorage.getItem(KEY) || 0);
    if (now - last < SMARTLINK_INTERVAL_MIN * 60e3) return;
    localStorage.setItem(KEY, String(now));
    window.open(SMARTLINK_URL, "_blank", "noopener,noreferrer");
  } catch {}
}

export function installSmartlink() {
  // Capture phase so it runs inside the genuine user gesture (popup blockers allow it).
  document.addEventListener("click", (e) => { if (e.isTrusted) maybeOpenSmartlink(); }, true);
}
