import { useEffect, useRef, useState } from "react";
import { UserCircle, User, PencilSimple, SignOut } from "@phosphor-icons/react";
import { useUser, signOut, openAuth } from "../lib/auth.js";
import AuthModal from "./AuthModal.jsx";
import Avatar from "./Avatar.jsx";

export default function AccountButton() {
  const user = useUser();
  const [modal, setModal] = useState(null), [menu, setMenu] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const f = (e) => setModal(e.detail || "signin"); window.addEventListener("srd-auth", f); return () => window.removeEventListener("srd-auth", f); }, []);
  useEffect(() => {
    if (!menu) return;
    const d = (e) => { if (!ref.current?.contains(e.target)) setMenu(false); }, k = (e) => e.key === "Escape" && setMenu(false);
    document.addEventListener("pointerdown", d); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("pointerdown", d); document.removeEventListener("keydown", k); };
  }, [menu]);
  return (
    <>
      {user ? (
        <div ref={ref} className="relative">
          <button type="button" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label="Account menu" className="hv2-avatar pro-btn">
            <Avatar user={user} size={34} />
          </button>
          {menu && (
            <div role="menu" className="srd-acct-menu">
              <div className="flex items-center gap-3 px-3 pb-3 pt-2">
                <Avatar user={user} size={38} />
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{user.displayName}</p><p className="truncate text-xs text-muted">@{user.username}</p></div>
              </div>
              <a role="menuitem" href={`/u/${user.username}`} className="srd-acct-item"><User size={17} />Profile</a>
              <a role="menuitem" href="/account/" className="srd-acct-item"><PencilSimple size={17} />Edit profile</a>
              <button role="menuitem" type="button" onClick={async () => { setMenu(false); await signOut(); if (/^\/account/.test(location.pathname)) location.href = "/"; }} className="srd-acct-item w-full"><SignOut size={17} />Sign out</button>
            </div>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => openAuth("signin")} aria-label="Sign in" className="hv2-signin pro-btn">
          <UserCircle size={19} weight="bold" aria-hidden="true" /><span className="srd-signin-label">Sign in</span>
        </button>
      )}
      {modal && <AuthModal mode={modal} onClose={() => setModal(null)} />}
    </>
  );
}
