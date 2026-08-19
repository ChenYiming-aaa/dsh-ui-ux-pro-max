#!/usr/bin/env node
/**
 * build-data.mjs — 将 ui-ux-pro-max 源技能目录下的 CSV 数据库转换为插件内置的
 * JSON 索引（离线可用）。
 *
 * 用法:
 *   node scripts/build-data.mjs [源数据目录]
 *
 * 默认源目录: C:\Users\cwqjk\.config\opencode\skills\ui-ux-pro-max\data
 * 输出:
 *   data/index.json   全部领域(style/color/chart/...) + 技术栈(stacks) + 推理规则(reasoning)
 *   data/fonts.json   google-fonts 字体库（懒加载）
 *   data/meta.json    清单/统计
 *
 * 仅依赖 Node 内置模块，无第三方依赖。CSV 解析为精简的 RFC 4180 实现。
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PLUGIN_ROOT = join(__dirname, '..')
const DEFAULT_SOURCE = 'C:\\Users\\cwqjk\\.config\\opencode\\skills\\ui-ux-pro-max\\data'
const SOURCE = process.argv[2] || DEFAULT_SOURCE
const OUT_DIR = join(PLUGIN_ROOT, 'data')

// ---------- RFC 4180 CSV parser (handles quoted fields with commas/newlines/quotes) ----------
function parseCSV(text) {
  // Strip UTF-8 BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let i = 0
  const n = text.length
  while (i < n) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue }
        inQuotes = false; i += 1; continue
      }
      field += ch; i += 1; continue
    }
    if (ch === '"') { inQuotes = true; i += 1; continue }
    if (ch === ',') { row.push(field); field = ''; i += 1; continue }
    if (ch === '\r') { i += 1; continue }
    if (ch === '\n') {
      row.push(field); field = ''
      rows.push(row); row = []
      i += 1; continue
    }
    field += ch; i += 1
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  if (rows.length === 0) return []
  const header = rows[0].map(h => h.trim())
  const out = []
  for (let r = 1; r < rows.length; r++) {
    const src = rows[r]
    if (src.length === 1 && src[0].trim() === '') continue // skip blank lines
    const obj = {}
    for (let c = 0; c < header.length; c++) {
      if (c < src.length) obj[header[c]] = src[c]
    }
    out.push(obj)
  }
  return out
}

function loadCSV(relPath) {
  const full = join(SOURCE, relPath)
  const text = readFileSync(full, 'utf8')
  return parseCSV(text)
}

// ---------- 领域文件（对应 core.py 的 CSV_CONFIG） ----------
const DOMAIN_FILES = {
  style: 'styles.csv',
  color: 'colors.csv',
  chart: 'charts.csv',
  landing: 'landing.csv',
  product: 'products.csv',
  ux: 'ux-guidelines.csv',
  typography: 'typography.csv',
  icons: 'icons.csv',
  gsap: 'motion.csv',
  react: 'react-performance.csv',
  web: 'app-interface.csv',
}

// ---------- 技术栈文件（对应 core.py 的 STACK_CONFIG） ----------
const STACKS = [
  'react', 'nextjs', 'vue', 'svelte', 'astro', 'swiftui', 'react-native',
  'flutter', 'nuxtjs', 'nuxt-ui', 'html-tailwind', 'shadcn', 'jetpack-compose',
  'threejs', 'angular', 'laravel', 'javafx', 'wpf', 'winui', 'avalonia', 'uno', 'uwp',
]

mkdirSync(OUT_DIR, { recursive: true })

const domains = {}
const counts = {}
for (const [key, file] of Object.entries(DOMAIN_FILES)) {
  const rows = loadCSV(file)
  domains[key] = rows
  counts[key] = rows.length
}

const stacks = {}
for (const name of STACKS) {
  const rows = loadCSV(join('stacks', `${name}.csv`))
  stacks[name] = rows
  counts[`stack:${name}`] = rows.length
}

const reasoning = loadCSV('ui-reasoning.csv')
counts.reasoning = reasoning.length

const fonts = loadCSV('google-fonts.csv')
counts.googleFonts = fonts.length

const now = new Date().toISOString()
const index = {
  format: 'ui-ux-pro-max-database',
  version: 1,
  generated: now,
  source: 'opencode/skills/ui-ux-pro-max (data/)',
  counts,
  domains,
  stacks,
  reasoning,
}

writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(index))
writeFileSync(join(OUT_DIR, 'fonts.json'), JSON.stringify({ format: 'ui-ux-pro-max-google-fonts', version: 1, generated: now, googleFonts: fonts }))
writeFileSync(join(OUT_DIR, 'meta.json'), JSON.stringify({
  plugin: 'dsh-ui-ux-pro-max',
  builtFrom: SOURCE,
  generated: now,
  counts,
  domains: Object.keys(DOMAIN_FILES),
  stacks: STACKS,
  totalRows: Object.values(counts).reduce((a, b) => a + b, 0),
}, null, 2))

const total = Object.values(counts).reduce((a, b) => a + b, 0)
console.log(`✅ 数据构建完成 → ${OUT_DIR}`)
console.log(`   源目录: ${SOURCE}`)
console.log(`   领域: ${Object.keys(DOMAIN_FILES).join(', ')}`)
console.log(`   技术栈: ${STACKS.length} 个`)
console.log(`   总行数: ${total}`)
console.log(`   index.json ${(readFileSync(join(OUT_DIR, 'index.json')).length / 1024).toFixed(0)} KB, ` +
  `fonts.json ${(readFileSync(join(OUT_DIR, 'fonts.json')).length / 1024).toFixed(0)} KB`)
