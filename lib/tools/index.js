/**
 * tools/index.js — 工具注册表（L4）
 *
 * 新增工具只改这一处（加一行）+ 新建一个工具文件。
 */

import { designRecommendTool } from './design-recommend.js'
import { designReviewTool } from './design-review.js'
import { designSearchTool } from './design-search.js'

/** 三个工具规格，按注册顺序排列。 */
export const toolSpecs = Object.freeze([
  designRecommendTool,
  designReviewTool,
  designSearchTool,
])

export const toolNames = Object.freeze(toolSpecs.map(tool => tool.name))
