import { useReducedMotion } from "framer-motion";

// Touch devices (phones, tablets) always run the continuous decorative effects, even when the OS
// "reduce motion" setting is on. Those phones were showing the marquee, sparkles, notes, shine,
// borders and typewriter frozen. Desktop with a fine pointer still honours reduced motion.
export function isTouchDevice() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(hover: none)").matches;
}

export function useDecorReduce() {
  const reduce = useReducedMotion();
  return reduce && !isTouchDevice();
}
