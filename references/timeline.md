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
