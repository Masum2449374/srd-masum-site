# Approved live promotion — November 7, 2026 (Asia/Dhaka)

User explicitly requested the corrected player live and missing verified icons restored.

## UI

Original lyric reader and frozen styles remain unchanged. One current premium metadata/timeline/transport/footer and Listening/Lyrics/Queue tabs are used on mobile and desktop. Old white Lyrics pill/footer are removed.

## Artist badge audit

No catalog/account verification flag was switched on. The previous owner-curated catalog policy already marked 23 recordings as badged; their rendering was omitted in new cards, track lists, song detail, featured release, credits, queue and most artist headings. These now share the same policy through ArtistCredit/isVerified. Existing mini-player, song list and generated song pages retained the policy; search is brought onto it too. Unknown records no longer silently get a badge. Account uploader verification remains owner-controlled. A badge is not evidence of external-platform endorsement.

Existing badged artist groups rendered consistently:
- Udit Narayan & Alka Yagnik
- The Milan
- Anurati Roy
- Radivyne
- SRD Masum
- Jibon Khan
- Tate McRae
- ADÉLA
- Ashe
- Olivia Rodrigo
- The Killers
- The Neighbourhood
- The Goo Goo Dolls
- Taylor Swift
- Tame Impala
- Ella Langley
- Malcolm Todd
- Olivia Dean
- Michael Jackson

Sajan Tumse Pyar explicitly remains unverified; no badge was fabricated for the new recording. The same artist group's older Laal Dupatta retains its pre-existing catalog badge state.

## Publication gates

The Sajan catalog entry is no longer preview-only. Canonical sharing, OG audio/image, JSON-LD and sitemap use https://srdmasum.bbroot.com. Audio is an allowlisted GET/HEAD route at /audio/releases/sajan-tumse-pyar-8e0e606fb673.mp3; it reads the existing immutable R2 object (no file overwrite/DB index mutation). Canonical/Pages/preview hosts are allowed; arbitrary objects/foreign hosts/writes remain blocked. The legacy preview-only URL still denies production. Both deployment environments already bind MEDIA to the same intended bucket.

## Safety

No change to original lyric text/timestamps, provider/audio identity, queue/counting rules, GA4, ad/15-minute Smartlink behavior, hidden auth/uploads or Mira. Build packages the worker. Tests are source/SSR/component/mocked-storage checks, not actual browser visual/audible QA. Live verification must only read HTML/assets/audio HEAD/ranges; never execute ad scripts or call counters/Mira.
