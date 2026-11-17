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

1.4.0发布时的 V3 两片被用户要求返修，不能作为 1.4 视听验收证据。该阶段英文 V4 审稿文件尚待批准；之后的制作记录见后续版本。Claude/WorkBuddy 仍未做端到端实测。


## 1.5.0 validation

Ten unittest cases pass, including rejecting early future-event reveals, critical estimated timing, unexplained long static holds, stale current-event photos, mismatched brand components/missing pauses, and incomplete chart measurement provenance. TypeScript compiled in a separate generated fixture project. Actual brand and synthetic data-comparison stills were rendered and inspected at 1080×1920; these are component checks, not full-video visual/listening acceptance. Original reference motion was re-sampled as described in origin-study.md. Inter font and OFL are bundled; SwainTalk logo retains canonical hash. Cross-client execution in Claude/WorkBuddy remains unverified.


1.5.1 adds two waveform-backed tests: correctly placed silence passes, injected speech inside a declared pause fails, and a missing voice stem is not considered silence. Twelve unittest cases pass where ffmpeg is available; the two audio tests are explicitly skipped without ffmpeg, not reported as audio verification. This fixes the gap between plausible ASR timing records and actual voice samples.


## 1.6.0 连续变焦与图像叙事检查

16个unittest用例通过，新增图片覆盖不足、文档冒充实质图片、悬空关系线、换源硬切和高亮早于摄影机落稳等负例。隔离工程中TypeScript通过；摄影机几何函数实际检查起终位置、中间连续性及越界拒绝。用真实原件渲染0/30/42/54/84帧并查看：整页、定位框、中途表格位置、局部、黄笔及编辑摘要保持同一图像坐标。源文件的5帧检查不是正常速度全片观看。

GIF工具已从20秒模板样片生成三段270×480、12fps、每段3秒的GIF，分别完整解码并核对36帧，清单包含来源和产物SHA。这验证生成流程，不等同于两部新闻片的GIF或完整视听验收；最终影片及GIF状态以showcase/manifest.json为准。CLI完整render强制检查1.6视觉计划，旧记录可单独检查历史合同但不能绕过新制作门禁。

1.6.1 additionally fixes the generated starter: the image-led story precedes the brand, and the first image remains visible on frame zero during its entrance. TypeScript and all 16 unittest cases pass after this change; the actual generated default frame zero was rendered and inspected. The original 20-second style-demo is retained as a historical template sample, not a demo of the new opening order.

## 1.7.0 跨平台封装与参考规则

2026-11-17：23个unittest通过；Skill frontmatter验证通过；独立Skill ZIP打包成功。Codex CLI实际安装newspaper-video@swainwong-newspaper 1.7.0到版本缓存；Claude/WorkBuddy清单按官方契约提供，未运行这两个客户端。观察范围见origin-study-567.md；13种新配方尚未全部成为模板组件，生产门禁要求项目实现与抽帧记录。新增paper/tick/whoosh为原创程序合成声音，未完成真实听审。此次README已同步源码结构、模块输入输出、安装和验收边界；没有声称参考片完整看听验收。

1.7.1：Codex app-server skills/list 实际返回启用的 newspaper-video:newspaper-video，pluginId为newspaper-video@swainwong-newspaper，路径指向1.7.1缓存。当时旧Claude CLI返回Invalid API key；后续确认该版没有plugin命令，此结果不能视为清单验证。WorkBuddy随包CLI与临时新版Claude的后续实测见1.8记录。独立安装包无软链接，不含work/.git/node_modules/原片截图；旧Skill ZIP可生成。

已从Codex 1.7.1安装缓存复制模板到独立目录，使用独立npm缓存完成npm ci；TypeScript检查通过，Chrome实际渲染第0帧并查看，主体示例图片可见。这是旧模板安装可运行性检查，不是13种新配方实现或视听验收。默认用户npm缓存曾报权限错误，改用临时缓存，未修改用户缓存权限。


## 1.8.0 可执行动效与平台原生验证

2026-11-17：13个参考配方全部接入可运行模板（11个画面组件、2种转场），包含共用字段校验、互斥/区域/焦点检查及实际时间线哈希绑定。32项Python回归、52组真实Remotion组件运行断言、Node 22.19.0下TypeScript及字段校验通过。检查板支持1–8项，超过4项分页且保留全局状态；阶段曲线和检查板使用参考截图中的深色教学板层次。

通过motion_demo.py生成独立合成测试工程，实际输出77.013秒、540×960、30fps H.264/AAC样片。文件SHA-256：`beadcaded4aead3b8d32203cadb5038aeaecd7c57cb4c85288b0419db9ab75ab`；完整解码无错误。11个组件的中间/落稳帧已抽查；深色板修订后重新渲染并查看，另核两种转场切镜帧的全屏覆盖。4个GIF均通过解码及帧数核对，见仓库showcase/motion-1.8/manifest.json。声音为原创程序合成候选，无旁白/BGM；未完成正常速度连续观看、真实听音或作者验收。

Claude Code 2.1.326在临时隔离配置下对1.8.0独立发布包原生strict验证通过；WorkBuddy随包CLI 2.165.0对六个清单返回valid true、无warning。旧全局Claude CLI未替换。详见[平台记录](platform-validation-20261117.md)，其中清楚区分插件清单验证与用户账户实际调用/渲染；后二者仍未完成。

README已同步接口、模块输入输出、组合流程、平台限制及可播放测试预览。


Codex CLI实际安装`newspaper-video@swainwong-newspaper` 1.8.0；新启动app-server的skills/list返回启用入口`newspaper-video:newspaper-video`，路径位于1.8.0缓存。保留指向唯一源码的本地兼容链接，不在缓存中开发。焦点冲突检查新增实际组件时序推导，拒绝借缩短计划落稳时码隐藏并发；原件连续变焦区间也从时间线直接核对转场。
