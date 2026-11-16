# 平台适配（2026-11-16 核对）

同一Skill目录以标准 name/description YAML frontmatter + Markdown为核心，无Claude专有动态命令、无Codex MCP依赖、无平台凭据。脚本以自身路径定位资源，输出写到用户指定工程。

## Codex（主要目标）

本机源目录在 ~/.codex/skills/newspaper-video；为当前官方发现路径提供 ~/.agents/skills/newspaper-video 单一来源软链接。新机器可直接把解压后的 newspaper-video 放到 ~/.agents/skills/。使用 `$newspaper-video` 或明确要求报纸拼贴风格。当前会话可直接读取SKILL.md；新会话检查选择器是否发现，不把文件存在称作运行时发现已验证。

依据：https://learn.chatgpt.com/docs/build-skills （Codex用户级目录 ~/.agents/skills）。不要在多个发现路径保存两份可编辑副本。

## Claude Code

把整个 newspaper-video 目录复制到 ~/.claude/skills/，或项目 .claude/skills/。使用 `/newspaper-video`，也可自然语言匹配 description。Codex的 agents/openai.yaml 不影响核心指令，不要求Claude识别该文件。

Claude 网页/Cowork 使用账号的自定义技能上传入口导入ZIP；不会自动读取本机 ~/.claude/skills。能否在其沙箱安装 Node/npm/Chromium并渲染必须单独验证；如环境不支持，在有这些依赖的本地工程执行，不声称网页已渲染。

依据：https://code.claude.com/docs/en/skills ，https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview 。

## WorkBuddy

首选官方「专家·技能·连接器 → 技能 → 添加技能 → 上传技能」导入ZIP，保留内层 newspaper-video/SKILL.md 及全部资源。当前没有为它捏造YAML专有字段或假设私人安装目录。

WorkBuddy项目开发模式另有官方 .codebuddy/skills/<name>/ 项目级路径，可按该模式放置整个目录；这不是声称所有WorkBuddy版本都使用同一全局目录。导入后在已安装页检查技能并新建对话试运行。

依据：https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market ，https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Project 。

## 验证层级

格式与脚本通用；本机实际验证记录见 validation.md。Claude/WorkBuddy客户端导入、自动选择、权限和渲染未执行时必须标未验证。不要为了格式兼容编造成功记录。
