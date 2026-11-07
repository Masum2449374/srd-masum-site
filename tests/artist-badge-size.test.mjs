import 'framer-motion';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync} from 'node:fs';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
mkdirSync('node_modules/.cache',{recursive:true});
const file=new URL('../node_modules/.cache/artist-badge-size-test.mjs',import.meta.url);
await build({stdin:{contents:'export {default as Artist} from "./src/components/ArtistPage.jsx";export {PlayerProvider} from "./src/components/MiniPlayer.jsx";export {NameWithBadge} from "./src/components/VerifiedBadge.jsx";',resolveDir:process.cwd()},outfile:file.pathname,bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',loader:{'.css':'empty'},define:{'import.meta.env.DEV':'false','import.meta.env.VITE_DESIGN_SANDBOX':'"0"'}});
globalThis.window={location:new URL('https://review.invalid/'),addEventListener(){},removeEventListener(){},matchMedia:()=>({matches:false})};
globalThis.localStorage={getItem:()=>null};globalThis.document={documentElement:{classList:{contains:()=>false}}};
globalThis.fetch=()=>{throw Error('No network allowed')};
const {Artist,PlayerProvider,NameWithBadge}=await import(file.href);
test('Affected artist title uses a fixed 13px raised badge beside Yagnik, not a 26px seal or separate whitespace gap',()=>{
 const html=renderToStaticMarkup(React.createElement(PlayerProvider,null,React.createElement(Artist,{slug:'udit-narayan-alka-yagnik'})));
 const heading=html.match(/<h1 data-testid="artist-name">([\s\S]*?)<\/h1>/)?.[1];
 assert.ok(heading);
 assert.match(heading,/Udit Narayan &amp; Alka Yagn<span class="verified-name-tail">ik<svg/);
 assert.match(heading,/width="13" height="13"/);
 assert.match(heading,/verified-name-raised/);
 assert.doesNotMatch(heading,/width="26"|ml-2|align-middle/);
 assert.equal((heading.match(/aria-label="Verified artist"/g)||[]).length,1);
});
test('Long names can wrap before their short attached ending; badge cannot orphan and unverified names get no icon',()=>{
 for(const name of ['The Neighbourhood','AReallyLongUnbrokenArtistName','Very Long Artist Name']){
  const html=renderToStaticMarkup(React.createElement(NameWithBadge,{name,verified:true}));
  assert.match(html,/verified-name-tail/);
  assert.equal((html.match(/aria-label="Verified artist"/g)||[]).length,1);
  const tail=html.match(/verified-name-tail">([^<]*)<svg/)?.[1];
  assert.ok(tail.length<=2);
  assert.match(html,/width="13" height="13"/);
 }
 assert.equal(renderToStaticMarkup(React.createElement(NameWithBadge,{name:'Unverified Artist',verified:false})),'Unverified Artist');
});
test('Sizing is pixel-fixed and superscript-aligned, independent of large heading type; narrow grid item can shrink',()=>{
 const css=readFileSync('src/player-studio.css','utf8');
 const rule=css.match(/\.verified-name-raised\s*\{([^}]+)\}/)?.[1];
 for(const expected of ['width:13px','height:13px','min-width:13px','max-width:13px','min-height:13px','max-height:13px','margin-left:4px','vertical-align:super','top:-1px'])assert.ok(rule.includes(expected),expected);
 assert.doesNotMatch(rule,/\d(?:em|vw|vh|%)/);
 assert.match(css,/\.verified-name-tail \{ white-space:nowrap; \}/);
 assert.match(css,/\.studio-artist-hero > div:last-child \{ min-width:0; \}/);
});
