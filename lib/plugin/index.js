/**
 * plugin/index.js — 宿主适配层（L5）
 *
 * 唯一 import @deepseek-ai/* 的地方：把 tools/ 的普通规格套上 defineTool，
 * 注册内置技能与三个模型工具。
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import { toolSpecs } from '../tools/index.js'
import { assertToolSchemaDialect } from './schema.js'
import { skillProvider } from './skill.js'

let _tools = null

/**
 * 构建三个设计工具（design_recommend / design_review / design_search）。
 * 导出以便测试直接校验 schema 与 execute，apply() 仅负责注册。
 * @returns {import('@deepseek-ai/dsh-tools').ToolDefinition[]}
 */
export function buildTools() {
  if (_tools) return _tools
  _tools = toolSpecs.map(spec => {
    assertToolSchemaDialect(spec)
    return defineTool(spec)
  })
  return _tools
}

/**
 * 插件主体：注册技能（skills 缝存在时）与三个工具。
 * skills 缝不存在时明确记录降级原因，便于排查（工具仍可用）。
 * @param {object} ctx
 * @param {object} [_config]
 */
export function apply(ctx, _config) {
  let skillRegistered = false
  let skillsService
  try {
    // strict=false：只判断服务当前是否已声明，不因未激活而抛错。
    skillsService = ctx.reflect?.get?.('skills', false)
  } catch {
    skillsService = undefined
  }

  ctx.inject(['skills'], skillCtx => {
    skillCtx.skills.registerProvider(() => skillProvider)
    skillRegistered = true
  })
  if (!skillRegistered && skillsService === undefined) {
    ctx.logger?.debug?.(
      '[dsh-ui-ux-pro-max] skills 服务当前未就绪：内置技能将等待该服务；三个设计工具已照常注册。',
    )
  }

  for (const tool of buildTools()) {
    ctx.tools.register(tool)
  }
}
