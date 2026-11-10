import { AUDIO_TRACKS } from "../data/songs.js";
import { BANGLA_TRACKS } from "../data/bangla-songs.js";
import { ENGLISH_ALL } from "../data/english-songs.js";

export const artistOf = (t) => (t && t.artist) || "SRD Masum";
export const slugify = (s) => String(s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "artist";
const CATALOG = (() => { const seen = new Set(); return [...AUDIO_TRACKS, ...BANGLA_TRACKS, ...ENGLISH_ALL].filter((t) => t && t.id && !seen.has(t.id) && seen.add(t.id)); })();
// An artist is verified only when existing catalog data already treats at least one of their recordings as verified.
// A later per-track opt-out cannot hide that shared artist status, and unknown names stay unverified.
const VERIFIED_ARTISTS = new Set(CATALOG.filter((t) => !t.uploader && t.verified !== false).map((t) => artistOf(t)));
export const verifiedArtists = () => [...VERIFIED_ARTISTS];
export const isArtistVerified = (name) => VERIFIED_ARTISTS.has(String(name || ""));
export function artistBySlug(slug) {
  const tracks = CATALOG.filter((t) => slugify(artistOf(t)) === slug);
  if (!tracks.length) return null;
  const sorted = [...tracks].sort((a, b) => String(b.released || "").localeCompare(String(a.released || "")));
  return { name: artistOf(tracks[0]), slug, tracks: sorted, verified: isArtistVerified(artistOf(tracks[0])), cover: sorted.find((t) => t.cover)?.cover || null };
}
// Where an artist name should link: uploaded songs -> uploader profile; catalog songs -> /artist/<slug>/.
export const artistHref = (t) => (t?.uploader?.username ? `/u/${t.uploader.username}` : `/artist/${slugify(artistOf(t))}/`);
// Display follows the credited artist's existing site status, not an isolated per-track flag.
// Uploads stay on the owner-set account flag. This is not external-platform endorsement.
export const isVerified = (t) => {
  if (!t) return false;
  if (t.uploader) return !!t.uploader.verified;
  return isArtistVerified(artistOf(t));
};
