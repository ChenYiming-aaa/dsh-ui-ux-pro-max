<h1 align="center">dsh-ui-ux-pro-max</h1>

> DeepSeek Harness 的 UI/UX 设计智能库插件：内置 84 种风格、192 个调色板、74 组字体、99 条 UX 规范、25 种图表与 22 个技术栈，全部离线可用、中文优先。

<p align="center">
  <img src="https://img.shields.io/github/stars/ChenYiming-aaa/dsh-ui-ux-pro-max" alt="stars" />
  <img src="https://img.shields.io/github/license/ChenYiming-aaa/dsh-ui-ux-pro-max" alt="license" />
  <img src="https://img.shields.io/npm/v/dsh-ui-ux-pro-max" alt="npm" />
  <img src="https://img.shields.io/badge/dsh--plugin-DeepSeek%20Harness-blue" alt="dsh-plugin" />
  <img src="https://img.shields.io/badge/Node-%3E%3D22-green" alt="Node" />
</p>

已发布到 npm：[dsh-ui-ux-pro-max](https://www.npmjs.com/package/dsh-ui-ux-pro-max)，可通过 DSH Desktop 插件市场一键安装。

> 兼容性：已验证于 DSH 0.1.1-rc.2（`@deepseek-ai/dsh`、`dsh-tools`、`dsh-skill` 0.1.1-rc.2）。

## 功能特性

- **三个模型工具** — `design_recommend` 生成完整设计系统、`design_review` 按 99 条 UX 规范审查 UI、`design_search` 检索领域/技术栈数据库
- **数据完全内置** — 4200 行数据库随插件打包，零网络、零 Python、零第三方运行时依赖
- **中文优先** — 全中文输出；内置 300+ 中文术语→英文词典与 CJK 分词，输入「金融 SaaS 数据看板」即可命中
- **设计旋钮**（1-10）— `variance` 大胆度 / `motion` 动效强度（附 GSAP 方案）/ `density` 密度
- **纯 JS 重写** — 上游 Python 实现整体重写为 BM25 检索引擎 + 设计系统生成器

## 快速开始

### 方式一：插件市场安装（推荐）

插件已发布到 npm（`dsh-ui-ux-pro-max@1.0.2`），可直接在 **DSH Desktop 插件市场**中搜索安装；或使用 CLI：

```powershell
dsh plugin --profile desktop add --save-exact dsh-ui-ux-pro-max@1.0.2   # DSH Desktop
dsh plugin --profile web     add --save-exact dsh-ui-ux-pro-max@1.0.2   # dsh web
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
├── index.js               # 宿主插件：3 个工具 + 内置技能
├── lib/                   # BM25 检索 / 离线数据 / 中文词典 / 设计系统 / 审查构建 / 输出格式化
├── data/                  # 内置数据库（index.json / fonts.json / meta.json）
├── skills/ui-ux-pro-max/  # 模型使用指南（中文 SKILL.md）
├── references/            # 交付前检查清单
├── install.ps1            # 一键安装
└── cordis.patch.yml       # bundle 注册
```

## 致谢

数据与算法移植自 [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)（MIT），针对 DSH 插件形态重写为纯 JS、离线、中文优先。参考：`zhaiyateng/dsh-design-skills`、`Viger1/dsh-design`、`superdesigndev/superdesign-skill`。

## 许可证

[MIT](LICENSE) © ChenYiming-aaa。第三方数据与算法来源详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。