#!/usr/bin/env node
/**
 * check-sync-parser.mjs — 上游同步 CSV 解析器回归
 *
 * 数据同步依赖 scripts/sync-upstream.mjs 的 CSV 解析器；这里锁定
 * BOM、引号内逗号、"" 转义、字段内换行与空字段，避免再次出现“引号被剥离”
 * 的转码事故。
 *
 * 用法: node tests/check-sync-parser.mjs
 */

import { parseCsv } from '../scripts/sync-upstream.mjs'
import { assert, section, finish } from './_harness.mjs'

section('CSV 解析器')
const text = '\uFEFFName,Code,Notes\n' +
  'A,"<x a=""1"">, b","line1\nline2"\n' +
  'B,,ok\n'
const rows = parseCsv(text)

assert(rows.length === 2, `解析出 ${rows.length} 行数据`)
assert(rows[0].Name === 'A', '普通字段')
assert(rows[0].Code === '<x a="1">, b', '引号内逗号 + "" 转义')
assert(rows[0].Notes === 'line1\nline2', '引号内换行')
assert(rows[1].Code === '', '空字段保留为空字符串')
assert(rows[1].Notes === 'ok', '后续行字段对齐')

finish('✅ CSV 解析器覆盖引号/转义/换行/BOM，未出现截断。')
