# 可执行动效接口 1.8

新增11个画面组件与2个场景转场。代码为assets/template/src/motion.tsx、motion-graphics.tsx、motion-paper.tsx。参数与渲染共用验证器，不维护第二份详细字段schema。详细数据见[图形API](graphics-api.md)、[纸片API](paper-api.md)及对应fixtures JSON。

## 画面组件

Scene.motion数组，每项：

```json
{"id":"comparison","effect":"split","start":15,"end":195,"box":[65,350,950,950],"data":{"left":{"title":"采集","detail":"原始材料"},"right":{"title":"核验","detail":"来源与上下文"},"relation":"+","meaning":"互补职能","atLeft":0,"settleLeft":16,"atRight":20,"settleRight":36,"atRelation":48,"settleRelation":64},"sound":{"file":"sfx/paper.wav","at":64,"gain":0.5,"license":"CC0 original procedural sound"}}
```

start/end是场景局部帧，end不包含该帧；data内时码与sound.at均相对于此事件start。box是1080×1920画布上的[x,y,width,height]；组件内部900×900，建议等比例缩放，非等比例会改变文字比例。前景box必须在y340..1430内，避让标题与字幕。按完整事件区间占用区域，不仅检查入场帧。

motion前景与images/analysis/editorial/comparison/metric/detail/timeline等旧内容接口不能同场叠放；需要复合布局时全部使用motion并分配互不相交的box，动作焦点错开。chapter-tint独立放在内容下面，可与旧画面共存，不能双重叠色；透明度限0.3，原件内容不染色。所有主焦点动作必须在motion-plan声明focus:true。组合门禁还从实际组件参数推导最后运动/揭示帧，不能缩短计划settle来隐藏焦点重叠；视频胶片播放至out均占用运动焦点，章节底色除外。

音效可省略但计划须记录静音原因。内置三种WAV复制到public/sfx；模板创建时不擅自选音乐/配音。motion_demo.py会复制测试SFX。声音在全片层播放，可自然跨镜保留尾音；实际WAV长度不得超出片尾，gain为0..1。没有自动匹配旁白或自动听审。

## 转场

顶层FilmProps.transitions数组，所有帧为全片绝对帧：

```json
{"id":"turn-1","effect":"color-wipe","start":198,"cut":210,"end":222,"color":"#a93831","direction":"left","sound":{"file":"sfx/whoosh.wav","at":12,"gain":0.5,"license":"CC0 original procedural sound"}}
```

也支持effect:"iris"和center:[540,800]。start<cut<end，总历时12..60帧，cut必须等于真实场景分界。cut帧图层完全覆盖后才揭示新镜头；direction left从左进入向右撤走，right反向。iris半径以最远画布角计算，cut处无残留角落。字幕层保持在遮挡之上，字幕切换仍按绝对时码。两种转场互斥，不与前景motion区间重叠；旧镜头motion在转场开始前结束，新镜头motion在转场结束后开始。真实原件连续变焦中不得加场景转场；结构校验直接检查原件定位框开始至摄影机落稳区间，未记入动作计划也会拒绝。

## 验证与计划

1. `python3 validate_timeline.py src/timeline.json`检查结构、空间、素材和音效尾长。
2. `node scripts/validate-motion.cjs src/timeline.json`调用渲染器的真实TypeScript验证函数，核查来源、曲线范围、先后阶段、真实日期、计数、文本长度等。
3. `motion-plan.json`增加timeline_sha256绑定src/timeline.json的实际字节；events.id必须与motion/transitions.id相同，effect/start/end/bbox和音效文件/时码/许可必须对应。events采用全片帧，sound.file相对工程根目录（通常public/sfx/...），渲染输入sound.file相对public。
4. `python3 SKILL_ROOT/scripts/motion_gate.py motion-plan.json --timeline src/timeline.json`拒绝旧哈希、漏记动作、不一致声音、主焦点竞争与互斥效果。

start/mid/end静帧、连续观看和真实听音是不同证据。数据范围和hash通过不证明手机阅读、音画观感或用户接受。
