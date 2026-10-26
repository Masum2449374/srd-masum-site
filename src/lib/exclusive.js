// One-at-a-time playback across the site player, Spotify embeds and YouTube embeds.
// Each source registers a pause function; claim(id) pauses every other source.
const sources = new Map();
export function register(id, pause) {
  sources.set(id, pause);
  return () => { if (sources.get(id) === pause) sources.delete(id); };
}
export function claim(id) {
  for (const [k, pause] of sources) if (k !== id) { try { pause(); } catch {} }
  if (typeof window !== "undefined") window.__srdLastClaim = id;
}
if (typeof window !== "undefined") window.__srdExclusive = { sources, claim };

// Spotify iFrame API, loaded once on first need.
let apiPromise;
export function spotifyApi() {
  if (!apiPromise) apiPromise = new Promise((resolve) => {
    const prev = window.onSpotifyIframeApiReady;
    window.onSpotifyIframeApiReady = (api) => { prev?.(api); resolve(api); };
    const s = document.createElement("script");
    s.src = "https://open.spotify.com/embed/iframe-api/v1";
    s.async = true;
    document.body.appendChild(s);
  });
  return apiPromise;
}
