import { useEffect } from "react";
import { onBeatChange, getBass, runFrameHooks, setKick, frameHooksCount, isPlaying, setBeatHidden } from "../lib/beat.js";
import { isTouchDevice, isLiteDevice } from "../lib/motion.js";

// Phones update --beat at 30fps (every ~33ms); desktop stays at display rate.
const BEAT_MIN_GAP = isTouchDevice() ? 1000 / 30 : 0;

// The ONE requestAnimationFrame loop on the site. It runs only while there is work to do:
//  - a song is playing (reads bass, writes --beat on <html>), or
//  - a frame hook is registered (cursor glow, note spawner).
// It stops completely when the tab is hidden or when nothing needs it.
// Beat reactions run on every device; CSS only animates transform and opacity from --beat.
export default function BeatField() {
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    let level = 0;
    let written = -1;
    let lastBeat = 0;

    const wantsLoop = () => !document.hidden && (isPlaying() || frameHooksCount() > 0);

    const tick = (now) => {
      raf = 0;
      if (!wantsLoop()) return;
      if (isPlaying() && now - lastBeat >= BEAT_MIN_GAP) {
        lastBeat = now;
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
      // Phones (touch or narrow) cut the heavy hero layers while a song plays; see index.css.
      root.dataset.liteBeat = playing && isLiteDevice() ? "true" : "false";
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
      if (document.hidden) {
        stopLoop();
        setBeatHidden(true);
      } else {
        setBeatHidden(false);
        kick();
      }
    };
    root.dataset.tabHidden = document.hidden ? "true" : "false";
    root.dataset.liteBeat = "false";
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      off();
      setKick(() => {});
      document.removeEventListener("visibilitychange", onVisibility);
      stopLoop();
      root.classList.remove("beat-on");
      root.dataset.liteBeat = "false";
      root.style.setProperty("--beat", "0");
    };
  }, []);

  return <div aria-hidden="true" className="beat-bg" />;
}
