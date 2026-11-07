import "framer-motion";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import React from "react";
import Renderer, { act } from "react-test-renderer";
import { build } from "esbuild";
import { ENGLISH_ALL } from "../src/data/english-songs.js";
import {
  LANGUAGE_PLAYLISTS,
  playlistBySlug,
} from "../src/data/language-playlists.js";
import {
  internalDestination,
  canHandleLink,
} from "../src/lib/navigation-core.js";
const read = (file) =>
  fs.readFileSync(new URL("../" + file, import.meta.url), "utf8");
const base = "https://review.invalid/";
test("Every real internal route and anchor uses the persistent app, not a reload", () => {
  for (const href of [
    "/",
    "/#collections",
    "/playlists/",
    ...LANGUAGE_PLAYLISTS.map((p) => p.href),
    "/#music",
    "/english/",
    "/song/billie-jean/",
    "/artist/srd-masum/",
    "/u/listener/",
    "/copyright/",
    "/account/",
  ])
    assert.ok(internalDestination(href, base), href);
  for (const href of [
    "/go",
    "/ads/b300",
    "/api/plays",
    "https://example.com/",
    "mailto:hello@example.com",
  ])
    assert.equal(internalDestination(href, base), null, href);
  const anchor = {
    target: "",
    hasAttribute: () => false,
    getAttribute: () => "/english/",
  };
  assert.ok(canHandleLink({ button: 0 }, anchor, base));
  assert.equal(canHandleLink({ button: 0, ctrlKey: true }, anchor, base), null);
  assert.equal(
    canHandleLink({ button: 0 }, { ...anchor, target: "_blank" }, base),
    null,
  );
});
test("Source has one unkeyed provider, live route rendering, and deep-link app bundles", () => {
  const app = read("src/App.jsx");
  assert.equal((app.match(/<PlayerProvider>/g) || []).length, 1);
  assert.match(app, /<PlayerProvider>\s*<Router\s*\/>\s*<\/PlayerProvider>/);
  assert.doesNotMatch(app, /const PAGE|INITIAL_PATH|PlayerProvider key=/);
  assert.doesNotMatch(
    read("src/components/SearchOverlay.jsx"),
    /location\.href\s*=/,
  );
  for (const id of [
    "billie-jean",
    "danza-kuduro-ai-cover",
    "koto-din-bhebechhi-cover",
  ]) {
    const html = read(`dist/song/${id}/index.html`);
    assert.match(html, /<script type="module"/);
    assert.match(html, /og:title/);
    assert.doesNotMatch(html, /a\.onplay=function/);
  }
});
test("React lifecycle: route changes and back keep audio identity, source, playback, position, queue and one counted listen", async () => {
  // This is a mocked audio element, not real browser/media playback. All fetches are trapped locally.
  const bundle = new URL(
    "../node_modules/.cache/continuity-test.mjs",
    import.meta.url,
  );
  await build({
    stdin: {
      contents:
        'export {PlayerProvider,usePlayer} from "./src/components/MiniPlayer.jsx"; export {navigate,usePath,installInternalNavigation} from "./src/lib/nav.js"; export {default as RouteBoundary} from "./src/components/RouteBoundary.jsx";',
      resolveDir: process.cwd(),
      loader: "jsx",
    },
    outfile: bundle.pathname,
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
  const events = new EventTarget(),
    loc = new URL(base),
    storage = new Map(),
    requests = [];
  globalThis.window = Object.assign(events, {
    location: loc,
    matchMedia: () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }),
  });
  globalThis.location = loc;
  globalThis.scrollY = 0;
  globalThis.scrollTo = () => {};
  globalThis.requestAnimationFrame = (f) => setTimeout(f, 0);
  globalThis.cancelAnimationFrame = clearTimeout;
  const documentEvents = new EventTarget();
  globalThis.document = {
    addEventListener: documentEvents.addEventListener.bind(documentEvents),
    removeEventListener:
      documentEvents.removeEventListener.bind(documentEvents),
    documentElement: { classList: { contains: () => false } },
    body: { style: {} },
    getElementById: () => ({ scrollIntoView() {} }),
    querySelector: () => null,
  };
  globalThis.localStorage = {
    getItem: (k) => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, v),
  };
  globalThis.sessionStorage = localStorage;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { webdriver: false },
  });
  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url, method: options.method || "GET" });
    return { ok: true, json: async () => ({ counted: true }) };
  };
  const stack = [base];
  let pointer = 0;
  globalThis.history = {
    state: null,
    pushState(s, _, url) {
      this.state = s;
      loc.href = new URL(url, loc.href).href;
      stack.splice(++pointer);
      stack[pointer] = loc.href;
    },
    replaceState(s, _, url) {
      this.state = s;
      loc.href = new URL(url, loc.href).href;
      stack[pointer] = loc.href;
    },
    forward() {
      if (pointer < stack.length - 1) {
        loc.href = stack[++pointer];
        window.dispatchEvent(new Event("popstate"));
      }
    },
    back() {
      if (pointer > 0) {
        loc.href = stack[--pointer];
        window.dispatchEvent(new Event("popstate"));
      }
    },
  };
  const {
    PlayerProvider,
    usePlayer,
    navigate,
    usePath,
    installInternalNavigation,
    RouteBoundary,
  } = await import(bundle.href);
  let player, visible;
  const mock = {
    paused: true,
    currentTime: 0,
    duration: 260,
    src: "",
    loads: 0,
    plays: 0,
    load() {
      this.loads++;
    },
    play() {
      this.plays++;
      this.paused = false;
      return Promise.resolve();
    },
    pause() {
      this.paused = true;
    },
  };
  function RouteProbe() {
    player = usePlayer();
    visible = usePath();
    return React.createElement("section", { "data-route": visible }, visible);
  }
  let tree;
  await act(async () => {
    tree = Renderer.create(
      React.createElement(
        PlayerProvider,
        null,
        React.createElement(RouteProbe),
      ),
      { createNodeMock: (element) => (element.type === "audio" ? mock : null) },
    );
  });
  const track = {
    ...ENGLISH_ALL.find((t) => t.id === "danza-kuduro-ai-cover"),
    playlist: "english",
  };
  await act(async () => {
    player.toggle(track, [track]);
  });
  const audioNode = tree.root.findByType("audio");
  await act(async () => {
    audioNode.props.onPlay({ currentTarget: mock });
  });
  for (const time of [0.1, 0.9, 1.7])
    await act(async () => {
      mock.currentTime = time;
      audioNode.props.onTimeUpdate({ currentTarget: mock });
    });
  await act(async () => {
    mock.currentTime = 47.2;
    audioNode.props.onTimeUpdate({ currentTarget: mock });
  });
  assert.equal(requests.filter((r) => r.method === "POST").length, 0);
  const uninstall = installInternalNavigation();
  const linkEvent = new Event("click", { cancelable: true });
  Object.defineProperties(linkEvent, {
    button: { value: 0 },
    target: {
      value: {
        closest: () => ({
          target: "",
          hasAttribute: () => false,
          getAttribute: () => "/#music",
        }),
      },
    },
  });
  await act(async () => {
    documentEvents.dispatchEvent(linkEvent);
  });
  assert.equal(linkEvent.defaultPrevented, true);
  assert.equal(location.hash, "#music");
  const queue = player.queue,
    source = mock.src,
    identity = audioNode.instance;
  for (const url of [
    "/#collections",
    "/playlists/",
    ...LANGUAGE_PLAYLISTS.map((p) => p.href),
    "/english/",
    "/song/billie-jean/",
    "/artist/srd-masum/",
    "/copyright/",
    "/",
  ]) {
    await act(async () => {
      navigate(url);
    });
    assert.equal(tree.root.findByType("audio").instance, identity);
    assert.equal(mock.src, source);
    assert.equal(mock.currentTime, 47.2);
    assert.equal(mock.paused, false);
    assert.equal(player.playing, true);
    assert.equal(player.track.id, track.id);
    assert.equal(player.queue, queue);
  }
  await act(async () => {
    history.back();
  });
  assert.equal(visible, "/copyright/");
  await act(async () => {
    history.forward();
  });
  assert.equal(visible, "/");
  for (const time of [47.9, 48.8])
    await act(async () => {
      mock.currentTime = time;
      audioNode.props.onTimeUpdate({ currentTarget: mock });
    });
  assert.equal(
    requests.filter((r) => r.method === "POST").length,
    1,
    "The partly-heard listen crosses 3 seconds after navigation, rather than restarting",
  );
  for (const time of [49.5, 50.2, 50.9, 51.6, 52.3])
    await act(async () => {
      mock.currentTime = time;
      audioNode.props.onTimeUpdate({ currentTarget: mock });
    });
  uninstall();
  assert.equal(mock.loads, 1);
  assert.equal(mock.plays, 1);
  assert.equal(
    requests.filter((r) => r.method === "POST" && r.url.includes("/api/plays/"))
      .length,
    1,
  );
  function BrokenRoute() {
    throw new Error("Simulated route rendering failure");
  }
  const report = console.error;
  try {
    console.error = () => {};
    await act(async () => {
      tree.update(
        React.createElement(
          PlayerProvider,
          null,
          React.createElement(
            RouteBoundary,
            null,
            React.createElement(BrokenRoute),
          ),
        ),
      );
    });
  } finally {
    console.error = report;
  }
  assert.equal(
    tree.root.findByType("audio").instance,
    identity,
    "A failing route cannot unmount the audio root",
  );
  assert.equal(mock.paused, false);
  assert.equal(mock.loads, 1);
  assert.equal(
    tree.root.findByProps({ role: "alert" }).props.className,
    "studio-section studio-route-error",
  );
  // Restore the route probe, then exercise actual provider playlist actions with local audio only.
  await act(async () => {
    tree.update(
      React.createElement(
        PlayerProvider,
        null,
        React.createElement(RouteProbe),
      ),
    );
  });
  const english = playlistBySlug("english").tracks,
    bangla = playlistBySlug("bangla").tracks;
  await act(async () => {
    player.startPlaylist(english);
  });
  assert.deepEqual(
    player.queue.map((t) => t.id),
    english.map((t) => t.id),
  );
  assert.equal(player.track.id, english[0].id);
  assert.equal(player.shuffle, false);
  await act(async () => {
    player.step(1, true);
  });
  assert.equal(player.track.id, english[1].id);
  await act(async () => {
    audioNode.props.onEnded({ currentTarget: mock });
  });
  assert.equal(
    player.track.id,
    english[2].id,
    "Natural track completion stays in this playlist",
  );
  await act(async () => {
    player.step(-1, true);
  });
  mock.currentTime = 0;
  await act(async () => {
    player.previous();
  });
  assert.equal(player.track.id, english[0].id);
  await act(async () => {
    player.step(-1, true);
  });
  assert.equal(
    player.track.id,
    english.at(-1).id,
    "Previous wraps inside the language playlist",
  );
  await act(async () => {
    player.step(1, true);
  });
  assert.equal(
    player.track.id,
    english[0].id,
    "Next wraps inside the language playlist",
  );
  await act(async () => {
    player.startPlaylist(bangla, { shuffle: true });
  });
  assert.equal(player.shuffle, true);
  assert.ok(bangla.some((t) => t.id === player.track.id));
  await act(async () => {
    player.step(1, true);
  });
  assert.ok(bangla.some((t) => t.id === player.track.id));
  assert.deepEqual(
    player.queue.map((t) => t.id),
    bangla.map((t) => t.id),
  );
  // Selecting the same recording from a different scoped list must still adopt that list.
  const selected = player.track,
    priorLoads = mock.loads;
  const solo = [{ ...selected, playlist: "language:solo-test" }];
  await act(async () => {
    player.toggle(solo[0], solo);
  });
  assert.equal(
    mock.loads,
    priorLoads,
    "Same-song queue adoption does not reset position/counting",
  );
  assert.equal(player.queue.length, 1);
  assert.equal(player.queue[0].playlist, "language:solo-test");
  await act(async () => {
    tree.unmount();
  });
});
