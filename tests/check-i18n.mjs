#!/usr/bin/env node
/**
 * check-i18n.mjs — 中文词典完整性
 *
 * 1) 源文件里不能有重复的键（JS 对象会静默让后者覆盖前者）
 * 2) 每个别名值必须是非空的英文关键词数组
 * 3) expandQuery 的结果不能有重复 token（避免稀释 BM25 打分）
 *
 * 用法: node tests/check-i18n.mjs
 */

import { ZH_ALIASES, expandQuery } from '../lib/i18n/index.js'
import { assert, section, finish, readText } from './_harness.mjs'

section('1. 词典源文件')
const source = readText('lib/i18n/aliases.zh.js')
const sourceKeys = [...source.matchAll(/^\s{2}([^:\n]+):\s*\[/gm)].map(match => match[1].trim())
const seen = new Set()
const duplicates = []
for (const key of sourceKeys) {
  if (seen.has(key)) duplicates.push(key)
  seen.add(key)
}
assert(sourceKeys.length > 300, `词典条目 ${sourceKeys.length} 个`)
assert(duplicates.length === 0, `无重复键${duplicates.length ? ` → ${duplicates.join(', ')}` : ''}`)
assert(Object.keys(ZH_ALIASES).length === sourceKeys.length, '运行时条目数与源文件一致')

section('2. 词条结构')
const badValues = Object.entries(ZH_ALIASES)
  .filter(([, value]) => !Array.isArray(value) || value.length === 0 || !value.every(item => typeof item === 'string' && item.length > 0))
  .map(([key]) => key)
assert(badValues.length === 0, `所有词条为非空字符串数组${badValues.length ? ` → ${badValues.join(', ')}` : ''}`)
assert(Object.keys(ZH_ALIASES).every(key => key.trim().length > 0), '无空键')

section('3. 查询扩展')
const query = '导航 学术期刊 远程医疗 低代码平台'
const expandedString = expandQuery(query)
const expanded = expandedString.split(' ')
assert(expanded.length > 1, `扩展到 ${expanded.length} 个 token`)
assert(new Set(expanded).size === expanded.length, '扩展结果无重复 token')
assert(expandedString.includes('academic journal'), '新词条「学术期刊」命中 academic journal')
assert(expanded.includes('telemedicine'), '新词条「远程医疗」命中 telemedicine')
assert(expanded.includes('low-code'), '新词条「低代码」命中 low-code')

finish('✅ 中文词典无重复键、结构合法、扩展结果去重。')
