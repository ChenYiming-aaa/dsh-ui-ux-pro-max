#!/usr/bin/env node
/**
 * check-columns.mjs — 列配置与真实数据的「子集」守卫
 *
 * domains.js / stacks.js 的 searchCols / outputCols 是手工与上游数据同步的。
 * 一旦上游重命名或删除列，retriever 的 pick() 会因 `if (col in row)` 静默跳过，
 * 表现为「工具正常返回、但字段莫名消失」——没有测试会报警。
 *
 * 本测试把这条隐式契约变成断言：
 *   1. 每个领域的 searchCols / outputCols ⊆ 该领域所有行的实际列并集
 *   2. STACK_SEARCH_COLS / STACK_OUTPUT_COLS 对**每一个**技术栈都成立
 *      （而不只是抽样一个，历史问题就是只测了 react）
 *   3. FIELD_LABELS 覆盖全部 outputCols（缺标签会让本地化退化，见 R2）
 *   4. 配置里没有重复列（重复会导致同一字段被检索两次、tf 虚高）
 *
 * 纯数据、零依赖、不 import 宿主，可直接在 CI 跑。
 *
 * 用法: node tests/check-columns.mjs
 */

import { DOMAIN_CONFIG } from '../lib/repo/domains.js'
import { STACKS, STACK_OUTPUT_COLS, STACK_SEARCH_COLS } from '../lib/repo/stacks.js'
import { getDomainRows, getFontRows, getStackRows } from '../lib/repo/store.js'
import { FIELD_LABELS } from '../lib/i18n/labels.js'
import { assert, section, finish } from './_harness.mjs'

/** 某领域所有行的列并集（容忍缺字段的行） */
function columnsOf(rows) {
  const cols = new Set()
  for (const row of rows) for (const key of Object.keys(row)) cols.add(key)
  return cols
}

function missing(cols, wanted) {
  return wanted.filter(col => !cols.has(col))
}

function duplicated(cols) {
  return cols.filter((col, index) => cols.indexOf(col) !== index)
}

const domains = Object.keys(DOMAIN_CONFIG)

section('1. 领域列配置 ⊆ 实际列')
for (const domain of domains) {
  const rows = domain === 'google-fonts' ? getFontRows() : getDomainRows(domain)
  assert(Array.isArray(rows) && rows.length > 0, `${domain}: 数据非空（${rows?.length ?? 0} 行）`)
  const cols = columnsOf(rows || [])
  const cfg = DOMAIN_CONFIG[domain]

  const missSearch = missing(cols, cfg.searchCols)
  assert(missSearch.length === 0,
    `${domain}: searchCols ⊆ 实际列${missSearch.length ? ` → 缺 ${missSearch.join(', ')}` : ''}`)

  const missOutput = missing(cols, cfg.outputCols)
  assert(missOutput.length === 0,
    `${domain}: outputCols ⊆ 实际列${missOutput.length ? ` → 缺 ${missOutput.join(', ')}` : ''}`)

  assert(duplicated(cfg.searchCols).length === 0, `${domain}: searchCols 无重复`)
  assert(duplicated(cfg.outputCols).length === 0, `${domain}: outputCols 无重复`)
  assert(cfg.searchCols.length > 0 && cfg.outputCols.length > 0,
    `${domain}: 检索列 ${cfg.searchCols.length} / 输出列 ${cfg.outputCols.length}`)
}

section('2. 技术栈列配置对每个 stack 成立')
assert(STACKS.length >= 22, `技术栈 ${STACKS.length} 个`)
for (const stack of STACKS) {
  const rows = getStackRows(stack)
  assert(Array.isArray(rows) && rows.length > 0, `${stack}: 数据非空（${rows?.length ?? 0} 行）`)
  const cols = columnsOf(rows || [])

  const missSearch = missing(cols, STACK_SEARCH_COLS)
  assert(missSearch.length === 0,
    `${stack}: STACK_SEARCH_COLS ⊆ 实际列${missSearch.length ? ` → 缺 ${missSearch.join(', ')}` : ''}`)

  const missOutput = missing(cols, STACK_OUTPUT_COLS)
  assert(missOutput.length === 0,
    `${stack}: STACK_OUTPUT_COLS ⊆ 实际列${missOutput.length ? ` → 缺 ${missOutput.join(', ')}` : ''}`)
}

section('3. 中文字段标签覆盖全部输出列')
for (const domain of domains) {
  const labels = FIELD_LABELS[domain] || {}
  const miss = DOMAIN_CONFIG[domain].outputCols.filter(col => !labels[col])
  assert(miss.length === 0,
    `${domain}: outputCols 均有中文标签${miss.length ? ` → 缺 ${miss.join(', ')}` : ''}`)
}
{
  const labels = FIELD_LABELS.stack || {}
  const miss = STACK_OUTPUT_COLS.filter(col => !labels[col])
  assert(miss.length === 0,
    `stack: STACK_OUTPUT_COLS 均有中文标签${miss.length ? ` → 缺 ${miss.join(', ')}` : ''}`)
}

section('4. 输出列不是「存在但全空」')
// 上游可能保留列名却清空内容（或改名为另一个大小写变体），此时子集断言仍绿，
// 但工具会输出一片空字段。这里按列检查「至少一行有非空值」。
const nonEmpty = (rows, col) => (rows || []).some(row => {
  const value = row[col]
  if (value === undefined || value === null) return false
  return String(value).trim().length > 0
})
for (const domain of domains) {
  const rows = domain === 'google-fonts' ? getFontRows() : getDomainRows(domain)
  const empty = DOMAIN_CONFIG[domain].outputCols.filter(col => !nonEmpty(rows, col))
  assert(empty.length === 0, `${domain}: 输出列均有内容${empty.length ? ` → 全空 ${empty.join(', ')}` : ''}`)
}

finish('✅ 列配置与真实数据完全对齐：无缺列、无重复、标签全覆盖、无全空列。')
