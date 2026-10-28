import { useState } from "react";
import { initials, hueOf } from "../lib/auth.js";
export default function Avatar({ user, size = 36, className = "", src }) {
  const h = hueOf(user?.username), url = src || user?.avatar;
  const [bad, setBad] = useState(null);
  if (url && bad !== url) return (
    <img src={url} alt="" aria-hidden="true" width={size} height={size} draggable={false} onError={() => setBad(url)}
      className={`shrink-0 select-none rounded-full object-cover ring-1 ring-white/15 ${className}`} style={{ width: size, height: size }} />
  );
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-display font-semibold text-white ring-1 ring-white/20 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, hsl(${h} 70% 55%), hsl(${(h + 50) % 360} 65% 38%))` }}>
      {initials(user?.displayName || user?.username)}
    </span>
  );
}
