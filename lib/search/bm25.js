/**
 * bm25.js — BM25 文本检索引擎
 *
 * 移植自 ui-ux-pro-max 源技能的 core.py（纯标准库实现），并增强：
 *  - 中文分词：对连续 CJK 片段做二元切分（bigram），使中文内容可参与检索
 *  - 保持与 Python 版一致的 k1=1.5 / b=0.75 参数与 IDF 公式
 *
 * 用法：
 *   const bm25 = new BM25()
 *   bm25.fit(documents)          // documents: string[]
 *   const ranked = bm25.score(query)  // [{ index, score }] 降序
 */

const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/

/** 保留数字与字母（含下划线），其余视为分隔符 */
function isWordChar(ch) {
  return /[a-z0-9_]/.test(ch)
}

function isCJK(ch) {
  return CJK_RE.test(ch)
}

/**
 * 分词：小写化 → 去标点 → 按空白/分隔切分 → 保留长度 >= 2 的词；
 * 对包含 CJK 的片段额外产出二元切分。
 *
 * 长度过滤只对拉丁词生效：单个汉字有检索价值（「图」→ 图表），单个字母没有
 * （否则 "a"/"i" 这类会污染索引）。此前统一 `length >= 2` 把上面专门为
 * 单字 CJK 写的分支变成了死代码。
 * @param {string} text
 * @returns {string[]}
 */
export function tokenize(text) {
  const str = String(text).toLowerCase()
  const tokens = []
  let i = 0
  const n = str.length
  let buf = ''
  while (i < n) {
    const ch = str[i]
    if (isWordChar(ch)) {
      buf += ch
      i += 1
      continue
    }
    if (isCJK(ch)) {
      if (buf) { tokens.push(buf); buf = '' }
      // 收集连续 CJK 片段
      let cjk = ''
      while (i < n && isCJK(str[i])) { cjk += str[i]; i += 1 }
      if (cjk.length >= 2) {
        // 二元切分
        for (let k = 0; k < cjk.length - 1; k++) tokens.push(cjk.slice(k, k + 2))
        // 也保留整段（便于精确匹配）
        tokens.push(cjk)
      } else if (cjk.length === 1) {
        tokens.push(cjk)
      }
      continue
    }
    if (buf) { tokens.push(buf); buf = '' }
    i += 1
  }
  if (buf) tokens.push(buf)
  return tokens.filter(t => t.length >= 2 || (t.length === 1 && isCJK(t)))
}

/**
 * 统计 token 权重：同一 token 出现两次即权重 2（保留 BM25 的 qtf 语义）。
 * @param {string[]} tokens
 * @returns {Map<string, number>}
 */
export function tokenWeights(tokens) {
  const weights = new Map()
  for (const token of tokens) weights.set(token, (weights.get(token) || 0) + 1)
  return weights
}

export class BM25 {
  /**
   * @param {number} k1 - 词频饱和参数（默认 1.5）
   * @param {number} b - 文档长度归一化参数（默认 0.75）
   */
  constructor(k1 = 1.5, b = 0.75) {
    this.k1 = k1
    this.b = b
    this.corpus = []
    this.docLengths = []
    this.avgdl = 0
    this.idf = new Map()
    this.docFreqs = new Map()
    this.N = 0
  }

  /** 构建索引 */
  fit(documents) {
    this.corpus = documents.map(doc => tokenize(doc))
    this.N = this.corpus.length
    if (this.N === 0) return
    this.docLengths = this.corpus.map(doc => doc.length)
    this.avgdl = this.docLengths.reduce((a, b) => a + b, 0) / this.N

    this.docFreqs = new Map()
    for (const doc of this.corpus) {
      const seen = new Set()
      for (const word of doc) {
        if (!seen.has(word)) {
          this.docFreqs.set(word, (this.docFreqs.get(word) || 0) + 1)
          seen.add(word)
        }
      }
    }

    this.idf = new Map()
    for (const [word, freq] of this.docFreqs) {
      this.idf.set(word, Math.log((this.N - freq + 0.5) / (freq + 0.5) + 1))
    }
  }

  /**
   * 对所有文档打分，返回按分数降序的 [{ index, score }]。
   * @param {string} query
   * @returns {Array<{index: number, score: number}>}
   */
  score(query) {
    return this.scoreTerms(tokenWeights(tokenize(query)))
  }

  /**
   * 按 token 权重打分（供「原查询 vs 别名扩展词」不等权使用）。
   * @param {Map<string, number>} terms - token → 权重
   * @returns {Array<{index: number, score: number}>}
   */
  scoreTerms(terms) {
    const scores = []
    const idf = this.idf
    const k1 = this.k1
    const b = this.b

    for (let idx = 0; idx < this.corpus.length; idx++) {
      const doc = this.corpus[idx]
      const docLen = this.docLengths[idx]
      const termFreqs = new Map()
      for (const word of doc) termFreqs.set(word, (termFreqs.get(word) || 0) + 1)

      let score = 0
      for (const [token, weight] of terms) {
        const idfVal = idf.get(token)
        if (idfVal === undefined) continue
        const tf = termFreqs.get(token) || 0
        const numerator = tf * (k1 + 1)
        const denominator = tf + k1 * (1 - b + b * docLen / this.avgdl)
        score += weight * idfVal * numerator / denominator
      }
      scores.push({ index: idx, score })
    }

    return scores.sort((a, b) => b.score - a.score)
  }
}
