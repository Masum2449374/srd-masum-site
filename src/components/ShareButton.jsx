import { useEffect, useRef, useState } from "react";
import { ShareNetwork, Copy, Check, WhatsappLogo, FacebookLogo } from "@phosphor-icons/react";
import { songUrl } from "../lib/share.js";

// Small share icon on each track row. Phones with Web Share open the native sheet;
// otherwise a little menu offers copy link, WhatsApp and Facebook.
export default function ShareButton({ track }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef(null);
  const url = songUrl(track);
  const text = `${track.title} — SRD Masum`;

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  const onShare = async () => {
    if (navigator.share && window.matchMedia?.("(hover: none)").matches) {
      try { await navigator.share({ title: text, text, url }); return; } catch (e) { if (e?.name === "AbortError") return; }
    }
    setOpen((o) => !o);
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); }
    catch {
      const i = document.createElement("input"); i.value = url; document.body.appendChild(i); i.select();
      try { document.execCommand("copy"); } catch {} i.remove();
    }
    setCopied(true);
    setTimeout(() => { setCopied(false); setOpen(false); }, 1400);
  };

  const item = "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-raised";
  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        onClick={onShare}
        aria-label={`Share ${track.title}`}
        aria-expanded={open}
        title="Share"
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:text-accent active:scale-95"
      >
        <ShareNetwork size={16} weight="bold" />
      </button>
      {open ? (
        <div role="menu" className="absolute bottom-full right-0 z-40 mb-2 w-48 rounded-xl bg-sunk p-1 shadow-xl ring-1 ring-hairline">
          <button type="button" role="menuitem" onClick={copy} className={item}>
            {copied ? <Check size={16} className="text-accent" /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy link"}
          </button>
          <a role="menuitem" className={item} target="_blank" rel="noopener noreferrer"
             href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} onClick={() => setOpen(false)}>
            <WhatsappLogo size={16} /> WhatsApp
          </a>
          <a role="menuitem" className={item} target="_blank" rel="noopener noreferrer"
             href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} onClick={() => setOpen(false)}>
            <FacebookLogo size={16} /> Facebook
          </a>
        </div>
      ) : null}
    </div>
  );
}
