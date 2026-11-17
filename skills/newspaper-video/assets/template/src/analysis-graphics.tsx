import React, {useEffect, useState} from 'react';
import {Img, staticFile, interpolate, delayRender, continueRender, cancelRender} from 'remotion';

import {evidenceCamera} from './evidence-camera';

const ink='#18313a', red='#ae342c', cream='#f4eddb', yellow='#efd164';
const ramp=(f:number,at:number,d=18)=>interpolate(f,[at,at+d],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});

/** Fixed, versioned channel identity. Intro and outro must call the same component. */
export const BrandLockup:React.FC<{frame:number}>=({frame})=>{
 const [handle]=useState(()=>delayRender('Load pinned brand font'));
 useEffect(()=>{let active=true;const font=new FontFace('NewspaperBrand',`url(${staticFile('brand/Inter.ttf')})`,{weight:'100 900'});font.load().then(f=>{document.fonts.add(f);if(active)continueRender(handle)}).catch(cancelRender);return()=>{active=false;continueRender(handle)}},[handle]);
 const a=ramp(frame,0,14);
 return <div data-brand-lockup="swaintalk-v1" style={{position:'absolute',left:120,top:620,width:840,height:440,opacity:a,transform:`translateY(${(1-a)*18}px)`,textAlign:'center'}}>
  <Img src={staticFile('brand/swaintalk-logo.png')} style={{position:'absolute',left:0,top:0,width:840,height:280,objectFit:'contain'}}/>
  <div style={{position:'absolute',left:0,top:300,width:840,fontFamily:'NewspaperBrand',fontSize:44,fontWeight:700,lineHeight:'56px',letterSpacing:0,color:ink}}>Follow the Tech,<br/>Follow the Money.</div>
 </div>;
};

export type DataComparisonSpec={title:string;unit:string;period:string;status:string;source:string;domain:[number,number];precision?:number;rows:{label:string;value:number;at:number;color?:string}[];summary?:string;summaryAt?:number};
/** Same metric, unit and period; row.at comes from narration, never index staggering. */
export const DataComparison:React.FC<{data:DataComparisonSpec;frame:number}>=({data,frame})=>{
 const [lo,hi]=data.domain;const w=850;const zero=(0-lo)/(hi-lo)*w;
 if(!(lo<=0&&hi>lo&&hi>=0)||data.rows.some(r=>!Number.isFinite(r.value)||r.value<lo||r.value>hi)||data.rows.length>4)throw Error('Invalid comparison domain or rows');
 return <div style={{position:'absolute',left:65,top:390,width:950,color:ink,fontFamily:'Arial'}}>
  <div style={{background:cream,padding:24,boxShadow:'4px 9px 15px #0003'}}><div style={{fontSize:40,fontWeight:800}}>{data.title}</div><div style={{fontSize:30,marginTop:14}}>{data.period} · {data.unit} · {data.status}</div>
   {data.rows.map((row,i)=>{const p=ramp(frame,row.at,24);const target=(row.value-lo)/(hi-lo)*w;return <div key={i} style={{height:190,marginTop:22,opacity:frame<row.at?0:1}}><div style={{fontSize:38,fontWeight:700,display:'flex',justifyContent:'space-between',width:w}}><span>{row.label}</span><span>{(row.value*p).toFixed(data.precision??1)}{data.unit==='%'?'%':''}</span></div><div style={{position:'relative',width:w,height:68,marginTop:18,background:'#d8d0bd'}}><div style={{position:'absolute',left:zero,top:-5,height:78,borderLeft:'3px solid '+ink}}/><div style={{position:'absolute',left:Math.min(zero,zero+(target-zero)*p),width:Math.abs(target-zero)*p,height:68,background:row.color??[red,'#294f68','#bd9138'][i%3]}}/></div></div>})}
   <div style={{fontSize:26,lineHeight:1.35,borderTop:'2px solid #b9ad91',paddingTop:16}}>Source: {data.source}</div>
  </div>{data.summary&&<div style={{marginTop:25,padding:20,background:yellow,fontSize:37,fontWeight:700,opacity:frame>=(data.summaryAt??Infinity)?1:0}}>{data.summary}</div>}
 </div>;
};

export type EvidenceFocusSpec={file:string;publisher:string;published:string;documentLabel:string;imageWidth:number;imageHeight:number;crop:{x:number;y:number;width:number;height:number};focusAt:number;zoomFrames?:number;marks:{x:number;y:number;width:number;height:number;at:number}[];summary:string;summaryAt:number};
/** A persistent source plane; camera and highlights share the same coordinates. */
export const EvidenceFocus:React.FC<{data:EvidenceFocusSpec;frame:number}>=({data,frame})=>{
 const duration=data.zoomFrames??24;
 if(duration<12)throw Error('Evidence zoom must be a visible continuous move');
 const camera=evidenceCamera(data.imageWidth,data.imageHeight,data.crop,(frame-data.focusAt)/duration);
 const arrived=data.focusAt+duration;
 const outline=frame>=data.focusAt-12&&frame<arrived;
 return <div style={{position:'absolute',left:65,top:370,width:950,color:ink,fontFamily:'Arial'}}>
  <div style={{fontSize:32,fontWeight:800,background:ink,color:cream,padding:20}}>{data.publisher} · {data.documentLabel}<div style={{fontSize:26,fontWeight:400,marginTop:10}}>{data.published}</div></div>
  <div style={{position:'relative',marginTop:20,width:900,height:camera.height,border:'15px solid '+cream,background:'white',overflow:'hidden',boxShadow:'5px 8px 14px #0004'}}>
   <div style={{position:'absolute',left:0,top:0,width:data.imageWidth,height:data.imageHeight,transformOrigin:'0 0',transform:`translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`}}>
    <Img src={staticFile(data.file)} style={{position:'absolute',left:0,top:0,width:data.imageWidth,height:data.imageHeight}}/>
    {outline&&<div style={{position:'absolute',left:data.crop.x,top:data.crop.y,width:data.crop.width,height:data.crop.height,boxSizing:'border-box',border:`${3/camera.scale}px solid ${red}`,opacity:1-camera.progress}}/>}
    {data.marks.map((m,i)=><div key={i} style={{position:'absolute',left:m.x,top:m.y,width:m.width*ramp(frame,Math.max(m.at,arrived),16),height:m.height,background:'#ffd934',opacity:.5,mixBlendMode:'multiply'}}/>)}
   </div>
  </div>{frame>=Math.max(data.summaryAt,arrived)&&<div style={{marginTop:25,padding:25,background:yellow,fontSize:43,fontWeight:700,lineHeight:1.3}}><div style={{fontSize:25,marginBottom:12}}>KEY POINT · EDITORIAL SUMMARY</div>{data.summary}</div>}
 </div>;
};

export type RelationStep={at:number;heading:string;detail:string;color?:string;image?:string;imageFit?:'cover'|'contain';edgeFromPrevious?:string};
/** Every connector describes a relation between its two adjacent visible cards. */
export const RelationSteps:React.FC<{steps:RelationStep[];frame:number}>=({steps,frame})=>{
 if(steps.length>4||steps.some((s,i)=>i>0&&!s.edgeFromPrevious?.trim()))throw Error('Every relation needs an explicit connecting label');
 return <div style={{position:'absolute',left:80,top:380,width:920,fontFamily:'Arial',color:ink}}>{steps.map((s,i)=><React.Fragment key={i}>{i>0&&<div style={{height:72,fontSize:30,textAlign:'center',opacity:ramp(frame,s.at),display:'flex',alignItems:'center',justifyContent:'center',gap:16}}><span style={{fontSize:42}}>↓</span><span style={{background:cream,padding:'3px 16px'}}>{s.edgeFromPrevious}</span></div>}<div style={{padding:'20px 24px',minHeight:175,boxSizing:'border-box',background:cream,boxShadow:'4px 7px 13px #0003',opacity:ramp(frame,s.at),transform:`translateX(${(1-ramp(frame,s.at))*30}px)`,display:'flex',gap:24,alignItems:'center'}}>{s.image&&<Img src={staticFile(s.image)} style={{width:165,height:145,objectFit:s.imageFit??'contain',flexShrink:0}}/>}<div><div style={{fontSize:40,fontWeight:800,color:s.color??ink}}>{s.heading}</div><div style={{fontSize:32,lineHeight:1.25,marginTop:10}}>{s.detail}</div></div></div></React.Fragment>)}</div>;
};
