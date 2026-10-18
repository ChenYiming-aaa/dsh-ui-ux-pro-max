# 优化评估报告：原生 DSH 契约对齐（1.4.0 基线）

> 评估日期：2026-10-18
> 评估对象：`dsh-ui-ux-pro-max` 1.4.0 工作树（10 项内部修复已落地，尚未提交）
> 结论：**内部检索/健壮性修复已经不是当前瓶颈**。真正可优化、可落地的空间在
> **原生 DSH 契约**：技能正文的加载方式、超时语义、配置面、并发分类、错误结果与呈现。
> 共识别 12 项，其中 P0 3 项、P1 7 项、P2 2 项；逐项实施方案见
> [`docs/remediation-plan.md`](remediation-plan.md)。

## 1. 评估口径

### 1.1 原生依据

本报告只把下列公开契约当作“原生 DSH 行为”的依据：

| 来源 | 版本 | 用到的契约 |
|---|---|---|
| `@deepseek-ai/dsh-tools` | 0.2.1-rc.2（`.host-compat/host-0-2`） | `ToolDefinition`、`output.schema/render/presentationMeta`、`timeoutMs`、`isConcurrencySafe`、`presentResult`、执行流水线 |
| `@deepseek-ai/dsh-skill` | 0.2.1-rc.2 | `SkillSummary.whenToUse`、`SkillDefinition.content`、`SkillProvider.list/get`、`renderSkillContent`、`registerProvider` |
| `@deepseek-ai/cordis` | 4.0.5 | 插件 `Config` 通过 Standard Schema 校验、`apply(ctx, config)`、fiber 生命周期 |
| `@deepseek-ai/dsh-timeout` | 0.2.1-rc.2 | 超时策略的消费方是 `@deepseek-ai/dsh-tool-call-timeout-policy`，不是工具注册表 |

> 版本说明：工作树根 `node_modules` 解析到的是 **0.0.1-rc.1**（仅用于本机直接 import）；
> 0.1.1 / 0.2.0 / 0.2.1 三条 peer 线通过 `.host-compat/` 目录实跑。0.0.1 与 0.2.1 在
> `timeoutMs`、`whenToUse`、`presentResult` 上语义一致；涉及 0.2 新增的
> `projectContent` 等字段，本报告不展开。

### 1.2 本轮验证命令

```bash
npm test
npm pack --dry-run

# 三条宿主线（本机已实跑）
DSH_MODULE_ROOT=.host-compat/host-0-1 npm run verify:host
DSH_MODULE_ROOT=.host-compat/host-020 npm run verify:host
DSH_MODULE_ROOT=.host-compat/host-0-2 npm run verify:host
```

### 1.3 不在本轮范围

- 真实 GUI 中 `presentResult` 卡片的视觉验收；
- 会话回放（`tool/result` 持久化、`presentationMeta` 重放）；
- 0.3.0+ 宿主；
- 真实用户查询日志与端到端模型效果评估。

## 2. 实施前基线（已验证）

> 本节记录**实施前**的状态；S1–S10 落地后的结果见 §8。

| # | 事实 | 证据 |
|---|---|---|
| 1 | 全量测试通过 | 实施前 `npm test` → **585 ✅ / 0 ❌**；实施后见 §8 |
| 2 | 三条宿主线可加载 | `verify:host` 在 0.1.1-rc.1 / 0.2.0-rc.2 / 0.2.1-rc.2 各 6 项全过 |
| 3 | 发布物边界稳定 | 实施前 `npm pack` → 47 文件；实施后 49 文件（新增两个 lib 文件） |
| 4 | 注册路径正确 | `apply(ctx)` 注册 3 个工具 + 1 个技能 provider |
| 5 | 零运行时依赖 | `package.json` 无 `dependencies`；peer 为 cordis / dsh-skill / dsh-tools |
| 6 | 数据规模 | 4319 行；风格 88、调色板 192、字体 74、UX 119、图表 25、技术栈 22 |
| 7 | 超时声明存在 | `TIMEOUTS`：5000 / 3000 / 3000 ms |
| 8 | 无配置面 | `apply(ctx, _config)` 忽略 config；`cordis.patch.yml` 的 `config: {}` 是空对象 |
| 9 | 无并发分类 | 三个工具都没有 `isConcurrencySafe` |
| 10 | 呈现不完整 | 只有 `design_recommend` 有 `presentationMeta` + `presentResult` |
| 11 | 技能正文原样返回 | `lib/plugin/skill.js` 的 `get()` 直接返回 `SKILL.md` 全文 |
| 12 | 错误路径是“成功值” | `design_search` 对未知 stack 返回 `{ error, count: 0, results: [] }` |

## 3. 原生契约差距

> 下表是**实施前**识别出的差距；状态与证据见 §8。

### 3.1 总表

| ID | 差距 | 位置 | 原生契约 | 影响 | 优先级 |
|---|---|---|---|---|---|
| N1 | 技能正文含 YAML frontmatter | `lib/plugin/skill.js` `get()` | `SkillDefinition.content` 是“去除 provider 元数据后的 Markdown 正文” | 模型在 `<skill_content>` 里看到 `--- name: ...`，上下文噪音；后续 frontmatter 字段会泄漏 | P0 |
| N2 | 未使用 `whenToUse` / `path` / `metadata` | `lib/plugin/skill.js` 候选对象 | `SkillSummary.whenToUse`、`SkillSummary.path`、`SkillCandidate.metadata` | 发现侧只能用长 description 做路由；文件预览/诊断信息缺失 | P1 |
| N3 | provider 方法忽略 candidate / signal | `skillProvider.list/get` | `list(options)`、`get(candidate, options)`；应遵守 `options.signal` | 静态单技能下影响小，但违反契约；多技能/远程 provider 时不可用 | P1 |
| N4 | `timeoutMs` 被当成“已强制” | `lib/config.js`、`docs/DSH-COMPAT.md` §4 | 注册表**只声明不执行**；执行依赖 `@deepseek-ai/dsh-tool-call-timeout-policy` | 文档承诺了不存在的截止时间；声明 `timeoutMs` 还隐含“body 会响应 signal” | P0（仅文档） |
| N5 | 无配置 schema | `lib/plugin/index.js`、`cordis.patch.yml` | Cordis 用 `runtime.Config`（Standard Schema）校验插件 config | `config:` 写什么都不生效；无法按 profile 调条数/技能开关 | P1 |
| N6 | 未声明只读并发安全 | 三个工具 spec | 只有 `isConcurrencySafe() === true` 才允许并行；省略即独占 | 并行工具调用被串行化；首次 1.5MB 解析会阻塞同批调用 | P1 |
| N7 | 工具错误返回为成功值 | `lib/tools/design-search.js` | 抛错由注册表归一为 `isError: true`；成功值必须匹配 output schema | 未知 stack 在宿主侧是“成功”，UI/日志/重试策略都看不到失败 | P1 |
| N8 | 缺少 `presentResult` | `design-search.js` / `design-review.js` | `output.presentationMeta` + `presentResult` 提供可重放的 UI 卡片 | 搜索结果与审查结果回退到通用卡片，信息密度低 | P2 |
| N9 | `exec.signal` 未使用 | 三个 `execute(args)` | 异步工作应观察/转发 `exec.signal`；预取消不会调用 body | 当前全是同步 CPU（<40ms），实际影响低；但契约上未声明 | P2（文档） |
| N10 | 技能正文没有覆盖新行为 | `skills/ui-ux-pro-max/SKILL.md` | 技能正文是模型指令；`renderSkillContent` 原样注入 | 模型不知道 `product` 域、单字边界、platform 非硬过滤、fallback 语义 | P1 |
| N11 | `fallback` 对模型不可见 | `lib/presentation/search.js` | `render` 是模型可见内容；结构化值不自动进入上下文 | 单字兜底的 0.00 分默认条目会被当成检索命中 | P1 |
| N12 | 文档/报告声明漂移 | README、DSH-COMPAT、本报告 | 文档不得把未验证假设写成事实 | 版本、兼容线、超时语义、负例测试的可信度受损 | P0（文档） |

### 3.2 逐项证据

> 以下描述**实施前**的代码/文档状态；S1–S10 修正后的结果见 §8。

**N1 技能正文 frontmatter。** `skills/ui-ux-pro-max/SKILL.md` 以 `---` 开头；
`lib/plugin/skill.js` 的 `get()` 返回 `readFile(SKILL_BODY_URL, 'utf8')` 的完整内容。
而 `@deepseek-ai/dsh-skill` 对 `SkillDefinition.content` 的定义是
“Markdown instruction body after any provider-specific metadata removal”，
`renderSkillContent()` 会把 content 原样放进 `<skill_content>`。本轮用
`.host-compat/host-0-2` 实跑确认：`provider.get()` 的 content 头是
`"---\nname: ui-ux-pro-max\n..."`，`renderSkillContent()` 的 `<skill_content>` 里
同样带着 frontmatter。模型看到的是元数据 + 正文，而不是只看到指令正文。

**N2 `whenToUse`。** `SkillSummary.whenToUse` 是原生提供的“额外路由提示”字段；
当前候选只有 `description`，且 description 同时承担能力数字、工具名、使用场景三件事。
本轮实跑 `provider.get()` 返回的 `whenToUse` 是 `undefined`。这不是必须拆分，
但拆开后发现侧可以更稳地选技能，正文也不必重复同一段话。

**N3 provider 契约。** 原生 `get(candidate, options)` 会把 `list()` 返回的候选原样传回，
并要求 provider 在 `options.signal` 取消时尽快收敛。当前实现固定读同一个文件 URL、
忽略 candidate 与 signal；对“只有一个内置技能”的静态场景是可接受的简化，
但如果以后在同一 provider 里放第二个技能，就会读错文件。

**N4 超时。** `@deepseek-ai/dsh-tools` 的 README 明确写着：
“定义中的 `timeoutMs` 仅作声明之用：注册表绝不会强制执行截止时间；要强制执行，
必须使用 `@deepseek-ai/dsh-tool-call-timeout-policy` 包装层。” 当前插件没有挂这个
包装层，`docs/DSH-COMPAT.md` 却把 `TIMEOUTS` 描述成“100× 余量”的预算。
二者只能留一个：要么承认它是 advisory metadata，要么在宿主组合里挂 timeout policy。
插件本身无法保证后者（它不拥有宿主组合）。

**N5 配置。** Cordis 的 `resolveConfig(runtime, config)` 只在插件暴露 `Config` 时
调用 `Config['~standard'].validate(config)`；当前没有 `Config`，`apply` 也忽略第二参。
因此 `cordis.patch.yml` 的 `config: {}` 目前只是形式上的配置面。

**N6 并发。** `dsh-tools` 的并行调度只认工具定义上的
`isConcurrencySafe(args) === true`；省略、异常、非 `true` 都按独占处理。
三个工具都是只读查询，没有父级状态写入；这是最容易拿到的延迟收益，但必须同时
确认懒加载缓存（`getDb` / `getFontRows`）在并发下是幂等的。

**N7 错误语义。** 原生执行流水线把工具抛出的异常归一成 `isError: true`，
模型侧看到 `Error: ...`；成功值则必须通过 output schema 校验。
`design_search` 对未知 stack 返回带 `error` 字段的成功对象，`render` 虽然打印
“**错误：**”，但 `isError` 仍是 false。这是“看起来像错误、协议上是成功”的典型不一致。

**N8 呈现。** `design_recommend` 已经用 `presentationMeta` + `presentResult`
提供令牌摘要卡片；`design_search` / `design_review` 没有，UI 只能回退通用卡片。
这是 P2，因为它不影响模型正确性，只影响人看结果的效率。

**N9 取消。** 三个 `execute` 都只接收 args，不接收 `exec`。由于没有 async I/O，
body 会在毫秒级完成，原生注册表也无法硬杀同进程代码；当前没有实际危害。
但 `timeoutMs` 声明隐含“会响应 signal”，这一点需要在文档里说清楚，避免以后加入
异步数据源时忘记补 `exec.signal` 检查。

**N10 技能正文。** 当前 `SKILL.md` 的检索表只有 11 个领域（运行时 12 个，缺
`product`）；`platform` 写成“匹配优先”，没有说明严重度仍是第一排序键；
单字查询（`图/色/字/动`）与 `fallback: true` 完全没有写；开头“始终先用
`design_recommend`”与单字/素材查询冲突。行为已经改了，说明书没改，模型就会按旧
心智模型调用工具。

**N11 fallback 可见性。** `search()` 在单字领域兜底时给结果打 `fallback: true`，
`score` 为 0；`formatSearchResult` 不区分兜底与命中。原生 `render` 是模型可见内容，
因此模型看到的是“相关度 0.00 的命中”，而不是“这是领域默认条目”。

**N12 文档漂移。** 已核实的具体漂移：

- `README.md` / `README.en.md` 的“仓库版本”仍写 1.3.0，`package.json` 是 1.4.0；
- 兼容线写 `0.1.1-rc.2`，而 `docs/DSH-COMPAT.md` 与 `.host-compat/host-0-1`
  实际是 `0.1.1-rc.1`；
- `README.en.md` 仍称真实宿主验证“depends on a local DSH install and is not shipped”，
  但 `tests/host/` 与 `npm run verify:host` 已经是可移植的；
- `README.md` 的工具表仍把 `platform` 写成“匹配优先、不匹配降权”，
  没有说明严重度仍是第一排序键、降权后仍保留（`README.en.md` 的工具表则完全没有
  `platform` 语义）；与本报告 N10 的 `SKILL.md` 问题同源；
- `docs/DSH-COMPAT.md` §4 把 `TIMEOUTS` 写成已生效的预算（见 N4）；
- 1.4.0 报告中“负例注入确认守卫非恒真”没有对应的入库测试，属于人工证据，
  不应和其他“已自动化”的断言并列。

## 4. 优先级与批次

### P0（先做，低风险、纠错为主）

| ID | 动作 | 产出 |
|---|---|---|
| N1 | 技能正文去 frontmatter，正文只返回指令 | `skill.js` 解析 + host 测试 |
| N4 | 把 `timeoutMs` 改为“advisory metadata”表述 | `DSH-COMPAT.md`、`config.js` 注释 |
| N12 | 修正版本/兼容线/可移植验证/负例表述 | README 中英、DSH-COMPAT、本报告 |

### P1（行为改进，需回归）

| ID | 动作 | 产出 |
|---|---|---|
| N2 | 候选补 `whenToUse` / `path` / `metadata` | `skill.js` + 目录测试 |
| N3 | provider 尊重 candidate 与 `options.signal` | `skill.js` + 单测 |
| N5 | 增加轻量配置面（`maxResults` / `reviewRules` / `skill`） | `config.js` + `buildTools(config)` |
| N6 | 三个只读工具声明 `isConcurrencySafe: () => true` | 工具 spec + 并发测试 |
| N7 | 未知 stack 改为抛错，由宿主归一为 `isError` | `design-search.js` + contract 测试 |
| N10 | 技能正文补 `product` / 单字 / platform / 结果解读 | `SKILL.md` + 内容守卫 |
| N11 | 单字兜底在 Markdown 中显式标注 | `presentation/search.js` + 测试 |

### P2（体验/契约完善）

| ID | 动作 | 产出 |
|---|---|---|
| N8 | search/review 补 `presentationMeta` + `presentResult` | 两个工具 + 纯函数测试 |
| N9 | 文档说明同步 CPU 不响应 signal 的边界 | `DSH-COMPAT.md` |

## 5. 不建议做的事

1. **不要在插件内自己实现 timeout 包装层。** 工具体是同步 CPU（冷启动 ~36ms），
   JS 定时器无法抢占；自建 wrapper 只能“标记超时”，不能停止工作，反而制造第二套
   截止时间语义。宿主若需要，应由 `@deepseek-ai/dsh-tool-call-timeout-policy` 统一提供。
2. **不要为了 `whenToUse` 引入 YAML 依赖。** `SKILL.md` 的 frontmatter 只有
   少量标量字段，一个几十行的 `splitFrontmatter()` 足够；引入 YAML 解析器会破坏
   “零第三方运行时依赖”。
3. **不要在 `apply()` 里预热 1.5MB `index.json`。** 首次调用 ~36ms 已在可接受范围；
   预热会把成本搬到插件加载期，并让“加载即 I/O”的问题回归。
4. **不要把 `isConcurrencySafe` 当成无条件优化。** 只有确认没有父级状态写入、
   缓存并发幂等时才声明；以后加入异步数据源要重新评估。
5. **不要把 `skill` 正文塞进 `description`。** 原生已有 `whenToUse` 字段；
   正文应留在 `content`，目录只拿路由所需的最短信息。

## 6. 验收基线

改动后至少满足：

```bash
npm test                          # 实施前 585；实施后 663，0 失败
npm pack --dry-run                # 实施后 49 文件；skills/ 入包
DSH_MODULE_ROOT=.host-compat/host-0-1 npm run verify:host
DSH_MODULE_ROOT=.host-compat/host-020 npm run verify:host
DSH_MODULE_ROOT=.host-compat/host-0-2 npm run verify:host
```

新增的 host 断言至少覆盖：

- `provider.get(candidate)` 返回的 `content` 不以 `---` 开头；
- `renderSkillContent(definition)` 的 `<skill_content>` 中不含 frontmatter 分隔线；
- `SkillSummary.whenToUse` 为非空字符串；
- 三个定义在**合法参数**下 `isConcurrencySafe(...)` 为 `true`（非法参数由宿主 fail-closed）；
- `design_search({stack: 'not-a-stack'})` 走 `isError`，而不是成功值。

## 7. 结论

1.4.0 的 10 项内部修复可以视为**基线**，不再重复；它们没有解决“插件如何按原生 DSH
契约工作”的问题。下一阶段应按 P0 → P1 → P2 的批次推进，而不是继续加检索规则。
P0 三项（技能正文、超时表述、文档漂移）以纠错为主、风险最低，应先进一个批次；
P1 七项是真正影响模型/宿主体验的部分；P2 两项是呈现与边界说明。

> 本报告只描述现状与方向。具体文件、函数、代码形态、测试断言和回滚步骤见
> [`docs/remediation-plan.md`](remediation-plan.md)。

## 8. 实施结果（2026-10-18）

S1–S10 已按批次落地；每项完成后都跑了对应测试与三条宿主线。最终结果：

| 验证 | 结果 |
|---|---|
| `npm test` | **663 ✅ / 0 ❌**（实施前 585；新增 `check-config` 21 条、`check-skill` 44 条及 smoke/contract 断言；低风险补充后 675，见 §9） |
| `verify:host` @ 0.1.1-rc.1 | ✅ schema / defineTool / execute / render / 注册 / 技能正文 / config 全过 |
| `verify:host` @ 0.2.0-rc.2 | ✅ 同上 |
| `verify:host` @ 0.2.1-rc.2 | ✅ 同上 |
| `npm pack --dry-run` | **49 文件**（实施前 47；新增 `lib/plugin/config.js`、`lib/plugin/skill-body.js`） |

### 逐项状态

| 项 | 差距 | 状态 | 证据 |
|---|---|---|---|
| S1 | N1 技能正文 frontmatter | ✅ | `skill-body.js` 拆 frontmatter；host 断言「技能正文已去除 frontmatter」「renderSkillContent 不含 frontmatter」在三条线通过 |
| S2 | N2/N3 `whenToUse` / candidate / signal | ✅ | 候选含 `whenToUse`/`path`/`metadata`；host 断言 `provider.list/get 遵守 signal`、缺少 candidate 时回退内置 skill |
| S3 | N4 timeout 语义 | ✅ | `config.js` 注释 + `DSH-COMPAT.md` §4 明确 advisory metadata；`ARCHITECTURE` 同步 |
| S4 | N5 配置面 | ✅ | `config.js` + Standard Schema；`check-config` 21 条；host 断言 `config.maxResults=1`、`reviewRules=2`、`skill=false` 生效 |
| S5 | N6 `isConcurrencySafe` | ✅ | 三个工具声明；`contract` + host 断言保留（合法参数） |
| S6 | N7 错误语义 | ✅ | 未知 stack 抛错；`contract` 断言 rejection，host 断言非法 stack 被拒绝 |
| S7 | N8 presentation | ✅ | search/review 补 `presentationMeta` + `presentResult`；`contract` + host 断言卡片/摘要 |
| S8 | N9 取消边界 | ✅ | `DSH-COMPAT.md` §4.4；三个 `execute` 注明同步实现 |
| S9 | N10/N11 技能正文 + fallback | ✅ | `check-skill` 44 条；`smoke` 断言兜底标注、正常命中不误标 |
| S10 | N12 文档漂移 | ✅ | README 版本/兼容线/工具表/可移植验证对齐；`check-package` 版本引用 1.4.0；CHANGELOG 补契约章节 |

### 本轮未做（不属于 S1–S10）

- `includeDeprecated` / 检索权重进入配置面（需要改 `search()` 签名与全局排序）；
- 0.2.1 的 `projectContent`（当前没有使用场景）；
- 真实 GUI 卡片视觉验收与会话回放；
- 0.3.0+ 宿主。

### 版本

npm 当前最新仍是 **1.3.0**；本工作树为 **1.4.0 未发布**，本轮改动并入 1.4.0。
若 1.4.0 已发布，则这些行为变更应发 **1.4.1**（patch），并在 CHANGELOG 中保留
「非法 stack 错误语义 / 技能正文去 frontmatter」两条行为说明。

## 9. 低风险补充（2026-10-18）

在 S1–S10 之后补了三项低风险优化：

| 项 | 内容 | 验证 |
|---|---|---|
| per-call `includeDeprecated` | `design_search` 可选参数，默认 `false`；只放行 `Status=deprecated`，不改变查询词/排序；只作用于 search，不影响 recommend | contract 断言 include=true 召回 deprecated、默认仍排除；三条 host 线断言生效 |
| 紧凑卡片 | search/review 的 `presentResult` 改为“命中数 + 最多 3 条”摘要，完整 Markdown 仍在 render / 结构化结果 | contract 断言卡片不含 `### 结果`/`### 交付前`；host 断卡片 <600 字符 |
| `VERIFIED_HOST` 对齐 | `0.2.0-rc.2` → 已实测的 `0.2.1-rc.2`，peer 区间不变 | check-package 通过；三条宿主线实跑 0.1.1 / 0.2.0 / 0.2.1 全过 |

最终验证：

| 验证 | 结果 |
|---|---|
| `npm test` | **675 ✅ / 0 ❌** |
| `verify:host` @ 0.1.1-rc.1 / 0.2.0-rc.2 / 0.2.1-rc.2 | ✅ 全过（真实 `.host-compat` 安装，版本分别正确解析） |
| `npm pack --dry-run` | **49 文件** |

> 备注：`.host-compat/` 被 `.gitignore` 忽略，可能被清理；一旦缺失，
> `verify:host` 会回退到本机 `node_modules`（0.0.1-rc.1）。跑矩阵前应先确认
> `DSH_MODULE_ROOT` 指向的目录里 `dsh-tools` 版本正确，不能只看“通过”。
