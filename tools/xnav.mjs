/**
 * 页面切换动效（两站共用）
 *
 * 1) 站内换页（配色 → 字体 → 图表…）用浏览器原生的跨文档 View Transition：
 *    新内容从 28px 外滑就位、旧内容反向退场，页头与导航指示线单独成组、原地不动。
 *    没有遮罩、没有第二个 DOM 树，是内容本体的平滑位移；不支持的浏览器直接换页。
 *    与「全部风格 → 分类」那条滑动指示线同一套缓动，方向也跟随导航顺序。
 * 2) 跨站（图鉴 ↔ 手册）仍是一次纸幕擦除——两个站是两套完全不同的外壳，
 *    这里需要一次「换场」，而不是内容滑动。
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

/* 站内换页：跨文档 View Transition，让「内容本体」自己挪一小段，不铺任何遮罩。
   位移只有 28px、再加淡入淡出，所以看起来是「换了一块」而不是「翻了一页」；
   方向由导航顺序决定：往后跳，新内容从右侧 28px 滑入、旧内容往左退；往回跳则相反。
   两段共用一条缓动（cubic-bezier(.22,.61,.36,1)，与列表换位、指示线同一套）。
   页头整块命名 → 原地不动，只有内容在动。
   没有方向信息时（页脚链接、浏览器前进后退）退化为轻上浮。 */
::view-transition-old(root){animation:vtOutY 170ms cubic-bezier(.4,0,.2,1) both}
::view-transition-new(root){animation:vtInY 340ms cubic-bezier(.22,.61,.36,1) both}
html[data-vtdir="fwd"]::view-transition-old(root){animation:vtOutX 170ms cubic-bezier(.4,0,.2,1) both}
html[data-vtdir="fwd"]::view-transition-new(root){animation:vtInRight 340ms cubic-bezier(.22,.61,.36,1) both}
html[data-vtdir="back"]::view-transition-old(root){animation:vtOutRight 170ms cubic-bezier(.4,0,.2,1) both}
html[data-vtdir="back"]::view-transition-new(root){animation:vtInX 340ms cubic-bezier(.22,.61,.36,1) both}
@keyframes vtOutY{to{opacity:0;transform:translateY(-8px)}}
@keyframes vtInY{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes vtOutX{to{opacity:0;transform:translateX(-22px)}}
@keyframes vtOutRight{to{opacity:0;transform:translateX(22px)}}
@keyframes vtInRight{from{opacity:0;transform:translateX(22px)}to{opacity:1;transform:none}}
@keyframes vtInX{from{opacity:0;transform:translateX(-22px)}to{opacity:1;transform:none}}
.top,.site-head{view-transition-name:site-head}
@media (prefers-reduced-motion:reduce){
  ::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none !important}
}
`;
}

/**
 * 每个页面的 head 都要有：读一次「正在切换」标记，读到就切到到场形态。
 * 必须排在进场脚本之后（它可能已经加了 no-intro，这里要撤掉）。
 */
export function xnavHead() {
  return `<style id="vt-optin">@view-transition{navigation:auto}</style>
<script>(function(){var d=document.documentElement,k='${XNAV_KEY}',go=false,dir='';
try{if(sessionStorage.getItem(k)==='1'){go=true;sessionStorage.removeItem(k)}dir=sessionStorage.getItem('ux-vtdir')||'';sessionStorage.removeItem('ux-vtdir')}catch(e){}
if(dir==='fwd'||dir==='back')d.setAttribute('data-vtdir',dir);
if(go){d.classList.remove('no-intro');d.className+=' xarrive'}})()</script>`;
}

/** 追加到站点脚本末尾（defer，执行时 DOM 已就绪） */
export function xnavJs() {
  return `
/* 跨站切换 —— 由 tools/xnav.mjs 在构建时追加，两站同一份实现，勿手改 */
(function () {
  var links = document.querySelectorAll('a[${XNAV_ATTR}]');
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

  /* 站内翻页前先记下方向：当前高亮项在导航里的位置 vs 被点项的位置。
     两站每页都是同一份导航，顺序一致，所以这个比较在两个方向上都会正确。 */
  var navBar = document.querySelector('.nav, .top .nav, .site-head .nav');
  if (navBar) document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || !navBar.contains(a) || a.hasAttribute('${XNAV_ATTR}')) return;
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
      try { sessionStorage.setItem('${XNAV_KEY}', '1') } catch (err) {}
      // 跨站是「换场」，不要叠加站内的 View Transition
      var opt = document.getElementById('vt-optin');
      if (opt && opt.parentNode) opt.parentNode.removeChild(opt);
      busy = true;
      cover(a.getAttribute('${XNAV_ATTR}'), href);
    });
  });

})();
`;
}
