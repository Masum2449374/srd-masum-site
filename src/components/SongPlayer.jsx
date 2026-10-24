import { Disc } from "@phosphor-icons/react";

// A single YouTube video in a uniform 16:9 card.
export function VideoCard({ id, title }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-sunk ring-1 ring-hairline">
        <iframe
          className="absolute inset-0 h-full w-full border-0"
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={title}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <p className="truncate px-1 text-sm font-medium text-ink">{title}</p>
    </div>
  );
}

export { Disc };
