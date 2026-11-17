import React, {useEffect, useState} from 'react';
import {Img, staticFile, interpolate, delayRender, continueRender, cancelRender} from 'remotion';

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

export type EvidenceFocusSpec={file:string;publisher:string;published:string;documentLabel:string;imageWidth:number;imageHeight:number;crop:{x:number;y:number;width:number;height:number};focusAt:number;marks:{x:number;y:number;width:number;height:number;at:number}[];summary:string;summaryAt:number};
/** All crop/mark coordinates refer to the original screenshot, in source pixels. */
export const EvidenceFocus:React.FC<{data:EvidenceFocusSpec;frame:number}>=({data,frame})=>{
 const focus=frame>=data.focusAt;const scale=Math.min(900/data.crop.width,600/data.crop.height);const ox=(900-data.crop.width*scale)/2,oy=(600-data.crop.height*scale)/2;
 return <div style={{position:'absolute',left:65,top:370,width:950,color:ink,fontFamily:'Arial'}}>
  <div style={{fontSize:32,fontWeight:800,background:ink,color:cream,padding:20}}>{data.publisher} · {data.documentLabel}<div style={{fontSize:26,fontWeight:400,marginTop:10}}>{data.published}</div></div>
  <div style={{position:'relative',marginTop:20,width:900,height:focus?600:760,border:'15px solid '+cream,background:'white',overflow:'hidden',boxShadow:'5px 8px 14px #0004'}}>
   {!focus?<Img src={staticFile(data.file)} style={{width:'100%',height:'100%',objectFit:'contain'}}/>:<><Img src={staticFile(data.file)} style={{position:'absolute',left:ox-data.crop.x*scale,top:oy-data.crop.y*scale,width:data.imageWidth*scale,height:data.imageHeight*scale}}/>{data.marks.map((m,i)=><div key={i} style={{position:'absolute',left:ox+(m.x-data.crop.x)*scale,top:oy+(m.y-data.crop.y)*scale,width:m.width*scale*ramp(frame,m.at,16),height:m.height*scale,background:'#ffd934',opacity:.5,mixBlendMode:'multiply'}}/>)}</>}
  </div>{frame>=data.summaryAt&&<div style={{marginTop:25,padding:25,background:yellow,fontSize:43,fontWeight:700,lineHeight:1.3}}><div style={{fontSize:25,marginBottom:12}}>KEY POINT · EDITORIAL SUMMARY</div>{data.summary}</div>}
 </div>;
};

export type RelationStep={at:number;heading:string;detail:string;color?:string};
/** Relations are qualitative; no fake quantitative arrow thickness or percentages. */
export const RelationSteps:React.FC<{steps:RelationStep[];frame:number}>=({steps,frame})=><div style={{position:'absolute',left:80,top:410,width:920,fontFamily:'Arial',color:ink}}>{steps.slice(0,4).map((s,i)=><React.Fragment key={i}>{i>0&&<div style={{height:65,fontSize:50,textAlign:'center',opacity:ramp(frame,s.at)}}>↓</div>}<div style={{padding:'24px 30px',minHeight:145,background:cream,borderLeft:'14px solid '+(s.color??red),boxShadow:'4px 7px 13px #0003',opacity:ramp(frame,s.at),transform:`translateX(${(1-ramp(frame,s.at))*30}px)`}}><div style={{fontSize:43,fontWeight:800}}>{s.heading}</div><div style={{fontSize:34,lineHeight:1.3,marginTop:15}}>{s.detail}</div></div></React.Fragment>)}</div>;
