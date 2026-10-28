import { useEffect, useState } from "react";
// Tiny in-app router for artist/profile pages so the single <audio> element (in PlayerProvider) keeps playing.
export const SPA_RE = /^\/(artist|u)\/[^/]+\/?$/;
const scrolls = {};
export function navigate(href, { replace = false } = {}) {
  const u = new URL(href, location.href);
  if (u.origin !== location.origin || !SPA_RE.test(u.pathname)) { location.href = u.href; return; }
  scrolls[location.pathname] = scrollY;
  const st = { srdSpa: 1 };
  replace ? history.replaceState(st, "", u.pathname) : history.pushState(st, "", u.pathname);
  window.dispatchEvent(new Event("srd-nav"));
  scrollTo(0, 0);
}
// Click handler for <a>: in-app navigate on plain left-clicks.
export const spaClick = (e, opts) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const href = e.currentTarget.getAttribute("href");
  if (!href || !SPA_RE.test(new URL(href, location.href).pathname)) return;
  e.preventDefault(); navigate(href, opts);
};
export function usePath() {
  const [p, setP] = useState(() => location.pathname);
  useEffect(() => {
    const on = () => { const np = location.pathname; setP(np); const y = scrolls[np]; requestAnimationFrame(() => scrollTo(0, y || 0)); };
    const onNav = () => setP(location.pathname);
    addEventListener("popstate", on); addEventListener("srd-nav", onNav);
    return () => { removeEventListener("popstate", on); removeEventListener("srd-nav", onNav); };
  }, []);
  return p;
}
