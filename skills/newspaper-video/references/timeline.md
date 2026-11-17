# 时间线接口

以 `assets/template/src/template.tsx` 中 FilmProps、Scene 类型为字段权威；先复制 `examples/generic.json` 或其他示例再修改。Composition ID 为 NewspaperShort，默认30fps，总帧数取最后一场end。项目只实现9:16布局，改横屏需重新布局，不能仅改宽高。

- 顶层 masthead/eyebrow/sectionLine/paperDeck 是报头；logo/slogan/music/musicVolume 可选。无音频是合法静音示例，不称为有配音成片。
- scenes: id, start, end, title, kicker, captions 必填；场景从0起首尾连续，整数帧，end不含该帧。
- captions: start/end 为全片绝对帧；text 是短语。先按最终口播对齐，不能长期保留示例字幕。
- audio/images: public 下文件名。图片或静音视频用于图片槽；同一视频槽默认从头播放，复杂裁剪先做项目内素材段。
- kind: story/brand。layout: feature/compact/impact/wide/stack；attachment: pin/tape。
- labels 与images顺序对应；metric/detail 为数字强调和说明。
- visualBeats: from/to 为场景内相对帧，images/labels 在该区间展示；metricBeats 同理。
- counter: to,prefix,suffix,precision,durationFrames,delayFrames；comparison:maxValue,items[{label,value,color,unit}],precision。
- timeline:[{label,caption}]；nestedNotes:[{label,color}]。
- editorial 是可选的独立主画面，不能与 images、metric、detail、timeline、comparison 等重叠。三种类型：`document:{file,publisher,published,headline}` 展示完整图片后轻微放大，来源身份持续可见；`schedule:{items:[{date,label,status?}]}` 最多四项；`relations:{nodes:[A,B,C],center,disclaimer?}` 三点关系示意。见 `examples/editorial-example.json`。来源图必须在 `public/`，最终图要检查放大后关键文字仍可读；图的局部不能被冒充为完整来源。
- sfx:[{file,at,gain}]，at 为相对场景帧。声音按动作组设计，不为每帧/每字符重复触发。

频道片头片尾可各用一个 `kind:"brand"` 场景，顶层 `slogan` 和可选 `logo` 复用；若要求口播，也要给两场分别配 `audio` 和同步 `captions`。见 `examples/brand-bookends.json`。

示例包含 generic、beat-example、comparison-example、impact-example、layout-example。自定义主题在 src/theme.json；不支持字段不要仅写JSON，必须改实现并验证。

## 1.4 音乐包络与制作入口

全片可传 `musicEnvelope:[{frame:0,gain:0},{frame:15,gain:0.5},{frame:120,gain:0.2}]`。点至少两个，frame 为非负严格递增整数，gain 为 0–1；绝对帧位置，线性插值并乘 musicVolume。根据真实旁白设计压低/恢复，不能称为自动侧链。

执行 create/still/render 前必须有已确认 brief 和当前批准脚本。still/render 还检查 BGM、SFX 声明以及首镜不是品牌。纯技术示例 JSON 是组件输入示例，不是可跳过审批的生产工程。完整规则见 production-workflow.md 与 audio-production.md。


## 1.5 语义图形和固定品牌

`FilmProps.brandProfile: "swaintalk-v1"` 使所有 `kind:"brand"` 场景使用同一固定透明Logo+slogan组件，必须复制 `public/brand`。其他频道保留通用 `logo/slogan` 接口。

`Scene.analysis` 与原有 images/editorial/comparison/detail 等内容区互斥：
- `{type:"data",data:{title,unit,period,status,source,domain:[min,max],precision?,rows:[{label,value,at,color?}],summary?,summaryAt?}}`，同轴数据条，最多4行，domain必须包含零，at为场景内配音词锚帧。
- `{type:"evidence",data:{file,publisher,published,documentLabel,imageWidth,imageHeight,crop:{x,y,width,height},focusAt,marks:[{x,y,width,height,at}],summary,summaryAt}}`，所有坐标以原图像素为准，focusAt之后放大，再按marks.at黄笔高亮。
- `{type:"relations",steps:[{at,heading,detail,color?,image?,imageFit?,edgeFromPrevious?}]}`，最多4步；从第二步起edgeFromPrevious必填，说明与前一步的关系。image用于节点实质图片，imageFit可contain/cover。不把定性关系画成虚假比例。

独立工程也可直接导入这些组件，传场景局部frame。现有照片/标题/字幕容器不要与analysis重复叠放。声音停顿仍需编辑真实音轨；组件不会自动创造静音或重新对齐字幕。

`Scene.audioOffsetFrames`（非负整数，默认0）可推迟旁白起点，配合场景末端空帧形成真实品牌停顿。字幕仍用全片绝对帧，必须同步偏移；验证器会检查偏移加WAV时长不超过镜头。也可在独立混音中插入静音后导入。

1.6证据摄影机：`EvidenceFocus.data.zoomFrames`默认24（12–45帧），`focusAt`是连续变焦开始，整页至少先停留12帧。`marks[].at`与`summaryAt`不早于focusAt+zoomFrames。原件在同一DOM图像平面上做连续translate/scale；坐标均为原图像素，crop必须在原图范围内。源代码几何函数见`evidence-camera.ts`。

1.6.1默认工程先影像钩子、再品牌段。首场景的第一张主体照片从frame 0可见，同时保持受限位移的入场运动；其他照片沿原顺序入场。若自定义首镜（如analysis），仍须自己确保实际首帧有可辨主体，制作记录不能替代画面。

## 1.8 可执行扩展

scene.motion与顶层transitions见[motion-api.md](motion-api.md)。新增分区、阶段曲线、检查板、行情、阈值、纸面色层、日历、胶片、词片、图标、日期与两种转场；字段由同一TypeScript验证器用于预检和渲染。生产render须绑定motion-plan与timeline哈希、实际效果和声音。
