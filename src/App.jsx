import { COMMUNITY_ROW_ENABLED } from "./lib/flags.js";
import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  EnvelopeSimple,
  Copy,
  Check,
  Disc,
  InstagramLogo,
  WhatsappLogo,
  TelegramLogo,
} from "@phosphor-icons/react";
import Nav from "./components/Nav.jsx";
import Reveal, { spring } from "./components/Reveal.jsx";
import CommunityRow from "./components/CommunityRow.jsx";
import Reviews from "./components/Reviews.jsx";
import SecretBurst from "./components/SecretBurst.jsx";
import { PlayerProvider } from "./components/MiniPlayer.jsx";
import { CONTACT_EMAIL, SOCIAL_LINKS } from "./data/videos.js";
import ChatLauncher from "./components/ChatLauncher.jsx";
import InstallPrompt from "./components/InstallPrompt.jsx";
import EnglishPage from "./components/EnglishPage.jsx";
import PremiumHome from "./components/PremiumHome.jsx";
import SongDetail from "./components/SongDetail.jsx";
import RouteBoundary from "./components/RouteBoundary.jsx";
import { usePath, installInternalNavigation } from "./lib/nav.js";
import { ENGLISH_ALL } from "./data/english-songs.js";
const CopyrightPage = lazy(() => import("./components/CopyrightPage.jsx"));
const ProfilePage = lazy(() => import("./components/ProfilePage.jsx"));
const AccountPage = lazy(() => import("./components/AccountPage.jsx"));
const ArtistPage = lazy(() => import("./components/ArtistPage.jsx"));
const AdminUploads = lazy(() => import("./components/AdminUploads.jsx"));
const YEAR = new Date().getFullYear();

function NotifyForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | busy | ok | already | bad | err
  const submit = async (e) => {
    e.preventDefault();
    const v = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) || v.length > 120) {
      setState("bad");
      return;
    }
    setState("busy");
    try {
      const r = await fetch("/api/notify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: v }),
      });
      const d = await r.json().catch(() => ({}));
      setState(
        r.ok
          ? d.already
            ? "already"
            : "ok"
          : r.status === 400
            ? "bad"
            : "err",
      );
      if (r.ok) setEmail("");
    } catch {
      setState("err");
    }
  };
  const msg = {
    ok: "Thanks! You're on the list.",
    already: "You're already on the list.",
    bad: "Please enter a valid email.",
    err: "Something went wrong. Please try again later.",
  }[state];
  return (
    <form onSubmit={submit} className="mt-8 max-w-xl" noValidate>
      <label
        htmlFor="notify-email"
        className="mb-2 block text-sm font-medium text-ink"
      >
        Get notified about new releases
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="notify-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={120}
          aria-invalid={state === "bad"}
          aria-describedby="notify-status"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state !== "busy") setState("idle");
          }}
          placeholder="you@example.com"
          className="min-h-[48px] flex-1 rounded-full bg-raised px-5 text-ink ring-1 ring-hairline placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={state === "busy"}
          className="min-h-[48px] rounded-full bg-accent px-6 font-medium text-white transition active:scale-[0.97] disabled:opacity-60"
        >
          {state === "busy" ? "Joining…" : "Notify me"}
        </button>
      </div>
      <p
        className="mt-2 min-h-[1.25rem] text-sm text-muted"
        id="notify-status"
        role="status"
        aria-live="polite"
      >
        {msg || "Email only. No spam."}
      </p>
    </form>
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
    <section
      id="contact"
      className="scroll-mt-20 border-t border-hairline px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="mx-auto max-w-6xl lg:max-w-[1240px]">
        <Reveal className="pro-card flex flex-col gap-8 rounded-2xl bg-raised p-6 ring-1 ring-hairline sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <p className="eyebrow">Get in touch</p>
            <h2 className="mt-4 font-display text-3xl leading-[1.05] tracking-display sm:text-5xl">
              Contact
            </h2>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-5 inline-flex items-center gap-3 break-all text-lg font-medium text-ink underline decoration-accent decoration-2 underline-offset-8 transition-colors hover:text-accent sm:text-xl"
            >
              <EnvelopeSimple
                size={22}
                aria-hidden="true"
                className="shrink-0 text-accent"
              />
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
                {copied ? (
                  <Check size={16} weight="bold" aria-hidden="true" />
                ) : (
                  <Copy size={16} aria-hidden="true" />
                )}
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
  const [shown, setShown] = useState(null);

  useEffect(() => {
    let day = new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10);
    let counted = false;
    try {
      counted = localStorage.getItem(VISITOR_DAY_KEY) === day;
    } catch {
      /* ignore */
    }
    fetch("/api/visits", {
      method: counted ? "GET" : "POST",
      cache: "no-store",
      credentials: "same-origin",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (typeof d.count !== "number") return;
        try {
          localStorage.setItem(VISITOR_DAY_KEY, day);
        } catch {
          /* ignore */
        }
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
    <p
      className="mt-6 text-center font-mono text-xs text-faint sm:mt-8"
      data-visitors={count ?? ""}
    >
      visitors:{" "}
      <span className="tabular-nums">
        {shown == null ? "—" : shown.toLocaleString("en-US")}
      </span>
    </p>
  );
}

function Footer() {
  return (
    <footer className="pro-footer border-t border-hairline bg-sunk px-5 pb-10 pt-12 sm:px-8 sm:pt-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:max-w-[1240px] text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-2 font-display text-xl tracking-display text-ink">
            <Disc size={20} aria-hidden="true" className="text-accent" />
            SRD Masum
          </p>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Music made to be played loud, late, and on repeat.
          </p>
          <p className="text-xs text-faint">
            © {YEAR} SRD Masum. All rights reserved.
          </p>
          <p className="text-xs">
            <a
              href="/copyright/"
              className="text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
            >
              Copyright &amp; DMCA Policy
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {[
            { key: "instagram", label: "Instagram", Icon: InstagramLogo },
            { key: "whatsapp", label: "WhatsApp", Icon: WhatsappLogo },
            { key: "telegram", label: "Telegram", Icon: TelegramLogo },
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

// Only route content changes. The one PlayerProvider/audio element is never keyed,
// hidden-and-remounted, or replaced when a listener follows an internal link.
function HomeContent() {
  return (
    <>
      <PremiumHome />
      {COMMUNITY_ROW_ENABLED && <CommunityRow />}
      <section id="new-release" className="studio-section release-signup">
        <div>
          <p className="studio-kicker">Never miss a release</p>
          <h2>Stay close to the music.</h2>
          <p className="studio-muted">
            New sounds from SRD Masum, straight to your inbox.
          </p>
        </div>
        <NotifyForm />
      </section>
      <Reviews />
      <Contact />
    </>
  );
}
function Router() {
  const path = usePath().split("?")[0];
  const [, kind, name] = path.split("/");
  let slug = "";
  try {
    slug = decodeURIComponent(name || "");
  } catch {}
  const page = kind === "u" ? "profile" : kind || "home";
  useEffect(() => installInternalNavigation(), []);
  useEffect(() => {
    if (page === "home") document.title = "SRD Masum | Official Music";
  }, [page]);
  let content;
  if (page === "english") content = <EnglishPage />;
  else if (page === "song") content = <SongDetail id={slug} />;
  else if (page === "artist") content = <ArtistPage slug={slug} />;
  else if (page === "profile") content = <ProfilePage username={slug} />;
  else if (page === "account") content = <AccountPage />;
  else if (page === "admin") content = <AdminUploads />;
  else if (page === "copyright") content = <CopyrightPage />;
  else content = <HomeContent />;
  return (
    <div className="studio-shell min-h-screen pb-24">
      <SecretBurst />
      <Nav page={page} />
      <main id="main-content" tabIndex={-1}>
        <RouteBoundary key={path}>
          <Suspense
            fallback={
              <div className="studio-route-loading" role="status">
                <span />
                <p>Finding your next sound…</p>
              </div>
            }
          >
            {content}
          </Suspense>
        </RouteBoundary>
      </main>
      <Footer />
      <InstallPrompt />
      {page !== "admin" && <ChatLauncher />}
    </div>
  );
}
export default function App() {
  return (
    <PlayerProvider>
      <Router />
    </PlayerProvider>
  );
}
