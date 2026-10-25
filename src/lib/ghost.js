// Halloween-only: a short synthesized ghost "whoo-oo" + whoosh on the visitor's first tap/key,
// once per visitor per season (localStorage). Never plays over music: if a song is playing or
// starts within the same gesture (e.g. a Play tap), it is skipped for good. WebAudio only, no file.
import { currentSeason } from "./season.js";

const KEY = () => `srd-ghost-${new Date().getFullYear()}-halloween`;
const musicPlaying = () => [...document.querySelectorAll("audio,video")].some((a) => !a.paused && !a.muted);

function synth() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  const now = ctx.currentTime + 0.02;
  const out = ctx.createGain();
  out.gain.value = 0.22; // moderate
  out.connect(ctx.destination);
  // Wind whoosh: filtered noise sweeping up then down.
  const len = Math.floor(ctx.sampleRate * 2.6);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource(); noise.buffer = buf;
  const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(300, now); bp.frequency.exponentialRampToValueAtTime(1400, now + 1.1); bp.frequency.exponentialRampToValueAtTime(250, now + 2.5);
  const ng = ctx.createGain(); ng.gain.setValueAtTime(0.0001, now); ng.gain.exponentialRampToValueAtTime(0.5, now + 0.6); ng.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
  noise.connect(bp).connect(ng).connect(out);
  // Ghost voice: wavering sine "whoo-OO-oo" with vibrato.
  const osc = ctx.createOscillator(); osc.type = "sine";
  osc.frequency.setValueAtTime(330, now); osc.frequency.linearRampToValueAtTime(520, now + 0.9); osc.frequency.linearRampToValueAtTime(260, now + 2.3);
  const lfo = ctx.createOscillator(); lfo.frequency.value = 6;
  const lg = ctx.createGain(); lg.gain.value = 14; lfo.connect(lg).connect(osc.frequency);
  const vg = ctx.createGain(); vg.gain.setValueAtTime(0.0001, now); vg.gain.exponentialRampToValueAtTime(0.35, now + 0.4); vg.gain.setValueAtTime(0.35, now + 1.6); vg.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
  osc.connect(vg).connect(out);
  [noise, osc, lfo].forEach((n) => { n.start(now); n.stop(now + 2.6); });
  setTimeout(() => ctx.close().catch(() => {}), 3000);
  return ctx;
}

function flash() {
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.className = "ghost-boo";
  el.textContent = "👻";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

export function installGhost() {
  if (currentSeason() !== "halloween") return;
  let done = false;
  try { if (localStorage.getItem(KEY())) return; } catch { /* private mode: still once per page */ }
  const mark = (why) => {
    done = true;
    window.__srdGhost = { state: why, at: Date.now() };
    try { localStorage.setItem(KEY(), why); } catch { /* ignore */ }
    window.removeEventListener("pointerdown", onGesture, true);
    window.removeEventListener("keydown", onGesture, true);
  };
  function onGesture() {
    if (done) return;
    done = true;
    if (musicPlaying()) return mark("skipped-music");
    // AudioContext must be created inside the gesture; start it silent, decide after the gesture settles.
    setTimeout(() => {
      if (musicPlaying()) return mark("skipped-music");
      mark("played");
      const ctx = synth();
      if (ctx) { ctx.resume().catch(() => {}); window.__srdGhost.ctx = ctx.state; setTimeout(() => { window.__srdGhost.ctx2 = ctx.state; }, 300); }
      flash();
    }, 250);
  }
  window.__srdGhost = { state: "armed" };
  window.addEventListener("pointerdown", onGesture, true);
  window.addEventListener("keydown", onGesture, true);
}
