import { useEffect, useRef, useState } from "react";
import { X, EnvelopeSimple, LockSimple, At, User, Eye, EyeSlash } from "@phosphor-icons/react";
import { api } from "../lib/auth.js";

function Field({ icon: Icon, label, ...p }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>
      <span className="srd-field"><Icon size={17} aria-hidden="true" className="shrink-0 text-faint" /><input {...p} /></span>
    </label>
  );
}

export default function AuthModal({ mode: initial, onClose }) {
  const [mode, setMode] = useState(initial);
  const [f, setF] = useState({ email: "", password: "", username: "", displayName: "" });
  const [show, setShow] = useState(false), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const first = useRef(null);
  useEffect(() => {
    first.current?.focus();
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k); document.documentElement.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.documentElement.style.overflow = ""; };
  }, [onClose]);
  useEffect(() => { setErr(""); }, [mode]);
  const up = (k) => (e) => setF((s) => ({ ...s, [k]: k === "username" ? e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") : e.target.value }));
  const submit = async (e) => {
    e.preventDefault(); if (busy) return; setErr(""); setBusy(true);
    try { await api(mode === "signup" ? "signup" : "login", f); onClose(); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const su = mode === "signup";
  return (
    <div className="srd-search" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="srd-search-backdrop" onClick={onClose} />
      <div className="srd-search-sheet srd-auth-sheet" style={{ marginTop: "min(10vh, 80px)" }}>
        <div className="relative px-6 pb-6 pt-7 sm:px-8">
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted ring-1 ring-hairline hover:text-ink"><X size={16} weight="bold" /></button>
          <img src="/images/avatar.webp" alt="" width="44" height="44" className="h-11 w-11 rounded-full ring-1 ring-accent" />
          <h2 id="auth-title" className="mt-4 font-display text-2xl tracking-display text-ink">{su ? "Create your account" : "Welcome back"}</h2>
          <p className="mt-1 text-sm text-muted">{su ? "Join SRD Masum and get your own artist profile." : "Sign in to your SRD Masum account."}</p>
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {su && <Field icon={User} label="Display name" value={f.displayName} onChange={up("displayName")} maxLength={40} autoComplete="name" placeholder="Your name" ref={null} />}
            {su && <Field icon={At} label="Username" value={f.username} onChange={up("username")} maxLength={20} autoComplete="username" placeholder="3–20 letters, numbers or _" required />}
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Email</span>
              <span className="srd-field"><EnvelopeSimple size={17} aria-hidden="true" className="shrink-0 text-faint" />
                <input ref={first} type="email" value={f.email} onChange={up("email")} maxLength={254} autoComplete="email" placeholder="you@example.com" required /></span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Password</span>
              <span className="srd-field"><LockSimple size={17} aria-hidden="true" className="shrink-0 text-faint" />
                <input type={show ? "text" : "password"} value={f.password} onChange={up("password")} maxLength={128} autoComplete={su ? "new-password" : "current-password"} placeholder={su ? "At least 8 characters" : "Your password"} required />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="text-faint hover:text-ink">{show ? <EyeSlash size={17} /> : <Eye size={17} />}</button></span>
            </label>
            {err && <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-400/30">{err}</p>}
            <button type="submit" disabled={busy} className="pro-btn w-full rounded-full bg-accent py-3 text-sm font-semibold text-on-accent transition-transform active:scale-[0.98] disabled:opacity-60">
              {busy ? "Please wait…" : su ? "Create account" : "Sign in"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-muted">
            {su ? "Already have an account? " : "New to SRD Masum? "}
            <button type="button" onClick={() => setMode(su ? "signin" : "signup")} className="font-semibold text-accent hover:underline">{su ? "Sign in" : "Create an account"}</button>
          </p>
        </div>
      </div>
    </div>
  );
}
