import { useEffect, useState } from "react";
// Shared beat source: one Web Audio analyser fed by whichever <audio> element is playing.
// createMediaElementSource can only run once per element, so the graph is cached per element.
const listeners = new Set();
const frameHooks = new Set();
let sources = new WeakMap();
let ctx = null;
let analyser = null;
let data = null;
let current = null;

const reducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches &&
  !window.matchMedia?.("(hover: none)").matches;

function notify() {
  listeners.forEach((fn) => fn(current !== null));
}

export function onBeatChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Extra per-frame work (cursor glow, note spawner) hooks into the single shared loop in BeatField.
// The loop runs whenever a hook is registered or a song is playing, and stops when neither applies.
export function onFrame(fn) {
  frameHooks.add(fn);
  kick();
  return () => {
    frameHooks.delete(fn);
    kick();
  };
}

// Set by BeatField: starts or stops the single shared rAF loop based on demand.
let kick = () => {};
export function setKick(fn) {
  kick = fn;
}

export function runFrameHooks(now) {
  frameHooks.forEach((fn) => fn(now));
}

export function frameHooksCount() {
  return frameHooks.size;
}

export function isPlaying() {
  return current !== null;
}

export function beatPlay(el) {
  if (reducedMotion() || typeof window === "undefined") return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!ctx) {
    ctx = new AC();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.7;
    data = new Uint8Array(analyser.frequencyBinCount);
    // The analyser has no output: it is only a tap, so audio never depends on it.
  }
  if (!sources.has(el)) {
    try {
      const src = ctx.createMediaElementSource(el);
      // Audio always goes straight to the speakers. The analyser is a side tap that is
      // detached while the tab is hidden, so no analysis work happens in the background.
      src.connect(ctx.destination);
      if (!hidden()) src.connect(analyser);
      sources.set(el, src);
    } catch {
      // Element already bound to a graph (e.g. an earlier context): skip the beat for this element, playback still works.
      return;
    }
  }
  if (!hidden()) ctx.resume?.();
  current = el;
  notify();
}

const hidden = () => typeof document !== "undefined" && document.hidden;

// Called by BeatField on visibilitychange. Hidden: drop the analyser tap (zero analysis work).
// Visible: re-attach it. Audio itself keeps running through the direct connection.
export function setBeatHidden(isHidden) {
  if (!ctx || !analyser) return;
  if (isHidden) {
    sources.forEach((src) => {
      try { src.disconnect(analyser); } catch {}
    });
    if (current === null) ctx.suspend?.().catch?.(() => {});
  } else {
    ctx.resume?.().catch?.(() => {});
    if (current !== null) {
      sources.forEach((src) => {
        try { src.connect(analyser); } catch {}
      });
    }
  }
}

export function beatStop(el) {
  if (current === null || (el && current !== el)) return;
  current = null;
  notify();
}

// Full teardown. Not called on component unmount (StrictMode mounts twice); the singleton lives for the page.
export function disposeBeat() {
  current = null;
  if (ctx) ctx.close?.().catch?.(() => {});
  ctx = null;
  analyser = null;
  data = null;
  sources = new WeakMap();
}

// Average energy of the low bins (roughly 40–500 Hz), normalised to 0..1.
export function getBass() {
  if (!analyser || current === null) return 0;
  analyser.getByteFrequencyData(data);
  let sum = 0;
  for (let i = 1; i <= 6; i++) sum += data[i];
  return sum / 6 / 255;
}

// React hook: true while a song is playing. Used by components that must unmount their animation
// layers on phones while the beat is active (e.g. snowfall, which only runs while idle).
export function useBeatPlaying() {
  const [playing, setPlaying] = useState(current !== null);
  useEffect(() => onBeatChange((p) => setPlaying(p)), []);
  return playing;
}
