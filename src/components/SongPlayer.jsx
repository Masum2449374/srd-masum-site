import { useEffect, useRef, useState } from "react";
import { useDecorReduce } from "../lib/motion.js";
import { Play, Pause, Disc } from "@phosphor-icons/react";
import { beatPlay, beatStop } from "../lib/beat.js";

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Animated bars shown beside the title while the track plays. Pure CSS; static under reduced motion.
const EQ_BARS = [
  { delay: "0s", dur: "0.9s" },
  { delay: "0.2s", dur: "0.7s" },
  { delay: "0.4s", dur: "1.1s" },
  { delay: "0.1s", dur: "0.8s" },
];
function Equalizer({ playing }) {
  return (
    <span
      aria-hidden="true"
      className={`eq inline-flex h-3.5 shrink-0 items-end gap-[3px] ${playing ? "" : "opacity-40"}`}
    >
      {EQ_BARS.map((b, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-sm bg-accent ${playing ? "eq-bar" : ""}`}
          style={{
            height: "100%",
            animationDelay: b.delay,
            animationDuration: b.dur,
            transform: playing ? undefined : "scaleY(0.3)",
          }}
        />
      ))}
    </span>
  );
}

const NOTE_GLYPHS = ["🎵", "🎶", "♪"];

// Music notes float up out of the player while the track plays. Spawns a note every ~900ms and removes it
// once its animation ends. Nothing renders under reduced motion or while paused.
function MusicNotes({ playing }) {
  const reduce = useDecorReduce();
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (!playing || reduce) {
      setNotes([]);
      return;
    }
    let n = 0;
    const removals = new Set();
    const id = setInterval(() => {
      n += 1;
      const note = {
        key: n,
        glyph: NOTE_GLYPHS[n % NOTE_GLYPHS.length],
        left: 8 + Math.random() * 84,
        drift: `${(Math.random() - 0.5) * 60}px`,
        spin: `${(Math.random() - 0.5) * 40}deg`,
        size: 14 + Math.round(Math.random() * 8),
      };
      setNotes((list) => [...list.slice(-6), note]);
      const t = setTimeout(() => {
        removals.delete(t);
        setNotes((list) => list.filter((x) => x.key !== note.key));
      }, 2700);
      removals.add(t);
    }, 900);
    return () => {
      clearInterval(id);
      removals.forEach(clearTimeout);
    };
  }, [playing, reduce]);

  if (reduce || notes.length === 0) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-0 overflow-visible">
      {notes.map((note) => (
        <span
          key={note.key}
          className="music-note absolute bottom-0 text-accent"
          style={{
            left: `${note.left}%`,
            fontSize: note.size,
            "--drift": note.drift,
            "--spin": note.spin,
            textShadow: "0 0 10px rgba(255, 100, 200, 0.6)",
          }}
        >
          {note.glyph}
        </span>
      ))}
    </div>
  );
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
    <div className="relative flex flex-col gap-3 rounded-2xl bg-raised p-4 ring-1 ring-hairline sm:p-5">
      <MusicNotes playing={playing} />
      <div className="flex items-center gap-4">
        <div
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent via-[#7a2e6b] to-accent-deep shadow-lg shadow-accent/10"
        >
          <Disc size={26} weight="duotone" className="text-ink/80" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate font-body text-base font-semibold text-ink">
            <span className="truncate">{track.title}</span>
            <Equalizer playing={playing} />
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent shadow-lg shadow-accent/25 transition hover:scale-105 active:scale-95"
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
        onPlay={(e) => {
          setPlaying(true);
          setActive(track.id);
          beatPlay(e.currentTarget);
        }}
        onPause={(e) => {
          setPlaying(false);
          beatStop(e.currentTarget);
        }}
        onEnded={(e) => {
          setPlaying(false);
          setCurrent(0);
          beatStop(e.currentTarget);
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
