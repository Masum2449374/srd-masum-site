// Pure routing policy, shared with regression tests. Never intercept ads or API URLs.
export const APP_ROUTE_RE =
  /^(?:\/|\/english\/?|\/playlists\/?|\/copyright\/?|\/account\/?|\/admin\/uploads\/?|\/(?:artist|u|song|playlist)\/[^/]+\/?)$/;
export function internalDestination(href, base) {
  if (typeof href !== "string" || !href) return null;
  try {
    const url = new URL(href, base);
    return url.origin === new URL(base).origin &&
      APP_ROUTE_RE.test(url.pathname)
      ? url
      : null;
  } catch {
    return null;
  }
}
export function canHandleLink(event, anchor, base) {
  if (
    !anchor ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    anchor.hasAttribute("download") ||
    (anchor.target && anchor.target !== "_self")
  )
    return null;
  return internalDestination(anchor.getAttribute("href"), base);
}
