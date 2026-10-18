# dsh-ui-ux-pro-max 彻底优化方案

> 目标：在**完全保留 DSH 插件形态**的前提下，把"能跑"的代码重组成"能长"的结构。
> 形式：目标目录树 + 分阶段任务清单，每项标注**原因 / 影响范围 / 预期收益**。
> 基线：2026-10-17，`1.1.1`，四个测试套件全部通过（`check-package` / `smoke` / `check-example` / `dom-smoke`）。

---

## 0. 项目假设（与实际不符处已标注 ❓需确认）

### 0.1 已通过读码确认的假设

| # | 假设 | 依据 | 状态 |
|---|------|------|------|
| A1 | 纯 ESM、Node ≥22、零第三方**运行时**依赖 | `package.json`：`type: module`、`engines.node ^22.19\|\|>=24`、无 `dependencies` | ✅ |
| A2 | 运行时 JS 约 **2,150 行**（小项目） | `index.js` 316 + `lib/*` 1,837（bm25 139 / database 258 / design-system 377 / format 243 / review 176 / zh 644） | ✅ |
| A3 | 内置数据 2.4MB，加载惰性且**性能不是瓶颈** | 实测：模块加载 11ms；单次 `design_recommend` 4ms；1923 条 google-fonts 检索 49ms | ✅ |
| A4 | 核心是 **3 个模型工具 + 1 个内置技能** | `buildTools()` 定义 `design_recommend/review/search`；`skillProvider` 注册 `ui-ux-pro-max` | ✅ |
| A5 | 发布渠道为 npm + DSH 市场，存在**硬约束** | 实测约束：无生命周期脚本、`files[]` 白名单、`main: index.js`、`dsh.bundle.patch`、peer 区间须含宿主预发布线 | ✅ |
| A6 | 当前**无循环依赖**，依赖方向单向 | `database ← design-system/review ← format ← index` | ✅ |
| A7 | `examples/` 的双份重复是**有意决策** | `examples/README.md` 明确否决构建链，理由充分 | ✅ |
| A8 | 可移植性优先于工具链 | CI 只跑 `node tests/*.mjs`，jsdom 走独立目录安装 | ✅ |

### 0.2 ❓ 需要你确认的假设

| # | 我的假设 | 若与实际不符的影响 |
|---|---------|-------------------|
| **Q1** | `summarizeDesignSystem()` 与 `formatTokenSummary()` **生产路径无人调用**（仅 `smoke.mjs` 引用），属预留 API | 若你打算接进 UI 面板，则保留并补接线；否则建议删除 + 删测试（约 50 行维护负担） |
| **Q2** | 顶层目录**保持 `lib/` 不改名 `src/`** | 改名需同步 `package.json.files`、`install.ps1`、两个 README、SKILL.md；我判断收益 < 风险，故选择在 `lib/` 内做子分层 |
| **Q3** | examples 维持"单文件自包含"，**只有出现第 3 个示例或共享片段明显膨胀时**才引入生成器 | 若你计划近期加示例，阶段 0 就该先建 `examples/_partials/` |
| **Q4** | 接受新增 `package.json` 的 `scripts.test`（**非**生命周期脚本，市场不禁止），但**不引入任何 devDependencies** | 若你坚持零 scripts，CI 保持现状即可，仅影响本地一键跑 |
| **Q5** | 能力数字（84/192/74/99/25/22）应**从 `data/meta.json` 派生**而非硬编码 | 现状硬编码在 index.js×2、SKILL.md×2、README×5、package.json×1，CHANGELOG 1.1.0 已手工修过一次过期 |
| **Q6** | `lib/review.js` 的 `QUICK_REFERENCE_CHECKLIST` 是**源**，`references/quick-reference.md` 是**镜像** | 现状已有防漂移测试；是否要反过来以 md 为源？ |
| **Q7** | 数据确从 **opencode** 仓库的 skill 目录转出（见 §0.3），但法律声明写的是 nextlevelbuilder | 需你确认血缘，我才能把溯源标注改对 |

> **2026-10-18 更新（Q7 已核实）**：逐行比对 11 个领域表、161 条 reasoning、
> 22 个 stack 表与 1,923 条 Google Fonts，确认数据对应
> `nextlevelbuilder/ui-ux-pro-max-skill@137597b`（2026-07-03）；转码路径为
> `opencode/skills/ui-ux-pro-max/data/`。186 个单元格在转码时丢失内部双引号
> （数据瑕疵，非来源不同）。
> 详见 `docs/UPSTREAM-SYNC.md`。

### 0.3 上游血缘与"俱进"现状（读码 + 数据自述核实）

**血缘确认：是的，延续的是 GitHub 上关注度最高的那个。**

| 项 | 事实 |
|---|---|
| 上游项目 | `nextlevelbuilder/ui-ux-pro-max-skill`（MIT、Python、BM25 + CSV 数据库） |
| 关注度 | 约 **13.5 万 star**，是 ui-ux-pro-max 系列中最高；无同名竞品接近该量级 |
| 数据自述 | `data/index.json`：`format: "ui-ux-pro-max-database"`、`version: 1`、`generated: 2026-08-19T09:37:40Z`、`source: "opencode/skills/ui-ux-pro-max (data/)"` |
| 列名比对 | `style` 表 `Style Category / Type / Keywords / Primary Colors / Effects & Animation / Best For / Light Mode ✓ / Dark Mode ✓ / Implementation Checklist / Design System Variables`；`reasoning` 表 `UI_Category / Recommended_Pattern / Style_Priority / Color_Mood / Typography_Mood / Key_Effects / Decision_Rules / Anti_Patterns / Severity` —— 与上游 CSV **逐字一致**，血缘确凿 |
| 算法比对 | `lib/bm25.js` 明写"保持与 Python 版一致的 k1=1.5 / b=0.75 参数与 IDF 公式"；`design-system.js` 五步流程对应上游 `design_system.py` 的 `DesignSystemGenerator` |
| 本仓库自研 | 纯 JS 重写、离线内置 JSON、中文优先（300+ 术语词典 + CJK 二元分词）、**三个 1-10 设计旋钮**（上游没有） |

**两个必须修的点（已并入阶段 7）**

| # | 问题 | 证据 | 后果 |
|---|------|------|------|
| **N1** | **溯源标注与实际抓取路径不一致** | `THIRD_PARTY_NOTICES.md` 声明上游为 `nextlevelbuilder/ui-ux-pro-max-skill`；`data/index.json` 自述 `source: "opencode/skills/ui-ux-pro-max (data/)"` | MIT 署名链条有瑕疵；无法回答"数据到底从哪来" |
| **N2** | **快照落后且不可追溯** | `generated` 固定为 `2026-08-19`，**无上游 commit / 版本号 / 同步日期**；据 2026-10 初第三方扫描，上游 `ux` 已至 119 条、`reasoning` 已至 192 条（本仓库为 99 / 161） | 无法度量落后多少；上游新增的风格/规范永远进不来 |

> 注：上游各来源口径不一（style 有 67/79/84 三种说法），上表差异**需实测上游当前 CSV 后确认**，不要直接照抄。
>
> **2026-10-18 更新**：N1/N2 已在 1.2.0 处理。快照实际对应上游 `137597b`
> （2026-07-03，84 风格 / 99 UX / 161 推理规则 / 1,923 字体），不是按
> `generated` 时间戳推测的 `8a1a6d8`；详见 `docs/UPSTREAM-SYNC.md` 的血缘验证。
> **1.3.0** 已通过 `scripts/sync-upstream.mjs` 直接同步到 `56ea9cf`
> （88 风格 / 119 UX / 192 推理规则）。

---

## 1. 整体架构

> ### ⚠ 第一约束：DSH 适配优先于架构整洁
>
> 本项目不是通用 JS 库，**它是 DeepSeek Harness 的插件**。任何拆分与"目录好看"冲突时，一律以 DSH 为准：
>
> 1. **宿主契约不可变** —— 工具名、`parameters`、`output.schema`（SchemaSpec **方言**，不是标准 JSON Schema）、
>    返回结构、`SKILL.md` 语义。模型侧与 DSH Web UI 依赖它们，任何阶段都不得改动。
> 2. **发布形态不可变** —— `index.js` 根级入口、`files[]` 白名单、**无生命周期脚本**、`dsh.bundle.patch`、
>    peer 区间须覆盖宿主预发布线。否则市场安装或宿主 boot gate 会直接把插件判为不兼容。
> 3. **离线零依赖不可破** —— 不得为架构优雅引入任何运行时依赖或构建步骤。
>
> 所有 DSH 针对性优化项集中在 **§6.2**，已标注「必做 / 需实测 / 需查宿主文档」。

### 1.1 分层与职责边界（单向依赖，无环）

```
        ┌──────────────────────────────────────────┐
L5      │  plugin/    唯一认识 DSH API 的地方       │  apply / skill / schema 方言
        ├──────────────────────────────────────────┤
L4      │  tools/     一个工具一个文件              │  definition + execute + render
        ├──────────────────────────────────────────┤
L3      │  presentation/  Markdown 渲染            │  ← 只读不写
        │  domain/        业务逻辑（纯函数）        │  ← 不认识 DSH，不认识 Markdown
        ├──────────────────────────────────────────┤
L2      │  search/    BM25 引擎 + 检索器            │
        │  repo/      唯一读 data/*.json 的地方     │
        ├──────────────────────────────────────────┤
L1      │  i18n/      纯数据 + 纯函数，不依赖任何层 │  labels / aliases / expandQuery
        └──────────────────────────────────────────┘
                        config.js（横切常量单一源）
```

**铁律（将被自动化测试守卫，见 §5.3）**

1. `i18n/**` 不得 import `lib/` 下任何模块（只能被依赖）。
2. `domain/**` 不得 import `presentation/**`、`plugin/**`、`tools/**`。
3. `search/**` 不得 import `domain/**`。
4. `repo/**` 是**唯一**出现 `data/*.json` 路径的地方；其他层禁止自己拼 `new URL('../data/…')`。
5. 依赖只能从高层指向低层，禁止反向与跨层跳跃（L4 可直接用 L1，但 L1 不可用 L4）。

### 1.2 模块拆分原则

| 原则 | 具体化 | 反例（现状） |
|------|--------|-------------|
| **一文件一职责** | `lib/database.js` 同时是"配置表 + 加载器 + 检索引擎门面 + 领域检测词表"（258 行 4 个职责） | 改一个领域列要动一个混装文件 |
| **数据 vs 逻辑分离** | `zh.js` 644 行中约 570 行是纯数据（FIELD_LABELS 180 + ZH_ALIASES 364），应独立成数据模块 | 词典 diff 与逻辑 diff 混在一起，review 噪音大 |
| **按变更频率拆分** | 词典/清单/常量（高频改）与算法/流程（低频改）分开 | `review.js` 里 90 行清单与 80 行算法同居 |
| **边界层唯一化** | DSH API（`defineTool`/`BUNDLED_SKILL_RANK`）只出现在 `plugin/` 与 `tools/` | 现状已基本满足（只在 index.js），拆分后须保持 |
| **小项目不过度分层** | 全项目 2,150 行，控制在 **5 层 7 个子目录**，不引入 DI/事件总线/插件注册表 | — |

### 1.3 公共代码复用方式

- **横切常量** → `lib/config.js` 单一源：`timeoutMs`(20000/10000/15000)、默认条数(3)、上限(8)、`review.maxRules`(8)、`review` 内部检索 6、`SEARCH_CONFIG`。现状这些数字散落在 5 处。
- **Schema 方言助手** → `lib/plugin/schema.js`：`text()` / `sevEnum` / `nullableObject`（目前是 index.js 里的局部常量）。
- **Markdown 小工具** → `lib/presentation/markdown.js`：表格行生成、标题、`>400 字符截断并标注`（现状 `format.js` 内含一处，将来会复制）。
- **测试脚手架** → `tests/_harness.mjs`：`assert` / `section` / `expect` / 失败计数。现状 **4 个测试文件各自实现一遍**。
- **能力数字** → `lib/repo/stats.js` 从 `data/meta.json` 派生；文档与 `SKILL_DESCRIPTION` 改为插值。
- 明确**不**复用：examples 的共享片段（见 Q3，维持人工同步 + 已有防漂移断言）。

### 1.4 配置与环境管理

| 项 | 现状 | 目标 |
|---|------|------|
| 运行时配置 | 常量硬编码在各文件 | `lib/config.js`，导出冻结对象 |
| 环境变量 | `DOM_SMOKE_JSDOM`（测试用） | 保留；集中到 `tests/_harness.mjs` 读取 |
| 宿主版本兼容 | `peerDependencies` 4 段区间 | 不动；`check-package.mjs` 已有 boot-gate 回归守卫，保留 |
| 安装目标 | `install.ps1` 默认 `$HOME\.dsh\profiles\desktop` | 不动；但**复制内容改为按 `files[]` 白名单**（现复制整个目录，含 `.git`/`tests`/`examples`） |
| 不入库的本地脚本 | `.gitignore` 逐条忽略 `tests/validate-tools.mjs` 等 6 个文件 | 归入 `tools/local/` 后整目录忽略（可选，见阶段 6） |

---

## 2. 目标目录树

```
dsh-ui-ux-pro-max/
├── index.js                       # 薄入口（≤50 行）：重导出 name/inject/apply
├── package.json                   # files[] 只加 "lib"（子目录自动覆盖）；新增 scripts.test
│
├── lib/                           # ── 运行时代码，唯一发布代码目录 ──
│   ├── config.js                  # 横切常量单一源（timeout/默认条数/上限/SEARCH_CONFIG）
│   │
│   ├── plugin/                    # L5 宿主适配层（唯一 import @deepseek-ai/* 的地方）
│   │   ├── index.js               #   apply(ctx)：注册技能 + 注册工具
│   │   ├── skill.js               #   SKILL_CANDIDATE / skillProvider / SKILL_DESCRIPTION
│   │   └── schema.js              #   SchemaSpec 方言助手（text/sevEnum/nullableObject）
│   │
│   ├── tools/                     # L4 工具层：一工具一文件
│   │   ├── index.js               #   buildTools()：装配三个工具
│   │   ├── contracts.js           #   输入/输出契约 JSDoc typedef（单一源）
│   │   ├── design-recommend.js    #   definition + execute + render + presentCall
│   │   ├── design-review.js
│   │   └── design-search.js
│   │
│   ├── presentation/              # L3 展示层（纯文本生成，无副作用）
│   │   ├── markdown.js            #   表格/标题/截断等公共小工具
│   │   ├── design-system.js       #   formatDesignSystem（+ 令牌摘要，视 Q1）
│   │   ├── review.js              #   formatReview
│   │   └── search.js              #   formatSearchResult
│   │
│   ├── domain/                    # L3 业务层（纯函数，不认识 DSH / 不认识 Markdown）
│   │   ├── design-system.js       #   生成流程编排
│   │   ├── reasoning.js           #   推理规则匹配（从 design-system.js 拆出，约 55 行）
│   │   ├── dials.js               #   variance/motion/density 档位表 + resolveDial
│   │   ├── review.js              #   buildReview（去重 + 严重度排序）
│   │   └── checklist.js           #   QUICK_REFERENCE_CHECKLIST（数据单源）
│   │
│   ├── search/                    # L2 检索层
│   │   ├── bm25.js                #   引擎（原样搬迁）
│   │   └── retriever.js           #   search / searchStack / detectDomain / 索引缓存
│   │
│   ├── repo/                      # L2 数据访问层（唯一出现 data/*.json 路径的地方）
│   │   ├── store.js               #   惰性单例：getDb / getDomainRows / getStackRows / getFontRows
│   │   ├── domains.js             #   DOMAIN_CONFIG + DOMAIN_KEYWORDS + 匹配器预编译
│   │   ├── stacks.js              #   STACKS + 栈检索列配置
│   │   └── stats.js               #   从 meta.json 派生能力数字
│   │
│   └── i18n/                      # L1 中文层（纯数据 + 纯函数，零 lib 内依赖）
│       ├── labels.js              #   DOMAIN/STACK/SEVERITY/PRIORITY/FIELD 标签 + localizeRow
│       ├── aliases.zh.js          #   ZH_ALIASES 词典（364 行纯数据）
│       └── query.js               #   expandQuery()
│
├── data/                          # 内置数据库（仅 repo/ 访问）
│   ├── index.json  fonts.json  meta.json
│
├── skills/ui-ux-pro-max/SKILL.md  # 内置技能（路径被 plugin/skill.js 引用，不改名）
├── references/quick-reference.md  # checklist.js 的镜像副本（+ 防漂移测试）
├── examples/                      # 维持单文件自包含（见 Q3）
│   ├── README.md  fintech-dashboard.html  trip-planner-workbench.html
│
├── tests/                         # ── 测试（不发布） ──
│   ├── _harness.mjs               # 共享 assert/section/expect/失败汇总
│   ├── check-package.mjs          # 清单与数据完整性（保留）
│   ├── smoke.mjs                  # 离线自检（保留）
│   ├── check-example.mjs          # 示例静态规范（保留）
│   ├── dom-smoke.mjs              # 示例真实 DOM（保留）
│   ├── contract.mjs               # 【新增】schema ↔ execute 返回值一致性
│   ├── check-counts.mjs           # 【新增】各处能力数字 == meta.json
│   └── check-imports.mjs          # 【新增】分层守卫 + 循环依赖检测
│
├── docs/                          # 【新增】不发布（不在 files[]）
│   ├── ARCHITECTURE.md            #   分层图、依赖铁律、新增代码该放哪
│   └── refactor-plan.md           #   本文件
│
├── .github/workflows/ci.yml       # 加两步：contract / check-counts / check-imports
├── install.ps1                    # 复制改为按 files[] 白名单
├── cordis.patch.yml               # 不动
└── README.md / README.en.md / CHANGELOG.md / LICENSE / THIRD_PARTY_NOTICES.md
```

**为什么顶层目录名保持 `lib/` 而不改 `src/`**：`files[]`、`install.ps1`、两个 README、SKILL.md 都引用它；改名会让阶段 5 的 diff 从"移动文件"膨胀成"全仓路径改写"，违反"避免一次性大规模重写"。分层收益在 `lib/` 内部全部拿到。

---

## 3. 细节打磨

### 3.1 命名规范

| 对象 | 规范 | 现状违规 / 待改 |
|------|------|----------------|
| 目录 | 小写单数或语义复数：`plugin` `tools` `domain` `search` `repo` `i18n` `presentation` | `lib/` 平铺 6 个无层次文件 |
| 文件 | **kebab-case**（`design-system.js`），与现有 `bm25.js`/`design-system.js` 一致 | 现状已符合，新文件沿用 |
| 多词缩写目录 | `i18n`（业界惯例，不写 `internationalization`） | — |
| 常量 | `SCREAMING_SNAKE`（`DOMAIN_CONFIG`、`QUICK_REFERENCE_CHECKLIST`） | 沿用 |
| 私有符号 | 模块内私有不导出，前缀 `_`（`_db`、`_indexCache`） | 沿用 |
| 工具文件 | 动词开头或 `-er` 名词：`retriever.js` `store.js` `query.js` | — |
| 测试文件 | `check-*`（静态校验）/ `*-smoke`（行为冒烟）/ `_harness`（共享，`_` 前缀不视为用例） | 新增沿用 |

### 3.2 入口与路由组织

- **`index.js` 保持根级**（`main` + `files[]` + `install.ps1` 三方依赖），但瘦身为装配层：
  ```js
  export { name, inject } from './lib/plugin/meta.js'
  export { apply, buildTools } from './lib/plugin/index.js'
  ```
  `buildTools()` 必须继续从根导出（`smoke.mjs` 与本机 DSH 验证脚本依赖）。
- **路由 = 工具注册表**：三工具在 `lib/tools/index.js` 显式列出，新增工具只改这一处 + 新增一个文件。
- **技能路由**：`skills/ui-ux-pro-max/SKILL.md` 路径集中到 `lib/plugin/skill.js` 的常量，禁止散落。

### 3.3 数据层与业务逻辑划分

| 能力 | 归属 | 理由 |
|------|------|------|
| 读 `data/*.json`、惰性单例、行访问 | `repo/store.js` | 唯一 I/O 边界；将来换数据源只改这一处 |
| 领域列配置、领域检测词表 | `repo/domains.js` | 纯配置数据，与检索算法变更频率不同 |
| BM25 打分 | `search/bm25.js` | 无状态算法 |
| `search`/`searchStack`/`detectDomain`/索引缓存 | `search/retriever.js` | 门面，屏蔽"配置 + 引擎 + 存储"三者协作 |
| 产品→类别→推理规则→多域检索→组装 | `domain/design-system.js` | 业务流程，可脱离 DSH 单测 |
| 严重度去重与排序、清单 | `domain/review.js` + `domain/checklist.js` | 数据与算法分离 |
| 结构化 → 中文 Markdown | `presentation/*` | 单向：业务层产出结构，展示层只消费 |

### 3.4 类型与契约

- 现状有 JSDoc 但颗粒粗（大量 `@param {object}`）。
- 目标：**不引入 TypeScript**（会破坏零构建约束），改用 `lib/tools/contracts.js` 集中定义 `@typedef`（`DesignSystem`、`Review`、`SearchResult`），三工具的 `output.schema` 与 `format*` 函数共同引用它。
- 关键收益：把"schema 声明"与"格式化器实际读取的字段"这两份隐式契约，变成**可被 `tests/contract.mjs` 自动校验**的一致关系。

### 3.5 测试与文档位置

- 全部测试留在 `tests/`，不随包发布（`files[]` 不含）。
- 文档分三层：
  - 面向用户 → `README.md` / `README.en.md`（发布）
  - 面向模型 → `skills/ui-ux-pro-max/SKILL.md`、`references/quick-reference.md`（发布）
  - 面向贡献者 → `docs/ARCHITECTURE.md`（**不发布**，不进 `files[]`）
- `CHANGELOG.md` 每阶段一个条目，随阶段落地即时写。

---

## 4. 迁移路径（阶段 0–7，每阶段独立可回滚）

> 阶段 0–6 解决**结构**，阶段 7（上游俱进 + DSH 适配）解决**这个项目作为 DSH 插件做得对不对、跟不跟得上**——
> 两者不冲突，可并行推进；若时间有限，**阶段 7 的"必做"项优先于阶段 3–5**。

> **贯穿全程的硬约束**：工具名、参数、`output.schema`、返回结构、`SKILL.md` 内容语义**全程不变**（模型侧依赖它）。所有阶段对外行为等价，随时可发版。
> **每阶段结束的验收**：`npm test`（4 旧 + 3 新增）全绿 + `git diff --stat` 只触及本阶段声明的范围。

### 阶段 0 · 先铺安全网（只加不删，零行为变更）

| # | 任务 | 原因 | 影响范围 | 收益 |
|---|------|------|---------|------|
| 0.1 | `package.json` 加 `scripts.test`（非生命周期脚本，市场允许）；`ci.yml` 改调 `npm test` | 现状无 `npm test`，CI 硬编码 4 条命令且顺序耦合 | `package.json`、`.github/workflows/ci.yml` | 本地一键跑全量；CI 与本地同一入口 |
| 0.2 | 抽 `tests/_harness.mjs`（assert/section/expect/汇总），4 个测试文件改用 | 4 份重复实现；`dom-smoke.mjs` 的 `expect` 无法复用 | 5 个测试文件 | 消重复；新增用例成本降为 1 行 |
| 0.3 | 新增 `tests/check-imports.mjs`：扫 `lib/**` import 图，检测**环** + **越层依赖** | 分层如果没有自动守卫，3 个月内必然退化 | 新增 1 文件 | **把架构规则变成 CI 断言**（本方案最高杠杆项） |
| 0.4 | 新增 `tests/check-counts.mjs`：README×2 / SKILL.md / index.js / package.json 中的能力数字 == `meta.json` | 1.1.0 曾手工修过一次数字过期（67→84） | 新增 1 文件 | 数字漂移从此不可能静默发生 |
| 0.5 | 新增 `tests/contract.mjs`：对每工具跑 `execute`，断言 `schema.properties` 的 required 字段非空且类型匹配 | schema 与实现是两份隐式契约 | 新增 1 文件 | 输出契约回归保护 |

**风险**：极低（纯新增）。**回退**：删文件 + revert `package.json`。

### 阶段 1 · 消重复与死代码（纯删除/合并，行为不变）

| # | 任务 | 原因 | 影响范围 | 收益 |
|---|------|------|---------|------|
| 1.1 | 删 `design-system.js` 的 `export { localizeRow }` | 纯转发再导出，本模块不使用；`format.js` 直接从 `zh.js` 引 | 1 文件 −2 行 | 去掉误导性公共 API |
| 1.2 | 合并 `design-system.js` 中两条来自 `./database.js` 的 import | 同模块拆两条，搬运残留 | 1 文件 | 可读性 |
| 1.3 | 修正 `pick()` 的错误 JSDoc（现写"生成文档字符串的联合"，实际是"按列挑选字段"） | 注释与实现不符，会误导后续修改 | 1 文件 1 行 | 消误导 |
| 1.4 | `smoke.mjs` 的重复 `sevOrder` 改为 import `SEVERITY_ORDER` | 与"清单一式两源"同一类漂移 | 1 文件 −1 行 | 单源 |
| 1.5 | **Q1 决策**：`summarizeDesignSystem` + `formatTokenSummary` 接入工具输出，或删除并删其测试 | 生产路径零引用，只有测试在维护 | 2–3 文件 | 消除约 50 行"僵尸代码" |
| 1.6 | 收敛过度导出：`MAX_RESULTS` / `DOMAIN_CONFIG` / `getDomainRows` / `getStackRows` / `DOMAIN_MATCHERS` 降为模块内部（测试改走 `search`/`getDb`） | 公共 API 面越大，后期重构越不敢动 | 1 文件 + 1 测试 | 缩小 API 面 |

**风险**：低。1.5 需先确认 Q1。**回退**：单文件 revert。

### 阶段 2 · i18n 与配置外置（数据搬家，逻辑零改动）

| # | 任务 | 原因 | 影响范围 | 收益 |
|---|------|------|---------|------|
| 2.1 | `lib/zh.js` → `lib/i18n/{labels.js, aliases.zh.js, query.js}`；`zh.js` 保留为 re-export 兼容层（一个版本后删） | 644 行里 570 行是纯数据；词典 diff 淹没逻辑 diff | 1 拆 3 + 改 3 处 import | 词典可独立 review；将来可换语言包 |
| 2.2 | 新建 `lib/config.js`，收拢 timeout/默认条数/上限/`SEARCH_CONFIG` | 数字散落 5 处 | 新建 1 + 改 5 处引用 | 调参只改一处 |
| 2.3 | `lib/repo/stats.js` 从 `meta.json` 派生能力数字；`SKILL_DESCRIPTION`、工具 description 改为插值 | 见 Q5 | 1 新建 + `index.js` 2 处 | 数字永不漂移（配合 0.4） |

**风险**：中低。2.1 用 `git mv` 保留历史；保留一层 re-export 兜底。**回退**：re-export 层存在时可整段回退。

### 阶段 3 · 数据访问与检索分层

| # | 任务 | 原因 | 影响范围 | 收益 |
|---|------|------|---------|------|
| 3.1 | `database.js` → `repo/store.js`（加载/行访问）+ `repo/domains.js`（配置+关键词+预编译匹配器）+ `repo/stacks.js` | 258 行含 4 个职责 | 1 拆 3 + 改 3 处 import | I/O 边界唯一化；领域配置可独立改 |
| 3.2 | `database.js` 的检索门面 → `search/retriever.js`；`bm25.js` → `search/bm25.js` | 算法 vs 门面分离 | 移动 2 + 改 import | 检索可单测 |
| 3.3 | 校验：除 `repo/**` 外无任何文件出现 `data/` 路径（写进 `check-imports.mjs`） | 防止分层后路径再次散落 | 测试增强 | 规则可执行 |

**风险**：中。相对路径 `new URL('../data/…')` 需重算——**这正是分层收益**（以后只算一次）。全程有 0.3/0.5 守卫。**回退**：单阶段 revert。

### 阶段 4 · 业务与展示分层

| # | 任务 | 原因 | 影响范围 | 收益 |
|---|------|------|---------|------|
| 4.1 | `design-system.js` → `domain/design-system.js` + `domain/reasoning.js`（约 55 行规则匹配）+ `domain/dials.js`（档位表） | 377 行里"流程 / 规则匹配 / 常量表"三件事 | 1 拆 3 | 规则匹配可独立单测（当前只能端到端测） |
| 4.2 | `review.js` → `domain/review.js` + `domain/checklist.js`（90 行数据） | 数据与算法分离 | 1 拆 2 | 清单改动 diff 清晰 |
| 4.3 | `format.js` → `presentation/{markdown.js, design-system.js, review.js, search.js}` | 243 行 4 个格式化器 + 公共小工具 | 1 拆 4 | 新增输出格式不牵动其他 |

**风险**：中。**关键防线**：阶段 0.5 的契约测试 + `smoke.mjs` 的输出断言，保证拆完行为等价。**回退**：单阶段 revert。

### 阶段 5 · 工具与入口收敛

| # | 任务 | 原因 | 影响范围 | 收益 |
|---|------|------|---------|------|
| 5.1 | `index.js` 的 3 个 `defineTool({...})` → `lib/tools/{design-recommend,design-review,design-search}.js` | index.js 316 行里约 230 行是工具定义 | 移动约 230 行 | 加工具 = 加文件 |
| 5.2 | 技能注册 + schema 助手 → `lib/plugin/{index.js, skill.js, schema.js}` | 宿主适配集中 | 移动约 60 行 | DSH API 升级只改 `plugin/` |
| 5.3 | `index.js` 瘦身为薄入口（保留 `buildTools` 导出） | 入口职责单一 | `index.js` 316 → ≤50 行 | 一眼看清插件全貌 |
| 5.4 | `lib/tools/contracts.js` 集中 typedef | 见 §3.4 | 新建 1 | 契约可引用 |
| 5.5 | 更新两个 README 的目录树；新建 `docs/ARCHITECTURE.md` | 文档随结构走 | 文档 | 新人 5 分钟看懂分层 |
| 5.6 | `package.json.files` 确认含 `lib`（子目录自动覆盖，**无需改**） | — | 0 | — |

**风险**：中高（动入口）。**控制**：先做 5.1/5.2，最后做 5.3；每步跑全量测试；`index.js` 的 `exports` 形状保持不变。**回退**：任一子步独立 revert。

### 阶段 6 · 交付侧打磨（可与前面并行）

| # | 任务 | 原因 | 影响范围 | 收益 |
|---|------|------|---------|------|
| 6.1 | `install.ps1` 改为按 `package.json` 的 `files[]` 白名单复制 | 现复制整个目录（含 `.git`、`tests`、`examples`） | 1 文件 | 安装物与发布物一致；体积下降 |
| 6.2 | 清理 `zh.js` 兼容 re-export 层（阶段 2 引入） | 过渡层到期 | 1 文件 | 无冗余 |
| 6.3 | `.gitignore` 的本地验证脚本归入 `tools/local/`（可选） | 6 条逐文件忽略难维护 | 忽略规则 | 可选，优先级低 |
| 6.4 | examples 生成器方案**重新评估**（触发条件：第 3 个示例出现，或共享片段 > 现有 2 倍） | 见 Q3 | 暂不动 | 保持既有决策 |

### 阶段 7 · 上游俱进 + DSH 针对性适配（**本方案的灵魂，优先级最高**）

> 阶段 0–6 解决"结构"，阶段 7 解决"这个项目作为 DSH 插件 + 上游下游，是否做得对、跟得上"。
> **这一阶段不可省略**，否则架构再整洁也只是个数据陈旧、宿主适配靠运气的插件。

| # | 任务 | 原因 | 影响范围 | 收益 | 定级 |
|---|------|------|---------|------|------|
| 7.1 | **修复溯源标注（N1）**：`THIRD_PARTY_NOTICES.md` 与 `data/index.json` 的 `source` 统一；若确从 opencode 转出，则同时注明「原始上游 nextlevelbuilder/…」+「转取路径 opencode/skills/…」 | 法律声明与实际来源不一致 | 2 处文件 | MIT 署名链条闭合 | **必做** |
| 7.2 | **快照可追溯（N2）**：`index.json` / `meta.json` 增加 `upstream`（repo URL）、`upstreamRef`（commit/tag）、`syncedAt`；`check-package` 断言三者非空 | 现在无法回答"落后多少" | 数据 + 1 测试 | 上游同步变成可度量动作 | **必做** |
| 7.3 | 新建 `docs/UPSTREAM-SYNC.md`：同步 SOP（取上游 CSV → 转换 → 重生成 `meta.json` → 跑测试 → 更新文档）+ **差异看板**（本仓库 vs 上游，逐域条数对比，标注来源与日期） | 同步目前完全靠人记忆 | 新增 1 文档 | 每次同步有章可循 | **必做** |
| 7.4 | 每 release 前核对上游差异并写进 `CHANGELOG.md`；差异超阈值（如某域落后 >10%）时开 issue | 让"俱进"成为节奏而非偶然 | 流程 | 数据不再静默老化 | **必做** |
| 7.5 | **DSH 兼容矩阵** `docs/DSH-COMPAT.md`：记录已验证宿主线（0.1.0 / 0.1.1 / 0.2.0 / 0.2.1）× 验证项（工具定义编译、schema、`render`、`presentCall`、`apply()` 注册、内置技能激活） | 宿主演进快且验证结果只在本机 | 新增 1 文档 | 版本适配不再靠重踩一遍坑 | **必做** |
| 7.6 | `VERIFIED_HOST` 常量提到 `lib/config.js`，`check-package.mjs` 与其同源 | 现状硬编码在测试里，与 `peerDependencies` 是两份真相 | 2 文件 | peer 区间与验证基线同改同测 | **必做** |
| 7.7 | **SchemaSpec 方言合规测试**：把 `index.js` 顶部那段方言注释（属性级 `required`、`items` 内禁 `required`、禁 type 数组、禁 numeric bounds）固化进 `lib/plugin/schema.js` + `tests/check-schema.mjs` | 这些是 DSH 特有的坑，写错只有宿主运行时才报错 | 新增 1 测试 + 1 模块 | 非法 schema 在 CI 就被拦下 | **必做** |
| 7.8 | **技能描述动态化**：`SKILL_DESCRIPTION` 的能力数字改为从 `meta.json` 派生（接阶段 2.3） | 该 description 是宿主判断**何时激活技能**的关键信号，漂移 = 技能叫不应 | 1 处 | 激活信号永不失真 | **必做** |
| 7.9 | **`presentCall` 卡片针对性**：三工具现均为 `card:'generic'` + `kind:'search'`；为 `design_recommend` 补充风格名/主色等摘要字段 | 通用卡片浪费了工具最有价值的信息 | 3 处 | Web UI 呈现更有信息量 | ❓需查宿主支持字段 |
| 7.10 | **`render` 与 token 预算**：确认 render 文本是否即模型可见上下文；若是，为 `design_recommend` 的 Markdown 加长度上限并测试断言（现有 400 字符截断**只覆盖检索结果**，设计系统输出无预算） | 设计系统 Markdown 可能很长，直接进模型上下文 | 需先实测 | 控制上下文占用 | ❓需实测 |
| 7.11 | **`timeoutMs` 按实测重设**（现 20000/10000/15000ms）：热路径实测 4ms / 49ms，但冷启动含 1.2MB `index.json` 解析 + 1.1MB `fonts.json` 首次加载 | 现值是拍脑袋的安全余量 | 3 处 | 贴合真实耗时，保留 10× 余量 | ❓需测冷启动 |
| 7.12 | **包体评估**：`data` 2.4MB 随包，其中 `fonts.json` 1.1MB 仅 `google-fonts` 一域用到 | 影响市场安装体积与首装体验 | 数据/打包 | 权衡后决定（与"完全离线"卖点冲突，慎动） | ❓需你决策 |
| 7.13 | **`install.ps1` 鲁棒性**：共享 `node_modules` 的 hoist 假设；加 profile 自动探测、支持 desktop/web 双 profile、失败给可操作提示 | 现依赖目录结构假设且只写死 desktop | 1 文件 | 安装成功率 | 建议做 |
| 7.14 | **降级路径显式化**：`ctx.inject(['skills'], …)` 无 else 分支（skills 缝不存在时静默跳过） | 行为正确但无记录、无日志 | 1 处 | 明确降级契约 | 建议做 |

---

## 5. 质量校验（优化后可执行的检查项）

### 5.1 必跑（每次提交）

```bash
npm test
# = check-package → smoke → check-example → check-counts → contract → check-imports → check-schema
#   （dom-smoke 在 jsdom 缺失时自动跳过，CI 中独立安装后运行）
```

另有**两道 CI 跑不了、必须人工过**的关（已写进 `docs/DSH-COMPAT.md` 与 `docs/UPSTREAM-SYNC.md`）：

```bash
# 1) 真实宿主验证：依赖本机 DSH 安装路径，无法进 CI
node tests/validate-tools.mjs && node tests/validate-apply.mjs
# 2) 上游差异核对：每次 release 前跑一次，结果写进 CHANGELOG
#    取上游 CSV → 转换 → 比对各域条数 → 更新 docs/UPSTREAM-SYNC.md 差异看板
```

### 5.2 新增自动检查项

| 检查 | 实现 | 抓什么 |
|------|------|--------|
| **循环依赖** | `tests/check-imports.mjs` 解析 `import … from` 建图，DFS 找环 | 拆分后 inadvertent 环 |
| **越层依赖** | 同上，按 §1.1 五条铁律断言 | 架构退化（这是分层能否持久的关键） |
| **data 路径唯一性** | 扫全仓，仅 `lib/repo/**` 可出现 `data/` | I/O 边界泄漏 |
| **契约一致性** | `tests/contract.mjs`：跑 `execute` 后按 `output.schema` 校验 required 字段存在且类型匹配 | schema 与实现漂移（当前靠人肉） |
| **能力数字一致性** | `tests/check-counts.mjs`：文档/description 中的数字 == `meta.json` | 曾真实发生过（67→84） |
| **死代码** | 扫 `export` 符号在 `lib/` 与 `tests/` 的引用数，报告 0 引用项 | `summarizeDesignSystem` 类僵尸 API |
| **SchemaSpec 方言合规** | `tests/check-schema.mjs`：断言三工具 schema 不含 `items` 内 `required`、不含 type 数组、不含 numeric bounds、根层 `required` 为属性级 | DSH 特有的坑，写错只有宿主运行时才报错（阶段 7.7） |
| **溯源字段完整性** | `check-package.mjs` 增加：断言 `index.json` / `meta.json` 含非空 `upstream` / `upstreamRef` / `syncedAt` | 防止上游信息在重新转换时丢失（阶段 7.2） |
| **上游差异看板** | `docs/UPSTREAM-SYNC.md` 的差异表须带"核对日期 + 数据来源"，release 前人工更新 | 让"俱进"可度量（阶段 7.4） |

### 5.3 发布前人工/半自动校验

```bash
npm pack --dry-run          # 确认 files[] 内容与包体积（不含 tests/、docs/、examples/）
node tests/check-package.mjs  # BOM / bundle.patch / files 存在性 / 无生命周期脚本 / peer 区间
```
- **真实宿主验证**：保留本机脚本（`validate-tools.mjs` / `validate-apply.mjs`）在真实 DSH 上跑一次工具定义编译 + `apply()` 注册——这条无法进 CI（依赖本机 DSH 路径），但每次结构大改后必须手动跑一次。
- **模型侧回归**：改完 `SKILL.md` 描述后，手动问一次「用 design_recommend 生成一个金融 SaaS 数据看板的设计系统」。

### 5.4 优化后的预期收益（可度量）

| 指标 | 现状 | 目标 |
|------|------|------|
| 单文件最大行数 | `lib/zh.js` 644 / `index.js` 316 | ≤ 250（纯数据文件除外） |
| 测试脚手架重复份数 | 4 | 1 |
| 能力数字硬编码处 | 11 处 | 0（全部派生） |
| 架构规则可执行性 | 0 条 | 6 条自动断言 |
| 新增一个工具的改动文件数 | 1（改 316 行 index.js） | 2（新建 1 + 注册 1 行） |
| 发布包体积 / 内容 | `install.ps1` 复制全仓 | 与 `files[]` 严格一致 |
| 运行时行为 | 三工具输出 | **完全不变**（硬约束） |
| 上游可追溯性 | 仅一个 `generated` 时间戳 | `upstream` + `upstreamRef` + `syncedAt` + 差异看板 |
| DSH 适配保障 | 靠人工记 + 本机脚本 | 兼容矩阵 + 方言合规测试 + 同源常量 |

---

## 6. 上游俱进与 DSH 针对性优化

> 阶段 7 的任务清单见 §4；本节说明**为什么这么做**以及**做完是什么状态**。

### 6.1 上游同步机制 —— 让 skill 跟得上

**现状**：数据是一次性快照（`generated: 2026-08-19`），溯源标注自相矛盾（§0.3 N1），
既没有上游 commit 也没有同步日期（N2）。结果是——**上游在长，本仓库不动，且没人知道落后了多少。**

**目标状态**：四件事闭合。

| 能力 | 做法 | 落地项 |
|------|------|--------|
| **可追溯** | `index.json` / `meta.json` 写入 `upstream` + `upstreamRef` + `syncedAt`，并由 `check-package` 断言非空 | 7.2 |
| **可重复** | `docs/UPSTREAM-SYNC.md` 固化 SOP：取上游 CSV → 转换 → 重生成 `meta.json` → 跑 `npm test` → 更新文档数字 | 7.3 |
| **可度量** | 差异看板逐域对比条数，带"核对日期 + 数据来源"；release 前必看 | 7.3 / 7.4 |
| **自动跟随** | 能力数字改从 `meta.json` 派生（阶段 2.3）后，**数据一更新，11 处文档数字与 `SKILL_DESCRIPTION` 自动跟上**，无需手工改 | 2.3 / 7.8 |

**差异看板模板**（放 `docs/UPSTREAM-SYNC.md`）：

| 域 | 本仓库 | 上游 | 差值 | 核对日期 |
|---|---|---|---|---|
| style | 84 | ? | ? | 2026-10-__ |
| color | 192 | ? | ? | |
| ux | 99 | ? | ? | |
| reasoning | 161 | ? | ? | |
| chart / landing / typography / icons / gsap / react / web / googleFonts | … | | | |

> 上游各来源口径不一，**首行数据必须由实测上游当前 CSV 填**，不得照抄第三方文章。

**为什么这算"俱进"而非"维护负担"**：本项目的价值 = 上游的设计数据库 × DSH 的离线中文形态。
数据库老化 = 产品价值直接衰减。把同步做成 6 步 SOP + 1 个看板，是把"想起来才做"变成"每次发版顺手做"。

---

### 6.2 DSH 针对性优化 —— 做对宿主适配

**先看清：DSH 不是 Claude Code / Cursor。** 上游那套是"文件型 skill"（Python + CSV，靠 CLI 装进 20+ 个 agent），
本项目是"运行时插件"，二者约束完全不同。所有针对性优化都源于这五个差异：

| 差异 | DSH 的实际约束 | 对应的坑（本项目踩过/潜在） |
|---|---|---|
| ① **Schema 方言** | `output.schema` 用 dsh-tools 的 **SchemaSpec**，不是标准 JSON Schema | `items` 内禁 `required`、禁 type 数组、禁 numeric bounds —— 写错**只有宿主运行时才报错** |
| ② **boot gate** | 宿主按 `peerDependencies` 区间判断是否加载插件 | 1.1.1 修的就是这个：区间匹配不到 `0.2.0-rc.2`，插件实际能跑却被判不兼容→ 技能与工具**全部消失** |
| ③ **双通道输出** | `render`（展示）+ `presentCall`（卡片）分离，与 `execute` 的结构化返回是三回事 | 三工具现在都用 `card:'generic'`，浪费了工具最有价值的信息 |
| ④ **注册方式** | 靠 `cordis.patch.yml` 的 `insert` + `dsh.bundle.patch`，不是 marketplace.json | `files[]` 指向不存在的文件 / 有生命周期脚本 → 市场直接拒装 |
| ⑤ **版本演进快** | 0.1.x 与 0.2.x 两条线并行，预发布版本居多 | 验证结果只在本机，换台机器就得重踩 |

**优化清单**：

| 组 | 项 | 现状 | 为什么对 DSH 重要 | 目标 | 定级 |
|---|---|---|---|---|---|
| **A 宿主契约** | SchemaSpec 方言合规 | 方言规则只写在 `index.js` 顶部注释里 | 写错 = 宿主运行时崩溃，本地测试发现不了 | 固化进 `lib/plugin/schema.js` + `tests/check-schema.mjs`（7.7） | **必做** |
| A | 兼容矩阵 | 无记录 | 换机器/换宿主版本就得重踩一遍 | `docs/DSH-COMPAT.md` 记录「宿主线 × 6 项验证」（7.5） | **必做** |
| A | `VERIFIED_HOST` 同源 | 硬编码在 `check-package.mjs`，与 `peerDependencies` 两份真相 | 改一处忘另一处 = boot gate 事故重演 | 提到 `lib/config.js`，测试与其同源（7.6） | **必做** |
| A | 技能描述动态化 | `SKILL_DESCRIPTION` 数字硬编码 | 该 description 是宿主判断**何时激活技能**的信号，漂移 = 技能叫不应 | 从 `meta.json` 派生（7.8） | **必做** |
| **B 呈现与性能** | `presentCall` 卡片 | 三工具全 `generic/search` | 通用卡片丢掉了风格名、主色等最有价值的摘要 | 为 `design_recommend` 补摘要字段（7.9） | ❓需查宿主支持字段 |
| B | `render` token 预算 | 设计系统 Markdown **无长度上限**（400 字符截断只覆盖检索结果） | 若 render 文本即模型上下文，长输出直接吃 token | 实测确认后加上限 + 测试断言（7.10） | ❓需实测 |
| B | `timeoutMs` | 20000/10000/15000ms，拍脑袋 | 冷启动含 1.2MB + 1.1MB JSON 解析，与热路径（4ms/49ms）差两个量级 | 测冷启动后重设，保留 10× 余量（7.11） | ❓需测 |
| B | 包体 | `data` 2.4MB 随包，`fonts.json` 1.1MB 只服务 `google-fonts` 一域 | 影响市场安装体积与首装体验 | 评估是否可选/懒装（7.12） | ❓需你决策 |
| **C 交付安装** | `install.ps1` | 复制整个目录（含 `.git`/`tests`/`examples`）；写死 desktop profile | 安装物与发布物不一致；web profile 用户装不上 | 按 `files[]` 白名单复制 + profile 自动探测（6.1 / 7.13） | 建议做 |
| C | 降级路径 | `ctx.inject(['skills'], …)` 无 else 分支 | 行为正确但无记录，排查时无从下手 | 显式记录降级契约（7.14） | 建议做 |

**验收**：阶段 7 完成后，应能回答这四个问题而不用翻代码——
① 数据从哪来、哪个版本、哪天同步的？
② 支持哪些 DSH 宿主版本、分别验证过什么？
③ 上游现在比我们多多少条？
④ 换个宿主版本，要改哪几个文件？
答案分别在 `data/index.json` 的 `upstreamRef`、`docs/DSH-COMPAT.md`、`docs/UPSTREAM-SYNC.md`、`lib/config.js`。
