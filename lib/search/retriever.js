/**
 * retriever.js — BM25 检索门面（L2）
 *
 * 屏蔽「领域配置 + BM25 引擎 + 数据存储」三者的协作文节：
 *   search / searchStack / detectDomain / 按行数组缓存的索引。
 */

import { BM25 } from './bm25.js'
import { DOMAIN_CONFIG, DOMAIN_MATCHERS } from '../repo/domains.js'
import { getDomainRows, getFontRows, getStackRows } from '../repo/store.js'
import { STACK_OUTPUT_COLS, STACK_SEARCH_COLS, STACKS } from '../repo/stacks.js'
import { expandQuery } from '../i18n/index.js'
import { LIMITS } from '../config.js'

// ---------- BM25 索引缓存（按行数组） ----------
const _indexCache = new Map()

function searchRows(rows, searchCols, query, maxResults) {
  if (!rows || rows.length === 0) return []
  const documents = rows.map(row => searchCols.map(col => row[col] ?? '').join(' '))
  let bm25 = _indexCache.get(rows)
  if (!bm25) {
    bm25 = new BM25()
    bm25.fit(documents)
    _indexCache.set(rows, bm25)
  }
  const ranked = bm25.score(query)
  const results = []
  for (const { index, score } of ranked) {
    if (results.length >= maxResults) break
    if (score > 0) results.push({ row: rows[index], score })
  }
  return results
}

/** 按列挑选字段（完整输出时合并 search + output 列）。 */
function pick(row, cols) {
  const out = {}
  for (const col of cols) {
    if (col in row) out[col] = row[col]
  }
  return out
}

/**
 * 领域搜索。
 * @param {string} query - 查询（中文自动扩展）
 * @param {string|null} domain - 领域键；缺省时自动检测
 * @param {number} maxResults
 * @returns {{ domain: string, query: string, count: number, results: Array<{row: object, score: number}> }}
 */
export function search(query, domain = null, maxResults = LIMITS.defaultResults) {
  const effectiveDomain = domain || detectDomain(query)
  const config = DOMAIN_CONFIG[effectiveDomain] || DOMAIN_CONFIG.style
  const rows = effectiveDomain === 'google-fonts'
    ? getFontRows()
    : getDomainRows(effectiveDomain)

  const expanded = expandQuery(query)
  const matched = searchRows(rows, config.searchCols, expanded, maxResults)
  const results = matched.map(({ row, score }) => ({ row: pick(row, config.outputCols), score }))

  return {
    domain: effectiveDomain,
    query,
    expandedQuery: expanded,
    count: results.length,
    results,
  }
}

/**
 * 技术栈搜索。
 * @param {string} query
 * @param {string} stack - 技术栈键（见 STACKS）
 * @param {number} maxResults
 */
export function searchStack(query, stack, maxResults = LIMITS.defaultResults) {
  if (!STACKS.includes(stack)) {
    return {
      error: `未知技术栈: ${stack}。可用: ${STACKS.join(', ')}`,
      stack,
      count: 0,
      results: [],
    }
  }
  const rows = getStackRows(stack)
  const expanded = expandQuery(query)
  const matched = searchRows(rows, STACK_SEARCH_COLS, expanded, maxResults)
  return {
    domain: 'stack',
    stack,
    query,
    expandedQuery: expanded,
    count: matched.length,
    results: matched.map(({ row, score }) => ({ row: pick(row, STACK_OUTPUT_COLS), score })),
  }
}

/**
 * 自动检测最相关的领域。
 * @param {string} query
 * @returns {string}
 */
export function detectDomain(query) {
  const q = expandQuery(query).toLowerCase()
  let best = 'style'
  let bestScore = 0
  for (const { domain, wordRes, substrings } of DOMAIN_MATCHERS) {
    let score = 0
    for (const re of wordRes) { if (re.test(q)) score += 1 }
    for (const s of substrings) { if (q.includes(s)) score += 1 }
    if (score > bestScore) { bestScore = score; best = domain }
  }
  return best
}
