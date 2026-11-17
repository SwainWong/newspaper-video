import React from 'react';

/** All time values are local integer frames; charts use numeric, real time coordinates. */
type Span = {at:number; settle:number};
type Point = {time:number; value:number};
type Axis = {domain:[number,number]; timeDomain:[number,number]; timeLabels:[string,string]; unit:string; timeUnit:string; source:string};
export type GraphicSpec =
  | {effect:'split'; data:{left:{title:string; detail:string}; right:{title:string; detail:string}; relation:string; meaning:string; atLeft:number; settleLeft:number; atRight:number; settleRight:number; atRelation:number; settleRelation:number}}
  | {effect:'stage-curve'; data:Axis & {title:string; schematic:true; axes:Span; segments:Array<Span & {label:string; points:Point[]; color:string; labelAt:number; labelSettle:number}>}}
  | {effect:'checklist'; data:{title:string; source:string; denominator:number; items:Array<{label:string; explanation:string; pass:boolean|null; at:number; explainSettle:number; checkAt:number; countAt:number}>}}
  | {effect:'market-line'; data:Axis & {title:string; points:Point[]; baseline:number; baselineLabel:string; line:Span; endpoint:Span; benchmark:Span; delta:Span; conclusion:Span & {text:string}}}
  | {effect:'threshold'; data:{title:string; value:number; total:number; threshold:number; unit:string; source:string; setup:Span; growth:Span; gap:Span; result:Span}};

const ink='#252921', paper='#f5eedf', red='#a83930', blue='#244d68';
const board={background:'#192124',panel:'#243034',alternate:'#202b2f',line:'#65777b',text:'#f2f0e5',muted:'#bbc9ca',green:'#76dfa2',yellow:'#f0d678',red:'#ff9a89'};
const clamp=(x:number)=>Math.min(1,Math.max(0,x));
const progress=(f:number,a:number,b:number)=>clamp((f-a)/(b-a));
const ease=(p:number)=>1-Math.pow(1-p,3);
const fmt=(n:number)=>Number(n.toFixed(2)).toString();

/** Defensive at the JSON boundary, despite the compile-time union. Never throws for malformed input. */
export function validateGraphic(spec:GraphicSpec,duration:number):string[] {
  const errors:string[]=[];
  const fail=(s:string)=>{errors.push(s);};
  const num=(v:unknown)=>typeof v==='number'&&Number.isFinite(v);
  const str=(v:unknown,key:string,max=90)=>{if(typeof v!=='string'||!v.trim()||v.length>max)fail(`${key}: non-empty text, maximum ${max} characters required`);};
  const frame=(v:unknown,key:string)=>{if(!num(v)||!Number.isInteger(v)||Number(v)<0||Number(v)>=duration)fail(`${key}: integer frame within event required`);};
  const order=(a:number,b:number,key:string)=>{if(!(a<b))fail(`${key}: strictly increasing timing required`);};
  const span=(s:Span,key:string)=>{if(!s||typeof s!=='object'){fail(`${key}: span required`);return;}frame(s.at,`${key}.at`);frame(s.settle,`${key}.settle`);order(s.at,s.settle,key);};
  const range=(r:unknown,key:string):r is [number,number]=>{if(!Array.isArray(r)||r.length!==2||!r.every(num)||!(r[0]<r[1])){fail(`${key}: finite ascending pair required`);return false;}return true;};
  const axis=(d:Axis)=>{range(d.domain,'domain');range(d.timeDomain,'timeDomain');str(d.unit,'unit',20);str(d.timeUnit,'timeUnit',24);str(d.source,'source',80);if(!Array.isArray(d.timeLabels)||d.timeLabels.length!==2)fail('timeLabels: two endpoint labels required');else d.timeLabels.forEach(v=>str(v,'timeLabel',24));};
  const points=(ps:Point[],d:Axis,key:string)=>{if(!Array.isArray(ps)||ps.length<2||ps.length>1000){fail(`${key}: 2–1000 observed points required`);return;}ps.forEach((p,i)=>{if(!p||!num(p.time)||!num(p.value)){fail(`${key}[${i}]: finite time/value required`);return;}if(Array.isArray(d.domain)&&(p.value<d.domain[0]||p.value>d.domain[1]))fail(`${key}: value outside domain`);if(Array.isArray(d.timeDomain)&&(p.time<d.timeDomain[0]||p.time>d.timeDomain[1]))fail(`${key}: time outside domain`);if(i&&!(ps[i-1]?.time<p.time))fail(`${key}: time must strictly increase`);});};
  if(!Number.isInteger(duration)||duration<2)fail('duration: positive integer of at least 2 required');
  if(!spec||typeof spec!=='object'||!spec.data||typeof spec.data!=='object')return [...errors,'graphic data object required'];
  try {
    switch(spec.effect){
      case 'split': {const d=spec.data;str(d.left?.title,'left.title',12);str(d.left?.detail,'left.detail',45);str(d.right?.title,'right.title',12);str(d.right?.detail,'right.detail',45);str(d.relation,'relation',3);str(d.meaning,'meaning',36);
        span({at:d.atLeft,settle:d.settleLeft},'left');span({at:d.atRight,settle:d.settleRight},'right');span({at:d.atRelation,settle:d.settleRelation},'relation');if(d.atRelation<Math.max(d.settleLeft,d.settleRight))fail('relation must follow both settled sides');break;}
      case 'stage-curve': {const d=spec.data;str(d.title,'title',20);axis(d);if(d.schematic!==true)fail('stage-curve must be explicitly schematic');span(d.axes,'axes');if(!Array.isArray(d.segments)||!d.segments.length||d.segments.length>4){fail('segments: 1–4 required');break;}
        let previous=d.axes.settle;let lastPoint:Point|undefined;
        d.segments.forEach((s,i)=>{span(s,`segment ${i}`);str(s.label,'segment label',7);if(typeof s.color!=='string'||!/^#[0-9a-f]{6}$/i.test(s.color))fail('segment color must be six-digit hex');points(s.points,d,`segment ${i}`);frame(s.labelAt,'labelAt');frame(s.labelSettle,'labelSettle');order(s.labelAt,s.labelSettle,'label');if(s.at<previous||s.labelAt<s.settle)fail('stage order: axes/previous label, curve, label');if(lastPoint&&s.points?.length&&(lastPoint.time!==s.points[0].time||lastPoint.value!==s.points[0].value))fail('consecutive segments must share the same boundary point');previous=s.labelSettle;lastPoint=s.points?.[s.points.length-1];});break;}
      case 'checklist': {const d=spec.data;str(d.title,'title',20);str(d.source,'source',80);if(!Array.isArray(d.items)||d.items.length<1||d.items.length>8){fail('items: 1–8 required');break;}if(d.denominator!==d.items.length)fail('denominator must equal the full number of conditions');let prior=-1;d.items.forEach((s,i)=>{str(s.label,`item ${i}.label`,16);str(s.explanation,`item ${i}.explanation`,60);if(s.pass!==true&&s.pass!==false&&s.pass!==null)fail('pass must be true, false, or null (unknown)');[s.at,s.explainSettle,s.checkAt,s.countAt].forEach(t=>frame(t,'item timing'));order(s.at,s.explainSettle,'explanation');order(s.explainSettle,s.checkAt,'explain before check');order(s.checkAt,s.countAt,'check before count');if(s.at<prior)fail('explanations must not overlap');prior=s.countAt;});break;}
      case 'market-line': {const d=spec.data;str(d.title,'title',20);axis(d);points(d.points,d,'points');str(d.baselineLabel,'baselineLabel',22);if(!num(d.baseline)||!Array.isArray(d.domain)||d.baseline<d.domain[0]||d.baseline>d.domain[1])fail('baseline must lie inside domain');const steps=[d.line,d.endpoint,d.benchmark,d.delta,d.conclusion];steps.forEach((s,i)=>{span(s,`step ${i}`);if(i&&s?.at<steps[i-1]?.settle)fail('market order: line, endpoint, benchmark, delta, conclusion');});str(d.conclusion?.text,'conclusion',60);break;}
      case 'threshold': {const d=spec.data;str(d.title,'title',20);str(d.unit,'unit',20);str(d.source,'source',80);if(!num(d.total)||d.total<=0)fail('total must be positive');if(!num(d.value)||d.value<0||d.value>d.total)fail('value must be in zero-to-total domain');if(!num(d.threshold)||d.threshold<=0||d.threshold>d.total)fail('threshold must be in (zero,total]');const steps=[d.setup,d.growth,d.gap,d.result];steps.forEach((s,i)=>{span(s,`step ${i}`);if(i&&s?.at<steps[i-1]?.settle)fail('threshold order: setup, growth, gap, result');});break;}
      default:fail('unknown graphic effect');
    }
  } catch {fail('malformed graphic fields');}
  return errors;
}

const Txt:React.FC<{x:number;y:number;children:React.ReactNode;size?:number;fill?:string;anchor?:'start'|'middle'|'end'}>=({x,y,children,size=28,fill=ink,anchor='start'})=><text x={x} y={y} fontSize={size} fill={fill} textAnchor={anchor}>{children}</text>;
const Wrapped:React.FC<{x:number;y:number;width:number;height:number;text:string;size?:number;color?:string}>=({x,y,width,height,text,size=28,color=ink})=><foreignObject x={x} y={y} width={width} height={height}><div style={{fontSize:size,lineHeight:1.4,color,overflowWrap:'anywhere',whiteSpace:'pre-wrap'}}>{text}</div></foreignObject>;
const Footer:React.FC<{source:string;dark?:boolean}>=({source,dark=false})=><Wrapped color={dark?board.muted:ink} x={48} y={808} width={804} height={76} size={19} text={`来源：${source}`}/>;
const scale=(d:Axis)=>({x:(t:number)=>115+(t-d.timeDomain[0])/(d.timeDomain[1]-d.timeDomain[0])*665,y:(v:number)=>620-(v-d.domain[0])/(d.domain[1]-d.domain[0])*380});
const Axes:React.FC<{d:Axis;dark?:boolean}>=({d,dark=false})=>{const {y}=scale(d);const color=dark?board.muted:ink;return <g><path d="M115 220 V620 H780" fill="none" stroke={color} strokeWidth={3}/>{[0,.5,1].map(p=>{const v=d.domain[0]+p*(d.domain[1]-d.domain[0]);return <g key={p}><line x1={115} x2={780} y1={y(v)} y2={y(v)} stroke={color} opacity={.15}/><Txt fill={color} x={103} y={y(v)+7} size={21} anchor="end">{fmt(v)}</Txt></g>;})}<Txt fill={color} x={115} y={204} size={22}>{d.unit}</Txt><Txt fill={color} x={115} y={655} size={21}>{d.timeLabels[0]}</Txt><Txt fill={color} x={780} y={655} size={21} anchor="end">{d.timeLabels[1]}</Txt><Txt fill={color} x={450} y={689} size={19} anchor="middle">{d.timeUnit} · 按实际时间间距</Txt></g>;};
// A time-based clip exposes only the supplied piecewise-linear path; it does not add observations.
const Trace:React.FC<{points:Point[];d:Axis;p:number;color:string;dot?:boolean}>=({points,d,p,color,dot=false})=>{const {x,y}=scale(d);const stop=points[0].time+(points[points.length-1].time-points[0].time)*p;const visible=points.filter(v=>v.time<=stop);const next=points.find(v=>v.time>stop);const last=visible[visible.length-1]||points[0];if(next&&last.time<stop){const q=(stop-last.time)/(next.time-last.time);visible.push({time:stop,value:last.value+(next.value-last.value)*q});}const end=visible[visible.length-1]||points[0];return <g opacity={p>0?1:0}><polyline points={visible.map(v=>`${x(v.time)},${y(v.value)}`).join(' ')} fill="none" stroke={color} strokeWidth={6} strokeLinejoin="round"/>{points.filter(v=>v.time<=stop).map((v,i)=><circle key={i} cx={x(v.time)} cy={y(v.value)} r={4} fill={color}/>)}{dot&&<circle cx={x(end.time)} cy={y(end.value)} r={8} fill={color}/>}</g>;};

export const GraphicMotion:React.FC<{spec:GraphicSpec;frame:number;duration:number}>=({spec,frame,duration})=>{
  const errors=validateGraphic(spec,duration);
  if(errors.length)throw new Error(`Invalid ${spec?.effect||'graphic'}: ${errors.join('; ')}`);
  const f=Math.max(0,Math.min(duration-1,Number.isFinite(frame)?frame:0));
  const p=(s:Span)=>progress(f,s.at,s.settle);
  let content:React.ReactNode;
  switch(spec.effect){
    case 'split': {const d=spec.data;const sides=[{...d.left,at:d.atLeft,settle:d.settleLeft,color:blue},{...d.right,at:d.atRight,settle:d.settleRight,color:red}];content=<>{sides.map((s,i)=>{const q=ease(p(s));return <g key={i}><rect x={i?450:450-402*q} y={160} width={402*q} height={520} fill={s.color}/><g opacity={clamp((q-.35)/.65)} transform={`translate(0 ${(1-q)*28})`}><Wrapped x={i?535:78} y={245} width={285} height={112} size={36} color={paper} text={s.title}/><Wrapped x={i?535:78} y={390} width={285} height={235} size={29} color={paper} text={s.detail}/></g></g>;})}<g opacity={p({at:d.atRelation,settle:d.settleRelation})} transform={`translate(450 420) scale(${.85+.15*ease(p({at:d.atRelation,settle:d.settleRelation}))})`}><circle r={77} fill={paper} stroke={ink} strokeWidth={4}/><Txt x={0} y={15} size={42} anchor="middle">{d.relation}</Txt></g><g opacity={p({at:d.atRelation,settle:d.settleRelation})}><Wrapped x={90} y={725} width={720} height={115} text={d.meaning} size={32}/></g></>;break;}
    case 'stage-curve': {const d=spec.data;content=<><Txt x={48} y={74} size={38} fill={board.text}>{d.title}</Txt><Txt x={48} y={122} size={24} fill={board.yellow}>阶段模型示意 · 非实测行情</Txt><g opacity={p(d.axes)}><Axes d={d} dark/></g>{d.segments.map((s,i)=><g key={i}><Trace points={s.points} d={d} p={p(s)} color={s.color} dot={f>=s.at&&f<s.labelAt}/><g opacity={progress(f,s.labelAt,s.labelSettle)}><rect x={48+i*204} y={719} width={192} height={66} fill={board.panel} stroke={s.color} strokeWidth={3}/><Wrapped x={58+i*204} y={729} width={172} height={52} text={s.label} size={23} color={board.text}/></g></g>)}<Footer source={d.source} dark/></>;break;}
    case 'checklist': {
      const d=spec.data;
      const count=d.items.filter(v=>v.pass===true&&f>=v.countAt).length;
      const paginated=d.items.length>4;
      const page=paginated&&f>=d.items[4].at?1:0;
      const first=page*4;
      const shown=d.items.slice(first,first+4);
      const status=(s:typeof d.items[number])=>f<s.checkAt?'未核验':s.pass===true?'通过':s.pass===false?'未通过':'待核实';
      const mark=(s:typeof d.items[number])=>f<s.checkAt?'':s.pass===true?'✓':s.pass===false?'×':'?';
      content=<>
        <Txt x={48} y={74} size={38} fill={board.text}>{d.title}</Txt>
        <Txt x={48} y={126} size={27} fill={board.green}>已通过 {count} / {d.denominator} 项</Txt>
        {paginated&&<>
          <Txt x={852} y={126} size={22} fill={board.muted} anchor="end">条件 {first+1}–{Math.min(first+4,d.items.length)} / {d.items.length}</Txt>
          {d.items.map((s,i)=><g key={i} aria-label={`条件${i+1}：${status(s)}`}>
            <rect x={48+i*101} y={146} width={94} height={43} fill={board.background} stroke={board.line} strokeWidth={2}/>
            <Txt x={61+i*101} y={176} size={22} fill={board.text}>{i+1}</Txt>
            <Txt x={108+i*101} y={177} size={28} anchor="middle" fill={s.pass===true?board.green:s.pass===false?board.red:board.yellow}>{mark(s)}</Txt>
          </g>)}
        </>}
        {shown.map((s,i)=>{
          const y=paginated?210+i*145:172+i*150;
          const checked=f>=s.checkAt;
          return <g key={first+i}>
            <rect x={48} y={y} width={804} height={134} fill={i%2?board.alternate:board.panel} stroke={board.line}/>
            <rect x={67} y={y+24} width={38} height={38} fill={board.background} stroke={board.line} strokeWidth={3}/>
            {checked&&<Txt x={86} y={y+55} anchor="middle" size={33} fill={s.pass===true?board.green:s.pass===false?board.red:board.yellow}>{mark(s)}</Txt>}
            <Txt x={124} y={y+48} size={28} fill={board.text}>{s.label}</Txt>
            <g opacity={progress(f,s.at,s.explainSettle)}><Wrapped x={124} y={y+62} width={695} height={64} text={s.explanation} size={22} color={board.muted}/></g>
            {checked&&<Txt x={822} y={y+34} size={17} fill={s.pass===true?board.green:s.pass===false?board.red:board.yellow} anchor="end">{status(s)}</Txt>}
          </g>;
        })}
        <Footer source={d.source} dark/>
      </>;break;
    }
    case 'market-line': {const d=spec.data;const last=d.points[d.points.length-1];const {x,y}=scale(d);const delta=(last.value-d.baseline)*p(d.delta);content=<><Txt x={48} y={74} size={38}>{d.title}</Txt><Txt x={48} y={116} size={20}>观测点直线连接 · 不推定中间行情</Txt><Axes d={d}/><Trace points={d.points} d={d} p={p(d.line)} color={blue}/><g opacity={p(d.endpoint)}><circle cx={x(last.time)} cy={y(last.value)} r={12} fill={paper} stroke={blue} strokeWidth={5}/><Txt x={780} y={164} anchor="end" size={27} fill={blue}>末值 {fmt(last.value)} {d.unit}</Txt></g><g opacity={p(d.benchmark)}><line x1={115} x2={115+665*p(d.benchmark)} y1={y(d.baseline)} y2={y(d.baseline)} stroke={red} strokeWidth={3} strokeDasharray="10 8"/><Txt x={115} y={164} size={24} fill={red}>{d.baselineLabel} {fmt(d.baseline)}</Txt></g><g opacity={p(d.delta)}><Txt x={48} y={738} size={30}>差值 {delta>=0?'+':''}{fmt(delta)} {d.unit}</Txt></g><g opacity={p(d.conclusion)}><Wrapped x={48} y={755} width={804} height={55} text={d.conclusion.text} size={19}/></g><Footer source={d.source}/></>;break;}
    case 'threshold': {const d=spec.data;const current=d.value*ease(p(d.growth));const tx=80+740*d.threshold/d.total;const reached=d.value>=d.threshold;content=<><Txt x={48} y={84} size={38}>{d.title}</Txt><g opacity={p(d.setup)}><Txt x={80} y={240} size={29}>总量 {fmt(d.total)} {d.unit}</Txt><Txt x={80} y={293} size={30} fill={red}>门槛 {fmt(d.threshold)} {d.unit}</Txt><rect x={80} y={383} width={740} height={94} fill="#ddd2b9"/><line x1={tx} x2={tx} y1={351} y2={500} stroke={red} strokeWidth={5}/><Txt x={80} y={532} size={24}>0</Txt><Txt x={820} y={532} size={24} anchor="end">{fmt(d.total)} {d.unit}</Txt></g><g opacity={f>=d.growth.at?1:0}><rect x={80} y={400} width={740*current/d.total} height={60} fill={blue}/><line x1={tx} x2={tx} y1={383} y2={477} stroke={red} strokeWidth={5}/><Txt x={80} y={599} size={43}>当前 {fmt(current)} {d.unit}</Txt></g><g opacity={p(d.gap)}><Txt x={80} y={672} size={31}>{reached?'超过门槛':'距门槛还差'} {fmt(Math.abs(d.value-d.threshold))} {d.unit}</Txt></g><g opacity={p(d.result)}><rect x={80} y={710} width={740} height={64} fill={reached?'#305c3e':blue}/><Txt x={450} y={753} size={30} fill={paper} anchor="middle">{reached?'已达到数值门槛':'尚未达到数值门槛'}</Txt></g><Footer source={d.source}/></>;break;}
  }
  return <svg width={900} height={900} viewBox="0 0 900 900" role="img" aria-label={spec.effect} style={{display:'block',fontFamily:'Arial, "Noto Sans CJK SC", sans-serif',background:spec.effect==='stage-curve'||spec.effect==='checklist'?board.background:paper}}>{content}</svg>;
};
