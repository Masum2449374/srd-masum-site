import { useEffect, useMemo, useState } from "react";
import "./fanwall.css";
import { playSparkleChime } from "../lib/sounds.js";

const EVENT = "srd-secret";
const COLORS = ["#0b6cf0", "#ffffff", "#0a3d91", "#8cc2ff", "#7fb6ff"];
const PIECES = 44;

// Called by the nav logo after 3 quick taps.
export function triggerSecret() {
  window.dispatchEvent(new Event(EVENT));
}

export default function SecretBurst() {
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    const on = () => {
      playSparkleChime();
      setBurst(Date.now());
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);

  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(0), 3000);
    return () => clearTimeout(t);
  }, [burst]);

  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 120 + Math.random() * 260;
        return {
          i,
          x: `${Math.cos(angle) * dist}px`,
          y: `${Math.sin(angle) * dist + 140}px`,
          r: `${(Math.random() - 0.5) * 900}deg`,
          delay: `${Math.floor(Math.random() * 180)}ms`,
          color: COLORS[i % COLORS.length],
        };
      }),
    [burst],
  );

  if (!burst) return null;

  return (
    <div key={burst} aria-hidden="true" className="secret-layer" onClick={() => setBurst(0)}>
      {pieces.map((p) => (
        <span
          key={p.i}
          className="secret-piece"
          style={{ "--x": p.x, "--y": p.y, "--r": p.r, "--delay": p.delay, background: p.color }}
        />
      ))}
      <div className="secret-msg" role="status">
        You are a true SRD Masum fan 🔥
      </div>
    </div>
  );
}
