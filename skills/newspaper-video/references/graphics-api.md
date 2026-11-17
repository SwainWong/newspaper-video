# 数据与解释图形 API

入口 `assets/template/src/motion-graphics.tsx`，导出 `GraphicSpec`、`GraphicMotion`、`validateGraphic`。纯 React/SVG，无 hook、媒体或外部资源；900×900 逻辑画布，父级按目标 bbox 缩放。容器自身不能占用字幕/标题区域。

```tsx
const errors = validateGraphic(spec, duration);
if (errors.length) throw new Error(errors.join('; '));
<GraphicMotion spec={spec} frame={localFrame} duration={duration} />
```

`GraphicSpec` 是 `{effect, data}` 判别联合；精确 TypeScript 字段见实现。所有 `at`/`settle` 是事件内整数帧；必须 `0 <= at < settle < duration`。传入结束之后的 frame 保持最后一帧；负 frame 按零帧。验证器防御畸形 JSON 并返回错误数组，组件对无效输入明确抛错，不静默修正事实。阅读保持由项目在最后 settle 后留足时长。

## 共用输入

`Span={at,settle}`；`Point={time,value}`。图表 `Axis` 为 `{domain:[min,max],timeDomain:[start,end],timeLabels:[起点显示文字,终点显示文字],unit,timeUnit,source}`。两个 domain 均为有限递增数值；点必须在域内并按 time 严格递增。time 可以是同一单位的时间戳或数值时间，不能用等距数组索引冒充实际时间。显示标签需与数值端点一致，由调用者根据已核验材料填写。

每个图形有独立 local timing，不自动套用旁白词锚。时序可验证，语义真实性仍需人工核查。使用来源标签不能证明来源已被查阅。字符串长度有保守上限以避免固定画布溢出（标题20字、来源80字）；详细限值以验证函数为准。

## split

`data={left:{title,detail},right:{title,detail},relation,meaning,atLeft,settleLeft,atRight,settleRight,atRelation,settleRelation}`。

两侧背景横向展开，文字落稳；关系牌随后从 0.85 放大到 1。关系开始不得早于任一侧落稳。relation 最多3字符，meaning 必须解释语义；颜色仅区分两方，不自动表示敌我。两侧标题最多12字，detail最多45字。

## stage-curve

`data={...Axis,title,schematic:true,axes:Span,segments:[{label,points,color,at,settle,labelAt,labelSettle}]}`。

1–4段；坐标先建立，每段以实际 time 坐标推进端点，保留以前的路径，然后显示阶段标签（最多7字）。下一段须等上一标签落稳；相邻段必须共享边界点。六位 hex color。固定显示「阶段模型示意 · 非实测行情」，不能用于真实行情。分段为折线，不用平滑曲线伪造数据。

## checklist

`data={title,source,denominator,items:[{label,explanation,pass,at,explainSettle,checkAt,countAt}]}`。

1–8项，denominator 必须等于完整条件集合的数量。超过4项时解释卡按每页4项自动分页，达到第5项的 `at` 帧切换至第二页；字体和卡片尺寸不缩小。顶端保留所有条件的编号状态槽，并标明当前解释范围；已通过计数始终累计全部条件，不因翻页归零。1–4项保持原单页布局。空框/总数先可见，每项解释落稳后才能出现状态，再下一帧或更晚更新通过数。顺序严格为 `at < explainSettle < checkAt < countAt`，下一项解释不得早于上项 countAt。`pass:true` 显示勾，false 显示叉，null 显示问号及「待核实」；只有 true 计入通过。label 最多16字，解释最多60字。

## market-line

`data={...Axis,title,points,baseline,baselineLabel,line:Span,endpoint:Span,benchmark:Span,delta:Span,conclusion:{at,settle,text}}`。

依次建立线图→末值圈点→基准线→差值增长→结论。五阶段不能重叠。2–1000个观测点；真实时间轴，线性连接并显示观测点，明确标注不推定中间行情。基准必须落在相同数值域；允许非零最小值，但明确显示域刻度。差值使用末值减基准，非百分比。结论文本需由材料支持，程序只核验结构。source/unit 始终标出。

## threshold

`data={title,value,total,threshold,unit,source,setup:Span,growth:Span,gap:Span,result:Span}`。

总量/门槛先建立，当前值从零增长，之后显示差距，再显示结果。四阶段不能重叠。固定 `[0,total]` 域；total>0、0<=value<=total、0<threshold<=total。当前条、阈值线使用同一坐标比例。最终结果仅自动说明「已达到数值门槛」或「尚未达到数值门槛」，不推断最终选举/审批/商业成功。源与单位必填。

## 测试夹具与证据边界

`graphics-fixtures.json` 是5个有效 `{effect,data}` 对象的列表，均用 duration=180。仅合成测试数值/文字，无真实市场断言，不属于可直接发布的 timeline。可据此在已安装工程制作起/中/终帧和连续视频。TypeScript 编译与验证器通过不代表实际观看、真实听音或 owner 验收。
