/**
 * colors.js — 配色令牌组装（L3 纯函数）
 *
 * 把 color 领域命中的一行记录转换为结构化的 HEX 令牌 + CSS 变量；
 * 缺失字段回退到默认色板。与生成流程分离，便于独立单测。
 */

const DEFAULT_COLORS = {
  primary: '#2563EB', secondary: '#3B82F6', accent: '#F97316',
  background: '#F8FAFC', foreground: '#1E293B',
}

/**
 * @param {object} bestColor - color 领域输出行
 * @param {string} category - 产品类别（回退用）
 * @returns {object} 结构化配色令牌
 */
export function buildColors(bestColor, category) {
  return {
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
  }
}
