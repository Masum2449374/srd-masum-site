import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from "framer-motion";
import CursorGlow from "./components/CursorGlow.jsx";
import { fireConfetti } from "./lib/confetti.js";
import { ArrowUpRight, EnvelopeSimple, Copy, Check, Disc, InstagramLogo, FacebookLogo, YoutubeLogo, WhatsappLogo, SpotifyLogo } from "@phosphor-icons/react";
import Nav from "./components/Nav.jsx";
import Reveal, { spring } from "./components/Reveal.jsx";
import Embed from "./components/Embed.jsx";
import { AudioTrack, VideoCard } from "./components/SongPlayer.jsx";
import { VIDEO_IDS, FEATURED_VIDEO_ID, CHANNEL_URL, CONTACT_EMAIL, SOCIAL_LINKS, SPOTIFY_ARTIST_URL } from "./data/videos.js";

const YEAR = new Date().getFullYear();

// Placeholder target: change this one constant to set the next release date (ISO, local time).
const RELEASE_DATE = "2026-12-01T00:00:00";
const RELEASE_NAME = "Next single";

function IntroLoader() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(() => !sessionStorage.getItem("srd-intro-seen"));

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      sessionStorage.setItem("srd-intro-seen", "1");
      setShow(false);
    }, reduce ? 400 : 1400);
    return () => clearTimeout(t);
  }, [show, reduce]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          role="status"
          aria-label="Loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.2 : 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-canvas"
        >
          <motion.img
            src="/images/avatar.jpg"
            alt="SRD Masum logo"
            width="96"
            height="96"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={reduce ? { opacity: 1 } : { opacity: [0.4, 1, 0.4], scale: [0.96, 1, 0.96] }}
            transition={reduce ? { duration: 0.2 } : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="h-24 w-24 rounded-full object-cover ring-1 ring-accent"
          />
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
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
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
        <li key={u.label} className="glow-hover flex flex-col items-center rounded-2xl bg-raised px-2 py-5 ring-1 ring-hairline sm:py-7">
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
          <form onSubmit={submit} noValidate className="flex max-w-2xl flex-col gap-5 rounded-2xl bg-raised p-6 ring-1 ring-hairline sm:p-10">
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
    <div className="mb-8 sm:mb-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl tracking-display sm:text-5xl">{title}</h2>
    </div>
  );
}

function Hero() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  // Background drifts down slower than the page scrolls (gentle parallax). Image is oversized so it never shows an edge.
  const parallaxY = useTransform(scrollY, [0, 900], [0, 120]);
  const words = "SRD Masum".split(" ");
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
      <div className="mx-auto flex min-h-[78svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8 sm:pb-24">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="font-mono text-xs uppercase tracking-[0.25em] text-muted"
        >
          Artist · Songs · Sound
        </motion.p>
        <h1 className="mt-4 font-display text-[clamp(3.5rem,13vw,10rem)] leading-[0.9] tracking-display">
          {words.map((w, i) => (
            <motion.span
              key={w}
              initial={reduce ? false : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.1 + i * 0.08 }}
              className="mr-[0.25em] inline-block last:mr-0"
            >
              {w}
            </motion.span>
          ))}
        </h1>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.35 }}
          className="mt-6 max-w-xl text-lg text-muted sm:text-xl"
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
            className="glow-hover inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
          >
            Listen now
          </a>
          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="glow-hover inline-flex items-center gap-2 rounded-full border border-hairline bg-raised px-6 py-3 text-sm font-medium text-ink transition-colors duration-200 hover:bg-sunk"
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
          <Embed id={FEATURED_VIDEO_ID} title="SRD Masum featured video" />
        </Reveal>
      </div>
    </section>
  );
}

const SONGS = [
  { id: "1jjDs69WWUQ", title: "Laal Dupatta", film: "Mujhse Shaadi Karogi (2004)" },
  { id: "W2mjfazc9eM", title: "Dupatta Tera Nau Rang Da", film: "Partner (2007)" },
  { id: "jSkBtDg-8lg", title: "Sajan Tumse Pyar Ki Ladai Mein", film: "Maine Pyar Kyun Kiya (2005)" },
];

const AUDIO_TRACKS = [
  { id: "laal-cover", title: "Laal Dupatta (Cover)", sub: "SRD Masum · own recording", src: "/audio/laal-dupatta-cover.mp3" },
];

function Songs() {
  const [activeTrack, setActiveTrack] = useState(null);
  return (
    <section id="songs" className="scroll-mt-20 border-t border-hairline px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader eyebrow="Bollywood" title="Songs" />
        </Reveal>

        <div className="flex flex-col gap-3">
          {AUDIO_TRACKS.map((t) => (
            <Reveal key={t.id}>
              <AudioTrack track={t} active={activeTrack === t.id} setActive={setActiveTrack} />
            </Reveal>
          ))}
        </div>

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
            className="glow-hover inline-flex items-center gap-2 rounded-full bg-[#1DB954] px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-[#1ed760]"
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
              <img
                src={src}
                alt={`SRD Masum photo ${i + 1}`}
                loading="lazy"
                className="glow-hover aspect-[4/5] w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
              />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Videos() {
  const reduce = useReducedMotion();
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
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VIDEO_IDS.map((id, i) => (
            <motion.li
              key={id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ ...spring, delay: (i % 3) * 0.08 }}
            >
              <Embed id={id} title={`SRD Masum video ${i + 1}`} />
            </motion.li>
          ))}
        </ul>
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
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Get in touch</p>
            <h2 className="mt-3 font-display text-3xl tracking-display sm:text-5xl">Contact</h2>
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
            className="glow-hover inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-sunk px-5 py-3 text-sm font-medium text-ink ring-1 ring-hairline transition-colors hover:bg-canvas sm:self-center"
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

function Footer() {
  return (
    <footer className="border-t border-hairline bg-sunk px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <Disc size={18} aria-hidden="true" className="text-accent" />
          © {YEAR} SRD Masum. All rights reserved.
        </p>
        <div className="flex items-center gap-2">
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
              className="glow-hover inline-flex h-10 w-10 items-center justify-center rounded-full bg-raised text-ink ring-1 ring-hairline transition-colors hover:text-accent focus-visible:text-accent"
            >
              <Icon size={18} aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <IntroLoader />
      <CursorGlow />
      <Nav />
      <main>
        <Hero />
        <Featured />
        <Music />
        <NewRelease />
        <Songs />
        <Gallery />
        <Videos />
        <FanMessage />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
