import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync} from 'node:fs';
import {build} from 'esbuild';
import React from 'react';
import {act,create} from 'react-test-renderer';
mkdirSync('node_modules/.cache',{recursive:true});
const file=new URL('../node_modules/.cache/player-reader-split-test.mjs',import.meta.url);
const motionStub=`import React from 'react';
 const Div=React.forwardRef(function TestMotion({initial,animate,exit,transition,drag,dragControls,dragListener,dragConstraints,dragElastic,onDragEnd,...props},ref){return React.createElement('div',{...props,ref});});
 export const motion={div:Div,section:Div}; export const AnimatePresence=({children})=>children;export const useReducedMotion=()=>false;export const useDragControls=()=>({start(){}});`;
await build({stdin:{contents:'export {default as Player} from "./src/components/StudioNowPlaying.jsx";export {ALL_PLAYLIST} from "./src/components/PlaylistSection.jsx";',resolveDir:process.cwd()},outfile:file.pathname,bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',loader:{'.css':'empty'},define:{'import.meta.env.DEV':'false','import.meta.env.VITE_DESIGN_SANDBOX':'"0"'},plugins:[{name:'component-only-motion-stub',setup(b){b.onResolve({filter:/^framer-motion$/},()=>({path:'motion',namespace:'component-test'}));b.onLoad({filter:/.*/,namespace:'component-test'},()=>({contents:motionStub,loader:'js',resolveDir:process.cwd()}));}}]});
let desktop=false;
globalThis.window={location:new URL('https://review.invalid/'),addEventListener(){},removeEventListener(){},matchMedia:q=>({matches:q.replace(/\s/g,'')==='(min-width:1024px)'&&desktop,addEventListener(){},removeEventListener(){}})};
globalThis.Image=class { set src(_value){} }; // No image loading/network in component tests.
globalThis.document={body:{style:{overflow:""}},activeElement:null,addEventListener(){},removeEventListener(){},getElementById:()=>null,documentElement:{classList:{contains:()=>false}}};
globalThis.localStorage={getItem:()=>null,setItem(){}};
const {Player,ALL_PLAYLIST}=await import(file.href);
const track=ALL_PLAYLIST.find(t=>t.id==='laal-dupatta');
const next=ALL_PLAYLIST.find(t=>t.id==='sajan-tumse-pyar');
const fn=()=>{};
const hasClass=(n,c)=>typeof n.props.className==='string'&&n.props.className.split(' ').includes(c);
function player(calls){return {track,current:95,duration:track.duration,playing:true,queue:[track,next],shuffle:false,repeat:'off',seekTo:t=>calls.push(['seek',t]),onScrub:t=>calls.push(['scrub',t]),endScrub:()=>calls.push(['endScrub']),toggleShuffle:()=>calls.push(['shuffle']),previous:()=>calls.push(['previous']),toggle:(...args)=>calls.push(['toggle',...args]),step:(...args)=>calls.push(['step',...args]),cycleRepeat:()=>calls.push(['repeat'])};}
for(const mode of ['mobile','desktop'])test(`${mode}: ONE premium console/footer through all tabs; old reading UI stays isolated and playback callbacks stay intact`,()=>{
 desktop=mode==='desktop';const calls=[];const p=player(calls);let view;
 act(()=>{view=create(React.createElement(Player,{player:p,scrub:null,onClose:fn}));});
 const root=()=>view.root.findByProps({'data-testid':'nowplaying'});
 const tab=id=>view.root.findByProps({id:'player-tab-'+id});
 function verify(id){
  assert.equal(root().props['data-view'],id);
  for(const testid of ['np-console','np-footer','np-play','np-seek','np-info'])assert.equal(view.root.findAllByProps({'data-testid':testid}).length,1,testid);
  assert.equal(view.root.findAllByProps({role:'tablist'}).length,1);
  assert.equal(view.root.findAllByProps({role:'tabpanel'}).length,1);
  assert.equal(view.root.findAllByProps({'aria-selected':true}).length,1);
  assert.equal(tab(id).props['aria-selected'],true);
  assert.equal(view.root.findAllByProps({'data-testid':'np-lyrics'}).length,0,'No legacy white Lyrics pill');
  assert.ok(hasClass(view.root.findByProps({'data-testid':'np-play'}),'studio-player-primary'));
  const console=view.root.findByProps({'data-testid':'np-console'});
  for(let n=console;n;n=n.parent)assert.ok(!hasClass(n,'production-lyrics-scope'),'Original CSS must NEVER style premium controls');
 }
 verify(desktop?'lyrics':'cover');
 const before={track:p.track,current:p.current,queue:p.queue,playing:p.playing};
 for(const id of ['lyrics','queue','cover','lyrics']){
  act(()=>tab(id).props.onClick());verify(id);
  assert.deepEqual(calls,[],'Navigation must not seek, toggle playback, change queue or count a listen');
  assert.deepEqual({track:p.track,current:p.current,queue:p.queue,playing:p.playing},before);
 }
 const reader=view.root.findByProps({'data-testid':'np-lyrics-panel'});
 assert.ok(hasClass(reader,'production-lyrics-scope'));
 assert.equal(reader.findAllByProps({'aria-current':'true'})[0].props['data-inst'],'1');
 act(()=>reader.findByProps({'data-line':22}).props.onClick());assert.deepEqual(calls.pop(),['seek',117.4]);
 act(()=>view.root.findByProps({'data-testid':'np-play'}).props.onClick());assert.deepEqual(calls.pop(),['toggle',track]);
 act(()=>view.root.findByProps({'data-testid':'np-next'}).props.onClick());assert.deepEqual(calls.pop(),['step',1,true]);
 act(()=>view.root.findByProps({'aria-label':'Shuffle'}).props.onClick());assert.deepEqual(calls.pop(),['shuffle']);
 act(()=>view.root.findByProps({'data-testid':'np-seek'}).props.onChange({target:{value:'120'}}));assert.deepEqual(calls.pop(),['scrub',120]);
 act(()=>view.root.findByProps({'data-testid':'np-seek'}).props.onPointerUp());assert.deepEqual(calls.pop(),['endScrub']);
 act(()=>tab('queue').props.onClick());
 const queue=view.root.findByProps({'data-testid':'np-queue'});
 act(()=>queue.findByProps({'aria-label':'Play '+next.title}).props.onClick());assert.deepEqual(calls.pop(),['toggle',next,p.queue]);
 act(()=>tab('lyrics').props.onClick());
 act(()=>view.root.findByProps({'data-testid':'np-info'}).props.onClick());
 assert.equal(view.root.findAll(n=>typeof n.type==='string'&&n.props['data-testid']==='en-credits').length,1);
 verify('lyrics');
 act(()=>view.root.findByProps({'aria-label':'Close song information'}).props.onClick());
 const changed={...p,track:next,current:36.64,duration:next.duration};
 act(()=>view.update(React.createElement(Player,{player:changed,scrub:null,onClose:fn})));
 verify('lyrics');
 assert.equal(view.root.findByProps({'data-line':0}).props['aria-current'],'true');
 assert.equal(view.root.findAllByType('audio').length,0);
 act(()=>view.unmount());
});
test('Layout contract reserves compact safe-area footer, leaves reading styles unchanged and never scopes premium chrome',()=>{
 const css=readFileSync('src/player-studio.css','utf8');
 assert.match(css,/padding: env\(safe-area-inset-top\) 0 max\(12px, env\(safe-area-inset-bottom\)\)/);
 assert.match(css,/is-lyrics-focused \.studio-player-stage \{ flex:1; min-height:0; \}/);
 assert.match(css,/is-lyrics-focused \.studio-player-console \{ flex-shrink:0; \}/);
 assert.match(css,/is-lyrics-focused \.studio-player-controls \.studio-player-primary \{ width:56px; height:56px;/);
 assert.match(css,/min-height: 44px/);
 const source=readFileSync('src/components/StudioNowPlaying.jsx','utf8');
 assert.equal((source.match(/data-testid="np-footer"/g)||[]).length,1);
 assert.equal((source.match(/data-testid="np-console"/g)||[]).length,1);
 assert.doesNotMatch(source,/ProductionLyricsScene|ProductionLyricsShare|lyrics-music-orb|lyrics-line-text/);
});
