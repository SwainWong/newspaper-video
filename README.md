# Newspaper Video

把文稿与证据做成可编辑的 9:16 报纸拼贴讲解视频。此仓库同时是 Agent Skill 和 Remotion 工程模板；适用于 Codex，并提供 Claude Code、Claude 网页/Cowork 与 WorkBuddy 的安装入口。

[20 秒静音样片](assets/previews/style-demo.mp4) · [样例画面](assets/previews/style-preview.png) · [参考风格研究](references/origin-study.md) · [验证记录](references/validation.md)

样片是中性技术演示，不含配音或频道品牌。真实选题视频完成、复核后会在这里展示；目前不把样片称作两个选题的成片。

## 安装

| 平台 | 放置或导入 | 调用 |
| --- | --- | --- |
| Codex | 把整个仓库放到 `~/.agents/skills/newspaper-video/`，其中根目录必须有 `SKILL.md` | `$newspaper-video`，或自然语言描述报纸拼贴视频 |
| Claude Code | 把整个仓库放到 `~/.claude/skills/newspaper-video/`；项目内可用 `.claude/skills/newspaper-video/` | `/newspaper-video` |
| Claude 网页 / Cowork | 将包含 `newspaper-video/SKILL.md` 的 ZIP 通过自定义技能入口导入 | 在会话中要求使用该技能；渲染所需 Node、浏览器能力需在所在环境检查 |
| WorkBuddy | 「专家·技能·连接器 → 技能 → 添加技能 → 上传技能」导入同一 ZIP；项目开发模式可放到 `.codebuddy/skills/newspaper-video/` | 在新对话中指定该技能并检查实际加载 |

[平台细节与官方文档](references/platforms.md)。格式适配不等于每个平台已完成端到端测试；已验证范围见上方记录。

## 制作流程

1. 阅读 [SKILL.md](SKILL.md)。先核实文稿中的事实、角色身份、文件/帖子的来源；画面里让观众看得见谁发布、何时发布和原文关键句。
2. 复制工程：`python3 scripts/project.py create /absolute/path/my-video`。目标目录必须不存在。
3. 在新工程的 `src/timeline.json` 配场景、字幕、图片和音频；将媒体放入该工程的 `public/`。用 `src/theme.json` 调颜色、字幕和部分动画参数。[时间线字段说明](references/timeline.md)。
4. 在新工程运行 `npm ci`、`npm run check`、`python3 validate_timeline.py src/timeline.json`，再回到本仓库通过 `python3 scripts/project.py still /absolute/path/my-video --frame 240` 和 `python3 scripts/project.py render /absolute/path/my-video` 输出静帧、MP4。
5. 按正常速度查看成片并试听，核对字幕、证据停留、配音和素材使用范围。解码通过只说明文件技术上可读。

要求 Python 3、Node 22.12+、npm 和 Chromium/Chrome。工程锁定 Remotion 4.0.540。输出写在新工程的 `out/`，不会写进 Skill。Remotion 和其他第三方依赖遵循各自许可证；仓库不包含参考原片或其截图，也不授权使用第三方新闻图片。

## 模板内容

- `assets/template/src/template.tsx`：报纸舞台、照片卡、标题、字幕、数字、比较条与时间线。
- `assets/template/src/theme.json`：主要色彩、字幕和入场运动参数。
- `assets/template/public/`：原创中性纸纹、图钉、胶带及示例插图。
- `assets/template/examples/`：不同场景结构示例。
- `scripts/project.py`：创建工程、抽帧与渲染；`scripts/package.py`：打包跨平台 Skill。

[参考片分析](references/origin-study.md)列明了目前仍待做成可配置组件的效果。欢迎通过 Issues 报告实际环境、来源展示或视频排版问题。
