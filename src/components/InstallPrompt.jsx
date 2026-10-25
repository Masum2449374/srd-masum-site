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
    <div className="fixed bottom-24 left-4 z-40 flex items-center gap-1 rounded-full bg-sunk py-1 pl-3 pr-1 text-xs text-ink shadow-lg ring-1 ring-hairline">
      <button type="button" className="flex items-center gap-1.5 font-medium hover:text-accent"
        onClick={async () => { evt.prompt(); try { await evt.userChoice; } catch {} setEvt(null); }}>
        <DownloadSimple size={14} weight="bold" /> অ্যাপ ইনস্টল · Install app
      </button>
      <button type="button" aria-label="Dismiss" onClick={dismiss} className="flex h-6 w-6 items-center justify-center rounded-full text-muted hover:text-ink">
        <X size={12} />
      </button>
    </div>
  );
}
