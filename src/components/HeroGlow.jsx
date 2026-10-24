import { useDecorReduce, isLiteDevice } from "../lib/motion.js";

// Soft pink glow behind the hero photo. It swells with --beat through CSS (.beat-on .hero-glow in index.css),
// so it needs no loop of its own. Desktop only: phones skip it because of the blur.
export default function HeroGlow() {
  const reduce = useDecorReduce();
  if (reduce || isLiteDevice()) return null;
  return (
    <div
      aria-hidden="true"
      className="hero-glow pointer-events-none absolute inset-x-[10%] -z-10 h-[70%] top-[10%] rounded-full blur-3xl"
      style={{
        background: "radial-gradient(closest-side, rgba(255,100,200,0.55), rgba(255,100,200,0) 100%)",
      }}
    />
  );
}
