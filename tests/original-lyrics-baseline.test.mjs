import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {build} from 'esbuild';
const root=process.cwd(),cache=path.join(root,'node_modules/.cache');
fs.mkdirSync(cache,{recursive:true});
const read=p=>fs.readFileSync(p,'utf8');
const baseline=path.join(root,'baseline/production-f9e3b91');
const absoluteImports=code=>code.replace(/from "(\.[^"]+)"/g,(_,spec)=>`from ${JSON.stringify(path.resolve(root,'src/components',spec))}`);
const readerPath=path.join(cache,'original-f9-reader.jsx');
fs.writeFileSync(readerPath,absoluteImports(read(path.join(baseline,'LyricsPanel.jsx.txt'))));
const sharePath=path.join(cache,'original-f9-share.jsx');
fs.writeFileSync(sharePath,absoluteImports(read(path.join(baseline,'ShareButton.jsx.txt'))));
const sceneSource=read('src/components/ProductionLyricsScene.jsx');
// A genuinely independent reference: original production JSX, not the new renderer copied into a snapshot.
const header=absoluteImports(sceneSource.slice(0,sceneSource.indexOf('export default function')))
 .replace(JSON.stringify(path.join(root,'src/components/LyricsPanel.jsx')),JSON.stringify(readerPath))
 .replace(JSON.stringify(path.join(root,'src/components/ProductionLyricsShare.jsx')),JSON.stringify(sharePath));
const originalScene=read(path.join(baseline,'NowPlaying.jsx.txt'))
 .replace('function NowPlaying(', 'export default function NowPlaying(')
 .replace('useState(() => desktop)', 'useState(() => true)'); // Compare the original lyrics mode, not its mobile-cover default.
const referencePath=path.join(cache,'original-f9-scene.jsx');
fs.writeFileSync(referencePath,header+originalScene);
const bundle=path.join(cache,'original-lyrics-baseline-test.mjs');
await build({stdin:{contents:`export {default as Original} from ${JSON.stringify(referencePath)};export {default as Restored} from ${JSON.stringify(path.join(root,'src/components/ProductionLyricsScene.jsx'))};export {ALL_PLAYLIST} from ${JSON.stringify(path.join(root,'src/components/PlaylistSection.jsx'))};`,resolveDir:root},outfile:bundle,bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',loader:{'.css':'empty'},define:{'import.meta.env.DEV':'false','import.meta.env.VITE_DESIGN_SANDBOX':'"0"'}});
const {Original,Restored,ALL_PLAYLIST}=await import('file://'+bundle);
let desktop=false;
globalThis.window={addEventListener(){},removeEventListener(){},location:new URL('https://review.invalid/'),matchMedia:q=>({matches:q.replace(/\s/g,'')==='(min-width:1024px)'&&desktop,addEventListener(){},removeEventListener(){}})};
globalThis.document={documentElement:{classList:{contains:()=>false}}};
globalThis.localStorage={getItem:()=>null,setItem(){}};
function normalize(html){
 return html.replace(/production-lyrics-scope production-lyrics-scene /g,'')
  .replace(/production-lyrics-scope /g,'')
  .replace(/lang="[^"]+"/g,'lang="baseline-language"')
  .replace(/animation-play-state:(?:running|paused);/g,'');
}
const fn=()=>{};
test('Restored mobile and desktop lyrics HTML matches actual f9 production for EVERY lyric-enabled song',()=>{
 const tracks=ALL_PLAYLIST.filter(t=>t.lyrics);
 assert.ok(tracks.length>=4);
 for(const isDesktop of [false,true]){
  desktop=isDesktop;
  for(const track of tracks){
   const times=track.id==='laal-dupatta'?[95,117.4]:track.id==='sajan-tumse-pyar'?[0,36.64,200]:[0,track.lyricTimes?.[0]||10];
   for(const current of times){
    const player={track,current,duration:track.duration,playing:true,shuffle:false,repeat:'off',seekTo:fn,onScrub:fn,endScrub:fn,toggleShuffle:fn,previous:fn,toggle:fn,step:fn,cycleRepeat:fn};
    const props={player,scrub:null,onClose:fn,onArtist:fn,onExitLyrics:fn};
    const expected=normalize(renderToStaticMarkup(React.createElement(Original,props)));
    const actual=normalize(renderToStaticMarkup(React.createElement(Restored,props)));
    assert.equal(actual,expected,`${track.id} at ${current}s ${desktop?'desktop':'mobile'}`);
    assert.ok(!actual.includes('<audio'),'Lyrics mode must use the existing persistent audio element');
    assert.equal(actual.includes('data-testid="np-lyrics-desk"'),isDesktop);
   }
  }
 }
 desktop=false;
});
test('Lyrics-only art background, cover and spectrum are the actual original production source',()=>{
 assert.equal(read('src/components/ProductionLyricsFX.jsx'),read(path.join(baseline,'NowPlayingFX.jsx.txt')));
});
