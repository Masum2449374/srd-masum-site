# Scoped classic lyrics appearance restoration

Design reference: production `main` commit `f9e3b91`, inspected read-only with `git show`. No branch reset, main modification, or production deployment.

- Shared lyrics return to centered, regular/medium-size lines, approximately 50px single-line cadence, gray neighboring lines, simple bright current line, small spaced section labels and gentle top/bottom fades. No colored caret, block, glow or scale effect.
- Fullscreen **lyrics mode only** reuses production's original cover-image filter, sampled-color blobs and dark gradient values. Local white/blue text tokens stay scoped to this mode, including under the light site theme. Listening keeps its approved charcoal presentation.
- Removed duplicate lyric headlines/branding from the fullscreen view. Normal reading has no permanent footer slogans; Resume sync appears unobtrusively only while manually reading.
- Current-line auto-scroll targets the reader's center using the improved rect-based calculation. Manual reading, exact tap seeking, reduced motion and safe-area/compact accessible controls remain.
- Homepage, new song/language playlists, persistent audio/navigation fixes, Listening gap fix, actual beat visualizer, ads, analytics, Mira and worker behavior are not reverted.
- All existing lyrics and timestamps, particularly Sajan's exact-edit alignment, are unchanged.

CSS AST assertions verify the centered typography, active-line treatment, original background settings and mode scoping. Shared reader lifecycle/seek and complete playback/navigation regressions are also run. These checks are not browser visual/audible verification; a phone comparison to the production screenshot is still required.
