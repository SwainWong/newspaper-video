import React, {CSSProperties} from 'react';
import {Freeze, Img, OffthreadVideo, staticFile} from 'remotion';

export type PaperSpec =
  | {effect:'chapter-tint'; data:{color:string; opacity:number; at:number; duration:number}}
  | {effect:'calendar-flip'; data:{from:number; to:number; unit:string; start:number; end:number}}
  | {effect:'film-frame'; data:{media:{type:'image'|'video'; src:string}; label:string; source:string; in:number; out:number}}
  | {effect:'keyword'; data:{subject:string; words:{text:string; color:string; at:number; rotation:number}[]}}
  | {effect:'icon-metaphor'; data:{icon:string; meaning:string; caption:string; at:number}}
  | {effect:'date-tiles'; data:{date:string; format:'zh'|'iso'; at:number}};

const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const progress=(f:number,at:number,n=15)=>clamp((f-at)/n);
const ease=(v:number)=>1-Math.pow(1-v,3);
const ink='#26231e';
const paper='#fff9e8';
const root:CSSProperties={position:'relative',width:900,height:900,color:ink,fontFamily:'Arial, "Noto Sans CJK SC", sans-serif',overflow:'hidden'};
const sheet:CSSProperties={background:paper,boxShadow:'0 12px 22px #201a1433',border:'2px solid #302819'};
const local=(s:unknown)=>typeof s==='string'&&s.trim().length>0&&!/^(?:[a-z][a-z0-9+.-]*:|\/|\\|\.\.?|public\/)/i.test(s)&&!s.includes('\\')&&!/[\x00-\x1f\x7f]/.test(s)&&!s.split('/').some(part=>part==='..'||part==='.');
const textOK=(s:unknown,max:number)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
const finite=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n);
const integer=(n:unknown):n is number=>finite(n)&&Number.isInteger(n);

/** Validates untrusted JSON without assuming TypeScript types survived serialization. */
export function validatePaper(spec:PaperSpec,duration:number):string[]{
  const errors:string[]=[];
  const need=(ok:boolean,message:string)=>{if(!ok)errors.push(message);};
  need(integer(duration)&&duration>=30,'duration must be an integer >= 30 frames');
  if(errors.length)return errors;
  if(!spec||typeof spec!=='object'||!spec.data||typeof spec.data!=='object')return [...errors,'spec must contain effect and data'];
  const d=spec.data as unknown as Record<string,any>;
  const frame=(v:unknown)=>integer(v)&&v>=0&&v<duration;
  const at=(v:unknown,tail:unknown=15)=>frame(v)&&integer(tail)&&Number(v)+tail<=duration-15;
  const color=(v:unknown)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
  switch(spec.effect){
    case 'chapter-tint':
      need(color(d.color),'color must be #RRGGBB');
      need(finite(d.opacity)&&d.opacity>=0&&d.opacity<=0.3,'opacity must be 0..0.3');
      need(integer(d.duration)&&d.duration>=9&&d.duration<=18,'tint duration must be 9..18 frames');
      need(at(d.at,d.duration),'tint must leave 15 frames of terminal hold');break;
    case 'calendar-flip':{
      need(integer(d.from)&&integer(d.to)&&Math.abs(d.from)<=999999&&Math.abs(d.to)<=999999&&d.from!==d.to,'from/to must be distinct integers within ±999999');
      need(textOK(d.unit,12),'unit must contain 1..12 characters');
      const pages=integer(d.from)&&integer(d.to)?Math.min(12,Math.abs(d.to-d.from)):Infinity;
      need(frame(d.start)&&frame(d.end)&&d.end-d.start>=pages*8&&d.end<=duration-15,'flip requires >=8 frames per page and 15 final hold frames');break;}
    case 'film-frame':
      need(!!d.media&&['image','video'].includes(d.media.type)&&local(d.media.src),'media requires image/video type and public-relative local src');
      need(textOK(d.label,52)&&textOK(d.source,100),'label/source are required (max 52/100 characters)');
      need(at(d.in)&&frame(d.out)&&d.out>=d.in+15&&d.out<=duration-15,'in/out must bound entry/playback and leave 15 final hold frames');break;
    case 'keyword':
      need(textOK(d.subject,40),'subject must contain 1..40 characters');
      need(Array.isArray(d.words)&&d.words.length>=1&&d.words.length<=4,'words must contain 1..4 phrases');
      if(Array.isArray(d.words))d.words.forEach((w:any,i:number)=>{
        need(!!w&&textOK(w.text,24)&&color(w.color)&&finite(w.rotation)&&Math.abs(w.rotation)<=6&&at(w.at),`words[${i}] requires short phrase, hex color, rotation ±6 and valid at`);
        if(i>0)need(!!w&&!!d.words[i-1]&&integer(w.at)&&integer(d.words[i-1].at)&&w.at>=d.words[i-1].at+15,'phrase anchors must be ordered at least 15 frames apart');
      });break;
    case 'icon-metaphor':
      need(local(d.icon),'icon must be a public-relative local image');
      need(textOK(d.meaning,40)&&textOK(d.caption,70),'meaning/caption required (max 40/70 characters)');
      need(at(d.at),'icon at must leave entry and hold');break;
    case 'date-tiles':{
      const iso=typeof d.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d.date);
      const parsed=iso?new Date(`${d.date}T00:00:00Z`):null;
      need(!!parsed&&!Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===d.date,'date must be a valid YYYY-MM-DD calendar date');
      need(d.format==='zh'||d.format==='iso','format must be zh or iso');
      need(at(d.at,27),'date entry must leave 15 frames of terminal hold');break;}
    default:errors.push('unknown paper effect');
  }
  return errors;
}

const Entry:React.FC<{p:number;children:React.ReactNode;style?:CSSProperties}>=({p,children,style})=><div style={{opacity:p,transform:`translateY(${(1-ease(p))*32}px) rotate(${(1-ease(p))*-3}deg)`,...style}}>{children}</div>;

function Calendar({d,f}:{d:Extract<PaperSpec,{effect:'calendar-flip'}>['data'];f:number}){
  const count=Math.min(12,Math.abs(d.to-d.from));
  const t=clamp((f-d.start)/(d.end-d.start))*count;
  const index=Math.min(count-1,Math.floor(t));
  const phase=t>=count?1:t-index;
  const value=(i:number)=>Math.round(d.from+(d.to-d.from)*i/count);
  const current=value(index), next=value(index+1);
  const done=f>=d.end;
  const face=(n:number,half:'top'|'bottom',extra:CSSProperties={})=><div style={{position:'absolute',left:0,top:half==='top'?0:220,width:650,height:220,overflow:'hidden',background:paper,backfaceVisibility:'hidden',...extra}}><div style={{position:'absolute',top:half==='top'?0:-220,width:650,height:440,display:'flex',alignItems:'center',justifyContent:'center',fontSize:Math.abs(n)>9999?138:190,fontWeight:900,fontVariantNumeric:'tabular-nums'}}>{n}</div></div>;
  return <div style={{...sheet,position:'absolute',left:125,top:120,width:650,height:650,borderRadius:12,overflow:'hidden'}}>
    <div style={{height:100,background:'#a33027',color:paper,fontSize:38,display:'flex',alignItems:'center',justifyContent:'center'}}>{d.unit}</div>
    <div style={{position:'relative',height:440,perspective:1400}}>
      {face(done?d.to:next,'top')}{face(done?d.to:current,'bottom')}
      {!done&&phase<0.5&&face(current,'top',{transformOrigin:'center bottom',transform:`rotateX(${-phase*180}deg)`,filter:`brightness(${1-phase*0.4})`})}
      {!done&&phase>=0.5&&face(next,'bottom',{transformOrigin:'center top',transform:`rotateX(${(1-phase)*180}deg)`,filter:`brightness(${0.8+phase*0.2})`})}
      <div style={{position:'absolute',top:219,width:'100%',height:2,background:'#4b403844'}}/>
    </div>
    <div style={{height:110,display:'flex',alignItems:'center',justifyContent:'center',fontSize:23}}>时间流逝示意 · 翻页中间值非实测状态</div>
  </div>;
}

export const PaperMotion:React.FC<{spec:PaperSpec;frame:number;duration:number}>=({spec,frame,duration})=>{
  const errors=validatePaper(spec,duration);
  if(errors.length)throw new Error(`Invalid ${spec?.effect}: ${errors.join('; ')}`);
  if(!Number.isFinite(frame))throw new Error('PaperMotion frame must be finite');
  const f=Math.max(0,Math.min(duration-1,frame));
  let content:React.ReactNode;
  switch(spec.effect){
    case 'chapter-tint':{const d=spec.data;content=<div style={{position:'absolute',inset:0,background:d.color,opacity:d.opacity*progress(f,d.at,d.duration),pointerEvents:'none'}}/>;break;}
    case 'calendar-flip':content=<Calendar d={spec.data} f={f}/>;break;
    case 'film-frame':{
      const d=spec.data,p=progress(f,d.in);
      const holes=(side:'left'|'right')=><div style={{position:'absolute',[side]:15,top:18,bottom:18,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>{Array.from({length:12},(_,i)=><div key={i} style={{width:24,height:28,borderRadius:4,background:'#e8dfc9'}}/>)}</div>;
      content=<Entry p={p} style={{position:'absolute',left:50,top:105,width:800}}><div style={{position:'relative',padding:'42px 55px',height:530,background:'#201f1c',boxSizing:'border-box',boxShadow:'0 15px 25px #0004'}}>{holes('left')}{holes('right')}
        <div style={{width:'100%',height:'100%',background:'#eee6d6'}}>{d.media.type==='image'?<Img src={staticFile(d.media.src)} style={{width:'100%',height:'100%',objectFit:'contain'}}/>:<Freeze frame={Math.floor(Math.max(0,Math.min(f,d.out)-d.in))}><OffthreadVideo src={staticFile(d.media.src)} muted style={{width:'100%',height:'100%',objectFit:'contain'}}/></Freeze>}</div>
      </div><div style={{...sheet,padding:'20px 26px',boxSizing:'border-box'}}><div style={{fontSize:28,fontWeight:700,overflowWrap:'anywhere'}}>{d.label}</div><div style={{fontSize:20,marginTop:12,overflowWrap:'anywhere'}}>来源：{d.source}</div><div style={{fontSize:18,marginTop:10}}>胶片边框为装饰，不表示档案认证</div></div></Entry>;break;}
    case 'keyword':{const d=spec.data;content=<div style={{position:'absolute',inset:'60px 75px'}}><div style={{fontSize:32,marginBottom:38}}>{d.subject}</div>{d.words.map((w,i)=><Entry key={i} p={progress(f,w.at)} style={{marginBottom:30}}><div style={{...sheet,padding:'20px 24px',fontSize:36,fontWeight:800,lineHeight:1.2,overflowWrap:'anywhere',borderLeft:`14px solid ${w.color}`,transform:`rotate(${w.rotation}deg)`}}>{w.text}</div></Entry>)}</div>;break;}
    case 'icon-metaphor':{const d=spec.data;content=<Entry p={progress(f,d.at)} style={{position:'absolute',left:100,top:75,width:700,textAlign:'center'}}><div style={{...sheet,padding:35}}><Img src={staticFile(d.icon)} style={{width:440,height:320,objectFit:'contain'}}/><div style={{fontSize:32,fontWeight:800,marginTop:18,overflowWrap:'anywhere'}}>{d.meaning}</div><div style={{fontSize:26,lineHeight:1.4,marginTop:20,overflowWrap:'anywhere'}}>{d.caption}</div><div style={{fontSize:23,color:'#805120',marginTop:25}}>视觉隐喻 · 非数据或真实事件证据</div></div></Entry>;break;}
    case 'date-tiles':{const d=spec.data;const [y,m,day]=d.date.split('-');const parts=d.format==='zh'?[[y,'年'],[m,'月'],[day,'日']]:[[y,'YEAR'],[m,'MONTH'],[day,'DAY']];content=<div style={{position:'absolute',left:55,top:270,width:790}}><div style={{display:'flex',gap:20}}>{parts.map(([v,label],i)=><Entry key={i} p={progress(f,d.at+i*6)} style={{width:i===0?310:220}}><div style={{...sheet,textAlign:'center',padding:'35px 6px'}}><div style={{fontSize:82,fontWeight:900,fontVariantNumeric:'tabular-nums'}}>{v}</div><div style={{fontSize:30,marginTop:16}}>{label}</div></div></Entry>)}</div><div style={{fontSize:28,textAlign:'center',marginTop:35,opacity:progress(f,d.at+12)}}>{d.format==='zh'?`${y}年${Number(m)}月${Number(day)}日`:`${y}-${m}-${day} · YYYY-MM-DD`}</div></div>;break;}
  }
  return <div style={root}>{content}</div>;
};
