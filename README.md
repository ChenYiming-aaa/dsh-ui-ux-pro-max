<h1 align="center">dsh-ui-ux-pro-max</h1>

> DeepSeek Harness 的 UI/UX 设计智能库插件：内置 84 种风格、192 个调色板、74 组字体、99 条 UX 规范、25 种图表与 22 个技术栈，全部离线可用、中文优先。

<p align="center">
  <img src="https://img.shields.io/github/stars/ChenYiming-aaa/dsh-ui-ux-pro-max" alt="stars" />
  <img src="https://img.shields.io/github/license/ChenYiming-aaa/dsh-ui-ux-pro-max" alt="license" />
  <img src="https://img.shields.io/npm/v/dsh-ui-ux-pro-max" alt="npm" />
  <img src="https://img.shields.io/github/actions/workflow/status/ChenYiming-aaa/dsh-ui-ux-pro-max/ci.yml?label=CI" alt="CI" />
  <img src="https://img.shields.io/badge/dsh--plugin-DeepSeek%20Harness-blue" alt="dsh-plugin" />
  <img src="https://img.shields.io/badge/Node-%3E%3D22-green" alt="Node" />
</p>

已发布到 npm：[dsh-ui-ux-pro-max](https://www.npmjs.com/package/dsh-ui-ux-pro-max)，可通过 DSH Desktop 插件市场一键安装。

> 兼容性：`peerDependencies` 按预发布线逐条声明，覆盖 0.1.0 / 0.1.1 / 0.2.0 / 0.2.1 四条线及其正式版（上界 `<0.3.0-0`）。已在 **0.2.0-rc.2**、**0.1.1-rc.2** 与 **0.0.1-rc.1** 上验证工具定义编译、`execute`、输出 schema、`render`、`presentCall` / `presentResult` 与内置技能注册；完整矩阵见 [docs/DSH-COMPAT.md](docs/DSH-COMPAT.md)。

## 功能特性

- **三个模型工具** — `design_recommend` 生成完整设计系统、`design_review` 按 99 条 UX 规范审查 UI、`design_search` 检索领域/技术栈数据库
- **数据完全内置** — 4200 行数据库随插件打包，零网络、零 Python、零第三方运行时依赖
- **中文优先** — 全中文输出；内置 300+ 中文术语→英文词典与 CJK 分词，输入「金融 SaaS 数据看板」即可命中
- **设计旋钮**（1-10）— `variance` 大胆度 / `motion` 动效强度（附 GSAP 方案）/ `density` 密度
- **纯 JS 重写** — 上游 Python 实现整体重写为 BM25 检索引擎 + 设计系统生成器

## 快速开始

### 方式一：插件市场安装（推荐）

插件已发布到 npm（`dsh-ui-ux-pro-max@1.2.0`），可直接在 **DSH Desktop 插件市场**中搜索安装；或使用 CLI：

```powershell
dsh plugin --profile desktop add --save-exact dsh-ui-ux-pro-max@1.2.0   # DSH Desktop
dsh plugin --profile web     add --save-exact dsh-ui-ux-pro-max@1.2.0   # dsh web
```

> 💡 提示：DSH Desktop 不把 `dsh` 命令加入 PATH——请**新开一个终端**（桌面版自带 host-commands）；若仍提示找不到命令，先执行 `npm install -g @deepseek-ai/dsh`。

### 方式二：一键安装

```powershell
git clone https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max.git
cd dsh-ui-ux-pro-max
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

脚本自动完成：将插件复制到 profile 的共享 `node_modules`（默认 `C:\Users\<用户名>\.dsh\profiles\node_modules\dsh-ui-ux-pro-max\`）、备份并追加 `cordis.patch.yml`，重复执行不会重复添加。

### 方式三：手动安装

1. 克隆仓库，把整个 `dsh-ui-ux-pro-max` 目录放入 profile 的共享 node_modules（DSH Desktop 与 Web 端共用此层）：
   ```
   C:\Users\<用户名>\.dsh\profiles\node_modules\dsh-ui-ux-pro-max\
   ```
2. 编辑 profile 下的 `cordis.patch.yml`，追加注册条目：

   ```yaml
   - insert:
       - id: ui-ux-pro-max
         name: dsh-ui-ux-pro-max
         config: {}
   ```

3. 重启 DSH Desktop 或 `npx @deepseek-ai/dsh web`，模型即可在对话中直接调用三个工具（纯宿主端形态，无需客户端 UI）。

## 工具速查

| 工具 | 用户这样问 | 工具做什么 |
|------|-----------|-----------|
| `design_recommend` | 「帮我的**金融 SaaS 数据看板**出一套设计方案」 | 返回完整设计系统：推荐风格（带理由）→ 配色 HEX 与 CSS 变量 → 字体搭配 → 落地页模式 → UX 规范要点 |
| `design_review` | 「**检查一下**我的登录页有什么 UX 问题」 | 按 99 条 UX 规范 + 移动端 + React 性能规范审查，按严重度排序给出问题清单与修改建议 |
| `design_search` | 「我想要**毛玻璃 深色**风格 / **React 导航性能**怎么做」 | 按领域或技术栈检索内置数据库，命中风格、配色、图表、动效等具体条目 |

三个工具均返回结构化、中文、带理由的结果，模型可直接在对话中调用。

## 内置数据库

全部数据随插件离线打包，零网络依赖：

| 类别 | 内容 |
|------|------|
| 🎨 设计素材 | 风格 **84** · 调色板 **192** · 字体搭配 **74** · 图表 **25** · 落地页模式 **34** |
| 🧩 组件与动效 | 图标 **105** · GSAP 动效 **16** |
| 📋 审查规范 | UX 规范 **99** · React 性能 **44** · 移动端接口 **30** · 推理规则 **161** |
| 📚 检索支撑 | 产品类型 **192** · 技术栈 **22** · Google 字体 **1923**（懒加载） |

## 使用示例

### 场景 1 · 新项目设计方案

> 你：帮我的**金融 SaaS 数据看板**出一套设计方案

模型调用 `design_recommend`，返回：推荐风格（rank 1-3 + 理由）→ 配色 HEX 与 CSS 变量 → 字体搭配 → 落地页模式 → 反模式清单 → UX 规范要点 → 技术栈规范。

### 场景 2 · 审查现有 UI

> 你：**检查一下**我的移动端登录表单有什么 UX 问题

模型调用 `design_review`，按严重度返回问题清单与修改建议，附交付前通用检查清单。

### 场景 3 · 检索设计灵感

> 你：想要**毛玻璃 深色**风格；React Native 列表导航性能怎么做

模型调用 `design_search`，分别命中风格条目与 React 性能规范。

## 目录结构

```
dsh-ui-ux-pro-max/
├── index.js               # 薄入口：只重导出 plugin 层
├── lib/
│   ├── plugin/            # L5 宿主适配（apply / skill / SchemaSpec 方言）
│   ├── tools/             # L4 三个工具（一工具一文件）
│   ├── presentation/      # L3 Markdown 渲染
│   ├── domain/            # L3 设计系统 / 审查 / 旋钮 / 推理 / 清单
│   ├── search/            # L2 BM25 引擎 + 检索门面
│   ├── repo/              # L2 数据访问 + 能力数字
│   ├── i18n/              # L1 中文标签 / 词典 / 查询扩展
│   └── config.js          # L0 横切常量（超时 / 条数 / 渲染预算）
├── data/                  # 内置数据库（index.json / fonts.json / meta.json）
├── skills/ui-ux-pro-max/  # 模型使用指南（中文 SKILL.md）
├── references/            # 交付前检查清单
├── examples/              # 设计系统落地示例（单文件、零依赖、可离线打开）
├── tests/                 # 离线自检 + 契约/分层/方言/清单校验（CI 执行）
├── docs/                  # 贡献者文档（架构 / 上游同步 / DSH 兼容，不随包发布）
├── install.ps1            # 一键安装（按 files[] 白名单复制）
└── cordis.patch.yml       # bundle 注册
```

## 示例：把设计系统做成可运行的页面

两个示例都是**单文件、零第三方依赖、可离线直接打开**，用来证明设计系统被真正遵守，而不是只写在文档里。

> **关于令牌来源**：两个示例的令牌基座来自 `design_recommend` 的真实输出，但部分令牌按场景语义做了**人工演化**（风格取舍、旅行场景的天空蓝主色等）。每个示例的 CSS 头部注释都列出了与工具当前输出的具体差异——示例因此同时演示「机器输出」与「人工打磨」两条链路。重新生成示例前请先读这些注释。

### 1. `examples/fintech-dashboard.html` —— 金融数据看板

来自 `design_recommend("金融 SaaS 数据看板", stack: react)`：Data-Dense Dashboard + Heat Map。

- **风格**：12 列栅格、KPI 卡、趋势面积图、环形配置图、行业热力图、可排序表格
- **令牌**：全部颜色/间距走 CSS 变量，浅深两套主题（正文对比度均 ≥ 4.5:1），页内附「设计令牌」面板可展开核对
- **字体**：Fira Code（数字/等宽对齐）+ Fira Sans（正文），离线自动回退系统字体栈

### 2. `examples/trip-planner-workbench.html` —— 行程编排工作台

来自 `design_recommend("旅游行程规划工作台…", stack: react, variance 2 / motion 2 / density 8)`：Minimalism & Swiss + Financial Dashboard（企业级专业工具基调）。

把 [better-trip-planner](https://github.com/ChenYiming-aaa/better-trip-planner) 的技能能力映射成三栏工作台：

- **左栏**：行程结构（按天导航 + 城际交通分隔 + 花费小计）
- **中栏**：逐小时时间轴（拖拽排序 + 键盘上下移动 + 删除 + 高德深链）；**四种模式**——整趟旅行 / 单日规划 / 空档填充（15 分钟步行半径候选）/ 临场重排（原方案 vs 重排结果 diff，可一键应用）
- **右栏**：地图（示意走向 + 真实高德深链）/ 预算（分类占比 + 预算健康度）/ 预订（按截止日排序 + 实时倒计时 + 官方深链）/ 行前简报 / 渲染（7 套主题 + 门禁状态）
- **信任设计**：`已核实 / 估算 / 需官方核对` 三态徽标；`AMAP_KEY` 缺失时**全局降级提示**并标注估算；底栏常驻内容门禁与数据源状态；明示**不代订、不付款、不收集个人信息**

两个示例共同遵守的规范：状态完备（骨架屏 / 空态 / 提示条）、无障碍（语义地标、`aria-sort`/`scope`/`caption`、标签页方向键导航、图表无障碍名称、`focus-visible`、`prefers-reduced-motion`、≥44px 触摸目标、安全区内边距）、**无 emoji 图标**（全部内联 SVG）。

## 测试与验证

无需网络、无需 DSH 运行时即可复现全部检查（CI 在 Node 22 / 24 上运行）：

```bash
npm test
# = check-package → smoke → check-example → check-counts → contract
#   → check-imports → check-schema → dom-smoke
#   （dom-smoke 在 jsdom 缺失时自动跳过；CI 另在独立目录安装 jsdom 后运行）
```

**`check-package.mjs`** 覆盖历史上真实踩过的坑：`package.json` 的 UTF-8 BOM（会导致 DSH CLI `JSON.parse` 崩溃）、`dsh.bundle.patch` 缺失、`files[]` 指向不存在的文件、生命周期脚本（市场会拒绝安装）、`cordis.patch.yml` 的 insert 形状、`data/*.json` 可解析性与计数一致性，以及上游溯源字段。

**`smoke.mjs`** 覆盖插件行为：数据库完整性、`design_recommend`（中文查询 → 完整设计系统）、`design_review`（严重度排序）、`design_search`（领域/技术栈/中文映射）、中文结构化输出、清单一式两源同步。

**`check-example.mjs`** 覆盖示例页面：脚本可编译、无障碍要点、令牌化程度、状态完备性、无 emoji 图标。

**`check-counts.mjs`** 保证 README / SKILL.md / package.json 中的能力数字与 `data/meta.json` 一致；**`contract.mjs`** 保证 schema 与 `execute` 返回值一致；**`check-imports.mjs`** 把分层铁律、无循环依赖、`data/` 路径唯一性变成 CI 断言；**`check-schema.mjs`** 拦住 SchemaSpec 方言错误（写错只有宿主运行时才会报）。

> 运行时兼容性另有一层验证：在真实 DSH 上校验工具定义编译、输出 schema、`render` / `presentCall` / `presentResult` 与 `apply()` 注册（依赖本机 DSH 安装路径，故不随仓库分发）。验证矩阵与命令见 [docs/DSH-COMPAT.md](docs/DSH-COMPAT.md)。

## 贡献者文档

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 分层、依赖铁律、新增代码该放哪
- [docs/DSH-COMPAT.md](docs/DSH-COMPAT.md) — 已验证宿主线 × 验证项、SchemaSpec 方言、降级契约
- [docs/UPSTREAM-SYNC.md](docs/UPSTREAM-SYNC.md) — 上游同步 SOP 与差异看板
- [docs/refactor-plan.md](docs/refactor-plan.md) — 本次结构升级的完整方案

## 致谢

数据与算法移植自 [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)（MIT），针对 DSH 插件形态重写为纯 JS、离线、中文优先。参考：`zhaiyateng/dsh-design-skills`、`Viger1/dsh-design`、`superdesigndev/superdesign-skill`。

数据快照对应上游 `137597b`（2026-07-03），2026-08-19 转码；逐行溯源方法与结果见 [docs/UPSTREAM-SYNC.md](docs/UPSTREAM-SYNC.md)。

## 许可证

[MIT](LICENSE) © ChenYiming-aaa。第三方数据与算法来源详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。