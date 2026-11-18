# Collage scene API · 1.9

`Scene.collage` replaces the fixed legacy scene layout. It owns photo, text, diagrams, caption placement and child motion. It cannot coexist in a scene with `motion`, `analysis`, `editorial`, `images`, metrics or legacy layout content. Existing 1.8 components remain available through the typed `motion` node; use `board` for the richer three teaching-board families. This is a reusable composition implementation, not a claim that all references are pixel identical.

Input is approved story content and sourced media. Output is an editable `Collage` rendered by `src/collage.tsx`. The renderer and CLI run the same validator. See [16 complete JSON fixtures](collage-presets.json), [generator](collage-presets.md), [reference alignment](pixel-reference-study.md), [boards](reference-boards-api.md) and [six measured audiovisual combinations](reference-av-combinations.md).

## Coordinates and timing

Canvas coordinates are 1080×1920. `box:[x,y,width,height]` is the node's final unrotated box, not a phone screenshot box. `at`, `settle`, `end` are scene-local integer frames, with `0 <= at <= settle < end <= scene duration`. Captions retain global timeline frames. The supplied source videos are 29 fps; the template is 30 fps. Convert source elapsed seconds to target frame anchors, never reuse raw 29 fps frame numbers as 30 fps frames.

Every node needs unique `id`, `kind`, `box`, timing, `role` (`primary|support|decoration`), and a nonempty `meaning`. `rotation` is within ±20°. `entry:{kind,distance?}` supports none, fade, slide-x, slide-y, scale and wipe-x. Slide distance is at most ±300px; comparison panels own their longer offscreen travel. `focus:false` is allowed only for static content. A shared `group` explicitly coordinates parts of one message; it is not a way to dismiss unrelated competing motion.

Optional `reposition:{from:[x,y],at,settle}` moves a whole node from one canvas position to its final `box` after its entrance settles. The frame and its contents move together. Both endpoints must remain in the canvas; the swept rectangle is checked against other content and captions. The whole at-to-final-settle interval reserves attention conservatively. Use for a portrait making space for an arriving chart; don't call this a camera zoom.

## Node contracts

| Kind | Match and input | Motion and constraints | Conflicts |
|---|---|---|---|
| `text` | One spoken noun/action or a short question/answer; `text`, `style` | Font16..240; color/background/weight/lineHeight/padding/shadow/boxShadow/stroke/letterSpacing/scaleX configurable. `inkReveal:{at,settle,outlineColor}` changes outlined letters into filled letters after entrance, then shows the extrusion shadow. | A phrase must retain its semantic qualifier; don't turn a disputed allegation into an unqualified huge label. Do not duplicate an entire narration paragraph. No text-caption overlap waiver. |
| `photo` | Actual subject/event/evidence image; local `file`, fit, border, label, attachment pin/tape/none, grayscale | Whole framed image may enter or reposition; `video:true` renders muted video. Keep the same original file for continuous source detail. | Static support photos may release focus; video reserves whole lifetime. Do not substitute a generic person or mock screenshot for real evidence. |
| `compare` / `strip` | Small relationship under persistent photo/question/answer, as4801 | Two side objects `{title,detail,color}`, operator, operator meaning; left/right independently translate with their text, then badge appears. `titleSize`, `detailSize`, `badgeSize`, `badgeColor`, `badgeRotation`, fontFamily are explicit. | Both sides must finish before relation begins. Badge must not cover the core words. Use `+` only for complement, VS for opposition, and inequalities only with a stated comparable meaning. |
| `compare` / `hero` | The two roles themselves are the main subject, as4803 | Larger colored surfaces; same six anchors `leftAt/leftSettle/rightAt/rightSettle/relationAt/relationSettle`. Opposed translations can overlap in time as one coordinated comparison. Badge overshoots slightly then settles. | It is not the fixed mask wipe of the old split effect. Do not move the rest of the scene at the same time. Entrances reserve full canvas width at panel height. |
| `icon` | One concrete visual metaphor; wallet, ballot or television | `symbol`, tile color, ink, optional caption; editable SVG with whole paper-tile rotation. |4806 uses **ballot**, not television. Icon is interpretation, not photo evidence. Avoid adding unrelated metaphors or moving both labels and tiles as separate competing foci. |
| `timeline` |2..6 known dates/steps, with label/detail/at | Each anchor reveals in order on a persistent line. Last reveal reserves12frames. | Dates must be sourced; don't invent precise dates for an unverified life stage. |
| `line-chart` | Compact chart when full teaching board would cover captions | Actual `{x,y}` points, increasing normalized x, explicit domain/title/unit/source, drawAt/drawSettle. Straight line connections; optional final annotation. | Keep observed path distinct from decorative arrows. No fabricated curve for qualitative biography. |
| `board` | Four-stage teaching, eight-condition explanation, or market comparison | `spec` validated by `validateReferenceBoard`; actual data/time domains, ordered stages and evidence-before-verdict. | Whole lifetime reserves focus. Do not advance check/count before the mini-plot is complete; do not use synthetic fixtures as reported data. |
| `motion` | Existing1.8 semantic effect fits within a free composition | `spec` is a GraphicSpec or PaperSpec, rendered in the node box; nested media remain local. | Whole lifetime reserves focus. Scene-level transitions and background effects are not nested node effects. |

`captionBox` is mandatory. `captionSize`, `translationSize`, `captionFont` are optional. `background:{file?,color?,opacity?}` is independent of node content; local files only. The global `FilmProps.logo` remains visible on collage story scenes from1.9.1; do not duplicate it in a text node. Native font fallback affects typography, so pin licensed fonts in the project when exact type is necessary. Box validation is conservative geometry, not glyph shaping or shadow inspection; inspect rendered text for actual overflow.

## Complementarity and conflict rules

The validator checks visible lifetimes, rotated/translated bounding rectangles, the full reposition sweep, and last moving anchors—not just a manually shortened `settle`. Occupied areas may overlap only inside an explicit same-message group or `allowOverlaps:[{a,b,reason}]`. That exception does not suppress focus conflicts. Complex boards/video reserve their complete lifetime. Static decoration is not treated as semantic content, so it must not be used to hide meaningful content from checks.

`captionOverlay:{nodeIds,reason}` is for a verified empty portion of non-text imagery only. It cannot name a text node. Prefer an empty caption lane. A static screenshot establishes composition; it cannot establish motion or sound.4805–4808 did not receive reliable source-video foreground matches; their motion is authored adaptation.

The full-scene collage event conservatively occupies the complete scene in `motion-plan.json` with `settle=end-1`. Global wipes/iris may not overlap it in1.9's composition gate. Use a separate transition interlude scene or a hard cut; don't weaken the gate to force two active full-screen effects together. Same-source document camera work stays in the existing evidence scene contract. This restriction makes existing effects complementary without claiming a new general camera system.

## Sound tied to actions

Optional `collage.sounds` takes:

```json
{"nodeId":"comparison","anchor":"relation","kind":"paper","file":"sfx/paper.wav","gain":0.25,"tailFrames":5,"license":"CC0 original procedural sound"}
```

Anchors resolve from actual node data: entry→at, settle→settle, leftEntry/rightEntry→comparison entry, relation→relationSettle, ink→inkReveal.settle, reposition→reposition.settle, draw→drawSettle. A missing/inapplicable anchor fails. Travel anchors require whoosh; settled accents require paper/tick. A cue needs a local file, license, gain0..1 and positive integer tailFrames ending inside the scene. Sequence duration truncates audio after that interval; measure the asset first and don't cut a meaningful tail. At30fps built-in tick/paper/whoosh need at least3/5/10frames respectively. A quiet ending may use a longer interval. Lower gain against the selected voice; no loudness or listening claim follows from this schema.

The template renders these cues directly. Plan `child_sounds` must exactly match them; the collage container itself declares silence with a reason because children own the sounds. Do not schedule the same accents again under `scene.sfx`. Source audio was mixed and has not been genuinely listened to; bundled procedural accents are authored replacements, not extracted/reproduced original SFX.

## Regression and delivery

Generate with `python3 scripts/collage_demo.py /NEW_DIR`, install dependencies, then `npm run check`, `node scripts/validate-motion.cjs src/timeline.json`, `python3 validate_timeline.py src/timeline.json`, and `python3 SKILL_ROOT/scripts/motion_gate.py motion-plan.json --timeline src/timeline.json`. `tests/collage_runtime.cjs` runs actual SSR and malformed/conflict cases against that project. Synthetic fixtures may be rendered directly for component review; production still follows explicit script/voice approval and review-plan gates.

Use `pixel_compare.py` with explicit source/candidate crops and regenerated hashes. Separate copied paper/photos from recreated graphics. Record each region's error, not an invented overall pixel-perfect score. Review entrance/middle/settled frames and readable phone-size output. Decoding, SSR and per-pixel differences do not establish continuous viewing, real listening or owner acceptance.

### Event-anchored line charts

`line-chart` accepts optional `revealStops:[{at,x}]`. Supply 2–64 stops: `at` is an integer **scene-local frame**, strictly increasing within the inclusive `drawAt`–`drawSettle` interval; `x` is normalized 0–1, nondecreasing, with first x=0 and last x=1. The visible horizontal extent interpolates linearly between stops, holds across equal x values, and clamps outside the first/last stop. Stops may sit inside the draw interval; focus remains reserved through `drawSettle`, which also remains the draw sound anchor. Without stops, the original eased reveal remains unchanged. Stop x values locate observations on the actual data axis, not evenly spaced narrative beats.

Optional `xLabels:[{x,label}]` adds 1–8 static axis ticks using increasing normalized positions and 1–16 character single-line labels. Charts with ticks must be at least 240×260; conservative character-width checks reject overlapping labels or labels outside the chart. Date labels should use the same time-to-x mapping as observations. Ticks reserve additional space above the footer.

Optional `connectionLabel` supplies 1–64 nonblank, single-line characters after `unit`; omission preserves `观测点直线连接`. English episodes can set `connectionLabel:"Observed points joined"`. This describes straight connections between observations, not unobserved intraday behavior.

```json
{
  "drawAt": 20, "drawSettle": 100,
  "revealStops": [{"at":20,"x":0},{"at":50,"x":0.5},{"at":70,"x":0.5},{"at":100,"x":1}],
  "xLabels": [{"x":0,"label":"Nov 02"},{"x":0.5,"label":"Nov 09"},{"x":1,"label":"Nov 16"}],
  "connectionLabel": "Observed points joined"
}
```

This partial configuration requires the existing node geometry, actual points, domain, source, title, unit and lifetime. Event timing must come from the approved narration; these controls do not verify dates or prices. Existing geometry, focus, caption and source requirements remain in force.

### Chart typography and caption wrapping

Charts accept optional `axisFontSize` (16–40, default 17), `titleFontSize` (20–48, default 28), `sourceFontSize` (16–36, default 20), and `footerFontSize` (16–36, default 21). Omission retains existing font sizes and plot geometry. An explicit axis size applies to both dates and y-axis numbers; tick spacing uses that size with conservative Latin/full-width character estimates. Larger typography reserves left/top/bottom space and must leave at least 120×80 pixels for the plot. This is a geometry check, not a substitute for inspecting rendered glyphs at phone size.

For a 970×660 chart, `axisFontSize:30, titleFontSize:36, sourceFontSize:26, footerFontSize:28` is a useful review starting point. Shorten source wording if necessary and verify it remains inside the card.

Use exported `lineChartLayout(node)` when placing external observed-point markers. It returns chart-local `left`, `right`, `top`, `bottom`, font sizes (`axis`, `title`, `source`, `footer`) and text baselines. A normalized data point maps to `boxX + left + x * (right-left)` and `boxY + bottom - (y-domainMin)/(domainMax-domainMin) * (bottom-top)`. Do not retain old hardcoded margins after changing typography. With the example sizes, domain `[145,225]` and date labels, margins are left 74.5, right 935, top 78, bottom 504.15.

Main captions and translations preserve explicit newline characters through inherited `white-space:pre-line`. Automatic wrapping still applies to long lines; newline preservation does not ensure the caption fits its declared box.

## 实体条目与事件标记（1.9.4）

`entity-item` 沿用节点通用 box/at/settle/end/role/meaning。额外必填 `name, detail, image: {file,kind,identity,sourceUrl,license}`，kind 为 logo/portrait/icon。文本在左，图像在右，以 contain 保留完整主体。可选 `fontSize`（默认40，至少28）、`detailSize`（默认28，至少24）、`imageWidth`（默认180，至少144）。文字、图像尺寸及整卡运动会被检查；还须实际缩小到手机尺寸检查身份和细节。

`line-chart.eventMarkers` 为最多8项的数组，每项 `{pointIndex,label,date,at,row?:0|1}`。pointIndex 是 points 的实际索引，at 为场景内帧；事件不可早于该观测点被曲线揭示。标记绘制圆点及从横轴到该点的竖虚线，下方标注事件及日期。`xLabels` 也支持 row:0/1，需错开临近标签；同一行重叠、越界或剩余绘图区不足会失败。事件标签及日期的行高计入图表高度，避免与单位及来源脚注重叠。标签字号沿用 axisFontSize。

事件必须对齐真实口播锚点；观测点连线仅表示数据走势，不自动推断事件造成价格变化。来源与制作记录见 [生产合同](source-production-contract.md)。
