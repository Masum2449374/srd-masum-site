# Reported Laal Dupatta break/section-label issue

## Diagnosis, not a guessed retiming

At the reported **95 seconds**, the existing Laal Dupatta data explicitly says the vocal break is **89.50–117.40 seconds**. The active Instrumental marker at that moment was therefore consistent with the timeline; it was not proof of a wrongly synchronized verse. The following “VERSE 1” was an untimed heading rendered permanently in the scroll text, not the currently sung line.

The reader rendered **all** break markers and section headings, including past/future ones, as ordinary scrolling content. That made the status/heading hierarchy confusing and inserted extra visual space. It also used a 150ms look-ahead for every row and did not respect the break's `until` bound, allowing early transitions and a stale final highlight after completion. Opening/seeking animated through intervening text instead of landing directly.

Read-only song-detail lyrics also received a zero clock even when a different song was playing. That could display an active intro-break cue for an inactive recording; following/highlighting is now enabled only for the active seekable playback context.

The parser additionally had a character-count vocal-end estimator. No currently configured catalogue break was found to depend on that heuristic, but it could manufacture unsupported gaps for future/incomplete timing data; it is now removed.

## Scoped audio evidence

The exact local Laal recording was inspected, with no player or production requests:

- Source: `public/audio/laal-dupatta.mp3`.
- SHA-256: `03d881dab10f37dc468389a632f1db43ebf72660ada30152fb72612debb9137d`.
- ffprobe duration: 293.041633 seconds; the existing catalogue display duration remains 293.02.
- Fresh local Whisper medium/Hindi word timestamps on overlapping windows found the first-verse onset at **117.44**, consistent with the existing **117.40** lyric anchor. The 94–108 window decoded no speech. One overlapping window produced unreliable repeated syllables, so it was not used to invent replacement lyrics or timestamps.
- Existing local ASR output also puts the verse around 117.44. These are machine checks, not a claim of human listening verification or exact independent confirmation of the 89.50 vocal end.

There is no sufficient evidence to move the existing known lyric/end timestamps, so **all lyric text and timing data are untouched**, including Sajan's uploaded-edit alignment.

## Correction

- Only the **currently active, explicitly timed** music break has a small classic musical-note cue. No fake equalizer, visible “Instrumental” status text, inactive break markers or section headings are inserted into the lyric reading flow. The live cue retains an accessible “Instrumental break” label.
- Break/line activity uses exact half-open `[start, until)` intervals, without the artificial early look-ahead. After playback duration there is no stale active cue. Seeking backwards recomputes from the actual clock; no incremental break-state cache is used.
- New breaks require explicit vocal-end metadata, except intros anchored to a real first-vocal timestamp. Short rests keep the current line naturally rather than guessing new music sections.
- Opening, track switches and jumps >2s land directly at the correct row. Normal consecutive line changes scroll smoothly, with no repeated scrolling inside the same line/break. Manual reading/resume and reduced motion remain respected.
- The user-preferred centered classic typography, original cover-derived atmosphere, compact controls, safe areas, Listening spacing and persistent audio engine remain intact.

## Regression coverage / limits

Tests cover 95s, just before/at 89.50 and 117.40, all other Laal break boundaries, completion/invalid clocks, absent guessed gaps, inactive headings/markers, repeated forwards/backwards seeks, track switches, exact line-tap seek, normal versus jump scrolling and manual reading. Existing Sajan timing, style, worker and playback/navigation checks also run.

No Shell browser automation or production play/visit/Mira writes are used. Device visual and audible QA remain outstanding.
