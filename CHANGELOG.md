# 更新日志

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/) 与
[Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 格式。

> 说明：本文件自 1.0.4 起建立。1.0.0–1.0.3 的历史条目未随浅克隆保留，
> 如需完整历史请从仓库全量 clone 回填。

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
