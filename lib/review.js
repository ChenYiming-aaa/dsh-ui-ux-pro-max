/**
 * review.js — UX 审查清单构建器（design_review 工具核心）
 *
 * 结合两部分：
 *  1. 数据库检索：按审查对象关键词从 ux-guidelines / app-interface(web) /
 *     react-performance 三个领域检索具体规范，并按严重度排序。
 *  2. 通用 Quick Reference 检查清单：来自源技能 SKILL.md 的交付前检查项
 *     （视觉质量 / 交互 / 深浅色模式 / 布局 / 无障碍 / 性能 / 表单 / 导航）。
 */

import { search } from './database.js'
import { SEVERITY_ORDER } from './zh.js'

/** Quick Reference 通用检查清单（源技能 Pre-Delivery Checklist + Common Rules 中文整理） */
export const QUICK_REFERENCE_CHECKLIST = [
  {
    category: '视觉质量',
    checks: [
      '禁止用 emoji 作为结构图标（使用 SVG/矢量图标库，如 Phosphor、Heroicons、Lucide）',
      '图标统一来自同一套图标家族，保持一致的描边粗细与风格（线性/填充不混用）',
      '使用官方品牌素材，比例与留白符合品牌规范',
      '按压态视觉效果不改变布局边界、不引起抖动',
      '全程使用语义化主题令牌（design tokens），禁止逐屏硬编码颜色',
      '图标尺寸以设计令牌定义（icon-sm/icon-md/icon-lg），不做任意值',
      '图标与文字基线对齐，间距一致',
    ],
  },
  {
    category: '交互',
    checks: [
      '所有可点击元素提供明确的按压反馈（水波纹/透明度/抬升），80-150ms 内响应',
      '触摸目标最小 44×44pt（iOS）/ 48×48dp（Android），小图标用 hitSlop 扩展热区',
      '微交互时长控制在 150-300ms，使用平台原生缓动',
      '禁用态语义清晰（disabled 属性 + 视觉弱化），看起来不可点却无响应是错误',
      '屏幕阅读器焦点顺序与视觉顺序一致，交互标签描述清晰',
      '避免嵌套手势冲突（tap/drag/返回手势互斥）',
      '优先使用原生交互组件（Button/Pressable），并带正确的无障碍角色',
      '可点击元素必须有 cursor:pointer',
    ],
  },
  {
    category: '深色 / 浅色模式',
    checks: [
      '浅色模式正文对比度 ≥ 4.5:1，深色模式正文 ≥ 4.5:1、次要文字 ≥ 3:1',
      '卡片/表面与背景有明显层级（足够的透明度/投影）',
      '分隔线/边框在两种主题下都可见（不能只在浅色下可见）',
      '按压/聚焦/禁用态在深浅色下可区分度一致',
      '用语义色令牌按主题映射，禁止硬编码逐屏 hex',
      '模态遮罩足够强（通常 40-60% 黑色）保证前景可读',
      '交付前必须独立测试两种主题（不能从单一主题推断）',
    ],
  },
  {
    category: '布局与间距',
    checks: [
      '遵守顶部/底部安全区（刘海、状态栏、手势条），固定头部/标签栏/CTA 不遮挡内容',
      '滚动内容不被固定/粘性栏遮挡（列表底部加内容内边距）',
      '在 375px 小屏、大屏、平板（横竖屏）上验证',
      '水平内边距随断点/横屏自适应，不能所有尺寸同一窄边距',
      '保持 4/8dp 间距节奏（组件、区块、页面层级一致）',
      '长文在大屏上保持可读行长（避免平板全宽段落）',
      '定义清晰纵向节奏层级（16/24/32/48）',
    ],
  },
  {
    category: '无障碍',
    checks: [
      '有意义的图片/图标都有无障碍标签（accessibilityLabel / alt）',
      '表单字段有标签、提示与清晰的错误信息',
      '颜色不是唯一的信息指示方式',
      '支持减少动态（prefers-reduced-motion）与动态字体（Dynamic Type）而不破坏布局',
      '无障碍角色/状态（selected/disabled/expanded）正确播报',
      '键盘导航焦点可见（focus-visible）',
    ],
  },
  {
    category: '性能（React / 移动端）',
    checks: [
      '长列表虚拟化（virtualize-lists），避免渲染全部节点',
      '主线程预算：动画/布局不阻塞主线程（main-thread-budget）',
      '防抖/节流高频事件（debounce-throttle）',
      '避免瀑布请求（waterfall），Suspense + 动态导入拆分 bundle',
      'memo/useCallback 控制重渲染，避免无关 state 变化触发列表重渲染',
    ],
  },
  {
    category: '表单与输入',
    checks: [
      '内联校验（inline-validation），错误即时且清晰',
      '错误信息具体可操作（error-clarity），不只标红',
      '焦点管理（focus-management）：提交/关闭后焦点落位正确',
      '输入类型正确（input type / autocomplete），移动端弹出正确键盘',
    ],
  },
  {
    category: '导航与信息架构',
    checks: [
      '导航层级清晰（nav-hierarchy），底部导航不超过 4-5 项（bottom-nav-limit）',
      '返回行为符合平台习惯（back-behavior）',
      '深链接/状态恢复：切后台回来不丢状态',
      '空状态、加载态、错误态都有设计（empty/loading/error states）',
    ],
  },
]

/**
 * 构建 UX 审查清单。
 * @param {object} options
 * @param {string} options.target - 审查对象描述（如「移动端登录表单」「数据分析看板」）
 * @param {string} [options.platform] - web / mobile / desktop
 * @param {number} [options.maxRules] - 检索到的具体规范条数上限
 * @returns {object} 结构化中文审查清单
 */
export function buildReview({ target, platform = 'web', maxRules = 8 }) {
  const query = `${target} ${platform}`
  const sources = [
    { domain: 'ux', label: 'UX 规范' },
    { domain: 'web', label: '移动端接口规范' },
    { domain: 'react', label: 'React 性能' },
  ]

  const collected = []
  for (const { domain } of sources) {
    const result = search(query, domain, 6)
    for (const { row, score } of result.results) {
      const severity = SEVERITY_ORDER[row.Severity] !== undefined ? row.Severity : 'Medium'
      collected.push({
        category: row.Category || '',
        issue: row.Issue || row.Guideline || '',
        platform: row.Platform || platform,
        description: row.Description || '',
        do: row.Do || '',
        dont: row["Don't"] || '',
        severity,
        source: domain,
        score,
      })
    }
  }

  // 去重（同一 issue 只保留严重度最高的）
  const seen = new Map()
  for (const rule of collected) {
    const key = `${rule.category}|${rule.issue}`
    const prev = seen.get(key)
    if (!prev || (SEVERITY_ORDER[rule.severity] ?? 9) < (SEVERITY_ORDER[prev.severity] ?? 9)) {
      seen.set(key, rule)
    }
  }
  const unique = [...seen.values()]

  // 严重度排序：Critical > High > Medium > Low，同级按相关度
  unique.sort((a, b) => {
    const d = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
    if (d !== 0) return d
    return b.score - a.score
  })

  const priorityRules = unique.slice(0, maxRules)
  const bySeverity = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  for (const rule of priorityRules) {
    bySeverity[rule.severity] = (bySeverity[rule.severity] || 0) + 1
  }

  return {
    target,
    platform,
    summary: {
      matchedRules: priorityRules.length,
      bySeverity,
      checklistSections: QUICK_REFERENCE_CHECKLIST.length,
    },
    priorityRules,
    checklist: QUICK_REFERENCE_CHECKLIST,
  }
}
