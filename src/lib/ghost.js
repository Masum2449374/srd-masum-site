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

const SVG = `<svg viewBox="-60 -10 220 140" class="ghost-svg" aria-hidden="true"><defs><radialGradient id="gb" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d9e2ff"/></radialGradient></defs>
<g class="wing wing-l"><path d="M28 52 C 8 30, -30 18, -56 26 C -44 36, -46 44, -50 52 C -36 50, -30 58, -32 66 C -18 60, -6 64, 0 72 C 8 62, 20 62, 30 66 Z" fill="#cfd6ff" opacity=".88"/></g>
<g class="wing wing-r"><path d="M72 52 C 92 30, 130 18, 156 26 C 144 36, 146 44, 150 52 C 136 50, 130 58, 132 66 C 118 60, 106 64, 100 72 C 92 62, 80 62, 70 66 Z" fill="#cfd6ff" opacity=".88"/></g>
<path d="M50 4 C 22 4, 16 30, 16 56 L 16 112 L 28 102 L 39 114 L 50 102 L 61 114 L 72 102 L 84 112 L 84 56 C 84 30, 78 4, 50 4 Z" fill="url(#gb)"/>
<ellipse cx="38" cy="46" rx="6" ry="8" fill="#1b1430"/><ellipse cx="62" cy="46" rx="6" ry="8" fill="#1b1430"/><ellipse cx="50" cy="68" rx="7" ry="9" fill="#1b1430" opacity=".85"/></svg>`;
const MAX = 6;
// Drive the wings with rAF by writing the SVG transform attribute directly (robust on Android Chrome,
// and unaffected by prefers-reduced-motion): unfold over 0.3s, then flap ~5x/s from the shoulder pivot.
function flap(el) {
  const l = el.querySelector(".wing-l"), r = el.querySelector(".wing-r");
  const t0 = performance.now();
  const step = (now) => {
    if (!el.isConnected) return;
    const t = (now - t0) / 1000;
    const open = Math.min(1, Math.max(0, (t - 0.08) / 0.3));
    const s = open * 1.15;
    const a = open * 36 * Math.sin(t * Math.PI * 2 * 5);
    const sy = s * (1 - 0.18 * (1 - Math.cos(t * Math.PI * 2 * 5)) / 2);
    l.setAttribute("transform", `translate(28 58) rotate(${a.toFixed(1)}) scale(${s.toFixed(3)} ${sy.toFixed(3)}) translate(-28 -58)`);
    r.setAttribute("transform", `translate(72 58) rotate(${(-a).toFixed(1)}) scale(${s.toFixed(3)} ${sy.toFixed(3)}) translate(-72 -58)`);
    el.dataset.wing = a.toFixed(1);
    requestAnimationFrame(step);
  };
  l.setAttribute("transform", "scale(0)"); r.setAttribute("transform", "scale(0)");
  requestAnimationFrame(step);
}
// Spawn a winged ghost at the tap point: it pops in, unfolds its wings and flaps away off-screen, then is removed.
function spawn(x, y) {
  const live = document.querySelectorAll(".wghost");
  if (live.length >= MAX) live[0].remove();
  if (!x && !y) { x = innerWidth / 2; y = innerHeight * 0.35; }
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.className = "wghost";
  const dir = x < innerWidth / 2 ? 1 : -1; // drift toward the centre so it stays on screen
  x = Math.min(innerWidth - 66, Math.max(66, x)); // keep the whole ghost on screen
  el.style.left = `${x}px`; el.style.top = `${y}px`;
  el.style.setProperty("--dx", `${dir * (60 + Math.random() * 70)}px`);
  el.style.setProperty("--dy", `${-(y + 260)}px`);
  el.style.setProperty("--rot", `${dir * (8 + Math.random() * 10)}deg`);
  el.innerHTML = `<div class="wghost-fly">${SVG}</div>`;
  document.body.appendChild(el);
  flap(el);
  setTimeout(() => el.remove(), 3400);
}

export function playGhost(x, y) {
  const c = getCtx();
  if (c) synth(c);
  spawn(x, y);
  const g = (window.__srdGhost = window.__srdGhost || { count: 0 });
  g.count++;
  g.ctx = c ? c.state : "none";
}
