# Language playlists — preview-only iteration

## Catalogue review

No recording was added, removed, re-uploaded or renamed in this iteration. The 23 existing track objects and their media/cover sources remain the source of truth. `src/data/language-playlists.js` adds a separately reviewed, explicit ID-to-language mapping, not a rule based on folders or legacy collection names. Each recording belongs to exactly one playlist:

| Playlist | Count | Evidence / handling |
| --- | ---: | --- |
| Bangla | 2 | Koto Din Bhebechhi: existing Bengali lyrics. Tomar Jonno Mon Kandere: Bengali title and existing SRD Music Bangla release metadata. |
| English | 16 | Named recordings/artist metadata cross-checked with locally inspected vocal samples; Billie Jean also has existing English lyrics. |
| Hindi | 1 | Laal Dupatta: existing Devanagari Hindi lyrics and matching soundtrack metadata. |
| Russian | 1 | Sladkaya Myata: existing Russian lyrics and matching embedded title/artist metadata. It is not classified as Hindi. |
| Multilingual | 2 | Danza Kuduro cover: Spanish + Portuguese; Dekha Tenu Pehli Pehli / Suraj Hua Maddham mashup: Hindi + Punjabi. Kept once each, rather than duplicated across single-language lists. |
| Language to confirm | 1 | Aashiqana by Radivyne: embedded tags do not identify language; local model checks were inconsistent/low-confidence, and public search results confused it with unrelated same-title recordings. It is deliberately NOT guessed as Hindi, Bangla, Japanese or Telugu. |

Source references for bilingual handling:
- https://en.wikipedia.org/wiki/Danza_Kuduro — original identified in the existing cover metadata; Spanish/Portuguese composition. Local cover samples contain corresponding Spanish/Portuguese phrases.
- https://www.reed.edu/slx-artifacts/artifacts/video/don-omar---danza-kuduro-ft--lucenzo.php — bilingual composition discussion.
- Existing `songs.js` identifies the Anurati Roy recording as the mashup with Suraj Hua Maddham.
- https://www.starmakerstudios.com/en/song/anuraty-roy-dekha-tenu-pehli-pehli-baar-vs-suraj-hua-maddham-lyrics/611752105027454395 — mixed Punjabi/Hindi text for the same mashup.
- https://open.spotify.com/track/0XZah5LIznBQyqi1UwKkf4 — matching mashup title/artist.

Offline language checks used public speech-model weights on existing local files only. No audio was uploaded to a speech service, no new song was downloaded, and no transcript was added to the public site. Automatic guesses were not accepted when contradicted by the text or low-confidence.

## Experience

- `/playlists/` is the premium overview; `/playlist/<slug>/` is a real, generated, shareable detail route.
- Home's Collections section, desktop Collections and mobile Collections expose the new lists. Existing `/english/`, the full catalogue, mixed legacy sections, direct song links and official-first home layout remain.
- Cards use actual cover collages and actual counts. Detail pages show actual tracks, duration totals, language labels, credits and links. Multilingual labels remain visible on phones.
- Play all adopts a scoped queue. Shuffle uses the same audio engine and remains inside that list. Legacy English/full-catalogue Play all controls also identify the actual queue, not only the current song, so they can correctly switch back from a language playlist. Selecting an already-playing recording from a different list adopts the requested queue without replacing the audio source or restarting the listening counter.
- Merely navigating through any playlist, overview, home, song/artist detail, or browser history does not change the current playback session.
- Generated HTML includes route-specific canonical/Open Graph metadata, playlist share cards, crawler track links and sitemap entries. Song-language metadata now uses the same reviewed mapping instead of folder inference.

## Standalone-header follow-up

The user's screenshot showed the first preview's old standalone transport. The previous interior iteration had already replaced that independent 10-second-skip controller with the persistent React shell (plus a native no-JavaScript fallback). However, the static fallback header still used the old avatar. This iteration newly replaces that residual avatar header with a restrained violet music-note brandmark, SRD Masum wordmark and THE MUSIC SPACE subtitle on all 23 generated song entries. Its fallback style is now fully scoped and consistent with the premium identity.

## Safeguards / validation

Build, unit/render/lifecycle/source tests and byte-identical worker packaging are required before the feature-branch push and preview deployment. Tests cover classification totals/no duplicate or missing IDs, real route documents, standalone branding, playlist next/previous/wrap/shuffle/same-song queue adoption and navigation continuity. There is no configured lint/typecheck script.

The worker, real track data, 3-second counter rules, ads/Smartlink behavior, analytics and hidden feature flags remain untouched. No real API mutation, ad click or `/go` request was used. Browser visual/audible/touch QA remains unperformed; offline speech inspection is not browser playback verification.
