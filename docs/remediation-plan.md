# 可实施优化方案：按原生 DSH 契约落地

> 配套文档：[`docs/optimization-report.md`](optimization-report.md)
> 基线：`dsh-ui-ux-pro-max` 1.4.0 工作树（实施前 `npm test` 585 ✅ / 0 ❌；
> 实施结果见 [`docs/optimization-report.md`](optimization-report.md) §8）
> 原则：**先纠错、再补契约、最后做体验**；每项独立可回滚，每批都跑三条宿主线。

## 0. 执行总览

| 批次 | 项 | 为什么这个顺序 | 行为变化 |
|---|---|---|---|
| A（P0） | S1 技能正文、S3 超时表述、S10 文档漂移 | 不改检索/输出；S1 只改模型看到的技能正文 | S1 是（仅技能正文）；S3/S10 否 |
| B（P1） | S2 技能元数据、S4 配置面、S5 并发、S6 错误语义、S9 技能正文 + fallback | 需要回归真实工具输出 | 是（局部） |
| C（P2） | S7 呈现、S8 取消边界 | 只影响 UI 卡片与文档说明 | 否 |

> 编号（S1–S10）只用于索引；执行顺序以上表的批次为准。

每批完成后必须执行：

```bash
npm test
DSH_MODULE_ROOT=.host-compat/host-0-1 npm run verify:host
DSH_MODULE_ROOT=.host-compat/host-020 npm run verify:host
DSH_MODULE_ROOT=.host-compat/host-0-2 npm run verify:host
npm pack --dry-run
```

验收基线：测试只增不减、0 失败；`npm pack` 实施后 49 文件（新增两个 lib 文件）；
三条宿主线全过。
如果某项改变了模型可见结果，额外记录到 `CHANGELOG.md` 的 1.4.0 条目。

---

## S1（P0）技能正文去 frontmatter，正文只返回指令

**对应差距**：N1。

**现状与证据**

- `skills/ui-ux-pro-max/SKILL.md` 第 1 行是 `---`，frontmatter 含 `name` / `description`。
- `lib/plugin/skill.js` 的 `get()` 返回 `readFile(SKILL_BODY_URL, 'utf8')` 的完整文本。
- 原生 `SkillDefinition.content` 的定义是“去除 provider 元数据后的 Markdown 正文”；
  `renderSkillContent()` 会把 content 原样放进 `<skill_content>`。

**实施**

1. 在 `lib/plugin/skill.js` 增加一个不依赖 YAML 的 `splitFrontmatter(raw)`：
   - 去掉 UTF-8 BOM；
   - 只匹配文件开头的 `---\n...\n---\n`；
   - 只解析 `key: value` 标量（`name` / `description` / `whenToUse` 足够）；
   - 解析失败时返回 `{ data: {}, body: raw }`，保证永远不因 frontmatter 格式问题丢正文。
2. `list(options)` 读取一次文件，返回：
   - `description: data.description || SKILL_DESCRIPTION`
   - `whenToUse: data.whenToUse || DEFAULT_WHEN_TO_USE`
   - `path: fileURLToPath(SKILL_BODY_URL)`
   - `metadata: data`
   - 其余字段保持现状（`rank` / `locator` / `source` / `provider` / `resourceBase` / `invocation`）。
3. `get(candidate, options)` 用 `candidate.locator`（URL）读文件，返回 `content: body`
   （已去 frontmatter），并复用 `list` 的元数据逻辑。
4. 在 `skills/ui-ux-pro-max/SKILL.md` frontmatter 增加：
   ```yaml
   whenToUse: 新建或改造界面、评审 UX、选风格/配色/字体、查图表/动效/技术栈规范时使用。
   ```
5. `SKILL_DESCRIPTION` 只保留“短描述 + 能力数字”，使用场景移到 `whenToUse`。

**代码形态（示意）**

```js
// lib/plugin/skill.js
const SKILL_PATH = fileURLToPath(SKILL_BODY_URL)

function splitFrontmatter(raw) {
  const text = String(raw).replace(/^\uFEFF/, '')
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { data: {}, body: text }
  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/)
    if (kv) data[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '')
  }
  return { data, body: text.slice(match[0].length) }
}

async function readSkill() {
  const raw = await readFile(SKILL_BODY_URL, 'utf8')
  return splitFrontmatter(raw)
}
```

**验收**

- host 断言：`provider.get(candidate)` 的 `content` 不以 `---` 开头，且不含
  `\nname: ui-ux-pro-max`；
- `renderSkillContent(definition)` 的结果以 `<skill_content` 开头，正文含
  `# UI/UX 设计智能库`；
- 全量测试不回归（实施前 585 条）；
- `SKILL.md` 的正文仍含能力数字（`tests/check-counts.mjs` 的 6 项模式不受影响）。

**风险 / 回滚**

- frontmatter 解析失败时回退到原文，模型最多看到旧内容，不会丢正文；
- 如果未来 frontmatter 出现嵌套结构，`splitFrontmatter` 不解析它，只把它放进
  `metadata` 的原始键值（当前不需要）；
- 回滚只需恢复 `get()` 的原始读文件逻辑，frontmatter 不会被修改。

---

## S2（P1）技能元数据与 provider 契约

**对应差距**：N2、N3。

**实施**

1. 候选对象补 `whenToUse` / `path` / `metadata`（S1 已做）。
2. `list(options = {})`：`options.signal?.aborted` 时返回 `[]`。
3. `get(candidate, options = {})`：
   - `options.signal?.aborted` 时返回 `undefined`；
   - 使用 `candidate?.locator`，缺失时回退 `SKILL_BODY_URL`；
   - 返回的 `name` 必须等于 `candidate.name`（原生会校验）；
   - 不缓存正文（原生注册表不缓存定义，provider 每次重新读取）。
4. `registerProvider` 的工厂仍然返回静态 provider；静态文件无需 `control.invalidate`。
   在代码注释里写明：如果以后改为多技能/远程源，必须保留 `control` 并按需调用
   `invalidate()`。

**验收**

- `provider.list()` 返回的候选含 `whenToUse`、`path`、`metadata`；
- `provider.get(candidate)` 的名称与候选一致；
- 用 `AbortController` 预取消后，`list` 返回 `[]`、`get` 返回 `undefined`；
- `verify:host` 的 provider 断言扩展到 `get()`。

**风险 / 回滚**

- 低；`get` 的回退路径保证旧行为可用。

---

## S3（P0）把 `timeoutMs` 表述改成 advisory metadata

**对应差距**：N4。

**现状**

`lib/config.js` 的 `TIMEOUTS` 是 5000 / 3000 / 3000；`docs/DSH-COMPAT.md` §4 写成
“冷启动 100× 以上余量”，容易被读成“注册表会强制超时”。

**原生事实**

`@deepseek-ai/dsh-tools` README（0.2.1）明确：
“定义中的 `timeoutMs` 仅作声明之用：注册表绝不会强制执行截止时间；要强制执行，
必须使用 `@deepseek-ai/dsh-tool-call-timeout-policy` 包装层。”

**实施**

1. `lib/config.js` 的 `TIMEOUTS` 注释改为：
   - “advisory metadata，不是 enforced deadline”；
   - “宿主若挂载 `@deepseek-ai/dsh-tool-call-timeout-policy`，由该包装层消费”；
   - “工具体为同步 CPU，不响应 `exec.signal`；加入异步 I/O 时必须补取消检查”。
2. `docs/DSH-COMPAT.md` §4 增加一段“超时语义”，把实测延迟和强制截止时间分开：
   - 实测：模块加载 ~20ms、首次 recommend ~36ms、后续 ~1ms；
   - 声明：`TIMEOUTS` 只是提示；
   - 强制：需要宿主组合里的 timeout policy，本插件不提供。
3. 不修改 `timeoutMs` 数值，不新增 wrapper。

**验收**

- `grep` 文档中不再出现“超时预算已生效/100× 余量”这类表述；
- `docs/DSH-COMPAT.md` 明确写出“declarative only”；
- `npm test` 不变。

**风险 / 回滚**

- 纯文档；无代码行为变化。

---

## S4（P1）增加轻量配置面

**对应差距**：N5。

**目标**

让 `cordis.patch.yml` 的 `config:` 真正生效，但只做**三个低风险字段**：

| 字段 | 默认 | 范围 | 作用 |
|---|---|---|---|
| `maxResults` | 3 | 1–8 | `design_search` 未显式传 `maxResults` 时的默认值 |
| `reviewRules` | 8 | 1–20 | `design_review` 未显式传 `maxRules` 时的默认值 |
| `skill` | true | boolean | 是否注册内置 `ui-ux-pro-max` 技能 |

**为什么不做 `includeDeprecated` / 检索权重**

这两个字段需要改 `search()` / `buildQueryTerms()` 的签名和全局排序，属于第二批；
先把“配置面存在且可验证”做出来，再决定是否扩大。

**实施**

1. 新增 `lib/plugin/config.js`（L5，不 import DSH API）：
   ```js
   export const DEFAULT_CONFIG = Object.freeze({ maxResults: 3, reviewRules: 8, skill: true })

   export function normalizeConfig(raw = {}) {
     if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
       throw new TypeError('config 必须是对象')
     }
     const value = { ...DEFAULT_CONFIG, ...raw }
     const int = (name, min, max) => {
       const n = value[name]
       if (!Number.isInteger(n) || n < min || n > max) {
         throw new TypeError(`${name} 必须是 ${min}-${max} 的整数`)
       }
       return n
     }
     if (typeof value.skill !== 'boolean') throw new TypeError('skill 必须是布尔值')
     return Object.freeze({
       maxResults: int('maxResults', 1, 8),
       reviewRules: int('reviewRules', 1, 20),
       skill: value.skill,
     })
   }

   export const Config = {
     '~standard': {
       version: 1,
       vendor: 'dsh-ui-ux-pro-max',
       validate(value = {}) {
         try { return { value: normalizeConfig(value) } }
         catch (error) { return { issues: [{ message: error.message, path: [] }] } }
       },
     },
   }
   ```
   这里用 Standard Schema 而不是引入 `@deepseek-ai/schemastery`，避免新增运行时依赖。
   已用 `cordis@4.0.5` 的 `resolveConfig()` 验证：该形状返回 `{ maxResults: 5 }`；
   `issues` 会被归一为 `ValidationError`。
2. `index.js` 增加 `export { Config } from './lib/plugin/config.js'`，
   让 Cordis 的 `resolveConfig(runtime, config)` 有机会校验。
3. `lib/plugin/index.js`：
   - `apply(ctx, rawConfig = {})` 先 `const config = normalizeConfig(rawConfig)`；
   - `buildTools(config)` 给 `design_search` / `design_review` 的 `execute` 注入默认值：
     ```js
     const DEFAULTS = {
       design_search: c => ({ maxResults: c.maxResults }),
       design_review: c => ({ maxRules: c.reviewRules }),
     }
     function withDefaults(spec, config) {
       const defaults = DEFAULTS[spec.name]?.(config)
       if (!defaults) return spec
       return {
         ...spec,
         async execute(args, exec) {
           return spec.execute({ ...defaults, ...args }, exec)
         },
       }
     }
     ```
   - `skill: false` 时跳过 `ctx.inject(['skills'], …)`，但仍注册三个工具。
4. `cordis.patch.yml` 的 `config` 写成默认值示例（`maxResults: 3` 等），方便用户照抄。
5. `tests/` 增加：
   - `normalizeConfig({})` 等于默认；
   - `normalizeConfig({ maxResults: 0 })` / `{ maxResults: 9 }` 抛错；
   - `normalizeConfig({ reviewRules: '8' })` 抛错（不做隐式字符串转数字）；
   - `Config['~standard'].validate({ maxResults: 5 })` 返回 `value.maxResults === 5`；
   - `buildTools({ maxResults: 1 })[2].execute({ query: '...' })` 只返回 1 条。

**验收**

- `apply(ctx, {})` 行为与当前逐字一致；
- `apply(ctx, { maxResults: 1 })` 后 `design_search` 默认 1 条；
- `skill: false` 时不注册 provider，工具仍可用；
- `verify:host` 仍全过（`Config` 导出不影响 `apply`）。

**风险 / 回滚**

- `Config` 的 Standard Schema 形状以 Cordis `resolveConfig` 为准；如果目标宿主的 loader
  只传 `apply` 而不读 `Config`，`apply` 内的 `normalizeConfig` 仍会校验，功能不受影响。
- 回滚：删除 `config.js`、恢复 `buildTools()` 无参、`apply` 忽略第二参。

---

## S5（P1）三个只读工具声明 `isConcurrencySafe`

**对应差距**：N6。

**实施**

1. 在三个工具对象上增加：
   ```js
   isConcurrencySafe: () => true,
   ```
2. `lib/tools/contracts.js` 的 `ToolSpec` typedef 补 `isConcurrencySafe?: Function`。
   已用 `dsh-tools@0.2.1-rc.2` 的 `defineTool()` 验证：该字段会被保留，
   `defineTool({ ...spec, isConcurrencySafe: () => true }).isConcurrencySafe({})` 返回 `true`。
3. 确认并发安全前提：
   - `getDb()` / `getFontRows()` 是同步懒加载单例；
   - `_indexCache` 只按行数组缓存 BM25，写入是幂等的；
   - 三个 `execute` 没有 `await`，也没有父级状态写入。
   如果未来加入异步 I/O 或可写缓存，必须重新评估。
4. 测试：
   - `toolSpecs.every(t => t.isConcurrencySafe?.({}) === true)`；
   - `verify:host` 中对 `defineTool(spec)` 结果断言该字段被保留（如果宿主实现保留）；
   - 并行调用 `design_search` 两次，结果集与串行一致（可选，使用 `Promise.all`）。

**验收**

- 原生 `ToolRegistry.executionMode` 对三个工具返回 `{ kind: 'parallel' }`
  （需要一个最小 registry 夹具；或在 host 测试里用 `defineTool` + `executionMode`）；
- 现有测试不回归。

**风险 / 回滚**

- 低；删除三行即可回滚。若发现缓存竞争，改为只给 `design_search` 声明。

---

## S6（P1）未知 stack 改为抛错，交给宿主归一为 `isError`

**对应差距**：N7。

**现状**

`lib/tools/design-search.js`：

```js
const result = searchStack(args.query, args.stack, maxResults)
if (result.error) return { error: result.error, domain: 'stack', query: args.query, count: 0, results: [] }
```

原生执行流水线把抛出异常归一为 `isError: true`；返回对象则是成功值。

**实施**

1. 改为：

```js
const result = searchStack(args.query, args.stack, maxResults)
if (result.error) throw new Error(result.error)
```

2. `lib/tools/contracts.js` 的 `SearchResult` typedef 删除 `error` 字段
   （`presentation/search.js` 的错误分支保留，用于兜底渲染）。
3. `tests/contract.mjs` 的错误用例改为断言 rejection：

```js
let message = ''
try {
  await tool.execute({ query: 'x', stack: 'not-a-stack' }, exec)
} catch (error) {
  message = error.message
}
assert(/未知技术栈/.test(message), '未知 stack 走 isError，而不是成功值')
```

4. `tests/host/verify-host.mjs` 增加一条：
   - 调用 `design_search` 的 `stack: 'not-a-stack'` 时，`tool.execute` 应 reject，
     且 `error.message` 匹配 `/未知技术栈/`。

**验收**

- 直接调用 `design_search` 的无效 stack 会 reject；
- 原生注册表侧表现为 `isError: true`（host 测试）；
- 参数 enum 仍然让模型在 `defineTool` 层就被拦住（`INVALID_ARGS`），
  这条路径主要防御内部/未来调用。

**风险 / 回滚**

- 行为变化：以前返回 `{ error }` 的调用方会收到异常。项目内只有 `contract.mjs` 依赖它，
  已同步修改；外部调用方需要知道这是 1.4.0 的行为变更，写进 CHANGELOG。

---

## S7（P2）补全 `presentationMeta` / `presentResult`

**对应差距**：N8。

**实施**

1. `design_search` 的 `output` 增加：

```js
presentationMeta(_args, value) {
  return { domain: value.domain, count: value.count, query: value.query }
},
presentResult(_args, result) {
  if (result?.isError) return undefined
  const meta = result?.meta
  if (!meta || typeof meta !== 'object') return undefined
  return { card: 'generic', title: `检索：${meta.query}`, content: result.content }
},
```

2. `design_review` 的 `output` 增加：

```js
presentationMeta(_args, value) {
  return {
    target: value.target,
    matchedRules: value.summary.matchedRules,
    bySeverity: value.summary.bySeverity,
  }
},
presentResult(_args, result) {
  if (result?.isError) return undefined
  const meta = result?.meta
  if (!meta || typeof meta !== 'object') return undefined
  return { card: 'generic', title: `审查：${meta.target}`, content: result.content }
},
```

3. 测试：纯函数调用，传入 `{ isError: false, content: [{ type: 'text', text: 'x' }], meta: {...} }`，
   断言 `card === 'generic'` 且 content 非空；`isError: true` 返回 `undefined`。

**验收**

- `presentResult` 不读取外部状态、不做 I/O；
- `verify:host` 的 `presentResult` 断言（如果宿主定义了该方法）通过；
- 现有 `design_recommend` 的卡片行为不变。

**风险 / 回滚**

- 低；删除两个方法即可回退到通用卡片。

---

## S8（P2）取消边界写进文档，不新增代码

**对应差距**：N9。

**理由**

三个工具体都是同步 CPU，没有 `await`、没有网络、没有文件写；原生注册表在 body
开始前会短路预取消调用，开始后的同步计算无法被硬杀。给同步函数加一个永远
来不及触发的 `AbortSignal` 检查没有收益，反而制造“已支持取消”的错觉。

**实施**

1. `docs/DSH-COMPAT.md` 增加“取消语义”小节：
   - 预取消：注册表在 body 前短路（`ABORTED_BEFORE_DISPATCH`）；
   - 运行中：同步 CPU 不响应 `exec.signal`，但单次 <40ms，可视为有限工作；
   - 未来：加入异步数据源/远程 provider 时，`execute(args, exec)` 必须检查
     `exec.signal` 并在阶段边界退出。
2. 在三个 `execute` 的 JSDoc 里补一句“同步实现，不观察 exec.signal”。

**验收**

- 文档明确；无代码行为变化。

**风险 / 回滚**

- 无。

---

## S9（P1）技能正文补全 + 单字兜底可见

**对应差距**：N10、N11。

**9.1 `SKILL.md` 的六处修正**

1. 开头“始终先用 `design_recommend`”改为“按场景选工具”的决策表；
   明确 `design_recommend` 不是搜索框。
2. 检索表补 `product` 域（运行时 12 个领域，当前表只有 11 个）。
3. `design_review` 的 `platform` 语义改为：
   - 严重度仍是第一排序键；
   - 同严重度内平台匹配优先，不匹配 ×0.5 保留，不是硬过滤；
   - `desktop` 按 `web`；`react-native` / `flutter` 追加栈规范。
4. 新增单字表：`图`→chart、`色`→color、`字`→typography、`动`→ux；
   说明 `表` / `页` 故意不收录，未登记单字可能空结果。
5. 新增结果解读：
   - `score` 只在单次查询内可比，不是百分比；
   - 空结果不等于库缺领域；
   - `fallback: true` 是领域默认条目，不是精确命中。
6. 新增“常见误用”四条，与上面的边界对应。

**9.2 单字兜底的 Markdown 标注**

`lib/presentation/search.js` 在结果头之后加：

```js
if (result.results.some(item => item.fallback)) {
  const label = DOMAIN_LABELS[result.domain] || result.domain
  lines.push(`> 以下为「${label}」领域的默认条目（单字查询未精确命中），仅作方向参考。\n`)
}
```

`lib/tools/design-search.js` 的 output schema 的 `results.items` 增加可选
`fallback: { type: 'boolean' }`。

**9.3 内容守卫**

新增 `tests/check-skill.mjs`（零依赖）：

- frontmatter `name` 正确；
- 三个工具名都在正文；
- `designSearchTool.parameters.domain.enum` 的 12 个领域都能在检索表中找到；
- `Object.keys(ZH_SHORT_ALIASES)` 的四个字都在单字表中；
- `designReviewTool.parameters.platform.enum` 的五个值都在正文；
- 正文含 `fallback` / `legacy` / `deprecated` / `score` / “空结果”。

并入 `package.json` 的 `test` 脚本（`check-counts` 之后）。

**验收**

- `node tests/check-skill.mjs` 全绿；
- `formatSearchResult(search('色','color',1))` 含“默认条目”；
- 正常命中（`毛玻璃 深色`）不含该标注；
- `npm test` 新增断言只增不减。

**风险 / 回滚**

- 这是模型可见的指令变更，建议用 `design_search("毛玻璃 深色")`、`design_search("图")`、
  `design_review("移动端登录表单", platform:"mobile")` 三个样例人工复核；
- 回滚：恢复 `SKILL.md` 与 `presentation/search.js` 的两个块。

---

## S10（P0）文档漂移修正

**对应差距**：N12。

| 文件 | 现状 | 改为 |
|---|---|---|
| `README.md` | “仓库当前版本 **1.3.0**” | **1.4.0**（与 `package.json` 一致） |
| `README.en.md` | 同样 1.3.0 | 1.4.0 |
| `README.md` / `README.en.md` | 兼容线 `0.1.1-rc.2` | `0.1.1-rc.1`（与 `.host-compat/host-0-1`、DSH-COMPAT 一致） |
| `README.en.md` | “Real-host validation depends on a local DSH install and is not shipped” | 与中文版一致的干净 clone + `npm run verify:host` 段落 |
| `README.md` / `README.en.md` 工具表 | `platform` 写成“参与排序（匹配优先、不匹配降权）” | 改为“严重度优先；同严重度内平台匹配优先、不匹配 ×0.5 保留，不是硬过滤” |
| `README.md` 测试覆盖 | 未提 `check-columns` / 技能正文契约 | S9 落地后补“列配置子集、技能正文契约” |
| `docs/DSH-COMPAT.md` §4 | “100× 余量”像已生效的预算 | 区分实测延迟 / advisory `timeoutMs` / 宿主 timeout policy |
| `docs/DSH-COMPAT.md` §2 | 技能正文读取未覆盖 | 加 `tests/host/verify-host.mjs` 的 `provider.get` 断言 |
| `docs/ARCHITECTURE.md` §7 | 测试地图没有 `check-skill` | 补一行 |
| `CHANGELOG.md` | 1.4.0 只写内部修复 | 补“原生 DSH 契约对齐”小节（按实际落地项） |

**验收**

- `node tests/check-package.mjs` 的版本引用检查通过；
- `grep` 不再出现 `1.3.0` 作为“当前版本”、`0.1.1-rc.2` 作为“已验证”；
- `README.en.md` 的测试段与 `README.md` 信息等价。

**风险 / 回滚**

- 纯文档；注意不要把“已验证”写成“将验证”。

---

## 11. 测试矩阵（落地后）

| 测试 | 新增/修改 | 覆盖 |
|---|---|---|
| `tests/check-skill.mjs` | 新增 | 技能正文的领域/单字/platform/fallback 口径 |
| `tests/contract.mjs` | 修改 | 未知 stack 的 `isError` 语义 |
| `tests/smoke.mjs` | 修改 | fallback Markdown 标注 |
| `tests/host/verify-host.mjs` | 修改 | 技能正文去 frontmatter、`whenToUse`、并发字段、错误路径 |
| `tests/check-package.mjs` | 不变 | 版本/兼容线/文件清单 |
| `npm run verify:host` | 三条线 | 0.1.1 / 0.2.0 / 0.2.1 |

**Definition of Done**

1. `npm test` 0 失败，断言数 ≥ 585；
2. 三条 host 线全过；
3. `npm pack --dry-run` 49 文件（实施前 47 + 两个新 lib 文件）；
4. `SKILL.md` 正文不含 frontmatter，`whenToUse` 非空；
5. 三个工具 `isConcurrencySafe({}) === true`；
6. 未知 stack 走 `isError`；
7. README/DSH-COMPAT 的版本、兼容线、超时表述与代码一致。

---

## 12. 版本与回滚

- npm 当前最新是 **1.3.0**；本工作树 `package.json` 是 **1.4.0 未发布**。
  上述改动并入 1.4.0，不另起版本；若 1.4.0 已发布，则用 **1.4.1**（patch）。
- 每项保持独立 diff：S1/S2 在 `skill.js`；S3/S10 在文档；S4 在 `config.js` +
  `plugin/index.js`；S5/S6/S7 在 `tools/`；S9 在 `SKILL.md` + `presentation/search.js` +
  `check-skill.mjs`。回滚按文件即可。
- 任何改变模型可见输出的项（S1、S6、S9）都要在 `CHANGELOG.md` 写明“行为变化”，
  不要只写“优化”。

---

## 13. 实施状态（2026-10-18）

S1–S10 已全部落地并通过真实验证：

| 项 | 状态 | 关键验证 |
|---|---|---|
| S1 技能正文 | ✅ | host：`content` 不以 `---` 开头、`renderSkillContent` 无 frontmatter（三条线） |
| S2 元数据/契约 | ✅ | host：`whenToUse` / `path` / `metadata`；`list/get` 遵守 signal |
| S3 超时语义 | ✅ | `DSH-COMPAT.md` §4 + `config.js` 注释；grep 无“100× 余量” |
| S4 配置面 | ✅ | `check-config` 21 条；host：`maxResults` / `reviewRules` / `skill=false` 生效 |
| S5 并发 | ✅ | `contract` + host：`isConcurrencySafe` 保留（合法参数） |
| S6 错误语义 | ✅ | `contract`：未知 stack reject；host：非法 stack 被拒绝 |
| S7 呈现 | ✅ | `contract` + host：`presentationMeta` / `presentResult` 卡片 |
| S8 取消边界 | ✅ | `DSH-COMPAT.md` §4.4；三个 `execute` JSDoc |
| S9 技能正文 + fallback | ✅ | `check-skill` 44 条；smoke 兜底标注/正常不误标 |
| S10 文档漂移 | ✅ | `check-package` 版本引用、README/DSH-COMPAT 对齐 |

最终：`npm test` **663 ✅ / 0 ❌**（低风险补充后 675，见 §14）；三条 `verify:host` 全过；`npm pack` **49 文件**。
详见 [`docs/optimization-report.md`](optimization-report.md) §8。

---

## 14. 低风险补充（2026-10-18）

在 S1–S10 之后追加，全部通过真实验证：

| 项 | 改动 | 验证 |
|---|---|---|
| per-call `includeDeprecated` | `design_search` 新增可选 boolean；`search`/`searchStack` 接受 `{ includeDeprecated }`；默认 false，仅放行 `Status=deprecated` | contract：include=true 召回 deprecated、默认排除；host 三条线：生效 |
| 紧凑卡片 | search/review `presentationMeta` 增加 `top`（最多 3 条）；`presentResult` 输出摘要而非完整 Markdown | contract：卡片不含完整 Markdown 标记；host：卡片 <600 字符 |
| `VERIFIED_HOST` | `0.2.0-rc.2` → `0.2.1-rc.2` | check-package；三条 host 线分别解析到 0.1.1 / 0.2.0 / 0.2.1 |

最终：`npm test` **675 ✅ / 0 ❌**；三条宿主线全过；`npm pack` **49 文件**。

> 注意：`.host-compat/` 被 `.gitignore` 忽略，可能被清理。矩阵验证前先确认
> `DSH_MODULE_ROOT` 下 `dsh-tools` 的版本；缺失时会回退到本机 0.0.1-rc.1，
> 仍可能“通过”，但测的不是目标宿主版本。
