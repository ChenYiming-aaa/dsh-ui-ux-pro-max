/**
 * domains.js — 领域配置与检测词表（L2 纯数据）
 *
 * 与检索算法分离：这里只有领域列配置、领域检测关键词与预编译匹配器。
 * 本模块不 import 任何其他 lib 模块。
 */

// ---------- 领域配置（对应上游 CSV_CONFIG） ----------
export const DOMAIN_CONFIG = {
  style: {
    searchCols: ['Style ID', 'Style Category', 'Aliases', 'Keywords', 'Best For', 'Type', 'AI Prompt Keywords'],
    outputCols: ['Style ID', 'Style Category', 'Aliases', 'Status', 'Preferred Mode', 'Type', 'Keywords', 'Primary Colors', 'Secondary Colors', 'Effects & Animation', 'Best For', 'Do Not Use For', 'Light Mode ✓', 'Dark Mode ✓', 'Performance', 'Accessibility', 'Mobile-Friendly', 'Conversion-Focused', 'Framework Compatibility', 'Era/Origin', 'Complexity', 'AI Prompt Keywords', 'CSS/Technical Keywords', 'Implementation Checklist', 'Design System Variables'],
  },
  color: {
    searchCols: ['Product Type', 'Notes'],
    outputCols: ['Product Type', 'Primary', 'On Primary', 'Secondary', 'On Secondary', 'Accent', 'On Accent', 'Background', 'Foreground', 'Card', 'Card Foreground', 'Muted', 'Muted Foreground', 'Border', 'Destructive', 'On Destructive', 'Ring', 'Notes'],
  },
  chart: {
    searchCols: ['Data Type', 'Keywords', 'Best Chart Type', 'When to Use', 'When NOT to Use', 'Accessibility Notes'],
    outputCols: ['Data Type', 'Keywords', 'Best Chart Type', 'Secondary Options', 'When to Use', 'When NOT to Use', 'Data Volume Threshold', 'Color Guidance', 'Accessibility Grade', 'Accessibility Risk', 'Accessibility Notes', 'A11y Fallback', 'Library Recommendation', 'Interactive Level'],
  },
  landing: {
    searchCols: ['Pattern ID', 'Pattern Name', 'Aliases', 'Keywords', 'Conversion Optimization', 'Section Order'],
    outputCols: ['Pattern ID', 'Pattern Name', 'Aliases', 'Keywords', 'Section Order', 'Primary CTA Placement', 'Color Strategy', 'Recommended Effects', 'Conversion Optimization'],
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
    searchCols: ['Category', 'Icon Name', 'Keywords', 'Best For', 'Library'],
    outputCols: ['Category', 'Icon Name', 'Keywords', 'Library', 'Import Code', 'Usage', 'Best For', 'Style', 'Semantic Role', 'Allowed Contexts'],
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

// ---------- 领域自动检测词表（对应上游 detect_domain） ----------
export const DOMAIN_KEYWORDS = {
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

// 预编译匹配器：原实现每次查询都对每个关键词 new RegExp（约 400 次编译/查询），
// 改为模块加载时编译一次。isWordKeyword 与原判空逻辑一致：含空格或全小写字母的
// 关键词走 \b 词边界匹配，其余（中文/混合）走子串匹配。
const isWordKeyword = (kw) => kw.includes(' ') || /^[a-z]+$/.test(kw)

export const DOMAIN_MATCHERS = Object.entries(DOMAIN_KEYWORDS).map(([domain, keywords]) => ({
  domain,
  wordRes: keywords.filter(isWordKeyword).map(kw => new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i')),
  substrings: keywords.filter(kw => !isWordKeyword(kw)).map(kw => kw.toLowerCase()),
}))

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
