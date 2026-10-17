/**
 * labels.js — 中文标签与本地化（L1 纯数据 + 纯函数）
 *
 * 覆盖领域、技术栈、严重度/优先级与各领域输出列的中文标签。
 * 本模块不 import 任何其他 lib 模块。
 */

/** 领域中文名 */
export const DOMAIN_LABELS = {
  style: '设计风格',
  color: '配色方案',
  chart: '图表类型',
  landing: '落地页模式',
  product: '产品类型',
  ux: 'UX 规范',
  typography: '字体搭配',
  icons: '图标',
  gsap: '动效 (GSAP)',
  react: 'React 性能',
  web: '移动端接口规范',
  'google-fonts': 'Google 字体',
  stack: '技术栈规范',
}

/** 技术栈中文名 */
export const STACK_LABELS = {
  react: 'React',
  nextjs: 'Next.js',
  vue: 'Vue',
  svelte: 'Svelte',
  astro: 'Astro',
  swiftui: 'SwiftUI',
  'react-native': 'React Native',
  flutter: 'Flutter',
  nuxtjs: 'Nuxt.js',
  'nuxt-ui': 'Nuxt UI',
  'html-tailwind': 'HTML + Tailwind',
  shadcn: 'shadcn/ui',
  'jetpack-compose': 'Jetpack Compose',
  threejs: 'Three.js',
  angular: 'Angular',
  laravel: 'Laravel',
  javafx: 'JavaFX',
  wpf: 'WPF',
  winui: 'WinUI',
  avalonia: 'Avalonia',
  uno: 'Uno Platform',
  uwp: 'UWP',
}

/** 严重度 / 排序 */
export const SEVERITY_LABELS = {
  Critical: '严重',
  High: '高',
  Medium: '中',
  Low: '低',
}
export const SEVERITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 }

export const PRIORITY_LABELS = {
  1: '首选',
  2: '次选',
  3: '备选',
}

/** 各领域输出列 → 中文标签 */
export const FIELD_LABELS = {
  style: {
    'Style Category': '风格名称',
    Type: '类型',
    Keywords: '关键词',
    'Primary Colors': '主色',
    'Secondary Colors': '辅助色',
    'Effects & Animation': '效果与动效',
    'Best For': '适用场景',
    'Do Not Use For': '不适用场景',
    'Light Mode ✓': '浅色模式',
    'Dark Mode ✓': '深色模式',
    Performance: '性能',
    Accessibility: '无障碍',
    'Mobile-Friendly': '移动端友好',
    'Conversion-Focused': '转化导向',
    'Framework Compatibility': '框架兼容性',
    'Era/Origin': '时代/起源',
    Complexity: '复杂度',
    'AI Prompt Keywords': 'AI 提示词关键词',
    'CSS/Technical Keywords': 'CSS/技术关键词',
    'Implementation Checklist': '实现清单',
    'Design System Variables': '设计系统变量',
  },
  color: {
    'Product Type': '产品类型',
    Primary: '主色',
    'On Primary': '主色前景',
    Secondary: '次色',
    'On Secondary': '次色前景',
    Accent: '强调色(CTA)',
    'On Accent': '强调色前景',
    Background: '背景色',
    Foreground: '前景文字色',
    Card: '卡片色',
    'Card Foreground': '卡片文字色',
    Muted: '弱化色',
    'Muted Foreground': '弱化文字色',
    Border: '边框色',
    Destructive: '危险色',
    'On Destructive': '危险色前景',
    Ring: '焦点环色',
    Notes: '说明',
  },
  chart: {
    'Data Type': '数据类型',
    Keywords: '关键词',
    'Best Chart Type': '最佳图表类型',
    'Secondary Options': '备选图表',
    'When to Use': '适用时机',
    'When NOT to Use': '不适用时机',
    'Data Volume Threshold': '数据量阈值',
    'Color Guidance': '配色指引',
    'Accessibility Grade': '无障碍等级',
    'Accessibility Notes': '无障碍说明',
    'A11y Fallback': '无障碍降级方案',
    'Library Recommendation': '推荐图表库',
    'Interactive Level': '交互级别',
  },
  landing: {
    'Pattern Name': '模式名称',
    Keywords: '关键词',
    'Section Order': '区块顺序',
    'Primary CTA Placement': '主 CTA 位置',
    'Color Strategy': '配色策略',
    'Recommended Effects': '推荐效果',
    'Conversion Optimization': '转化优化',
  },
  product: {
    'Product Type': '产品类型',
    Keywords: '关键词',
    'Primary Style Recommendation': '首选风格',
    'Secondary Styles': '备选风格',
    'Landing Page Pattern': '落地页模式',
    'Dashboard Style (if applicable)': '看板风格',
    'Color Palette Focus': '配色重点',
    'Key Considerations': '关键考量',
  },
  ux: {
    Category: '类别',
    Issue: '问题',
    Platform: '平台',
    Description: '描述',
    Do: '应该',
    "Don't": '避免',
    'Code Example Good': '正确代码示例',
    'Code Example Bad': '错误代码示例',
    Severity: '严重度',
  },
  typography: {
    'Font Pairing Name': '字体搭配名称',
    Category: '类别',
    'Heading Font': '标题字体',
    'Body Font': '正文字体',
    'Mood/Style Keywords': '气质/风格关键词',
    'Best For': '适用场景',
    'Google Fonts URL': 'Google Fonts 链接',
    'CSS Import': 'CSS 导入',
    'Tailwind Config': 'Tailwind 配置',
    Notes: '说明',
  },
  icons: {
    Category: '类别',
    'Icon Name': '图标名称',
    Keywords: '关键词',
    Library: '图标库',
    'Import Code': '导入代码',
    Usage: '用法',
    'Best For': '适用场景',
    Style: '风格',
  },
  gsap: {
    Category: '类别',
    'Intensity Tier': '强度档位',
    Keywords: '关键词',
    Trigger: '触发方式',
    Duration: '时长',
    Easing: '缓动',
    'GSAP Snippet': 'GSAP 代码',
    'Framework Notes': '框架说明',
    Do: '应该',
    "Don't": '避免',
    'Performance Notes': '性能说明',
  },
  react: {
    Category: '类别',
    Issue: '问题',
    Platform: '平台',
    Description: '描述',
    Do: '应该',
    "Don't": '避免',
    'Code Example Good': '正确代码示例',
    'Code Example Bad': '错误代码示例',
    Severity: '严重度',
  },
  web: {
    Category: '类别',
    Issue: '问题',
    Platform: '平台',
    Description: '描述',
    Do: '应该',
    "Don't": '避免',
    'Code Example Good': '正确代码示例',
    'Code Example Bad': '错误代码示例',
    Severity: '严重度',
  },
  'google-fonts': {
    Family: '字体家族',
    Category: '类别',
    Stroke: '笔画风格',
    Classifications: '分类',
    Keywords: '关键词',
    Styles: '字重样式',
    'Variable Axes': '可变轴',
    Subsets: '字符集',
    Designers: '设计师',
    'Popularity Rank': '流行度排名',
    'Google Fonts URL': 'Google Fonts 链接',
  },
  stack: {
    Category: '类别',
    Guideline: '规范',
    Platform: '平台',
    Description: '描述',
    Do: '应该',
    "Don't": '避免',
    'Code Good': '正确代码示例',
    'Code Bad': '错误代码示例',
    Severity: '严重度',
    'Docs URL': '文档链接',
  },
}

/**
 * 将一行记录（原英文列名 → 值）转为中文标签行。
 * 未知列保留原键名（附在括号内），值原样保留。
 * @param {object} row - 原始行
 * @param {string} domain - 领域键
 * @returns {object} 中文标签行
 */
export function localizeRow(row, domain) {
  const labels = FIELD_LABELS[domain] || {}
  const out = {}
  for (const [key, value] of Object.entries(row)) {
    const label = labels[key]
    if (label) out[label] = value
    else out[`${key} (${key})`] = value
  }
  return out
}
