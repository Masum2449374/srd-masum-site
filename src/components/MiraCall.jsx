import { useEffect, useRef, useState } from "react";
import { PhoneDisconnect, Microphone, MicrophoneSlash, HandPalm, SpeakerHigh } from "@phosphor-icons/react";

// Voice call with Mira.
//   mic (getUserMedia, echo-cancelled) -> energy VAD -> MediaRecorder clip -> /api/stt (Whisper, bn/en auto-detect)
//   -> /api/chat {voice:true} -> /api/tts (Gemini "Leda", one female voice for bn + en), sentence by sentence
//   -> listen again. Talking over Mira (barge-in) or tapping "Interrupt" stops her and listens.
// Mira never uses a male voice: if server TTS fails she uses a known-female device voice, else captions only.

export const callSupported = () => typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined" && !!(window.AudioContext || window.webkitAudioContext);

// One shared <audio> element + AudioContext, unlocked inside the user's tap on the call button
// (Android Chrome blocks audio.play() that starts later from async code on a fresh element).
let PLAYER = null, ACTX = null;
const SILENT = "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQIAAAAAAA==";
export function unlockAudio() {
  try {
    if (!PLAYER) { PLAYER = new Audio(); PLAYER.preload = "auto"; PLAYER.setAttribute("playsinline", ""); }
    PLAYER.src = SILENT; PLAYER.play().catch(() => {});
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!ACTX && AC) ACTX = new AC();
    ACTX?.resume?.();
  } catch { /* ignore */ }
}

const OK = "srd-mira-owner";
const ownerTok = () => { try { return localStorage.getItem(OK) || undefined; } catch { return undefined; } };
const saveOwner = (t) => { try { t ? localStorage.setItem(OK, t) : localStorage.removeItem(OK); } catch {} };
const isBn = (t) => /[\u0980-\u09ff]/.test(t);
const speakable = (t) => t.replace(/https?:\/\/\S+/g, "").replace(/\[\[[^\]]*\]\]/g, "")
  .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "").replace(/[*_#`>]/g, "").replace(/\s{2,}/g, " ").trim();
const linkify = (t) => t.split(/(https?:\/\/[^\s)]+)/g).map((p, i) => /^https?:\/\//.test(p)
  ? <a key={i} href={p.replace(/[.,!?]+$/, "")} target="_blank" rel="noopener noreferrer" className="break-all text-sky-300 underline">{p}</a> : p);

// Sentence chunks for low latency: a short first chunk starts playing while later ones synthesise.
function splitSentences(t) {
  const raw = t.match(/[^।.!?]+[।.!?]*\s*/g) || [t]; const out = [];
  for (const r of raw.map((x) => x.trim()).filter(Boolean)) {
    if (out.length && (out[out.length - 1].length < 20 || r.length < 10)) out[out.length - 1] += " " + r; else out.push(r);
  }
  return out.slice(0, 6);
}

// Strictly female device voices (no "first voice" fallback, which is often male).
const FEMALE = /female|woman|samantha|victoria|karen|moira|tessa|fiona|zira|aria|jenny|michelle|sonia|libby|natasha|neerja|swara|tanishaa|nabanita|heera|veena|google us english|x-bnf|bn-in-x-bnf|bn-bd-x-ban/i;
function femaleVoice(lang) {
  if (!("speechSynthesis" in window)) return null;
  const want = lang.slice(0, 2);
  return window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith(want) && FEMALE.test(v.name) && !/\bmale\b/i.test(v.name)) || null;
}

const withTimeout = (p, ms, ctl) => { const t = setTimeout(() => ctl?.abort(), ms); return p.finally(() => clearTimeout(t)); };
async function fetchRetry(url, opts, ms, tries = 2) {
  for (let i = 0; i < tries; i++) {
    const ctl = new AbortController();
    try {
      const r = await withTimeout(fetch(url, { ...opts, signal: ctl.signal }), ms, ctl);
      if (r.ok || r.status === 429 || r.status === 403 || r.status === 413) return r;
    } catch { /* timeout / network: retry */ }
    await new Promise((res) => setTimeout(res, 400));
  }
  return null;
}

export default function MiraCall({ lang: startLang = "bn-BD", onClose }) {
  const [phase, setPhase] = useState("connecting"); // connecting | listening | hearing | thinking | speaking | muted | error
  const [muted, setMuted] = useState(false);
  const [secs, setSecs] = useState(0);
  const [cap, setCap] = useState({ who: "mira", text: "" });
  const [err, setErr] = useState("");
  const [needTap, setNeedTap] = useState(false);
  const alive = useRef(true), hist = useRef([]), lang = useRef(startLang.startsWith("en") ? "en" : "bn");
  const phaseRef = useRef("connecting"), mutedRef = useRef(false), gen = useRef(0);
  const media = useRef({ stream: null, rec: null, chunks: [], analyser: null, timer: null });
  const vad = useRef({ floor: 0.01, voiced: 0, silent: 0, inSpeech: false, since: 0, barge: 0 });
  const go = (p) => { phaseRef.current = p; setPhase(p); };

  // ---------- speaking ----------
  const stopSpeaking = () => {
    gen.current++;
    try { PLAYER?.pause(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
  };
  const playBlob = (blob, g) => new Promise((res) => {
    if (!PLAYER) { PLAYER = new Audio(); PLAYER.setAttribute("playsinline", ""); }
    const url = URL.createObjectURL(blob); const a = PLAYER;
    const done = (ok) => { a.onended = a.onerror = null; clearInterval(chk); URL.revokeObjectURL(url); res(ok); };
    const chk = setInterval(() => { if (gen.current !== g || !alive.current) { a.pause(); done(false); } }, 100);
    a.onended = () => done(true); a.onerror = () => done(false);
    a.src = url;
    a.play().catch((e) => { if (e?.name === "NotAllowedError") setNeedTap(true); done(false); });
  });
  const deviceSay = (text, l) => new Promise((res) => {
    const v = femaleVoice(l === "bn" ? "bn" : "en");
    if (!v) { res(false); return; }
    const u = new SpeechSynthesisUtterance(text); u.voice = v; u.lang = v.lang; u.rate = 1.05; u.pitch = 1.05;
    let fin = false; const f = (ok) => { if (!fin) { fin = true; res(ok); } };
    u.onend = () => f(true); u.onerror = () => f(false);
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); setTimeout(() => f(true), 4000 + text.length * 110);
  });
  const speak = async (text) => {
    stopSpeaking(); const g = gen.current;
    setCap({ who: "mira", text }); go("speaking");
    const say = speakable(text);
    if (!say) return;
    const l = isBn(say) ? "bn" : "en";
    const parts = splitSentences(say);
    const jobs = parts.map((t) => fetchRetry("/api/tts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: t }) }, 15000)
      .then((r) => (r && r.ok ? r.blob() : null)).catch(() => null));
    for (let i = 0; i < parts.length; i++) {
      const blob = await jobs[i];
      if (gen.current !== g || !alive.current) return;
      let ok = blob && blob.size > 500 ? await playBlob(blob, g) : false;
      if (gen.current !== g || !alive.current) return;
      if (!ok) ok = await deviceSay(parts[i], l);
      if (!ok) await new Promise((r) => setTimeout(r, Math.min(5000, 900 + parts[i].length * 45))); // captions-only: give time to read
      if (gen.current !== g) return;
    }
  };

  // ---------- listening (VAD + recorder) ----------
  const startRec = () => {
    const m = media.current; if (!m.stream) return;
    try { m.rec?.state === "recording" && m.rec.stop(); } catch {}
    const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find((t) => MediaRecorder.isTypeSupported?.(t)) || "";
    const rec = new MediaRecorder(m.stream, type ? { mimeType: type, audioBitsPerSecond: 32000 } : undefined);
    m.chunks = []; rec.ondataavailable = (e) => e.data.size && m.chunks.push(e.data); rec.start(250); m.rec = rec; m.recAt = Date.now();
  };
  const stopRec = () => new Promise((res) => {
    const m = media.current, rec = m.rec;
    if (!rec || rec.state !== "recording") { res(null); return; }
    rec.onstop = () => res(new Blob(m.chunks, { type: rec.mimeType || "audio/webm" })); rec.stop(); m.rec = null;
  });
  const listen = () => {
    if (!alive.current) return;
    if (mutedRef.current) { go("muted"); return; }
    Object.assign(vad.current, { voiced: 0, silent: 0, inSpeech: false, since: Date.now() });
    startRec(); go("listening");
  };
  const endUtterance = async () => {
    vad.current.inSpeech = false; go("thinking");
    const blob = await stopRec();
    if (!alive.current) return;
    if (!blob || blob.size < 2000) { listen(); return; }
    const r = await fetchRetry(`/api/stt?lang=${lang.current}`, { method: "POST", headers: { "content-type": blob.type }, body: blob }, 15000);
    const d = r && r.ok ? await r.json().catch(() => ({})) : null;
    if (!alive.current) return;
    if (!d) { setErr("Couldn't hear that clearly — please try again."); listen(); return; }
    setErr("");
    const q = (d.text || "").trim();
    if (!q) { listen(); return; }
    lang.current = d.lang === "en" ? "en" : d.lang === "bn" ? "bn" : (isBn(q) ? "bn" : lang.current);
    setCap({ who: "you", text: q });
    ask(q);
  };
  const tick = () => {
    const m = media.current, v = vad.current; if (!m.analyser || !alive.current) return;
    const buf = m.buf || (m.buf = new Float32Array(m.analyser.fftSize)); m.analyser.getFloatTimeDomainData(buf);
    let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length), p = phaseRef.current;
    if (mutedRef.current) return;
    if (p === "listening" || p === "hearing") {
      const thr = Math.max(v.floor * 2.5, 0.008);
      if (!v.inSpeech) {
        if (rms > thr) { v.voiced += 50; if (v.voiced >= 150) { v.inSpeech = true; v.silent = 0; v.start = Date.now(); go("hearing"); } }
        else { v.voiced = 0; v.floor = Math.min(0.05, Math.max(0.002, v.floor * 0.95 + rms * 0.05)); }
        if (Date.now() - (m.recAt || 0) > 12000 && !v.inSpeech) startRec(); // keep idle clips short
      } else {
        if (rms < thr * 0.7) {
          v.silent += 50;
          if (v.silent >= 1300) { // Bangla speakers pause mid-sentence; 1.3s of quiet ends the turn
            if (Date.now() - v.start - v.silent < 500) { v.inSpeech = false; v.voiced = 0; go("listening"); } // a cough/click, not speech
            else endUtterance();
          }
        } else { v.silent = 0; v.speechMs = (v.speechMs || 0) + 50; }
        if (Date.now() - v.start > 20000) endUtterance();
      }
    } else if (p === "speaking") {
      // barge-in: clearly louder than the noise floor (and Mira's echo) for ~400ms
      const thr = Math.max(v.floor * 6, 0.06);
      if (rms > thr) { v.barge += 50; if (v.barge >= 400) { v.barge = 0; stopSpeaking(); listen(); vad.current.inSpeech = true; vad.current.start = Date.now(); go("hearing"); } } else v.barge = Math.max(0, v.barge - 25);
    }
  };

  // ---------- conversation ----------
  const ask = async (q) => {
    hist.current = [...hist.current, { role: "user", content: q }].slice(-8);
    go("thinking");
    let reply = "";
    const r = await fetchRetry("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: hist.current, voice: true, owner: ownerTok() }) }, 25000);
    if (r && r.ok) {
      const d = await r.json().catch(() => ({})); reply = d.reply || "";
      if (d.ownerToken) { saveOwner(d.ownerToken); hist.current = hist.current.slice(0, -1); }
      if (d.logout) { saveOwner(null); hist.current = []; }
    }
    if (!reply) reply = lang.current === "bn" ? "দুঃখিত, একটু সমস্যা হচ্ছে। আবার বলো?" : "Sorry, I had a little trouble. Could you say that again?";
    hist.current = [...hist.current, { role: "assistant", content: reply }].slice(-8);
    if (!alive.current) return;
    const g = gen.current + 1; await speak(reply);
    if (alive.current && gen.current === g && phaseRef.current === "speaking") listen();
  };

  useEffect(() => {
    alive.current = true;
    unlockAudio();
    const t = setInterval(() => setSecs((x) => x + 1), 1000);
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
        if (!alive.current) { stream.getTracks().forEach((x) => x.stop()); return; }
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!ACTX) ACTX = new AC();
        await ACTX.resume?.().catch(() => {});
        const src = ACTX.createMediaStreamSource(stream), an = ACTX.createAnalyser(); an.fftSize = 1024; src.connect(an);
        Object.assign(media.current, { stream, analyser: an, src, timer: setInterval(tick, 50) });
      } catch (e) {
        setErr(e?.name === "NotAllowedError" || e?.name === "SecurityError"
          ? "Microphone access is blocked. Allow it in your browser's site settings (lock icon → Permissions → Microphone), then call again."
          : "No microphone found. Please check your device and try again.");
        go("error"); return;
      }
      const greet = lang.current === "bn"
        ? "হ্যালো! আমি মিরা, SRD Masum-এর সহকারী। বলো, আজ তোমাকে কীভাবে সাহায্য করতে পারি?"
        : "Hello! I'm Mira, SRD Masum's assistant. How can I help you today?";
      hist.current = [{ role: "assistant", content: greet }];
      const g = gen.current + 1; await speak(greet);
      if (alive.current && gen.current === g) listen();
    })();
    return () => {
      alive.current = false; clearInterval(t); stopSpeaking();
      const m = media.current; clearInterval(m.timer);
      try { m.rec?.state === "recording" && m.rec.stop(); } catch {}
      m.stream?.getTracks().forEach((x) => x.stop()); try { m.src?.disconnect(); } catch {}
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const end = () => { alive.current = false; stopSpeaking(); onClose(); };
  const interrupt = () => { stopSpeaking(); listen(); };
  const toggleMute = () => {
    const m = !mutedRef.current; mutedRef.current = m; setMuted(m);
    if (m) { stopRec(); if (phaseRef.current !== "speaking" && phaseRef.current !== "thinking") go("muted"); }
    else if (phaseRef.current === "muted" || phaseRef.current === "listening") listen();
  };
  const tapSound = () => { unlockAudio(); setNeedTap(false); };
  const mm = String(Math.floor(secs / 60)).padStart(2, "0"), ss = String(secs % 60).padStart(2, "0");
  const status = { connecting: "Connecting…", listening: "Listening — go ahead", hearing: "Hearing you…", thinking: "Thinking…", speaking: "Mira is speaking", muted: "You're muted", error: "Can't start the call" }[phase];

  return (
    <div role="dialog" aria-label="Voice call with Mira" data-testid="mira-call"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-between bg-gradient-to-b from-[#0a2a6b] via-[#101a3a] to-[#3a1430] px-6 pb-10 pt-14 text-white">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-white/60">Voice call</p>
        <p className="mt-1 text-2xl font-semibold">Mira</p>
        <p className="mt-1 font-mono text-sm text-white/70" aria-live="off">{mm}:{ss}</p>
      </div>
      <div className="flex flex-col items-center">
        <div className={`mira-ring relative rounded-full p-1.5 ${phase === "speaking" ? "mira-speaking" : ""}`}>
          <img src="/images/mira-v3-512.webp" alt="Mira" className="h-36 w-36 rounded-full object-cover ring-4 ring-white/20" />
          <span className="absolute bottom-3 right-3 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-[#101a3a]" />
        </div>
        <p className="mt-5 flex items-center gap-2 text-sm text-white/80">
          {(phase === "listening" || phase === "hearing") && <span className={`mira-wave ${phase === "hearing" ? "" : "opacity-50"}`} aria-hidden="true"><i /><i /><i /><i /></span>}
          {status}
        </p>
        <p className="mt-4 min-h-[3.5rem] max-w-sm text-center text-[15px] leading-relaxed text-white/90" aria-live="polite" data-testid="mira-caption">
          {cap.text && <><span className="mr-1 text-xs text-white/50">{cap.who === "mira" ? "Mira:" : "You:"}</span>{linkify(cap.text)}</>}
        </p>
        {phase === "speaking" && <button type="button" onClick={interrupt} data-testid="mira-interrupt" className="mt-3 flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 ring-1 ring-white/20 active:scale-95"><HandPalm size={14} weight="fill" />Interrupt</button>}
        {needTap && <button type="button" onClick={tapSound} className="mt-3 flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#101a3a] active:scale-95"><SpeakerHigh size={14} weight="fill" />Tap to turn on sound</button>}
        {err && <p role="alert" className="mt-2 rounded-lg bg-rose-500/25 px-3 py-1.5 text-xs">{err}</p>}
      </div>
      <div className="flex items-center gap-10">
        <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} aria-pressed={muted}
          className={`flex h-14 w-14 items-center justify-center rounded-full ${muted ? "bg-white text-[#101a3a]" : "bg-white/15 text-white"}`}>
          {muted ? <MicrophoneSlash size={24} weight="fill" /> : <Microphone size={24} weight="fill" />}
        </button>
        <button type="button" onClick={end} aria-label="End call" data-testid="mira-end"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-900/50"><PhoneDisconnect size={28} weight="fill" /></button>
      </div>
    </div>
  );
}
