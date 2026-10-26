import * as kotoLyrics from "./lyrics/koto-din-bhebechhi.js";
// Bangla songs shown in the "Bangla Songs" section (plays through the shared mini-player).
// To add a song: upload the full-quality mp3 to the srd-masum-songs repo and add one entry below.
// Optional: lyrics (text with [Section] labels) and lyricTimes (seconds per sung line) for synced lyrics.
// id must be unique, src is the jsDelivr URL, duration is in seconds (shown without loading the file).
export const BANGLA_TRACKS = [
  { id: "koto-din-bhebechhi-cover", artist: "SRD Masum", cover: "/covers/koto-din-bhebechhi.jpg", coverWebp: "/covers/koto-din-bhebechhi.webp", thumb: "/covers/koto-din-bhebechhi-96.jpg", artwork512: "/covers/koto-din-bhebechhi-512.jpg", title: "Koto Din Bhebechhi", src: "https://cdn.jsdelivr.net/gh/Masum2449374/srd-masum-songs@main/koto-din-bhebechhi-cover.mp3", duration: 214.83, lyrics: kotoLyrics.text, lyricTimes: kotoLyrics.times, lyricEnds: kotoLyrics.ends },
  { id: "ayna-nadir-khate-cover", artist: "SRD Masum", cover: "/covers/ayna-nadir-khate.jpg", coverWebp: "/covers/ayna-nadir-khate.webp", thumb: "/covers/ayna-nadir-khate-96.jpg", artwork512: "/covers/ayna-nadir-khate-512.jpg", title: "Ayna Nadir Khate", src: "https://cdn.jsdelivr.net/gh/Masum2449374/srd-masum-songs@main/ayna-nadir-khate-cover.mp3", duration: 243.33 },
];
