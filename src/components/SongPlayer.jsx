import Embed from "./Embed.jsx";
import { Disc } from "@phosphor-icons/react";

// A single YouTube video in a uniform 16:9 card.
export function VideoCard({ id, title }) {
  return (
    <div className="flex flex-col gap-2">
      <Embed id={id} title={title} />
      <p className="truncate px-1 text-sm font-medium text-ink">{title}</p>
    </div>
  );
}

export { Disc };
