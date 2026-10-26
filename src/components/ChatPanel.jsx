import { useEffect, useRef, useState } from "react";
import { X, PaperPlaneRight, Sparkle } from "@phosphor-icons/react";

const GREETING = "Hi! 👋 I'm the SRD Masum assistant. Ask me about the songs, artists, Spotify/YouTube links or the site — in English, বাংলা or हिन्दी.";
const CHIPS = ["Spotify link?", "Who sings Aashiqana?", "নতুন গান কোনটা?", "How do I contact SRD Masum?"];
const KEY = "srd-chat";

const linkify = (t) => t.split(/(https?:\/\/[^\s)]+)/g).map((p, i) =>
  /^https?:\/\//.test(p)
    ? <a key={i} href={p.replace(/[.,!?]+$/, "")} target="_blank" rel="noopener noreferrer" className="break-all text-accent underline underline-offset-2">{p}</a>
    : p);

export default function ChatPanel({ open, onClose }) {
  const [msgs, setMsgs] = useState(() => { try { return JSON.parse(sessionStorage.getItem(KEY)) || []; } catch { return []; } });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const list = useRef(null), input = useRef(null);

  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-20))); } catch {} }, [msgs]);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => {
    if (!open) return;
    setTimeout(() => input.current?.focus(), 50);
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);

  const send = async (q) => {
    q = (q ?? text).trim().slice(0, 500);
    if (!q || busy) return;
    const next = [...msgs, { role: "user", content: q }];
    setMsgs(next); setText(""); setBusy(true);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next.slice(-8) }) });
      const d = await r.json().catch(() => ({}));
      setMsgs((m) => [...m, { role: "assistant", content: d.reply || "Sorry, something went wrong. Please try again." }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Network error — please try again." }]);
    } finally { setBusy(false); }
  };

  if (!open) return null;
  return (
    <section id="srd-chat" role="dialog" aria-label="SRD Masum assistant" data-testid="chat-panel"
      className="chat-panel fixed inset-x-3 bottom-[9.5rem] z-50 flex max-h-[min(560px,calc(100svh-11rem))] flex-col overflow-hidden rounded-2xl bg-raised shadow-2xl ring-1 ring-hairline sm:left-auto sm:right-4 sm:w-[380px] lg:bottom-44 lg:right-6">
      <header className="flex items-center gap-3 border-b border-hairline px-4 py-3">
        <span className="relative shrink-0">
  <img src="/images/avatar.webp" alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-hairline" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <span className="chat-online absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-raised" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">SRD Masum assistant</p>
          <p className="flex items-center gap-1 text-[11px] text-muted"><Sparkle size={11} weight="fill" className="text-accent" aria-hidden="true" /><span className="font-medium text-emerald-500">Online</span> · AI · answers about the site & songs</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close chat" className="rounded-full p-2 text-muted hover:bg-sunk hover:text-ink"><X size={18} /></button>
      </header>
      <div ref={list} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3 text-[14px] leading-relaxed" aria-live="polite">
        <p className="max-w-[88%] rounded-2xl rounded-tl-md bg-sunk px-3 py-2 text-ink">{GREETING}</p>
        {!msgs.length && (
          <div className="flex flex-wrap gap-2 pt-1">
            {CHIPS.map((c) => (
              <button key={c} type="button" onClick={() => send(c)} className="rounded-full px-3 py-1.5 text-xs text-ink ring-1 ring-hairline transition hover:bg-sunk hover:ring-accent/60">{c}</button>
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
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 border-t border-hairline p-2.5">
        <label htmlFor="srd-chat-input" className="sr-only">Your message</label>
        <input id="srd-chat-input" ref={input} value={text} onChange={(e) => setText(e.target.value)} maxLength={500}
          placeholder="Ask anything about SRD Masum…" autoComplete="off"
          className="min-w-0 flex-1 rounded-full bg-sunk px-4 py-2.5 text-[16px] text-ink placeholder:text-faint outline-none ring-1 ring-transparent focus:ring-accent/60 sm:text-sm" />
        <button type="submit" disabled={busy || !text.trim()} aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent disabled:opacity-40"><PaperPlaneRight size={18} weight="fill" /></button>
      </form>
    </section>
  );
}
