import { lazy, Suspense, useState } from "react";
import { ChatCircleDots } from "@phosphor-icons/react";

// Floating "Ask SRD" button. The panel (and its code) only loads on first open.
const ChatPanel = lazy(() => import("./ChatPanel.jsx"));

export default function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const toggle = () => { setLoaded(true); setOpen((o) => !o); };
  return (
    <>
      <button type="button" onClick={toggle} aria-label={open ? "Close chat" : "Chat with SRD Masum assistant"}
        aria-expanded={open} aria-controls="srd-chat" data-testid="chat-launcher"
        className="chat-fab fixed bottom-24 right-4 z-40 flex h-12 items-center gap-2 rounded-full bg-accent pl-3.5 pr-4 text-sm font-semibold text-on-accent shadow-lg shadow-accent/30 ring-1 ring-white/10 transition-transform hover:scale-[1.04] active:scale-95 lg:bottom-28 lg:right-6">
        <ChatCircleDots size={22} weight="fill" aria-hidden="true" />
        <span className="hidden sm:inline">Ask SRD</span>
      </button>
      {loaded && (
        <Suspense fallback={null}>
          <ChatPanel open={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
