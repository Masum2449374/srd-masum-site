import { useReducedMotion } from "framer-motion";

export function isTouchDevice() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(hover: none)").matches;
}

// Phones and small screens get a lighter version of the hero effects (fewer layers, no blur filters,
// no blend modes) so scrolling and playback stay smooth. Desktop keeps the full look.
export function isLiteDevice() {
  return isTouchDevice() || (typeof window !== "undefined" && window.innerWidth < 640);
}

// Honours the OS "reduce motion" setting on every device, phones included.
export function useDecorReduce() {
  return useReducedMotion();
}
