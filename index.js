/**
 * dsh-ui-ux-pro-max — UI/UX 设计智能库插件（宿主端）
 *
 * 将 ui-ux-pro-max 设计智能库（84 种风格 / 192 个调色板 / 74 组字体搭配 /
 * 99 条 UX 规范 / 25 种图表类型 / 22 个技术栈）封装为 DSH 离线工具：
 *
 *   - design_recommend  产品类型 + 关键词 → 完整设计系统建议（风格/配色/字体/UX 规范 + 理由）
 *   - design_review     按 UX 规范清单审查现有 UI（严重度优先）
 *   - design_search     按领域 / 技术栈搜索数据库
 *
 * 同时注册内置技能 ui-ux-pro-max（中文优先的使用指南）。
 * 纯宿主端形态：不声明 dsh.client，也不需要浏览器端代码。
 *
 * 数据完全内置（data/index.json + data/fonts.json），零网络依赖。
 * @module dsh-ui-ux-pro-max
 */

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { BUNDLED_SKILL_RANK } from '@deepseek-ai/dsh-skill'
import { search, searchStack, DOMAIN_KEYS, STACKS } from './lib/database.js'
import { generateDesignSystem } from './lib/design-system.js'
import { buildReview } from './lib/review.js'
import { formatDesignSystem, formatReview, formatSearchResult } from './lib/format.js'
import { DOMAIN_LABELS } from './lib/zh.js'

export const name = 'ui-ux-pro-max'
export const inject = ['tools']

// ---------- 内置技能 ----------
const SKILL_BODY_URL = new URL('./skills/ui-ux-pro-max/SKILL.md', import.meta.url)
const SKILL_RESOURCE_BASE = {
  kind: 'directory',
  path: fileURLToPath(new URL('./skills/ui-ux-pro-max/', import.meta.url)),
}
const SKILL_INVOCATION = { modelInvocable: true, userInvocable: true }
const SKILL_DESCRIPTION =
  'UI/UX 设计智能库：通过 design_recommend / design_review / design_search 工具查询 67 种设计风格、' +
  '161 个调色板、57 组字体搭配、99 条 UX 规范与 25 种图表类型（覆盖 22 个技术栈），' +
  '获取中文优先、带理由的结构化设计系统建议。创建或改造界面、评审 UX 时使用。'

const SKILL_CANDIDATE = {
  name: 'ui-ux-pro-max',
  description: SKILL_DESCRIPTION,
  invocation: SKILL_INVOCATION,
  provider: 'dsh-ui-ux-pro-max',
  source: 'bundled',
  resourceBase: SKILL_RESOURCE_BASE,
  rank: BUNDLED_SKILL_RANK,
  locator: SKILL_BODY_URL,
}

const skillProvider = {
  name: 'dsh-ui-ux-pro-max',
  list: () => Promise.resolve([SKILL_CANDIDATE]),
  async get(_candidate) {
    return {
      name: SKILL_CANDIDATE.name,
      description: SKILL_CANDIDATE.description,
      invocation: SKILL_CANDIDATE.invocation,
      provider: SKILL_CANDIDATE.provider,
      source: SKILL_CANDIDATE.source,
      resourceBase: SKILL_RESOURCE_BASE,
      content: await readFile(SKILL_BODY_URL, 'utf8'),
    }
  },
}

// ---------- 通用输出 schema 辅助 ----------
// 说明：output.schema 使用 dsh-tools 的 SchemaSpec 方言 —— 根层属性用
// 属性级 `required: true`；items 内的嵌套对象不允许 required；不支持 type 数组
// （用 oneOf 表达可空）；不支持 numeric bounds（在 execute 内做钳制）。
const sevEnum = { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] }
const nullableObject = { oneOf: [{ type: 'object', additionalProperties: true }, { type: 'null' }] }

function text(description, required = false) {
  return { type: 'string', ...(required ? { required: true } : {}), description }
}

// ---------- 工具定义（独立可测） ----------
/**
 * 构建三个设计工具（design_recommend / design_review / design_search）。
 * 导出以便测试直接校验 schema 与 execute，apply() 仅负责注册。
 */
export function buildTools() {
  return [
    defineTool({
    name: 'design_recommend',
    description:
      '根据产品类型 + 关键词生成完整设计系统建议：推荐设计风格（按优先级排序）、配色方案（HEX 令牌）、' +
      '字体搭配、落地页模式、UX 规范要点，并给出选择理由与反模式。中文查询自动映射到设计数据库。' +
      '创建新项目/页面、选择风格/配色/字体时使用。可选 stack 附加技术栈规范，可选 variance/motion/density' +
      '三个 1-10 旋钮调整大胆度/动效/密度。',
    timeoutMs: 20000,
    parameters: {
      query: {
        type: 'string', required: true,
        description: '产品类型/行业/关键词，如「金融 SaaS 数据看板」「beauty spa wellness」「AI 搜索工具」',
      },
      projectName: text('项目名称（可选，用于输出标题）'),
      stack: {
        type: 'string', enum: STACKS,
        description: '技术栈键（可选），附加该技术栈的实现规范',
      },
      variance: {
        type: 'integer',
        description: '大胆度旋钮 1-10：1=居中/极简，10=大胆/不对称（可选）',
      },
      motion: {
        type: 'integer',
        description: '动效旋钮 1-10：1=克制，10=复杂编排，会附加 GSAP 动效方案（可选）',
      },
      density: {
        type: 'integer',
        description: '密度旋钮 1-10：1=宽松，10=紧凑/看板，会覆盖间距刻度（可选）',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: {
          projectName: { type: 'string', required: true },
          category: { type: 'string', required: true },
          pattern: { type: 'object', additionalProperties: true, required: true },
          styles: {
            type: 'array', required: true,
            items: { type: 'object', additionalProperties: true },
          },
          colors: { type: 'object', additionalProperties: true, required: true },
          typography: { type: 'object', additionalProperties: true, required: true },
          keyEffects: { type: 'string' },
          antiPatterns: { type: 'array', items: { type: 'string' } },
          reasoning: { type: 'object', additionalProperties: true },
          uxGuidelines: { type: 'array', items: { type: 'object', additionalProperties: true } },
          stackGuidelines: { type: 'array', items: { type: 'object', additionalProperties: true } },
          dials: { type: 'object', additionalProperties: true },
          motionSnippet: nullableObject,
          spacingScale: nullableObject,
          implementationChecklist: { type: 'array', items: { type: 'string' } },
          designSystemVariables: { type: 'string' },
        },
      },
      render: (_args, value) => [{ type: 'text', text: formatDesignSystem(value) }],
    },
    async execute(args, _exec) {
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
    presentCall: (args) => ({
      card: 'generic',
      title: `生成设计系统：${args.query}`,
      kind: 'search',
      rawInput: args,
    }),
  }),

  // ---- 工具 2：design_review ----
  defineTool({
    name: 'design_review',
    description:
      '按 UX 规范清单审查现有 UI：根据审查对象描述（页面/组件类型、关键词、平台）从 99 条 UX 规范 +' +
      '移动端接口规范 + React 性能规范数据库中检索针对性规则，按严重度（严重/高/中/低）排序，' +
      '并附上交付前通用检查清单（视觉质量/交互/深浅色模式/布局/无障碍/性能/表单/导航）。' +
      '评审页面、检查无障碍、优化交互体验时使用。',
    timeoutMs: 10000,
    parameters: {
      target: {
        type: 'string', required: true,
        description: '审查对象描述，如「移动端登录表单」「数据分析看板」「pricing 页面」',
      },
      platform: {
        type: 'string', enum: ['web', 'mobile', 'desktop', 'react-native', 'flutter'],
        description: '目标平台（可选，默认 web）',
      },
      maxRules: {
        type: 'integer',
        description: '返回的针对性规范条数上限（可选，默认 8）',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: {
          target: { type: 'string', required: true },
          platform: { type: 'string' },
          summary: {
            type: 'object', additionalProperties: true, required: true,
            properties: {
              matchedRules: { type: 'integer', required: true },
              bySeverity: { type: 'object', additionalProperties: true },
              checklistSections: { type: 'integer' },
            },
          },
          priorityRules: {
            type: 'array', required: true,
            items: {
              type: 'object', additionalProperties: true,
              properties: {
                category: { type: 'string' }, issue: { type: 'string' },
                platform: { type: 'string' }, description: { type: 'string' },
                do: { type: 'string' }, dont: { type: 'string' },
                severity: sevEnum, source: { type: 'string' }, score: { type: 'number' },
              },
            },
          },
          checklist: {
            type: 'array', required: true,
            items: {
              type: 'object', additionalProperties: true,
              properties: { category: { type: 'string' }, checks: { type: 'array', items: { type: 'string' } } },
            },
          },
        },
      },
      render: (_args, value) => [{ type: 'text', text: formatReview(value) }],
    },
    async execute(args, _exec) {
      return buildReview({
        target: args.target,
        platform: args.platform || 'web',
        maxRules: args.maxRules || 8,
      })
    },
    presentCall: (args) => ({
      card: 'generic',
      title: `审查 UX：${args.target}`,
      kind: 'search',
      rawInput: args,
    }),
  }),

  // ---- 工具 3：design_search ----
  defineTool({
    name: 'design_search',
    description:
      '在 UI/UX 设计智能库中按领域或技术栈检索：风格、配色、图表、落地页、产品类型、UX 规范、字体搭配、' +
      '图标、动效(GSAP)、React 性能、移动端接口规范、Google 字体，或 22 个技术栈之一。' +
      '返回按相关度排序的中文结构化结果。中文查询自动映射到英文语料。',
    timeoutMs: 15000,
    parameters: {
      query: { type: 'string', required: true, description: '检索关键词，如「glassmorphism dark」「表单 无障碍」「fintech 配色」' },
      domain: {
        type: 'string', enum: DOMAIN_KEYS,
        description: '领域键（可选）：style/color/chart/landing/product/ux/typography/icons/gsap/react/web/google-fonts',
      },
      stack: {
        type: 'string', enum: STACKS,
        description: '技术栈键（可选，与 domain 二选一）：如 react/nextjs/vue/flutter/swiftui/javafx',
      },
      maxResults: { type: 'integer', description: '返回条数上限（可选，默认 3）' },
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
          results: {
            type: 'array', required: true,
            items: {
              type: 'object', additionalProperties: true,
              properties: {
                row: { type: 'object', additionalProperties: true, required: true },
                score: { type: 'number', required: true },
              },
            },
          },
        },
      },
      render: (_args, value) => [{ type: 'text', text: formatSearchResult(value) }],
    },
    async execute(args, _exec) {
      const maxResults = Math.max(1, Math.min(8, args.maxResults || 3))
      if (args.stack) {
        const result = searchStack(args.query, args.stack, maxResults)
        if (result.error) return { error: result.error, domain: 'stack', query: args.query, count: 0, results: [] }
        return result
      }
      return search(args.query, args.domain, maxResults)
    },
    presentCall: (args) => ({
      card: 'generic',
      title: `检索设计库：${args.query}${args.domain ? `（${DOMAIN_LABELS[args.domain] || args.domain}）` : ''}`,
      kind: 'search',
      rawInput: args,
    }),
  }),
  ]
}

// ---------- 插件主体 ----------
export function apply(ctx, _config) {
  // 注册内置技能（skills 缝存在时）
  ctx.inject(['skills'], (skillCtx) => {
    skillCtx.skills.registerProvider(() => skillProvider)
  })

  // 注册三个设计工具
  for (const tool of buildTools()) {
    ctx.tools.register(tool)
  }
}
