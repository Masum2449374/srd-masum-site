import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowUpRight, EnvelopeSimple, Copy, Check, Disc } from "@phosphor-icons/react";
import Nav from "./components/Nav.jsx";
import Reveal, { spring } from "./components/Reveal.jsx";
import Embed from "./components/Embed.jsx";
import { VIDEO_IDS, FEATURED_VIDEO_ID, CHANNEL_URL, CONTACT_EMAIL } from "./data/videos.js";

const YEAR = new Date().getFullYear();

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
  const words = "SRD Masum".split(" ");
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <img
        src="/images/hero-portrait.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-top opacity-60"
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
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-canvas transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
          >
            Listen now
          </a>
          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-hairline bg-raised px-6 py-3 text-sm font-medium text-ink transition-colors duration-200 hover:bg-sunk"
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

const GALLERY_PHOTOS = [
  "/images/gallery/photo-1.jpg",
  "/images/gallery/photo-2.jpg",
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
                className="aspect-[4/5] w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
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
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-sunk px-5 py-3 text-sm font-medium text-ink ring-1 ring-hairline transition-colors hover:bg-canvas sm:self-center"
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
        <a
          href={CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-ink transition-colors hover:text-accent"
        >
          YouTube channel
          <ArrowUpRight size={14} aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Featured />
        <Music />
        <Gallery />
        <Videos />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
