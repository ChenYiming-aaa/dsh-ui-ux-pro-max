/**
 * skill-body.js — SKILL.md frontmatter 拆分（L5，零 DSH / 零第三方依赖）
 *
 * 原生 `SkillDefinition.content` 要求的是「去除 provider 元数据后的 Markdown 正文」，
 * 但 `SKILL.md` 以 YAML frontmatter 开头。这里只解析本文件用到的标量字段
 * （name / description / whenToUse），不引入 YAML 解析器，避免破坏零依赖约束。
 */

/**
 * 把 SKILL.md 拆成 `{ data, body }`。
 * 解析失败时返回 `{ data: {}, body: 原文 }`，保证不会因 frontmatter 格式问题丢正文。
 * @param {string} raw
 * @returns {{ data: Record<string, string>, body: string }}
 */
export function splitFrontmatter(raw) {
  const text = String(raw).replace(/^\uFEFF/, '')
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { data: {}, body: text }
  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/)
    if (kv) data[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '')
  }
  return { data, body: text.slice(match[0].length).replace(/^\r?\n/, '') }
}
