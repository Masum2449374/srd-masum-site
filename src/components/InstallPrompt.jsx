import { useEffect, useState } from "react";
import { DownloadSimple, X } from "@phosphor-icons/react";

// Subtle "install app" chip. Appears only when the browser offers installation
// (Chrome/Edge/Android), and stays hidden for 30 days once dismissed.
const KEY = "srd-install-dismissed";
export default function InstallPrompt() {
  const [evt, setEvt] = useState(null);
  useEffect(() => {
    let dismissed = 0;
    try { dismissed = Number(localStorage.getItem(KEY)) || 0; } catch {}
    if (Date.now() - dismissed < 30 * 864e5) return;
    const onPrompt = (e) => { e.preventDefault(); setEvt(e); };
    const onInstalled = () => setEvt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  if (!evt) return null;
  const dismiss = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch {} setEvt(null); };
  return (
    <div className="fixed bottom-24 left-3 z-40 flex items-center rounded-full bg-sunk/90 py-0.5 pl-2 pr-0.5 text-[10px] backdrop-blur text-ink shadow-lg ring-1 ring-hairline">
      <button type="button" aria-label="Install app" className="flex items-center gap-1 font-semibold hover:text-accent"
        onClick={async () => { evt.prompt(); try { await evt.userChoice; } catch {} setEvt(null); }}>
        <DownloadSimple size={11} weight="bold" /> Install
      </button>
      <button type="button" aria-label="Dismiss" onClick={dismiss} className="flex h-5 w-5 items-center justify-center rounded-full text-muted hover:text-ink">
        <X size={10} />
      </button>
    </div>
  );
}
