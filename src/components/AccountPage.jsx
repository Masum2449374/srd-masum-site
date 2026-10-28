import { useEffect } from "react";
import { useUser, openAuth } from "../lib/auth.js";
import ProfilePage from "./ProfilePage.jsx";

// /account/ = your own profile with "Profile details" open.
export default function AccountPage() {
  const user = useUser();
  useEffect(() => { document.title = "Edit profile · SRD Masum"; }, []);
  if (user === undefined) return <div className="min-h-[60vh]" />;
  if (!user) return (
    <div className="mx-auto max-w-md px-5 pb-24 pt-32 text-center sm:pt-40">
      <h1 className="font-display text-3xl tracking-display text-ink">Sign in to edit your profile</h1>
      <button type="button" onClick={() => openAuth("signin")} className="pro-btn mt-8 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-on-accent">Sign in</button>
    </div>
  );
  return <ProfilePage username={user.username} edit />;
}
