# 更新日志

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/) 与
[Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 格式。

> 说明：本文件自 1.0.4 起建立。1.0.0–1.0.3 的历史条目未随浅克隆保留，
> 如需完整历史请从仓库全量 clone 回填。

## [1.1.1] - 2026-10-17

### 修复
- **peer 声明匹配不到新版 DSH 宿主**：`@deepseek-ai/dsh-skill` 与 `@deepseek-ai/dsh-tools`
  原写作 `>=0.0.1-rc.1 <0.3.0-0`。按 semver 规则，预发布版本只能被「同一个
  major.minor.patch 元组、且自身带预发布标签」的比较符匹配，因此该范围匹配不到
  `0.2.0-rc.2`、`0.2.1-rc.2` 这类宿主版本——插件实际运行正常，但 pnpm 与市场会把它判
  为与当前宿主不兼容。改为按预发布线逐条列出的形式，现同时覆盖 0.1.0 / 0.1.1 / 0.2.0 /
  0.2.1 四条预发布线及其正式版（`0.3.0-0` 上界不变）。

## [1.1.0] - 2026-10-14

### 新增
- `tests/dom-smoke.mjs` 断言函数支持返回字符串（失败并附实际值），新增
  `expect(实际, 期望)` 辅助；13 处数值断言改用，失败时直接看到实际值 vs 期望值
- 交付前清单一式两源同步测试（`review.js` ↔ `references/quick-reference.md`），
  章节数与各章节条目数不一致即失败
- `examples/README.md`：单文件示例的共享脚手架清单与同步修改约定

### 修复
- **金融看板环形图中心文字溢出**：SVG 内 `font-size` 是 viewBox 用户单位
  （42 单位 → 150px），原按屏幕像素写的 15px/9px 实际渲染为 54px/32px，
  中心文字（149px 宽）整体压在 92px 内孔上并触到裁剪边界。按内孔直径
  反推改为 5/3 单位（≈18px/11px），文字完整落入孔内
- **金融看板环形图整环旋转 90°**：4 个弧段同时带 `transform="rotate(-90)"`
  与 `stroke-dashoffset:25`（双重起点补偿），最大弧段从 9 点钟起始。
  经最小化诊断 SVG 验证后删除 transform，起点恢复 12 点钟
- **行程工作台城际交通分隔渲染出原始 SVG 代码文本**：`el()` 用 `textContent`
  却收到 HTML 字符串，改为 `innerHTML`
- **「切换下一天」三栏不同步**：day 模式下原 handler 只刷新左栏与地图，
  中栏时间轴不更新，补 `renderCanvas()`
- **热力图数据不随时间范围切换**：原为静态单表，7/30/90 天只改文案；
  三组数据移入 `DATASETS` 按范围取数
- **热力图中等色深区对比度不足**：45%–90% 色深无论白字深字都不足 4.5:1，
  色阶改两端制（浅底 8%–42% 配深字 / 浓底 95%–100% 配白字），图例同步
- **`SKILL_DESCRIPTION` 能力数字过期**：67/161/57 → 与数据库一致的 84/192/74
- **`check-example.mjs` 死断言**：`|| true` 永真使「无游离 hex」检查失效；
  删除并新增令牌块/注释之外的 hex/rgba 检查（例外须 `token-exempt` 标记）
- **中文查询扩展重复关键词**：「毛玻璃」曾展开出
  `glassmorphism glass glassmorphism glass`，`expandQuery` 改 Set 去重
- **清单两份漂移**：`references/quick-reference.md` §3/§7 各少 1 条，
  按 `review.js`（工具实际输出）补齐
- README 安装命令版本号 1.0.3 → 1.0.4（中英各三处）

### 变更
- 金融看板涨跌配色改用中国证券惯例：新增 `--color-gain`（涨·红）/
  `--color-loss`（跌·绿）语义令牌，仅用于涨跌；状态徽章保持交通灯语义
- 主 CTA 与徽章文字对比度提升至 WCAG AA：fintech `#D97706 → #B45309`
  （3.19 → 4.98:1）、trip `#EA580C → #C2410C`（3.56 → 5.19:1）、
  `.pill.bad` 表面 14% → 10%（≈4.12 → ≈6.1:1）
- 行程工作台改分区渲染：`renderAll()` 全量重建 8 区域 → 按需渲染；
  新增焦点/滚动保持（键盘连续操作不失焦、长列表不跳顶）
- 粘性表头修复：`overflow-x:auto` 使 sticky 成为死特性，≥1024px 撤销
  滚动容器 + `top:calc(顶栏+1px)` 避开顶栏遮挡
- 小控件触摸目标热区扩至 ≥44px（仅纵向 `::after` 扩展，视觉密度不变）
- 移动端主导航从直接隐藏改为第二行横向可滚动 + 热区 44px
- 分段控件（时间范围/工作模式）改 `radiogroup`/`radio` 单选语义 +
  漫游 tabindex + 方向键选择；主题切换按钮补 `aria-pressed`
- 行程工作台标签页键盘导航补 Home/End 跳首尾
- head 内联主题脚本消除首屏主题闪烁；Google Fonts 改异步加载
- 补 skip link（WCAG 2.4.1）与 `<noscript>` 降级提示
- `detectDomain` 正则预编译（约 400 次编译/查询 → 模块加载时一次）
- 趋势图 `mousemove` 矩形缓存（resize 失效）；热力图色阶新增
  `color-mix` 特性检测与 rgba 回退（老浏览器）
- 检索结果截断 240 → 400 字符并显式标注「已截断」
- 「预览选中主题」按钮改名「校验选中主题」（名实相符）
- 天数项城市/日期改两行结构；删除死代码与冗余绑定；平滑滚动尊重
  `prefers-reduced-motion`；统一两示例 localStorage 主题键
- 两个示例的 CSS 头部与 README 标注与 `design_recommend` 真实输出的差异

### 移除
- `data/meta.json` 的 `builtFrom` 字段（泄漏作者本机构建路径）

## [1.0.4]

### 新增
- 三个模型工具：`design_recommend` / `design_review` / `design_search`
- 内置数据库：84 种风格、192 个调色板、74 组字体搭配、99 条 UX 规范、
  25 种图表类型、22 个技术栈，完全离线
- 设计旋钮（variance/motion/density，1-10）
- 两个单文件示例：金融数据看板、行程编排工作台
- 四层离线测试：清单/数据完整性、插件自检、示例规范、真实 DOM 交互

> 1.0.0–1.0.3 的详细条目请从全量 clone 回填。
