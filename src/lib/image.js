// Client-side image helpers: decode, square crop export, dominant colour.
export function loadImage(file) {
  return new Promise((res, rej) => {
    if (!file || !/^image\//.test(file.type)) return rej(new Error("Choose an image file (JPG, PNG or WebP)."));
    if (file.size > 25 * 1024 * 1024) return rej(new Error("That image is too large. Pick one under 25 MB."));
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => res({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("This image format isn't supported. Try a JPG or PNG.")); };
    img.src = url;
  });
}
const toBlob = (c, type, q) => new Promise((r) => c.toBlob(r, type, q));
// view: { x, y, s } in viewport px (V). Returns a 512px square Blob, WebP when possible (JPEG fallback), aimed under 200 KB.
export async function exportCrop(img, view, V, out = 512) {
  const c = document.createElement("canvas"); c.width = c.height = out;
  const g = c.getContext("2d"); g.imageSmoothingQuality = "high";
  const k = out / V;
  g.fillStyle = "#000"; g.fillRect(0, 0, out, out);
  g.drawImage(img, view.x * k, view.y * k, img.naturalWidth * view.s * k, img.naturalHeight * view.s * k);
  for (const q of [0.86, 0.74, 0.6, 0.45]) {
    let b = await toBlob(c, "image/webp", q);
    if (!b || b.type !== "image/webp") b = await toBlob(c, "image/jpeg", q);
    if (b && (b.size < 200 * 1024 || q === 0.45)) return b;
  }
  throw new Error("Couldn't process this image.");
}
// Average of the more saturated pixels -> "r, g, b" string, or null.
export function dominantColor(src) {
  return new Promise((res) => {
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas"); c.width = c.height = 24;
        const g = c.getContext("2d"); g.drawImage(img, 0, 0, 24, 24);
        const d = g.getImageData(0, 0, 24, 24).data; let r = 0, gg = 0, b = 0, w = 0;
        for (let i = 0; i < d.length; i += 4) {
          const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
          const wt = 0.15 + (mx ? (mx - mn) / mx : 0) * (mx > 40 && mx < 245 ? 1 : 0.2);
          r += d[i] * wt; gg += d[i + 1] * wt; b += d[i + 2] * wt; w += wt;
        }
        let [R, G, B] = [r / w, gg / w, b / w];
        const L = 0.2126 * R + 0.7152 * G + 0.0722 * B; // keep it mid-tone so white text stays readable
        const f = L > 150 ? 150 / L : L < 60 ? 60 / Math.max(L, 1) : 1;
        [R, G, B] = [R, G, B].map((v) => Math.round(Math.min(255, v * f)));
        res(`${R}, ${G}, ${B}`);
      } catch { res(null); }
    };
    img.onerror = () => res(null); img.src = src;
  });
}
