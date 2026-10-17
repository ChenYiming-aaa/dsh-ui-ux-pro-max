/**
 * query.js — 中文查询扩展（L1 纯函数）
 *
 * 把中文产品类型/风格/场景词映射到英文语料关键词，使 BM25 能命中以英文为主
 * 的设计数据库。逻辑与词典分离：词典在 aliases.zh.js。
 */

import { ZH_ALIASES } from './aliases.zh.js'

/**
 * 将中文查询扩展为「原查询 + 英文关键词」。
 * 命中一个别名时，取其前 2 个英文关键词（控制噪音）；跨别名去重，
 * 避免同一英文词重复注入稀释 BM25 打分（如「毛玻璃」曾展开出
 * "glassmorphism glass glassmorphism glass"）。
 * @param {string} query - 原始查询（可为中英混合）
 * @returns {string} 扩展后的查询
 */
export function expandQuery(query) {
  const expanded = []
  const seen = new Set()
  for (const [zh, en] of Object.entries(ZH_ALIASES)) {
    if (query.includes(zh)) {
      for (const kw of en.slice(0, 2)) {
        if (!seen.has(kw)) { seen.add(kw); expanded.push(kw) }
      }
    }
  }
  if (expanded.length === 0) return query
  return `${query} ${expanded.join(' ')}`
}
