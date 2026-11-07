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
const original=read(path.join(baseline,'LyricsPanel.jsx.txt')).replace('"../lib/lyrics.js"',JSON.stringify(path.join(root,'src/lib/lyrics.js')));
const referencePath=path.join(cache,'original-f9-reader.jsx');fs.writeFileSync(referencePath,original);
const bundle=path.join(cache,'original-lyrics-baseline-test.mjs');
await build({stdin:{contents:`export {default as Original} from ${JSON.stringify(referencePath)};export {default as Restored} from ${JSON.stringify(path.join(root,'src/components/LyricsPanel.jsx'))};export {ALL_PLAYLIST} from ${JSON.stringify(path.join(root,'src/components/PlaylistSection.jsx'))};`,resolveDir:root},outfile:bundle,bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',loader:{'.css':'empty'},define:{'import.meta.env.DEV':'false','import.meta.env.VITE_DESIGN_SANDBOX':'"0"'}});
const {Original,Restored,ALL_PLAYLIST}=await import('file://'+bundle);
globalThis.window={location:new URL('https://review.invalid/')};
function normalize(html){return html.replace(/production-lyrics-scope /g,'').replace(/lang="[^"]+"/g,'lang="baseline-language"').replace(/animation-play-state:(?:running|paused);/g,'');}
test('Reader alone still matches actual original f9 production markup for every lyric-enabled recording, independently of new controls',()=>{
 const tracks=ALL_PLAYLIST.filter(t=>t.lyrics);assert.equal(tracks.length,5);
 for(const track of tracks){
  const times=track.id==='laal-dupatta'?[95,117.4]:track.id==='sajan-tumse-pyar'?[0,36.64,200]:[0,track.lyricTimes?.[0]||10];
  for(const current of times){
   const props={track,current,duration:track.duration,onSeek:()=>{},playing:true};
   assert.equal(normalize(renderToStaticMarkup(React.createElement(Restored,props))),normalize(renderToStaticMarkup(React.createElement(Original,props))),`${track.id} at ${current}s`);
  }
 }
});
test('The restored art-derived background source and original reader stylesheet were not redesigned',()=>{
 assert.equal(read('src/components/ProductionLyricsFX.jsx'),read(path.join(baseline,'NowPlayingFX.jsx.txt')));
 const shell=read('src/components/StudioNowPlaying.jsx');
 assert.match(shell,/studio-classic-lyrics-atmosphere production-lyrics-scope/);
 assert.match(shell,/<ClassicLyricsBackground src=\{art\}/);
 assert.doesNotMatch(shell,/ProductionLyricsScene|ProductionLyricsShare/);
 assert.ok(!fs.existsSync('src/components/ProductionLyricsScene.jsx'),'Retired old footer cannot accidentally be rendered');
});
