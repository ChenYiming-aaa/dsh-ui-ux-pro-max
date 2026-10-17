/**
 * design-system.js — 设计系统 Markdown 渲染（L3 展示层）
 *
 * 输入是 domain/design-system.js 产出的结构化对象，只读不写。
 */

import {
  PRIORITY_LABELS,
  SEVERITY_LABELS,
  STACK_LABELS,
} from '../i18n/index.js'
import { markdownTable } from './markdown.js'

function sev(level) {
  return SEVERITY_LABELS[level] || level || ''
}

/** 设计系统 → 中文 Markdown */
export function formatDesignSystem(ds) {
  const lines = []
  lines.push(`## 设计系统建议：${ds.projectName}`)
  lines.push(`**产品类别：** ${ds.category}`)
  lines.push('')

  lines.push('### 🎨 推荐风格（按优先级）')
  for (const style of ds.styles) {
    const rank = PRIORITY_LABELS[style.rank] || `第${style.rank}候选`
    lines.push(`- **${rank}：${style['Style Category'] || ''}**（${style.Type || ''}）`)
    if (style.reason) lines.push(`  - 理由：${style.reason}`)
    if (style['Best For']) lines.push(`  - 适用场景：${style['Best For']}`)
    if (style.Keywords) lines.push(`  - 关键词：${style.Keywords}`)
    if (style['Light Mode ✓'] || style['Dark Mode ✓']) {
      lines.push(`  - 模式支持：浅色 ${style['Light Mode ✓'] || '—'} / 深色 ${style['Dark Mode ✓'] || '—'}`)
    }
  }
  lines.push('')

  lines.push('### 🎨 配色方案（HEX）')
  const c = ds.colors
  const colorRows = [
    ['主色', c.primary], ['主色前景', c.onPrimary], ['次色', c.secondary],
    ['强调色(CTA)', c.accent], ['背景', c.background], ['前景文字', c.foreground],
    ['卡片', c.card], ['弱化色', c.muted], ['边框', c.border],
    ['危险色', c.destructive], ['焦点环', c.ring],
  ].filter(([, hex]) => hex)
  lines.push(markdownTable(['角色', 'HEX'], colorRows.map(([label, hex]) => [label, `\`${hex}\``])))
  if (c.notes) lines.push(`\n*说明：${c.notes}*`)
  lines.push('')

  lines.push('### 🔤 字体搭配')
  const t = ds.typography
  lines.push(`- **标题：** ${t.heading} ｜ **正文：** ${t.body}`)
  if (t.pairingName) lines.push(`- **搭配名称：** ${t.pairingName}`)
  if (t.mood) lines.push(`- **气质：** ${t.mood}`)
  if (t.bestFor) lines.push(`- **适用场景：** ${t.bestFor}`)
  if (t.googleFontsUrl) lines.push(`- **Google Fonts：** ${t.googleFontsUrl}`)
  if (t.cssImport) lines.push(`- **CSS 导入：** \`${t.cssImport}\``)
  lines.push('')

  lines.push('### 🧭 落地页模式')
  lines.push(`- **模式：** ${ds.pattern.name}`)
  lines.push(`- **区块顺序：** ${ds.pattern.sections}`)
  if (ds.pattern.ctaPlacement) lines.push(`- **主 CTA 位置：** ${ds.pattern.ctaPlacement}`)
  if (ds.pattern.conversion) lines.push(`- **转化优化：** ${ds.pattern.conversion}`)
  lines.push('')

  if (ds.keyEffects) {
    lines.push('### ✨ 关键效果')
    lines.push(ds.keyEffects)
    lines.push('')
  }

  if (ds.reasoning && (ds.reasoning.colorMood || ds.reasoning.typographyMood || ds.reasoning.severity)) {
    lines.push('### 💡 选择理由')
    if (ds.reasoning.colorMood) lines.push(`- **配色气质：** ${ds.reasoning.colorMood}`)
    if (ds.reasoning.typographyMood) lines.push(`- **字体气质：** ${ds.reasoning.typographyMood}`)
    if (ds.reasoning.severity) lines.push(`- **优先级：** ${sev(ds.reasoning.severity)}`)
    const rules = ds.reasoning.decisionRules
    if (rules && Object.keys(rules).length) {
      lines.push('- **决策规则：**')
      for (const [k, v] of Object.entries(rules)) {
        const cond = k.replace(/^if_/, '').replace(/_/g, ' ')
        lines.push(`  - 若「${cond}」→ ${String(v).replace(/_/g, ' ')}`)
      }
    }
    lines.push('')
  }

  if (ds.antiPatterns && ds.antiPatterns.length) {
    lines.push('### ❌ 反模式（避免）')
    for (const anti of ds.antiPatterns) lines.push(`- ${anti}`)
    lines.push('')
  }

  if (ds.uxGuidelines && ds.uxGuidelines.length) {
    lines.push('### ✅ UX 规范要点')
    for (const g of ds.uxGuidelines) {
      const parts = [`[${sev(g.severity)}] ${g.category}｜${g.issue}`]
      if (g.do) parts.push(`应该：${g.do}`)
      if (g.dont) parts.push(`避免：${g.dont}`)
      lines.push(`- ${parts.join('；')}`)
    }
    lines.push('')
  }

  if (ds.stackGuidelines && ds.stackGuidelines.length) {
    lines.push(`### 🧩 技术栈规范（${STACK_LABELS[ds.stackName] || ds.stackName || ''}）`)
    for (const g of ds.stackGuidelines) {
      const parts = [`[${sev(g.severity)}] ${g.category}｜${g.guideline}`]
      if (g.do) parts.push(`应该：${g.do}`)
      if (g.dont) parts.push(`避免：${g.dont}`)
      lines.push(`- ${parts.join('；')}`)
    }
    lines.push('')
  }

  if (ds.dials && Object.values(ds.dials).some(v => v !== null && v !== undefined)) {
    lines.push('### 🎚 设计旋钮')
    if (ds.dials.variance) lines.push(`- 大胆度 Variance：${ds.dials.variance}/10 — ${ds.dials.varianceLabel}`)
    if (ds.dials.motion) lines.push(`- 动效 Motion：${ds.dials.motion}/10 — ${ds.dials.motionLabel}`)
    if (ds.dials.density) lines.push(`- 密度 Density：${ds.dials.density}/10 — ${ds.dials.densityLabel}`)
    lines.push('')
  }

  if (ds.motionSnippet) {
    const m = ds.motionSnippet
    lines.push('### 🎬 动效方案（GSAP）')
    lines.push(`**${m.category}**（${m.intensityTier}）— 触发：${m.trigger}｜时长：${m.duration}｜缓动：\`${m.easing}\``)
    if (m.snippet) {
      lines.push('```js')
      lines.push(m.snippet)
      lines.push('```')
    }
    if (m.do) lines.push(`- ✅ ${m.do}`)
    if (m.dont) lines.push(`- ❌ ${m.dont}`)
    lines.push('')
  }

  if (ds.spacingScale) {
    lines.push('### 📐 间距刻度')
    for (const [token, px] of Object.entries(ds.spacingScale)) {
      lines.push(`- \`--space-${token}\` = \`${px}\``)
    }
    lines.push('')
  }

  if (ds.implementationChecklist && ds.implementationChecklist.length) {
    lines.push('### 🛠 实现清单')
    for (const item of ds.implementationChecklist) lines.push(`- [ ] ${item}`)
    lines.push('')
  }

  return lines.join('\n')
}

/** 设计令牌摘要 → 中文 Markdown（工具完成态卡片使用） */
export function formatTokenSummary(summary) {
  const lines = []
  lines.push(`## 设计令牌摘要：${summary.projectName}`)
  lines.push(`**产品类别：** ${summary.category} ｜ **风格：** ${summary.style}（${summary.styleType}）`)
  lines.push('')
  const rows = [
    ['主色 primary', summary.palette.primary, true],
    ['强调色 accent', summary.palette.accent, true],
    ['背景 background', summary.palette.background, true],
    ['前景文字 foreground', summary.palette.foreground, true],
    ['弱化 muted', summary.palette.muted, true],
    ['边框 border', summary.palette.border, true],
  ].filter(([, value]) => value)
  rows.push(['字体', summary.typography, false])
  rows.push(['落地页模式', summary.pattern, false])
  if (summary.keyEffects) rows.push(['关键效果', summary.keyEffects, false])
  if (summary.spacing) rows.push(['间距刻度', Object.entries(summary.spacing).map(([k, v]) => `${k}=${v}`).join(', '), false])
  lines.push(markdownTable(['令牌', '值'], rows.map(([label, value, mono]) => [label, mono ? `\`${value}\`` : value])))
  return lines.join('\n')
}
