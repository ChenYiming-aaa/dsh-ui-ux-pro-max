#!/usr/bin/env node
/**
 * check-counts.mjs — 能力数字一致性检查
 *
 * 能力数字的单一源是 data/meta.json。本测试确保：
 *   1. 运行时代码派生出的能力数字 == meta.json
 *   2. README（中英）/ SKILL.md / package.json description 中的数字与之同步
 *   3. 文档里没有把「风格 / UX 规范」写成过期数字
 *
 * 用法: node tests/check-counts.mjs
 */

import { getStats, capabilitySummaryZh, capabilitySummaryEn } from '../lib/repo/stats.js'
import { assert, section, finish, readText, readJson } from './_harness.mjs'

const meta = readJson('data/meta.json')
const caps = getStats().capabilities

section('1. meta.json ↔ 运行时派生')
assert(caps.styles === meta.counts.style, `风格 ${caps.styles}`)
assert(caps.palettes === meta.counts.color, `调色板 ${caps.palettes}`)
assert(caps.fontPairings === meta.counts.typography, `字体搭配 ${caps.fontPairings}`)
assert(caps.uxGuidelines === meta.counts.ux, `UX 规范 ${caps.uxGuidelines}`)
assert(caps.chartTypes === meta.counts.chart, `图表 ${caps.chartTypes}`)
assert(caps.stacks === meta.stacks.length, `技术栈 ${caps.stacks}`)
assert(caps.totalRows === meta.totalRows, `数据总行数 ${caps.totalRows}`)
assert([caps.styles, caps.palettes, caps.fontPairings, caps.uxGuidelines, caps.chartTypes, caps.stacks]
  .every(n => capabilitySummaryZh().includes(String(n))), '中文摘要含全部数字')
assert([caps.styles, caps.palettes, caps.fontPairings, caps.uxGuidelines, caps.chartTypes, caps.stacks]
  .every(n => capabilitySummaryEn().includes(String(n))), '英文摘要含全部数字')

/** 每个能力：中文文档模式 + 英文文档模式。 */
const CAPABILITIES = [
  {
    key: 'style', n: caps.styles,
    zh: [new RegExp(`${caps.styles}\\s*种(?:设计)?风格`), new RegExp(`风格\\s*\\*\\*${caps.styles}\\*\\*`)],
    en: new RegExp(`${caps.styles}\\s*design styles`),
  },
  {
    key: 'color', n: caps.palettes,
    zh: [new RegExp(`${caps.palettes}\\s*个调色板`), new RegExp(`调色板\\s*\\*\\*${caps.palettes}\\*\\*`)],
    en: new RegExp(`${caps.palettes}\\s*color palettes`),
  },
  {
    key: 'typography', n: caps.fontPairings,
    zh: [new RegExp(`${caps.fontPairings}\\s*组字体`), new RegExp(`字体搭配\\s*\\*\\*${caps.fontPairings}\\*\\*`)],
    en: new RegExp(`${caps.fontPairings}\\s*font pairings`),
  },
  {
    key: 'ux', n: caps.uxGuidelines,
    zh: [new RegExp(`${caps.uxGuidelines}\\s*条\\s*UX\\s*规范`), new RegExp(`UX 规范\\s*\\*\\*${caps.uxGuidelines}\\*\\*`)],
    en: new RegExp(`${caps.uxGuidelines}\\s*UX guidelines`),
  },
  {
    key: 'chart', n: caps.chartTypes,
    zh: [new RegExp(`${caps.chartTypes}\\s*种图表`), new RegExp(`图表\\s*\\*\\*${caps.chartTypes}\\*\\*`)],
    en: new RegExp(`${caps.chartTypes}\\s*chart types`),
  },
  {
    key: 'stacks', n: caps.stacks,
    zh: [new RegExp(`${caps.stacks}\\s*个技术栈`), new RegExp(`技术栈\\s*\\*\\*${caps.stacks}\\*\\*`)],
    en: new RegExp(`${caps.stacks}\\s*(?:technology )?stacks`),
  },
]

const DOCS = [
  { name: 'README.md', text: readText('README.md'), lang: 'zh' },
  { name: 'README.en.md', text: readText('README.en.md'), lang: 'en' },
  { name: 'skills/ui-ux-pro-max/SKILL.md', text: readText('skills/ui-ux-pro-max/SKILL.md'), lang: 'zh' },
  { name: 'package.json description', text: readJson('package.json').description, lang: 'zh' },
]

section('2. 文档能力数字')
for (const doc of DOCS) {
  for (const cap of CAPABILITIES) {
    const patterns = doc.lang === 'zh' ? cap.zh : [cap.en]
    assert(patterns.some(re => re.test(doc.text)), `${doc.name}：${cap.key} = ${cap.n}`)
  }
}

section('3. 总量与字体数字')
const readmeText = readText('README.md')
assert(readmeText.includes(String(caps.totalRows)), `README.md 含数据总行数 ${caps.totalRows}`)
assert(readmeText.includes(String(caps.googleFonts)), `README.md 含 Google 字体 ${caps.googleFonts}`)
assert(readmeText.includes(`推理规则 **${caps.reasoning}**`), `README.md 含推理规则 ${caps.reasoning}`)
assert(readmeText.includes(`GSAP 动效 **${caps.gsap}**`), `README.md 含 GSAP 动效 ${caps.gsap}`)
assert(readmeText.includes(`移动端接口 **${caps.webGuidelines}**`), `README.md 含移动端接口 ${caps.webGuidelines}`)

finish('✅ 能力数字全部与 data/meta.json 一致。')
