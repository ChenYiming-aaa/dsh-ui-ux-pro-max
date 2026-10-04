#!/usr/bin/env node
/**
 * smoke.mjs — 离线自检测试（无需 DSH 运行时、无需网络）
 *
 * 直接测试 lib/ 与内置数据库，验证插件的核心行为：
 *   1. 数据库完整性（内置数据、条数、结构）
 *   2. 设计系统生成（产品类型 + 关键词 → 完整建议）
 *   3. UX 审查（严重度排序）
 *   4. 领域/技术栈检索 + 中文查询映射
 *   5. 中文结构化输出
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

// ---------- 1. 内置数据库 ----------
section('1. 内置数据库')
const db = getDb()
assert(db && db.domains && db.stacks && db.reasoning, 'index.json 可加载')
assert(db.domains.style.length >= 67, `设计风格 ${db.domains.style.length} 条`)
assert(db.domains.color.length >= 161, `调色板 ${db.domains.color.length} 条`)
assert(db.domains.typography.length >= 57, `字体搭配 ${db.domains.typography.length} 条`)
assert(db.domains.ux.length >= 99, `UX 规范 ${db.domains.ux.length} 条`)
assert(db.domains.chart.length >= 25, `图表类型 ${db.domains.chart.length} 条`)
assert(Object.keys(db.stacks).length >= 22, `技术栈 ${Object.keys(db.stacks).length} 个`)
assert(getFontRows().length > 1000, `Google 字体 ${getFontRows().length} 条（懒加载）`)
const meta = JSON.parse(readFileSync(new URL('../data/meta.json', import.meta.url), 'utf8'))
assert(meta.totalRows > 4000, `数据总行数 ${meta.totalRows}`)
assert(meta.counts.style === db.domains.style.length, 'meta.json 计数与数据一致')

// ---------- 2. 设计系统生成 ----------
section('2. design_recommend（中文查询）')
const ds = generateDesignSystem({ query: '金融 SaaS 数据看板', projectName: '金融智控台', variance: 8, density: 8, stack: 'react' })
assert(ds.projectName === '金融智控台', '项目名称')
assert(ds.category && ds.category !== 'General', `产品类别识别: ${ds.category}`)
assert(ds.styles.length >= 1 && ds.styles[0].rank === 1, `推荐风格 ${ds.styles.length} 个`)
assert(ds.styles[0]['Style Category'], `首选风格: ${ds.styles[0]['Style Category']}`)
assert(ds.styles[0].reason, '首选风格带理由')
assert(/^#[0-9A-Fa-f]{6}$/.test(ds.colors.primary), `主色 HEX: ${ds.colors.primary}`)
assert(ds.typography.heading && ds.typography.body, `字体组合: ${ds.typography.heading} / ${ds.typography.body}`)
assert(ds.uxGuidelines.length > 0, `UX 规范要点 ${ds.uxGuidelines.length} 条`)
assert(ds.stackGuidelines.length > 0, `技术栈规范 ${ds.stackGuidelines.length} 条`)
assert(ds.dials.variance === 8 && ds.spacingScale.md === '8px', '设计旋钮生效（variance=8 → density 刻度）')

// ---------- 3. UX 审查 ----------
section('3. design_review')
const review = buildReview({ target: '移动端登录表单', platform: 'mobile', maxRules: 8 })
assert(review.priorityRules.length > 0, `命中规范 ${review.priorityRules.length} 条`)
assert(review.checklist.length === 8, `通用检查清单 ${review.checklist.length} 章`)
const sevOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 }
assert(review.priorityRules.every(r => sevOrder[r.severity] !== undefined), '严重度取值合法')
assert(review.priorityRules.every((r, i, a) => i === 0 || sevOrder[a[i - 1].severity] <= sevOrder[r.severity]), '按严重度排序')

// ---------- 4. 检索与中文映射 ----------
section('4. design_search')
assert(search('glassmorphism dark mode', 'style', 3).count > 0, 'style 检索')
assert(search('fintech trust blue', 'color', 2).results[0]?.row.Primary, 'color 检索')
assert(search('实时仪表盘 趋势', 'chart', 3).count > 0, '中文检索（chart）')
assert(searchStack('list performance navigation', 'react-native', 3).count > 0, '技术栈检索（react-native）')
assert(search('金融 数据看板', 'product', 3).count > 0, '中文别名映射')
assert(detectDomain('做一个 landing page 落地页') === 'landing', '领域自动检测（landing）')

// ---------- 5. 中文输出 ----------
section('5. 中文结构化输出')
const md = formatDesignSystem(ds)
assert(md.includes('设计系统建议') && md.includes('推荐风格') && md.includes('配色方案'), '设计系统 Markdown')
assert(formatReview(review).includes('UX 审查清单'), '审查 Markdown')
assert(formatSearchResult(search('毛玻璃 深色', 'style', 2)).includes('设计数据库检索'), '检索 Markdown')
assert(formatTokenSummary(summarizeDesignSystem(ds)).includes('设计令牌摘要'), '令牌摘要 Markdown')

// ---------- 汇总 ----------
console.log('\n========================================')
if (failures === 0) {
  console.log('✅ 全部通过：数据内置、三个工具链路正常、中文优先。')
} else {
  console.log(`❌ ${failures} 项失败`)
  process.exitCode = 1
}
