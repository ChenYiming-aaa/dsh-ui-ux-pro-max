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
