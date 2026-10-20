/**
 * 进站过场 —— 两个入口页共用的一段动效。
 *
 * 为什么不用现成方案：GSAP / barba.js / swup 都能做过场，但前者是 ~70KB 的运行时，
 * 后两者要把站点改成「fetch + 替换 DOM」的 SPA 路由，等于放弃纯静态首屏。
 * 这里只需要「一次入场」，全部交给 CSS 动画（只动 transform / opacity / clip-path），
 * 体积 3KB 内联、零请求、禁 JS 也能自己跑完，比引依赖更省。
 *
 * 时间轴（桌面 1.45s，移动端 ×0.8 ≈ 1.16s；每个页面每次会话只播一次）：
 *   0.00  纸面 + 竖向发丝网格就位（与站点根跳转页同一张底色，衔接无闪烁）
 *   0.00  四格标记从四角向中心合拢
 *   0.12  站名字符逐个从遮罩后升起
 *   0.24  眉标淡入
 *   0.42  橙色细线自左向右拉出
 *   0.54  数据行擦除显现
 *   0.78  中心内容上浮淡出
 *   0.85  上下纸幕分别向上 / 向下分开，露出正文
 *   0.98  首屏内容上浮就位（错峰 70ms）
 */

export const INTRO_KEY = 'ux-intro';

const MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace';

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * head 里的跳过判定，必须在首帧之前执行：
 * 同一会话已看过、或系统开了「减弱动效」，就直接给 <html> 打 no-intro，避免闪一下再消失。
 */
export function introHead() {
  return `<script>(function(){var d=document.documentElement,s=false;try{s=sessionStorage.getItem('${INTRO_KEY}')==='1'}catch(e){}
try{s=s||window.matchMedia('(prefers-reduced-motion:reduce)').matches}catch(e){}
if(s)d.className+=' no-intro'})()</script>`;
}

export function introCss() {
  return `<style>
:root{--itro-k:1;--itro-e:cubic-bezier(.76,0,.24,1);--itro-e2:cubic-bezier(.16,1,.3,1);
  --itro-paper:var(--paper,#f6f5f1);--itro-ink:var(--ink,#14161a);--itro-acc:var(--accent,#e4501e)}
@media (max-width:760px){:root{--itro-k:.8}}
.itro{position:fixed;inset:0;z-index:9000;pointer-events:none}
.itro-p{position:absolute;left:0;right:0;background:var(--itro-paper);
  background-image:linear-gradient(90deg,rgba(20,22,26,.07) 0 1px,transparent 1px);
  background-size:25% 100%;will-change:transform;
  animation-duration:calc(560ms*var(--itro-k));animation-timing-function:var(--itro-e);
  animation-fill-mode:forwards}
.itro-p--t{top:0;height:calc(50% + 1px);box-shadow:0 1px 0 rgba(20,22,26,.09);
  animation-name:itroUp;animation-delay:calc(850ms*var(--itro-k))}
.itro-p--b{bottom:0;height:calc(50% + 1px);animation-name:itroDown;
  animation-delay:calc(890ms*var(--itro-k))}
.itro-c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:24px;text-align:center;
  animation-name:itroOff;animation-duration:calc(200ms*var(--itro-k));
  animation-delay:calc(780ms*var(--itro-k));animation-timing-function:ease-in;animation-fill-mode:forwards}
.itro-mark{display:grid;grid-template-columns:1fr 1fr;gap:3px;width:38px;height:38px;padding:3px;
  background:var(--itro-ink);border-radius:9px;margin-bottom:28px}
.itro-mark i{display:block;border-radius:1px;background:var(--itro-acc);
  animation-name:itroTile;animation-duration:calc(380ms*var(--itro-k));
  animation-delay:calc(var(--i)*45ms*var(--itro-k));animation-timing-function:var(--itro-e2);
  animation-fill-mode:both}
.itro-mark i:nth-child(1){--i:0;--tx:-11px;--ty:-11px;background:var(--itro-acc)}
.itro-mark i:nth-child(2){--i:1;--tx:11px;--ty:-11px;background:var(--itro-paper)}
.itro-mark i:nth-child(3){--i:2;--tx:-11px;--ty:11px;background:#8a8f98}
.itro-mark i:nth-child(4){--i:3;--tx:11px;--ty:11px;background:var(--itro-acc)}
.itro-eyebrow{margin:0 0 16px;font:500 11px/1 ${MONO};letter-spacing:.2em;text-transform:uppercase;
  color:var(--itro-acc);
  animation-name:itroFade;animation-duration:calc(300ms*var(--itro-k));
  animation-delay:calc(240ms*var(--itro-k));animation-timing-function:ease-out;animation-fill-mode:both}
.itro-name{display:flex;flex-wrap:wrap;justify-content:center;margin:0;color:var(--itro-ink);
  font-size:clamp(30px,5.6vw,54px);font-weight:600;letter-spacing:-.035em;line-height:1.04}
.itro-ch{display:inline-block;overflow:hidden;vertical-align:top}
.itro-ch i{display:inline-block;font-style:normal;
  animation-name:itroRise;animation-duration:calc(460ms*var(--itro-k));
  animation-delay:calc((120ms + var(--i)*16ms)*var(--itro-k));animation-timing-function:var(--itro-e2);
  animation-fill-mode:both}
.itro-rule{display:block;width:min(300px,46vw);height:2px;margin:30px 0 18px;background:var(--itro-acc);
  transform-origin:left center;animation-name:itroRule;animation-duration:calc(380ms*var(--itro-k));
  animation-delay:calc(420ms*var(--itro-k));animation-timing-function:var(--itro-e2);animation-fill-mode:both}
.itro-meta{margin:0;font:400 12px/1.6 ${MONO};letter-spacing:.04em;color:var(--itro-ink);opacity:.72;
  animation-name:itroWipe;animation-duration:calc(320ms*var(--itro-k));
  animation-delay:calc(540ms*var(--itro-k));animation-timing-function:ease-out;animation-fill-mode:both}
@keyframes itroUp{to{transform:translateY(-101%)}}
@keyframes itroDown{to{transform:translateY(101%)}}
@keyframes itroOff{to{opacity:0;transform:translateY(-10px)}}
@keyframes itroTile{from{transform:translate(var(--tx),var(--ty)) scale(.4);opacity:0}to{transform:none;opacity:1}}
@keyframes itroRise{from{transform:translateY(112%)}to{transform:none}}
@keyframes itroRule{from{transform:scaleX(0)}to{transform:none}}
@keyframes itroFade{from{opacity:0;transform:translateY(9px)}}
@keyframes itroWipe{from{opacity:0;clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
[data-rise]{animation-name:itroIn;animation-duration:calc(520ms*var(--itro-k));
  animation-delay:calc(980ms*var(--itro-k));animation-timing-function:var(--itro-e2);animation-fill-mode:both}
[data-rise="1"]{animation-delay:calc(1050ms*var(--itro-k))}
[data-rise="2"]{animation-delay:calc(1120ms*var(--itro-k))}
/* 正文只用位移、不改透明度：幕布拉开时下面是「已经长好的页面」，只是还在缓缓就位。
   如果这里同时淡入，拉开瞬间会看到半透明的文字，反而像没加载完。 */
@keyframes itroIn{from{transform:translateY(16px)}}
.no-intro .itro{display:none}
.no-intro [data-rise]{animation:none}
@media (prefers-reduced-motion:reduce){
  .itro{display:none}
  [data-rise]{animation:none}
}
@media (max-width:520px){
  .itro-meta{display:none}
  .itro-rule{margin:20px 0 0}
  .itro-mark{width:32px;height:32px;margin-bottom:22px}
}
</style>`;
}

/**
 * 过场 DOM + 收尾脚本。
 * @param {{eyebrow:string, meta:string, name?:string}} o
 */
export function introMarkup({ eyebrow, meta, name = 'UI/UX Pro Max' }) {
  const chars = [...name]
    .map((ch, i) => `<span class="itro-ch"><i style="--i:${i}">${ch === ' ' ? '&nbsp;' : esc(ch)}</i></span>`)
    .join('');

  return `<div class="itro" id="itro" aria-hidden="true">
  <div class="itro-p itro-p--t"></div>
  <div class="itro-p itro-p--b"></div>
  <div class="itro-c">
    <span class="itro-mark"><i></i><i></i><i></i><i></i></span>
    <p class="itro-eyebrow">${esc(eyebrow)}</p>
    <p class="itro-name">${chars}</p>
    <span class="itro-rule"></span>
    <p class="itro-meta">${esc(meta)}</p>
  </div>
</div>
<script>(function(){var el=document.getElementById('itro');if(!el)return;
if(window.getComputedStyle(el).display==='none'){el.remove();return}
try{sessionStorage.setItem('${INTRO_KEY}','1')}catch(e){}
/* animationend 会从子元素冒泡，只认最后一块幕布（下幕）的结束，否则标记格播完就会误删整层 */
el.addEventListener('animationend',function(e){if(e.target.className.indexOf('itro-p--b')>-1)el.remove()});
setTimeout(function(){el.remove()},2600)})()</script>`;
}
