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
 assert.equal(calls.at(-1).behavior,'auto');
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

test('Laal Dupatta at 95s is a real configured break; its start/end and completion use exact half-open intervals',async()=>{
 const {AUDIO_TRACKS}=await import('../src/data/songs.js');
 const {parseLyrics,activeLine}=await import('../src/lib/lyrics.js');
 const t=AUDIO_TRACKS.find(t=>t.id==='laal-dupatta');
 const rows=parseLyrics(t.lyrics,t.lyricTimes,t.lyricEnds,t.duration);
 const rowAt=time=>rows.find(r=>r.seq===activeLine(rows,time));
 assert.deepEqual([rowAt(95).t,rowAt(95).until],[89.5,117.4]);
 assert.equal(rowAt(89.499).kind,'line');
 for(const time of [89.5,95,117.249,117.399])assert.equal(rowAt(time).kind,'inst',String(time));
 assert.equal(rowAt(117.4).idx,22);
 for(const gap of rows.filter(r=>r.kind==='inst')){
  assert.equal(rowAt(gap.t)?.seq,gap.seq);
  assert.equal(rowAt(gap.until-.0001)?.seq,gap.seq);
  assert.notEqual(rowAt(gap.until)?.seq,gap.seq);
 }
 for(const time of [-1,NaN,Infinity,t.duration,t.duration+1])assert.equal(activeLine(rows,time),-1);
});

test('No instrumental gaps are manufactured from text length or invalid vocal ends',async()=>{
 const {parseLyrics,activeLine}=await import('../src/lib/lyrics.js');
 const plain=parseLyrics('Short\nAnother line',[2,30],undefined,60);
 assert.equal(plain.filter(r=>r.kind==='inst').length,0);
 assert.equal(plain.find(r=>r.seq===activeLine(plain,20))?.idx,0);
 assert.equal(activeLine(plain,60),-1);
 const invalid=parseLyrics('Short\nAnother line',[2,30],[-1,200],60);
 assert.equal(invalid.filter(r=>r.kind==='inst').length,0);
 const known=parseLyrics('Short\nAnother line',[2,30],[5,null],60);
 assert.deepEqual(known.filter(r=>r.kind==='inst').map(r=>[r.t,r.until]),[[5,30]]);
});

test('Only the currently timed break cue renders; headings and inactive gap markers stay absent through repeated seeks and track switches',async()=>{
 const {AUDIO_TRACKS}=await import('../src/data/songs.js');
 const {parseLyrics,activeLine}=await import('../src/lib/lyrics.js');
 const t=AUDIO_TRACKS.find(t=>t.id==='laal-dupatta');
 const rows=parseLyrics(t.lyrics,t.lyricTimes,t.lyricEnds,t.duration);
 const seeks=[];let view;
 act(()=>{view=create(React.createElement(Lyrics,{track:t,current:95,onSeek:x=>seeks.push(x)}));});
 for(const current of [95,88,117.249,117.4,95,202,27.69,27.7,t.duration,95]){
  act(()=>view.update(React.createElement(Lyrics,{track:t,current,onSeek:x=>seeks.push(x)})));
  const active=rows.find(r=>r.seq===activeLine(rows,current));
  assert.equal(view.root.findAllByProps({'data-inst':'1'}).length,active?.kind==='inst'?1:0,String(current));
  assert.equal(view.root.findAllByProps({className:'lyrics-section-label'}).length,0);
  assert.equal(view.root.findAllByProps({className:'lyrics-interlude-bars'}).length,0);
  assert.equal(view.root.findAllByType('button').filter(b=>b.props['aria-current']==='true').length,active?1:0);
 }
 act(()=>view.root.findByProps({'data-line':22}).props.onClick());
 assert.deepEqual(seeks,[117.4]);
 const sajan=AUDIO_TRACKS.find(t=>t.id==='sajan-tumse-pyar');
 act(()=>view.update(React.createElement(Lyrics,{track:sajan,current:42,onSeek:x=>seeks.push(x)})));
 assert.equal(view.root.findAllByProps({'data-inst':'1'}).length,0);
 assert.equal(view.root.findByProps({'data-line':1}).props['aria-current'],'true');
 assert.equal(view.root.findAllByProps({className:'lyrics-section-label'}).length,0);
 act(()=>view.unmount());
});

test('Opening and seeks land directly at the right row, continuous transitions scroll smoothly, manual reading remains respected',async()=>{
 const {AUDIO_TRACKS}=await import('../src/data/songs.js');
 const t=AUDIO_TRACKS.find(t=>t.id==='laal-dupatta');
 const calls=[],queries=[];
 const viewport={scrollTop:0,clientHeight:500,scrollHeight:3000,getBoundingClientRect:()=>({top:100}),querySelector:q=>{queries.push(q);return {clientHeight:50,getBoundingClientRect:()=>({top:500})}},scrollTo:v=>calls.push(v)};
 let view;
 const props=current=>({track:t,current,onSeek:()=>{}});
 act(()=>{view=create(React.createElement(Lyrics,props(95)),{createNodeMock:e=>e.props['data-testid']==='np-lyrics-panel'?viewport:null});});
 assert.equal(calls.at(-1).behavior,'auto');
 const initial=calls.length;
 act(()=>view.update(React.createElement(Lyrics,props(95.25))));
 assert.equal(calls.length,initial,'No continuous scroll jitter inside one break');
 act(()=>view.update(React.createElement(Lyrics,props(117.35))));
 assert.equal(calls.at(-1).behavior,'auto');
 const gapQuery=queries.at(-1);
 act(()=>view.update(React.createElement(Lyrics,props(117.4))));
 assert.equal(calls.at(-1).behavior,'smooth');
 assert.notEqual(queries.at(-1),gapQuery);
 act(()=>view.update(React.createElement(Lyrics,props(95))));
 assert.equal(calls.at(-1).behavior,'auto');
 assert.equal(queries.at(-1),gapQuery);
 act(()=>view.root.findByProps({'data-testid':'np-lyrics-panel'}).props.onWheel());
 const manual=calls.length;
 act(()=>view.update(React.createElement(Lyrics,props(118))));
 assert.equal(calls.length,manual);
 act(()=>view.root.findByProps({'data-line':22}).props.onClick());
 assert.ok(calls.length>manual);
 act(()=>view.unmount());
});

test('Inactive song details never pretend their intro is playing; activating the same recording enables its correct cue and seek',async()=>{
 const {AUDIO_TRACKS}=await import('../src/data/songs.js');
 const t=AUDIO_TRACKS.find(t=>t.id==='laal-dupatta');
 let view;
 act(()=>{view=create(React.createElement(Lyrics,{track:t,current:0}));});
 assert.equal(view.root.findAllByProps({'data-inst':'1'}).length,0);
 assert.equal(view.root.findAllByType('button').filter(b=>b.props['aria-current']==='true').length,0);
 act(()=>view.root.findByProps({'data-testid':'np-lyrics-panel'}).props.onWheel());
 assert.equal(view.root.findAllByProps({className:'lyrics-reader-footer'}).length,0);
 act(()=>view.update(React.createElement(Lyrics,{track:t,current:95,onSeek:()=>{}})));
 assert.equal(view.root.findAllByProps({'data-inst':'1'}).length,1);
 assert.equal(view.root.findByProps({'data-inst':'1'}).props['aria-label'],'Instrumental break');
 act(()=>view.update(React.createElement(Lyrics,{track:t,current:0})));
 assert.equal(view.root.findAllByProps({'data-inst':'1'}).length,0);
 assert.equal(view.root.findAllByType('button').filter(b=>b.props['aria-current']==='true').length,0);
 act(()=>view.unmount());
});

test('Visible music-note SVG obeys Laal 95s gap, pause, exact vocal onset, backward seeks and Sajan intro boundary',async()=>{
 const {AUDIO_TRACKS}=await import('../src/data/songs.js');
 const laal=AUDIO_TRACKS.find(t=>t.id==='laal-dupatta');
 const sajan=AUDIO_TRACKS.find(t=>t.id==='sajan-tumse-pyar');
 const props=(track,current,playing)=>({track,current,playing,onSeek:()=>{}});
 let view;
 act(()=>{view=create(React.createElement(Lyrics,props(laal,95,true)));});
 const icon=()=>view.root.findAllByType('svg');
 assert.equal(icon().length,1);
 assert.equal(icon()[0].props.width,38);
 assert.ok(view.root.findAllByType('path').length>=1,'A genuine SVG note, not tiny text glyphs');
 assert.equal(view.root.findByProps({className:'lyrics-reader'}).props['data-playing'],'true');
 act(()=>view.update(React.createElement(Lyrics,props(laal,95,false))));
 assert.equal(icon().length,1,'Pausing retains the correct static music icon');
 assert.equal(view.root.findByProps({className:'lyrics-reader'}).props['data-playing'],'false');
 act(()=>view.update(React.createElement(Lyrics,props(laal,117.399,false))));
 assert.equal(icon().length,1);
 act(()=>view.update(React.createElement(Lyrics,props(laal,117.4,true))));
 assert.equal(icon().length,0);
 assert.equal(view.root.findByProps({'data-line':22}).props['aria-current'],'true');
 const activeText=view.root.findByProps({'data-line':22}).findByProps({className:'lyrics-line-text'});
 assert.equal(activeText.children.length,1,'Whole-line focus only, not fabricated word karaoke');
 act(()=>view.update(React.createElement(Lyrics,props(laal,95,true))));
 assert.equal(icon().length,1);
 act(()=>view.update(React.createElement(Lyrics,props(sajan,36.639,true))));
 assert.equal(icon().length,1);
 act(()=>view.update(React.createElement(Lyrics,props(sajan,36.64,true))));
 assert.equal(icon().length,0);
 assert.equal(view.root.findByProps({'data-line':0}).props['aria-current'],'true');
 assert.equal(view.root.findAllByProps({className:'lyrics-section-label'}).length,0);
 act(()=>view.unmount());
});
