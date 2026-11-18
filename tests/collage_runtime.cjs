#!/usr/bin/env node
/* Real SSR regression: node tests/collage_runtime.cjs TEMPLATE_PROJECT [DEPENDENCY_PROJECT]
 * Dependencies resolve from the supplied project, then optional dependency project / NODE_PATH.
 * Bundles the project's actual source in memory; no stubs, generated builds or network access.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = process.argv[2] && path.resolve(process.argv[2]);
if (!root) { console.error('Usage: node tests/collage_runtime.cjs TEMPLATE_PROJECT [DEPENDENCY_PROJECT]'); process.exit(2); }
const dependencyRoot = path.resolve(process.argv[3] || root);
const projectRequire = Module.createRequire(path.join(dependencyRoot, 'package.json'));
const esbuild = projectRequire('esbuild');
const output = esbuild.buildSync({
  stdin: {contents: `export {CollageStage, validateCollage, motionBounds, movingEnd, soundAt} from './src/collage';
export {createElement} from 'react'; export {renderToStaticMarkup} from 'react-dom/server';`,
    resolveDir: root, sourcefile: 'collage-runtime-entry.tsx', loader: 'tsx'},
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false, logLevel: 'silent',
});
const compiled = new Module(path.join(root, '.collage-runtime-test.cjs'), module);
compiled.filename = path.join(root, '.collage-runtime-test.cjs');
compiled.paths = [...Module._nodeModulePaths(dependencyRoot), ...Module._nodeModulePaths(root)];
compiled._compile(output.outputFiles[0].text, compiled.filename);
const api = compiled.exports;
const {Internals} = projectRequire('remotion');
const clone = value => JSON.parse(JSON.stringify(value));
const failures = [];
let passed = 0;
function test(name, run) {
  try { run(); passed++; console.log(`PASS ${name}`); }
  catch (e) { failures.push(name); console.error(`FAIL ${name}: ${e.stack || e}`); }
}
function render(data, frame, duration = 120) {
  const video = {id: 'collage-runtime', width: 1080, height: 1920, fps: 30, durationInFrames: duration,
    defaultProps: {}, props: {}, component: api.CollageStage};
  const manager = {compositions: [video], folders: [], canvasContent: {type: 'composition', compositionId: video.id},
    currentCompositionMetadata: video, currentAssetMetadata: null};
  return api.renderToStaticMarkup(api.createElement(Internals.CompositionManager.Provider, {value: manager},
    api.createElement(Internals.VideoProvider, null,
      api.createElement(Internals.CanUseRemotionHooks.Provider, {value: true},
        api.createElement(Internals.TimelineContext.Provider, {value: {frame: {[video.id]: frame},
          audioAndVideoTags: {current: []}, isPlaying: () => false, isInsideFreeze: false}},
          api.createElement(api.CollageStage, {data, frame, duration}))))));
}
const text = (id, box, extra = {}) => ({id, kind: 'text', text: id, box, at: 0, settle: 12, end: 120,
  role: 'primary', meaning: 'Synthetic runtime geometry probe', style: {fontSize: 40}, ...extra});
const scene = nodes => ({preset: 'runtime-synthetic', captionBox: [60, 1700, 960, 140], nodes});
function rejects(data, pattern, duration = 120) {
  const errors = api.validateCollage(data, duration);
  assert.ok(errors.some(e => pattern.test(e)), `Expected ${pattern}; got ${JSON.stringify(errors)}`);
  assert.throws(() => render(data, 40, duration), pattern, 'Renderer must enforce the validator');
}
const timeline = JSON.parse(fs.readFileSync(path.join(root, 'src/timeline.json'), 'utf8'));
const fixtures = timeline.scenes.filter(s => s.collage);
const names = ['photo-timeline-question','four-stage-teaching-board','eight-check-teaching-board',
  'market-path-and-secondary','market-score-and-deltas','building-portrait-headline','document-portrait-number',
  'meeting-versus-portraits','meeting-question-answer-strip','podium-quote-and-portraits',
  'complementary-roles-hero','portrait-year-resignation','red-chapter-and-rising-chart',
  'phrase-wallet-ballot','podium-trade-and-photo','red-date-today-impact'];
test('exactly sixteen distinct presets', () => assert.deepEqual(fixtures.map(s => s.collage.preset).sort(), names.sort()));
for (const f of fixtures) {
  test(`${f.collage.preset}: JSON roundtrip, actual SSR and temporal anchors`, () => {
    const data = clone(f.collage), duration = f.end - f.start;
    assert.deepEqual(api.validateCollage(data, duration), []);
    const frames = new Set([0, Math.floor(duration / 2), duration - 1]);
    function anchors(value) {
      if (!value || typeof value !== 'object') return;
      for (const [key, v] of Object.entries(value)) {
        if (Number.isInteger(v) && /^(at|settle|end|.*At|.*Settle)$/.test(key)) {
          for (const offset of [-1, 0, 1]) if (v + offset >= 0 && v + offset < duration) frames.add(v + offset);
        } else if (typeof v === 'object') anchors(v);
      }
    }
    anchors(data.nodes);
    const markup = [...frames].sort((a,b) => a-b).map(frame => render(data, frame, duration));
    assert.ok(markup.every(html => html.includes('<div')));
    assert.ok(markup.every(html => !/NaN|Infinity|undefined/.test(html)), 'Nonfinite or missing value in SSR');
    assert.ok(new Set(markup).size > 1, 'Explicit timings must change actual rendered output');
    assert.equal(render(data, duration - 1, duration), render(clone(data), duration - 1, duration));
  });
}
test('4806 preset contains wallet and ballot, irrespective of legacy node id', () => {
  const fixture = fixtures.find(f => f.collage.preset === 'phrase-wallet-ballot');
  assert.deepEqual(fixture.collage.nodes.filter(n => n.kind === 'icon').map(n => n.symbol).sort(), ['ballot','wallet']);
});
test('reject simultaneous occupied regions, accept disjoint lifetimes', () => {
  const c = scene([text('a',[100,100,300,200],{focus:false,settle:0}),text('b',[250,150,300,200],{focus:false,settle:0})]);
  rejects(c, /occupied regions collide/);
  c.nodes[0].end=40; Object.assign(c.nodes[1],{at:40,settle:40});
  assert.deepEqual(api.validateCollage(c,120),[]);
});
test('reject rotated rectangle entering caption although unrotated box clears it', () => {
  const c = scene([text('rotated',[60,1560,800,100],{rotation:20})]);
  rejects(c,/rotation crosses caption/);
  c.nodes[0].rotation=0; assert.deepEqual(api.validateCollage(c,120),[]);
});
test('reject entrance sweep crossing caption', () => {
  rejects(scene([text('slide',[100,1500,300,100],{entry:{kind:'slide-y',distance:150}})]),/crosses caption/);
});
test('reject competing focus even without spatial collision', () => {
  const c=scene([text('a',[100,100,200,100]),text('b',[700,600,200,100])]);
  rejects(c,/competing motion focus/);
  c.nodes[1].at=12;c.nodes[1].settle=24;assert.deepEqual(api.validateCollage(c,120),[]);
});
const compare = () => ({...text('compare',[50,500,980,300]),kind:'compare',variant:'strip',
  left:{title:'LEFT',detail:'Observed A',color:'#aa3322'},right:{title:'RIGHT',detail:'Observed B',color:'#224488'},
  relation:'VS',relationMeaning:'Explicit comparison',leftAt:0,leftSettle:12,rightAt:12,rightSettle:24,
  relationAt:24,relationSettle:36,titleSize:60,detailSize:28,badgeSize:110});
test('comparison relationship must follow both objects', () => {
  const n=compare();assert.deepEqual(api.validateCollage(scene([n]),120),[]);
  n.relationAt=20;rejects(scene([n]),/objects must precede relationship/);
  n.relationAt=24;n.leftSettle=30;rejects(scene([n]),/objects must precede relationship/);
});
test('comparison badge is hidden before relation and present after settlement', () => {
  const n=compare(), a=render(scene([n]),23), b=render(scene([n]),36);
  assert.match(a,/opacity:0;transform:rotate\(-8deg\)/);
  assert.match(b,/opacity:1;transform:rotate\(-8deg\) scale\(1\)/);
});
test('ink fill follows title entrance and ends inside lifetime', () => {
  const n=text('ink',[100,100,700,150],{style:{fontSize:100,stroke:2,color:'#ff0000'},
    inkReveal:{at:20,settle:40,outlineColor:'#111111'}});
  assert.deepEqual(api.validateCollage(scene([n]),120),[]);
  assert.match(render(scene([n]),20),/color-mix\(in srgb, #ff0000 0%, transparent\)/);
  assert.match(render(scene([n]),30),/color-mix\(in srgb, #ff0000 50%, transparent\)/);
  assert.match(render(scene([n]),40),/color-mix\(in srgb, #ff0000 100%, transparent\)/);
  n.inkReveal.at=10;rejects(scene([n]),/ink fill must follow/);
  n.inkReveal.at=20;n.inkReveal.settle=120;rejects(scene([n]),/ink fill must follow/);
});
test('ink fill reserves focus until settlement', () => {
  const a=text('ink',[100,100,400,120],{inkReveal:{at:20,settle:50,outlineColor:'#111111'}});
  const b=text('other',[100,600,400,120],{at:30,settle:40});
  rejects(scene([a,b]),/competing motion focus/);
  b.at=50;b.settle=60;assert.deepEqual(api.validateCollage(scene([a,b]),120),[]);
});
test('reposition rejects collision along trajectory with both endpoints clear', () => {
  const a=text('moving',[700,400,150,100],{reposition:{from:[100,400],at:20,settle:60}});
  const b=text('stationary',[400,400,150,100],{focus:false,settle:0});
  rejects(scene([a,b]),/occupied regions collide/);
  b.box[1]=700;assert.deepEqual(api.validateCollage(scene([a,b]),120),[]);
  assert.match(render(scene([a]),20),/left:100px;top:400px/);
  assert.match(render(scene([a]),60),/left:700px;top:400px/);
  const mid=render(scene([a]),40);assert.doesNotMatch(mid,/left:(100|700)px;top:400px/);
});
test('reposition cannot start before entrance or settle outside lifetime', () => {
  const n=text('moving',[700,400,150,100],{reposition:{from:[100,400],at:5,settle:40}});
  rejects(scene([n]),/reposition must follow/);
  n.reposition.at=20;n.reposition.settle=120;rejects(scene([n]),/reposition must follow/);
});
test('ballot renders its own ballot-box/check geometry, not television fallback', () => {
  const n={...text('ballot',[100,100,300,300]),kind:'icon',symbol:'ballot',tile:'#aa3322'};
  const c=scene([n]);assert.deepEqual(api.validateCollage(c,120),[]);
  const html=render(c,40);assert.match(html,/aria-label="ballot"/);
  assert.match(html,/M73 140L51 184V244H247/);assert.match(html,/M115 79L139 95L170 55/);
  assert.doesNotMatch(html,/M98 61L151 111L204 61/);
  n.symbol='unknown';rejects(c,/unknown symbol/);
});
test('overlap waiver needs valid nodes and a meaningful reason', () => {
  const c=scene([text('a',[100,100,300,200],{focus:false,settle:0}),text('b',[250,150,300,200],{focus:false,settle:0})]);
  c.allowOverlaps=[{a:'a',b:'b',reason:' '}];rejects(c,/overlap exception/);
  c.allowOverlaps[0].reason='Synthetic intentional paper stack';assert.deepEqual(api.validateCollage(c,120),[]);
  c.allowOverlaps[0].b='missing';rejects(c,/overlap exception/);
});
test('caption waiver cannot excuse text covering subtitles', () => {
  const c=scene([text('text',[100,1700,500,100])]);
  c.captionOverlay={nodeIds:['text'],reason:'Not a valid empty image area'};rejects(c,/caption overlay/);
});
test('remote and traversal media are rejected', () => {
  const n={...text('photo',[100,100,300,300]),kind:'photo',file:'https://example.com/a.png'};
  rejects(scene([n]),/photo asset required/);n.file='../outside.png';rejects(scene([n]),/photo asset required/);
});
test('moving content cannot waive focus',()=>{rejects(scene([text('a',[100,100,200,100],{focus:false})]),/cannot disable focus/);});
test('sound must resolve to node action and fit the scene',()=>{
 const c=scene([text('a',[100,100,200,100])]);c.sounds=[{nodeId:'a',anchor:'settle',kind:'paper',file:'sfx/paper.wav',gain:.2,tailFrames:5,license:'CC0'}];
 assert.deepEqual(api.validateCollage(c,120),[]);assert.equal(api.soundAt(c.nodes[0],'settle'),12);
 c.sounds[0].anchor='relation';rejects(c,/sound needs node anchor/);c.sounds[0].anchor='settle';c.sounds[0].tailFrames=120;rejects(c,/bounded tail/);
});
test('travel and landing sounds are not interchangeable',()=>{
 const c=scene([text('a',[100,100,200,100])]);c.sounds=[{nodeId:'a',anchor:'entry',kind:'paper',file:'sfx/paper.wav',gain:.2,tailFrames:5,license:'CC0'}];rejects(c,/travel cue/);
 c.sounds[0].kind='whoosh';assert.deepEqual(api.validateCollage(c,120),[]);c.sounds[0].anchor='settle';rejects(c,/landing cue/);
});
const chart = () => ({...text('chart',[60,100,900,600]),kind:'line-chart',
  points:[{x:0,y:10},{x:.5,y:30},{x:1,y:20}],domain:[0,40],source:'Synthetic test observations',
  title:'Observed price',unit:'USD',drawAt:20,drawSettle:100});
const clipWidth = html => Number(html.match(/data-chart-reveal="true"[^>]*width="([^"]+)"/)[1]);
test('chart event stops interpolate in x, hold, and clamp actual visible SVG',()=>{
 const n=chart();n.revealStops=[{at:30,x:0},{at:50,x:.25},{at:70,x:.25},{at:90,x:1}];
 const c=scene([n]);assert.deepEqual(api.validateCollage(c,120),[]);
 for(const [frame,fraction] of [[20,0],[30,0],[40,.125],[50,.25],[60,.25],[70,.25],[80,.625],[90,1],[110,1]])
  assert.equal(clipWidth(render(c,frame)),810*fraction,`visible clip at frame ${frame}`);
 assert.equal(render(c,50),render(c,60),'hold must retain identical rendered chart');
 assert.notEqual(render(c,40),render(c,80),'reveal must change rendered clipping');
 assert.equal(api.movingEnd(n),100,'stops do not weaken reserved motion focus');
 assert.equal(api.soundAt(n,'draw'),100,'draw sound retains declared settlement anchor');
});
test('chart without stops retains legacy eased reveal and connection label',()=>{
 const c=scene([chart()]);assert.equal(clipWidth(render(c,60)),810*.875);
 assert.match(render(c,60),/观测点直线连接/);
});
test('chart rejects malformed or reversing event stop schedules',()=>{
 const valid=[{at:20,x:0},{at:60,x:.4},{at:100,x:1}];
 for(const bad of [null,[],[valid[0]],Array(65).fill(valid[0]),
  [{at:19,x:0},valid[2]],[valid[0],{at:101,x:1}],
  [valid[0],{at:20,x:.4},valid[2]],[valid[0],{at:20.5,x:.4},valid[2]],
  [valid[0],{at:50,x:.8},{at:60,x:.4},valid[2]],
  [{at:20,x:.1},valid[2]],[valid[0],{at:100,x:.9}],
  [valid[0],{at:60,x:1.2},valid[2]],[valid[0],null,valid[2]],
  [valid[0],{at:60,x:NaN},valid[2]]]){
  const n=chart();n.revealStops=bad;rejects(scene([n]),/revealStops/);
 }
});
test('chart date ticks and explicit English footer render independently of reveal',()=>{
 const n=chart();n.xLabels=[{x:0,label:'Nov 02'},{x:.5,label:'Nov 09'},{x:1,label:'Nov 16'}];
 n.connectionLabel='Observed points joined';const c=scene([n]);
 assert.deepEqual(api.validateCollage(c,120),[]);
 const html=render(c,20);assert.match(html,/Nov 02/);assert.match(html,/Nov 09/);assert.match(html,/Nov 16/);
 assert.match(html,/USD · Observed points joined/);assert.doesNotMatch(html,/观测点直线连接/);
 assert.match(html,/y="500" font-size="17" text-anchor="start">Nov 02/);
 assert.match(html,/text-anchor="end">Nov 16/);
});
test('chart rejects unreadable or malformed date labels and footers',()=>{
 for(const bad of [null,[],[{x:-.1,label:'Nov 02'}],[{x:0,label:''}],
  [{x:0,label:'x'.repeat(17)}],[{x:0,label:'Nov\n02'}],
  [{x:.5,label:'Nov 09'},{x:.4,label:'Nov 02'}],
  [{x:.5,label:'Nov 09'},{x:.51,label:'Nov 10'}]]){
  const n=chart();n.xLabels=bad;rejects(scene([n]),/xLabels/);
 }
 const small=chart();small.box[3]=250;small.xLabels=[{x:0,label:'Nov 02'}];rejects(scene([small]),/xLabels/);
 for(const bad of [null,'','x'.repeat(65),'two\nlines']){
  const n=chart();n.connectionLabel=bad;rejects(scene([n]),/connectionLabel/);
 }
});
console.log(`Collage runtime: ${passed} passed, ${failures.length} failed. SSR is not audiovisual acceptance.`);
if(failures.length)process.exitCode=1;
