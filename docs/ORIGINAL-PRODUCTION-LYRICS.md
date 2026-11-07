# Exact production lyrics presentation restoration

Requested baseline: `f9e3b91c83966aca82c22b2203f21faaf7b8f653`.
This supersedes the earlier classic-inspired and mint/halo experiments. No new lyrics visual design is introduced.

## Source reuse, not approximation

`baseline/production-f9e3b91/` freezes the actual original LyricsPanel, NowPlaying JSX, ShareButton, NowPlayingFX, stylesheet and Tailwind configuration, with commit/source paths and SHA-256 manifest. The original lyrics renderer is restored in `LyricsPanel.jsx`; its actual NowPlaying lyrics-mode layout/transport is `ProductionLyricsScene.jsx`. `ProductionLyricsFX.jsx` is byte-for-byte the original art/background/spectrum implementation (used ONLY in lyrics mode).

The original centered 19px/26px type, semibold line cadence, 1.04 active-line scale, original ink/past/upcoming colors, original three musical notes/progress, original stanza/section labels, 30vh scroll spacers and 15%/85% fades are reused. Original header, title/blue artist, Lyrics pill, info button, timeline, 72px play button, shuffle/repeat and desktop artwork/reader split are reused. No premium tabs, new headings, medallion, halo, underline or side rule remain in lyrics mode.

`build-production-lyrics-css.mjs` compiles the actual frozen original CSS/config against original component source. Selectors and keyframes are isolated to the restored scene/reader; declarations get priority over the newer global design. Thus current homepage, Listening, Queue and other premium panels retain their approved appearance. Original inherited font/letter spacing and scrollbar defaults are isolated from newer reader overrides. Generated `src/production-lyrics.css` is tracked for dev and reproducibly rebuilt with every production build.

## Minimal integration bridges

- The same existing PlayerProvider/audio element/queue is passed to the restored scene. There is NO new audio element, reload, source assignment or counter action when entering/exiting lyrics.
- The Lyrics pill returns to the current premium Listening view; desktop/mobile choose the actual original lyrics layout. The current approved Credits sheet is portaled outside the isolated styles.
- Current precise interval engine and ALL song data/timestamps remain unchanged, including the 34 Sajan lines and Laal's 89.5–117.4s break.
- Correct language attributes, disabled read-only seeks, paused-note freezing, reduced-motion scrolling/notes, track-change scroll reset and focus trap remain nonvisual safety bridges.
- Closed Share button is original; its menu uses Telegram instead of prohibited Facebook, real artist attribution, preview-aware URLs and opens downward inside the header viewport. No links are activated in tests.

## Verification and limitations

A reference-render test compiles the immutable original JSX independently and compares its rendered HTML with the restored scene for EVERY catalog song that has lyrics, mobile and desktop, including Laal 95s/117.4s and Sajan 36.64s. Only scope class, language and animation play-state safety additions are normalized. The stylesheet test verifies immutable hashes, reproducible generation and no unscoped selectors. Existing interval, supplied-text/timing, manual-scroll, seeking, reduced-motion, read-only and navigation/audio-identity/counting regressions remain.

These are source/component checks, NOT device visual or audible playback QA. No pixel-perfect claim is made without browser verification. No production deployment, ad/Smartlink navigation or production API mutation is part of verification.
