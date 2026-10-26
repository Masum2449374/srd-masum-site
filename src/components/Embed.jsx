import { useEffect, useRef, useState } from "react";
import { register, claim } from "../lib/exclusive.js";

// Lazy YouTube: thumbnail + play button; the iframe (and YouTube's scripts) load only on tap.
// Uses the JS API over postMessage so it pauses when anything else starts, and pauses others when it plays.
export default function Embed({ id, playlist, title }) {
  const [on, setOn] = useState(false);
  const frame = useRef(null);
  const key = `youtube:${playlist || id}`;
  const src = playlist
    ? `https://www.youtube-nocookie.com/embed/videoseries?list=${playlist}&autoplay=1&enablejsapi=1`
    : `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&enablejsapi=1`;
  useEffect(() => {
    if (!on) return;
    const cmd = (func) => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");
    const unreg = register(key, () => cmd("pauseVideo"));
    const onMsg = (e) => {
      if (e.source !== frame.current?.contentWindow) return;
      let d; try { d = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch { return; }
      const st = d?.info?.playerState ?? (d?.event === "onStateChange" ? d.info : undefined);
      if (st === 1) claim(key);
    };
    window.addEventListener("message", onMsg);
    return () => { unreg(); window.removeEventListener("message", onMsg); };
  }, [on, key]);
  const onLoad = () => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: key }), "*");
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-sunk ring-1 ring-hairline">
      {on ? (
        <iframe
          ref={frame}
          onLoad={onLoad}
          className="absolute inset-0 h-full w-full"
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => { claim(key); setOn(true); }} aria-label={`Play ${title}`} className="group absolute inset-0 h-full w-full">
          {id && <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />}
          <span className="absolute inset-0 bg-black/20 transition group-hover:bg-black/10" />
          <svg viewBox="0 0 68 48" width="68" height="48" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg" aria-hidden="true">
            <path d="M66.5 7.7a8.5 8.5 0 0 0-6-6C55.2 0 34 0 34 0S12.8 0 7.5 1.7a8.5 8.5 0 0 0-6 6C0 13 0 24 0 24s0 11 1.5 16.3a8.5 8.5 0 0 0 6 6C12.8 48 34 48 34 48s21.2 0 26.5-1.7a8.5 8.5 0 0 0 6-6C68 35 68 24 68 24s0-11-1.5-16.3z" fill="#f00" />
            <path d="M45 24 27 14v20z" fill="#fff" />
          </svg>
        </button>
      )}
    </div>
  );
}
