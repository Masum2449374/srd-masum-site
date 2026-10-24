import { useEffect, useMemo, useState } from "react";
import { isLiteDevice } from "../lib/motion.js";
import { onBeatChange } from "../lib/beat.js";

// Hero aurora: soft and low-opacity while idle, full cinematic strength while a track plays: layered drifting colour glow, rising warm bokeh orbs,
// a breathing vignette at the edges, and a sheen across the title. Everything switches on through
// <html data-hero-playing="true"> so the CSS in index.css does the animating (no per-frame React renders).
// Phones run it with fewer layers and orbs (see motion.js); shows on every device, reduced motion included.
export default function HeroAurora() {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const unsubscribe = onBeatChange((p) => setPlaying(p));
    return () => {
      unsubscribe();
      setPlaying(false);
    };
  }, []);

  useEffect(() => {
    const on = playing;
    document.documentElement.dataset.heroPlaying = on ? "true" : "false";
    return () => {
      document.documentElement.dataset.heroPlaying = "false";
    };
  }, [playing]);

  // Pause all hero animations while the hero is scrolled out of view (CSS reads data-hero-visible).
  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        document.documentElement.dataset.heroVisible = entry.isIntersecting ? "true" : "false";
      },
      { threshold: 0 }
    );
    io.observe(hero);
    return () => {
      io.disconnect();
      document.documentElement.dataset.heroVisible = "true";
    };
  }, []);

  const lite = isLiteDevice();
  const orbs = useMemo(() => {
    const count = lite ? 7 : 13;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${((i * 29) % 88) + 4}%`,
      size: 10 + ((i * 11) % 26),
      dur: `${10 + ((i * 5) % 8)}s`,
      delay: `${-((i * 2.3) % 12)}s`,
      opacity: (0.4 + ((i * 0.13) % 0.45)).toFixed(2),
      hue: i % 3,
    }));
  }, [lite]);

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <span className="aurora-layer aurora-a" />
        <span className="aurora-layer aurora-b" />
        {!lite && <span className="aurora-layer aurora-c" />}
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
