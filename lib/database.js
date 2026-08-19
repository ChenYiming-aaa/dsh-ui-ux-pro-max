/**
 * database.js — 离线数据库层
 *
 * 移植自 ui-ux-pro-max 源技能的 core.py（CSV_CONFIG / STACK_CONFIG / search /
 * search_stack / detect_domain），数据从插件内置的 data/index.json 读取，
 * 完全离线，无网络依赖。中文查询通过 zh.expandQuery 自动扩展。
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { BM25 } from './bm25.js'
import { expandQuery } from './zh.js'

const DATA_URL = new URL('../data/index.json', import.meta.url)

// ---------- 领域配置（对应 core.py CSV_CONFIG） ----------
export const DOMAIN_CONFIG = {
  style: {
    searchCols: ['Style Category', 'Keywords', 'Best For', 'Type', 'AI Prompt Keywords'],
    outputCols: ['Style Category', 'Type', 'Keywords', 'Primary Colors', 'Secondary Colors', 'Effects & Animation', 'Best For', 'Do Not Use For', 'Light Mode ✓', 'Dark Mode ✓', 'Performance', 'Accessibility', 'Mobile-Friendly', 'Conversion-Focused', 'Framework Compatibility', 'Complexity', 'AI Prompt Keywords', 'CSS/Technical Keywords', 'Implementation Checklist', 'Design System Variables'],
  },
  color: {
    searchCols: ['Product Type', 'Notes'],
    outputCols: ['Product Type', 'Primary', 'On Primary', 'Secondary', 'On Secondary', 'Accent', 'On Accent', 'Background', 'Foreground', 'Card', 'Card Foreground', 'Muted', 'Muted Foreground', 'Border', 'Destructive', 'On Destructive', 'Ring', 'Notes'],
  },
  chart: {
    searchCols: ['Data Type', 'Keywords', 'Best Chart Type', 'When to Use', 'When NOT to Use', 'Accessibility Notes'],
    outputCols: ['Data Type', 'Keywords', 'Best Chart Type', 'Secondary Options', 'When to Use', 'When NOT to Use', 'Data Volume Threshold', 'Color Guidance', 'Accessibility Grade', 'Accessibility Notes', 'A11y Fallback', 'Library Recommendation', 'Interactive Level'],
  },
  landing: {
    searchCols: ['Pattern Name', 'Keywords', 'Conversion Optimization', 'Section Order'],
    outputCols: ['Pattern Name', 'Keywords', 'Section Order', 'Primary CTA Placement', 'Color Strategy', 'Recommended Effects', 'Conversion Optimization'],
  },
  product: {
    searchCols: ['Product Type', 'Keywords', 'Primary Style Recommendation', 'Key Considerations'],
    outputCols: ['Product Type', 'Keywords', 'Primary Style Recommendation', 'Secondary Styles', 'Landing Page Pattern', 'Dashboard Style (if applicable)', 'Color Palette Focus', 'Key Considerations'],
  },
  ux: {
    searchCols: ['Category', 'Issue', 'Description', 'Platform'],
    outputCols: ['Category', 'Issue', 'Platform', 'Description', 'Do', "Don't", 'Code Example Good', 'Code Example Bad', 'Severity'],
  },
  typography: {
    searchCols: ['Font Pairing Name', 'Category', 'Mood/Style Keywords', 'Best For', 'Heading Font', 'Body Font'],
    outputCols: ['Font Pairing Name', 'Category', 'Heading Font', 'Body Font', 'Mood/Style Keywords', 'Best For', 'Google Fonts URL', 'CSS Import', 'Tailwind Config', 'Notes'],
  },
  icons: {
    searchCols: ['Category', 'Icon Name', 'Keywords', 'Best For'],
    outputCols: ['Category', 'Icon Name', 'Keywords', 'Library', 'Import Code', 'Usage', 'Best For', 'Style'],
  },
  gsap: {
    searchCols: ['Category', 'Intensity Tier', 'Keywords', 'Trigger'],
    outputCols: ['Category', 'Intensity Tier', 'Trigger', 'Duration', 'Easing', 'GSAP Snippet', 'Framework Notes', 'Do', "Don't", 'Performance Notes'],
  },
  react: {
    searchCols: ['Category', 'Issue', 'Keywords', 'Description'],
    outputCols: ['Category', 'Issue', 'Platform', 'Description', 'Do', "Don't", 'Code Example Good', 'Code Example Bad', 'Severity'],
  },
  web: {
    searchCols: ['Category', 'Issue', 'Keywords', 'Description'],
    outputCols: ['Category', 'Issue', 'Platform', 'Description', 'Do', "Don't", 'Code Example Good', 'Code Example Bad', 'Severity'],
  },
  'google-fonts': {
    searchCols: ['Family', 'Category', 'Stroke', 'Classifications', 'Keywords', 'Subsets', 'Designers'],
    outputCols: ['Family', 'Category', 'Stroke', 'Classifications', 'Styles', 'Variable Axes', 'Subsets', 'Designers', 'Popularity Rank', 'Google Fonts URL'],
  },
}

export const DOMAIN_KEYS = Object.keys(DOMAIN_CONFIG)

// ---------- 技术栈配置（对应 core.py STACK_CONFIG） ----------
export const STACKS = [
  'react', 'nextjs', 'vue', 'svelte', 'astro', 'swiftui', 'react-native',
  'flutter', 'nuxtjs', 'nuxt-ui', 'html-tailwind', 'shadcn', 'jetpack-compose',
  'threejs', 'angular', 'laravel', 'javafx', 'wpf', 'winui', 'avalonia', 'uno', 'uwp',
]

const STACK_SEARCH_COLS = ['Category', 'Guideline', 'Description', 'Do', "Don't"]
const STACK_OUTPUT_COLS = ['Category', 'Guideline', 'Description', 'Do', "Don't", 'Code Good', 'Code Bad', 'Severity', 'Docs URL']

export const MAX_RESULTS = 3

// ---------- 数据加载（惰性单例） ----------
let _db = null

function loadDb() {
  if (_db) return _db
  const raw = readFileSync(DATA_URL, 'utf8')
  _db = JSON.parse(raw)
  return _db
}

/** 访问内置数据库 */
export function getDb() {
  return loadDb()
}

/** 领域数据行 */
export function getDomainRows(domain) {
  const db = loadDb()
  return db.domains[domain] || []
}

/** 技术栈数据行 */
export function getStackRows(stack) {
  const db = loadDb()
  return db.stacks[stack] || []
}

/** 推理规则行 */
export function getReasoningRows() {
  return loadDb().reasoning || []
}

// ---------- 惰性加载 google-fonts ----------
let _fonts = null
let _fontsLoaded = false

export function getFontRows() {
  if (_fontsLoaded) return _fonts
  const raw = readFileSync(new URL('../data/fonts.json', import.meta.url), 'utf8')
  const parsed = JSON.parse(raw)
  _fonts = parsed.googleFonts || []
  _fontsLoaded = true
  return _fonts
}

// ---------- BM25 索引缓存（按领域） ----------
const _indexCache = new Map()

function searchRows(rows, searchCols, query, maxResults) {
  if (!rows || rows.length === 0) return []
  const documents = rows.map(row => searchCols.map(col => row[col] ?? '').join(' '))
  let bm25 = _indexCache.get(rows)
  if (!bm25) {
    bm25 = new BM25()
    bm25.fit(documents)
    _indexCache.set(rows, bm25)
  }
  const ranked = bm25.score(query)
  const results = []
  for (const { index, score } of ranked) {
    if (results.length >= maxResults) break
    if (score > 0) results.push({ row: rows[index], score })
  }
  return results
}

/** 生成文档字符串的联合（用于完整输出时合并 search+output 列） */
function pick(row, cols) {
  const out = {}
  for (const col of cols) {
    if (col in row) out[col] = row[col]
  }
  return out
}

/**
 * 领域搜索。
 * @param {string} query - 查询（中文自动扩展）
 * @param {string|null} domain - 领域键；缺省时自动检测
 * @param {number} maxResults
 * @returns {{ domain: string, query: string, count: number, results: Array<{row: object, score: number}> }}
 */
export function search(query, domain = null, maxResults = MAX_RESULTS) {
  const effectiveDomain = domain || detectDomain(query)
  const config = DOMAIN_CONFIG[effectiveDomain] || DOMAIN_CONFIG.style
  const rows = effectiveDomain === 'google-fonts'
    ? getFontRows()
    : getDomainRows(effectiveDomain)

  const expanded = expandQuery(query)
  const matched = searchRows(rows, config.searchCols, expanded, maxResults)
  const results = matched.map(({ row, score }) => ({ row: pick(row, config.outputCols), score }))

  return {
    domain: effectiveDomain,
    query,
    expandedQuery: expanded,
    count: results.length,
    results,
  }
}

/**
 * 技术栈搜索。
 * @param {string} query
 * @param {string} stack - 技术栈键（见 STACKS）
 * @param {number} maxResults
 */
export function searchStack(query, stack, maxResults = MAX_RESULTS) {
  if (!STACKS.includes(stack)) {
    return {
      error: `未知技术栈: ${stack}。可用: ${STACKS.join(', ')}`,
      stack,
      count: 0,
      results: [],
    }
  }
  const rows = getStackRows(stack)
  const expanded = expandQuery(query)
  const matched = searchRows(rows, STACK_SEARCH_COLS, expanded, maxResults)
  return {
    domain: 'stack',
    stack,
    query,
    expandedQuery: expanded,
    count: matched.length,
    results: matched.map(({ row, score }) => ({ row: pick(row, STACK_OUTPUT_COLS), score })),
  }
}

// ---------- 领域自动检测（对应 core.py detect_domain） ----------
const DOMAIN_KEYWORDS = {
  color: ['color', 'palette', 'hex', '#', 'rgb', 'token', 'semantic', 'accent', 'destructive', 'muted', 'foreground', '配色', '调色板', '颜色'],
  chart: ['chart', 'graph', 'visualization', 'trend', 'bar', 'pie', 'scatter', 'heatmap', 'funnel', '图表', '数据可视化', '折线', '柱状', '饼图', '漏斗'],
  landing: ['landing', 'page', 'cta', 'conversion', 'hero', 'testimonial', 'pricing', 'section', '落地页', '转化', '定价'],
  product: ['saas', 'ecommerce', 'e-commerce', 'fintech', 'healthcare', 'gaming', 'portfolio', 'crypto', 'dashboard', 'fitness', 'restaurant', 'hotel', 'travel', 'music', 'education', 'legal', 'insurance', 'medical', 'beauty', 'pharmacy', 'pet', 'dating', 'wedding', 'recipe', 'delivery', 'ride', 'booking', 'calendar', 'tracker', 'diary', 'note', 'chat', 'messenger', 'crm', 'invoice', 'parking', 'transit', 'vpn', 'alarm', 'weather', 'sleep', 'meditation', 'habit', 'grocery', 'meme', 'wardrobe', 'reading', 'flashcard', 'puzzle', 'trivia', 'arcade', 'photography', 'streaming', 'podcast', 'newsletter', 'marketplace', 'freelancer', 'coworking', 'airline', 'museum', 'theater', 'non-profit', 'charity', 'kindergarten', 'daycare', 'senior care', 'veterinary', 'florist', 'bakery', 'brewery', 'construction', 'automotive', 'real estate', 'logistics', 'agriculture', '金融', '电商', '医疗', '美容', '教育', '游戏', '社交', '健身', '旅游', '餐饮', '房产', '保险', '法律', '宠物', '物流', '汽车'],
  style: ['style', 'design', 'ui', 'minimalism', 'glassmorphism', 'neumorphism', 'brutalism', 'dark mode', 'flat', 'aurora', 'prompt', 'css', 'implementation', 'variable', 'checklist', 'tailwind', '风格', '极简', '毛玻璃', '暗黑', '深色', '扁平', '赛博朋克'],
  ux: ['ux', 'usability', 'accessibility', 'wcag', 'touch', 'scroll', 'animation', 'keyboard', 'navigation', 'mobile', '表单', '导航', '加载', '无障碍', '交互', '动效'],
  typography: ['font pairing', 'typography pairing', 'heading font', 'body font', '字体', '排版', '字体搭配'],
  'google-fonts': ['google font', 'font family', 'font weight', 'font style', 'variable font', 'noto', 'font for', 'find font', 'font subset', 'font language', 'monospace font', 'serif font', 'sans serif font', 'display font', 'handwriting font', 'font', 'typography', 'serif', 'sans'],
  icons: ['icon', 'icons', 'lucide', 'heroicons', 'symbol', 'glyph', 'pictogram', 'svg icon', '图标'],
  gsap: ['gsap', 'quickto', 'scrolltrigger', 'stagger', 'magnetic cursor', 'parallax', 'page transition', 'scroll reveal', 'scroll-triggered', 'scrollytelling', 'flip plugin', 'splittext', 'shimmer', 'skeleton loader', '动效', '动画', '滚动'],
  react: ['react', 'next.js', 'nextjs', 'suspense', 'memo', 'usecallback', 'useeffect', 'rerender', 'bundle', 'waterfall', 'barrel', 'dynamic import', 'rsc', 'server component', '性能', 'react'],
  web: ['aria', 'focus', 'outline', 'semantic', 'virtualize', 'autocomplete', 'form', 'input type', 'preconnect', '无障碍', '触控', '安全区'],
}

/**
 * 自动检测最相关的领域。
 * @param {string} query
 * @returns {string}
 */
export function detectDomain(query) {
  const q = expandQuery(query).toLowerCase()
  let best = 'style'
  let bestScore = 0
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    let score = 0
    for (const kw of keywords) {
      if (kw.includes(' ') || /^[a-z]+$/.test(kw)) {
        if (new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i').test(q)) score += 1
      } else if (q.includes(kw.toLowerCase())) {
        score += 1
      }
    }
    if (score > bestScore) { bestScore = score; best = domain }
  }
  return best
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
