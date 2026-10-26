import { useEffect, useRef, useState } from "react";

// Lazy Spotify embed: a same-size placeholder until it is near the viewport (or tapped), then the iframe mounts.
export default function SpotifyEmbed({ kind = "track", id, height = 152, title }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (on || !ref.current) return;
    if (!("IntersectionObserver" in window)) { setOn(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setOn(true); io.disconnect(); } }, { rootMargin: "200px 0px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [on]);
  return (
    <div ref={ref} className="overflow-hidden rounded-xl bg-sunk ring-1 ring-hairline" style={{ height }}>
      {on ? (
        <iframe
          title={title}
          src={`https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`}
          width="100%"
          height={height}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className="block w-full border-0"
        />
      ) : (
        <button type="button" onClick={() => setOn(true)} aria-label={`Load ${title}`} className="flex h-full w-full items-center justify-center gap-2 text-sm text-muted">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#1DB954]" /> Spotify…
        </button>
      )}
    </div>
  );
}
