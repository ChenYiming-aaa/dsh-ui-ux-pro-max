---
name: ui-ux-pro-max
description: UI/UX 设计智能库：通过 design_recommend / design_review / design_search 工具获取中文优先、带理由的设计系统建议（风格/配色/字体/UX 规范/图表/技术栈），覆盖 67 种设计风格、161 个调色板、57 组字体搭配、99 条 UX 规范、25 种图表类型与 22 个技术栈。数据完全内置、离线可用。
---

# UI/UX 设计智能库（ui-ux-pro-max）

为 Web / 移动端 / 桌面应用提供设计智能：**67 种设计风格、161 个调色板、57 组字体搭配、99 条 UX 规范、25 种图表类型**，覆盖 **22 个技术栈**。数据库完全内置在插件中（无网络、无 Python 依赖），通过三个模型工具查询：

| 工具 | 用途 | 何时使用 |
|------|------|----------|
| `design_recommend` | 产品类型 + 关键词 → 完整设计系统建议（风格/配色/字体/UX 规范 + 理由） | 新建项目/页面、选风格配色字体、生成设计系统 |
| `design_review` | 按 UX 规范清单审查现有 UI（严重度优先 + 交付前检查清单） | 评审页面、检查无障碍、优化交互 |
| `design_search` | 按领域 / 技术栈检索设计数据库 | 补充细节：图表、图标、动效、技术栈最佳实践 |

查询支持中文：中文产品/风格词会自动映射到设计数据库（如「金融」→ fintech、「毛玻璃」→ glassmorphism）。

## 使用流程

### 1. 生成设计系统（首选）→ `design_recommend`

**始终先用 `design_recommend`** 拿到完整建议，再按需补充检索：

```
design_recommend(query: "金融 SaaS 数据看板", projectName: "金融智控台", stack: "react")
design_recommend(query: "AI 搜索工具 现代 极简", projectName: "AI Search", variance: 8, motion: 6, density: 8)
```

- `query`：产品类型 + 行业 + 关键词，多维度组合效果更好：`"entertainment social vibrant content-dense"` 优于 `"app"`；中文亦可：`"美容 SPA 高端"`。
- `stack`（可选）：附加该技术栈的实现规范（react / nextjs / vue / flutter / swiftui / javafx / wpf / winui / avalonia / uno / uwp / threejs / angular / laravel / svelte / astro / nuxtjs / nuxt-ui / html-tailwind / shadcn / jetpack-compose / react-native）。
- 三个 1-10 旋钮（可选）：
  - `variance`：1=居中/极简，10=大胆/不对称（粗野主义、Bento 网格）
  - `motion`：1=克制，10=复杂编排；会附加匹配的 GSAP 动效方案
  - `density`：1=宽松（24-96px 间距），10=紧凑/看板（8-32px 间距）

**返回结构**：推荐风格（按优先级排序、带理由）→ 配色方案（HEX 令牌 + CSS 变量）→ 字体搭配 → 落地页模式 → UX 规范要点 → 反模式 → 决策规则 →（可选）技术栈规范 / GSAP 动效 / 间距刻度 / 实现清单。

### 2. 评审现有 UI → `design_review`

描述要审查的页面/组件，得到针对性规范（按严重度：严重/高/中/低）+ 通用交付前检查清单：

```
design_review(target: "移动端登录表单", platform: "mobile")
design_review(target: "数据分析看板", platform: "web", maxRules: 12)
```

把返回的规则当作检查清单逐条核对；若某条是刻意例外，在汇报里说明而不是悄悄跳过。

### 3. 补充细节检索 → `design_search`

| 需要 | domain | 示例 |
|------|--------|------|
| 更多风格选项 | `style` | `design_search("毛玻璃 深色", "style")` |
| 配色方案 | `color` | `design_search("fintech 信任蓝", "color")` |
| 图表推荐 | `chart` | `design_search("实时仪表盘 趋势", "chart")` |
| 字体搭配 | `typography` | `design_search("优雅 高端", "typography")` |
| UX 最佳实践 | `ux` | `design_search("表单 无障碍 加载", "ux")` |
| 落地页结构 | `landing` | `design_search("hero 社会证明 定价", "landing")` |
| 图标 | `icons` | `design_search("导航 设置", "icons")` |
| GSAP 动效 | `gsap` | `design_search("scroll reveal stagger", "gsap")` |
| React 性能 | `react` | `design_search("rerender memo list", "react")` |
| 移动端接口规范 | `web` | `design_search("accessibilityLabel 安全区", "web")` |
| Google 字体 | `google-fonts` | `design_search("monospace variable font", "google-fonts")` |
| 技术栈规范 | `stack` 参数 | `design_search("list 性能 导航", stack: "react-native")` |

## 通用规则（专业 UI 底线）

- **图标**：默认 Phosphor 图标库；优先从完整图标集选语义贴切的矢量图标，Heroicons 作备选。**禁止用 emoji 作为结构图标**；图标统一尺寸令牌（icon-sm/md/lg）、统一描边与线性/填充风格。
- **触控**：触摸目标 ≥44×44pt（iOS）/ ≥48×48dp（Android），小图标用 hitSlop 扩展。
- **按压反馈**：80-150ms 内给出反馈，微交互 150-300ms 且用平台原生缓动；按压态不改变布局边界。
- **对比度**：浅色正文 ≥4.5:1；深色模式独立测试（正文 ≥4.5:1、次要文字 ≥3:1）；分隔线/状态在深浅两套主题下都可见。
- **间距**：4/8dp 节奏，定义纵向层级（16/24/32/48）；大屏长文保持 45-75 字符行长。
- **安全区**：遵守刘海/状态栏/手势条；滚动内容不被固定栏遮挡。
- **语义令牌**：用语义化颜色/间距令牌，禁止逐屏硬编码 hex。
- **状态完备**：空状态、加载态（骨架屏）、错误态、禁用态都要设计，不能只做 happy path。

## 交付前检查

- [ ] 无 emoji 图标（用 SVG 矢量图标库）
- [ ] 触摸目标达标、按压反馈清晰、cursor-pointer
- [ ] 深浅色模式对比度都达标（独立测试，不推断）
- [ ] 375px 小屏 + 横竖屏验证，安全区无遮挡
- [ ] 无障碍：标签/焦点顺序/角色正确，支持 reduced-motion 与动态字体
- [ ] 长列表虚拟化、防抖节流、避免瀑布请求
- [ ] 表单内联校验、错误清晰、焦点管理正确
