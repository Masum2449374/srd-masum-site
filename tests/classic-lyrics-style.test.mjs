import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
const css=postcss.parse(readFileSync('src/player-studio.css','utf8'));
const value=(selector,property)=>{
 let result;
 css.walkRules(rule=>{
  // Normal-state queries must not accidentally apply the reduced-motion override.
  if(rule.parent.type==='atrule'&&rule.parent.params.includes('prefers-reduced-motion'))return;
  if(rule.selectors?.includes(selector))rule.walkDecls(property,decl=>{result=decl.value;});
 });
 return result;
};
test('Centered classic geometry stays stable while the active line gains clear professional focus',()=>{
 const line='.lyrics-reader .lyrics-scroll [data-line]';
 assert.equal(value('.lyrics-reader .lyrics-scroll','text-align'),'center');
 assert.equal(value(line,'text-align'),'center');
 assert.equal(value(line,'font-weight'),'600');
 assert.equal(value(line,'min-height'),'54px');
 assert.equal(value(line,'padding'),'7px 12px');
 assert.equal(value(line,'font-size'),'clamp(19px,4.3vw,22px)');
 assert.equal(value(line,'color'),'rgb(var(--ink) / .70)');
 const active=line+'[aria-current="true"]';
 assert.equal(value(active,'color'),'var(--lyrics-focus-ink)');
 assert.equal(value(active,'font-weight'),'600');
 assert.equal(value(active,'background'),'transparent');
 assert.equal(value(active,'border'),'0');
 assert.match(value(active,'text-shadow'),/color-mix/);
 assert.equal(value(line,'font-weight'),value(active,'font-weight'),'No active-weight layout reflow');
 assert.equal(value(active+' .lyrics-line-text','transform'),'scale(1.025)');
 assert.match(value(line+'::before','background'),/radial-gradient/);
 assert.equal(value(line+'::after','width'),'32px');
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

test('Instrumental icon is genuinely prominent and animation is gated by actual playback and reduced motion',()=>{
 assert.equal(value('.lyrics-music-orb','width'),'64px');
 assert.equal(value('.lyrics-music-icon','width'),'38px');
 assert.equal(value('.lyrics-interlude','min-height'),'88px');
 assert.equal(value('.lyrics-music-icon','animation-play-state'),'paused');
 assert.equal(value('.lyrics-music-orbit','animation-play-state'),'paused');
 assert.equal(value('.lyrics-reader[data-playing="true"] .lyrics-music-icon','animation-play-state'),'running');
 assert.equal(value('.lyrics-reader[data-playing="true"] .lyrics-music-orbit','animation-play-state'),'running');
 const reduced=[];
 css.walkRules(rule=>{
  if(rule.parent.type==='atrule'&&rule.parent.params.includes('prefers-reduced-motion:reduce')){
   rule.walkDecls(decl=>reduced.push([rule.selector,decl.prop,decl.value]));
  }
 });
 assert.ok(reduced.some(([s,p,v])=>s.includes('.lyrics-music-icon')&&p==='animation'&&v==='none'));
 assert.ok(reduced.some(([s,p,v])=>s.includes('[aria-current="true"] .lyrics-line-text')&&p==='transform'&&v==='none'));
 const panel=readFileSync('src/components/LyricsPanel.jsx','utf8');
 assert.match(panel,/<MusicNotes size=\{38\} weight="duotone"/);
 assert.doesNotMatch(panel,/♪ · ♪|lyrics-interlude-bars/);
 assert.match(readFileSync('src/components/StudioNowPlaying.jsx','utf8'),/playing=\{player.playing\}/);
 assert.match(readFileSync('src/components/SongDetail.jsx','utf8'),/playing=\{active && player.playing\}/);
});
