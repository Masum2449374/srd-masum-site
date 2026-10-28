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

// Name with the badge glued to its last word (never orphans onto its own line).
export function NameWithBadge({ name, verified, size = 22, className = "" }) {
  const s = String(name || ""), i = s.lastIndexOf(" ");
  if (!verified) return s;
  return (<>{i > 0 ? s.slice(0, i + 1) : ""}<span className="whitespace-nowrap">{i > 0 ? s.slice(i + 1) : s}<VerifiedBadge size={size} className={`ml-[5px] align-middle relative -top-[0.06em] ${className}`} /></span></>);
}
