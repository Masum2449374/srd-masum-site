import { useEffect } from "react";
import { onBeatChange, getBass, runFrameHooks, setKick, frameHooksCount, isPlaying, disposeBeat } from "../lib/beat.js";
import { isLiteDevice } from "../lib/motion.js";

// The ONE requestAnimationFrame loop on the site. It runs only while there is work to do:
//  - a song is playing (reads bass, writes --beat on <html>, every other frame on phones), or
//  - a frame hook is registered (cursor glow, note spawner).
// It stops completely when the tab is hidden or when nothing needs it.
// Phones ("beat-lite") only get the playing card border and floating notes; everything else stays still.
export default function BeatField() {
  useEffect(() => {
    const root = document.documentElement;
    const phone = isLiteDevice();
    let raf = 0;
    let frame = 0;
    let level = 0;
    let written = -1;

    const wantsLoop = () => !document.hidden && (isPlaying() || frameHooksCount() > 0);

    const tick = (now) => {
      raf = 0;
      if (!wantsLoop()) return;
      frame += 1;
      if (isPlaying() && (!phone || frame % 2 === 0)) {
        const raw = getBass();
        level = Math.max(raw, level * 0.85); // quick attack, gentle decay
        if (Math.abs(level - written) > 0.01) {
          root.style.setProperty("--beat", level.toFixed(3));
          written = level;
        }
      }
      runFrameHooks(now);
      raf = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (raf || !wantsLoop()) return;
      raf = requestAnimationFrame(tick);
    };
    const stopLoop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    setKick(kick);

    const off = onBeatChange((playing) => {
      root.classList.toggle("beat-on", playing);
      root.classList.toggle("beat-lite", playing && phone);
      if (playing) {
        kick();
      } else {
        level = 0;
        written = -1;
        root.style.setProperty("--beat", "0");
        kick(); // loop exits by itself if no hooks remain
      }
    });

    const onVisibility = () => {
      root.dataset.tabHidden = document.hidden ? "true" : "false";
      if (document.hidden) stopLoop();
      else kick();
    };
    root.dataset.tabHidden = document.hidden ? "true" : "false";
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      off();
      setKick(() => {});
      document.removeEventListener("visibilitychange", onVisibility);
      stopLoop();
      disposeBeat();
      root.classList.remove("beat-on", "beat-lite");
      root.style.setProperty("--beat", "0");
    };
  }, []);

  // Phones skip the full-screen beat background entirely.
  if (isLiteDevice()) return null;
  return <div aria-hidden="true" className="beat-bg" />;
}
