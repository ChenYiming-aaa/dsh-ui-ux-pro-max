/**
 * retriever.js — BM25 检索门面（L2）
 *
 * 屏蔽「领域配置 + BM25 引擎 + 数据存储」三者的协作文节：
 *   search / searchStack / detectDomain / 按行数组缓存的索引。
 */

import { BM25, tokenize } from './bm25.js'
import { DOMAIN_CONFIG, DOMAIN_MATCHERS } from '../repo/domains.js'
import { getDomainRows, getFontRows, getStackRows } from '../repo/store.js'
import { STACK_OUTPUT_COLS, STACK_SEARCH_COLS, STACKS } from '../repo/stacks.js'
import { expandQuery, ZH_SHORT_ALIASES } from '../i18n/index.js'
import { LIMITS, RETRIEVAL } from '../config.js'

// ---------- BM25 索引缓存（按行数组） ----------
const _indexCache = new Map()

/**
 * 把「原查询 + 别名扩展」拆成带权重的 token 表。
 *
 * 为什么在 token 层而不是在字符串层去重：`expandQuery` 去重的是词典条目
 * （`dark mode` / `dark` / `dark-mode` 是三个不同字符串），拼成查询串后会被
 * tokenize 拆成同一个 `dark`，于是同一概念被计多次，主属性词被稀释。
 *
 * 原查询 token 权重 1.0，扩展 token 权重 0.6（见 config.RETRIEVAL）。
 * 导出以便测试直接断言权重表，而不必从排序结果反推。
 * @param {string} query
 * @returns {{ expanded: string, terms: Map<string, number> }}
 */
export function buildQueryTerms(query) {
  const expanded = expandQuery(query)
  const terms = new Map()
  for (const token of new Set(tokenize(query))) {
    terms.set(token, RETRIEVAL.primaryWeight)
  }
  for (const token of tokenize(expanded)) {
    if (!terms.has(token)) terms.set(token, RETRIEVAL.expansionWeight)
  }
  return { expanded, terms }
}

function searchRows(rows, searchCols, terms, maxResults, rowFilter = null) {
  if (!rows || rows.length === 0) return []
  const documents = rows.map(row => searchCols.map(col => row[col] ?? '').join(' '))
  let bm25 = _indexCache.get(rows)
  if (!bm25) {
    bm25 = new BM25()
    bm25.fit(documents)
    _indexCache.set(rows, bm25)
  }
  const ranked = bm25.scoreTerms(terms)
  const results = []
  for (const { index, score } of ranked) {
    if (results.length >= maxResults) break
    if (score > 0 && (!rowFilter || rowFilter(rows[index]))) {
      results.push({ row: rows[index], score })
    }
  }
  return results
}

/** 上游 style/stacks 用 Status=deprecated 标记已废弃条目；默认不返回。 */
function isDeprecated(row) {
  return String(row?.Status || '').toLowerCase() === 'deprecated'
}

/** 查询里显式提到 legacy / deprecated 时，允许返回废弃条目（与上游一致）。 */
function asksForLegacy(query) {
  return /\b(?:legacy|deprecated)\b/i.test(String(query))
}

/**
 * 废弃条目的统一召回策略（style 与 stack 一致，不可再分域处理）：
 * 默认排除 Status=deprecated 的行；当查询里显式提到 legacy / deprecated，
 * 或调用方显式传 `includeDeprecated: true` 时放行。
 * @param {string} query
 * @param {{ includeDeprecated?: boolean }} [options]
 * @returns {((row: object) => boolean) | null}
 */
function deprecatedFilter(query, options = {}) {
  if (options.includeDeprecated === true || asksForLegacy(query)) return null
  return row => !isDeprecated(row)
}

const SINGLE_CJK_RE = /^[\u4e00-\u9fff]$/

/**
 * 查询是否是一个**已登记**的汉字（如「图」「色」）。
 *
 * 用单字表判定而不用「是否单字」判定：像「表」「页」这种一字多义的字故意不收
 * （见 short.zh.js），此时应如实返回空结果，而不是拿某个领域的默认条目冒充答案。
 * @param {string} query
 */
function isKnownSingleCjkQuery(query) {
  const trimmed = String(query).trim()
  return SINGLE_CJK_RE.test(trimmed) && Object.hasOwn(ZH_SHORT_ALIASES, trimmed)
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
 * @param {{ includeDeprecated?: boolean }} [options]
 * @returns {{ domain: string, query: string, count: number, results: Array<{row: object, score: number}> }}
 */
export function search(query, domain = null, maxResults = LIMITS.defaultResults, options = {}) {
  const effectiveDomain = domain || detectDomain(query)
  const config = DOMAIN_CONFIG[effectiveDomain] || DOMAIN_CONFIG.style
  const rows = effectiveDomain === 'google-fonts'
    ? getFontRows()
    : getDomainRows(effectiveDomain)

  const { expanded, terms } = buildQueryTerms(query)
  const rowFilter = deprecatedFilter(query, options)
  const matched = searchRows(rows, config.searchCols, terms, maxResults, rowFilter)
  let results = matched.map(({ row, score }) => ({ row: pick(row, config.outputCols), score }))

  // 已登记的单字查询（如「色」）扩展后仍可能零命中：该领域语料是按产品类型/
  // 场景组织的，未必含有扩展词。此时返回领域内的默认条目，比返回空数组更有用
  // ——空数组会被模型解读成「设计库里没有这个领域」。
  // 仅对 short.zh.js 里登记过的字生效，未登记的单字照常返回空。
  if (results.length === 0 && isKnownSingleCjkQuery(query)) {
    results = rows
      .filter(row => !rowFilter || rowFilter(row))
      .slice(0, maxResults)
      .map(row => ({ row: pick(row, config.outputCols), score: 0, fallback: true }))
  }

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
 * @param {{ includeDeprecated?: boolean }} [options]
 */
export function searchStack(query, stack, maxResults = LIMITS.defaultResults, options = {}) {
  if (!STACKS.includes(stack)) {
    return {
      error: `未知技术栈: ${stack}。可用: ${STACKS.join(', ')}`,
      stack,
      count: 0,
      results: [],
    }
  }
  const rows = getStackRows(stack)
  const { expanded, terms } = buildQueryTerms(query)
  const rowFilter = deprecatedFilter(query, options)
  const matched = searchRows(rows, STACK_SEARCH_COLS, terms, maxResults, rowFilter)
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
