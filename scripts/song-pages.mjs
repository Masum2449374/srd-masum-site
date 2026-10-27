// Post-build: one static HTML per song at /song/<id>/index.html, so link previews
// (WhatsApp, Facebook) show the song title. Each page is the normal app shell; the app
// reads the /song/<id>/ path and cues that track.
import fs from "node:fs";
import path from "node:path";
import { AUDIO_TRACKS } from "../src/data/songs.js";
import { BANGLA_TRACKS } from "../src/data/bangla-songs.js";
import { ENGLISH_ALL } from "../src/data/english-songs.js";
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
const shell = fs.readFileSync(path.join(dist, "index.html"), "utf8").replace(/\s*<meta property="og:image:(secure_url|type|width|height|alt)"[^>]*>/g, "").replace(/\s*<meta name="twitter:image:alt"[^>]*>/g, "");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const setMeta = (html, re, tag) => (re.test(html) ? html.replace(re, tag) : html.replace("</head>", `    ${tag}\n  </head>`));

const all = [...AUDIO_TRACKS, ...BANGLA_TRACKS, ...ENGLISH_ALL];
fs.mkdirSync(path.join(dist, "og"), { recursive: true });
for (const t of all) {
  const url = `${SITE}/song/${t.id}/`;
  const title = !t.artist || t.artist === "SRD Masum" ? `${t.title} | SRD Masum` : `${t.title} — ${t.artist} | SRD Masum`;
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
  // The shell's homepage JSON-LD graph (incl. its MusicRecording) does not belong on song pages.
  h = h.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  // Song pages are standalone (no React app): drop the app bundle and its preloads.
  h = h.replace(/\s*<script type="module"[^>]*><\/script>/g, "").replace(/\s*<link rel="modulepreload"[^>]*>/g, "");
  // Static, crawler-visible song page inside #root (React replaces it on mount and cues the track).
  const isOriginal = !t.artist || t.artist === "SRD Masum";
  const lang = BANGLA_TRACKS.includes(t) ? "bn" : AUDIO_TRACKS.includes(t) ? "hi" : "en";
  let li = 0;
  const times = Array.isArray(t.lyricTimes) ? t.lyricTimes : null;
  const lyr = t.lyrics ? t.lyrics.split("\n").map((l) => {
    const m = /^\[(.+)\]$/.exec(l.trim());
    if (m) return `<h3 style="color:#a39e98;font-size:.8rem;text-transform:uppercase;letter-spacing:.15em;margin:1.2rem 0 .3rem">${xesc(m[1])}</h3>`;
    if (!l.trim()) return "";
    const tt = times && times[li] != null ? ` data-t="${times[li]}"` : "";
    li++;
    return `<p class="ly"${tt} style="margin:.25rem 0;transition:color .2s">${xesc(l.trim())}</p>`;
  }).join("") : "";
  const credits = [["Artist", t.artist || "SRD Masum"], ["Album", t.album], ["Writers", t.writers], ["Label", t.label], ["Released", t.released]]
    .filter(([, v]) => v).map(([k, v]) => `<dt style="color:#a39e98">${k}</dt><dd style="margin:0 0 .5rem">${xesc(v)}</dd>`).join("");
  const btn = "display:inline-block;margin:.25rem .5rem .25rem 0;padding:.7rem 1.2rem;border-radius:999px;color:#fff;text-decoration:none;font-weight:600";
  const links = [
    t.spotifyUrl ? `<a href="${esc(t.spotifyUrl)}" rel="noopener" style="${btn};background:#1DB954;color:#0e0d0c">Spotify</a>` : "",
    t.youtubeUrl ? `<a href="${esc(t.youtubeUrl)}" rel="noopener" style="${btn};background:#c4302b">YouTube</a>` : "",
    `<a href="/?from=song&song=${encodeURIComponent(t.id)}" style="${btn};background:#26231f">Open full site / Go to home</a>`,
  ].join("");
  const audioSrc = t.src || "";
  const dur = t.duration || 0;
  const fmt = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;
  const player = audioSrc ? `<div id="sp" style="margin:1rem 0;padding:1rem;border-radius:16px;background:#1a1816"><audio id="sa" preload="none" src="${esc(audioSrc)}"></audio><div style="display:flex;align-items:center;gap:.8rem"><button id="pb" type="button" aria-label="Play ${esc(t.title)}" style="flex:none;width:56px;height:56px;border-radius:50%;border:0;background:#0b6cf0;color:#fff;font-size:1.4rem;cursor:pointer">▶</button><div style="flex:1;min-width:0"><input id="sk" type="range" min="0" max="${dur}" step="0.1" value="0" aria-label="Seek" style="width:100%;accent-color:#0b6cf0"><div style="display:flex;justify-content:space-between;font:12px monospace;color:#a39e98"><span id="tc">0:00</span><span id="td">${fmt(dur)}</span></div></div></div></div>` : "";
  const script = audioSrc ? `<script>(function(){var a=document.getElementById("sa"),b=document.getElementById("pb"),k=document.getElementById("sk"),c=document.getElementById("tc"),d=document.getElementById("td"),id=${JSON.stringify(t.id)},sent=0,drag=0;var L=[].slice.call(document.querySelectorAll(".ly[data-t]")),cur=-1;function f(x){x=x||0;return Math.floor(x/60)+":"+("0"+Math.floor(x%60)).slice(-2)}
b.onclick=function(){if(a.paused){var p=a.play();if(p&&p.catch)p.catch(function(){b.textContent="▶"});}else a.pause()};
a.onplay=function(){b.textContent="❚❚";b.setAttribute("aria-label","Pause");if(!sent){sent=1;try{var K="srd-play-"+id,n=Date.now(),l=+localStorage.getItem(K)||0;if(n-l>18e5){localStorage.setItem(K,n);fetch("/api/play",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:id}),keepalive:true}).catch(function(){})}}catch(e){}}};
a.onpause=a.onended=function(){b.textContent="▶";b.setAttribute("aria-label","Play")};
a.onloadedmetadata=function(){if(a.duration&&isFinite(a.duration)){k.max=a.duration;d.textContent=f(a.duration)}};
a.ontimeupdate=function(){var x=a.currentTime;if(!drag)k.value=x;c.textContent=f(x);if(L.length){var i=-1;for(var j=0;j<L.length;j++){if(+L[j].dataset.t<=x)i=j;else break}if(i!==cur){if(cur>=0)L[cur].style.color="";cur=i;if(i>=0){L[i].style.color="#5aa2ff";L[i].scrollIntoView({block:"center",behavior:"smooth"})}}}};
k.oninput=function(){drag=1;c.textContent=f(+k.value)};k.onchange=function(){a.currentTime=+k.value;drag=0};
L.forEach(function(p){p.style.cursor="pointer";p.onclick=function(){a.currentTime=+p.dataset.t;if(a.paused)a.play()}});})();</script>` : "";
  const cover = t.artwork512 || t.cover;
  h = h.replace(/<div id="root"><\/div>/, `<div id="root"><article lang="${lang}" style="max-width:40rem;margin:0 auto;padding:2rem 1rem;font-family:'DM Sans','Noto Sans Bengali',system-ui,sans-serif;color:#f4f1ea;background:#0e0d0c"><p><a href="/?from=song" style="color:#5aa2ff">← SRD Masum · Home</a></p>${cover ? `<img src="${esc(cover)}" alt="${esc(t.title)} cover" width="256" height="256" style="border-radius:16px;max-width:100%;height:auto">` : ""}<h1>${xesc(t.title)}${t.lyrics ? " — লিরিক্স (Lyrics)" : ""}</h1><dl>${credits}</dl>${player}<div>${links}</div>${lyr ? `<section><h2>Lyrics</h2>${lyr}</section>` : ""}</article></div>${script}`);
  if (isOriginal) {
    const ld = { "@context": "https://schema.org", "@type": "MusicRecording", name: t.title, url, byArtist: { "@type": "MusicGroup", "@id": `${SITE}/#artist`, name: "SRD Masum" }, inLanguage: lang, ...(t.duration ? { duration: `PT${Math.floor(t.duration / 60)}M${Math.round(t.duration % 60)}S` } : {}), ...(t.released ? { datePublished: t.released } : {}), ...(cover ? { image: SITE + cover } : {}), sameAs: [t.spotifyUrl, t.youtubeUrl].filter((u) => u && !/\/search\//.test(u)), ...(t.lyrics ? { recordingOf: { "@type": "MusicComposition", name: t.title, lyrics: { "@type": "CreativeWork", text: t.lyrics } } } : {}) };
    h = h.replace("</head>", `    <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>\n  </head>`);
  }
  if (t.lyrics) {
    const first = t.lyrics.split("\n").find((l) => l.trim() && !/^\[|^আহা/.test(l.trim())) || "";
    h = setMeta(h, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(`${t.title} lyrics (লিরিক্স) — ${t.artist || "SRD Masum"}. ${first}`)}" />`);
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

// Sitemap with the song pages.
const urls = [`${SITE}/`, `${SITE}/english/`, ...all.map((t) => `${SITE}/song/${t.id}/`)];
fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`
);
console.log(`song pages: ${all.length}`);
