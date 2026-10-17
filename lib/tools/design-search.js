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

const stackCount = getStats().capabilities.stacks

export const designSearchTool = {
  name: 'design_search',
  description:
    '在 UI/UX 设计智能库中按领域或技术栈检索：风格、配色、图表、落地页、产品类型、UX 规范、字体搭配、' +
    `图标、动效(GSAP)、React 性能、移动端接口规范、Google 字体，或 ${stackCount} 个技术栈之一。` +
    '返回按相关度排序的中文结构化结果。中文查询自动映射到英文语料。',
  timeoutMs: TIMEOUTS.designSearch,
  parameters: {
    query: text('检索关键词，如「glassmorphism dark」「表单 无障碍」「fintech 配色」', true),
    domain: stringEnum(DOMAIN_KEYS, '领域键（可选）：style/color/chart/landing/product/ux/typography/icons/gsap/react/web/google-fonts'),
    stack: stringEnum(STACKS, '技术栈键（可选，与 domain 二选一）：如 react/nextjs/vue/flutter/swiftui/javafx'),
    maxResults: integer('返回条数上限（可选，默认 3）'),
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
          },
        }, '按相关度排序的检索结果', true),
      },
    },
    render(_args, value) {
      return [{ type: 'text', text: formatSearchResult(value) }]
    },
  },
  async execute(args) {
    const maxResults = Math.max(1, Math.min(LIMITS.maxResults, args.maxResults || LIMITS.defaultResults))
    if (args.stack) {
      const result = searchStack(args.query, args.stack, maxResults)
      if (result.error) return { error: result.error, domain: 'stack', query: args.query, count: 0, results: [] }
      return result
    }
    return search(args.query, args.domain, maxResults)
  },
  presentCall(args) {
    return {
      card: 'generic',
      title: `检索设计库：${args.query}${args.domain ? `（${DOMAIN_LABELS[args.domain] || args.domain}）` : ''}`,
      kind: 'search',
      rawInput: args,
    }
  },
}
