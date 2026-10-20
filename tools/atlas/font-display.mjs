/**
 * 字体样张的展示层微调（不改数据、不改正文排版）。
 *
 * 91 个字族里有一批「按 34px / 字距 -0.02em / 字重 600」渲染会出问题的字体：
 *   · 展示体（Press Start 2P、Syncopate、Lexend Mega）字幅极宽，英文长句在窄屏会断成碎词
 *   · 手写体（Great Vibes、Caveat）x-height 小、有长升部，正文字号看着偏小、行距偏紧
 *   · 等宽体（JetBrains Mono、Space Mono）自带字距，再收 -0.02em 会挤在一起
 *   · 只有 400 一档的字族（Anton、Bebas Neue…）被强行 600 会触发合成粗体，笔画发糊
 *
 * 所以这里按字族给三个数：字号系数 k、字距 ls、行高系数 lh；字重由实际下载到的
 * 字重档位决定（见 pickWeight），回退栈按字体类别给，而不是一律用 serif。
 */

/** 字族 slug → 样张微调。没列出的用全局默认（k:1 / ls:-.02em / lh:1）。 */
export const FONT_TRIM = {
  // 极宽展示体：压字号，避免长句在 320px 屏上被 overflow-wrap 切成碎词
  'press-start-2p': { k: 0.62, ls: '0.02em', lh: 1.45 },
  syncopate: { k: 0.72, ls: '0.02em' },
  'lexend-mega': { k: 0.75, ls: '-0.01em' },
  orbitron: { k: 0.78, ls: '0.01em' },
  'russo-one': { k: 0.82, ls: '0.01em' },
  righteous: { k: 0.88 },
  'poiret-one': { k: 0.9, ls: '0.03em' },
  cinzel: { k: 0.85, ls: '0.02em' },
  'playfair-display-sc': { k: 0.9 },
  // 窄体 / 全大写：略放大，字距回正
  'bebas-neue': { k: 0.98, ls: '0.03em' },
  anton: { k: 0.9, ls: '0.01em' },
  'amatic-sc': { k: 0.95, ls: '0.04em', lh: 1.1 },
  'barlow-condensed': { k: 1.05 },
  // 手写 / 花体：x-height 小、升部夸张，放大并放松行距
  'great-vibes': { k: 1.18, ls: '0', lh: 1.26 },
  caveat: { k: 1.25, ls: '0', lh: 1.18 },
  kalam: { k: 1.1, ls: '0', lh: 1.15 },
  'patrick-hand': { k: 1.12, ls: '0', lh: 1.15 },
  // 等宽：自带字距，不要再收
  'jetbrains-mono': { k: 0.82, ls: '0' },
  'space-mono': { k: 0.85, ls: '0' },
  'fira-code': { k: 0.85, ls: '0' },
  'share-tech-mono': { k: 0.9, ls: '0' },
  vt323: { k: 1.15, ls: '0', lh: 1.1 },
  // 细衬线：在 34px 下显得轻，稍微放大
  cormorant: { k: 1.05 },
  'cormorant-garamond': { k: 1.06 },
  'eb-garamond': { k: 1.03 },
  newsreader: { k: 1.02 },
  // 展示衬线：字面大，收一点
  'abril-fatface': { k: 0.95 },
  calistoga: { k: 0.9 },
  'libre-bodoni': { k: 0.95 },
  'bodoni-moda': { k: 0.95 },
  // 圆润 / 科技展示
  fredoka: { k: 0.95 },
  'baloo-2': { k: 0.95 },
  syne: { k: 0.9 },
  'noto-naskh-arabic': { k: 0.95 },
};

const slug = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const fontTrim = (family) => FONT_TRIM[slug(family)] || {};

/** 回退栈按类别给：标题字体加载失败时，不该统一落到 serif */
const FALLBACK = {
  Serif: "Georgia,'Times New Roman','Songti SC',SimSun,serif",
  'Sans Serif': "system-ui,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif",
  Monospace: "ui-monospace,Menlo,Consolas,'Courier New',monospace",
  Display: "'Segoe UI',system-ui,'PingFang SC',sans-serif",
  Handwriting: "'Segoe Print','Bradley Hand','Kaiti SC',cursive",
};
export const fontFallback = (category) => FALLBACK[category] || FALLBACK['Sans Serif'];

/** 只有 400 一档的字族不要硬上 600（会合成粗体） */
export const pickWeight = (family, weightsByFamily) => {
  const list = weightsByFamily.get(String(family).toLowerCase()) || [];
  return list.includes(700) ? 700 : 400;
};

/**
 * 多语种配对：这些 Noto 字族是给日 / 韩 / 繁 / 阿 / 泰 / 希伯来排印准备的，
 * 而站点只内置 latin 子集，所以样张里看到的是它们的拉丁字形。
 * 卡片上不解释，展开时给一句说明，避免读者以为「这就是日文排印」。
 */
const MULTI_SCRIPT = /^Noto (Serif|Sans|Naskh) (JP|KR|TC|SC|Arabic|Thai|Hebrew)$/i;
export const isMultiScript = (family) => MULTI_SCRIPT.test(String(family));

/** 组合类型的中文短标签：原始分类名最长 40 字符，做标签会撑满一行 */
const PAIR_CAT = {
  'display + mono': '展示体 + 等宽',
  'display + sans': '展示体 + 无衬线',
  'display + serif': '展示体 + 衬线',
  'display rounded + geometric sans': '圆润展示 + 几何无衬线',
  'display serif + sans + mono': '展示衬线 + 无衬线 + 等宽',
  'geometric sans (bold-only)': '几何无衬线 · 仅粗体',
  'geometric sans (single dominant)': '几何无衬线 · 单一主字体',
  'geometric sans (single family)': '几何无衬线 · 同族',
  'geometric sans (system fallback)': '几何无衬线 · 系统回退',
  'geometric sans + sans + mono (triple)': '几何无衬线 + 无衬线 + 等宽',
  'geometric sans + single weight': '几何无衬线 · 单字重',
  'handwritten + handwritten (dual)': '手写体 ×2',
  'mono + mono (single family)': '等宽 · 同族',
  'mono + mono': '等宽 + 等宽',
  'mono + sans': '等宽 + 无衬线',
  'sans (system default)': '无衬线 · 系统默认',
  'sans + mono': '无衬线 + 等宽',
  'sans + sans': '无衬线 + 无衬线',
  'sans + serif (display) + mono': '无衬线 + 展示衬线 + 等宽',
  'script + sans': '花体 + 无衬线',
  'script + serif': '花体 + 衬线',
  'serif + book serif + engraved (triple stack)': '衬线 + 书籍衬线 + 刻字体',
  'serif + sans': '衬线 + 无衬线',
  'serif + serif': '衬线 + 衬线',
  'serif + serif + mono (triple stack)': '衬线 + 衬线 + 等宽',
  'tech display + mono': '科技展示 + 等宽',
};

export const pairCatZh = (category) => PAIR_CAT[String(category || '').toLowerCase()] || category || '其他';
