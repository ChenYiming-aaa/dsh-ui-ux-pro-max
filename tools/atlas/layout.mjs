/**
 * 页面外壳与通用组件。
 *
 * 手册产物在 handbook/，图鉴产物在 gallery/，两者**同级**（源码目录与部署布局一致），
 * 所以站内用 ./、跨站用 ../gallery/ 或 ../，本地 file:// 直接打开也与线上行为相同。
 * 要部署到别的域名，构建时设 SHOWCASE_BASE=https://example.com/gallery/ 即可。
 */

import { GALLERY, HANDBOOK, OTHER_VIEW, GALLERY_LINE } from '../site-names.mjs';
import { xnavHead } from '../xnav.mjs';

export { GALLERY, HANDBOOK };

const BASE = (process.env.SHOWCASE_BASE || '').trim();

export const SHOWCASE_BASE = BASE;

export const GITHUB = 'https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max';

/** 出站到图鉴的链接：默认同域同级目录，设了 SHOWCASE_BASE 就走绝对 URL */
export const showcaseUrl = (p = '') => {
  const rest = String(p).replace(/^\/+/, '');
  return BASE ? `${BASE.replace(/\/+$/, '')}/${rest}` : `../gallery/${rest}`;
};

export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** 代码块内容转义（保留换行） */
export const escCode = (s) => esc(String(s ?? '').replace(/\r\n/g, '\n'));

export const NAV = [
  { id: 'palettes', href: './palettes.html', label: '配色', count: 'palettes' },
  { id: 'pairings', href: './pairings.html', label: '字体', count: 'pairings' },
  { id: 'charts', href: './charts.html', label: '图表', count: 'charts' },
  { id: 'landing', href: './landing.html', label: '落地页', count: 'landings' },
  { id: 'practices', href: './practices.html', label: '规范', count: 'practices' },
  { id: 'recipes', href: './recipes.html', label: '配方', count: 'recipes' },
  { id: 'compose', href: './compose.html', label: '生成器', count: null },
];

function topbar(active, counts) {
  const links = NAV.map((n) => {
    const num = n.count && counts ? counts[n.count] : null;
    return `<a class="nav-a${n.id === active ? ' is-on' : ''}" href="${n.href}"${
      n.id === active ? ' aria-current="page"' : ''
    }>${n.label}${num != null ? `<span class="nav-c">${num}</span>` : ''}</a>`;
  }).join('');
  return `<header class="top">
  <div class="top-in">
    <a class="brand" href="./index.html">
      <span class="brand-mark" aria-hidden="true"></span>
      <span class="brand-t">${HANDBOOK.name}</span>
    </a>
    <nav class="nav" aria-label="域导航">${links}</nav>
    <div class="top-r">
      <a class="top-link top-link--x" href="${showcaseUrl('index.html')}" data-xnav="${GALLERY.name}" title="另一个站点：${GALLERY.name}，${GALLERY_LINE}"><span class="tl-full">${GALLERY.name}</span><span class="tl-short">图鉴</span><span aria-hidden="true">↗</span></a>
      <a class="top-link top-link--gh" href="${GITHUB}" target="_blank" rel="noopener" title="插件源码与数据"><span class="tl-full">GitHub</span><span class="tl-short" aria-hidden="true">GH</span><span aria-hidden="true">↗</span></a>
    </div>
  </div>
</header>`;
}

export function footer() {
  return `<footer class="foot">
  <div class="foot-in">
    <p><strong>${HANDBOOK.name}</strong> · 同一知识库的${OTHER_VIEW} <a href="${showcaseUrl('index.html')}" data-xnav="${GALLERY.name}">${GALLERY.name}</a>（${GALLERY_LINE}）</p>
    <p class="foot-meta"><a href="./about.html">方法与溯源</a> · <a href="${GITHUB}" target="_blank" rel="noopener">GitHub ↗</a> · <span id="foot-build"></span></p>
  </div>
</footer>`;
}

/**
 * @param {object} o
 * @param {string} o.title 页面标题
 * @param {string} o.desc 描述
 * @param {string} o.active 当前域 id
 * @param {string} o.body  主体 HTML
 * @param {string} [o.side] 侧栏 HTML
 * @param {string} [o.head] 额外 head（如内联 JSON）
 * @param {string} [o.scripts] 额外脚本
 * @param {string} [o.pageClass]
 * @param {string} [o.hero] 页头区 HTML
 * @param {{head:string,body:string}} [o.intro] 进站过场（仅入口页传）
 */
export function pageShell({ title, desc, active, body, side = '', head = '', scripts = '', pageClass = '', hero = '', counts = null, intro = null }) {
  return `<!doctype html>
<html lang="zh-CN" data-pnav>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="color-scheme" content="light">
<link rel="icon" href="./assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="./assets/fonts.css">
<link rel="stylesheet" href="./assets/atlas.css">
${head}${intro ? intro.head : ''}${xnavHead()}
</head>
<body class="${pageClass}">${intro ? intro.body : ''}
<a class="skip" href="#main">跳到正文</a>
${topbar(active, counts)}
${hero}
<div class="shell${side ? '' : ' shell--wide'}">
  ${side ? `<aside class="side" id="side"><details class="side-d" open><summary class="side-sum">筛选与说明</summary><div class="side-in">${side}</div></details></aside>` : ''}
  <main class="main" id="main">
${body}
  </main>
</div>
${footer()}
<script src="./assets/app.js" defer></script>
${scripts}
</body>
</html>`;
}

/** 侧栏：标题 + 一组筛选按钮 / 锚点 */
export function sideBlock(title, inner, extra = '') {
  return `<div class="side-blk">
  <h2 class="side-h">${esc(title)}</h2>
  ${inner}
  ${extra}
</div>`;
}

/** 侧栏锚点列表 */
export function sideAnchors(items) {
  return `<ul class="side-list">${items
    .map((i) => `<li><a href="#${esc(i.id)}">${esc(i.label)}${i.count != null ? `<em>${i.count}</em>` : ''}</a></li>`)
    .join('')}</ul>`;
}

/** 筛选按钮组 */
export function chips(name, options, { all = true, allLabel = '全部' } = {}) {
  const items = (all ? [{ value: '', label: allLabel }] : []).concat(options);
  return `<div class="chips" data-filter="${esc(name)}" role="group">${items
    .map(
      (o, i) =>
        `<button type="button" class="chip${i === 0 && all ? ' is-on' : ''}" data-v="${esc(o.value)}${
          o.count != null ? `" data-n="${o.count}` : ''
        }">${esc(o.label)}${o.count != null ? `<em>${o.count}</em>` : ''}</button>`,
    )
    .join('')}</div>`;
}

/** 工具条：搜索 + 计数 + 排序 */
export function toolbar({ placeholder = '搜索…', sort = null, count = true, extra = '' } = {}) {
  return `<div class="tools">
  <label class="search">
    <span class="search-ico" aria-hidden="true"></span>
    <input type="search" data-search placeholder="${esc(placeholder)}" autocomplete="off" spellcheck="false">
  </label>
  ${sort ? `<label class="select"><span>排序</span><select data-sort>${sort.map((s) => `<option value="${esc(s.value)}">${esc(s.label)}</option>`).join('')}</select></label>` : ''}
  ${extra}
  ${count ? '<span class="count" data-count-out aria-live="polite"></span>' : ''}
</div>`;
}

export function pageHead({ kicker, title, lead, meta = '' }) {
  return `<header class="phead">
  ${kicker ? `<p class="kicker">${esc(kicker)}</p>` : ''}
  <h1 class="ph1">${esc(title)}</h1>
  ${lead ? `<p class="lead">${lead}</p>` : ''}
  ${meta ? `<div class="pmeta">${meta}</div>` : ''}
</header>`;
}

/** 数值条（统计用） */
export function statStrip(items, rise = '') {
  return `<dl class="stats"${rise ? ` data-rise="${rise}"` : ''}>${items
    .map((i) => `<div class="stat"><dt>${esc(i.label)}</dt><dd>${i.value}</dd></div>`)
    .join('')}</dl>`;
}

/** 空状态 */
export function emptyState(text = '没有符合条件的条目。') {
  return `<p class="empty" data-empty hidden>${esc(text)}</p>`;
}

export const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<rect width="32" height="32" rx="6" fill="#f6f5f1"/>
<rect x="5" y="5" width="9" height="9" fill="#e4501e"/>
<rect x="18" y="5" width="9" height="9" fill="#14161a"/>
<rect x="5" y="18" width="9" height="9" fill="#14161a"/>
<rect x="18" y="18" width="9" height="9" fill="#e4501e"/>
</svg>`;
