// Local-only review safety. Vite replaces DEV with false in every production build.
export const DESIGN_SANDBOX =
  import.meta.env.DEV && import.meta.env.VITE_DESIGN_SANDBOX === "1";
