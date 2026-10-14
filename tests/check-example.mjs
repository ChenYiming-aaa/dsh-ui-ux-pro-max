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
 *   5. 令牌化：除令牌定义块外无游离 hex/rgba（例外须以行内 token-exempt
 *      标记 + 理由注释显式声明）；深浅两套主题齐全
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
  assert(/role="radiogroup"/.test(html) && /role="radio"[^>]*aria-checked=/.test(html), '单选组使用 radiogroup/radio + aria-checked')

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
  const tokenBlockCount = (style.match(/#[0-9A-Fa-f]{6}/g) || []).length
  assert(tokenBlockCount >= 20, `令牌定义包含 ${tokenBlockCount} 个颜色值`)
  assert(/var\(--color-/.test(style) && (style.match(/var\(--/g) || []).length > 50, '样式大量使用令牌变量')

  // 剔除令牌定义块（:root / [data-theme="dark"]）与注释后，规则体内不得出现
  // hex / rgba 字面量——语义色必须走 var()。确有例外处（如主题色卡）以行内
  // `/* token-exempt: 理由 */` 显式标记，让例外可见、可审查。
  const withoutTokenBlocks = style
    .replace(/:root\s*\{[\s\S]*?\}/g, '')
    .replace(/\[data-theme="dark"\]\s*\{[\s\S]*?\}/g, '')
  const codeLines = []
  let inBlockComment = false
  let pendingExempt = false
  for (const [i, raw] of withoutTokenBlocks.split('\n').entries()) {
    const t = raw.trim()
    if (/token-exempt/.test(raw)) pendingExempt = true
    if (inBlockComment) {
      if (t.includes('*/')) inBlockComment = false
      continue
    }
    if (t.startsWith('/*')) {
      if (!t.includes('*/')) inBlockComment = true
      continue
    }
    const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').trim()
    if (code) codeLines.push({ no: i + 1, code, exempt: pendingExempt })
    pendingExempt = false
  }
  const floating = codeLines.filter(l => !l.exempt && /#[0-9A-Fa-f]{3,8}\b/.test(l.code))
  assert(floating.length === 0,
    floating.length === 0 ? '令牌块与注释之外无游离 hex 字面量'
      : `令牌块与注释之外无游离 hex 字面量 → ${floating.map(f => `L${f.no}: ${f.code.slice(0, 60)}`).join(' | ')}`)
  const floatingRgba = codeLines.filter(l => !l.exempt && /(?<![\w-])rgba\(\s*\d/.test(l.code))
  assert(floatingRgba.length === 0,
    floatingRgba.length === 0 ? '规则体内无游离 rgba()（阴影等集中在令牌块）'
      : `规则体内无游离 rgba() → ${floatingRgba.map(f => `L${f.no}: ${f.code.slice(0, 60)}`).join(' | ')}`)

  // 6. 状态完备
  assert(/skeleton/.test(html), '具备加载态（骨架屏）')
  assert(/empty|无符合条件/.test(html), '具备空状态')
  assert(/role="status"/.test(html), '具备状态提示通道')
}

// ---------- 跨示例一致性：共享脚手架的核心 helper 与主题键 ----------
// 两示例有意保持单文件自包含（见 examples/README.md），共用行为需手动同步；
// 这里守护最容易漂移的部分：核心工具函数与 localStorage 主题键。
const SHARED_CORE = [
  [/function\s+\$\s*\(/, '$()'],
  [/function\s+\$\$\s*\(/, '$$()'],
  [/function\s+applyTheme\s*\(/, 'applyTheme()'],
  [/function\s+stamp\s*\(/, 'stamp()'],
  [/function\s+downloadCsv\s*\(/, 'downloadCsv()'],
]
for (const file of files) {
  const html = readFileSync(`${dir}/${file}`, 'utf8')
  for (const [re, name] of SHARED_CORE) {
    assert(re.test(html), `${file} 定义共享工具 ${name}`)
  }
  assert(html.includes("'uiux-demo-theme'"), `${file} 使用统一主题键 uiux-demo-theme`)
}

console.log('\n========================================')
if (failures === 0) {
  console.log('✅ 示例页面检查全部通过。')
} else {
  console.log(`❌ ${failures} 项失败`)
  process.exitCode = 1
}
