/**
 * 跨站切换动效 —— 风格图鉴 ↔ 设计手册。
 *
 * 两个站是各自独立的 HTML 文档，没有共享的路由层，所以做不了「同一页内」的转场：
 * 这里是「出场 + 入场」两半拼起来的一次擦除（wipe）。
 *
 *   点击另一视图链接
 *     → 当前页：两块纸幕（带同一张 25% 竖网格）从上下合拢，盖上整屏，缝下方浮出一行
 *       「→ 设计手册」，400ms
 *     → 420ms 导航（此时屏幕已被完全盖住，跳转看不见）
 *     → 目标页：首帧就是「合拢」状态（动画的基础态就是位移 0），40ms 后上下分开，560ms
 *     → 首屏内容 16px 上浮就位
 *
 * 与进场动画共用同一套东西：纸色、网格、`cubic-bezier(.76,0,.24,1)`、上下分幕。
 * 唯一的区别是出场 400ms 比入场 560ms 快——出场慢会让人觉得点了没反应。
 *
 * 实现在构建时**追加**到两站的 CSS / JS 里（tools/xnav.mjs 是唯一来源），
 * 所以不新增请求，也不会两边各写一遍慢慢走样。
 */

export const XNAV_ATTR = 'data-xnav';
export const XNAV_KEY = 'ux-xnav';

const MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace';

/** 追加到站点样式表末尾 */
export function xnavCss() {
  return `
/* ==========================================================================
   跨站切换 —— 由 tools/xnav.mjs 在构建时追加，两站同一份实现，勿手改
   ========================================================================== */
.xnav{position:fixed;inset:0;z-index:9500;pointer-events:none;overflow:hidden}
.xnav-p{position:absolute;left:0;right:0;height:calc(50% + 1px);background:var(--paper,#f6f5f1);
  background-image:linear-gradient(90deg,rgba(20,22,26,.07) 0 1px,transparent 1px);
  background-size:25% 100%;will-change:transform;
  transition:transform 360ms var(--itro-e,cubic-bezier(.76,0,.24,1))}
.xnav-p--t{top:0;transform:translateY(-101%)}
.xnav-p--b{bottom:0;transform:translateY(101%);box-shadow:0 -1px 0 rgba(20,22,26,.09);
  transition-delay:24ms}
.xnav.is-on .xnav-p--t,
.xnav.is-on .xnav-p--b{transform:none}
/* 标签挂在下幕上：幕布合拢时它随纸面一起升上来，永远落在纸上，不会浮在正文中间 */
.xnav-l{position:absolute;left:0;right:0;top:24px;text-align:center;opacity:0;
  transform:translateY(8px);white-space:nowrap;
  font:500 11px/1 ${MONO};letter-spacing:.2em;color:var(--accent,#e4501e);
  transition:opacity 160ms ease-out 60ms,transform 300ms var(--itro-e,cubic-bezier(.76,0,.24,1)) 60ms}
.xnav.is-on .xnav-l{opacity:1;transform:none}

/* 到场：目标页首帧就是「幕布合拢」，跳过品牌开场，直接分开露出内容 */
html.xarrive .itro-p--t{animation-delay:40ms}
html.xarrive .itro-p--b{animation-delay:80ms}
html.xarrive .itro-c{display:none}
html.xarrive [data-rise]{animation-delay:80ms}
html.xarrive [data-rise="1"]{animation-delay:130ms}
html.xarrive [data-rise="2"]{animation-delay:180ms}
`;
}

/**
 * 每个页面的 head 都要有：读一次「正在切换」标记，读到就切到到场形态。
 * 必须排在进场脚本之后（它可能已经加了 no-intro，这里要撤掉）。
 */
export function xnavHead() {
  return `<script>(function(){var d=document.documentElement,k='${XNAV_KEY}',go=false;
try{if(sessionStorage.getItem(k)==='1'){go=true;sessionStorage.removeItem(k)}}catch(e){}
if(go){d.classList.remove('no-intro');d.className+=' xarrive'}})()</script>`;
}

/** 追加到站点脚本末尾（defer，执行时 DOM 已就绪） */
export function xnavJs() {
  return `
/* 跨站切换 —— 由 tools/xnav.mjs 在构建时追加，两站同一份实现，勿手改 */
(function () {
  var links = document.querySelectorAll('a[${XNAV_ATTR}]');
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
      try { sessionStorage.setItem('${XNAV_KEY}', '1') } catch (err) {}
      busy = true;
      cover(a.getAttribute('${XNAV_ATTR}'), href);
    });
  });
})();
`;
}
