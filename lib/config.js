/**
 * config.js — 横切常量单一源（L0）
 *
 * 运行时常量集中在这里，避免 timeout / 条数 / 渲染预算散落在各层：
 *   - 工具超时预算（实测冷启动的 10× 以上余量）
 *   - 检索条数默认值与上限
 *   - 领域检索配置（design_recommend 五步流程）
 *   - Markdown 渲染预算与字段截断长度
 *   - 已验证的 DSH 宿主基线（与 peerDependencies 同改同测）
 *
 * 本模块不得 import 任何其他 lib 模块。
 */

/** 工具超时预算（毫秒）。实测冷启动 30ms 内，保留 >100× 余量。 */
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
})

/** design_recommend 的多领域检索配置（对应上游 SEARCH_CONFIG）。 */
export const SEARCH_CONFIG = Object.freeze({
  product: Object.freeze({ maxResults: 1 }),
  style: Object.freeze({ maxResults: 3 }),
  color: Object.freeze({ maxResults: 2 }),
  landing: Object.freeze({ maxResults: 2 }),
  typography: Object.freeze({ maxResults: 2 }),
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
export const VERIFIED_HOST = '0.2.0-rc.2'
