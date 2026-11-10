# Original artist verification placement: inspected, not guessed

Source examined: `git show f9e3b91:src/components/ArtistPage.jsx`, preserved unchanged in `baseline/production-f9e3b91/ArtistPage.jsx.txt`.

The original composition was unambiguous:

    <p className="inline-flex items-center gap-1.5 text-sm font-semibold"><VerifiedBadge size={14} />Verified Artist</p>
    <h1 data-testid="artist-name" ...>{a.name}</h1>

It was a separate small status row ABOVE the artist name, inside the text column. It was NOT a badge appended to the last line of the name, a superscript, or a portrait overlay. The legacy NameWithBadge helper existed but this artist page did not use it.

The previous preview incorrectly put a 13px superscript beside the name's final characters. This correction restores the actual original position and contents: 14px badge + “Verified Artist” first, plain wrappable h1 second. Existing premium portrait/grid/title design remains. Current artist.verified gating is preserved (the old unconditional status is not reintroduced); unverified pages show the neutral Artist collection label. No data, verification flags, lyrics, playback, homepage or worker changes.

Tests compare the original source placement contract and actual SSR output for Udit Narayan & Alka Yagnik, The Neighbourhood and SRD Masum, plus existing verification-state regressions. No browser visual QA claim is made.
