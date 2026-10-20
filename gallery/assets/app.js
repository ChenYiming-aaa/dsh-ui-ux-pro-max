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

  function apply() {
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
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      state.family = tab.getAttribute('data-family');
      writeUrl();
      apply();
    });
  });

  $$('[data-jump]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.family = btn.getAttribute('data-jump');
      state.q = '';
      if (searchInput) searchInput.value = '';
      if (statusSel) { state.status = 'all'; statusSel.value = 'all'; }
      writeUrl();
      apply();
      var target = $('#gallery');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  if (statusSel) {
    statusSel.addEventListener('change', function () {
      state.status = statusSel.value;
      apply();
    });
  }

  if (sortSel) {
    sortSel.addEventListener('change', function () {
      state.sort = sortSel.value;
      apply();
    });
  }

  if (searchInput) {
    var timer;
    searchInput.addEventListener('input', function () {
      clearTimeout(timer);
      var v = searchInput.value;
      timer = setTimeout(function () {
        state.q = v.trim();
        apply();
      }, 90);
    });
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        searchInput.value = '';
        state.q = '';
        apply();
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
  if (!links.length) return;
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

  Array.prototype.forEach.call(links, function (a) {
    a.addEventListener('click', function (e) {
      if (busy || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var href = a.getAttribute('href');
      if (!href || reduce) return;
      e.preventDefault();
      try { sessionStorage.setItem('ux-xnav', '1') } catch (err) {}
      busy = true;
      cover(a.getAttribute('data-xnav'), href);
    });
  });
})();
