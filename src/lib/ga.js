// GA4 helpers. gtag is loaded async from index.html (skipped on /admin). No message text or personal data is sent.
const on = () => typeof window !== "undefined" && typeof window.gtag === "function" && !location.pathname.startsWith("/admin");
export function gaEvent(name, params = {}) { try { if (on()) window.gtag("event", name, params); } catch {} }
let last = typeof location !== "undefined" ? location.pathname : "";
function pv() {
  const p = location.pathname; if (p === last) return; last = p; // NowPlaying back-button popstate keeps the path: no extra view
  gaEvent("page_view", { page_path: p, page_location: location.href, page_title: document.title });
}
if (typeof window !== "undefined") { addEventListener("srd-nav", () => setTimeout(pv, 0)); addEventListener("popstate", () => setTimeout(pv, 0)); }
