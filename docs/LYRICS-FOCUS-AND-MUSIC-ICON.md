# Prominent music icon and professional line focus

This follows the owner's request for a genuinely visible music icon and stronger synchronized highlighting, while retaining the preferred centered classic reader and real cover-derived atmosphere.

## Visible instrumental icon

- A real 38px duotone MusicNotes SVG sits in a 64px softly lit circular medallion, with an 88px accessible touch area. It replaces the inconspicuous text-note glyphs; there is no fake equalizer or status heading.
- It appears only for the current valid intro/interlude/outro interval in the active playback context. Exact interval, backward-seek and track-switch logic is unchanged.
- Both fullscreen and song-detail readers now receive the actual shared player's `playing` state. The icon's gentle float/orbit animations are paused by default, run only when `data-playing="true"`, freeze on pause, and are entirely disabled by reduced motion. The icon remains visible/static when paused inside a valid break.
- Decorative motion is not claimed to be beat-synchronized. The real cover visualizer is untouched.

## Clearly highlighted current line

- Bright mint-white text, a restrained lavender/mint elliptical wash, soft halo and a small centered gradient underline visibly distinguish the active line. No side bar, garish neon, huge headline or untimed section headings.
- Centered approximately 54px single-line cadence, readable gray neighbors, multilingual line height and gentle edge fades remain.
- Both inactive and active lines use weight 600 and identical font metrics. A single whole-line inner span scales only 1.025 while the outer button/scroll geometry stays fixed; horizontal padding reserves breathing room. This avoids active-weight wrapping/reflow and preserves Hindi/Bangla combining marks. Reduced motion disables the scale/transition, not the visible color/underline focus.
- Theme-aware default colors preserve contrast on song detail pages; fullscreen's artwork scene uses its own light mint/lavender focus tokens.

All song text, supplied Sajan timings, audio files, exact gap intervals, navigation continuity, counters, worker, ads, analytics and Mira safeguards remain unchanged. No word-level timings or karaoke were invented.

Regression tests inspect actual CSS rules/play-state/reduced-motion gates and real SVG rendering, plus Laal Dupatta 95s, 117.4 vocal onset, Sajan 36.64 onset, pause and backward seeks. Full existing regressions also run. These are source/component checks, not device visual or audible QA.
