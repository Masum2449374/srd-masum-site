# Sajan Tumse Pyar — supplied edit, supplied lyrics

This is website line synchronization, not a video. The original uploaded MP3 is unchanged.

- Exact source SHA-256: `8e0e606fb6731801e46f3e0518f3b97b791ff7886b87f4596b7a1cdc51db1455`.
- Container duration: **247.536 s**; decoded PCM is 247.525 s (MP3 frame/padding difference).
- Only the owner's **34 supplied Romanized Hindi lines**, in their original order and repetitions, are published. Two singing-elongation `~` markers were cleaned; all other supplied wording and punctuation remain. No extra verses, translations or intro ad-libs were imported.
- The commercial 4:25–4:26 recording was NOT used for timing.

## Real-audio method

1. Decode the exact uploaded file locally to mono 16 kHz PCM with ffmpeg.
2. Run local `Systran/faster-whisper-medium`, CPU int8, Hindi, with word timestamps. A complete-song pass found section anchors but skipped repeated/quiet singing. Overlapping 14-second windows, stepped every 12 seconds, with the speech-rejection gate disabled recovered additional words. Instrumental hallucinations were discarded rather than imported.
3. Acoustically force-align the supplied words with Whisper cross-attention/DTW (`find_alignment`) in <=28-second vocal windows. A phonetic Devanagari reference represented the SAME supplied lines only; the website retains the supplied Romanization. Repetitions have their own aligned word spans, not evenly divided guessed slots.
4. Re-align overlapping transition windows across the second-verse/final-chorus boundaries. Correct the known first-token leading-silence artifact using independently decoded vocal onsets. Use explicit decoded first-verse word anchors where the forced aligner compressed “Gore gore…” to near-zero word durations.
5. Store starts AND vocal ends. The shared lyric parser renders the long music breaks without falsely holding the preceding line.

Machine-derived line timings are estimates, not guaranteed syllable-perfect edges. Expect roughly sub-second boundary variation; dense singing and elongated vowels need listening QA. No word-level karaoke precision is claimed.

## Checked landmarks (seconds in the provided file)

- Opening two “Sajan…” lines: **36.64**, **41.90**.
- Opening three “Tut…” lines: **47.30**, **52.54**, **57.74**.
- Opening two “Janam…” lines: **62.64**, **68.14**.
- First verse: **108.98**; “Gore gore…” **114.80**; “Han mai…” **125.10**.
- Second verse: **166.56**; “Nindiya…” **182.44**.
- Final “Janam…” **203.34**, then three “Jaga…” lines **209.06**, **214.30**, **219.44**.
- Final two “Tut…” lines: **224.56**, **229.80**; last sung line ends **234.60**.
- Explicit gap indicators: intro **0–36.64**, break **88.58–108.98**, break **145.90–166.56**, outro **234.60–247.536**. Unprovided background vocalizations are not transcribed.

All 34 supplied lines are represented. No missing supplied verse was identified in the acoustic alignment; this is not a claim of independent human listening verification.

`docs/sajan-lyrics-timing.json` records the exact source/reference checksums, aligner version and all final starts/ends. Detailed raw ASR words, acoustic alignment output, overlap checks and runnable local scripts remain under `/workspace/song-sync-20261107/` for review; those private working transcripts are not bundled into the website.

## Shared lyrics presentation changes

The same reader is used for all songs, both fullscreen and song details. It now has readable inactive text, multilingual line spacing, restrained active emphasis, small instrumental bars, minimal leading padding and subtle fixed-pixel edge fades. Mobile lyrics mode condenses duplicate headings/album text and transport chrome while retaining accessible controls and safe areas. It offers exact line seeking, a five-second manual-reading pause and explicit Resume sync. Rect-based auto-scroll stays inside the reader and honors reduced motion.

Listening mode also removes the unnecessary “IN THE MOMENT” caption/divider. The growing, vertically-centered cover-stage region caused the gap between spectrum and song metadata; artwork, spectrum and metadata now form one compact group on mobile and desktop. The actual beat visualizer remains untouched.

Build, source/unit/lifecycle checks do not replace device visual or audible QA. No browser automation, production counter/Mira calls, ads, Smartlinks or `/go` requests are used for this work.
