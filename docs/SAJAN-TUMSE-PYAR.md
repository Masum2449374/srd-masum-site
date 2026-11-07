# Requested song addition — preview only

## Identification and provenance

- Title: Sajan Tumse Pyar
- Performers: Udit Narayan & Alka Yagnik (not SRD Masum; `verified: false`)
- Album: Maine Pyaar Kyun Kiya (Original Motion Picture Soundtrack)
- Language: Hindi
- Music: Himesh Reshammiya; lyrics/songwriting: Sameer
- Label: T-Series / Super Cassettes Industries Private Limited
- Original soundtrack release: 24 May 2005 (not a claim about the supplied file's edit date)
- Supplied MP3 duration: **247.536 seconds / 4:07.536**; 4,997,318 bytes
- SHA-256: `8e0e606fb6731801e46f3e0518f3b97b791ff7886b87f4596b7a1cdc51db1455`

ffprobe identifies title, both performers and album in the existing file tags. The embedded picture is a matching song-video thumbnail. Official catalogue sources corroborate the song identity and Hindi language. A local-only speech-language sample also detected Hindi; no audio was sent to an external transcription service.

The commercial soundtrack listings run about 4:25–4:26, whereas the supplied file runs 4:07.536. No reliable edit/remix/speed designation is present. The site therefore displays **Provided recording (edit unspecified)** and explains the duration difference in song information; it does not invent a sped-up/remix/original-full-version claim. The original MP3 remains byte-for-byte unchanged, including its tags and embedded image. Its malformed lyric tag is not imported as site lyrics, and no new lyrics/sync timing were fabricated.

Sources opened for this addition:
- https://music.apple.com/in/song/sajan-tumse-pyar/1138107257 — title, performers, soundtrack, original release date; the linked official Apple catalogue artwork.
- https://itunes.apple.com/lookup?id=1138107257&entity=song&country=IN — official metadata/art URL and commercial duration 265.947 seconds.
- https://www.jiosaavn.com/song/sajan-tumse-pyar/QDFSBg5WZGM — Hindi, composer Himesh Reshammiya, singers, lyricist Sameer and copyright holder.
- https://open.spotify.com/track/6Df7LnLJUifLIDYJbvzVhQ — matching track/artists, soundtrack and service destination.
- https://www.youtube.com/watch?v=jSkBtDg-8lg — matching T-Series full-video destination.

The real square soundtrack cover, rather than the video's landscape thumbnail, comes from:
https://is1-ssl.mzstatic.com/image/thumb/Music18/v4/81/ff/b3/81ffb34b-e0fd-0522-aadb-6ca865a68c42/8902894119672_cover.jpg/800x800bb.jpg

Only local size/format derivatives were made (800px JPEG/WebP, 512px JPEG, 96px thumbnail). No invented/generated artwork was used.

Follow-up: the owner subsequently supplied 34 Romanized Hindi lyric lines. They are now acoustically synchronized to this exact edit; the malformed embedded lyric tag remains unused. See `SAJAN-LYRICS-ALIGNMENT.md` for timing evidence and machine-alignment limitations.

## Storage and serving

The existing music project's R2 MEDIA binding points at private bucket `srd-masum-media`. Its managed public domain is disabled and no custom domain exists. Neither setting was changed.

The requested unchanged file was uploaded with the sanctioned Wrangler R2 CLI to a unique, previously unused object key:
`preview-assets/20261107/sajan-tumse-pyar-8e0e606fb673-6555353ff48c.mp3`

The preview worker adds a GET/HEAD-only, exact-path allowlist:
`/audio/preview/sajan-tumse-pyar-8e0e606fb673.mp3`

It reads only that mapped R2 object and implements full/suffix/open byte ranges, HEAD, cache validators and 416 responses. Arbitrary object paths, write methods and non-preview hosts are rejected. No generic R2 browser or private-upload access is exposed. The existing upload/auth workflow remains hidden. No D1 catalogue record, approval queue, production index or production resource configuration was mutated.

The new entry is `previewOnly: true`; its share links use the current preview origin. The new static song metadata/share-card URLs use the existing preview branch alias, so they do not reference an unpublished production asset. Existing songs retain canonical production sharing. Original songs stay first on the homepage; this third-party song appears in the real catalogue, the existing artist collection and the Hindi playlist (now 2 tracks; total catalogue 24).

**Promotion gate:** this song is intentionally not served on the production domains. If the owner later authorizes production, review the preview-only host/share gate as part of that separately authorized promotion; merely merging this flag unchanged is not a production release procedure.

## Validation / limitations

Automated tests cover metadata, actual counts, non-verification, cover availability, direct song page, Hindi membership, persistent navigation, and mocked R2 GET/HEAD/206/304/416/denial behavior without any real play/visit/Mira writes. The built worker is copied and compared byte-for-byte to source. The existing playback/counter engine, ads, Smartlink, analytics and hidden flags remain unchanged.

Preview verification may read the audio asset and ranges directly (no player or scripts). A successful byte/hash/range check is not browser audible/visual QA. Browser playback, touch seeking and listening quality remain unverified here. Non-fatal build warnings include the existing MiraCall import pattern and a main JS chunk slightly above 500 kB.
