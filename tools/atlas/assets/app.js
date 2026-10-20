/* 设计手册 · 交互（无依赖） */
(function () {
  'use strict';

  var qs = function (s, r) { return (r && r.querySelector ? r : document).querySelector(s); };
  var qsa = function (s, r) {
    var root = r && typeof r.querySelectorAll === 'function' ? r : document;
    return Array.prototype.slice.call(root.querySelectorAll(s));
  };
  var REDUCE = false;
  try { REDUCE = window.matchMedia('(prefers-reduced-motion:reduce)').matches; } catch (e) {}

  /**
   * 展开 / 收起面板：hidden 是瞬时开关，直接切会「啪」地出现。
   * 这里先取消 hidden，再用 240ms 的高度 + 透明度过渡收放；不支持 WAAPI 或
   * 用户要求减少动效时退回原来的瞬时切换（jsdom 里也走这条路）。
   */
  function slide(el, open) {
    if (!el) return;
    if (REDUCE || typeof el.animate !== 'function') {
      el.hidden = !open;
      return;
    }
    if (el._anim) { el._anim.cancel(); el._anim = null; }
    var ease = 'cubic-bezier(.76,0,.24,1)';
    if (open) {
      el.hidden = false;
      var h = el.scrollHeight;
      el.style.overflow = 'hidden';
      var a = el.animate(
        [{ height: '0px', opacity: 0, paddingTop: '0px', paddingBottom: '0px' }, { height: h + 'px', opacity: 1 }],
        { duration: 240, easing: ease }
      );
      el._anim = a;
      a.onfinish = a.oncancel = function () { el.style.overflow = ''; el._anim = null; };
    } else {
      var h2 = el.scrollHeight;
      el.style.overflow = 'hidden';
      var b = el.animate(
        [{ height: h2 + 'px', opacity: 1 }, { height: '0px', opacity: 0, paddingTop: '0px', paddingBottom: '0px' }],
        { duration: 180, easing: ease }
      );
      el._anim = b;
      b.onfinish = b.oncancel = function () { el.hidden = true; el.style.overflow = ''; el._anim = null; };
    }
  }

  /* ---------------- 复制 ---------------- */
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;left:0;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
    return true;
  }

  function flash(btn, label) {
    if (!btn) return;
    var old = btn.getAttribute('data-label') || btn.textContent;
    btn.setAttribute('data-label', old);
    btn.textContent = label;
    btn.classList.add('done');
    setTimeout(function () {
      btn.textContent = old;
      btn.classList.remove('done');
    }, 1200);
  }

  /* ---------------- 筛选 / 搜索 / 排序 ---------------- */
  function setupList() {
    var list = qs('[data-list]');
    if (!list) return;
    var items = qsa('[data-item]', list);
    var chips = qsa('.chip');
    var search = qs('[data-search]');
    var sortSel = qs('[data-sort]');
    var out = qs('[data-count-out]');
    var empty = qs('[data-empty]');
    var filters = {};
    var swapTimer;

    /** 结果变化时让新出现的条目轻微上浮，避免整片卡片瞬间替换 */
    function fade() {
      if (REDUCE) return;
      list.classList.remove('is-swap');
      void list.offsetWidth;
      list.classList.add('is-swap');
      clearTimeout(swapTimer);
      swapTimer = setTimeout(function () { list.classList.remove('is-swap'); }, 320);
    }

    function apply(animate) {
      var q = search ? search.value.trim().toLowerCase() : '';
      var shown = 0;
      items.forEach(function (el) {
        var ok = true;
        for (var k in filters) {
          var v = filters[k];
          if (!v) continue;
          if (el.getAttribute('data-' + k) !== v) { ok = false; break; }
        }
        if (ok && q) {
          var hay = el.getAttribute('data-search') || '';
          ok = hay.indexOf(q) > -1;
        }
        el.hidden = !ok;
        if (ok) shown += 1;
      });
      if (out) out.innerHTML = '显示 <b>' + shown + '</b> / ' + items.length + ' 条';
      if (empty) empty.hidden = shown !== 0;
      if (animate) fade();
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var group = chip.parentNode.getAttribute('data-filter');
        var val = chip.getAttribute('data-v') || '';
        qsa('.chip', chip.parentNode).forEach(function (c) { c.classList.remove('is-on'); });
        chip.classList.add('is-on');
        filters[group] = val;
        apply(true);
      });
    });

    if (search) {
      var t;
      search.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () { apply(true); }, 90);
      });
    }

    if (sortSel) {
      sortSel.addEventListener('change', function () {
        var key = sortSel.value;
        var sorted = items.slice().sort(function (a, b) {
          var av = a.getAttribute('data-sort-' + key) || '';
          var bv = b.getAttribute('data-sort-' + key) || '';
          if (key === 'ratio' || key === 'hue' || key === 'pop') {
            return parseFloat(av || '0') - parseFloat(bv || '0') * (key === 'ratio' ? -1 : 1);
          }
          return av.localeCompare(bv, 'zh-Hans-CN');
        });
        if (key === 'ratio') sorted.reverse();
        sorted.forEach(function (el) { list.appendChild(el); });
        fade();
      });
    }

    apply();
  }

  /* ---------------- 配色详情与导出 ---------------- */
  var TOKENS = [
    ['primary', '--primary', '主色'],
    ['onPrimary', '--primary-foreground', '主色文字'],
    ['secondary', '--secondary', '辅色'],
    ['onSecondary', '--secondary-foreground', '辅色文字'],
    ['accent', '--accent', '强调色'],
    ['onAccent', '--accent-foreground', '强调文字'],
    ['background', '--background', '背景'],
    ['foreground', '--foreground', '正文'],
    ['card', '--card', '卡片'],
    ['cardForeground', '--card-foreground', '卡片文字'],
    ['muted', '--muted', '弱化底'],
    ['mutedForeground', '--muted-foreground', '弱化文字'],
    ['border', '--border', '描边'],
    ['destructive', '--destructive', '危险色'],
    ['onDestructive', '--destructive-foreground', '危险文字'],
    ['ring', '--ring', '焦点环']
  ];

  var palIndex = null;
  function getPal(key) {
    if (!palIndex) {
      var node = qs('#pal-data');
      if (!node) return null;
      try {
        palIndex = {};
        JSON.parse(node.textContent).forEach(function (p) { palIndex[p.key] = p; });
      } catch (e) { palIndex = {}; }
    }
    return palIndex[key];
  }

  function cssExport(p) {
    var lines = TOKENS.map(function (t) { return '  ' + t[1] + ': ' + (p.css[t[0]] || p.tokens[t[0]]) + ';'; });
    return '/* ' + p.key + ' · ' + (p.mode === 'dark' ? 'dark' : 'light') + ' */\n:root{\n' + lines.join('\n') + '\n}';
  }

  function twExport(p) {
    var lines = TOKENS.map(function (t) {
      var name = t[1].replace('--', '');
      return "      '" + name + "': '" + (p.css[t[0]] || p.tokens[t[0]]) + "',";
    });
    return '// tailwind.config.js\ntheme: {\n  extend: {\n    colors: {\n' + lines.join('\n') + '\n    }\n  }\n}';
  }

  function jsonExport(p) {
    var out = { productType: p.key, mode: p.mode, hue: p.hue, saturation: p.saturation, tokens: {}, notes: p.notes };
    TOKENS.forEach(function (t) { out.tokens[t[1].replace('--', '')] = p.tokens[t[0]]; });
    return JSON.stringify(out, null, 2);
  }

  function renderPalDetail(box, p) {
    var tok = TOKENS.map(function (t) {
      var v = p.tokens[t[0]];
      return '<div class="tok-i"><i class="tok-s" style="background:' + (p.css[t[0]] || v) + '"></i>' +
        '<div style="min-width:0"><div class="tok-n">' + t[1] + '</div><div class="tok-v">' + v + '</div></div></div>';
    }).join('');

    var cc = p.checks.map(function (c) {
      var cls = c.level === 'AAA' ? 'is-aaa' : c.level === 'AA' ? 'is-aa' : 'is-bad';
      return '<span class="cc-i ' + cls + '">' + c.label + ' <b>' + c.ratio + ':1</b> ' + c.level + '</span>';
    }).join('');

    box.innerHTML = '<div class="tok">' + tok + '</div><div class="cc">' + cc + '</div>' +
      '<div class="exp">' +
      '<button type="button" class="exp-b" data-exp="css">复制 CSS 变量</button>' +
      '<button type="button" class="exp-b" data-exp="tw">复制 Tailwind</button>' +
      '<button type="button" class="exp-b" data-exp="json">复制 JSON</button>' +
      '</div>' +
      (p.notes ? '<p class="rec-note" style="margin-top:10px">原文备注：' + p.notes + '</p>' : '');

    qsa('[data-exp]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        var kind = b.getAttribute('data-exp');
        var text = kind === 'css' ? cssExport(p) : kind === 'tw' ? twExport(p) : jsonExport(p);
        copy(text).then(function () { flash(b, '已复制'); });
      });
    });
  }

  function setupPals() {
    qsa('.pal').forEach(function (card) {
      var more = qs('[data-more]', card);
      var detail = qs('[data-detail]', card);
      if (!more || !detail) return;
      more.addEventListener('click', function () {
        var open = more.getAttribute('aria-expanded') === 'true';
        if (!open && !detail.getAttribute('data-ready')) {
          var p = getPal(card.getAttribute('data-key'));
          if (p) { renderPalDetail(detail, p); detail.setAttribute('data-ready', '1'); }
        }
        more.setAttribute('aria-expanded', String(!open));
        slide(detail, !open);
        more.textContent = open ? '令牌与导出' : '收起';
      });
    });

    qsa('.sw-b').forEach(function (b) {
      b.addEventListener('click', function () {
        copy(b.getAttribute('data-hex')).then(function () { flash(b, ''); });
      });
    });
  }

  /* ---------------- 通用展开 ---------------- */
  function setupMore() {
    qsa('[data-more]').forEach(function (btn) {
      if (btn.closest('.pal')) return;
      var target = document.getElementById(btn.getAttribute('aria-controls'));
      if (!target) return;
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        slide(target, !open);
        var t = btn.getAttribute('data-t');
        if (!t) { btn.setAttribute('data-t', btn.textContent); t = btn.textContent; }
        btn.textContent = open ? t : '收起';
      });
    });
  }

  /* ---------------- 字体样张控件 ---------------- */
  function setupTypo() {
    var inputs = qsa('[data-typo]');
    if (!inputs.length) return;
    inputs.forEach(function (input) {
      input.addEventListener('input', function () {
        var key = input.getAttribute('data-typo');
        document.documentElement.style.setProperty('--' + key, input.value);
        var out = qs('[data-out="' + key + '"]');
        if (out) out.textContent = Math.round(parseFloat(input.value) * 100) + '%';
      });
    });
  }

  /* ---------------- 配方生成器 ---------------- */
  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  function setupCompose() {
    var root = qs('[data-cz-out]');
    var dataNode = qs('#cz-data');
    if (!root || !dataNode) return;
    var data;
    try { data = JSON.parse(dataNode.textContent); } catch (e) { return; }

    var byKey = {};
    data.recipes.forEach(function (r) { byKey[r.k] = r; });
    var currentKey = null;
    var exportKind = 'css';
    // 图鉴前缀由构建器写入（默认 ../gallery/，可用 SHOWCASE_BASE 覆盖）
    var SB = data.sb || '../gallery/';

    var styleLink = function (s) {
      var label = s.zh || s.name;
      var title = s.zh ? s.name : '';
      return s.id
        ? '<a class="slink" href="' + esc(SB + 'style/' + s.id + '.html') + '" target="_blank" rel="noopener"' + (title ? ' title="' + esc(title) + '"' : '') + '>' + esc(label) + ' <span aria-hidden="true">↗</span></a>'
        : '<span class="slink slink--dead">' + esc(label) + '</span>';
    };
    var landLink = function (l) {
      return l.key
        ? '<a class="slink" href="./landing.html#' + esc(l.key) + '"' + (l.zh ? ' title="' + esc(l.name) + '"' : '') + '>' + esc(l.zh || l.name) + '</a>'
        : '<span class="slink slink--dead">' + esc(l.zh || l.name) + '</span>';
    };

    /* 决策规则的键名 / 值中文化：style:xxx → 风格 · 中文名（可点开） */
    var ruleKey = function (k) {
      return (data.ruleKeys && data.ruleKeys[k]) || String(k).replace(/_/g, ' ');
    };
    var ruleValue = function (v) {
      var s = String(v == null ? '' : v);
      var i = s.indexOf(':');
      if (i < 0) return esc(s);
      var type = s.slice(0, i);
      var slug = s.slice(i + 1);
      var typeZh = (data.ruleTypes && data.ruleTypes[type]) || type;
      if (type === 'style' && data.styles && data.styles[slug]) {
        return '<span class="rule-t">' + esc(typeZh) + '</span><a class="slink" href="' + esc(SB + 'style/' + slug + '.html') + '" target="_blank" rel="noopener">' + esc(data.styles[slug]) + '</a>';
      }
      var label = type === 'mode' ? (slug === 'dark' ? '深色' : slug === 'light' ? '浅色' : slug) : slug.replace(/-/g, ' ');
      return '<span class="rule-t">' + esc(typeZh) + '</span>' + esc(label);
    };
    var pct = function (v) {
      var n = parseFloat(v);
      return isNaN(n) ? String(v) : Math.round(n * 100) + '%';
    };

    function buildExport(r, pal) {
      var tokens = pal ? pal.tokens : {};
      var css = pal ? pal.css : {};
      if (exportKind === 'css') {
        var lines = TOKENS.map(function (t) {
          return '  ' + t[1] + ': ' + (css[t[0]] || tokens[t[0]] || '#000000') + ';';
        });
        return '/* ' + (r.zh ? r.zh + ' · ' : '') + r.t + ' */\n:root{\n' + lines.join('\n') + '\n}';
      }
      if (exportKind === 'tw') {
        var tl = TOKENS.map(function (t) {
          return "      '" + t[1].replace('--', '') + "': '" + (css[t[0]] || tokens[t[0]] || '#000000') + "',";
        });
        return '// tailwind.config.js — ' + (r.zh || r.t) + '\ntheme: {\n  extend: {\n    colors: {\n' + tl.join('\n') + '\n    }\n  }\n}';
      }
      var out = {
        productType: r.t,
        productTypeZh: r.zh || null,
        mode: pal ? pal.mode : null,
        recommendedPattern: r.pt,
        recommendedPatternZh: r.pz || null,
        styles: {
          primary: r.sp.map(function (s) { return s.zh || s.name; }),
          secondary: r.ss.map(function (s) { return s.zh || s.name; }),
        },
        landing: r.lp.map(function (l) { return l.name; }),
        typography: r.fm.map(function (k) { return data.fonts[k] ? data.fonts[k].name : k; }),
        colorFocus: r.cf,
        colorMood: r.cm,
        typographyMood: r.tm,
        keyEffects: r.ke,
        decisionRules: r.ru,
        antiPatterns: r.ap,
        tokens: tokens
      };
      return JSON.stringify(out, null, 2);
    }

    function render(key) {
      var r = byKey[key];
      if (!r) return;
      currentKey = key;
      var pal = r.pk ? data.palettes[r.pk] : null;
      var strip = pal
        ? '<div class="cz-pal">' + ['primary', 'secondary', 'accent', 'background', 'muted', 'card', 'border', 'destructive']
            .map(function (k) { return '<i style="background:' + (pal.css[k] || pal.tokens[k]) + '"></i>'; }).join('') + '</div>'
        : '';
      var tokGrid = pal
        ? '<div class="tok">' + TOKENS.map(function (t) {
            return '<div class="tok-i"><i class="tok-s" style="background:' + (pal.css[t[0]] || pal.tokens[t[0]]) + '"></i>' +
              '<div style="min-width:0"><div class="tok-n">' + t[1] + '</div><div class="tok-v">' + esc(pal.tokens[t[0]]) + '</div></div></div>';
          }).join('') + '</div>'
        : '<p class="rec-note">该类产品没有独立配色行。</p>';

      var rules = r.ru
        ? '<div class="rules">' + Object.keys(r.ru).map(function (k) {
            var list = Array.isArray(r.ru[k]) ? r.ru[k] : [r.ru[k]];
            return '<div class="rule-i"><span class="rule-k">' + esc(ruleKey(k)) + '</span><span class="rule-v">' +
              list.map(ruleValue).join('<span class="rule-dot">·</span>') + '</span></div>';
          }).join('') + '</div>'
        : '<p class="rec-note">该条目没有额外的条件规则。</p>';

      var fonts = r.fm.length
        ? r.fm.map(function (k) {
            var f = data.fonts[k];
            return f ? '<div style="padding:6px 0;border-bottom:1px dashed var(--rule-2)"><a class="slink" href="./pairings.html">' + esc(f.name) + '</a>' +
              '<div class="rec-note" style="margin-top:4px">标题 ' + esc(f.head) + ' · 正文 ' + esc(f.body) + '</div></div>' : '';
          }).join('')
        : '<p class="rec-note">未匹配到字体配对。</p>';

      var out = '<div class="cz-card">' +
        '<div class="cz-top"><p class="cz-kick">产品配方</p><h2 class="cz-title">' + esc(r.zh || r.t) + '</h2>' +
        '<p class="cz-en">' + esc(r.t) + '</p>' +
        '<p class="cz-sub">' + (r.pz ? '推荐模式 · ' + esc(r.pz) : '') + (r.ci ? ' · 置信度 ' + pct(r.ci) : '') + '</p></div>' +

        '<div class="cz-sec"><h3>主推风格</h3><div class="cz-styles">' + (r.sp.map(styleLink).join('') || '<span class="rec-note">—</span>') + '</div>' +
        (r.ss.length ? '<h3 style="margin-top:14px">次选风格</h3><div class="cz-styles">' + r.ss.map(styleLink).join('') + '</div>' : '') + '</div>' +

        '<div class="cz-sec"><h3>配色' + (pal ? ' · ' + (pal.mode === 'dark' ? '深色' : '浅色') : '') + '</h3>' + strip + tokGrid +
        (r.cf ? '<p class="rec-note" style="margin-top:10px"><strong>配色方向</strong><span class="en-badge" title="上游原文，未翻译">原文</span>' + esc(r.cf) + '</p>' : '') + '</div>' +

        '<div class="cz-sec cz-two"><div><h3>字体配对</h3>' + fonts +
        (r.tm ? '<p class="rec-note" style="margin-top:8px">情绪<span class="en-badge" title="上游原文，未翻译">原文</span>' + esc(r.tm) + '</p>' : '') + '</div>' +
        '<div><h3>落地页结构</h3><div class="cz-styles">' +
        (r.lp.length ? r.lp.map(landLink).join('') : '<span class="slink slink--dead">' + esc(r.lz || r.lr || '—') + '</span>') + '</div>' +
        (r.ds && !/^N\/A/i.test(r.ds) ? '<p class="rec-note" style="margin-top:10px"><strong>仪表盘：</strong>' + esc(r.dz || r.ds) + '</p>' : '') +
        (r.co ? '<p class="rec-note" style="margin-top:6px"><strong>关键考量</strong><span class="en-badge" title="上游原文，未翻译">原文</span>' + esc(r.co) + '</p>' : '') + '</div></div>' +

        '<div class="cz-sec"><h3>决策规则</h3>' + rules +
        (r.ap ? '<p class="rec-anti" style="margin-top:10px"><strong>反模式</strong><span class="en-badge" title="上游原文，未翻译">原文</span>' + esc(r.ap) + '</p>' : '') +
        (r.ke ? '<p class="rec-note" style="margin-top:8px"><strong>关键效果</strong><span class="en-badge" title="上游原文，未翻译">原文</span>' + esc(r.ke) + '</p>' : '') +
        '<p class="cz-fine">带「原文」标记的字段保留上游英文，便于对照数据源。</p>' +
        '</div>' +

        '<div class="cz-sec"><h3>导出</h3><div class="cz-export">' +
        '<button type="button" data-kind="css">CSS 变量</button>' +
        '<button type="button" data-kind="tw">Tailwind</button>' +
        '<button type="button" data-kind="json">JSON</button></div>' +
        '<pre class="cz-code" data-cz-code></pre>' +
        '<button type="button" class="cz-copy" data-cz-copy>复制到剪贴板</button></div>' +
        '</div>';

      root.innerHTML = out;

      var code = qs('[data-cz-code]', root);
      var setCode = function () { code.textContent = buildExport(r, pal); };
      qsa('[data-kind]', root).forEach(function (b) {
        b.addEventListener('click', function () {
          qsa('[data-kind]', root).forEach(function (x) { x.classList.remove('is-on'); });
          b.classList.add('is-on');
          exportKind = b.getAttribute('data-kind');
          setCode();
        });
      });
      qs('[data-kind="' + exportKind + '"]', root).classList.add('is-on');
      setCode();

      qs('[data-cz-copy]', root).addEventListener('click', function () {
        copy(code.textContent).then(function () { flash(qs('[data-cz-copy]', root), '已复制'); });
      });

      qsa('.cz-i').forEach(function (b) {
        b.classList.toggle('is-on', b.getAttribute('data-cz-pick') === key);
      });
    }

    qsa('.cz-i').forEach(function (b) {
      b.addEventListener('click', function () {
        render(b.getAttribute('data-cz-pick'));
        if (window.innerWidth < 980 && root.scrollIntoView) {
          root.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    var search = qs('[data-cz-search]');
    if (search) {
      search.addEventListener('input', function () {
        var q = search.value.trim().toLowerCase();
        qsa('.cz-i').forEach(function (b) {
          // data-q 里同时有中文名、英文原名与主推风格中文名
          var hay = (b.getAttribute('data-q') || b.textContent || '').toLowerCase();
          b.hidden = q ? hay.indexOf(q) === -1 : false;
        });
      });
    }

    var hash = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (hash && byKey[hash]) render(hash);
  }

  /* ---------------- 移动端侧栏折叠 ---------------- */
  function setupSide() {
    var det = qs('.side-d');
    if (!det) return;
    // jsdom 等环境没有 matchMedia：保持 details 的默认 open 状态即可
    if (typeof window.matchMedia !== 'function') return;
    var narrow = window.matchMedia('(max-width: 980px)');
    var sync = function () {
      if (narrow.matches) det.open = false;
      else det.open = true;
    };
    sync();
    if (narrow.addEventListener) narrow.addEventListener('change', sync);
  }

  /* ---------------- 页脚构建时间 ---------------- */
  function setupFoot() {
    var el = qs('#foot-build');
    if (el) el.textContent = '生成于 ' + new Date().toISOString().slice(0, 10);
  }

  function boot() {
    setupList();
    setupPals();
    setupMore();
    setupTypo();
    setupCompose();
    setupSide();
    setupFoot();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
