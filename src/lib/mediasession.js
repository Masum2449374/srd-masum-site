// Lock-screen / notification controls via the Media Session API. Safe no-op where unsupported.
const ARTWORK_SRC = "/images/avatar.jpg";
const supported = () => typeof navigator !== "undefined" && "mediaSession" in navigator;

export function setMediaSessionMetadata(track) {
  if (!supported()) return;
  try {
    if (typeof window.MediaMetadata === "function") {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: track.title,
        artist: "SRD Masum",
        album: "SRD Masum",
        artwork: [{ src: ARTWORK_SRC, sizes: "512x512", type: "image/jpeg" }],
      });
    }
  } catch {
    // Never let lock-screen wiring break playback.
  }
}

// handlers: { play, pause, nexttrack, previoustrack, seekto, seekbackward, seekforward }
export function setMediaSessionHandlers(handlers) {
  if (!supported()) return;
  for (const [action, fn] of Object.entries(handlers)) {
    try {
      navigator.mediaSession.setActionHandler(action, fn);
    } catch {
      // Action not supported by this browser: ignore.
    }
  }
}

export function setMediaSessionState(state) {
  if (!supported()) return;
  try {
    navigator.mediaSession.playbackState = state;
  } catch {
    // ignore
  }
}

// Keeps the lock-screen scrub bar in step with the real position.
export function setMediaSessionPosition(el) {
  if (!supported() || !navigator.mediaSession.setPositionState) return;
  try {
    if (Number.isFinite(el.duration) && el.duration > 0) {
      navigator.mediaSession.setPositionState({
        duration: el.duration,
        playbackRate: el.playbackRate || 1,
        position: Math.min(el.currentTime, el.duration),
      });
    }
  } catch {
    // ignore
  }
}
