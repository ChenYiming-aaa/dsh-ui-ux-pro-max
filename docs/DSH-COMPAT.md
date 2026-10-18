# DSH 兼容矩阵与宿主适配说明

> DSH 版本演进快、预发布线多；本文件记录「哪些宿主线验证过、分别验证了什么」，
> 避免换一台机器/换一个宿主版本就重踩一遍。

## 1. 宿主线验证记录

状态三态定义：
- **✅ CI 自动验证**：`.github/workflows/ci.yml` 的 `host-compat` job 每次 push/PR 实跑。
- **✅ 人工验证**：曾在本机实跑并记录日期，CI 未覆盖（版本已不再安装或环境不可复现）。
- **⚠️ 仅声明覆盖**：只出现在 `peerDependencies` 区间里，**没有**实跑证据，不可当作支持承诺。

| 宿主线 | 验证日期 | 状态 | 证据 / 说明 |
|---|---|---|---|
| `0.0.1-rc.1`（本机 `node_modules` 测试运行时） | 2026-10-18 | ⚠️ 非支持线 | `npm run verify:host` 7 项**全过**，但版本低于 peer 下限，不在支持区间内，仅作开发环境参考 |
| `0.1.1-rc.1` | 2026-10-18 | ✅ CI 自动验证 | `npm run verify:host`，7 项全过 |
| `0.2.0-rc.2` | 2026-10-18 | ✅ CI 自动验证 | 同上（基线已抬到 0.2.1-rc.2） |
| `0.2.1-rc.2` | 2026-10-18 | ✅ CI 自动验证 | 同上（当前 `VERIFIED_HOST` 基线） |
| `0.3.0+` | — | ❌ 未声明 | 上界为 `<0.3.0-0`；升级前需先验证再改区间 |

> 验证宿主以**实际加载插件的那份 `@deepseek-ai/*`** 为准。本机可能同时存在
> 全局 dsh、DSH Desktop 与 profile `node_modules` 多份运行时，不要混用。
>
> `@deepseek-ai/cordis` 是**独立发版**的 DI 框架（实测 4.0.4），版本号与 DSH 的
> 0.1.x / 0.2.x 线无关，因此 peer 声明保持 `*`；`lib/config.js` 的
> `VERIFIED_CORDIS_MAJOR` 只用于守卫「若把它写成区间，必须覆盖 4.x」。

## 2. 验证项（每条宿主线都应过）

| # | 验证项 | 落点 | 失败表现 |
|---|---|---|---|
| 1 | 工具定义编译（`defineTool`） | `tests/host/verify-host.mjs` §1 | 插件加载即报 schema 错误 |
| 2 | `output.schema` 子集校验（`assertSupportedJsonSchema`） | 同上 | 宿主运行时才报错 |
| 3 | 参数 SchemaSpec → JSON Schema 转换（`required` 提升到 root） | 同上 | 参数校验失效或误报 |
| 4 | `execute` 真实执行 | 同上 §2 | 工具调用失败 |
| 5 | `render` 文本 + `presentCall` 卡片 | 同上 | 模型侧看不到输出 / UI 卡片缺失 |
| 6 | `apply()` 注册（3 工具 + 1 技能 provider） | 同上 §3 | 技能/工具全部消失 |
| 7 | 技能正文读取 + frontmatter 去除 + `whenToUse` | `tests/host/verify-host.mjs` §3 | 技能激活后内容带 YAML、或正文为空 |

**可移植命令**（不依赖本机路径，可进 CI）：

```bash
# 用当前 node_modules 里的宿主
npm run verify:host

# 指向任意宿主导入根（含 node_modules 的目录）
DSH_MODULE_ROOT=/tmp/host-0.2.1 npm run verify:host
```

> 注意 §2-#2 的顺序陷阱：`spec.output.schema` 是 **SchemaSpec**，直接丢给
> `assertSupportedJsonSchema` 会得到一堆「required is not supported」误报；
> 必须先 `defineTool(spec)`，再校验返回值的 `output.schema`（已转为标准 JSON Schema）。
>
> 早期依赖本机 DSH 安装路径的 `validate-*.mjs` / `dsh-loader.mjs` 等脚本已移除，
> 真实宿主校验统一走 `tests/host/` 里的可移植版本（本地与 CI 同一套命令）。

## 3. 五个 DSH 特有约束

| 约束 | 内容 | 本项目落点 |
|---|---|---|
| **SchemaSpec 方言** | 属性级 `required: true`；`items`/`oneOf` 内禁 `required`；禁 type 数组；禁数值边界 | `lib/plugin/schema.js` + `tests/check-schema.mjs` |
| **boot gate** | 宿主按 `peerDependencies` 区间判断是否加载 | `lib/config.js` 的 `VERIFIED_HOST` 与 `peerDependencies` 同改同测；`tests/check-package.mjs` 守卫（含 `cordis` 白名单，`VERIFIED_CORDIS_MAJOR` 守卫其独立版本线） |
| **双通道输出** | `render`（模型/原生）+ `presentCall` / `presentResult`（UI 卡片）+ `presentationMeta`（完成态摘要） | `lib/tools/design-recommend.js` 用 `presentationMeta` + `presentResult` 输出令牌摘要卡片 |
| **注册方式** | `cordis.patch.yml` 的 `insert` + `dsh.bundle.patch` | `cordis.patch.yml`；`tests/check-package.mjs` 校验形状 |
| **技能激活信号** | `SKILL_DESCRIPTION` 是宿主判断何时激活技能的关键信号 | `lib/plugin/skill.js` 从 `data/meta.json` 派生能力数字 |

## 4. 超时语义与渲染预算（实测）

### 4.1 超时：声明，不是强制

`@deepseek-ai/dsh-tools` 对 `ToolDefinition.timeoutMs` 的定义是：**协作式提示，
注册表本身不会强制执行截止时间**。真正执行超时需要宿主组合挂载
`@deepseek-ai/dsh-tool-call-timeout-policy`（一个 `tools/execute` 包装层），
或由部署方提供等价包装。

因此：

- `lib/config.js` 的 `TIMEOUTS`（5000 / 3000 / 3000ms）只是 advice；
- 三个工具体目前是同步 CPU，不观察 `exec.signal`；预取消由注册表在 body 前短路，
  运行中的同步计算无法被硬杀；
- 如果宿主没有 timeout policy，就不存在“到达 TIMEOUTS 就中止”的行为；
- 以后加入异步 I/O 或远程数据源时，必须改为 `execute(args, exec)` 并检查
  `exec.signal`，再重新评估数值。

### 4.2 实测延迟

2026-10-18 在 Node 22.20 / Windows 上实测（冷进程，数据同步到 1.3.0 后）：

| 指标 | 实测 |
|---|---|
| 模块加载（`lib/domain/design-system.js`） | ≈20ms |
| 首次 `design_recommend`（含 1.5MB `index.json` 解析） | ≈36ms |
| 第二次起检索 | ≈1ms |
| `formatDesignSystem` 输出（典型中文查询） | 2.5–4.5KB 字符 |
| `formatReview` 输出 | ≈3.8KB 字符 |
| `formatSearchResult` 输出 | 4.5–6.5KB 字符（新增字段后） |

这些数字用于说明“正常路径足够快”，不是超时承诺。

### 4.3 渲染预算

- `RENDER.designSystemChars = 12000`：典型输出的 3× 左右；超出时显式截断并提示查看结构化返回值。
  设计系统完整结构化数据仍在 `execute` 返回值中，不受 Markdown 截断影响。

### 4.4 取消语义（同步实现）

三个工具体都是同步 CPU，没有 `await`、网络或文件写入：

- **预取消**：调用方在 body 开始前取消时，注册表直接短路
  （`ABORTED_BEFORE_DISPATCH`），不会调用 `execute`；
- **运行中**：同步计算无法被 `exec.signal` 抢占；单次工作 <40ms，属于有限工作，
  注册表会在结束后按取消状态处理最终结果；
- **未来**：一旦加入异步数据源或远程 provider，`execute(args, exec)` 必须检查
  `exec.signal` 并在阶段边界退出；那时才需要重新评估 `TIMEOUTS` 与取消测试。

## 5. 降级契约

`lib/plugin/index.js` 的 `apply()`：

- `skills` 服务已声明 → 通过 `inject(['skills'], …)` 注册内置技能提供者。
- `skills` 服务当前未就绪 → 仍调用 `inject` 等待服务；同时通过
  `ctx.logger?.debug?.()` 记录「当前未就绪」的降级原因，**三个工具照常注册**。
- `ctx.tools` 缺失属于宿主契约破坏，不静默兜底（宿主保证存在）。

## 6. 升级宿主时改哪里

1. 在目标宿主上跑 `DSH_MODULE_ROOT=<含该宿主的目录> npm run verify:host`（§2 的 1–7 项；第 7 项已由 `provider.get` 断言覆盖）。
2. 通过后更新 `lib/config.js` 的 `VERIFIED_HOST`。
3. 同步改 `package.json` 的 `peerDependencies`（上界至少高于 `VERIFIED_HOST` 的 minor）。
4. 若目标宿主换了 `@deepseek-ai/cordis` 主版本线，同步 `VERIFIED_CORDIS_MAJOR`。
5. 在 `.github/workflows/ci.yml` 的 `host-compat` 矩阵里加上该版本，并把本文件矩阵的状态标为「CI 自动验证」。
6. 更新本文件的兼容矩阵（日期、状态、证据）。
7. `npm test` + `npm pack --dry-run`。

> 只改 `peerDependencies` 不改 `VERIFIED_HOST`（或反之）会制造两份真相；
> `tests/check-package.mjs` 已把两者绑定为同一份断言。
