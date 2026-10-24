import { useEffect, useState } from "react";

// Visual-only beat source. The <audio> element plays straight to the speakers and is never routed
// through Web Audio. Where the browser can capture the element's stream, a muted analyser reads that
// capture (a side tap, its output goes nowhere audible). Browsers without captureStream get the
// synthetic pulse from BeatField instead. Nothing here can gate or stall playback.
const listeners = new Set();
const frameHooks = new Set();
let kick = () => {};
let ctx = null;
let analyser = null;
let data = null;
let tappedEl = null;
let current = null;

function notify() {
  listeners.forEach((fn) => fn(current !== null));
}

export function onBeatChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Extra per-frame work (cursor glow, note spawner) hooks into the single shared loop in BeatField.
export function onFrame(fn) {
  frameHooks.add(fn);
  kick();
  return () => {
    frameHooks.delete(fn);
    kick();
  };
}

// Set by BeatField: starts or stops the single shared rAF loop based on demand.
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

// Side tap: captureStream() copies the element's output into a MediaStream. Only that copy is analysed,
// and the analyser ends in a zero-gain node, so the speakers never see this graph.
function attachTap(el) {
  if (tappedEl === el || typeof window === "undefined") return;
  const AC = window.AudioContext || window.webkitAudioContext;
  const capture = el.captureStream || el.mozCaptureStream;
  if (!AC || !capture) return;
  try {
    if (!ctx) {
      ctx = new AC();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.7;
      data = new Uint8Array(analyser.frequencyBinCount);
      const mute = ctx.createGain();
      mute.gain.value = 0;
      analyser.connect(mute);
      mute.connect(ctx.destination);
    }
    ctx.createMediaStreamSource(capture.call(el)).connect(analyser);
    tappedEl = el;
  } catch {
    analyser = null; // no tap on this browser: BeatField's pulse takes over
  }
}

export function beatPlay(el) {
  if (typeof window === "undefined") return; // effects run on every device, reduced motion included
  attachTap(el);
  if (ctx && ctx.state === "suspended") ctx.resume?.().catch?.(() => {});
  current = el;
  notify();
}

// Tab returned: the analyser stays attached, it only needs a resume if the browser suspended it.
export function beatResume() {
  if (ctx && ctx.state === "suspended" && current !== null) ctx.resume?.().catch?.(() => {});
}

export function beatStop(el) {
  if (current === null || (el && current !== el)) return;
  current = null;
  notify();
}

// Low-frequency energy normalised to 0..1. Returns 0 when no tap is available.
export function getBass() {
  if (!analyser || current === null) return 0;
  analyser.getByteFrequencyData(data);
  let sum = 0;
  for (let i = 1; i <= 6; i++) sum += data[i];
  return sum / 6 / 255;
}

// React hook: true while a song is playing. Used by components that must unmount their animation
// layers while the beat is active.
export function useBeatPlaying() {
  const [playing, setPlaying] = useState(current !== null);
  useEffect(() => onBeatChange((p) => setPlaying(p)), []);
  return playing;
}
