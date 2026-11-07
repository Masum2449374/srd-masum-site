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
        accent: "#b6a0ff",
        "on-accent": "#171224",
        "accent-deep": "#554178",
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
