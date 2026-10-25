// Tiny cute UI sounds made with Web Audio oscillators. No audio files.
// Only called from explicit user actions (tap, submit, easter egg). Never autoplays.
// Very low gain so it stays gentle. Silent when the OS reduce-motion setting is on.

let ctx = null;

function reduceMotionOn() {
  try {
    return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function getCtx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume?.().catch(() => {});
  return ctx;
}

// One note: a sine with a quick pitch slide and a soft envelope.
function blip(ac, { freq, slideTo, start, dur, peak }) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function play(build) {
  if (reduceMotionOn()) return;
  const ac = getCtx();
  if (!ac) return;
  try {
    build(ac, ac.currentTime + 0.01);
  } catch {
    /* audio unsupported or blocked: stay silent */
  }
}

// 1) Soft bubble pop when a menu link is tapped.
export function playTapPop() {
  play((ac, t) => {
    blip(ac, { freq: 520, slideTo: 880, start: t, dur: 0.09, peak: 0.035 });
  });
}

// 2) Sparkle chime when the easter egg confetti bursts.
export function playSparkleChime() {
  play((ac, t) => {
    const notes = [1046.5, 1318.5, 1568, 2093];
    notes.forEach((f, i) => {
      blip(ac, { freq: f, slideTo: null, start: t + i * 0.07, dur: 0.22, peak: 0.028 });
    });
  });
}

// 3) Gentle pop when a fan wall note is stuck.
export function playNotePop() {
  play((ac, t) => {
    blip(ac, { freq: 380, slideTo: 620, start: t, dur: 0.14, peak: 0.04 });
    blip(ac, { freq: 760, slideTo: 980, start: t + 0.06, dur: 0.1, peak: 0.02 });
  });
}
