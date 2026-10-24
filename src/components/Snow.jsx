import { useMemo } from "react";
import { isLiteDevice } from "../lib/motion.js";

// Gentle snowfall over the hero while idle: soft warm-coloured flakes (pink, violet, amber) drifting slowly down.
// Pure CSS animation, no blur or shadow. Fewer flakes on phones.
const PALETTE = ["#ff8fd6", "#c9a6ff", "#ffc26b", "#ffe1f3"];

export default function Snow() {
  const lite = isLiteDevice();

  const flakes = useMemo(() => {
    const count = lite ? 12 : 26;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${(i * 41) % 100}%`,
      size: 2 + ((i * 5) % 4),
      dur: `${9 + ((i * 3) % 9)}s`,
      delay: `${-((i * 2.1) % 14)}s`,
      drift: `${((i * 7) % 15) - 7}px`,
      color: PALETTE[i % PALETTE.length],
      opacity: (0.45 + ((i * 0.09) % 0.4)).toFixed(2),
    }));
  }, [lite]);

  return (
    <div aria-hidden="true" className="snow-layer pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {flakes.map((f) => (
        <span
          key={f.id}
          className="snow-flake absolute rounded-full"
          style={{
            left: f.left,
            width: f.size,
            height: f.size,
            background: f.color,
            "--dx": f.drift,
            "--fo": f.opacity,
            animationDuration: f.dur,
            animationDelay: f.delay,
          }}
        />
      ))}
    </div>
  );
}
