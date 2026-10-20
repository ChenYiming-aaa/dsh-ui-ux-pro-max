# 更新日志

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/) 与
[Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 格式。

> 说明：本文件自 1.0.4 起建立。1.0.0–1.0.3 的历史条目未随浅克隆保留，
> 如需完整历史请从仓库全量 clone 回填。

## [Unreleased]

### 进站过场

- 站根 `index.html` 不再显示「正在进入风格图鉴…」这行过场文字：改为只画一张与过场首帧
  完全一致的纸面（同底色、同位置的四条发丝竖线），整页是可点区域，`meta refresh` 跳转后
  由入口页的开场动画接手，中间那段「过场」本身就是动画的第一幕。
- 新增 `tools/intro.mjs`：两个入口页（`gallery/index.html`、`handbook/index.html`）共用一段
  约 1.4 秒的开场（移动端 ×0.8 约 1.15 秒）——四格标记从四角合拢 → 站名逐字从遮罩后升起 →
  橙色细线自左拉出 → 数据行擦除显现 → 上下纸幕分开、首屏内容上浮就位。
- 纯 CSS 实现：只动 `transform` / `opacity` / `clip-path`，没有引入 GSAP / barba / swup
  （分别为 ~70KB 运行时与 SPA 路由改写，与「纯静态、零外部请求」冲突）。样式与跳过判定
  内联在入口页 head 里，约 3KB，无额外请求。
- 同一会话只播一次（`sessionStorage`），`prefers-reduced-motion: reduce` 下直接跳过；
  跳过的判定写在 head 的内联脚本里，避免先闪一下再消失。禁 JS 时动画依旧靠 CSS 播完。
- 配色与字体沿用站点既有令牌（纸色 `#f6f5f1`、墨色 `#14161a`、强调橙 `#e4501e`、等宽眉标），
  开场的四格标记就是页头 logo 的放大版，拉开后与页头对齐。
- `tests/check-showcase.mjs`、`tests/check-atlas.mjs` 各加一组断言：过场只出现在入口页、
  含会话跳过与减弱动效处理、根入口不再有文字。

## [1.4.1] - 2026-10-19

### 文档与示例

- README 重构（中英同步）：把两个在线站点提到开头显著位置，并配 4 张截图
  （`docs/images/`）——图鉴首页、风格详情页（液态玻璃）、手册首页、配方生成器；
  删除原有的 examples 章节与链接。
- 删除 `examples/`（`fintech-dashboard.html` / `trip-planner-workbench.html` 与说明文件）
  及 `tests/check-example.mjs`：两个站点取代它们作为「设计系统如何落地」的示例。
- `tests/dom-smoke.mjs` 改为验证真实站点——图鉴首页的类别筛选、搜索（含 Esc 清空）、排序，
  以及详情页的配色板与明暗预览切换；CI 的 DOM 步骤保持不变。
- 重写全部示例措辞（README 中英、`SKILL.md`、`references/quick-reference.md` 与三个工具的
  参数说明）：改成真实场景会出现的说法，如「财务 数据看板 深色 高密度」「移动端登录页，
  提交后没有任何反馈」，并按「新项目 / 改版评审 / 只缺一块」三种处境组织章节标题。
  每条新示例都在检索层验证过命中；`gsap` / `react` / `web` / `google-fonts` 因语料是英文，
  示例保留术语（`scroll reveal`、`memo`、`safe area 安全区`），纯中文查询会 0 命中。
- 精简重复表述：`platform` 语义的三段说明合并为一条，删除与开头重复的「不要用单字查询」，
  `references/quick-reference.md` 的「色彩专项」更名为「按症状查」（原列表并不只讲颜色）。
- 两站首页最后一轮精简：删除「按类别浏览」的说明段与跨站横幅的长句；手册把
  「数据一致性」三段小字压成一行事实条（`.factbar`）、六个域与两条路径各留一句。
  同时放大视觉焦点：hero 标题与统计数字（图鉴 30→44px、手册 21→30px）、
  跨站横幅主句提到 18px，小字标签只保留 eyebrow / dt 两类。
- 关系称呼统一为「另一视图」（the other view）：两站是同一份 4319 行知识库的两种浏览方式，
  不再称「姊妹站」；`tools/site-names.mjs` 把手册站名统一为「设计手册」，并新增
  `OTHER_VIEW` 常量供两站互相引用，README 中英同步。

### 风格图鉴（静态站点）

- 新增 `gallery/`：把 88 种设计风格渲染成可浏览的纯静态站点，可直接部署到 GitHub Pages。
  首页支持类别筛选、关键词搜索与编号/名称/复杂度/状态排序；每种风格有独立详情页，
  含中文导读、效果示例（浅色/深色可切换）、配色板、能力矩阵、适用与规避场景、
  落地清单、AI 提示词与相关风格导航。
- 预览由同一副组件骨架渲染，只替换设计令牌与 59 个材质特效类
  （毛玻璃、新拟态、扫描线、像素化、纸质噪点等），因此差异全部来自风格本身。
- 新增生成器 `tools/showcase/build.mjs` 与人工策划的元数据
  `tools/showcase/theme-data.mjs`（中文名 / 场景 / 导读 / 主题令牌）；
  `npm run build:gallery` 重新生成，`npm run serve:gallery` 本地预览。
- 新增 `tests/check-showcase.mjs`：校验元数据覆盖、特效类实现、88 个页面完整性、
  纯静态（无外部资源）与响应式断点，已接入 `npm test`。
- 新增 `.github/workflows/pages.yml`：推送 `main` 后重建并发布到 GitHub Pages。

### 设计手册（独立静态站点）

- 新增 `handbook/`：在图鉴之外补一套「怎么定」的手册，共 10 页——配色库（192 套）、
  字体配对（74 组）、图表选型（25 类）、落地页模式（34 种）、规范对照（195 条）、
  产品配方（192 类）、配方生成器、总览、方法与溯源、404。
- **独立成站**：产物在仓库根的 `handbook/`，与 `site/` 无构建先后关系，也不读写 `site/`；
  页面之间只用 `./` 相对路径，没有 `../`、没有以 `/` 开头的绝对路径，可部署到任意子路径。
  只依赖 `tools/atlas/`、`data/`、`assets/atlas-fonts/` 三处，缺 `site/` 也能构建。
  部署时两站合并进同一个 Pages artifact：`/` 是图鉴，`/handbook/` 是手册。
- **配色**直接渲染成真实界面小样（按钮 / 输入框 / 卡片 / 标签 / 焦点环），
  不是色块堆叠；每套附 16 个语义令牌、7 组 WCAG 对比度与 CSS / Tailwind / JSON 导出。
- **字体**把 74 组配对涉及的 91 个字族的 latin 子集下载进仓库（约 2.9 MB，106 个 woff2），
  用本地 `@font-face` 引用，因此样张是真实排印；中文说明文字仍走系统字体栈。
  新增 `tools/atlas/fetch-fonts.mjs` 与 `npm run fonts` 负责拉取与重建清单。
- **配方**把三张表（product / color / reasoning）按产品类型同名同序对齐，一次给出主推与次选风格、
  16 个配色令牌、字体配对、落地页结构、决策规则与反模式；764 处风格引用全部解析到图鉴详情页
  （以绝对 URL 出站，构建时可用 `SHOWCASE_BASE` 覆盖）。
- **配方生成器**：选一个产品类型即可生成整份配方，支持导出 CSS 变量 / Tailwind 配置 / JSON，
  并可用 `#<key>` 直接深链到某个产品。
- **图标与图表**：25 类图表各配一张手绘 SVG 示意与一句中文摘要；34 种落地页把
  `Section Order` 解析成线框并标出 CTA 位置。
- 新增 `tools/atlas/`（`data.mjs` 数据派生、`pages.mjs` 模板、`layout.mjs` 外壳、
  `color.mjs` 颜色工具、`mood-map.mjs` 情绪→字体标签映射、`svg.mjs` 图表示意）。
- 新增 `tools/serve.mjs`：一个静态服务器同时提供两站（`/` 与 `/handbook/`），
  也支持 `--root=handbook` 把手册挂在根路径模拟独立部署；补齐 `woff2` / `woff` / `webp` 的 MIME。
  取代原 `tools/showcase/serve.mjs`。
- 新增 `tests/check-atlas.mjs`：校验产物结构、16 令牌完整性、字体文件与 `@font-face` 对应、
  **独立站自洽（无 `../`、站内相对链接全部可达、无根绝对路径）**、纯静态与无障碍标记，
  并在 jsdom 可用时验证筛选、展开与生成器导出。
- **双站互链（解决「找不到入口」）**：图鉴全站导航新增常驻高亮的「设计手册 →」（详情页自动修正为
  `../handbook/`），首页 hero 下方新增深色横幅；手册全站顶部「风格图鉴 ↗」改为高对比按钮，
  首页新增对称横幅。此前两站互不引用，手册作为子系统却没有入口。
- 入口在移动端不再隐藏：图鉴 620px 以下显示「手册 →」并隐藏分类 / GitHub；手册保留「图鉴 ↗」，
  同时收起 nav 里的「落地页 / 规范」（首页六宫格仍可达）。
- `tests/check-showcase.mjs` 新增「另一视图入口」断言（首页横幅、导航项、88 个详情页的 `../handbook/` 深度）；
  `tests/check-atlas.mjs` 的 6b 改为「唯一的出站方向是图鉴」——允许 `../index.html` 与 `../style/<id>.html`，
  其余仍是 `./`，并断言 10 页都能一键回到图鉴。
- `SHOWCASE_BASE` 语义调整：默认空 → 出站链接用同域相对路径（本地预览与部署都对），
  设了值才走绝对 URL（异域部署用）。
- `package.json` 脚本改为 `build` / `build:site` / `build:handbook` / `serve` / `serve:site` /
  `serve:handbook` / `fonts`；`pages.yml` 两站并行构建后合并 artifact，
  触发路径补上 `handbook/**`、`tools/atlas/**` 与 `assets/atlas-fonts/**`。

### 配方生成器中文化

- 新增 `tools/atlas/zh.mjs`：192 条产品类型中文名（全量人工翻译）、88 条推荐模式分段词表、
  34 条落地页模式名、36 个决策规则键名、4 种规则值类型（风格 / 结构 / 做法 / 模式）。
- **生成器**：左列改为「中文名 + 英文原名」双行，页面标题同样双语；推荐模式、落地页名、
  仪表盘类型、决策规则（`if_ux_focused` → 「体验导向」，`style:liquid-glass` → 「风格 · 毛玻璃」可点开）
  全部中文化；置信度转百分比；导出内容加中文注释。
- **搜索**：改为读 `data-q`（中文名 + 英文原名 + 主推风格中文名），中英文关键词都能命中。
- **风格名**：`resolveStyles()` 补 `zh` 字段，复用图鉴的 `STYLE_META`，两边中文名不会漂。
- **落地页模式名**复用推荐模式词表，34 条全部有中文；`landing.html` 卡片与侧栏索引同步。
- **配方页**（`recipes.html`）同步：标题、主推/次选风格、推荐模式、落地页、筛选 chip 全部中文化，
  `data-search` 加中文，搜中文也能筛。
- **保留英文的部分**：配色方向、色彩情绪、字体情绪、反模式、关键考量等自由长句（上游 900+ 条
  唯一值，逐条翻译不可控）保持原文，页面上用「原文」徽标标注，并在生成器底部说明。
- **修复**：`.cz-pick` 里 `.search` 继承了 toolbar 的 `flex:1 1 260px`，在纵向容器里被撑成 260px 高，
  移动端列表上方出现大片空白 —— 改为 `flex:0 0 auto`。
- `tests/check-atlas.mjs` 增补中文化断言（192 条中文名 / 推荐模式 / 风格名 / 36 个规则键名 /
  列表中文主行 / 中文检索串）与 jsdom 中文搜索用例。

### 目录布局修正（修复「点设计手册 404」）

- 图鉴产物由 `site/` 改为 **`gallery/`**，与 `handbook/` 同级；站点根 `index.html` 跳转到 `/gallery/`。
  原因是此前源码布局（`site/` + `handbook/` 同级）与部署布局（图鉴在根、手册在 `/handbook/`）
  不一致：本地直接双击 `site/index.html` 时，`handbook/` 会被解析成 `site/handbook/`（不存在），
  点进去就是 404。
- 现在 `../gallery/` 与 `../handbook/` 在**本地 file://、本地 HTTP、线上部署**三种场景下解析结果完全一致。
- 互链前缀随之调整：图鉴根页 `../handbook/`、详情页 `../../handbook/`；手册统一 `../gallery/…`。
- 首页横幅的 `href="handbook/"` 是硬编码，未跟随 `base` 前缀，导致根页出现指向 `gallery/handbook/` 的坏链 —— 已修，并在
  `tests/check-showcase.mjs` 加了反向断言（禁止出现 `href="handbook/"`）。
- `package.json` 脚本改名：`build:gallery` / `serve:gallery`（原 `build:site` / `serve:site`）。
- `tools/serve.mjs` 改为挂载 `/gallery` 与 `/handbook`，根路径 302 到 `/gallery/`。
- `pages.yml` 组装 `dist/gallery/` + `dist/handbook/` + 根跳转页。

## [1.4.0] - 2026-10-18

> 主题：检索质量、健壮性与原生 DSH 契约对齐。**有对外行为变化**（检索排序、审查结果集、
> UX 要点条数、技能正文、非法 stack 的错误语义），但工具入参、返回结构、schema 均未变，
> 无需改动调用方。

### 检索质量

- **修复多属性查询稀释主属性**：别名扩展词此前按"词典条目"去重（`dark mode` / `dark` /
  `dark-mode` 是三个不同字符串），拼进查询串后被分词成同一个 `dark` 重复计分。
  现在在 token 层去重，并区分权重：原查询 token 1.0、扩展词 0.6（`lib/config.js` 的 `RETRIEVAL`）。
  BM25 新增 `scoreTerms()` 支持带权 token 表。
- **中文单字查询可检索**：整条查询是单个汉字时启用 `lib/i18n/short.zh.js` 的兜底别名
  （`图`→chart、`色`→color、`字`→字体搭配、`动`→动效规范），此前 `search("图")` 返回 0 条且被误判为 `style` 域。
  一字多义的字（`表`/`页`）**故意不收录**，宁可空结果也不猜错领域。
- **分词保留单个汉字**：`tokenize` 的长度过滤此前把专门为单字 CJK 写的分支变成了死代码；
  现在只对拉丁词要求长度 ≥ 2。
- **单字查询的领域兜底**：已登记的单字在该领域零命中时，返回领域默认条目而非空数组
  （`fallback: true`），避免模型把"查不到"理解成"库里没有这个领域"。
- **`design_recommend` 的 UX 要点更稳**：改为三级召回（原话 → 已识别产品类别 → 通用类别+严重度兜底），
  保证不少于 3 条。此前同类查询可能只回 0–2 条，措辞一变就消失。

### 审查行为

- **`design_review` 的 `platform` 真正参与排序**：此前只拼进查询串，`web` 与 `flutter` 结果几乎相同。
  现在按平台归一化做软过滤（匹配优先、不匹配 ×0.5 降权仍保留），
  `react-native` / `flutter` 追加该技术栈的框架规范，`desktop` 按 `web` 口径处理。
- **废弃条目策略统一**：`style` 域此前恒排除 `deprecated`，与技术栈域不对称。
  现在两域同一套判定——默认排除，查询显式包含 `legacy` / `deprecated` 时保留。

### 健壮性

- `getStats()` 加异常保护：`data/meta.json` 不可读时返回 `null`，工具描述降级为不含数字的措辞，
  不再让插件在**模块加载期**崩溃。
- `localizeRow` 的未登记列兜底此前产出 `Foo (Foo)`（模板两处都是键名），改为保留英文原键。
- 移除 `buildTools()` 的模块级 `_tools` 缓存：多次 `apply()` 不再共享同一批 definition 对象。

### 原生 DSH 契约对齐（S1–S10）

- **技能正文**：`SkillDefinition.content` 现在返回去掉 YAML frontmatter 的正文
  （`lib/plugin/skill-body.js`）；候选补 `whenToUse` / `path` / `metadata`，
  `list/get` 尊重 `options.signal` 与 `candidate.locator`。模型不再在
  `<skill_content>` 里看到 `--- name: ...`。
- **工具并发**：三个只读工具声明 `isConcurrencySafe: () => true`，原生调度器
  可并行派发；不写父级状态，缓存幂等。
- **错误语义**：`design_search` 对未知 stack 改为抛错，由宿主归一为 `isError`，
  不再返回“成功值 + error 字段”。
- **呈现**：`design_search` / `design_review` 补 `presentationMeta` + `presentResult`；
  卡片可重放，且错误态不产出卡片。
- **配置面**：新增 `lib/plugin/config.js`（Standard Schema）与
  `maxResults` / `reviewRules` / `skill` 三个字段；`cordis.patch.yml` 给出默认值示例。
  未显式传参时使用配置默认值，显式传参优先。
- **超时语义**：`TIMEOUTS` 明确为 advisory metadata；注册表不强制执行，
  需要截止时间时由宿主挂载 `@deepseek-ai/dsh-tool-call-timeout-policy`。
- **技能正文内容**：补 `product` 域、单字表、`platform` 的“严重度优先/降权保留”口径、
  `score` / `fallback` / 空结果的解读与常见误用。
- **单字兜底可见**：`formatSearchResult` 在 `fallback: true` 时显式标注“领域默认条目”，
  避免 0.00 分兜底被当成精确命中。

### 低风险补充（1.4.0）

- `design_search` 新增可选 `includeDeprecated`（默认 `false`）：只放行
  `Status=deprecated` 的行，不改变查询词与排序；仅作用于该工具，
  `design_recommend` 仍不会推荐废弃风格。
- `design_search` / `design_review` 的 `presentResult` 改为紧凑摘要（命中数 + 最多 3 条），
  完整 Markdown 仍在 `render` / 结构化结果中，避免通用卡片过长。
- `VERIFIED_HOST` 从 `0.2.0-rc.2` 抬到已实测的 `0.2.1-rc.2`；peer 区间不变。

### 测试与工程

- 新增 `tests/check-columns.mjs`：断言 11 个领域 + 22 个技术栈的 `searchCols` / `outputCols`
  ⊆ 实际列、中文标签全覆盖、无"存在但全空"的列。并入 `npm test`。
- 新增 `tests/check-config.mjs`：配置默认值/范围/Standard Schema/工具默认值注入。
- 新增 `tests/check-skill.mjs`：SKILL.md 覆盖 12 个领域、已登记单字、platform 枚举、
  `fallback`/`legacy` 等关键口径，且正文不含 frontmatter。
- 新增 `tests/host/`（`verify-host.mjs` + 解析钩子）与 `npm run verify:host`：
  **可移植**的真实宿主验证，用 `DSH_MODULE_ROOT` 指向任意宿主导入根，不再依赖本机 DSH 安装路径。
- CI 新增 `host-compat` 矩阵，对 `0.1.1-rc.1` / `0.2.0-rc.2` / `0.2.1-rc.2` 三条 peer 线实跑兼容验证。
- `check-package` 的 peer 守卫改为显式白名单（含 `@deepseek-ai/cordis`）。
  cordis 是独立发版的 DI 框架（实测 4.x），peer 保持 `*` 是正确的；
  新增 `VERIFIED_CORDIS_MAJOR` 守卫"若改成区间必须覆盖 4.x"。

### 文档

- `docs/DSH-COMPAT.md`：兼容矩阵补三态标签（CI 自动验证 / 人工验证 / 仅声明覆盖），
  并记录本轮三条宿主线的实跑结果；补"先 `defineTool` 再校验 schema"的顺序陷阱。
- `README.md` / `examples/README.md` / `docs/ARCHITECTURE.md`：说明 worktree、
  `node_modules` 软链接与干净 clone 的差异，明确以 CI 为准。
- `docs/remediation-plan.md`：本轮的缺陷分析与方案文档（含一处被实测推翻的假设，见文件内批注）。

## [1.3.0] - 2026-10-18

### 数据更新

- **快照更新到上游 `56ea9cf`（2026-10-15）**，直接读取 `cli/assets/data/` CSV：
  - 风格 **84 → 88**、UX 规范 **99 → 119**、推理规则 **161 → 192**
  - 动效 **16 → 17**、移动端接口 **30 → 32**、Google 字体 **1923 → 1934**
  - 技术栈规范合计 **1221 → 1271**，数据总行数 **4200 → 4319**
- 生成数据时使用了支持引号、`""` 转义和字段内换行的 CSV 解析器，
  修复了 1.2.0 快照中 186 个单元格丢失内部双引号的转码瑕疵。
- 数据是发布包内的静态文件；插件的工具调用路径**不联网**，也不包含运行时/定时同步功能。

### 检索行为

- `style` / `stacks` 默认排除 `Status=deprecated` 条目；查询显式包含
  `legacy` / `deprecated` 时保留（与上游一致）。
- 检索列/输出列同步上游新增字段：`Style ID` / `Aliases` / `Status` /
  `Preferred Mode` / `Accessibility Risk` / `Pattern ID` / `Semantic Role` /
  `Allowed Contexts` / stack `Applies To` / `Status` / `Verified At`。
- 中文标签补齐上述新字段。

### 文档

- `docs/DATA-PROVENANCE.md` 记录数据来源、当前计数与统计口径。
- README（中英）、SKILL.md、package.json、THIRD_PARTY_NOTICES 能力数字与溯源同步。

### 说明

- 本次只同步数据与检索列，不改变三个工具的名称/参数/输出结构/SKILL.md 语义。
- 版本号 1.3.0；未推送远程、未发布 npm。

## [1.2.0] - 2026-10-18

### 变更（架构，对外行为等价）

- **运行时代码分层**：`lib/` 从 6 个平铺文件重组为
  `plugin/`（宿主适配）→ `tools/`（一工具一文件）→ `presentation/`、`domain/` →
  `search/`、`repo/` → `i18n/` → `config.js`。三层出口、单向依赖、无环。
- **入口瘦身**：`index.js` 从 316 行降为 10 行薄入口，只重导出 `plugin/`；
  `buildTools()` 仍从根导出，工具名/参数/`output.schema`/返回结构/SKILL.md 语义不变。
- **配置单一源**：`lib/config.js` 收拢 timeout、检索条数、渲染预算与 `VERIFIED_HOST`。
- **能力数字派生**：`SKILL_DESCRIPTION` 与 `design_review` 描述从 `data/meta.json` 派生，
  README/SKILL.md 的数字由 `tests/check-counts.mjs` 守卫。
- **SchemaSpec 方言固化**：`lib/plugin/schema.js` + `tests/check-schema.mjs`，
  覆盖属性级 required、items 内禁 required、禁 type 数组、禁数值边界。

### 新增

- `tests/_harness.mjs`：4 个测试文件共用的 assert / section / expect / 汇总。
- `tests/check-imports.mjs`：分层铁律、无循环依赖、`data/` 路径唯一性、宿主 API 边界。
- `tests/check-counts.mjs`：文档/description 能力数字 == `data/meta.json`。
- `tests/contract.mjs`：schema ↔ `execute` 返回值一致性（零宿主依赖）。
- `tests/check-schema.mjs`：SchemaSpec 方言 + 负例。
- `npm test` 一键入口；CI 改为 `npm test` + 独立 jsdom DOM 验证。
- `docs/ARCHITECTURE.md`（分层与新增代码位置）、`docs/DSH-COMPAT.md`
  （兼容矩阵 + 降级契约）。
- 完成态卡片：`design_recommend` 通过 `output.presentationMeta` +
  `presentResult` 输出风格/主色/字体/令牌摘要，不再只有 generic 标题。
- 渲染预算：设计系统 Markdown 12000 字符上限（超出显式截断），检索字段 400 字符。
- 安装脚本：按 `package.json` 的 `files[]` 白名单复制；自动探测 desktop/web profile；
  支持 `-ProfileName` / `-ProfileDir`；缺少 `lib/` 时给出可操作提示。

### 修复

- **上游溯源自相矛盾（N1）**：`THIRD_PARTY_NOTICES.md` 与 `data/index.json`
  统一记录「原始上游 nextlevelbuilder/… + 转取路径 opencode/skills/…」。
- **快照不可追溯（N2）**：`data/index.json` / `data/meta.json` 新增
  `upstream` / `upstreamRef` / `upstreamRefKind` / `upstreamRefDate` /
  `upstreamDataPath` / `sourcePath` / `syncedAt` / `lineageVerifiedAt`；
  `check-package` 断言非空、40 位 commit、两份一致。
- **上游 ref 修正**：逐行比对后确认快照对应
  `nextlevelbuilder/ui-ux-pro-max-skill@137597b`（2026-07-03），而非最初按
  `generated` 时间戳推测的 `8a1a6d8`（该提交已是 88/119/192，与本快照 84/99/161 不符）。
- **血缘校验结果**：11 个领域表 + 161 条 reasoning + 22 个 stack 表 + 1,923 条
  Google Fonts 行数与列名全部相等；仅 186 个单元格的内部双引号在 CSV 转码时被剥离
  （`icons` 100 / `shadcn` 38 / `nuxt-ui` 25 / `javafx` 15 / `nuxtjs` 5 /
  `web` 1 / `wpf` 1 / `uno` 1）。
  本版本只修正溯源，不改数据内容；该转码瑕疵留待下次上游同步修复。
- **SKILL_DESCRIPTION 数字漂移**：改为从 `meta.json` 派生。
- **timeout 拍脑袋**：实测冷启动 ≈30ms 后改为 5000 / 3000 / 3000ms（保留 >100× 余量）。
- **`apply()` 降级可观测**：skills 服务未就绪时通过 `ctx.logger?.debug?.()` 记录原因，
  同时保留 `inject` 等待服务；三个工具照常注册。
- **`files[]` 与安装物不一致**：安装脚本不再复制整个目录（`.git`/`tests`/`examples` 不进安装物）。

### 文档

- README（中英）目录树、测试说明、兼容性段落同步到新结构。
- 新增 `docs/` 四份贡献者文档；`docs/` 不随包发布（不在 `files[]`）。
- 上游差异看板（2026-10-18）显示 **UX 规范 −20（−16.8%）**、**推理规则 −31（−16.1%）**
  超过 10% 阈值；本版本只做结构与可追溯性，**未同步上游数据内容**，下一轮优先补这两域。

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
