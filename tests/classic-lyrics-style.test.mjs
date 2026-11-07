import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
const css=postcss.parse(readFileSync('src/player-studio.css','utf8'));
const value=(selector,property)=>{
 let result;
 css.walkRules(rule=>{
  if(rule.selectors?.includes(selector))rule.walkDecls(property,decl=>{result=decl.value;});
 });
 return result;
};
test('Classic lyrics restore centered regular-weight 50px cadence, gray neighbors and a plain bright active line',()=>{
 const line='.lyrics-reader .lyrics-scroll [data-line]';
 assert.equal(value('.lyrics-reader .lyrics-scroll','text-align'),'center');
 assert.equal(value(line,'text-align'),'center');
 assert.equal(value(line,'font-weight'),'500');
 assert.equal(value(line,'min-height'),'50px');
 assert.equal(value(line,'padding'),'7px 3px');
 assert.equal(value(line,'font-size'),'clamp(19px,4.3vw,22px)');
 assert.equal(value(line,'color'),'rgb(var(--ink) / .70)');
 const active=line+'[aria-current="true"]';
 assert.equal(value(active,'color'),'rgb(var(--ink))');
 assert.equal(value(active,'font-weight'),'500');
 assert.equal(value(active,'background'),'transparent');
 assert.equal(value(active,'border'),'0');
 assert.equal(value(active,'text-shadow'),'none');
 assert.match(value('.lyrics-reader .lyrics-scroll','mask-image'),/#000 12%,#000 88%/);
 assert.equal(value('.lyrics-reader .lyrics-section-label','text-align'),'center');
 assert.equal(value('.lyrics-reader .lyrics-section-label','letter-spacing'),'2.5px');
});
test('Production cover-colour atmosphere is restored only inside lyrics mode, not the homepage or Listening view',()=>{
 const scope='.studio-player-v2.is-lyrics-focused';
 assert.equal(value(scope,'--ink'),'255 255 255');
 assert.equal(value(scope+' .studio-player-atmosphere .np-bgimg','opacity'),'.9');
 assert.equal(value(scope+' .studio-player-atmosphere .np-bgimg','filter'),'blur(70px) saturate(1.25) brightness(.75)');
 assert.equal(value(scope+' .studio-player-atmosphere .np-bgshade','background'),'linear-gradient(180deg,rgba(8,10,18,.35) 0%,rgba(8,10,18,.55) 45%,rgba(8,10,18,.88) 100%)');
 assert.equal(value('.studio-player-atmosphere .np-bgimg','opacity'),'0.11','Listening backdrop stays premium charcoal');
 assert.equal(value(scope+' .studio-lyrics-view > .studio-interior-section-heading','display'),'none');
 assert.equal(value(scope+' .studio-player-header p','display'),'none');
 assert.equal(value('.lyrics-reader-footer','position'),'absolute','Resume does not consume a permanent text/footer row');
 assert.equal(value('.lyrics-reader-footer button','min-height'),'44px');
 const fx=readFileSync('src/components/NowPlayingFX.jsx','utf8');
 assert.match(fx,/useCoverColors\(src\)/,'Existing genuine cover-derived colours remain in use');
 const detail=readFileSync('src/components/SongDetail.jsx','utf8');
 assert.doesNotMatch(detail,/Word for word|Feel every line/);
});
