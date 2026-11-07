import { useEffect, useRef, useState } from "react";
import {
  ShareNetwork,
  Copy,
  Check,
  WhatsappLogo,
  TelegramLogo,
} from "@phosphor-icons/react";
import { songUrl } from "../lib/share.js";

// Small share icon on each track row. Phones with Web Share open the native sheet;
// otherwise a little menu offers copy link, WhatsApp and Telegram.
export default function ShareButton({ track, placement = "above" }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef(null);
  const url = songUrl(track);
  const text = `${track.title} — SRD Masum`;

  useEffect(() => {
    if (!open) return;
    box.current?.querySelector('[role="menuitem"]')?.focus();
    const close = (e) => {
      if (!box.current?.contains(e.target)) setOpen(false);
    };
    const esc = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        box.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const onShare = async () => {
    if (navigator.share && window.matchMedia?.("(hover: none)").matches) {
      try {
        await navigator.share({ title: text, text, url });
        return;
      } catch (e) {
        if (e?.name === "AbortError") return;
      }
    }
    setOpen((o) => !o);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const i = document.createElement("input");
      i.value = url;
      document.body.appendChild(i);
      i.select();
      try {
        document.execCommand("copy");
      } catch {}
      i.remove();
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1400);
  };

  const item =
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-raised";
  return (
    <div ref={box} className="studio-share relative shrink-0">
      <button
        type="button"
        onClick={onShare}
        aria-label={`Share ${track.title}`}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Share"
        className="studio-player-icon studio-share-trigger"
      >
        <ShareNetwork size={16} weight="bold" />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Share song"
          onKeyDown={(e) => {
            const items = [
              ...(box.current?.querySelectorAll('[role="menuitem"]') || []),
            ];
            const index = items.indexOf(document.activeElement);
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
              e.preventDefault();
              const next =
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? items.length - 1
                    : (index +
                        (e.key === "ArrowDown" ? 1 : -1) +
                        items.length) %
                      items.length;
              items[next]?.focus();
            }
          }}
          className={`studio-share-menu ${placement === "below" ? "is-below" : ""}`}
        >
          <button type="button" role="menuitem" onClick={copy} className={item}>
            {copied ? (
              <Check size={16} className="text-accent" />
            ) : (
              <Copy size={16} />
            )}
            {copied ? "Copied" : "Copy link"}
          </button>
          <a
            role="menuitem"
            className={item}
            target="_blank"
            rel="noopener noreferrer"
            href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
            onClick={() => setOpen(false)}
          >
            <WhatsappLogo size={16} /> WhatsApp
          </a>
          <a
            role="menuitem"
            className={item}
            target="_blank"
            rel="noopener noreferrer"
            href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`}
            onClick={() => setOpen(false)}
          >
            <TelegramLogo size={16} /> Telegram
          </a>
        </div>
      ) : null}
    </div>
  );
}
