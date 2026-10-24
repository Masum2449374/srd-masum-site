import { useEffect, useState } from "react";
import { motion, LayoutGroup, AnimatePresence, useReducedMotion } from "framer-motion";
import { YoutubeLogo, ArrowUpRight, Sun, Moon } from "@phosphor-icons/react";
import { spring } from "./Reveal.jsx";
import { CHANNEL_URL } from "../data/videos.js";

const LINKS = [
  { id: "bangla-songs", label: "Bangla Songs" },
  { id: "featured", label: "Featured" },
  { id: "music", label: "Music" },
  { id: "songs", label: "Songs" },
  { id: "gallery", label: "Gallery" },
  { id: "videos", label: "Videos" },
  { id: "press-kit", label: "Press Kit" },
  { id: "reviews", label: "Reviews" },
  { id: "contact", label: "Contact" },
];

const THEME_KEY = "srd-theme";

export default function Nav() {
  const [active, setActive] = useState("featured");
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains("light") ? "light" : "dark",
  );
  const reduce = useReducedMotion();

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("light", next === "light");
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {}
    setTheme(next);
  };

  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <a href="#top" className="flex items-center gap-2 font-display text-lg tracking-display">
          <img src="/images/avatar.jpg" alt="" aria-hidden="true" width="34" height="34" className="h-[34px] w-[34px] shrink-0 rounded-full object-cover ring-1 ring-accent" />
          <span>SRD <span className="text-accent">Masum</span></span>
        </a>

        <LayoutGroup id="nav">
          <nav aria-label="Primary" className="flex items-center gap-0.5 overflow-x-auto sm:gap-2">
            {LINKS.map((l) => {
              const isActive = active === l.id;
              return (
                <a
                  key={l.id}
                  href={`#${l.id}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`relative whitespace-nowrap rounded-full px-2.5 py-2 sm:px-3 text-sm font-medium transition-colors duration-300 ${
                    isActive ? "text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      transition={spring}
                      className="absolute inset-0 -z-10 rounded-full bg-sunk ring-1 ring-hairline"
                    />
                  )}
                  {l.label}
                </a>
              );
            })}
          </nav>
        </LayoutGroup>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
            className="glow-hover inline-flex h-9 w-9 items-center justify-center rounded-full text-muted ring-1 ring-hairline transition-colors duration-200 hover:text-ink active:scale-[0.92]"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={theme}
                initial={reduce ? { opacity: 0 } : { opacity: 0, rotate: -90, scale: 0.6 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, rotate: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, rotate: 90, scale: 0.6 }}
                transition={reduce ? { duration: 0.15 } : spring}
                className="inline-flex"
                aria-hidden="true"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </motion.span>
            </AnimatePresence>
          </button>

        <a
          href={CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-3 py-2 text-sm font-medium text-on-accent transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97] sm:px-4"
        >
          <YoutubeLogo weight="fill" size={18} aria-hidden="true" />
          <span className="hidden sm:inline">YouTube</span>
          <span className="sr-only sm:hidden">YouTube channel</span>
          <ArrowUpRight size={14} aria-hidden="true" className="hidden sm:block" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        </div>
      </div>
    </header>
  );
}
