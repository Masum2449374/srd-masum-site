import "framer-motion"; // SSR mode: no browser effects or animation driver.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync} from 'node:fs';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AUDIO_TRACKS} from '../src/data/songs.js';
import {BANGLA_TRACKS} from '../src/data/bangla-songs.js';
import {ENGLISH_ALL} from '../src/data/english-songs.js';
import {isVerified,artistBySlug,slugify} from '../src/lib/artists.js';
const tracks=[...AUDIO_TRACKS,...BANGLA_TRACKS,...ENGLISH_ALL];
mkdirSync('node_modules/.cache',{recursive:true});
const file=new URL('../node_modules/.cache/artist-badges-test.mjs',import.meta.url);
await build({stdin:{contents:'export {PlayerProvider} from "./src/components/MiniPlayer.jsx";export {default as Card} from "./src/components/MusicCard.jsx";export {TrackList} from "./src/components/PlaylistSection.jsx";export {default as Credits} from "./src/components/CreditsPanel.jsx";export {default as Detail} from "./src/components/SongDetail.jsx";export {default as Artist} from "./src/components/ArtistPage.jsx";export {FeaturedRelease as Featured} from "./src/components/PremiumHome.jsx";',resolveDir:process.cwd()},outfile:file.pathname,bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',loader:{'.css':'empty'},define:{'import.meta.env.DEV':'false','import.meta.env.VITE_DESIGN_SANDBOX':'"0"'}});
globalThis.fetch=()=>{throw Error('No network permitted in artist render tests')};
globalThis.window={addEventListener(){},removeEventListener(){},location:new URL('https://review.invalid/'),matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}})};
globalThis.localStorage={getItem:()=>null};
globalThis.document={documentElement:{classList:{contains:()=>false}}};
const parts=await import(file.href);
const render=(C,props)=>renderToStaticMarkup(React.createElement(parts.PlayerProvider,null,React.createElement(C,props)));
const badges=html=>(html.match(/aria-label="Verified artist"/g)||[]).length;
test('Existing 23 catalog badge states are preserved, explicit unverified/new unknown/account records are not fabricated',()=>{
 assert.equal(tracks.filter(isVerified).length,23);
 for(const t of tracks)assert.equal(isVerified(t),t.verified!==false,t.id);
 assert.equal(isVerified({id:'unknown',artist:'New singer'}),false);
 assert.equal(isVerified({id:'billie-jean',artist:'Impersonator'}),false);
 assert.equal(isVerified({uploader:{verified:false},verified:true}),false);
 assert.equal(isVerified({uploader:{verified:true},verified:false}),true);
 assert.equal(isVerified(tracks.find(t=>t.id==='sajan-tumse-pyar')),false);
 for(const name of new Set(tracks.map(t=>t.artist)))assert.equal(artistBySlug(slugify(name)).verified,tracks.some(t=>t.artist===name&&isVerified(t)));
});
test('Previously omitted badges render consistently in cards, playlist rows, detail, featured releases and credits; Sajan stays unbadged',()=>{
 for(const id of ['koto-din-bhebechhi-cover','billie-jean','sajan-tumse-pyar']){
  const t=tracks.find(t=>t.id===id),n=isVerified(t)?1:0;
  for(const [name,props] of [['Card',{track:t,list:[t]}],['TrackList',{tracks:[t]}],['Detail',{id:t.id}],['Featured',{track:t,list:[t]}],['Credits',{t,onClose(){}}]])assert.equal(badges(render(parts[name],props)),n,`${name}: ${id}`);
 }
 const own=artistBySlug('srd-masum');assert.equal(badges(render(parts.Artist,{slug:'srd-masum'})),own.tracks.filter(isVerified).length+1);
 const mj=artistBySlug('michael-jackson');assert.equal(badges(render(parts.Artist,{slug:'michael-jackson'})),mj.tracks.length+1);
});
test('Static song and language pages use the same badge model; search/player existing renderers use centralized state',()=>{
 for(const t of tracks){
  const html=readFileSync(`dist/song/${t.id}/index.html`,'utf8');
  assert.equal((html.match(/<svg class="vbadge" role="img" aria-label="Verified artist"/g)||[]).length,isVerified(t)?1:0,t.id);
 }
 for(const name of ['SearchOverlay','MiniPlayer','SongList'])assert.match(readFileSync(`src/components/${name}.jsx`,'utf8'),/isVerified\(t\)/);
});
