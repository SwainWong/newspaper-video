#!/usr/bin/env node
// Run the same TypeScript validators used by rendering; no second schema to drift.
const fs=require('fs'),path=require('path'),Module=require('module');
const root=path.resolve(__dirname,'..');
const built=require('esbuild').buildSync({stdin:{contents:"export * from './src/motion'; export * from './src/collage';",resolveDir:root,loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false,packages:'external'});
const mod=new Module(path.join(root,'motion-check.cjs'),module);mod.filename=path.join(root,'motion-check.cjs');mod.paths=Module._nodeModulePaths(root);mod._compile(built.outputFiles[0].text,mod.filename);
const {validateMotion,validateTransitions,validateCollage}=mod.exports;
try{
 const timeline=JSON.parse(fs.readFileSync(process.argv[2]||path.join(root,'src/timeline.json'),'utf8'));const errors=[];
 for(const scene of timeline.scenes||[])for(const e of scene.motion||[]){errors.push(...validateMotion(e).map(x=>`${scene.id}/${e.id}: ${x}`));if(e.end>scene.end-scene.start)errors.push(`${e.id}: motion outside scene`);}
 for(const scene of timeline.scenes||[])if(scene.collage){errors.push(...validateCollage(scene.collage,scene.end-scene.start).map(x=>scene.id+': '+x));if(['motion','analysis','editorial','images','metric','comparison','timeline','detail','nestedNotes','visualBeats','metricBeats','counter'].some(k=>scene[k]&&(!Array.isArray(scene[k])||scene[k].length)))errors.push(scene.id+': collage owns its scene content');}
 errors.push(...validateTransitions(timeline.transitions||[],timeline.scenes||[]));
 console.log(JSON.stringify({status:errors.length?'FAIL':'PASS',errors},null,2));process.exitCode=errors.length?1:0;
}catch(e){console.error(e.message);process.exitCode=1;}
