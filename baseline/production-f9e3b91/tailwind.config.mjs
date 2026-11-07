/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        raised: "rgb(var(--raised) / <alpha-value>)",
        sunk: "rgb(var(--sunk) / <alpha-value>)",
        hairline: "rgb(var(--hairline) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        faint: "rgb(var(--faint) / <alpha-value>)",
        accent: "#0b6cf0",
        "on-accent": "#ffffff",
        "accent-deep": "#0a2a6b",
      },
      fontFamily: {
        display: ['"Sora Variable"', "system-ui", "sans-serif"],
        body: ['"Inter Variable"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      letterSpacing: {
        display: "-0.045em",
      },
    },
  },
  plugins: [],
};
