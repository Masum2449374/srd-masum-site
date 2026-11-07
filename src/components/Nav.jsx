import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  House,
  SquaresFour,
  GlobeHemisphereWest,
  MusicNotes,
  ListNumbers,
  MagnifyingGlass,
  Sun,
  Moon,
  ArrowUpRight,
  InstagramLogo,
  WhatsappLogo,
  TelegramLogo,
  Disc,
  EnvelopeSimple,
} from "@phosphor-icons/react";
import SearchOverlay from "./SearchOverlay.jsx";
import { SOCIAL_LINKS } from "../data/videos.js";
import { triggerSecret } from "./SecretBurst.jsx";

const LINKS = [
  { id: "top", label: "Discover", Icon: House },
  { id: "music", label: "SRD Masum", Icon: Disc },
  {
    id: "english",
    label: "English rotation",
    Icon: GlobeHemisphereWest,
    href: "/english/",
  },
  { id: "collections", label: "Collections", Icon: SquaresFour },
  { id: "playlist", label: "All tracks", Icon: ListNumbers },
];
const SOCIALS = [
  ["instagram", "Instagram", InstagramLogo],
  ["whatsapp", "WhatsApp", WhatsappLogo],
  ["telegram", "Telegram", TelegramLogo],
];
export default function Nav({ page = "home" }) {
  const [search, setSearch] = useState(false),
    [active, setActive] = useState(page === "english" ? "english" : "top");
  const [light, setLight] = useState(() =>
    document.documentElement.classList.contains("light"),
  );
  const searchButton = useRef(null),
    taps = useRef({ count: 0, time: 0 });
  const onHome = page === "home";
  useEffect(() => {
    const k = (e) => {
      if (
        e.key !== "/" ||
        e.ctrlKey ||
        e.metaKey ||
        /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) ||
        e.target.isContentEditable
      )
        return;
      e.preventDefault();
      setSearch(true);
    };
    const ask = () => setSearch(true);
    document.addEventListener("keydown", k);
    window.addEventListener("srd-search", ask);
    return () => {
      document.removeEventListener("keydown", k);
      window.removeEventListener("srd-search", ask);
    };
  }, []);
  useEffect(() => {
    if (!onHome) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-15% 0px -65% 0px" },
    );
    LINKS.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [onHome]);
  const toggleTheme = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem("srd-theme", next ? "light" : "dark");
    } catch {}
  };
  const closeSearch = () => {
    setSearch(false);
    searchButton.current?.focus();
  };
  const href = (l) => l.href || `${onHome ? "" : "/"}#${l.id}`;
  const logoTap = () => {
    const now = Date.now();
    taps.current.count =
      now - taps.current.time < 1800 ? taps.current.count + 1 : 1;
    taps.current.time = now;
    if (taps.current.count === 3) {
      triggerSecret();
      taps.current.count = 0;
    }
  };
  return (
    <>
      <a href="#main-content" className="studio-skip">
        Skip to music
      </a>
      <aside className="studio-sidebar" aria-label="Music navigation">
        <a className="studio-brand" href="/" onPointerDown={logoTap}>
          <span className="studio-brand-mark">
            <MusicNotes size={23} weight="fill" />
          </span>
          <span>
            SRD<span className="studio-brand-light">Masum</span>
            <small>THE MUSIC SPACE</small>
          </span>
        </a>
        <p className="studio-nav-label">YOUR DAILY SOUNDTRACK</p>
        <nav>
          {LINKS.map(({ Icon, ...l }) => (
            <a
              key={l.id}
              href={href(l)}
              className={active === l.id ? "is-active" : ""}
              aria-current={active === l.id ? "page" : undefined}
            >
              <Icon size={21} weight={active === l.id ? "fill" : "regular"} />
              {l.label}
              {l.href && (
                <ArrowUpRight size={13} className="studio-nav-arrow" />
              )}
            </a>
          ))}
        </nav>
        <div className="studio-sidebar-divider" />
        <p className="studio-nav-label">MORE TO EXPLORE</p>
        <nav className="studio-secondary-nav">
          <a href={`${onHome ? "" : "/"}#audio-songs`}>
            <MusicNotes size={20} />
            Hindi & beyond
          </a>
          <a href={`${onHome ? "" : "/"}#bangla-songs`}>
            <MusicNotes size={20} />
            Bangla essentials
          </a>
          <a href={`${onHome ? "" : "/"}#contact`}>
            <EnvelopeSimple size={20} />
            Get in touch
          </a>
        </nav>
        <div className="studio-sidebar-bottom">
          <div className="studio-sidebar-note">
            <Disc size={23} />
            <p>
              Life sounds better
              <br />
              <strong>with a little music.</strong>
            </p>
          </div>
          <div className="studio-sidebar-socials">
            {SOCIALS.map(([key, label, Icon]) => (
              <a
                key={key}
                href={SOCIAL_LINKS[key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label} (opens in a new tab)`}
              >
                <Icon size={19} />
              </a>
            ))}
          </div>
          <a className="studio-policy" href="/copyright/">
            Copyright & DMCA
          </a>
        </div>
      </aside>
      <header className="studio-topbar">
        <div className="studio-mobile-brand">
          <a href="/" onPointerDown={logoTap} aria-label="SRD Masum home">
            <MusicNotes size={23} weight="fill" />
            <span>SRD Masum</span>
          </a>
        </div>
        <div className="studio-topbar-title">
          <span className="studio-live-dot" />
          {page === "english"
            ? "The English collection"
            : page === "home"
              ? "Discover your next favorite"
              : "The SRD Masum music space"}
        </div>
        <div className="studio-topbar-actions">
          <button
            type="button"
            ref={searchButton}
            aria-label="Search music and artists"
            className="studio-search-trigger"
            onClick={() => setSearch(true)}
            aria-haspopup="dialog"
          >
            <MagnifyingGlass size={19} />
            <span>Search music, artists…</span>
            <kbd>/</kbd>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="studio-icon-button"
            aria-label={`Switch to ${light ? "dark" : "light"} theme`}
          >
            {light ? <Moon size={19} /> : <Sun size={19} />}
          </button>
        </div>
      </header>
      <nav className="studio-mobile-nav" aria-label="Mobile navigation">
        <a
          href={onHome ? "#top" : "/"}
          aria-current={onHome && active === "top" ? "page" : undefined}
        >
          <House
            size={22}
            weight={onHome && active === "top" ? "fill" : "regular"}
          />
          <span>Discover</span>
        </a>
        <button type="button" onClick={() => setSearch(true)}>
          <MagnifyingGlass size={22} />
          <span>Search</span>
        </button>
        <a
          href="/english/"
          aria-current={page === "english" ? "page" : undefined}
        >
          <GlobeHemisphereWest size={22} />
          <span>English</span>
        </a>
        <a
          href={onHome ? "#collections" : "/#collections"}
          aria-current={active === "collections" ? "page" : undefined}
        >
          <SquaresFour size={22} />
          <span>Collections</span>
        </a>
      </nav>
      {search &&
        createPortal(<SearchOverlay onClose={closeSearch} />, document.body)}
    </>
  );
}
