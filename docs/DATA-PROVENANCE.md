# 数据来源与口径

> 本文件记录内置数据库的来源、当前版本与统计口径。
> 插件**不包含**运行时拉取、定时同步或自动更新上游数据的功能；`data/*.json`
> 是随包发布的静态文件。

## 1. 数据血缘

| 项 | 值 |
|---|---|
| 原始上游 | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)（MIT） |
| 数据目录 | `cli/assets/data/` |
| 当前快照 ref | `56ea9cf174ed86786187daa9de0e6247cb0747e4`（2026-10-15T09:04:34+07:00） |
| 快照时间 | `2026-10-18T03:59:34.490Z`（`generated` / `syncedAt`） |
| 溯源字段 | `upstream` / `upstreamRef` / `upstreamRefKind` / `upstreamRefDate` / `upstreamDataPath` / `sourcePath` / `syncedAt` / `lineageVerifiedAt` |
| 守卫 | `tests/check-package.mjs` 断言字段非空、ref 为 40 位 commit、两份数据一致 |

## 2. 当前计数

| 域 | 条数 |
|---|---:|
| style（设计风格） | 88 |
| color（调色板） | 192 |
| chart（图表） | 25 |
| landing（落地页模式） | 34 |
| product（产品类型） | 192 |
| ux（UX 规范） | 119 |
| typography（字体搭配） | 74 |
| icons（图标） | 105 |
| gsap（动效预设） | 17 |
| react（React 性能） | 44 |
| web（移动端接口） | 32 |
| reasoning（推理规则） | 192 |
| stacks（技术栈） | 22 |
| stackGuidelines（技术栈规范合计） | 1271 |
| googleFonts | 1934 |
| **totalRows** | **4319** |

## 3. 口径与已知差异

- `styles.csv` 共 88 行，其中 `active` 50、`supplemental` 29、`deprecated` 9。
  检索默认排除 `deprecated`（9 条），因此可检索风格为 79 条；
  查询显式包含 `legacy` / `deprecated` 时，风格与技术栈检索都会保留废弃条目（同一套判定，见 `lib/search/retriever.js` 的 `deprecatedFilter`）。
- 1.2.0 的快照来自上游 `137597b`，经 opencode 路径转码，曾有 186 个单元格
  丢失内部双引号；1.3.0 直接从上游 CSV 重新生成，该问题已修复。
- 上游 CSV 含引号内换行；计数必须以 CSV 解析器为准，不能按行 `split` 或 `wc -l`。
- 上游 `main` 持续变化；本文件的数字是 `56ea9cf` 这一时点的快照，不是实时值。

## 4. 代码层血缘

- `lib/search/bm25.js` 对应上游 `core.py` 的 `BM25`：`k1=1.5`、`b=0.75`、IDF 公式
  `log((N - freq + 0.5) / (freq + 0.5) + 1)` 一致；本仓库额外加了 CJK 二元分词。
- `lib/domain/design-system.js` 对应上游 `design_system.py` 的 `SEARCH_CONFIG`、
  `_find_reasoning_rule`、`_apply_reasoning`、`_select_best_match` 五步流程。
- `lib/domain/dials.js` 对应上游 `DIAL_TIERS`；上游在 `137597b` 已包含三个 1-10 旋钮，
  本仓库做的是中文标签重实现与 DSH 工具封装。
- 本仓库自研部分：纯 JS、离线内置 JSON、中文词典与 CJK 分词、三个 DSH 工具与卡片输出。

## 5. 数据更新约定

数据是发布包的一部分，不在工具调用路径里联网更新。若未来需要替换数据库，
由维护者在发布前更新 `data/*.json`、同步 `data/meta.json` 计数，并运行 `npm test`。
