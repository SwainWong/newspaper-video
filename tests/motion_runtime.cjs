#!/usr/bin/env node
/* Runtime regression contract. Usage: node tests/motion_runtime.cjs /path/to/installed/template
 * Uses only dependencies installed by that template. Bundles in memory; writes no build files.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = process.argv[2] && path.resolve(process.argv[2]);
if (!root) { console.error('Usage: node tests/motion_runtime.cjs TEMPLATE_PROJECT_ROOT'); process.exit(2); }
const projectRequire = Module.createRequire(path.join(root, 'package.json'));
const esbuild = projectRequire('esbuild');
const refs = path.resolve(__dirname, '../skills/newspaper-video/references');
const graphics = JSON.parse(fs.readFileSync(path.join(refs, 'graphics-fixtures.json'), 'utf8'));
const papers = JSON.parse(fs.readFileSync(path.join(refs, 'paper-fixtures.json'), 'utf8'));
const fixtures = [...graphics, ...papers];
const graphicEffects = new Set(graphics.map(s => s.effect));
const bundle = esbuild.buildSync({
  stdin: {contents: `
    export {validateMotion, validateTransitions, transitionProgress, MotionLayer} from './src/motion';
    export {GraphicMotion} from './src/motion-graphics';
    export {PaperMotion} from './src/motion-paper';
    export {createElement} from 'react';
    export {renderToStaticMarkup} from 'react-dom/server';
  `, resolveDir: root, sourcefile: 'motion-test-entry.tsx', loader: 'tsx'},
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  logLevel: 'silent',
});
const compiled = new Module(path.join(root, '.motion-runtime-test.cjs'), module);
compiled.filename = path.join(root, '.motion-runtime-test.cjs');
compiled.paths = Module._nodeModulePaths(root);
compiled._compile(bundle.outputFiles[0].text, compiled.filename);
const api = compiled.exports;
const {Internals} = projectRequire('remotion');
const clone = value => structuredClone(value);
const entry = spec => ({id: `test-${spec.effect}`, start: 0, end: 180, box: [65,350,900,900], ...spec});
const byEffect = effect => clone(fixtures.find(s => s.effect === effect));
let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; console.log(`PASS ${name}`); }
  catch (error) { failures.push(name); console.error(`FAIL ${name}: ${error.stack || error}`); }
}
function rejects(spec, label) {
  const errors = api.validateMotion(entry(spec));
  assert.ok(Array.isArray(errors) && errors.length, `${label}: expected validation errors`);
}
function changed(effect, mutate, label) {
  const spec = byEffect(effect); mutate(spec.data); rejects(spec, label);
}
function render(spec, frame) {
  const Component = graphicEffects.has(spec.effect) ? api.GraphicMotion : api.PaperMotion;
  // Real Remotion Img hooks require composition context even during static SSR.
  const video={id:'runtime-test',width:900,height:900,fps:30,durationInFrames:180,defaultProps:{},props:{},component:Component};
  const manager={compositions:[video],folders:[],canvasContent:{type:'composition',compositionId:video.id},currentCompositionMetadata:video,currentAssetMetadata:null};
  return api.renderToStaticMarkup(api.createElement(Internals.CompositionManager.Provider,{value:manager},
    api.createElement(Internals.VideoProvider,null,
      api.createElement(Internals.CanUseRemotionHooks.Provider,{value:true},
        api.createElement(Internals.TimelineContext.Provider,{value:{frame:{[video.id]:frame},audioAndVideoTags:{current:[]},isPlaying:()=>false,isInsideFreeze:false}},
          api.createElement(Component, {spec,frame,duration:180}))))));
}

test('fixture inventory covers all eleven components', () => {
  assert.equal(fixtures.length, 11);
  assert.equal(new Set(fixtures.map(s => s.effect)).size, 11);
});
for (const spec of fixtures) {
  test(`${spec.effect}: valid runtime input`, () => assert.deepEqual(api.validateMotion(entry(spec)), []));
  test(`${spec.effect}: finite frames and frozen terminal state`, () => {
    const frames = [0,45,90,179,180,1000].map(f => render(spec,f));
    frames.forEach(markup => {
      assert.ok(markup.length > 20, 'component must render visible structure');
      assert.doesNotMatch(markup, /\b(?:NaN|Infinity|undefined)\b/, 'render has non-finite/missing output');
    });
    assert.equal(frames[3], frames[4], 'event end must freeze final state');
    assert.equal(frames[3], frames[5], 'late frame must remain frozen');
  });
  test(`${spec.effect}: malformed data returns validation errors`, () => {
    for (const data of [null, {}, [], {at:NaN,settle:Infinity}]) rejects({...spec,data}, 'malformed data');
  });
}

test('every component rejects a non-finite numeric payload', () => {
  const mutate = {
    'split': d => {d.atLeft=NaN;},
    'stage-curve': d => {d.segments[0].points[0].value=Infinity;},
    'checklist': d => {d.items[0].checkAt=NaN;},
    'market-line': d => {d.baseline=Infinity;},
    'threshold': d => {d.value=NaN;},
    'chapter-tint': d => {d.opacity=Infinity;},
    'calendar-flip': d => {d.from=NaN;},
    'film-frame': d => {d.out=Infinity;},
    'keyword': d => {d.words[0].at=NaN;},
    'icon-metaphor': d => {d.at=Infinity;},
    'date-tiles': d => {d.at=NaN;},
  };
  for (const [effect, fn] of Object.entries(mutate)) changed(effect,fn,`${effect} non-finite data`);
});
test('motion envelope rejects non-finite geometry and interval', () => {
  for (const value of [NaN,Infinity,-Infinity]) {
    const e=entry(fixtures[0]); e.box[2]=value;
    assert.ok(api.validateMotion(e).length);
    assert.ok(api.validateMotion({...entry(fixtures[0]),start:value}).length);
  }
});
test('split: relation waits for both settled sides', () => changed('split', d => {d.atRelation=d.settleRight-1;}, 'premature relation'));
test('stage curve: schematic declaration is mandatory', () => changed('stage-curve',d => {d.schematic=false;},'non-schematic model'));
test('stage curve: segments and labels follow their anchors', () => {
  changed('stage-curve',d => {d.segments[1].at=d.segments[0].settle-1;},'overlapping stage');
  changed('stage-curve',d => {d.segments[0].labelAt=d.segments[0].at;},'premature label');
});
test('stage curve: reversed time and out-of-domain values rejected', () => {
  changed('stage-curve',d => {d.segments[0].points.reverse();},'reversed stage points');
  changed('stage-curve',d => {d.segments[0].points[0].value=d.domain[1]+1;},'stage domain');
});
test('checklist: explanation precedes check and check precedes count', () => {
  changed('checklist',d => {d.items[0].checkAt=d.items[0].explainSettle;},'premature check');
  changed('checklist',d => {d.items[0].countAt=d.items[0].checkAt;},'premature count');
});
test('checklist: unknown remains unpassed and denominator is honest', () => {
  const spec=byEffect('checklist');
  spec.data.items.forEach(item => {item.pass=null;});
  assert.deepEqual(api.validateMotion(entry(spec)),[]);
  assert.match(render(spec,179), /已通过 0 \/ 3 项/);
  changed('checklist',d => {d.items[0].pass='unknown';},'invalid status');
  changed('checklist',d => {d.denominator++;},'wrong denominator');
});
test('eight-condition checklist paginates explanations and retains global statuses/count', () => {
  const spec=byEffect('checklist');
  spec.data.denominator=8;
  spec.data.items=Array.from({length:8},(_,i)=>({
    label:`条件标签${i+1}`,explanation:`解释内容${i+1}`,
    pass:i===2||i===5?null:i!==6,
    at:5+i*20,explainSettle:10+i*20,checkAt:15+i*20,countAt:17+i*20,
  }));
  assert.deepEqual(api.validateMotion(entry(spec)),[]);
  const before=render(spec,84), after=render(spec,85), final=render(spec,179);
  assert.match(before,/条件 1–4 \/ 8/);
  assert.match(before,/解释内容1/);
  assert.doesNotMatch(before,/解释内容5/);
  assert.match(after,/条件 5–8 \/ 8/);
  assert.match(after,/解释内容5/);
  assert.doesNotMatch(after,/解释内容1/);
  assert.match(after,/已通过 3 \/ 8 项/);
  for(let i=1;i<=8;i++) assert.match(after,new RegExp(`aria-label="条件${i}：`));
  assert.match(after,/aria-label="条件3：待核实"/);
  assert.match(after,/aria-label="条件5：未核验"/);
  assert.match(final,/已通过 5 \/ 8 项/);
  assert.match(final,/aria-label="条件6：待核实"/);
  assert.match(final,/aria-label="条件7：未通过"/);
  assert.equal(final,render(spec,1000));
  spec.data.items.push({...spec.data.items[7]});spec.data.denominator=9;
  rejects(spec,'nine conditions');
});
test('market: actual increasing time, bounded values and finite numbers', () => {
  changed('market-line',d => {d.points.reverse();},'reversed observed times');
  changed('market-line',d => {d.points[1].time=d.points[0].time;},'duplicate time');
  changed('market-line',d => {d.points[0].value=Infinity;},'infinite value');
  changed('market-line',d => {d.points[0].value=d.domain[0]-1;},'out-of-domain value');
  changed('market-line',d => {d.baseline=d.domain[1]+1;},'out-of-domain baseline');
});
test('market: endpoint, benchmark and conclusion cannot appear early', () => {
  changed('market-line',d => {d.endpoint.at=d.line.at;},'early endpoint');
  changed('market-line',d => {d.benchmark.at=d.endpoint.at;},'early benchmark');
  changed('market-line',d => {d.conclusion.at=d.delta.at;},'early conclusion');
});
test('data graphics require source and unit labels', () => {
  for (const effect of ['stage-curve','market-line','threshold']) {
    changed(effect,d => {d.source='';},`${effect} source`);
    changed(effect,d => {d.unit='';},`${effect} unit`);
  }
});
test('threshold: finite zero-based domain and ordered explanation', () => {
  changed('threshold',d => {d.total=0;},'zero total');
  changed('threshold',d => {d.value=-1;},'negative value');
  changed('threshold',d => {d.value=NaN;},'NaN value');
  changed('threshold',d => {d.threshold=d.total+1;},'threshold outside domain');
  changed('threshold',d => {d.growth.at=d.setup.at;},'early growth');
  changed('threshold',d => {d.result.at=d.gap.at;},'early result');
  assert.match(render(byEffect('threshold'),179),/尚未达到数值门槛/);
});
test('paper collections reject malformed array members', () => {
  changed('keyword',d => {d.words=[null];},'null word');
  changed('keyword',d => {d.words={};},'non-array words');
  changed('film-frame',d => {d.media=null;},'null media');
});

const scenes=[{start:0,end:180},{start:180,end:360},{start:360,end:540}];
const transition = effect => ({id:`transition-${effect}`,effect,start:168,cut:180,end:192,color:'#244d68',...(effect==='iris'?{center:[540,800]}:{direction:'left'})});
for (const effect of ['color-wipe','iris']) {
  test(`${effect}: covers exactly at scene cut and clears at edges`, () => {
    const t=transition(effect);
    assert.deepEqual(api.validateTransitions([t],scenes),[]);
    assert.equal(api.transitionProgress(t,t.start),0);
    assert.equal(api.transitionProgress(t,t.cut),1);
    assert.equal(api.transitionProgress(t,t.end),0);
    assert.equal(api.transitionProgress(t,t.start-100),0);
    assert.equal(api.transitionProgress(t,t.end+100),0);
    assert.ok(api.transitionProgress(t,t.cut-1)<1);
    assert.ok(api.transitionProgress(t,t.cut+1)<1);
  });
}
test('transitions reject off-boundary cuts and overlaps', () => {
  assert.ok(api.validateTransitions([{...transition('iris'),cut:181}],scenes).length);
  assert.ok(api.validateTransitions([transition('iris'),transition('color-wipe')],scenes).length);
  assert.ok(api.validateTransitions([{...transition('iris'),cut:NaN}],scenes).length);
});
test('transitions reject concurrent foreground motion', () => {
  const occupied=clone(scenes);
  occupied[1].motion=[{...entry(fixtures[0]),start:0,end:180}];
  assert.ok(api.validateTransitions([transition('iris')],occupied).length);
});
console.log(`\n${passed} passed; ${failures.length} failed`);
if (failures.length) process.exitCode=1;
