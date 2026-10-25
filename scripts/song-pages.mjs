// Post-build: one static HTML per song at /song/<id>/index.html, so link previews
// (WhatsApp, Facebook) show the song title. Each page is the normal app shell; the app
// reads the /song/<id>/ path and cues that track.
import fs from "node:fs";
import path from "node:path";
import { AUDIO_TRACKS } from "../src/data/songs.js";
import { BANGLA_TRACKS } from "../src/data/bangla-songs.js";
import sharp from "sharp";

// 1200x630 share card: avatar + song title + SRD Masum branding. Rendered to PNG at build time
// so Facebook/WhatsApp crawlers see it without running JS.
const avatarB64 = fs.readFileSync(path.resolve("public/images/avatar.jpg")).toString("base64");
const xesc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
async function card(file, big, small, coverPath, artist = "SRD Masum") {
  const imgB64 = coverPath ? (await sharp(path.resolve("public" + coverPath)).resize(300, 300).jpeg({ quality: 85 }).toBuffer()).toString("base64") : avatarB64;
  const size = big.length > 22 ? 60 : big.length > 14 ? 76 : 92;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b0f1a"/><stop offset=".6" stop-color="#0a2a66"/><stop offset="1" stop-color="#0b6cf0"/></linearGradient>
  <clipPath id="c"><circle cx="230" cy="315" r="150"/></clipPath></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="230" cy="315" r="162" fill="none" stroke="#5aa2ff" stroke-width="6" opacity=".8"/>
  <image href="data:image/jpeg;base64,${imgB64}" x="80" y="165" width="300" height="300" preserveAspectRatio="xMidYMid slice" clip-path="url(#c)"/>
  <text x="440" y="250" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="30" font-weight="600" fill="#9cc4ff" letter-spacing="4">${xesc(small)}</text>
  <text x="440" y="${250 + size + 20}" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="${size}" font-weight="800" fill="#ffffff">${xesc(big)}</text>
  <rect x="440" y="${290 + size + 20}" width="120" height="8" rx="4" fill="#0b6cf0"/>
  <text x="440" y="${360 + size + 30}" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="40" font-weight="800" fill="#ffffff">${xesc(artist)}</text>
  <text x="1150" y="600" text-anchor="end" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="24" fill="#c9dcff">srdmasum.bbroot.com</text>
</svg>`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(file);
}

const SITE = "https://srdmasum.bbroot.com";
const dist = path.resolve("dist");
const shell = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const setMeta = (html, re, tag) => (re.test(html) ? html.replace(re, tag) : html.replace("</head>", `    ${tag}\n  </head>`));

const all = [...AUDIO_TRACKS, ...BANGLA_TRACKS];
fs.mkdirSync(path.join(dist, "og"), { recursive: true });
await card(path.join(dist, "og", "site.png"), "Official Website", "MUSIC ARTIST");
for (const t of all) {
  const url = `${SITE}/song/${t.id}/`;
  const title = `${t.title} — ${t.artist || "SRD Masum"}`;
  const desc = `Listen to "${t.title}" by ${t.artist || "SRD Masum"} · গানটি শুনুন`;
  let h = shell;
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  h = setMeta(h, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(desc)}" />`);
  h = setMeta(h, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`);
  h = setMeta(h, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(desc)}" />`);
  h = setMeta(h, /<meta property="og:type"[^>]*>/, `<meta property="og:type" content="music.song" />`);
  h = setMeta(h, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
  h = setMeta(h, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);
  await card(path.join(dist, "og", `${t.id}.png`), t.title, "NOW PLAYING · LISTEN", t.cover, t.artist || "SRD Masum");
  const img = `${SITE}/og/${t.id}.png`;
  h = setMeta(h, /<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${img}" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta property="og:image:alt" content="${esc(title)}" />`);
  h = setMeta(h, /<meta name="twitter:card"[^>]*>/, `<meta name="twitter:card" content="summary_large_image" />`);
  h = setMeta(h, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(title)}" />`);
  h = setMeta(h, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(desc)}" />`);
  h = setMeta(h, /<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${img}" />`);
  h = h.replace("</head>", `    <meta property="og:audio" content="${esc(t.src)}" />\n  </head>`);
  const dir = path.join(dist, "song", t.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), h);
}

// Sitemap with the song pages.
const urls = [`${SITE}/`, ...all.map((t) => `${SITE}/song/${t.id}/`)];
fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`
);
console.log(`song pages: ${all.length}`);
