#!/usr/bin/env node
/**
 * check-skill.mjs — SKILL.md 与运行时契约一致性守卫（零依赖）
 *
 * 覆盖：
 *   - frontmatter 能被拆分，正文不含 `---` 元数据；
 *   - 三个工具名、12 个检索领域、4 个已登记单字、5 个 platform 枚举；
 *   - 严重度优先 / 降权保留 / fallback / legacy / 空结果等关键口径。
 *
 * 用法: node tests/check-skill.mjs
 */

import { splitFrontmatter } from '../lib/plugin/skill-body.js'
import { DOMAIN_KEYS } from '../lib/repo/domains.js'
import { ZH_SHORT_ALIASES } from '../lib/i18n/index.js'
import { designReviewTool } from '../lib/tools/design-review.js'
import { designSearchTool } from '../lib/tools/design-search.js'
import { assert, section, finish, readText } from './_harness.mjs'

const raw = readText('skills/ui-ux-pro-max/SKILL.md')
const { data, body } = splitFrontmatter(raw)

section('1. frontmatter 与正文')
assert(data.name === 'ui-ux-pro-max', `frontmatter name = ${data.name}`)
assert(typeof data.description === 'string' && data.description.length > 40, 'description 非空')
assert(typeof data.whenToUse === 'string' && data.whenToUse.length > 0, 'whenToUse 非空')
assert(!body.startsWith('---'), '正文不含 frontmatter 分隔线')
assert(!body.includes('\nname: ui-ux-pro-max'), '正文不含 frontmatter name')
assert(body.includes('88 种设计风格') && body.includes('119 条 UX 规范') && body.includes('22 个技术栈'),
  '正文保留能力数字')

section('2. 三个工具')
for (const name of ['design_recommend', 'design_review', 'design_search']) {
  assert(body.includes(`\`${name}\``), `正文引用 ${name}`)
}
assert(body.includes('不要把 `design_recommend` 当搜索框'), '正文写明 design_recommend 的边界')

section('3. 检索领域覆盖')
const domains = designSearchTool.parameters.domain.enum
assert(Array.isArray(domains) && domains.length === DOMAIN_KEYS.length,
  `运行时领域数 ${domains?.length}（${DOMAIN_KEYS.length}）`)
for (const domain of domains) {
  assert(body.includes(`| \`${domain}\` |`), `检索表含领域 ${domain}`)
}

section('4. 单字表')
for (const char of Object.keys(ZH_SHORT_ALIASES)) {
  assert(body.includes(`| \`${char}\` |`), `单字表含 ${char}`)
}
for (const char of ['表', '页']) {
  assert(body.includes(`\`${char}\``), `正文说明「${char}」故意不收录`)
}
assert(body.includes('fallback: true'), '正文解释 fallback: true')

section('5. platform 口径')
for (const platform of designReviewTool.parameters.platform.enum) {
  assert(body.includes(platform), `正文覆盖 platform=${platform}`)
}
assert(body.includes('严重度仍是第一排序键'), '正文写明严重度优先')
assert(body.includes('降权但**保留**'), '正文写明降权保留而非硬过滤')
assert(body.includes('desktop') && body.includes('按 `web` 口径'), '正文写明 desktop=web')

section('6. 结果解读')
for (const keyword of ['legacy', 'deprecated', 'score', '空结果', 'includeDeprecated']) {
  assert(body.includes(keyword), `正文含关键口径 ${keyword}`)
}
assert(body.includes('不是百分比或置信度'), '正文解释 score 不是置信度')

finish('✅ SKILL.md 与运行时契约一致。')
