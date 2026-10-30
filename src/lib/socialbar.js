// Adsterra Social Bar: loaded once, after the page is idle, never on /admin.
const SRC = "https://bauval.org/14/fef886295cdd7b0c9ce70d9d3d07c5e3";
export function installSocialBar() {
  if (typeof window === "undefined" || window.__srdSocialBar) return;
  if (location.pathname.startsWith("/admin")) return;
  window.__srdSocialBar = true;
  const load = () => {
    const s = document.createElement("script");
    s.src = SRC; s.async = true; s.setAttribute("data-cfasync", "false");
    document.body.appendChild(s);
    guard();
  };
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1500));
  window.addEventListener("load", () => setTimeout(() => idle(load, { timeout: 4000 }), 3000), { once: true });
}

// The Social Bar injects its own fixed boxes outside #root. We can't style them by class (Adsterra
// changes names), so we watch for fixed elements outside the app and nudge any that overlap
// Mira's chat button or the mini player: up above the player, and to the left side of the screen.
function rectOf(sel) { const e = document.querySelector(sel); return e ? e.getBoundingClientRect() : null; }
function hit(a, b) { return a && b && a.width && b.width && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; }
function fix() {
  const root = document.getElementById("root");
  for (const el of document.body.children) {
    if (el === root || el.tagName === "SCRIPT" || el.dataset.srdSafe) continue;
    for (const n of [el, ...el.querySelectorAll("*")]) {
      if (getComputedStyle(n).position !== "fixed") continue;
      const r = n.getBoundingClientRect();
      if (!r.width || !r.height || r.height > window.innerHeight * 0.8) continue;
      const chat = rectOf(".srd-chat-launcher"), player = rectOf(".srd-mini-player");
      if (hit(r, chat) || hit(r, player)) {
        const lift = (player ? window.innerHeight - player.top : 0) + 12;
        if (r.top > window.innerHeight / 2) { n.style.setProperty("bottom", lift + "px", "important"); n.style.setProperty("top", "auto", "important"); }
        n.style.setProperty("left", "12px", "important"); n.style.setProperty("right", "auto", "important");
        n.style.setProperty("max-width", "calc(100vw - 150px)", "important");
      }
    }
  }
}
function guard() {
  let t; const run = () => { clearTimeout(t); t = setTimeout(fix, 150); };
  new MutationObserver(run).observe(document.body, { childList: true });
  window.addEventListener("resize", run);
  setInterval(fix, 3000);
}
