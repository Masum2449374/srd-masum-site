import { useEffect, useRef, useState } from "react";
import { X, PencilSimple, Trash, MagnifyingGlassMinus, MagnifyingGlassPlus, ImageSquare } from "@phosphor-icons/react";
import { api } from "../lib/auth.js";
import { loadImage, exportCrop } from "../lib/image.js";
import Avatar from "./Avatar.jsx";

function useModal(onClose) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k); const prev = document.documentElement.style.overflow; document.documentElement.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.documentElement.style.overflow = prev; };
  }, [onClose]);
}

function CropDialog({ src, onCancel, onDone }) {
  const box = useRef(null), drag = useRef(null);
  const [V, setV] = useState(300), [z, setZ] = useState(1), [pos, setPos] = useState(null), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const { img } = src, w = img.naturalWidth, h = img.naturalHeight;
  const s0 = V / Math.min(w, h), s = s0 * z;
  const clamp = (x, y, sc = s) => ({ x: Math.min(0, Math.max(V - w * sc, x)), y: Math.min(0, Math.max(V - h * sc, y)) });
  useEffect(() => { const el = box.current; const v = el.clientWidth; setV(v); const sc = v / Math.min(w, h); setPos({ x: (v - w * sc) / 2, y: (v - h * sc) / 2 }); }, [w, h]);
  useEscape(onCancel);
  const zoomTo = (nz) => {
    nz = Math.min(4, Math.max(1, nz)); const ns = s0 * nz;
    const cx = (V / 2 - pos.x) / s, cy = (V / 2 - pos.y) / s;
    setPos(clamp(V / 2 - cx * ns, V / 2 - cy * ns, ns)); setZ(nz);
  };
  const down = (e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { px: e.clientX, py: e.clientY, ...pos }; };
  const move = (e) => { const d = drag.current; if (d) setPos(clamp(d.x + e.clientX - d.px, d.y + e.clientY - d.py)); };
  const save = async () => { setBusy(true); setErr(""); try { await onDone(await exportCrop(img, { ...pos, s }, V)); } catch (x) { setErr(x.message); setBusy(false); } };
  return (
    <div className="srd-pe-layer z-[3]" role="dialog" aria-modal="true" aria-label="Crop photo">
      <div className="srd-search-backdrop" onClick={onCancel} />
      <div className="srd-pe-sheet max-w-[420px]">
        <div className="flex items-center justify-between"><h2 className="font-display text-xl tracking-display text-ink">Crop your photo</h2>
          <button type="button" onClick={onCancel} aria-label="Cancel" className="srd-pe-x"><X size={16} weight="bold" /></button></div>
        <div ref={box} className="srd-crop mt-5" onPointerDown={down} onPointerMove={move} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)}
          onWheel={(e) => pos && zoomTo(z * (e.deltaY < 0 ? 1.08 : 1 / 1.08))}>
          {pos && <img src={src.url} alt="" draggable={false} style={{ width: w * s, height: h * s, transform: `translate(${pos.x}px, ${pos.y}px)` }} />}
          <span aria-hidden="true" className="srd-crop-mask" />
        </div>
        <div className="mt-5 flex items-center gap-3 text-muted">
          <button type="button" onClick={() => zoomTo(z - 0.25)} aria-label="Zoom out" className="hover:text-ink"><MagnifyingGlassMinus size={18} /></button>
          <input type="range" min="1" max="4" step="0.01" value={z} onChange={(e) => zoomTo(+e.target.value)} aria-label="Zoom" className="srd-range flex-1" />
          <button type="button" onClick={() => zoomTo(z + 0.25)} aria-label="Zoom in" className="hover:text-ink"><MagnifyingGlassPlus size={18} /></button>
        </div>
        <p className="mt-2 text-center text-xs text-faint">Drag to reposition · scroll or use the slider to zoom</p>
        {err && <p role="alert" className="srd-pe-err mt-3">{err}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-full px-5 py-2.5 text-sm font-semibold text-muted hover:text-ink">Cancel</button>
          <button type="button" onClick={save} disabled={busy || !pos} className="pro-btn rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-canvas disabled:opacity-60">{busy ? "Saving…" : "Apply"}</button>
        </div>
      </div>
    </div>
  );
}
// Only the topmost layer reacts to Escape.
function useEscape(fn) {
  useEffect(() => { const k = (e) => { if (e.key === "Escape") { e.stopImmediatePropagation(); fn(); } }; window.addEventListener("keydown", k, true); return () => window.removeEventListener("keydown", k, true); }, [fn]);
}

export default function ProfileEditModal({ user, onClose }) {
  const [f, setF] = useState({ displayName: user.displayName || "", bio: user.bio || "" });
  const [avatar, setAvatar] = useState(user.avatar), [crop, setCrop] = useState(null), [menu, setMenu] = useState(false);
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false), [up, setUp] = useState(false);
  const file = useRef(null);
  useModal(onClose);
  useEffect(() => () => crop && URL.revokeObjectURL(crop.url), [crop]);
  const pick = async (e) => { const fl = e.target.files?.[0]; e.target.value = ""; if (!fl) return; setErr(""); try { setCrop(await loadImage(fl)); } catch (x) { setErr(x.message); } };
  const upload = async (blob) => {
    setUp(true);
    try {
      const r = await fetch("/api/auth/avatar", { method: "POST", credentials: "same-origin", headers: { "content-type": blob.type }, body: blob });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Upload failed. Please try again.");
      await api("profile", { displayName: f.displayName || user.displayName, bio: f.bio }).catch(() => {});
      setAvatar(d.user.avatar); setCrop(null);
      window.dispatchEvent(new CustomEvent("srd-user-refresh"));
    } finally { setUp(false); }
  };
  const remove = async () => { setMenu(false); setUp(true); setErr(""); try { const d = await api("avatar-remove", {}); setAvatar(d.user.avatar); } catch (x) { setErr(x.message); } finally { setUp(false); } };
  const save = async (e) => { e.preventDefault(); setBusy(true); setErr(""); try { await api("profile", f); onClose(); } catch (x) { setErr(x.message); } finally { setBusy(false); } };
  return (
    <div className="srd-pe-layer" role="dialog" aria-modal="true" aria-labelledby="pe-title">
      <div className="srd-search-backdrop" onClick={onClose} />
      <form onSubmit={save} className="srd-pe-sheet max-w-[540px]" noValidate>
        <div className="flex items-center justify-between">
          <h2 id="pe-title" className="font-display text-2xl tracking-display text-ink">Profile details</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="srd-pe-x"><X size={16} weight="bold" /></button>
        </div>
        <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <button type="button" onClick={() => (avatar ? setMenu((m) => !m) : file.current.click())} className="srd-pe-avatar" aria-label="Choose photo" aria-haspopup={avatar ? "menu" : undefined}>
              {avatar ? <Avatar user={user} src={avatar} size={180} className="!ring-0" />
                : <span className="flex h-full w-full items-center justify-center bg-sunk text-faint"><ImageSquare size={56} weight="thin" /></span>}
              <span className="srd-pe-ov"><PencilSimple size={40} weight="regular" /><span className="mt-1 text-sm font-semibold">{up ? "Uploading…" : "Choose photo"}</span></span>
              {up && <span className="srd-pe-spin" aria-hidden="true" />}
            </button>
            {menu && <div role="menu" className="srd-pe-menu">
              <button type="button" role="menuitem" onClick={() => { setMenu(false); file.current.click(); }}><ImageSquare size={16} />Change photo</button>
              <button type="button" role="menuitem" onClick={remove} className="!text-red-300"><Trash size={16} />Remove photo</button>
            </div>}
            <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} />
          </div>
          <div className="w-full min-w-0 flex-1 space-y-4">
            <label className="srd-pe-float"><input value={f.displayName} onChange={(e) => setF({ ...f, displayName: e.target.value })} maxLength={40} placeholder=" " required /><span>Name</span></label>
            <label className="srd-pe-float"><textarea rows={4} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value.slice(0, 200) })} maxLength={200} placeholder=" " /><span>Bio</span>
              <em className="absolute bottom-2 right-3 text-[11px] not-italic text-faint">{f.bio.length}/200</em></label>
          </div>
        </div>
        {err && <p role="alert" className="srd-pe-err mt-4">{err}</p>}
        <div className="mt-6 flex justify-end"><button type="submit" disabled={busy || up || !f.displayName.trim()} className="pro-btn rounded-full bg-ink px-8 py-3 text-sm font-bold text-canvas transition-transform hover:scale-[1.03] disabled:opacity-50">{busy ? "Saving…" : "Save"}</button></div>
        <p className="mt-4 text-[11px] leading-snug text-faint">By choosing a photo, you confirm you have the right to use it. Photos are cropped to a square and shown publicly on your profile.</p>
      </form>
      {crop && <CropDialog src={crop} onCancel={() => setCrop(null)} onDone={upload} />}
    </div>
  );
}
