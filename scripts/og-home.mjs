// One-off generator for the home page share image (public/og/home.png, 1200x630).
import fs from "node:fs";
import sharp from "sharp";
const av = (await sharp("public/images/avatar.jpg").resize(400, 400).jpeg({ quality: 90 }).toBuffer()).toString("base64");
const F = "Noto Sans, DejaVu Sans, sans-serif";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs>
 <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#050913"/><stop offset=".55" stop-color="#081a3d"/><stop offset="1" stop-color="#0a2f78"/></linearGradient>
 <radialGradient id="glow1" cx="0.22" cy="0.5" r="0.45"><stop offset="0" stop-color="#0b6cf0" stop-opacity=".55"/><stop offset="1" stop-color="#0b6cf0" stop-opacity="0"/></radialGradient>
 <radialGradient id="glow2" cx="0.95" cy="0.05" r="0.5"><stop offset="0" stop-color="#3d8bff" stop-opacity=".35"/><stop offset="1" stop-color="#3d8bff" stop-opacity="0"/></radialGradient>
 <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fc0ff"/><stop offset="1" stop-color="#0b6cf0"/></linearGradient>
 <clipPath id="c"><circle cx="270" cy="315" r="160"/></clipPath>
</defs>
<rect width="1200" height="630" fill="url(#bg)"/><rect width="1200" height="630" fill="url(#glow1)"/><rect width="1200" height="630" fill="url(#glow2)"/>
<g opacity=".18" stroke="#5aa2ff" stroke-width="3" fill="none">${Array.from({length:7},(_,i)=>`<circle cx="270" cy="315" r="${200+i*46}"/>`).join("")}</g>
<g fill="#3d8bff" opacity=".55">${Array.from({length:34},(_,i)=>{const h=8+Math.abs(Math.sin(i*1.7)*Math.cos(i*.6))*44;return `<rect x="${540+i*13}" y="${575-h}" width="8" height="${h}" rx="4"/>`}).join("")}</g>
<circle cx="270" cy="315" r="174" fill="none" stroke="url(#ring)" stroke-width="8"/>
<image href="data:image/jpeg;base64,${av}" x="110" y="155" width="320" height="320" clip-path="url(#c)" preserveAspectRatio="xMidYMid slice"/>
<text x="540" y="215" font-family="${F}" font-size="26" font-weight="700" fill="#8fc0ff" letter-spacing="6">OFFICIAL MUSIC</text>
<text x="536" y="320" font-family="${F}" font-size="104" font-weight="800" fill="#ffffff">SRD <tspan fill="#3d8bff">Masum</tspan></text>
<rect x="540" y="350" width="110" height="8" rx="4" fill="#0b6cf0"/>
<text x="540" y="410" font-family="${F}" font-size="34" font-weight="500" fill="#d6e5ff">English · Hindi · Bangla songs</text>
<g font-family="${F}" font-size="22" font-weight="700">
 <rect x="540" y="440" width="150" height="44" rx="22" fill="#0b6cf0"/><text x="615" y="469" text-anchor="middle" fill="#fff">▶  Listen</text>
 <rect x="704" y="440" width="150" height="44" rx="22" fill="none" stroke="#8fc0ff" stroke-width="2"/><text x="779" y="469" text-anchor="middle" fill="#d6e5ff">Spotify</text>
 <rect x="868" y="440" width="150" height="44" rx="22" fill="none" stroke="#8fc0ff" stroke-width="2"/><text x="943" y="469" text-anchor="middle" fill="#d6e5ff">YouTube</text>
</g>
<text x="1160" y="600" text-anchor="end" font-family="${F}" font-size="24" fill="#a9c6f5">srdmasum.bbroot.com</text>
</svg>`;
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile("public/og/home.png");
