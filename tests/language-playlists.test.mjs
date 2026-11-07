import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  LANGUAGE_PLAYLISTS,
  CATALOGUE,
  TRACK_LANGUAGES,
  playlistBySlug,
  languageLabel,
} from "../src/data/language-playlists.js";
import { internalDestination } from "../src/lib/navigation-core.js";
const read = (p) =>
  fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
test("All 23 existing recordings have one reviewed language bucket; no missing, duplicate or invented songs", () => {
  assert.equal(CATALOGUE.length, 23);
  assert.deepEqual(
    Object.keys(TRACK_LANGUAGES).sort(),
    CATALOGUE.map((t) => t.id).sort(),
  );
  const grouped = LANGUAGE_PLAYLISTS.flatMap((p) => p.tracks);
  assert.equal(grouped.length, CATALOGUE.length);
  assert.equal(new Set(grouped.map((t) => t.id)).size, 23);
  assert.deepEqual(
    grouped.map((t) => t.id).sort(),
    CATALOGUE.map((t) => t.id).sort(),
  );
  for (const p of LANGUAGE_PLAYLISTS) {
    assert.ok(p.tracks.length);
    for (const t of p.tracks) {
      assert.equal(t.playlist, `language:${p.slug}`);
      assert.equal(t.src, CATALOGUE.find((x) => x.id === t.id).src);
    }
  }
  assert.deepEqual(
    Object.fromEntries(
      LANGUAGE_PLAYLISTS.map((p) => [p.slug, p.tracks.length]),
    ),
    {
      bangla: 2,
      english: 16,
      hindi: 1,
      russian: 1,
      multilingual: 2,
      unclassified: 1,
    },
  );
});
test("Bilingual recordings are explicit, Russian is not Hindi, and uncertain Aashiqana is not guessed", () => {
  assert.deepEqual(
    playlistBySlug("multilingual").tracks.map((t) => t.id),
    ["danza-kuduro-ai-cover", "dekha-tenu-pehli-pehli"],
  );
  assert.equal(
    languageLabel({ id: "danza-kuduro-ai-cover" }),
    "Spanish + Portuguese",
  );
  assert.equal(
    languageLabel({ id: "dekha-tenu-pehli-pehli" }),
    "Hindi + Punjabi",
  );
  assert.equal(playlistBySlug("russian").tracks[0].id, "sladkaya-myata");
  assert.equal(playlistBySlug("hindi").tracks[0].id, "laal-dupatta");
  assert.equal(playlistBySlug("unclassified").tracks[0].id, "aashiqana");
  assert.equal(
    playlistBySlug("english").tracks.some(
      (t) => t.id === "danza-kuduro-ai-cover",
    ),
    false,
  );
  assert.equal(
    languageLabel({ id: "unreviewed-future-song" }),
    "Language to confirm",
  );
});
test("Language pages have real app routes, canonical/meta cards, crawler track lists and sitemap entries", () => {
  for (const p of [
    { href: "/playlists/", title: "Language playlists" },
    ...LANGUAGE_PLAYLISTS,
  ]) {
    assert.ok(internalDestination(p.href, "https://review.invalid/"));
    const html = read("dist" + p.href + "index.html");
    assert.match(html, /<script type="module"/);
    assert.ok(html.includes(`href="https://srdmasum.bbroot.com${p.href}"`));
    assert.ok(html.includes(p.title));
    assert.match(html, /og\/playlist-/);
    if (p.tracks)
      for (const t of p.tracks) assert.ok(html.includes(`/song/${t.id}/`));
    assert.ok(read("dist/sitemap.xml").includes(p.href));
  }
});
test("Every static song entry uses premium music-space wordmark, not old cartoon header or independent transport", () => {
  for (const t of CATALOGUE) {
    const html = read(`dist/song/${t.id}/index.html`);
    assert.ok(html.includes("sp-brandmark"));
    assert.ok(html.includes("THE MUSIC SPACE"));
    assert.ok(!html.includes('<img src="/images/avatar.webp"'));
    assert.ok(!html.includes("Back 10 seconds"));
    assert.ok(!html.includes('var a=$("sa")'));
  }
  const mixed = read("dist/song/danza-kuduro-ai-cover/index.html");
  assert.ok(mixed.includes("Spanish + Portuguese"));
  const uncertain = read("dist/song/aashiqana/index.html");
  assert.ok(uncertain.includes("Language to confirm"));
});
