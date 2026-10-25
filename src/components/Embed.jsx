export default function Embed({ id, playlist, title }) {
  const src = playlist
    ? `https://www.youtube-nocookie.com/embed/videoseries?list=${playlist}`
    : `https://www.youtube-nocookie.com/embed/${id}`;
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-sunk ring-1 ring-hairline">
      <iframe
        className="absolute inset-0 h-full w-full"
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
