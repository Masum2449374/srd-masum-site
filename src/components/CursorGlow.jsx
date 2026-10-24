import { useEffect, useRef } from "react";
import { onFrame } from "../lib/beat.js";

// Soft pink light that follows the mouse. Desktop with a fine pointer only;
// skipped entirely on touch devices and when the user prefers reduced motion.
// Runs on the shared frame loop (onFrame in lib/beat.js) and only does work while the pointer is over the page.
export default function CursorGlow() {
  const ref = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    if (!fine || reduce || !el) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let visible = false;
    let settled = true;

    const onFrameTick = () => {
      if (!visible || document.hidden || settled) return;
      // Eased follow keeps the glow soft rather than snapping to the pointer.
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      el.style.transform = `translate3d(${x - 200}px, ${y - 200}px, 0)`;
      settled = Math.abs(tx - x) < 0.5 && Math.abs(ty - y) < 0.5;
    };
    const unFrame = onFrame(onFrameTick);

    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      settled = false;
      if (!visible) {
        visible = true;
        el.style.opacity = "1";
      }
    };
    const onLeave = () => {
      visible = false;
      el.style.opacity = "0";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      unFrame();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="cursor-glow pointer-events-none fixed left-0 top-0 z-[1] h-[400px] w-[400px] rounded-full opacity-0 transition-opacity duration-300"
      style={{
        background: "radial-gradient(circle, rgba(255,100,200,0.14) 0%, rgba(255,100,200,0.05) 40%, transparent 70%)",
      }}
    />
  );
}
