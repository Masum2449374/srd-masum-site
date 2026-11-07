import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../worker/_worker.js';
import {AUDIO_TRACKS} from '../src/data/songs.js';
import {playlistBySlug} from '../src/data/language-playlists.js';
import {songUrl} from '../src/lib/share.js';
import {isVerified} from '../src/lib/artists.js';
const track=AUDIO_TRACKS.find(t=>t.id==='sajan-tumse-pyar');
const key='preview-assets/20261107/sajan-tumse-pyar-8e0e606fb673-6555353ff48c.mp3';
const bytes=new TextEncoder().encode('ID3-test-audio-object');
const operations=[];
const env={MEDIA:{async head(k){assert.equal(k,key);operations.push('head');return {size:bytes.length,httpEtag:'"test-etag"'}},async get(k,options){assert.equal(k,key);operations.push('get');const range=options?.range;return {body:range?bytes.slice(range.offset,range.offset+range.length):bytes}}},DB:new Proxy({}, {get(){throw Error('No catalogue DB access is permitted')}})};
const request=(headers={},method='GET',host='https://safe-review.srd-masum.pages.dev',path=track.src)=>worker.fetch(new Request(host+path,{method,headers}),env,{});
test('Uploaded song has evidence-backed metadata, exact file duration, real artwork and no invented verification/lyrics',()=>{
 assert.equal(track.title,'Sajan Tumse Pyar');assert.equal(track.artist,'Udit Narayan & Alka Yagnik');assert.equal(track.duration,247.536);
 assert.equal(track.released,'2005-05-24');assert.equal(track.composer,'Himesh Reshammiya');assert.equal(track.writers,'Sameer');
 assert.equal(track.verified,false);assert.equal(isVerified(track),false);assert.equal(track.previewOnly,true);assert.equal(track.lyrics,undefined);
 assert.match(track.version,/unspecified/);assert.equal(playlistBySlug('hindi').tracks.filter(t=>t.id===track.id).length,1);
 for(const p of [track.cover,track.coverWebp,track.thumb,track.artwork512]) assert.ok(fs.existsSync(new URL('../public'+p,import.meta.url)));
 const html=fs.readFileSync(new URL('../dist/song/sajan-tumse-pyar/index.html',import.meta.url),'utf8');assert.ok(html.includes('Sajan Tumse Pyar'));assert.ok(html.includes('Hindi'));assert.ok(html.includes('https://design-premium-studio-202611.srd-masum.pages.dev/og/sajan-tumse-pyar.png'));assert.ok(html.includes('edit unspecified'));assert.ok(!html.includes('Synced lyrics ·'));
});
test('Preview R2 streaming supports GET, HEAD, normal/suffix/open ranges and cache validators',async()=>{
 let r=await request();assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'audio/mpeg');assert.equal(r.headers.get('accept-ranges'),'bytes');assert.equal(r.headers.get('content-language'),'hi');assert.deepEqual(new Uint8Array(await r.arrayBuffer()),bytes);
 r=await request({},'HEAD');assert.equal(r.status,200);assert.equal(r.headers.get('content-length'),String(bytes.length));assert.equal((await r.arrayBuffer()).byteLength,0);
 for(const [range,start,end] of [['bytes=0-3',0,3],['bytes=-4',bytes.length-4,bytes.length-1],['bytes=5-',5,bytes.length-1]]){r=await request({range});assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),`bytes ${start}-${end}/${bytes.length}`);assert.deepEqual(new Uint8Array(await r.arrayBuffer()),bytes.slice(start,end+1));}
 r=await request({'if-none-match':'"test-etag"'});assert.equal(r.status,304);
 r=await request({range:'bytes=0-3','if-range':'"old-etag"'});assert.equal(r.status,200);
 for(const range of ['bytes=999-','bytes=-0','bytes=-','bytes=9-1','bytes=0-2,4-5','bytes=9007199254740993-']){r=await request({range});assert.equal(r.status,416,range);assert.equal(r.headers.get('content-range'),`bytes */${bytes.length}`);}
});
test('Preview media allowlist blocks production hosts, arbitrary object paths and write methods',async()=>{
 for(const host of ['https://srdmasum.bbroot.com','https://srd-masum.pages.dev','https://evil.example']) assert.equal((await request({},'GET',host)).status,404);
 const before=operations.length;
 assert.equal((await request({},'GET',undefined,'/audio/preview/private.mp3')).status,404);assert.equal((await request({},'POST')).status,405);
 assert.equal(operations.length,before,'Denied paths/methods never reach storage');
});
test('Preview-only song shares point at the current preview, while existing canonical shares stay unchanged',()=>{
 globalThis.window={location:new URL('https://safe-review.srd-masum.pages.dev/song/sajan-tumse-pyar/')};
 assert.equal(songUrl(track),'https://safe-review.srd-masum.pages.dev/song/sajan-tumse-pyar/');
 assert.equal(songUrl(AUDIO_TRACKS[0]),`https://srdmasum.bbroot.com/song/${AUDIO_TRACKS[0].id}/`);
 delete globalThis.window;
});
