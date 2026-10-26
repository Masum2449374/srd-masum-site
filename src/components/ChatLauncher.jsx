import { lazy, Suspense, useEffect, useState } from "react";
import { ChatCircleDots, X } from "@phosphor-icons/react";

// Floating "Ask SRD" button. The panel (and its code) only loads on first open.
const ChatPanel = lazy(() => import("./ChatPanel.jsx"));

const LINES = ["হ্যালো 💙 কোন গান খুঁজছো?", "গানের কথা জিজ্ঞেস করো ✨", "Ask me about any song 🎵", "আজ কোন গানে মন ভালো করবে? 🎶"];
const KEY = "srd-chat-teaser-off";
const off = () => { try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; } };
const setOff = () => { try { sessionStorage.setItem(KEY, "1"); } catch { /* ignore */ } };

export default function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [teaser, setTeaser] = useState(-1); // index of visible line, -1 = hidden
  const [muted, setMuted] = useState(off);

  useEffect(() => {
    if (muted || open) { setTeaser(-1); return; }
    let i = 0, hideT;
    const show = () => { setTeaser(i++ % LINES.length); clearTimeout(hideT); hideT = setTimeout(() => setTeaser(-1), 7000); };
    const first = setTimeout(show, 4000);
    const every = setInterval(show, 28000);
    return () => { clearTimeout(first); clearInterval(every); clearTimeout(hideT); };
  }, [muted, open]);

  const toggle = () => { setLoaded(true); setOpen((o) => !o); setOff(); setMuted(true); };
  const dismiss = () => { setOff(); setMuted(true); };

  return (
    <>
      <div className="fixed bottom-24 right-4 z-40 flex items-center gap-2 lg:bottom-28 lg:right-6">
        {teaser >= 0 && (
          <div role="status" data-testid="chat-teaser"
            className="chat-teaser relative flex max-w-[210px] items-center gap-1 rounded-2xl rounded-br-md bg-raised py-2 pl-3 pr-1 text-[13px] leading-snug text-ink shadow-xl shadow-accent/20 ring-1 ring-accent/25">
            <button type="button" onClick={toggle} className="text-left">{LINES[teaser]}</button>
            <button type="button" onClick={dismiss} aria-label="Hide message" className="shrink-0 rounded-full p-1 text-muted hover:bg-sunk hover:text-ink">
              <X size={12} weight="bold" aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="relative">
          {!open && (
            <span className="chat-hearts pointer-events-none absolute inset-0" aria-hidden="true">
              <i>💙</i><i>🩷</i><i>💙</i>
            </span>
          )}
          <button type="button" onClick={toggle} aria-label={open ? "Close chat" : "Chat with SRD Masum assistant"}
            aria-expanded={open} aria-controls="srd-chat" data-testid="chat-launcher"
            className={`chat-fab ${open ? "" : "chat-fab-alive"} relative flex h-12 items-center gap-2 rounded-full bg-accent pl-3.5 pr-4 text-sm font-semibold text-on-accent shadow-lg shadow-accent/30 ring-1 ring-white/10 transition-transform hover:scale-[1.04] active:scale-95`}>
            <ChatCircleDots size={22} weight="fill" aria-hidden="true" />
            <span className="hidden sm:inline">Ask SRD</span>
            <span className="chat-online absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" aria-hidden="true" />
          </button>
        </div>
      </div>
      {loaded && (
        <Suspense fallback={null}>
          <ChatPanel open={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
