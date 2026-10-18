/**
 * resolve-host.mjs — ESM resolve 钩子：把 @deepseek-ai/* 指向指定宿主导入根
 *
 * 插件源码里 `import { defineTool } from '@deepseek-ai/dsh-tools'` 是静态依赖，
 * 默认会解析到本仓库 node_modules。若想验证「另一份宿主版本」是否接受我们的
 * SchemaSpec，必须让这个解析改道，否则量到的永远是本地那份。
 *
 * 通过 DSH_MODULE_ROOT 指定一个含 node_modules 的目录（CI 里是临时安装目录）。
 * 未设置时使用进程当前工作目录（即本地 node_modules）。
 *
 * 前提：以 `node --import ./tests/host/register.mjs` 方式加载。
 */

import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const HOST_PREFIX = '@deepseek-ai/'
const moduleRoot = process.env.DSH_MODULE_ROOT || process.cwd()
const hostRequire = createRequire(path.join(moduleRoot, '__resolve__.js'))

export async function resolve(specifier, context, next) {
  if (!specifier.startsWith(HOST_PREFIX)) return next(specifier, context)
  try {
    return { url: pathToFileURL(hostRequire.resolve(specifier)).href, shortCircuit: true }
  } catch {
    // 宿主包里没有这个子路径（例如旧版本不含 ./presentation），交回默认解析。
    return next(specifier, context)
  }
}
