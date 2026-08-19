/**
 * dsh-loader.mjs — 测试专用 ESM loader
 *
 * 把 `@deepseek-ai/*` 包映射到本机 DSH Desktop 运行时（app.asar.unpacked 的
 * node_modules），使 tests/validate-tools.mjs 能用真实版本的 dsh-tools /
 * dsh-skill 校验插件的工具定义。仅用于测试，不随插件分发。
 *
 * 解析规则：读取目标包 package.json 的 main 字段；子路径走 lib/<sub>.js。
 */

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const RUNTIME_NODE_MODULES = 'D:/Deepseek Harness Desktop/DSH Desktop/resources/app.asar.unpacked/node_modules/'

function pkgJsonPath(pkgDir) {
  return `${RUNTIME_NODE_MODULES}${pkgDir}/package.json`
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@deepseek-ai/')) {
    const parts = specifier.split('/')
    const name = parts.slice(0, 2).join('/')
    const sub = parts.slice(2).join('/')
    const pkgDir = name
    const pkgJson = pkgJsonPath(pkgDir)

    let main = 'lib/index.js'
    if (existsSync(pkgJson)) {
      try {
        const parsed = JSON.parse(readFileSync(pkgJson, 'utf8'))
        if (parsed.main) main = parsed.main
      } catch { /* keep default */ }
    }

    let target
    if (sub) {
      const candidates = [
        `${RUNTIME_NODE_MODULES}${pkgDir}/lib/${sub}.js`,
        `${RUNTIME_NODE_MODULES}${pkgDir}/lib/${sub}/index.js`,
      ]
      target = candidates.find(c => existsSync(c))
    } else {
      const candidates = [
        `${RUNTIME_NODE_MODULES}${pkgDir}/${main}`,
        `${RUNTIME_NODE_MODULES}${pkgDir}/lib/index.js`,
        `${RUNTIME_NODE_MODULES}${pkgDir}/index.js`,
      ]
      target = candidates.find(c => existsSync(c))
    }
    if (target) {
      return { url: new URL(`file:///${target.replace(/\\/g, '/')}`).href, shortCircuit: true }
    }
    throw new Error(`dsh-loader: 无法定位 ${specifier}`)
  }
  return nextResolve(specifier, context)
}
