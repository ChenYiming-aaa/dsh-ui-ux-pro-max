# 上游同步 SOP 与差异看板

> 本项目的价值 = 上游设计数据库 × DSH 的离线中文形态。
> 数据库老化 = 产品价值衰减；本文件把「想起来才同步」变成「每次发版顺手做」。

## 1. 数据血缘

| 项 | 值 |
|---|---|
| 原始上游 | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)（MIT） |
| 数据转取路径 | `opencode/skills/ui-ux-pro-max/data/`（见 `data/index.json` 的 `sourcePath`） |
| 当前快照 | `generated` = `2026-08-19T09:37:40.268Z`（这是**转码时间**，不是上游提交时间） |
| 数据内容对应上游 ref | `137597b02fc3c8689059af899bffef76ee6ae15c`（2026-07-03T23:16:28Z） |
| 上游数据目录 | `cli/assets/data/`（本快照逐行匹配该路径；`.claude/skills/.../data/` 在该 ref 下部分文件仍是旧版） |
| 溯源字段 | `upstream` / `upstreamRef` / `upstreamRefKind` / `upstreamRefDate` / `upstreamDataPath` / `sourcePath` / `syncedAt` / `lineageVerifiedAt` |
| 守卫 | `tests/check-package.mjs` 断言字段非空、ref 为 40 位 commit、两份数据一致 |

> 不要按 `generated` 时间戳推断上游 commit。本次最初按 `commits?until=<generated>`
> 推得 `8a1a6d8`，但逐行比对发现该提交的数据是 88 风格 / 119 UX / 192 推理规则，
> 与本快照的 84 / 99 / 161 不符；真正的数据对应 `137597b`。**以行级比对为准，不以日期为准。**

### 1.1 血缘验证（2026-10-18）

**方法**：

```bash
git clone --filter=blob:none --no-checkout https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git /tmp/uiux-upstream
git -C /tmp/uiux-upstream log --oneline -- cli/assets/data/styles.csv
# 对候选 commit 逐文件取 CSV，与 data/index.json / data/fonts.json 逐行逐字段比对
git -C /tmp/uiux-upstream show <sha>:cli/assets/data/styles.csv
```

**结果**：

- 11 个领域表（style/color/chart/landing/product/ux/typography/icons/gsap/react/web）、
  161 条 reasoning、22 个 stack 表、1,923 条 Google Fonts，**行数与列名全部相等**；
- 逐字段比对：绝大多数单元格完全一致；**186 个单元格**的内部双引号在转码时被剥离
  （`icons` 100 / `shadcn` 38 / `nuxt-ui` 25 / `javafx` 15 / `nuxtjs` 5 /
  `web` 1 / `wpf` 1 / `uno` 1），属于转码瑕疵，不是数据来源不同；
- 快照计数与 `137597b` 完全吻合：84 / 192 / 25 / 34 / 192 / 99 / 74 / 105 / 16 /
  44 / 30 / 161 / 22 栈 / 1,923 字体。

> 该引号剥离问题会影响代码示例的可复制性，建议在下一次上游同步时从 CSV 重新转换修复；
> 本次只修正溯源，不改数据内容。

### 1.2 代码层血缘

- `lib/search/bm25.js` 对应上游 `core.py` 的 `BM25`：`k1=1.5`、`b=0.75`、IDF 公式
  `log((N - freq + 0.5) / (freq + 0.5) + 1)` 一致；本仓库额外加了 CJK 二元分词。
- `lib/domain/design-system.js` 对应上游 `design_system.py` 的 `SEARCH_CONFIG`、
  `_find_reasoning_rule`、`_apply_reasoning`、`_select_best_match` 五步流程。
- `lib/domain/dials.js` 对应上游 `DIAL_TIERS`。**上游在 `137597b` 已包含三个 1-10 旋钮**，
  并非本仓库独有；本仓库做的是中文标签重实现与 DSH 工具封装。
- 本仓库自研部分：纯 JS、离线内置 JSON、中文词典与 CJK 分词、三个 DSH 工具与卡片输出。

## 2. 差异看板

**核对日期：2026-10-18** ｜ **上游来源：`main` 分支**
- 本仓库快照对应上游 `137597b`（2026-07-03），不是 `main` 的当前状态
- 计数来源 ①：`cli/assets/data/catalog-summary.json`（`verifiedAt: 2026-08-26`）
- 计数来源 ②：`landing.csv` / `react-performance.csv` / `app-interface.csv`（2026-10-18 下载后用 Python `csv.DictReader` 计数）
- 本仓库计数来源：`data/meta.json`

| 域 | 本仓库 | 上游 | 差值 | 说明 |
|---|---:|---:|---:|---|
| style（风格） | 84 | 88（total）/ 79（searchable）/ 50（active） | −4（vs total） | 上游口径有三种，本表用 total 对比 |
| color（调色板） | 192 | 192 | 0 | |
| product（产品类型） | 192 | 192 | 0 | |
| typography（字体搭配） | 74 | 74 | 0 | |
| ux（UX 规范） | 99 | 119 | **−20（−16.8%）** | 超过 10% 阈值，发版前应开 issue |
| reasoning（推理规则） | 161 | 192 | **−31（−16.1%）** | 超过 10% 阈值 |
| chart（图表） | 25 | 25 | 0 | |
| landing（落地页模式） | 34 | 34 | 0 | 实测 CSV |
| icons（图标） | 105 | 105 | 0 | |
| gsap（动效预设） | 16 | 17 | −1 | 上游字段名 `motionPresets` |
| react（React 性能） | 44 | 44 | 0 | 实测 CSV |
| web（移动端接口） | 30 | 32 | −2 | 实测 CSV |
| googleFonts | 1923 | 1934 | −11 | |
| stacks（技术栈） | 22 | 22 | 0 | |
| stackGuidelines（技术栈规范合计） | 1221 | 1271 | −50 | 由各 `stack:*` 求和 |

**结论**：结构同步不是瓶颈；内容落后集中在 **UX 规范**与**推理规则**两个域。
下一轮数据同步应优先补这两块，而不是重排代码。

## 3. 同步 SOP（6 步）

### Step 1 · 确定上游 ref

**不要用 `generated` 时间戳推断 ref。** 正确顺序是：先取候选 commit，再比对行数/字段，
只有全部域都对上才记录为 `upstreamRef`。

```bash
# 取 main 当前 commit
git ls-remote https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git refs/heads/main

# 历史数据变更点（按数据文件看提交历史）
git clone --filter=blob:none --no-checkout https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git /tmp/uiux-upstream
git -C /tmp/uiux-upstream log --oneline -- cli/assets/data/styles.csv cli/assets/data/ux-guidelines.csv cli/assets/data/ui-reasoning.csv

# 候选 commit 逐文件计数；全部域吻合才采用
git -C /tmp/uiux-upstream show <sha>:cli/assets/data/styles.csv | python -c "import sys,csv;print(len(list(csv.DictReader(sys.stdin))))"
```

把**实际数据对应的** commit SHA、提交时间记录到 `upstreamRef` / `upstreamRefDate`，
并在 `lineageVerifiedAt` 记录本次比对日期。

### Step 2 · 取上游数据

上游数据有两处：
- `cli/assets/data/*.csv`（推荐；本仓库快照匹配的是这一路径）
- `.claude/skills/ui-ux-pro-max/data/`（历史路径；在该 ref 下部分文件仍是旧版，
  例如 colors/products 为 161 行、typography 为 73 行）

> 两处并非始终相同。**以行级比对选中的路径为准**，并把选择记录到 `upstreamDataPath`。

至少取：`styles.csv` / `colors.csv` / `charts.csv` / `landing.csv` /
`products.csv` / `ux-guidelines.csv` / `typography.csv` / `icons.csv` /
`motion.csv` / `react-performance.csv` / `app-interface.csv` /
`google-fonts.csv` / `ui-reasoning.csv` / `stacks/*.csv`。

### Step 3 · 转换为 `data/index.json` + `data/fonts.json`

- 保持列名与上游 CSV 逐字一致（`tests/smoke.mjs` 与检索列配置依赖它们）。
- 转换后写回 `counts`（逐域 + `stack:*` + `reasoning` + `googleFonts`）。
- 更新 `generated`、`upstream`、`upstreamRef`、`upstreamRefDate`、
  `upstreamDataPath`、`sourcePath`、`syncedAt`、`lineageVerifiedAt`。
- 重生成 `data/meta.json`（`tests/check-package.mjs` 会逐项核对 `counts`）。

### Step 4 · 跑全量测试

```bash
npm test
```

`check-package` 会拦截：计数不一致、溯源字段缺失、files[] 缺失、BOM、生命周期脚本。
`smoke` 会拦截：检索列缺失导致的空结果。

### Step 5 · 更新差异看板

重新实测上游各域条数，更新 §2 的「核对日期 / 上游 / 差值」，不要沿用旧数字。
若某域落后 >10%，在 `CHANGELOG.md` 记录并开 issue。

### Step 6 · 更新文档数字

`README.md` / `README.en.md` / `SKILL.md` / `package.json.description` 中的能力数字
必须与新的 `meta.json` 一致；`tests/check-counts.mjs` 会自动检查。

## 4. 发版前检查清单

- [ ] `data/index.json` / `meta.json` 的 `upstreamRef` / `upstreamRefDate` /
      `lineageVerifiedAt` / `syncedAt` 已更新，且 ref 为真实数据 commit
- [ ] `npm test` 全绿
- [ ] 差异看板已按最新上游实测更新（带日期）
- [ ] 若某域落后 >10%，CHANGELOG 有记录 + issue
- [ ] README / SKILL.md / package.json 能力数字与 `meta.json` 一致
- [ ] `npm pack --dry-run` 确认 `data/` 与 `lib/` 在内、tests/docs 不在

## 5. 已知口径差异

- 上游 `styles` 同时提供 total / searchable / active / supplemental / deprecated；
  本仓库的 84 是**已转换进 `data/index.json` 的条数**，对应 `137597b` 的 styles.csv 行数，
  不宜直接与 `main` 的 total/searchable/active 画等号。
- 上游部分 CSV 含引号内换行；计数必须用 CSV 解析器（如 Python `csv`），不要用
  `wc -l` 或按行 `split`。
- 转码时部分代码示例的内部双引号被剥离（见 §1.1），这是已知数据瑕疵，不是血缘问题。
- 上游 `main` 持续变化；本文件的数字是**某次核对时点**的快照，不是实时值。
