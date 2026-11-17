// node tests/reference_boards_runtime.cjs /absolute/bundled-reference-boards.cjs
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {validateReferenceBoard,ReferenceBoard}=require(process.argv[2]);
const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../skills/newspaper-video/references/reference-boards-fixtures.json'),'utf8'));
for(const f of data.fixtures){
 assert.deepEqual(validateReferenceBoard(f.spec,data.duration),[],f.name);
 const serialized=JSON.parse(JSON.stringify(f.spec));assert.deepEqual(validateReferenceBoard(serialized,data.duration),[]);
 const svg=renderToStaticMarkup(React.createElement(ReferenceBoard,{...f,spec:serialized}));assert.match(svg,/<svg/);assert.match(svg,/viewBox="0 0 1000 /);
 const first=renderToStaticMarkup(React.createElement(ReferenceBoard,{...f,frame:0}));assert.notEqual(first,svg,'timing must alter output');
 const bad=structuredClone(f.spec);bad.source='';assert.ok(validateReferenceBoard(bad,data.duration).some(e=>e.includes('source')));
}
const stage=structuredClone(data.fixtures[0].spec);stage.segments[1].points[0].value+=1;assert.ok(validateReferenceBoard(stage,400).some(e=>e.includes('boundary')));
const check=structuredClone(data.fixtures[1].spec);check.miniPlots.pop();assert.ok(validateReferenceBoard(check,400).some(e=>e.includes('four miniPlots')));
const market=structuredClone(data.fixtures[2].spec);market.points[2].time=market.points[1].time;assert.ok(validateReferenceBoard(market,400).some(e=>e.includes('increase')));
for(const malformed of [null,{},[],{kind:'stage-board'},{kind:'market-board',secondary:null},{kind:'check-board',miniPlots:3}])assert.ok(validateReferenceBoard(malformed,400).length);
console.log('reference board fixtures, timed output, geometry and malformed JSON checks passed');
