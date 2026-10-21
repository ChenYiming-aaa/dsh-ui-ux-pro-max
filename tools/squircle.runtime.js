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
