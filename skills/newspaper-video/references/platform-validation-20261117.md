# 平台验证记录 — 2026-11-17

最终检查对象是 **1.8.0** 发布清单。Claude Code 2.1.326 原生验证器对无软链接发布包的插件和市场清单执行 `--json --strict`，均返回 `success: true`、退出 0；WorkBuddy 随包 CLI 2.165.0 对三套平台插件和市场清单共六个文件均返回 `valid: true`、无 warning。以上是实际验证器执行结果，尚不是用户账户安装、技能调用或平台内渲染验收。

## 版本与隔离范围

| 对象 | 实测版本 / 位置 | 证据 |
| --- | --- | --- |
| 原有 Claude Code | `/usr/local/bin/claude`，1.0.108 | `--version`、帮助中没有 plugin 命令 |
| 临时 Claude Code | 官方 npm `@anthropic-ai/claude-code@2.1.326` | npm registry、临时安装后 `--version` / `plugin validate --help` |
| Claude 桌面 | `/Applications/Claude.app`，5.11492.5 | `Contents/Info.plist` |
| WorkBuddy 桌面 | `/Applications/WorkBuddy.app`，5.9.3 | `Contents/Info.plist` |
| WorkBuddy 随包 CLI | `@genie/agent-cli`，2.165.0 | 应用包 `cli/package.json` |

临时 Claude 包安装于系统临时目录，使用 Node 22.19.0、独立 npm cache、独立空 npm user/global config、`--ignore-scripts --no-audit --no-fund`。CLI 运行使用净化环境、临时 `CLAUDE_CONFIG_DIR`，关闭非必要流量；未覆盖 HOME。WorkBuddy 使用临时 `CODEBUDDY_CONFIG_DIR`。只运行版本、帮助和清单验证命令，没有发送模型提示、查询账户凭证或安装/启用用户插件；没有升级用户应用或全局 CLI。

## Claude Code 原生验证结果

先通过仓库 `skills/newspaper-video/scripts/build_plugin.py` 生成临时独立发布目录，再运行官方 CLI：

| 对象 | 参数 | 结果 |
| --- | --- | --- |
| 发布包 `.claude-plugin/plugin.json` | `plugin validate --json --strict` | exit 0；success true；manifest errors/warnings 均为空 |
| 发布包 `.claude-plugin/marketplace.json` | 同上 | exit 0；success true；manifest errors/warnings 均为空 |
| 源码 `.claude-plugin/plugin.json` | `plugin validate --json` | exit 0；success true；根目录 agents 兼容软链接有警告 |

发布包报告的 `provides.skills` 为 `newspaper-video:newspaper-video`，证明验证器能识别技能入口，不代表用户会话中已经调用它。源码根目录 `agents` 是兼容软链接；原生验证器跳过该目录并警告，所以源码的 strict 检查不能代替去软链接发布包的检查。构建产物没有这个根目录兼容链接，也不包含源码本机的 `.DS_Store`。

原生报告另列 **官方目录上架检查** `LICENSE_MISSING` 和 `ICON_MISSING`。本次没有启用 `--profile directory`，这两项不影响上述插件运行清单 strict 通过；它们意味着尚未满足官方目录提交条件。没有自行替用户指定许可证，也没有声称已可官方上架。

原有 1.0.108 CLI 的 `claude plugin --help` 只显示顶层帮助且没有插件命令。先前 `Invalid API key` 不是清单验证证据；结合旧版本帮助，旧 CLI 很可能把该文本当普通提示词。此次通过临时新版 CLI 完成原生检查，全局旧版保持原状。

## WorkBuddy 随包运行时结果

普通入口 `node .../cli/bin/codebuddy plugin --help` 报 `Cannot find module '../dist/codebuddy'`。当前桌面包实际入口为 `cli/dist/codebuddy-lite-wb.mjs`；其帮助列出 `plugin validate <path>`。

对 **1.8.0** 的以下六个文件逐一直接执行该运行时，均输出 `Validation passed`、`valid: true`，无 warning，退出 0：

- `.codebuddy-plugin/plugin.json` 和 `.codebuddy-plugin/marketplace.json`
- `.workbuddy-plugin/plugin.json` 和 `.workbuddy-plugin/marketplace.json`
- `.claude-plugin/plugin.json` 和 `.claude-plugin/marketplace.json`

初始 1.7.1 市场清单缺少插件项 version/description 的两个 warning，已通过 1.8.0 元数据补齐消除；Claude 原生市场 warning 也通过补齐市场顶层 description 消除。验证根目录会优先选市场，因此本次显式验证每个 JSON 文件。

临时负例同时揭示 2.165.0 验证器的限制：

| 临时输入 | 输出 | 退出码 |
| --- | --- | --- |
| 缺少 name | Validation failed / Missing required field: name | **0** |
| 不完整 JSON `{` | Validation failed / JSON parse error | **0** |
| 数字型 name: 17 | Validation passed with warnings，仅提示 description 缺失 | **0** |

因此自动化必须核对输出中的 `valid: true`、`Validation failed` 等，不能只检查退出码，也不能把这个版本的宽松解析称为严格 schema 保证。

## 复现入口

在已有支持插件命令的 Claude Code 环境中，先生成独立发布包，再运行：

```sh
claude plugin validate --json --strict /absolute/path/release/.claude-plugin/plugin.json
claude plugin validate --json --strict /absolute/path/release/.claude-plugin/marketplace.json
```

本次隔离安装使用 `npm install --prefix /temporary/runtime --ignore-scripts --no-audit --no-fund @anthropic-ai/claude-code@2.1.326`。因为禁止安装脚本，默认 `.bin/claude` 是占位文件；实际通过 `node /temporary/runtime/node_modules/@anthropic-ai/claude-code/cli-wrapper.cjs` 代替上述 `claude`，由官方 wrapper 启动 npm 可选平台包中的原生程序。运行前需设置临时 `CLAUDE_CONFIG_DIR`，使用独立空 npm 配置和净化环境，避免读取已有账户配置。

WorkBuddy 复现（应用内部入口可能随更新改变）：

```sh
platform_audit_config=$(mktemp -d /tmp/newspaper-platform-config.XXXXXX)
env -i PATH=/Users/swainwong/.nvm/versions/node/v22.19.0/bin:/usr/bin:/bin:/usr/sbin:/sbin \
  CODEBUDDY_CONFIG_DIR="$platform_audit_config" \
  node /Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/dist/codebuddy-lite-wb.mjs \
  plugin validate /absolute/path/release/.workbuddy-plugin/plugin.json
```

公开安装的 CodeBuddy CLI 对应命令为 `codebuddy plugin validate <path>`；本次未另行安装该 CLI。

## 最终证据指纹

- 三份平台 `plugin.json` 内容相同，SHA-256：`f7dfea2543d395d377bf8819e93264bd9cad1cc873fbf78792d8d0b895c49d67`。
- 三份平台 `marketplace.json` 内容相同，SHA-256：`b833b4566e6f7142aea53443f6a48e5bc059892273ef09ec437aea3ac2d34063`。
- Claude Code 2.1.326 darwin-arm64 原生程序 SHA-256：`e214ad76dcc0e846b03be28ed1c2734aacd4e27acb527cb7f8a9e2bed644e837`。
- WorkBuddy `codebuddy-lite-wb.mjs` SHA-256：`5cebda9a075c17a5eefa302342a5b2e1c236455cee05b09fac11244600f91465`。

指纹绑定此次文件；清单改变后需重新检查。动画或模板改动不会自动获得平台端到端验收。

## 官方来源和仍未验证项

- [官方 npm 包](https://www.npmjs.com/package/@anthropic-ai/claude-code)：本次取得版本 2.1.326。
- [Claude Code 清单参考](https://code.claude.com/docs/en/plugins-reference)：插件布局和原生验证命令。
- [Claude Code 市场创建](https://code.claude.com/docs/en/plugin-marketplaces)：市场 description 与安装/验证的不同阶段。
- [CodeBuddy 插件参考](https://www.workbuddy.ai/docs/zh/cli/plugins-reference)：三种兼容清单目录和公开验证命令。
- [WorkBuddy 桌面插件说明](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Plug-In)：推荐市场安装/管理。本次页面没有说明添加自定义市场地址的 UI 操作，不能据此确认当前桌面有该入口。

仍未验证：用户账户安装与实际技能调用、两个平台内执行模板渲染、GUI ZIP 导入、自定义市场 UI 入口、官方目录上架、连续观看/真实听音与 owner acceptance。清单通过不能代替这些环节。
