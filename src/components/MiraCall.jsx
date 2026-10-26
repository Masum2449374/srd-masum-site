import { useEffect, useRef, useState } from "react";
import { PhoneDisconnect, Microphone, MicrophoneSlash } from "@phosphor-icons/react";

// Voice call with Mira: speak (speechSynthesis) -> listen (SpeechRecognition) -> /api/chat {voice:true} -> speak ...
const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const callSupported = () => !!SR && typeof window !== "undefined" && "speechSynthesis" in window;

const isBn = (t) => /[\u0980-\u09ff]/.test(t);
const speakable = (t) => t.replace(/https?:\/\/\S+/g, "").replace(/\[\[[^\]]*\]\]/g, "")
  .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "").replace(/\s{2,}/g, " ").trim();
const linkify = (t) => t.split(/(https?:\/\/[^\s)]+)/g).map((p, i) => /^https?:\/\//.test(p)
  ? <a key={i} href={p.replace(/[.,!?]+$/, "")} target="_blank" rel="noopener noreferrer" className="break-all text-sky-300 underline">{p}</a> : p);

function pickVoice(lang) {
  const vs = window.speechSynthesis.getVoices();
  const want = lang.slice(0, 2);
  const mine = vs.filter((v) => v.lang?.toLowerCase().startsWith(want));
  const fem = /female|woman|zira|samantha|victoria|karen|moira|tessa|fiona|veena|heera|google.*(bangla|bengali|english)|wavenet-a|-a$/i;
  return mine.find((v) => fem.test(v.name)) || mine[0] || null;
}

export default function MiraCall({ lang: startLang = "bn-BD", onClose }) {
  const [phase, setPhase] = useState("speaking"); // speaking | listening | thinking | idle
  const [muted, setMuted] = useState(false);
  const [secs, setSecs] = useState(0);
  const [cap, setCap] = useState({ who: "mira", text: "" });
  const [err, setErr] = useState("");
  const alive = useRef(true), rec = useRef(null), hist = useRef([]), lang = useRef(startLang), mutedRef = useRef(false);

  const speak = (text, then) => {
    const say = speakable(text);
    setCap({ who: "mira", text }); setPhase("speaking");
    const synth = window.speechSynthesis; synth.cancel();
    if (!say) { then?.(); return; }
    const u = new SpeechSynthesisUtterance(say);
    const l = isBn(say) ? "bn-BD" : "en-US"; u.lang = l; const v = pickVoice(l); if (v) u.voice = v;
    u.rate = 1; u.pitch = 1.15; u.volume = 1;
    let done = false; const fin = () => { if (done) return; done = true; if (alive.current) then?.(); };
    u.onend = fin; u.onerror = fin;
    synth.speak(u);
    setTimeout(fin, 4000 + say.length * 120); // safety if onend never fires
  };

  const listen = () => {
    if (!alive.current) return;
    if (mutedRef.current) { setPhase("idle"); return; }
    const r = new SR(); rec.current = r; let fin = "";
    r.lang = lang.current; r.interimResults = true; r.continuous = false;
    r.onresult = (e) => { let f = "", t = ""; for (let i = 0; i < e.results.length; i++) (e.results[i].isFinal ? (f += e.results[i][0].transcript) : (t += e.results[i][0].transcript)); fin = f; setCap({ who: "you", text: f + t }); };
    r.onerror = (e) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") { setErr("মাইক্রোফোনের অনুমতি দাও 🎙️ — please allow the microphone"); alive.current = false; setPhase("idle"); } };
    r.onend = () => { if (!alive.current) return; const q = fin.trim(); if (q) ask(q); else if (!mutedRef.current) setTimeout(listen, 250); };
    try { r.start(); setPhase("listening"); } catch { setTimeout(listen, 500); }
  };

  const ask = async (q) => {
    if (isBn(q)) lang.current = "bn-BD";
    hist.current = [...hist.current, { role: "user", content: q }].slice(-8);
    setPhase("thinking");
    let reply = "";
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: hist.current, voice: true }) });
      reply = (await r.json().catch(() => ({}))).reply || "";
    } catch { /* ignore */ }
    if (!reply) reply = lang.current === "bn-BD" ? "দুঃখিত, একটু সমস্যা হচ্ছে। আবার বলো?" : "Sorry, I had a little trouble. Could you say that again?";
    hist.current = [...hist.current, { role: "assistant", content: reply }].slice(-8);
    if (alive.current) speak(reply, listen);
  };

  useEffect(() => {
    alive.current = true;
    const greet = lang.current === "bn-BD"
      ? "হ্যালো! আমি মিরা, SRD Masum-এর সহকারী। বলো, আজ তোমাকে কীভাবে সাহায্য করতে পারি?"
      : "Hello! I'm Mira, SRD Masum's assistant. How can I help you today?";
    const start = () => speak(greet, listen);
    if (window.speechSynthesis.getVoices().length) start();
    else { let s = false; const go = () => { if (!s) { s = true; start(); } }; window.speechSynthesis.onvoiceschanged = go; setTimeout(go, 600); }
    const t = setInterval(() => setSecs((x) => x + 1), 1000);
    return () => { alive.current = false; clearInterval(t); window.speechSynthesis.cancel(); rec.current?.abort?.(); };
  }, []);

  const end = () => { alive.current = false; window.speechSynthesis.cancel(); rec.current?.abort?.(); onClose(); };
  const toggleMute = () => {
    const m = !mutedRef.current; mutedRef.current = m; setMuted(m);
    if (m) { rec.current?.abort?.(); if (phase === "listening") setPhase("idle"); }
    else if (phase !== "speaking" && phase !== "thinking") listen();
  };
  const mm = String(Math.floor(secs / 60)).padStart(2, "0"), ss = String(secs % 60).padStart(2, "0");
  const status = { speaking: "মিরা বলছে…", listening: "শুনছি… বলো 🎙️", thinking: "ভাবছি…", idle: muted ? "মিউট করা" : "…" }[phase];

  return (
    <div role="dialog" aria-label="Voice call with Mira" data-testid="mira-call"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-between bg-gradient-to-b from-[#0a2a6b] via-[#101a3a] to-[#3a1430] px-6 pb-10 pt-14 text-white">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-white/60">Voice call</p>
        <p className="mt-1 text-2xl font-semibold">Mira · মিরা</p>
        <p className="mt-1 font-mono text-sm text-white/70" aria-live="off">{mm}:{ss}</p>
      </div>
      <div className="flex flex-col items-center">
        <div className={`mira-ring relative rounded-full p-1.5 ${phase === "speaking" ? "mira-speaking" : ""}`}>
          <img src="/images/mira.webp" alt="Mira" className="h-36 w-36 rounded-full object-cover ring-4 ring-white/20" />
          <span className="absolute bottom-3 right-3 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-[#101a3a]" />
        </div>
        <p className="mt-5 flex items-center gap-2 text-sm text-white/80">
          {phase === "listening" && <span className="mira-wave" aria-hidden="true"><i /><i /><i /><i /></span>}
          {status}
        </p>
        <p className="mt-4 min-h-[3.5rem] max-w-sm text-center text-[15px] leading-relaxed text-white/90" aria-live="polite" data-testid="mira-caption">
          {cap.text && <><span className="mr-1 text-xs text-white/50">{cap.who === "mira" ? "Mira:" : "You:"}</span>{linkify(cap.text)}</>}
        </p>
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
