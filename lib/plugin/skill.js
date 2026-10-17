/**
 * plugin/skill.js — 内置技能注册定义（L5，唯一认识 dsh-skill API 的文件）
 *
 * SKILL.md 路径集中在这里；能力数字从 meta.json 派生，避免手工漂移
 * （该 description 是宿主判断何时激活技能的信号）。
 */

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { BUNDLED_SKILL_RANK } from '@deepseek-ai/dsh-skill'
import { capabilitySummaryZh } from '../repo/stats.js'

export const SKILL_BODY_URL = new URL('../../skills/ui-ux-pro-max/SKILL.md', import.meta.url)

export const SKILL_RESOURCE_BASE = {
  kind: 'directory',
  path: fileURLToPath(new URL('../../skills/ui-ux-pro-max/', import.meta.url)),
}

export const SKILL_INVOCATION = { modelInvocable: true, userInvocable: true }

export const SKILL_DESCRIPTION =
  'UI/UX 设计智能库：通过 design_recommend / design_review / design_search 工具查询 ' +
  `${capabilitySummaryZh()}，获取中文优先、带理由的结构化设计系统建议。` +
  '创建或改造界面、评审 UX 时使用。'

export const SKILL_CANDIDATE = {
  name: 'ui-ux-pro-max',
  description: SKILL_DESCRIPTION,
  invocation: SKILL_INVOCATION,
  provider: 'dsh-ui-ux-pro-max',
  source: 'bundled',
  resourceBase: SKILL_RESOURCE_BASE,
  rank: BUNDLED_SKILL_RANK,
  locator: SKILL_BODY_URL,
}

export const skillProvider = {
  name: 'dsh-ui-ux-pro-max',
  list: () => Promise.resolve([SKILL_CANDIDATE]),
  async get(_candidate) {
    return {
      name: SKILL_CANDIDATE.name,
      description: SKILL_CANDIDATE.description,
      invocation: SKILL_CANDIDATE.invocation,
      provider: SKILL_CANDIDATE.provider,
      source: SKILL_CANDIDATE.source,
      resourceBase: SKILL_RESOURCE_BASE,
      content: await readFile(SKILL_BODY_URL, 'utf8'),
    }
  },
}
