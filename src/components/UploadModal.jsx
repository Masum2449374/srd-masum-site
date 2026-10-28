import { useEffect, useRef, useState } from "react";
import { X, UploadSimple, MusicNote, ImageSquare, CheckCircle } from "@phosphor-icons/react";

const AUDIO_OK = /\.(mp3|m4a|aac|wav)$/i, IMG_OK = /\.(jpe?g|png|webp)$/i;
export default function UploadModal({ onClose, onDone, left }) {
  const [audio, setAudio] = useState(null), [cover, setCover] = useState(null), [coverUrl, setCoverUrl] = useState(null);
  const [title, setTitle] = useState(""), [language, setLanguage] = useState(""), [lyrics, setLyrics] = useState(""), [rights, setRights] = useState(false);
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false), [pct, setPct] = useState(0), [done, setDone] = useState(false);
  const xhr = useRef(null);
  useEffect(() => { const k = (e) => e.key === "Escape" && !busy && onClose(); document.addEventListener("keydown", k); const p = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.removeEventListener("keydown", k); document.body.style.overflow = p; xhr.current?.abort(); }; }, [busy, onClose]);
  useEffect(() => () => coverUrl && URL.revokeObjectURL(coverUrl), [coverUrl]);
  const pickAudio = (f) => { setErr(""); if (!f) return; if (!AUDIO_OK.test(f.name)) return setErr("Use an MP3, M4A, AAC or WAV file."); if (f.size > 20 * 1024 * 1024) return setErr("Audio must be 20 MB or less."); setAudio(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").slice(0, 100)); };
  const pickCover = (f) => { setErr(""); if (!f) return; if (!IMG_OK.test(f.name)) return setErr("Cover must be JPG, PNG or WebP."); if (f.size > 3 * 1024 * 1024) return setErr("Cover image must be 3 MB or less."); setCover(f); setCoverUrl(URL.createObjectURL(f)); };
  const submit = (e) => {
    e.preventDefault(); setErr("");
    if (!audio) return setErr("Please choose an audio file."); if (!title.trim()) return setErr("Please add a song title."); if (!language) return setErr("Please choose a language."); if (!rights) return setErr("Please confirm you have the rights to publish this song.");
    const fd = new FormData(); fd.append("audio", audio); if (cover) fd.append("cover", cover); fd.append("title", title.trim()); fd.append("language", language); fd.append("lyrics", lyrics); fd.append("rights", "yes");
    const x = new XMLHttpRequest(); xhr.current = x; setBusy(true); setPct(0);
    x.open("POST", "/api/songs/upload"); x.withCredentials = true;
    x.upload.onprogress = (ev) => ev.lengthComputable && setPct(Math.round((ev.loaded / ev.total) * 100));
    x.onload = () => { setBusy(false); let d = {}; try { d = JSON.parse(x.responseText); } catch {} if (x.status >= 200 && x.status < 300) { setDone(true); onDone?.(d.song); } else setErr(d.error || "Upload failed. Please try again."); };
    x.onerror = () => { setBusy(false); setErr("Network error. Please try again."); };
    x.send(fd);
  };
  return (
    <div className="srd-up" role="dialog" aria-modal="true" aria-labelledby="up-title">
      <div className="srd-up-backdrop" onClick={() => !busy && onClose()} aria-hidden="true" />
      <form className="srd-up-sheet" onSubmit={submit} noValidate>
        <div className="srd-up-head">
          <h2 id="up-title" className="font-display text-xl font-bold tracking-display text-ink">Upload song</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="srd-menu-close"><X size={18} weight="bold" /></button>
        </div>
        {done ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <CheckCircle size={56} weight="fill" className="text-[#1ed760]" />
            <p className="mt-4 text-lg font-bold text-ink">Sent for review</p>
            <p className="mt-1 max-w-xs text-sm text-muted">Your song is pending approval. It'll appear on your profile for everyone once it's approved.</p>
            <button type="button" onClick={onClose} className="srd-up-cta mt-8">Done</button>
          </div>
        ) : (
        <div className="srd-up-body">
          <div className="flex gap-4">
            <label className="srd-up-cover" aria-label="Choose cover image (optional)">
              {coverUrl ? <img src={coverUrl} alt="" /> : <span className="flex flex-col items-center gap-1 text-muted"><ImageSquare size={28} /><span className="text-[11px] font-semibold">Cover</span><span className="text-[10px] opacity-70">Optional</span></span>}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pickCover(e.target.files?.[0])} disabled={busy} />
            </label>
            <label className={`srd-up-drop${audio ? " has" : ""}`}>
              <span className="srd-up-drop-ico">{audio ? <MusicNote size={22} weight="fill" /> : <UploadSimple size={22} weight="bold" />}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{audio ? audio.name : "Choose audio file"}</span>
                <span className="block text-xs text-muted">{audio ? `${(audio.size / 1048576).toFixed(1)} MB` : "MP3, M4A, AAC or WAV · max 20 MB"}</span>
              </span>
              <input type="file" accept=".mp3,.m4a,.aac,.wav,audio/mpeg,audio/mp4,audio/aac,audio/wav" className="sr-only" onChange={(e) => pickAudio(e.target.files?.[0])} disabled={busy} />
            </label>
          </div>
          <label className="srd-up-field"><span>Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="Song title" disabled={busy} /></label>
          <fieldset className="srd-up-field"><legend>Language</legend>
            <div className="srd-up-chips">{["English", "Bangla", "Hindi", "Other"].map((l) => <button key={l} type="button" aria-pressed={language === l} onClick={() => setLanguage(l)} className="srd-chip" disabled={busy}>{l}</button>)}</div>
          </fieldset>
          <label className="srd-up-field"><span>Lyrics <em>Optional</em></span><textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} maxLength={8000} rows={4} placeholder="Paste lyrics…" disabled={busy} /></label>
          <label className="srd-up-rights"><input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} disabled={busy} /><span>I own this song or have the rights to publish it.</span></label>
          <p className="text-xs text-faint">Songs are reviewed before they go public. Uploading someone else's music without permission isn't allowed. See <a href="/copyright/" className="underline">Copyright</a>.{typeof left === "number" ? ` ${left} upload${left === 1 ? "" : "s"} left today.` : ""}</p>
          {err && <p role="alert" className="srd-up-err">{err}</p>}
          <button type="submit" className="srd-up-cta" disabled={busy || left === 0}>{busy ? `Uploading… ${pct}%` : "Submit for review"}</button>
          {busy && <div className="srd-up-bar" aria-hidden="true"><i style={{ width: pct + "%" }} /></div>}
        </div>)}
      </form>
    </div>
  );
}
