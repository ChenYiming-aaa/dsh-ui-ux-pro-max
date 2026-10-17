# 上游同步 SOP 与差异看板

> 本项目的价值 = 上游设计数据库 × DSH 的离线中文形态。
> 数据库老化 = 产品价值衰减；本文件把「想起来才同步」变成「每次发版顺手做」。

## 1. 数据血缘

| 项 | 值 |
|---|---|
| 原始上游 | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)（MIT） |
| 数据转取路径 | `opencode/skills/ui-ux-pro-max/data/`（见 `data/index.json` 的 `sourcePath`） |
| 当前快照 | `data/index.json` / `data/meta.json` 的 `generated` = `2026-08-19T09:37:40.268Z` |
| 快照对应上游 ref | `8a1a6d857332da32252d77365da90c3f6293b47b`（2026-08-18T18:16:41Z，按 `commits?until=<generated>` 取得） |
| 溯源字段 | `upstream` / `upstreamRef` / `upstreamRefKind` / `upstreamRefDate` / `sourcePath` / `syncedAt` |
| 守卫 | `tests/check-package.mjs` 断言两份数据的溯源字段非空且一致 |

> 说明：`upstreamRef` 是**快照时间点的上游提交**，用于回答「我们基于哪个版本」；
> 数据经 opencode 路径转出，因此不保证与上游 CSV 字节级一致。下次同步时把 ref
> 更新为实际取数 commit，不要沿用旧值。

## 2. 差异看板

**核对日期：2026-10-18** ｜ **上游来源：`main` 分支**
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

```bash
# 取 main 当前 commit
git ls-remote https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git refs/heads/main
# 或按日期定位（与本次快照的做法一致）
curl -s "https://api.github.com/repos/nextlevelbuilder/ui-ux-pro-max-skill/commits?until=<ISO时间>&per_page=1"
```

把 commit SHA、提交时间记录到 `upstreamRef` / `upstreamRefDate`。

### Step 2 · 取上游数据

上游数据有两处：
- `cli/assets/data/*.csv`（推荐，结构与本仓库 `data/index.json` 对应）
- `.claude/skills/ui-ux-pro-max/data/`（历史路径；若使用，`sourcePath` 要如实记录）

至少取：`styles.csv` / `colors.csv` / `charts.csv` / `landing.csv` /
`products.csv` / `ux-guidelines.csv` / `typography.csv` / `icons.csv` /
`motion.csv` / `react-performance.csv` / `app-interface.csv` /
`google-fonts.csv` / `ui-reasoning.csv` / `stacks/*.csv`。

### Step 3 · 转换为 `data/index.json` + `data/fonts.json`

- 保持列名与上游 CSV 逐字一致（`tests/smoke.mjs` 与检索列配置依赖它们）。
- 转换后写回 `counts`（逐域 + `stack:*` + `reasoning` + `googleFonts`）。
- 更新 `generated`、`upstream`、`upstreamRef`、`upstreamRefDate`、`sourcePath`、`syncedAt`。
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

- [ ] `data/index.json` / `meta.json` 的 `upstreamRef` / `syncedAt` 已更新
- [ ] `npm test` 全绿
- [ ] 差异看板已按最新上游实测更新（带日期）
- [ ] 若某域落后 >10%，CHANGELOG 有记录 + issue
- [ ] README / SKILL.md / package.json 能力数字与 `meta.json` 一致
- [ ] `npm pack --dry-run` 确认 `data/` 与 `lib/` 在内、tests/docs 不在

## 5. 已知口径差异

- 上游 `styles` 同时提供 total / searchable / active / supplemental / deprecated；
  本仓库的 84 是**已转换进 `data/index.json` 的条数**，不宜直接与某一个上游口径画等号。
- 上游部分 CSV 含引号内换行；计数必须用 CSV 解析器（如 Python `csv`），不要用
  `wc -l` 或按行 `split`。
- 上游 `main` 持续变化；本文件的数字是**某次核对时点**的快照，不是实时值。
