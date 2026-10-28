import { useEffect, useRef, useState } from "react";
import { X, EnvelopeSimple, LockSimple, At, User, Eye, EyeSlash, ArrowLeft, ShieldCheck } from "@phosphor-icons/react";
import { api, authInfo, loadMe } from "../lib/auth.js";

const Label = ({ children, right }) => <span className="mb-1.5 flex justify-between text-xs font-semibold uppercase tracking-[0.14em] text-muted">{children}{right}</span>;

function Pw({ value, onChange, auto, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <span className="srd-field"><LockSimple size={17} aria-hidden="true" className="shrink-0 text-faint" />
      <input type={show ? "text" : "password"} value={value} onChange={onChange} maxLength={128} autoComplete={auto} placeholder={placeholder} required />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="text-faint hover:text-ink">{show ? <EyeSlash size={17} /> : <Eye size={17} />}</button></span>
  );
}

function CodeBoxes({ value, onChange, onDone }) {
  const refs = useRef([]);
  useEffect(() => { refs.current[0]?.focus(); }, []);
  const setAt = (i, ch) => { const a = value.padEnd(6, " ").split(""); a[i] = ch; const v = a.join("").replace(/\s+$/, ""); onChange(v); return v; };
  return (
    <div className="flex justify-between gap-2" onPaste={(e) => { const d = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); if (d) { e.preventDefault(); onChange(d); refs.current[Math.min(d.length, 5)]?.focus(); if (d.length === 6) onDone(d); } }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input key={i} ref={(el) => (refs.current[i] = el)} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} maxLength={6} aria-label={`Digit ${i + 1}`}
          value={(value[i] || "").trim()} className="srd-otp"
          onChange={(e) => { const d = e.target.value.replace(/\D/g, ""); if (d.length > 1) { const v = d.slice(0, 6); onChange(v); refs.current[Math.min(v.length, 5)]?.focus(); if (v.length === 6) onDone(v); return; } const v = setAt(i, d || " "); if (d && i < 5) refs.current[i + 1]?.focus(); if (v.replace(/\s/g, "").length === 6) onDone(v); }}
          onKeyDown={(e) => { if (e.key === "Backspace" && !(value[i] || "").trim() && i > 0) { refs.current[i - 1]?.focus(); setAt(i - 1, " "); } }} />
      ))}
    </div>
  );
}

const TITLES = {
  signin: ["Welcome back", "Sign in to your SRD Masum account."],
  signup: ["Create your account", "Join SRD Masum and get your own artist profile."],
  forgot: ["Reset your password", "Enter your account email and we'll send you a 6-digit code."],
  verify: ["Verify your email", "We sent a 6-digit code to"],
  login: ["Check your email", "For your security, enter the 6-digit sign-in code we sent to"],
  reset: ["Enter your code", "Enter the code we sent to"],
};

export default function AuthModal({ mode: initial, onClose }) {
  const [mode, setMode] = useState(initial);
  const [f, setF] = useState({ email: "", password: "", username: "", displayName: "", newPassword: "" });
  const [otp, setOtp] = useState(null); // { ticket, email, cooldown }
  const [code, setCode] = useState(""), [cool, setCool] = useState(0);
  const [err, setErr] = useState(""), [info, setInfo] = useState(""), [busy, setBusy] = useState(false), [mailOk, setMailOk] = useState(authInfo.mail);
  const first = useRef(null);
  useEffect(() => { loadMe().then(() => setMailOk(authInfo.mail)); }, []);
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k); document.documentElement.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.documentElement.style.overflow = ""; };
  }, [onClose]);
  useEffect(() => { setErr(""); setInfo(""); if (!otp) first.current?.focus(); }, [mode, otp]);
  useEffect(() => { if (cool <= 0) return; const t = setTimeout(() => setCool((c) => c - 1), 1000); return () => clearTimeout(t); }, [cool]);
  const up = (k) => (e) => setF((s) => ({ ...s, [k]: k === "username" ? e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") : e.target.value }));
  const run = async (fn) => { if (busy) return; setErr(""); setInfo(""); setBusy(true); try { await fn(); } catch (x) { setErr(x.message); } finally { setBusy(false); } };
  const gotTicket = (d) => { setOtp({ ticket: d.ticket, email: d.email, step: d.step }); setCode(""); setCool(d.cooldown || 60); };
  const submit = (e) => { e.preventDefault(); run(async () => {
    const d = await api(mode === "signup" ? "signup" : mode === "forgot" ? "forgot" : "login", mode === "forgot" ? { email: f.email } : f);
    gotTicket(d);
  }); };
  const verify = (c = code) => run(async () => {
    if (c.replace(/\D/g, "").length !== 6) throw new Error("Enter the 6-digit code from your email.");
    if (otp.step === "reset" && f.newPassword.length < 8) throw new Error("Choose a new password with at least 8 characters.");
    await api("verify-code", { ticket: otp.ticket, code: c, password: otp.step === "reset" ? f.newPassword : undefined });
    onClose();
  });
  const resend = () => run(async () => {
    const r = await fetch("/api/auth/resend", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticket: otp.ticket }) });
    const d = await r.json().catch(() => ({}));
    if (d.cooldown) setCool(d.cooldown);
    if (!r.ok) throw new Error(d.error || "Couldn't send a new code.");
    setCode(""); setInfo("A new code is on its way.");
  });
  const step = otp ? otp.step : mode;
  const [title, sub] = TITLES[step];
  const back = () => { setOtp(null); setCode(""); };
  return (
    <div className="srd-search" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="srd-search-backdrop" onClick={onClose} />
      <div className="srd-search-sheet srd-auth-sheet" style={{ marginTop: "min(10vh, 80px)" }}>
        <div className="relative px-6 pb-6 pt-7 sm:px-8">
          {(otp || mode === "forgot") && <button type="button" onClick={() => (otp ? back() : setMode("signin"))} aria-label="Back" className="absolute left-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted ring-1 ring-hairline hover:text-ink"><ArrowLeft size={16} weight="bold" /></button>}
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted ring-1 ring-hairline hover:text-ink"><X size={16} weight="bold" /></button>
          {otp ? <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent ring-1 ring-accent/30 ${otp || mode === "forgot" ? "mt-8" : ""}`}><ShieldCheck size={22} /></span>
            : <img src="/images/avatar.webp" alt="" width="44" height="44" className={`h-11 w-11 rounded-full ring-1 ring-accent ${mode === "forgot" ? "mt-8" : ""}`} />}
          <h2 id="auth-title" className="mt-4 font-display text-2xl tracking-display text-ink">{title}</h2>
          <p className="mt-1 text-sm text-muted">{sub}{otp && <> <span className="font-semibold text-ink">{otp.email}</span>. It expires in 10 minutes.</>}</p>
          {!mailOk && !otp && <p role="status" className="mt-5 rounded-xl bg-amber-400/10 px-3 py-2.5 text-sm text-amber-200 ring-1 ring-amber-400/30">Email verification is being set up. Sign-up and sign-in will open very soon.</p>}
          {otp ? (
            <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="mt-6 space-y-4" noValidate>
              <CodeBoxes value={code} onChange={setCode} onDone={(v) => { if (otp.step !== "reset") verify(v); }} />
              {otp.step === "reset" && <label className="block"><Label>New password</Label><Pw value={f.newPassword} onChange={up("newPassword")} auto="new-password" placeholder="At least 8 characters" /></label>}
              {err && <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-400/30">{err}</p>}
              {info && <p role="status" className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 ring-1 ring-emerald-400/30">{info}</p>}
              <button type="submit" disabled={busy} className="pro-btn w-full rounded-full bg-accent py-3 text-sm font-semibold text-on-accent disabled:opacity-60">{busy ? "Please wait…" : otp.step === "reset" ? "Set new password" : otp.step === "verify" ? "Verify & continue" : "Sign in"}</button>
              <p className="text-center text-sm text-muted">Didn't get it? Check spam, or{" "}
                <button type="button" onClick={resend} disabled={cool > 0 || busy} className="font-semibold text-accent hover:underline disabled:text-faint disabled:no-underline">{cool > 0 ? `resend in ${cool}s` : "resend code"}</button></p>
            </form>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              {mode === "signup" && <label className="block"><Label>Display name</Label><span className="srd-field"><User size={17} className="shrink-0 text-faint" /><input value={f.displayName} onChange={up("displayName")} maxLength={40} autoComplete="name" placeholder="Your name" /></span></label>}
              {mode === "signup" && <label className="block"><Label>Username</Label><span className="srd-field"><At size={17} className="shrink-0 text-faint" /><input value={f.username} onChange={up("username")} maxLength={20} autoComplete="username" placeholder="3–20 letters, numbers or _" required /></span></label>}
              <label className="block"><Label>Email</Label><span className="srd-field"><EnvelopeSimple size={17} aria-hidden="true" className="shrink-0 text-faint" />
                <input ref={first} type="email" value={f.email} onChange={up("email")} maxLength={254} autoComplete="email" placeholder="you@example.com" required /></span></label>
              {mode !== "forgot" && <label className="block"><Label right={mode === "signin" && <button type="button" onClick={() => setMode("forgot")} className="normal-case tracking-normal text-accent hover:underline">Forgot password?</button>}>Password</Label>
                <Pw value={f.password} onChange={up("password")} auto={mode === "signup" ? "new-password" : "current-password"} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} /></label>}
              {err && <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-400/30">{err}</p>}
              <button type="submit" disabled={busy || !mailOk} className="pro-btn w-full rounded-full bg-accent py-3 text-sm font-semibold text-on-accent transition-transform active:scale-[0.98] disabled:opacity-50">
                {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send code" : "Continue"}
              </button>
            </form>
          )}
          {!otp && mode !== "forgot" && <p className="mt-5 text-center text-sm text-muted">
            {mode === "signup" ? "Already have an account? " : "New to SRD Masum? "}
            <button type="button" onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="font-semibold text-accent hover:underline">{mode === "signup" ? "Sign in" : "Create an account"}</button>
          </p>}
        </div>
      </div>
    </div>
  );
}
