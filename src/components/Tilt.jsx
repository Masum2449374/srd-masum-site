import { useRef } from "react";
import { useDecorReduce } from "../lib/motion.js";

// Gallery tilt: the photo leans toward the pointer. Mouse gets a stronger lean, touch a gentle one.
// Resets on leave/release. Plain wrapper under reduced motion.
export default function Tilt({ children }) {
  const reduce = useDecorReduce();
  const ref = useRef(null);

  if (reduce) return <div className="overflow-hidden">{children}</div>;

  const setTilt = (rx, ry) => {
    const el = ref.current;
    if (el) el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    const max = e.pointerType === "touch" ? 4 : 9;
    setTilt(-py * max, px * max);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => setTilt(0, 0)}
      onPointerUp={() => setTilt(0, 0)}
      onPointerCancel={() => setTilt(0, 0)}
      className="overflow-hidden will-change-transform transition-transform duration-300 ease-out"
      style={{ transform: "perspective(900px) rotateX(0deg) rotateY(0deg)" }}
    >
      {children}
    </div>
  );
}
