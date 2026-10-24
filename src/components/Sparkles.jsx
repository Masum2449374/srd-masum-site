import { useMemo } from "react";
import { useDecorReduce, isLiteDevice } from "../lib/motion.js";

// Faint floating sparkles drifting over the hero photo, like slow fireflies.
// Pure CSS animation on a few positioned dots; fewer on small screens. Nothing under reduced motion.
export default function Sparkles() {
  const reduce = useDecorReduce();
  const lite = isLiteDevice();

  const dots = useMemo(() => {
    const count = lite ? 8 : 16;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${(i * 37) % 100}%`,
      top: `${(i * 53) % 100}%`,
      size: 2 + ((i * 7) % 3),
      dur: `${4 + ((i * 3) % 7)}s`,
      delay: `${-((i * 1.7) % 8)}s`,
    }));
  }, [lite]);

  if (reduce) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {dots.map((d) => (
        <span
          key={d.id}
          className="sparkle absolute rounded-full bg-accent"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            opacity: 0,
            animationDuration: d.dur,
            animationDelay: d.delay,
          }}
        />
      ))}
    </div>
  );
}
