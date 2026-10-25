// Halloween: synthesized ghost "whoo-OO-oo" + whoosh with a rising 👻, played every time a
// Halloween decoration is tapped. WebAudio only (no sound file), one shared AudioContext,
// sounds may overlap; slight random pitch per tap. Plays over music without touching it.
let ctx = null;

function getCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx || ctx.state === "closed") ctx = new AC();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function synth(c) {
  const p = 0.85 + Math.random() * 0.3; // pitch variation
  const now = c.currentTime + 0.02;
  const out = c.createGain();
  out.gain.value = 0.22;
  out.connect(c.destination);
  const len = Math.floor(c.sampleRate * 2.6);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const noise = c.createBufferSource(); noise.buffer = buf;
  const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(300 * p, now); bp.frequency.exponentialRampToValueAtTime(1400 * p, now + 1.1); bp.frequency.exponentialRampToValueAtTime(250 * p, now + 2.5);
  const ng = c.createGain(); ng.gain.setValueAtTime(0.0001, now); ng.gain.exponentialRampToValueAtTime(0.5, now + 0.6); ng.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
  noise.connect(bp).connect(ng).connect(out);
  const osc = c.createOscillator(); osc.type = "sine";
  osc.frequency.setValueAtTime(330 * p, now); osc.frequency.linearRampToValueAtTime(520 * p, now + 0.9); osc.frequency.linearRampToValueAtTime(260 * p, now + 2.3);
  const lfo = c.createOscillator(); lfo.frequency.value = 5 + Math.random() * 2;
  const lg = c.createGain(); lg.gain.value = 14; lfo.connect(lg).connect(osc.frequency);
  const vg = c.createGain(); vg.gain.setValueAtTime(0.0001, now); vg.gain.exponentialRampToValueAtTime(0.35, now + 0.4); vg.gain.setValueAtTime(0.35, now + 1.6); vg.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
  osc.connect(vg).connect(out);
  [noise, osc, lfo].forEach((n) => { n.start(now); n.stop(now + 2.6); });
  noise.onended = () => out.disconnect();
}

function flash(x, y) {
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.className = "ghost-boo";
  el.textContent = "👻";
  if (x != null) { el.style.left = `${x}px`; el.style.top = `${Math.max(40, y - 60)}px`; }
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

export function playGhost(x, y) {
  const c = getCtx();
  if (c) synth(c);
  flash(x, y);
  const g = (window.__srdGhost = window.__srdGhost || { count: 0 });
  g.count++;
  g.ctx = c ? c.state : "none";
}
