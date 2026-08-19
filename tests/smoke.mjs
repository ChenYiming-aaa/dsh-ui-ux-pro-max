#!/usr/bin/env node
/**
 * smoke.mjs — 离线冒烟测试（验收标准验证）
 *
 * 直接测试 lib/ 模块（不依赖 DSH 运行时），验证：
 *  1. 数据库完全内置、离线可用（从 data/*.json 读取）
 *  2. design_recommend：产品类型 + 关键词 → 完整设计系统建议（风格/配色/字体/UX 规范 + 理由）
 *  3. design_review：按 UX 规范清单审查
 *  4. design_search：按领域/技术栈搜索
 *  5. 中文查询 → 英文语料映射
 *
 * 用法: node tests/smoke.mjs [--quiet]
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { generateDesignSystem, summarizeDesignSystem } from '../lib/design-system.js'
import { buildReview } from '../lib/review.js'
import { search, searchStack, getDb, getFontRows, detectDomain } from '../lib/database.js'
import { formatDesignSystem, formatReview, formatSearchResult, formatTokenSummary } from '../lib/format.js'

const quiet = process.argv.includes('--quiet')
let failures = 0

function assert(cond, label) {
  if (cond) {
    if (!quiet) console.log(`  ✅ ${label}`)
  } else {
    failures += 1
    console.log(`  ❌ FAIL: ${label}`)
  }
}

function section(title) {
  console.log(`\n===== ${title} =====`)
}

// ---------- 1. 数据内置 ----------
section('1. 数据库完全内置（离线）')
const db = getDb()
assert(db && db.domains && db.stacks && db.reasoning, 'index.json 已加载 (domains/stacks/reasoning)')
assert(db.domains.style.length >= 67, `风格数据 ${db.domains.style.length} 条 (≥67)`)
assert(db.domains.color.length >= 161, `调色板 ${db.domains.color.length} 条 (≥161)`)
assert(db.domains.typography.length >= 57, `字体搭配 ${db.domains.typography.length} 条 (≥57)`)
assert(db.domains.ux.length >= 99, `UX 规范 ${db.domains.ux.length} 条 (≥99)`)
assert(db.domains.chart.length >= 25, `图表类型 ${db.domains.chart.length} 条 (≥25)`)
assert(Object.keys(db.stacks).length >= 22, `技术栈 ${Object.keys(db.stacks).length} 个 (≥22)`)
const fontRows = getFontRows()
assert(fontRows.length > 1000, `Google 字体库 ${fontRows.length} 条（懒加载）`)
const meta = JSON.parse(readFileSync(new URL('../data/meta.json', import.meta.url), 'utf8'))
assert(meta.totalRows === 4200, `总行数 ${meta.totalRows}（=4200）`)

// ---------- 2. design_recommend ----------
section('2. design_recommend：金融 SaaS 数据看板（中文查询）')
const ds = generateDesignSystem({ query: '金融 SaaS 数据看板', projectName: '金融智控台', variance: 8, density: 8, stack: 'react' })
assert(ds.projectName === '金融智控台', '项目名称正确')
assert(ds.category && ds.category !== '', `产品类别: ${ds.category}`)
assert(ds.styles.length >= 1, `推荐风格 ${ds.styles.length} 个`)
assert(ds.styles[0]['Style Category'] && ds.styles[0].rank === 1, `首选风格: ${ds.styles[0]['Style Category']}`)
assert(ds.styles[0].reason && ds.styles[0].reason.length > 0, '首选风格带理由')
assert(/^#[0-9A-Fa-f]{6}$/.test(ds.colors.primary), `主色 HEX: ${ds.colors.primary}`)
assert(/^#[0-9A-Fa-f]{6}$/.test(ds.colors.accent), `强调色 HEX: ${ds.colors.accent}`)
assert(ds.typography.heading && ds.typography.body, `字体组合: ${ds.typography.heading} / ${ds.typography.body}`)
assert(ds.uxGuidelines.length > 0, `UX 规范要点 ${ds.uxGuidelines.length} 条`)
assert(ds.stackGuidelines.length > 0, `React 技术栈规范 ${ds.stackGuidelines.length} 条`)
assert(ds.dials.variance === 8 && ds.dials.density === 8, '旋钮生效 (variance=8, density=8)')
assert(ds.spacingScale && ds.spacingScale.md === '8px', `密度刻度生效 md=${ds.spacingScale?.md}`)
assert(ds.reasoning.decisionRules && typeof ds.reasoning.decisionRules === 'object', '决策规则存在')
assert(ds.antiPatterns.length >= 0, '反模式字段存在')

section('design_recommend：美容 SPA（不同类别，英文查询）')
const ds2 = generateDesignSystem({ query: 'beauty spa wellness service', projectName: 'Serenity Spa' })
assert(ds2.category.toLowerCase().includes('beauty') || ds2.category.toLowerCase().includes('spa'), `类别: ${ds2.category}`)
assert(ds2.colors.primary && /^#/.test(ds2.colors.primary), `配色: ${ds2.colors.primary}`)

// ---------- 3. design_review ----------
section('3. design_review：移动端登录表单')
const review = buildReview({ target: '移动端登录表单', platform: 'mobile', maxRules: 8 })
assert(review.target === '移动端登录表单', '审查对象正确')
assert(review.priorityRules.length > 0, `命中规范 ${review.priorityRules.length} 条`)
assert(review.checklist.length === 8, `通用清单 ${review.checklist.length} 个章节`)
const sevOk = review.priorityRules.every(r => ['Critical', 'High', 'Medium', 'Low'].includes(r.severity))
assert(sevOk, '严重度均已归一化')
const sorted = review.priorityRules.every((r, i, arr) =>
  i === 0 || (severityRank(arr[i - 1].severity) <= severityRank(r.severity)))
function severityRank(s) { return { Critical: 0, High: 1, Medium: 2, Low: 3 }[s] ?? 9 }
assert(sorted, '按严重度优先排序')

// ---------- 4. design_search ----------
section('4. design_search：按领域检索')
const styleSearch = search('glassmorphism dark mode', 'style', 3)
assert(styleSearch.count > 0, `style 检索命中 ${styleSearch.count} 条`)
assert(styleSearch.results.every(r => typeof r.score === 'number' && r.score > 0), '结果带相关度分数')

const colorSearch = search('fintech trust blue', 'color', 2)
assert(colorSearch.count > 0 && colorSearch.results[0].row.Primary, `color 检索命中 ${colorSearch.count} 条`)

const chartSearch = search('实时仪表盘 趋势', 'chart', 3)
assert(chartSearch.count > 0, `chart 中文检索命中 ${chartSearch.count} 条`)

const stackSearch = searchStack('list performance navigation', 'react-native', 3)
assert(stackSearch.count > 0, `react-native 技术栈检索命中 ${stackSearch.count} 条`)

// 中文别名映射
const zhSearch = search('金融 数据看板', 'product', 3)
assert(zhSearch.count > 0, `中文别名映射命中 ${zhSearch.count} 条`)

// 领域自动检测
assert(detectDomain('做一个 landing page 落地页') === 'landing', '中文自动检测 landing')
assert(detectDomain('form accessibility 表单 无障碍') === 'ux', '自动检测 ux')

// ---------- 5. 输出格式化 ----------
section('5. 中文结构化输出')
const md = formatDesignSystem(ds)
assert(md.includes('设计系统建议') && md.includes('推荐风格') && md.includes('配色方案') && md.includes('字体搭配'), '设计系统 Markdown 中文输出完整')
const md2 = formatReview(review)
assert(md2.includes('UX 审查清单') && md2.includes('交付前通用检查清单'), '审查 Markdown 中文输出完整')
const md3 = formatSearchResult(styleSearch)
assert(md3.includes('设计数据库检索') && md3.includes('结果 1'), '检索 Markdown 中文输出完整')
const summary = summarizeDesignSystem(ds)
const md4 = formatTokenSummary(summary)
assert(md4.includes('设计令牌摘要') && /^#[0-9A-Fa-f]{6}$/.test(summary.palette.primary), '令牌摘要输出完整')

// ---------- 汇总 ----------
console.log(`\n========================================`)
if (failures === 0) {
  console.log('✅ 全部冒烟测试通过：数据库内置、离线可用，工具链路（推荐/审查/检索）正常，中文优先。')
} else {
  console.log(`❌ ${failures} 项断言失败`)
  process.exitCode = 1
}
