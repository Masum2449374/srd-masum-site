// Fallback beat source for the Now Playing bars when the live capture tap is silent (common on phones):
// decode the current song once at a low sample rate (mono 11 kHz, ~12 MB for a 4-min song) and read the
// real spectrum at audio.currentTime. Purely visual: playback never goes through Web Audio, so background
// play and lock-screen audio are untouched. Loaded only while the Now Playing view is open.
const RATE = 11025, N = 512;
let cur = { src: null, pcm: null, failed: false };
const win = new Float32Array(N).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
let coeffs = null, peaks = null, outPrev = null;

export function ensureDecoded(src) {
  if (!src || cur.src === src) return;
  const me = (cur = { src, pcm: null, failed: false });
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OAC) { me.failed = true; return; }
  fetch(src, { mode: "cors", credentials: "omit" })
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
    .then((buf) => new Promise((res, rej) => { const c = new OAC(1, RATE, RATE); const p = c.decodeAudioData(buf, res, rej); p?.then?.(res, rej); }))
    .then((ab) => { if (cur === me) me.pcm = ab.getChannelData(0); })
    .catch(() => { me.failed = true; });
}
export const decodedReady = (src) => cur.src === src && !!cur.pcm;

// Fills out (Uint8Array, n bands log-spaced 50 Hz..4.5 kHz, bass first) for time t. Returns bass 0..1.
export function decodedSpectrum(t, out) {
  const pcm = cur.pcm; if (!pcm) return -1;
  const n = out.length;
  if (!coeffs || coeffs.length !== n) {
    coeffs = new Float32Array(n); peaks = new Float32Array(n).fill(1e-3); outPrev = new Float32Array(n);
    for (let b = 0; b < n; b++) { const f = 50 * Math.pow(4500 / 50, b / (n - 1)); coeffs[b] = 2 * Math.cos((2 * Math.PI * f) / RATE); }
  }
  const s0 = Math.max(0, Math.min(pcm.length - N, Math.floor(t * RATE) - N / 2));
  let bass = 0;
  for (let b = 0; b < n; b++) {
    // Goertzel at the band frequency (n * 512 mults per frame: trivial even on low-end phones).
    let q1 = 0, q2 = 0; const c = coeffs[b];
    for (let i = 0; i < N; i++) { const q0 = c * q1 - q2 + pcm[s0 + i] * win[i]; q2 = q1; q1 = q0; }
    const mag = Math.sqrt(Math.max(0, q1 * q1 + q2 * q2 - c * q1 * q2));
    peaks[b] = Math.max(mag, peaks[b] * 0.9985); // slow auto-gain per band
    const v = Math.pow(mag / peaks[b], 0.8);
    const sm = v > outPrev[b] ? v : outPrev[b] * 0.82 + v * 0.18; // fast attack, smooth release
    outPrev[b] = sm; out[b] = Math.min(255, sm * 255);
    if (b < 3) bass += sm / 3;
  }
  return bass;
}
