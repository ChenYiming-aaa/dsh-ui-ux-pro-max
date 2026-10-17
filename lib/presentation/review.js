/**
 * review.js — UX 审查结果 Markdown 渲染（L3 展示层）
 */

import { SEVERITY_LABELS } from '../i18n/index.js'

function sev(level) {
  return SEVERITY_LABELS[level] || level || ''
}

/** 审查结果 → 中文 Markdown */
export function formatReview(review) {
  const lines = []
  lines.push(`## UX 审查清单：${review.target}`)
  lines.push(`**平台：** ${review.platform} ｜ **命中规范：** ${review.summary.matchedRules} 条`)
  const bySev = review.summary.bySeverity
  const sevParts = []
  for (const [level, count] of Object.entries(bySev)) {
    if (count) sevParts.push(`${sev(level)} ${count}`)
  }
  if (sevParts.length) lines.push(`**严重度分布：** ${sevParts.join(' / ')}`)
  lines.push('')

  if (review.priorityRules.length) {
    lines.push('### 🔍 针对性规范（按严重度优先）')
    for (const rule of review.priorityRules) {
      const parts = [`**[${sev(rule.severity)}]** ${rule.category}｜${rule.issue}`]
      if (rule.description) parts.push(rule.description)
      lines.push(`- ${parts.join(' — ')}`)
      if (rule.do) lines.push(`  - ✅ 应该：${rule.do}`)
      if (rule.dont) lines.push(`  - ❌ 避免：${rule.dont}`)
    }
    lines.push('')
  }

  lines.push('### 📋 交付前通用检查清单')
  for (const section of review.checklist) {
    lines.push(`**${section.category}**`)
    for (const check of section.checks) lines.push(`- [ ] ${check}`)
    lines.push('')
  }

  return lines.join('\n')
}
