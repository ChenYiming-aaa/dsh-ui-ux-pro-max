/**
 * 风格图鉴静态站点生成器。
 *
 *   node tools/showcase/build.mjs
 *
 * 输入：data/index.json + tools/showcase/theme-data.mjs
 * 输出：gallery/（与 handbook/ 同级，本地 file:// 与部署后的相对路径完全一致）
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STYLE_META } from './theme-data.mjs';
import { GALLERY, HANDBOOK, OTHER_VIEW, HANDBOOK_LINE } from '../site-names.mjs';
import { introCss, introHead, introMarkup } from '../intro.mjs';
import { xnavCss, xnavHead, xnavJs } from '../xnav.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const SITE = path.join(ROOT, 'gallery');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/index.json'), 'utf8'));
const META = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/meta.json'), 'utf8'));

/* ----------------------------------------------------------------------------
 * 基础工具
 * ------------------------------------------------------------------------- */

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const pick = (obj, keys, fallback = '') => {
  for (const k of keys) if (obj[k]) return obj[k];
  return fallback;
};

const splitList = (s = '') =>
  String(s)
    .split(/\s*[,|]\s*|\s*\+\s*/)
    .map((x) => x.trim())
    .filter(Boolean);

/* --- 颜色工具 -------------------------------------------------------------- */

const parseHex = (hex) => {
  let h = String(hex).replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  };
};

const toHex = ({ r, g, b }) =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

const lum = (hex) => {
  const c = parseHex(hex);
  if (!c) return 0;
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
};

const contrast = (a, b) => {
  const l1 = lum(a);
  const l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

const mix = (a, b, t) => {
  const c1 = parseHex(a);
  const c2 = parseHex(b);
  if (!c1 || !c2) return a;
  return toHex({
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t
  });
};

const isHex = (v) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v).trim());

const luminanceInk = (bg) => (lum(bg) > 0.45 ? '#14161A' : '#FFFFFF');

/* ----------------------------------------------------------------------------
 * 从原始数据补充主题令牌
 * ------------------------------------------------------------------------- */

const FONT_STACK = {
  sans: "system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  grotesk: "'Helvetica Neue', Helvetica, Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif",
  serif: "Georgia, 'Iowan Old Style', 'Times New Roman', 'Songti SC', 'SimSun', serif",
  mono: "ui-monospace, 'SFMono-Regular', 'Cascadia Mono', Consolas, 'Courier New', monospace",
  rounded: "'Trebuchet MS', 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  condensed: "'Arial Narrow', 'Helvetica Neue', Impact, 'PingFang SC', sans-serif",
  pixel: "ui-monospace, 'Cascadia Mono', Consolas, monospace",
  sketch: "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', 'Kaiti SC', 'STKaiti', cursive"
};

const extractHexes = (...texts) => {
  const out = [];
  for (const text of texts) {
    for (const m of String(text || '').matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
      const hex = ('#' + m[1]).toLowerCase();
      if (!out.some((x) => x.toLowerCase() === hex)) out.push(hex);
    }
  }
  return out;
};

const stripTags = (s) => String(s || '').replace(/[✓✗◐☐]/g, ' ').replace(/\s+/g, ' ').trim();

/* 状态 / 能力字段的中文化 */
const MODE_LABEL = {
  supported: '支持',
  conditional: '有条件支持',
  'not-recommended': '不建议'
};
const MOBILE_LABEL = {
  native: '原生适配',
  adaptable: '可适配',
  conditional: '需额外处理',
  'not-recommended': '不建议'
};
const COST_LABEL = { low: '低', moderate: '中', high: '高' };
const RISK_LABEL = { low: '低', conditional: '需实测', high: '高' };

const parsePerf = (s) => {
  const cost = /cost:([a-z]+)/.exec(s)?.[1] || '';
  const drivers = /drivers:([^|]+)/.exec(s)?.[1] || '';
  return {
    cost,
    costLabel: COST_LABEL[cost] || stripTags(cost),
    drivers: drivers === 'none' || !drivers ? '无额外开销' : drivers.split(',').join(' / ')
  };
};

const parseA11y = (s) => {
  const risk = /risk:([a-z]+)/.exec(s)?.[1] || '';
  const requires = /requires:([^|]+)/.exec(s)?.[1] || '';
  return {
    risk,
    riskLabel: RISK_LABEL[risk] || stripTags(risk),
    requires: requires ? requires.split(',').join(' / ') : '—'
  };
};

const conversionLabel = (raw = '') => {
  const s = String(raw);
  if (/very high/i.test(s)) return { level: 3, label: '极强' };
  if (/high/i.test(s)) return { level: 2, label: '强' };
  if (/medium/i.test(s)) return { level: 1, label: '中' };
  if (/not applicable/i.test(s)) return { level: 0, label: '不适用' };
  if (/✗|low/i.test(s)) return { level: 0, label: '弱' };
  return { level: 1, label: stripTags(s) || '—' };
};

const STATUS_LABEL = { active: '推荐', supplemental: '补充', deprecated: '已弃用' };

/* 类型族：Platform/Material 归入平台规范，便于导航 */
const FAMILY = {
  General: { key: 'general', zh: '通用视觉', short: '通用' },
  Mobile: { key: 'mobile', zh: '移动端', short: '移动' },
  'BI/Analytics': { key: 'data', zh: '数据可视化', short: '数据' },
  'Landing Page': { key: 'landing', zh: '落地页模式', short: '落地页' },
  'Platform/System': { key: 'platform', zh: '平台规范', short: '平台' },
  'Platform/Material': { key: 'platform', zh: '平台规范', short: '平台' }
};

/* ----------------------------------------------------------------------------
 * 组装风格对象
 * ------------------------------------------------------------------------- */

const styles = DATA.domains.style.map((row) => {
  const id = row['Style ID'];
  const meta = STYLE_META[id];
  if (!meta) throw new Error(`缺少中文元数据：${id}`);
  if (!meta.theme) throw new Error(`缺少预览主题：${id}`);

  const t = meta.theme;
  const mode = t.mode || 'light';

  // 主令牌
  const theme = {
    mode,
    bg: t.bg,
    surface: t.surface,
    surface2: t.surface2 || t.surface,
    text: t.text,
    muted: t.muted,
    border: t.border,
    accent: t.accent,
    accent2: t.accent2 || t.accent,
    radius: t.radius ?? 10,
    borderW: t.borderW ?? 1,
    font: t.font || 'sans',
    fontBody: t.fontBody || t.font || 'sans',
    fw: t.fw ?? 700,
    fx: t.fx || []
  };
  theme.accentFg = t.accentFg || luminanceInk(theme.accent);

  // 变体：另一模式由推导得到
  const lightVariant = {
    bg: '#FBFBFC',
    surface: '#FFFFFF',
    surface2: '#F2F3F6',
    text: '#14161A',
    muted: '#5A6472',
    border: '#E1E4EA'
  };
  const darkVariant = {
    bg: '#0B0C10',
    surface: '#14161B',
    surface2: '#1B1E25',
    text: '#F4F5F7',
    muted: '#9AA3B2',
    border: 'rgba(255,255,255,0.13)'
  };

  if (mode === 'light') {
    theme.modes = {
      light: { ...theme },
      dark: { ...theme, ...darkVariant, accentFg: luminanceInk(theme.accent) }
    };
  } else {
    theme.modes = {
      light: { ...theme, ...lightVariant, accentFg: luminanceInk(theme.accent) },
      dark: { ...theme }
    };
  }

  // 暗色下若强调色对比不足，提亮；亮色下若强调色过亮，压暗
  for (const key of ['light', 'dark']) {
    const v = theme.modes[key];
    const c = contrast(v.accent, v.bg);
    if (c < 2.2) {
      v.accent = key === 'dark' ? mix(v.accent, '#FFFFFF', 0.45) : mix(v.accent, '#000000', 0.45);
    }
    v.accentFg = luminanceInk(v.accent);
    if (!isHex(v.bg)) v.bg = key === 'dark' ? '#0B0C10' : '#FBFBFC';
    v.borderSoft = isHex(v.border) ? mix(v.border, v.bg, 0.55) : v.border;
  }

  const primaryHexes = extractHexes(row['Primary Colors']);
  const secondaryHexes = extractHexes(row['Secondary Colors']);
  const dsvHexes = extractHexes(row['Design System Variables']);
  const paletteItems = [];
  const addSwatch = (hex, source) => {
    if (!isHex(hex)) return;
    const key = hex.toLowerCase();
    if (paletteItems.some((p) => p.hex === key)) return;
    paletteItems.push({ hex: key, source });
  };
  addSwatch(theme.accent, '强调色');
  addSwatch(theme.accent2, '辅助色');
  [...primaryHexes, ...secondaryHexes, ...dsvHexes].forEach((c) => addSwatch(c, '取自原文'));
  addSwatch(theme.modes[theme.mode].text, '文字令牌');
  addSwatch(theme.surface2, '表面令牌');
  addSwatch(theme.border, '描边令牌');
  addSwatch(theme.bg, '底色令牌');
  const palette = paletteItems.map((p) => p.hex).slice(0, 10);

  const perf = parsePerf(row['Performance']);
  const a11y = parseA11y(row['Accessibility']);

  return {
    no: Number(row.No),
    id,
    en: row['Style Category'],
    zh: meta.zh,
    tag: meta.tag,
    desc: meta.desc,
    type: row.Type,
    family: FAMILY[row.Type] || FAMILY.General,
    status: row.Status,
    statusLabel: STATUS_LABEL[row.Status] || row.Status,
    keywords: splitList(row.Keywords),
    aliases: splitList(row.Aliases),
    primary: row['Primary Colors'],
    secondary: row['Secondary Colors'],
    effects: row['Effects & Animation'],
    bestFor: splitList(row['Best For']),
    avoid: splitList(row['Do Not Use For']),
    lightMode: row['Light Mode ✓'],
    darkMode: row['Dark Mode ✓'],
    preferredMode: row['Preferred Mode'],
    mobile: row['Mobile-Friendly'],
    conversion: row['Conversion-Focused'],
    conversionInfo: conversionLabel(row['Conversion-Focused']),
    frameworks: splitList(row['Framework Compatibility']),
    era: row['Era/Origin'],
    complexity: row['Complexity'],
    prompt: row['AI Prompt Keywords'],
    cssKeywords: row['CSS/Technical Keywords'],
    checklist: String(row['Implementation Checklist'] || '')
      .split(/☐|;/)
      .map((s) => s.trim())
      .filter(Boolean),
    tokens: String(row['Design System Variables'] || '')
      .split(/,\s*(?=--)/)
      .map((s) => s.trim())
      .filter(Boolean),
    parent: row['Parent Style ID'],
    replacement: row['Replacement ID'],
    perf,
    a11y,
    theme,
    palette,
    paletteItems
  };
});

const byId = new Map(styles.map((s) => [s.id, s]));
const families = [...new Map(styles.map((s) => [s.family.key, s.family])).values()];
styles.forEach((s, i) => {
  s.prev = styles[(i - 1 + styles.length) % styles.length];
  s.next = styles[(i + 1) % styles.length];
});

/* ----------------------------------------------------------------------------
 * 主题 CSS
 * ------------------------------------------------------------------------- */

const themeVars = (v, scheme) => {
  const r = v.radius;
  const radiusBtn = r === 0 ? 0 : Math.max(3, Math.round(r * 0.62));
  const radiusLg = r === 0 ? 0 : Math.round(r * 1.5);
  return [
    `--bg:${v.bg}`,
    `--surface:${v.surface}`,
    `--surface2:${v.surface2}`,
    `--text:${v.text}`,
    `--muted:${v.muted}`,
    `--border:${v.border}`,
    `--border-soft:${v.borderSoft}`,
    `--accent:${v.accent}`,
    `--accent-2:${v.accent2}`,
    `--accent-fg:${v.accentFg}`,
    `--radius:${r}px`,
    `--radius-lg:${radiusLg}px`,
    `--radius-btn:${radiusBtn}px`,
    `--border-w:${v.borderW}px`,
    `--font-head:var(--f-${v.font})`,
    `--font-body:var(--f-${v.fontBody})`,
    `--fw-head:${v.fw}`,
    `color-scheme:${scheme}`
  ].join(';');
};

const themeCss = styles
  .map((s) =>
    [
      `.t-${s.id}{${themeVars(s.theme.modes.light, 'light')}}`,
      `.t-${s.id}[data-mode="dark"]{${themeVars(s.theme.modes.dark, 'dark')}}`
    ].join('\n')
  )
  .join('\n');

/* ----------------------------------------------------------------------------
 * 预览组件骨架
 * ------------------------------------------------------------------------- */

const BARS = [44, 62, 38, 78, 55, 88, 70];

const swatchRow = (s) =>
  s.palette
    .slice(0, 5)
    .map((c) => `<i style="background:${c}" title="${c}"></i>`)
    .join('');

const fxClass = (s) => s.theme.fx.map((f) => `fx-${f}`).join(' ');

const previewMarkup = (s, variant = 'mini') => {
  const mode = s.theme.mode;
  return `<div class="pv pv--${variant} t-${s.id} ${fxClass(s)}" data-mode="${mode}" data-preview>
  <div class="pv-bg" aria-hidden="true"></div>
  <div class="pv-shell">
    <div class="pv-top">
      <span class="pv-brand"><i class="pv-logo"></i>Nova</span>
      <span class="pv-links"><span>产品</span><span>方案</span><span>定价</span></span>
      <span class="pv-pill">开始使用</span>
    </div>
    <div class="pv-body">
      <div class="pv-copy">
        <p class="pv-kicker">Design System</p>
        <h3 class="pv-title">同一套组件<br>不同的性格</h3>
        <p class="pv-desc">色彩、字体、圆角与材质，决定了界面的气质。</p>
        <div class="pv-actions"><span class="pv-btn">主要操作</span><span class="pv-btn pv-btn--ghost">次要操作</span></div>
        <div class="pv-chips"><span>标签 A</span><span>标签 B</span><span>+12</span></div>
      </div>
      <div class="pv-card">
        <div class="pv-cardhead"><span>月度增长</span><i class="pv-dot"></i></div>
        <div class="pv-metric">+24.8<small>%</small></div>
        <div class="pv-bars" aria-hidden="true">${BARS.map((h) => `<i style="--h:${h}%"></i>`).join('')}</div>
        <div class="pv-rows">
          <div><span>转化率</span><b>4.2%</b></div>
          <div><span>客单价</span><b>¥328</b></div>
        </div>
      </div>
    </div>
    <div class="pv-foot">
      <span class="pv-swatches">${swatchRow(s)}</span>
      <span class="pv-type">Aa Bb Cc 0123</span>
    </div>
  </div>
</div>`;
};

const specimenMarkup = (s) =>
  `<div class="pv pv--spec t-${s.id} ${fxClass(s)}" data-mode="${s.theme.mode}" data-preview>
  <div class="pv-bg" aria-hidden="true"></div>
  <div class="spec">
    <div class="spec-i"><span class="spec-l">按钮 / Button</span><span class="spec-row"><span class="pv-btn">Primary</span><span class="pv-btn pv-btn--ghost">Ghost</span></span></div>
    <div class="spec-i"><span class="spec-l">输入 / Input</span><span class="pv-input">name@example.com</span></div>
    <div class="spec-i"><span class="spec-l">标签 / Chip</span><span class="pv-chips"><span>已选中</span><span>默认</span><span>+8</span></span></div>
    <div class="spec-i"><span class="spec-l">进度 / Progress</span><span class="pv-progress"><i></i></span></div>
    <div class="spec-i"><span class="spec-l">开关 / Switch</span><span class="pv-switch"><i></i></span></div>
    <div class="spec-i"><span class="spec-l">数值 / Numeric</span><span class="pv-num">1,284.50</span></div>
  </div>
</div>`;

/* ----------------------------------------------------------------------------
 * 页面壳
 * ------------------------------------------------------------------------- */

const GH = 'https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max';

const head = ({ title, desc, base = '', extra = '', intro = null }) => `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#F6F5F1">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${base}assets/site.css">
<link rel="stylesheet" href="${base}assets/themes.css">
${extra}${intro ? intro.head : ''}${xnavHead()}
</head>
<body>${intro ? intro.body : ''}`;

const brand = `<span class="mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`;

const header = (base = '', active = '') => `<header class="site-head">
  <div class="wrap head-in">
    <a class="brand" href="${base}index.html">${brand}<span class="brand-t">UI/UX Pro Max<em>风格图鉴</em></span></a>
    <nav class="nav" aria-label="主导航">
      <span class="nav-set" data-navset>
        <a href="${base}index.html" data-nav="all"${active === 'all' ? ' aria-current="page"' : ''}><span class="nl">全部风格</span><span class="ns">全部</span></a>
        <a href="${base}index.html#types" data-nav="types"><span class="nl">分类</span><span class="ns">分类</span></a>
        <a href="${base}guide.html" data-nav="guide"${active === 'guide' ? ' aria-current="page"' : ''}><span class="nl">阅读指南</span><span class="ns">指南</span></a>
        <span class="nav-ind" aria-hidden="true"></span>
      </span>
      <a class="nav-x" href="${base}../handbook/" data-xnav="${HANDBOOK.name}" title="${OTHER_VIEW}：知道该长什么样之后，定配色 / 字体 / 图表 / 落地页 / 规范 / 配方"><span class="nx-full">${HANDBOOK.name}</span><span class="nx-short">手册</span><span aria-hidden="true">→</span></a>
      <a class="nav-gh" href="${GH}" target="_blank" rel="noopener">GitHub<span aria-hidden="true">↗</span></a>
    </nav>
  </div>
</header>`;

const footer = (base = '') => `<footer class="site-foot">
  <div class="wrap foot-in">
    <div>
      <p class="foot-brand">${brand} dsh-ui-ux-pro-max</p>
      <p class="foot-note">88 种设计风格 · 完全离线的 UI/UX 设计智能库 · MIT License</p>
    </div>
    <div class="foot-links">
      <a href="${base}index.html">风格图鉴</a>
      <a href="${base}guide.html">阅读指南</a>
      <a href="${base}../handbook/" data-xnav="${HANDBOOK.name}">设计手册</a>
      <a href="${GH}" target="_blank" rel="noopener">源码</a>
      <a href="${GH}/blob/main/docs/DATA-PROVENANCE.md" target="_blank" rel="noopener">数据来源</a>
    </div>
  </div>
  <div class="wrap foot-fine">数据移植自 nextlevelbuilder/ui-ux-pro-max-skill（MIT）。纯静态生成，无外部请求。</div>
</footer>
<script src="${base}assets/app.js" defer></script>
</body>
</html>`;

/* ----------------------------------------------------------------------------
 * 首页
 * ------------------------------------------------------------------------- */

const FAMILY_ORDER = ['general', 'mobile', 'data', 'landing', 'platform'];

const familyCounts = FAMILY_ORDER.map((k) => families.find((f) => f.key === k))
  .filter(Boolean)
  .map((f) => ({
    ...f,
    count: styles.filter((s) => s.family.key === f.key).length,
    sample: styles.filter((s) => s.family.key === f.key).slice(0, 4)
  }));

const statusCounts = {
  active: styles.filter((s) => s.status === 'active').length,
  supplemental: styles.filter((s) => s.status === 'supplemental').length,
  deprecated: styles.filter((s) => s.status === 'deprecated').length
};

const cardMarkup = (s) => `<article class="card" data-card data-id="${s.id}" data-family="${s.family.key}" data-status="${s.status}" data-no="${s.no}" data-complexity="${s.complexity}" data-name="${esc(s.zh)}" data-search="${esc(
  [s.zh, s.en, s.id, s.tag, s.keywords.join(' '), s.aliases.join(' '), s.desc].join(' ').toLowerCase()
)}">
  <a class="card-a" href="style/${s.id}.html">
    <div class="card-thumb">${previewMarkup(s, 'mini')}</div>
    <div class="card-body">
      <div class="card-tit"><h3>${esc(s.zh)}</h3><span>${esc(s.en)}</span></div>
      <p class="card-tag">${esc(s.tag)}</p>
      <div class="card-meta">
        <span class="dots">${swatchRow(s)}</span>
        <span class="badge b-${s.status}">${s.statusLabel}</span>
      </div>
    </div>
  </a>
</article>`;

const indexPage = () => {
  const intro = {
    head: `${introCss()}${introHead()}`,
    body: introMarkup({
      eyebrow: `${GALLERY.en} · ${styles.length} styles`,
      meta: `${styles.length} 种风格 · ${META.counts.color} 套配色 · ${META.counts.typography} 组字体 · ${META.counts.ux} 条规范`
    })
  };
  return `${head({
  title: 'UI/UX Pro Max · 88 种设计风格图鉴',
  desc: `把 88 种设计风格一次性看全：每种风格都有真实渲染的效果示例、配色方案、字体与材质特征、适用场景与实现清单。`,
  intro
})}
${header('', 'all')}
<main>
  <section class="hero wrap" data-rise>
    <p class="eyebrow">Style Atlas · ${META.counts.style} Styles</p>
    <h1>把设计风格<br><em>看清楚</em>再选。</h1>
    <p class="lede">${styles.length} 种风格由同一套骨架渲染，只换颜色、字体、圆角与材质。</p>
    <div class="hero-act">
      <a class="btn" href="#gallery">进入图鉴 <span aria-hidden="true">↓</span></a>
      <button class="btn btn-ghost" type="button" data-random>随便看一种</button>
    </div>
    <dl class="stats">
      <div><dt>设计风格</dt><dd>${styles.length}</dd></div>
      <div><dt>调色板</dt><dd>${META.counts.color}</dd></div>
      <div><dt>字体搭配</dt><dd>${META.counts.typography}</dd></div>
      <div><dt>UX 规范</dt><dd>${META.counts.ux}</dd></div>
      <div><dt>图表类型</dt><dd>${META.counts.chart}</dd></div>
    </dl>
  </section>

  <section class="wrap xbar-w" data-rise="1">
    <a class="xbar" href="../handbook/" data-xnav="${HANDBOOK.name}">
      <span class="xbar-k">${OTHER_VIEW} · ${HANDBOOK.name}</span>
      <span class="xbar-t">${HANDBOOK_LINE}：${META.counts.product} 份产品配方，六个域互相引用</span>
      <span class="xbar-go">进入${HANDBOOK.name}<span aria-hidden="true">→</span></span>
    </a>
  </section>

  <section id="types" class="wrap sec">
    <div class="sec-head">
      <h2>按类别浏览</h2>
    </div>
    <div class="type-grid">
      ${familyCounts
        .map(
          (f) => `<button class="type-card" type="button" data-jump="${f.key}">
        <span class="type-top"><span class="type-name">${f.zh}</span><span class="type-n">${String(f.count).padStart(2, '0')}</span></span>
        <span class="type-bar">${f.sample.map((s) => `<i style="background:${s.theme.modes[s.theme.mode].accent}"></i>`).join('')}</span>
        <span class="type-list">${f.sample.map((s) => s.zh).join(' · ')}${f.count > 4 ? ' 等' : ''}</span>
      </button>`
        )
        .join('\n')}
    </div>
  </section>

  <section id="gallery" class="wrap sec">
    <div class="sec-head">
      <h2>全部风格</h2>
      <p>${statusCounts.active} 推荐 · ${statusCounts.supplemental} 补充 · ${statusCounts.deprecated} 已弃用（仅用于复刻旧项目）</p>
    </div>

    <div class="filters" data-filters>
      <div class="tabs" role="tablist" aria-label="风格类别">
        <button class="tab on" role="tab" aria-selected="true" data-family="all">全部 <span>${styles.length}</span></button>
        ${familyCounts.map((f) => `<button class="tab" role="tab" aria-selected="false" data-family="${f.key}">${f.short} <span>${f.count}</span></button>`).join('')}
      </div>
      <div class="filter-row">
        <label class="search"><span class="sr">搜索风格</span>
          <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="5.5"></circle><path d="M13.5 13.5L17 17"></path></svg>
          <input type="search" placeholder="搜风格、场景或关键词，按 / 聚焦" data-search-input autocomplete="off">
        </label>
        <label class="select"><span class="sr">状态</span>
          <select data-status>
            <option value="all">全部状态</option>
            <option value="active">推荐</option>
            <option value="supplemental">补充</option>
            <option value="deprecated">已弃用</option>
          </select>
        </label>
        <label class="select"><span class="sr">排序</span>
          <select data-sort>
            <option value="no">按编号</option>
            <option value="name">按名称</option>
            <option value="complexity">按复杂度</option>
            <option value="status">按状态</option>
          </select>
        </label>
      </div>
      <p class="count" data-count>显示 ${styles.length} / ${styles.length} 种风格</p>
    </div>

    <div class="grid" data-grid>
      ${styles.map(cardMarkup).join('\n')}
    </div>
    <p class="empty" data-empty hidden>没有匹配的风格，换个关键词试试。</p>
  </section>

  <section class="wrap sec notes">
    <div class="note-card">
      <h2>这些预览是怎么来的？</h2>
      <p>同一副骨架（品牌栏、标题、正文、按钮、指标卡、柱状图），只替换该风格的令牌——差异全部来自风格本身。</p>
      <p><a href="guide.html">阅读指南</a> 说明字段含义与令牌推导方式。</p>
    </div>
    <div class="note-card">
      <h2>为什么有「已弃用」？</h2>
      <p>9 条 <code>deprecated</code> 仅提示「不要作为新项目首选」，插件检索默认排除；29 条 <code>supplemental</code> 是变体或细分场景。</p>
    </div>
  </section>
</main>
${footer('')}`;
};

/* ----------------------------------------------------------------------------
 * 详情页
 * ------------------------------------------------------------------------- */

const chipList = (items, cls = '') =>
  items.map((x) => `<span class="chip ${cls}">${esc(x)}</span>`).join('');

const matrixCell = (label, value, hint = '') =>
  `<div class="mcell"><span class="mlabel">${label}</span><strong>${esc(value)}</strong>${hint ? `<span class="mhint">${esc(hint)}</span>` : ''}</div>`;

const detailPage = (s) => {
  const base = '../';
  const baseTokens = s.theme.modes[s.theme.mode];
  const accentOnBg = contrast(baseTokens.accent, baseTokens.bg);
  const parent = s.parent ? byId.get(s.parent) : null;
  const children = styles.filter((x) => x.parent === s.id);
  const sameType = styles.filter((x) => x.family.key === s.family.key && x.id !== s.id && ![s.parent].includes(x.id));
  const related = [...children, ...sameType, ...(parent ? [parent] : [])]
    .filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i)
    .slice(0, 4);

  const metaChips = [
    `<span class="chip chip-type">${esc(s.type)}</span>`,
    `<span class="badge b-${s.status}">${s.statusLabel}</span>`,
    s.preferredMode === 'dark' ? '<span class="chip">默认深色</span>' : ''
  ].join('');

  return `${head({
    title: `${s.zh} · ${s.en} — 风格图鉴`,
    desc: `${s.desc} 适用：${s.tag}。`,
    base
  })}
${header(base)}
<main class="detail wrap">
  <nav class="crumb" aria-label="面包屑">
    <a href="${base}index.html">风格图鉴</a><span>/</span>
    <a href="${base}index.html?family=${s.family.key}#gallery">${s.family.zh}</a><span>/</span>
    <span>${esc(s.zh)}</span>
  </nav>

  <section class="d-head">
    <div class="d-head-main">
      <div class="d-meta">${metaChips}</div>
      <h1>${esc(s.zh)}<span class="d-en">${esc(s.en)}</span></h1>
      <p class="lede">${esc(s.desc)}</p>
      <p class="d-tag"><span>典型场景</span>${esc(s.tag)}</p>
      <div class="d-facts">
        <span><em>编号</em>${String(s.no).padStart(2, '0')}</span>
        <span><em>年代</em>${esc(s.era || '—')}</span>
        <span><em>复杂度</em>${esc(s.complexity)}</span>
        <span><em>默认模式</em>${s.preferredMode === 'dark' ? '深色' : '自动'}</span>
      </div>
    </div>
    <aside class="d-aside">
      <div class="pal-strip">${s.palette.slice(0, 6).map((c) => `<i style="background:${c}" title="${c}"></i>`).join('')}</div>
      <div class="id-box">
        <span class="id-label">Style ID</span>
        <code>${s.id}</code>
        <button class="copy" type="button" data-copy="${s.id}" aria-label="复制 Style ID">复制</button>
      </div>
      <p class="id-hint">在插件中检索：<code>design_search("${esc(s.keywords[0] || s.zh)}", domain: "style")</code></p>
    </aside>
  </section>

  <div class="d-layout">
    <div class="d-main">
      <section id="preview" class="block">
        <div class="block-head">
          <h2>效果示例</h2>
          <div class="seg" role="group" aria-label="预览明暗模式">
            <button type="button" class="on" data-set-mode="light">浅色</button>
            <button type="button" data-set-mode="dark">深色</button>
          </div>
        </div>
        <div class="frame">
          <div class="frame-bar"><i></i><i></i><i></i><span>preview / ${esc(s.id)}</span></div>
          <div class="frame-body">${previewMarkup(s, 'hero')}</div>
        </div>
        ${specimenMarkup(s)}
        <p class="cap">同一副骨架，只换令牌。明暗切换对比两种模式${
          s.lightMode === 'not-recommended' || s.darkMode === 'not-recommended'
            ? `（数据标注：浅色 ${MODE_LABEL[s.lightMode] || s.lightMode}，深色 ${MODE_LABEL[s.darkMode] || s.darkMode}）`
            : ''
        }。</p>
      </section>

      <section id="about" class="block">
        <div class="block-head"><h2>风格描述</h2></div>
        <div class="prose">
          <p>${esc(s.desc)}</p>
        </div>
        <h3 class="sub">关键词</h3>
        <div class="chips">${chipList(s.keywords)}</div>
        ${s.aliases.length ? `<h3 class="sub">别名</h3><div class="chips">${chipList(s.aliases)}</div>` : ''}
        <h3 class="sub">效果与动效</h3>
        <p class="body-text">${esc(s.effects)}</p>
        <h3 class="sub">设计系统变量</h3>
        <div class="tok-table">
          ${s.tokens
            .map((t) => {
              const i = t.indexOf(':');
              const k = i > -1 ? t.slice(0, i).trim() : t;
              const v = i > -1 ? t.slice(i + 1).trim() : '';
              return `<div class="tok"><code>${esc(k)}</code><span>${esc(v)}</span></div>`;
            })
            .join('')}
        </div>
      </section>

      <section id="palette" class="block">
        <div class="block-head"><h2>配色方案</h2><span class="bhint">色值取自风格数据，不足时补充主题令牌</span></div>
        <div class="sw-grid">
          ${s.paletteItems
            .slice(0, 8)
            .map(
              (item) => `<button class="sw" type="button" data-copy="${item.hex}" title="点击复制 ${item.hex}">
            <span class="sw-c" style="background:${item.hex}"></span>
            <span class="sw-t"><b>${item.hex.toUpperCase()}</b><i>${item.source}</i></span>
          </button>`
            )
            .join('')}
        </div>
        <div class="pal-cols">
          <div><h3 class="sub">主色 / Primary</h3><p class="body-text">${esc(s.primary)}</p></div>
          <div><h3 class="sub">辅色 / Secondary</h3><p class="body-text">${esc(s.secondary)}</p></div>
        </div>
        <p class="cap">强调色在页面底色上的对比度约 <b>${accentOnBg.toFixed(1)}:1</b>${
          accentOnBg >= 4.5 ? '，可用于正文与图标。' : accentOnBg >= 3 ? '，适合大字与图形，正文需另配深色。' : '，仅适合装饰与大色块，不要用于文字。'
        }</p>
      </section>

      <section id="usage" class="block">
        <div class="block-head"><h2>适用场景</h2></div>
        <div class="use-grid">
          <div class="use good">
            <h3>适合 / Best For</h3>
            <ul>${s.bestFor.map((x) => `<li>${esc(x)}</li>`).join('') || '<li>—</li>'}</ul>
          </div>
          <div class="use bad">
            <h3>避开 / Do Not Use For</h3>
            <ul>${s.avoid.map((x) => `<li>${esc(x)}</li>`).join('') || '<li>—</li>'}</ul>
          </div>
        </div>
        <h3 class="sub">框架兼容</h3>
        <div class="chips">${chipList(s.frameworks.length ? s.frameworks : ['—'])}</div>
      </section>

      <section id="matrix" class="block">
        <div class="block-head"><h2>能力矩阵</h2></div>
        <div class="matrix">
          ${matrixCell('浅色模式', MODE_LABEL[s.lightMode] || s.lightMode || '—')}
          ${matrixCell('深色模式', MODE_LABEL[s.darkMode] || s.darkMode || '—')}
          ${matrixCell('移动适配', MOBILE_LABEL[s.mobile] || s.mobile || '—')}
          ${matrixCell('转化导向', s.conversionInfo.label, stripTags(s.conversion))}
          ${matrixCell('渲染成本', s.perf.costLabel, s.perf.drivers)}
          ${matrixCell('无障碍风险', s.a11y.riskLabel, s.a11y.requires)}
        </div>
      </section>

      <section id="build" class="block">
        <div class="block-head"><h2>实现要点</h2></div>
        <h3 class="sub">落地清单</h3>
        <ul class="check">${s.checklist.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <h3 class="sub">CSS / 技术关键词</h3>
        <p class="body-text mono-text">${esc(s.cssKeywords)}</p>
        ${
          s.parent && byId.get(s.parent)
            ? `<div class="rel-note">衍生自 <a href="${base}style/${s.parent}.html">${esc(byId.get(s.parent).zh)} / ${esc(byId.get(s.parent).en)}</a>。${
                children.length ? `下辖 ${children.length} 个变体。` : ''
              }</div>`
            : children.length
              ? `<div class="rel-note">下辖变体：${children
                  .map((c) => `<a href="${base}style/${c.id}.html">${esc(c.zh)}</a>`)
                  .join('、')}。</div>`
              : ''
        }
        ${
          s.status === 'deprecated'
            ? `<div class="rel-note warn">该条目在上游数据中标记为已弃用，插件检索默认排除；查询中包含 <code>legacy</code> 或 <code>deprecated</code> 时才会召回。</div>`
            : ''
        }
      </section>

      <section id="prompt" class="block">
        <div class="block-head"><h2>AI 提示词</h2><button class="copy" type="button" data-copy="${esc(s.prompt)}">复制</button></div>
        <pre class="prompt">${esc(s.prompt || '—')}</pre>
      </section>

      <nav class="pager" aria-label="上一种 / 下一种">
        <a href="${base}style/${s.prev.id}.html"><span>上一种 · ${String(s.prev.no).padStart(2, '0')}</span><strong>${esc(s.prev.zh)}</strong></a>
        <a class="pager-next" href="${base}style/${s.next.id}.html"><span>下一种 · ${String(s.next.no).padStart(2, '0')}</span><strong>${esc(s.next.zh)}</strong></a>
      </nav>
    </div>

    <aside class="toc" aria-label="本页目录">
      <p class="toc-t">本页</p>
      <a href="#preview">效果示例</a>
      <a href="#about">风格描述</a>
      <a href="#palette">配色方案</a>
      <a href="#usage">适用场景</a>
      <a href="#matrix">能力矩阵</a>
      <a href="#build">实现要点</a>
      <a href="#prompt">AI 提示词</a>
      <a href="#related">相关风格</a>
    </aside>
  </div>

  <section id="related" class="block related">
    <div class="block-head"><h2>相关风格</h2><a class="bhint" href="${base}index.html?family=${s.family.key}#gallery">查看全部 ${s.family.zh} →</a></div>
    <div class="rel-grid">
      ${related
        .map(
          (r) => `<a class="rel" href="${base}style/${r.id}.html">
        <span class="rel-thumb">${previewMarkup(r, 'mini')}</span>
        <span class="rel-body"><strong>${esc(r.zh)}</strong><em>${esc(r.en)}</em><span>${esc(r.tag)}</span></span>
      </a>`
        )
        .join('')}
    </div>
  </section>
</main>
${footer(base)}`;
};

/* ----------------------------------------------------------------------------
 * 指南页
 * ------------------------------------------------------------------------- */

const guidePage = () => `${head({
  title: '阅读指南 — UI/UX Pro Max 风格图鉴',
  desc: '图鉴的字段含义、预览生成方式、令牌推导规则，以及如何在 DeepSeek Harness 中使用这些风格。'
})}
${header('', 'guide')}
<main class="wrap guide">
  <p class="eyebrow">How to read</p>
  <h1>阅读指南</h1>
  <p class="lede">每个区块在讲什么，以及预览的边界在哪里。</p>

  <section class="g-sec">
    <h2>1 · 预览不是截图</h2>
    <p>所有预览都由同一副骨架实时渲染，只替换 <em>设计令牌</em>（颜色、字体、圆角、描边与材质特效），因此差异全部来自风格本身。目的不是复刻某个产品，而是让风格之间可以横向比较。</p>
    <div class="g-pair">
      ${previewMarkup(byId.get('minimalism-and-swiss-style'), 'mini')}
      ${previewMarkup(byId.get('neubrutalism'), 'mini')}
    </div>
    <p class="cap">左：极简主义 / 瑞士风格；右：新粗野主义。同一副结构，两种语气。</p>
  </section>

  <section class="g-sec">
    <h2>2 · 字段说明</h2>
    <dl class="g-dl">
      <dt>风格描述</dt><dd>中文导读；原始英文的 Keywords 与 Effects 紧随其后，便于对照。</dd>
      <dt>配色方案</dt><dd>从原文色彩字段提取的 HEX 色板；只给语义描述时用该体系的品牌色代示。</dd>
      <dt>能力矩阵</dt><dd>明暗模式、移动适配、转化导向、渲染成本与无障碍风险，均来自数据字段，不是评分。</dd>
      <dt>实现要点</dt><dd>落地清单、CSS 关键词与可直接复制的提示词。</dd>
      <dt>状态</dt><dd><span class="badge b-active">推荐</span> 主推；<span class="badge b-supplemental">补充</span> 变体；<span class="badge b-deprecated">已弃用</span> 默认不召回。</dd>
    </dl>
  </section>

  <section class="g-sec">
    <h2>3 · 明暗切换的含义</h2>
    <p>原数据只标注支持度（<code>supported</code> / <code>conditional</code> / <code>not-recommended</code>），没有两套完整色板；非默认模式由中性色推导，仅供对比，不要直接当生产配色。</p>
  </section>

  <section class="g-sec">
    <h2>4 · 在项目里使用</h2>
    <p>图鉴是静态站点；真正的设计能力在插件里：</p>
    <pre class="prompt">design_recommend("金融 SaaS 数据看板", projectName: "金融智控台", stack: "react", variance: 8)
design_search("毛玻璃 深色", domain: "style")
design_review("移动端登录表单", platform: "mobile")</pre>
    <p><code>variance</code>（大胆度）、<code>motion</code>（动效）、<code>density</code>（密度）取值 1–10。</p>
  </section>

  <section class="g-sec">
    <h2>5 · 数据与许可</h2>
    <p>数据移植自 <a href="https://github.com/nextlevelbuilder/ui-ux-pro-max-skill" target="_blank" rel="noopener">nextlevelbuilder/ui-ux-pro-max-skill</a>（commit <code>${esc(META.upstreamRef.slice(0, 7))}</code>，MIT），同步于 ${esc(META.syncedAt.slice(0, 10))}。中文名称与导读为编辑内容，不改动上游判定。</p>
  </section>

  <p class="g-back"><a class="btn" href="index.html">返回图鉴</a></p>
</main>
${footer('')}`;

/* ----------------------------------------------------------------------------
 * 404
 * ------------------------------------------------------------------------- */

const notFound = () => `${head({ title: '页面不存在 — 风格图鉴', desc: '页面不存在。' })}
${header('', '')}
<main class="wrap nf">
  <p class="eyebrow">404</p>
  <h1>这一页不在图鉴里。</h1>
  <p class="lede">链接可能已经变化。回到首页，或用分类与搜索重新定位。</p>
  <p><a class="btn" href="index.html">返回图鉴</a></p>
</main>
${footer('')}`;

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<rect width="32" height="32" rx="7" fill="#14161A"/>
<rect x="7" y="7" width="8" height="8" fill="#E4501E"/>
<rect x="17" y="7" width="8" height="8" fill="#F6F5F1"/>
<rect x="7" y="17" width="8" height="8" fill="#8A8F98"/>
<rect x="17" y="17" width="8" height="8" fill="#E4501E"/>
</svg>`;

/* ----------------------------------------------------------------------------
 * 输出
 * ------------------------------------------------------------------------- */

const write = (rel, content) => {
  const file = path.join(SITE, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

const copyDir = (from, to) => {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
};

// 清理旧产物：保留 site/ 本身，避免 Windows 下作为服务根目录时被占用
fs.mkdirSync(SITE, { recursive: true });
for (const entry of fs.readdirSync(SITE)) {
  try {
    fs.rmSync(path.join(SITE, entry), { recursive: true, force: true });
  } catch (err) {
    console.warn(`[warn] 无法清理 ${entry}：${err.code || err.message}`);
  }
}
fs.mkdirSync(path.join(SITE, 'style'), { recursive: true });
fs.mkdirSync(path.join(SITE, 'assets'), { recursive: true });

write('assets/themes.css', `/* 由 tools/showcase/build.mjs 自动生成，请勿手改 */\n${themeCss}\n`);
write('assets/favicon.svg', favicon);
copyDir(path.join(__dirname, 'assets'), path.join(SITE, 'assets'));

// 跨站切换动效：源码只有一份（tools/xnav.mjs），构建时追加进样式表与脚本，
// 既保证两站节奏完全一致，也不新增请求。
for (const [file, extra] of [
  ['site.css', xnavCss()],
  ['app.js', xnavJs()],
]) {
  const dest = path.join(SITE, 'assets', file);
  fs.writeFileSync(dest, fs.readFileSync(dest, 'utf8') + extra);
}

write('index.html', indexPage());
write('guide.html', guidePage());
write('404.html', notFound());
write('.nojekyll', '');
for (const s of styles) write(`style/${s.id}.html`, detailPage(s));

// 校验：每个 fx 类都应有对应样式
const cssText = fs.readFileSync(path.join(SITE, 'assets/site.css'), 'utf8');
const fxUsed = [...new Set(styles.flatMap((s) => s.theme.fx))];
const fxMissing = fxUsed.filter((f) => !cssText.includes(`.fx-${f}`));
if (fxMissing.length) {
  console.warn(`[warn] 以下特效类缺少样式定义：${fxMissing.join(', ')}`);
}

const bytes = styles.reduce((n, s) => n + fs.statSync(path.join(SITE, `style/${s.id}.html`)).size, 0);
console.log(`✓ site/ 生成完成：${styles.length + 4} 个页面`);
console.log(`  风格页 ${styles.length} 个，合计 ${(bytes / 1024).toFixed(0)} KB`);
console.log(`  分类 ${familyCounts.map((f) => `${f.short} ${f.count}`).join(' / ')}`);
console.log(`  状态 推荐 ${statusCounts.active} / 补充 ${statusCounts.supplemental} / 弃用 ${statusCounts.deprecated}`);
console.log(`  特效类 ${fxUsed.length} 个${fxMissing.length ? `（缺 ${fxMissing.length}）` : '，全部有样式'}`);
