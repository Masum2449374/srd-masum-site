// Lock-screen / notification controls via the Media Session API. Safe no-op where unsupported.
const ARTWORK_SRC = "/images/avatar.jpg";

export function setMediaSession(track, el) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  try {
    if (typeof window.MediaMetadata === "function") {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: track.title,
        artist: "SRD Masum",
        album: "SRD Masum",
        artwork: [
          { src: ARTWORK_SRC, sizes: "512x512", type: "image/jpeg" },
        ],
      });
    }
    const handlers = {
      play: () => el.play().catch(() => {}),
      pause: () => el.pause(),
    };
    for (const [action, fn] of Object.entries(handlers)) {
      try {
        navigator.mediaSession.setActionHandler(action, fn);
      } catch {
        // Action not supported by this browser: ignore.
      }
    }
  } catch {
    // Never let lock-screen wiring break playback.
  }
}

export function setMediaSessionState(state) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.playbackState = state;
  } catch {
    // ignore
  }
}
