/**
 * contracts.js — 三个工具的输入/输出契约（单一源，L4）
 *
 * 这里只有 JSDoc typedef，不产生运行时依赖。output.schema 与 presentation
 * 格式化器共同引用这些类型；tests/contract.mjs 校验「schema 声明」与
 * 「execute 实际返回」一致。
 *
 * @typedef {object} DesignSystem
 * @property {string} projectName
 * @property {string} category
 * @property {{name:string, sections:string, ctaPlacement:string, colorStrategy:string, conversion:string}} pattern
 * @property {Array<object>} styles
 * @property {object} colors
 * @property {object} typography
 * @property {string} [keyEffects]
 * @property {string[]} [antiPatterns]
 * @property {object} [reasoning]
 * @property {Array<object>} [uxGuidelines]
 * @property {Array<object>} [stackGuidelines]
 * @property {object} [dials]
 * @property {object|null} [motionSnippet]
 * @property {object|null} [spacingScale]
 * @property {string[]} [implementationChecklist]
 * @property {string} [designSystemVariables]
 * @property {string|null} [stackName]
 *
 * @typedef {object} Review
 * @property {string} target
 * @property {string} platform
 * @property {{matchedRules:number, bySeverity:Record<string, number>, checklistSections:number}} summary
 * @property {Array<object>} priorityRules
 * @property {Array<{category:string, checks:string[]}>} checklist
 *
 * @typedef {object} SearchResult
 * @property {string} domain
 * @property {string} [stack]
 * @property {string} query
 * @property {number} count
 * @property {Array<{row:object, score:number}>} results
 * @property {string} [expandedQuery]
 * @property {string} [error]
 *
 * @typedef {object} ToolSpec
 * @property {string} name
 * @property {string} description
 * @property {number} timeoutMs
 * @property {object} parameters
 * @property {{schema:object, render:Function, presentationMeta?:Function}} output
 * @property {Function} execute
 * @property {Function} [presentCall]
 * @property {Function} [presentResult]
 */

export {}
