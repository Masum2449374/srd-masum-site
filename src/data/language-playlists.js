import { AUDIO_TRACKS } from "./songs.js";
import { BANGLA_TRACKS } from "./bangla-songs.js";
import { ENGLISH_ALL } from "./english-songs.js";

// Explicit, reviewed identity-to-language mapping. Collection names/paths are NOT language evidence.
// Keep each recording in exactly one bucket; bilingual recordings are not duplicated in mono-language lists.
export const LANGUAGE_NAMES = {
  bn: "Bangla",
  en: "English",
  hi: "Hindi",
  ru: "Russian",
  es: "Spanish",
  pt: "Portuguese",
  pa: "Punjabi",
};
export const TRACK_LANGUAGES = {
  "koto-din-bhebechhi-cover": ["bn"],
  "tomar-jonno-mon-kandere": ["bn"],
  "laal-dupatta": ["hi"],
  "sladkaya-myata": ["ru"],
  "dekha-tenu-pehli-pehli": ["hi", "pa"],
  aashiqana: [],
  "danza-kuduro-ai-cover": ["es", "pt"],
  housewife: ["en"],
  "nicole-kidman": ["en"],
  "stop-the-wedding": ["en"],
  "aint-in-la": ["en"],
  "drop-dead": ["en"],
  "jenny-was-a-friend-of-mine": ["en"],
  "sweater-weather": ["en"],
  iris: ["en"],
  "patient-zero": ["en"],
  loser: ["en"],
  "choosin-texas": ["en"],
  earrings: ["en"],
  "man-i-need": ["en"],
  "billie-jean": ["en"],
  "the-cure": ["en"],
  "stupid-song": ["en"],
};
export const CATALOGUE = [...ENGLISH_ALL, ...AUDIO_TRACKS, ...BANGLA_TRACKS];
export function languagesFor(track) {
  return TRACK_LANGUAGES[track.id] || [];
}
export function languageLabel(track) {
  return (
    languagesFor(track)
      .map((code) => LANGUAGE_NAMES[code])
      .join(" + ") || "Language to confirm"
  );
}
export function languageBucket(track) {
  const codes = languagesFor(track);
  return codes.length > 1
    ? "multilingual"
    : codes.length
      ? Object.entries(LANGUAGE_NAMES)
          .find(([code]) => code === codes[0])?.[1]
          .toLowerCase()
      : "unclassified";
}
const definitions = [
  {
    slug: "bangla",
    title: "Bangla",
    subtitle: "A little closer to home.",
    tone: "mint",
    description:
      "Bangla songs from the existing collection, together in one listening session.",
  },
  {
    slug: "english",
    title: "English",
    subtitle: "Every word, a new feeling.",
    tone: "violet",
    description:
      "English-language recordings from the catalogue. The original English rotation remains available separately.",
  },
  {
    slug: "hindi",
    title: "Hindi",
    subtitle: "Melodies that stay.",
    tone: "rose",
    description:
      "Hindi-language recordings, without mixing in the Russian or bilingual songs.",
  },
  {
    slug: "russian",
    title: "Russian",
    subtitle: "A different kind of feeling.",
    tone: "ice",
    description: "The Russian-language recording currently in the collection.",
  },
  {
    slug: "multilingual",
    title: "Multilingual",
    subtitle: "More than one language. One feeling.",
    tone: "amber",
    description:
      "Songs with more than one language, each included once. Language combinations are shown beside each recording.",
  },
  {
    slug: "unclassified",
    title: "Language to confirm",
    subtitle: "The music stays. No guessing.",
    tone: "neutral",
    description:
      "Recordings whose language still needs confirmation. Kept available without assigning an unsupported language.",
  },
];
export const LANGUAGE_PLAYLISTS = definitions
  .map((def) => ({
    ...def,
    href: `/playlist/${def.slug}/`,
    tracks: CATALOGUE.filter((t) => languageBucket(t) === def.slug).map(
      (t) => ({ ...t, playlist: `language:${def.slug}` }),
    ),
  }))
  .filter((p) => p.tracks.length);
export const playlistBySlug = (slug) =>
  LANGUAGE_PLAYLISTS.find((p) => p.slug === slug);
