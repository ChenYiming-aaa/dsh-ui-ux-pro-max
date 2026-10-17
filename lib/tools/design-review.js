/**
 * design-review.js — design_review 工具定义（L4）
 */

import { LIMITS, TIMEOUTS } from '../config.js'
import { buildReview } from '../domain/review.js'
import { formatReview } from '../presentation/index.js'
import { array, integer, object, stringEnum, text } from './schema.js'
import { getStats } from '../repo/stats.js'

const uxCount = getStats().capabilities.uxGuidelines

export const designReviewTool = {
  name: 'design_review',
  description:
    `按 UX 规范清单审查现有 UI：根据审查对象描述（页面/组件类型、关键词、平台）从 ${uxCount} 条 UX 规范 +` +
    '移动端接口规范 + React 性能规范数据库中检索针对性规则，按严重度（严重/高/中/低）排序，' +
    '并附上交付前通用检查清单（视觉质量/交互/深浅色模式/布局/无障碍/性能/表单/导航）。' +
    '评审页面、检查无障碍、优化交互体验时使用。',
  timeoutMs: TIMEOUTS.designReview,
  parameters: {
    target: text('审查对象描述，如「移动端登录表单」「数据分析看板」「pricing 页面」', true),
    platform: stringEnum(['web', 'mobile', 'desktop', 'react-native', 'flutter'], '目标平台（可选，默认 web）'),
    maxRules: integer('返回的针对性规范条数上限（可选，默认 8）'),
  },
  output: {
    schema: {
      type: 'object',
      additionalProperties: true,
      properties: {
        target: { type: 'string', required: true },
        platform: { type: 'string' },
        summary: object({
          matchedRules: { type: 'integer', required: true },
          bySeverity: object({}),
          checklistSections: { type: 'integer' },
        }, { required: true }),
        priorityRules: array({
          type: 'object',
          additionalProperties: true,
          properties: {
            category: { type: 'string' },
            issue: { type: 'string' },
            platform: { type: 'string' },
            description: { type: 'string' },
            do: { type: 'string' },
            dont: { type: 'string' },
            severity: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] },
            source: { type: 'string' },
            score: { type: 'number' },
          },
        }, '针对性规范（按严重度排序）', true),
        checklist: array({
          type: 'object',
          additionalProperties: true,
          properties: {
            category: { type: 'string' },
            checks: { type: 'array', items: { type: 'string' } },
          },
        }, '交付前通用检查清单', true),
      },
    },
    render(_args, value) {
      return [{ type: 'text', text: formatReview(value) }]
    },
  },
  async execute(args) {
    return buildReview({
      target: args.target,
      platform: args.platform || 'web',
      maxRules: args.maxRules || LIMITS.defaultReviewRules,
    })
  },
  presentCall(args) {
    return {
      card: 'generic',
      title: `审查 UX：${args.target}`,
      kind: 'search',
      rawInput: args,
    }
  },
}
