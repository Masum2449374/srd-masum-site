// Pages advanced-mode worker. Only job: HTTP Range (206) for self-hosted audio under /audio/,
// which static Pages assets do not serve, so seeking works. Everything else goes to the assets.
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    // Short alias for the lyrics/share page.
    if (/^\/song\/koto-din-bhebechhi\/?$/.test(url.pathname)) return Response.redirect(`${url.origin}/song/koto-din-bhebechhi-cover/${url.search}`, 301);
    if (/^\/song\/pehla-pehla-pyar-cover\/?$/.test(url.pathname)) return Response.redirect(`${url.origin}/song/dekha-tenu-pehli-pehli/${url.search}`, 301);
    if (/^\/song\/laal-cover\/?$/.test(url.pathname)) return Response.redirect(`${url.origin}/song/laal-dupatta/${url.search}`, 301);
    if (/^\/song\/ayna-nadir-khate-cover\/?$/.test(url.pathname)) return Response.redirect(`${url.origin}/song/tomar-jonno-mon-kandere/${url.search}`, 301);
    if (url.pathname === "/api/visits") return visits(req, env);
    if (!url.pathname.startsWith("/audio/") || req.method !== "GET") {
      const r = await env.ASSETS.fetch(req);
      // Real 404 for unknown paths (public/404.html also disables the SPA fallback on Pages).
      if (r.status === 404 && (req.method === "GET" || req.method === "HEAD")) {
        const nf = await env.ASSETS.fetch(new Request(`${url.origin}/404.html`));
        return new Response(req.method === "HEAD" ? null : nf.body, { status: 404, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
      }
      return r;
    }
    const range = req.headers.get("range");
    const res = await env.ASSETS.fetch(new Request(url.toString(), { method: "GET" }));
    if (!res.ok) return res;
    const buf = await res.arrayBuffer();
    const size = buf.byteLength;
    const h = new Headers({
      "content-type": "audio/mpeg",
      "accept-ranges": "bytes",
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=86400",
      "etag": res.headers.get("etag") || "",
    });
    const m = range && /bytes=(\d*)-(\d*)/.exec(range);
    if (!m) { h.set("content-length", String(size)); return new Response(buf, { status: 200, headers: h }); }
    let start = m[1] === "" ? size - Number(m[2]) : Number(m[1]);
    let end = m[1] === "" || m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
    if (start >= size || start > end) { h.set("content-range", `bytes */${size}`); return new Response(null, { status: 416, headers: h }); }
    h.set("content-range", `bytes ${start}-${end}/${size}`);
    h.set("content-length", String(end - start + 1));
    return new Response(buf.slice(start, end + 1), { status: 206, headers: h });
  },
};

// Real visitor counter backed by KV (binding VISITS, key "count").
// POST counts at most once per browser per day (cookie srdv=<date>; the client also keeps a localStorage mark).
async function visits(req, env) {
  const h = { "content-type": "application/json", "cache-control": "no-store" };
  if (!env.VISITS) return new Response(JSON.stringify({ error: "no kv" }), { status: 503, headers: h });
  const read = async () => Number(String((await env.VISITS.get("count")) || "0").replace(/\D/g, "")) || 0;
  if (req.method === "GET") return new Response(JSON.stringify({ count: await read() }), { headers: h });
  if (req.method !== "POST") return new Response(null, { status: 405, headers: { ...h, allow: "GET, POST" } });
  const day = new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10); // Asia/Dhaka day
  const seen = (req.headers.get("cookie") || "").includes(`srdv=${day}`);
  let count = await read();
  if (!seen) { count += 1; await env.VISITS.put("count", String(count)); }
  const out = new Headers(h);
  if (!seen) out.append("set-cookie", `srdv=${day}; Path=/; Max-Age=93600; SameSite=Lax; Secure`);
  return new Response(JSON.stringify({ count, counted: !seen }), { headers: out });
}
