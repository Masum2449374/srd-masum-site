import { useBeatPlaying } from "../lib/beat.js";

// Soft blue glow behind the hero photo. It swells with --beat through CSS (.beat-on .hero-glow in index.css),
// so it needs no loop of its own. The gradient is already soft, so no blur filter is used (cheap on phones).
export default function HeroGlow() {
  const playing = useBeatPlaying();
  if (!playing) return null;
  return (
    <div
      aria-hidden="true"
      className="hero-glow pointer-events-none absolute inset-x-[10%] -z-10 h-[70%] top-[10%] rounded-full"
      style={{
        background: "radial-gradient(closest-side, rgba(11,108,240,0.55), rgba(11,108,240,0) 100%)",
      }}
    />
  );
}
