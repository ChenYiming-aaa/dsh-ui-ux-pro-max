---
name: ui-ux-pro-max
description: UI/UX 设计智能库：通过 design_recommend / design_review / design_search 工具获取中文优先、带理由的设计系统建议（风格/配色/字体/UX 规范/图表/技术栈），覆盖 88 种设计风格、192 个调色板、74 组字体搭配、119 条 UX 规范、25 种图表类型与 22 个技术栈。数据完全内置、离线可用。
whenToUse: 新建或改造界面、评审 UX、选风格/配色/字体、查图表/动效/技术栈规范时使用。
---

# UI/UX 设计智能库（ui-ux-pro-max）

为 Web / 移动端 / 桌面应用提供设计智能：**88 种设计风格、192 个调色板、74 组字体搭配、119 条 UX 规范、25 种图表类型**，覆盖 **22 个技术栈**。数据库完全内置在插件中（无网络、无 Python 依赖）。三个工具各有分工，先选对工具再查：

## 先选对工具

| 你在做什么 | 用哪个 | 说明 |
|---|---|---|
| 新项目/新页面，要一套完整设计系统 | `design_recommend` | 风格、配色、字体、落地页、UX 要点一次给全 |
| 评审已有界面、查无障碍/交互/性能问题 | `design_review` | 按严重度排序，附交付前检查清单 |
| 查某类素材或细节（图表/图标/动效/技术栈/产品类型） | `design_search` | 定向检索，结果更集中 |
| 只输入一个汉字（`图`/`色`/`字`/`动`） | `design_search` | 唯一支持单字领域兜底的工具 |

**不要把 `design_recommend` 当搜索框。** 它会先用 `product` 域判定产品类别，单字或过短的查询容易得到偶然类别（例如 `色` 会落到 "Digital Signage / Kiosk"），再据此生成整套建议就会跑偏。查素材请用 `design_search`。

## 使用流程

### 1. 从零开始做界面 → `design_recommend`

新页面、新项目先用它拿一整套方案，再按需补检索：

```
design_recommend(query: "财务 数据看板 深色 高密度", projectName: "财务中台", stack: "react")
design_recommend(query: "AI 搜索 极简 留白", projectName: "AI Search", variance: 8, motion: 6, density: 8)
```

- `query`：写「产品类型 + 行业 + 气质/功能」，**至少两个词**，最想强调的放最前；单个汉字或「好看一点」这类泛词会先被误判类别。
  - 中文直接写中文即可（「财务 数据看板 深色」）；但 `gsap` / `react` / `web` / `google-fonts` 的语料是英文，留英文术语命中更准（`scroll reveal`、`memo`）。
  - 中文会映射到英文语料（「金融」→ fintech、「毛玻璃」→ glassmorphism）；检索按 token 打分，原词权重 1.0、扩展词 0.6，所以堆同义词不会更准——`"毛玻璃 深色"` 与 `"毛玻璃 玻璃 深色 暗色"` 结果一样。
- `stack`（可选）：附加该技术栈的实现规范（react / nextjs / vue / flutter / swiftui / javafx / wpf / winui / avalonia / uno / uwp / threejs / angular / laravel / svelte / astro / nuxtjs / nuxt-ui / html-tailwind / shadcn / jetpack-compose / react-native）。
- 三个 1-10 旋钮（可选）：
  - `variance`：1=居中/极简，10=大胆/不对称（粗野主义、Bento 网格）
  - `motion`：1=克制，10=复杂编排；会附加匹配的 GSAP 动效方案
  - `density`：1=宽松（24-96px 间距），10=紧凑/看板（8-32px 间距）
- **返回结构**：推荐风格（按优先级排序、带理由）→ 配色方案（HEX 令牌 + CSS 变量）→ 字体搭配 → 落地页模式 → UX 规范要点 → 反模式 → 决策规则 →（可选）技术栈规范 / GSAP 动效 / 间距刻度 / 实现清单。
- **UX 规范要点**：固定不少于 3 条；命中不足时会用通用类别（Accessibility/Layout/Forms 等）兜底。看到偏通用的条目时把它当基线，不要当作"该产品专属结论"。

### 2. 已有界面，想知道哪里不对 → `design_review`

连同**页面、关键交互、出错的现象**一起描述，得到按严重度排序的规范 + 交付前检查清单：

```
design_review(target: "移动端登录页，提交后没有任何反馈", platform: "mobile")
design_review(target: "数据看板首屏加载慢，图表出来晚", platform: "web", maxRules: 12)
```

- `target` 写具体：页面/组件 + 关键交互 + 状态或现象（「结算页优惠券输入 错误态」比「结算页」有用得多）。
- `platform` 只影响**同严重度内的先后**：**严重度仍是第一排序键**，匹配平台的规则靠前，不匹配的 ×0.5 降权但**保留**（不是硬过滤）。`desktop` 按 `web` 口径处理（库内没有桌面专属规则）；`react-native` / `flutter` 会额外追加该栈的框架规范。

把返回的规则当作检查清单逐条核对；若某条是刻意例外，在汇报里说明而不是悄悄跳过。

### 3. 只缺一块：定点补 → `design_search`

| 缺什么 | `domain` | 示例 |
|---|---|---|
| 换一种风格 | `style` | `design_search("毛玻璃 深色", "style")` |
| 定配色 | `color` | `design_search("金融 信任蓝", "color")` |
| 选图表 | `chart` | `design_search("实时监控 趋势", "chart")` |
| 选字体 | `typography` | `design_search("高端 优雅", "typography")` |
| 表单/无障碍规范 | `ux` | `design_search("表单 校验 无障碍", "ux")` |
| 排落地页 | `landing` | `design_search("首屏 用户评价 定价", "landing")` |
| 判断产品类型 | `product` | `design_search("金融 数据看板", "product")` |
| 找图标 | `icons` | `design_search("导航 设置", "icons")` |
| 写动效 | `gsap` | `design_search("scroll reveal stagger", "gsap")` |
| 治列表卡顿 | `react` | `design_search("列表 卡顿 memo", "react")` |
| 修移动端遮挡 | `web` | `design_search("safe area 安全区", "web")` |
| 挑 Google 字体 | `google-fonts` | `design_search("monospace 等宽 可变", "google-fonts")` |
| 查框架规范 | `stack` 参数 | `design_search("长列表 性能 导航", stack: "react-native")` |

`domain` 可省略（自动识别），但已知领域时显式传入更稳；`maxResults` 取 1-8，默认 3。

**单字查询**只登记了 4 个语义没有争议的字：

| 字 | 领域 | 说明 |
|---|---|---|
| `图` | chart | 图表类型与选型建议 |
| `色` | color | 调色板与配色 |
| `字` | typography | 字体搭配 |
| `动` | ux | 动效/动画相关规范 |

`表`（表单/表格）、`页`（页面/落地页）这类一字多义的字**故意不收录**——宁可不猜，也不把查询带到错误领域。未登记的单字可能返回空结果，这不代表库里没有该领域。

已登记单字在目标领域零命中时会返回该领域的**默认条目**，结构化结果里带 `fallback: true`，Markdown 会注明「默认条目」。这类结果只作方向参考，不要当成精确命中。

检索默认排除上游标记为 `deprecated` 的条目（9 条风格、部分技术栈规范）；若确实要沿用旧项目的遗留风格，在查询里带上 `legacy` / `deprecated` 即可召回（风格与技术栈同一套判定）。需要“正常查询但包含废弃条目”时，给 `design_search` 传 `includeDeprecated: true`；它只放行 `Status=deprecated` 的行，不改变查询词与排序。

## 结果解读（避免误读）

- `score` 是**单次查询内**的 BM25 相对分，不是百分比或置信度；不要跨领域比较，也不要把 `0.00` 当成"完全无关"（领域兜底条目就是 0）。
- **空结果 = 本次查询没匹配**，不等于库里没有这个领域。改用 2-4 个字的关键词、英文术语，或换一个 `domain` 重试；已知领域时显式传入。
- 领域自动识别可能把查询带到相邻领域（例如「动」→ ux 的动效规范）；结果不对时显式指定 `domain`。
- 有 `fallback: true` 的结果表示"没精确命中、给的是领域默认条目"，汇报时要说明，不要把它包装成检索命中。

## 常见误用

- 把 `platform` 当硬过滤，期待结果集只剩该平台规则。
- 把 UX 的 3 条通用兜底要点当成产品专属结论。
- 把空结果解释成"设计库里没有这个领域"。

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
