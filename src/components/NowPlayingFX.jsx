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
    const spec = new Uint8Array(BARS);
    let raf = 0, smooth = 0, t0 = performance.now();
    const size = () => {
      const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = r.width * dpr; cv.height = r.height * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size(); window.addEventListener("resize", size);
    const draw = (now) => {
      const w = cv.clientWidth, h = cv.clientHeight, cx = w / 2, cy = h / 2;
      const live = getSpectrum(spec);
      const tt = (now - t0) / 1000;
      if (!live) for (let i = 0; i < BARS; i++) spec[i] = 60 + 40 * Math.sin(tt * 1.6 + i * 0.35); // idle
      const bass = live ? getBass() : 0.25 + 0.1 * Math.sin(tt * 2);
      smooth += (bass - smooth) * 0.35;
      g.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.355;
      g.lineCap = "round"; g.lineWidth = 3;
      for (let i = 0; i < BARS; i++) {
        const v = spec[i] / 255, ang = (i / BARS) * Math.PI * 2 - Math.PI / 2, len = 6 + v * R * 0.32;
        const c = Math.cos(ang), s = Math.sin(ang);
        g.strokeStyle = `hsla(${210 + v * 60},100%,${55 + v * 20}%,${0.35 + v * 0.65})`;
        g.beginPath(); g.moveTo(cx + c * (R + 4), cy + s * (R + 4)); g.lineTo(cx + c * (R + 4 + len), cy + s * (R + 4 + len)); g.stroke();
      }
      if (cover.current) cover.current.style.transform = `scale(${1 + smooth * 0.06})`;
      if (glow.current) { glow.current.style.opacity = String(0.35 + smooth * 0.65); glow.current.style.transform = `scale(${1 + smooth * 0.12})`; }
    };
    const loop = (now) => { draw(now); raf = requestAnimationFrame(loop); };
    const start = () => { if (!raf && playing && !document.hidden && !reduce) raf = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const vis = () => (document.hidden ? stop() : start());
    if (reduce || !playing) draw(performance.now()); // one static frame
    start();
    document.addEventListener("visibilitychange", vis);
    return () => { stop(); document.removeEventListener("visibilitychange", vis); window.removeEventListener("resize", size); };
  }, [playing]);
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px]" data-testid="np-fx">
      <div ref={glow} aria-hidden="true" className="np-glow pointer-events-none absolute -inset-6 rounded-full" />
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute -inset-[22%] h-[144%] w-[144%]" />
      <div ref={cover} className="relative h-full w-full will-change-transform">{children}</div>
    </div>
  );
}
