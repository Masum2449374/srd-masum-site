import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import {build} from 'esbuild';
import {readFileSync,mkdirSync} from 'node:fs';
import {lyricScrollTarget} from '../src/lib/lyric-scroll.js';
mkdirSync(new URL('../node_modules/.cache',import.meta.url),{recursive:true});
const bundle=new URL('../node_modules/.cache/lyrics-reader-test.mjs',import.meta.url);
await build({entryPoints:['src/components/LyricsPanel.jsx'],outfile:bundle.pathname,bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic'});
const {default:Lyrics}=await import(bundle.href);
let reduced=false;
globalThis.window={matchMedia:()=>({matches:reduced})};
const track={id:'reader-test',title:'Reader test',lyrics:'First line\nSecond line',lyricTimes:[10,20],lyricEnds:[13,23],duration:40};
test('Lyrics scrolling uses reader-relative geometry and clamps intro/outro without viewport-sized empty space',()=>{
 const viewport={scrollTop:200,clientHeight:500,scrollHeight:2000,getBoundingClientRect:()=>({top:550})};
 const line={clientHeight:50,getBoundingClientRect:()=>({top:900})};
 assert.equal(lyricScrollTarget(viewport,line),325);
 assert.equal(lyricScrollTarget({...viewport,scrollTop:0},{...line,getBoundingClientRect:()=>({top:550})}),0);
 assert.equal(lyricScrollTarget({...viewport,scrollTop:1490},line),1500);
});
test('Manual reading pauses auto-follow; resume and timed-line taps retain exact seeking; reduced motion is respected',()=>{
 const calls=[],seeks=[];
 const viewport={scrollTop:0,clientHeight:400,scrollHeight:1200,getBoundingClientRect:()=>({top:100}),querySelector:()=>({clientHeight:50,getBoundingClientRect:()=>({top:400})}),scrollTo:(v)=>calls.push(v)};
 let view;
 act(()=>{view=create(React.createElement(Lyrics,{track,current:10,onSeek:t=>seeks.push(t)}),{createNodeMock:e=>e.props['data-testid']==='np-lyrics-panel'?viewport:null});});
 assert.equal(calls.at(-1).behavior,'smooth');
 assert.equal(view.root.findAllByProps({className:'lyrics-reader-footer'}).length,0,'No persistent footer branding in the classic reader');
 act(()=>view.root.findByProps({'data-testid':'np-lyrics-panel'}).props.onWheel());
 const before=calls.length;
 act(()=>view.update(React.createElement(Lyrics,{track,current:20,onSeek:t=>seeks.push(t)})));
 assert.equal(calls.length,before);
 const resume=view.root.findAllByType('button').find(b=>b.children.includes('Resume sync '));
 assert.ok(resume);
 reduced=true;
 act(()=>resume.props.onClick());
 assert.ok(calls.length>before);
 assert.equal(calls.at(-1).behavior,'auto');
 act(()=>view.root.findByProps({'data-line':0}).props.onClick());
 assert.deepEqual(seeks,[10]);
 act(()=>view.unmount());
 reduced=false;
});
test('All scripts retain legible reader semantics and disabled seeking when that song is not playing',()=>{
 for(const [lyrics,lang] of [['হৃদয়','bn'],['दिल','hi'],['Hello','en'],['Привет','ru']]){
  let view; act(()=>{view=create(React.createElement(Lyrics,{track:{...track,lyrics,lyricTimes:[10],lyricEnds:[12]},current:10}));});
  const box=view.root.findByProps({'data-testid':'np-lyrics-panel'});
  assert.equal(box.props.lang,lang);
  assert.equal(box.props.role,'region');
  assert.equal(view.root.findByProps({'data-line':0}).props.disabled,true);
  act(()=>view.unmount());
 }
});
test('Lyrics-focused chrome stays compact and Listening no longer inserts its caption or a growing cover-stage gap',()=>{
 const component=readFileSync('src/components/StudioNowPlaying.jsx','utf8');
 const reader=readFileSync('src/components/LyricsPanel.jsx','utf8');
 const css=readFileSync('src/player-studio.css','utf8');
 assert.doesNotMatch(component,/Feel every line|IN THE MOMENT|TAKE A MOMENT|studio-spectrum-caption/);
 assert.match(component,/data-view=\{view\}/);
 assert.doesNotMatch(reader,/30vh|maskImage|text-ink\/35|scale-110/);
 assert.match(css,/\[data-view="cover"\] \.studio-player-stage[^\{]*\{ flex:0 1 auto; min-height:0;/);
 assert.match(css,/\.studio-player-v2\.is-lyrics-focused \.studio-player-controls \.studio-player-primary/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(css,/border-left-color: var\(--studio-mint\)/);
});

test('Sajan has exactly the 34 supplied lines, real bounded timings, repeats, gaps and working active-line integration',async()=>{
 const {AUDIO_TRACKS}=await import('../src/data/songs.js');
 const {parseLyrics,activeLine}=await import('../src/lib/lyrics.js');
 const {createHash}=await import('node:crypto');
 const t=AUDIO_TRACKS.find(t=>t.id==='sajan-tumse-pyar');
 const evidence=JSON.parse(readFileSync('docs/sajan-lyrics-timing.json','utf8'));
 const lines=t.lyrics.split('\n').filter(Boolean);
 assert.equal(lines.length,34);
 assert.equal(createHash('sha256').update(lines.join('\n')).digest('hex'),'1c2c487d61d0737138076c2950e623ca8119688f3f3c18de781a446a44acc50e');
 assert.equal(t.duration,247.536);
 assert.equal(t.lyricsLang,'hi-Latn');
 assert.equal(t.lyricTimes.length,34);assert.equal(t.lyricEnds.length,34);
 for(let i=0;i<34;i++){
  assert.ok(t.lyricTimes[i]>=0&&t.lyricTimes[i]<t.lyricEnds[i]&&t.lyricEnds[i]<=t.duration);
  if(i<33)assert.ok(t.lyricEnds[i]<=t.lyricTimes[i+1]);
  assert.deepEqual([t.lyricTimes[i],t.lyricEnds[i]],[evidence.lines[i].start,evidence.lines[i].end]);
 }
 assert.deepEqual(t.lyricTimes.slice(0,5),[36.64,41.9,47.3,52.54,57.74]);
 assert.deepEqual(t.lyricTimes.slice(28),[203.34,209.06,214.3,219.44,224.56,229.8]);
 const rows=parseLyrics(t.lyrics,t.lyricTimes,t.lyricEnds,t.duration);
 assert.deepEqual(rows.filter(r=>r.kind==='inst').map(r=>[r.t,r.until]),[[0,36.64],[88.58,108.98],[145.9,166.56],[234.6,247.536]]);
 for(const [time,index] of [[37,0],[42,1],[204,28],[230,33]]){
  assert.equal(rows.find(r=>r.seq===activeLine(rows,time))?.idx,index);
 }
 assert.equal(rows.find(r=>r.seq===activeLine(rows,240))?.kind,'inst');
 let view;act(()=>{view=create(React.createElement(Lyrics,{track:t,current:42,onSeek:()=>{}}));});
 assert.equal(view.root.findByProps({'data-testid':'np-lyrics-panel'}).props.lang,'hi-Latn');
 assert.equal(view.root.findByProps({'data-line':1}).props['aria-current'],'true');
 act(()=>view.unmount());
});
