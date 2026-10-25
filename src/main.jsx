import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/archivo-black/400.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

window.__srdBuild = "b8";
// PWA: register the app-shell service worker in production only.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((r) => r.update()).catch(() => {});
    fetch("/sw.js", { cache: "no-store" }).then((r) => r.text()).then((t) => { window.__srdSW = (t.match(/srd-v\d+/) || [])[0]; }).catch(() => {});
  });
  // A new worker took over: reload once so the page runs the new bundle.
  let reloaded = false;
  const hadController = !!navigator.serviceWorker.controller; // first install: no reload
  const audioBusy = () => [...document.querySelectorAll("audio")].some((a) => !a.paused);
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded || !hadController || audioBusy()) return; // never cut off a playing song
    reloaded = true; location.reload();
  });
}
