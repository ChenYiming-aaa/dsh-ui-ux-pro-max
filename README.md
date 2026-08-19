# dsh-ui-ux-pro-max

[![GitHub stars](https://img.shields.io/github/stars/ChenYiming-aaa/dsh-ui-ux-pro-max)](https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max/stargazers)
[![License](https://img.shields.io/github/license/ChenYiming-aaa/dsh-ui-ux-pro-max)](LICENSE)
[![dsh-plugin](https://img.shields.io/badge/dsh--plugin-DeepSeek%20Harness-blue)](https://github.com/topics/dsh-plugin)
[![Platform](https://img.shields.io/badge/platform-DeepSeek%20Harness-4A7DFF)](https://github.com/deepseek-ai/deepseek-harness)

> 🎨 **DeepSeek Harness（DSH）插件**：基于 GitHub 开源项目
> [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)（MIT License）
> **修改优化**而成的 **UI/UX 设计智能库**——内置 **67 种设计风格、161 个调色板、57 组字体搭配、
> 99 条 UX 规范、25 种图表类型**，覆盖 **22 个技术栈**，外加 1900+ 条 Google Fonts 元数据。
> 数据库完全内置、**离线可用、零网络依赖**，输出**中文优先、带理由**的结构化设计系统建议。

---

## ✨ 特点

- 🧠 **三个模型工具**：`design_recommend`（生成完整设计系统）、`design_review`（UX 审查清单）、`design_search`（领域/技术栈检索）
- 📦 **数据完全内置**：4200 行数据库随插件打包（`data/index.json` + `data/fonts.json`），无网络、无 Python、无第三方运行时依赖
- 🇨🇳 **中文优先**：输出全中文字段；内置 300+ 中文术语 → 英文关键词词典 + CJK 二元分词，输入「金融 SaaS 数据看板」「毛玻璃 深色」即可命中英文语料
- 🎚️ **三个设计旋钮**（1-10）：`variance` 大胆度 / `motion` 动效强度（附加 GSAP 方案）/ `density` 密度（覆盖间距刻度）
- 🛠️ **纯 JS 重写**：BM25 检索引擎与设计系统生成器以纯 JavaScript 重新实现，无上游 Python 依赖

## 🧰 工具

| 工具 | 用途 | 何时使用 |
|------|------|----------|
| `design_recommend` | 产品类型 + 关键词 → 完整设计系统建议（风格优先级排序+理由、配色 HEX、字体组合、落地页模式、UX 规范要点、反模式、决策规则） | 新建项目/页面、选风格配色字体 |
| `design_review` | 按 99 条 UX 规范 + 移动端接口 + React 性能规范审查现有 UI，按严重度排序，附交付前通用检查清单 | 评审页面、检查无障碍、优化交互 |
| `design_search` | 按领域（style/color/chart/landing/product/ux/typography/icons/gsap/react/web/google-fonts）或 22 个技术栈检索数据库 | 补充图表/图标/动效/技术栈细节 |

> 插件为**纯宿主端工具形态**（无客户端 UI），安装后模型即可在对话中直接调用。

## 📦 内置数据库

| 内容 | 数量 |
|------|------|
| 设计风格（styles） | 84 条（含 67 种风格分类） |
| 调色板（colors） | 192 条（含 161 个产品类型调色板） |
| 字体搭配（typography） | 74 条（含 57 组搭配） |
| UX 规范（ux-guidelines） | 99 条 |
| 图表类型（charts） | 25 种 |
| 产品类型（products） | 192 条 |
| 落地页模式（landing） | 34 种 |
| 图标（icons） | 105 个 |
| GSAP 动效（motion） | 16 组 |
| React 性能（react-performance） | 44 条 |
| 移动端接口规范（app-interface） | 30 条 |
| 推理规则（ui-reasoning） | 161 条 |
| Google 字体（google-fonts） | 1923 条（懒加载） |
| 技术栈规范（stacks） | 22 个 |

## 🚀 安装

### 方式 A：DSH Desktop（推荐）

1. 将插件包复制到 profile 的共享 `node_modules`：
   `<profile>\node_modules\dsh-ui-ux-pro-max\`
   （本机示例：`C:\Users\cwqjk\.dsh\profiles\desktop`，包目录为同级的 `...\profiles\node_modules\`）
2. 在 `<profile>\cordis.patch.yml` 追加：

   ```yaml
   - insert:
       - id: ui-ux-pro-max
         name: dsh-ui-ux-pro-max
         config: {}
   ```

3. 重启 DSH Desktop。

或直接运行一键安装脚本（幂等，自动完成 1-2 步，自动备份 patch）：

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

### 方式 B：Web / CLI（npx @deepseek-ai/dsh web）

1. 把插件包放入 DSH checkout 或 profile 的 `node_modules`
2. 以 overlay 方式启动：`pnpm dsh web --patch ./cordis.patch.yml`（或把包加入 profile 的 `dsh.profile.bundles`）

> 依赖说明：插件仅使用 DSH 已内置的 peer 能力（`@deepseek-ai/cordis` / `dsh-tools` / `dsh-skill`），无需额外安装 npm 包。

## 💬 使用示例

模型在对话中直接调用工具即可：

```
design_recommend(query: "金融 SaaS 数据看板", projectName: "金融智控台", stack: "react", variance: 8, density: 8)
design_review(target: "移动端登录表单", platform: "mobile")
design_search(query: "毛玻璃 深色", domain: "style")
design_search(query: "list 性能 导航", stack: "react-native")
```

### design_recommend 返回结构（中文优先、结构化）

```
项目名称 / 产品类别
├─ 推荐风格（rank 1..3，每项带理由、适用场景、模式支持）
├─ 配色方案（Primary/On Primary/Secondary/Accent/Background/... 全部 HEX + CSS 变量）
├─ 字体搭配（标题/正文字体、Google Fonts 链接、CSS 导入）
├─ 落地页模式（区块顺序 / CTA 位置 / 转化优化）
├─ 关键效果 / 反模式（避免清单）
├─ 选择理由（配色气质 / 字体气质 / 优先级 / 决策规则）
├─ UX 规范要点（严重度标记）
├─ 技术栈规范（如传 stack）
└─ 旋钮/GSAP 动效/间距刻度/实现清单（如启用）
```

## 🧑‍💻 开发

```bash
# 从源技能 CSV 重建内置 JSON 索引（默认读取 ui-ux-pro-max 源目录）
node scripts/build-data.mjs [源数据目录]

# 离线冒烟测试（验收标准验证）
node tests/smoke.mjs

# 用 DSH 真实运行时的 dsh-tools 校验工具 schema 与执行
node --import ./tests/register-loader.mjs tests/validate-tools.mjs
node --import ./tests/register-loader.mjs tests/validate-apply.mjs
```

## 📁 目录结构

```
dsh-ui-ux-pro-max/
├── index.js               # 宿主插件：3 个工具 + 内置技能 + Host RPC（保留供未来客户端面板）
├── lib/
│   ├── bm25.js            # BM25 检索引擎（中文二元分词）
│   ├── database.js        # 离线数据加载 + 领域/技术栈搜索
│   ├── zh.js              # 中文标签映射 + 300+ 中文别名词典
│   ├── design-system.js   # 设计系统生成器
│   ├── review.js          # UX 审查清单构建器
│   └── format.js          # 中文 Markdown 输出
├── data/                  # 内置数据库（index.json / fonts.json / meta.json）
├── skills/ui-ux-pro-max/SKILL.md    # 模型使用指南（中文）
├── references/quick-reference.md    # 交付前检查清单
├── scripts/build-data.mjs # CSV → JSON 构建脚本
├── tests/                 # 离线冒烟 + 运行时校验测试
├── install.ps1            # DSH Desktop 一键安装
├── cordis.patch.yml       # 插件 bundle 注册
└── package.json           # npm 包配置（dsh.bundle.patch）
```

## 🙏 致谢

- **上游开源项目**：[nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)（MIT License，11.8 万+ star）—— 本插件的数据、搜索与设计系统生成算法均移植自该项目，并针对 DeepSeek Harness 插件形态做了优化（纯 JS 重写、离线内置、中文优先、结构化工具输出）
- 插件形态参考：`zhaiyateng/dsh-design-skills`（技能包组织）、`Viger1/dsh-design`（工具 + 内置技能 + 审查接入）、`superdesigndev/superdesign-skill`（设计系统表达）

## 📄 许可证

[MIT](LICENSE) © ChenYiming-aaa。第三方数据与算法来源详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

---

> 🔎 在 [GitHub Topics](https://github.com/topics/dsh-plugin) 上通过 `dsh-plugin` / `deepseek-harness` / `ui-ux-pro-max` 标签发现本插件。
