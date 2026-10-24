import { useDecorReduce } from "../lib/motion.js";
import { useBeatPlaying } from "../lib/beat.js";

// Soft pink glow behind the hero photo. It swells with --beat through CSS (.beat-on .hero-glow in index.css),
// so it needs no loop of its own. The gradient is already soft, so no blur filter is used (cheap on phones).
export default function HeroGlow() {
  const reduce = useDecorReduce();
  const playing = useBeatPlaying();
  if (reduce || !playing) return null;
  return (
    <div
      aria-hidden="true"
      className="hero-glow pointer-events-none absolute inset-x-[10%] -z-10 h-[70%] top-[10%] rounded-full"
      style={{
        background: "radial-gradient(closest-side, rgba(255,100,200,0.55), rgba(255,100,200,0) 100%)",
      }}
    />
  );
}
