import { useEffect, useRef, useState } from "react";
import { getBass, getSpectrum } from "../lib/beat.js";

// Effects for the full-screen Now Playing view: a canvas ring visualizer + glow around the cover,
// a beat scale pulse on the cover, and a slow blurred colour background. One rAF loop, running only
// while the view is open, the song is playing and the tab is visible. Reduced motion: static glow.
const BARS = 64;

function useCoverColors(src) {
  const [c, setC] = useState(["11,108,240", "10,42,107", "90,162,255"]);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      try {
        const cv = document.createElement("canvas"); cv.width = cv.height = 8;
        const g = cv.getContext("2d"); g.drawImage(img, 0, 0, 8, 8);
        const d = g.getImageData(0, 0, 8, 8).data;
        const px = (x, y) => { const i = (y * 8 + x) * 4; return `${d[i]},${d[i + 1]},${d[i + 2]}`; };
        setC([px(1, 1), px(4, 6), px(6, 2)]);
      } catch { /* keep defaults */ }
    };
    img.src = src;
  }, [src]);
  return c;
}

export function FXBackground({ src }) {
  const [a, b, c] = useCoverColors(src);
  return (
    <div aria-hidden="true" className="np-bg pointer-events-none absolute inset-0 overflow-hidden">
      <div className="np-blob np-blob1" style={{ background: `rgb(${a})` }} />
      <div className="np-blob np-blob2" style={{ background: `rgb(${b})` }} />
      <div className="np-blob np-blob3" style={{ background: `rgb(${c})` }} />
      <div className="absolute inset-0 bg-canvas/55" />
    </div>
  );
}

export function FXCover({ src, playing, children }) {
  const canvas = useRef(null);
  const cover = useRef(null);
  const glow = useRef(null);
  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const g = cv.getContext("2d");
    const spec = new Uint8Array(BARS), half = new Uint8Array(BARS / 4);
    let raf = 0, smooth = 0, silentSince = 0, sim = false;
    // Simulated beat (used when the analyser has no real data, e.g. a silent capture on some phones):
    // ~118 BPM kick with exponential decay, bass-weighted bins, per-bar random jitter.
    const jitter = new Float32Array(BARS), prev = new Uint8Array(BARS);
    let lastBeat = 0, beatLen = 508, accent = 1;
    const simulate = (now) => {
      if (now - lastBeat > beatLen) { lastBeat = now; beatLen = 480 + Math.random() * 60; accent = Math.random() < 0.25 ? 1.25 : 0.8 + Math.random() * 0.3; }
      const env = Math.exp(-(now - lastBeat) / 170) * accent;
      for (let i = 0; i < BARS; i++) {
        jitter[i] += ((Math.random() - 0.5) * 0.6 - jitter[i]) * 0.2;
        const f = i / BARS, pos = Math.min(f, 1 - f) * 2; // symmetric: bass at top/bottom of ring
        const w = 1 - pos * 0.6;
        const v = 40 + 170 * env * w + 50 * (0.5 + jitter[i]) * (0.4 + pos) + 25 * Math.sin(now / 300 + i);
        spec[i] = Math.max(0, Math.min(255, v));
      }
      return Math.min(1, 0.2 + env * 0.75);
    };
    const size = () => {
      const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = r.width * dpr; cv.height = r.height * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size(); window.addEventListener("resize", size);
    const draw = (now) => {
      const w = cv.clientWidth, h = cv.clientHeight, cx = w / 2, cy = h / 2;
      let live = !window.__srdForceSim && getSpectrum(half);
      if (live) {
        // Mirror the low-to-high spectrum around the ring (bass at the top) and lift the quieter highs,
        // so the whole ring moves instead of one quadrant.
        for (let i = 0; i < BARS; i++) {
          const q = i % (BARS / 2), k = q < BARS / 4 ? q : BARS / 2 - 1 - q; // 4-fold: bass top+bottom
          spec[i] = Math.min(255, half[k] * (1 + (k / (BARS / 4)) * 1.6));
        }
      }
      let mx = 0, mn = 255;
      if (live) {
        for (let i = 0; i < BARS; i++) { if (spec[i] > mx) mx = spec[i]; if (spec[i] < mn) mn = spec[i]; }
        // Track how much the spectrum changes between frames: a frozen or near-flat spectrum is silence too.
        let d = 0; for (let i = 0; i < BARS; i++) { d += Math.abs(spec[i] - prev[i]); prev[i] = spec[i]; }
        const dead = mx < 24 || mx - mn < 12 || d < BARS * 0.5;
        if (dead) { if (!silentSince) silentSince = now; if (now - silentSince > 1000) sim = true; }
        else { silentSince = 0; sim = false; }
        if (sim) live = false;
      }
      const bass = live ? getBass() : simulate(now);
      cv.dataset.mode = live ? "live" : "sim";
      smooth += (bass - smooth) * 0.35;
      g.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.355;
      g.lineCap = "round"; g.lineWidth = 4;
      for (let i = 0; i < BARS; i++) {
        const v = spec[i] / 255, ang = (i / BARS) * Math.PI * 2 - Math.PI / 2, len = 4 + Math.pow(v, 1.3) * R * 0.6;
        const c = Math.cos(ang), s = Math.sin(ang);
        g.strokeStyle = `hsla(${210 + v * 60},100%,${55 + v * 20}%,${0.35 + v * 0.65})`;
        g.beginPath(); g.moveTo(cx + c * (R + 4), cy + s * (R + 4)); g.lineTo(cx + c * (R + 4 + len), cy + s * (R + 4 + len)); g.stroke();
      }
      if (cover.current) cover.current.style.transform = `scale(${1 + smooth * 0.08})`;
      if (dbg) dbg.textContent = `fx ${cv.dataset.mode} max=${mx} min=${mn} rm=${reduce ? 1 : 0} play=${playing ? 1 : 0} hid=${document.hidden ? 1 : 0} ${window.__srdSW || "sw?"} ${window.__srdBuild}`;
      if (glow.current) { glow.current.style.opacity = String(0.35 + smooth * 0.65); glow.current.style.transform = `scale(${1 + smooth * 0.12})`; }
    };
    const loop = (now) => { draw(now); raf = requestAnimationFrame(loop); };
    // Reduced motion (Android "Remove animations") still animates the bars; only background drift stops.
    const start = () => { if (!raf && playing && !document.hidden) raf = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const vis = () => (document.hidden ? stop() : start());
    let dbg = null;
    if (/[?&]fxdebug/.test(location.search)) {
      dbg = document.createElement("div");
      dbg.setAttribute("data-testid", "fxdebug");
      dbg.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:9999;font:11px monospace;background:#000c;color:#0f0;padding:3px 5px;border-radius:4px;pointer-events:none";
      document.body.appendChild(dbg);
    }
    draw(performance.now());
    start();
    const kick = setTimeout(start, 300); // start again once play has settled
    document.addEventListener("visibilitychange", vis);
    return () => { stop(); clearTimeout(kick); dbg?.remove(); document.removeEventListener("visibilitychange", vis); window.removeEventListener("resize", size); };
  }, [playing]);
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px] lg:max-w-[min(360px,40svh)]" data-testid="np-fx">
      <div ref={glow} aria-hidden="true" className="np-glow pointer-events-none absolute -inset-6 rounded-full" />
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute -inset-[22%] h-[144%] w-[144%]" />
      <div ref={cover} className="relative h-full w-full will-change-transform">{children}</div>
    </div>
  );
}
