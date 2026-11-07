import { useEffect, useState } from "react";
import {
  APP_ROUTE_RE,
  internalDestination,
  canHandleLink,
} from "./navigation-core.js";
export const SPA_RE = APP_ROUTE_RE;
const scrolls = new Map();
const key = () => location.pathname + location.search + location.hash;
const route = () => location.pathname + location.search;
function restoreScroll(y = 0, hash = location.hash) {
  let frames = 0;
  const apply = () => {
    let id = hash && hash.slice(1);
    try {
      id = decodeURIComponent(id || "");
    } catch {}
    const el = id && document.getElementById(id);
    if (id && !el && frames++ < 20) {
      requestAnimationFrame(apply);
      return;
    }
    if (el) el.scrollIntoView({ block: "start", behavior: "instant" });
    else scrollTo(0, y);
  };
  requestAnimationFrame(() => requestAnimationFrame(apply));
}
export function navigate(href, { replace = false } = {}) {
  const url = internalDestination(href, location.href);
  if (!url) return false;
  scrolls.set(key(), scrollY);
  const next = url.pathname + url.search + url.hash;
  if (next !== key() || replace) {
    const state = { srdSpa: 1 };
    replace
      ? history.replaceState(state, "", next)
      : history.pushState(state, "", next);
  }
  window.dispatchEvent(new Event("srd-nav"));
  restoreScroll(0, url.hash);
  return true;
}
export const spaClick = (event, options) => {
  const url = canHandleLink(event, event.currentTarget, location.href);
  if (!url) return;
  event.preventDefault();
  navigate(url.href, options);
};
export function installInternalNavigation() {
  const click = (event) => {
    const anchor = event.target.closest?.("a[href]");
    const url = canHandleLink(event, anchor, location.href);
    if (!url) return;
    event.preventDefault();
    navigate(url.href);
  };
  document.addEventListener("click", click);
  const previous = history.scrollRestoration;
  history.scrollRestoration = "manual";
  return () => {
    document.removeEventListener("click", click);
    history.scrollRestoration = previous;
  };
}
export function usePath() {
  const [path, setPath] = useState(route);
  useEffect(() => {
    const pop = () => {
      setPath(route());
      restoreScroll(scrolls.get(key()) || 0);
    };
    const nav = () => setPath(route());
    window.addEventListener("popstate", pop);
    window.addEventListener("srd-nav", nav);
    return () => {
      window.removeEventListener("popstate", pop);
      window.removeEventListener("srd-nav", nav);
    };
  }, []);
  return path;
}
