/**
 * design-system.js — 设计系统生成器
 *
 * 移植自 ui-ux-pro-max 源技能的 design_system.py（DesignSystemGenerator），
 * 把「产品类型 + 关键词 → 完整设计系统建议」的逻辑用纯 JS 重新实现：
 *   1. 产品搜索确定类别 → 2. 查推理规则(ui-reasoning) → 3. 多领域并行搜索
 *   (style/color/landing/typography) → 4. 按风格优先级挑选最佳匹配 →
 *   5. 组装结构化中文结果（含理由、反模式、UX 规范、实现清单）。
 * 额外支持三个 1-10 旋钮：variance（大胆度）/ motion（动效强度）/ density（密度）。
 */

import { search, searchStack } from './database.js'
import { getReasoningRows } from './database.js'
import { localizeRow } from './zh.js'

// 多领域搜索配置（对应 design_system.py SEARCH_CONFIG）
const SEARCH_CONFIG = {
  product: { maxResults: 1 },
  style: { maxResults: 3 },
  color: { maxResults: 2 },
  landing: { maxResults: 2 },
  typography: { maxResults: 2 },
}

// 设计旋钮（对应 design_system.py DIAL_TIERS）
export const DIAL_TIERS = {
  variance: [
    [1, 3, { label: '居中 / 极简', styleKeywords: ['Minimalism', 'Exaggerated Minimalism', 'centered', 'symmetric', 'grid-based'] }],
    [4, 7, { label: '均衡 / 现代', styleKeywords: ['modern', 'structured', 'balanced'] }],
    [8, 10, { label: '大胆 / 不对称', styleKeywords: ['Brutalism', 'Bento Grids', 'asymmetric', 'experimental'] }],
  ],
  motion: [
    [1, 3, { label: '克制', tier: 'Subtle' }],
    [4, 7, { label: '标准', tier: 'Standard' }],
    [8, 10, { label: '复杂', tier: 'Complex' }],
  ],
  density: [
    [1, 3, { label: '宽松', spacing: { xs: '4px', sm: '8px', md: '24px', lg: '32px', xl: '48px', '2xl': '64px', '3xl': '96px' } }],
    [4, 7, { label: '标准', spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', '2xl': '48px', '3xl': '64px' } }],
    [8, 10, { label: '紧凑 / 看板', spacing: { xs: '2px', sm: '4px', md: '8px', lg: '12px', xl: '16px', '2xl': '24px', '3xl': '32px' } }],
  ],
}

export function resolveDial(dialName, value) {
  if (value === null || value === undefined) return null
  value = Math.max(1, Math.min(10, Math.floor(Number(value))))
  for (const [lo, hi, info] of DIAL_TIERS[dialName]) {
    if (lo <= value && value <= hi) return { ...info, value }
  }
  return null
}

/** 查找匹配的推理规则（对应 _find_reasoning_rule） */
function findReasoningRule(category) {
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
function applyReasoning(category) {
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

/** 按风格优先级挑选最佳匹配（对应 _select_best_match） */
function selectBestMatch(results, priorityKeywords) {
  if (!results.length) return null
  if (!priorityKeywords || !priorityKeywords.length) return results[0]

  // 1. 风格名精确包含
  for (const priority of priorityKeywords) {
    const p = priority.toLowerCase().trim()
    for (const result of results) {
      const styleName = String(result['Style Category'] || '').toLowerCase()
      if (p && (styleName.includes(p) || p.includes(styleName))) return result
    }
  }
  // 2. 字段打分
  const scored = results.map(result => {
    let score = 0
    const resultStr = JSON.stringify(result).toLowerCase()
    for (const kw of priorityKeywords) {
      const k = kw.toLowerCase().trim()
      if (!k) continue
      if (String(result['Style Category'] || '').toLowerCase().includes(k)) score += 10
      else if (String(result['Keywords'] || '').toLowerCase().includes(k)) score += 3
      else if (resultStr.includes(k)) score += 1
    }
    return { score, result }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0].score > 0 ? scored[0].result : results[0]
}

const DEFAULT_COLORS = {
  primary: '#2563EB', secondary: '#3B82F6', accent: '#F97316',
  background: '#F8FAFC', foreground: '#1E293B',
}

/**
 * 生成完整设计系统建议。
 * @param {object} options
 * @param {string} options.query - 产品类型/行业/关键词（中英皆可）
 * @param {string} [options.projectName] - 项目名称
 * @param {number} [options.variance] - 1-10
 * @param {number} [options.motion] - 1-10
 * @param {number} [options.density] - 1-10
 * @param {string} [options.stack] - 技术栈键
 * @returns {object} 结构化中文设计系统
 */
export function generateDesignSystem({ query, projectName, variance, motion, density, stack }) {
  const varianceInfo = resolveDial('variance', variance)
  const motionInfo = resolveDial('motion', motion)
  const densityInfo = resolveDial('density', density)

  // Step 1: 产品搜索 → 类别
  const productResult = search(query, 'product', 1)
  const productResults = productResult.results
  const category = productResults.length ? productResults[0].row['Product Type'] : 'General'

  // Step 2: 推理规则
  const reasoning = applyReasoning(category)
  let stylePriority = reasoning.stylePriority
  if (varianceInfo) {
    stylePriority = [...varianceInfo.styleKeywords, ...stylePriority]
  }

  // Step 3: 多领域搜索（style 用「查询 + 优先级词」增强）
  const styleQuery = stylePriority.length
    ? `${query} ${stylePriority.slice(0, 2).join(' ')}`
    : query
  const styleSearch = search(styleQuery, 'style', SEARCH_CONFIG.style.maxResults)
  const colorSearch = search(query, 'color', SEARCH_CONFIG.color.maxResults)
  const landingSearch = search(query, 'landing', SEARCH_CONFIG.landing.maxResults)
  const typographySearch = search(query, 'typography', SEARCH_CONFIG.typography.maxResults)

  const styleResults = styleSearch.results
  const colorResults = colorSearch.results
  const typographyResults = typographySearch.results
  const landingResults = landingSearch.results

  // Step 4: 挑选最佳匹配
  const bestStyle = selectBestMatch(styleResults.map(r => r.row), stylePriority)
  const bestColor = colorResults.length ? colorResults[0].row : {}
  const bestTypography = typographyResults.length ? typographyResults[0].row : {}
  const bestLanding = landingResults.length ? landingResults[0].row : {}

  // Step 5: 动效旋钮 → gsap 片段
  let motionSnippet = null
  if (motionInfo) {
    const gsapResult = search(`${query} ${motionInfo.tier}`, 'gsap', 5)
    const tiered = gsapResult.results.find(r => r.row['Intensity Tier'] === motionInfo.tier)
    motionSnippet = tiered ? tiered.row : (gsapResult.results[0]?.row ?? null)
  }

  // Step 6: UX 规范要点（附加检索）
  const uxSearch = search(query, 'ux', 3)

  // Step 7: 技术栈规范（可选）
  let stackGuidelines = []
  if (stack) {
    const stackResult = searchStack(query, stack, 3)
    stackGuidelines = stackResult.results
  }

  const styleEffects = bestStyle ? bestStyle['Effects & Animation'] : ''
  const keyEffects = styleEffects || reasoning.keyEffects

  // 风格优先级排序（带理由的推荐顺序）
  const styleCandidates = []
  if (bestStyle) {
    styleCandidates.push({
      rank: 1,
      reason: `符合推理规则「${reasoning.stylePriority.join(' + ') || '默认风格优先级'}」${varianceInfo ? `，且匹配「${varianceInfo.label}」取向` : ''}`,
      ...bestStyle,
    })
  }
  for (const { row, score } of styleResults) {
    if (styleCandidates.some(c => c['Style Category'] === row['Style Category'])) continue
    if (styleCandidates.length >= 3) break
    styleCandidates.push({
      rank: styleCandidates.length + 1,
      reason: `检索命中（相关度 ${score.toFixed(2)}）`,
      ...row,
    })
  }

  // 反模式列表
  const antiPatterns = reasoning.antiPatterns
    ? reasoning.antiPatterns.split('+').map(s => s.trim()).filter(Boolean)
    : []

  const spacingScale = densityInfo ? densityInfo.spacing : null

  return {
    projectName: projectName || query,
    category,
    pattern: {
      name: bestLanding?.['Pattern Name'] || reasoning.pattern,
      sections: bestLanding?.['Section Order'] || 'Hero > Features > CTA',
      ctaPlacement: bestLanding?.['Primary CTA Placement'] || 'Above fold',
      colorStrategy: bestLanding?.['Color Strategy'] || '',
      conversion: bestLanding?.['Conversion Optimization'] || '',
    },
    styles: styleCandidates,
    colors: {
      productType: bestColor['Product Type'] || category,
      primary: bestColor.Primary || DEFAULT_COLORS.primary,
      onPrimary: bestColor['On Primary'] || '#FFFFFF',
      secondary: bestColor.Secondary || DEFAULT_COLORS.secondary,
      onSecondary: bestColor['On Secondary'] || '#FFFFFF',
      accent: bestColor.Accent || DEFAULT_COLORS.accent,
      onAccent: bestColor['On Accent'] || '#FFFFFF',
      background: bestColor.Background || DEFAULT_COLORS.background,
      foreground: bestColor.Foreground || DEFAULT_COLORS.foreground,
      card: bestColor.Card || '#FFFFFF',
      cardForeground: bestColor['Card Foreground'] || bestColor.Foreground || DEFAULT_COLORS.foreground,
      muted: bestColor.Muted || '',
      mutedForeground: bestColor['Muted Foreground'] || '',
      border: bestColor.Border || '',
      destructive: bestColor.Destructive || '#DC2626',
      onDestructive: bestColor['On Destructive'] || '#FFFFFF',
      ring: bestColor.Ring || bestColor.Primary || DEFAULT_COLORS.primary,
      notes: bestColor.Notes || '',
      cssVariables: {
        '--color-primary': bestColor.Primary || DEFAULT_COLORS.primary,
        '--color-on-primary': bestColor['On Primary'] || '#FFFFFF',
        '--color-secondary': bestColor.Secondary || DEFAULT_COLORS.secondary,
        '--color-accent': bestColor.Accent || DEFAULT_COLORS.accent,
        '--color-background': bestColor.Background || DEFAULT_COLORS.background,
        '--color-foreground': bestColor.Foreground || DEFAULT_COLORS.foreground,
        '--color-card': bestColor.Card || '#FFFFFF',
        '--color-muted': bestColor.Muted || '',
        '--color-border': bestColor.Border || '',
        '--color-destructive': bestColor.Destructive || '#DC2626',
        '--color-ring': bestColor.Ring || bestColor.Primary || DEFAULT_COLORS.primary,
      },
    },
    typography: {
      pairingName: bestTypography?.['Font Pairing Name'] || '',
      category: bestTypography?.Category || '',
      heading: bestTypography?.['Heading Font'] || 'Inter',
      body: bestTypography?.['Body Font'] || 'Inter',
      mood: bestTypography?.['Mood/Style Keywords'] || reasoning.typographyMood,
      bestFor: bestTypography?.['Best For'] || '',
      googleFontsUrl: bestTypography?.['Google Fonts URL'] || '',
      cssImport: bestTypography?.['CSS Import'] || '',
      tailwindConfig: bestTypography?.['Tailwind Config'] || '',
      notes: bestTypography?.Notes || '',
    },
    keyEffects,
    antiPatterns,
    reasoning: {
      colorMood: reasoning.colorMood,
      typographyMood: reasoning.typographyMood,
      severity: reasoning.severity,
      decisionRules: reasoning.decisionRules,
      stylePriority: reasoning.stylePriority,
      recommendedPattern: reasoning.pattern,
    },
    uxGuidelines: uxSearch.results.map(({ row, score }) => ({
      category: row.Category || '',
      issue: row.Issue || '',
      platform: row.Platform || '',
      description: row.Description || '',
      do: row.Do || '',
      dont: row["Don't"] || '',
      severity: row.Severity || '',
      score,
    })),
    stackGuidelines: stackGuidelines.map(({ row, score }) => ({
      category: row.Category || '',
      guideline: row.Guideline || '',
      description: row.Description || '',
      do: row.Do || '',
      dont: row["Don't"] || '',
      severity: row.Severity || '',
      docsUrl: row['Docs URL'] || '',
      score,
    })),
    dials: {
      variance: varianceInfo ? varianceInfo.value : null,
      varianceLabel: varianceInfo ? varianceInfo.label : null,
      motion: motionInfo ? motionInfo.value : null,
      motionLabel: motionInfo ? motionInfo.label : null,
      density: densityInfo ? densityInfo.value : null,
      densityLabel: densityInfo ? densityInfo.label : null,
    },
    motionSnippet: motionSnippet ? {
      category: motionSnippet.Category || '',
      intensityTier: motionSnippet['Intensity Tier'] || '',
      trigger: motionSnippet.Trigger || '',
      duration: motionSnippet.Duration || '',
      easing: motionSnippet.Easing || '',
      snippet: motionSnippet['GSAP Snippet'] || '',
      frameworkNotes: motionSnippet['Framework Notes'] || '',
      do: motionSnippet.Do || '',
      dont: motionSnippet["Don't"] || '',
      performanceNotes: motionSnippet['Performance Notes'] || '',
    } : null,
    spacingScale,
    implementationChecklist: bestStyle?.['Implementation Checklist']
      ? String(bestStyle['Implementation Checklist']).split(/[;；\n]+|[,，]\s*☐/).map(s => s.replace(/^[\s☐•\-]+/, '').trim()).filter(Boolean)
      : [],
    designSystemVariables: bestStyle?.['Design System Variables'] || '',
  }
}

/** 供 Web UI / 模型渲染的简洁设计令牌摘要 */
export function summarizeDesignSystem(ds) {
  const colors = ds.colors
  return {
    projectName: ds.projectName,
    category: ds.category,
    style: ds.styles[0]?.['Style Category'] || '',
    styleType: ds.styles[0]?.Type || '',
    palette: {
      primary: colors.primary,
      accent: colors.accent,
      background: colors.background,
      foreground: colors.foreground,
      muted: colors.muted,
      border: colors.border,
    },
    typography: `${ds.typography.heading} / ${ds.typography.body}`,
    pattern: ds.pattern.name,
    keyEffects: ds.keyEffects,
    spacing: ds.spacingScale || null,
  }
}

/** 生成中文本地化字段（用于 style/color/typography 等搜索结果的标签转换） */
export { localizeRow }
