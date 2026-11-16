import React from 'react';
import {Img, interpolate, staticFile} from 'remotion';
import theme from './theme.json';

export type Editorial =
  | {type:'document';file:string;publisher:string;published:string;headline:string}
  | {type:'schedule';items:{date:string;label:string;status?:string}[]}
  | {type:'relations';nodes:string[];center:string;disclaimer?:string};

const show=(frame:number,delay:number)=>interpolate(frame,[delay,delay+14],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const font='"PingFang SC", Arial, sans-serif';
export const EditorialGraphic:React.FC<{data:Editorial;frame:number}>=({data,frame})=>{
  const box:React.CSSProperties={position:'absolute',left:55,right:55,top:350,height:750,fontFamily:font,color:theme.colors.ink};
  if(data.type==='document'){
    const zoom=interpolate(frame,[45,75],[1,1.22],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
    return <div style={box}><div style={{background:theme.colors.ink,color:'white',padding:'14px 20px',font:'bold 30px Arial'}}>{data.publisher} · {data.published}</div><div style={{height:615,overflow:'hidden',background:'#f7f3e9',border:'14px solid #f7f3e9',boxShadow:'8px 12px 18px #0004',marginTop:16,opacity:show(frame,5)}}><Img src={staticFile(data.file)} style={{width:'100%',height:'100%',objectFit:'contain',transform:`scale(${zoom})`,transformOrigin:'center center'}}/></div><div style={{font:'bold 31px/1.3 Arial',background:theme.colors.yellow,padding:'10px 16px',marginTop:12}}>{data.headline}</div></div>;
  }
  if(data.type==='schedule')return <div style={box}><div style={{position:'absolute',left:60,top:24,width:8,height:620,background:theme.colors.ink}}/>{data.items.slice(0,4).map((item,i)=><div key={i} style={{height:174,marginLeft:115,position:'relative',opacity:show(frame,8+i*18)}}><div style={{position:'absolute',left:-75,top:18,width:42,height:42,borderRadius:'50%',background:theme.colors.red,border:'7px solid #f5ecdc'}}/><div style={{font:'bold 70px Georgia',color:theme.colors.red}}>{item.date}</div><div style={{font:'bold 39px/1.2 '+font}}>{item.label}</div>{item.status&&<div style={{font:'27px '+font,marginTop:8}}>{item.status}</div>}</div>)}</div>;
  const nodes=data.nodes.slice(0,3),pos=[{x:10,y:35},{x:630,y:35},{x:320,y:500}];
  return <div style={box}><svg width="970" height="730" style={{position:'absolute'}}><path d="M170 120 L790 120 L485 590 Z" fill="none" stroke={theme.colors.ink} strokeWidth="5" strokeDasharray="15 10" opacity={show(frame,24)}/></svg>{nodes.map((label,i)=><div key={i} style={{position:'absolute',left:pos[i].x,top:pos[i].y,width:300,padding:'25px 10px',textAlign:'center',background:i===1?theme.colors.ink:theme.colors.red,color:'white',font:'bold 43px '+font,opacity:show(frame,8+i*18)}}>{label}</div>)}<div style={{position:'absolute',left:250,right:250,top:315,padding:22,textAlign:'center',background:theme.colors.yellow,font:'bold 35px/1.35 '+font,opacity:show(frame,65)}}>{data.center}</div>{data.disclaimer&&<div style={{position:'absolute',top:700,left:0,right:0,font:'26px '+font}}>{data.disclaimer}</div>}</div>;
};
