/**
 * dials.js — 三个 1-10 设计旋钮的档位表（L3 纯数据 + 纯函数）
 *
 * variance（大胆度）/ motion（动效强度）/ density（密度）。
 * 数据与生成流程分离：改档位只动这里。
 */

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