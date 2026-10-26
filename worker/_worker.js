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
    if (url.pathname === "/.well-known/assetlinks.json") return new Response(JSON.stringify([{relation:["delegate_permission/common.handle_all_urls"],target:{namespace:"android_app",package_name:"com.bbroot.srdmasum",sha256_cert_fingerprints:["CB:C3:8E:CE:0C:34:90:39:D1:A6:2D:30:B9:30:43:E2:39:B9:59:DC:66:D1:C8:3C:C0:43:5C:39:44:44:6C:34"]}}]), { headers: { "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": "public, max-age=3600" } });
    if (url.pathname === "/api/visits") return visits(req, env);
    if (url.pathname === "/api/chat") return chat(req, env, url);
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

// ---- /api/chat: site assistant proxied to BenPay (OpenAI-compatible). Key lives only in env.BENPAY_API_KEY.
const CHAT_MODELS = ["deepseek-v4.1-flash", "qwen-flash"];
const RL = new Map(); // per-isolate, per-IP: { t: windowStart, n }
let CTX = null, CTX_AT = 0;
async function chat(req, env, url) {
  const h = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
  const out = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: h });
  if (req.method !== "POST") return out({ error: "POST only" }, 405);
  const origin = req.headers.get("origin");
  if (origin && origin !== url.origin) return out({ error: "forbidden" }, 403);
  if (!env.BENPAY_API_KEY) return out({ error: "chat unavailable" }, 503);
  const ip = req.headers.get("cf-connecting-ip") || "0";
  const now = Date.now(), r = RL.get(ip);
  if (!r || now - r.t > 60000) RL.set(ip, { t: now, n: 1 });
  else if (++r.n > 8) return out({ error: "rate", reply: "Too many messages — please wait a minute. 🙏" }, 429);
  if (RL.size > 5000) RL.clear();
  let body;
  try { body = await req.json(); } catch { return out({ error: "bad json" }, 400); }
  const msgs = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-8).map((m) => ({ role: m.role, content: m.content.slice(0, 500) }));
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return out({ error: "no message" }, 400);
  if (!CTX || now - CTX_AT > 600000) {
    try { const c = await env.ASSETS.fetch(new Request(`${url.origin}/chat-context.txt`)); if (c.ok) { CTX = await c.text(); CTX_AT = now; } } catch {}
  }
  const system = `You are the friendly assistant on the SRD Masum music website. Your main job is SRD Masum, his music, the songs on this site, their credited artists, and how to use the site (player, playlists, videos, fan wall, installing the app, contact). You may also answer general friendly questions (music, general knowledge, small talk) briefly, and when relevant gently suggest a song from the site. Refuse anything harmful or adult.
Rules:
- Reply in the visitor's language (Bangla in Bangla script, Hindi, or English; match Banglish/Hinglish if they use it).
- Be short: 1-3 sentences, warm, a light emoji is fine.
- Never write, quote or paraphrase song lyrics (not even one line); say lyrics aren't available here and suggest listening on the site or official links.
- Credit performers exactly as listed; songs by other artists are covers/featured on the site — never claim SRD Masum wrote or originally sang them.
- Links: use only URLs that appear in SITE DATA. Never type any other URL yourself.
- If someone wants a song/video that is NOT in SITE DATA, say it isn't on this site yet and write the marker [[search: <song title and artist if known>]] on its own line; the site turns it into YouTube and Spotify search links. Never guess a direct link. If they ask whether it's on YouTube/Spotify, you can't confirm, so give the marker again.
- If unsure about a fact, say so; for site questions suggest the contact email.
- Plain text only (no markdown tables/headings/bold); put links as bare URLs.
SITE DATA:
${CTX || "Site: SRD Masum (https://srdmasum.bbroot.com). Spotify: https://open.spotify.com/artist/267kT30bpgEoiGFawat8k6 YouTube: https://youtube.com/@srdmasum"}`;
  let why = "";
  for (const model of CHAT_MODELS) {
    try {
      const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 20000);
      const res = await fetch("https://api.benpay.ai/openai/v1/chat/completions", {
        method: "POST", signal: ctl.signal,
        headers: { authorization: `Bearer ${env.BENPAY_API_KEY}`, "content-type": "application/json", accept: "application/json", "user-agent": "srd-masum-site/1.0" },
        body: JSON.stringify({ model, max_tokens: 300, temperature: 0.4, messages: [{ role: "system", content: system }, ...msgs] }),
      });
      clearTimeout(tm);
      if (!res.ok) { why += `${model}:${res.status} `; continue; }
      const d = await res.json();
      let reply = d?.choices?.[0]?.message?.content?.trim();
      if (reply) reply = reply.replace(/\*\*/g, "").replace(/\[\[\s*search:\s*([^\]]{1,120})\]\]/gi, (_, q) => {
        const e = encodeURIComponent(q.trim());
        return `YouTube: https://www.youtube.com/results?search_query=${e}\nSpotify: https://open.spotify.com/search/${e}`;
      });
      if (reply) return out({ reply: reply.slice(0, 1500), model });
    } catch (e) { why += `${model}:${e?.name || "err"} `; }
  }
  return out({ error: "upstream", why: why.trim(), reply: "Sorry, I can't answer right now — please try again soon." }, 502);
}
