// GA4 helpers. gtag is loaded async from index.html (skipped on /admin). No message text or personal data is sent.
// SPA page views: GA4 enhanced measurement ("page changes based on browser history events", on by default) already
// sends page_view on pushState/popstate URL changes, so we don't send our own (that would double count).
const on = () => typeof window !== "undefined" && typeof window.gtag === "function" && !location.pathname.startsWith("/admin");
export function gaEvent(name, params = {}) { try { if (on()) window.gtag("event", name, params); } catch {} }
