import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sun, Moon, List, X } from "@phosphor-icons/react";
import { spring } from "./Reveal.jsx";
import { triggerSecret } from "./SecretBurst.jsx";

const LINKS = [
  { id: "audio-songs", label: "Hindi Songs" },
  { id: "bangla-songs", label: "Bangla Songs" },
  { id: "featured", label: "Featured" },
  { id: "videos", label: "Videos" },
  { id: "music", label: "Music" },
  { id: "new-release", label: "New Release" },
  { id: "songs", label: "Bollywood" },
  { id: "reviews", label: "Reviews" },
  { id: "fan-wall", label: "Fan Wall" },
  { id: "contact", label: "Contact" },
];

const THEME_KEY = "srd-theme";

export default function Nav() {
  const [active, setActive] = useState("audio-songs");
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains("light") ? "light" : "dark",
  );
  const reduce = useReducedMotion();
  const tapRef = useRef({ count: 0, last: 0 });
  // Easter egg: 3 quick taps on the logo/avatar.
  const onLogoTap = () => {
    const now = Date.now();
    const st = tapRef.current;
    st.count = now - st.last < 900 ? st.count + 1 : 1;
    st.last = now;
    if (st.count >= 3) {
      st.count = 0;
      triggerSecret();
    }
  };
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("light", next === "light");
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {}
    setTheme(next);
  };

  // highlight the section currently in view (also shown in the menu)
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

  // close on Escape or a tap outside the menu
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  // Tapping a menu link: close the menu, then scroll exactly once. The native hash jump is cancelled so it
  // can't fight the menu exit animation or the page's own smooth-scroll (that was the shake on phones).
  // The scroll waits two frames so the menu has left before the page starts moving.
  const goTo = (e, id) => {
    e.preventDefault();
    const target = document.getElementById(id);
    setOpen(false);
    if (!target) return;
    const header = document.querySelector(".pro-nav");
    const offset = (header?.offsetHeight || 64) + 8;
    const smooth = !reduce && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "instant" });
        try {
          history.replaceState(null, "", `#${id}`);
        } catch (err) {}
      }),
    );
  };

  return (
    <header className="pro-nav sticky top-0 z-40 border-b border-hairline">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <a href="#top" onClick={onLogoTap} className="flex items-center gap-2 font-display text-lg tracking-display">
          <img src="/images/avatar.jpg" alt="" aria-hidden="true" width="34" height="34" className="h-[34px] w-[34px] shrink-0 rounded-full object-cover ring-1 ring-accent" />
          <span>SRD <span className="text-accent">Masum</span></span>
        </a>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
            className="glow-hover pro-btn inline-flex h-9 w-9 items-center justify-center rounded-full text-muted ring-1 ring-hairline transition-colors duration-200 hover:text-ink active:scale-[0.92]"
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

          <button
            ref={buttonRef}
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="pro-btn inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-on-accent transition-transform duration-200 active:scale-[0.92]"
          >
            {open ? <X size={18} weight="bold" aria-hidden="true" /> : <List size={18} weight="bold" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Menu opens instantly: no animation, so nothing is repainted or re-composited while it appears. */}
      {open && (
        <nav
          id="site-menu"
          ref={panelRef}
          aria-label="Sections"
          className="pro-nav-menu absolute left-0 right-0 top-full border-b border-hairline bg-sunk px-5 pb-5 pt-3 sm:px-8"
        >
          <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-2 sm:grid-cols-3">
            {LINKS.map((l) => {
              const isActive = active === l.id;
              return (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    aria-current={isActive ? "true" : undefined}
                    onClick={(e) => goTo(e, l.id)}
                    className={`block rounded-xl px-4 py-3 text-sm font-medium ring-1 ${
                      isActive
                        ? "bg-accent text-on-accent ring-accent"
                        : "text-muted ring-hairline"
                    }`}
                  >
                    {l.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
