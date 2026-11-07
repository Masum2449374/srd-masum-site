import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { AUDIO_TRACKS } from "../src/data/songs.js";
import { BANGLA_TRACKS } from "../src/data/bangla-songs.js";
import { ENGLISH_ALL } from "../src/data/english-songs.js";
const read = (p) =>
  fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const tracks = [...ENGLISH_ALL, ...AUDIO_TRACKS, ...BANGLA_TRACKS];
test("Catalogue contains unique real tracks with existing cover assets", () => {
  assert.equal(tracks.length, 23);
  assert.equal(new Set(tracks.map((t) => t.id)).size, tracks.length);
  for (const t of tracks) {
    assert.ok(t.src && t.title && t.duration > 0);
    for (const p of [t.cover, t.coverWebp, t.thumb].filter(Boolean))
      assert.ok(fs.existsSync(new URL(`../public${p}`, import.meta.url)), p);
  }
});
test("Billie Jean synced lyrics and official featured release stay present", () => {
  const billie = ENGLISH_ALL.find((t) => t.id === "billie-jean");
  assert.ok(
    billie.lyrics &&
      billie.lyricTimes.length > 10 &&
      billie.lyricEnds.length > 10,
  );
  const featured = BANGLA_TRACKS.find((t) => t.artist === "SRD Masum");
  assert.equal(featured.id, "koto-din-bhebechhi-cover");
  assert.ok(featured.lyrics && featured.lyricTimes.length > 10);
});
test("Serial playlist ordering and three-second repeat-play counting stay intact", () => {
  const list = read("src/components/PlaylistSection.jsx"),
    player = read("src/components/MiniPlayer.jsx");
  assert.match(
    list,
    /\[\.\.\.ENGLISH_ALL, \.\.\.AUDIO_TRACKS, \.\.\.BANGLA_TRACKS\]/,
  );
  assert.match(player, /secs >= 3/);
  assert.match(player, /method: "POST", keepalive: true/);
  assert.match(read("src/lib/smartlink.js"), /SMARTLINK_INTERVAL_MIN = 15/);
});
test("Analytics, worker, hidden auth and restricted socials are preserved", () => {
  assert.match(read("index.html"), /G-YJKYZ129RT/);
  assert.match(read("index.html"), /abscloud\.org/);
  assert.match(read("src/lib/flags.js"), /ACCOUNTS_ENABLED = false/);
  const nav = read("src/components/Nav.jsx");
  assert.doesNotMatch(
    nav,
    /AccountButton|UploadModal|FacebookLogo|YoutubeLogo/,
  );
  assert.match(nav, /InstagramLogo/);
  assert.match(nav, /WhatsappLogo/);
  assert.match(nav, /TelegramLogo/);
  assert.match(read("package.json"), /package-worker\.mjs/);
});
test("Local review cannot install ad listeners or call production APIs", () => {
  const main = read("src/main.jsx"),
    config = read("vite.config.js");
  assert.match(main, /if \(!DESIGN_SANDBOX\) installSmartlink\(\)/);
  assert.match(main, /if \(!DESIGN_SANDBOX\) installSocialBar\(\)/);
  assert.match(config, /command === "serve"/);
  assert.match(config, /path\.startsWith\("\/api\/"\)/);
});
test("Build includes untouched Pages worker and all shareable song pages", () => {
  assert.equal(read("dist/_worker.js"), read("worker/_worker.js"));
  for (const t of tracks) {
    const page = read(`dist/song/${t.id}/index.html`);
    assert.ok(page.includes("og:title"));
    assert.ok(page.includes(t.id));
  }
});
