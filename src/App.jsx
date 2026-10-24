import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from "framer-motion";
import CursorGlow from "./components/CursorGlow.jsx";
import { fireConfetti } from "./lib/confetti.js";
import { ArrowUpRight, EnvelopeSimple, Copy, Check, Disc, InstagramLogo, FacebookLogo, YoutubeLogo, WhatsappLogo, SpotifyLogo, DownloadSimple } from "@phosphor-icons/react";
import Nav from "./components/Nav.jsx";
import Reveal, { spring } from "./components/Reveal.jsx";
import Embed from "./components/Embed.jsx";
import HeroGlow from "./components/HeroGlow.jsx";
import Sparkles from "./components/Sparkles.jsx";
import Snow from "./components/Snow.jsx";
import HeroAurora from "./components/HeroAurora.jsx";
import Tilt from "./components/Tilt.jsx";
import Reviews from "./components/Reviews.jsx";
import { useDecorReduce } from "./lib/motion.js";
import { VideoCard } from "./components/SongPlayer.jsx";
import { PlayerProvider, TrackRow, MiniPlayer } from "./components/MiniPlayer.jsx";
import { VIDEO_IDS, FEATURED_PLAYLIST_ID, CHANNEL_URL, CONTACT_EMAIL, SOCIAL_LINKS, SPOTIFY_ARTIST_URL } from "./data/videos.js";
import { AUDIO_TRACKS } from "./data/songs.js";
import { BANGLA_TRACKS } from "./data/bangla-songs.js";
import BeatField from "./components/BeatField.jsx";

const YEAR = new Date().getFullYear();

// Placeholder target: change this one constant to set the next release date (ISO, local time).
const RELEASE_DATE = "2026-12-01T00:00:00";
const RELEASE_NAME = "Next single";

// Photo intro: the portrait in a round frame with a soft pink glow ring, then the name fades in,
// then the screen slides away into the hero. Shows once per session, tap anywhere to skip, max ~1.5s.
// Only transform and opacity animate (one small image, no blur filters, no animated shadows).
const INTRO_HOLD_MS = 1200; // how long the intro stays before it starts leaving
const INTRO_EXIT_S = 0.3; // leave animation, so the intro is gone by ~1.5s
const INTRO_TYPE_DELAY_MS = 1500; // first-visit typewriter starts once the intro has gone

function IntroLoader() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(() => !sessionStorage.getItem("srd-intro-seen"));
  const [leaving, setLeaving] = useState(false);

  const finish = () => {
    sessionStorage.setItem("srd-intro-seen", "1");
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
                  "radial-gradient(circle, rgba(255,100,200,0) 58%, rgba(255,120,210,0.55) 66%, rgba(255,100,200,0.18) 74%, rgba(255,100,200,0) 80%)",
              }}
            />
            <motion.img
              src="/images/avatar.jpg"
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

function NewRelease() {
  return (
    <section id="new-release" className="scroll-mt-20 border-t border-hairline px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader eyebrow="Coming soon" title="New Release" />
          <p className="mb-6 text-muted">{RELEASE_NAME} drops soon. Counting down to the moment.</p>
          <Countdown />
        </Reveal>
      </div>
    </section>
  );
}

function FanMessage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!name.trim()) next.name = "Please add your name.";
    if (!message.trim()) next.message = "Please write a message.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const subject = encodeURIComponent(`Fan message from ${name.trim()}`);
    const body = encodeURIComponent(`${message.trim()}\n\n— ${name.trim()}`);
    fireConfetti();
    setTimeout(() => {
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    }, 700);
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-hairline bg-sunk px-4 py-3 text-ink placeholder:text-faint focus:border-accent focus:outline-none";

  return (
    <section id="fan-message" className="scroll-mt-20 border-t border-hairline px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader eyebrow="Fans" title="Send a message" />
        </Reveal>
        <Reveal delay={0.08}>
          <form onSubmit={submit} noValidate className="pro-card flex max-w-2xl flex-col gap-5 rounded-2xl bg-raised p-6 ring-1 ring-hairline sm:p-10">
            <label className="flex flex-col text-sm font-medium text-muted">
              Your name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                className={inputClass}
                placeholder="Jane"
              />
              {errors.name && <span id="name-error" className="mt-2 text-xs text-accent">{errors.name}</span>}
            </label>
            <label className="flex flex-col text-sm font-medium text-muted">
              Your message
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "message-error" : undefined}
                className={`${inputClass} resize-y`}
                placeholder="Tell SRD Masum what you think"
              />
              {errors.message && <span id="message-error" className="mt-2 text-xs text-accent">{errors.message}</span>}
            </label>
            <button
              type="submit"
              className="inline-flex items-center gap-2 self-start rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
            >
              <EnvelopeSimple size={18} aria-hidden="true" />
              Send message
            </button>
          </form>
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

function Hero() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  // Background drifts down slower than the page scrolls (gentle parallax). Image is oversized so it never shows an edge.
  const parallaxY = useTransform(scrollY, [0, 900], [0, 120]);
  // On a first visit the intro covers the page for about 1.5s, so the typing waits for it.
  const [introDelay] = useState(() => (sessionStorage.getItem("srd-intro-seen") ? 250 : INTRO_TYPE_DELAY_MS));
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <motion.img
        src="/images/hero-portrait.jpg"
        alt=""
        aria-hidden="true"
        style={reduce ? undefined : { y: parallaxY }}
        className="absolute inset-x-0 -top-[12%] -z-10 h-[124%] w-full object-cover object-top opacity-60 will-change-transform"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-canvas/60 via-canvas/75 to-canvas/95" aria-hidden="true" />
      <div className="hero-blend" aria-hidden="true" />
      <HeroGlow />
      <HeroAurora />
      <Sparkles />
      <Snow />
      <div className="mx-auto flex min-h-[78svh] max-w-6xl flex-col justify-end px-5 pb-0 pt-28 sm:px-8 sm:pb-24">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="eyebrow"
        >
          Artist · Songs · Sound
        </motion.p>
        <h1 className="beat-hero hero-title mt-4 font-display text-[clamp(3.5rem,13vw,10rem)] leading-[0.9] tracking-display">
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
            href="#featured"
            className="glow-hover pro-btn beat-pop inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-on-accent transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
          >
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
    </section>
  );
}

function Featured() {
  return (
    <section id="featured" className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader eyebrow="Now playing" title="Featured" />
        </Reveal>
        <Reveal delay={0.08}>
          <Embed playlist={FEATURED_PLAYLIST_ID} title="SRD Masum featured playlist" />
        </Reveal>
      </div>
    </section>
  );
}

function BanglaSongs() {
  return (
    <section id="bangla-songs" className="scroll-mt-20 border-t border-hairline px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader eyebrow="Listen" title="Bangla Songs" />
        </Reveal>
        {BANGLA_TRACKS.length === 0 ? (
          <Reveal>
            <p className="font-mono text-sm text-faint">শীঘ্রই আসছে · coming soon</p>
          </Reveal>
        ) : (
          <div className="flex flex-col gap-1">
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
    <section id="audio-songs" className="scroll-mt-20 border-t border-hairline px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader eyebrow="Listen" title="Hindi Songs" />
        </Reveal>
        <div className="flex flex-col gap-1">
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
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader eyebrow="Bollywood" title="Songs" />
        </Reveal>

        <ul className="mt-10 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:gap-x-6">
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

const GALLERY_PHOTOS = [
  "/images/gallery/photo-3.jpg",
  "/images/gallery/photo-4.jpg",
  "/images/gallery/photo-5.jpg",
];

function Music() {
  return (
    <section id="music" className="scroll-mt-20 border-t border-hairline px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader eyebrow="Listen" title="Music" />
        </Reveal>
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal className="overflow-hidden rounded-xl ring-1 ring-hairline">
            <iframe
              title="SRD Masum on Spotify"
              src="https://open.spotify.com/embed/artist/267kT30bpgEoiGFawat8k6?utm_source=generator&theme=0"
              width="100%"
              height="352"
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              className="block w-full border-0"
            />
          </Reveal>
          <Reveal delay={0.08} className="overflow-hidden rounded-xl ring-1 ring-hairline">
            <iframe
              title="SRD Masum track on Spotify"
              src="https://open.spotify.com/embed/track/0wqbduMup8NkUnRVEERKqb?utm_source=generator&theme=0"
              width="100%"
              height="352"
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              className="block w-full border-0"
            />
          </Reveal>
        </div>
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

function Gallery() {
  return (
    <section id="gallery" className="scroll-mt-20 border-t border-hairline px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader eyebrow="Photos" title="Gallery" />
        </Reveal>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GALLERY_PHOTOS.map((src, i) => (
            <Reveal as="li" key={src} delay={(i % 3) * 0.08} className="overflow-hidden rounded-2xl ring-1 ring-hairline">
              <Tilt>
                <img
                  src={src}
                  alt={`SRD Masum photo ${i + 1}`}
                  loading="lazy"
                  className="beat-photo glow-hover aspect-[4/5] w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                />
              </Tilt>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

const PRESS_BIO =
  "SRD Masum is a singer and music maker sharing original songs and covers that are made to be played loud, late, and on repeat. Every new track lands on the channel first, with the Spotify catalogue following.";

const PRESS_SOCIALS = [
  { key: "instagram", label: "Instagram", Icon: InstagramLogo },
  { key: "facebook", label: "Facebook", Icon: FacebookLogo },
  { key: "youtube", label: "YouTube", Icon: YoutubeLogo },
  { key: "whatsapp", label: "WhatsApp", Icon: WhatsappLogo },
].filter(({ key }) => SOCIAL_LINKS[key] && SOCIAL_LINKS[key] !== "#");

function buildPressKitText() {
  const lines = [
    "SRD Masum - Press Kit",
    "",
    "Artist name: SRD Masum",
    "",
    "Bio",
    PRESS_BIO,
    "",
    `Contact: ${CONTACT_EMAIL}`,
    "",
    "Socials",
    ...PRESS_SOCIALS.map(({ key, label }) => `${label}: ${SOCIAL_LINKS[key]}`),
    "",
    `Spotify: ${SPOTIFY_ARTIST_URL}`,
    "",
  ];
  return lines.join("\n");
}

function PressKit() {
  const reduce = useReducedMotion();

  const download = () => {
    const blob = new Blob([buildPressKitText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "srd-masum-press-kit.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section id="press-kit" className="scroll-mt-20 border-t border-hairline px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader eyebrow="For press" title="Press Kit" />
        </Reveal>
        <Reveal delay={0.08} className="beat-glow flex flex-col gap-8 rounded-2xl bg-raised p-6 ring-1 ring-hairline sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
            <div className="flex flex-col gap-5">
              <p className="font-display text-2xl tracking-display sm:text-3xl">SRD Masum</p>
              <p className="max-w-2xl text-muted">{PRESS_BIO}</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-3 break-all text-base font-medium text-ink underline decoration-accent decoration-2 underline-offset-8 transition-colors hover:text-accent"
              >
                <EnvelopeSimple size={20} aria-hidden="true" className="shrink-0 text-accent" />
                {CONTACT_EMAIL}
              </a>
              <ul className="flex flex-wrap items-center gap-2">
                {PRESS_SOCIALS.map(({ key, label, Icon }) => (
                  <li key={key}>
                    <a
                      href={SOCIAL_LINKS[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${label} (opens in a new tab)`}
                      className="glow-hover beat-pop inline-flex h-10 w-10 items-center justify-center rounded-full bg-sunk text-ink ring-1 ring-hairline transition-colors hover:text-accent focus-visible:text-accent"
                    >
                      <Icon size={18} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <motion.button
                type="button"
                onClick={download}
                whileTap={reduce ? undefined : { scale: 0.97 }}
                transition={spring}
                className="glow-hover beat-pop inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-transform duration-200 hover:scale-[1.03]"
              >
                <DownloadSimple size={18} aria-hidden="true" />
                Download press kit
              </motion.button>
              <motion.a
                href={SPOTIFY_ARTIST_URL}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={reduce ? undefined : { scale: 0.97 }}
                transition={spring}
                className="glow-hover beat-pop inline-flex items-center justify-center gap-2 rounded-full bg-[#1DB954] px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-[#1ed760]"
              >
                <SpotifyLogo size={18} weight="fill" aria-hidden="true" />
                Spotify
                <ArrowUpRight size={16} aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </motion.a>
            </div>
          </div>

          <ul className="grid grid-cols-3 gap-3 sm:gap-4">
            {GALLERY_PHOTOS.map((src, i) => (
              <li key={src} className="overflow-hidden rounded-xl ring-1 ring-hairline">
                <img
                  src={src}
                  alt={`SRD Masum press photo ${i + 1}`}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover"
                />
              </li>
            ))}
          </ul>
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
      <div className="mx-auto max-w-6xl">
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
      <div className="mx-auto max-w-6xl">
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

const VISITOR_KEY = "srd-visitors";
const VISITOR_SESSION_KEY = "srd-visitor-counted";
const VISITOR_BASE = 20000;

// Stored value is only the number of counted visits; the displayed count is VISITOR_BASE + stored.
function readVisitors() {
  try {
    return Number(localStorage.getItem(VISITOR_KEY)) || 0;
  } catch {
    return 0;
  }
}

function VisitorCounter() {
  const [stored, setStored] = useState(readVisitors);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(VISITOR_SESSION_KEY)) return;
      sessionStorage.setItem(VISITOR_SESSION_KEY, "1");
      const next = readVisitors() + 1;
      localStorage.setItem(VISITOR_KEY, String(next));
      setStored(next);
    } catch {
      /* storage unavailable: show the stored count without counting */
    }
  }, []);

  return (
    <p className="mt-6 text-center font-mono text-xs text-faint sm:mt-8">
      visitors: <span className="tabular-nums">{(VISITOR_BASE + stored).toLocaleString("en-US")}</span>
    </p>
  );
}

function Footer() {
  return (
    <footer className="border-t border-hairline bg-sunk px-5 pb-10 pt-12 sm:px-8 sm:pt-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
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

export default function App() {
  return (
    <PlayerProvider>
    <div className="min-h-screen pb-24">
      <IntroLoader />
      <BeatField />
      <CursorGlow />
      <Nav />
      <main>
        <Hero />
        <AudioSongs />
        <BanglaSongs />
        <Featured />
        <Videos />
        <Music />
        <NewRelease />
        <Songs />
        <Gallery />
        <PressKit />
        <Reviews />
        <FanMessage />
        <Contact />
      </main>
      <Footer />
      <MiniPlayer />
    </div>
    </PlayerProvider>
  );
}
