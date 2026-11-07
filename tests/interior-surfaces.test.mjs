import "framer-motion";
import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdirSync, readFileSync } from "node:fs";
import React from "react";
import { renderToString } from "react-dom/server";
mkdirSync(new URL("../node_modules/.cache", import.meta.url), {
  recursive: true,
});
const bundled = new URL(
  "../node_modules/.cache/interior-smoke.mjs",
  import.meta.url,
);
await build({
  stdin: {
    contents:
      'export {default as NowPlaying} from "./src/components/StudioNowPlaying.jsx"; export {default as Credits} from "./src/components/CreditsPanel.jsx"; export {default as Lyrics} from "./src/components/LyricsPanel.jsx"; export {ALL_PLAYLIST} from "./src/components/PlaylistSection.jsx";',
    resolveDir: process.cwd(),
    loader: "jsx",
  },
  outfile: bundled.pathname,
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  jsx: "automatic",
  loader: { ".css": "empty" },
  define: {
    "import.meta.env.DEV": "false",
    "import.meta.env.VITE_DESIGN_SANDBOX": '"0"',
  },
});
let desktop = false;
globalThis.window = {
  addEventListener() {},
  removeEventListener() {},
  location: new URL("https://review.invalid/"),
  matchMedia: (q) => ({
    matches: q === "(min-width: 1024px)" && desktop,
    addEventListener() {},
    removeEventListener() {},
  }),
};
globalThis.document = {
  documentElement: { classList: { contains: () => false } },
};
globalThis.localStorage = { getItem: () => null, setItem() {} };
const { NowPlaying, Credits, Lyrics, ALL_PLAYLIST } = await import(
  bundled.href
);
const billie = ALL_PLAYLIST.find((t) => t.id === "billie-jean");
const render = (Component, props) =>
  renderToString(React.createElement(Component, props));
test("Mobile now-playing renders actual artwork, transport, lyrics/queue tabs and accessible controls", () => {
  const html = render(NowPlaying, {
    player: {
      track: billie,
      current: 31,
      duration: billie.duration,
      queue: ALL_PLAYLIST,
      playing: true,
      repeat: "off",
    },
    onClose() {},
  });
  for (const content of [
    "studio-player-v2",
    "Billie Jean",
    "cover artwork",
    "Minimize player",
    'aria-label="Pause"',
    "Seek Billie Jean",
    "player-tab-lyrics",
    "player-tab-queue",
    'aria-label="Shuffle"',
    "Share Billie Jean",
  ])
    assert.ok(html.includes(content), content);
  assert.equal((html.match(/id="player-tab-panel"/g) || []).length, 1);
  assert.ok(!html.includes("<audio"));
});
test("Desktop player shows actual synced lyrics alongside controls with a single tabpanel", () => {
  desktop = true;
  const html = render(NowPlaying, {
    player: {
      track: billie,
      current: 31,
      duration: billie.duration,
      queue: ALL_PLAYLIST,
      playing: true,
      repeat: "off",
    },
    onClose() {},
  });
  for (const content of [
    "studio-player-side",
    "np-lyrics-panel",
    "Synced lyrics",
    'lang="en"',
    'aria-current="true"',
  ])
    assert.ok(html.includes(content), content);
  assert.equal((html.match(/id="player-tab-panel"/g) || []).length, 1);
  desktop = false;
});
test("Credits retain full real titles, date and exact service destinations without truncation", () => {
  const track = ALL_PLAYLIST.find((t) => t.id === "koto-din-bhebechhi-cover");
  const html = render(Credits, { t: track, onClose() {} });
  for (const content of [
    track.title,
    "song-info-title",
    "Released by",
    "Release date",
    "Close song information",
  ])
    assert.ok(html.includes(content), content);
  if (track.spotifyUrl)
    assert.ok(html.includes(track.spotifyUrl.replace(/&/g, "&amp;")));
  if (track.youtubeUrl)
    assert.ok(html.includes(track.youtubeUrl.replace(/&/g, "&amp;")));
  assert.ok(!html.includes("truncate"));
});
test("Inactive detail lyrics cannot accidentally seek the currently playing other song", () => {
  const html = render(Lyrics, {
    track: billie,
    current: 0,
    duration: billie.duration,
  });
  assert.match(html, /disabled=""/);
  assert.match(html, /lang="en"/);
  const generated = readFileSync(
    new URL("../dist/song/billie-jean/index.html", import.meta.url),
    "utf8",
  );
  assert.match(generated, /<audio controls preload="none"/);
  assert.doesNotMatch(generated, /(?:^|[}\n])body\{background:/);
});
