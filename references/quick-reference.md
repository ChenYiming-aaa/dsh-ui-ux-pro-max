# UI/UX 设计智能库 · Quick Reference 检查清单

> 本清单与 `design_review` 工具输出对应，供人工快速核对与模型交付前自查。
> 范围说明：App UI（iOS/Android/React Native/Flutter）与 Web 均适用，标注平台处按平台执行。

## §1 视觉质量（CRITICAL）

- [ ] 禁止用 emoji 作为结构图标 —— 使用矢量图标库（Phosphor / Heroicons / Lucide）
- [ ] 图标统一来自同一套家族：统一描边粗细、统一线性/填充风格、统一尺寸令牌（icon-sm/md/lg）
- [ ] 官方品牌素材：正确比例与留白，不改色不重绘
- [ ] 按压态视觉效果不改变布局边界、不引起抖动
- [ ] 全程使用语义化主题令牌，禁止逐屏硬编码 hex
- [ ] 图标与文字基线对齐，间距一致
- [ ] 图标对比度：小元素 ≥4.5:1，大图形 ≥3:1

## §2 交互（CRITICAL）

- [ ] 所有可点击元素提供明确按压反馈（水波纹/透明度/抬升），80-150ms 内响应
- [ ] 触摸目标 ≥44×44pt（iOS）/ ≥48×48dp（Android）；小图标用 hitSlop 扩展
- [ ] 微交互 150-300ms，平台原生缓动；禁用 >500ms 的缓慢动画
- [ ] 禁用态语义清晰（disabled + 视觉弱化），不提供点击动作
- [ ] 屏幕阅读器焦点顺序与视觉顺序一致，标签描述清晰
- [ ] 每区域一个主手势，避免嵌套 tap/drag/返回手势冲突
- [ ] 优先使用原生交互组件（Button/Pressable）并带正确无障碍角色
- [ ] 可点击元素必须有 cursor:pointer

## §3 深色 / 浅色模式（HIGH）

- [ ] 浅色模式正文对比度 ≥4.5:1；卡片/表面与背景层级清晰
- [ ] 深色模式正文 ≥4.5:1、次要文字 ≥3:1（独立测试，不推断）
- [ ] 分隔线/边框在两种主题下都可见
- [ ] 按压/聚焦/禁用态在深浅色下可区分度一致
- [ ] 语义色令牌按主题映射，禁止逐屏硬编码
- [ ] 模态遮罩足够强（通常 40-60% 黑）保证前景可读

## §4 布局与间距（HIGH）

- [ ] 遵守顶部/底部安全区（刘海、状态栏、手势条）；固定头部/标签栏/CTA 不遮挡内容
- [ ] 滚动内容不被固定/粘性栏遮挡（加底部内容内边距）
- [ ] 375px 小屏、大屏、平板（横竖屏）均验证
- [ ] 水平内边距随断点/横屏自适应
- [ ] 保持 4/8dp 间距节奏（组件/区块/页面层级一致）
- [ ] 长文大屏保持可读行长（避免平板全宽段落）
- [ ] 纵向节奏层级清晰（16/24/32/48）

## §5 无障碍（HIGH）

- [ ] 有意义的图片/图标都有无障碍标签（accessibilityLabel / alt）
- [ ] 表单字段有标签、提示与清晰错误信息
- [ ] 颜色不是唯一信息指示方式
- [ ] 支持 reduced-motion 与动态字体（Dynamic Type）而不破坏布局
- [ ] 无障碍角色/状态（selected/disabled/expanded）正确播报
- [ ] 键盘焦点可见（focus-visible）

## §6 性能（HIGH）

- [ ] 长列表虚拟化（virtualize-lists）
- [ ] 主线程预算：动画/布局不阻塞主线程
- [ ] 高频事件防抖/节流（debounce-throttle）
- [ ] 避免瀑布请求；Suspense + 动态导入拆分 bundle
- [ ] memo/useCallback 控制重渲染

## §7 表单与输入（HIGH）

- [ ] 内联校验，错误即时清晰可操作
- [ ] 焦点管理：提交/关闭后焦点落位正确
- [ ] 输入类型正确（input type / autocomplete），移动端弹出正确键盘

## §8 导航与信息架构（MEDIUM）

- [ ] 导航层级清晰；底部导航 ≤4-5 项
- [ ] 返回行为符合平台习惯
- [ ] 空状态、加载态、错误态都有设计
- [ ] 深链接/状态恢复不丢状态

## 色彩专项

- 深色模式对比度问题：查 `color` 领域关键词 `dark mode` / `accessible pairs`
- 动画不自然：查 `gsap` 领域 `spring physics` / `easing` / `exit faster than enter`
- 表单体验差：查 `ux` 领域 `inline validation` / `error clarity` / `focus management`
- 导航混乱：查 `ux` 领域 `nav hierarchy` / `bottom nav limit` / `back behavior`
- 小屏布局破碎：查 `ux` 领域 `mobile first` / `breakpoint consistency`
- 卡顿：查 `react` 领域 `virtualize lists` / `main thread budget` / `debounce throttle`

## 查询策略提示

- 多维度关键词组合：`"产品类型 + 行业 + 气质 + 密度"`，如 `"entertainment social vibrant content-dense"`
- 同一需求换词重试：`"playful neon"` → `"vibrant dark"` → `"content-first minimal"`
- 先 `design_recommend` 拿完整建议，再 `design_search` 深挖不确定的维度
- 已知技术栈时传 `stack` 参数获取实现级规范
