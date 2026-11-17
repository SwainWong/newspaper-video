import React from 'react';
import {AbsoluteFill} from 'remotion';
import {GraphicMotion, validateGraphic, type GraphicSpec} from './motion-graphics';
import {PaperMotion, validatePaper, type PaperSpec} from './motion-paper';
export type MotionSound={file:string;at:number;gain:number;license:string};
export type MotionEntry={id:string;start:number;end:number;box:[number,number,number,number];sound?:MotionSound}&(GraphicSpec|PaperSpec);
export type Transition={id:string;effect:'color-wipe'|'iris';start:number;cut:number;end:number;color:string;direction?:'left'|'right';center?:[number,number];sound?:MotionSound};
const graphics=new Set(['split','stage-curve','checklist','market-line','threshold']);
export function validateMotion(e:MotionEntry){
 const errors:string[]=[];
 if(!e||typeof e!=='object')return ['motion entry must be object'];
 if(!e.id||!Number.isInteger(e.start)||!Number.isInteger(e.end)||e.start<0||e.end<=e.start)errors.push('Invalid motion identity/interval');
 if(!Array.isArray(e.box)||e.box.length!==4||e.box.some(x=>!Number.isFinite(x))||e.box[0]<0||e.box[1]<0||e.box[2]<=0||e.box[3]<=0||e.box[0]+e.box[2]>1080||e.box[1]+e.box[3]>1920)errors.push('Invalid motion box');
 errors.push(...validateSound(e.sound,e.end-e.start));
 if(errors.length)return errors;
 try{errors.push(...(graphics.has(e.effect)?validateGraphic(e as GraphicSpec,e.end-e.start):validatePaper(e as PaperSpec,e.end-e.start)));}catch{errors.push('Malformed motion data');}
 return errors;
}
export const MotionLayer:React.FC<{entries:MotionEntry[];frame:number;background?:boolean}>=({entries,frame,background=false})=>{if(!Array.isArray(entries))throw Error('motion must be array');for(const e of entries){const errors=validateMotion(e);if(errors.length)throw Error(errors.join('; '));}return <>{entries.filter(e=>(e.effect==='chapter-tint')===background).map(e=>{
 const errors=validateMotion(e);if(errors.length)throw Error(`${e.id}: ${errors.join('; ')}`);
 if(frame<e.start||frame>=e.end)return null;
 const [x,y,w,h]=e.box;return <div key={e.id} style={{position:'absolute',left:x,top:y,width:w,height:h,overflow:'hidden',pointerEvents:'none'}}><div style={{position:'absolute',width:900,height:900,transformOrigin:'0 0',transform:`scale(${w/900},${h/900})`}}>{graphics.has(e.effect)?<GraphicMotion spec={e as GraphicSpec} frame={frame-e.start} duration={e.end-e.start}/>:<PaperMotion spec={e as PaperSpec} frame={frame-e.start} duration={e.end-e.start}/>}</div></div>;
})}</>;};
export function transitionProgress(t:Transition,frame:number){
 if(!(t.start<t.cut&&t.cut<t.end))throw Error('Transition requires start < cut < end');
 const u=frame<=t.cut?(frame-t.start)/(t.cut-t.start):(t.end-frame)/(t.end-t.cut);return Math.max(0,Math.min(1,u));
}
export const TransitionLayer:React.FC<{items:Transition[];frame:number}>=({items,frame})=><>{items.map(t=>{
 if(frame<t.start||frame>=t.end)return null;
 const p=transitionProgress(t,frame);const before=frame<=t.cut;
 if(t.effect==='color-wipe')return <AbsoluteFill key={t.id} style={{background:t.color,transform:`translateX(${(t.direction==='right'?-1:1)*(before?p-1:1-p)*1080}px)`}}/>;
 const [x,y]=t.center??[540,800];const radius=Math.max(Math.hypot(x,y),Math.hypot(1080-x,y),Math.hypot(x,1920-y),Math.hypot(1080-x,1920-y));
 return <AbsoluteFill key={t.id} style={{background:t.color,clipPath:`circle(${radius*p}px at ${x}px ${y}px)`}}/>;
})}</>;
export function validateTransitions(items:Transition[],scenes:{start:number;end:number;motion?:MotionEntry[]}[]){
 const errors:string[]=[];if(!Array.isArray(items)||items.some(t=>!t||typeof t!=='object'))return ['transitions must be objects'];const duration=Math.max(0,...scenes.map(s=>s.end));const ids=new Set<string>();
 for(const t of items){
  errors.push(...validateSound(t.sound,t.end-t.start));
  if(!t.id||ids.has(t.id))errors.push('Unique transition id required');ids.add(t.id);
  if(!['iris','color-wipe'].includes(t.effect)||![t.start,t.cut,t.end].every(Number.isInteger)||!(0<=t.start&&t.start<t.cut&&t.cut<t.end&&t.end<=duration)||t.end-t.start<12||t.end-t.start>60)errors.push(`${t.id}: invalid transition interval/effect`);
  if(!/^#[a-f0-9]{6}$/i.test(t.color))errors.push(`${t.id}: opaque hex color required`);
  if(!scenes.some(s=>s.start===t.cut))errors.push(`${t.id}: cut must coincide with an actual scene boundary`);
  if(t.direction&&!['left','right'].includes(t.direction))errors.push(`${t.id}: invalid direction`);
  if(t.center&&(!Array.isArray(t.center)||t.center.length!==2||!t.center.every(Number.isFinite)||t.center[0]<0||t.center[0]>1080||t.center[1]<0||t.center[1]>1920))errors.push(`${t.id}: invalid center`);
  for(const s of scenes)for(const e of s.motion||[])if(e.effect!=='chapter-tint'&&Math.max(t.start,s.start+e.start)<Math.min(t.end,s.start+e.end))errors.push(`${t.id}/${e.id}: transition must complete before foreground motion`);
 }
 for(let i=0;i<items.length;i++)for(const b of items.slice(i+1))if(Math.max(items[i].start,b.start)<Math.min(items[i].end,b.end))errors.push('Overlapping transitions');return errors;
}

function validateSound(sound:MotionSound|undefined,duration:number){
 if(sound===undefined)return [];
 if(!sound||typeof sound!=='object')return ['sound must be object'];
 const file=sound.file;const valid=typeof file==='string'&&file.length>0&&!/^(?:[a-z]+:|[./\\]|public\/)/i.test(file)&&!file.split('/').some(x=>!x||x.startsWith('.'))&&!/[\\\x00-\x1f]/.test(file);
 return valid&&Number.isInteger(sound.at)&&sound.at>=0&&sound.at<duration&&Number.isFinite(sound.gain)&&sound.gain>=0&&sound.gain<=1&&typeof sound.license==='string'&&sound.license.trim()?[]:['invalid sound asset/time/gain/license'];
}
