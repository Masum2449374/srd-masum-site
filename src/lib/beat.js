// Shared beat source: one Web Audio analyser fed by whichever <audio> element is playing.
// createMediaElementSource can only run once per element, so the graph is cached per element.
const listeners = new Set();
const sources = new WeakMap();
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
    analyser.connect(ctx.destination);
  }
  if (!sources.has(el)) {
    const src = ctx.createMediaElementSource(el);
    src.connect(analyser);
    sources.set(el, src);
  }
  ctx.resume?.();
  current = el;
  notify();
}

export function beatStop(el) {
  if (current === null || (el && current !== el)) return;
  current = null;
  notify();
}

// Average energy of the low bins (roughly 40–500 Hz), normalised to 0..1.
export function getBass() {
  if (!analyser || current === null) return 0;
  analyser.getByteFrequencyData(data);
  let sum = 0;
  for (let i = 1; i <= 6; i++) sum += data[i];
  return sum / 6 / 255;
}
