// Builds dist/chat-context.txt: the facts the /api/chat assistant may use (no lyrics, ever).
import { writeFileSync, existsSync } from "node:fs";
import { AUDIO_TRACKS } from "../src/data/songs.js";
import { BANGLA_TRACKS } from "../src/data/bangla-songs.js";
import { ENGLISH_ALL } from "../src/data/english-songs.js";
import { SPOTIFY_TRACKS } from "../src/data/spotify.js";
import * as V from "../src/data/videos.js";
const SITE = "https://srdmasum.bbroot.com";
const line = (t, sec) => {
  const page = existsSync(`dist/song/${t.id}`) ? `${SITE}/song/${t.id}/` : "";
  return `- [${sec}] "${t.title}" ${!t.artist || t.artist === "SRD Masum" ? "released by SRD Masum (platform/label)" : `by ${t.artist}`}` +
    (t.album ? ` | album: ${t.album}` : "") + (t.writers ? ` | writers: ${t.writers}` : "") +
    (t.label ? ` | label: ${t.label}` : "") + (t.released ? ` | released: ${t.released}` : "") +
    (page ? ` | page: ${page}` : "") + (t.spotifyUrl ? ` | Spotify: ${t.spotifyUrl}` : "") +
    (t.youtubeUrl ? ` | YouTube: ${t.youtubeUrl}` : "");
};
const socials = Object.entries(V.SOCIAL_LINKS).filter(([, u]) => u && u !== "#").map(([k, u]) => `${k}: ${u}`).join(" | ");
const txt = [
  `Site: SRD Masum (${SITE}) — official site of SRD Masum, a music platform / company (label). Founder & CEO: Masum Bellah. SRD Masum is not an individual artist. Visitors can stream songs in the built-in player (Hindi, Bangla and English playlists), watch videos, read fan reviews, leave fan-wall messages and install the site as an app (Android app also available).`,
  `SRD Masum on Spotify: ${V.SPOTIFY_ARTIST_URL}`,
  `YouTube channel: ${V.CHANNEL_URL}`,
  `Featured YouTube playlist: https://www.youtube.com/playlist?list=${V.FEATURED_PLAYLIST_ID}`,
  `Contact email: ${V.CONTACT_EMAIL}`,
  `Socials: ${socials}`,
  `Songs on the site (artist shown is the credited performer; covers credit the original artists):`,
  ...AUDIO_TRACKS.map((t) => line(t, "Hindi")),
  ...BANGLA_TRACKS.map((t) => line(t, "Bangla")),
  ...ENGLISH_ALL.map((t) => line(t, "English")),
  `SRD Masum Spotify releases embedded on the site: ${SPOTIFY_TRACKS.map((t) => `"${t.title}" (https://open.spotify.com/track/${t.id})`).join(", ")}`,
].join("\n");
writeFileSync("dist/chat-context.txt", txt);
console.log("chat context:", txt.length, "chars");
