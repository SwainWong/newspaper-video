---
name: newspaper-video
description: 制作或修改旧报纸、照片拼贴、图钉胶带、动态数字与时间轴风格的 Remotion 讲解视频；使用内置素材、样式参数和可运行模板。适用于复用报纸拼贴视觉风格，不承担通用剪辑或发布账号操作。
metadata:
  version: "1.4.0"
---

# 报纸拼贴视频

交付可播放视频及独立可编辑工程。默认 1080×1920、30 fps；品牌和时长沿用用户要求；主语言、字幕及配音工具必须有用户明确选择，不默认。现有项目返修优先在项目内操作，保留原文件。

## 必须先完成入口与脚本确认

先执行[制作流程与开工条件](references/production-workflow.md)：确认主语言、字幕模式/语言、配音工具；调研并交中英文对照的口播/画面审稿包，逐句排除制作过程话语。用户确认具体脚本版本后才能生成视频。先钩子、再短 IP 过渡、再主体。实体以图片为主，文字解释关系；所有同类镜头一并检查。声音按[音频制作](references/audio-production.md)提供独立 BGM/SFX/VO 并试听。

## 先看实际风格

先看 [三部参考视频的镜头研究](references/origin-study.md)，再打开 [样例画面](assets/previews/style-preview.png)、[20 秒静音样片](assets/previews/style-demo.mp4) 和 [风格与素材说明](references/style.md)。样片为模板自身效果，不是参考原片的像素复刻证明。核心是稳定旧报纸背景、照片白边及图钉/胶带、黄色标题纸条、红色标签、短语字幕、随讲述分步揭示。

## 创建与编辑

把本文件所在目录记为 SKILL_ROOT。用下列脚本创建新工程，目标目录必须不存在：

```sh
python3 "<SKILL_ROOT>/scripts/project.py" create "/absolute/path/my-video" --brief "/absolute/path/review/production-brief.json"
```

只在生成的项目里改内容，不把运行状态、媒体或输出写回 Skill。模板不包含本期币安故事、私人配音或频道 Logo。运行依赖为 Python 3、Node/npm、Chromium；源代码锁定 Remotion 4.0.540，已用 Node 22 验证。

1. 读取用户文稿和媒体，确定每句对应的画面、证据及来源。真实帖子保留作者/头像/时间/上下文，先完整展示再放大关键段；不要手绘假帖子。角色介绍一次说明插画/化名，之后以角色职务为主。
2. 按 [时间线接口](references/timeline.md) 编辑 `src/timeline.json`；将使用的素材和已有配音复制到 `public/`，使用相对文件名。完整配音的实测时长决定帧长，不为凑目标截断或硬拉伸。若用户要求频道 IP 开头和结尾出现，须核对它在画面与口播中均出现，并纳入总时长及字幕。未提供配音时，必须使用用户选定并经试音确认的工具与音色；不可静默换成系统声或用静音稿充当成片。
3. 文件整页、日程轴和三方关系图可用 `scene.editorial`，先看 [时间线接口](references/timeline.md) 的字段与示例；真实文件画面必须从原始来源截取并保留机构/时间，示例插画不能充当来源。改风格时使用 `src/theme.json` 的颜色、字幕和运动参数；纸纹/图钉/胶带是模板实际引用的 `public/*.svg`。需要禁止SVG的项目按用户约束换素材，不自行豁免。
4. 安装依赖后验证、抽帧、渲染。依赖安装可能联网；浏览器不可用时传入本机Chrome路径。

```sh
cd "/absolute/path/my-video"
npm ci
npm run check
python3 validate_timeline.py src/timeline.json
python3 "<SKILL_ROOT>/scripts/project.py" still . --frame 240
python3 "<SKILL_ROOT>/scripts/project.py" render .
```

`--browser /absolute/path/to/chrome` 可加在 still/render 命令后。不同主机字体可能不同；若用户提供授权字体，把字体包含到项目并实测排版。

## 检查与交付

先核场景切换、阶段中间帧、证据身份及时间、字幕与角色标签的避让，再看手机尺寸。需要试听的口播/BGM/SFX单独说明实际检查范围。解码、ASR、音量或静帧不能写成真实看听通过。若缺少感知能力，明确指出具体缺口并交可复核候选，不反复渲染同一文件假装进展。

交付 MP4、工程路径、来源及使用范围记录；发布平台需要时另做封面、标题、描述。视频制作授权不包含自动上传。默认不启动常驻服务器；工作结束不留下无用后台进程。

## 其他平台

按 [平台适配与安装](references/platforms.md) 使用同一目录或ZIP。核心指令不依赖 Codex 特有工具；`agents/openai.yaml` 仅用于 Codex 展示。Claude 网页/Cowork 和 WorkBuddy 的可用运行环境必须实测，格式兼容不等于已完成这些客户端的执行验收。
