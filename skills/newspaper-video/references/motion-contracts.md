# 动效合同 1.7

此库将原有子动画按可调用模块归并；例如photo包含照片入场、白边、标签、图钉/胶带和视频槽，evidence包含摄影机、定位框、黄笔与摘要。没有删除原有子效果。

## 使用方法

1. 先按语义选择catalog.match；根据use准备输入，遵守constraints。implemented是已有模板入口；recipe是可以在项目中实现的复刻配方，并非新增模板字段。deprecated拒绝新生产。
2. 每个动作写入motion-plan.json，记录全片绝对整数帧start/settle/end、区域bbox=[x,y,width,height]、focus、meaning及声音。settle到end为阅读保持。默认入场9–18帧，转场12–24帧；参考测量只精确到0.25秒，不能声称逐帧拟合。
3. 同时间同区域只允许一个主内容模块；装饰附着于父模块，不再重复注册为抢焦点动画。证据、行情线、关系图选择其一占主区，标题/字幕各占独立区。上下区域可组合，但同时运动的主焦点只能一个。
4. 先做冲突检查：python3 scripts/motion_gate.py motion-plan.json。新增效果必须登记所有字段与双向excludes，跑负例；未知效果报错。每个新增主模块与所有已有主模块默认按空间和时间互斥，无需遗漏的逐对黑名单。同模块同区域也检查。
5. 生产计划不能使用recipe，先在独立工程实现并验证，再将实现文件、参数、起中终帧及检查记录写入recipe_implementations；未完成不得标可渲染。

## 动作阶段与运镜

- split：背景两半横向展开→两侧文字落稳→中间关系圆牌缩放0.85到1，关系不得提前出现。
- stage-curve：坐标/阶段区先建立→当前段沿路径揭示、端点跟随→阶段标签→停留；已画段保留，下一段只在下一个词锚开始。
- checklist：空框和总数先展示→当前解释卡淡入/曲线绘制→勾选→已通过计数更新。不能先把所有勾填满。
- market-line：线图先建立→末值圈点→基准线横向展开→差值数字增长→结论。源数据稀疏时不得平滑生成未观测行情。
- chapter-tint：纸面之上内容之下的色层，9–18帧变化；对原始证据和肤色使用独立未染色容器。
- color-wipe：色块从边缘覆盖→全遮挡帧替换内容→撤去；方向由叙事保持一致，内容运动在转场结束后开始。
- iris：圆形遮挡扩大/缩小，覆盖时换场；只用于明确层次变化，不与色块擦除叠加。
- calendar-flip：每页上半部绕中缝翻转，下一值在背面露出，末页停止并保持；快翻只给组首/组尾纸声。
- film-frame：将合法媒体放入固定带孔边框，与photo入场复用，取消该槽额外图钉/胶带；边框不滚动抢焦点。
- keyword：短语纸片低角度入场，先事实后重音，落稳后不持续抖动。
- threshold：标明总量与阈值→当前值从零增长→门槛差距→有依据的结果标签。
- icon-metaphor/date-tiles：目前仅截图构图证据，运动是建议设计；不宣称已观察原片轨迹。

## 声音合同

本轮未做真实音轨听审；以下是新设计的声音匹配，不是原片声音识别。none默认静音且说明原因；paper对应纸片接触/翻页组尾；tick对应勾选、计数到终值、阈值落稳；whoosh对应转场速度峰值。用短、低密度声音，不逐字配音效。每项必须填sound:{kind,file,at,tail_end,license}或sound:{kind:"none",reason}。at应在settle±3帧（whoosh在运动区间）；tail_end可跨动作结束但不能越过全片末尾。文件与许可必填，不能引用未下载素材。VO重音、姓名和数字处避让，BGM按原音频规范ducking。

## 效果逐项索引

### paper · 静态报纸舞台 [implemented]

- 匹配：任何报纸场景
- 使用：`theme/Paper`
- 约束：背景装饰不得被当作数据
- 区域：background；声音：none；显式互斥：按区域/焦点通则

### title · 标题纸条 [implemented]

- 匹配：本镜主题建立
- 使用：`Scene.title/kicker`
- 约束：不可承载整段口播
- 区域：title；声音：paper；显式互斥：按区域/焦点通则

### photo · 照片弹簧拼贴 [implemented]

- 匹配：人物/事件需要可辨主体
- 使用：`Scene.images/visualBeats/labels/attachment/layout`
- 约束：最多两图；首镜首帧可见；附件随主体
- 区域：content；声音：paper；显式互斥：按区域/焦点通则

### metric · 指标与计数 [implemented]

- 匹配：有来源的量值或年份
- 使用：`Scene.metric/counter/metricBeats`
- 约束：终值与单位明确，落稳留阅读时间
- 区域：content；声音：tick；显式互斥：calendar-flip

### detail · 说明纸卡 [implemented]

- 匹配：补充已有主体
- 使用：`Scene.detail/detailDelay`
- 约束：不遮挡主体和字幕
- 区域：annotation；声音：none；显式互斥：按区域/焦点通则

### notes · 嵌套便签 [implemented]

- 匹配：有层级的解释
- 使用：`Scene.nestedNotes`
- 约束：层级不得冒充因果
- 区域：annotation；声音：paper；显式互斥：按区域/焦点通则

### comparison-legacy · 旧比较条 [implemented]

- 匹配：兼容历史工程
- 使用：`Scene.comparison`
- 约束：新项目使用data；固定错峰不等于词锚
- 区域：content；声音：none；显式互斥：data

### data · 语义数据条 [implemented]

- 匹配：同口径定量比较
- 使用：`Scene.analysis:data`
- 约束：1–4行；零基线；rows.at来自VO
- 区域：content；声音：tick；显式互斥：comparison-legacy, threshold

### timeline · 横向时间轴 [implemented]

- 匹配：有先后关系的事件
- 使用：`Scene.timeline`
- 约束：日期准确；固定间距不代表真实比例
- 区域：content；声音：tick；显式互斥：按区域/焦点通则

### schedule · 纵向日程轴 [implemented]

- 匹配：日期与议程
- 使用：`Scene.editorial:schedule`
- 约束：1–4项；明确已定/预期
- 区域：content；声音：tick；显式互斥：按区域/焦点通则

### document-legacy · 旧文件推近 [implemented]

- 匹配：完整文件浏览
- 使用：`Scene.editorial:document`
- 约束：重点原文改用evidence
- 区域：content；声音：none；显式互斥：evidence

### evidence · 同源变焦黄笔摘要 [implemented]

- 匹配：解释真实原文
- 使用：`Scene.analysis:evidence`
- 约束：先全貌再变焦再高亮；原图坐标与哈希
- 区域：content；声音：paper；显式互斥：document-legacy, color-wipe, iris

### relations-legacy · 旧三角关系 [deprecated]

- 匹配：仅迁移旧项目
- 使用：`Scene.editorial:relations`
- 约束：缺边语义，禁止新生产使用
- 区域：content；声音：none；显式互斥：relations

### relations · 图片关系步骤 [implemented]

- 匹配：有明确方向的关系链
- 使用：`Scene.analysis:relations`
- 约束：每边标签；独立并列不能串因果
- 区域：content；声音：tick；显式互斥：relations-legacy

### impact-legacy · 装饰流向脉冲 [deprecated]

- 匹配：仅历史示例
- 使用：`Scene.layout:impact`
- 约束：无语义端点，禁止新生产使用
- 区域：content；声音：none；显式互斥：按区域/焦点通则

### brand · 固定/通用品牌 [implemented]

- 匹配：钩子后或片尾身份
- 使用：`Scene.kind/brandProfile`
- 约束：SwainTalk不变形；VO两侧真实静音0.4s
- 区域：content；声音：none；显式互斥：按区域/焦点通则

### captions · 短语字幕 [implemented]

- 匹配：旁白同步
- 使用：`Scene.captions`
- 约束：绝对帧；禁止长段遮挡
- 区域：caption；声音：none；显式互斥：按区域/焦点通则

### progress · 顶部进度线 [implemented]

- 匹配：阅读进度
- 使用：`NewspaperShort`
- 约束：不当作叙事节点
- 区域：background；声音：none；显式互斥：按区域/焦点通则

### cut · 场景硬切 [implemented]

- 匹配：语义场景结束
- 使用：`scenes.start/end`
- 约束：避免切断阅读及SFX尾音
- 区域：transition；声音：none；显式互斥：color-wipe, iris

### split · 红蓝双区关系 [recipe]

- 匹配：两方立场/互补职能/不等关系
- 使用：`left,right,relation,atLeft,atRight,atRelation`
- 约束：先两边后关系符号；VS/+/<必须与语义一致；不是默认敌我编码
- 区域：content；声音：paper；显式互斥：按区域/焦点通则

### stage-curve · 分阶段教学曲线 [recipe]

- 匹配：解释阶段模型
- 使用：`segments[{label,points,at,color}],schematic:true`
- 约束：明确示意；各段保留已画轨迹；禁止伪装真实行情
- 区域：content；声音：none；显式互斥：按区域/焦点通则

### checklist · 检查板逐项勾选 [recipe]

- 匹配：有定义且可验证的条件组
- 使用：`items[{label,explanation,pass,at}],denominator`
- 约束：先解释后勾选再更新计数；未知不是通过；超过4个解释卡分屏
- 区域：content；声音：tick；显式互斥：按区域/焦点通则

### market-line · 行情线与基准 [recipe]

- 匹配：实际时序数据及比较基准
- 使用：`points[{time,value}],domain,source,baseline,callouts`
- 约束：按真实时间横轴；同轴；终点/基准/差值按VO分步；不得用手绘近似真实数据
- 区域：content；声音：tick；显式互斥：按区域/焦点通则

### chapter-tint · 章节纸面色层 [recipe]

- 匹配：章节情绪改变
- 使用：`color,opacity,at,duration`
- 约束：保持纸纹和文字对比；原件区不染色；颜色不替代事实
- 区域：background；声音：none；显式互斥：按区域/焦点通则

### color-wipe · 整屏色块遮挡转场 [recipe]

- 匹配：论点或章节明确切换
- 使用：`color,direction,start,covered,end`
- 约束：完全遮住旧内容后换场；同区一次一种转场；禁与证据变焦并发
- 区域：transition；声音：whoosh；显式互斥：evidence, cut, iris

### iris · 圆形收放遮挡 [recipe]

- 匹配：解释层次深入
- 使用：`center,start,covered,end`
- 约束：字幕区保留；旧新内容仅在覆盖时换；禁止连续滥用
- 区域：transition；声音：whoosh；显式互斥：evidence, cut, color-wipe

### calendar-flip · 日历翻页计数 [recipe]

- 匹配：月份/天数流逝
- 使用：`from,to,unit,start,end`
- 约束：翻页中间数字非实测状态；终值可读；不每页打响
- 区域：content；声音：paper；显式互斥：metric

### film-frame · 胶片容器 [recipe]

- 匹配：历史事件/视频引用
- 使用：`media,label,source,in,out`
- 约束：黑白孔边为装饰；不暗示档案真伪；孔边不持续闪烁
- 区域：content；声音：paper；显式互斥：按区域/焦点通则

### keyword · 关键词纸片组 [recipe]

- 匹配：论点重音/结论
- 使用：`words[{text,color,at,rotation}],subject`
- 约束：按短语出现；不逐字弹跳；不能复制全部字幕
- 区域：annotation；声音：paper；显式互斥：按区域/焦点通则

### threshold · 阈值进度条 [recipe]

- 匹配：票数/配额距门槛
- 使用：`value,total,threshold,unit,at,source`
- 约束：阈值先交代；数值条长同轴；未达到不显示成功
- 区域：content；声音：tick；显式互斥：data

### icon-metaphor · 图标隐喻 [recipe]

- 匹配：抽象影响的辅助说明
- 使用：`icon,meaning,caption,at`
- 约束：不得冒充数据/真实证据；避开额外无意义箭头
- 区域：content；声音：paper；显式互斥：按区域/焦点通则

### date-tiles · 日期字块 [recipe]

- 匹配：日期成为论述重音
- 使用：`date,format,at`
- 约束：明确月日顺序/年份；不滚成随机数
- 区域：annotation；声音：tick；显式互斥：按区域/焦点通则


## 可复用声音资产

assets/sfx/paper.wav、tick.wav、whoosh.wav为本次原创程序合成短音，CC0，未采样原片音轨。复制至项目public/sfx后使用原sfx接口；paper在接触/落稳，tick在勾选/终值，whoosh在运动速度峰值。它们是设计候选，真实听音和混音仍需逐项目完成，不能宣称匹配参考原声。

示例：references/motion-plan.example.json 是独立动作计划，不是timeline输入。现有工程升级时须按最终时间线补全events；不能用该测试示例冒充整片记录。recipe_implementations按效果ID填写{file,sha256,frames:[起/中/终图片路径],review:实际检查说明}。该记录是可追溯要求，仍不自动认证像素与用户验收。
