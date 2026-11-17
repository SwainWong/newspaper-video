# 转场动作与声音

1.8色块擦除与圆形收放由顶层transitions调度，不能放进scene.motion来假装切换已发生。

- color-wipe：start时画布外，cut时完整覆盖，end时从另一侧退出。单一实体色块，不淡化换源。默认left由左进入向右退出；right反向。
- iris：以center为圆心，用四角最远距离计算完整覆盖半径。start/end半径为零，cut时覆盖四角。原片中圆形收放的结构抽象，不是逐帧轨迹拟合。
- 透明度固定不透明，color仅#RRGGBB。总时长12–60帧，30fps下0.4–2秒；建议24帧，两侧各12帧。
- cut必须等于下个scene.start；多个转场时间不重叠，前景motion不得跨入遮挡区间。字幕保持在最上层，需要清空时显式调整captions。
- whoosh建议在cut附近的运动强点，sound.at为相对transition.start帧；独立声音尾音可过镜，不能超出片尾。真实声音效果需听审。

验证：纯函数transitionProgress检查起点=0、cut=1、终点=0；测试还拒绝离开真实场景边界、重叠转场及前景并发。最终MP4检查cut−1/cut/cut+1和半程帧，不能以数学通过代替像素检查。
