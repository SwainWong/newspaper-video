# 验证记录

模板运行测试对应 1.0.0；1.1.0 新增三部参考片研究、README 和独立仓库，未改 Remotion 运行代码。日期：2026-11-16。此记录不代表未来所有环境均可运行。

## 已实际完成

- Skill frontmatter 通过 skill-creator 的 quick_validate.py。
- 使用 scripts/project.py 在独立临时目录创建项目；已有目录被拒绝，避免覆盖工作。
- 模板依赖安装和 TypeScript 检查完成。最终项目在显式 Node 22.19.0 环境下通过 npm run check。初次安装遇到用户 npm 缓存权限问题，改用独立临时缓存；没有修改用户缓存权限。
- 默认时间线和五个 examples JSON 全部通过输入校验；缺少必需 id、captions 的负例均被拒绝。
- Remotion 实际输出第 240 帧 PNG 和 20 秒、1080×1920、30fps MP4；MP4 完整解码无报错。样片故意不含音轨。
- 实际查看样例 PNG，确认报头、黄色标题、照片卡、红色数字标签和字幕层次可见。该静帧检查不代表连续动画验收。
- 独立执行者把模板改成无品牌科技场景，创建工程、校验、TypeScript 检查和抽帧成功；依赖复用主测试安装，不算第二次独立安装。其覆盖保护测试确认已有时间线和预览文件哈希未变。
- 独立测试发现的缺失字段校验已修复并以负例复测；字体参数范围已在 style.md 限定；当时缺少的预览和本记录现已补齐。
- Codex 的 ~/.agents/skills/newspaper-video 软链接指向单一源目录。文件安装完成；新的客户端会话是否发现/调用仍需客户端确认。

## 1.2.0 组件增量检查

`editorial` 新增完整文件、日程轴、三方关系三种数据驱动画面。示例 JSON 通过时间线校验；在独立已安装依赖的临时项目中，Node 22.19.0 下 TypeScript 检查通过，三种画面分别渲染 PNG 并实际查看。模板根视频的全片动效未因这些增量重渲染。打包回归测试确认忽略的 `work/`、`.git/` 不进入 Skill ZIP。

## 1.3.0 双视频验证

由两个独立 Codex 对话制作，并各自修订至 V3。公开展示文件 `showcase/huang.mp4`：172.309 秒、1080×1920、30 fps、SHA-256 `0879923a763f72752965dc47d0b0e8cbe5f9c384ef4f4afed4da525ceaee9c53`；`showcase/apec.mp4`：170.837 秒、同规格、SHA-256 `338f6afdb7eb37d6a242743542f0674fb10be6dcb6cba2a017783c1ab2c64b79`。两片均含片头片尾频道画面与新合成口播；本机复核完整解码、开头/结尾静帧、对应音轨片段存在。各制作对话进一步完成场景抽帧、类型/时间线和音量检查。真实听音、正常速度全片观看及作者验收仍待完成。

## 未验证范围

未完成 Claude Code、Claude 网页/Cowork、WorkBuddy 客户端导入及端到端执行；平台文档核对只说明打包/入口适配。未进行完整实时观看、声音试听或用户视觉验收；静音样片也不能证明口播同步。未声称对参考原片实现像素级复刻。

样片 SHA-256：`a804916e071e916768bd989cae60f0da266a241bb9cbea54188050a4d6c26478`。

## 1.4.0 用户反馈升级

新增入口选择与脚本哈希批准检查，未批准不得建制作工程；脚本改变即失效。新增旁白过程话语审核、图片语义规则、钩子顺序、主语言/字幕/异语划词翻译、VoiceStudio 选择与试音、BGM/SFX 合同。包装命令检查音乐/音效声明与首镜钩子。新增可编辑 musicEnvelope，TypeScript 检查通过（本轮运行环境 Node 18.20.8，复用已安装依赖，未声称独立安装/新渲染）。单元测试覆盖缺批准不建项目、脚本变动失效与选择缺项；结构验证不认证真实批准消息，也不替代逐句/图片/听音审核。

当前 V3 两片被用户要求返修，不能作为 1.4 视听验收证据。英文 V4 审稿文件在本机审稿目录，未获得用户批准，因此未生成新版视频。Claude/WorkBuddy 仍未做端到端实测。


## 1.5.0 validation

Ten unittest cases pass, including rejecting early future-event reveals, critical estimated timing, unexplained long static holds, stale current-event photos, mismatched brand components/missing pauses, and incomplete chart measurement provenance. TypeScript compiled in a separate generated fixture project. Actual brand and synthetic data-comparison stills were rendered and inspected at 1080×1920; these are component checks, not full-video visual/listening acceptance. Original reference motion was re-sampled as described in origin-study.md. Inter font and OFL are bundled; SwainTalk logo retains canonical hash. Cross-client execution in Claude/WorkBuddy remains unverified.
