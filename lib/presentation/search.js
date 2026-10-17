/**
 * search.js — 检索结果 Markdown 渲染（L3 展示层）
 */

import { DOMAIN_LABELS, STACK_LABELS, localizeRow } from '../i18n/index.js'
import { truncateText } from './markdown.js'

/** 搜索结果 → 中文 Markdown */
export function formatSearchResult(result) {
  const lines = []
  if (result.error) {
    lines.push(`**错误：** ${result.error}`)
    return lines.join('\n')
  }
  if (result.stack) {
    lines.push(`## 技术栈规范：${STACK_LABELS[result.stack] || result.stack}`)
    lines.push(`**查询：** ${result.query} ｜ **命中：** ${result.count} 条\n`)
  } else {
    lines.push(`## 设计数据库检索：${DOMAIN_LABELS[result.domain] || result.domain}`)
    lines.push(`**查询：** ${result.query} ｜ **命中：** ${result.count} 条\n`)
  }

  result.results.forEach(({ row, score }, i) => {
    const localized = localizeRow(row, result.stack ? 'stack' : result.domain)
    lines.push(`### 结果 ${i + 1}（相关度 ${score.toFixed(2)}）`)
    for (const [key, value] of Object.entries(localized)) {
      lines.push(`- **${key}：** ${truncateText(value)}`)
    }
    lines.push('')
  })
  return lines.join('\n')
}
