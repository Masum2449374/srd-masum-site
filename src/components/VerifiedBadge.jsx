// Bright scalloped verified seal; crisp at small sizes, same in dark and light themes.
export default function VerifiedBadge({ size = 14, className = "" }) {
  return (
    <svg role="img" aria-label="Verified artist" width={size} height={size} viewBox="0 0 24 24" shapeRendering="geometricPrecision"
      className={`srd-verified inline-block shrink-0 self-center ${className}`}>
      <title>Verified artist</title>
      <path d="M12.00 2.60Q15.89 0.02 17.53 4.40Q22.19 4.59 20.94 9.10Q24.60 12.00 20.94 14.90Q22.19 19.41 17.53 19.60Q15.89 23.98 12.00 21.40Q8.11 23.98 6.47 19.60Q1.81 19.41 3.06 14.90Q-0.60 12.00 3.06 9.10Q1.81 4.59 6.47 4.40Q8.11 0.02 12.00 2.60Z" fill="#0A66FF" />
      <path d="M8.1 12.2l2.7 2.7 5.1-5.5" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Glue the small raised badge to the name ending, never to an empty new line.
// Long unbroken final words keep a short terminal group so narrow columns can wrap.
export function NameWithBadge({ name, verified, size = 13, className = "" }) {
  const s = String(name || "");
  if (!verified) return s;
  const boundary = s.lastIndexOf(" ") + 1;
  const word = s.slice(boundary);
  const letters = typeof Intl.Segmenter === "function"
    ? [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(word)].map(x => x.segment)
    : Array.from(word);
  const tail = letters.slice(-2).join("");
  const prefix = s.slice(0, s.length - tail.length);
  return (<>{prefix}<span className="verified-name-tail">{tail}<VerifiedBadge size={size} className={`verified-name-raised ${className}`} /></span></>);
}
