/**
 * config.js — 横切常量单一源（L0）
 *
 * 运行时常量集中在这里，避免 timeout / 条数 / 渲染预算散落在各层：
 *   - 工具超时提示（advisory metadata，注册表不强制执行）
 *   - 检索条数默认值与上限
 *   - 领域检索配置（design_recommend 五步流程）
 *   - Markdown 渲染预算与字段截断长度
 *   - 已验证的 DSH 宿主基线（与 peerDependencies 同改同测）
 *
 * 本模块不得 import 任何其他 lib 模块。
 */

/**
 * 工具超时提示（毫秒）。
 *
 * 这是 **advisory metadata**：`@deepseek-ai/dsh-tools` 的注册表不会强制执行
 * `timeoutMs`；需要截止时间时，由宿主组合挂载
 * `@deepseek-ai/dsh-tool-call-timeout-policy`（一个 `tools/execute` 包装层）。
 * 工具体目前是同步 CPU（冷启动 ~36ms，后续 ~1ms），不观察 `exec.signal`；
 * 若以后加入异步 I/O，必须改为协作式取消并重新评估这里的数值。
 */
export const TIMEOUTS = Object.freeze({
  designRecommend: 5000,
  designReview: 3000,
  designSearch: 3000,
})

/** 检索默认条数与上限。 */
export const LIMITS = Object.freeze({
  /** design_search 默认返回条数 */
  defaultResults: 3,
  /** design_search 返回条数上限（execute 内钳制） */
  maxResults: 8,
  /** design_review 默认规范条数 */
  defaultReviewRules: 8,
  /** design_review 每个来源领域预取条数 */
  reviewRulesPerDomain: 6,
  /** design_recommend 的 UX 要点条数（二次检索与兜底以此为目标下限） */
  recommendUxGuidelines: 3,
})

/** design_recommend 的多领域检索配置（对应上游 SEARCH_CONFIG）。 */
export const SEARCH_CONFIG = Object.freeze({
  product: Object.freeze({ maxResults: 1 }),
  style: Object.freeze({ maxResults: 3 }),
  color: Object.freeze({ maxResults: 2 }),
  landing: Object.freeze({ maxResults: 2 }),
  typography: Object.freeze({ maxResults: 2 }),
})

/**
 * 检索打分权重。
 *
 * 查询由「用户原话 + 中文别名扩展词」组成，两者不应等权：扩展词是猜测，
 * 原话才是意图。等权会让「毛玻璃 深色」里的 dark/mode 把 Glassmorphism 挤下去。
 * 权重作用在 token 层（扩展词去重后每 token 只计一次权重）。
 */
export const RETRIEVAL = Object.freeze({
  /** 用户原查询里的 token */
  primaryWeight: 1,
  /** 别名扩展注入的 token */
  expansionWeight: 0.6,
})

/** Markdown / 字段渲染预算。 */
export const RENDER = Object.freeze({
  /** 单个设计系统 Markdown 的字符上限（约 3k tokens），超出显式截断。 */
  designSystemChars: 12000,
  /** 检索结果单字段展示上限。 */
  searchFieldChars: 400,
})

/**
 * 已验证的 DSH 宿主基线。
 * 与 package.json 的 peerDependencies 上界同源：改这里就要同步 peer 区间，
 * tests/check-package.mjs 会用它做 boot-gate 回归断言。
 */
export const VERIFIED_HOST = '0.2.1-rc.2'

/**
 * 宿主 DI 框架 @deepseek-ai/cordis 的实测主版本线。
 *
 * cordis 是独立发版的依赖注入框架（当前实测 4.0.4），版本号与 DSH 的
 * 0.1.x / 0.2.x 发布线无关，因此**不能**套用 VERIFIED_HOST 的区间。
 * peer 声明保持 `*` 是正确的；这里只用于守卫「若把区间写死，必须覆盖 4.x」。
 */
export const VERIFIED_CORDIS_MAJOR = 4
