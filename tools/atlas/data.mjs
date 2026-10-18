/**
 * 派生数据层：把 index.json 的原始行整理成页面可直接渲染的结构。
 * 不做任何 HTML，只做解析、归一化、匹配与校验。
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseColor, toHex, toCss, contrast, hueOf, saturationOf, isDark, hueName, wcagLevel } from './color.mjs';
import { moodKeywords, moodTokens } from './mood-map.mjs';
import { chartSvg } from './svg.mjs';
import { productZh as toProductZh, patternZh as toPatternZh, landingZh as toLandingZh } from './zh.mjs';
import { STYLE_META } from '../showcase/theme-data.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

/** style id → 中文名（复用图鉴的策划元数据，避免两份中文名不一致） */
const STYLE_ZH = new Map(Object.entries(STYLE_META).map(([id, m]) => [id, m.zh]));

export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const words = (s) =>
  String(s || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);

/** ---------- 风格索引：名称 / 别名 / id → style id ---------- */
function buildStyleIndex(styles) {
  const map = new Map();
  for (const s of styles) {
    const id = s['Style ID'];
    map.set(String(s['Style Category']).trim().toLowerCase(), id);
    map.set(String(id).toLowerCase(), id);
    for (const a of String(s['Aliases'] || '').split(/[,;]/)) {
      const k = a.trim().toLowerCase();
      if (k) map.set(k, id);
    }
  }
  return map;
}

function resolveStyles(text, index) {
  return String(text || '')
    .split(/[,+]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => {
      const id = index.get(name.toLowerCase()) || null;
      return { name, id, zh: (id && STYLE_ZH.get(id)) || '' };
    });
}

/**
 * 产品表的 Landing Page Pattern 是概念描述（如 "Storytelling-Driven + Social Proof"），
 * 与落地页表的 34 个 Pattern Name 不是同一套词汇。这里补一张概念 → 模式的映射，
 * 让配方里的落地页建议能链到落地页页面的具体条目。
 */
const LANDING_CONCEPT_MAP = {
  hero: 'Hero + Features + CTA',
  'hero centric': 'Hero-Centric Design',
  features: 'Feature-Rich Showcase',
  'feature rich': 'Feature-Rich Showcase',
  'feature list': 'Feature-Rich Showcase',
  showcase: 'Feature-Rich Showcase',
  cta: 'Hero + Features + CTA',
  conversion: 'Trust & Authority + Conversion',
  'conversion optimized': 'Trust & Authority + Conversion',
  demo: 'Product Demo + Features',
  'product demo': 'Product Demo + Features',
  'interactive product demo': 'Product Demo + Features',
  'interactive demo': 'Product Demo + Features',
  minimal: 'Minimal Single Column',
  'minimal direct': 'Minimal Single Column',
  direct: 'Minimal Single Column',
  storytelling: 'Scroll-Triggered Storytelling',
  'storytelling driven': 'Scroll-Triggered Storytelling',
  'social proof': 'Hero + Testimonials + CTA',
  'social proof focused': 'Hero + Testimonials + CTA',
  testimonial: 'Product Review/Ratings Focused',
  rating: 'Product Review/Ratings Focused',
  trust: 'Trust & Authority + Conversion',
  'trust authority': 'Trust & Authority + Conversion',
  authority: 'Trust & Authority + Conversion',
  faq: 'FAQ/Documentation Landing',
  documentation: 'FAQ/Documentation Landing',
  docs: 'FAQ/Documentation Landing',
  'interactive docs': 'FAQ/Documentation Landing',
  'quick start': 'FAQ/Documentation Landing',
  'hierarchical navigation': 'FAQ/Documentation Landing',
  pricing: 'Pricing Page + CTA',
  comparison: 'Comparison Table + CTA',
  waitlist: 'Waitlist/Coming Soon',
  webinar: 'Webinar Registration',
  newsletter: 'Newsletter / Content First',
  content: 'Newsletter / Content First',
  event: 'Event/Conference Landing',
  'event grid': 'Event/Conference Landing',
  agenda: 'Event/Conference Landing',
  cfp: 'Event/Conference Landing',
  portfolio: 'Portfolio Grid',
  'portfolio grid': 'Portfolio Grid',
  'wall of love': 'Portfolio Grid',
  'wall of love grid': 'Portfolio Grid',
  immersive: 'Immersive/Interactive Experience',
  'immersive experience': 'Immersive/Interactive Experience',
  'interactive experience': 'Immersive/Interactive Experience',
  'full screen immersive': 'Immersive/Interactive Experience',
  'real time': 'Real-Time / Operations Landing',
  'real time monitor': 'Real-Time / Operations Landing',
  'data dense': 'Real-Time / Operations Landing',
  dashboard: 'Real-Time / Operations Landing',
  bento: 'Bento Grid Showcase',
  'bento grid': 'Bento Grid Showcase',
  marketplace: 'Marketplace / Directory',
  directory: 'Marketplace / Directory',
  'service directory': 'Marketplace / Directory',
  search: 'Marketplace / Directory',
  'search first': 'Marketplace / Directory',
  'filter heavy': 'Marketplace / Directory',
  'filter heavy grid': 'Marketplace / Directory',
  'opportunity grid': 'Marketplace / Directory',
  enterprise: 'Enterprise Gateway',
  video: 'Video-First Hero',
  ai: 'AI-Driven Dynamic Landing',
  'ai driven': 'AI-Driven Dynamic Landing',
  'ai personalization': 'AI-Driven Dynamic Landing',
  configurator: 'Interactive 3D Configurator',
  '3d': 'Interactive 3D Configurator',
  'horizontal scroll': 'Horizontal Scroll Journey',
  'before after': 'Before-After Transformation',
  community: 'Community/Forum Landing',
  forum: 'Community/Forum Landing',
  'lead magnet': 'Lead Magnet + Form',
  form: 'Lead Magnet + Form',
  'app store': 'App Store Style Landing',
};

const normKey = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** ---------- 配色 ---------- */
const TOKEN_FIELDS = [
  ['primary', 'Primary', '主色'],
  ['onPrimary', 'On Primary', '主色前景'],
  ['secondary', 'Secondary', '辅色'],
  ['onSecondary', 'On Secondary', '辅色前景'],
  ['accent', 'Accent', '强调色'],
  ['onAccent', 'On Accent', '强调色前景'],
  ['background', 'Background', '背景'],
  ['foreground', 'Foreground', '正文'],
  ['card', 'Card', '卡片'],
  ['cardForeground', 'Card Foreground', '卡片正文'],
  ['muted', 'Muted', '弱化底'],
  ['mutedForeground', 'Muted Foreground', '弱化文字'],
  ['border', 'Border', '描边'],
  ['destructive', 'Destructive', '危险色'],
  ['onDestructive', 'On Destructive', '危险前景'],
  ['ring', 'Ring', '焦点环'],
];

const CONTRAST_PAIRS = [
  ['正文 / 背景', 'foreground', 'background'],
  ['主按钮文字', 'onPrimary', 'primary'],
  ['辅按钮文字', 'onSecondary', 'secondary'],
  ['强调文字', 'onAccent', 'accent'],
  ['卡片文字', 'cardForeground', 'card'],
  ['弱化文字', 'mutedForeground', 'muted'],
  ['危险按钮文字', 'onDestructive', 'destructive'],
];

function buildPalettes(colorRows) {
  return colorRows.map((row) => {
    const raw = {};
    for (const [key, field] of TOKEN_FIELDS) raw[key] = String(row[field] || '').trim();
    const css = {};
    for (const [key] of TOKEN_FIELDS) {
      const parsed = parseColor(raw[key]);
      css[key] = parsed ? toCss(parsed) : raw[key];
    }
    const bg = parseColor(raw.background);
    const primary = parseColor(raw.primary);
    const mode = isDark(bg) ? 'dark' : 'light';
    const h = primary ? hueOf(primary) : 0;
    const checks = CONTRAST_PAIRS.map(([label, fg, bgKey]) => {
      const ratio = contrast(raw[fg], raw[bgKey]);
      return { label, fg: css[fg], bg: css[bgKey], ratio: Math.round(ratio * 10) / 10, level: wcagLevel(ratio) };
    });
    const smallFails = checks.filter((c) => c.ratio < 4.5).length;
    return {
      key: slugify(row['Product Type']),
      productType: row['Product Type'],
      notes: String(row.Notes || '').trim(),
      mode,
      hue: Math.round(h),
      hueName: hueName(h),
      saturation: Math.round(saturationOf(primary) * 100),
      tokens: raw,
      css,
      checks,
      smallFails,
      contrastScore: checks.reduce((a, c) => a + c.ratio, 0) / checks.length,
    };
  });
}

/** ---------- 字体配对 ---------- */
function buildPairings(typographyRows, fontManifest) {
  const available = new Set((fontManifest?.families || []).map((f) => f.family.toLowerCase()));
  const metaByFamily = new Map(
    (read('data/fonts.json').googleFonts || []).map((f) => [f.Family.toLowerCase(), f]),
  );
  return typographyRows.map((row) => {
    const head = String(row['Heading Font'] || '').trim();
    const body = String(row['Body Font'] || '').trim();
    const kw = String(row['Mood/Style Keywords'] || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const headMeta = metaByFamily.get(head.toLowerCase());
    const bodyMeta = metaByFamily.get(body.toLowerCase());
    return {
      key: slugify(row['Font Pairing Name']),
      name: row['Font Pairing Name'],
      category: row['Category'],
      heading: head,
      body,
      keywords: kw,
      bestFor: String(row['Best For'] || '').trim(),
      importCss: String(row['CSS Import'] || '').trim(),
      tailwind: String(row['Tailwind Config'] || '').trim(),
      notes: String(row['Notes'] || '').trim(),
      offline: available.has(head.toLowerCase()) && available.has(body.toLowerCase()),
      headCategory: headMeta?.Category || '',
      bodyCategory: bodyMeta?.Category || '',
      headDesigner: headMeta?.Designers || '',
      bodyDesigner: bodyMeta?.Designers || '',
      headPopularity: Number(headMeta?.['Popularity Rank'] || 0),
      bodyPopularity: Number(bodyMeta?.['Popularity Rank'] || 0),
    };
  });
}

/** ---------- 落地页 ---------- */
function sectionKind(label) {
  const s = label.toLowerCase();
  if (/hero|headline|above the fold/.test(s)) return { kind: 'hero', h: 96 };
  if (/nav|header|menu bar/.test(s)) return { kind: 'nav', h: 30 };
  if (/footer/.test(s)) return { kind: 'footer', h: 32 };
  if (/pricing|plan|tier/.test(s)) return { kind: 'pricing', h: 56 };
  if (/faq|question/.test(s)) return { kind: 'faq', h: 40 };
  if (/testimonial|social proof|logo|review|trust|case stud/.test(s)) return { kind: 'social', h: 44 };
  if (/cta|call to action|signup|sign up|action/.test(s)) return { kind: 'cta', h: 48 };
  if (/form|demo|contact|waitlist|inquiry/.test(s)) return { kind: 'form', h: 56 };
  if (/feature|capabilit|how it works|solution|benefit|value|product/.test(s)) return { kind: 'feature', h: 56 };
  return { kind: 'other', h: 40 };
}

function buildLandings(landingRows) {
  return landingRows.map((row) => {
    const raw = String(row['Section Order'] || '');
    const sections = raw
      .split('>')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((label, i) => ({ index: i + 1, label, ...sectionKind(label) }));
    const totalH = sections.reduce((a, s) => a + s.h, 0);
    return {
      key: String(row['Pattern ID'] || slugify(row['Pattern Name'])),
      name: row['Pattern Name'],
      zh: toPatternZh(row['Pattern Name']),
      keywords: String(row['Keywords'] || '').trim(),
      order: raw,
      sections,
      totalH,
      ctaPlacement: String(row['Primary CTA Placement'] || '').trim(),
      colorStrategy: String(row['Color Strategy'] || '').trim(),
      effects: String(row['Recommended Effects'] || '').trim(),
      conversion: String(row['Conversion Optimization'] || '').trim(),
      aliases: String(row.Aliases || '').trim(),
    };
  });
}

/** ---------- 图表 ---------- */
function buildCharts(chartRows) {
  return chartRows.map((row) => {
    const type = String(row['Best Chart Type'] || '').trim();
    return {
      key: slugify(row['Data Type']),
      dataType: row['Data Type'],
      keywords: String(row['Keywords'] || '').trim(),
      best: type,
      secondary: String(row['Secondary Options'] || '').trim(),
      whenUse: String(row['When to Use'] || '').trim(),
      whenNot: String(row['When NOT to Use'] || '').trim(),
      volume: String(row['Data Volume Threshold'] || '').trim(),
      color: String(row['Color Guidance'] || '').trim(),
      risk: String(row['Accessibility Risk'] || '').replace(/^risk:/, '').trim(),
      a11y: String(row['Accessibility Notes'] || '').trim(),
      fallback: String(row['A11y Fallback'] || '').trim(),
      library: String(row['Library Recommendation'] || '').trim(),
      interactive: String(row['Interactive Level'] || '').trim(),
      svg: chartSvg(type),
    };
  });
}

/** ---------- 规范 ---------- */
const SEVERITY_ORDER = { critical: 0, high: 1, 'medium-high': 2, medium: 3, 'low-medium': 4, low: 5 };
const SEVERITY_ZH = {
  Critical: '致命',
  High: '高',
  'Medium-High': '中高',
  Medium: '中',
  'Low-Medium': '中低',
  Low: '低',
};

function buildPractices(groups) {
  const out = [];
  for (const [src, rows] of Object.entries(groups)) {
    for (const row of rows) {
      const sev = String(row.Severity || 'Medium').trim();
      out.push({
        key: `${src}-${row.No}`,
        source: src,
        sourceLabel: { ux: 'UX', react: 'React', web: 'Web' }[src],
        category: String(row.Category || '').trim(),
        issue: String(row.Issue || '').trim(),
        platform: String(row['Platform'] || '').trim(),
        description: String(row.Description || '').trim(),
        do: String(row.Do || '').trim(),
        dont: String(row["Don't"] || '').trim(),
        good: String(row['Code Example Good'] || '').trim(),
        bad: String(row['Code Example Bad'] || '').trim(),
        severity: sev,
        severityZh: SEVERITY_ZH[sev] || sev,
        severityRank: SEVERITY_ORDER[sev.toLowerCase()] ?? 3,
      });
    }
  }
  return out.sort((a, b) => a.severityRank - b.severityRank || a.source.localeCompare(b.source));
}

/** ---------- 产品配方 ---------- */
function resolveLandings(raw, byName, rows) {
  if (!raw || /^n\/?a\b/i.test(raw)) return [];
  const whole = byName.get(raw.toLowerCase());
  if (whole) return [{ name: whole.name, key: whole.key, label: raw }];
  const out = [];
  const push = (l, label) => {
    if (l && !out.some((o) => o.key === l.key)) out.push({ name: l.name, key: l.key, label });
  };
  for (const part of String(raw).split(/[+,]/).map((s) => s.trim()).filter(Boolean)) {
    const direct = byName.get(part.toLowerCase());
    if (direct) {
      push(direct, part);
      continue;
    }
    const key = normKey(part);
    const mapped = LANDING_CONCEPT_MAP[key];
    if (mapped) {
      push(byName.get(mapped.toLowerCase()), part);
      continue;
    }
    const wordsOf = key.split(' ').filter((w) => w.length > 3);
    let byWord = null;
    for (const w of wordsOf) {
      if (LANDING_CONCEPT_MAP[w]) {
        byWord = LANDING_CONCEPT_MAP[w];
        break;
      }
    }
    if (byWord) {
      push(byName.get(byWord.toLowerCase()), part);
      continue;
    }
    let best = null;
    let bestScore = 0;
    for (const l of rows) {
      const n = normKey(l.name);
      const score = wordsOf.filter((w) => n.includes(w)).length;
      if (score > bestScore) {
        bestScore = score;
        best = l;
      }
    }
    if (bestScore >= 1) push(best, part);
  }
  return out.slice(0, 2);
}

function buildRecipes({ productRows, reasoningRows, paletteByType, pairings, styleIndex, landingRows }) {
  const landingByName = new Map();
  for (const l of landingRows) {
    landingByName.set(l.name.toLowerCase(), l);
    for (const a of l.aliases.split(/[,;]/)) {
      const k = a.trim().toLowerCase();
      if (k) landingByName.set(k, l);
    }
  }
  let landingHit = 0;

  const recipes = productRows.map((row, i) => {
    const type = row['Product Type'];
    const rea = reasoningRows[i] || {};
    const palette = paletteByType.get(type);
    const mood = String(rea['Typography_Mood'] || '');
    const kws = new Set(moodKeywords(mood));
    const ptWords = new Set(words(type));
    const scored = pairings
      .map((p) => {
        let hit = 0;
        for (const k of p.keywords) if (kws.has(k)) hit += 1;
        let bf = 0;
        for (const w of words(p.bestFor)) if (ptWords.has(w)) bf += 1;
        return { pairing: p, score: hit * 2 + bf, hit, bf };
      })
      .filter((s) => s.hit > 0)
      .sort((a, b) => b.score - a.score || a.pairing.headPopularity - b.pairing.headPopularity);

    const landingRaw = String(row['Landing Page Pattern'] || '').trim();
    const matchedLandings = resolveLandings(landingRaw, landingByName, landingRows);
    if (matchedLandings.length) landingHit += 1;

    let rules = null;
    try {
      rules = JSON.parse(rea.Decision_Rules || 'null');
    } catch {
      rules = null;
    }

    return {
      key: slugify(type),
      index: i + 1,
      productType: type,
      productZh: toProductZh(type),
      keywords: String(row.Keywords || '').trim(),
      stylePrimary: resolveStyles(row['Primary Style Recommendation'], styleIndex),
      styleSecondary: resolveStyles(row['Secondary Styles'], styleIndex),
      landingRaw,
      landingZh: toLandingZh(landingRaw),
      landings: matchedLandings,
      landing: matchedLandings[0] || { name: landingRaw, key: null },
      dashboardStyle: String(row['Dashboard Style (if applicable)'] || '').trim(),
      dashboardZh: toProductZh(row['Dashboard Style (if applicable)']),
      colorFocus: String(row['Color Palette Focus'] || '').trim(),
      considerations: String(row['Key Considerations'] || '').trim(),
      pattern: String(rea.Recommended_Pattern || '').trim(),
      patternZh: toPatternZh(rea.Recommended_Pattern),
      colorMood: String(rea['Color_Mood'] || '').trim(),
      typographyMood: mood,
      keyEffects: String(rea['Key_Effects'] || '').trim(),
      rules,
      antiPatterns: String(rea.Anti_Patterns || '').trim(),
      severity: String(rea.Severity || '').trim(),
      reasoningText: String(rea.Reasoning || '').trim(),
      confidence: String(rea.Confidence || '').trim(),
      paletteKey: palette?.key || null,
      fontMatches: scored.slice(0, 3).map((s) => ({ name: s.pairing.name, key: s.pairing.key, score: s.score })),
    };
  });

  return { recipes, landingHit };
}

/** ---------- 汇总 ---------- */
export function loadAtlas() {
  const index = read('data/index.json');
  const meta = read('data/meta.json');
  let fontManifest = null;
  try {
    fontManifest = read('assets/atlas-fonts/manifest.json');
  } catch {
    fontManifest = { families: [], failures: [] };
  }

  const styles = index.domains.style;
  const styleIndex = buildStyleIndex(styles);
  const palettes = buildPalettes(index.domains.color);
  const pairings = buildPairings(index.domains.typography, fontManifest);
  const charts = buildCharts(index.domains.chart);
  const landings = buildLandings(index.domains.landing);
  const practices = buildPractices({
    ux: index.domains.ux,
    react: index.domains.react,
    web: index.domains.web,
  });

  const paletteByType = new Map(palettes.map((p) => [p.productType, p]));
  const { recipes, landingHit } = buildRecipes({
    productRows: index.domains.product,
    reasoningRows: index.reasoning,
    paletteByType,
    pairings,
    styleIndex,
    landingRows: landings,
  });

  const styleById = new Map(styles.map((s) => [s['Style ID'], s]));
  const styleMeta = styles.map((s) => ({
    id: s['Style ID'],
    name: s['Style Category'],
    zh: STYLE_ZH.get(s['Style ID']) || '',
    type: s.Type,
    status: s.Status,
    complexity: s.Complexity,
    preferred: s['Preferred Mode'],
  }));

  const stats = {
    palettes: palettes.length,
    pairings: pairings.length,
    recipes: recipes.length,
    charts: charts.length,
    landings: landings.length,
    practices: practices.length,
    styles: styles.length,
    fontsOffline: pairings.filter((p) => p.offline).length,
    fontFiles: (fontManifest.families || []).reduce((a, f) => a + (f.files?.length || 0), 0),
    fontFamilies: (fontManifest.families || []).length,
    fontBytes: (fontManifest.families || []).reduce((a, f) => a + f.files.reduce((x, y) => x + y.bytes, 0), 0),
    darkPalettes: palettes.filter((p) => p.mode === 'dark').length,
    contrastClean: palettes.filter((p) => p.smallFails === 0).length,
    landingLinked: landingHit,
    styleRefs: recipes.reduce((a, r) => a + r.stylePrimary.length + r.styleSecondary.length, 0),
    styleRefsResolved: recipes.reduce(
      (a, r) => a + [...r.stylePrimary, ...r.styleSecondary].filter((s) => s.id).length,
      0,
    ),
    fontMatched: recipes.filter((r) => r.fontMatches.length).length,
    practicesBySeverity: practices.reduce((a, p) => {
      a[p.severityZh] = (a[p.severityZh] || 0) + 1;
      return a;
    }, {}),
  };

  return {
    meta,
    counts: index.counts,
    styles: styleMeta,
    styleById,
    palettes,
    pairings,
    recipes,
    charts,
    landings,
    practices,
    stats,
    paletteByType,
    fontManifest,
  };
}
