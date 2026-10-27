import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from "framer-motion";
import CursorGlow from "./components/CursorGlow.jsx";
import { fireConfetti } from "./lib/confetti.js";
import { ArrowUpRight, EnvelopeSimple, Copy, Check, Disc, InstagramLogo, FacebookLogo, YoutubeLogo, WhatsappLogo, SpotifyLogo } from "@phosphor-icons/react";
import Nav from "./components/Nav.jsx";
import Reveal, { spring } from "./components/Reveal.jsx";
import Embed from "./components/Embed.jsx";
import PlaylistSection from "./components/PlaylistSection.jsx";
import HeroGlow from "./components/HeroGlow.jsx";
import Sparkles from "./components/Sparkles.jsx";
import Snow from "./components/Snow.jsx";
import Seasonal, { SeasonBadge, SeasonalTaps, useSeason } from "./components/Seasonal.jsx";
import HeroAurora from "./components/HeroAurora.jsx";
import Reviews from "./components/Reviews.jsx";
import SecretBurst from "./components/SecretBurst.jsx";
import { useDecorReduce } from "./lib/motion.js";
import { VideoCard } from "./components/SongPlayer.jsx";
import { PlayerProvider, TrackRow, MiniPlayer, usePlayer } from "./components/MiniPlayer.jsx";
import { VIDEO_IDS, CHANNEL_URL, CONTACT_EMAIL, SOCIAL_LINKS, SPOTIFY_ARTIST_URL } from "./data/videos.js";
import { AUDIO_TRACKS } from "./data/songs.js";
import { BANGLA_TRACKS } from "./data/bangla-songs.js";
import BeatField from "./components/BeatField.jsx";
import AdSlot from "./components/AdSlot.jsx";
import ChatLauncher from "./components/ChatLauncher.jsx";
import InstallPrompt from "./components/InstallPrompt.jsx";
import EnglishPage from "./components/EnglishPage.jsx";
import { ENGLISH_ALL } from "./data/english-songs.js";

const YEAR = new Date().getFullYear();

// Placeholder target: change this one constant to set the next release date (ISO, local time).
const RELEASE_DATE = "2026-12-01T00:00:00";
const RELEASE_NAME = "Next single";

// Photo intro: the portrait in a round frame with a soft blue glow ring, then the name fades in,
// then the screen slides away into the hero. Shows on the first visit only (localStorage), tap anywhere to skip, ~1s.
// Only transform and opacity animate (one small image, no blur filters, no animated shadows).
const INTRO_HOLD_MS = 700; // how long the intro stays before it starts leaving
const INTRO_EXIT_S = 0.3; // leave animation, so the intro is gone by ~2.5s
const INTRO_TYPE_DELAY_MS = 1000; // first-visit typewriter starts once the intro has gone

function IntroLoader() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(() => { try { return !localStorage.getItem("srd-intro-seen"); } catch { return false; } });
  const [leaving, setLeaving] = useState(false);

  const finish = () => {
    try { localStorage.setItem("srd-intro-seen", "1"); } catch {}
    setShow(false);
  };
  const leave = () => {
    if (leaving) return;
    setLeaving(true);
  };

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(leave, reduce ? 300 : INTRO_HOLD_MS);
    return () => clearTimeout(t);
  }, [show, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(finish, reduce ? 150 : INTRO_EXIT_S * 1000);
    return () => clearTimeout(t);
  }, [leaving, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          role="status"
          aria-label="Intro"
          onClick={leave}
          onPointerDown={leave}
          initial={{ opacity: 1 }}
          animate={leaving ? { opacity: 0, y: reduce ? 0 : -24 } : { opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.15 : INTRO_EXIT_S, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-6 bg-canvas"
        >
          <div className="relative">
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              transition={{ duration: reduce ? 0.2 : 0.9, ease: "easeOut" }}
              className="pointer-events-none absolute -inset-5 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(11,108,240,0) 58%, rgba(90,160,255,0.55) 66%, rgba(11,108,240,0.18) 74%, rgba(11,108,240,0) 80%)",
              }}
            />
            <motion.img
              src="/images/avatar.webp"
              alt="SRD Masum"
              width="176"
              height="176"
              decoding="async"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduce ? 0.2 : 0.9, ease: "easeOut" }}
              className="relative h-44 w-44 rounded-full object-cover object-[50%_20%] ring-1 ring-accent/70 sm:h-52 sm:w-52"
            />
          </div>
          <motion.p
            initial={{ opacity: 0, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.7, duration: reduce ? 0.2 : 0.8, ease: "easeOut" }}
            className="font-display text-3xl tracking-tight text-ink sm:text-4xl"
          >
            SRD Masum
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Countdown() {
  const reduce = useReducedMotion();
  const target = new Date(RELEASE_DATE).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // One tick per second, only while the tab is visible. It re-syncs on return instead of firing while hidden.
    let id = 0;
    const start = () => {
      if (!id) id = setInterval(() => setNow(Date.now()), 1000);
    };
    const stop = () => {
      if (id) clearInterval(id);
      id = 0;
    };
    const onVis = () => {
      if (document.hidden) stop();
      else {
        setNow(Date.now());
        start();
      }
    };
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const diff = Math.max(0, target - now);
  const units = [
    { label: "Days", value: Math.floor(diff / 86400000) },
    { label: "Hours", value: Math.floor((diff / 3600000) % 24) },
    { label: "Minutes", value: Math.floor((diff / 60000) % 60) },
    { label: "Seconds", value: Math.floor((diff / 1000) % 60) },
  ];

  if (diff <= 0) {
    return (
      <p className="rounded-2xl bg-raised p-6 text-lg text-ink ring-1 ring-hairline">
        {RELEASE_NAME} is out now. Thanks for listening, and go press play.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-4 gap-3 sm:gap-5">
      {units.map((u) => (
        <li key={u.label} className="shine-tile glow-hover pro-card relative flex flex-col items-center overflow-hidden rounded-2xl bg-raised px-2 py-5 ring-1 ring-hairline sm:py-7">
          <motion.span
            key={u.value}
            initial={reduce ? false : { scale: 1.12, opacity: 0.55 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="inline-block font-display text-3xl tabular-nums tracking-display sm:text-5xl"
          >
            {String(u.value).padStart(2, "0")}
          </motion.span>
          <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted sm:text-xs">{u.label}</span>
        </li>
      ))}
    </ul>
  );
}

function NotifyForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | busy | ok | already | bad | err
  const submit = async (e) => {
    e.preventDefault();
    const v = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) || v.length > 120) { setState("bad"); return; }
    setState("busy");
    try {
      const r = await fetch("/api/notify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: v }) });
      const d = await r.json().catch(() => ({}));
      setState(r.ok ? (d.already ? "already" : "ok") : r.status === 400 ? "bad" : "err");
      if (r.ok) setEmail("");
    } catch { setState("err"); }
  };
  const msg = {
    ok: "Thanks! You're on the list.",
    already: "You're already on the list.",
    bad: "Please enter a valid email.",
    err: "Something went wrong. Please try again later.",
  }[state];
  return (
    <form onSubmit={submit} className="mt-8 max-w-xl" noValidate>
      <label htmlFor="notify-email" className="mb-2 block text-sm font-medium text-ink">
        Get notified about new releases
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input id="notify-email" type="email" inputMode="email" autoComplete="email" required maxLength={120}
          value={email} onChange={(e) => { setEmail(e.target.value); if (state !== "busy") setState("idle"); }}
          placeholder="you@example.com"
          className="min-h-[48px] flex-1 rounded-full bg-raised px-5 text-ink ring-1 ring-hairline placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent" />
        <button type="submit" disabled={state === "busy"}
          className="min-h-[48px] rounded-full bg-accent px-6 font-medium text-white transition active:scale-[0.97] disabled:opacity-60">
          {state === "busy" ? "…" : "Notify me"}
        </button>
      </div>
      <p className="mt-2 min-h-[1.25rem] text-sm text-muted" role="status" aria-live="polite">{msg || "Email only. No spam."}</p>
    </form>
  );
}

function NewRelease() {
  return (
    <section id="new-release" className="scroll-mt-20 border-t border-hairline px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl lg:max-w-[1240px]">
        <Reveal>
          <SectionHeader eyebrow="Coming soon" title="New Release" />
          <p className="mb-6 text-muted">{RELEASE_NAME} drops soon. Counting down to the moment.</p>
          <Countdown />
          <NotifyForm />
        </Reveal>
      </div>
    </section>
  );
}


function SectionHeader({ eyebrow, title }) {
  return (
    <div className="mb-10 border-b border-hairline pb-8 sm:mb-14 sm:pb-10">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 font-display text-3xl leading-[1.05] tracking-display sm:text-5xl">{title}</h2>
    </div>
  );
}

// Types text out one letter at a time. Starts after the intro loader on a first visit.
function Typewriter({ text, delay = 0 }) {
  const reduce = useDecorReduce();
  const [count, setCount] = useState(reduce ? text.length : 0);
  const [caret, setCaret] = useState(!reduce);

  useEffect(() => {
    if (reduce) return;
    let i = 0;
    let t;
    const step = () => {
      i += 1;
      setCount(i);
      if (i < text.length) t = setTimeout(step, 110);
      else t = setTimeout(() => setCaret(false), 1800);
    };
    t = setTimeout(step, delay);
    return () => clearTimeout(t);
  }, [text, delay, reduce]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="whitespace-pre">{text.slice(0, count)}</span>
      {caret && (
        <span aria-hidden="true" className="type-caret ml-[0.04em] inline-block h-[0.8em] w-[0.06em] translate-y-[0.02em] bg-accent align-middle" />
      )}
    </>
  );
}

// Desktop-only (>=1024px) right column of the hero: quick-start card with the latest own songs.
function HeroDeskCard() {
  const list = [...BANGLA_TRACKS, ...AUDIO_TRACKS].filter((t) => !t.artist || t.artist === "SRD Masum").slice(0, 4);
  const picks = list.length >= 3 ? list : [...BANGLA_TRACKS, ...AUDIO_TRACKS].slice(0, 4);
  if (!picks.length) return null;
  return (
    <motion.aside initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.45 }}
      aria-label="Start listening" className="hero-desk-card hidden rounded-3xl bg-raised/70 p-6 ring-1 ring-hairline backdrop-blur-xl lg:block">
      <div className="flex items-center gap-4">
        <img src="/images/avatar.webp" alt="SRD Masum" className="h-16 w-16 rounded-full object-cover ring-2 ring-accent/60" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">Official Music</p>
          <p className="truncate font-display text-2xl text-ink">Start listening</p>
          <p className="text-xs text-muted">English · Hindi · Bangla</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-1">
        {picks.map((t, i) => <TrackRow key={t.id} track={t} list={picks} index={i} />)}
      </div>
      <div className="mt-5 flex gap-3">
        <a href={SPOTIFY_ARTIST_URL} target="_blank" rel="noopener noreferrer" className="pro-btn inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-hairline px-4 py-2.5 text-sm font-semibold text-ink hover:bg-sunk"><SpotifyLogo size={18} weight="fill" aria-hidden="true" />Spotify<span className="sr-only">(opens in a new tab)</span></a>
        <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="pro-btn inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-hairline px-4 py-2.5 text-sm font-semibold text-ink hover:bg-sunk"><YoutubeLogo size={18} weight="fill" aria-hidden="true" />YouTube<span className="sr-only">(opens in a new tab)</span></a>
      </div>
    </motion.aside>
  );
}

function Hero() {
  const reduce = useReducedMotion();
  const player = usePlayer();
  const season = useSeason();
  const { scrollY } = useScroll();
  // Background drifts down slower than the page scrolls (gentle parallax). Image is oversized so it never shows an edge.
  const parallaxY = useTransform(scrollY, [0, 900], [0, 120]);
  // On a first visit the intro covers the page for about 1.5s, so the typing waits for it.
  const [introDelay] = useState(() => { try { return localStorage.getItem("srd-intro-seen") ? 250 : INTRO_TYPE_DELAY_MS; } catch { return 250; } });
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <picture>
        <source media="(max-width: 767px)" type="image/webp" srcSet="/images/hero-milan-mobile.webp" />
        <source media="(max-width: 767px)" srcSet="/images/hero-milan-mobile.jpg" />
        <source type="image/webp" srcSet="/images/hero-milan.webp" />
      <motion.img
        src="/images/hero-milan.jpg"
        fetchpriority="high"
        decoding="async"
        alt=""
        aria-hidden="true"
        style={reduce ? undefined : { y: parallaxY }}
        className="absolute inset-x-0 -top-[12%] -z-10 h-[124%] w-full object-cover object-[50%_20%] md:object-[65%_25%] opacity-60 will-change-transform"
      />
      </picture>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-canvas/60 via-canvas/75 to-canvas/95" aria-hidden="true" />
      <div className="hero-blend" aria-hidden="true" />
      <HeroGlow />
      <HeroAurora />
      <Sparkles />
      {season === "christmas" ? null : <Snow />}
      <Seasonal season={season} />
      <SeasonalTaps season={season} />
      <div className="mx-auto min-h-[78svh] max-w-6xl px-5 pb-0 pt-28 sm:px-8 sm:pb-24 lg:grid lg:min-h-[82svh] lg:max-w-[1240px] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-14">
        <div className="flex min-h-[calc(78svh-7rem)] flex-col justify-end lg:min-h-0">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="eyebrow"
        >
          Artist · Songs · Sound
        </motion.p>
        <SeasonBadge season={season} />
        <h1 className="beat-hero hero-title mt-4 font-display text-[clamp(3.5rem,13vw,10rem)] leading-[0.9] lg:text-[clamp(4.5rem,6.4vw,6.75rem)] lg:whitespace-nowrap tracking-display">
          <Typewriter text="SRD Masum" delay={introDelay} />
        </h1>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.35 }}
          className="mt-6 max-w-[34rem] text-base leading-relaxed text-muted sm:text-xl sm:leading-relaxed"
        >
          Music made to be played loud, late, and on repeat. Every new track lands here first.
        </motion.p>
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <a
            href="#music"
            onClick={(e) => {
              e.preventDefault();
              const first = AUDIO_TRACKS[0] || BANGLA_TRACKS[0];
              if (player && first && !player.track) player.toggle(first, AUDIO_TRACKS.length ? AUDIO_TRACKS : BANGLA_TRACKS);
              document.getElementById("music")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
            }}
            className="glow-hover pro-btn beat-pop inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-on-accent transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" /></svg>
            Listen now
          </a>
          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="glow-hover pro-btn beat-pop inline-flex items-center gap-2 rounded-full border border-hairline bg-raised px-6 py-3 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-sunk"
          >
            Watch on YouTube
            <ArrowUpRight size={16} aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </motion.div>
        </div>
        <HeroDeskCard />
      </div>
    </section>
  );
}

function BanglaSongs() {
  return (
    <section id="bangla-songs" lang="bn" className="scroll-mt-20 border-t border-hairline px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl lg:max-w-[1240px]">
        <Reveal>
          <SectionHeader eyebrow="Listen" title="Bangla Songs" />
        </Reveal>
        {BANGLA_TRACKS.length === 0 ? (
          <Reveal>
            <p className="font-mono text-sm text-faint">Coming soon</p>
          </Reveal>
        ) : (
          <div className="flex flex-col gap-1 lg:grid lg:grid-cols-2 lg:gap-x-8">
            {BANGLA_TRACKS.map((t, i) => (
              <TrackRow key={t.id} track={t} list={BANGLA_TRACKS} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const SONGS = [
  { id: "1jjDs69WWUQ", title: "Laal Dupatta", film: "Mujhse Shaadi Karogi (2004)" },
  { id: "W2mjfazc9eM", title: "Dupatta Tera Nau Rang Da", film: "Partner (2007)" },
  { id: "jSkBtDg-8lg", title: "Sajan Tumse Pyar Ki Ladai Mein", film: "Maine Pyar Kyun Kiya (2005)" },
];

function AudioSongs() {
  if (AUDIO_TRACKS.length === 0) return null;
  return (
    <section id="audio-songs" lang="hi" className="scroll-mt-20 border-t border-hairline px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl lg:max-w-[1240px]">
        <Reveal>
          <SectionHeader eyebrow="Listen" title="Hindi Songs" />
        </Reveal>
        <div className="flex flex-col gap-1 lg:grid lg:grid-cols-2 lg:gap-x-8">
          {AUDIO_TRACKS.map((t, i) => (
            <TrackRow key={t.id} track={t} list={AUDIO_TRACKS} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Songs() {
  return (
    <section id="songs" className="scroll-mt-20 border-t border-hairline px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl lg:max-w-[1240px]">
        <Reveal>
          <SectionHeader eyebrow="Watch" title="Bollywood Songs" />
        </Reveal>

        <ul className="mt-10 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6">
          {SONGS.map((s, i) => (
            <Reveal as="li" key={s.id} delay={(i % 2) * 0.08}>
              <VideoCard
                id={s.id}
                title={`${s.title} · ${s.film}`}
              />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Music() {
  const player = usePlayer();
  const groups = [
    { label: "Hindi", list: AUDIO_TRACKS },
    { label: "Bangla", list: BANGLA_TRACKS },
  ].filter((g) => g.list.length);
  return (
    <section id="music" className="scroll-mt-20 border-t border-hairline px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl lg:max-w-[1240px]">
        <Reveal>
          <SectionHeader eyebrow="Listen" title="Music" />
        </Reveal>

        <Reveal delay={0.06}>
          <div className="mt-2 overflow-hidden rounded-2xl bg-raised/60 p-3 ring-1 ring-hairline sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <p className="text-sm font-semibold text-ink">Play on this site</p>
              {player?.track && (
                <span className="truncate font-mono text-[11px] text-accent">{player.playing ? "▶ " : "❚❚ "}{player.track.title}</span>
              )}
            </div>
            {groups.map((g) => (
              <div key={g.label} className="mb-2 last:mb-0">
                <p className="eyebrow mb-1 px-2 !text-[10px]">{g.label}</p>
                <div className="flex flex-col gap-1">
                  {g.list.map((t, i) => (
                    <TrackRow key={t.id} track={t} list={g.list} index={i} alias fallbackArt="/images/avatar.webp" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.12} className="mt-8 flex justify-center sm:justify-start">
          <motion.a
            href={SPOTIFY_ARTIST_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ scale: 0.97 }}
            transition={spring}
            className="glow-hover beat-pop inline-flex items-center gap-2 rounded-full bg-[#1DB954] px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-[#1ed760]"
          >
            <SpotifyLogo size={18} weight="fill" aria-hidden="true" />
            Follow on Spotify
            <ArrowUpRight size={16} aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </motion.a>
        </Reveal>
      </div>
    </section>
  );
}

function VideoCarousel() {
  const reduce = useReducedMotion();
  const trackRef = useRef(null);
  const drag = useRef(null);
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [scrollable, setScrollable] = useState(false);

  const cards = () => Array.from(trackRef.current?.children ?? []);

  const measure = () => {
    const el = trackRef.current;
    if (!el) return;
    setScrollable(el.scrollWidth - el.clientWidth > 4);
    const max = el.scrollWidth - el.clientWidth;
    const count = cards().length;
    if (max <= 0 || count < 2) return setIndex(0);
    if (el.scrollLeft >= max - 4) return setIndex(count - 1);
    const pos = el.scrollLeft;
    let best = 0;
    cards().forEach((c, i) => {
      if (Math.abs(c.offsetLeft - pos) < Math.abs(cards()[best].offsetLeft - pos)) best = i;
    });
    setIndex(best);
  };

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const goTo = (i) => {
    const el = trackRef.current;
    const target = cards()[i];
    if (!el || !target) return;
    el.scrollTo({ left: target.offsetLeft, behavior: reduce ? "auto" : "smooth" });
  };

  const onPointerDown = (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag.current = { x: e.clientX, left: trackRef.current.scrollLeft, moved: false, startIndex: index };
    trackRef.current.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 6) return;
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
    }
    trackRef.current.scrollLeft = d.left - dx;
  };

  const endDrag = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.moved) return;
    const el = trackRef.current;
    const dx = e.clientX - d.x;
    const max = el.scrollWidth - el.clientWidth;
    let next;
    if (Math.abs(dx) > 40) {
      next = dx < 0 ? d.startIndex + 1 : d.startIndex - 1;
    } else {
      next = d.startIndex;
    }
    next = Math.min(cards().length - 1, Math.max(0, next));
    if (max <= 0) next = 0;
    setDragging(false);
    goTo(next);
  };

  return (
    <div className="-mx-5 sm:-mx-8 lg:mx-0">
      <ul
        ref={trackRef}
        onScroll={measure}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ scrollSnapType: dragging ? "none" : "x mandatory" }}
        className={`flex snap-x gap-6 overflow-x-auto px-5 pb-2 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          scrollable ? "cursor-grab active:cursor-grabbing" : ""
        } ${dragging ? "select-none [&_iframe]:pointer-events-none" : ""}`}
      >
        {VIDEO_IDS.map((id, i) => (
          <motion.li
            key={id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ ...spring, delay: (i % 3) * 0.08 }}
            className="w-[85%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
          >
            <Embed id={id} title={`SRD Masum video ${i + 1}`} />
          </motion.li>
        ))}
      </ul>
      {scrollable && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {VIDEO_IDS.map((id, i) => (
            <button
              key={id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show video ${i + 1}`}
              aria-current={index === i ? "true" : undefined}
              className="relative flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="h-2 w-2 rounded-full bg-hairline transition-colors duration-200" />
              {index === i && (
                <motion.span
                  layoutId="video-dot"
                  transition={reduce ? { duration: 0 } : spring}
                  className="absolute h-2 w-2 rounded-full bg-accent"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Videos() {
  return (
    <section id="videos" className="scroll-mt-20 border-t border-hairline px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl lg:max-w-[1240px]">
        <Reveal>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
            <SectionHeader eyebrow="Catalogue" title="Videos" />
            <a
              href={CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-hairline bg-raised px-5 py-2.5 text-sm font-medium text-ink transition-colors duration-200 hover:bg-sunk sm:mb-10"
            >
              Watch more on YouTube
              <ArrowUpRight size={16} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        </Reveal>
        <VideoCarousel />
      </div>
    </section>
  );
}

function Contact() {
  const [copied, setCopied] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      if ("vibrate" in navigator) navigator.vibrate(10);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="contact" className="scroll-mt-20 border-t border-hairline px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl lg:max-w-[1240px]">
        <Reveal className="flex flex-col gap-8 rounded-2xl bg-raised p-6 ring-1 ring-hairline sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <p className="eyebrow">Get in touch</p>
            <h2 className="mt-4 font-display text-3xl leading-[1.05] tracking-display sm:text-5xl">Contact</h2>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-5 inline-flex items-center gap-3 break-all text-lg font-medium text-ink underline decoration-accent decoration-2 underline-offset-8 transition-colors hover:text-accent sm:text-xl"
            >
              <EnvelopeSimple size={22} aria-hidden="true" className="shrink-0 text-accent" />
              {CONTACT_EMAIL}
            </a>
          </div>

          <motion.button
            type="button"
            onClick={copy}
            whileTap={reduce ? undefined : { scale: 0.96 }}
            transition={spring}
            className="glow-hover beat-pop inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-sunk px-5 py-3 text-sm font-medium text-ink ring-1 ring-hairline transition-colors hover:bg-canvas sm:self-center"
            aria-live="polite"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={copied ? "copied" : "copy"}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={spring}
                className="inline-flex items-center gap-2"
              >
                {copied ? <Check size={16} weight="bold" aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {copied ? "Email copied" : "Copy email"}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </Reveal>
      </div>
    </section>
  );
}

const VISITOR_DAY_KEY = "srd-visit-day";
const VISITOR_SEED = 20001;

// Real counter: /api/visits on the Pages worker (KV). Counted once per browser per day.
function VisitorCounter() {
  const [count, setCount] = useState(null);
  const [shown, setShown] = useState(VISITOR_SEED);

  useEffect(() => {
    let day = new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10);
    let counted = false;
    try { counted = localStorage.getItem(VISITOR_DAY_KEY) === day; } catch { /* ignore */ }
    fetch("/api/visits", { method: counted ? "GET" : "POST", cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (typeof d.count !== "number") return;
        try { localStorage.setItem(VISITOR_DAY_KEY, day); } catch { /* ignore */ }
        setCount(d.count);
      })
      .catch(() => {});
  }, []);

  // Count up from the seed to the live number once it arrives.
  useEffect(() => {
    if (count == null) return;
    const from = Math.min(Math.max(count - 40, VISITOR_SEED), count);
    const t0 = performance.now();
    let raf;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 1200);
      setShown(Math.round(from + (count - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [count]);

  return (
    <p className="mt-6 text-center font-mono text-xs text-faint sm:mt-8" data-visitors={count ?? ""}>
      visitors: <span className="tabular-nums">{shown.toLocaleString("en-US")}</span>
    </p>
  );
}

function Footer() {
  return (
    <footer className="border-t border-hairline bg-sunk px-5 pb-10 pt-12 sm:px-8 sm:pt-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:max-w-[1240px] text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-2 font-display text-xl tracking-display text-ink">
            <Disc size={20} aria-hidden="true" className="text-accent" />
            SRD Masum
          </p>
          <p className="max-w-xs text-sm leading-relaxed text-muted">Music made to be played loud, late, and on repeat.</p>
          <p className="text-xs text-faint">© {YEAR} SRD Masum. All rights reserved.</p>
        </div>
        <div className="flex items-center gap-2.5">
          {[
            { key: "instagram", label: "Instagram", Icon: InstagramLogo },
            { key: "facebook", label: "Facebook", Icon: FacebookLogo },
            { key: "youtube", label: "YouTube", Icon: YoutubeLogo },
            { key: "whatsapp", label: "WhatsApp", Icon: WhatsappLogo },
          ].map(({ key, label, Icon }) => (
            <a
              key={key}
              href={SOCIAL_LINKS[key]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} (opens in a new tab)`}
              className="glow-hover pro-btn beat-pop inline-flex h-10 w-10 items-center justify-center rounded-full bg-raised text-ink ring-1 ring-hairline transition-colors hover:text-accent focus-visible:text-accent"
            >
              <Icon size={18} aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
      <VisitorCounter />
    </footer>
  );
}

// Curtain reveal: on the very first visit (localStorage), ~1s the screen starts dark, "SRD MASUM" ignites with a
// fire-like glow, then two velvet panels part and the site is revealed. Tap anywhere to skip.
// Only transform and opacity animate (no blur filters, no animated shadows). The flame is a plain
// radial gradient. It sits above the avatar intro (z-50) and clears before the intro is gone.
const CURTAIN_LETTERS = "SRD MASUM".split("");
const CURTAIN_EASE = [0.76, 0, 0.24, 1];

function CurtainReveal() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(() => {
    try {
      return !localStorage.getItem("srd-curtain-seen");
    } catch {
      return false;
    }
  });
  const [open, setOpen] = useState(false);

  const finish = () => {
    try {
      localStorage.setItem("srd-curtain-seen", "1");
    } catch {
      /* storage unavailable: the curtain just plays again on the next load */
    }
    setShow(false);
  };

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setOpen(true), reduce ? 300 : 450);
    return () => clearTimeout(t);
  }, [show, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(finish, reduce ? 350 : 550);
    return () => clearTimeout(t);
  }, [open, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!show) return null;

  const panelStyle = {
    background: "linear-gradient(90deg, #0b0a09 0%, #171614 100%)",
  };

  return (
    <div
      aria-hidden="true"
      onPointerDown={() => setOpen(true)}
      className="fixed inset-0 z-[60] cursor-pointer overflow-hidden"
    >
      <motion.div
        initial={{ x: "0%" }}
        animate={{ x: open ? "-100%" : "0%" }}
        transition={{ duration: reduce ? 0.3 : 0.5, ease: CURTAIN_EASE }}
        style={panelStyle}
        className="absolute inset-y-0 left-0 w-1/2 will-change-transform"
      >
        <div className="absolute inset-y-0 right-0 w-px bg-accent/60" />
      </motion.div>
      <motion.div
        initial={{ x: "0%" }}
        animate={{ x: open ? "100%" : "0%" }}
        transition={{ duration: reduce ? 0.3 : 0.5, ease: CURTAIN_EASE }}
        style={panelStyle}
        className="absolute inset-y-0 right-0 w-1/2 will-change-transform"
      >
        <div className="absolute inset-y-0 left-0 w-px bg-accent/60" />
      </motion.div>
      <motion.div
        animate={{ opacity: open ? 0 : 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="curtain-flame" />
        <p className="relative font-display text-[clamp(2.5rem,11vw,7rem)] leading-none tracking-display text-ink">
          {CURTAIN_LETTERS.map((ch, i) => (
            <span
              key={i}
              className="curtain-letter"
              style={{ animationDelay: `${reduce ? i * 15 : i * 30}ms` }}
            >
              {ch === " " ? "\u00a0" : ch}
            </span>
          ))}
        </p>
      </motion.div>
    </div>
  );
}

// /english/ (and /song/<id>/ of an English song) renders the English page instead of the home sections.
const PAGE = (() => {
  if (typeof window === "undefined") return "home";
  const p = window.location.pathname;
  if (/^\/english(\/|$)/.test(p)) return "english";
  const id = p.match(/^\/song\/([^/]+)\/?$/)?.[1];
  return id && ENGLISH_ALL.some((t) => t.id === decodeURIComponent(id)) ? "english" : "home";
})();

export default function App() {
  if (PAGE === "english") return (
    <PlayerProvider>
    <div className="min-h-screen pb-24">
      <BeatField />
      <CursorGlow />
      <SecretBurst />
      <Nav page="english" />
      <main><EnglishPage /></main>
      <Footer />
      <InstallPrompt />
      <ChatLauncher />
    </div>
    </PlayerProvider>
  );
  return (
    <PlayerProvider>
    <div className="min-h-screen pb-24">
      <CurtainReveal />
      <IntroLoader />
      <BeatField />
      <CursorGlow />
      <SecretBurst />
      <Nav />
      <main>
        <Hero />
        <PlaylistSection />
        <AdSlot type="banner300" desktopOnly />
        <Music />
        <AdSlot type="banner320" />
        <AudioSongs />
        <AdSlot type="native" />
        <BanglaSongs />
        <Videos />
        <NewRelease />
        <Songs />
        <Reviews />
        <AdSlot type="banner300" />
        <Contact />
      </main>
      <Footer />
      <MiniPlayer />
      <InstallPrompt />
      <ChatLauncher />
    </div>
    </PlayerProvider>
  );
}
