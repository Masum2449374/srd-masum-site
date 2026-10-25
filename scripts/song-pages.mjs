// Post-build: one static HTML per song at /song/<id>/index.html, so link previews
// (WhatsApp, Facebook) show the song title. Each page is the normal app shell; the app
// reads the /song/<id>/ path and cues that track.
import fs from "node:fs";
import path from "node:path";
import { AUDIO_TRACKS } from "../src/data/songs.js";
import { BANGLA_TRACKS } from "../src/data/bangla-songs.js";

const SITE = "https://srdmasum.bbroot.com";
const dist = path.resolve("dist");
const shell = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const setMeta = (html, re, tag) => (re.test(html) ? html.replace(re, tag) : html.replace("</head>", `    ${tag}\n  </head>`));

const all = [...AUDIO_TRACKS, ...BANGLA_TRACKS];
for (const t of all) {
  const url = `${SITE}/song/${t.id}/`;
  const title = `${t.title} — SRD Masum`;
  const desc = `Listen to "${t.title}" by SRD Masum · গানটি শুনুন`;
  let h = shell;
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  h = setMeta(h, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(desc)}" />`);
  h = setMeta(h, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`);
  h = setMeta(h, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(desc)}" />`);
  h = setMeta(h, /<meta property="og:type"[^>]*>/, `<meta property="og:type" content="music.song" />`);
  h = setMeta(h, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
  h = setMeta(h, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);
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
