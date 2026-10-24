import { useEffect, useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { MusicNotes, YoutubeLogo, ArrowUpRight } from "@phosphor-icons/react";
import { spring } from "./Reveal.jsx";
import { CHANNEL_URL } from "../data/videos.js";

const LINKS = [
  { id: "featured", label: "Featured" },
  { id: "videos", label: "Videos" },
  { id: "contact", label: "Contact" },
];

export default function Nav() {
  const [active, setActive] = useState("featured");

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
          <MusicNotes weight="fill" className="text-accent" size={20} aria-hidden="true" />
          SRD Masum
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

        <a
          href={CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-3 py-2 text-sm font-medium text-canvas transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97] sm:px-4"
        >
          <YoutubeLogo weight="fill" size={18} aria-hidden="true" />
          <span className="hidden sm:inline">YouTube</span>
          <span className="sr-only sm:hidden">YouTube channel</span>
          <ArrowUpRight size={14} aria-hidden="true" className="hidden sm:block" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </header>
  );
}
