import { AUDIO_TRACKS } from "../data/songs.js";
import { BANGLA_TRACKS } from "../data/bangla-songs.js";
import { ENGLISH_ALL } from "../data/english-songs.js";

export const SITE_URL = "https://srdmasum.bbroot.com";

// Canonical share link: a static page with its own link preview (built by scripts/song-pages.mjs).
export const songUrl = (track) => `${SITE_URL}/song/${encodeURIComponent(track.id)}/`;

// Finds the song a shared link points to: /song/<id>/, ?song=<id> or #song-<id>.
export function songFromUrl() {
  if (typeof window === "undefined") return null;
  const { pathname, search, hash } = window.location;
  const id =
    pathname.match(/^\/song\/([^/]+)\/?$/)?.[1] ||
    new URLSearchParams(search).get("song") ||
    hash.match(/^#song-(.+)$/)?.[1];
  if (!id) return null;
  const key = decodeURIComponent(id);
  for (const list of [AUDIO_TRACKS, BANGLA_TRACKS, ENGLISH_ALL]) {
    const track = list.find((t) => t.id === key);
    if (track) return { track, list };
  }
  return null;
}
