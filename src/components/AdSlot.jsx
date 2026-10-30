import { useEffect, useRef, useState } from "react";

// Adsterra slots. Each ad is its own same-site page under /ads/ in a sandboxed iframe, so the
// global atOptions scripts never clash and cookies/localStorage work. The ad page posts
// {srdAd, filled, h}; the slot sizes to the content and collapses (label too) if nothing fills in 8s.
const ADS = {
  banner320: { file: "b320", w: 320, h: 50 },
  banner300: { file: "b300", w: 300, h: 250 },
  banner728: { file: "b728", w: 728, h: 90 },
  native: { file: "native", w: "100%", h: 0 },
};
const FILL_TIMEOUT_MS = 15000;

const deskMq = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(min-width: 1024px)").matches;

export default function AdSlot({ type, desktopOnly = false }) {
  const [isDesk] = useState(deskMq);
  // "leader" = 728x90 on desktop/tablet widths, 320x50 on phones.
  const [wide] = useState(() => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(min-width: 768px)").matches);
  const key = type === "leader" ? (wide ? "banner728" : "banner320") : type;
  const ad = desktopOnly && !isDesk ? null : ADS[key];
  const ref = useRef(null);
  const frame = useRef(null);
  const [near, setNear] = useState(false);
  const [filled, setFilled] = useState(false);
  const [dead, setDead] = useState(false);
  const [h, setH] = useState(ad?.h || 0);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    if (!("IntersectionObserver" in window)) { setNear(true); return; }
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); }
    }, { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  useEffect(() => {
    if (!near || !ad) return;
    const onMsg = (e) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const d = e.data;
      if (!d || d.srdAd !== ad.file) return;
      if (d.filled) {
        setFilled(true);
        if (typeof ad.w !== "number" && d.h > 0) setH(Math.min(d.h, 900));
      }
    };
    window.addEventListener("message", onMsg);
    const t = setTimeout(() => setDead((x) => x || true), FILL_TIMEOUT_MS);
    return () => { window.removeEventListener("message", onMsg); clearTimeout(t); };
  }, [near, ad]);

  if (!ad || (dead && !filled)) return null;
  const fixed = typeof ad.w === "number";
  return (
    <aside ref={ref} data-ad-slot={type} data-ad-filled={filled ? "1" : "0"} aria-label="Advertisement"
      className={`relative z-0 mx-auto flex w-full max-w-3xl flex-col items-center px-5 ${type === "native" ? "lg:max-w-[1240px]" : ""}`}
      style={filled ? { margin: "2rem auto" } : { height: 1, overflow: "hidden" }}>
      {filled && <span className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Advertisement</span>}
      {near && (
        <iframe
          ref={frame}
          title="Advertisement"
          src={`/ads/${ad.file}.html`}
          scrolling="no"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          referrerPolicy="strict-origin-when-cross-origin"
          style={{
            width: fixed ? ad.w : "100%", maxWidth: "100%", height: filled ? h : 1,
            border: 0, display: "block", background: "transparent", colorScheme: "normal",
          }}
        />
      )}
    </aside>
  );
}
