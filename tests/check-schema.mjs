#!/usr/bin/env node
/**
 * check-schema.mjs — DSH SchemaSpec 方言合规测试
 *
 * 这些方言约束（属性级 required、items 内禁 required、禁 type 数组、禁数值边界）
 * 写错时只有宿主运行时会报错；这里在 CI 阶段就拦下。
 *
 * 用法: node tests/check-schema.mjs
 */

import { toolSpecs } from '../lib/tools/index.js'
import { toolSchemaViolations } from '../lib/plugin/schema.js'
import { assert, section, finish } from './_harness.mjs'

section('1. 三个工具规格')
assert(toolSpecs.length === 3, `工具数量 ${toolSpecs.length}`)
for (const tool of toolSpecs) {
  const violations = toolSchemaViolations(tool)
  assert(violations.length === 0, `${tool.name} 方言合规${violations.length ? ` → ${violations.join(' | ')}` : ''}`)
  assert(tool.output.schema.type === 'object', `${tool.name} 输出 schema 为 object 根`)
  assert(typeof tool.output.render === 'function', `${tool.name} 声明 render`)
  assert(tool.timeoutMs > 0, `${tool.name} timeoutMs=${tool.timeoutMs}`)
}

section('2. 参数助手产物')
const rec = toolSpecs[0]
assert(rec.parameters.query.required === true, 'query 为必填属性')
assert(rec.parameters.stack.enum.includes('react'), 'stack 使用技术栈枚举')
assert(rec.parameters.variance.type === 'integer', 'variance 为 integer（无 bounds）')
assert(!Object.hasOwn(rec.parameters.variance, 'minimum'), 'variance 不在 schema 内声明数值边界')

section('3. 负例：守卫必须能拦住')
const invalidCases = [
  {
    label: 'type 数组',
    tool: { ...rec, output: { ...rec.output, schema: { type: ['string', 'null'] } } },
  },
  {
    label: 'items 内 required',
    tool: {
      ...rec,
      output: {
        ...rec.output,
        schema: {
          type: 'object', additionalProperties: true,
          properties: {
            list: {
              type: 'array',
              items: {
                type: 'object', additionalProperties: true,
                properties: { name: { type: 'string', required: true } },
              },
            },
          },
        },
      },
    },
  },
  {
    label: 'numeric bounds',
    tool: {
      ...rec,
      parameters: { ...rec.parameters, variance: { type: 'integer', minimum: 1, maximum: 10 } },
    },
  },
  {
    label: 'oneOf 只有 1 个分支',
    tool: { ...rec, output: { ...rec.output, schema: { oneOf: [{ type: 'null' }] } } },
  },
  {
    label: 'object 缺少 additionalProperties',
    tool: { ...rec, output: { ...rec.output, schema: { type: 'object', properties: {} } } },
  },
  {
    label: '非法工具名',
    tool: { ...rec, name: 'Design Recommend' },
  },
]
for (const { label, tool } of invalidCases) {
  const violations = toolSchemaViolations(tool)
  assert(violations.length > 0, `拦住：${label}${violations.length ? ` → ${violations[0]}` : ''}`)
}

finish('✅ SchemaSpec 方言合规，负例均被拦截。')
