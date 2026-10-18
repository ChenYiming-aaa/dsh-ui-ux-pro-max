#!/usr/bin/env node
/**
 * check-config.mjs — 插件配置面（L5）的零依赖守卫
 *
 * 覆盖：
 *   - 默认值 / 范围校验 / 类型校验；
 *   - Standard Schema 适配层返回 value 或 issues；
 *   - applyToolDefaults 只注入 design_search.maxResults 与 design_review.maxRules，
 *     且用户显式传值优先、不修改原 spec。
 *
 * 用法: node tests/check-config.mjs
 */

import {
  Config,
  DEFAULT_CONFIG,
  applyToolDefaults,
  normalizeConfig,
} from '../lib/plugin/config.js'
import { assert, section, finish } from './_harness.mjs'

section('1. 默认值与规范化')
assert(JSON.stringify(normalizeConfig({})) === JSON.stringify(DEFAULT_CONFIG), '空配置等于默认值')
assert(normalizeConfig({ maxResults: 5 }).maxResults === 5, 'maxResults 可覆盖')
assert(normalizeConfig({ reviewRules: 12 }).reviewRules === 12, 'reviewRules 可覆盖')
assert(normalizeConfig({ skill: false }).skill === false, 'skill 可关闭')
assert(normalizeConfig({ unknown: 'ignored' }).maxResults === 3, '未知字段被忽略')

section('2. 非法配置被拒绝')
for (const [label, raw] of [
  ['null', null],
  ['数组', []],
  ['maxResults 非整数', { maxResults: '3' }],
  ['maxResults 越界', { maxResults: 9 }],
  ['reviewRules 越界', { reviewRules: 0 }],
  ['skill 非布尔', { skill: 'yes' }],
]) {
  let rejected = false
  try {
    normalizeConfig(raw)
  } catch (error) {
    rejected = error instanceof TypeError
  }
  assert(rejected, `${label} → TypeError`)
}

section('3. Standard Schema')
const ok = Config['~standard'].validate({ maxResults: 6, reviewRules: 4, skill: false })
assert(ok.value?.maxResults === 6 && ok.value?.reviewRules === 4 && ok.value?.skill === false,
  'validate 返回规范化 value')
const bad = Config['~standard'].validate({ maxResults: 0 })
assert(Array.isArray(bad.issues) && bad.issues.length > 0, 'validate 返回 issues')
assert(Config['~standard'].version === 1 && Config['~standard'].vendor === 'dsh-ui-ux-pro-max',
  'Standard Schema 元信息')

section('4. applyToolDefaults')
{
  const calls = []
  const search = {
    name: 'design_search',
    async execute(args) { calls.push(args); return args },
  }
  const wrapped = applyToolDefaults(search, normalizeConfig({ maxResults: 2 }))
  const defaults = await wrapped.execute({ query: 'x' })
  const explicit = await wrapped.execute({ query: 'x', maxResults: 1 })
  assert(defaults.maxResults === 2, 'design_search 注入 maxResults 默认值')
  assert(explicit.maxResults === 1, '用户显式 maxResults 优先')
  assert(calls.length === 2, 'wrapper 实际调用原 spec')
  assert((await search.execute({ query: 'x' })).maxResults === undefined, '原 spec 未被修改')

  const review = {
    name: 'design_review',
    async execute(args) { return args },
  }
  const wrappedReview = applyToolDefaults(review, normalizeConfig({ reviewRules: 4 }))
  assert((await wrappedReview.execute({ target: 'x' })).maxRules === 4,
    'design_review 注入 reviewRules 默认值')

  const recommend = {
    name: 'design_recommend',
    async execute(args) { return args },
  }
  assert(applyToolDefaults(recommend, DEFAULT_CONFIG) === recommend, 'design_recommend 原样返回')
}

finish('✅ 配置面默认值 / 校验 / 工具注入全部符合预期。')
