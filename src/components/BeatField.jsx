import { useEffect } from "react";
import { onBeatChange, getBass } from "../lib/beat.js";
import { isLiteDevice } from "../lib/motion.js";

// Drives the whole-site music reaction. While a song plays it reads the shared bass level once per
// frame (every other frame on phones) and writes it to the --beat CSS variable on <html>. CSS turns
// that into opacity/transform only. The loop stops when nothing is playing or the tab is hidden.
export default function BeatField() {
  useEffect(() => {
    const root = document.documentElement;
    const lite = isLiteDevice();
    let raf = 0;
    let active = false;
    let frame = 0;
    let level = 0;
    let written = -1;

    const tick = () => {
      raf = 0;
      if (!active || document.hidden) return;
      frame += 1;
      if (!lite || frame % 2 === 0) {
        const raw = getBass();
        level = Math.max(raw, level * 0.85); // quick attack, gentle decay
        if (Math.abs(level - written) > 0.01) {
          root.style.setProperty("--beat", level.toFixed(3));
          written = level;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!active || raf || document.hidden) return;
      raf = requestAnimationFrame(tick);
    };

    const halt = () => {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      level = 0;
      written = -1;
      root.classList.remove("beat-on");
      root.style.setProperty("--beat", "0");
    };

    const off = onBeatChange((playing) => {
      if (playing) {
        active = true;
        root.classList.add("beat-on");
        start();
      } else {
        halt();
      }
    });

    const onVisibility = () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else {
        start();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      off();
      document.removeEventListener("visibilitychange", onVisibility);
      halt();
    };
  }, []);

  return <div aria-hidden="true" className="beat-bg" />;
}
