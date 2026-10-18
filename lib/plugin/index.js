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
import { DEFAULT_CONFIG, applyToolDefaults, normalizeConfig } from './config.js'

/**
 * 构建三个设计工具（design_recommend / design_review / design_search）。
 * 导出以便测试直接校验 schema 与 execute，apply() 仅负责注册。
 *
 * 不缓存结果：defineTool 只是纯包装（微秒级），而模块级缓存会让多次 apply()
 * （多 profile / 热重载）共享同一批 definition 对象——宿主若在其上挂运行时
 * 状态，实例之间会互相污染。
 *
 * `config` 只影响两个工具未显式传参时的默认条数；用户显式传值优先。
 * @param {ReturnType<typeof normalizeConfig>} [config]
 * @returns {import('@deepseek-ai/dsh-tools').ToolDefinition[]}
 */
export function buildTools(config = DEFAULT_CONFIG) {
  const resolved = normalizeConfig(config)
  return toolSpecs.map(spec => {
    assertToolSchemaDialect(spec)
    return defineTool(applyToolDefaults(spec, resolved))
  })
}

/**
 * 插件主体：注册技能（skills 缝存在且 config.skill 未关闭时）与三个工具。
 * skills 缝不存在时明确记录降级原因，便于排查（工具仍可用）。
 * @param {object} ctx
 * @param {object} [rawConfig]
 */
export function apply(ctx, rawConfig = {}) {
  const config = normalizeConfig(rawConfig)
  let skillRegistered = false
  let skillsService
  try {
    // strict=false：只判断服务当前是否已声明，不因未激活而抛错。
    skillsService = ctx.reflect?.get?.('skills', false)
  } catch {
    skillsService = undefined
  }

  if (config.skill) {
    ctx.inject(['skills'], skillCtx => {
      skillCtx.skills.registerProvider(() => skillProvider)
      skillRegistered = true
    })
  }
  if (!config.skill) {
    ctx.logger?.debug?.('[dsh-ui-ux-pro-max] config.skill=false：跳过内置技能注册，三个工具照常注册。')
  } else if (!skillRegistered && skillsService === undefined) {
    ctx.logger?.debug?.(
      '[dsh-ui-ux-pro-max] skills 服务当前未就绪：内置技能将等待该服务；三个设计工具已照常注册。',
    )
  }

  for (const tool of buildTools(config)) {
    ctx.tools.register(tool)
  }
}
