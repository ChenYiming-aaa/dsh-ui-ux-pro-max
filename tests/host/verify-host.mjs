#!/usr/bin/env node
/**
 * verify-host.mjs — 用**真实宿主包**校验插件（可移植版，可入库）
 *
 * 与本地专用的 tests/validate-tools.mjs 区别：不硬编码本机 DSH 安装路径，
 * 宿主包位置由 DSH_MODULE_ROOT 指定，因此 CI 可以先把宿主装进临时目录再指过来。
 *
 * 覆盖 DSH-COMPAT §2 的 7 项：
 *   1. 输出 schema 通过宿主 assertSupportedJsonSchema（方言/子集校验）
 *   2. defineTool 编译成功且保留 name / isConcurrencySafe
 *   3. execute 真实执行（三个工具各一次）
 *   4. 返回值通过宿主 validateJsonSchemaValue
 *   5. render / presentCall / presentResult 可执行
 *   6. apply(ctx) 注册 3 个工具 + 1 个技能 provider（注册路径，不只是构造）
 *   7. 技能正文读取、frontmatter 去除、whenToUse
 *
 * 额外覆盖：config Standard Schema、maxResults / reviewRules / skill=false。
 *
 * 用法:
 *   node --import ./tests/host/register.mjs tests/host/verify-host.mjs
 *   DSH_MODULE_ROOT=/tmp/host-021 node --import ./tests/host/register.mjs tests/host/verify-host.mjs
 *
 * 退出码 0 = 该宿主版本可用；1 = 存在不兼容项（CI 矩阵据此判定）。
 */

import { createRequire } from 'node:module'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import { defineTool, assertSupportedJsonSchema, validateJsonSchemaValue } from '@deepseek-ai/dsh-tools'
import { renderSkillContent } from '@deepseek-ai/dsh-skill'
import { apply, Config } from '../../index.js'
import { toolSpecs } from '../../lib/tools/index.js'
import { assert, section, finish } from '../_harness.mjs'

// ---------- 0. 当前解析到的宿主版本 ----------
const moduleRoot = process.env.DSH_MODULE_ROOT || process.cwd()
const hostRequire = createRequire(path.join(moduleRoot, '__resolve__.js'))

function hostVersion(pkg) {
  try {
    return JSON.parse(readFileSync(hostRequire.resolve(`${pkg}/package.json`), 'utf8')).version
  } catch {
    return '未知'
  }
}

const versions = {
  'dsh-tools': hostVersion('@deepseek-ai/dsh-tools'),
  'dsh-skill': hostVersion('@deepseek-ai/dsh-skill'),
}
section(`0. 宿主版本（DSH_MODULE_ROOT=${moduleRoot}）`)
console.log(`  dsh-tools@${versions['dsh-tools']}  dsh-skill@${versions['dsh-skill']}`)
assert(versions['dsh-tools'] !== '未知', '可解析 @deepseek-ai/dsh-tools')
assert(versions['dsh-skill'] !== '未知', '可解析 @deepseek-ai/dsh-skill')

const exec = { signal: new AbortController().signal }

// ---------- 1-2. schema + defineTool ----------
// 注意顺序：spec.output.schema 是 **SchemaSpec**（属性级 required: true），
// 只有经过 defineTool 转换后才是宿主认的标准 JSON Schema（root required: [...]）。
// 先 assert 未转换的 spec 会得到一堆误报，这一点曾在本脚本首版踩中。
section('1. 宿主编译 SchemaSpec（defineTool → assertSupportedJsonSchema）')
const concurrencyArgs = {
  design_recommend: { query: 'x' },
  design_review: { target: 'x' },
  design_search: { query: 'x' },
}
const tools = []
for (const spec of toolSpecs) {
  let tool = null
  try {
    tool = defineTool(spec)
    assert(tool?.name === spec.name, `${spec.name}: defineTool 编译（name 保留）`)
    assert(tool?.isConcurrencySafe?.(concurrencyArgs[spec.name]) === true,
      `${spec.name}: isConcurrencySafe 保留（合法参数）`)
  } catch (error) {
    assert(false, `${spec.name}: defineTool 拒绝 → ${error.message}`)
    continue
  }
  try {
    assertSupportedJsonSchema(tool.output.schema)
    assert(true, `${spec.name}: 转换后的输出 schema 通过宿主方言校验`)
  } catch (error) {
    assert(false, `${spec.name}: 输出 schema 被宿主拒绝 → ${error.message}`)
  }
  const params = tool.parameters || {}
  const required = Array.isArray(params.required) ? params.required : []
  assert(params.type === 'object' && Object.keys(params.properties || {}).length > 0,
    `${spec.name}: 参数被转换为标准 JSON Schema（${Object.keys(params.properties || {}).length} 个）`)
  const specRequired = Object.entries(spec.parameters)
    .filter(([, value]) => value?.required === true).map(([key]) => key)
  assert(specRequired.every(key => required.includes(key)),
    `${spec.name}: 属性级 required 已提升为 root required [${required.join(', ')}]`)
  tools.push(tool)
}

// ---------- 3-4. execute + 返回值校验 ----------
section('2. execute 真实执行并通过返回值校验')
const cases = [
  { name: 'design_recommend', args: { query: '金融 SaaS 数据看板', projectName: '宿主校验', stack: 'react', variance: 8 } },
  { name: 'design_review', args: { target: '移动端登录表单', platform: 'mobile', maxRules: 8 } },
  { name: 'design_search', args: { query: '毛玻璃 深色', domain: 'style', maxResults: 3 } },
]
for (const { name, args } of cases) {
  const tool = tools.find(item => item.name === name)
  if (!tool) { assert(false, `${name}: 未编译成功，跳过执行`); continue }
  try {
    const value = await tool.execute(args, exec)
    validateJsonSchemaValue(tool.output.schema, value, name)
    assert(true, `${name}: 执行 + 返回值通过宿主校验`)
    const rendered = tool.output.render?.(args, value)
    assert(Array.isArray(rendered) && rendered[0]?.type === 'text' && rendered[0].text.length > 0,
      `${name}: render 产出文本`)
    const call = tool.presentCall?.(args)
    assert(!call || call.card === 'generic', `${name}: presentCall 卡片`)
    if (name !== 'design_recommend') {
      const meta = tool.output.presentationMeta?.(args, value)
      assert(meta && typeof meta === 'object', `${name}: presentationMeta 摘要`)
      const presented = tool.presentResult?.(args, {
        isError: false,
        meta,
        content: [{ type: 'text', text: 'x' }],
      })
      assert(presented?.card === 'generic', `${name}: presentResult 卡片`)
      assert(presented.content?.[0]?.text.length < 600, `${name}: 卡片是紧凑摘要`)
    }
  } catch (error) {
    assert(false, `${name}: 执行失败 → ${error.message}`)
  }
}
{
  const searchTool = tools.find(item => item.name === 'design_search')
  let rejected = false
  try {
    await searchTool.execute({ query: 'x', stack: 'not-a-stack' }, exec)
  } catch {
    rejected = true
  }
  assert(rejected, 'design_search 非法 stack 在宿主侧被拒绝（不再返回成功值）')
  const deprecated = await searchTool.execute({ query: 'design', domain: 'style', maxResults: 8, includeDeprecated: true }, exec)
  assert(deprecated.results.some(row => row.row.Status === 'deprecated'),
    'includeDeprecated 在宿主侧生效')
}

// ---------- 5. 注册路径 ----------
section('3. apply(ctx) 注册路径')
const registered = []
const providers = []
const logs = []
const ctx = {
  tools: { register: tool => registered.push(tool) },
  inject: (_deps, callback) => callback({ skills: { registerProvider: fn => providers.push(fn) } }),
  reflect: { get: () => undefined },
  logger: { debug: msg => logs.push(msg) },
}
try {
  apply(ctx, {})
  assert(registered.length === toolSpecs.length, `注册 ${registered.length} 个工具（期望 ${toolSpecs.length}）`)
  assert(registered.every(tool => toolSpecs.some(spec => spec.name === tool.name)), '注册的工具名与规格一致')
  assert(providers.length === 1, `注册 ${providers.length} 个技能 provider`)
  // registerProvider(() => skillProvider)：工厂返回 provider 对象，列表要再调 provider.list()
  const provider = await providers[0]()
  const listed = await provider.list()
  assert(Array.isArray(listed) && listed[0]?.name === 'ui-ux-pro-max', '技能 provider 返回 ui-ux-pro-max 候选')
  const candidate = listed[0]
  assert(typeof candidate.whenToUse === 'string' && candidate.whenToUse.length > 0, '技能候选含 whenToUse')
  assert(typeof candidate.path === 'string' && candidate.path.length > 0, '技能候选含 path')
  const definition = await provider.get(candidate, {})
  assert(Boolean(definition), '技能 provider.get 返回定义')
  if (definition) {
    assert(!definition.content.startsWith('---'), '技能正文已去除 frontmatter')
    assert(!definition.content.includes('\nname: ui-ux-pro-max'), '技能正文不含 frontmatter name')
    assert(definition.whenToUse === candidate.whenToUse, 'whenToUse 在 get 中保留')
    const rendered = renderSkillContent(definition)
    assert(rendered.startsWith('<skill_content') && !rendered.includes('---\nname:'),
      'renderSkillContent 不含 frontmatter')
    const aborted = new AbortController()
    aborted.abort()
    assert((await provider.list({ signal: aborted.signal })).length === 0, 'provider.list 遵守 signal')
    assert((await provider.get(candidate, { signal: aborted.signal })) === undefined,
      'provider.get 遵守 signal')
    const fallbackDefinition = await provider.get(undefined, {})
    assert(fallbackDefinition?.name === 'ui-ux-pro-max', 'get 缺少 candidate 时回退到内置 skill')
  }
} catch (error) {
  assert(false, `apply 抛错 → ${error.message}`)
}

// ---------- 4. 配置面 ----------
section('4. config（Standard Schema + 工具默认值）')
assert(Config['~standard'].validate({ maxResults: 5 }).value?.maxResults === 5,
  'Config 暴露 Standard Schema validate')
const configured = []
const configuredProviders = []
const ctx2 = {
  tools: { register: tool => configured.push(tool) },
  inject: (_deps, callback) => callback({ skills: { registerProvider: fn => configuredProviders.push(fn) } }),
  reflect: { get: () => undefined },
  logger: { debug: () => undefined },
}
apply(ctx2, { maxResults: 1, reviewRules: 2, skill: false })
assert(configured.length === toolSpecs.length, 'config.skill=false 时仍注册三个工具')
assert(configuredProviders.length === 0, 'config.skill=false 跳过技能注册')
const configuredSearch = configured.find(tool => tool.name === 'design_search')
const configuredReview = configured.find(tool => tool.name === 'design_review')
const searchValue = await configuredSearch.execute({ query: 'glassmorphism', domain: 'style' }, exec)
assert(searchValue.count >= 1 && searchValue.count <= 1, `config.maxResults=1 生效（${searchValue.count} 条）`)
const reviewValue = await configuredReview.execute({ target: '移动端登录表单', platform: 'mobile' }, exec)
assert(reviewValue.priorityRules.length <= 2, `config.reviewRules=2 生效（${reviewValue.priorityRules.length} 条）`)
const explicitSearchValue = await configuredSearch.execute({ query: 'glassmorphism', domain: 'style', maxResults: 4 }, exec)
assert(explicitSearchValue.count > 1, '用户显式 maxResults 覆盖配置默认值')

finish(`✅ 宿主 ${versions['dsh-tools']} 兼容：schema / defineTool / execute / render / 注册全部通过。`)
