#!/usr/bin/env node
/**
 * dom-smoke.mjs — 在真实 DOM 中运行风格图鉴的页面脚本（可选依赖 jsdom）
 *
 * 分工：check-showcase.mjs 做**静态**结构检查（页面数量、链接层级、无障碍标记）；
 * 本文件把页面真正跑起来，验证交互结果——筛选、搜索、排序、明暗预览切换。
 * 手册一侧的同类验证在 check-atlas.mjs 第 10 组（同样依赖 jsdom）。
 *
 * jsdom 未安装时优雅跳过（退出码 0），因此不阻塞无依赖环境：
 *   npm install --no-save jsdom && node tests/dom-smoke.mjs
 *
 * 用法: node tests/dom-smoke.mjs [页面…]   # 默认检查首页与一个详情页
 */

import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { assert, expect, finish, p } from './_harness.mjs'

const TARGETS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [p('gallery', 'index.html'), p('gallery', 'style', 'liquid-glass.html')]

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
    try {
      ;({ JSDOM } = await import(spec))
    } catch (e) {
      console.log('⚠ 指定路径的 jsdom 加载失败: ' + e.message)
    }
  }
  if (!JSDOM) {
    console.log('⚠ 未安装 jsdom，跳过 DOM 执行验证（CI 中会安装后运行）。')
    console.log('  本地启用：npm install --no-save jsdom && node tests/dom-smoke.mjs')
    process.exit(0)
  }
}

/** 打开一个本地页面，等脚本执行完 */
async function open(file) {
  const errors = []
  const dom = await JSDOM.fromFile(file, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    beforeParse(win) {
      win.scrollTo = () => {}
      win.HTMLElement.prototype.scrollIntoView = function () {}
      // file:// 下 replaceState 会抛 SecurityError，会把后续的 apply() 一起中断
      try {
        Object.defineProperty(win.history, 'replaceState', { value: () => {}, configurable: true })
        Object.defineProperty(win.history, 'pushState', { value: () => {}, configurable: true })
      } catch {
        /* 已只读则忽略 */
      }
      if (!win.matchMedia) {
        win.matchMedia = () => ({
          matches: false,
          addEventListener() {},
          removeEventListener() {},
          addListener() {},
          removeListener() {},
        })
      }
      win.addEventListener('error', (e) => errors.push(e.error ? e.error.message : e.message))
    },
  })
  await new Promise((r) => dom.window.addEventListener('load', r))
  await new Promise((r) => setTimeout(r, 60))
  const { window } = dom
  const doc = window.document
  const $ = (s) => doc.querySelector(s)
  const $$ = (s) => [...doc.querySelectorAll(s)]
  const click = (el) => el && el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  const type = (el, v) => {
    el.value = v
    el.dispatchEvent(new window.Event('input', { bubbles: true }))
  }
  const pick = (el, v) => {
    el.value = v
    el.dispatchEvent(new window.Event('change', { bubbles: true }))
  }
  const visible = () => $$('[data-card]').filter((c) => !c.hidden)
  return { dom, window, doc, $, $$, click, type, pick, visible, errors }
}

const ok = (res, label) => assert(res === true, `${label}${typeof res === 'string' && res ? ` → 实际: ${res}` : ''}`)
const run = async (label, fn) => {
  let res
  try {
    res = await fn()
  } catch (e) {
    res = `异常: ${e.message}`
  }
  ok(res, label)
}

/* ---------------------------------------------------------------- 首页 */
if (existsSync(TARGETS[0])) {
  console.log('\n===== gallery/index.html =====')
  const d = await open(TARGETS[0])
  ok(d.errors.length === 0, d.errors.length ? `脚本报错: ${d.errors.join(' | ')}` : '脚本在真实 DOM 中无运行时错误')

  const total = d.$$('[data-card]').length
  ok(total === 88, `渲染 ${total} 张风格卡（应为 88）`)
  ok(d.$('[data-count]')?.textContent.includes('显示 88 / 88'), `计数文案：${d.$('[data-count]')?.textContent.trim()}`)

  // 分类筛选
  const chip = d.$$('[data-family]').find((b) => b.getAttribute('data-family') !== 'all' && b.tagName === 'BUTTON')
  if (chip) {
    const fam = chip.getAttribute('data-family')
    d.click(chip)
    await new Promise((r) => setTimeout(r, 60))
    const n = d.visible().length
    ok(n > 0 && n < total, `点「${chip.textContent.trim()}」后剩 ${n} / ${total} 种`)
    // 复位
    const all = d.$$('[data-family]').find((b) => b.getAttribute('data-family') === 'all')
    if (all) {
      d.click(all)
      await new Promise((r) => setTimeout(r, 60))
    }
  } else {
    ok('未找到分类按钮', '分类筛选按钮存在')
  }

  // 搜索（90ms 防抖）
  const search = d.$('[data-search-input]')
  if (search) {
    d.type(search, '毛玻璃')
    await new Promise((r) => setTimeout(r, 220))
    const hits = d.visible()
    const allMatch = hits.every((c) => (c.getAttribute('data-search') || '').includes('毛玻璃'))
    ok(hits.length > 0 && hits.length < total && allMatch, `搜「毛玻璃」命中 ${hits.length} 条，结果全部匹配`)

    search.dispatchEvent(new d.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await new Promise((r) => setTimeout(r, 120))
    ok(d.visible().length === total, `按 Esc 清空搜索后恢复 ${d.visible().length} 种`)
  } else {
    ok('未找到搜索框', '搜索框存在')
  }

  // 排序
  const sort = d.$('[data-sort]')
  if (sort && sort.options.length > 1) {
    const values = [...sort.options].map((o) => o.value)
    const last = values[values.length - 1]
    d.pick(sort, last)
    await new Promise((r) => setTimeout(r, 80))
    ok(d.visible().length === total, `切到排序「${last}」后仍显示全部 ${d.visible().length} 种`)
  }
}

/* -------------------------------------------------------------- 详情页 */
if (existsSync(TARGETS[1])) {
  console.log('\n===== gallery/style/liquid-glass.html =====')
  const d = await open(TARGETS[1])
  ok(d.errors.length === 0, d.errors.length ? `脚本报错: ${d.errors.join(' | ')}` : '脚本在真实 DOM 中无运行时错误')

  const h1 = d.$('h1')?.textContent.trim() || ''
  ok(h1.startsWith('液态玻璃'), `标题：${h1}`)

  const swatches = d.$$('.sw-c').length
  ok(swatches >= 4, `配色板 ${swatches} 格`)

  const pv = d.$('[data-preview]')
  const dark = d.$('[data-set-mode="dark"]')
  if (pv && dark) {
    d.click(dark)
    ok(expect(pv.getAttribute('data-mode'), 'dark'), `明暗切换：data-mode=${pv.getAttribute('data-mode')}`)
  } else {
    ok('未找到预览容器或切换按钮', '预览容器与明暗切换存在')
  }

  ok(d.$$('[data-preview] .pv-btn').length >= 3, `预览内组件样张 ${d.$$('[data-preview] .pv-btn').length} 个按钮`)
}

finish(`✅ ${TARGETS.filter(existsSync).length} 个页面在真实 DOM 中运行与交互全部符合预期。`)
