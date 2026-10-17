#!/usr/bin/env node
/**
 * check-imports.mjs — 分层守卫
 *
 * 把 ARCHITECTURE 的依赖铁律变成 CI 断言：
 *   1. 无循环依赖
 *   2. 依赖只从高层指向低层（按 §1.1 五条铁律细化）
 *   3. 仅 lib/repo/** 允许出现 `data/` 路径
 *   4. 仅 lib/plugin/** 允许 import @deepseek-ai/*
 *   5. 除 node: 内置模块与宿主 API 外无第三方 bare import
 *
 * 用法: node tests/check-imports.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'
import { root, assert, section, finish, p } from './_harness.mjs'

const LIB = p('lib')
const HOST_PREFIX = '@deepseek-ai/'

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (name.endsWith('.js')) out.push(full)
  }
  return out
}

function rel(abs) {
  return path.relative(root, abs).split(path.sep).join('/')
}

function libRel(abs) {
  return path.relative(LIB, abs).split(path.sep).join('/')
}

function layerOf(relPath) {
  if (relPath === 'config.js') return 0
  if (relPath.startsWith('i18n/')) return 1
  if (relPath.startsWith('repo/') || relPath.startsWith('search/')) return 2
  if (relPath.startsWith('domain/') || relPath.startsWith('presentation/')) return 3
  if (relPath.startsWith('tools/')) return 4
  if (relPath.startsWith('plugin/')) return 5
  return null
}

/** 每个源文件允许依赖的目标前缀（含同层）。 */
const ALLOWED_TARGETS = {
  'i18n/': ['i18n/'],
  'repo/': ['config.js', 'repo/'],
  'search/': ['config.js', 'i18n/', 'repo/', 'search/'],
  'domain/': ['config.js', 'i18n/', 'repo/', 'search/', 'domain/'],
  'presentation/': ['config.js', 'i18n/', 'presentation/'],
  'tools/': ['config.js', 'i18n/', 'repo/', 'search/', 'domain/', 'presentation/', 'tools/'],
  'plugin/': ['config.js', 'i18n/', 'repo/', 'search/', 'domain/', 'presentation/', 'tools/', 'plugin/'],
}

function allowedTargets(sourceRel) {
  for (const [prefix, targets] of Object.entries(ALLOWED_TARGETS)) {
    if (sourceRel.startsWith(prefix)) return targets
  }
  return []
}

function extractImports(source) {
  const specs = new Set()
  const patterns = [
    /(?:^|\n)\s*(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]
  for (const re of patterns) {
    for (const match of source.matchAll(re)) specs.add(match[1])
  }
  return [...specs]
}

function resolveLocal(fromAbs, specifier) {
  const base = path.resolve(path.dirname(fromAbs), specifier)
  const candidates = [base, `${base}.js`, path.join(base, 'index.js')]
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  return null
}

const files = walk(LIB)
const graph = new Map()
const violations = []

section('1. import 图')
for (const file of files) {
  const sourceRel = libRel(file)
  graph.set(sourceRel, [])
  const source = readFileSync(file, 'utf8')
  for (const specifier of extractImports(source)) {
    if (specifier.startsWith('.')) {
      const resolved = resolveLocal(file, specifier)
      if (!resolved) {
        violations.push(`${sourceRel}: 无法解析本地 import "${specifier}"`)
        continue
      }
      const targetRel = libRel(resolved)
      graph.get(sourceRel).push(targetRel)
      const sourceLayer = layerOf(sourceRel)
      const targetLayer = layerOf(targetRel)
      if (sourceLayer === null || targetLayer === null) {
        violations.push(`${sourceRel}: 目标模块不在分层内 "${targetRel}"`)
        continue
      }
      const targets = allowedTargets(sourceRel)
      if (!targets.some(prefix => targetRel === prefix || targetRel.startsWith(prefix))) {
        violations.push(`${sourceRel} (L${sourceLayer}) → ${targetRel} (L${targetLayer}) 越层依赖`)
      }
      continue
    }
    if (specifier.startsWith('node:')) continue
    if (specifier.startsWith(HOST_PREFIX)) {
      if (!sourceRel.startsWith('plugin/')) {
        violations.push(`${sourceRel}: 只有 lib/plugin/** 可以 import ${specifier}`)
      }
      continue
    }
    violations.push(`${sourceRel}: 不允许的 bare import "${specifier}"（零第三方运行时依赖）`)
  }
}
assert(graph.size >= 20, `${graph.size} 个 lib 模块纳入依赖图`)

// 根入口只允许依赖 plugin 层
section('2. 根入口')
const rootIndex = p('index.js')
const rootSource = readFileSync(rootIndex, 'utf8')
for (const specifier of extractImports(rootSource)) {
  if (specifier.startsWith('.')) {
    const resolved = resolveLocal(rootIndex, specifier)
    const targetRel = resolved ? libRel(resolved) : ''
    assert(targetRel.startsWith('plugin/'), `index.js → ${targetRel || specifier}（仅 plugin 层）`)
    if (!targetRel.startsWith('plugin/')) violations.push(`index.js → ${targetRel || specifier} 越层`)
  }
}

section('3. 循环依赖')
const WHITE = 0, GRAY = 1, BLACK = 2
const color = new Map([...graph.keys()].map(key => [key, WHITE]))
const stack = []
let cycleFound = null

function dfs(node) {
  if (cycleFound) return
  color.set(node, GRAY)
  stack.push(node)
  for (const next of graph.get(node) || []) {
    if (!graph.has(next)) continue
    if (color.get(next) === GRAY) {
      const start = stack.indexOf(next)
      cycleFound = [...stack.slice(start), next]
      return
    }
    if (color.get(next) === WHITE) dfs(next)
    if (cycleFound) return
  }
  stack.pop()
  color.set(node, BLACK)
}

for (const node of graph.keys()) {
  if (color.get(node) === WHITE) dfs(node)
  if (cycleFound) break
}
assert(!cycleFound, cycleFound ? `发现循环：${cycleFound.join(' → ')}` : '无循环依赖')
if (cycleFound) violations.push(`循环依赖：${cycleFound.join(' → ')}`)

section('4. data/ 路径唯一性')
// 只检查字符串字面量中的 data/ 路径；注释里提到 data/ 不算越界。
const stripComments = source => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
const hasDataPathLiteral = source => /['"`][^'"`]*\bdata\/[^'"`]*['"`]/.test(stripComments(source))
const dataPathFiles = files.filter(file => hasDataPathLiteral(readFileSync(file, 'utf8'))).map(libRel)
const unexpectedDataPaths = dataPathFiles.filter(file => !file.startsWith('repo/'))
assert(unexpectedDataPaths.length === 0,
  unexpectedDataPaths.length ? `越界 data/ 路径：${unexpectedDataPaths.join(', ')}` : '仅 lib/repo/** 出现 data/ 路径')
if (unexpectedDataPaths.length) violations.push(`越界 data/ 路径：${unexpectedDataPaths.join(', ')}`)
assert(dataPathFiles.length === 2 && dataPathFiles.includes('repo/store.js') && dataPathFiles.includes('repo/stats.js'),
  `数据路径集中在 repo/store.js + repo/stats.js（实际 ${dataPathFiles.join(', ')}）`)

section('5. 越层与非法 import')
for (const violation of violations) assert(false, violation)
assert(violations.length === 0, '依赖方向 / bare import / 路径规则全部通过')

finish('✅ 分层守卫全部通过：无环、单向依赖、数据路径唯一。')
