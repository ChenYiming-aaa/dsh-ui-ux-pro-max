/**
 * store.js — 内置数据访问唯一入口（L2）
 *
 * 全仓唯一出现 `data/*.json` 路径的地方：惰性单例加载 index.json / fonts.json。
 * 将来换数据源（远程、压缩包、分片）只改这一个文件。
 */

import { readFileSync } from 'node:fs'

const INDEX_URL = new URL('../../data/index.json', import.meta.url)
const FONTS_URL = new URL('../../data/fonts.json', import.meta.url)

let _db = null

function loadDb() {
  if (_db) return _db
  const raw = readFileSync(INDEX_URL, 'utf8')
  _db = JSON.parse(raw)
  return _db
}

/** 访问内置数据库 */
export function getDb() {
  return loadDb()
}

/** 领域数据行 */
export function getDomainRows(domain) {
  const db = loadDb()
  return db.domains[domain] || []
}

/** 技术栈数据行 */
export function getStackRows(stack) {
  const db = loadDb()
  return db.stacks[stack] || []
}

/** 推理规则行 */
export function getReasoningRows() {
  return loadDb().reasoning || []
}

let _fonts = null
let _fontsLoaded = false

/** Google Fonts 行（1.1MB，首次访问才加载） */
export function getFontRows() {
  if (_fontsLoaded) return _fonts
  const raw = readFileSync(FONTS_URL, 'utf8')
  const parsed = JSON.parse(raw)
  _fonts = parsed.googleFonts || []
  _fontsLoaded = true
  return _fonts
}
