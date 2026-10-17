/**
 * _harness.mjs — 测试共享脚手架
 *
 * 四个测试文件共用：assert / section / expect / 汇总 / 路径工具。
 * 用法：
 *   import { assert, section, expect, finish, root, p } from './_harness.mjs'
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** 仓库根目录（无尾部分隔符）。 */
export const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))

export const state = { failures: 0, quiet: false }

/** 设置是否隐藏通过项（smoke --quiet 使用）。 */
export function configure(options = {}) {
  if (typeof options.quiet === 'boolean') state.quiet = options.quiet
}

/** 仓库内相对路径 → 绝对路径。 */
export function p(...segments) {
  return path.join(root, ...segments)
}

/** 读取仓库内 UTF-8 文本。 */
export function readText(relativePath) {
  return readFileSync(p(relativePath), 'utf8')
}

/** 读取仓库内 JSON。 */
export function readJson(relativePath) {
  return JSON.parse(readText(relativePath))
}

/** 断言并计数。 */
export function assert(condition, label) {
  if (condition) {
    if (!state.quiet) console.log(`  ✅ ${label}`)
  } else {
    state.failures += 1
    console.log(`  ❌ FAIL: ${label}`)
  }
}

/** 小节标题。 */
export function section(title) {
  console.log(`\n===== ${title} =====`)
}

/**
 * 相等断言辅助：返回 true 或带实际值/期望值的诊断字符串。
 * @param {unknown} actual
 * @param {unknown} expected
 * @returns {true|string}
 */
export function expect(actual, expected) {
  return actual === expected
    ? true
    : `${JSON.stringify(actual)} ≠ 期望 ${JSON.stringify(expected)}`
}

/** 打印汇总并设置退出码。 */
export function finish(successMessage) {
  console.log('\n========================================')
  if (state.failures === 0) {
    console.log(successMessage)
    return true
  }
  console.log(`❌ ${state.failures} 项失败`)
  process.exitCode = 1
  return false
}
