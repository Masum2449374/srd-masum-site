import 'framer-motion';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync} from 'node:fs';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
mkdirSync('node_modules/.cache',{recursive:true});
const file=new URL('../node_modules/.cache/artist-badge-size-test.mjs',import.meta.url);
await build({stdin:{contents:'export {default as Artist} from "./src/components/ArtistPage.jsx";export {PlayerProvider} from "./src/components/MiniPlayer.jsx";',resolveDir:process.cwd()},outfile:file.pathname,bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',loader:{'.css':'empty'},define:{'import.meta.env.DEV':'false','import.meta.env.VITE_DESIGN_SANDBOX':'"0"'}});
globalThis.window={location:new URL('https://review.invalid/'),addEventListener(){},removeEventListener(){},matchMedia:()=>({matches:false})};
globalThis.localStorage={getItem:()=>null};globalThis.document={documentElement:{classList:{contains:()=>false}}};
globalThis.fetch=()=>{throw Error('No network allowed')};
const {Artist,PlayerProvider}=await import(file.href);
function render(slug){return renderToStaticMarkup(React.createElement(PlayerProvider,null,React.createElement(Artist,{slug})));}
test('Actual original source puts 14px badge + Verified Artist in a separate row BEFORE h1, not beside its last word',()=>{
 const baseline=readFileSync('baseline/production-f9e3b91/ArtistPage.jsx.txt','utf8');
 assert.match(baseline,/<p className="inline-flex items-center gap-1\.5 text-sm font-semibold"><VerifiedBadge size=\{14\} \/>Verified Artist<\/p>\s*<h1 data-testid="artist-name"/);
 const source=readFileSync('src/components/ArtistPage.jsx','utf8');
 assert.match(source,/<VerifiedBadge size=\{14\} \/>Verified Artist<\/p>/);
 assert.ok(source.indexOf('data-testid="artist-verification"')<source.indexOf('data-testid="artist-name"'));
 assert.doesNotMatch(source,/NameWithBadge|verified-name-raised|size=\{26\}/);
});
test('Every affected verified artist renders one small upper label and an entirely plain wrappable title',()=>{
 for(const [slug,name] of [['udit-narayan-alka-yagnik','Udit Narayan &amp; Alka Yagnik'],['the-neighbourhood','The Neighbourhood'],['srd-masum','SRD Masum']]){
  const html=render(slug);
  const row=html.match(/<p data-testid="artist-verification"[\s\S]*?<\/p>/)?.[0];
  assert.ok(row,slug);assert.match(row,/width="14" height="14"/);assert.match(row,/>Verified Artist<\/p>/);
  assert.equal((row.match(/aria-label="Verified artist"/g)||[]).length,1);
  assert.ok(html.indexOf(row)<html.indexOf('data-testid="artist-name"'));
  const heading=html.match(/<h1 data-testid="artist-name">([\s\S]*?)<\/h1>/)?.[1];
  assert.equal(heading,name);assert.doesNotMatch(heading,/<svg|nowrap|sup/);
 }
});
test('Original upper label remains fixed 14px while narrow titles retain their existing independent wrap behavior',()=>{
 const css=readFileSync('src/player-studio.css','utf8');
 assert.match(css,/\.artist-verification-label \{[\s\S]*?display:inline-flex; align-items:center; gap:6px;[\s\S]*?font-size:14px; font-weight:600; line-height:20px;/);
 assert.match(css,/\.artist-verification-label > \.srd-verified \{[\s\S]*?width:14px; height:14px; min-width:14px; max-width:14px;/);
 assert.doesNotMatch(css,/verified-name-raised|verified-name-tail/);
 assert.match(css,/\.studio-artist-hero > div:last-child \{ min-width:0; \}/);
 assert.match(readFileSync('src/studio.css','utf8'),/\.studio-artist-hero h1 \{[^}]*overflow-wrap: anywhere;/);
});
