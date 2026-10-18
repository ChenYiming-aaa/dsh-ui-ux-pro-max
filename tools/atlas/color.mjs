/**
 * 颜色工具：解析、混合、对比度、色相、明暗判定。
 * 支持 #RGB / #RRGGBB / #RRGGBBAA / rgb() / rgba()。
 */

export function parseColor(input) {
  if (!input) return null;
  const s = String(input).trim();
  const hex = s.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length === 4) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    };
  }
  const rgb = s.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const parts = rgb[1].split(/[,/\s]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }
  return null;
}

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const hex2 = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');

export function toHex(c) {
  if (!c) return '#000000';
  return `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;
}

export function toCss(c) {
  if (!c) return 'transparent';
  if (c.a >= 0.999) return toHex(c);
  return `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${Number(c.a.toFixed(3))})`;
}

/** 相对亮度（WCAG） */
export function relLuminance(c) {
  const ch = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
}

export function contrast(a, b) {
  const ca = typeof a === 'string' ? parseColor(a) : a;
  const cb = typeof b === 'string' ? parseColor(b) : b;
  if (!ca || !cb) return 0;
  const la = relLuminance(ca);
  const lb = relLuminance(cb);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function mix(a, b, t) {
  const ca = typeof a === 'string' ? parseColor(a) : a;
  const cb = typeof b === 'string' ? parseColor(b) : b;
  if (!ca || !cb) return ca || cb;
  return {
    r: ca.r + (cb.r - ca.r) * t,
    g: ca.g + (cb.g - ca.g) * t,
    b: ca.b + (cb.b - ca.b) * t,
    a: (ca.a ?? 1) + ((cb.a ?? 1) - (ca.a ?? 1)) * t,
  };
}

/** 0–360 */
export function hueOf(c) {
  const col = typeof c === 'string' ? parseColor(c) : c;
  if (!col) return 0;
  const r = col.r / 255;
  const g = col.g / 255;
  const b = col.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

export function saturationOf(c) {
  const col = typeof c === 'string' ? parseColor(c) : c;
  if (!col) return 0;
  const max = Math.max(col.r, col.g, col.b) / 255;
  const min = Math.min(col.r, col.g, col.b) / 255;
  const l = (max + min) / 2;
  if (max === min) return 0;
  return l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
}

export function isDark(c) {
  const col = typeof c === 'string' ? parseColor(c) : c;
  if (!col) return false;
  return relLuminance(col) < 0.22;
}

/** 中文色相名，用于筛选 */
export function hueName(h) {
  if (h < 15 || h >= 345) return '红';
  if (h < 40) return '橙';
  if (h < 65) return '黄';
  if (h < 95) return '黄绿';
  if (h < 150) return '绿';
  if (h < 185) return '青';
  if (h < 215) return '天蓝';
  if (h < 255) return '蓝';
  if (h < 285) return '紫';
  if (h < 320) return '品红';
  return '玫红';
}

/** WCAG 等级 */
export function wcagLevel(ratio, large = false) {
  if (large) {
    if (ratio >= 4.5) return 'AAA';
    if (ratio >= 3) return 'AA';
    return '不达标';
  }
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return '不达标';
}
