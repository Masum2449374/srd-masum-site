import { useState } from "react";

// Lazy YouTube: show the thumbnail + play button; the iframe (and YouTube's scripts) load only on tap.
export default function Embed({ id, playlist, title }) {
  const [on, setOn] = useState(false);
  const src = playlist
    ? `https://www.youtube-nocookie.com/embed/videoseries?list=${playlist}&autoplay=1`
    : `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1`;
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-sunk ring-1 ring-hairline">
      {on ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setOn(true)} aria-label={`Play ${title}`} className="group absolute inset-0 h-full w-full">
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
