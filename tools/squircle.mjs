/**
 * 曲率连续圆角（iOS 式 G2 squircle）—— 两站共用，构建时追加
 *
 * 为什么不用 border-radius：它是「直边直接接 1/4 圆弧」（G1 切线连续），
 * 曲率在接点从 0 瞬间跳到 1/R，小圆角 + 细描边时折点肉眼可见。
 * 这里按需求做五段式曲率连续圆角：
 *
 *   直边 → 贝塞尔过渡（曲率 0 → 1/R 缓慢爬升）→ 圆弧平台（曲率恒定，真正的「圆」）
 *        → 贝塞尔过渡（对称回落）→ 直边
 *
 *   - 起弯点 s0 = (1 + 0.45)·R ≈ 1.45R，落在 1.00R–1.49R 区间上部（iOS 观感）；
 *   - 平台段是真圆弧（SVG `a` 命令），不牺牲圆度；四条直边完整保留；
 *   - 两站所有圆角共用同一平滑度，视觉上同源。
 *
 * 实现：运行时按元素实测尺寸生成 SVG path，用 clip-path 应用（不设 border-radius）；
 * 带 1px 描边的元素由叠层重画「顶亮底弱」的连续描边；带投影的元素把 box-shadow
 * 换成外层壳的 drop-shadow（clip-path 会裁掉元素自身的投影，drop-shadow 跟随裁形）。
 * 正圆 / 胶囊、椭圆角 / 手绘风非对称角、内阴影、虚线边框、定位元素带投影等
 * 无法无损处理的场景自动保留原生画法；无 JS 或不支持 clip-path:path() 时整体降级。
 *
 * 算法来源（MIT）：
 *   figma-squircle —— github.com/phamfoo/figma-squircle（Pham Duong）
 *   原始实现 —— github.com/MartinRGB/Figma_Squircles_Approximation（MartinRGB）
 *   几何出处 —— Figma 博客《Desperately Seeking Squircles》
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 全局平滑度：s0 = (1 + SMOOTHNESS)·R。0.45 → 1.45R */
export const SMOOTHNESS = 0.45;

/** 追加到站点样式表末尾 */
export function squircleCss() {
  return `
/* ==========================================================================
   曲率连续圆角 —— 由 tools/squircle.mjs 在构建时追加，两站同一份实现，勿手改
   运行时把统一圆角换成五段式 G2 路径（clip-path 应用）：
   data-sq="clip" 纯裁形；data-sq="stroke" 另有 1px 渐变描边叠层（原 border 透明化）；
   .sq-wrap 承接被 clip-path 裁掉的投影（drop-shadow 跟随裁形轮廓）。
   无 JS / 不支持 clip-path:path() 时以上规则均不生效，保留原生 border-radius。
   ========================================================================== */
[data-sq]{border-radius:0}
[data-sq="stroke"],[data-sq="stroke"]:hover,[data-sq="stroke"]:focus{border-color:transparent !important}
[data-sq]:focus-visible{outline-offset:-2px !important}
.sq-stroke{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;border:0;border-radius:0}
.sq-wrap{display:block}
`;
}

/** 追加到站点脚本末尾（运行时实现见同目录 squircle.runtime.js） */
export function squircleJs() {
  const code = fs.readFileSync(path.join(__dirname, 'squircle.runtime.js'), 'utf8');
  return (
    '/* 曲率连续圆角 —— 由 tools/squircle.mjs 在构建时追加，两站同一份实现，勿手改 */\n' +
    '(function () {\n' + code + '\n})();\n'
  );
}
