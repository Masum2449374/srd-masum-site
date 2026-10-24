import { useEffect, useMemo, useState } from "react";
import { useDecorReduce } from "../lib/motion.js";
import { onBeatChange } from "../lib/beat.js";

// Cinematic aurora for the hero while a track plays: layered drifting colour glow, rising warm bokeh orbs,
// a breathing vignette at the edges, and a sheen across the title. Everything switches on through
// <html data-hero-playing="true"> so the CSS in index.css does the animating (no per-frame React renders).
// Touch devices always run it (see motion.js); desktop with reduced motion renders nothing.
export default function HeroAurora() {
  const reduce = useDecorReduce();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const unsubscribe = onBeatChange((p) => setPlaying(p));
    return () => {
      unsubscribe();
      setPlaying(false);
    };
  }, [reduce]);

  useEffect(() => {
    const on = playing && !reduce;
    document.documentElement.dataset.heroPlaying = on ? "true" : "false";
    return () => {
      document.documentElement.dataset.heroPlaying = "false";
    };
  }, [playing, reduce]);

  const orbs = useMemo(() => {
    const count = typeof window !== "undefined" && window.innerWidth < 640 ? 7 : 13;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${((i * 29) % 88) + 4}%`,
      size: 10 + ((i * 11) % 26),
      dur: `${10 + ((i * 5) % 8)}s`,
      delay: `${-((i * 2.3) % 12)}s`,
      opacity: (0.4 + ((i * 0.13) % 0.45)).toFixed(2),
      hue: i % 3,
    }));
  }, []);

  if (reduce) return null;
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <span className="aurora-layer aurora-a" />
        <span className="aurora-layer aurora-b" />
        <span className="aurora-layer aurora-c" />
        {orbs.map((o) => (
          <span
            key={o.id}
            className="hero-orb"
            data-hue={o.hue}
            style={{
              left: o.left,
              width: o.size,
              height: o.size,
              animationDuration: o.dur,
              animationDelay: o.delay,
              "--o": o.opacity,
            }}
          />
        ))}
        <span className="vignette-pulse" />
      </div>
    </>
  );
}
