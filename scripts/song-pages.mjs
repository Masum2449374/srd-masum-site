import { LANGUAGE_PLAYLISTS, languageLabel, languagesFor, CATALOGUE } from "../src/data/language-playlists.js";
import postcss from "postcss";
// Post-build: one static HTML per song at /song/<id>/index.html, so link previews
// (WhatsApp, Facebook) show the song title. Each page is the normal app shell; the app
// reads the /song/<id>/ path and cues that track.
import fs from "node:fs";
import path from "node:path";
import { AUDIO_TRACKS } from "../src/data/songs.js";
import { BANGLA_TRACKS } from "../src/data/bangla-songs.js";
import { ENGLISH_ALL } from "../src/data/english-songs.js";
import sharp from "sharp";
import { artistHref, artistOf, isVerified } from "../src/lib/artists.js";
const BADGE = `<svg class="vbadge" role="img" aria-label="Verified artist" width="14" height="14" viewBox="0 0 24 24"><title>Verified artist</title><path d="M12.00 2.60Q15.89 0.02 17.53 4.40Q22.19 4.59 20.94 9.10Q24.60 12.00 20.94 14.90Q22.19 19.41 17.53 19.60Q15.89 23.98 12.00 21.40Q8.11 23.98 6.47 19.60Q1.81 19.41 3.06 14.90Q-0.60 12.00 3.06 9.10Q1.81 4.59 6.47 4.40Q8.11 0.02 12.00 2.60Z" fill="#0A66FF"/><path d="M8.1 12.2l2.7 2.7 5.1-5.5" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// 1200x630 share card: avatar + song title + SRD Masum branding. Rendered to PNG at build time
// so Facebook/WhatsApp crawlers see it without running JS.
const avatarB64 = fs.readFileSync(path.resolve("public/images/avatar.jpg")).toString("base64");
const xesc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
async function card(file, big, small, coverPath, artist = "SRD Masum") {
  const imgB64 = coverPath ? (await sharp(path.resolve("public" + coverPath)).resize(300, 300).jpeg({ quality: 85 }).toBuffer()).toString("base64") : avatarB64;
  const size = big.length > 22 ? 60 : big.length > 14 ? 76 : 92;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f1014"/><stop offset=".6" stop-color="#252131"/><stop offset="1" stop-color="#554178"/></linearGradient>
  <clipPath id="c"><circle cx="230" cy="315" r="150"/></clipPath></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="230" cy="315" r="162" fill="none" stroke="#b6a0ff" stroke-width="6" opacity=".8"/>
  <image href="data:image/jpeg;base64,${imgB64}" x="80" y="165" width="300" height="300" preserveAspectRatio="xMidYMid slice" clip-path="url(#c)"/>
  <text x="440" y="250" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="30" font-weight="600" fill="#b6a0ff" letter-spacing="4">${xesc(small)}</text>
  <text x="440" y="${250 + size + 20}" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="${size}" font-weight="800" fill="#ffffff">${xesc(big)}</text>
  <rect x="440" y="${290 + size + 20}" width="120" height="8" rx="4" fill="#b6a0ff"/>
  <text x="440" y="${360 + size + 30}" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="40" font-weight="800" fill="#ffffff">${xesc(artist)}</text>
  <text x="1150" y="600" text-anchor="end" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="24" fill="#ada9b8">srdmasum.bbroot.com</text>
</svg>`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(file);
}

const SITE = "https://srdmasum.bbroot.com";
const dist = path.resolve("dist");
const shell = fs.readFileSync(path.join(dist, "index.html"), "utf8").replace(/\s*<meta property="og:image:(secure_url|type|width|height|alt)"[^>]*>/g, "").replace(/\s*<meta name="twitter:image:alt"[^>]*>/g, "");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const setMeta = (html, re, tag) => (re.test(html) ? html.replace(re, tag) : html.replace("</head>", `    ${tag}\n  </head>`));

const all = [...AUDIO_TRACKS, ...BANGLA_TRACKS, ...ENGLISH_ALL];
fs.mkdirSync(path.join(dist, "og"), { recursive: true });
for (const t of all) {
  const url = `${SITE}/song/${t.id}/`;
  const title = !t.artist || t.artist === "SRD Masum" ? `${t.title} | SRD Masum` : `${t.title} — ${t.artist} | SRD Masum`;
  const desc = !t.artist || t.artist === "SRD Masum" ? `Listen to "${t.title}", released by SRD Masum` : `Listen to "${t.title}" by ${t.artist}`;
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
  // The shell's homepage JSON-LD graph (incl. its MusicRecording) does not belong on song pages.
  h = h.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  // Retain the app bundle: direct deep links join the same persistent audio shell.
  // Static, crawler-visible song page inside #root (React replaces it on mount and cues the track).
  const isOriginal = !t.artist || t.artist === "SRD Masum";
  const codes = languagesFor(t);
  const lang = codes.length === 1 ? codes[0] : "und";
  let li = 0;
  const times = Array.isArray(t.lyricTimes) ? t.lyricTimes : null;
  const lyr = t.lyrics ? t.lyrics.split("\n").map((l) => {
    const m = /^\[(.+)\]$/.exec(l.trim());
    if (m) return `<h3 style="color:#a39e98;font-size:.8rem;text-transform:uppercase;letter-spacing:.15em;margin:1.2rem 0 .3rem">${xesc(m[1])}</h3>`;
    if (!l.trim()) return "";
    const tt = times && times[li] != null ? ` data-t="${times[li]}"` : "";
    li++;
    return `<p class="ly"${tt} >${xesc(l.trim())}</p>`;
  }).join("") : "";
  const audioSrc = t.src || "";
  const dur = t.duration || 0;
  const fmt = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;
  const cover = t.artwork512 || t.cover;
  // Accent from the cover's dominant colour (brightened so it reads on dark), fallback to site blue.
  let acc = "11,108,240";
  if (cover) { try { const { dominant: d } = await sharp(path.resolve("public" + cover)).stats(); const m = Math.max(d.r, d.g, d.b, 1), k = Math.max(1, 170 / m); acc = [d.r, d.g, d.b].map((v) => Math.min(255, Math.round(v * k))).join(","); } catch {} }
  const langName = languageLabel(t);
  const chips = [t.released ? `Released ${xesc(t.released)}` : "", langName, t.duration ? `${Math.floor(t.duration / 60)}:${String(Math.round(t.duration % 60)).padStart(2, "0")}` : "", isOriginal ? "SRD Masum Original" : ""].filter(Boolean).map((c) => `<span class="chip">${c}</span>`).join("");
  const credRows = [["Album", t.album], ["Writers", t.writers], ["Label", t.label]].filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${xesc(v)}</dd></div>`).join("");
  const I = {
    play: '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path fill="currentColor" d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.04-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><text x="12" y="15.5" font-size="7.5" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none" font-family="system-ui">10</text></svg>',
    fwd: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/><text x="12" y="15.5" font-size="7.5" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none" font-family="system-ui">10</text></svg>',
    spotify: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="#1DB954" d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.5 17.3a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 1 1-.33-1.46c4.57-1.04 8.5-.6 11.66 1.34.36.22.47.68.25 1.03zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.23-1.98-8.15-2.56-11.97-1.4a.94.94 0 1 1-.54-1.8c4.36-1.32 9.78-.68 13.49 1.6.44.27.58.85.31 1.29zm.13-3.4C15.23 8.33 8.85 8.12 5.16 9.24a1.12 1.12 0 1 1-.65-2.15c4.24-1.29 11.28-1.04 15.73 1.6a1.12 1.12 0 0 1-1.14 1.94z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="#FF0033" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8z"/><path fill="#fff" d="M9.6 15.6 15.8 12 9.6 8.4z"/></svg>',
    home: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
  };
  const css = `<style>
.sp{max-width:1100px;margin:auto;padding:28px 28px 70px;color:#f5f3ef;font-family:'Inter Variable',system-ui,sans-serif;background:#0f1014}.sp a{color:inherit}.sp-top{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:38px;padding-bottom:23px;border-bottom:1px solid #ffffff14}.sp-brand{display:flex;align-items:center;gap:11px;text-decoration:none;font-family:'Sora Variable',sans-serif;font-size:19px;font-weight:600;letter-spacing:-.7px}.sp-brandmark{display:grid;place-items:center;width:39px;height:39px;border:1px solid #b6a0ff33;border-radius:12px;background:#b6a0ff14;color:#b6a0ff}.sp-brand small{display:block;margin-top:4px;font-family:'Inter Variable',sans-serif;letter-spacing:1.9px;font-size:6px;font-weight:500;color:#9294a2}.sp-back{font-size:11px;text-decoration:none;color:#adaebb!important;line-height:1.6}.sp-listening{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:60px;align-items:center}.sp-cover{width:100%;max-width:440px;aspect-ratio:1;border-radius:15px;object-fit:cover;box-shadow:0 25px 70px -30px #0008}.sp h1{font-family:'Sora Variable',sans-serif;font-size:clamp(30px,4vw,48px);line-height:1.15;letter-spacing:-.05em;font-weight:550;margin:15px 0}.sp-eyebrow{font-size:9px;letter-spacing:2px;color:#b6a0ff;text-transform:uppercase}.sp-artist{font-size:13px;color:#b6a0ff;line-height:1.7}.sp-alink{display:inline-flex;align-items:center;gap:5px;text-decoration:none}.sp .vbadge{width:14px;height:14px}.sp .chips{display:flex;flex-wrap:wrap;gap:7px;margin:20px 0}.sp .chip{padding:6px 9px;border:1px solid #ffffff12;border-radius:6px;color:#adaebb;font-size:10px}.sp .card{padding:18px;border-radius:13px;border:1px solid #2f303a;background:#17181e}.sp .grid2{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}.sp .btn{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:0 12px;border-radius:9px;text-decoration:none;font-size:11px;background:#17181e;border:1px solid #2f303a}.sp .btn svg{width:18px;height:18px;flex:none}.sp .btn:hover,.sp a:focus-visible{outline:1px solid #b6a0ff;outline-offset:3px}.sp .sec{padding:26px;margin-top:25px;border:1px solid #2f303a;border-radius:14px;background:#17181e}.sp .sec h2{font-size:10px;letter-spacing:1.8px;color:#b6a0ff;text-transform:uppercase;margin:0 0 20px}.sp .sec dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.sp .sec dt{font-size:10px;color:#9294a2}.sp .sec dd{font-size:12px;line-height:1.7;margin:6px 0 0}.sp .ly{font-size:20px;line-height:1.9;color:#adaebb}.sp .sp-lyrics{padding:30px 38px}
@media(max-width:700px){.sp{padding:20px 20px 50px;max-width:520px}.sp-top{margin-bottom:28px;gap:14px}.sp-brand{font-size:16px}.sp-brandmark{width:34px;height:34px;border-radius:10px}.sp-back{font-size:9px;max-width:120px;text-align:right}.sp-listening{grid-template-columns:1fr;gap:27px}.sp-cover{max-width:300px;margin:auto}.sp h1{font-size:31px}.sp .sec dl{grid-template-columns:1fr;gap:15px}.sp .sp-lyrics{padding:25px 23px}.sp .ly{font-size:18px}}
</style>`;
  const share = `${SITE}/song/${encodeURIComponent(t.id)}/`;
  // Accessible no-JavaScript fallback only; React replaces it before its audio engine mounts.
  const player = audioSrc ? `<div class="card" role="region" aria-label="Player"><audio controls preload="none" src="${esc(audioSrc)}" style="width:100%"></audio><p style="font-size:11px;color:#adaebb;margin:12px 0 0">Open the app player for synced lyrics and your listening queue.</p></div>` : "";
  const links = `<div class="grid2">${t.spotifyUrl ? `<a class="btn b-sp" href="${esc(t.spotifyUrl)}" rel="noopener" target="_blank" aria-label="Listen on Spotify (opens in a new tab)">${I.spotify}Spotify</a>` : ""}${t.youtubeUrl ? `<a class="btn b-yt" href="${esc(t.youtubeUrl)}" rel="noopener" target="_blank" aria-label="Watch on YouTube (opens in a new tab)">${I.youtube}YouTube</a>` : ""}</div>
<div class="grid2"><a class="btn b-out" href="/?from=song&song=${encodeURIComponent(t.id)}">${I.home}Full site</a><a class="btn b-out" href="${share}">${I.share}Song permalink</a></div>`;

  h = h.replace(/<div id="root"><\/div>/, `<div id="root"><div class="sp-bg"></div><article class="sp" lang="${lang}">
<div class="sp-top"><a class="sp-brand" href="/?from=song"><span class="sp-brandmark" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor"><path d="M20 2.7a1 1 0 0 0-.9-.2l-12 3A1 1 0 0 0 6.3 6v10.4a3.8 3.8 0 1 0 2 3.3V9.8l10-2.5v6.1a3.8 3.8 0 1 0 2 3.3V3.5a1 1 0 0 0-.3-.8Z"/></svg></span><span>SRD Masum<small>THE MUSIC SPACE</small></span></a><a class="sp-back" href="/?from=song">Explore the collection ↗</a></div><div class="sp-listening">
${cover ? `<img class="sp-cover" src="${esc(cover)}" alt="${esc(t.title)} cover" width="300" height="300">` : ""}
<div class="sp-detail"><p class="sp-eyebrow">Single · The music space</p><h1>${xesc(t.title)}</h1><p class="sp-artist">${!t.artist || t.artist === "SRD Masum" ? "Released by " : ""}<a class="sp-alink" href="${esc(artistHref(t))}">${xesc(artistOf(t))}${isVerified(t) ? BADGE : ""}</a></p><div class="chips">${chips}</div>
${player}${links}</div></div>
${credRows ? `<section class="sec"><h2>Credits</h2><dl>${credRows}</dl></section>` : ""}
${lyr ? `<section class="sec sp-lyrics"><h2>Synced lyrics · Follow the feeling</h2>${lyr}</section>` : ""}
</article><div class="toast" id="toast" role="status"></div></div>`);
  // Static fallback styles must not recolor the persistent React shell after navigation.
  const fallbackStyles = postcss.parse(css.replace(/^<style>|<\/style>$/g, ""));
  fallbackStyles.walkRules((rule) => {
    if (rule.parent.type === "atrule" && /keyframes$/.test(rule.parent.name)) return;
    if (rule.selector === "body") { rule.remove(); return; }
    rule.selectors = rule.selectors.map((selector) => selector.startsWith(".sp") ? selector : `.sp ${selector}`);
  });
  h = h.replace("</head>", `<style>${fallbackStyles.toString()}</style>\n</head>`);
  if (isOriginal) {
    const ld = { "@context": "https://schema.org", "@type": "MusicRecording", name: t.title, url, ...(!t.artist || t.artist === "SRD Masum" ? {} : { byArtist: { "@type": "MusicGroup", name: t.artist } }), recordLabel: { "@type": "Organization", "@id": `${SITE}/#org`, name: "SRD Masum" }, ...(codes.length ? { inLanguage: codes } : {}), ...(t.duration ? { duration: `PT${Math.floor(t.duration / 60)}M${Math.round(t.duration % 60)}S` } : {}), ...(t.released ? { datePublished: t.released } : {}), ...(cover ? { image: SITE + cover } : {}), sameAs: [t.spotifyUrl, t.youtubeUrl].filter((u) => u && !/\/search\//.test(u)), ...(t.lyrics ? { recordingOf: { "@type": "MusicComposition", name: t.title, lyrics: { "@type": "CreativeWork", text: t.lyrics } } } : {}) };
    h = h.replace("</head>", `    <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>\n  </head>`);
  }
  if (t.lyrics) {
    const first = t.lyrics.split("\n").find((l) => l.trim() && !/^\[|^আহা/.test(l.trim())) || "";
    h = setMeta(h, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(`${t.title} lyrics — ${!t.artist || t.artist === "SRD Masum" ? "released by SRD Masum" : t.artist}. ${first}`)}" />`);
  }
  const dir = path.join(dist, "song", t.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), h);
}

// /english/ page: app shell with its own title and share card.
{
  const url = `${SITE}/english/`, title = "Top English Hits | SRD Masum", desc = "Today's popular English hits in one playlist. Tap and play.";
  let h = shell.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  h = setMeta(h, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(desc)}" />`);
  h = setMeta(h, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`);
  h = setMeta(h, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(desc)}" />`);
  h = setMeta(h, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
  h = setMeta(h, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);
  await card(path.join(dist, "og", "english.png"), "Top English Hits", "PLAYLIST · LISTEN", ENGLISH_ALL[0]?.cover, "SRD Masum");
  const img = `${SITE}/og/english.png`;
  h = setMeta(h, /<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${img}" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta property="og:image:alt" content="${esc(title)}" />`);
  h = setMeta(h, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(desc)}" />`);
  h = setMeta(h, /<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${img}" />`);
  h = setMeta(h, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(title)}" />`);
  fs.mkdirSync(path.join(dist, "english"), { recursive: true });
  fs.writeFileSync(path.join(dist, "english", "index.html"), h);
}

// /copyright/ page: app shell with its own title.
{
  const url = `${SITE}/copyright/`, title = "Copyright & DMCA Policy | SRD Masum", desc = "How to report copyright infringement to SRD Masum, and how we handle false claims and counter-notices.";
  let h = shell.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  h = setMeta(h, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(desc)}" />`);
  h = setMeta(h, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`);
  h = setMeta(h, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(desc)}" />`);
  h = setMeta(h, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
  h = setMeta(h, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);
  fs.mkdirSync(path.join(dist, "copyright"), { recursive: true });
  fs.writeFileSync(path.join(dist, "copyright", "index.html"), h);
}

// Language overview/detail pages retain the app bundle and shareable route-specific metadata.
const languagePages = [{slug:null,title:"Language playlists",tracks:CATALOGUE,href:"/playlists/",description:"Explore the current collection by song language."}, ...LANGUAGE_PLAYLISTS];
for (const p of languagePages) {
  const title = `${p.title}${p.slug ? " playlist" : ""} | SRD Masum`, url = SITE + p.href;
  const desc = p.description || `Explore ${p.tracks.length} existing recordings by language.`;
  let h = shell.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  h = h.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  for (const [property,value] of [["og:title",title],["og:description",desc],["og:url",url],["twitter:title",title],["twitter:description",desc]]) h = setMeta(h,new RegExp(`<meta (?:property|name)="${property}"[^>]*>`),`<meta ${property.startsWith("twitter")?"name":"property"}="${property}" content="${esc(value)}" />`);
  h = setMeta(h, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(desc)}" />`);
  h = setMeta(h, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);
  const imagePath = `og/playlist-${p.slug || "languages"}.png`;
  await card(path.join(dist,imagePath),p.title,`${p.tracks.length} TRACKS · PLAYLIST`,p.tracks[0]?.cover,"SRD Masum");
  h = setMeta(h, /<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${SITE}/${imagePath}" />`);
  h = setMeta(h, /<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${SITE}/${imagePath}" />`);
  const list = p.slug ? p.tracks.map(t=>`<li><a href="/song/${esc(t.id)}/">${xesc(t.title)}</a> — ${xesc(t.artist || "SRD Masum")} · ${esc(languageLabel(t))}</li>`).join("") : LANGUAGE_PLAYLISTS.map(group=>`<li><a href="${group.href}">${group.title}</a> · ${group.tracks.length} tracks</li>`).join("");
  h = h.replace('<div id="root"></div>',`<div id="root"><main><a href="/">SRD Masum · The music space</a><h1>${esc(p.title)}</h1><p>${esc(desc)}</p><ol>${list}</ol></main></div>`);
  const dir=path.join(dist,p.href); fs.mkdirSync(dir,{recursive:true}); fs.writeFileSync(path.join(dir,"index.html"),h);
}

// Sitemap with the song pages.
const urls = [...languagePages.map(p=>SITE+p.href), `${SITE}/`, `${SITE}/english/`, `${SITE}/copyright/`, ...all.map((t) => `${SITE}/song/${t.id}/`)];
fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`
);
console.log(`song pages: ${all.length}`);
// Valid ids for the play counter (worker validates POST /api/plays/<id> against this list).
fs.writeFileSync(path.join(dist, "song-ids.json"), JSON.stringify([...new Set([...AUDIO_TRACKS, ...BANGLA_TRACKS, ...ENGLISH_ALL].map((t) => String(t.id).toLowerCase()))]));
