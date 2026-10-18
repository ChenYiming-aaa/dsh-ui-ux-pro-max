# 架构说明（贡献者向，不随包发布）

> 目标：在**保留 DSH 插件形态**的前提下，让代码「能长」。
> 约束优先级：DSH 宿主契约 > 发布形态 > 离线零依赖 > 目录整洁。

## 1. 分层

```
L5  plugin/        唯一认识 DSH API 的地方：apply / skill / SchemaSpec 方言
L4  tools/         一个工具一个文件：definition + execute + render + 卡片
L3  domain/        业务纯函数：设计系统生成 / 审查 / 旋钮 / 推理规则 / 清单
    presentation/  Markdown 渲染（只读结构化数据，不写业务）
L2  search/        BM25 引擎 + 检索门面（search / searchStack / detectDomain）
    repo/          唯一读 data/*.json 的地方 + 能力数字派生
L1  i18n/          中文标签 / 词典 / 查询扩展（纯数据 + 纯函数）
L0  config.js      横切常量单一源（timeout / 条数 / 渲染预算 / VERIFIED_HOST）
```

依赖方向只能从高层指向低层：

```
plugin → tools → presentation/domain → search/repo → i18n → config
```

## 2. 五条铁律（由 `tests/check-imports.mjs` 自动守卫）

1. `i18n/**` 只能依赖 `i18n/**`。
2. `repo/**` 只能依赖 `config.js` 与 `repo/**`。
3. `search/**` 不得依赖 `domain/**`。
4. `domain/**` 不得依赖 `presentation/**`、`tools/**`、`plugin/**`；
   `presentation/**` 不得依赖 `domain/**`、`tools/**`、`plugin/**`。
5. 只有 `lib/repo/**` 可以出现 `data/` 路径；只有 `lib/plugin/**` 可以
   `import '@deepseek-ai/*'`。

另有：

- 无循环依赖。
- 除 `node:` 内置模块与 `lib/plugin/**` 的宿主 API 外，不允许 bare import（零第三方运行时依赖）。
- 根入口 `index.js` 只允许依赖 `lib/plugin/**`。

## 3. 新增代码该放哪

| 你要做的事 | 放这里 | 不要 |
|---|---|---|
| 新增一个模型工具 | `lib/tools/<name>.js` + `lib/tools/index.js` 注册一行 | 改 `index.js` |
| 新增一个检索领域 | `lib/repo/domains.js` 加配置 + 关键词；数据放 `data/index.json` | 在 `retriever.js` 里拼路径 |
| 调整设计系统流程 | `lib/domain/design-system.js` | 在展示层改结构 |
| 调整旋钮档位 | `lib/domain/dials.js` | 散落在工具定义里 |
| 调整推理规则匹配 | `lib/domain/reasoning.js` | 塞回生成流程 |
| 改中文标签/词典 | `lib/i18n/labels.js` / `aliases.zh.js` | 在格式化器里硬编码中文 |
| 改 Markdown 输出 | `lib/presentation/*` | 在 domain 里拼字符串 |
| 改超时/条数/截断预算 | `lib/config.js` | 直接写魔法数字 |
| 改宿主注册/降级 | `lib/plugin/index.js` | 在工具文件里 import DSH API |

## 4. 三个工具的数据流

### design_recommend

```
tools/design-recommend
  → domain/design-system.generateDesignSystem
      → search/retriever.search（product/style/color/landing/typography）
      → domain/reasoning.applyReasoning
      → domain/dials.resolveDial
  → presentation/design-system.formatDesignSystem（render）
  → presentation/design-system.formatTokenSummary（完成态卡片）
```

### design_review

```
tools/design-review
  → domain/review.buildReview
      → search/retriever.search（ux / web / react）
      → domain/checklist.QUICK_REFERENCE_CHECKLIST
  → presentation/review.formatReview
```

### design_search

```
tools/design-search
  → search/retriever.search | searchStack
  → presentation/search.formatSearchResult
```

## 5. 契约与方言

- `lib/tools/contracts.js`：`DesignSystem` / `Review` / `SearchResult` / `ToolSpec` 的 JSDoc typedef。
- `lib/tools/schema.js`：SchemaSpec 构造助手（纯对象，不 import 宿主）。
- `lib/plugin/dialect.js`：节点/值级方言校验原语（`walkSchemaNode` / `validateSpecValue` / `requiredFieldViolations`）。
- `lib/plugin/schema.js`：工具级方言守卫（name/description/timeout/parameters/output）+ 注册期 fail fast。
  - 属性级 `required: true`；`items` / `oneOf` 内禁止 `required`
  - 禁 `type` 数组（可空用 `oneOf`）
  - 禁数值边界（在 `execute` 内钳制）
- `lib/domain/colors.js`：color 行 → HEX 令牌 + CSS 变量（与生成流程分离）。
- 守卫位置：`tests/check-schema.mjs`（方言）、`tests/contract.mjs`（schema ↔ execute 一致）。

## 6. 配置单一源

`lib/config.js` 汇总：

| 常量 | 用途 |
|---|---|
| `TIMEOUTS` | 三个工具的 advisory timeout metadata（注册表不强制执行） |
| `LIMITS` | 检索默认条数/上限、审查默认条数/预取条数 |
| `SEARCH_CONFIG` | design_recommend 五步检索 |
| `RENDER` | 设计系统 Markdown 上限、检索字段截断 |
| `VERIFIED_HOST` | 与 `peerDependencies` 同源的已验证宿主线 |

## 7. 测试地图

| 文件 | 抓什么 |
|---|---|
| `tests/check-package.mjs` | BOM / bundle patch / files[] / 生命周期脚本 / peer 区间（含 cordis 白名单）/ 数据计数 / 上游溯源 |
| `tests/check-columns.mjs` | 列配置 ⊆ 实际列（11 域 + 22 栈）/ 标签覆盖 / 无全空列 |
| `tests/check-config.mjs` | 配置默认值 / 范围校验 / Standard Schema / 工具默认值注入 |
| `tests/smoke.mjs` | 数据库、生成、审查、检索、中文输出、清单双源 |
| `tests/check-example.mjs` | 示例页静态规范（无障碍、令牌化、状态） |
| `tests/dom-smoke.mjs` | 示例页真实 DOM 交互（jsdom 缺失时跳过） |
| `tests/check-counts.mjs` | 能力数字 == `data/meta.json` |
| `tests/check-skill.mjs` | SKILL.md 覆盖全部领域/单字/platform 与关键口径，且正文不含 frontmatter |
| `tests/check-i18n.mjs` | 中文词典无重复键、扩展结果去重 |
| `tests/contract.mjs` | schema ↔ execute 返回值一致 |
| `tests/check-imports.mjs` | 分层、无环、data 路径唯一、宿主 API 边界 |
| `tests/check-schema.mjs` | SchemaSpec 方言 + 负例 |
| `tests/host/verify-host.mjs` | 真实宿主包兼容（`DSH_MODULE_ROOT` 指定，不进 `npm test`） |

### 测试环境的两种形态

| | 本地工作树（本机） | 干净 clone / CI |
|---|---|---|
| `node_modules` | 常为软链接到同级主工作树 | 不存在，需按需安装 |
| `dom-smoke` | 跑 jsdom 真实交互 | 缺 jsdom 时**静默跳过**（CI 另装隔离 jsdom 后强制跑） |
| `verify:host` | 解析到本机宿主版本 | 需 `DSH_MODULE_ROOT` 指向隔离安装目录 |

结论：**本地全绿 ≠ 干净 clone 全绿**，判断以 CI 为准。新增测试不要依赖本机路径或父工作树。

## 8. 有意保留的决策

- **顶层目录仍叫 `lib/`**：`files[]`、安装脚本、README、SKILL.md 都引用它；改名收益低、风险高。
- **examples 保持单文件自包含**：共享片段用测试守卫，不引入构建链。
- **`data/fonts.json`（约 1.2MB）仍随包**：`google-fonts` 检索依赖它；拆包/懒装会破坏「完全离线」卖点，暂不动。
- **不引入 TypeScript / devDependencies**：零构建、零运行时依赖是发布约束；契约用 JSDoc + 测试保证。
- **检查清单以 JS 为源、Markdown 为镜像**：工具输出是权威来源，镜像由测试防漂移。
