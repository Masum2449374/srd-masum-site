import { useEffect, useRef } from "react";
import { useDecorReduce, isLiteDevice } from "../lib/motion.js";
import { onBeatChange, getBass } from "../lib/beat.js";

// Soft pink glow behind the hero photo that swells with the bass of the playing cover.
// Driven straight on the DOM node each frame (no React re-renders); idle and reduced-motion render nothing.
export default function HeroGlow() {
  const reduce = useDecorReduce();
  const ref = useRef(null);

  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let level = 0;
    let playing = false;
    let tick = 0;
    const lite = isLiteDevice();

    const frame = () => {
      // On phones the beat is sampled and applied at 30fps instead of 60fps (cheaper, looks the same).
      tick += 1;
      if (!lite || tick % 2 === 0) {
        const target = playing ? getBass() : 0;
        level += (target - level) * (target > level ? 0.5 : 0.12);
        el.style.opacity = String(Math.min(1, level * 1.4));
        el.style.transform = `scale(${1 + level * 0.12})`;
      }
      raf = playing || level > 0.002 ? requestAnimationFrame(frame) : 0;
    };

    const unsubscribe = onBeatChange((p) => {
      playing = p;
      if (p && !raf) raf = requestAnimationFrame(frame);
    });
    return () => {
      unsubscribe();
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  if (reduce) return null;
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-[10%] -z-10 h-[70%] top-[10%] rounded-full opacity-0 blur-3xl"
      style={{ background: "radial-gradient(closest-side, rgba(255,100,200,0.55), rgba(255,100,200,0) 100%)" }}
    />
  );
}
