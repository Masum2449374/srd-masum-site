# Premium interior / continuous listening — preview review

## Scope and inventory

The approved discovery homepage is kept, including its existing songs, sections and order. This iteration extends its charcoal, violet and mint visual system to:

- Full-screen now-playing: artwork-led atmosphere, grip-only drag dismissal, a stronger primary control, real mint-tinted spectrum, accessible transport/seek controls, dynamic viewport and safe-area layout.
- Listening / Lyrics / Queue views: scrolling actual queue, current item indicator, keyboard tab navigation, existing line-level seek and active lyrics. Desktop shows a separate lyrics/queue panel alongside artwork. Mobile keeps the transport visible while changing views.
- Credits / song information everywhere: full wrapping title, real cover, restrained metadata rows, release date, aligned real Spotify/YouTube destinations and accessible dismissal. No invented credits or links.
- Share: native share where supported; premium copy/WhatsApp/Telegram fallback with keyboard support.
- Real song-detail routes: real artwork, title, artist, play counts, play/resume, credits, share and lyrics. Browsing a different song does not change the currently playing track.
- Artist pages, English and collections: retain the already-approved premium components and gain continuous internal navigation.
- Search: retain the premium search surface and real results; Enter and result links now navigate without replacing the audio root. Empty results and close targets are refined.
- Mini-player: the approved compact premium treatment and its controls remain, sharing the same stable audio element with expanded mode.
- Mira: coordinated chat header/input/button treatments and art-led premium voice-call shell. Behavior and public wording do not expose implementation details.
- Install prompt, newsletter validation/busy/status states, legal page, public-profile surfaces and not-found states, and lazy-route loading/error states are coordinated. A route error boundary protects the audio root if a content component fails. Light theme and reduced motion are supported in the new interior styles.
- Static crawler/no-JavaScript song fallback remains readable with a native audio control; its styles are scoped so they cannot recolor the React app after navigation. Generated song metadata and lyrics remain.

Dormant or intentionally hidden auth, upload, admin and profile-edit forms were not enabled or promoted. Removed video/Bollywood/community sections remain removed. Their underlying hidden workflows are not part of the public redesign.

## Navigation regression

Previously, only artist/profile paths were SPA-intercepted. Explore/home/English/song links and search Enter could perform a full document load. Song HTML also removed the app bundle and ran its own standalone audio controller. Those document replacements necessarily stopped the shared audio element.

The application now has one unkeyed PlayerProvider above all route content. Same-origin supported route anchors use history navigation, including hash sections, song/artist/profile paths, English, home and copyright. Search uses that same navigation function. Back/forward swaps only content. Song pages retain the React bundle on direct entry, and the old independent inline audio controller is no longer emitted. The existing mount-only deep-link cue remains; browsing song details after startup does not cue/replace the current track.

External/new-tab/download/modified-click links, API routes, ad destinations and Smartlink routes are deliberately not intercepted. A full reload or leaving the site is not promised continuous playback.

## Validation

`npm run build`, `npm test` and `git diff --check` are the release gates. There is no configured lint or TypeScript check script in this JavaScript project.

The Node React lifecycle test mounts the actual PlayerProvider with a mock audio element and the real navigation hook. It checks stable element identity, source, play state, position, queue and a partial listen crossing the 3-second threshold across internal route changes, then checks no duplicate count. A simulated rendering failure also verifies that the route error boundary does not unmount audio. All fetches in that test are locally trapped; it cannot write real plays. It tests delegated Explore/hash navigation, home/English/song/artist/copyright and back/forward, while pure policy assertions additionally cover profile/account routes and exclusions.

Other tests render mobile/desktop interiors, actual Billie Jean synced lyrics, real credits/service links and inactive-detail lyrics safety, and check all generated song pages and worker packaging. These are non-browser/unit/source/render checks, NOT actual browser audio or visual verification.

## Preserved safeguards

The worker, actual song/lyrics data, playback/counter engine, beat capture/analysis, analytics ID, ads/15-minute Smartlink logic and hidden-feature flags are retained. The built `dist/_worker.js` is copied from `worker/_worker.js` and compared byte-for-byte by tests.

No ad or Smartlink was clicked; no `/go` request or production API mutation was used for testing. Local `npm run dev:design` suppresses ad setup, strips analytics and traps API requests. The deployed preview retains production integration behavior and can share bindings: block ads/analytics and mutating API requests before interactive browser QA. Production must not be changed or merged until separately authorized.

## Remaining verification

A real browser visual pass (especially 461×1024 including browser chrome), touch dragging/seek, audible playback across routes, MediaSession/lock-screen behavior and live Mira calls remain unverified here. The parent browser could not reach safe local servers, and no Shell browser automation was used. The pre-existing static/dynamic MiraCall import build warning remains non-fatal.
