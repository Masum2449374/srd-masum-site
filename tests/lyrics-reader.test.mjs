import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import {build} from 'esbuild';
import {readFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {AUDIO_TRACKS} from '../src/data/songs.js';
import {parseLyrics,activeLine} from '../src/lib/lyrics.js';
mkdirSync(new URL('../node_modules/.cache',import.meta.url),{recursive:true});
const bundle=new URL('../node_modules/.cache/lyrics-reader-test.mjs',import.meta.url);
await build({entryPoints:['src/components/LyricsPanel.jsx'],outfile:bundle.pathname,bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic'});
const {default:Lyrics}=await import(bundle.href);
let reduced=false;
globalThis.window={matchMedia:()=>({matches:reduced})};
const laal=AUDIO_TRACKS.find(t=>t.id==='laal-dupatta');
const sajan=AUDIO_TRACKS.find(t=>t.id==='sajan-tumse-pyar');

test('Exact Laal music-gap intervals survive original rendering: 95s, adjacent boundaries, backwards seeks and completion',()=>{
 const rows=parseLyrics(laal.lyrics,laal.lyricTimes,laal.lyricEnds,laal.duration);
 const rowAt=t=>rows.find(r=>r.seq===activeLine(rows,t));
 assert.deepEqual([rowAt(95).t,rowAt(95).until],[89.5,117.4]);
 assert.equal(rowAt(89.499).kind,'line');
 for(const t of [95,117.399,89.5,117.249,95])assert.equal(rowAt(t).kind,'inst');
 assert.equal(rowAt(117.4).idx,22);
 for(const gap of rows.filter(r=>r.kind==='inst')){
  assert.equal(rowAt(gap.t)?.seq,gap.seq);
  assert.equal(rowAt(gap.until-.0001)?.seq,gap.seq);
  assert.notEqual(rowAt(gap.until)?.seq,gap.seq);
 }
 for(const t of [-1,NaN,Infinity,laal.duration,laal.duration+1])assert.equal(activeLine(rows,t),-1);
});
test('Unknown/invalid vocal ends cannot manufacture music breaks',()=>{
 for(const ends of [undefined,[-1,200]]){
  const rows=parseLyrics('Short\nAnother line',[2,30],ends,60);
  assert.equal(rows.filter(r=>r.kind==='inst').length,0);
  assert.equal(rows.find(r=>r.seq===activeLine(rows,20))?.idx,0);
 }
});
test('Sajan retains all 34 supplied lines and every exact uploaded-edit timestamp',()=>{
 const lines=sajan.lyrics.split('\n').filter(Boolean);
 assert.equal(lines.length,34);
 assert.equal(createHash('sha256').update(lines.join('\n')).digest('hex'),'1c2c487d61d0737138076c2950e623ca8119688f3f3c18de781a446a44acc50e');
 const evidence=JSON.parse(readFileSync('docs/sajan-lyrics-timing.json','utf8'));
 assert.equal(sajan.duration,247.536);
 for(let i=0;i<34;i++)assert.deepEqual([sajan.lyricTimes[i],sajan.lyricEnds[i]],[evidence.lines[i].start,evidence.lines[i].end]);
 const rows=parseLyrics(sajan.lyrics,sajan.lyricTimes,sajan.lyricEnds,sajan.duration);
 assert.equal(rows.find(r=>r.seq===activeLine(rows,36.639)).kind,'inst');
 assert.equal(rows.find(r=>r.seq===activeLine(rows,36.64)).idx,0);
});
test('Original notes, labels, classes and line-tap seeking are restored while active interval remains correct',()=>{
 let view;const seeks=[];
 const props=t=>({track:laal,current:t,onSeek:x=>seeks.push(x),playing:true});
 act(()=>{view=create(React.createElement(Lyrics,props(95)));});
 assert.ok(view.root.findAllByType('p').some(p=>p.children.includes('Verse 1')));
 const active=()=>view.root.findAllByType('button').filter(b=>b.props['aria-current']==='true');
 assert.equal(active().length,1);assert.equal(active()[0].props['data-inst'],'1');
 assert.equal(active()[0].findAllByType('span').filter(s=>s.children.includes('♪')).length,3);
 assert.equal(view.root.findAllByProps({className:'lyrics-music-orb'}).length,0);
 act(()=>view.update(React.createElement(Lyrics,props(117.4))));
 assert.equal(active()[0].props['data-line'],22);
 act(()=>view.root.findByProps({'data-line':22}).props.onClick());assert.deepEqual(seeks,[117.4]);
 act(()=>view.update(React.createElement(Lyrics,props(95))));assert.equal(active()[0].props['data-inst'],'1');
 act(()=>view.unmount());
});
test('Original center-scroll/manual-reading grace remains, with invisible reduced-motion/track-change safety',()=>{
 const calls=[];
 const viewport={clientHeight:400,querySelector:()=>({offsetTop:600,clientHeight:50}),scrollTo:v=>calls.push(v)};
 const realNow=Date.now;let now=10000;Date.now=()=>now;
 let view;
 try{
  act(()=>{view=create(React.createElement(Lyrics,{track:laal,current:95,onSeek:()=>{}}),{createNodeMock:e=>e.props['data-testid']==='np-lyrics-panel'?viewport:null});});
  assert.deepEqual(calls.at(-1),{top:425,behavior:'smooth'});
  act(()=>view.root.findByProps({'data-testid':'np-lyrics-panel'}).props.onWheel());
  const before=calls.length;
  act(()=>view.update(React.createElement(Lyrics,{track:laal,current:117.4,onSeek:()=>{}})));
  assert.equal(calls.length,before);
  now+=3100;reduced=true;
  act(()=>view.update(React.createElement(Lyrics,{track:laal,current:95,onSeek:()=>{}})));
  assert.equal(calls.at(-1).behavior,'auto');
  act(()=>view.update(React.createElement(Lyrics,{track:sajan,current:37,onSeek:()=>{}})));
  assert.equal(view.root.findByProps({'data-line':0}).props['aria-current'],'true');
 }finally{act(()=>view?.unmount());Date.now=realNow;reduced=false;}
});
test('Read-only lyrics remain disabled and never highlight a different recording; paused original notes freeze',()=>{
 let view;
 act(()=>{view=create(React.createElement(Lyrics,{track:laal,current:0}));});
 assert.equal(view.root.findAllByType('button').filter(b=>b.props['aria-current']==='true').length,0);
 assert.ok(view.root.findByProps({'data-line':0}).props.disabled);
 act(()=>view.update(React.createElement(Lyrics,{track:laal,current:95,onSeek:()=>{},playing:false})));
 for(const note of view.root.findAllByProps({className:'lyr-note'}))assert.equal(note.props.style.animationPlayState,'paused');
 act(()=>view.unmount());
});
