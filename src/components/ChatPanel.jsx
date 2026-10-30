import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { callSupported, unlockAudio } from "./MiraCall.jsx";
const MiraCall = lazy(() => import("./MiraCall.jsx"));
import { X, PaperPlaneRight, Sparkle, Microphone, Phone } from "@phosphor-icons/react";

const OWNER_KEY = "srd-mira-owner";
export const getOwner = () => { try { return localStorage.getItem(OWNER_KEY) || undefined; } catch { return undefined; } };
export const setOwner = (t) => { try { t ? localStorage.setItem(OWNER_KEY, t) : localStorage.removeItem(OWNER_KEY); } catch {} };
const GREETING = "Hi, I'm Mira 💙 SRD Masum's assistant. Ask me about the songs, artists, Spotify/YouTube links or the site — in any language.";
const CHIPS = ["Spotify link?", "Who sings Aashiqana?", "What's the newest song?", "How do I contact SRD Masum?"];
const KEY = "srd-chat";

const linkify = (t) => t.split(/(https?:\/\/[^\s)]+)/g).map((p, i) =>
  /^https?:\/\//.test(p)
    ? <a key={i} href={p.replace(/[.,!?]+$/, "")} target="_blank" rel="noopener noreferrer" className="break-all text-accent underline underline-offset-2">{p}</a>
    : p);

export default function ChatPanel({ open, onClose }) {
  const [msgs, setMsgs] = useState(() => { try { return JSON.parse(sessionStorage.getItem(KEY)) || []; } catch { return []; } });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const list = useRef(null), input = useRef(null), cut = useRef(0);

  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-20))); } catch {} }, [msgs]);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => {
    if (!open) return;
    setTimeout(() => input.current?.focus(), 50);
    const k = (e) => e.key === "Escape" && !document.querySelector("[data-testid=mira-call]") && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);

  // Voice input (Web Speech API). Hidden where unsupported.
  const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const [lang, setLang] = useState(() => { try { return localStorage.getItem("srd-mic-lang") || "en-US"; } catch { return "en-US"; } });
  const [listening, setListening] = useState(false);
  const [toast, setToast] = useState("");
  const [call, setCall] = useState(false);
  const canCall = callSupported();
  const rec = useRef(null), finalTxt = useRef("");
  const flash = (t) => { setToast(t); setTimeout(() => setToast(""), 3500); };
  const toggleLang = () => setLang((l) => { const n = l === "bn-BD" ? "en-US" : "bn-BD"; try { localStorage.setItem("srd-mic-lang", n); } catch {} return n; });
  const mic = () => {
    if (listening) { rec.current?.stop(); return; }
    if (!SR || busy) return;
    const r = new SR(); rec.current = r; finalTxt.current = "";
    r.lang = lang; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
    r.onresult = (e) => {
      let fin = "", tmp = "";
      for (let i = 0; i < e.results.length; i++) (e.results[i].isFinal ? (fin += e.results[i][0].transcript) : (tmp += e.results[i][0].transcript));
      finalTxt.current = fin; setText((fin + tmp).slice(0, 500));
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") flash("Please allow microphone access 🎙️");
      else if (e.error === "no-speech") flash("Didn't catch that 🙈 Please try again");
      else if (e.error !== "aborted") flash("Voice isn't working here, please type 💙");
    };
    r.onend = () => { setListening(false); const f = finalTxt.current.trim(); if (f) send(f); };
    try { r.start(); setListening(true); } catch { flash("Couldn't start voice input"); }
  };
  useEffect(() => () => rec.current?.abort?.(), []);

  const send = async (q) => {
    q = (q ?? text).trim().slice(0, 500);
    if (!q || busy) return;
    const next = [...msgs, { role: "user", content: q }];
    setMsgs(next); setText(""); setBusy(true);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next.slice(cut.current).slice(-8), owner: getOwner() }) });
      const d = await r.json().catch(() => ({}));
      if (d.ownerToken) { setOwner(d.ownerToken); setMsgs((m) => m.map((x, i) => (i === m.length - 1 && x.role === "user" ? { ...x, content: "••••••" } : x))); }
      if (d.logout) { setOwner(null); cut.current = next.length; }
      setMsgs((m) => [...m, { role: "assistant", content: d.reply || "Sorry, something went wrong. Please try again." }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Network error — please try again." }]);
    } finally { setBusy(false); }
  };

  if (!open) return null;
  return (
    <section id="srd-chat" role="dialog" aria-label="Mira, SRD Masum assistant" data-testid="chat-panel"
      className="chat-panel fixed inset-x-3 bottom-[9.5rem] z-50 flex max-h-[min(560px,calc(100svh-11rem))] flex-col overflow-hidden rounded-2xl bg-raised shadow-2xl ring-1 ring-hairline sm:left-auto sm:right-4 sm:w-[380px] lg:bottom-44 lg:right-6">
      <header className="flex items-center gap-3 border-b border-hairline bg-gradient-to-r from-accent/15 via-raised to-fuchsia-500/10 px-3.5 py-2.5">
        <span className="relative shrink-0">
          <img src="/images/mira-v3-256.webp" alt="Mira" className="h-10 w-10 rounded-full object-cover ring-2 ring-accent/40" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <span className="chat-online absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-raised" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[15px] font-bold text-ink">Mira <span className="text-[11px] font-medium text-muted">SRD Assistant</span></p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-emerald-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />Online</p>
        </div>
        <button type="button" data-testid="mira-call-btn" onClick={() => (canCall ? (rec.current?.abort?.(), unlockAudio(), setCall(true)) : flash("Voice calls aren't supported in this browser 🙏 Try Chrome"))}
          title="Call Mira" aria-label="Voice call with Mira"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-md shadow-emerald-500/30 transition hover:scale-105 active:scale-95">
          <Phone size={17} weight="fill" />
        </button>
        <button type="button" onClick={onClose} aria-label="Close chat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sunk hover:text-ink"><X size={18} /></button>
      </header>
      <div ref={list} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3 text-[14px] leading-relaxed" aria-live="polite">
        <div className="flex items-end gap-2"><img src="/images/mira-v3-256.webp" alt="" aria-hidden="true" className="h-6 w-6 shrink-0 rounded-full object-cover" /><p className="max-w-[85%] rounded-2xl rounded-bl-md bg-gradient-to-br from-accent/15 to-fuchsia-500/10 px-3.5 py-2.5 text-ink ring-1 ring-accent/15">{GREETING}</p></div>
        {!msgs.length && (
          <div className="flex flex-wrap gap-2 pl-8 pt-1">
            {CHIPS.map((c) => (
              <button key={c} type="button" onClick={() => send(c)} className="rounded-full bg-sunk/70 px-3 py-1.5 text-xs font-medium text-ink ring-1 ring-accent/25 transition hover:-translate-y-0.5 hover:bg-accent/10 hover:ring-accent/60">{c}</button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <p key={i} className={m.role === "user"
            ? "ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-accent px-3 py-2 text-on-accent"
            : "max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-tl-md bg-sunk px-3 py-2 text-ink"}>
            {m.role === "user" ? m.content : linkify(m.content)}
          </p>
        ))}
        {busy && <p className="w-14 rounded-2xl rounded-tl-md bg-sunk px-3 py-2 text-muted" aria-label="Typing"><span className="chat-dots" /></p>}
      </div>
      {toast && <p role="alert" className="mx-3 mb-1 rounded-lg bg-rose-500/15 px-3 py-1.5 text-center text-xs text-ink">{toast}</p>}
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 border-t border-hairline p-2.5">
        <label htmlFor="srd-chat-input" className="sr-only">Your message</label>
        <input id="srd-chat-input" ref={input} value={text} onChange={(e) => setText(e.target.value)} maxLength={500}
          placeholder={listening ? "Listening… 🎙️" : "Ask Mira anything…"} autoComplete="off"
          className="min-w-0 flex-1 rounded-full bg-sunk px-4 py-2.5 text-[16px] text-ink placeholder:text-faint outline-none ring-1 ring-transparent focus:ring-accent/60 sm:text-sm" />
        {SR && (
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={toggleLang} aria-label="Voice language" title="Voice language"
              className="rounded-full px-1.5 py-1 text-[10px] font-bold text-muted ring-1 ring-hairline hover:text-ink">{lang === "bn-BD" ? "BN" : "EN"}</button>
            <button type="button" onClick={mic} aria-label={listening ? "Stop listening" : "Speak your message"} aria-pressed={listening} data-testid="chat-mic"
              className={`flex h-10 w-10 items-center justify-center rounded-full ${listening ? "chat-mic-on bg-rose-500 text-white" : "bg-sunk text-ink ring-1 ring-hairline hover:ring-accent/60"}`}>
              <Microphone size={18} weight={listening ? "fill" : "regular"} />
            </button>
          </div>
        )}
        <button type="submit" disabled={busy || !text.trim()} aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent disabled:opacity-40"><PaperPlaneRight size={18} weight="fill" /></button>
      </form>
      {call && createPortal(<Suspense fallback={null}><MiraCall lang={lang} onClose={() => setCall(false)} /></Suspense>, document.body)}
    </section>
  );
}
