import { lazy, Suspense, useEffect, useState } from "react";
import { ChatCircleDots, X } from "@phosphor-icons/react";

// Floating "Ask SRD" button. The panel (and its code) only loads on first open.
const ChatPanel = lazy(() => import("./ChatPanel.jsx"));

const LINES = ["Hi 💙 Looking for a song?", "Ask me about the lyrics ✨", "I'm Mira 💙 Ask me about any song 🎵", "Which song fits your mood today? 🎶"];
const KEY = "srd-chat-teaser-off";
const off = () => { try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; } };
// Soft two-note bell via Web Audio; only after a user gesture (autoplay policy).
let actx = null, gestured = false;
if (typeof window !== "undefined") {
  const mark = () => { gestured = true; };
  ["pointerdown", "keydown", "touchstart"].forEach((e) => window.addEventListener(e, mark, { once: true, passive: true }));
}
function chime() { return; // sound disabled by owner request
  if (!gestured || document.hidden) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
    const t0 = actx.currentTime;
    [[1046.5, 0], [1318.5, 0.14]].forEach(([f, d]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + d);
      g.gain.exponentialRampToValueAtTime(0.15, t0 + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.9);
      o.connect(g).connect(actx.destination); o.start(t0 + d); o.stop(t0 + d + 1);
    });
  } catch { /* ignore */ }
}
const setOff = () => { try { sessionStorage.setItem(KEY, "1"); } catch { /* ignore */ } };

export default function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [teaser, setTeaser] = useState(-1); // index of visible line, -1 = hidden
  const [muted, setMuted] = useState(off);

  useEffect(() => {
    if (muted || open) { setTeaser(-1); return; }
    let i = 0, hideT;
    const show = () => { setTeaser(i++ % LINES.length); chime(); clearTimeout(hideT); hideT = setTimeout(() => setTeaser(-1), 7000); };
    const first = setTimeout(show, 4000);
    const every = setInterval(show, 28000);
    return () => { clearTimeout(first); clearInterval(every); clearTimeout(hideT); };
  }, [muted, open]);

  const toggle = () => { setLoaded(true); setOpen((o) => !o); setOff(); setMuted(true); };
  const dismiss = () => { setOff(); setMuted(true); };

  return (
    <>
      <div className="srd-chat-launcher fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2 lg:bottom-28 lg:right-6">
        {teaser >= 0 && (
          <div role="status" data-testid="chat-teaser"
            className="chat-teaser relative flex max-w-[230px] items-center gap-1 rounded-2xl rounded-br-sm bg-raised py-2.5 pl-3.5 pr-1 text-[14px] font-medium sm:max-w-[260px] leading-snug text-ink shadow-xl shadow-accent/20 ring-1 ring-accent/25">
            <button type="button" onClick={toggle} className="text-left">{LINES[teaser]}</button>
            <button type="button" onClick={dismiss} aria-label="Hide message" className="shrink-0 rounded-full p-1 text-muted hover:bg-sunk hover:text-ink">
              <X size={10} weight="bold" aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="relative">
          {!open && (
            <span className="chat-hearts pointer-events-none absolute inset-0" aria-hidden="true">
              <i>💙</i><i>🩷</i><i>💙</i>
            </span>
          )}
          <button type="button" onClick={toggle} aria-label={open ? "Close chat" : "Ask Mira, SRD Masum assistant"}
            aria-expanded={open} aria-controls="srd-chat" data-testid="chat-launcher"
            className={`chat-fab ${open ? "" : "chat-fab-alive"} relative flex h-12 items-center gap-2 rounded-full bg-accent pl-3.5 pr-4 text-sm font-semibold text-on-accent shadow-lg shadow-accent/30 ring-1 ring-white/10 transition-transform hover:scale-[1.04] active:scale-95`}>
            <ChatCircleDots size={22} weight="fill" aria-hidden="true" />
            <span className="whitespace-nowrap text-[13px] sm:text-sm">Ask Mira</span>
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
