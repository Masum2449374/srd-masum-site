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
    let hiddenNow = document.hidden;

    const wantsLoop = () => !hiddenNow && !document.hidden && (isPlaying() || frameHooksCount() > 0);

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

    // Single place that applies the visible/hidden state. Safe to call repeatedly.
    // The CSS pause rule keys off data-tab-hidden, so it must always reflect the real state:
    // a stale "true" would freeze every animation until a reload.
    const applyVisibility = () => {
      const isHidden = document.hidden;
      root.dataset.tabHidden = isHidden ? "true" : "false";
      if (isHidden === hiddenNow) {
        if (!isHidden) kick(); // already visible: keep the loop alive
        return;
      }
      hiddenNow = isHidden;
      if (isHidden) {
        stopLoop();
        setBeatHidden(true);
      } else {
        setBeatHidden(false); // re-attaches the analyser and resumes the audio context
        kick();
      }
    };
    const onVisibility = () => applyVisibility();

    applyVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onVisibility);
    window.addEventListener("focus", onVisibility);
    // Watchdog: a cheap one-attribute check each second, so a missed event (common on mobile
    // when returning from another app) cannot leave the page stuck in the hidden state.
    const watchdog = setInterval(applyVisibility, 1000);

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
