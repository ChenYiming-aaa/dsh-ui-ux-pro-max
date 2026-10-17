/**
 * markdown.js — Markdown 渲染公共小工具（L3 展示层）
 *
 * 只做纯文本生成，无副作用、不 import 业务层。
 */

import { RENDER } from '../config.js'

/**
 * 生成 Markdown 表格。
 * @param {string[]} headers
 * @param {Array<Array<string>>} rows
 * @returns {string}
 */
export function markdownTable(headers, rows) {
  const lines = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
  ]
  for (const row of rows) lines.push(`| ${row.join(' | ')} |`)
  return lines.join('\n')
}

/**
 * 截断长字段并显式标注，避免无声吞内容。
 * @param {unknown} value
 * @param {number} [max]
 * @returns {string}
 */
export function truncateText(value, max = RENDER.searchFieldChars) {
  const text = String(value)
  return text.length > max
    ? `${text.slice(0, max)}…（已截断，完整值见结构化输出）`
    : text
}

/**
 * 对整段 Markdown 施加长度上限（render 内容会进入模型上下文）。
 * 未超限时原样返回；超限时截断并显式说明。
 * @param {string} markdown
 * @param {number} [max]
 * @returns {string}
 */
export function clampMarkdown(markdown, max = RENDER.designSystemChars) {
  if (markdown.length <= max) return markdown
  const lineBreak = markdown.lastIndexOf('\n', max)
  const cut = lineBreak > max * 0.8 ? lineBreak : max
  return `${markdown.slice(0, cut)}\n\n…（输出超过 ${max} 字符长度上限，已截断；完整结构化数据见工具返回值）`
}
