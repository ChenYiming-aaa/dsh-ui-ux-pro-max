#!/usr/bin/env node
/**
 * check-package.mjs — 清单与数据完整性检查（可移植、无依赖，供 CI 使用）
 *
 * 校验容易出错、且历史上真出过问题的项：
 *   1. package.json 可解析且无 UTF-8 BOM（BOM 会导致 dsh CLI JSON.parse 崩溃）
 *   2. dsh.bundle.patch 已声明且文件存在（市场安装的前提）
 *   3. files[] 中每个条目都真实存在，且不包含 tests/docs/examples
 *   4. 无生命周期脚本（市场会拒绝）；scripts.test 非生命周期，允许
 *   5. peerDependencies 覆盖已验证宿主线（与 lib/config.js 同源）
 *   6. cordis.patch.yml 含合法的 insert（id + name）
 *   7. data/*.json 可解析且无 BOM；meta.json 计数与数据一致
 *   8. 上游溯源字段（upstream / upstreamRef / syncedAt）非空且两份数据一致
 *
 * 用法: node tests/check-package.mjs
 */

import { existsSync, readdirSync } from 'node:fs'
import { VERIFIED_HOST } from '../lib/config.js'
import { assert, section, finish, p, readText, readJson } from './_harness.mjs'

const hasBom = (buf) => buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf

section('1. package.json')
const pkgRaw = readText('package.json')
const pkgBuf = Buffer.from(pkgRaw, 'utf8')
assert(!hasBom(pkgBuf), 'package.json 无 UTF-8 BOM')
let pkg = null
try {
  pkg = JSON.parse(pkgRaw)
  assert(true, 'package.json 可解析')
} catch (error) {
  assert(false, `package.json 解析失败: ${error.message}`)
}
pkg = pkg || {}
assert(pkg.name === 'dsh-ui-ux-pro-max', `包名 ${pkg.name}`)
assert(/^\d+\.\d+\.\d+$/.test(pkg.version || ''), `稳定版本号 ${pkg.version}`)
assert(pkg.type === 'module' && pkg.main === 'index.js', 'ESM 入口 index.js')
assert(Array.isArray(pkg.keywords) && pkg.keywords.includes('dsh-plugin'), '含 dsh-plugin 关键词')
assert(pkg.license, `许可证 ${pkg.license}`)

// 版本号一致性：README（中英）的版本引用必须与 package.json 同版本，防止发布漂移
for (const readme of ['README.md', 'README.en.md']) {
  const text = readText(readme)
  const refs = [...text.matchAll(/dsh-ui-ux-pro-max@(\d+\.\d+\.\d+)/g)].map(m => m[1])
  const stale = [...new Set(refs.filter(v => v !== pkg.version))]
  assert(refs.length >= 2 && stale.length === 0,
    refs.length < 2 ? `${readme} 版本引用不足（${refs.length} 处）`
      : stale.length ? `${readme} 版本引用过期 → [${stale}] vs 包 ${pkg.version}`
        : `${readme} 版本引用与 package.json 一致（${pkg.version}，${refs.length} 处）`)
}

section('2. DSH bundle 清单')
const patch = pkg.dsh?.bundle?.patch
assert(typeof patch === 'string', `声明 dsh.bundle.patch = ${patch}`)
assert(patch && existsSync(p(`${patch.replace(/^\.\//, '')}`)), 'bundle patch 文件存在')
const lifecycles = ['preinstall', 'install', 'postinstall', 'prepare']
assert(!pkg.scripts || !lifecycles.some(script => script in pkg.scripts), '无生命周期脚本（市场要求）')
assert(typeof pkg.scripts?.test === 'string' && pkg.scripts.test.length > 0, 'npm test 入口已声明（非生命周期脚本）')
const peers = pkg.peerDependencies ?? {}
assert(Object.keys(peers).length > 0, `peerDependencies 已声明: ${Object.keys(peers).join(', ')}`)
const dshPeers = Object.entries(peers).filter(([key]) => key.startsWith('@deepseek-ai/dsh'))
assert(dshPeers.every(([, value]) => typeof value === 'string' && value.length > 0),
  `DSH peer 区间: ${dshPeers.map(([key, value]) => `${key}@${value}`).join(', ')}`)
assert(typeof pkg.engines?.node === 'string', `engines.node = ${pkg.engines?.node}`)

// 回归保护：宿主 boot gate 会跳过「声明区间不含当前运行时」的插件（表现为
// 「对当前 DSH 不兼容」且技能/工具全部消失）。声明区间的上限必须高于我们
// 已验证过的宿主版本线——历史上正是 `<0.2.0-0` 把 0.2.0-rc.2 挡在门外。
const hostTuple = VERIFIED_HOST.split('.').slice(0, 2).map(Number)
for (const [name, range] of dshPeers) {
  const bounds = [...String(range).matchAll(/<\s*(\d+)\.(\d+)\.(\d+)/g)].map(m => m.slice(1, 3).map(Number))
  assert(bounds.length > 0, `${name} 声明了上界`)
  const coversHost = bounds.some(([maj, min]) => maj > hostTuple[0] || (maj === hostTuple[0] && min > hostTuple[1]))
  assert(coversHost, `${name} 区间 ${range} 的上界高于已验证宿主线 ${VERIFIED_HOST}（避免 boot gate 跳过）`)
}

section('3. files[] 白名单')
for (const entry of pkg.files ?? []) {
  assert(existsSync(p(entry)), `存在: ${entry}`)
}
assert(pkg.files?.includes('lib'), 'files[] 含 lib（子目录自动覆盖）')
for (const excluded of ['tests', 'docs', 'examples', 'install.ps1', 'scripts']) {
  assert(!pkg.files?.includes(excluded), `files[] 不含 ${excluded}`)
}

section('4. cordis.patch.yml')
const patchText = readText('cordis.patch.yml')
assert(/id:\s*ui-ux-pro-max/.test(patchText), '含 insert id: ui-ux-pro-max')
assert(/name:\s*dsh-ui-ux-pro-max/.test(patchText), '含 insert name: dsh-ui-ux-pro-max')

section('5. 内置数据')
const dataDir = p('data')
const dataFiles = readdirSync(dataDir).filter(file => file.endsWith('.json'))
for (const file of dataFiles) {
  const buf = Buffer.from(readText(`data/${file}`), 'utf8')
  assert(!hasBom(buf), `data/${file} 无 BOM`)
  try {
    JSON.parse(buf.toString('utf8'))
    assert(true, `data/${file} 可解析`)
  } catch (error) {
    assert(false, `data/${file} 解析失败: ${error.message}`)
  }
}
const meta = readJson('data/meta.json')
const index = readJson('data/index.json')
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

section('6. 上游溯源')
const PROVENANCE_KEYS = [
  'upstream', 'upstreamRef', 'upstreamRefKind', 'upstreamRefDate',
  'upstreamDataPath', 'sourcePath', 'syncedAt', 'lineageVerifiedAt',
]
for (const [name, data] of [['data/index.json', index], ['data/meta.json', meta]]) {
  for (const key of PROVENANCE_KEYS) {
    assert(typeof data[key] === 'string' && data[key].trim().length > 0, `${name}.${key} 非空`)
  }
  assert(/^[0-9a-f]{40}$/.test(data.upstreamRef), `${name}.upstreamRef 是完整 commit SHA`)
  assert(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(data.upstreamRefDate), `${name}.upstreamRefDate 是 ISO 时间`)
  assert(/^\d{4}-\d{2}-\d{2}$/.test(data.lineageVerifiedAt), `${name}.lineageVerifiedAt 是核对日期`)
  assert(data.upstreamRefKind === 'commit', `${name}.upstreamRefKind = commit`)
}
for (const key of PROVENANCE_KEYS) {
  assert(index[key] === meta[key], `两份数据的 ${key} 一致`)
}
const notices = readText('THIRD_PARTY_NOTICES.md')
assert(notices.includes(index.upstream) && notices.includes(index.upstreamRef) &&
  notices.includes(index.upstreamDataPath) && notices.includes(index.sourcePath) &&
  notices.includes(index.lineageVerifiedAt),
  'THIRD_PARTY_NOTICES 与数据溯源字段一致')

finish('✅ 清单与数据检查全部通过。')
