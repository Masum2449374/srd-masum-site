# Artist-derived verification badges

Display now follows the credited artist's existing site status instead of an isolated per-track flag.

An artist is verified only when at least one built-in catalog recording already counted as verified (`verified !== false`). Later recordings by that same credited name inherit the badge. Unknown names, impersonated names and unverified upload accounts do not gain a badge. The historical `verified: false` note on Sajan Tumse Pyar is left in the data and is no longer used to hide the Udit Narayan & Alka Yagnik seal already shown on Laal Dupatta.

Surfaces that already used `ArtistCredit` or `isVerified` inherit the change: home cards and featured hero, language/English/collection track lists, search song rows, song detail, credits, now-playing footer and queue, mini-player, generated song/language pages, and artist-page track rows. Uploader badges remain account-controlled.

No artist in the current 24-track catalog remains unverified after this derivation. Unverified in tests: unknown new names, mismatched impersonated credits, and uploaders with `verified: false`.
