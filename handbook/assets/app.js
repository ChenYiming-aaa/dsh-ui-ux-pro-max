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

  /* 顶部域导航的滑动橙线 --------------------------------------------------
     和图鉴那条「全部风格 / 分类 / 阅读指南」的指示线是同一套：量文字宽度、
     用同一条缓动平移。手册七个域是七个文档，换页时浏览器会把这条线从前一页的
     位置补间到新页的位置（View Transition 里它单独成组），所以看起来是滑过去的。 */
  (function () {
    var nav = qs('.nav');
    var ind = nav ? qs('.nav-ind', nav) : null;
    if (!ind) return;
    var links = qsa('.nav-a', nav);
    if (!links.length) return;

    function boxOf(a) {
      // 量「文字 + 计数」的内容宽度，和无脚本时的内嵌下划线一样长
      try {
        var r = document.createRange();
        if (typeof r.getBoundingClientRect !== 'function') throw new Error('no rect');
        r.selectNodeContents(a);
        var b = r.getBoundingClientRect();
        var ab = a.getBoundingClientRect();
        return { x: b.left - ab.left + a.offsetLeft, w: b.width };
      } catch (e) {
        var pad = parseFloat(getComputedStyle(a).paddingLeft) || 0;
        return { x: a.offsetLeft + pad, w: Math.max(0, a.offsetWidth - pad * 2) };
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

    var on = null;
    links.forEach(function (a) { if (a.classList.contains('is-on')) on = a; });
    // 方法与溯源、404 这类页面不属于任何域，就不画线
    if (!on) return;
    place(on, true);
    document.documentElement.classList.add('has-ind');

    // 窄屏时导航是横向滚动的：把当前域滚到可见范围里，别让用户以为「生成器」不存在
    if (nav.scrollWidth > nav.clientWidth + 2) {
      var left = on.offsetLeft - (nav.clientWidth - on.offsetWidth) / 2;
      var max = nav.scrollWidth - nav.clientWidth;
      nav.scrollLeft = Math.max(0, Math.min(max, left));
    }

    function remeasure() { place(on, true); }
    window.addEventListener('resize', remeasure);
    window.addEventListener('load', remeasure);
    // 中文回退字体在不同系统下宽度不同，字体就绪后再量一次
    try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure); } catch (e) {}
  })();

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

    /* 结果变化时用 FLIP 让卡片「走」到新位置：先记旧矩形，改完 hidden / 排序再量一次，
       用 transform 把差值补回去。比整片淡入更像真的在移动。 */
    function layoutMap() {
      var m = new Map();
      items.forEach(function (el) { if (!el.hidden) m.set(el, el.getBoundingClientRect()); });
      return m;
    }

    function flip(before) {
      var vh = window.innerHeight;
      items.forEach(function (el) {
        if (el.hidden || typeof el.animate !== 'function') return;
        var now = el.getBoundingClientRect();
        if (now.bottom < -240 || now.top > vh + 400) return; // 屏幕外不参与，省帧
        var was = before.get(el);
        if (!was) {
          el.animate(
            [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
            { duration: 320, easing: 'cubic-bezier(.22,.61,.36,1)' }
          );
          return;
        }
        var dx = was.left - now.left;
        var dy = was.top - now.top;
        if (!dx && !dy) return;
        // 跨了几屏的位移看不清，硬动反而像在飞：远距离直接淡入落位
        if (Math.abs(dx) > window.innerWidth * 1.2 || Math.abs(dy) > vh * 1.2) {
          el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
          return;
        }
        el.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], {
          duration: 420,
          easing: 'cubic-bezier(.22,.61,.36,1)'
        });
      });
    }

    function apply(animate) {
      var before = animate && !REDUCE ? layoutMap() : null;
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
      if (before) flip(before);
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
        var before = REDUCE ? null : layoutMap();
        sorted.forEach(function (el) { list.appendChild(el); });
        if (before) flip(before);
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
        ? '<a class="slink" href="' + esc(SB + 'style/' + s.id + '.html') + '"' + (title ? ' title="' + esc(title) + '"' : '') + '>' + esc(label) + ' <span aria-hidden="true">↗</span></a>'
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
        return '<span class="rule-t">' + esc(typeZh) + '</span><a class="slink" href="' + esc(SB + 'style/' + slug + '.html') + '">' + esc(data.styles[slug]) + '</a>';
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
      // 写进 hash：跳去图鉴后按后退，仍是同一个产品类型
      if (window.history.replaceState) window.history.replaceState(null, '', '#' + key);
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
