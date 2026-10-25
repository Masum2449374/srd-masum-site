// Lyrics for "Koto Din Bhebechhi". Plain text keeps section labels ([Verse 1] etc.) as headers.
// `times` (seconds) aligns with the non-empty, non-label lines in order; omit it for unsynced lyrics.
export const text = `আহা... উম... ও...

[Verse 1]
কত দিন ভেবেছি শুধু দেখবো তোমায়,
চোখের পলকে বুকে জড়াবো তোমায়।
দূর থেকে চেয়ে চেয়ে কেটে গেছে বেলা,
মন বলে আর কত স্মৃতির এই খেলা?
তুমি ছাড়া এ মনে আর তো কেউ নেই,
আমার এই গল্পটা শুরু তোমাতেই।

[Chorus]
তুমি এলে জীবনে সব আঁধার কেটে যায়,
আমার এই ব্যাকুল মন তোমাকেই শুধু চায়।
কত দিন ভেবেছি শুধু দেখবো তোমায়,
ভালোবেসে নিজের করে রাখবো তোমায়।

[Verse 2]
নীরব রাতে যখন একা বসে থাকি,
স্বপ্নে এসে তুমি ছুঁয়ে দাও যে আঁখি।
হাতে হাত রেখে যদি পথ চলা যায়,
পৃথিবীর সব সুখ যেন মেলে যায়।
তুমি আমার আকাশের একলা ওই চাঁদ,
তোমায় ভেবেই কেটে যায় জাগরণী রাত।

[Chorus]
তুমি এলে জীবনে সব আঁধার কেটে যায়,
আমার এই ব্যাকুল মন তোমাকেই শুধু চায়।
কত দিন ভেবেছি শুধু দেখবো তোমায়,
ভালোবেসে নিজের করে রাখবো তোমায়।

[Outro]
শুধু দেখবো তোমায়...
কাছে রাখবো তোমায়...
ও... ও... উম...`;
// Auto-timed with Whisper (medium, word timestamps) + vocal-band energy dips; ~±0.5–1 s.
// Verse 1 lines 1–2 and chorus-2 line 2 were estimated from energy/line spacing (Whisper missed them).
export const times = [
  3.5,
  16.4, 24.8, 32.8, 41.2, 48.8, 57.0,
  65.2, 73.3, 82.0, 90.9,
  114.1, 120.4, 130.2, 138.8, 146.6, 154.5,
  163.0, 171.5, 180.2, 187.3,
  195.3, 199.3, 204.5,
];

// When a sung line stops (seconds); null = runs into the next line. Used for ♪ instrumental markers.
export const ends = (() => {
  const e = new Array(24).fill(null);
  e[0] = 9.0; // intro hum
  e[10] = 98.4; // end of chorus 1 -> instrumental break
  e[23] = 208.5; // last "ও… ও… উম…" -> outro music
  return e;
})();
