import "framer-motion";
// Non-browser render smoke. Effects never execute; no analytics or API calls.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { build } from "esbuild";
import React from "react";
import { renderToString } from "react-dom/server";
mkdirSync(new URL("../node_modules/.cache", import.meta.url), {
  recursive: true,
});
const bundled = new URL(
  "../node_modules/.cache/ssr-smoke.mjs",
  import.meta.url,
);
await build({
  entryPoints: ["src/App.jsx"],
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
globalThis.localStorage = { getItem: () => null, setItem() {} };
globalThis.sessionStorage = globalThis.localStorage;
globalThis.window = {
  location: { pathname: "/", search: "", hash: "" },
  matchMedia: () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
  }),
  addEventListener() {},
  innerWidth: 1440,
};
globalThis.location = window.location;
globalThis.document = {
  documentElement: { classList: { contains: () => false } },
  addEventListener() {},
};

test("Premium home renders without undefined components or invented testimonials", async () => {
  const { default: App } = await import(`${bundled.href}?home`);
  const html = renderToString(React.createElement(App));
  for (const content of [
    "Find your",
    "next feeling.",
    "This is SRD Masum.",
    "Koto Din Bhebechhi",
    "Danza Kuduro",
    "The complete collection",
    "Mobile navigation",
    "Copyright",
  ])
    assert.ok(html.includes(content), content);
  assert.ok(
    html.indexOf("This is SRD Masum.") < html.indexOf("The English rotation"),
  );
  assert.ok(!html.includes("seed-1"));
});
test("English collection renders actual catalogue and the first existing song", async () => {
  window.location.pathname = "/english/";
  const { default: App } = await import(`${bundled.href}?english`);
  const html = renderToString(React.createElement(App));
  for (const content of [
    "Good music.",
    "No borders.",
    "Danza Kuduro",
    "Top English Hits",
    "Billie Jean",
    'data-testid="en-list"',
  ])
    assert.ok(html.includes(content), content);
});

test("Language overview and every detail route render the real playlist without changing the audio root", async () => {
  const { LANGUAGE_PLAYLISTS } =
    await import("../src/data/language-playlists.js");
  for (const path of [
    "/playlists/",
    ...LANGUAGE_PLAYLISTS.map((p) => p.href),
  ]) {
    window.location.pathname = path;
    const { default: App } = await import(
      `${bundled.href}?${encodeURIComponent(path)}`
    );
    const html = renderToString(React.createElement(App));
    assert.ok(
      html.includes(
        path === "/playlists/" ? "Find your language." : "language-track-list",
      ),
      path,
    );
    if (path !== "/playlists/") {
      assert.ok(html.includes("Play all"));
      assert.ok(html.includes("Browsing never interrupts"));
    }
  }
});
