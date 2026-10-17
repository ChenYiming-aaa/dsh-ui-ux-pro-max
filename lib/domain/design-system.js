/**
 * design-system.js — 设计系统生成流程（L3 业务层）
 *
 * 移植自上游 design_system.py（DesignSystemGenerator）：
 *   1. 产品搜索确定类别 → 2. 推理规则 → 3. 多领域检索
 *   (style/color/landing/typography) → 4. 按风格优先级挑选最佳匹配 →
 *   5. 组装结构化中文结果（含理由、反模式、UX 规范、实现清单）。
 *
 * 流程编排只依赖 search/domain/i18n，不认识 DSH 也不生成 Markdown；
 * 旋钮档位在 dials.js，推理规则在 reasoning.js。
 */

import { SEARCH_CONFIG } from '../config.js'
import { search, searchStack } from '../search/retriever.js'
import { resolveDial } from './dials.js'
import { applyReasoning } from './reasoning.js'
import { buildColors } from './colors.js'

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
  const productResult = search(query, 'product', SEARCH_CONFIG.product.maxResults)
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
    colors: buildColors(bestColor, category),
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
