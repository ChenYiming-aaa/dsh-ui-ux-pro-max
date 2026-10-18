#!/usr/bin/env node
/**
 * sync-upstream.mjs — 从上游 nextlevelbuilder/ui-ux-pro-max-skill 同步数据
 *
 * 这是「半自动同步」：拉取上游 CSV → 解析 → 生成 data/index.json、
 * data/fonts.json、data/meta.json。默认只检查，不写文件。
 *
 * 用法：
 *   node scripts/sync-upstream.mjs --check                  # 只比较当前数据与上游
 *   node scripts/sync-upstream.mjs --write                  # 写入数据文件
 *   node scripts/sync-upstream.mjs --ref <sha|分支> --write  # 指定上游 ref
 *   node scripts/sync-upstream.mjs --help
 *
 * 说明：
 *   - 零第三方依赖（Node 22+ 内置 fetch；CSV 解析器在本文件内）。
 *   - `--ref` 默认 main，会通过 `git ls-remote` 解析成完整 commit SHA；
 *     若指定 40 位 SHA 则直接使用。
 *   - 写入后请运行 `npm test`；数据计数与文档数字由测试守卫。
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { STACKS } from '../lib/repo/stacks.js'

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const UPSTREAM = 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill'
const UPSTREAM_GIT = `${UPSTREAM}.git`
const RAW_BASE = 'https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill'
const DATA_PATH = 'cli/assets/data/'

const DOMAIN_FILES = [
  ['style', 'styles.csv'],
  ['color', 'colors.csv'],
  ['chart', 'charts.csv'],
  ['landing', 'landing.csv'],
  ['product', 'products.csv'],
  ['ux', 'ux-guidelines.csv'],
  ['typography', 'typography.csv'],
  ['icons', 'icons.csv'],
  ['gsap', 'motion.csv'],
  ['react', 'react-performance.csv'],
  ['web', 'app-interface.csv'],
]

const REASONING_FILE = 'ui-reasoning.csv'
const FONTS_FILE = 'google-fonts.csv'

function die(message) {
  console.error(`❌ ${message}`)
  process.exit(1)
}

function parseArgs(argv) {
  const args = { write: false, check: false, quiet: false, ref: 'main', refDate: null }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--write') args.write = true
    else if (arg === '--check') args.check = true
    else if (arg === '--quiet') args.quiet = true
    else if (arg === '--ref') args.ref = argv[++i] || die('--ref 需要值')
    else if (arg === '--ref-date') args.refDate = argv[++i] || die('--ref-date 需要值')
    else if (arg === '--help' || arg === '-h') {
      console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0])
      process.exit(0)
    } else die(`未知参数: ${arg}`)
  }
  if (!args.write && !args.check) args.check = true
  if (args.write && args.check) die('--write 与 --check 只能二选一')
  return args
}

/**
 * 解析 CSV（RFC 4180 风格：双引号包裹、"" 转义、字段内换行）。
 * @param {string} text
 * @returns {object[]}
 */
export function parseCsv(text) {
  const source = String(text).replace(/^\uFEFF/, '')
  const records = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i]
    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') { field += '"'; i += 1 }
        else inQuotes = false
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field)
      records.push(row)
      row = []
      field = ''
    } else if (ch !== '\r') {
      field += ch
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    records.push(row)
  }
  if (records.length === 0) return []
  const header = records.shift().map(name => name.trim())
  return records
    .filter(values => values.some(value => value !== ''))
    .map(values => {
      const rowObject = {}
      for (const [index, key] of header.entries()) rowObject[key] = values[index] ?? ''
      return rowObject
    })
}

async function getText(url, timeoutMs = 60000) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'dsh-ui-ux-pro-max-sync' },
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok) die(`GET ${url} → HTTP ${response.status}`)
  return response.text()
}

function resolveCommit(ref) {
  if (/^[0-9a-f]{40}$/i.test(ref)) return ref.toLowerCase()
  for (const refspec of [`refs/heads/${ref}`, `refs/tags/${ref}`]) {
    try {
      const out = execFileSync('git', ['ls-remote', UPSTREAM_GIT, refspec], { encoding: 'utf8' })
      const sha = out.trim().split(/\s+/)[0]
      if (/^[0-9a-f]{40}$/i.test(sha)) return sha.toLowerCase()
    } catch {
      /* try next refspec */
    }
  }
  die(`无法把 --ref "${ref}" 解析为 commit；请传 40 位 SHA，或安装 git 后重试`)
}

async function resolveCommitDate(sha) {
  try {
    const headers = {
      'user-agent': 'dsh-ui-ux-pro-max-sync',
      accept: 'application/vnd.github+json',
    }
    if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`
    const response = await fetch(`https://api.github.com/repos/nextlevelbuilder/ui-ux-pro-max-skill/commits/${sha}`, {
      headers,
      signal: AbortSignal.timeout(15000),
    })
    if (response.ok) {
      const body = await response.json()
      const date = body?.commit?.committer?.date
      if (typeof date === 'string') return date
    }
  } catch {
    /* ignore */
  }
  console.warn('⚠ GitHub API 未返回 commit 日期，使用当前时间；可用 --ref-date 显式指定。')
  return new Date().toISOString()
}

async function fetchCsv(sha, relativePath) {
  const url = `${RAW_BASE}/${sha}/${DATA_PATH}${relativePath}`
  return parseCsv(await getText(url))
}

async function buildData({ sha, shaDate, now }) {
  const summary = JSON.parse(await getText(`${RAW_BASE}/${sha}/${DATA_PATH}catalog-summary.json`))
  const upstreamStackCount = summary?.counts?.stacks
  if (Number.isInteger(upstreamStackCount) && upstreamStackCount !== STACKS.length) {
    die(`上游 stacks=${upstreamStackCount} 与本地 STACKS=${STACKS.length} 不一致；` +
      '请先更新 lib/repo/stacks.js，再重新同步。')
  }

  const domains = {}
  const counts = {}
  for (const [domain, file] of DOMAIN_FILES) {
    domains[domain] = await fetchCsv(sha, file)
    counts[domain] = domains[domain].length
  }

  const stacks = {}
  for (const stack of STACKS) {
    stacks[stack] = await fetchCsv(sha, `stacks/${stack}.csv`)
    counts[`stack:${stack}`] = stacks[stack].length
  }

  const reasoning = await fetchCsv(sha, REASONING_FILE)
  counts.reasoning = reasoning.length

  const googleFonts = await fetchCsv(sha, FONTS_FILE)
  counts.googleFonts = googleFonts.length

  // catalog-summary 是上游自己的一份计数快照；与 CSV 行数不一致时不要写入，
  // 避免把半更新的上游状态带进本仓库。
  const expectedCounts = {
    style: summary?.counts?.styles?.total ?? summary?.counts?.styles,
    ux: summary?.counts?.uxGuidelines,
    reasoning: summary?.counts?.reasoningProfiles,
  }
  for (const [key, expected] of Object.entries(expectedCounts)) {
    if (Number.isInteger(expected) && counts[key] !== expected) {
      die(`上游 ${key} 的 catalog 计数 ${expected} 与 CSV 行数 ${counts[key]} 不一致；请重试或换 ref。`)
    }
  }

  const totalRows = Object.values(counts).reduce((sum, count) => sum + count, 0)
  const provenance = {
    upstream: UPSTREAM,
    upstreamRef: sha,
    upstreamRefKind: 'commit',
    upstreamRefDate: shaDate,
    upstreamDataPath: DATA_PATH,
    sourcePath: DATA_PATH,
    syncedAt: now,
    lineageVerifiedAt: now.slice(0, 10),
  }

  return {
    index: {
      format: 'ui-ux-pro-max-database',
      version: 1,
      generated: now,
      source: `${UPSTREAM}@${sha} (${DATA_PATH})`,
      counts,
      domains,
      stacks,
      reasoning,
      ...provenance,
    },
    fonts: {
      format: 'ui-ux-pro-max-google-fonts',
      version: 1,
      generated: now,
      googleFonts,
    },
    meta: {
      plugin: 'dsh-ui-ux-pro-max',
      generated: now,
      counts,
      domains: DOMAIN_FILES.map(([domain]) => domain),
      stacks: [...STACKS],
      totalRows,
      ...provenance,
    },
  }
}

function readCurrent() {
  return {
    index: JSON.parse(readFileSync(path.join(ROOT, 'data/index.json'), 'utf8')),
    fonts: JSON.parse(readFileSync(path.join(ROOT, 'data/fonts.json'), 'utf8')),
    meta: JSON.parse(readFileSync(path.join(ROOT, 'data/meta.json'), 'utf8')),
  }
}

function compare(current, next) {
  const problems = []
  for (const key of Object.keys(next.index.counts)) {
    if (current.index.counts[key] !== next.index.counts[key]) {
      problems.push(`counts.${key}: ${current.index.counts[key]} → ${next.index.counts[key]}`)
    }
  }
  const sections = [
    ['domains', next.index.domains, current.index.domains],
    ['stacks', next.index.stacks, current.index.stacks],
    ['reasoning', next.index.reasoning, current.index.reasoning],
    ['googleFonts', next.fonts.googleFonts, current.fonts.googleFonts],
  ]
  for (const [label, nextValue, currentValue] of sections) {
    if (JSON.stringify(nextValue) !== JSON.stringify(currentValue)) {
      problems.push(`${label}: 内容与上游 ${next.index.upstreamRef.slice(0, 8)} 不一致`)
    }
  }
  return problems
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const sha = resolveCommit(args.ref)
  const shaDate = args.refDate || await resolveCommitDate(sha)
  const now = new Date().toISOString()
  if (!args.quiet) console.log(`上游 ref: ${sha}（${shaDate}）`)

  const next = await buildData({ sha, shaDate, now })
  const counts = next.index.counts
  if (!args.quiet) {
    console.log(`行数: style ${counts.style} / ux ${counts.ux} / reasoning ${counts.reasoning} / ` +
      `stacks ${next.meta.stacks.length} / fonts ${counts.googleFonts} / total ${next.meta.totalRows}`)
  }

  if (args.check) {
    const problems = compare(readCurrent(), next)
    if (problems.length === 0) {
      console.log('✅ 当前数据与上游一致。')
      return
    }
    console.log(`⚠ 当前数据落后上游 ${problems.length} 项：`)
    for (const problem of problems) console.log(`  - ${problem}`)
    process.exitCode = 1
    return
  }

  writeFileSync(path.join(ROOT, 'data/index.json'), `${JSON.stringify(next.index)}\n`)
  writeFileSync(path.join(ROOT, 'data/fonts.json'), `${JSON.stringify(next.fonts)}\n`)
  writeFileSync(path.join(ROOT, 'data/meta.json'), `${JSON.stringify(next.meta, null, 2)}\n`)
  console.log(`✅ 已写入 data/index.json / data/fonts.json / data/meta.json（上游 ${sha.slice(0, 8)}）`)
  console.log('下一步：更新 README / SKILL.md / package.json 能力数字，然后运行 npm test。')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => die(error.stack || error.message))
}
