/**
 * 页面渲染。所有函数返回完整 HTML 字符串。
 */
import {
  esc,
  escCode,
  pageShell,
  sideBlock,
  sideAnchors,
  chips,
  toolbar,
  pageHead,
  statStrip,
  emptyState,
  showcaseUrl,
} from './layout.mjs';
import { RULE_KEYS, RULE_TYPES } from './zh.mjs';
import { introCss, introHead, introMarkup } from '../intro.mjs';
import { GALLERY, HANDBOOK, OTHER_VIEW, GALLERY_LINE } from '../site-names.mjs';

const MODE_ZH = { light: '浅色', dark: '深色' };
const RISK_ZH = { low: '低', medium: '中', high: '高', conditional: '视情况', none: '无' };
const SEV_ZH = { HIGH: '高', MEDIUM: '中', LOW: '低' };
const KIND_ZH = {
  hero: '首屏',
  nav: '导航',
  footer: '页脚',
  pricing: '定价',
  faq: '问答',
  social: '口碑',
  cta: '转化',
  form: '表单',
  feature: '特性',
  other: '内容',
};

const CHART_NOTES = {
  'Trend Over Time': '有时间轴就看趋势；点太少改用统计卡，线超过 6 条就换面积图或做降采样。',
  'Compare Categories': '比大小用柱状；类别超过 15 个横过来，20–50 个改用条形表格。',
  'Part-to-Whole': '看占比用饼或环；切片超过 5 片、或需要精确比较，就换堆叠条。',
  'Correlation / Distribution': '看两个连续变量的关系用散点；点少于 20 个说明不了分布。',
  'Heatmap / Intensity': '二维密度用热力；格子少于 20 个不如直接标数字。',
  'Geographic Data': '有地理位置才用地图；区域面积悬殊会让读图失真。',
  'Funnel / Flow': '转化漏斗看逐级流失；阶段超过 6 级会失去可读性。',
  'Performance vs Target': '实际值对目标值用子弹图；一个指标一条，不要叠在一起。',
  'Time-Series Forecast': '预测线要带置信区间，别画一根光秃秃的延长线。',
  'Anomaly Detection': '异常点要高亮并给出基线，否则读者不知道「正常」长什么样。',
  'Hierarchical / Nested Data': '嵌套占比用矩形树图；层级超过 3 层就该拆开看。',
  'Flow / Process Data': '看流向与分流用桑基图；节点超过 12 个会变成一团线。',
  'Cumulative Changes': '累计增减用瀑布图，能看出每一步对总量的贡献。',
  'Multi-Variable Comparison': '多维比较用雷达图；超过 8 个维度就失去区分度。',
  'Stock / Trading OHLC': '开高低收用 K 线；必须配成交量，否则看不出力度。',
  'Relationship / Connection Data': '关系网络用节点图；超过 50 个节点要做聚类或筛选。',
  'Distribution / Statistical': '看分布形态用箱线图；样本少于 20 个不足以画箱。',
  'Performance vs Target (Compact)': '空间紧张时用紧凑版子弹图，一行一个指标。',
  'Proportional / Percentage': '百分比用华夫图，比饼图更容易比较大小。',
  'Hierarchical Proportional': '层级占比用旭日图；超过 3 环就看不清了。',
  'Root Cause Analysis': '归因拆解用分解树，逐层下钻到可行动的粒度。',
  '3D Spatial Data': '三维数据才用 3D；平面屏幕上容易误读深度。',
  'Real-Time Streaming': '实时流用流式面积图，只保留最近窗口，旧数据聚合。',
  'Sentiment / Emotion': '情绪分布用带情感着色的词云；只做概览，不做精确比较。',
  'Process Mining': '流程挖掘用过程图，标出瓶颈与回流的边。',
};

const nf = (n) => Number(n).toLocaleString('en-US');

const navCounts = (a) => ({
  palettes: a.stats.palettes,
  pairings: a.stats.pairings,
  charts: a.stats.charts,
  landings: a.stats.landings,
  practices: a.stats.practices,
  recipes: a.stats.recipes,
});
const shell = (a, o) => pageShell({ ...o, counts: navCounts(a) });

/* ---------------------------------------------------------------- 首页 */
export function indexPage(a) {
  const s = a.stats;
  const entry = (href, no, title, count, desc) => `<a class="entry-a" href="${href}">
  <span class="entry-n">${no}</span>
  <span class="entry-t">${esc(title)}<span>${count}</span></span>
  <span class="entry-d">${desc}</span>
</a>`;

  const body = `
<section class="hero-b" data-rise>
  <p class="hero-k">六个域 · 同一份数据源</p>
  <h1 class="hero-t">图鉴讲「<em>长什么样</em>」，<br>这里讲「<em>怎么定</em>」。</h1>
  <p class="hero-l">4319 行设计知识库的另一半：配色、字体、图表、落地页、规范、配方，互相引用。</p>
  <div class="hero-a">
    <a class="btn" href="./compose.html">打开配方生成器</a>
    <a class="btn btn--ghost" href="./palettes.html">浏览 ${s.palettes} 套配色</a>
  </div>
</section>

${statStrip(
  [
    { label: '配色方案', value: `${s.palettes}` },
    { label: '字体配对', value: `${s.pairings}` },
    { label: '产品配方', value: `${s.recipes}` },
    { label: '图表选型', value: `${s.charts}` },
    { label: '落地页模式', value: `${s.landings}` },
    { label: '交互规范', value: `${s.practices}` },
  ],
  '1',
)}

<a class="xbar" href="${showcaseUrl('index.html')}" data-xnav="${GALLERY.name}" data-rise="2">
  <span class="xbar-k">${OTHER_VIEW} · ${GALLERY.name}</span>
  <span class="xbar-t">${GALLERY_LINE}：${s.styles} 种风格，全部真实渲染</span>
  <span class="xbar-go">去看看<span aria-hidden="true">→</span></span>
</a>

<section class="sect">
  <div class="sect-h"><h2>六个域</h2><a href="./about.html">字段说明</a></div>
  <div class="entry">
    ${entry('./palettes.html', '01', '语义配色库', s.palettes, '16 个语义令牌，渲染成真实界面')}
    ${entry('./pairings.html', '02', '字体配对', s.pairings, `${s.fontFamilies} 个字族本地化，成对展示真实排印`)}
    ${entry('./charts.html', '03', '图表选型', s.charts, '按数据类型反查该用什么图')}
    ${entry('./landing.html', '04', '落地页模式', s.landings, '分区顺序画成线框，标出 CTA')}
    ${entry('./practices.html', '05', '交互与工程规范', s.practices, 'UX / React / Web 三表合并，代码左右对照')}
    ${entry('./recipes.html', '06', '产品配方', s.recipes, '一个类型，一份完整决策记录')}
  </div>
</section>

<section class="sect">
  <div class="sect-h"><h2>两条路径</h2></div>
  <div class="split">
    <div class="mini">
      <h3>已知产品</h3>
      <p>用<a href="./compose.html">配方生成器</a>：选类型 → 拿配方 → 复制令牌。</p>
    </div>
    <div class="mini">
      <h3>只缺一块</h3>
      <p>去<a href="./palettes.html">配色库</a>、<a href="./pairings.html">字体配对</a>或<a href="./charts.html">图表选型</a>，各域可单独使用。</p>
    </div>
  </div>
</section>

<p class="factbar"><span>三表同名同序</span><span>${s.styleRefs} 处风格引用全部可解析</span><span>落地页 ${Math.round((s.landingLinked / s.recipes) * 100)}% 可映射</span><a href="./about.html#lineage">溯源</a></p>
`;

  return shell(a, {
    title: '设计手册 · 配色 / 字体 / 图表 / 落地页 / 规范 / 配方',
    desc: 'dsh-ui-ux-pro-max 的设计手册站点：192 套语义配色、74 组字体配对、25 类图表选型、34 种落地页结构、195 条交互规范与 192 份产品配方。',
    active: 'index',
    pageClass: 'page-index',
    body,
    intro: {
      head: `${introCss()}${introHead()}`,
      body: introMarkup({
        eyebrow: `${HANDBOOK.en} · 6 domains`,
        meta: `${s.palettes} 套配色 · ${s.pairings} 组字体 · ${s.charts} 类图表 · ${s.recipes} 份配方`,
      }),
    },
  });
}

/* ------------------------------------------------------------ 配色库 */
function swatches(pal) {
  const order = [
    'primary',
    'onPrimary',
    'secondary',
    'onSecondary',
    'accent',
    'onAccent',
    'background',
    'foreground',
    'card',
    'cardForeground',
    'muted',
    'mutedForeground',
    'border',
    'destructive',
    'onDestructive',
    'ring',
  ];
  return order
    .map((k) => {
      const v = pal.tokens[k];
      const label = pal.css[k] || v;
      return `<button type="button" class="sw-b" style="background:${esc(pal.css[k] || v)}" data-hex="${esc(label)}" data-token="${esc(k)}" title="${esc(k)} · ${esc(label)}" aria-label="复制 ${esc(k)} ${esc(label)}"></button>`;
    })
    .join('');
}

function palCard(pal) {
  const minRatio = Math.min(...pal.checks.map((c) => c.ratio));
  const fails = pal.checks.filter((c) => c.ratio < 4.5).length;
  const vars = [
    ['background', '--c-background'],
    ['foreground', '--c-foreground'],
    ['card', '--c-card'],
    ['cardForeground', '--c-card-foreground'],
    ['primary', '--c-primary'],
    ['onPrimary', '--c-on-primary'],
    ['secondary', '--c-secondary'],
    ['onSecondary', '--c-on-secondary'],
    ['accent', '--c-accent'],
    ['onAccent', '--c-on-accent'],
    ['muted', '--c-muted'],
    ['mutedForeground', '--c-muted-foreground'],
    ['border', '--c-border'],
    ['destructive', '--c-destructive'],
    ['onDestructive', '--c-on-destructive'],
    ['ring', '--c-ring'],
  ]
    .map(([k, name]) => `${name}:${pal.css[k]}`)
    .join(';');

  const contrastTag =
    fails === 0
      ? `<span class="ratio">最低 ${minRatio}:1 · 全部达 AA</span>`
      : `<span class="ratio" style="color:var(--bad)">最低 ${minRatio}:1 · ${fails} 项未达 AA</span>`;

  return `<article class="pal" data-item data-key="${esc(pal.key)}" data-mode="${pal.mode}" data-hue="${esc(pal.hueName)}"
  data-search="${esc(`${pal.productType} ${pal.notes} ${pal.hueName} ${MODE_ZH[pal.mode]}`.toLowerCase())}"
  data-sort-name="${esc(pal.productType.toLowerCase())}" data-sort-ratio="${pal.contrastScore.toFixed(2)}" data-sort-hue="${pal.hue}">
  <div class="pal-h">
    <h2 class="pal-t">${esc(pal.productType)}</h2>
    <div class="tags">
      <span class="tag ${pal.mode === 'dark' ? 'tag--dark' : ''}">${MODE_ZH[pal.mode]}</span>
      <span class="tag">${esc(pal.hueName)} ${pal.hue}°</span>
    </div>
  </div>
  <div class="uiz" style="${vars}">
    <div class="uiz-row">
      <button type="button" class="uiz-btn uiz-btn--p" tabindex="-1">主操作</button>
      <button type="button" class="uiz-btn uiz-btn--s" tabindex="-1">次操作</button>
      <button type="button" class="uiz-btn uiz-btn--d" tabindex="-1">删除</button>
    </div>
    <div class="uiz-input"><span>输入邮箱…</span><span class="uiz-ring" title="焦点环"></span></div>
    <div class="uiz-card"><b>本月用量</b><span>较上月增长 12.4%，仍在配额之内。</span></div>
    <div class="uiz-tags"><span class="uiz-tag">已启用</span><span class="uiz-tag uiz-tag--a">推荐</span><span class="uiz-tag">草稿</span></div>
  </div>
  <div class="sw">${swatches(pal)}</div>
  <div class="pal-f">
    ${contrastTag}
    <span class="sp"></span>
    <button type="button" class="pal-more" data-more aria-expanded="false" aria-controls="d-${esc(pal.key)}">令牌与导出</button>
  </div>
  <div class="pal-d" id="d-${esc(pal.key)}" data-detail hidden></div>
</article>`;
}

export function palettesPage(a) {
  const hues = [...new Set(a.palettes.map((p) => p.hueName))];
  const side = `${sideBlock(
    '明暗',
    chips('mode', [
      { value: 'light', label: '浅色', count: a.palettes.filter((p) => p.mode === 'light').length },
      { value: 'dark', label: '深色', count: a.palettes.filter((p) => p.mode === 'dark').length },
    ]),
  )}
${sideBlock('主色相', chips('hue', hues.map((h) => ({ value: h, label: h, count: a.palettes.filter((p) => p.hueName === h).length }))))}
${sideBlock(
  '说明',
  `<p class="side-note">点色块复制 HEX；展开可拿 CSS / Tailwind / JSON。</p>
  <p class="side-note">${a.stats.contrastClean}/${a.stats.palettes} 套的 7 组核心对比度达 WCAG AA。</p>`,
)}`;

  const body = `${pageHead({
    kicker: '语义配色',
    title: '配色库',
    lead: `按产品类型组织的 <strong>${a.palettes.length} 套</strong>配色。每套 16 个语义令牌，并渲染成真实界面小样。`,
    meta: `<span>${a.palettes.length} 套</span><span>${a.stats.darkPalettes} 套深色</span><span>16 令牌</span><span>7 组对比度校验</span>`,
  })}
${toolbar({
  placeholder: '搜索产品类型、备注、色相…',
  sort: [
    { value: 'name', label: '名称' },
    { value: 'ratio', label: '对比度' },
    { value: 'hue', label: '色相' },
  ],
})}
<div class="pal-grid" data-list>${a.palettes.map(palCard).join('')}</div>
${emptyState('没有匹配的配色。试试清空搜索或切换筛选。')}
<script type="application/json" id="pal-data">${JSON.stringify(
    a.palettes.map((p) => ({
      key: p.key,
      tokens: p.tokens,
      css: p.css,
      checks: p.checks,
      notes: p.notes,
      mode: p.mode,
      hue: p.hue,
      hueName: p.hueName,
      saturation: p.saturation,
    })),
  ).replace(/</g, '\\u003c')}</script>`;

  return shell(a, {
    title: `配色库 · ${a.palettes.length} 套语义配色 · 设计手册`,
    desc: `192 套按产品类型组织的语义配色，含 16 个语义令牌、真实界面小样与 WCAG 对比度校验，可导出 CSS / Tailwind / JSON。`,
    active: 'palettes',
    side,
    body,
    pageClass: 'page-palettes',
  });
}

/* ------------------------------------------------------------ 字体 */
const SPECIMENS = [
  {
    spec: 'Design is how it works',
    body: 'A good pairing sets the hierarchy: the heading carries voice, the body carries the reading.',
  },
  {
    spec: 'Form follows feeling',
    body: 'Two families, one rhythm. Contrast comes from weight and width, not from decoration.',
  },
  {
    spec: 'Read, then remember',
    body: 'Set the body at a comfortable measure, then let the heading carry the tone.',
  },
];

function pairCard(p, i) {
  const sp = SPECIMENS[i % SPECIMENS.length];
  // 样张变量：字体栈、字重、字号 / 字距 / 行高系数都按字族给（见 font-display.mjs）
  const vars = [
    `--f-head:'${p.heading}',${p.headFallback}`,
    `--f-body:'${p.body}',${p.bodyFallback}`,
    `--fw-head:${p.headWeight || 700}`,
    `--f-k:${p.headTrim?.k ?? 1}`,
    p.headTrim?.ls ? `--f-ls:${p.headTrim.ls}` : '',
    p.headTrim?.lh ? `--f-lh:${p.headTrim.lh}` : '',
    p.bodyTrim?.k ? `--f-bk:${p.bodyTrim.k}` : '',
    p.bodyTrim?.lh ? `--f-blh:${p.bodyTrim.lh}` : '',
  ]
    .filter(Boolean)
    .join(';');
  return `<article class="pair" data-item data-cat="${esc(p.catZh)}" style="${esc(vars)}"
  data-search="${esc(`${p.name} ${p.category} ${p.catZh} ${p.heading} ${p.body} ${p.keywords.join(' ')} ${p.bestFor}`.toLowerCase())}"
  data-sort-name="${esc(p.name.toLowerCase())}" data-sort-pop="${p.headPopularity || 9999}">
  <div class="pair-h">
    <span class="pair-n">${esc(p.name)}</span>
    <div class="sp">
      <span class="tag">${esc(p.catZh)}</span>
      ${p.multiScript ? '<span class="tag tag--acc" title="该配对面向日 / 韩 / 阿拉伯等文种；本站只内置 latin 子集">多语种</span>' : ''}
      <span class="tag tag--ok">离线可用</span>
    </div>
  </div>
  <div class="pair-b">
    <p class="pair-spec">${esc(sp.spec)}</p>
    <p class="pair-body">${esc(sp.body)}</p>
  </div>
  <div class="pair-f">
    <span>标题 <code>${esc(p.heading)}</code></span>
    <span>正文 <code>${esc(p.body)}</code></span>
  </div>
  <button type="button" class="pair-x" data-more aria-expanded="false" aria-controls="pd-${esc(p.key)}">细节与用法</button>
  <div class="pair-d" id="pd-${esc(p.key)}" hidden>
    <dl class="kv">
      <dt>适配</dt><dd>${esc(p.bestFor)}</dd>
      <dt>气质</dt><dd>${p.keywords.slice(0, 10).map(esc).join(' · ')}</dd>
      <dt>标题字体</dt><dd>${esc(p.heading)}${p.headCategory ? ` · ${esc(p.headCategory)}` : ''}${p.headDesigner ? ` · ${esc(p.headDesigner)}` : ''}</dd>
      <dt>正文字体</dt><dd>${esc(p.body)}${p.bodyCategory ? ` · ${esc(p.bodyCategory)}` : ''}${p.bodyDesigner ? ` · ${esc(p.bodyDesigner)}` : ''}</dd>
      ${p.notes ? `<dt>备注</dt><dd>${esc(p.notes)}</dd>` : ''}
      ${p.multiScript ? '<dt>说明</dt><dd>该配对面向日 / 韩 / 阿拉伯等文种排印；本站只内置 latin 子集，样张展示的是拉丁字形。</dd>' : ''}
      <dt>CSS</dt><dd><code>${esc(p.importCss || '—')}</code></dd>
      ${p.tailwind ? `<dt>Tailwind</dt><dd><code>${esc(p.tailwind)}</code></dd>` : ''}
    </dl>
  </div>
</article>`;
}

export function pairingsPage(a) {
  const cats = [...new Set(a.pairings.map((p) => p.catZh))];
  const side = `${sideBlock(
    '组合类型',
    chips(
      'cat',
      cats
        .map((c) => ({
          value: c,
          label: c,
          count: a.pairings.filter((p) => p.catZh === c).length,
        }))
        .sort((x, y) => y.count - x.count),
    ),
  )}
${sideBlock(
  '说明',
  `<p class="side-note">样张里的英文用配对字体渲染，中文走系统字体——这些是拉丁字体。</p>
  <p class="side-note">${a.stats.fontsOffline}/${a.stats.pairings} 对已本地化，零外部请求。</p>`,
)}`;

  const body = `${pageHead({
    kicker: '排印',
    title: '字体配对',
    lead: `<strong>${a.pairings.length} 组</strong>标题与正文的搭配，用真实字体渲染。拖动控件可同时改变所有样张的字号与行高。`,
    meta: `<span>${a.pairings.length} 组</span><span>${a.stats.fontFamilies} 个字族</span><span>${(a.stats.fontBytes / 1024 / 1024).toFixed(2)} MB 本地字体</span><span>零外部请求</span>`,
  })}
<div class="ctl">
  <label class="ctl-l">字号 <input type="range" min="0.8" max="1.4" step="0.05" value="1" data-typo="fs"></label>
  <output class="ctl-o" data-out="fs">100%</output>
  <label class="ctl-l">行高 <input type="range" min="0.9" max="1.4" step="0.05" value="1" data-typo="lh"></label>
  <output class="ctl-o" data-out="lh">100%</output>
  <span class="ctl-note">只影响本页样张</span>
</div>
${toolbar({
  placeholder: '搜索配对名、字体、气质关键词…',
  sort: [
    { value: 'name', label: '名称' },
    { value: 'pop', label: '流行度' },
  ],
})}
<div class="pair-grid" data-list>${a.pairings.map(pairCard).join('')}</div>
${emptyState('没有匹配的配对。')}`;

  return shell(a, {
    title: `字体配对 · ${a.pairings.length} 组真实渲染 · 设计手册`,
    desc: '74 组标题与正文的字体搭配，全部字体的 latin 子集已本地化，离线可看真实排印效果，可调字号与行高。',
    active: 'pairings',
    side,
    body,
    pageClass: 'page-pairings',
  });
}

/* ------------------------------------------------------------ 图表 */
function chartCard(c) {
  const riskZh = RISK_ZH[c.risk] || c.risk;
  const note = CHART_NOTES[c.dataType];
  return `<article class="ch" data-item data-search="${esc(`${c.dataType} ${c.best} ${c.secondary} ${c.whenUse} ${c.keywords}`.toLowerCase())}">
  <div class="ch-h">
    <h2 class="ch-t">${esc(c.dataType)}</h2>
    ${c.risk ? `<span class="tag ${/high/.test(c.risk) ? 'tag--bad' : /low/.test(c.risk) ? 'tag--ok' : 'tag--warn'}">风险 ${esc(riskZh)}</span>` : ''}
  </div>
  <div class="ch-fig">${c.svg}</div>
  <p class="ch-best">${esc(c.best)}</p>
  <p class="ch-sec">备选：${esc(c.secondary)}</p>
  ${note ? `<p class="ch-note">${esc(note)}</p>` : ''}
  <p class="ch-txt"><b>用：</b>${esc(c.whenUse)}</p>
  <p class="ch-txt ch-bad"><b>不用：</b>${esc(c.whenNot)}</p>
  <p class="ch-txt"><b>量级：</b>${esc(c.volume)}</p>
  <div class="ch-foot">
    ${c.interactive ? `<span class="tag">交互 ${esc(c.interactive)}</span>` : ''}
    ${c.library ? `<span class="tag">${esc(c.library.split(',')[0])}</span>` : ''}
  </div>
</article>`;
}

export function chartsPage(a) {
  const side = `${sideBlock(
    '按无障碍风险',
    chips('risk', [
      { value: 'low', label: '低', count: a.charts.filter((c) => /low/.test(c.risk)).length },
      { value: 'medium', label: '中', count: a.charts.filter((c) => /medium/.test(c.risk)).length },
      { value: 'high', label: '高', count: a.charts.filter((c) => /high/.test(c.risk)).length },
    ]),
  )}
${sideBlock(
  '说明',
  `<p class="side-note">按「数据长什么样」反查图表；示意图只表形态，不是真实数据。</p>`,
)}`;

  const body = `${pageHead({
    kicker: '数据可视化',
    title: '图表选型',
    lead: `<strong>${a.charts.length} 类</strong>数据类型：最佳图表、备选、使用条件、量级阈值与无障碍风险。`,
    meta: `<span>${a.charts.length} 类数据</span><span>25 张示意</span><span>含量级阈值</span><span>字段原文为英文</span>`,
  })}
${toolbar({ placeholder: '搜索数据类型、图表名、使用条件…' })}
<div class="ch-grid" data-list>${a.charts.map(chartCard).join('')}</div>
${emptyState('没有匹配的图表类型。')}`;

  return shell(a, {
    title: `图表选型 · ${a.charts.length} 类数据类型 · 设计手册`,
    desc: '25 类数据类型的图表选型指南：最佳图表、备选、使用条件、数据量阈值、无障碍风险与降级方案。',
    active: 'charts',
    side,
    body,
    pageClass: 'page-charts',
  });
}

/* ------------------------------------------------------------ 落地页 */
function wireframe(l) {
  return `<div class="wire-in">${l.sections
    .map(
      (s) =>
        `<div class="wire-s wire-s--${s.kind}" style="height:${Math.round(s.h * 0.62)}px" title="${esc(s.label)}"><span>${esc(s.label)}</span><em>${esc(KIND_ZH[s.kind] || '')}</em></div>`,
    )
    .join('')}</div>`;
}

function landingCard(l) {
  return `<article class="ld" data-item id="${esc(l.key)}" data-search="${esc(`${l.zh} ${l.name} ${l.keywords} ${l.order} ${l.ctaPlacement} ${l.conversion}`.toLowerCase())}">
  <div class="ld-h">
    <h2 class="ld-t">${esc(l.zh || l.name)}${l.zh ? `<small class="rec-en">${esc(l.name)}</small>` : ''}</h2>
    <span class="tag">${l.sections.length} 区</span>
  </div>
  <div class="wire">${wireframe(l)}</div>
  <div class="ld-b">
    <p class="ld-i"><b>分区顺序</b>${esc(l.order)}</p>
    <p class="ld-i"><b>CTA 位置</b>${esc(l.ctaPlacement)}</p>
    <p class="ld-i"><b>配色策略</b>${esc(l.colorStrategy)}</p>
    <p class="ld-i"><b>转化要点</b>${esc(l.conversion)}</p>
  </div>
  <div class="ld-f"><span class="mono">${esc(l.key)}</span><span>${esc(l.effects.split(',')[0] || '')}</span></div>
</article>`;
}

export function landingPage(a) {
  const side = `${sideBlock(
    '区块数',
    chips('sections', [
      { value: '4', label: '4 个区块', count: a.landings.filter((l) => l.sections.length === 4).length },
      { value: '5', label: '5 个区块', count: a.landings.filter((l) => l.sections.length === 5).length },
    ]),
  )}
${sideBlock('模式索引', sideAnchors(a.landings.map((l) => ({ id: l.key, label: l.zh || l.name }))))}
${sideBlock(
  '说明',
  `<p class="side-note">线框高度表示区块占的版面；橙色是 CTA，深色是导航。</p>`,
)}`;

  const body = `${pageHead({
    kicker: '页面结构',
    title: '落地页模式',
    lead: `<strong>${a.landings.length} 种</strong>落地页骨架：分区顺序、CTA 位置、配色策略与转化要点。`,
    meta: `<span>${a.landings.length} 种模式</span><span>${a.landings.reduce((x, l) => x + l.sections.length, 0)} 个区块</span><span>含 CTA 位置</span><span>字段原文为英文</span>`,
  })}
${toolbar({ placeholder: '搜索模式名、分区、转化要点…' })}
<div class="ld-grid" data-list>${a.landings.map(landingCard).join('')}</div>
${emptyState('没有匹配的落地页模式。')}`;

  return shell(a, {
    title: `落地页模式 · ${a.landings.length} 种结构 · 设计手册`,
    desc: '34 种落地页结构：分区顺序线框、CTA 位置、配色策略、推荐效果与转化优化要点。',
    active: 'landing',
    side,
    body,
    pageClass: 'page-landing',
  });
}

/* ------------------------------------------------------------ 规范 */
function practiceCard(p) {
  const sevClass = p.severityRank <= 1 ? 'tag--bad' : p.severityRank <= 3 ? 'tag--warn' : 'tag--ok';
  return `<article class="pr" data-item data-src="${p.source}" data-sev="${esc(p.severity.toLowerCase())}"
  data-search="${esc(`${p.issue} ${p.category} ${p.description} ${p.do} ${p.dont} ${p.good} ${p.bad} ${p.platform}`.toLowerCase())}">
  <div class="pr-h">
    <span class="tag ${sevClass}">${esc(p.severityZh)}</span>
    <h2 class="pr-t">${esc(p.issue)}</h2>
    <span class="tag">${esc(p.sourceLabel)}</span>
    <span class="tag">${esc(p.category)}</span>
    ${p.platform && p.platform !== 'All' ? `<span class="tag">${esc(p.platform)}</span>` : ''}
  </div>
  <div class="pr-b">
    <div class="pr-c pr-c--good">
      <p class="pr-l">应该</p>
      <p class="pr-txt">${esc(p.do)}</p>
      <pre class="code">${escCode(p.good)}</pre>
    </div>
    <div class="pr-c pr-c--bad">
      <p class="pr-l">不要</p>
      <p class="pr-txt">${esc(p.dont)}</p>
      <pre class="code">${escCode(p.bad)}</pre>
    </div>
  </div>
</article>`;
}

export function practicesPage(a) {
  const bySrc = a.practices.reduce((m, p) => ((m[p.source] = (m[p.source] || 0) + 1), m), {});
  const side = `${sideBlock(
    '来源',
    chips('src', [
      { value: 'ux', label: 'UX', count: bySrc.ux || 0 },
      { value: 'react', label: 'React', count: bySrc.react || 0 },
      { value: 'web', label: 'Web', count: bySrc.web || 0 },
    ]),
  )}
${sideBlock(
  '严重度',
  chips('sev', [
    { value: 'critical', label: '致命', count: a.practices.filter((p) => p.severityRank === 0).length },
    { value: 'high', label: '高', count: a.practices.filter((p) => p.severityRank === 1).length },
    { value: 'medium', label: '中', count: a.practices.filter((p) => p.severityRank === 3).length },
    { value: 'low', label: '低', count: a.practices.filter((p) => p.severityRank >= 4).length },
  ]),
)}
${sideBlock(
  '说明',
  `<p class="side-note">列表按严重度从高到低排，可当作上线前的自检清单。</p>`,
)}`;

  const body = `${pageHead({
    kicker: '交互与工程',
    title: '规范对照',
    lead: `<strong>${a.practices.length} 条</strong> UX / React / Web 规范，每条都有正确与错误的代码对照。`,
    meta: `<span>${a.practices.length} 条</span><span>致命 ${a.practices.filter((p) => p.severityRank === 0).length}</span><span>高 ${a.practices.filter((p) => p.severityRank === 1).length}</span><span>代码左右对照</span>`,
  })}
${toolbar({
  placeholder: '搜索问题、说明、代码…',
  sort: [
    { value: 'sev', label: '严重度' },
    { value: 'src', label: '来源' },
  ],
})}
<div class="pr-grid" data-list>${a.practices.map(practiceCard).join('')}</div>
${emptyState('没有匹配的规范。')}`;

  return shell(a, {
    title: `规范对照 · ${a.practices.length} 条 · 设计手册`,
    desc: '195 条 UX / React / Web 交互与工程规范，含正确与错误代码对照，按严重度与平台筛选。',
    active: 'practices',
    side,
    body,
    pageClass: 'page-practices',
  });
}

/* ------------------------------------------------------------ 配方 */
// 风格名优先显示中文，英文原名放 title，点开仍去图鉴看渲染
const styleLabel = (s) => s.zh || s.name;

const styleLink = (s) =>
  s.id
    ? `<a class="slink" href="${esc(showcaseUrl(`style/${s.id}.html`))}" target="_blank" rel="noopener" title="${esc(s.zh ? `${s.name} · 在风格图鉴中查看` : '在风格图鉴（外部站点）中查看')}">${esc(styleLabel(s))}<span aria-hidden="true">↗</span></a>`
    : `<span class="slink slink--dead" title="该风格不在图鉴收录范围内">${esc(styleLabel(s))}</span>`;

const landLink = (l) =>
  l.key
    ? `<a class="slink" href="./landing.html#${esc(l.key)}"${l.zh ? ` title="${esc(l.name)}"` : ''}>${esc(l.zh || l.name)}</a>`
    : `<span class="slink slink--dead">${esc(l.zh || l.name)}</span>`;

/* 决策规则的值：`style:liquid-glass` → 「风格」+ 中文名（可点开图鉴） */
let _styleZh = null;
const styleZhMap = (a) => (_styleZh ||= new Map(a.styles.map((s) => [s.id, s.zh])));

function ruleValueHtml(raw, a) {
  const s = String(raw == null ? '' : raw).trim();
  const i = s.indexOf(':');
  if (i < 0) return esc(s);
  const type = s.slice(0, i);
  const slug = s.slice(i + 1);
  const typeZh = RULE_TYPES[type] || type;
  if (type === 'style') {
    const zh = styleZhMap(a).get(slug);
    return `<span class="rule-t">${esc(typeZh)}</span><a class="slink" href="${esc(
      showcaseUrl(`style/${slug}.html`),
    )}" target="_blank" rel="noopener">${esc(zh || slug)}</a>`;
  }
  const label = type === 'mode' ? (slug === 'dark' ? '深色' : slug === 'light' ? '浅色' : slug) : slug.replace(/-/g, ' ');
  return `<span class="rule-t">${esc(typeZh)}</span>${esc(label)}`;
}

function recipeCard(r, a) {
  const pal = a.paletteByType.get(r.productType);
  const strip = pal
    ? `<div class="rec-strip">${['primary', 'secondary', 'accent', 'background', 'muted', 'card', 'border', 'destructive']
        .map((k) => `<i style="background:${esc(pal.css[k])}"></i>`)
        .join('')}</div>`
    : '';
  const confVal = parseFloat(r.confidence);
  const conf = confVal
    ? `<span class="tag ${confVal >= 0.92 ? 'tag--ok' : 'tag--warn'}">置信度 ${Math.round(confVal * 100)}%</span>`
    : '';
  const sev = r.severity
    ? `<span class="tag ${/high/i.test(r.severity) ? 'tag--bad' : 'tag--warn'}">严重度 ${esc(SEV_ZH[r.severity] || r.severity)}</span>`
    : '';

  const rules = r.rules
    ? Object.entries(r.rules)
        .map(
          ([k, v]) =>
            `<div class="rule-i"><span class="rule-k">${esc(RULE_KEYS[k] || k)}</span><span class="rule-v">${String(v)
              .split(',')
              .map((x) => ruleValueHtml(x.trim(), a))
              .join('<span class="rule-dot">·</span>')}</span></div>`,
        )
        .join('')
    : '<p class="rec-note">该条目没有额外的条件规则。</p>';

  return `<article class="rec" data-item data-key="${esc(r.key)}"
  data-search="${esc(`${r.productZh} ${r.productType} ${r.keywords} ${r.stylePrimary.map((s) => `${s.zh} ${s.name}`).join(' ')} ${r.colorFocus} ${r.considerations}`.toLowerCase())}"
  data-style="${esc(r.stylePrimary[0]?.name || '')}">
  <div class="rec-h">
    <span class="rec-n mono">${String(r.index).padStart(3, '0')}</span>
    <h2 class="rec-t">${esc(r.productZh || r.productType)}${r.productZh ? `<small class="rec-en">${esc(r.productType)}</small>` : ''}</h2>
    ${conf}${sev}
  </div>
  <div class="rec-b">
    <div class="rec-main">
      ${strip}
      <div class="rec-row"><span class="rec-k">主推风格</span><div class="rec-v">${r.stylePrimary.map(styleLink).join('') || '—'}</div></div>
      ${r.styleSecondary.length ? `<div class="rec-row"><span class="rec-k">次选</span><div class="rec-v">${r.styleSecondary.map(styleLink).join('')}</div></div>` : ''}
      <div class="rec-row"><span class="rec-k">落地页</span><div class="rec-v">${
        r.landings.length ? r.landings.map(landLink).join('') : `<span class="slink slink--dead">${esc(r.landingZh || r.landingRaw || '—')}</span>`
      }</div></div>
      <div class="rec-row"><span class="rec-k">推荐模式</span><div class="rec-v">${esc(r.patternZh || r.pattern || '—')}</div></div>
      <div class="rec-row"><span class="rec-k">字体</span><div class="rec-v">${
        r.fontMatches.length
          ? r.fontMatches.map((f) => `<a class="slink" href="./pairings.html">${esc(f.name)}</a>`).join('')
          : '<span class="rec-note">未匹配到字体配对</span>'
      }</div></div>
      ${r.paletteKey ? `<div class="rec-row"><span class="rec-k">配色</span><div class="rec-v"><a class="slink" href="./palettes.html">${esc(r.productZh || r.productType)} 配色</a><span class="rec-note" style="display:inline;margin-left:6px">${esc(pal?.mode === 'dark' ? '深色' : '浅色')}</span></div></div>` : ''}
      <button type="button" class="rec-x" data-more aria-expanded="false" aria-controls="rd-${esc(r.key)}">决策规则与理由</button>
    </div>
    <aside class="rec-aside">
      ${r.colorFocus ? `<p class="rec-note"><strong>配色方向</strong><span class="en-badge" title="上游原文，未翻译">原文</span><br>${esc(r.colorFocus)}</p>` : ''}
      ${r.antiPatterns ? `<p class="rec-anti"><strong>反模式</strong><span class="en-badge" title="上游原文，未翻译">原文</span><br>${esc(r.antiPatterns)}</p>` : ''}
    </aside>
  </div>
  <div class="rec-d" id="rd-${esc(r.key)}" hidden>
    <dl class="kv">
      ${r.considerations ? `<dt>关键考量</dt><dd>${esc(r.considerations)}</dd>` : ''}
      ${r.colorMood ? `<dt>色彩情绪</dt><dd>${esc(r.colorMood)}</dd>` : ''}
      ${r.typographyMood ? `<dt>字体情绪</dt><dd>${esc(r.typographyMood)}</dd>` : ''}
      ${r.dashboardStyle && !/^N\/A/i.test(r.dashboardStyle) ? `<dt>仪表盘</dt><dd>${esc(r.dashboardZh || r.dashboardStyle)}</dd>` : ''}
      ${r.keyEffects ? `<dt>关键效果</dt><dd>${esc(r.keyEffects)}</dd>` : ''}
      ${r.reasoningText ? `<dt>理由</dt><dd>${esc(r.reasoningText)}</dd>` : ''}
      ${r.landingRaw ? `<dt>原始建议</dt><dd><code>${esc(r.landingRaw)}</code></dd>` : ''}
    </dl>
    <h3 style="font:600 10.5px/1 var(--mono);text-transform:uppercase;letter-spacing:.13em;color:var(--ink-3);margin:14px 0 6px">条件规则</h3>
    <div class="rules">${rules}</div>
  </div>
</article>`;
}

export function recipesPage(a) {
  const styleCount = new Map();
  for (const r of a.recipes) {
    for (const s of r.stylePrimary) {
      const cur = styleCount.get(s.name) || { zh: s.zh || s.name, count: 0 };
      cur.count += 1;
      styleCount.set(s.name, cur);
    }
  }
  const topStyles = [...styleCount.entries()].sort((x, y) => y[1].count - x[1].count).slice(0, 14);

  const side = `${sideBlock(
    '主推风格',
    chips('style', topStyles.slice(0, 10).map(([name, o]) => ({ value: name, label: o.zh, count: o.count }))),
  )}
${sideBlock(
  '说明',
  `<p class="side-note">风格名可跳到图鉴看渲染；落地页链到本手册的结构页。</p>
  <p class="side-note">要按类型直接出配方，用 <a href="./compose.html">生成器</a>。</p>`,
)}`;

  const body = `${pageHead({
    kicker: '决策',
    title: '产品配方',
    lead: `<strong>${a.recipes.length} 类</strong>产品的完整配方：主推与次选风格、落地页、配色、字体与决策规则。`,
    meta: `<span>${a.recipes.length} 类产品</span><span>${a.stats.styleRefs} 处风格引用</span><span>全部可跳转</span><span>含反模式</span>`,
  })}
${toolbar({
  placeholder: '搜索产品类型、风格、配色方向…',
  count: true,
})}
<div class="rec-grid" data-list>${a.recipes.map((r) => recipeCard(r, a)).join('')}</div>
${emptyState('没有匹配的配方。')}`;

  return shell(a, {
    title: `产品配方 · ${a.recipes.length} 类产品 · 设计手册`,
    desc: '192 类产品的完整设计配方：主推与次选风格、落地页结构、配色方向、字体气质、决策规则与反模式。',
    active: 'recipes',
    side,
    body,
    pageClass: 'page-recipes',
  });
}

/* ------------------------------------------------------------ 生成器 */
export function composePage(a) {
  const payload = {
    recipes: a.recipes.map((r) => ({
      k: r.key,
      t: r.productType,
      zh: r.productZh,
      sp: r.stylePrimary,
      ss: r.styleSecondary,
      lp: r.landings,
      lr: r.landingRaw,
      lz: r.landingZh,
      pt: r.pattern,
      pz: r.patternZh,
      cf: r.colorFocus,
      cm: r.colorMood,
      tm: r.typographyMood,
      ke: r.keyEffects,
      ru: r.rules,
      ap: r.antiPatterns,
      sv: r.severity,
      rn: r.reasoningText,
      ci: r.confidence,
      co: r.considerations,
      ds: r.dashboardStyle,
      dz: r.dashboardZh,
      pk: r.paletteKey,
      fm: r.fontMatches.map((f) => f.key),
    })),
    palettes: Object.fromEntries(a.palettes.map((p) => [p.key, { tokens: p.tokens, css: p.css, mode: p.mode }])),
    fonts: Object.fromEntries(a.pairings.map((p) => [p.key, { name: p.name, head: p.heading, body: p.body }])),
    // id → 中文风格名，供决策规则里的 style:xxx 解析
    styles: Object.fromEntries(a.styles.map((s) => [s.id, s.zh || s.name])),
    ruleKeys: RULE_KEYS,
    ruleTypes: RULE_TYPES,
    // 出站到图鉴的前缀：构建时算好，避免脚本里写死 ../style/（会落到站根上 → 404）
    sb: showcaseUrl(''),
  };

  const side = `${sideBlock(
    '怎么用',
    `<p class="side-note">左侧选产品类型，右侧给出完整配方；切换格式即可复制。</p>
    <p class="side-note">风格名可点开看实际渲染，再决定要不要用。</p>`,
  )}`;

  const body = `${pageHead({
    kicker: '配方生成器',
    title: '选一个产品类型',
    lead: `从 <strong>${a.recipes.length} 类</strong>产品里选一个，得到风格、配色、字体、落地页与决策规则，可导出为 CSS / Tailwind / JSON。`,
    meta: `<span>${a.recipes.length} 类产品</span><span>三种导出</span><span>可复制</span>`,
  })}
<div class="cz">
  <div class="cz-pick">
    <label class="search"><span class="search-ico" aria-hidden="true"></span>
      <input type="search" data-cz-search placeholder="搜索产品类型…" autocomplete="off" spellcheck="false">
    </label>
    <div class="cz-list" data-cz-list role="listbox" aria-label="产品类型">${a.recipes
      .map((r) => {
        const zh = r.productZh || r.productType;
        const q = [zh, r.productType, ...r.stylePrimary.map((s) => s.zh || s.name)].join(' ');
        return `<button type="button" class="cz-i" role="option" data-cz-pick="${esc(r.key)}" data-q="${esc(q.toLowerCase())}"><span class="cz-i-zh">${esc(zh)}</span><small>${esc(r.productType)}</small></button>`;
      })
      .join('')}</div>
  </div>
  <div class="cz-out" data-cz-out aria-live="polite">
    <div class="cz-hint">从左侧选一个产品类型。</div>
  </div>
</div>
<script type="application/json" id="cz-data">${JSON.stringify(payload).replace(/</g, '\\u003c')}</script>`;

  return shell(a, {
    title: '配方生成器 · 选产品类型出设计配方 · 设计手册',
    desc: '选一个产品类型，生成包含风格推荐、配色令牌、字体配对、落地页结构、决策规则与反模式的设计配方，支持导出 CSS / Tailwind / JSON。',
    active: 'compose',
    side,
    body,
    pageClass: 'page-compose',
  });
}

/* ------------------------------------------------------------ 关于 */
export function aboutPage(a) {
  const s = a.stats;
  const m = a.meta;
  const body = `${pageHead({
    kicker: '方法与溯源',
    title: '这些数据从哪来',
    lead: '本站不生产建议，只把插件内置的知识库重新组织成可查、可比的样子——加工只有三件事：解析、映射、渲染。',
  })}

<section class="sect">
  <div class="sect-h"><h2>数据规模</h2></div>
  ${statStrip([
    { label: '总行数', value: nf(m.totalRows) },
    { label: '域', value: `${m.domains.length} + ${m.stacks.length} 栈` },
    { label: '本手册用到', value: `${nf(s.palettes + s.pairings + s.charts + s.landings + s.practices + s.recipes)}` },
    { label: '字体文件', value: `${s.fontFiles}<small>${(s.fontBytes / 1024 / 1024).toFixed(2)}MB</small>` },
  ])}
</section>

<section class="sect" id="lineage">
  <div class="sect-h"><h2>溯源</h2></div>
  <dl class="kv" style="max-width:760px">
    <dt>上游仓库</dt><dd><a href="${esc(m.upstream)}">${esc(m.upstream)}</a></dd>
    <dt>上游提交</dt><dd><code>${esc(m.upstreamRef)}</code>（${esc(String(m.upstreamRefDate).slice(0, 10))}）</dd>
    <dt>数据路径</dt><dd><code>${esc(m.upstreamDataPath)}</code></dd>
    <dt>同步时间</dt><dd><code>${esc(m.syncedAt)}</code></dd>
    <dt>血缘核验</dt><dd>${esc(m.lineageVerifiedAt)}</dd>
  </dl>
</section>

<section class="sect">
  <div class="sect-h"><h2>加工了什么</h2></div>
  <div class="split">
    <div class="mini"><h3>配色</h3><p>16 个语义令牌注入 CSS 变量渲染成小样，另算 7 组 WCAG 对比度；<code>rgba()</code> 描边原样保留。</p></div>
    <div class="mini"><h3>字体</h3><p>91 个字族的 latin 子集存到本地，<code>@font-face</code> 引用，所以样张是真实渲染。</p></div>
    <div class="mini"><h3>落地页</h3><p><code>Section Order</code> 按 <code>&gt;</code> 拆成区块，按关键词判定类型，决定线框高度与配色。</p></div>
    <div class="mini"><h3>配方</h3><p>三表按产品类型同名同序对齐；风格名经三级索引解析成图鉴链接。</p></div>
    <div class="mini"><h3>字体推荐</h3><p><strong>启发式</strong>：<code>Typography_Mood</code> 拆词映射到字体标签后打分，只给方向。</p></div>
    <div class="mini"><h3>落地页映射</h3><p><strong>有人工映射</strong>：产品表给概念描述，落地页表给模式名，中间靠一张概念表连接。</p></div>
  </div>
</section>

<section class="sect">
  <div class="sect-h"><h2>已知缺口</h2></div>
  <div class="split">
    <div class="mini"><h3>${a.recipes.length - s.landingLinked} 个产品类型没有落地页对应</h3><p>2 个原文即为 <code>N/A</code>，其余是产品内界面（信息流、席位图、监控面板）——34 种模式里确实没有同类结构，按原文展示，不硬凑。</p></div>
    <div class="mini"><h3>对比度只校验了 7 组核心配对</h3><p>${s.contrastClean}/${s.palettes} 套达标，但不代表任意前后景组合都安全。</p></div>
    <div class="mini"><h3>字体样张是英文</h3><p>91 个字体只有 latin 子集，中文会回退到系统字体——「字体配对」本身讨论的是拉丁排印。</p></div>
  </div>
</section>

<section class="sect">
  <div class="sect-h"><h2>许可</h2></div>
  <p class="lead" style="margin:0">数据来自 <a href="${esc(m.upstream)}">ui-ux-pro-max-skill</a>；字体来自 Google Fonts，按各自许可仅取 latin 子集。本站由 <code>tools/atlas/build.mjs</code> 静态生成到 <code>handbook/</code>，无运行时依赖。</p>
</section>`;

  return shell(a, {
    title: '方法与溯源 · 设计手册',
    desc: '设计手册的数据来源、加工方式、启发式成分与已知缺口说明。',
    active: 'about',
    body,
    pageClass: 'page-about',
  });
}

/* ------------------------------------------------------------ 404 */
export function notFound(a) {
  const body = `<div style="padding:80px 0;max-width:560px">
  <p class="kicker">404</p>
  <h1 class="ph1">这一页不在手册里</h1>
  <p class="lead">链接可能过期，或者条目已经被合并。从下面任意一个域重新进：</p>
  <div class="hero-a" style="margin-top:24px">
    <a class="btn" href="./index.html">回到总览</a>
    <a class="btn btn--ghost" href="./palettes.html">配色库</a>
    <a class="btn btn--ghost" href="./compose.html">配方生成器</a>
  </div>
</div>`;
  return shell(a, {
    title: '404 · 设计手册',
    desc: '页面不存在。',
    active: '404',
    body,
    pageClass: 'page-404',
  });
}
