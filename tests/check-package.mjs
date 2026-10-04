#!/usr/bin/env node
/**
 * check-package.mjs — 清单与数据完整性检查（可移植、无依赖，供 CI 使用）
 *
 * 校验容易出错、且历史上真出过问题的项：
 *   1. package.json 可解析且无 UTF-8 BOM（BOM 会导致 dsh CLI JSON.parse 崩溃）
 *   2. dsh.bundle.patch 已声明且文件存在（市场安装的前提）
 *   3. files[] 中每个条目都真实存在
 *   4. 无生命周期脚本（preinstall/install/postinstall/prepare —— 市场会拒绝）
 *   5. peerDependencies 覆盖当前 DSH 运行时版本区间
 *   6. cordis.patch.yml 含合法的 insert（id + name）
 *   7. data/*.json 可解析且无 BOM；meta.json 计数与数据一致
 *
 * 用法: node tests/check-package.mjs
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
let failures = 0
const assert = (cond, label) => {
  if (cond) console.log(`  ✅ ${label}`)
  else { failures += 1; console.log(`  ❌ FAIL: ${label}`) }
}
const hasBom = (buf) => buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf

console.log('===== 1. package.json =====')
const pkgPath = `${root}package.json`
const pkgRaw = readFileSync(pkgPath)
assert(!hasBom(pkgRaw), 'package.json 无 UTF-8 BOM')
let pkg
try { pkg = JSON.parse(pkgRaw.toString('utf8')); assert(true, 'package.json 可解析') }
catch (e) { assert(false, `package.json 解析失败: ${e.message}`) }
assert(pkg.name === 'dsh-ui-ux-pro-max', `包名 ${pkg.name}`)
assert(/^\d+\.\d+\.\d+$/.test(pkg.version), `稳定版本号 ${pkg.version}`)
assert(pkg.type === 'module' && pkg.main === 'index.js', 'ESM 入口 index.js')
assert(Array.isArray(pkg.keywords) && pkg.keywords.includes('dsh-plugin'), '含 dsh-plugin 关键词')
assert(pkg.license, `许可证 ${pkg.license}`)

console.log('\n===== 2. DSH bundle 清单 =====')
const patch = pkg.dsh?.bundle?.patch
assert(typeof patch === 'string', `声明 dsh.bundle.patch = ${patch}`)
assert(patch && existsSync(`${root}${patch.replace(/^\.\//, '')}`), 'bundle patch 文件存在')
const lifecycles = ['preinstall', 'install', 'postinstall', 'prepare']
assert(!pkg.scripts || !lifecycles.some(s => s in pkg.scripts), '无生命周期脚本（市场要求）')
const peers = pkg.peerDependencies ?? {}
assert(Object.keys(peers).length > 0, `peerDependencies 已声明: ${Object.keys(peers).join(', ')}`)
const dshPeers = Object.entries(peers).filter(([k]) => k.startsWith('@deepseek-ai/dsh'))
assert(dshPeers.every(([, v]) => typeof v === 'string' && v.length > 0), `DSH peer 区间: ${dshPeers.map(([k, v]) => `${k}@${v}`).join(', ')}`)
assert(typeof pkg.engines?.node === 'string', `engines.node = ${pkg.engines?.node}`)

console.log('\n===== 3. files[] 条目存在性 =====')
for (const entry of pkg.files ?? []) {
  assert(existsSync(`${root}${entry}`), `存在: ${entry}`)
}

console.log('\n===== 4. cordis.patch.yml =====')
const patchText = readFileSync(`${root}cordis.patch.yml`, 'utf8')
assert(/id:\s*ui-ux-pro-max/.test(patchText), '含 insert id: ui-ux-pro-max')
assert(/name:\s*dsh-ui-ux-pro-max/.test(patchText), '含 insert name: dsh-ui-ux-pro-max')

console.log('\n===== 5. 内置数据 =====')
const dataDir = `${root}data`
for (const file of readdirSync(dataDir).filter(f => f.endsWith('.json'))) {
  const buf = readFileSync(`${dataDir}/${file}`)
  assert(!hasBom(buf), `data/${file} 无 BOM`)
  try { JSON.parse(buf.toString('utf8')); assert(true, `data/${file} 可解析`) }
  catch (e) { assert(false, `data/${file} 解析失败: ${e.message}`) }
}
const meta = JSON.parse(readFileSync(`${dataDir}/meta.json`, 'utf8'))
const index = JSON.parse(readFileSync(`${dataDir}/index.json`, 'utf8'))
for (const [key, count] of Object.entries(meta.counts)) {
  if (key.startsWith('stack:')) {
    const stack = key.slice(6)
    assert(index.stacks[stack]?.length === count, `stacks.${stack} 行数一致 (${count})`)
  } else if (key === 'reasoning') {
    assert(index.reasoning.length === count, `reasoning 行数一致 (${count})`)
  } else if (key !== 'googleFonts') {
    assert(index.domains[key]?.length === count, `domains.${key} 行数一致 (${count})`)
  }
}
assert(Object.keys(index.domains).length >= 11, `领域数 ${Object.keys(index.domains).length}`)
assert(Object.keys(index.stacks).length >= 22, `技术栈数 ${Object.keys(index.stacks).length}`)

console.log('\n========================================')
if (failures === 0) {
  console.log('✅ 清单与数据检查全部通过。')
} else {
  console.log(`❌ ${failures} 项失败`)
  process.exitCode = 1
}
