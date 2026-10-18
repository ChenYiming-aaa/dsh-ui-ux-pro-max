#!/usr/bin/env node
/**
 * contract.mjs — schema ↔ execute 返回值的契约一致性
 *
 * 无需 DSH 运行时：直接跑三个工具的 execute，用与宿主同源的 SchemaSpec
 * 语义校验返回值，并检查 required 字段非空、render/presentCall 可执行。
 *
 * 用法: node tests/contract.mjs
 */

import { toolSpecs } from '../lib/tools/index.js'
import { validateSpecValue, requiredFieldViolations } from '../lib/plugin/schema.js'
import { assert, section, finish } from './_harness.mjs'

const exec = { signal: new AbortController().signal }
const byName = new Map(toolSpecs.map(tool => [tool.name, tool]))

function checkResult(tool, result, label) {
  assert(result !== null && typeof result === 'object' && !Array.isArray(result), `${label} execute 返回对象`)
  const violations = validateSpecValue(tool.output.schema, result)
  assert(violations.length === 0, `${label} 通过 output.schema${violations.length ? ` → ${violations.join(' | ')}` : ''}`)
  const empty = requiredFieldViolations(tool.output.schema, result)
  assert(empty.length === 0, `${label} required 字段非空${empty.length ? ` → ${empty.join(' | ')}` : ''}`)
  assert(JSON.stringify(JSON.parse(JSON.stringify(result))) === JSON.stringify(result), `${label} 是 lossless JSON`)
  const rendered = tool.output.render({}, result)
  assert(Array.isArray(rendered) && rendered[0]?.type === 'text' && rendered[0].text.length > 0, `${label} render 产出文本`)
  return rendered
}

section('1. design_recommend')
{
  const tool = byName.get('design_recommend')
  const args = { query: '金融 SaaS 数据看板', projectName: '契约验证', stack: 'react', variance: 8, motion: 6, density: 8 }
  const result = await tool.execute(args, exec)
  const rendered = checkResult(tool, result, 'design_recommend')
  assert(result.styles.length >= 1, `推荐风格 ${result.styles.length} 个`)
  assert(/^#[0-9A-Fa-f]{6}$/.test(result.colors.primary), `主色 ${result.colors.primary}`)
  assert(result.dials.variance === 8 && result.spacingScale?.md === '8px', '旋钮与间距刻度生效')
  assert(rendered[0].text.includes('设计系统建议'), 'render 中文 Markdown')
  const call = tool.presentCall(args)
  assert(call.card === 'generic' && call.title.includes(args.query), 'presentCall 卡片')
  const meta = tool.output.presentationMeta?.(args, result)
  assert(meta && typeof meta === 'object', 'presentationMeta 产出摘要')
  const presented = tool.presentResult?.(args, { isError: false, meta })
  assert(presented?.card === 'generic' && presented.content?.[0]?.text.includes('设计令牌摘要'), 'presentResult 摘要卡片')
}

section('2. design_review')
{
  const tool = byName.get('design_review')
  const args = { target: '移动端登录表单', platform: 'mobile', maxRules: 8 }
  const result = await tool.execute(args, exec)
  const rendered = checkResult(tool, result, 'design_review')
  assert(result.priorityRules.length > 0, `命中规范 ${result.priorityRules.length} 条`)
  assert(result.summary.matchedRules === result.priorityRules.length, 'summary.matchedRules 与列表一致')
  assert(rendered[0].text.includes('UX 审查清单'), 'render 中文 Markdown')
  const call = tool.presentCall(args)
  assert(call.card === 'generic' && call.title.includes(args.target), 'presentCall 卡片')
  const meta = tool.output.presentationMeta?.(args, result)
  assert(meta?.matchedRules === result.summary.matchedRules, 'design_review presentationMeta 摘要')
  assert(Array.isArray(meta.top) && meta.top.length <= 3, 'design_review meta.top 最多 3 条')
  const presented = tool.presentResult?.(args, { isError: false, meta, content: rendered })
  assert(presented?.card === 'generic' && presented.title.includes(args.target), 'design_review presentResult 卡片')
  assert(presented.content?.[0]?.text.includes('命中规范') && !presented.content[0].text.includes('### 交付前'),
    'design_review 卡片是紧凑摘要而非完整 Markdown')
  assert(tool.presentResult?.(args, { isError: true }) === undefined, 'design_review 错误态不产出卡片')
}

section('3. design_search')
{
  const tool = byName.get('design_search')
  const args = { query: '毛玻璃 深色', domain: 'style', maxResults: 3 }
  const result = await tool.execute(args, exec)
  const rendered = checkResult(tool, result, 'design_search')
  assert(result.count > 0 && result.count <= 3, `命中 ${result.count} 条（≤ maxResults）`)
  assert(rendered[0].text.includes('设计数据库检索'), 'render 中文 Markdown')
  const call = tool.presentCall(args)
  assert(call.card === 'generic' && call.title.includes(args.query), 'presentCall 卡片')
  const meta = tool.output.presentationMeta?.(args, result)
  assert(meta?.count === result.count && meta?.query === args.query, 'design_search presentationMeta 摘要')
  assert(Array.isArray(meta.top) && meta.top.length <= 3, 'design_search meta.top 最多 3 条')
  const presented = tool.presentResult?.(args, { isError: false, meta, content: rendered })
  assert(presented?.card === 'generic' && presented.title.includes(args.query), 'design_search presentResult 卡片')
  assert(presented.content?.[0]?.text.includes('命中') && !presented.content[0].text.includes('### 结果'),
    'design_search 卡片是紧凑摘要而非完整 Markdown')
  assert(tool.presentResult?.(args, { isError: true }) === undefined, 'design_search 错误态不产出卡片')

  const fallbackResult = await tool.execute({ query: '色', domain: 'color', maxResults: 1 }, exec)
  checkResult(tool, fallbackResult, 'design_search(fallback)')
  assert(fallbackResult.results[0]?.fallback === true, '单字领域兜底结果带 fallback: true')

  const withDeprecated = await tool.execute({ query: 'design', domain: 'style', maxResults: 8, includeDeprecated: true }, exec)
  checkResult(tool, withDeprecated, 'design_search(includeDeprecated)')
  assert(withDeprecated.results.some(r => r.row.Status === 'deprecated'), 'includeDeprecated=true 召回 deprecated 风格')
  const withoutDeprecated = await tool.execute({ query: 'design', domain: 'style', maxResults: 8 }, exec)
  assert(withoutDeprecated.results.every(r => r.row.Status !== 'deprecated'), '默认仍排除 deprecated 风格')
}

section('4. design_search（技术栈 / 错误分支）')
{
  const tool = byName.get('design_search')
  const stackResult = await tool.execute({ query: 'list performance navigation', stack: 'react-native', maxResults: 3 }, exec)
  checkResult(tool, stackResult, 'design_search(stack)')
  assert(stackResult.stack === 'react-native' && stackResult.results.length > 0, '技术栈检索命中')

  const errorResult = await tool.execute({ query: 'x', stack: 'not-a-stack' }, exec).then(
    () => null,
    error => error,
  )
  assert(errorResult instanceof Error && /未知技术栈/.test(errorResult.message),
    '未知技术栈抛错（由宿主归一为 isError，而不是成功值）')
}

section('5. 条数钳制')
{
  const tool = byName.get('design_search')
  const low = await tool.execute({ query: 'glassmorphism', domain: 'style', maxResults: 0 }, exec)
  const high = await tool.execute({ query: 'glassmorphism', domain: 'style', maxResults: 999 }, exec)
  assert(low.count >= 1 && low.count <= 3, `maxResults=0 → ${low.count} 条（默认 3）`)
  assert(high.count <= 8, `maxResults=999 → ${high.count} 条（上限 8）`)
}

section('6. 并发分类')
const concurrencyArgs = {
  design_recommend: { query: 'x' },
  design_review: { target: 'x' },
  design_search: { query: 'x' },
}
for (const tool of toolSpecs) {
  assert(tool.isConcurrencySafe?.(concurrencyArgs[tool.name]) === true,
    `${tool.name} 声明 isConcurrencySafe（合法参数）`)
}

finish('✅ 三个工具的 schema 与实际返回完全一致。')
