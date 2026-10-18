/**
 * plugin/config.js — 插件配置面（L5，零 DSH API / 零第三方依赖）
 *
 * 只暴露三个低风险字段：
 *   - maxResults:  design_search 未显式传 maxResults 时的默认值（1–8）
 *   - reviewRules: design_review 未显式传 maxRules 时的默认值（1–20）
 *   - skill:       是否注册内置 ui-ux-pro-max 技能
 *
 * 同时导出 Standard Schema 形状的 `Config`，让 Cordis 的 resolveConfig()
 * 在加载期校验；`apply()` 内会再 normalize 一次，保证直接调用也安全。
 */

export const DEFAULT_CONFIG = Object.freeze({
  maxResults: 3,
  reviewRules: 8,
  skill: true,
})

/**
 * 校验并规范化配置。未知字段被忽略；类型错误直接抛 TypeError。
 * @param {unknown} raw
 */
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

/**
 * 给工具 spec 注入配置默认值。用户显式传入的参数优先。
 * 只处理有“默认条数”语义的两个工具；design_recommend 原样返回。
 * @param {object} spec
 * @param {{maxResults:number, reviewRules:number}} config
 */
export function applyToolDefaults(spec, config) {
  const defaults = spec.name === 'design_search'
    ? { maxResults: config.maxResults }
    : spec.name === 'design_review'
      ? { maxRules: config.reviewRules }
      : null
  if (!defaults) return spec
  return {
    ...spec,
    async execute(args = {}, exec) {
      return spec.execute({ ...defaults, ...args }, exec)
    },
  }
}

/**
 * Standard Schema 适配层。Cordis 4.x 的 resolveConfig() 读取
 * `runtime.Config['~standard'].validate(config)`。
 */
export const Config = {
  '~standard': {
    version: 1,
    vendor: 'dsh-ui-ux-pro-max',
    validate(value = {}) {
      try {
        return { value: normalizeConfig(value) }
      } catch (error) {
        return { issues: [{ message: error.message, path: [] }] }
      }
    },
  },
}
