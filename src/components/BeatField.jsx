import { useEffect } from "react";
import { onBeatChange, getBass, runFrameHooks, setKick, frameHooksCount, isPlaying, beatResume } from "../lib/beat.js";
import { isTouchDevice, isLiteDevice } from "../lib/motion.js";

// Phones update --beat at 30fps (every ~33ms); desktop stays at display rate.
const BEAT_MIN_GAP = isTouchDevice() ? 1000 / 30 : 0;

// The ONE requestAnimationFrame loop on the site. It runs only while there is work to do:
//  - a song is playing (reads the beat, writes --beat on <html>), or
//  - a frame hook is registered (cursor glow, note spawner).
// It stops completely while the tab is hidden. There is no per-second timer.
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
        // No analyser tap (some browsers): a gentle ~110 bpm pulse keeps the glow and hero alive.
        const measured = getBass();
        const fallback = ((Math.sin((now / 545) * Math.PI * 2) + 1) / 2) * 0.45;
        const raw = measured > 0.001 ? measured : fallback;
        level = Math.max(raw, level * 0.85); // quick attack, gentle decay
        if (Math.abs(level - written) > 0.01) {
          root.style.setProperty("--beat", level.toFixed(3));
          written = level;
        }
      }
      runFrameHooks(now);
      raf = requestAnimationFrame(tick);
    };

    const kickLoop = () => {
      if (raf || !wantsLoop()) return;
      raf = requestAnimationFrame(tick);
    };
    const stopLoop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    setKick(kickLoop);

    const off = onBeatChange((playing) => {
      root.classList.toggle("beat-on", playing);
      // Phones cut the heavy hero layers while a song plays; see index.css.
      root.dataset.liteBeat = playing && isLiteDevice() ? "true" : "false";
      if (playing) {
        kickLoop();
      } else {
        level = 0;
        written = -1;
        root.style.setProperty("--beat", "0");
        kickLoop();
      }
    });

    // Only applies on real visibility changes (and pageshow for bfcache returns).
    // The CSS pause rule keys off data-tab-hidden, so it must reflect the real state.
    const onVisibility = () => {
      root.dataset.tabHidden = document.hidden ? "true" : "false";
      if (document.hidden) {
        stopLoop();
      } else {
        beatResume();
        kickLoop();
      }
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onVisibility);
    window.addEventListener("focus", onVisibility);
    // Watchdog every 3s (was 1s): one attribute check, so a missed event on mobile cannot leave the
    // page stuck in the hidden state.
    const watchdog = setInterval(() => {
      const h = document.hidden;
      if (h !== (root.dataset.tabHidden === "true")) onVisibility();
    }, 3000);

    root.dataset.liteBeat = "false";

    return () => {
      off();
      setKick(() => {});
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onVisibility);
      window.removeEventListener("focus", onVisibility);
      clearInterval(watchdog);
      stopLoop();
      root.classList.remove("beat-on");
      root.dataset.liteBeat = "false";
      root.style.setProperty("--beat", "0");
    };
  }, []);

  return <div aria-hidden="true" className="beat-bg" />;
}
