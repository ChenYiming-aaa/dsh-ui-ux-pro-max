/**
 * review.js — UX 审查构建（L3 业务层）
 *
 * 从 ux / web / react 三个领域检索规范，按严重度去重排序；
 * 通用检查清单在 checklist.js（数据与算法分离）。
 */

import { LIMITS } from '../config.js'
import { SEVERITY_ORDER } from '../i18n/index.js'
import { search } from '../search/retriever.js'
import { QUICK_REFERENCE_CHECKLIST } from './checklist.js'

/**
 * 构建 UX 审查清单。
 * @param {object} options
 * @param {string} options.target - 审查对象描述（如「移动端登录表单」「数据分析看板」）
 * @param {string} [options.platform] - web / mobile / desktop
 * @param {number} [options.maxRules] - 检索到的具体规范条数上限
 * @returns {object} 结构化中文审查清单
 */
export function buildReview({ target, platform = 'web', maxRules = LIMITS.defaultReviewRules }) {
  const query = `${target} ${platform}`
  const sources = ['ux', 'web', 'react']

  const collected = []
  for (const domain of sources) {
    const result = search(query, domain, LIMITS.reviewRulesPerDomain)
    for (const { row, score } of result.results) {
      const severity = SEVERITY_ORDER[row.Severity] !== undefined ? row.Severity : 'Medium'
      collected.push({
        category: row.Category || '',
        issue: row.Issue || row.Guideline || '',
        platform: row.Platform || platform,
        description: row.Description || '',
        do: row.Do || '',
        dont: row["Don't"] || '',
        severity,
        source: domain,
        score,
      })
    }
  }

  // 去重（同一 issue 只保留严重度最高的）
  const seen = new Map()
  for (const rule of collected) {
    const key = `${rule.category}|${rule.issue}`
    const prev = seen.get(key)
    if (!prev || (SEVERITY_ORDER[rule.severity] ?? 9) < (SEVERITY_ORDER[prev.severity] ?? 9)) {
      seen.set(key, rule)
    }
  }
  const unique = [...seen.values()]

  // 严重度排序：Critical > High > Medium > Low，同级按相关度
  unique.sort((a, b) => {
    const d = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
    if (d !== 0) return d
    return b.score - a.score
  })

  const priorityRules = unique.slice(0, maxRules)
  const bySeverity = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  for (const rule of priorityRules) {
    bySeverity[rule.severity] = (bySeverity[rule.severity] || 0) + 1
  }

  return {
    target,
    platform,
    summary: {
      matchedRules: priorityRules.length,
      bySeverity,
      checklistSections: QUICK_REFERENCE_CHECKLIST.length,
    },
    priorityRules,
    checklist: QUICK_REFERENCE_CHECKLIST,
  }
}
