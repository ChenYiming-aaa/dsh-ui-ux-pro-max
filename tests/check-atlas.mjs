#!/usr/bin/env node
/**
 * check-atlas.mjs — 设计手册（handbook/，独立站点）检查
 *
 * 手册是「六个域 → 十个页面」的派生产物，最容易出的问题是：
 *   数据改了页面没重建、字体文件没跟上、站内链接写成了依赖图鉴目录的相对路径。
 *   手册是独立站点，除「风格图鉴」的绝对 URL 外不应有任何站外依赖。
 * 本测试覆盖：
 *   1. 产物完整性与数据规模一致
 *   2. 配色卡：16 个色板、真实 UI 令牌、对比度标注
 *   3. 字体卡：本地字体文件与 @font-face 一一对应
 *   4. 图表 / 落地页 / 规范：结构件齐全
 *   5. 独立站自洽：站内链接全部落在 handbook/ 内，出站链接走绝对 URL
 *   6. 纯静态：不加载任何外部资源
 *   7. 响应式与无障碍标记
 *   8. 生成器内联数据完整
 *   9. 交互（jsdom 可用时）：筛选、展开、生成器渲染
 *
 * 用法: node tests/check-atlas.mjs
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { assert, section, finish, readJson, readText, p } from './_harness.mjs'
import { xnavCss, xnavJs } from '../tools/xnav.mjs'
import { squircleCss, squircleJs } from '../tools/squircle.mjs'

const ATLAS = p('handbook')
const pages = ['index.html', 'palettes.html', 'pairings.html', 'charts.html', 'landing.html', 'practices.html', 'recipes.html', 'compose.html', 'about.html', '404.html']
const html = (name) => readText(`handbook/${name}`)
const data = readJson('data/index.json')
const SHOWCASE = 'https://chenyiming-aaa.github.io/dsh-ui-ux-pro-max/'

section('1. 产物完整性')
assert(existsSync(ATLAS), 'handbook/ 存在')
const missing = pages.filter((f) => !existsSync(p('handbook', f)))
assert(missing.length === 0, missing.length ? `缺少页面: ${missing.join(', ')}` : `10 个页面齐全`)
for (const f of ['assets/atlas.css', 'assets/app.js', 'assets/fonts.css', 'assets/favicon.svg']) {
  assert(existsSync(p('handbook', f)), `${f} 存在`)
}
const stack = readText('data/index.json').length > 0

section('2. 数据规模一致')
const counts = {
  palettes: data.domains.color.length,
  pairings: data.domains.typography.length,
  recipes: data.domains.product.length,
  charts: data.domains.chart.length,
  landings: data.domains.landing.length,
  practices: data.domains.ux.length + data.domains.react.length + data.domains.web.length,
}
assert(counts.palettes === 192 && counts.pairings === 74 && counts.recipes === 192, `配色 ${counts.palettes} / 字体 ${counts.pairings} / 配方 ${counts.recipes}`)
assert(counts.charts === 25 && counts.landings === 34, `图表 ${counts.charts} / 落地页 ${counts.landings}`)
assert(counts.practices === 195, `规范 ${counts.practices}`)

section('3. 配色卡')
const palHtml = html('palettes.html')
const palCards = (palHtml.match(/<article class="pal"/g) || []).length
assert(palCards === counts.palettes, `配色卡 ${palCards} 张`)
const swatches = palHtml.match(/class="sw-b"/g) || []
assert(swatches.length === counts.palettes * 16, `色板 ${swatches.length} 个（每套 16）`)
const uiz = palHtml.match(/class="uiz"/g) || []
assert(uiz.length === counts.palettes, `真实 UI 小样 ${uiz.length} 个`)
assert(/--c-primary:/.test(palHtml) && /--c-on-primary:/.test(palHtml), 'UI 小样注入了语义令牌变量')
assert(/全部达 AA|项未达 AA/.test(palHtml), '标注了对比度结论')
const palJsonMatch = palHtml.match(/<script type="application\/json" id="pal-data">([\s\S]*?)<\/script>/)
assert(Boolean(palJsonMatch), '内联了配色数据 JSON')
let palJson = []
try {
  palJson = JSON.parse(palJsonMatch[1])
} catch {
  palJson = []
}
assert(palJson.length === counts.palettes, `配色 JSON ${palJson.length} 条`)
const badToken = palJson.filter((x) => Object.keys(x.tokens).length !== 16)
assert(badToken.length === 0, badToken.length ? `${badToken.length} 套令牌数不是 16` : '每套恰好 16 个令牌')

section('4. 字体卡与本地字体')
const pairHtml = html('pairings.html')
const pairCards = (pairHtml.match(/<article class="pair"/g) || []).length
assert(pairCards === counts.pairings, `字体卡 ${pairCards} 张`)
assert(/--f-head:/.test(pairHtml) && /--f-body:/.test(pairHtml), '样张绑定了标题 / 正文字体变量')
const fontsCss = readText('handbook/assets/fonts.css')
const faces = fontsCss.match(/@font-face\{/g) || []
assert(faces.length > 80, `@font-face ${faces.length} 条`)
assert(!/url\(\s*['"]?https?:/.test(fontsCss), '字体样式不含远程 URL')
const fontFiles = fontsCss.match(/\.\.\/fonts\/([a-z0-9-]+\.woff2)/g) || []
const uniqueFiles = [...new Set(fontFiles.map((f) => f.replace('../fonts/', '')))]
const missingFonts = uniqueFiles.filter((f) => !existsSync(p('handbook', 'fonts', f)))
assert(missingFonts.length === 0, missingFonts.length ? `缺少字体文件: ${missingFonts.slice(0, 5).join(', ')}` : `${uniqueFiles.length} 个字体文件全部存在`)
const usedFamilies = new Set()
for (const m of pairHtml.matchAll(/--f-head:'([^']+)';--f-body:'([^']+)'/g)) {
  usedFamilies.add(m[1])
  usedFamilies.add(m[2])
}
const declared = new Set([...fontsCss.matchAll(/font-family:'([^']+)'/g)].map((m) => m[1]))
const notDeclared = [...usedFamilies].filter((f) => !declared.has(f))
assert(notDeclared.length === 0, notDeclared.length ? `未声明 @font-face: ${notDeclared.join(', ')}` : `${usedFamilies.size} 个字族全部已本地声明`)

// 样张微调：字重按实际档位、字号 / 字距按字族给，避免「极宽展示体撑破卡片」「单字重字体合成粗体」
const pairStyles = [...pairHtml.matchAll(/<article class="pair"[^>]*style="([^"]*)"/g)].map((m) => m[1])
assert(pairStyles.length === counts.pairings, `样张变量 ${pairStyles.length} 组`)
assert(pairStyles.every((v) => v.includes("--f-head:'") && v.includes('--fw-head:')), '每张样张都带字体栈与字重变量')
assert(pairStyles.every((v) => /--f-k:[\d.]+/.test(v)), '每张样张都带字号系数')
const bebas = pairStyles.filter((v) => v.includes("Bebas Neue"))
assert(bebas.length > 0 && bebas.every((v) => v.includes('--fw-head:400')), '单字重字体（Bebas Neue）不再硬上 600')
const pixel = pairStyles.filter((v) => v.includes("'Press Start 2P'"))
assert(pixel.length > 0 && pixel.every((v) => /--f-k:0\.[0-6]/.test(v)), '极宽展示体（Press Start 2P）压到 0.6 以下')
assert(!/class="pair-sub"/.test(pairHtml), '样张不再堆副标题（一段标题 + 一段正文）')
const multiTag = (pairHtml.match(/多语种/g) || []).length
assert(multiTag >= 7, `多语种配对带标记（${multiTag} 处）`)
const catZhTags = [...pairHtml.matchAll(/<span class="tag">([^<]*)<\/span>/g)].map((m) => m[1]).filter((t) => /[\u4e00-\u9fa5]/.test(t))
assert(catZhTags.length >= counts.pairings, `组合类型已中文化（${catZhTags.length} 个中文标签）`)

section('5. 图表 / 落地页 / 规范')
const chHtml = html('charts.html')
assert((chHtml.match(/<article class="ch"/g) || []).length === counts.charts, `图表卡 ${counts.charts} 张`)
assert((chHtml.match(/<svg viewBox="0 0 120 80"/g) || []).length === counts.charts, `每张卡都有 SVG 示意`)
assert(/风险 低|风险 高|风险 视情况/.test(chHtml), '风险等级已中文化')
assert((chHtml.match(/class="ch-note"/g) || []).length === counts.charts, '每张卡都有中文摘要')

const ldHtml = html('landing.html')
assert((ldHtml.match(/<article class="ld"/g) || []).length === counts.landings, `落地页卡 ${counts.landings} 张`)
const wireBlocks = (ldHtml.match(/class="wire-s /g) || []).length
const expectedBlocks = data.domains.landing.reduce((a, r) => a + String(r['Section Order']).split('>').filter((s) => s.trim()).length, 0)
assert(wireBlocks === expectedBlocks, `线框区块 ${wireBlocks} 个 = 数据区块 ${expectedBlocks}`)
assert(/wire-s--cta/.test(ldHtml), 'CTA 区块有独立样式')

const prHtml = html('practices.html')
assert((prHtml.match(/<article class="pr"/g) || []).length === counts.practices, `规范卡 ${counts.practices} 条`)
assert((prHtml.match(/class="pr-c pr-c--good"/g) || []).length === counts.practices, '每条都有「应该」列')
assert((prHtml.match(/class="pr-c pr-c--bad"/g) || []).length === counts.practices, '每条都有「不要」列')

section('6. 配方与外链（图鉴是唯一的出站目标）')
const reHtml = html('recipes.html')
assert((reHtml.match(/<article class="rec"/g) || []).length === counts.recipes, `配方卡 ${counts.recipes} 条`)
const styleLinks = [...new Set([...reHtml.matchAll(/\/style\/([a-z0-9-]+)\.html/g)].map((m) => m[1]))]
assert(styleLinks.length >= 40, `引用 ${styleLinks.length} 个风格详情页`)
if (existsSync(p('gallery', 'style'))) {
  const deadStyle = styleLinks.filter((id) => !existsSync(p('gallery', 'style', `${id}.html`)))
  assert(deadStyle.length === 0, deadStyle.length ? `悬空的风格链接: ${deadStyle.slice(0, 5).join(', ')}` : '全部风格链接在图鉴产物中可达')
} else {
  console.log('  ⏭  未构建图鉴产物，跳过外链可达检查（手册可独立构建）')
}
const landLinks = [...new Set([...reHtml.matchAll(/landing\.html#([a-z0-9-]+)/g)].map((m) => m[1]))]
const deadLand = landLinks.filter((k) => !ldHtml.includes(`id="${k}"`))
assert(deadLand.length === 0, deadLand.length ? `悬空的落地页锚点: ${deadLand.slice(0, 5).join(', ')}` : `${landLinks.length} 个落地页锚点全部存在`)

section('6b. 站内自洽（唯一的出站方向是图鉴）')
// 允许的出站：图鉴首页与风格详情页。其余一律必须是 ./ 站内链接。
const OUTBOUND = /^\.\.\/gallery\/(index\.html|style\/[a-z0-9-]+\.html)$/
const relatives = new Set()
const outbounds = new Set()
const illegal = []
for (const f of pages) {
  const src = html(f)
  for (const m of src.matchAll(/(?:href|src)="(\.\.\/[^"]*)"/g)) {
    if (OUTBOUND.test(m[1])) outbounds.add(m[1])
    else illegal.push(`${f} → ${m[1]}`)
  }
  for (const m of src.matchAll(/(?:href|src)="\.\/([^"#:?]+)(?:[#?][^"]*)?"/g)) relatives.add(m[1])
}
assert(illegal.length === 0, illegal.length ? `出现计划外的跨目录引用: ${illegal.slice(0, 3).join(', ')}` : '没有计划外的跨目录引用')
const deadRel = [...relatives].filter((r) => !existsSync(p('handbook', r)))
assert(deadRel.length === 0, deadRel.length ? `站内相对链接指向不存在的文件: ${deadRel.slice(0, 5).join(', ')}` : `${relatives.size} 个站内相对链接全部可达`)
const noEntry = pages.filter((f) => !/href="\.\.\/gallery\/index\.html"/.test(html(f)))
assert(noEntry.length === 0, noEntry.length ? `这些页面缺回图鉴的入口: ${noEntry.join(', ')}` : '10 页都能一键回到图鉴')
assert(!pages.some((f) => /href="\/[^/]/.test(html(f))), '没有以 / 开头的绝对路径（可部署到任意子路径）')

section('7. 纯静态与响应式')
const external = []
for (const f of pages) {
  const src = html(f)
  // 只检查真正会被加载的资源：link/script 标签、style 块、元素 style 属性。
  // <code> 里展示的 @import 示例不算加载。
  const styleAttrs = (src.match(/style="[^"]*"/g) || []).join(' ')
  const styleBlocks = (src.match(/<style[\s\S]*?<\/style>/g) || []).join(' ')
  const bad = [
    ...(src.match(/<link[^>]+href="https?:/g) || []),
    ...(src.match(/<script[^>]+src="https?:/g) || []),
    ...(styleAttrs.match(/url\(\s*['"]?https?:/g) || []),
    ...(styleBlocks.match(/url\(\s*['"]?https?:/g) || []),
    ...(styleBlocks.match(/@import\s+url\(\s*['"]?https?:/g) || []),
  ]
  if (bad.length) external.push(`${f}: ${bad[0]}`)
}
assert(external.length === 0, external.length ? `外部资源引用: ${external.join(' | ')}` : '页面不加载任何外部资源')
const css = readText('handbook/assets/atlas.css')
assert((css.match(/@media/g) || []).length >= 4, `响应式断点 ${(css.match(/@media/g) || []).length} 个`)
assert(/prefers-reduced-motion/.test(css), '尊重减少动效偏好')
assert(/\[hidden\]\{display:none/.test(css), 'hidden 属性被强制生效')

section('8. 无障碍标记')
for (const f of ['index.html', 'palettes.html', 'pairings.html', 'charts.html', 'landing.html', 'practices.html', 'recipes.html', 'compose.html']) {
  const src = html(f)
  assert(/<html lang="zh-CN"[^>]*>/.test(src) && src.includes('id="vt-optin"'), `${f} 声明 lang 并启用站内换页动效`)
  assert(/class="skip"/.test(src) && /<main class="main" id="main"/.test(src), `${f} 具备跳转链接 / main`)
}
assert(/aria-expanded="false"/.test(palHtml) && /aria-controls="d-/.test(palHtml), '展开按钮有无障碍状态')

section('9. 生成器数据')
const czHtml = html('compose.html')
const czMatch = czHtml.match(/<script type="application\/json" id="cz-data">([\s\S]*?)<\/script>/)
assert(Boolean(czMatch), '内联了生成器数据')
let cz = null
try {
  cz = JSON.parse(czMatch[1])
} catch {
  cz = null
}
assert(Boolean(cz), '生成器数据可解析为 JSON')
if (cz) {
  assert(cz.recipes.length === counts.recipes, `生成器收录 ${cz.recipes.length} 类产品`)
  assert(Object.keys(cz.palettes).length === counts.palettes, `配色字典 ${Object.keys(cz.palettes).length} 套`)
  assert(Object.keys(cz.fonts).length === counts.pairings, `字体字典 ${Object.keys(cz.fonts).length} 组`)
  const noStyle = cz.recipes.filter((r) => !r.sp.length)
  assert(noStyle.length === 0, noStyle.length ? `${noStyle.length} 条配方缺主推风格` : '每条配方都有主推风格')
  const noPal = cz.recipes.filter((r) => r.pk && !cz.palettes[r.pk])
  assert(noPal.length === 0, noPal.length ? `${noPal.length} 条配方的配色键失效` : '配色键全部可解析')
  const noFont = cz.recipes.filter((r) => r.fm.some((k) => !cz.fonts[k]))
  assert(noFont.length === 0, noFont.length ? `${noFont.length} 条配方的字体键失效` : '字体键全部可解析')

  // 风格详情页在图鉴（同级目录），前缀必须由构建器算好；
  // 以前脚本里写死 ../style/，从 compose.html 解析到站点根 /style/ → 404
  assert(cz.sb === '../gallery/', `生成器的图鉴前缀为 ../gallery/（实际 ${cz.sb}）`)
  assert(!/'\.\.\/style\//.test(readText('handbook/assets/app.js')), '生成器脚本里没有写死的 ../style/ 路径')

  // 逐个核对：配方里出现的每个风格，图鉴里都要真有这个详情页（否则点进去 404）
  const stylePages = new Set(readdirSync(p('gallery', 'style')).map((f) => f.replace(/\.html$/, '')))
  const linked = [...new Set(cz.recipes.flatMap((r) => [...r.sp, ...r.ss]).map((x) => x.id).filter(Boolean))]
  const dead = linked.filter((id) => !stylePages.has(id))
  assert(dead.length === 0, dead.length ? `这些风格 id 没有详情页: ${dead.slice(0, 6).join(', ')}` : `${linked.length} 个风格全部有详情页`)
  // 链接必须是 ../gallery/style/<id>.html，从 handbook/compose.html 解析到 /gallery/style/…
  const prefix = cz.sb.replace(/\/$/, '')
  const sample = prefix + '/style/' + linked[0] + '.html'
  assert(/^\.\.\/gallery\/style\/[a-z0-9-]+\.html$/.test(sample), `风格链接形如 ${sample}`)
  assert(existsSync(p('gallery', 'style', linked[0] + '.html')), '链接目标在磁盘上存在')

  // 中文化：名称、推荐模式、风格名、规则键名都要有中文
  const noZh = cz.recipes.filter((r) => !r.zh)
  assert(noZh.length === 0, noZh.length ? `${noZh.length} 条缺中文产品名` : `${cz.recipes.length} 条都有中文产品名`)
  const noPz = cz.recipes.filter((r) => !r.pz)
  assert(noPz.length === 0, noPz.length ? `${noPz.length} 条缺中文推荐模式` : '全部配方都有中文推荐模式')
  const styleNoZh = cz.recipes.flatMap((r) => [...r.sp, ...r.ss]).filter((s) => s.id && !s.zh)
  assert(styleNoZh.length === 0, styleNoZh.length ? `${styleNoZh.length} 个风格缺中文名` : '已解析的风格全部有中文名')
  const ruleKeys = Object.values(cz.ruleKeys || {})
  assert(ruleKeys.length === 36 && ruleKeys.every((v) => /[\u4e00-\u9fa5]/.test(v)), `${ruleKeys.length} 个决策规则键名已中文化`)
  assert((czHtml.match(/class="cz-i-zh"/g) || []).length === cz.recipes.length, '列表以中文名为主行')
  assert((czHtml.match(/data-q="[^"]*[\u4e00-\u9fa5]/g) || []).length === cz.recipes.length, '每条列表项都带中文检索串')
}

section('10. 交互（jsdom）')
let JSDOM = null
try {
  ({ JSDOM } = await import('jsdom'))
} catch {
  const alt = process.env.DOM_SMOKE_JSDOM
  if (alt) {
    try {
      ({ JSDOM } = await import(alt))
    } catch {
      JSDOM = null
    }
  }
}
if (!JSDOM) {
  console.log('  ⏭  jsdom 不可用，跳过交互检查（不影响静态结论）')
} else {
  const appJs = readText('handbook/assets/app.js')
  const inline = (file) =>
    html(file).replace('<script src="./assets/app.js" defer></script>', `<script>${appJs}</script>`).replace(/<link[^>]+>/g, '')

  const dom = new JSDOM(inline('palettes.html'), { runScripts: 'dangerously', pretendToBeVisual: true })
  const { document } = dom.window
  await new Promise((r) => setTimeout(r, 60))

  const cards = [...document.querySelectorAll('.pal')]
  assert(cards.length === counts.palettes, `dom: 渲染 ${cards.length} 张配色卡`)

  const firstMore = cards[0].querySelector('[data-more]')
  const firstDetail = cards[0].querySelector('[data-detail]')
  firstMore.click()
  assert(firstDetail.hidden === false, 'dom: 点击后展开令牌区')
  assert(firstDetail.querySelectorAll('.tok-i').length === 16, 'dom: 展开后渲染 16 个令牌')
  assert(firstDetail.querySelectorAll('.cc-i').length === 7, 'dom: 渲染 7 组对比度')
  assert(firstDetail.querySelectorAll('[data-exp]').length === 3, 'dom: 提供 3 种导出')

  const darkChip = [...document.querySelectorAll('[data-filter="mode"] .chip')].find((c) => c.textContent.includes('深色'))
  darkChip.click()
  const visibleAfter = [...document.querySelectorAll('.pal')].filter((el) => !el.hidden)
  assert(visibleAfter.length === 43, `dom: 深色筛选后剩 ${visibleAfter.length} 条`)
  assert(visibleAfter.every((el) => el.getAttribute('data-mode') === 'dark'), 'dom: 筛选结果全部为深色')

  const search = document.querySelector('[data-search]')
  search.value = 'zzzz-no-such'
  search.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
  await new Promise((r) => setTimeout(r, 160))
  const none = [...document.querySelectorAll('.pal')].filter((el) => !el.hidden).length
  assert(none === 0, 'dom: 无匹配时结果为空')
  assert(document.querySelector('[data-empty]').hidden === false, 'dom: 显示空状态提示')

  const cdom = new JSDOM(inline('compose.html'), {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/compose.html#saas-general',
  })
  await new Promise((r) => setTimeout(r, 80))
  const out = cdom.window.document.querySelector('[data-cz-out]')
  assert(Boolean(out.querySelector('.cz-card')), 'dom: hash 直达时自动生成配方')
  assert(Boolean(out.querySelector('.cz-code')) && out.querySelector('.cz-code').textContent.includes('--primary'), 'dom: 导出区含 CSS 变量')
  const kindBtns = out.querySelectorAll('[data-kind]')
  assert(kindBtns.length === 3, 'dom: 三种导出格式')
  kindBtns[2].click()
  assert(out.querySelector('.cz-code').textContent.trim().startsWith('{'), 'dom: 切到 JSON 后内容为对象')
  cdom.window.document.querySelector('.cz-i[data-cz-pick="micro-saas"]')?.click()
  assert(out.querySelector('.cz-title').textContent.includes('微型 SaaS'), 'dom: 切换产品类型后标题为中文名')
  assert(out.querySelector('.cz-en').textContent.includes('Micro SaaS'), 'dom: 标题下保留英文原名')

  // 中文检索：输入「仪表盘」应命中若干条
  const czSearch = cdom.window.document.querySelector('[data-cz-search]')
  czSearch.value = '仪表盘'
  czSearch.dispatchEvent(new cdom.window.Event('input', { bubbles: true }))
  const hit = [...cdom.window.document.querySelectorAll('.cz-i')].filter((b) => !b.hidden)
  assert(hit.length >= 3, `dom: 中文搜索「仪表盘」命中 ${hit.length} 条`)
  assert(hit.every((b) => (b.getAttribute('data-q') || '').includes('仪表盘')), 'dom: 命中项的检索串都含中文关键词')
  czSearch.value = 'financial'
  czSearch.dispatchEvent(new cdom.window.Event('input', { bubbles: true }))
  const hitEn = [...cdom.window.document.querySelectorAll('.cz-i')].filter((b) => !b.hidden)
  assert(hitEn.length >= 1, `dom: 英文原名仍可搜（命中 ${hitEn.length} 条）`)
}

section('11. 进站过场（入口页）')
const hbHome = html('index.html')
assert(hbHome.includes('id="itro"') && hbHome.includes('itro-p--b'), '首页有过场覆盖层与上下幕布')
assert(hbHome.includes('Design Handbook · 6 domains'), '眉标用的是本站英文名')
assert(/itro-meta">[^<]*192 套配色/.test(hbHome), '过场数据行取自本页统计')
assert(hbHome.includes('data-rise'), '首屏内容带入场位移')
const introLeak = pages.filter((f) => f !== 'index.html' && html(f).includes('id="itro"'))
assert(introLeak.length === 0, introLeak.length ? `过场只该在入口页: ${introLeak.join(', ')}` : '子页面不重复播过场')

section('12. 外链与源码入口')
const GH = 'https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max'
const noGh = pages.filter((f) => !html(f).includes(GH))
assert(noGh.length === 0, noGh.length ? `这些页面缺 GitHub 入口: ${noGh.join(', ')}` : '每页都有 GitHub 链接（顶栏 + 页脚）')
assert(/class="top-link top-link--gh"/.test(html('index.html')), '顶栏有 GitHub 按钮')
assert((html('index.html').match(/rel="noopener"/g) || []).length >= 2, '外链都带 rel=noopener')

section('13. 站内换页：滑动而不是遮罩')
const atlasCssText = readText('handbook/assets/atlas.css')
const atlasJsText = readText('handbook/assets/app.js')
// 换页动效 = 内容本体的位移；不能再有铺满屏幕的纸幕（那是跨站才用的「换场」）
assert(/\.xnav\.is-quick/.test(atlasCssText) === false, '站内换页不再使用纸幕遮罩')
assert(/<style id="vt-optin">@view-transition\{navigation:auto\}<\/style>/.test(html('index.html')), '页面声明跨文档 View Transition')
assert(/::view-transition-new\(root\)\{animation:vtInY/.test(atlasCssText), '默认方向：新内容轻上浮')
assert(/data-vtdir="fwd"\]::view-transition-new\(root\)\{animation:vtInRight 340ms cubic-bezier\(\.22,\.61,\.36,1\)/.test(atlasCssText), '往后跳：新内容从右侧滑入（同一条缓动）')
assert(/data-vtdir="back"\]::view-transition-new\(root\)\{animation:vtInX 340ms/.test(atlasCssText), '往回跳：方向取反')
assert(/@keyframes vtInRight\{from\{opacity:0;transform:translateX\(22px\)\}/.test(atlasCssText), '位移只有 22px：换了一块，不是翻了一页')
assert(/\.top,\.site-head\{view-transition-name:site-head\}/.test(atlasCssText), '页头单独成组，换页时原地不动')
assert(/ux-vtdir/.test(atlasJsText), '按导航顺序记下前进 / 后退方向')
assert(/pathname\.indexOf\(siteRoot\) === 0/.test(atlasJsText), '离开本站根的链接先撤掉 View Transition（避免两张页头互相变形）')
assert(/function slide\(el, open\)/.test(atlasJsText), '展开面板有高度过渡')

section('13b. 导航指示线')
for (const f of ['index.html', 'palettes.html', 'pairings.html', 'charts.html', 'compose.html']) {
  const src = html(f)
  assert(/<nav class="nav"[^>]*>[\s\S]*?class="nav-ind"/.test(src), `${f} 的域导航带指示线`)
}
assert(/html\.has-ind \.nav-ind\{display:block\}/.test(atlasCssText), '脚本就绪后才接管指示线')
assert(/transition:transform \.36s cubic-bezier\(\.76,0,\.24,1\)/.test(atlasCssText), '指示线与图鉴同一条缓动、同样 360ms')
assert(/selectNodeContents\(a\)/.test(atlasJsText), '按文字宽度定位，而不是内边距盒子')

section('14. 跨站切换动效（手册 → 图鉴）')
assert(readText('handbook/assets/atlas.css').endsWith(xnavCss() + squircleCss()), '样式表末尾追加的切换动效与曲率圆角，与 tools/xnav.mjs + tools/squircle.mjs 完全一致（与图鉴同一份）')
assert(readText('handbook/assets/app.js').endsWith(xnavJs() + squircleJs()), '脚本末尾追加的切换逻辑与曲率圆角，与 tools/xnav.mjs + tools/squircle.mjs 完全一致（与图鉴同一份）')
const hbMarks = [...hbHome.matchAll(/data-xnav="([^"]+)"/g)].map((m) => m[1])
assert(hbMarks.length === 3 && hbMarks.every((x) => x === '风格图鉴'), '首页三处入口（顶栏 / 横幅 / 页脚）都带切换标记')
assert((html('recipes.html').match(/data-xnav="风格图鉴"/g) || []).length === 2, '子页面两处入口（顶栏 / 页脚）都带切换标记')

assert(stack, '数据源可读')

finish('✅ 设计手册站点结构与数据一致。')
