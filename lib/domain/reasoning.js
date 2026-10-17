/**
 * reasoning.js — 推理规则匹配（L3 纯函数）
 *
 * 从 design-system.js 拆出：按产品类别匹配 ui-reasoning 规则，并解析为
 * 决策规则/风格优先级/反模式。可独立单测，不依赖 DSH。
 */

import { getReasoningRows } from '../repo/store.js'

/** 查找匹配的推理规则（对应 _find_reasoning_rule） */
export function findReasoningRule(category) {
  const rules = getReasoningRows()
  if (!rules.length) return null
  const cat = String(category || '').toLowerCase()
  if (!cat) return null

  // 精确匹配
  for (const rule of rules) {
    if (String(rule.UI_Category || '').toLowerCase() === cat) return rule
  }
  // 部分包含
  for (const rule of rules) {
    const uiCat = String(rule.UI_Category || '').toLowerCase()
    if ((uiCat && cat.includes(uiCat)) || (cat && uiCat.includes(cat))) return rule
  }
  // 关键词匹配
  for (const rule of rules) {
    const uiCat = String(rule.UI_Category || '').toLowerCase()
    const words = uiCat.replace(/[\/-]/g, ' ').split(/\s+/).filter(Boolean)
    if (words.some(w => cat.includes(w))) return rule
  }
  return null
}

/** 解析推理规则（对应 _apply_reasoning） */
export function applyReasoning(category) {
  const rule = findReasoningRule(category)
  if (!rule) {
    return {
      pattern: 'Hero + Features + CTA',
      stylePriority: ['Minimalism', 'Flat Design'],
      colorMood: 'Professional',
      typographyMood: 'Clean',
      keyEffects: 'Subtle hover transitions',
      antiPatterns: '',
      decisionRules: {},
      severity: 'Medium',
    }
  }
  let decisionRules = {}
  try {
    decisionRules = JSON.parse(rule.Decision_Rules || '{}')
  } catch { /* keep {} */ }
  return {
    pattern: rule.Recommended_Pattern || '',
    stylePriority: String(rule.Style_Priority || '').split('+').map(s => s.trim()).filter(Boolean),
    colorMood: rule.Color_Mood || '',
    typographyMood: rule.Typography_Mood || '',
    keyEffects: rule.Key_Effects || '',
    antiPatterns: rule.Anti_Patterns || '',
    decisionRules,
    severity: rule.Severity || 'Medium',
  }
}

