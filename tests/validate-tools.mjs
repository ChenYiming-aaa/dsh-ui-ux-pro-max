#!/usr/bin/env node
/**
 * validate-tools.mjs — 用 DSH 真实运行时校验插件工具定义
 *
 * 通过自定义 loader 把 @deepseek-ai/* 解析到本机 DSH Desktop 的 dsh-tools /
 * dsh-skill 实际版本，然后：
 *  1. buildTools() 触发 defineTool 的 schema DSL 编译（违规会直接抛错）
 *  2. 断言编译后的 output schema 属于受支持 JSON Schema 子集
 *  3. 对每个工具用样例参数调用 execute，再以 validateJsonSchemaValue 校验输出
 *  4. 校验 render / presentCall 可执行
 *
 * 用法: node --import ./tests/register-loader.mjs tests/validate-tools.mjs
 */

import { validateJsonSchemaValue, assertSupportedJsonSchema } from '@deepseek-ai/dsh-tools'
import { buildTools } from '../index.js'

let failures = 0
function assert(cond, label) {
  if (cond) console.log(`  ✅ ${label}`)
  else { failures += 1; console.log(`  ❌ FAIL: ${label}`) }
}

const signal = new AbortController().signal
const exec = { signal }

console.log('===== 工具定义 schema 校验（defineTool 编译 + assertSupportedJsonSchema）=====')
const tools = buildTools()
assert(tools.length === 3, `buildTools() 返回 ${tools.length} 个工具`)
// defineTool 内部已用 valueSchemaSpecToJsonSchema 编译校验（违规会在此抛错）；
// tool.output.schema 此时已是编译后的 JSON Schema，直接断言其属于受支持子集。
for (const tool of tools) {
  assertSupportedJsonSchema(tool.output.schema)
  console.log(`  ✅ ${tool.name}: parameters/output schema 通过 dsh-tools 编译与子集校验`)
}

console.log('\n===== execute + 输出 schema 校验 =====')

// design_recommend
{
  const tool = tools.find(t => t.name === 'design_recommend')
  const args = { query: '金融 SaaS 数据看板', projectName: '金融智控台', stack: 'react', variance: 8, density: 8 }
  const result = await tool.execute(args, exec)
  assert(result.projectName === '金融智控台', 'design_recommend: 项目名称')
  assert(result.styles.length >= 1 && result.styles[0].rank === 1, `design_recommend: 推荐风格 ${result.styles.length} 个`)
  assert(/^#[0-9A-Fa-f]{6}$/.test(result.colors.primary), `design_recommend: 主色 ${result.colors.primary}`)
  assert(result.typography.heading && result.typography.body, 'design_recommend: 字体组合')
  assert(result.stackGuidelines.length > 0, `design_recommend: React 技术栈规范 ${result.stackGuidelines.length} 条`)
  assert(result.motionSnippet === null || typeof result.motionSnippet === 'object', 'design_recommend: motionSnippet 可空')
  validateJsonSchemaValue(tool.output.schema, result, 'design_recommend')
  console.log('  ✅ design_recommend: 输出通过 schema 校验')
  const rendered = tool.output.render(args, result)
  assert(Array.isArray(rendered) && rendered[0].type === 'text' && rendered[0].text.includes('设计系统建议'), 'design_recommend: render 输出中文文本')
  const pc = tool.presentCall(args)
  assert(pc.card === 'generic' && pc.title.includes('金融'), 'design_recommend: presentCall')
}

// design_review
{
  const tool = tools.find(t => t.name === 'design_review')
  const args = { target: '移动端登录表单', platform: 'mobile', maxRules: 10 }
  const result = await tool.execute(args, exec)
  assert(result.priorityRules.length > 0, `design_review: 命中 ${result.priorityRules.length} 条`)
  assert(result.checklist.length === 8, `design_review: 通用清单 ${result.checklist.length} 章`)
  const sevOk = result.priorityRules.every(r => ['Critical', 'High', 'Medium', 'Low'].includes(r.severity))
  assert(sevOk, 'design_review: 严重度枚举合法')
  validateJsonSchemaValue(tool.output.schema, result, 'design_review')
  console.log('  ✅ design_review: 输出通过 schema 校验')
  const rendered = tool.output.render(args, result)
  assert(rendered[0].text.includes('UX 审查清单'), 'design_review: render 中文输出')
}

// design_search（领域）
{
  const tool = tools.find(t => t.name === 'design_search')
  const args = { query: '毛玻璃 深色', domain: 'style', maxResults: 3 }
  const result = await tool.execute(args, exec)
  assert(result.domain === 'style' && result.count > 0, `design_search: style 命中 ${result.count} 条`)
  assert(result.results.every(r => r.score > 0), 'design_search: 带相关度分数')
  validateJsonSchemaValue(tool.output.schema, result, 'design_search')
  console.log('  ✅ design_search: 输出通过 schema 校验')
}

// design_search（技术栈）
{
  const tool = tools.find(t => t.name === 'design_search')
  const args = { query: 'list 性能 导航', stack: 'react-native', maxResults: 3 }
  const result = await tool.execute(args, exec)
  assert(result.stack === 'react-native' && result.count > 0, `design_search: react-native 命中 ${result.count} 条`)
  validateJsonSchemaValue(tool.output.schema, result, 'design_search stack')
  console.log('  ✅ design_search(stack): 输出通过 schema 校验')
}

// design_search（未知技术栈 → schema 层拦截）
{
  const tool = tools.find(t => t.name === 'design_search')
  let threw = false
  try {
    await tool.execute({ query: 'x', stack: 'not-a-stack' }, exec)
  } catch (err) {
    threw = true
    assert(String(err.message).includes('must be one of'), 'design_search: 非法 stack 被 enum 校验拦截并给出清晰错误')
  }
  assert(threw, 'design_search: 非法 stack 抛错')
}

console.log('\n========================================')
if (failures === 0) {
  console.log('✅ 工具定义全部通过 DSH 真实运行时的 schema/执行校验（defineTool 编译、输出 schema、render、presentCall）。')
} else {
  console.log(`❌ ${failures} 项断言失败`)
  process.exitCode = 1
}
