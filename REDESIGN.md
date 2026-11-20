# SRD Masum — Premium redesign (2026-11-20)

Complete visual redesign. Same project structure, file names, routes, build
commands (`npm run build`, `npm test`) and deploy flow.

## What changed

- **New design system — `src/premium.css` (new file, loaded last in `src/main.jsx`)**
  Deep-ink dark theme (`#08090d` canvas) + clean light theme, one vivid blue
  accent (`#2e7dff`, deep `#0b5cff`) replacing the mixed lavender/blue accents,
  Sora display + Inter body type scale, 20–28px radii, soft layered shadows,
  glass chrome, calm 200–300ms motion with full `prefers-reduced-motion`
  support. Mobile-first, then tablet/desktop.
- **Home** — gradient-mesh hero with gradient headline, glass featured-release
  card (no more tilted card), larger section titles, music cards with hover
  lift, cover zoom and a revealing blue play button; official-artist card and
  language/collection cards restyled.
- **Navigation** — glass sticky top bar with pill search, restyled desktop
  sidebar (active blue pill), floating glass mobile bottom-nav pill.
- **Player** — floating glass mini-player card on mobile (above the nav pill),
  glass desktop bar, bigger blue play button, white seek thumbs, segmented
  glass Lyrics / Listening / Queue tabs in the full player, restyled queue,
  credits sheet and share menu.
- **Lyrics** — the synced-lyrics reader itself is untouched (exact lines,
  timings, highlight, music-note marker and scrolling are preserved by the
  test suite); only its surrounding card/panel chrome is new.
- **Song / artist / playlist pages** — bigger display titles, rounded
  artwork with soft shadows, blue gradient headlines, pill Shuffle / Play-all
  buttons, polished track rows and playlist tables.
- **Search** — glass sheet, larger input, rounded result rows.
- **Footer** — new 3-column footer (brand, Browse links, Follow & contact),
  same socials only (Instagram, WhatsApp, Telegram) and the visitor counter.
- **404** — `public/404.html` was empty; now a full premium 404 page.
- **Theme** — `tailwind.config.js` accent is now the same blue (`#2e7dff`,
  white text on accent); `index.html` theme-color matches the new themes.

## What was NOT changed (still working exactly as before)

- One shared persistent player (`PlayerProvider` / single `<audio>`), queue,
  shuffle/repeat/volume, Media Session, 3-second play counting, visit counter.
- All 24 songs, catalog data, synced lyrics, language playlists with
  "Play all", search, share links, PWA (`manifest.webmanifest`, `sw.js`).
- Google Analytics GA4 `G-YJKYZ129RT`, all Adsterra code (Popunder, Social
  Bar, Native Banner, 320×50 / 300×250 / 728×90) and the Smartlink rule
  (new tab at most once every 15 minutes, never stops the song).
- "Ask Mira" chatbot and `worker/_worker.js` (untouched).
- English-only, SRD Masum's own songs first, login/upload stay hidden,
  SEO titles/meta/Open Graph/schema.org/sitemap, verified badges (same small
  blue badge, 14px label above artist names).

## Verification

- `npm run build` — succeeds (24 song pages, worker packaged).
- `npm test` — all tests in `tests/` pass.
