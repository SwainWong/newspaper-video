# Newspaper Video

把文稿、证据与数据做成可编辑的 9:16 报纸拼贴讲解视频。此仓库同时是 Agent Skill 和 Remotion 工程模板；适用于 Codex，并提供 Claude Code、Claude 网页/Cowork 与 WorkBuddy 的安装入口。

[20 秒静音样片](skills/newspaper-video/assets/previews/style-demo.mp4) · [样例画面](skills/newspaper-video/assets/previews/style-preview.png) · [参考风格研究](skills/newspaper-video/references/origin-study.md) · [验证记录](skills/newspaper-video/references/validation.md)

[下载最新 Skill 安装包](https://github.com/SwainWong/newspaper-video/releases/latest)。

两条实例已更新为 **V6 系列英语审阅版**，采用 Skill 1.6.1 的视觉规范：首秒主体影像、图片与分析同场、明确关系连线、同一原件连续平移缩放。固定 SwainTalk 品牌、英语 The Anchor 口播、纯英语字幕、品牌停顿和有节奏的配乐沿用。

下方 GIF 可在 GitHub README 中直接展示动画。完整 MP4 另提供打开/下载入口；GIF 为无声片段，不代表全片或声音验收。

## 两个竖屏制作实例

### 黄仁勋专题 · V6.1

**2:59.243 · 1080×1920 · 30 fps。** 8 个内容场景中有 6 个包含实质图片；关系图用人物/产品形象标识主体，用带标签的箭头说明关系。主标签和连接词经过手机尺寸复核并放大。

| 人物影像开场 | SEC 原件连续放大、高亮 |
| --- | --- |
| ![人物影像开场](showcase/huang-gifs/01-hook.gif) | ![同一SEC页面连续缩放](showcase/huang-gifs/02-evidence-zoom.gif) |

| 图片与政策关系 | 产品与供应链关系 |
| --- | --- |
| ![有明确含义的图片关系图](showcase/huang-gifs/03-picture-relations.gif) | ![供应链逐步揭示](showcase/huang-gifs/04-supply-chain.gif) |

[打开／下载完整 MP4](showcase/huang.mp4) · [封面](showcase/huang-cover.png) · [标题](showcase/huang-title.txt) · [描述](showcase/huang-description.md) · [事实来源](showcase/huang-sources.md) · [图片署名](showcase/huang-image-credits.md) · [英语字幕](showcase/huang-subtitles.srt) · [GIF 时间码与哈希](showcase/huang-gifs/manifest.json)

### APEC 专题 · V6

**2:54.912 · 1080×1920 · 30 fps。** 三位领导人照片构成开场；8 个内容场景中有 7 个包含实质图片。外交部与 IMF 原文保留同一原图连续放大；经济分析使用同口径、同刻度的实际 GDP 增长预测数据。

| 三位领导人影像钩子 | 公告全貌到重点 |
| --- | --- |
| ![三位领导人入场](showcase/apec-gifs/three-leaders.gif) | ![外交部原件连续缩放](showcase/apec-gifs/mfa-continuous-zoom.gif) |

| IMF 全貌到预测年份 | 随口播增长的数据条 |
| --- | --- |
| ![IMF表格连续缩放](showcase/apec-gifs/imf-continuous-zoom.gif) | ![GDP增长预测数据比较](showcase/apec-gifs/gdp-growth-bars.gif) |

雅尔塔到波茨坦，随讲述切换历史影像：

![历史会议影像切换](showcase/apec-gifs/yalta-to-potsdam.gif)

[打开／下载完整 MP4](showcase/apec.mp4) · [封面](showcase/apec-cover.png) · [标题](showcase/apec-title.txt) · [描述](showcase/apec-description.md) · [事实来源](showcase/apec-sources.md) · [图片署名](showcase/apec-image-credits.md) · [英语字幕](showcase/apec-subtitles.srt) · [经济数据](showcase/apec-economy-data.csv) · [GIF 时间码与哈希](showcase/apec-gifs/manifest.json)

[视频哈希与审查范围](showcase/manifest.json)。已完成完整解码、制作记录与实际旁白停顿检查，以及最终文件关键画面和变焦中间帧检查；正常速度全片观看、真实听音及作者验收仍待完成。图片覆盖统计排除品牌段、文档截图、背景和微小水印。

黄仁勋专题将个人关系报道、政治行动记录和未来影响分析分开；APEC 专题是 2026 年 11 月 16 日制作的会前预告，后续正式结果需另行更新。第三方图片使用范围与未决事项见署名清单，不代表取得全面转载授权。可编辑工程及 VO/BGM/SFX 分轨保留在本地 `work/`；仓库提供通用模板和数据接口。

## 安装插件（1.7.1）

源码只维护在 `skills/newspaper-video/`。根目录旧入口为兼容链接；安装缓存是分发副本，不在其中开发。

Codex：`codex plugin marketplace add /absolute/path/newspaper-video`，然后 `codex plugin add newspaper-video@swainwong-newspaper`。发布前可运行 `python3 skills/newspaper-video/scripts/build_plugin.py /outside/source/release` 创建干净的本地市场，再对该路径安装。

Claude Code：`claude plugin marketplace add /absolute/path/newspaper-video`，然后 `claude plugin install newspaper-video@swainwong-newspaper`。调用 `/newspaper-video:newspaper-video`。

WorkBuddy：在插件页添加本仓库的市场地址；兼容 CodeBuddy CLI 的模式可用 `codebuddy plugin marketplace add /absolute/path/newspaper-video` 及 `codebuddy plugin install newspaper-video@swainwong-newspaper`。不支持市场导入的客户端可运行 `python3 skills/newspaper-video/scripts/package.py /outside/source/newspaper-video.zip`，从技能上传入口导入。平台客户端导入与实际渲染的验证状态分别记录，不把清单兼容当端到端成功。

官方契约：[Claude Code](https://code.claude.com/docs/en/plugins-reference)、[WorkBuddy插件](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Plug-In)、[CodeBuddy兼容清单](https://www.workbuddy.ai/docs/zh/cli/plugins-reference)。

## 参考研究与动效模块

输入是批准脚本、真实时码与合法素材；先按语义选择图像、数据、证据或关系画面，加入标题/字幕，检查动作组合，再渲染并看听。输出为可编辑工程、MP4与来源/验收记录，交给用户审阅。

参考研究模块读取5/6/7与截图，产出带来源哈希的[观察记录](skills/newspaper-video/references/origin-study-567.md)，交给动画设计。新增13种设计配方包含分区关系、阶段曲线、检查板、行情线、色层/遮挡、日历翻页等；它们不是全部已实现的模板组件。

动画模块读取[逐项合同](skills/newspaper-video/references/motion-contracts.md)，选择输入、适用条件、运动阶段与互斥关系，产出 `motion-plan.json`，交给组合检查。已有实现与设计配方在[目录](skills/newspaper-video/references/motion-catalog.json)明确区分。

声音模块以动作时码为输入，将原创paper/tick/whoosh短音或有许可素材绑定到动作，输出独立SFX和混音，交给听审。内置短音是设计候选，尚未做真实听音验收。

组合检查读取动作时段、区域、焦点和声音锚，拒绝冲突及没有实现证据的配方；完整render会运行 `motion_gate.py`。它只检查计划，实际像素、运动与声音仍由视听审查确认。

## 制作流程（1.6.1）

1. 先确认主语言、独立字幕模式/语言、配音工具（系统声或需安装的 VoiceStudio）。缺项不得启动工程。调研后交中英文对照脚本与图片分镜，用户确认文件版本后才制作。阅读 [完整流程](skills/newspaper-video/references/production-workflow.md) 与 [声音模块](skills/newspaper-video/references/audio-production.md)。先核实文稿中的事实、角色身份、文件/帖子的来源；画面里让观众看得见谁发布、何时发布和原文关键句。
2. 复制工程：`python3 skills/newspaper-video/scripts/project.py create /absolute/path/my-video --brief /absolute/path/review/production-brief.json`。目标目录必须不存在。
3. 按[语义动画规范](skills/newspaper-video/references/semantic-motion.md)设计首秒影像钩子，至少一半内容场景使用实质图片，并结合数据比较和带明确关系标签的连线；原文证据用同一页面连续平移缩放，记录真实声词锚点及素材日期。在新工程的 `src/timeline.json` 配场景、字幕、图形和音频；将媒体放入该工程的 `public/`。用 `src/theme.json` 调颜色、字幕和部分动画参数。[时间线字段说明](skills/newspaper-video/references/timeline.md)。
4. 在新工程运行 `npm ci`、`npm run check`、`python3 validate_timeline.py src/timeline.json`，并完成 `review-plan.json`；完整渲染前运行 `python3 skills/newspaper-video/scripts/review_plan.py /absolute/path/my-video/review-plan.json --require-visual` 检查记录，再回到本仓库通过 `python3 skills/newspaper-video/scripts/project.py still /absolute/path/my-video --frame 240` 和 `python3 skills/newspaper-video/scripts/project.py render /absolute/path/my-video` 输出静帧、MP4。
5. 按正常速度查看成片并试听，核对字幕、证据停留、配音和素材使用范围。解码通过只说明文件技术上可读。

要求 Python 3、Node 22.12+、npm 和 Chromium/Chrome。工程锁定 Remotion 4.0.540。输出写在新工程的 `out/`，不会写进 Skill。Remotion 和其他第三方依赖遵循各自许可证；仓库不包含参考原片或其截图，也不授权使用第三方新闻图片。

## 模板内容

- `assets/template/src/analysis-graphics.tsx`：按声词时码增长的数据条、同源连续变焦/黄笔/摘要、带图片及连接含义的逐步关系图和固定 SwainTalk 品牌组合。`public/brand/` 保留原透明 Logo、字体与许可；其他频道可用通用品牌接口。
- `assets/template/src/template.tsx`：报纸舞台、首帧可见的主体照片卡、标题、字幕、数字、比较条与时间线；`src/editorial.tsx` 提供文件、日程轴和三方关系图。
- `assets/template/src/theme.json`：主要色彩、字幕和入场运动参数。
- `assets/template/public/`：原创中性纸纹、图钉、胶带及示例插图。
- `assets/template/examples/`：不同场景结构示例，含 `editorial-example.json` 和频道片头片尾示例。
- `scripts/review_plan.py`：检查影像场景覆盖、前三秒钩子、连续变焦及关系语义记录，以及语义时间、数据口径、当期素材日期和品牌前后停顿记录；`brand_pause_check.py` 用 ffmpeg 另核实际 VO 分轨的停顿区间；不替代实际看听。
- `scripts/preflight.py`：检查语言、字幕、声音选择及脚本批准哈希；不能替代真实用户批准。
- `scripts/showcase_gifs.py`：从最终成片的3–5段选定窗口生成README动画GIF，并保存来源与产物哈希。
- `scripts/project.py`：创建工程、抽帧与渲染；`scripts/package.py`：打包跨平台 Skill。

[参考片分析](skills/newspaper-video/references/origin-study.md)列明了目前仍待做成可配置组件的效果。欢迎通过 Issues 报告实际环境、来源展示或视频排版问题。
