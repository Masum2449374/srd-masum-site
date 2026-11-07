import VerifiedBadge from "./VerifiedBadge.jsx";
import { artistOf, isVerified } from "../lib/artists.js";

// One artist/badge policy across compact cards, metadata, queues and credit sheets.
// Badge reflects existing site-curated/account status; it is not external endorsement.
export default function ArtistCredit({ track, size = 12 }) {
  return <span className="artist-credit"><span className="artist-credit-name">{track?.uploader?.displayName || artistOf(track)}</span>{isVerified(track) && <VerifiedBadge size={size} />}</span>;
}
