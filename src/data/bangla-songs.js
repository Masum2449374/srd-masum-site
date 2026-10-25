import * as kotoLyrics from "./lyrics/koto-din-bhebechhi.js";
// Bangla songs shown in the "Bangla Songs" section (plays through the shared mini-player).
// To add a song: upload the full-quality mp3 to the srd-masum-songs repo and add one entry below.
// Optional: lyrics (text with [Section] labels) and lyricTimes (seconds per sung line) for synced lyrics.
// id must be unique, src is the jsDelivr URL, duration is in seconds (shown without loading the file).
export const BANGLA_TRACKS = [
  { id: "koto-din-bhebechhi-cover", title: "Koto Din Bhebechhi", src: "https://cdn.jsdelivr.net/gh/Masum2449374/srd-masum-songs@main/koto-din-bhebechhi-cover.mp3", duration: 214.83, lyrics: kotoLyrics.text, lyricTimes: kotoLyrics.times },
  { id: "ayna-nadir-khate-cover", title: "Ayna Nadir Khate", src: "https://cdn.jsdelivr.net/gh/Masum2449374/srd-masum-songs@main/ayna-nadir-khate-cover.mp3", duration: 243.33 },
];
