import { useState } from "react";
import Reveal from "./Reveal.jsx";
import { playNotePop } from "../lib/sounds.js";
import "./fanwall.css";

const KEY = "srd-fanwall";
const MSG_MAX = 40;
const NAME_MAX = 20;
const MAX_SHOWN = 40;
const COLORS = ["note-blue", "note-sky", "note-white", "note-navy", "note-ice"];

// A few seeded examples so the wall never looks empty. Visitors' own notes are added after these.
const SEED = [
  { id: "seed-1", name: "Nabil", message: "Laal Dupatta on repeat 🎧" },
  { id: "seed-2", name: "Sadia", message: "গানগুলো মন ভালো করে দেয়" },
  { id: "seed-3", name: "Tanvir", message: "Clean vocals, keep going!" },
  { id: "seed-4", name: "Mim", message: "Blue never looked this good 💙" },
  { id: "seed-5", name: "", message: "Waiting for the next single" },
];

const clip = (s, max) => Array.from(s).slice(0, max).join("");

function loadMine() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n) => n && typeof n.id === "string" && typeof n.message === "string");
  } catch {
    return [];
  }
}

function saveMine(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable: note stays on screen for this visit only */
  }
}

function hash(s) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function Note({ note }) {
  const h = hash(note.id);
  // Each note gets its own small, slow drift. Only transform is animated.
  const style = {
    "--tilt": `${(h % 7) - 3}deg`,
    "--dur": `${5 + (h % 30) / 10}s`,
    "--delay": `${-((h % 50) / 10)}s`,
    "--dx": `${(h % 9) - 4}px`,
  };
  return (
    <li className={`fan-note ${COLORS[h % COLORS.length]}`} style={style}>
      <p className="text-[15px] leading-snug font-medium">“{note.message}”</p>
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] opacity-80">— {note.name || "a fan"}</p>
    </li>
  );
}

export default function FanWall() {
  const [mine, setMine] = useState(loadMine);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) {
      setError("Write a short message first.");
      setSent(false);
      return;
    }
    const note = {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: clip(name.trim(), NAME_MAX),
      message: clip(text, MSG_MAX),
    };
    const next = [...mine, note];
    setMine(next);
    saveMine(next);
    playNotePop();
    setName("");
    setMessage("");
    setError("");
    setSent(true);
  };

  const all = [...SEED, ...mine].slice(-MAX_SHOWN);
  const inputClass =
    "mt-2 w-full rounded-xl border border-hairline bg-sunk px-4 py-3 text-ink placeholder:text-faint focus:border-accent focus:outline-none";

  return (
    <section id="fan-wall" className="scroll-mt-20 border-t border-hairline px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mb-8 border-b border-hairline pb-8 sm:mb-12 sm:pb-10">
            <p className="eyebrow">Fans</p>
            <h2 className="mt-4 font-display text-3xl leading-[1.05] tracking-display sm:text-5xl">Fan Wall</h2>
            <p className="mt-4 max-w-xl text-muted">Leave a short note. It floats up on the wall. Max 40 characters.</p>
          </div>
        </Reveal>

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((n) => (
            <Note key={n.id} note={n} />
          ))}
        </ul>

        <Reveal delay={0.08} className="mt-12 sm:mt-16">
          <form onSubmit={submit} noValidate className="flex max-w-2xl flex-col gap-5 rounded-2xl bg-raised p-6 ring-1 ring-hairline sm:p-10">
            <label className="flex flex-col text-sm font-medium text-muted">
              Name (optional)
              <input
                type="text"
                value={name}
                maxLength={NAME_MAX}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Jane"
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-muted">
              Your note
              <input
                type="text"
                value={message}
                maxLength={MSG_MAX}
                onChange={(e) => setMessage(clip(e.target.value, MSG_MAX))}
                aria-invalid={!!error}
                className={inputClass}
                placeholder="Say something short"
              />
              <span className="mt-1 self-end text-xs text-faint">{Array.from(message).length}/{MSG_MAX}</span>
              {error && <span className="mt-1 text-xs text-accent">{error}</span>}
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                className="glow-hover beat-pop inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
              >
                Stick my note
              </button>
              <p role="status" className="text-sm text-muted">{sent ? "Stuck on the wall! Only you see it saved on this device." : ""}</p>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
