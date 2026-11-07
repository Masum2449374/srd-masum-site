# Original reader + premium controls: explicit split

Baseline: `f9e3b91c83966aca82c22b2203f21faaf7b8f653`.
Latest clarification: only the LYRIC READING presentation should be original. The old Lyrics pill, white transport, progress and navigation must NOT return.

## Original portion (unchanged in this split)

`LyricsPanel.jsx`, its frozen-source generated stylesheet and the original artwork background source remain unchanged from the exact reader restoration. Centered 19px/26px semibold type, original active-line scale/ink, past/upcoming colors, three musical notes/progress, stanza/section labels, 30vh spacers, 15%/85% fades and center-scrolling are retained. No medallion, halo, underline, side rule or new heading is introduced.

The frozen `baseline/production-f9e3b91/` files and SHA manifest establish actual source provenance. `build-production-lyrics-css.mjs` reproduces isolated original CSS. Only the reader and artwork atmosphere receive `production-lyrics-scope`; the premium header, console, buttons, tabs, credits and queue MUST remain outside that scope.

## Premium portion

One `StudioNowPlaying` owns all three views and one metadata/timeline/transport/footer instance. Listening/Lyrics/Queue tabs remain mounted and Lyrics is selected while reading. Mobile lyrics uses the existing premium violet/mint controls in a compact footer (56px primary, at least 44px secondary controls/tabs), safe-area padding and a flexible zero-minimum lyric viewport. Desktop retains the premium artwork/console and side reader. Listening's existing gap fix is unchanged. Retired `ProductionLyricsScene`/`ProductionLyricsShare` are removed so an old footer cannot reappear.

## Preserved behavior and verification

No provider/audio element, navigation, queue, counters, song data, timestamps, worker, ads, analytics or Mira behavior changes. All 34 supplied Sajan lines and exact interval boundaries are untouched. Correct language attributes, disabled inactive seeks, paused notes, reduced-motion behavior and manual-scroll grace remain.

Tests compare the reader independently against compiled original production JSX for every lyric-enabled recording; test the new shell on both viewport branches through Listening/Lyrics/Queue, one footer/seek/play/tabs, callbacks and queue selection; retain interval/seek and persistent-audio lifecycle regressions. Source checks keep footer outside the isolation boundary. No browser/device visual or audible QA is claimed.
