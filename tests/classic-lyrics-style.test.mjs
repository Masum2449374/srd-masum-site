import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import postcss from 'postcss';
const baseline='baseline/production-f9e3b91/';
const manifest=JSON.parse(fs.readFileSync(baseline+'manifest.json','utf8'));
test('The visual baseline is actual immutable f9e3b91 source, not another inspired redesign',()=>{
 assert.equal(manifest.commit,'f9e3b91c83966aca82c22b2203f21faaf7b8f653');
 for(const [name,m] of Object.entries(manifest.files))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(baseline+name)).digest('hex'),m.sha256,name);
 execFileSync(process.execPath,['scripts/build-production-lyrics-css.mjs','--check']);
});
test('Every generated production rule is isolated; exact original spacing/fades/background survive without new embellishments',()=>{
 const css=postcss.parse(fs.readFileSync('src/production-lyrics.css','utf8'));
 css.walkRules(r=>{
  if(r.parent.type==='atrule'&&/keyframes$/.test(r.parent.name))return;
  for(const s of r.selectors)assert.ok(s.includes('production-lyrics-'),s);
 });
 const source=fs.readFileSync('src/components/LyricsPanel.jsx','utf8');
 for(const original of ['h-[30vh] shrink-0','text-[19px] font-semibold leading-relaxed','scale-[1.04] text-ink','text-ink/40','text-ink/55','linear-gradient(transparent, #000 15%, #000 85%, transparent)','lyr-note','{r.text}'])assert.ok(source.includes(original),original);
 for(const path of ['src/components/LyricsPanel.jsx']){
  const code=fs.readFileSync(path,'utf8');assert.doesNotMatch(code,/lyrics-music-orb|lyrics-line-text|lyrics-reader-footer|studio-player-tabs|Feel every line/);
 }
 const built=css.toString();assert.match(built,/blur\(70px\) saturate\(1.25\) brightness\(\.75\)/);
 assert.match(built,/height: 30vh/);
 const studio=fs.readFileSync('src/player-studio.css','utf8');assert.doesNotMatch(studio,/lyrics-music-orb|lyrics-focus-ink|lyrics-line-text/);
});
