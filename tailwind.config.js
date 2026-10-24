/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0e0d0c",
        raised: "#171614",
        sunk: "#1f1d1b",
        hairline: "#2c2a27",
        ink: "#f4f1ea",
        muted: "#a39e98",
        faint: "#6f6a64",
        accent: "#ff64c8",
        "accent-deep": "#391c57",
      },
      fontFamily: {
        display: ['"Archivo Black"', "system-ui", "sans-serif"],
        body: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      letterSpacing: {
        display: "-0.04em",
      },
    },
  },
  plugins: [],
};
