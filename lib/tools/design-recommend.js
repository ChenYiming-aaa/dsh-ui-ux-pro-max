/**
 * design-recommend.js — design_recommend 工具定义（L4）
 *
 * 只声明宿主无关的工具规格：parameters / output schema / execute /
 * render / presentCall / presentResult。DSH 的 defineTool 由 plugin/index.js
 * 统一套用（宿主 API 只出现在 plugin/）。
 */

import { RENDER, TIMEOUTS } from '../config.js'
import { generateDesignSystem, summarizeDesignSystem } from '../domain/design-system.js'
import { clampMarkdown, formatDesignSystem, formatTokenSummary } from '../presentation/index.js'
import { STACKS } from '../repo/stacks.js'
import { array, integer, nullableObject, object, stringEnum, text } from './schema.js'

export const designRecommendTool = {
  name: 'design_recommend',
  description:
    '根据产品类型 + 关键词生成完整设计系统建议：推荐设计风格（按优先级排序）、配色方案（HEX 令牌）、' +
    '字体搭配、落地页模式、UX 规范要点，并给出选择理由与反模式。中文查询自动映射到设计数据库。' +
    '创建新项目/页面、选择风格/配色/字体时使用。可选 stack 附加技术栈规范，可选 variance/motion/density' +
    '三个 1-10 旋钮调整大胆度/动效/密度。',
  timeoutMs: TIMEOUTS.designRecommend,
  isConcurrencySafe: () => true,
  parameters: {
    query: text('产品类型 + 行业 + 气质，如「财务 数据看板 深色」「beauty spa 疗愈」「AI 搜索 极简」', true),
    projectName: text('项目名称（可选，用于输出标题）'),
    stack: stringEnum(STACKS, '技术栈键（可选），附加该技术栈的实现规范'),
    variance: integer('大胆度旋钮 1-10：1=居中/极简，10=大胆/不对称（可选）'),
    motion: integer('动效旋钮 1-10：1=克制，10=复杂编排，会附加 GSAP 动效方案（可选）'),
    density: integer('密度旋钮 1-10：1=宽松，10=紧凑/看板，会覆盖间距刻度（可选）'),
  },
  output: {
    schema: {
      type: 'object',
      additionalProperties: true,
      properties: {
        projectName: { type: 'string', required: true },
        category: { type: 'string', required: true },
        pattern: object({}, { required: true, description: '落地页模式（名称/区块顺序/CTA 位置）' }),
        styles: array({ type: 'object', additionalProperties: true }, '推荐风格（按优先级排序）', true),
        colors: object({}, { required: true, description: 'HEX 配色令牌与 CSS 变量' }),
        typography: object({}, { required: true, description: '字体搭配' }),
        keyEffects: text('关键效果'),
        antiPatterns: array({ type: 'string' }, '反模式'),
        reasoning: object({}, { description: '选择理由与决策规则' }),
        uxGuidelines: array({ type: 'object', additionalProperties: true }, 'UX 规范要点'),
        stackGuidelines: array({ type: 'object', additionalProperties: true }, '技术栈规范'),
        dials: object({}, { description: '三个设计旋钮的解析结果' }),
        motionSnippet: nullableObject,
        spacingScale: nullableObject,
        implementationChecklist: array({ type: 'string' }, '实现清单'),
        designSystemVariables: text('设计系统变量'),
      },
    },
    render(_args, value) {
      return [{ type: 'text', text: clampMarkdown(formatDesignSystem(value), RENDER.designSystemChars) }]
    },
    /** 完成态卡片摘要（持久化到 tool/result，供 presentResult 使用） */
    presentationMeta(_args, value) {
      return summarizeDesignSystem(value)
    },
  },
  /** 同步 CPU 实现；不观察 exec.signal（见 docs/DSH-COMPAT.md §4.4）。 */
  async execute(args) {
    const ds = generateDesignSystem({
      query: args.query,
      projectName: args.projectName,
      variance: args.variance,
      motion: args.motion,
      density: args.density,
      stack: args.stack,
    })
    ds.stackName = args.stack || null
    return ds
  },
  presentCall(args) {
    return {
      card: 'generic',
      title: `生成设计系统：${args.query}`,
      kind: 'search',
      rawInput: args,
    }
  },
  presentResult(args, result) {
    const summary = result?.meta
    if (result?.isError || !summary || typeof summary !== 'object') return undefined
    return {
      card: 'generic',
      title: `设计系统：${summary.projectName || args.query}`,
      content: [{ type: 'text', text: formatTokenSummary(summary) }],
    }
  },
}
