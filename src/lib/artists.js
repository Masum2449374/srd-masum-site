import { AUDIO_TRACKS } from "../data/songs.js";
import { BANGLA_TRACKS } from "../data/bangla-songs.js";
import { ENGLISH_ALL } from "../data/english-songs.js";

export const artistOf = (t) => (t && t.artist) || "SRD Masum";
export const slugify = (s) => String(s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "artist";
const CATALOG = (() => { const seen = new Set(); return [...AUDIO_TRACKS, ...BANGLA_TRACKS, ...ENGLISH_ALL].filter((t) => t && t.id && !seen.has(t.id) && seen.add(t.id)); })();
export function artistBySlug(slug) {
  const tracks = CATALOG.filter((t) => slugify(artistOf(t)) === slug);
  if (!tracks.length) return null;
  const sorted = [...tracks].sort((a, b) => String(b.released || "").localeCompare(String(a.released || "")));
  return { name: artistOf(tracks[0]), slug, tracks, cover: sorted.find((t) => t.cover)?.cover || null };
}
// Where an artist name should link: uploaded songs -> uploader profile; catalog songs -> /artist/<slug>/.
export const artistHref = (t) => (t?.uploader?.username ? `/u/${t.uploader.username}` : `/artist/${slugify(artistOf(t))}/`);
// Built-in catalog artists are verified (set verified:false on a track to opt out); uploads use the owner-set account flag.
export const isVerified = (t) => (t?.uploader ? !!t.uploader.verified : t?.verified !== false);
