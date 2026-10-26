import { useEffect, useRef, useState } from "react";
import { register, claim, spotifyApi } from "../lib/exclusive.js";

// Lazy Spotify embed through the Spotify iFrame API: a same-size placeholder until it is near the viewport
// (or tapped), then a controller is created. Starting it pauses every other player on the site.
export default function SpotifyEmbed({ kind = "track", id, height = 152, title }) {
  const wrap = useRef(null);
  const slot = useRef(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (near || !wrap.current) return;
    if (!("IntersectionObserver" in window)) { setNear(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: "200px 0px" });
    io.observe(wrap.current);
    return () => io.disconnect();
  }, [near]);
  useEffect(() => {
    if (!near) return;
    let unreg = () => {}, ctl, dead = false;
    const key = `spotify:${kind}:${id}`;
    spotifyApi().then((api) => {
      if (dead || !slot.current) return;
      api.createController(slot.current, { uri: `spotify:${kind}:${id}`, width: "100%", height }, (c) => {
        if (dead) { c.destroy?.(); return; }
        ctl = c;
        setReady(true);
        let wasPaused = true;
        unreg = register(key, () => { if (!wasPaused) c.pause(); });
        c.addListener("playback_update", (e) => {
          const paused = !!e.data?.isPaused;
          if (!paused && wasPaused) claim(key);
          wasPaused = paused;
        });
        if (window.__srdSpotify) window.__srdSpotify[key] = c; else window.__srdSpotify = { [key]: c };
      });
    });
    return () => { dead = true; unreg(); ctl?.destroy?.(); };
  }, [near, kind, id, height]);
  return (
    <div ref={wrap} className="relative overflow-hidden rounded-xl bg-sunk ring-1 ring-hairline" style={{ height }} title={title}>
      {near && <div ref={slot} />}
      {!ready && (
        <button type="button" onClick={() => setNear(true)} aria-label={`Load ${title}`} className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#1DB954]" /> Spotify…
        </button>
      )}
    </div>
  );
}
