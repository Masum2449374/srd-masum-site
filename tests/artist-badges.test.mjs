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
import {isVerified,artistBySlug,slugify,artistOf,isArtistVerified} from '../src/lib/artists.js';
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
test('Track badges follow the credited artist\'s existing catalog status, not an isolated per-track flag',()=>{
 assert.equal(tracks.filter(isVerified).length,24);
 const sajan=tracks.find(t=>t.id==='sajan-tumse-pyar');
 const laal=tracks.find(t=>t.id==='laal-dupatta');
 assert.equal(sajan.verified,false);
 assert.equal(laal.verified,undefined);
 assert.equal(artistOf(sajan),artistOf(laal));
 assert.equal(isArtistVerified('Udit Narayan & Alka Yagnik'),true);
 assert.equal(isVerified(sajan),true);
 assert.equal(isVerified(laal),true);
 for(const t of tracks)assert.equal(isVerified(t),isArtistVerified(artistOf(t)),t.id);
 assert.equal(isVerified({id:'unknown',artist:'New singer'}),false);
 assert.equal(isArtistVerified('New singer'),false);
 assert.equal(isVerified({id:'billie-jean',artist:'Impersonator'}),false);
 assert.equal(isVerified({uploader:{verified:false},verified:true}),false);
 assert.equal(isVerified({uploader:{verified:true},verified:false}),true);
 for(const name of new Set(tracks.map(t=>t.artist)))assert.equal(artistBySlug(slugify(name)).verified,isArtistVerified(name));
});
test('Verified artist names render a small badge on cards, playlists, detail, featured, credits and artist rows, including Sajan',()=>{
 for(const id of ['koto-din-bhebechhi-cover','billie-jean','sajan-tumse-pyar','laal-dupatta']){
  const t=tracks.find(t=>t.id===id);
  for(const [name,props] of [['Card',{track:t,list:[t]}],['TrackList',{tracks:[t]}],['Detail',{id:t.id}],['Featured',{track:t,list:[t]}],['Credits',{t,onClose(){}}]]){
   const html=render(parts[name],props);
   assert.equal(badges(html),1,`${name}: ${id}`);
   assert.match(html,/width="1[2346]" height="1[2346]"/);
  }
 }
 const duo=artistBySlug('udit-narayan-alka-yagnik');
 assert.equal(duo.tracks.length,2);
 assert.equal(badges(render(parts.Artist,{slug:'udit-narayan-alka-yagnik'})),duo.tracks.length+1);
 const own=artistBySlug('srd-masum');assert.equal(badges(render(parts.Artist,{slug:'srd-masum'})),own.tracks.length+1);
 const mj=artistBySlug('michael-jackson');assert.equal(badges(render(parts.Artist,{slug:'michael-jackson'})),mj.tracks.length+1);
});
test('Static song and language pages use the same badge model; search/player existing renderers use centralized state',()=>{
 for(const t of tracks){
  const html=readFileSync(`dist/song/${t.id}/index.html`,'utf8');
  assert.equal((html.match(/<svg class="vbadge" role="img" aria-label="Verified artist"/g)||[]).length,isVerified(t)?1:0,t.id);
 }
 for(const name of ['SearchOverlay','MiniPlayer','SongList'])assert.match(readFileSync(`src/components/${name}.jsx`,'utf8'),/isVerified\(t\)/);
 for(const [file,needle] of [
  ['ArtistCredit.jsx','isVerified(track)'],
  ['MusicCard.jsx','<ArtistCredit track={track}'],
  ['PlaylistSection.jsx','<ArtistCredit track={t}'],
  ['SongDetail.jsx','<ArtistCredit track={track}'],
  ['CreditsPanel.jsx','<ArtistCredit track={t}'],
  ['StudioNowPlaying.jsx','<ArtistCredit track={t}'],
  ['PremiumHome.jsx','<ArtistCredit track={track}'],
  ['LanguagePlaylists.jsx','TrackList'],
  ['EnglishPage.jsx','TrackList']
 ])assert.ok(readFileSync(`src/components/${file}`,'utf8').includes(needle),file);
});
