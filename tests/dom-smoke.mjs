#!/usr/bin/env node
/**
 * dom-smoke.mjs — 在真实 DOM 中执行示例页脚本（可选依赖 jsdom）
 *
 * 与 check-example.mjs 的分工：后者是**静态**规范检查（令牌化、无障碍标记、
 * 无 emoji 等）；本文件把页面真正跑起来，验证「渲染结果与交互」是否正确——
 * 例如预算合计、倒计时、模式切换、标签页、拖拽/上下移动、重排应用。
 *
 * jsdom 未安装时优雅跳过（退出码 0），因此不阻塞无依赖环境：
 *   npm install --no-save jsdom && node tests/dom-smoke.mjs
 *
 * 用法: node tests/dom-smoke.mjs [示例文件…]   # 默认检查 examples/ 下全部 .html
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const args = process.argv.slice(2)
const files = args.length
  ? args
  : readdirSync(`${root}examples`).filter(f => f.endsWith('.html')).map(f => `${root}examples/${f}`)

let JSDOM
try {
  ({ JSDOM } = await import('jsdom'))
} catch {
  // CI 用独立目录安装 jsdom（避免连带安装本插件的 peer 依赖），经环境变量告知入口
  const alt = process.env.DOM_SMOKE_JSDOM
  if (alt) {
    // 允许传入 file:// URL 或普通路径；注意 Windows 盘符（C:\）不是 URL scheme
    const isWindowsPath = /^[a-zA-Z]:[\\/]/.test(alt)
    const isUrl = !isWindowsPath && /^[a-z][a-z0-9+.-]*:\/\//i.test(alt)
    const spec = isUrl ? alt : pathToFileURL(alt).href
    try { ({ JSDOM } = await import(spec)) } catch (e) { console.log('⚠ 指定路径的 jsdom 加载失败: ' + e.message) }
  }
  if (!JSDOM) {
    console.log('⚠ 未安装 jsdom，跳过 DOM 执行验证（CI 中会安装后运行）。')
    console.log('  本地启用：npm install --no-save jsdom && node tests/dom-smoke.mjs')
    process.exit(0)
  }
}

/**
 * 各示例的针对性期望：{ 文件: [描述, 断言函数, ...] }
 *
 * 注意：期望值（33 站、¥3,915 等）是**有意硬编码的回归基线**——修改示例
 * 数据时本测试会失败，这是在强制同步确认，而非测试脆弱。确需改数据时，
 * 请连同这里的期望值一起更新。
 * 断言函数可返回 true / false，或用 expect(实际, 期望) 返回带诊断信息的失败。
 */
const expect = (actual, expected) => actual === expected ? true : `${JSON.stringify(actual)} ≠ 期望 ${JSON.stringify(expected)}`
const EXPECTATIONS = {
  'trip-planner-workbench.html': [
    ['站点总数徽标 = 33 站', d => expect(d.$('#stop-count-badge').textContent.trim(), '33 站')],
    ['左栏天数 = 5', d => expect(d.$$('#daylist .day-item').length, 5)],
    ['城际交通分隔 = 4（首日不重复）', d => expect(d.$$('#daylist .transit-sep').length, 4)],
    ['整趟模式渲染 5 天', d => expect(d.$$('#canvas-body .day-block').length, 5)],
    ['时间轴站点卡片 = 33', d => expect(d.$$('#canvas-body .stop').length, 33)],
    ['人均合计 = ¥3,915', d => expect(d.$('#budget-per-person').textContent.trim(), '¥3,915')],
    ['预算健康度 = ok', d => expect(d.$('#budget-bar').dataset.health, 'ok')],
    ['余量 ¥1,285 / 25%', d => /剩余\s*¥1,285/.test(d.$('#budget-health-note').textContent) || d.$('#budget-health-note').textContent],
    ['预订行数 = 7 且首行按截止日升序', d => d.$$('#booking-body tr').length === 7 && d.$('#booking-body tr td .num').textContent === '10-11'],
    ['每行有倒计时；已完成项无深链', d => d.$$('#booking-body .countdown').length === 7 && d.$$('#booking-body .link-ext').length === 6],
    ['caption 明示不代订/不付款', d => /不代订、不付款/.test(d.$('#booking-table caption').textContent)],
    ['简报 5 组 / 主题 7 张', d => d.$$('#brief-list .brief-item').length === 5 && d.$$('#theme-grid .theme-card').length === 7],
    ['地图停靠点 = 当日全部 9 站', d => expect(d.$('#route-svg').querySelectorAll('.route-pin').length, 9)],
    ['底栏统计 已核实 23 / 估算 4', d => expect(d.$('#status-verified-count').textContent + '/' + d.$('#status-estimated-count').textContent, '23/4')],
    ['空档模式 3 个候选', d => { d.mode('gap'); return d.$$('#canvas-body .option-card').length === 3 }],
    ['重排 diff：2 列 + 3 行标记删除', d => { d.mode('replan'); return d.$$('#canvas-body .diff-col').length === 2 && d.$$('#canvas-body .diff-row[data-keep="false"]').length === 3 }],
    ['单日模式只渲染 1 天', d => { d.mode('day'); return d.$$('#canvas-body .day-block').length === 1 }],
    ['下移按钮改变站点顺序', d => { d.mode('full'); const a = d.firstStop(); d.click(d.$('#canvas-body .day-block .stop [data-act="down"]')); return d.firstStop() !== a }],
    ['插入空档后站点 +1 且门禁转为待校验', d => { const n = d.$$('#canvas-body .stop').length; d.click(d.$('#btn-add-gap')); return d.$$('#canvas-body .stop').length === n + 1 && d.$('#status-gate-text').textContent.includes('待重新校验') }],
    ['重排可应用并高亮变更站点', d => { d.mode('replan'); d.click(d.$('#btn-apply-replan')); return d.$('#canvas-body').textContent.includes('德国总督楼旧址博物馆') && d.$$('#canvas-body .stop[data-changed="true"]').length >= 1 }],
    ['模式切换为 radiogroup 单选语义（方向键可选）', d => {
      const btns = d.$$('.segmented [role="radio"]')
      if (btns.length !== 4) return false
      d.click(btns[2])  // 空档填充
      if (btns[2].getAttribute('aria-checked') !== 'true' || d.$$('#canvas-body .option-card').length !== 3) return false
      btns[2].dispatchEvent(new d.win.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }))
      return btns[1].getAttribute('aria-checked') === 'true' && d.$$('#canvas-body .option-card').length === 0
    }],
    ['标签页支持 Home/End 键跳首尾', d => {
      const tabs = d.$$('.tab')
      tabs[2].focus()
      tabs[2].dispatchEvent(new d.win.KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }))
      const endOk = tabs[4].getAttribute('aria-selected') === 'true'
      tabs[4].dispatchEvent(new d.win.KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }))
      return endOk && tabs[0].getAttribute('aria-selected') === 'true'
    }],
    ['降级提示可关闭', d => { d.click(d.$('#btn-banner-close')); return d.$('#banner-degraded').hidden === true }],
    // 回归：el() 用 textContent，曾把 SVG 字符串当纯文本渲染出代码
    ['城际交通分隔渲染为图标（而非原始 SVG 文本）', d => {
      const seps = d.$$('#daylist .transit-sep')
      return seps.length === 4 && seps.every(s => s.querySelector('svg') && !s.textContent.includes('<svg'))
    }],
  ],
  'fintech-dashboard.html': [
    ['KPI 卡 4 张', d => expect(d.$$('#kpi-row .kpi').length, 4)],
    ['热力图 6 行 × 12 列', d => expect(d.$$('#heat-grid .cell').length, 72)],
    ['交易表 12 行', d => expect(d.$$('#trades-body tr').length, 12)],
    ['点数/表格/图例渲染完成', d => d.$('#trend-line').getAttribute('d').length > 0 && d.$$('#token-grid .token').length >= 13],
    ['时间范围切换后热力图数据随之变化', d => {
      const first = d.$('#heat-grid .cell').textContent;
      const btn = d.$$('.segmented button').find(b => b.dataset.range === '7');
      d.click(btn);
      return d.$('#heat-grid .cell').textContent !== first && /7 天/.test(d.$('#heat-note').textContent);
    }],
    ['按状态筛选后行数减少', d => { const before = d.$$('#trades-body tr').length; const sel = d.$('#filter-status'); sel.value = '已成交'; sel.dispatchEvent(new d.win.Event('change', { bubbles: true })); return d.$$('#trades-body tr').length < before }],
    ['无结果时显示空状态', d => { const q = d.$('#filter-q'); q.value = '不存在的编号'; q.dispatchEvent(new d.win.Event('input', { bubbles: true })); return d.$('#trades-empty').hidden === false }],
    ['表头排序同步 aria-sort', d => { d.click(d.$('th button[data-sort="amount"]')); return d.$('th[aria-sort] button[data-sort="amount"]') !== null }],
    ['时间范围为 radiogroup 单选语义（点击 + 方向键 + 漫游 tabindex）', d => {
      const btns = d.$$('.segmented [role="radio"]')
      if (btns.length !== 3 || d.$('.segmented').getAttribute('role') !== 'radiogroup') return false
      d.click(btns[0])  // 近 7 天
      if (btns[0].getAttribute('aria-checked') !== 'true') return false
      if (btns[1].getAttribute('aria-checked') !== 'false') return false
      if (btns[0].getAttribute('tabindex') !== '0' || btns[1].getAttribute('tabindex') !== '-1') return false
      btns[0].dispatchEvent(new d.win.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }))
      return btns[1].getAttribute('aria-checked') === 'true' && btns[0].getAttribute('aria-checked') === 'false'
    }],
    ['主题按钮 aria-pressed 随深浅色同步', d => {
      const btn = d.$('#btn-theme')
      d.click(btn)  // → dark
      const darkOk = d.doc.documentElement.getAttribute('data-theme') === 'dark' && btn.getAttribute('aria-pressed') === 'true'
      d.click(btn)  // → light
      const lightOk = d.doc.documentElement.getAttribute('data-theme') === 'light' && btn.getAttribute('aria-pressed') === 'false'
      return darkOk && lightOk
    }],
    // 环形图回归：起点必须在 12 点。曾经 rotate(-90) 与 dashoffset:25 双重补偿，
    // 导致整环旋转 90°（最大弧段从 9 点开始）
    ['环形图无 rotate 变换且起点偏移为 25', d => {
      const arcs = ['arc-1', 'arc-2', 'arc-3', 'arc-4'].map(id => d.doc.getElementById(id))
      return arcs.every(a => a && !a.getAttribute('transform')) && arcs[0].getAttribute('stroke-dashoffset') === '25'
    }],
    ['环形图各弧段长度合计 100（无重叠无缺口）', d => {
      const total = ['arc-1', 'arc-2', 'arc-3', 'arc-4']
        .reduce((s, id) => s + Number(d.doc.getElementById(id).getAttribute('stroke-dasharray').split(' ')[0]), 0)
      return total === 100
    }],
    // SVG 内 font-size 是 viewBox 用户单位：内孔直径仅 25.8 单位，曾因写成
    // 15 单位（≈54px）导致中心文字整体溢出、压在环上并触到裁剪边界
    ['环形图中心文字字号与内孔相称（viewBox 单位制）', d => {
      const vb = (d.$('#allocation svg[role="img"]').getAttribute('viewBox') || '0 0 42 42').split(/\s+/).map(Number)
      const fs = parseFloat(d.win.getComputedStyle(d.doc.querySelector('.donut-center')).fontSize)
      return fs > 0 && fs <= vb[2] / 7  // ≤6 单位（≈21px）；回归到 15 会判失败
    }],
  ],
}

let failures = 0
for (const file of files) {
  const name = file.split(/[\\/]/).pop()
  if (!existsSync(file)) { console.log(`❌ 文件不存在: ${file}`); failures++; continue }
  const html = readFileSync(file, 'utf8')
  const errors = []
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://example.invalid/',
    beforeParse(win) {
      win.matchMedia = win.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }))
      win.addEventListener('error', e => errors.push(e.error ? e.error.message : e.message))
    },
  })
  const { window } = dom
  const doc = window.document
  const $ = s => doc.querySelector(s)
  const $$ = s => [...doc.querySelectorAll(s)]
  const click = el => el && el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  const mode = m => {
    const b = $$('.segmented button[data-mode]').find(x => x.dataset.mode === m)
    click(b)
  }
  const api = { doc, win: window, $, $$, click, mode, firstStop: () => { const h = $('#canvas-body .stop-title h4'); return h ? h.textContent : null } }

  console.log(`\n===== ${name} =====`)
  await new Promise(r => setTimeout(r, 1100)) // 等模拟门禁/加载的 setTimeout 完成
  // 断言函数可返回 true / false / 字符串（字符串 = 失败并附实际值，便于诊断）
  const ok = (res, label) => {
    if (res === true) { console.log(`  ✅ ${label}`); return }
    failures++
    console.log(`  ❌ FAIL: ${label}${typeof res === 'string' && res ? ` → 实际: ${res}` : ''}`)
  }

  ok(errors.length === 0, errors.length ? `脚本报错: ${errors.join(' | ')}` : '脚本在真实 DOM 中无运行时错误')
  // 通用不变量：标签页状态与面板可见性一致
  const tabOk = $$('.tab').every(t => {
    const panel = doc.getElementById(t.getAttribute('aria-controls'))
    const selected = t.getAttribute('aria-selected') === 'true'
    return !panel || (selected ? !panel.hidden : panel.hidden)
  })
  ok(tabOk, '标签页 aria-selected 与面板可见性一致')
  const pressedOk = $$('[aria-pressed]').every(b => b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-pressed') === 'false')
  ok(pressedOk, 'aria-pressed 取值均为 true/false')

  for (const [label, fn] of EXPECTATIONS[name] ?? []) {
    let res = false
    try { res = fn(api) } catch (e) { res = `异常: ${e.message}` }
    ok(res, label)
  }
}

console.log('\n========================================')
if (failures === 0) console.log(`✅ ${files.length} 个示例在真实 DOM 中运行与交互全部符合预期。`)
else { console.log(`❌ ${failures} 项失败`); process.exitCode = 1 }
