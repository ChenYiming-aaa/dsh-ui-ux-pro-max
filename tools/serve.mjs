#!/usr/bin/env node
/**
 * 本地预览服务器（只读，模拟 GitHub Pages 的静态行为）。
 *
 *   node tools/serve.mjs                      # 两站：/gallery/ = 风格图鉴，/handbook/ = 设计手册
 *   node tools/serve.mjs --root=handbook      # 只服务设计手册，挂在根路径（模拟独立部署）
 *   node tools/serve.mjs --root=gallery       # 只服务风格图鉴
 *   node tools/serve.mjs --port=8080          # 换端口（默认 4173）
 *
 * 为什么需要它：两个站用 ./ 与 ../ 相对路径组织，目录布局与部署一致；
 * 但 file:// 直接打开时目录索引不会自动跳转，所以推荐用这里的 HTTP 服务预览。
 *
 * 为什么需要它：设计手册的页面用相对路径引 ./assets/atlas.css、./fonts/*.woff2，
 * 直接双击本地 .html 或让它以"单文件预览"打开都会因此丢样式，必须经 HTTP 提供整个目录。
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
}

const args = process.argv.slice(2)
const flag = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : null
}
const positional = args.filter((a) => !a.startsWith('--'))

const PORT = Number(flag('port') || positional[0] || process.env.PORT || 4173)
const only = flag('root')

/**
 * 挂载表：URL 前缀 → 磁盘目录。目录不存在就跳过（允许只建了一个站）。
 * 两个站是同级目录（gallery/ 与 handbook/），根路径 302 到 /gallery/。
 */
function mounts() {
  const list = []
  const dirs = { gallery: path.join(ROOT, 'gallery'), handbook: path.join(ROOT, 'handbook') }
  if (only) {
    const dir = dirs[only]
    if (!dir) {
      console.error(`✗ 未知的 --root=${only}（可选：${Object.keys(dirs).join(' / ')}）`)
      process.exit(1)
    }
    if (!fs.existsSync(dir)) {
      console.error(`✗ 目录不存在：${path.relative(ROOT, dir)}/。先构建它。`)
      process.exit(1)
    }
    list.push({ prefix: '/', dir })
    return list
  }
  if (fs.existsSync(dirs.gallery)) list.push({ prefix: '/gallery', dir: dirs.gallery })
  if (fs.existsSync(dirs.handbook)) list.push({ prefix: '/handbook', dir: dirs.handbook })
  return list
}

const MOUNTS = mounts()
if (!MOUNTS.length) {
  console.error('✗ gallery/ 与 handbook/ 都不存在。先运行：npm run build')
  process.exit(1)
}

function resolve(target) {
  let url = decodeURIComponent(target)
  if (url === '/handbook') url = '/handbook/'
  if (url === '/gallery') url = '/gallery/'
  const hit = MOUNTS.filter((m) => url === m.prefix || url.startsWith(m.prefix === '/' ? '/' : `${m.prefix}/`)).sort(
    (a, b) => b.prefix.length - a.prefix.length,
  )[0]
  if (!hit) return null
  const rest = hit.prefix === '/' ? url : url.slice(hit.prefix.length) || '/'
  let file = path.join(hit.dir, rest === '/' ? 'index.html' : rest)
  if (!path.resolve(file).startsWith(path.resolve(hit.dir))) return { forbidden: true }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
  return { file, dir: hit.dir }
}

http
  .createServer((req, res) => {
    const url = (req.url || '/').split('?')[0].split('#')[0]

    // 根路径导到图鉴（模拟部署时的 dist/index.html 跳转页）
    if (url === '/' && !only) {
      res.writeHead(302, { location: '/gallery/' }).end()
      return
    }

    const found = resolve(url)

    if (!found) {
      res.writeHead(404, { 'content-type': TYPES['.html'] }).end('Not found')
      return
    }
    if (found.forbidden) {
      res.writeHead(403).end('Forbidden')
      return
    }
    if (!fs.existsSync(found.file)) {
      const notFound = path.join(found.dir, '404.html')
      if (fs.existsSync(notFound)) {
        res.writeHead(404, { 'content-type': TYPES['.html'] }).end(fs.readFileSync(notFound))
      } else {
        res.writeHead(404, { 'content-type': TYPES['.html'] }).end('Not found')
      }
      return
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(found.file)] || 'application/octet-stream' })
    fs.createReadStream(found.file).pipe(res)
  })
  .listen(PORT, '127.0.0.1', () => {
    for (const m of MOUNTS) {
      const label = m.dir.endsWith('handbook') ? '设计手册' : '风格图鉴'
      console.log(`${label}：http://127.0.0.1:${PORT}${m.prefix === '/' ? '/' : `${m.prefix}/`}`)
    }
  })
