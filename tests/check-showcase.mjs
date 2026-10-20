#!/usr/bin/env node
/**
 * check-showcase.mjs — 风格图鉴静态站点检查
 *
 * 图鉴是「数据 → 页面」的派生产物，容易在改数据后忘记重建。本测试校验：
 *   1. 中文元数据与 data/index.json 的风格集合完全对齐
 *   2. 每个特效类都有对应的 CSS 实现（避免静默失效）
 *   3. gallery/ 产物完整：首页、指南、404、88 个风格页
 *   4. 每个详情页包含关键区块，且确实带上了特效类与明暗令牌
 *   5. 纯静态：页面与样式不引用任何外部资源
 *
 * 用法: node tests/check-showcase.mjs
 */

import { existsSync, readFileSync } from 'node:fs'
import { assert, section, finish, readJson, readText, p } from './_harness.mjs'
import { STYLE_META } from '../tools/showcase/theme-data.mjs'
import { xnavCss, xnavJs } from '../tools/xnav.mjs'

const data = readJson('data/index.json')
const styles = data.domains.style
const ids = styles.map((s) => s['Style ID'])
const metaKeys = Object.keys(STYLE_META)

section('1. 中文元数据')
assert(styles.length === 88, `风格数 ${styles.length}`)
assert(ids.every((id) => STYLE_META[id]), '每条风格都有中文名称 / 描述 / 主题')
assert(metaKeys.every((id) => ids.includes(id)), '没有多余的元数据条目')
for (const s of styles) {
  const m = STYLE_META[s['Style ID']]
  assert(!!m.zh && !!m.tag && !!m.desc, `${s['Style ID']} 字段完整`)
  assert([undefined, 'light', 'dark'].includes(m.theme.mode), `${s['Style ID']} 默认模式合法`)
  assert(/^#[0-9a-f]{6}$/i.test(m.theme.accent), `${s['Style ID']} 强调色为 HEX`)
}

section('2. 特效类实现')
const css = readText('tools/showcase/assets/site.css')
const fxUsed = [...new Set(styles.flatMap((s) => STYLE_META[s['Style ID']].theme.fx || []))]
const missing = fxUsed.filter((f) => !css.includes(`.fx-${f}`))
assert(missing.length === 0, `特效类 ${fxUsed.length} 个全部有实现${missing.length ? `（缺 ${missing.join(', ')}）` : ''}`)
assert(!fxUsed.includes('undefined'), '没有未命名的特效类')

section('3. 站点产物')
const pages = ['gallery/index.html', 'gallery/guide.html', 'gallery/404.html', 'gallery/.nojekyll']
assert(pages.every((f) => existsSync(p(f))), '首页 / 指南 / 404 / .nojekyll')
assert(existsSync(p('gallery/assets/site.css')) && existsSync(p('gallery/assets/themes.css')) && existsSync(p('gallery/assets/app.js')), '样式与脚本已产出')
assert(existsSync(p('gallery/assets/favicon.svg')), 'favicon 已产出')

const indexHtml = readText('gallery/index.html')
assert(indexHtml.includes('<meta name="viewport"'), '首页声明 viewport')
assert((indexHtml.match(/data-card/g) || []).length === 88, '首页渲染 88 张卡片')
assert(ids.every((id) => indexHtml.includes(`href="style/${id}.html"`)), '首页链接到全部风格页')

const themesCss = readText('gallery/assets/themes.css')
assert((themesCss.match(/\[data-mode="dark"\]/g) || []).length === 88, '每种风格都有深色令牌')

section('4. 详情页内容')
const missingPages = ids.filter((id) => !existsSync(p('gallery/style', `${id}.html`)))
assert(missingPages.length === 0, `88 个详情页齐全${missingPages.length ? `（缺 ${missingPages.slice(0, 3).join(', ')}）` : ''}`)

const REQUIRED = ['效果示例', '风格描述', '配色方案', '适用场景', '能力矩阵', '实现要点', 'AI 提示词', '相关风格']
const problems = []
for (const s of styles) {
  const id = s['Style ID']
  const file = p('gallery/style', `${id}.html`)
  if (!existsSync(file)) continue
  const html = readFileSync(file, 'utf8')
  const miss = REQUIRED.filter((k) => !html.includes(k))
  if (miss.length) problems.push(`${id}: ${miss.join('/')}`)
  if (!html.includes(`t-${id}`)) problems.push(`${id}: 缺少主题类`)
  if (!html.includes('data-preview')) problems.push(`${id}: 缺少预览挂载点`)
  if (!html.includes(STYLE_META[id].zh)) problems.push(`${id}: 缺少中文名`)
}
assert(problems.length === 0, `${styles.length} 个详情页区块完整${problems.length ? `（${problems.slice(0, 3).join('; ')}）` : ''}`)

section('5. 纯静态与响应式')
const external = []
for (const s of styles) {
  const html = readFileSync(p('gallery/style', `${s['Style ID']}.html`), 'utf8')
  for (const m of html.matchAll(/(?:src|href)="(https?:)?\/\/[^"]+"/g)) {
    if (!/github\.com|nextlevelbuilder/.test(m[0])) external.push(`${s['Style ID']}: ${m[0]}`)
  }
}
assert(external.length === 0, `详情页不加载外部资源${external.length ? `（${external.slice(0, 3).join('; ')}）` : ''}`)
assert(!/@import|url\(\s*['"]?https?:/.test(css), '样式表无外部 @import / 远程资源')
assert((css.match(/@media/g) || []).length >= 4, '样式表包含响应式断点')
assert(css.includes('prefers-reduced-motion'), '尊重减少动效偏好')
assert(indexHtml.includes('aria-label') && indexHtml.includes('<nav'), '包含基础语义与无障碍标注')

section('6. 另一视图入口（设计手册）')
assert(indexHtml.includes('class="xbar"') && indexHtml.includes('href="../handbook/"'), '首页有指向设计手册的横幅')
assert(indexHtml.includes('class="nav-x"'), '导航里有常驻的手册入口')
for (const f of ['gallery/index.html', 'gallery/guide.html']) {
  assert(readText(f).includes('href="../handbook/"'), `${f.split('/')[1]} 的入口用 ../handbook/（同级目录）`)
}
const badDepth = styles.filter((s) => !readFileSync(p('gallery/style', `${s['Style ID']}.html`), 'utf8').includes('href="../../handbook/"'))
assert(badDepth.length === 0, `88 个详情页的入口都是 ../../handbook/${badDepth.length ? `（${badDepth.length} 页写错）` : ''}`)
// 反向检查：不能出现 `handbook/` 这种根级相对路径，它会落到 gallery/handbook/ 上（这正是「点进去 404」的成因）
const wrongRel = ['gallery/index.html', 'gallery/guide.html', ...styles.map((s) => `gallery/style/${s['Style ID']}.html`)].filter((f) =>
  /href="handbook\//.test(readFileSync(p(f), 'utf8')),
)
assert(wrongRel.length === 0, wrongRel.length ? `这些页面用了错误的 handbook/ 相对路径: ${wrongRel.slice(0, 3).join(', ')}` : '没有指向 gallery/handbook/ 的错误路径')

section('7. 进站过场（入口页）')
assert(indexHtml.includes('id="itro"') && indexHtml.includes('class="itro-p itro-p--t"'), '首页有过场覆盖层与上下两块幕布')
assert(indexHtml.includes("sessionStorage.getItem('ux-intro')"), '过场在 head 里做会话级跳过判定')
assert(indexHtml.includes('prefers-reduced-motion'), '尊重「减弱动效」设置')
assert(/\.itro-ch\{[^}]*overflow:hidden/.test(indexHtml), '站名逐字从遮罩后升起')
assert(indexHtml.includes('@keyframes itroUp') && indexHtml.includes('@keyframes itroDown'), '上下幕布各自位移')
assert(indexHtml.includes('data-rise'), '首屏内容带入场位移')
const leaked = ['gallery/guide.html', 'gallery/404.html', ...[...styles].slice(0, 6).map((s) => `gallery/style/${s['Style ID']}.html`)].filter(
  (f) => readFileSync(p(f), 'utf8').includes('id="itro"'),
)
assert(leaked.length === 0, leaked.length ? `过场不该出现在非入口页: ${leaked.join(', ')}` : '其它页面没有过场，纯二次加载不重复播')
// 站根跳转页：只留一张与过场首帧同色的纸，不再有「正在进入…」这种过场文字
const gate = readText('index.html')
assert(/http-equiv="refresh"/.test(gate) && /url=gallery\/index\.html/.test(gate), '根入口仍然自动跳转')
assert(!/<(p|h1|h2|span class="box")[ >]/.test(gate), '根入口不再显示任何过场文字')

section('8. 跨站切换动效（图鉴 → 手册）')
// 两站的切换动效共用 tools/xnav.mjs，构建时追加到产物末尾；这里直接比对源码，防止两边慢慢走样
assert(readText('gallery/assets/site.css').endsWith(xnavCss()), '样式表末尾追加的切换动效与 tools/xnav.mjs 完全一致')
assert(readText('gallery/assets/app.js').endsWith(xnavJs()), '脚本末尾追加的切换逻辑与 tools/xnav.mjs 完全一致')
const xnavCssText = readText('gallery/assets/site.css')
assert(/html\.xarrive \.itro-p--t\{animation-delay:40ms\}/.test(xnavCssText), '到场形态：两块纸幕首帧即为合拢态')
assert(/html\.xarrive \.itro-c\{display:none\}/.test(xnavCssText), '到场形态跳过品牌开场，只播开合')
assert(/\.xnav-l\{[^}]*top:24px/.test(xnavCssText), '目的地标签挂在下幕上，随纸面升起')
const marks = (f) => [...readFileSync(p(f), 'utf8').matchAll(/data-xnav="([^"]+)"/g)].map((m) => m[1])
const homeMarks = marks('gallery/index.html')
assert(homeMarks.length === 3 && homeMarks.every((x) => x === '设计手册'), '首页三处入口（导航 / 横幅 / 页脚）都带切换标记')
assert(marks(`gallery/style/${styles[0]['Style ID']}.html`).length === 2, '详情页两处入口（导航 / 页脚）都带切换标记')
const noFlag = ['gallery/index.html', 'gallery/guide.html', `gallery/style/${styles[0]['Style ID']}.html`, 'gallery/404.html'].filter(
  (f) => !readFileSync(p(f), 'utf8').includes("sessionStorage.getItem(k)==='1'"),
)
assert(noFlag.length === 0, noFlag.length ? `这些页面缺到场判定: ${noFlag.join(', ')}` : '每个页面都在 head 里做到场判定')

finish('✅ 风格图鉴站点结构与数据一致。')
