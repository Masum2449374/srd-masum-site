import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import selectorParser from 'postcss-selector-parser';
import config from '../baseline/production-f9e3b91/tailwind.config.mjs';
const baseline=new URL('../baseline/production-f9e3b91/',import.meta.url);
const manifest=JSON.parse(await fs.readFile(new URL('manifest.json',baseline),'utf8'));
for(const [name,entry] of Object.entries(manifest.files)){
 const bytes=await fs.readFile(new URL(name,baseline));
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('Production baseline changed: '+name);
}
const content=await Promise.all(['LyricsPanel.jsx.txt','NowPlaying.jsx.txt','NowPlayingFX.jsx.txt','ShareButton.jsx.txt'].map(async name=>({raw:await fs.readFile(new URL(name,baseline),'utf8'),extension:'jsx'})));
const built=await postcss([tailwindcss({...config,content}),autoprefixer()]).process(await fs.readFile(new URL('index.css',baseline),'utf8'),{from:undefined});
const css=built.root;
const frames=new Map();
css.walkAtRules(/keyframes$/,node=>{const old=node.params;const name='production-f9-'+old;frames.set(old,name);node.params=name;});
css.walkDecls(/animation/,decl=>{
 for(const [old,name] of frames)decl.value=decl.value.replace(new RegExp('(?<![\\w-])'+old+'(?![\\w-])','g'),name);
});
const guard=selectorParser().astSync(':where(.production-lyrics-scope, .production-lyrics-scope *)').first.first;
css.walkRules(rule=>{
 if(rule.parent.type==='atrule'&&/keyframes$/.test(rule.parent.name))return;
 rule.selectors=rule.selectors.map(selector=>{
  if(selector.startsWith(':root.light'))return ':root.light .production-lyrics-scope'+selector.slice(11);
  if(selector.startsWith('html.light'))return ':root.light .production-lyrics-scope'+selector.slice(10);
  if(selector.startsWith(':root'))return '.production-lyrics-scope'+selector.slice(5);
  if(selector==='html'||selector==='body')return '.production-lyrics-scene';
  return selectorParser(selectors=>selectors.each(sel=>{
   let pseudo;
   // Guard the final compound, before pseudo-elements (which must stay last).
   for(let i=sel.nodes.length-1;i>=0;i--){
    const node=sel.nodes[i];if(node.type==='combinator')break;
    if(node.type==='pseudo'&&(node.value.startsWith('::')||[':before',':after',':first-line',':first-letter'].includes(node.value)))pseudo=node;
   }
   if(pseudo)sel.insertBefore(pseudo,guard.clone());else sel.append(guard.clone());
  })).processSync(selector);
 });
 rule.walkDecls(decl=>{decl.important=true;});
});
const output='/* Generated from immutable production f9e3b91 CSS/config/markup. No visual redesign. Scope/priority and keyframe names are isolation bridges only. */\n'+css.toString()+'\n/* Isolation: cancel only premium declarations absent from the original inherited defaults. */\n.production-lyrics-scope.lyrics-scroll { scrollbar-width:auto !important; }\n.production-lyrics-scope.lyrics-scroll [data-line] { font-family:inherit !important; letter-spacing:inherit !important; }\n@media (prefers-reduced-motion: reduce) { .production-lyrics-scope .lyr-note { animation: none !important; } }\n';
const path=new URL('../src/production-lyrics.css',import.meta.url);
if(process.argv.includes('--check')){
 if(await fs.readFile(path,'utf8')!==output)throw Error('Production lyrics stylesheet needs rebuilding');
}else await fs.writeFile(path,output);
console.log('Production f9e3b91 lyrics stylesheet '+(process.argv.includes('--check')?'verified':'built'));
