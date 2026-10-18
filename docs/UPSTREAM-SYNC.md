# 上游同步 SOP 与差异看板

> 本项目的价值 = 上游设计数据库 × DSH 的离线中文形态。
> 数据库老化 = 产品价值衰减；本文件把「想起来才同步」变成「一条命令 + 一次 PR」。

## 1. 数据血缘

| 项 | 值 |
|---|---|
| 原始上游 | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)（MIT） |
| 同步路径 | `cli/assets/data/`（直接读上游 CSV，不再经 opencode 转码） |
| 当前快照 | `generated` / `syncedAt` = `2026-10-18T03:59:34.490Z`（同步时间） |
| 数据内容对应上游 ref | `56ea9cf174ed86786187daa9de0e6247cb0747e4`（2026-10-15T09:04:34+07:00） |
| 溯源字段 | `upstream` / `upstreamRef` / `upstreamRefKind` / `upstreamRefDate` / `upstreamDataPath` / `sourcePath` / `syncedAt` / `lineageVerifiedAt` |
| 守卫 | `tests/check-package.mjs` 断言字段非空、ref 为 40 位 commit、两份数据一致 |

> **历史说明**：1.2.0 的快照（84 / 99 / 161）来自上游 `137597b`，当时经
> `opencode/skills/ui-ux-pro-max/data/` 转码。1.3.0 改为直接从上游
> `cli/assets/data/` 同步，旧的引号转码瑕疵已消失。不要在文档里混用这两个来源。

### 1.1 本次同步结果

| 指标 | 1.2.0 | 1.3.0 | 上游 `56ea9cf` |
|---|---:|---:|---:|
| style | 84 | **88** | 88（total；searchable 79 / active 50） |
| ux | 99 | **119** | 119 |
| reasoning | 161 | **192** | 192 |
| gsap / motion | 16 | **17** | 17 |
| web / app-interface | 30 | **32** | 32 |
| googleFonts | 1923 | **1934** | 1934 |
| stackGuidelines | 1221 | **1271** | 1271 |
| totalRows | 4200 | **4319** | 4319 |

同步工具是 [`scripts/sync-upstream.mjs`](../scripts/sync-upstream.mjs)：
它用内置 CSV 解析器（支持引号、`""` 转义、字段内换行）读取上游 CSV，
生成 `data/index.json` / `data/fonts.json` / `data/meta.json`，不再手工转换。

### 1.2 代码层血缘

- `lib/search/bm25.js` 对应上游 `core.py` 的 `BM25`：`k1=1.5`、`b=0.75`、IDF 公式
  `log((N - freq + 0.5) / (freq + 0.5) + 1)` 一致；本仓库额外加了 CJK 二元分词。
- `lib/domain/design-system.js` 对应上游 `design_system.py` 的 `SEARCH_CONFIG`、
  `_find_reasoning_rule`、`_apply_reasoning`、`_select_best_match` 五步流程。
- `lib/domain/dials.js` 对应上游 `DIAL_TIERS`；上游在 `137597b` 已包含三个 1-10 旋钮，
  本仓库做的是中文标签重实现与 DSH 工具封装。
- 本仓库自研部分：纯 JS、离线内置 JSON、中文词典与 CJK 分词、三个 DSH 工具与卡片输出。

## 2. 差异看板

**核对日期：2026-10-18** ｜ **快照 ref：`56ea9cf`** ｜ **上游目录：`cli/assets/data/`**

| 域 | 本仓库 | 上游 `56ea9cf` | 差值 | 说明 |
|---|---:|---:|---:|---|
| style（风格） | 88 | 88 | 0 | 其中 deprecated 9 条默认不参与检索 |
| color（调色板） | 192 | 192 | 0 | |
| product（产品类型） | 192 | 192 | 0 | |
| typography（字体搭配） | 74 | 74 | 0 | |
| ux（UX 规范） | 119 | 119 | 0 | |
| reasoning（推理规则） | 192 | 192 | 0 | |
| chart（图表） | 25 | 25 | 0 | |
| landing（落地页模式） | 34 | 34 | 0 | |
| icons（图标） | 105 | 105 | 0 | |
| gsap（动效预设） | 17 | 17 | 0 | 上游字段名 `motionPresets` |
| react（React 性能） | 44 | 44 | 0 | |
| web（移动端接口） | 32 | 32 | 0 | |
| googleFonts | 1934 | 1934 | 0 | |
| stacks（技术栈） | 22 | 22 | 0 | |
| stackGuidelines（技术栈规范合计） | 1271 | 1271 | 0 | 由各 `stack:*` 求和 |

**结论**：当前快照与 `56ea9cf` 完全对齐。后续若上游继续增长：

```bash
npm run check:upstream
```

有差异时输出计数变化并以退出码 1 结束，可直接接 CI / 定时任务。

## 3. 同步 SOP（一条命令为主）

### Step 0 · 检查是否落后

```bash
npm run check:upstream
# 等价于：node scripts/sync-upstream.mjs --check
```

### Step 1 · 确定上游 ref

`--check` 默认比较 `main`。若要固定到某个提交（推荐，便于复现）：

```bash
node scripts/sync-upstream.mjs --check --ref <sha>
```

脚本会通过 `git ls-remote` 把分支名解析成完整 SHA；也可以用
`--ref-date <ISO>` 显式提供提交时间，避免依赖 GitHub API。

### Step 2 · 写入数据

```bash
node scripts/sync-upstream.mjs --write --ref <sha> --ref-date <ISO>
# 或：npm run sync:upstream -- --ref <sha> --ref-date <ISO>
```

脚本会更新：

- `data/index.json`（domains / stacks / reasoning / counts）
- `data/fonts.json`（googleFonts）
- `data/meta.json`（counts / totalRows / 溯源字段）

### Step 3 · 更新文档数字

`tests/check-counts.mjs` 会列出所有与 `meta.json` 不一致的文档。通常需要同步：

- `README.md` / `README.en.md`
- `skills/ui-ux-pro-max/SKILL.md`
- `package.json` 的 `description`
- 本文件的差异看板

### Step 4 · 跑全量测试

```bash
npm test
```

`check-package` 会拦截计数/溯源/文件清单问题；`smoke` 会拦截检索空结果；
`contract` 会拦截 schema 与 execute 返回不一致。

### Step 5 · 更新差异看板

重新运行 `npm run check:upstream`，把 §2 的「核对日期 / 上游 ref / 差值」更新。
若某域落后 >10%，在 `CHANGELOG.md` 记录并开 issue。

### Step 6 · 发版

数据更新建议走 minor 版本（如 1.2.0 → 1.3.0），并在 CHANGELOG 写清同步的 ref 与行数。

## 4. 实时同步：能做到什么程度

### 4.1 不推荐：运行时实时拉取

在每次工具调用时访问上游 / 或后台轮询，技术上可行，但会破坏本插件最核心的卖点：

| 代价 | 说明 |
|---|---|
| 离线失效 | 「数据完全内置、零网络」不再成立 |
| 延迟与失败 | 工具调用要等网络；上游 404/限流/改列会直接让工具失败 |
| 结果不确定 | 同一问题在不同时间/机器上结果不同，难以复现 |
| 供应链风险 | 运行时执行远端数据解析，需要额外的校验与信任边界 |
| 宿主约束 | DSH 插件应保持确定性、可回放；网络 I/O 会破坏这一点 |

**结论**：不建议做「每次调用都同步」。如果确实需要，应做成**显式 opt-in 的独立刷新命令**，
而不是工具执行路径的一部分。

### 4.2 推荐：定时检查 + 人工合并（近实时）

把「实时」降级为「按天/按周自动发现 + 人工合并」，既保持离线，又不会长期落后：

- 仓库已提供 [`.github/workflows/check-upstream.yml`](../.github/workflows/check-upstream.yml)：
  每周一 03:00 UTC 与手动触发时运行 `npm run check:upstream`；
  数据落后时 job 失败并通知维护者。
- 有意**不自动写数据、不直接推 main**：数据变更需要人工看 diff、更新文档数字、跑测试、提 PR。
- 若希望全自动，可把工作流改为
  `node scripts/sync-upstream.mjs --write && npm test` 后用 `gh pr create` 开 PR，
  仍然不要无人值守直接推 main。

这样最坏情况下数据落后一周，而不是落后一个版本周期；同时保留离线、可复现、可审计。

### 4.3 手动：一条命令

```bash
npm run check:upstream   # 只检查
npm run sync:upstream    # 写入数据
npm test                 # 验证
```

这是目前推荐的主路径：可审计、可回滚、不牺牲离线。

## 5. 发版前检查清单

- [ ] `npm run check:upstream` 显示与目标 ref 一致
- [ ] `data/index.json` / `meta.json` 的 `upstreamRef` / `upstreamRefDate` /
      `lineageVerifiedAt` / `syncedAt` 已更新
- [ ] `npm test` 全绿
- [ ] 差异看板已更新（带核对日期与 ref）
- [ ] 若某域落后 >10%，CHANGELOG 有记录 + issue
- [ ] README / SKILL.md / package.json 能力数字与 `meta.json` 一致
- [ ] `npm pack --dry-run` 确认 `data/` 与 `lib/` 在内、tests/docs 不在

## 6. 已知口径差异

- 上游 `styles` 同时提供 total / searchable / active / supplemental / deprecated；
  本仓库的 88 是**数据总行数**，检索默认排除 9 条 deprecated（见
  `lib/search/retriever.js` 的 `isDeprecated` / `asksForLegacy`）。
- 上游部分 CSV 含引号内换行；计数必须用 CSV 解析器（如 Python `csv` 或
  `scripts/sync-upstream.mjs` 内置解析器），不要用 `wc -l` 或按行 `split`。
- 上游 `main` 持续变化；本文件的数字是 `56ea9cf` 这一时点的快照，不是实时值。
