/**
 * design-search.js — design_search 工具定义（L4）
 */

import { LIMITS, TIMEOUTS } from '../config.js'
import { DOMAIN_LABELS } from '../i18n/index.js'
import { formatSearchResult } from '../presentation/index.js'
import { DOMAIN_KEYS } from '../repo/domains.js'
import { getStats } from '../repo/stats.js'
import { STACKS } from '../repo/stacks.js'
import { search, searchStack } from '../search/retriever.js'
import { array, integer, object, stringEnum, text } from './schema.js'

const stackCount = getStats()?.capabilities?.stacks

/** 卡片里用一行标签代表一个结果行；只取短字段，不把整行塞进 meta。 */
function compactRowLabel(row) {
  return row['Style Category'] || row['Product Type'] || row['Best Chart Type'] || row['Pattern Name'] ||
    row['Font Pairing Name'] || row['Icon Name'] || row.Guideline || row.Issue || row.Family ||
    row.Category || ''
}

export const designSearchTool = {
  name: 'design_search',
  description:
    '在 UI/UX 设计智能库中按领域或技术栈检索：风格、配色、图表、落地页、产品类型、UX 规范、字体搭配、' +
    `图标、动效(GSAP)、React 性能、移动端接口规范、Google 字体，或 ${stackCount} 个技术栈之一。` +
    '返回按相关度排序的中文结构化结果。中文查询自动映射到英文语料。',
  timeoutMs: TIMEOUTS.designSearch,
  isConcurrencySafe: () => true,
  parameters: {
    query: text('检索关键词，如「毛玻璃 深色」「表单 校验 无障碍」「safe area 安全区」', true),
    domain: stringEnum(DOMAIN_KEYS, '领域键（可选）：style/color/chart/landing/product/ux/typography/icons/gsap/react/web/google-fonts'),
    stack: stringEnum(STACKS, '技术栈键（可选，与 domain 二选一）：如 react/nextjs/vue/flutter/swiftui/javafx'),
    maxResults: integer('返回条数上限（可选，默认 3）'),
    includeDeprecated: { type: 'boolean', description: '是否包含 deprecated 条目（可选，默认 false；仅 style/stack 有该状态）' },
  },
  output: {
    schema: {
      type: 'object',
      additionalProperties: true,
      properties: {
        domain: { type: 'string', required: true },
        stack: { type: 'string' },
        query: { type: 'string', required: true },
        count: { type: 'integer', required: true },
        results: array({
          type: 'object',
          additionalProperties: true,
          properties: {
            row: object({}),
            score: { type: 'number' },
            fallback: { type: 'boolean', description: '单字查询的领域默认条目（非精确命中）' },
          },
        }, '按相关度排序的检索结果', true),
      },
    },
    render(_args, value) {
      return [{ type: 'text', text: formatSearchResult(value) }]
    },
    /** 持久化到 tool/result 的轻量摘要，供 presentResult 重放。 */
    presentationMeta(_args, value) {
      return {
        domain: value.domain,
        count: value.count,
        query: value.query,
        top: value.results.slice(0, 3).map(({ row, score, fallback }) => ({
          label: compactRowLabel(row),
          score,
          fallback: Boolean(fallback),
        })),
      }
    },
  },
  /** 同步 CPU 实现；不观察 exec.signal（见 docs/DSH-COMPAT.md §4.4）。 */
  async execute(args) {
    const maxResults = Math.max(1, Math.min(LIMITS.maxResults, args.maxResults || LIMITS.defaultResults))
    const options = { includeDeprecated: args.includeDeprecated === true }
    if (args.stack) {
      const result = searchStack(args.query, args.stack, maxResults, options)
      if (result.error) throw new Error(result.error)
      return result
    }
    return search(args.query, args.domain, maxResults, options)
  },
  presentCall(args) {
    return {
      card: 'generic',
      title: `检索设计库：${args.query}${args.domain ? `（${DOMAIN_LABELS[args.domain] || args.domain}）` : ''}`,
      kind: 'search',
      rawInput: args,
    }
  },
  presentResult(_args, result) {
    if (result?.isError) return undefined
    const meta = result?.meta
    if (!meta || typeof meta !== 'object') return undefined
    const lines = [`**命中：** ${meta.count} 条（${meta.domain}）`]
    for (const item of meta.top || []) {
      const score = typeof item.score === 'number' ? item.score.toFixed(2) : '—'
      lines.push(`- ${item.label || '(未命名)'}（${score}）${item.fallback ? ' · 默认条目' : ''}`)
    }
    return { card: 'generic', title: `检索：${meta.query}`, content: [{ type: 'text', text: lines.join('\n') }] }
  },
}
