import React, {CSSProperties} from 'react';
import {AbsoluteFill, Img, OffthreadVideo, staticFile} from 'remotion';
import {GraphicMotion, type GraphicSpec} from './motion-graphics';
import {PaperMotion, type PaperSpec} from './motion-paper';
import {validateMotion} from './motion';
import {ReferenceBoard, validateReferenceBoard, type ReferenceBoardSpec} from './reference-boards';

export type Box=[number,number,number,number];
export type Entry={kind:'none'|'fade'|'slide-x'|'slide-y'|'scale'|'wipe-x';distance?:number};
export type TypeStyle={fontFamily?:string;fontSize:number;fontWeight?:number;color?:string;align?:'left'|'center'|'right';background?:string;lineHeight?:number;padding?:number;shadow?:string;boxShadow?:string;stroke?:number;letterSpacing?:number;scaleX?:number};
type Base={id:string;box:Box;at:number;settle:number;end:number;rotation?:number;entry?:Entry;focus?:boolean;reposition?:{at:number;settle:number;from:[number,number]};group?:string;role:'primary'|'support'|'decoration';meaning:string};
export type CollageNode=Base & (
 | {kind:'text';text:string;style:TypeStyle;inkReveal?:{at:number;settle:number;outlineColor:string}}
 | {kind:'photo';file:string;fit?:'cover'|'contain';border?:number;paper?:string;label?:string;labelSize?:number;attachment?:'pin'|'tape'|'none';grayscale?:boolean;video?:boolean}
 | {kind:'compare';variant:'strip'|'hero';left:{title:string;detail:string;color:string};right:{title:string;detail:string;color:string};relation:'VS'|'+'|'<'|'>'|'=';relationMeaning:string;leftAt:number;leftSettle:number;rightAt:number;rightSettle:number;relationAt:number;relationSettle:number;titleSize:number;detailSize:number;badgeSize:number;badgeColor?:string;fontFamily?:string;badgeRotation?:number}
 | {kind:'icon';symbol:'wallet'|'television'|'ballot';tile:string;ink?:string;caption?:string;captionColor?:string}
 | {kind:'timeline';items:{label:string;detail:string;at:number}[];fontSize:number;color?:string}
 | {kind:'line-chart';points:{x:number;y:number}[];domain:[number,number];source:string;title:string;unit:string;color?:string;drawAt:number;drawSettle:number;revealStops?:{at:number;x:number}[];xLabels?:{x:number;label:string}[];connectionLabel?:string;annotation?:string}
 | {kind:'board';spec:ReferenceBoardSpec}
 | {kind:'motion';spec:GraphicSpec|PaperSpec}
);
export type CollageSound={nodeId:string;anchor:'entry'|'settle'|'leftEntry'|'rightEntry'|'relation'|'ink'|'reposition'|'draw';kind:'paper'|'tick'|'whoosh';file:string;gain:number;tailFrames:number;license:string};
export function soundAt(n:CollageNode,anchor:CollageSound['anchor']):number{
 if(anchor==='entry')return n.at;if(anchor==='settle')return n.settle;
 if(anchor==='leftEntry'&&n.kind==='compare')return n.leftAt;if(anchor==='rightEntry'&&n.kind==='compare')return n.rightAt;if(anchor==='relation'&&n.kind==='compare')return n.relationSettle;
 if(anchor==='ink'&&n.kind==='text'&&n.inkReveal)return n.inkReveal.settle;if(anchor==='reposition'&&n.reposition)return n.reposition.settle;if(anchor==='draw'&&n.kind==='line-chart')return n.drawSettle;return NaN;
}
export type Collage={preset:string;sounds?:CollageSound[];background?:{file?:string;color?:string;opacity?:number};nodes:CollageNode[];captionBox:Box;captionSize?:number;translationSize?:number;captionFont?:string;captionOverlay?:{nodeIds:string[];reason:string};allowOverlaps?:{a:string;b:string;reason:string}[]};
const serif='"Songti SC", "Noto Serif CJK SC", serif';
const sans='"PingFang SC", "Heiti SC", "Noto Sans CJK SC", sans-serif';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const progress=(f:number,a:number,b:number)=>a===b?(f>=a?1:0):clamp((f-a)/(b-a));
const ease=(v:number)=>1-Math.pow(1-v,3);
// Stop times are scene-local frames, like drawAt/drawSettle. Equal x values hold the reveal.
const chartProgress=(n:Extract<CollageNode,{kind:'line-chart'}>,frame:number):number=>{
 const stops=n.revealStops;if(!stops)return ease(progress(frame,n.drawAt,n.drawSettle));
 if(frame<=stops[0].at)return stops[0].x;
 for(let i=1;i<stops.length;i++)if(frame<=stops[i].at){const a=stops[i-1],b=stops[i];return a.x+(b.x-a.x)*progress(frame,a.at,b.at);}
 return stops[stops.length-1].x;
};
const local=(s:unknown):s is string=>typeof s==='string'&&s.trim().length>0&&!/^(?:[a-z][a-z0-9+.-]*:|[./\\]|public\/)/i.test(s)&&!s.split('/').some(x=>!x||x.startsWith('.'))&&!/[\\\x00-\x1f]/.test(s);
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const boxOK=(b:unknown):b is Box=>Array.isArray(b)&&b.length===4&&b.every(finite)&&b[0]>=0&&b[1]>=0&&b[2]>0&&b[3]>0&&b[0]+b[2]<=1080&&b[1]+b[3]<=1920;
const rectOverlap=(a:Box,b:Box)=>Math.max(a[0],b[0])<Math.min(a[0]+a[2],b[0]+b[2])&&Math.max(a[1],b[1])<Math.min(a[1]+a[3],b[1]+b[3]);
export function movingEnd(n:CollageNode):number{
 if(n.reposition)return Math.max(n.reposition.settle,movingEnd({...n,reposition:undefined}));
 if(n.kind==='text'&&n.inkReveal)return Math.max(n.settle,n.inkReveal.settle);
 if(n.kind==='compare')return n.relationSettle;
 if(n.kind==='line-chart')return n.drawSettle;
 if(n.kind==='timeline')return Math.max(n.settle,...n.items.map(i=>i.at+12));
 // Complex boards, inner motion and video have their own timed reveals: reserve whole lifetime conservatively.
 if(n.kind==='board'||n.kind==='motion'||(n.kind==='photo'&&n.video))return n.end;
 return n.settle;
}
export function motionBounds(n:CollageNode):Box{
 if(n.reposition){const a=motionBounds({...n,reposition:undefined}),b=motionBounds({...n,reposition:undefined,box:[...n.reposition.from,n.box[2],n.box[3]]});const x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]);return [x,y,Math.max(a[0]+a[2],b[0]+b[2])-x,Math.max(a[1]+a[3],b[1]+b[3])-y];}
 const [x,y,w,h]=n.box;
 if(n.kind==='compare')return [0,y,1080,h];
 const r=Math.abs(n.rotation??0)*Math.PI/180;
 const rw=w*Math.cos(r)+h*Math.sin(r),rh=h*Math.cos(r)+w*Math.sin(r);
 const d=n.entry?.distance??32,dx=n.entry?.kind==='slide-x'?d:0,dy=n.entry?.kind==='slide-y'?d:0;
 // Bounds include translation and rotation at every point of monotone entrance.
 return [x+(w-rw)/2+Math.min(0,dx),y+(h-rh)/2+Math.min(0,dy),rw+Math.abs(dx),rh+Math.abs(dy)];
}
export function validateCollage(c:Collage,duration:number):string[]{
 const errors:string[]=[];const fail=(s:string)=>errors.push(s);
 if(!c||typeof c!=='object'||!Array.isArray(c.nodes))return ['collage requires nodes'];
 if(!Number.isInteger(duration)||duration<1)return ['collage duration invalid'];
 if(typeof c.preset!=='string'||!c.preset.trim())fail('collage preset required');
 if(!boxOK(c.captionBox))fail('collage caption box invalid');
 if(c.background?.file&&!local(c.background.file))fail('background must be a local asset');
 if(c.background?.opacity!==undefined&&(!finite(c.background.opacity)||c.background.opacity<0||c.background.opacity>1))fail('background opacity invalid');
 if(c.captionSize!==undefined&&(!finite(c.captionSize)||c.captionSize<20||c.captionSize>100))fail('caption size invalid');
 const ids=new Set<string>();
 for(const n of c.nodes){
  if(!n||typeof n!=='object'){fail('node must be object');continue;}
  if(typeof n.id!=='string'||!n.id||ids.has(n.id))fail('unique collage node id required');ids.add(n.id);
  if(!boxOK(n.box)){fail(n.id+': invalid box');continue;}
  if(![n.at,n.settle,n.end].every(Number.isInteger)||!(0<=n.at&&n.at<=n.settle&&n.settle<n.end&&n.end<=duration))fail(n.id+': invalid timing');
  if(n.rotation!==undefined&&(!finite(n.rotation)||Math.abs(n.rotation)>20))fail(n.id+': rotation limited to ±20 degrees');
  if(!['primary','support','decoration'].includes(n.role)||typeof n.meaning!=='string'||!n.meaning.trim())fail(n.id+': role/meaning required');
  if(n.entry&&(!['none','fade','slide-x','slide-y','scale','wipe-x'].includes(n.entry.kind)||(n.entry.distance!==undefined&&(!finite(n.entry.distance)||Math.abs(n.entry.distance)>300))))fail(n.id+': invalid entrance');
  if(n.reposition){const p=n.reposition;if(!Array.isArray(p.from)||!boxOK([...p.from,n.box[2],n.box[3]])||![p.at,p.settle].every(Number.isInteger)||!(n.settle<=p.at&&p.at<p.settle&&p.settle<n.end))fail(n.id+': reposition must follow entrance and remain on canvas');}
  try{
   if(n.kind==='text'){
    if(typeof n.text!=='string'||!n.text.trim()||n.text.length>160)fail(n.id+': short text required');
    if(!n.style||!finite(n.style.fontSize)||n.style.fontSize<16||n.style.fontSize>240)fail(n.id+': font size must be16..240');
    for(const key of ['lineHeight','padding','stroke','letterSpacing','scaleX','fontWeight'] as const)if(n.style?.[key]!==undefined&&!finite(n.style[key]))fail(n.id+': nonfinite type style');
    if(n.inkReveal){const p=n.inkReveal;if(!p.outlineColor||![p.at,p.settle].every(Number.isInteger)||!(n.settle<=p.at&&p.at<p.settle&&p.settle<n.end))fail(n.id+': ink fill must follow title entrance');}
    if(n.style.scaleX!==undefined&&(n.style.scaleX<.6||n.style.scaleX>1.5))fail(n.id+': scaleX must be0.6..1.5');
   }else if(n.kind==='photo'){
    if(!local(n.file))fail(n.id+': photo asset required');
    if(n.fit&&!['contain','cover'].includes(n.fit))fail(n.id+': invalid media fit');
    if(n.border!==undefined&&(!finite(n.border)||n.border<0||n.border>40))fail(n.id+': border invalid');
   }else if(n.kind==='compare'){
    if(!['strip','hero'].includes(n.variant)||!['VS','+','<','>','='].includes(n.relation)||!n.relationMeaning?.trim())fail(n.id+': relation semantics required');
    for(const s of [n.left,n.right])if(!s||typeof s.title!=='string'||!s.title.trim()||typeof s.detail!=='string'||!/^#[0-9a-f]{6}$/i.test(s.color))fail(n.id+': compare side required');
    if(![n.leftAt,n.leftSettle,n.rightAt,n.rightSettle,n.relationAt,n.relationSettle].every(Number.isInteger)||!(n.at<=n.leftAt&&n.leftAt<n.leftSettle&&n.leftAt<=n.rightAt&&n.rightAt<n.rightSettle&&Math.max(n.leftSettle,n.rightSettle)<=n.relationAt&&n.relationAt<n.relationSettle&&n.relationSettle<n.end))fail(n.id+': compare objects must precede relationship');
    if(![n.titleSize,n.detailSize,n.badgeSize].every(v=>finite(v)&&v>0)||n.badgeSize>n.box[3]*1.05)fail(n.id+': comparison sizes invalid');
   }else if(n.kind==='icon'){
    if(!['wallet','television','ballot'].includes(n.symbol))fail(n.id+': unknown symbol');
   }else if(n.kind==='timeline'){
    if(!Array.isArray(n.items)||n.items.length<2||n.items.length>6||!finite(n.fontSize))fail(n.id+': timeline needs2..6 items');
    else for(const item of n.items)if(!item.label||!Number.isInteger(item.at)||item.at<n.at||item.at+12>=n.end)fail(n.id+': timeline anchor invalid');
   }else if(n.kind==='line-chart'){
    if(!Array.isArray(n.domain)||n.domain.length!==2||!n.domain.every(finite)||n.domain[0]>=n.domain[1]||!n.title?.trim()||!n.source?.trim()||!n.unit?.trim())fail(n.id+': chart domain/source/title/unit required');
    if(!Array.isArray(n.points)||n.points.length<2||n.points.some((p,i)=>!finite(p.x)||!finite(p.y)||p.x<0||p.x>1||p.y<n.domain[0]||p.y>n.domain[1]||(i>0&&p.x<=n.points[i-1].x)))fail(n.id+': increasing normalized x and bounded observed y required');
    if(!Number.isInteger(n.drawAt)||!Number.isInteger(n.drawSettle)||!(n.at<=n.drawAt&&n.drawAt<n.drawSettle&&n.drawSettle<n.end))fail(n.id+': chart draw time invalid');
    if(n.revealStops!==undefined){
     const stops=n.revealStops;
     if(!Array.isArray(stops)||stops.length<2||stops.length>64||stops.some((s,i)=>!s||!Number.isInteger(s.at)||s.at<n.drawAt||s.at>n.drawSettle||!finite(s.x)||s.x<0||s.x>1||(i>0&&(s.at<=stops[i-1].at||s.x<stops[i-1].x)))||stops[0]?.x!==0||stops[stops.length-1]?.x!==1)fail(n.id+': revealStops need 2..64 increasing frames within draw interval, nondecreasing normalized x, endpoints 0 and 1');
    }
    if(n.connectionLabel!==undefined&&(typeof n.connectionLabel!=='string'||!n.connectionLabel.trim()||n.connectionLabel.length>64||/[\r\n]/.test(n.connectionLabel)))fail(n.id+': connectionLabel needs 1..64 characters on one line');
    if(n.xLabels!==undefined){
     const labels=n.xLabels;
     if(!Array.isArray(labels)||labels.length<1||labels.length>8||n.box[2]<240||n.box[3]<260||labels.some((t,i)=>!t||!finite(t.x)||t.x<0||t.x>1||typeof t.label!=='string'||!t.label.trim()||t.label.length>16||/[\r\n]/.test(t.label)||(i>0&&t.x<=labels[i-1].x)))fail(n.id+': xLabels need 1..8 increasing normalized positions and 1..16 character labels in a chart at least 240 by 260');
     else {
      // Conservative 17px per character also accommodates full-width date labels.
      const spans=labels.map(t=>{const width=t.label.length*17,cx=55+t.x*(n.box[2]-90);return t.x===0?[cx,cx+width]:t.x===1?[cx-width,cx]:[cx-width/2,cx+width/2];});
      if(spans.some((s,i)=>s[0]<0||s[1]>n.box[2]||(i>0&&s[0]<spans[i-1][1]+8)))fail(n.id+': xLabels need readable spacing within chart bounds');
     }
    }
   }else if(n.kind==='board')errors.push(...validateReferenceBoard(n.spec,n.end-n.at).map(x=>n.id+': '+x));
   else if(n.kind==='motion')errors.push(...validateMotion({id:n.id,start:0,end:n.end-n.at,box:[0,0,900,900],...n.spec}).map(x=>n.id+': '+x));
   else fail('unknown collage node kind');
   if(n.focus===false&&movingEnd(n)>n.at)fail(n.id+': moving content cannot disable focus');
  }catch{fail(n.id+': malformed node data');}
 }
 if(c.sounds!==undefined&&!Array.isArray(c.sounds))fail('sounds must be array');
 else for(const cue of c.sounds??[]){if(!cue||typeof cue!=='object'){fail('sound must be object');continue;}const n=c.nodes.find(n=>n?.id===cue?.nodeId),at=n?soundAt(n,cue.anchor):NaN;if(!n||!finite(at)||!local(cue.file)||!cue.license?.trim()||!finite(cue.gain)||cue.gain<0||cue.gain>1||!Number.isInteger(cue.tailFrames)||cue.tailFrames<1||at+cue.tailFrames>duration)fail('sound needs node anchor, local asset, license, gain and bounded tail');if(!['paper','tick','whoosh'].includes(cue?.kind))fail('unknown sound category');if(['entry','leftEntry','rightEntry'].includes(cue?.anchor)&&cue.kind!=='whoosh')fail('travel cue must use whoosh');if(!['entry','leftEntry','rightEntry'].includes(cue?.anchor)&&cue.kind==='whoosh')fail('landing cue must use paper or tick');}
 const overlaps=c.allowOverlaps??[];
 if(!Array.isArray(overlaps))return [...errors,'allowOverlaps must be array'];
 for(const o of overlaps)if(!o||!ids.has(o.a)||!ids.has(o.b)||o.a===o.b||!o.reason?.trim())fail('overlap exception requires two nodes and reason');
 if(c.captionOverlay&&(!Array.isArray(c.captionOverlay.nodeIds)||!c.captionOverlay.reason?.trim()||c.captionOverlay.nodeIds.some(id=>!ids.has(id)||c.nodes.find(n=>n.id===id)?.kind==='text')))fail('caption overlay must name non-text nodes and explain empty placement area');
 if(errors.length)return errors;
 for(const n of c.nodes){
  if(n.role!=='decoration'&&!c.captionOverlay?.nodeIds.includes(n.id)&&rectOverlap(motionBounds(n),c.captionBox))fail(n.id+': entrance/rotation crosses caption safe area');
  for(const b of c.nodes){
   if(n.id>=b.id||Math.max(n.at,b.at)>=Math.min(n.end,b.end))continue;
   const group=n.group&&n.group===b.group;
   const allow=overlaps.some(o=>(o.a===n.id&&o.b===b.id)||(o.b===n.id&&o.a===b.id));
   if(rectOverlap(motionBounds(n),motionBounds(b))&&!group&&!allow&&n.role!=='decoration'&&b.role!=='decoration')fail(n.id+'/'+b.id+': occupied regions collide');
   if(n.focus!==false&&b.focus!==false&&!group&&Math.max(n.at,b.at)<Math.min(movingEnd(n),movingEnd(b)))fail(n.id+'/'+b.id+': competing motion focus');
  }
 }
 return errors;
}
const TextNode:React.FC<{n:Extract<CollageNode,{kind:'text'}>;frame:number}>=({n,frame})=>{
 const s=n.style,p=n.inkReveal?progress(frame,n.inkReveal.at,n.inkReveal.settle):1;return <div style={{width:'100%',height:'100%',boxSizing:'border-box',fontFamily:s.fontFamily??serif,fontSize:s.fontSize,fontWeight:s.fontWeight??600,color:s.color??'#11100d',background:s.background??'transparent',lineHeight:s.lineHeight??1.12,padding:s.padding??0,textAlign:s.align??'left',letterSpacing:s.letterSpacing??0,whiteSpace:'pre-wrap',overflowWrap:'break-word',textShadow:p===1?s.shadow:undefined,WebkitTextFillColor:n.inkReveal?`color-mix(in srgb, ${s.color??'#11100d'} ${p*100}%, transparent)`:undefined,boxShadow:s.boxShadow,WebkitTextStroke:s.stroke?`${s.stroke}px ${n.inkReveal?.outlineColor??s.color??'#11100d'}`:undefined,transform:s.scaleX?`scaleX(${s.scaleX})`:undefined,transformOrigin:'left center'}}>{n.text}</div>;
};
const badgeScale=(p:number)=>{const x=p-1;return .6+.4*(1+3*x*x*x+2*x*x);};
const Comparison:React.FC<{n:Extract<CollageNode,{kind:'compare'}>;frame:number}>=({n,frame})=>{
 const [,,w,h]=n.box;const badge=n.badgeSize;const hTitle=n.variant==='hero'?h*.39:h*.33;
 return <div style={{width:w,height:h,position:'relative',fontFamily:n.fontFamily??serif}}>{[n.left,n.right].map((s,i)=>{
  const p=ease(progress(frame,i?n.rightAt:n.leftAt,i?n.rightSettle:n.leftSettle));
  return <div key={i} style={{position:'absolute',left:i?w/2:0,top:0,width:w/2,height:h,transform:`translateX(${(i?1:-1)*(1-p)*1080}px)`,background:`linear-gradient(${i?270:90}deg,#00000033,transparent 78%),${s.color}`,color:'#fffbed',textAlign:'center',paddingTop:n.variant==='hero'?h*.185:h*.23,boxSizing:'border-box'}}><div style={{height:hTitle,fontFamily:sans,fontSize:n.titleSize,fontWeight:400,lineHeight:1.12,whiteSpace:'pre-line'}}>{s.title}</div><div style={{fontSize:n.detailSize,fontWeight:700,lineHeight:1.2,whiteSpace:'pre-line',padding:'0 12px'}}>{s.detail}</div></div>;
 })}<div style={{position:'absolute',width:badge,height:badge,left:(w-badge)/2,top:(h-badge)/2,borderRadius:'50%',background:n.badgeColor??'#ecc84b',border:`${Math.max(4,badge*.035)}px solid #211b12`,boxSizing:'border-box',boxShadow:'3px 6px 0 #0009',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:serif,fontSize:badge*.65,color:'#15120c',opacity:progress(frame,n.relationAt,n.relationSettle),transform:`rotate(${n.badgeRotation??-8}deg) scale(${badgeScale(progress(frame,n.relationAt,n.relationSettle))})`}}>{n.relation}</div></div>;
};
const Icon:React.FC<{n:Extract<CollageNode,{kind:'icon'}>}>=({n})=><div style={{width:'100%',height:'100%',borderRadius:28,background:n.tile,boxShadow:'8px 12px 0 #17140c',position:'relative'}}><svg width="100%" height="100%" viewBox="0 0 300 300" aria-label={n.symbol} style={{color:n.ink??'#18140f'}}>{n.symbol==='wallet'?<g fill="none" stroke="currentColor" strokeWidth="14" strokeLinejoin="round"><rect x="60" y="96" width="180" height="132" rx="14"/><path d="M61 123H237M64 96V81Q64 69 81 69H222Q237 69 237 84V111"/><circle cx="211" cy="164" r="7" fill="currentColor"/></g>:n.symbol==='ballot'?<g fill="none" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round"><path d="M73 140L51 184V244H247V184L225 140H73ZM51 184H247M117 152H184"/><path d="M112 135L84 73L178 36L207 107L148 131"/><path d="M115 79L139 95L170 55"/></g>:<g fill="none" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round"><rect x="55" y="110" width="192" height="130" rx="12"/><path d="M98 61L151 111L204 61"/></g>}</svg>{n.caption&&<div style={{position:'absolute',left:12,top:-50,padding:'10px 20px',background:n.captionColor??'#bb2d20',font:`bold 64px ${sans}`,color:'#fff7dc',transform:'rotate(-5deg)',boxShadow:'4px 6px #0008'}}>{n.caption}</div>}</div>;
const Timeline:React.FC<{n:Extract<CollageNode,{kind:'timeline'}>;frame:number}>=({n,frame})=><div style={{height:'100%',position:'relative',fontFamily:serif}}><div style={{position:'absolute',left:15,right:15,top:75,height:5,background:n.color??'#1e1c14'}}/>{n.items.map((i,k)=><div key={k} style={{position:'absolute',left:`${k*100/(n.items.length-1)}%`,top:0,width:145,marginLeft:k===0?0:k===n.items.length-1?-145:-72,textAlign:'center',opacity:progress(frame,i.at,i.at+12)}}><span style={{fontSize:n.fontSize,background:'#f0e7ce',padding:'3px 9px',border:'1px solid #2c271d'}}>{i.label}</span><div style={{margin:'22px auto 14px',width:14,height:14,background:'#15120c',borderRadius:'50%'}}/><div style={{fontSize:n.fontSize*.7,fontWeight:700}}>{i.detail}</div></div>)}</div>;
export const CollageStage:React.FC<{data:Collage;frame:number;duration:number}>=({data,frame,duration})=>{
 const errors=validateCollage(data,duration);if(errors.length)throw Error(errors.join('; '));
 return <AbsoluteFill>{data.background&&<AbsoluteFill style={{background:data.background.color,opacity:data.background.opacity??1}}>{data.background.file&&<Img src={staticFile(data.background.file)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>}</AbsoluteFill>}{data.nodes.map(n=>{
 if(frame<n.at||frame>=n.end)return null;
 const q=ease(progress(frame,n.at,n.settle)),kind=n.entry?.kind??'none',distance=n.entry?.distance??32;
 const [bx,by,w,h]=n.box,rp=n.reposition?ease(progress(frame,n.reposition.at,n.reposition.settle)):1;const x=n.reposition?n.reposition.from[0]+(bx-n.reposition.from[0])*rp:bx,y=n.reposition?n.reposition.from[1]+(by-n.reposition.from[1])*rp:by;const style:CSSProperties={position:'absolute',left:x,top:y,width:w,height:h,transformOrigin:'center',transform:`translate(${kind==='slide-x'?(1-q)*distance:0}px,${kind==='slide-y'?(1-q)*distance:0}px) rotate(${n.rotation??0}deg) scale(${kind==='scale'?.85+.15*q:1})`,opacity:kind==='none'||kind==='wipe-x'?1:q,clipPath:kind==='wipe-x'?`inset(0 ${100*(1-q)}% 0 0)`:undefined};
 let child:React.ReactNode;
 if(n.kind==='text')child=<TextNode n={n} frame={frame}/>;
 else if(n.kind==='compare')child=<Comparison n={n} frame={frame}/>;
 else if(n.kind==='icon')child=<Icon n={n}/>;
 else if(n.kind==='timeline')child=<Timeline n={n} frame={frame}/>;
 else if(n.kind==='line-chart'){
  const left=55,top=70,bottom=h-(n.xLabels?124:100),p=chartProgress(n,frame);
  const xy=(pt:{x:number;y:number})=>[left+pt.x*(w-left-35),bottom-(pt.y-n.domain[0])/(n.domain[1]-n.domain[0])*(bottom-top)];
  const pts=n.points.map(pt=>xy(pt).join(',')).join(' ');
  child=<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{background:'#f6efd9',fontFamily:serif}}><text x={20} y={36} fontSize={28} fontWeight={700}>{n.title}</text>{[0,.25,.5,.75,1].map(q=><line key={q} x1={left} x2={w-35} y1={top+q*(bottom-top)} y2={top+q*(bottom-top)} stroke="#c7c0af" strokeDasharray="3 5"/>)}<path d={`M${left} ${top}V${bottom}H${w-35}`} fill="none" stroke="#6f6655"/><svg data-chart-reveal="true" x={left} y={top} width={(w-left-35)*p} height={bottom-top+4} viewBox={`${left} ${top} ${(w-left-35)*p||.001} ${bottom-top+4}`} overflow="hidden"><polyline points={pts} fill="none" stroke={n.color??'#b7241c'} strokeWidth={7} strokeLinejoin="round"/></svg><text x={4} y={top+16} fontSize={17}>{n.domain[1]}</text><text x={10} y={bottom} fontSize={17}>{n.domain[0]}</text><g>{n.xLabels?.map((tick,i)=><g key={i}><line x1={left+tick.x*(w-left-35)} x2={left+tick.x*(w-left-35)} y1={bottom} y2={bottom+5} stroke="#6f6655"/><text x={left+tick.x*(w-left-35)} y={bottom+24} fontSize={17} textAnchor={tick.x===0?'start':tick.x===1?'end':'middle'}>{tick.label}</text></g>)}</g><text x={20} y={h-62} fontSize={21}>{n.unit} · {n.connectionLabel??'观测点直线连接'}</text><text x={20} y={h-26} fontSize={20}>{n.source}</text>{n.annotation&&frame>=n.drawSettle&&<g transform={`translate(${w-170} 40) rotate(-5)`}><rect width={150} height={75} fill="#b5281e"/><text x={75} y={54} fontSize={48} fill="#fff3d8" textAnchor="middle">{n.annotation}</text></g>}</svg>;
 }
 else if(n.kind==='board')child=<ReferenceBoard spec={n.spec} frame={frame-n.at} width={w} height={h}/>;
 else if(n.kind==='motion')child=<div style={{width:900,height:900,transformOrigin:'0 0',transform:`scale(${w/900},${h/900})`}}>{['split','stage-curve','checklist','market-line','threshold'].includes(n.spec.effect)?<GraphicMotion spec={n.spec as GraphicSpec} frame={frame-n.at} duration={n.end-n.at}/>:<PaperMotion spec={n.spec as PaperSpec} frame={frame-n.at} duration={n.end-n.at}/>}</div>;
 else child=<div style={{width:'100%',height:'100%',boxSizing:'border-box',padding:n.border??10,paddingBottom:n.label?(n.labelSize??28)+15:n.border??10,background:n.paper??'#f1ead5',boxShadow:'3px 6px 10px #0005',position:'relative'}}>{n.video?<OffthreadVideo src={staticFile(n.file)} muted style={{width:'100%',height:'100%',objectFit:n.fit??'cover',filter:n.grayscale?'grayscale(1)':undefined}}/>:<Img src={staticFile(n.file)} style={{width:'100%',height:'100%',objectFit:n.fit??'cover',filter:n.grayscale?'grayscale(1)':undefined}}/>}{n.label&&<div style={{font:`bold ${n.labelSize??28}px ${serif}`,paddingTop:3,whiteSpace:'nowrap'}}>{n.label}</div>}{n.attachment==='pin'&&<Img src={staticFile('pin.svg')} style={{position:'absolute',width:40,height:44,top:-25,left:'48%'}}/>}{n.attachment==='tape'&&<Img src={staticFile('tape.svg')} style={{position:'absolute',width:140,height:42,top:-12,left:-20,transform:'rotate(-18deg)'}}/>}</div>;
 return <div key={n.id} style={style}>{child}</div>;
 })}</AbsoluteFill>;
};
