/**
 * stats.js — 能力数字派生（L2）
 *
 * 能力数字（84/192/74/99/25/22 …）的单一源是 data/meta.json。
 * 工具描述、SKILL_DESCRIPTION 与文档一致性测试都从这里派生/核对，
 * 不再硬编码在代码里（历史上曾手工修过一次过期数字）。
 */

import { readFileSync } from 'node:fs'

const META_URL = new URL('../../data/meta.json', import.meta.url)

let _stats = null

/**
 * 读取并派生插件能力数字。
 * @returns {{
 *   plugin: string, generated: string, counts: object, domains: string[], stacks: string[],
 *   totalRows: number, upstream: string, upstreamRef: string, syncedAt: string,
 *   capabilities: {styles:number,palettes:number,fontPairings:number,uxGuidelines:number,
 *     chartTypes:number,landingPatterns:number,productTypes:number,icons:number,gsap:number,
 *     reactGuidelines:number,webGuidelines:number,reasoning:number,googleFonts:number,
 *     stacks:number,totalRows:number}
 * }}
 */
export function getStats() {
  if (_stats) return _stats
  const meta = JSON.parse(readFileSync(META_URL, 'utf8'))
  const c = meta.counts
  _stats = Object.freeze({
    ...meta,
    capabilities: Object.freeze({
      styles: c.style,
      palettes: c.color,
      fontPairings: c.typography,
      uxGuidelines: c.ux,
      chartTypes: c.chart,
      landingPatterns: c.landing,
      productTypes: c.product,
      icons: c.icons,
      gsap: c.gsap,
      reactGuidelines: c.react,
      webGuidelines: c.web,
      reasoning: c.reasoning,
      googleFonts: c.googleFonts,
      stacks: meta.stacks.length,
      totalRows: meta.totalRows,
    }),
  })
  return _stats
}

/** 中文能力摘要（用于 SKILL_DESCRIPTION / 工具描述插值）。 */
export function capabilitySummaryZh() {
  const c = getStats().capabilities
  return `${c.styles} 种设计风格、${c.palettes} 个调色板、${c.fontPairings} 组字体搭配、` +
    `${c.uxGuidelines} 条 UX 规范、${c.chartTypes} 种图表类型与 ${c.stacks} 个技术栈`
}

/** English capability summary (for future English descriptions). */
export function capabilitySummaryEn() {
  const c = getStats().capabilities
  return `${c.styles} design styles, ${c.palettes} color palettes, ${c.fontPairings} font pairings, ` +
    `${c.uxGuidelines} UX guidelines, ${c.chartTypes} chart types and ${c.stacks} technology stacks`
}
