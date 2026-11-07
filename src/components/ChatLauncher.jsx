import { lazy, Suspense, useState } from "react";
import { ChatCircleDots } from "@phosphor-icons/react";
const ChatPanel = lazy(() => import("./ChatPanel.jsx"));
export default function ChatLauncher() {
  const [open, setOpen] = useState(false),
    [loaded, setLoaded] = useState(false);
  return (
    <>
      <div className="srd-chat-launcher fixed right-4 z-40">
        <button
          type="button"
          onClick={() => {
            setLoaded(true);
            setOpen((v) => !v);
          }}
          aria-label={open ? "Close Mira" : "Ask Mira, your music assistant"}
          aria-expanded={open}
          aria-controls="srd-chat"
          data-testid="chat-launcher"
          className="chat-fab flex h-11 items-center gap-2 rounded-full px-4 text-xs font-semibold"
        >
          <ChatCircleDots size={21} weight="duotone" />
          <span>Ask Mira</span>
        </button>
      </div>
      {loaded && (
        <Suspense fallback={null}>
          <ChatPanel open={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
