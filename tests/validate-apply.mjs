#!/usr/bin/env node
/**
 * validate-apply.mjs — 用 mock Context 验证插件的 apply() 生命周期
 *
 * 校验 apply(ctx) 能正确完成：
 *  1. 通过 ctx.inject(['skills']) 注册内置技能提供者
 *  2. 通过 ctx.tools.register 注册 3 个工具
 *  3. Host RPC（harness.handle）按文档约定注册（无 harness 时安全跳过）
 *
 * 用法: node --import ./tests/register-loader.mjs tests/validate-apply.mjs
 */

import { apply } from '../index.js'

let failures = 0
function assert(cond, label) {
  if (cond) console.log(`  ✅ ${label}`)
  else { failures += 1; console.log(`  ❌ FAIL: ${label}`) }
}

// ---- mock Context ----
const registeredTools = []
const registeredProviders = []
const handled = []

const ctx = {
  inject(seam, cb) {
    if (Array.isArray(seam) && seam.includes('skills')) {
      cb({
        skills: {
          registerProvider(create) { registeredProviders.push(create()) },
        },
      })
    }
  },
  tools: {
    register(tool) { registeredTools.push(tool) },
  },
}

// 无 harness 全局 → RPC 块应安全跳过
apply(ctx, {})

assert(registeredTools.length === 3, `ctx.tools.register 注册 ${registeredTools.length} 个工具`)
assert(registeredTools.map(t => t.name).sort().join(',') === 'design_recommend,design_review,design_search', '工具名正确')
assert(registeredProviders.length === 1, '技能提供者已注册')
const provider = registeredProviders[0]
assert(provider.name === 'dsh-ui-ux-pro-max', `提供者名: ${provider.name}`)

const candidates = await provider.list()
assert(candidates.length === 1 && candidates[0].name === 'ui-ux-pro-max', '技能候选列表含 ui-ux-pro-max')
const definition = await provider.get(candidates[0])
assert(definition.content.includes('design_recommend'), '技能正文可读取且包含工具说明')
assert(definition.content.length > 500, `技能正文长度 ${definition.content.length} 字符`)

// 带 harness 全局 → RPC 注册
globalThis.harness = { handle: (m, fn) => handled.push({ method: m, fn }) }
try {
  apply(ctx, {})
  assert(handled.length === 2, `harness.handle 注册 ${handled.length} 个 RPC`)
  assert(handled.some(h => h.method === 'ui-ux-pro-max/design-system'), 'design-system RPC 已注册')
  assert(handled.some(h => h.method === 'ui-ux-pro-max/meta'), 'meta RPC 已注册')
  const meta = await handled.find(h => h.method === 'ui-ux-pro-max/meta').fn()
  assert(meta.domains.includes('style') && meta.stacks.includes('react'), 'meta RPC 返回元信息')
  const rpcResult = await handled.find(h => h.method === 'ui-ux-pro-max/design-system').fn({ query: '电商 品牌 高端', projectName: 'Luxe Shop' })
  assert(rpcResult.summary && /^#[0-9A-Fa-f]{6}$/.test(rpcResult.summary.palette.primary), 'design-system RPC 返回令牌摘要')
} finally {
  delete globalThis.harness
}

console.log('\n========================================')
if (failures === 0) {
  console.log('✅ apply() 生命周期验证通过：工具注册、技能提供者、Host RPC（含 harness 缺失安全降级）。')
} else {
  console.log(`❌ ${failures} 项断言失败`)
  process.exitCode = 1
}
