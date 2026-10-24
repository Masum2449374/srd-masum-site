import { useReducedMotion } from "framer-motion";

// Touch devices (phones, tablets) always run the continuous decorative effects, even when the OS
// "reduce motion" setting is on. Those phones were showing the marquee, sparkles, notes, shine,
// borders and typewriter frozen. Desktop with a fine pointer still honours reduced motion.
export function isTouchDevice() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(hover: none)").matches;
}

// Phones and small screens get a lighter version of the hero effects (fewer layers, no blur filters,
// no blend modes) so scrolling and playback stay smooth. Desktop keeps the full look.
export function isLiteDevice() {
  return isTouchDevice() || (typeof window !== "undefined" && window.innerWidth < 640);
}

export function useDecorReduce() {
  const reduce = useReducedMotion();
  return reduce && !isTouchDevice();
}
