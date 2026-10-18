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
 *   6. 清单一式两源同步
 *
 * 用法: node tests/smoke.mjs [--quiet]
 */

import { generateDesignSystem, summarizeDesignSystem } from '../lib/domain/design-system.js'
import { buildReview } from '../lib/domain/review.js'
import { QUICK_REFERENCE_CHECKLIST } from '../lib/domain/checklist.js'
import { resolveDial } from '../lib/domain/dials.js'
import { search, searchStack, detectDomain } from '../lib/search/retriever.js'
import { getDb, getFontRows } from '../lib/repo/store.js'
import { getStats } from '../lib/repo/stats.js'
import { expandQuery, SEVERITY_ORDER } from '../lib/i18n/index.js'
import { formatDesignSystem, formatReview, formatSearchResult, formatTokenSummary, clampMarkdown } from '../lib/presentation/index.js'
import { RENDER } from '../lib/config.js'
import { assert, section, finish, configure, readText, readJson } from './_harness.mjs'

configure({ quiet: process.argv.includes('--quiet') })

// ---------- 1. 内置数据库 ----------
section('1. 内置数据库')
const db = getDb()
const meta = readJson('data/meta.json')
const stats = getStats()
assert(db && db.domains && db.stacks && db.reasoning, 'index.json 可加载')
assert(db.domains.style.length >= 67, `设计风格 ${db.domains.style.length} 条`)
assert(db.domains.color.length >= 161, `调色板 ${db.domains.color.length} 条`)
assert(db.domains.typography.length >= 57, `字体搭配 ${db.domains.typography.length} 条`)
assert(db.domains.ux.length >= 99, `UX 规范 ${db.domains.ux.length} 条`)
assert(db.domains.chart.length >= 25, `图表类型 ${db.domains.chart.length} 条`)
assert(Object.keys(db.stacks).length >= 22, `技术栈 ${Object.keys(db.stacks).length} 个`)
assert(getFontRows().length > 1000, `Google 字体 ${getFontRows().length} 条（懒加载）`)
assert(meta.totalRows > 4000, `数据总行数 ${meta.totalRows}`)
assert(meta.counts.style === db.domains.style.length, 'meta.json 计数与数据一致')
assert(stats.capabilities.styles === meta.counts.style, 'stats 能力数字与 meta.json 同源')

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
assert(resolveDial('variance', 8).label === '大胆 / 不对称', '旋钮档位解析')
assert(resolveDial('variance', 99).value === 10, '旋钮越界钳制到 10')

// ---------- 3. UX 审查 ----------
section('3. design_review')
const review = buildReview({ target: '移动端登录表单', platform: 'mobile', maxRules: 8 })
assert(review.priorityRules.length > 0, `命中规范 ${review.priorityRules.length} 条`)
assert(review.checklist.length === 8, `通用检查清单 ${review.checklist.length} 章`)
assert(review.priorityRules.every(r => SEVERITY_ORDER[r.severity] !== undefined), '严重度取值合法')
assert(review.priorityRules.every((r, i, a) => i === 0 || SEVERITY_ORDER[a[i - 1].severity] <= SEVERITY_ORDER[r.severity]), '按严重度排序')

// ---------- 4. 检索与中文映射 ----------
section('4. design_search')
assert(search('glassmorphism dark mode', 'style', 3).count > 0, 'style 检索')
assert(search('fintech trust blue', 'color', 2).results[0]?.row.Primary, 'color 检索')
assert(search('实时仪表盘 趋势', 'chart', 3).count > 0, '中文检索（chart）')
assert(searchStack('list performance navigation', 'react-native', 3).count > 0, '技术栈检索（react-native）')
assert(search('design', 'style', 10).results.every(r => r.row.Status !== 'deprecated'), 'style 默认排除 deprecated')
assert(searchStack('performance', 'react', 10).results.every(r => r.row.Status !== 'deprecated'), 'stack 默认排除 deprecated')
assert(searchStack('legacy', 'react', 10).results.some(r => r.row.Status === 'deprecated'), '显式 legacy 查询保留 deprecated 技术栈规范')
assert(search('金融 数据看板', 'product', 3).count > 0, '中文别名映射')
assert(detectDomain('做一个 landing page 落地页') === 'landing', '领域自动检测（landing）')
const expandedGlass = expandQuery('毛玻璃').split(' ')
assert(new Set(expandedGlass).size === expandedGlass.length, '中文查询扩展无重复关键词（跨别名去重）')
assert(expandedGlass.length > 1, `「毛玻璃」扩展到英文关键词：${expandedGlass.slice(1).join(' / ')}`)

// ---------- 5. 中文输出 ----------
section('5. 中文结构化输出')
const md = formatDesignSystem(ds)
assert(md.includes('设计系统建议') && md.includes('推荐风格') && md.includes('配色方案'), '设计系统 Markdown')
assert(md.length <= RENDER.designSystemChars, `设计系统 Markdown 在渲染预算内（${md.length} ≤ ${RENDER.designSystemChars}）`)
const clamped = clampMarkdown('x'.repeat(RENDER.designSystemChars + 50))
assert(clamped.includes('已截断') && clamped.length < RENDER.designSystemChars + 200, '超长 Markdown 显式截断并提示')
assert(formatReview(review).includes('UX 审查清单'), '审查 Markdown')
assert(formatSearchResult(search('毛玻璃 深色', 'style', 2)).includes('设计数据库检索'), '检索 Markdown')
const summary = summarizeDesignSystem(ds)
assert(formatTokenSummary(summary).includes('设计令牌摘要'), '令牌摘要 Markdown')

// ---------- 6. 交付前清单一式两源同步 ----------
section('6. 清单一源同步（checklist.js vs references/quick-reference.md）')
const quickRefMd = readText('references/quick-reference.md')
// 按 §N 标题切块，统计每块的 `- [ ]` 条目数（色彩专项等非 § 小节无勾选项，不影响）
const mdSectionCounts = quickRefMd.split(/^## §\d+/m).slice(1).map(chunk => (chunk.match(/- \[ \]/g) || []).length)
const jsSectionCounts = QUICK_REFERENCE_CHECKLIST.map(s => s.checks.length)
assert(mdSectionCounts.length === jsSectionCounts.length,
  `清单章节数一致（md ${mdSectionCounts.length} / js ${jsSectionCounts.length}）`)
assert(JSON.stringify(mdSectionCounts) === JSON.stringify(jsSectionCounts),
  `各章节条目数一致（md [${mdSectionCounts}] / js [${jsSectionCounts}]）`)

finish('✅ 全部通过：数据内置、三个工具链路正常、中文优先。')
