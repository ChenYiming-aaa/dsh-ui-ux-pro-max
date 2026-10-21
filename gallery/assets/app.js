/* 风格图鉴 · 交互脚本（无依赖，纯静态） */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* --- 复制 ------------------------------------------------------------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        resolve();
      } catch (e) {
        reject(e);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy]');
    if (!btn) return;
    copyText(btn.getAttribute('data-copy')).then(function () {
      var nested = btn.children.length > 0;
      var old = nested ? '' : btn.textContent;
      if (!nested) btn.textContent = '已复制';
      btn.classList.add('done');
      setTimeout(function () {
        if (!nested) btn.textContent = old;
        btn.classList.remove('done');
      }, 1400);
    });
  });

  /* --- 明暗预览切换 ----------------------------------------------------- */
  function setPreviewMode(mode, persist) {
    $$('[data-preview]').forEach(function (pv) {
      pv.setAttribute('data-mode', mode);
    });
    $$('[data-set-mode]').forEach(function (b) {
      var on = b.getAttribute('data-set-mode') === mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (persist && window.history.replaceState && document.querySelector('[data-preview]')) {
      var p = new URLSearchParams(window.location.search);
      p.set('mode', mode);
      window.history.replaceState(null, '', p.toString() + window.location.hash);
    }
  }

  $$('.seg').forEach(function (seg) {
    seg.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-set-mode]');
      if (!btn) return;
      setPreviewMode(btn.getAttribute('data-set-mode'), true);
    });
  });

  var initialMode = new URLSearchParams(window.location.search).get('mode');
  if (initialMode === 'light' || initialMode === 'dark') setPreviewMode(initialMode, false);

  /* --- 页码滚动态 ------------------------------------------------------- */
  var head = $('.site-head');
  if (head) {
    var onScroll = function () {
      head.classList.toggle('is-scrolled', window.scrollY > 6);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- 目录高亮 --------------------------------------------------------- */
  var tocLinks = $$('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      if (el) map[id] = a;
    });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          tocLinks.forEach(function (a) { a.classList.remove('is-active'); });
          var a = map[en.target.id];
          if (a) a.classList.add('is-active');
        });
      },
      { rootMargin: '-84px 0px -70% 0px', threshold: 0 }
    );
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* --- 顶部导航指示线 --------------------------------------------------- */
  /* 「全部风格 / 分类 / 阅读指南」共用一条 2px 的橙线：切换时用同一个缓动平移过去，
     而不是换个粗体字；在首页滚到「按类别浏览」时，指示线自动跟到「分类」。 */
  (function () {
    var set = $('[data-navset]');
    if (!set) return;
    var ind = $('.nav-ind', set);
    var links = $$('a[data-nav]', set);
    if (!ind || !links.length) return;

    var reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches } catch (e) {}
    var typesEl = $('#types');

    function boxOf(a) {
      // 量「文字」而不是「内边距盒子」，指示线才会正好落在两个字下面。
      // jsdom 里 Range 没有 getBoundingClientRect，退回 offset 值。
      try {
        var r = document.createRange();
        if (typeof r.getBoundingClientRect !== 'function') throw new Error('no rect');
        r.selectNodeContents(a);
        var b = r.getBoundingClientRect();
        var ab = a.getBoundingClientRect();
        return { x: b.left - ab.left + a.offsetLeft, w: b.width };
      } catch (e) {
        return { x: a.offsetLeft, w: a.offsetWidth };
      }
    }

    function place(a, instant) {
      if (!a) return;
      var box = boxOf(a);
      if (!box.w) return;
      if (instant) ind.style.transition = 'none';
      ind.style.width = Math.round(box.w) + 'px';
      ind.style.transform = 'translate3d(' + Math.round(box.x) + 'px,0,0)';
      if (instant) {
        void ind.offsetWidth;
        ind.style.transition = '';
      }
    }

    function setActive(kind) {
      var on = null;
      links.forEach(function (a) {
        var hit = a.getAttribute('data-nav') === kind;
        a.classList.toggle('is-nav-on', hit);
        if (hit) {
          a.setAttribute('aria-current', kind === 'types' ? 'location' : 'page');
          on = a;
        } else {
          a.removeAttribute('aria-current');
        }
      });
      place(on);
    }

    var start = links.filter(function (a) { return a.getAttribute('aria-current') === 'page'; })[0] || links[0];
    // 详情页 / 404 没有 aria-current，但指示线仍应落在「全部风格」上
    start.classList.add('is-nav-on');
    place(start, true);

    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var kind = a.getAttribute('data-nav');
        // 只在首页做页内定位；去指南页或从别处回来都走正常导航
        if (!typesEl || kind === 'guide') return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        if (kind === 'types') {
          typesEl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
          if (window.history.replaceState) window.history.replaceState(null, '', '#types');
          setActive('types');
        } else {
          window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
          if (window.history.replaceState) window.history.replaceState(null, '', window.location.pathname + window.location.search);
          setActive('all');
        }
      });
    });

    if (typesEl && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) { setActive(en.isIntersecting ? 'types' : 'all'); });
        },
        { rootMargin: '-78px 0px -45% 0px', threshold: 0 }
      );
      io.observe(typesEl);
    }

    window.addEventListener('resize', function () { place(document.querySelector('a.is-nav-on') || start, true); });
    window.addEventListener('load', function () { place(document.querySelector('a.is-nav-on') || start, true); });
  })();

  /* --- 图鉴筛选 --------------------------------------------------------- */
  var grid = $('[data-grid]');
  if (!grid) return;

  var cards = $$('[data-card]', grid);
  var tabs = $$('[data-family]', $('[data-filters]'));
  var statusSel = $('[data-status]');
  var sortSel = $('[data-sort]');
  var searchInput = $('[data-search-input]');
  var countEl = $('[data-count]');
  var emptyEl = $('[data-empty]');
  var state = { family: 'all', status: 'all', q: '', sort: 'no' };

  var COMPLEX = { Low: 1, Medium: 2, High: 3 };
  var STATUS_ORDER = { active: 0, supplemental: 1, deprecated: 2 };
  var EASE = 'cubic-bezier(.22,.61,.36,1)';
  var NO_MOTION = false;
  try { NO_MOTION = window.matchMedia('(prefers-reduced-motion:reduce)').matches } catch (e) {}

  /* 卡片换位用 FLIP：先记旧位置，改完 DOM 再量一次，用 transform 把差值抹平。
     这样筛选 / 排序时是卡片「走过去」，而不是整片瞬间重排。 */
  function layoutMap() {
    var m = new Map();
    cards.forEach(function (c) { if (!c.hidden) m.set(c, c.getBoundingClientRect()); });
    return m;
  }

  function flip(before) {
    if (!before) return;
    var vh = window.innerHeight;
    cards.forEach(function (c) {
      if (c.hidden || typeof c.animate !== 'function') return;
      var now = c.getBoundingClientRect();
      if (now.bottom < -240 || now.top > vh + 400) return; // 屏幕外的卡不参与，省帧
      var was = before.get(c);
      if (!was) {
        c.animate(
          [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
          { duration: 320, easing: EASE }
        );
        return;
      }
      var dx = was.left - now.left;
      var dy = was.top - now.top;
      if (!dx && !dy) return;
      // 跨了几屏的位移看不清，硬动反而像在飞：远距离直接淡入落位
      if (Math.abs(dx) > window.innerWidth * 1.2 || Math.abs(dy) > vh * 1.2) {
        c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: EASE });
        return;
      }
      c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], {
        duration: 420,
        easing: EASE,
      });
    });
  }

  function readUrl() {
    var p = new URLSearchParams(window.location.search);
    var fam = p.get('family');
    var known = { all: 1, general: 1, mobile: 1, data: 1, landing: 1, platform: 1 };
    if (fam && known[fam]) state.family = fam;
  }

  function writeUrl() {
    if (!window.history.replaceState) return;
    var p = new URLSearchParams(window.location.search);
    if (state.family === 'all') p.delete('family');
    else p.set('family', state.family);
    var qs = p.toString();
    window.history.replaceState(null, '', qs ? '?' + qs + window.location.hash : window.location.pathname + window.location.hash);
  }

  function tokenize(q) {
    return q.toLowerCase().split(/\s+/).filter(Boolean);
  }

  function apply(animate) {
    var before = animate && !NO_MOTION ? layoutMap() : null;
    var tokens = tokenize(state.q);
    var shown = 0;

    cards.forEach(function (card) {
      var okFamily = state.family === 'all' || card.getAttribute('data-family') === state.family;
      var okStatus = state.status === 'all' || card.getAttribute('data-status') === state.status;
      var hay = card.getAttribute('data-search') || '';
      var okQuery = tokens.every(function (t) { return hay.indexOf(t) > -1; });
      var show = okFamily && okStatus && okQuery;
      card.hidden = !show;
      if (show) shown++;
    });

    var sorted = cards.slice().sort(function (a, b) {
      if (state.sort === 'name') {
        return a.getAttribute('data-name').localeCompare(b.getAttribute('data-name'), 'zh-Hans-CN');
      }
      if (state.sort === 'complexity') {
        var ca = COMPLEX[a.getAttribute('data-complexity')] || 2;
        var cb = COMPLEX[b.getAttribute('data-complexity')] || 2;
        return ca - cb || Number(a.getAttribute('data-no')) - Number(b.getAttribute('data-no'));
      }
      if (state.sort === 'status') {
        var sa = STATUS_ORDER[a.getAttribute('data-status')] || 9;
        var sb = STATUS_ORDER[b.getAttribute('data-status')] || 9;
        return sa - sb || Number(a.getAttribute('data-no')) - Number(b.getAttribute('data-no'));
      }
      return Number(a.getAttribute('data-no')) - Number(b.getAttribute('data-no'));
    });
    var frag = document.createDocumentFragment();
    sorted.forEach(function (c) { frag.appendChild(c); });
    grid.appendChild(frag);

    if (countEl) {
      countEl.textContent = '显示 ' + shown + ' / ' + cards.length + ' 种风格';
    }
    if (emptyEl) emptyEl.hidden = shown !== 0;

    tabs.forEach(function (t) {
      var on = t.getAttribute('data-family') === state.family;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', String(on));
    });

    if (before) flip(before);
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      state.family = tab.getAttribute('data-family');
      writeUrl();
      apply(true);
    });
  });

  $$('[data-jump]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.family = btn.getAttribute('data-jump');
      state.q = '';
      if (searchInput) searchInput.value = '';
      if (statusSel) { state.status = 'all'; statusSel.value = 'all'; }
      writeUrl();
      apply(true);
      var target = $('#gallery');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  if (statusSel) {
    statusSel.addEventListener('change', function () {
      state.status = statusSel.value;
      apply(true);
    });
  }

  if (sortSel) {
    sortSel.addEventListener('change', function () {
      state.sort = sortSel.value;
      apply(true);
    });
  }

  if (searchInput) {
    var timer;
    searchInput.addEventListener('input', function () {
      clearTimeout(timer);
      var v = searchInput.value;
      timer = setTimeout(function () {
        state.q = v.trim();
        apply(true);
      }, 90);
    });
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        searchInput.value = '';
        state.q = '';
        apply(true);
        searchInput.blur();
      }
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    if (!searchInput) return;
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
    var target = $('#gallery');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  var randomBtn = $('[data-random]');
  if (randomBtn) {
    randomBtn.addEventListener('click', function () {
      var pool = cards.filter(function (c) { return !c.hidden; });
      if (!pool.length) pool = cards;
      var card = pool[Math.floor(Math.random() * pool.length)];
      var link = $('a', card);
      if (link) window.location.href = link.getAttribute('href');
    });
  }

  readUrl();
  apply();
})();

/* 跨站切换 —— 由 tools/xnav.mjs 在构建时追加，两站同一份实现，勿手改 */
(function () {
  var links = document.querySelectorAll('a[data-xnav]');
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches } catch (e) {}
  var busy = false;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function cover(label, href) {
    var box = document.createElement('div');
    box.className = 'xnav';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML =
      '<i class="xnav-p xnav-p--t"></i><i class="xnav-p xnav-p--b">' +
      (label ? '<span class="xnav-l">→ ' + esc(label) + '</span>' : '') +
      '</i>';
    document.body.appendChild(box);
    void box.offsetHeight; // 先让起始位移生效，否则两块幕布会从画面正中弹出
    box.classList.add('is-on');
    // 不依赖 animationend：标签页被挂起时它不会触发，时间到了照跳
    window.setTimeout(function () { window.location.href = href; }, 400);
  }

  /* 跨站（/gallery/ ↔ /handbook/）不能走 View Transition：两站外壳完全不同，
     同名的 site-head 会被浏览器相互变形，看起来像两张页头黏在一起。
     所以凡是「离开本站根目录」的链接，先撤掉 opt-in，回到普通的直接换页。 */
  var siteRoot = '/' + (window.location.pathname.split('/')[1] || '') + '/';
  document.addEventListener(
    'click',
    function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var url;
      try { url = new URL(a.getAttribute('href'), window.location.href); } catch (err) { return; }
      if (url.origin !== window.location.origin) return;
      if (url.pathname.indexOf(siteRoot) === 0) return;
      var opt = document.getElementById('vt-optin');
      if (opt && opt.parentNode) opt.parentNode.removeChild(opt);
    },
    true
  );

  /* 站内翻页前先记下方向：当前高亮项在导航里的位置 vs 被点项的位置。
     两站每页都是同一份导航，顺序一致，所以这个比较在两个方向上都会正确。 */
  var navBar = document.querySelector('.nav, .top .nav, .site-head .nav');
  if (navBar) document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || !navBar.contains(a) || a.hasAttribute('data-xnav')) return;
    var items = Array.prototype.slice.call(navBar.querySelectorAll('a[href]'));
    var to = items.indexOf(a);
    var from = items.findIndex(function (x) {
      return x.hasAttribute('aria-current') || x.classList.contains('is-nav-on') || x.classList.contains('is-on');
    });
    if (from < 0 || to < 0 || to === from) return;
    try { sessionStorage.setItem('ux-vtdir', to > from ? 'fwd' : 'back') } catch (err) {}
  }, true);

  if (links.length) Array.prototype.forEach.call(links, function (a) {
    a.addEventListener('click', function (e) {
      if (busy || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var href = a.getAttribute('href');
      if (!href || reduce) return;
      e.preventDefault();
      try { sessionStorage.setItem('ux-xnav', '1') } catch (err) {}
      // 跨站是「换场」，不要叠加站内的 View Transition
      var opt = document.getElementById('vt-optin');
      if (opt && opt.parentNode) opt.parentNode.removeChild(opt);
      busy = true;
      cover(a.getAttribute('data-xnav'), href);
    });
  });

})();
/* 曲率连续圆角 —— 由 tools/squircle.mjs 在构建时追加，两站同一份实现，勿手改 */
(function () {
'use strict';
/* 曲率连续圆角运行时 —— 纯浏览器脚本，构建时由 tools/squircle.mjs 内联进两站 app.js 末尾。
   无外部请求、无依赖；不支持 clip-path:path() 或无 JS 时保留原生 border-radius。 */

/* ---------- 几何核心：figma-squircle（MIT）----------
   移植自 github.com/phamfoo/figma-squircle（Pham Duong），
   原始实现 github.com/MartinRGB/Figma_Squircles_Approximation（MartinRGB），
   几何出处：Figma 博客《Desperately Seeking Squircles》。
   每个角：直线 → 三次贝塞尔（曲率 0 → 1/R 平滑爬升）→ 圆弧平台（曲率恒定）
   → 三次贝塞尔（对称回落）→ 直线。起弯点 s0 = (1+平滑度)·R，转角预算不足时
   自动收缩平滑度（退化回普通圆角/胶囊），全程切线连续、无曲率跳变。 */

var SQ_SMOOTH = 0.45;   // 全局平滑度：s0 = (1+0.45)·R ≈ 1.45R（1.00R–1.49R 区间上部，iOS 观感）
var SQ_MIN_R = 2.5;     // 更小的装饰角不做处理：曲率跳变低于半像素，肉眼不可辨
var SQ_EPS = 0.3;

/* 单角参数：p 为起弯点偏移 s0，arc 为平台圆弧的弦向位移，a/b/c/d 为贝塞尔控制距离 */
function sqCorner(R, budget) {
  var radius = Math.min(R, budget);
  var s = Math.min(SQ_SMOOTH, budget / radius - 1);
  var p = (1 + s) * radius;
  var arcMeasure = 90 * (1 - s);
  var arc = Math.sin(arcMeasure * Math.PI / 360) * radius * Math.SQRT2;
  var alpha = (90 - arcMeasure) / 2;
  var p34 = radius * Math.tan(alpha * Math.PI / 360);
  var beta = 45 * s * Math.PI / 180;
  var c = p34 * Math.cos(beta);
  var d = c * Math.tan(beta);
  var b = (p - arc - c - d) / 3;
  return { r: radius, p: p, arc: arc, c: c, d: d, b: b, a: 2 * b };
}

function sqF(n) { return String(Math.round(n * 100) / 100); }

/* 整矩形路径（顺时针，ox/oy 平移给描边内圈用）。
   每角 2 段三次贝塞尔 + 1 段真圆弧（a 命令，曲率严格恒定的平台段）。 */
function sqRectPath(w, h, R, ox, oy) {
  ox = ox || 0; oy = oy || 0;
  var k = sqCorner(R, Math.min(w, h) / 2);
  var a = k.a, b = k.b, c = k.c, d = k.d, p = k.p, al = k.arc, r = k.r;
  return 'M' + sqF(w - p + ox) + ' ' + sqF(oy) +
    'c' + sqF(a) + ' 0 ' + sqF(a + b) + ' 0 ' + sqF(a + b + c) + ' ' + sqF(d) +
    'a' + sqF(r) + ' ' + sqF(r) + ' 0 0 1 ' + sqF(al) + ' ' + sqF(al) +
    'c' + sqF(d) + ' ' + sqF(c) + ' ' + sqF(d) + ' ' + sqF(b + c) + ' ' + sqF(d) + ' ' + sqF(a + b + c) +
    'L' + sqF(w + ox) + ' ' + sqF(h - p + oy) +
    'c0 ' + sqF(a) + ' 0 ' + sqF(a + b) + ' ' + sqF(-d) + ' ' + sqF(a + b + c) +
    'a' + sqF(r) + ' ' + sqF(r) + ' 0 0 1 ' + sqF(-al) + ' ' + sqF(al) +
    'c' + sqF(-c) + ' ' + sqF(d) + ' ' + sqF(-(b + c)) + ' ' + sqF(d) + ' ' + sqF(-(a + b + c)) + ' ' + sqF(d) +
    'L' + sqF(p + ox) + ' ' + sqF(h + oy) +
    'c' + sqF(-a) + ' 0 ' + sqF(-(a + b)) + ' 0 ' + sqF(-(a + b + c)) + ' ' + sqF(-d) +
    'a' + sqF(r) + ' ' + sqF(r) + ' 0 0 1 ' + sqF(-al) + ' ' + sqF(-al) +
    'c' + sqF(-d) + ' ' + sqF(-c) + ' ' + sqF(-d) + ' ' + sqF(-(b + c)) + ' ' + sqF(-d) + ' ' + sqF(-(a + b + c)) +
    'L' + sqF(ox) + ' ' + sqF(p + oy) +
    'c0 ' + sqF(-a) + ' 0 ' + sqF(-(a + b)) + ' ' + sqF(d) + ' ' + sqF(-(a + b + c)) +
    'a' + sqF(r) + ' ' + sqF(r) + ' 0 0 1 ' + sqF(al) + ' ' + sqF(-al) +
    'c' + sqF(c) + ' ' + sqF(-d) + ' ' + sqF(b + c) + ' ' + sqF(-d) + ' ' + sqF(a + b + c) + ' ' + sqF(-d) +
    'Z';
}

/* ---------- 读取与分类 ---------- */

function sqRadius(cs) {
  var keys = ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'];
  var first = null;
  for (var i = 0; i < 4; i++) {
    var parts = cs[keys[i]].trim().split(/\s+/);
    if (parts.length !== 1) return -1;            // 椭圆角 / 手绘风非对称角：保留原样
    var v = parseFloat(parts[0]);
    if (!isFinite(v)) return -1;
    if (first === null) first = v;
    else if (Math.abs(v - first) > SQ_EPS) return -1;
  }
  return first === null ? -1 : first;
}

function sqColor(s) {
  if (!s) return null;
  var m = s.match(/color\(srgb[^)]*\)/);
  if (m) {
    var n = m[0].match(/[\d.]+/g) || [];
    var r = (parseFloat(n[0]) || 0) * 255, g = (parseFloat(n[1]) || 0) * 255, b = (parseFloat(n[2]) || 0) * 255;
    var a = n.length > 3 ? parseFloat(n[3]) : 1;
    return { r: r, g: g, b: b, a: a, css: sqRgba(r, g, b, a) };
  }
  m = s.match(/rgba?\(([^)]*)\)/);
  if (m) {
    var t = m[1].split(/[\s,/]+/);
    var r2 = parseFloat(t[0]), g2 = parseFloat(t[1]), b2 = parseFloat(t[2]);
    var a2 = t.length > 3 ? parseFloat(t[3]) : 1;
    if (isFinite(r2) && isFinite(g2) && isFinite(b2))
      return { r: r2, g: g2, b: b2, a: isFinite(a2) ? a2 : 1, css: sqRgba(r2, g2, b2, isFinite(a2) ? a2 : 1) };
  }
  return null;
}

function sqRgba(r, g, b, a) {
  function u(x) { return Math.max(0, Math.min(255, Math.round(x))); }
  a = Math.max(0, Math.min(1, a));
  return a >= 1
    ? 'rgb(' + u(r) + ', ' + u(g) + ', ' + u(b) + ')'
    : 'rgba(' + u(r) + ', ' + u(g) + ', ' + u(b) + ', ' + Math.round(a * 1000) / 1000 + ')';
}

/* 顶部亮 / 底部弱：向白混 45%，半透明时同时提一点不透明度 */
function sqHighlight(col) {
  var c = sqColor(col);
  if (!c) return col;
  return sqRgba(c.r + (255 - c.r) * 0.45, c.g + (255 - c.g) * 0.45, c.b + (255 - c.b) * 0.45, c.a + (1 - c.a) * 0.35);
}

function sqBorder(cs) {
  var w = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth];
  var st = [cs.borderTopStyle, cs.borderRightStyle, cs.borderBottomStyle, cs.borderLeftStyle];
  var co = [cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor];
  var any = false, uniform = true;
  for (var i = 0; i < 4; i++) {
    var bw = parseFloat(w[i]) || 0;
    if (bw > SQ_EPS) any = true;
    if (st[i] !== 'solid') uniform = false;
    if (Math.abs(bw - (parseFloat(w[0]) || 0)) > SQ_EPS) uniform = false;
    if (co[i] !== co[0]) uniform = false;
  }
  if (!any) return { kind: 'none' };
  var col = sqColor(co[0]);
  if (!uniform || !col || col.a < 0.05) return { kind: 'messy' };
  return { kind: 'stroke', color: col.css };
}

function sqSplitTop(s) {
  var out = [], depth = 0, cur = '';
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i);
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

function sqShadows(cs) {
  var v = cs.boxShadow;
  if (!v || v === 'none') return { inset: false, layers: [] };
  var layers = sqSplitTop(v), out = [], inset = false;
  for (var i = 0; i < layers.length; i++) {
    var L = layers[i];
    if (/\binset\b/.test(L)) { inset = true; continue; }
    var px = L.match(/(-?\d*\.?\d+)px/g) || [];
    var col = sqColor(L);
    if (px.length < 2 || !col) continue;
    var blur = px.length > 2 ? parseFloat(px[2]) : 0;
    var spread = px.length > 3 ? parseFloat(px[3]) : 0;
    out.push({ x: parseFloat(px[0]), y: parseFloat(px[1]), blur: Math.max(0, blur + spread), color: col.css });
  }
  return { inset: inset, layers: out };
}

function sqBgPainted(cs) {
  if (!cs) return false;
  var c = sqColor(cs.backgroundColor);
  if (c && c.a > 0.01) return true;
  if (cs.backgroundImage && cs.backgroundImage !== 'none') return true;
  return false;
}

function sqMeasure(el, cs) {
  var rect = el.getBoundingClientRect();
  var w = rect.width, h = rect.height;
  var t = cs.transform;
  if (t && t !== 'none') {
    try {
      var m = new DOMMatrixReadOnly(t);
      var sx = Math.hypot(m.a, m.b) || 1;
      var sy = Math.hypot(m.c, m.d) || 1;
      w /= sx; h /= sy;
    } catch (e) { /* 变换矩阵解析失败就按原始尺寸来 */ }
  }
  return { w: w, h: h };
}

function sqScrolls(cs) {
  var v = [cs.overflow, cs.overflowX, cs.overflowY];
  for (var i = 0; i < 3; i++) if (v[i] === 'auto' || v[i] === 'scroll') return true;
  return false;
}

/* 把静态元素转成 relative（描边叠层的定位上下文）是否安全：
   只有「绝对定位后代的锚定祖先在 el 之外」才会被 relative 抢走，那才危险；
   锚定在 el 内部的（预览组件内部自己的 relative 容器）不受影响。fixed 不受 position 影响。 */
function sqAbsSafe(el) {
  var all = el.querySelectorAll('*');
  for (var i = 0; i < all.length; i++) {
    var d = all[i];
    if (getComputedStyle(d).position !== 'absolute') continue;
    var op = d.offsetParent;
    if (!op || !el.contains(op)) return false;
  }
  return true;
}

/* 圆角必须真正在起作用才值得裁：有背景 / 描边 / 投影，或 overflow 会裁子元素，
   或圆角画在伪元素上。只设了 radius 的透明布局壳不动，避免凭空裁切子元素。 */
function sqUsesRadius(el, cs, border, sh) {
  if (border.kind === 'stroke') return true;
  if (sh.layers.length) return true;
  if (sqBgPainted(cs)) return true;
  if (cs.overflow !== 'visible' || cs.overflowX !== 'visible' || cs.overflowY !== 'visible') return true;
  try {
    if (sqBgPainted(getComputedStyle(el, '::before'))) return true;
    if (sqBgPainted(getComputedStyle(el, '::after'))) return true;
  } catch (e) { /* 伪元素查询失败就跳过这项检查 */ }
  return false;
}

/* ---------- 应用与复原 ---------- */

var SQ_APPLIED = new Map();   // el -> { mode, w, h, r, ring, wrap, savedShadow, savedPos }
var SQ_QUEUE = new Set();
var SQ_FORCE = new Set();     // 需要强制重取色的元素（明暗切换 / hover 换边框色）
var SQ_RAF = 0;

function sqSchedule(el, force) {
  if (force) SQ_FORCE.add(el);
  SQ_QUEUE.add(el);
  if (!SQ_RAF) SQ_RAF = requestAnimationFrame(sqRun);
}

function sqRun() {
  SQ_RAF = 0;
  var batch = Array.from(SQ_QUEUE);
  SQ_QUEUE.clear();
  for (var i = 0; i < batch.length; i++) {
    var el = batch[i];
    var force = SQ_FORCE.has(el);
    SQ_FORCE.delete(el);
    if (!el.isConnected) continue;
    sqApply(el, force);
    // 只放弃「有尺寸却不合格」的元素；隐藏元素继续挂着，等它出现时再分类
    if (!SQ_APPLIED.has(el) && SQ_RO) {
      var r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) SQ_RO.unobserve(el);
    }
  }
}

/* 分类：返回 { mode: 'clip'|'stroke'|null, reason, R, border, sh } */
function sqClassify(el, cs, box) {
  var out = { mode: null, reason: '' };
  var R = sqRadius(cs);
  if (R < SQ_MIN_R) { out.reason = 'r-too-small:' + R; return out; }
  var budget = Math.min(box.w, box.h) / 2;
  if (R > budget - SQ_EPS) { out.reason = 'circle/capsule r=' + R; return out; }
  if (cs.clipPath !== 'none') { out.reason = 'has-clip'; return out; }
  if (/^(inline|table)/.test(cs.display)) { out.reason = 'display:' + cs.display; return out; }
  if (cs.mixBlendMode && cs.mixBlendMode !== 'normal') { out.reason = 'blend'; return out; }

  var border = sqBorder(cs);
  var sh = sqShadows(cs);
  out.R = R; out.border = border; out.sh = sh;
  if (sh.inset) { out.reason = 'inset-shadow'; return out; }
  if (border.kind === 'messy') { out.reason = 'border-messy'; return out; }
  if (!sqUsesRadius(el, cs, border, sh)) { out.reason = 'inert-radius'; return out; }

  if (border.kind === 'stroke') {
    if (sqScrolls(cs)) { out.reason = 'stroke+scroll'; return out; }
    if (cs.position === 'static' && !sqAbsSafe(el)) { out.reason = 'abs-unsafe'; return out; }
    out.mode = 'stroke';
  } else {
    out.mode = 'clip';
  }
  if (sh.layers.length && cs.position !== 'static') { out.mode = null; out.reason = 'shadow+positioned'; return out; }
  return out;
}

function sqApply(el, force) {
  var cs = getComputedStyle(el);
  var info = SQ_APPLIED.get(el);
  var box = sqMeasure(el, cs);
  if (!box || box.w < 4 || box.h < 4) { if (info) sqRevert(el); return; }

  // 已应用且尺寸 / 圆角没变：不重算（半像素内不抖动）；force 表示颜色环境变了，重建
  if (info) {
    var R0 = sqRadius(cs);
    if (!force && R0 >= 0 && R0 === info.r && Math.abs(info.w - box.w) < 0.5 && Math.abs(info.h - box.h) < 0.5) return;
    sqRevert(el);
    cs = getComputedStyle(el);   // 复原后重读，避免读到自己的 clip-path
  }

  var cls = sqClassify(el, cs, box);
  var mode = cls.mode;
  if (!mode) return;

  var R = cls.R;
  var path = sqRectPath(box.w, box.h, R);
  el.setAttribute('data-sq', mode);
  el.style.clipPath = 'path("' + path + '")';
  el.style.borderRadius = '0px';
  info = { mode: mode, w: box.w, h: box.h, r: R };

  if (mode === 'stroke') {
    if (cs.position === 'static') {
      el.style.position = 'relative';
      info.savedPos = true;
    }
    // 描边叠层：外圈 = 裁切边，内圈内缩 1px，evenodd 相减成 1px 连续环，
    // 填「顶部亮 / 底部弱」的纵向渐变——沿圆角连续流动，不中断。
    var ring = document.createElement('div');
    ring.className = 'sq-stroke';
    ring.style.clipPath = 'path(evenodd, "' + path + ' ' + sqRectPath(box.w - 2, box.h - 2, R - 1, 1, 1) + '")';
    ring.style.background = 'linear-gradient(180deg, ' + sqHighlight(cls.border.color) + ', ' + cls.border.color + ')';
    el.appendChild(ring);
    info.ring = ring;
  }
  if (cls.sh.layers.length) sqWrapShadow(el, cls.sh.layers, info);
  SQ_APPLIED.set(el, info);
}

/* clip-path 会把元素自身的 box-shadow 一起裁掉，所以投影搬到外层壳上：
   drop-shadow 作用在裁形之后，轮廓跟随曲率连续圆角。 */
function sqWrapShadow(el, layers, info) {
  var cs = getComputedStyle(el);
  var wrap = document.createElement('div');
  wrap.className = 'sq-wrap';
  var f = [];
  for (var i = 0; i < layers.length; i++) {
    var l = layers[i];
    f.push('drop-shadow(' + l.x + 'px ' + l.y + 'px ' + l.blur + 'px ' + l.color + ')');
  }
  wrap.style.filter = f.join(' ');
  // 把元素在布局槽位里的属性搬到壳上（margin 同时清零避免双重），不搬宽高——
  // 计算样式的 width 是 used value，搬过去会锁死响应式。
  var props = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'];
  for (var j = 0; j < props.length; j++) {
    wrap.style[props[j]] = cs[props[j]];
    el.style[props[j]] = '0px';
  }
  var extra = ['flexGrow', 'flexShrink', 'flexBasis', 'order', 'alignSelf', 'justifySelf',
    'gridColumnStart', 'gridColumnEnd', 'gridRowStart', 'gridRowEnd'];
  for (var k = 0; k < extra.length; k++) wrap.style[extra[k]] = cs[extra[k]];
  if (el.parentNode) el.parentNode.insertBefore(wrap, el);
  wrap.appendChild(el);
  info.wrap = wrap;
  info.savedShadow = el.style.boxShadow;
  el.style.boxShadow = 'none';
}

function sqRevert(el) {
  var info = SQ_APPLIED.get(el);
  if (!info) return;
  el.style.clipPath = '';
  el.style.borderRadius = '';
  el.removeAttribute('data-sq');
  if (info.savedPos) el.style.position = '';
  if (info.ring && info.ring.parentNode) info.ring.parentNode.removeChild(info.ring);
  if (info.savedShadow !== undefined) el.style.boxShadow = info.savedShadow;
  if (info.wrap) {
    var wrap = info.wrap;
    if (wrap.parentNode) wrap.parentNode.insertBefore(el, wrap);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    el.style.marginTop = el.style.marginRight = el.style.marginBottom = el.style.marginLeft = '';
  }
  SQ_APPLIED.delete(el);
}

/* ---------- 扫描与观察 ---------- */

function sqIsOurs(el) {
  return el.classList && (el.classList.contains('sq-stroke') || el.classList.contains('sq-wrap'));
}

function sqScan(root) {
  var all = root.querySelectorAll('*');
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    if (sqIsOurs(el)) continue;
    if (el.namespaceURI !== 'http://www.w3.org/1999/xhtml') continue;
    var tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'LINK' || tag === 'META' || tag === 'TEMPLATE' || tag === 'BR') continue;
    // 完全不可见的元素先挂着观察，等它有尺寸时再分类
    if (!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)) {
      if (SQ_RO && !SQ_APPLIED.has(el)) SQ_RO.observe(el);
      continue;
    }
    sqSchedule(el);
  }
}

var SQ_RO = ('ResizeObserver' in window) ? new ResizeObserver(function (entries) {
  for (var i = 0; i < entries.length; i++) {
    var el = entries[i].target;
    if (!el.isConnected) { SQ_RO.unobserve(el); continue; }
    sqSchedule(el);
  }
}) : null;

(function sqInit() {
  if (!SQ_RO) return;
  /* 调试钩子（生产无害）：控制台可查队列 / 手动触发单元素分类 */
  try {
    window.__sq = {
      count: function () { return SQ_APPLIED.size; },
      queued: function () { return SQ_QUEUE.size; },
      apply: function (el) { sqApply(el); },
      probe: function (el) {
        var cs = getComputedStyle(el);
        var box = sqMeasure(el, cs);
        return sqClassify(el, cs, box);
      },
      scan: function (root) { sqScan(root || document.body); }
    };
  } catch (e) { /* 某些环境禁 window 扩展就跳过 */ }
  sqScan(document.body);

  /* 描边 / 投影的颜色是应用时快照的：hover 换边框色、明暗切换换令牌时强制重建。
     mouseover + relatedTarget 判定只在真正进出元素时触发，内部移动不重算。 */
  function sqStrokeAt(e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-sq="stroke"]') : null;
    if (!t) return null;
    var rel = e.relatedTarget;
    if (rel && t.contains(rel) && rel !== t) return null;   // 元素内部移动
    return t;
  }
  document.addEventListener('mouseover', function (e) {
    var t = sqStrokeAt(e);
    if (t) sqSchedule(t, true);
  }, true);
  document.addEventListener('mouseout', function (e) {
    var t = sqStrokeAt(e);
    if (t) sqSchedule(t, true);
  }, true);
  document.addEventListener('focusin', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-sq="stroke"]') : null;
    if (t) sqSchedule(t, true);
  }, true);

  var mo = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var m = muts[i];
      if (m.type === 'attributes') {   // data-mode 明暗切换：整棵子树的重取色
        sqSchedule(m.target, true);
        var own = m.target.querySelectorAll ? m.target.querySelectorAll('*') : [];
        for (var q = 0; q < own.length; q++) sqSchedule(own[q], true);
        continue;
      }
      var nodes = m.addedNodes;
      for (var j = 0; j < nodes.length; j++) {
        var n = nodes[j];
        if (n.nodeType !== 1 || sqIsOurs(n)) continue;
        if (n.namespaceURI !== 'http://www.w3.org/1999/xhtml') continue;
        sqSchedule(n);
        var kids = n.querySelectorAll ? n.querySelectorAll('*') : [];
        for (var k = 0; k < kids.length; k++) if (!sqIsOurs(kids[k])) sqSchedule(kids[k]);
      }
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-mode'] });

  // 字体换装 / 视口变化后的兜底全量复查
  var rT = 0;
  function rescan() { sqScan(document.body); }
  window.addEventListener('resize', function () {
    clearTimeout(rT); rT = setTimeout(rescan, 200);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rescan);
  window.addEventListener('load', rescan);
})();

})();
