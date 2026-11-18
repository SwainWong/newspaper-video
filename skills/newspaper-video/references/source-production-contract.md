# 来源、实体与口播合同（1.9.4）

制作每句归因时先核查原始来源。新闻或政府陈述须在画面展示原始截图或经核对的短原文引语，标出发布者、发布日期、原始 URL。政府同一事件发布会照片可作现场画面，仍需保留相应陈述的来源。X 陈述必须展示核实过的原帖（作者、日期、上下文），不能以新闻转述、Logo 或摘要替代。禁止生成假截图；没有原件就省略该归因句或停止完整渲染。引语长度须符合具体来源的引用权限，不用整篇转载。

文稿以短而自然的句子表达限定。例如直接说明数据是预测或两个事件时间相近，不添加辩解制作过程的话，不暗示时间先后证明因果。口播及字幕不用英文或中文分号。实体介绍逐项核对身份、照片/Logo/图标出处、图文匹配和手机尺寸可辨识度；Logo 为身份标识，不充当新闻来源。

## 可执行计划

完整渲染调用 `review_plan.py --require-visual --require-production`。新增必填：

- `production_contract: "1.9.4"`、`timeline_file: "src/timeline.json"`、`narration_file`（项目内仅包含实际口播的文本）。
- `attributed_claims: []`，没有归因时可为空。每项含 `id, scene_id, node_id, kind`（news/government/x）、`claim, verified: true, publisher, date`（ISO 日期）、`url, from, until`（绝对帧，末帧不包含）、`evidence_form`。每个实际时间线 scene 的 `sourceClaimIds` 声明对应 claim id。
- `evidence_form` 为 screenshot/original-post/briefing-photo 时，`node_id` 必须指向实际 collage photo，提供 `file`（public 内相对路径）与 `sha256`。briefing-photo 仅限 government 且 `same_event: true`。X 只允许 original-post。
- quote 使用实际 collage text 节点，`quote` 为核对后的短原文，须完整出现在节点文本内。发布者、日期、URL 必须出现在与证据同期可见的 text 节点中。当前可执行证据绑定支持 collage photo/text，其它布局需先迁移或扩展验证器，不得假填记录。
- 每个 entity-item 对应 `entity_checks` 中一个 `{scene_id,node_id,identity_verified:true,asset_provenance_checked:true,small_format_reviewed:true,text_image_match:true}`，只有实际完成才填写 true。
- 每个图表 marker 的 `scene.start + at` 对应 beat.at，marker.label 出现在 beat.anchor.text 中。原有 word-aligned/listening-verified 及 voice hash 规则继续适用。

计划检查可核对文件存在、媒体哈希、画面引用、声明时段及文字。它不能自行判断原件真实、所有归因句均被声明、图片视觉内容或真实可读性；这些仍是制作人复核责任。声明 true 不等于机器证明。

## 读音修正

记录术语及预期读法，修正配音输入后生成受影响音段，回听整句，再重新测长、对齐字幕和图表/实体锚点。`pronunciation_corrections` 每项记录 `term, spoken_form, voice_sha256, script_sha256, listening_verified: true, captions_retimed: true`。缺少实际试听时保持未完成，不以 ASR 或波形代替。
