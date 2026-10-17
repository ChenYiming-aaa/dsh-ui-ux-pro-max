# DSH 兼容矩阵与宿主适配说明

> DSH 版本演进快、预发布线多；本文件记录「哪些宿主线验证过、分别验证了什么」，
> 避免换一台机器/换一个宿主版本就重踩一遍。

## 1. 已验证宿主线

| 宿主线 | 验证日期 | 状态 | 证据 / 说明 |
|---|---|---|---|
| `0.0.1-rc.1`（`@deepseek-ai/dsh-tools` / `dsh-skill`） | 2026-10-18 | ✅ 本次验证 | 本仓库 `node_modules/@deepseek-ai/*`；`tests/validate-tools.mjs` + `tests/validate-apply.mjs` 全部通过 |
| `0.1.1-rc.2` | 2026-10-14（历史） | ✅ 历史验证 | 1.1.0 发布记录（README / CHANGELOG）；本次环境未复现 |
| `0.2.0-rc.2` | 2026-10-17（历史） | ✅ 历史验证 | 1.1.1 修复 boot gate 时验证；本次环境未复现 |
| `0.2.1-rc.*` | — | ⚠️ 仅 peer 区间覆盖 | `peerDependencies` 已覆盖 `>=0.2.1-rc.1 <0.3.0-0`，未实际跑宿主验证 |
| `0.3.0+` | — | ❌ 未声明 | 上界为 `<0.3.0-0`；升级前需先验证再改区间 |

> 验证宿主以**实际加载插件的那份 `@deepseek-ai/*`** 为准。本机可能同时存在
> 全局 dsh、DSH Desktop 与 profile `node_modules` 多份运行时，不要混用；
> `tests/dsh-loader.mjs` 只用于本机定位，不随包发布。

## 2. 验证项（每条宿主线都应过）

| # | 验证项 | 命令 / 位置 | 失败表现 |
|---|---|---|---|
| 1 | 工具定义编译（`defineTool`） | `tests/validate-tools.mjs` | 插件加载即报 schema 错误 |
| 2 | `output.schema` 子集校验 | 同上（`assertSupportedJsonSchema`） | 宿主运行时才报错 |
| 3 | `execute` 真实执行 | 同上 | 工具调用失败 |
| 4 | `render` 文本 | 同上 | 模型侧看不到输出 |
| 5 | `presentCall` 卡片 | 同上 | Web UI 卡片缺失 |
| 6 | `apply()` 注册（工具 + 技能） | `tests/validate-apply.mjs` | 技能/工具全部消失 |
| 7 | 技能正文读取 | `tests/validate-apply.mjs` | 技能激活后内容为空 |

本机命令（依赖本机 DSH 安装路径，**无法进 CI**）：

```bash
# 若 @deepseek-ai/* 已在 node_modules（本仓库开发环境）
node tests/validate-tools.mjs
node tests/validate-apply.mjs

# 若需要指向本机 DSH Desktop / 全局运行时
node --import ./tests/register-loader.mjs tests/validate-tools.mjs
node --import ./tests/register-loader.mjs tests/validate-apply.mjs
```

> `tests/validate-*.mjs`、`tests/dsh-loader.mjs`、`tests/register-loader.mjs`
> 是**本机脚本**（`.gitignore` 中），干净 clone 中不存在；需要时按上述命令自备。

## 3. 五个 DSH 特有约束

| 约束 | 内容 | 本项目落点 |
|---|---|---|
| **SchemaSpec 方言** | 属性级 `required: true`；`items`/`oneOf` 内禁 `required`；禁 type 数组；禁数值边界 | `lib/plugin/schema.js` + `tests/check-schema.mjs` |
| **boot gate** | 宿主按 `peerDependencies` 区间判断是否加载 | `lib/config.js` 的 `VERIFIED_HOST` 与 `peerDependencies` 同改同测；`tests/check-package.mjs` 守卫 |
| **双通道输出** | `render`（模型/原生）+ `presentCall` / `presentResult`（UI 卡片）+ `presentationMeta`（完成态摘要） | `lib/tools/design-recommend.js` 用 `presentationMeta` + `presentResult` 输出令牌摘要卡片 |
| **注册方式** | `cordis.patch.yml` 的 `insert` + `dsh.bundle.patch` | `cordis.patch.yml`；`tests/check-package.mjs` 校验形状 |
| **技能激活信号** | `SKILL_DESCRIPTION` 是宿主判断何时激活技能的关键信号 | `lib/plugin/skill.js` 从 `data/meta.json` 派生能力数字 |

## 4. 超时与渲染预算（实测）

2026-10-18 在 Node 22.20 / Windows 上实测（冷进程）：

| 指标 | 实测 |
|---|---|
| 模块加载（`lib/domain/design-system.js`） | ≈10ms |
| 首次 `design_recommend`（含 1.2MB `index.json` 解析） | ≈30ms |
| 第二次起检索 | ≈2ms |
| `formatDesignSystem` 输出（典型中文查询） | 2.5–4.4KB 字符 |
| `formatReview` 输出 | ≈3.4KB 字符 |
| `formatSearchResult` 输出 | ≈6.2KB 字符 |

据此：
- `TIMEOUTS` 设为 `5000 / 3000 / 3000ms`（冷启动的 100× 以上余量，不是拍脑袋的 20s）。
- `RENDER.designSystemChars = 12000`：典型输出的 3× 左右；超出时显式截断并提示查看结构化返回值。
  设计系统完整结构化数据仍在 `execute` 返回值中，不受 Markdown 截断影响。

## 5. 降级契约

`lib/plugin/index.js` 的 `apply()`：

- `skills` 服务已声明 → 通过 `inject(['skills'], …)` 注册内置技能提供者。
- `skills` 服务当前未就绪 → 仍调用 `inject` 等待服务；同时通过
  `ctx.logger?.debug?.()` 记录「当前未就绪」的降级原因，**三个工具照常注册**。
- `ctx.tools` 缺失属于宿主契约破坏，不静默兜底（宿主保证存在）。

## 6. 升级宿主时改哪里

1. 在目标宿主上跑 §2 的 7 项验证。
2. 通过后更新 `lib/config.js` 的 `VERIFIED_HOST`。
3. 同步改 `package.json` 的 `peerDependencies`（上界至少高于 `VERIFIED_HOST` 的 minor）。
4. 更新本文件的兼容矩阵（日期、状态、证据）。
5. `npm test` + `npm pack --dry-run`。

> 只改 `peerDependencies` 不改 `VERIFIED_HOST`（或反之）会制造两份真相；
> `tests/check-package.mjs` 已把两者绑定为同一份断言。
