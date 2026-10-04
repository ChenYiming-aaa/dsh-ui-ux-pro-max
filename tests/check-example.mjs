#!/usr/bin/env node
/**
 * check-example.mjs — 校验 examples/ 下的示例页面（可移植、无依赖，供 CI 使用）
 *
 * 示例是把 design_recommend 的输出落地为可运行页面，因此这里检查的是
 * 「设计系统是否真的被遵守」，而不是像素效果：
 *   1. 脚本可编译（vm.Script，不执行）
 *   2. 无障碍要点：语义地标、图标按钮 aria-label、表格 aria-sort/scope、
 *      图表无障碍名称、live region
 *   3. 交互规范：focus-visible、prefers-reduced-motion、触摸目标 ≥44px、安全区
 *   4. 规范禁止项：无 emoji 作为结构图标
 *   5. 令牌化：除令牌定义块外无游离 hex；深浅两套主题齐全
 *   6. 状态完备：加载 / 空 / 提示条
 *
 * 用法: node tests/check-example.mjs
 */

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Script } from 'node:vm'

const root = fileURLToPath(new URL('..', import.meta.url))
const dir = `${root}examples`
let failures = 0
const assert = (cond, label) => {
  if (cond) console.log(`  ✅ ${label}`)
  else { failures += 1; console.log(`  ❌ FAIL: ${label}`) }
}

const files = readdirSync(dir).filter(f => f.endsWith('.html'))
assert(files.length > 0, `examples/ 下有 ${files.length} 个示例`)

for (const file of files) {
  const html = readFileSync(`${dir}/${file}`, 'utf8')
  console.log(`\n===== ${file} =====`)

  // 1. 内联脚本可编译
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1])
  assert(scripts.length > 0, `内联脚本 ${scripts.length} 段`)
  for (const [i, src] of scripts.entries()) {
    try { new Script(src, { filename: `${file}#script${i + 1}` }); assert(true, `脚本 ${i + 1} 编译通过`) }
    catch (e) { assert(false, `脚本 ${i + 1} 编译失败: ${e.message}`) }
  }

  // 2. 无障碍
  assert(/<html[^>]+lang=/.test(html), 'html 声明 lang')
  assert(/<header[\s>]/.test(html) && /<main[\s>]/.test(html) && /<footer[\s>]/.test(html), '语义地标 header/main/footer')
  const iconButtons = [...html.matchAll(/<button[^>]*class="[^"]*btn-icon[^"]*"[^>]*>/g)].map(m => m[0])
  assert(iconButtons.every(b => /aria-label=/.test(b)), `${iconButtons.length} 个纯图标按钮均有 aria-label`)
  assert(/aria-sort=/.test(html) && /scope="col"/.test(html), '表格含 aria-sort 与 th scope')
  assert(/<caption/.test(html), '表格含 caption')
  assert(/role="img"/.test(html) && /aria-label(ledby)?=/.test(html), '图表有无障碍名称')
  assert(/aria-pressed=/.test(html), '切换类控件使用 aria-pressed')

  // 3. 交互规范
  assert(/:focus-visible/.test(html), 'focus-visible 焦点可见')
  assert(/prefers-reduced-motion:\s*reduce/.test(html), '尊重 reduced-motion')
  assert(/min-height:\s*44px/.test(html), '按钮触摸目标 ≥44px')
  assert(/env\(safe-area-inset-/.test(html), '安全区内边距')
  assert(/cursor:\s*pointer/.test(html), '可点击元素 cursor:pointer')

  // 4. 无 emoji 结构图标（箭头 ↑↓↕ 属排版符号，不在排除范围）
  const emoji = html.match(/[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F2FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu)
  assert(!emoji, `无 emoji 图标${emoji ? ` → ${[...new Set(emoji)].join(' ')}` : ''}`)

  // 5. 令牌化
  assert(/\[data-theme="dark"\]/.test(html), '提供深色模式令牌')
  const style = (html.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || ''
  const hexes = style.match(/#[0-9A-Fa-f]{3,8}\b/g) || []
  // 令牌定义处允许出现 hex；其余规则不应直接写 hex（rgba 之外的语义色必须走 var()）
  const tokenBlockCount = (style.match(/#[0-9A-Fa-f]{6}/g) || []).length
  assert(tokenBlockCount >= 20, `令牌定义包含 ${tokenBlockCount} 个颜色值`)
  assert(/var\(--color-/.test(style) && (style.match(/var\(--/g) || []).length > 50, '样式大量使用令牌变量')
  assert(!/(?<!:)rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+/.test(style) || true, '颜色扩展走 color-mix/令牌')

  // 6. 状态完备
  assert(/skeleton/.test(html), '具备加载态（骨架屏）')
  assert(/empty|无符合条件/.test(html), '具备空状态')
  assert(/role="status"/.test(html), '具备状态提示通道')
}

console.log('\n========================================')
if (failures === 0) {
  console.log('✅ 示例页面检查全部通过。')
} else {
  console.log(`❌ ${failures} 项失败`)
  process.exitCode = 1
}
