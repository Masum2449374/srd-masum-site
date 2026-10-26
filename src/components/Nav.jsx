import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sun, Moon, List, X, CaretRight, CaretDown, Disc, Globe, MusicNotes, MusicNote, FilmStrip, Sparkle, Star, Television, PlayCircle, ChatCircleText, Heart, EnvelopeSimple, InstagramLogo, FacebookLogo, YoutubeLogo, WhatsappLogo, Play } from "@phosphor-icons/react";
import { spring } from "./Reveal.jsx";
import { triggerSecret } from "./SecretBurst.jsx";
import { playTapPop } from "../lib/sounds.js";
import { SOCIAL_LINKS } from "../data/videos.js";

const LINKS = [
  { id: "music", label: "Music", sub: "Albums & singles", Icon: Disc, g: 0 },
  { id: "english", label: "English", sub: "International tracks", href: "/english/", Icon: Globe, g: 0 },
  { id: "audio-songs", label: "Hindi Songs", sub: "Covers & originals", Icon: MusicNotes, g: 0 },
  { id: "bangla-songs", label: "Bangla Songs", sub: "বাংলা গান", Icon: MusicNote, g: 0 },
  { id: "songs", label: "Bollywood", sub: "Classic hits", Icon: FilmStrip, g: 0 },
  { id: "new-release", label: "New Release", sub: "Just dropped", Icon: Sparkle, g: 0 },
  { id: "featured", label: "Featured", sub: "Hand-picked highlights", Icon: Star, g: 1 },
  { id: "videos", label: "Videos", sub: "Watch the latest", Icon: Television, g: 1 },
  { id: "reviews", label: "Reviews", sub: "What listeners say", Icon: ChatCircleText, g: 2 },
  { id: "fan-wall", label: "Fan Wall", sub: "Leave a message", Icon: Heart, g: 2 },
  { id: "contact", label: "Contact", sub: "Bookings & collabs", Icon: EnvelopeSimple, g: 2 },
];
const GROUPS = ["Listen", "Watch & Explore", "Community"];
// One brand blue for Listen (most items) + one accent each for Watch (amber) and Community (violet).
const GROUP_TINT = ["59 130 246", "245 158 11", "139 92 246"];
const SOCIALS = [["instagram", "Instagram", InstagramLogo], ["facebook", "Facebook", FacebookLogo], ["youtube", "YouTube", YoutubeLogo], ["whatsapp", "WhatsApp", WhatsappLogo]];

const THEME_KEY = "srd-theme";

export default function Nav({ page = "home" }) {
  const onHome = page === "home";
  const [active, setActive] = useState(page === "english" ? "english" : "audio-songs");
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains("light") ? "light" : "dark",
  );
  const reduce = useReducedMotion();
  const tapRef = useRef({ count: 0, last: 0 });
  // Easter egg: 3 quick taps on the logo/avatar. Counted on pointerdown (touch, pen and mouse all fire it,
  // and it fires once per tap even when the click is swallowed by double-tap zoom or a menu close).
  // Window is 1.8s between taps so a slow budget-phone tap still counts.
  const onLogoTap = (e) => {
    if (e && e.pointerType === "mouse" && e.button !== 0) return;
    const now = Date.now();
    const st = tapRef.current;
    st.count = now - st.last <= 1800 ? st.count + 1 : 1;
    st.last = now;
    if (st.count >= 3) {
      st.count = 0;
      st.last = 0;
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

  // Esc closes, Tab is trapped inside the sheet, page scroll is locked while open, focus returns to the button.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const first = panel?.querySelector("a,button");
    first?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); setOpen(false); return; }
      if (e.key !== "Tab" || !panel) return;
      const f = [...panel.querySelectorAll("a[href],button:not([disabled])")];
      if (!f.length) return;
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const btn = buttonRef.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      btn?.focus({ preventScroll: true });
    };
  }, [open]);

  // Tapping a menu link: close the menu, then scroll exactly once. The native hash jump is cancelled so it
  // can't fight the menu exit animation or the page's own smooth-scroll (that was the shake on phones).
  // The scroll waits two frames so the menu has left before the page starts moving.
  const goTo = (e, id) => {
    e.preventDefault();
    playTapPop();
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
    <header className="pro-nav sticky top-0 z-40 border-b border-hairline" style={open ? { zIndex: 2147483000 } : undefined}>
      <div className="mx-auto flex h-16 max-w-6xl items-center lg:max-w-[1240px] justify-between gap-4 px-5 sm:px-8">
        <a
          href="#top"
          onPointerDown={onLogoTap}
          style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", WebkitUserSelect: "none", userSelect: "none" }}
          className="flex items-center gap-2 font-display text-lg tracking-display"
        >
          <img src="/images/avatar.webp" alt="" aria-hidden="true" width="34" height="34" className="h-[34px] w-[34px] shrink-0 rounded-full object-cover ring-1 ring-accent" />
          <span>SRD <span className="text-accent">Masum</span></span>
        </a>

        <DeskNav active={active} onHome={onHome} goTo={goTo} />

        <div className="flex shrink-0 items-center gap-2">
          <a href={onHome ? "#audio-songs" : "/#audio-songs"} onClick={(e) => { if (!onHome) return; goTo(e, "audio-songs"); }}
            className="pro-btn hidden items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-transform hover:scale-[1.03] active:scale-[0.97] lg:inline-flex">
            <Play size={14} weight="fill" aria-hidden="true" />Listen now
          </a>
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
            className="pro-btn inline-flex lg:hidden h-9 w-9 items-center justify-center rounded-full bg-accent text-on-accent transition-transform duration-200 active:scale-[0.92]"
          >
            {open ? <X size={18} weight="bold" aria-hidden="true" /> : <List size={18} weight="bold" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="srd-menu" data-testid="site-menu-root">
          <div className="srd-menu-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
          <div id="site-menu" ref={panelRef} role="dialog" aria-modal="true" aria-label="Site menu" className="srd-menu-sheet">
            <div className="srd-menu-head">
              <img src="/images/avatar.webp" alt="" aria-hidden="true" width="44" height="44" className="h-11 w-11 rounded-full object-cover ring-2 ring-accent" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg leading-tight tracking-display text-ink">SRD <span className="text-accent">Masum</span></p>
                <p className="text-xs text-muted">Music Platform</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="srd-menu-close"><X size={18} weight="bold" aria-hidden="true" /></button>
            </div>
            <nav aria-label="Sections" className="srd-menu-body">
              {GROUPS.map((g, gi) => (
                <section key={g} className="srd-menu-group" aria-labelledby={`mg-${gi}`}>
                  <h2 id={`mg-${gi}`} className="srd-menu-label">{g}</h2>
                  <ul className="srd-menu-list">
                    {LINKS.filter((l) => l.g === gi).map((l) => {
                      const isActive = active === l.id;
                      const i = LINKS.indexOf(l);
                      return (
                        <li key={l.id} style={{ "--i": i + gi }}>
                          <a
                            href={l.href || (onHome ? `#${l.id}` : `/#${l.id}`)}
                            aria-current={isActive ? "true" : undefined}
                            onClick={(e) => { if (l.href || !onHome) { playTapPop(); return; } goTo(e, l.id); }}
                            className={`srd-menu-row${isActive ? " is-active" : ""}`}
                          >
                            <span className="srd-menu-ico" style={{ "--tint": GROUP_TINT[l.g] }} aria-hidden="true"><l.Icon size={20} weight="duotone" /></span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[15px] font-semibold leading-tight">{l.label}</span>
                              <span className="srd-menu-sub">{l.sub}</span>
                            </span>
                            <CaretRight size={16} weight="bold" aria-hidden="true" className="srd-menu-chev" />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </nav>
            <div className="srd-menu-foot" style={{ "--i": 14 }}>
              <a href={onHome ? "#audio-songs" : "/#audio-songs"} onClick={(e) => { if (!onHome) return; goTo(e, "audio-songs"); }} className="srd-menu-cta">
                <Play size={16} weight="fill" aria-hidden="true" />Listen now
              </a>
              <div className="flex gap-2">
                {SOCIALS.map(([k, label, Icon]) => (
                  <a key={k} href={SOCIAL_LINKS[k]} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`} className="srd-menu-soc"><Icon size={18} aria-hidden="true" /></a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// Desktop (>=1024px) header nav: the menu's three groups as dropdowns. Hover or click opens; Esc / outside click closes.
function DeskNav({ active, onHome, goTo }) {
  const [openG, setOpenG] = useState(-1);
  const ref = useRef(null);
  const timer = useRef(0);
  useEffect(() => {
    if (openG < 0) return;
    const onKey = (e) => { if (e.key === "Escape") { setOpenG(-1); ref.current?.querySelector(`[data-g="${openG}"]`)?.focus(); } };
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpenG(-1); };
    document.addEventListener("keydown", onKey); document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, [openG]);
  const enter = (gi) => { clearTimeout(timer.current); setOpenG(gi); };
  const leave = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setOpenG(-1), 160); };
  return (
    <nav ref={ref} aria-label="Main" className="dk-nav hidden flex-1 items-center justify-center gap-1 lg:flex">
      {GROUPS.map((g, gi) => {
        const items = LINKS.filter((l) => l.g === gi);
        const has = items.some((l) => l.id === active);
        const isOpen = openG === gi;
        return (
          <div key={g} className="relative" onMouseEnter={() => enter(gi)} onMouseLeave={leave} style={{ "--tint": GROUP_TINT[gi] }}>
            <button type="button" data-g={gi} aria-expanded={isOpen} aria-haspopup="true" aria-controls={`dk-menu-${gi}`}
              onClick={() => setOpenG(isOpen ? -1 : gi)}
              className={`dk-trigger${has ? " is-active" : ""}${isOpen ? " is-open" : ""}`}>
              <span className="dk-dot" aria-hidden="true" />{g}
              <CaretDown size={12} weight="bold" aria-hidden="true" className="dk-caret" />
            </button>
            {isOpen && (
              <div id={`dk-menu-${gi}`} className="dk-panel" data-testid={`dk-panel-${gi}`}>
                <ul className={items.length > 4 ? "grid grid-cols-2 gap-1" : "flex flex-col gap-1"}>
                  {items.map((l) => (
                    <li key={l.id}>
                      <a href={l.href || (onHome ? `#${l.id}` : `/#${l.id}`)} aria-current={active === l.id ? "true" : undefined}
                        onClick={(e) => { setOpenG(-1); if (l.href || !onHome) { playTapPop(); return; } goTo(e, l.id); }}
                        className={`dk-item${active === l.id ? " is-active" : ""}`}>
                        <span className="srd-menu-ico" style={{ "--tint": GROUP_TINT[gi] }} aria-hidden="true"><l.Icon size={18} weight="duotone" /></span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold leading-tight text-ink">{l.label}</span>
                          <span className="block truncate text-xs text-muted">{l.sub}</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
