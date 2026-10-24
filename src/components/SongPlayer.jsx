import { useEffect, useRef, useState } from "react";
import { Play, Pause, Disc } from "@phosphor-icons/react";

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// One audio track: custom row, circular play button, custom seek bar.
// Uses a native HTML5 <audio> element underneath; only one track plays at a time.
export function AudioTrack({ track, active, setActive }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = ref.current;
    if (!active && a && !a.paused) a.pause();
  }, [active]);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) {
      setActive(track.id);
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  };

  const onSeek = (e) => {
    const a = ref.current;
    const value = Number(e.target.value);
    if (a) a.currentTime = value;
    setCurrent(value);
  };

  const pct = duration ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-raised p-4 ring-1 ring-hairline sm:p-5">
      <div className="flex items-center gap-4">
        <div
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent via-[#7a2e6b] to-accent-deep shadow-lg shadow-accent/10"
        >
          <Disc size={26} weight="duotone" className="text-ink/80" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-base font-semibold text-ink">{track.title}</p>
          <p className="truncate font-mono text-xs uppercase tracking-wider text-muted">{track.sub}</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-canvas shadow-lg shadow-accent/25 transition hover:scale-105 active:scale-95"
        >
          {playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" className="translate-x-[1px]" />}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="w-10 shrink-0 font-mono text-[11px] tabular-nums text-muted">{formatTime(current)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={onSeek}
          aria-label={`Seek ${track.title}`}
          className="seek w-full"
          style={{
            background: `linear-gradient(to right, #ff64c8 ${pct}%, #2c2a27 ${pct}%)`,
          }}
        />
        <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted">
          {formatTime(duration)}
        </span>
      </div>

      <audio
        ref={ref}
        src={track.src}
        preload="metadata"
        onPlay={() => {
          setPlaying(true);
          setActive(track.id);
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => {
          if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration);
        }}
        className="hidden"
      />
    </div>
  );
}

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
