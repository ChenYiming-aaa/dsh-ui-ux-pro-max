<h1 align="center">dsh-ui-ux-pro-max</h1>

> DeepSeek Harness 的 UI/UX 设计智能库插件：内置 **88 种设计风格、192 个调色板、74 组字体搭配、119 条 UX 规范、25 种图表类型与 22 个技术栈**，完全离线、中文优先。

<p align="center">
  <img src="https://img.shields.io/github/license/ChenYiming-aaa/dsh-ui-ux-pro-max" alt="license" />
  <img src="https://img.shields.io/npm/v/dsh-ui-ux-pro-max" alt="npm" />
  <img src="https://img.shields.io/github/actions/workflow/status/ChenYiming-aaa/dsh-ui-ux-pro-max/ci.yml?label=CI" alt="CI" />
  <img src="https://img.shields.io/badge/dsh--plugin-DeepSeek%20Harness-blue" alt="dsh-plugin" />
</p>

纯宿主端 DSH 插件：注册 `design_recommend` / `design_review` / `design_search` 三个模型工具，以及内置技能 `ui-ux-pro-max`。无客户端 UI、无网络请求、无运行时依赖。

> 仓库当前版本 **1.3.0**。npm 上的实际版本以 [npm 包页](https://www.npmjs.com/package/dsh-ui-ux-pro-max) 为准；未更新时请用源码安装。
>
> 兼容性：覆盖 0.1.0 / 0.1.1 / 0.2.0 / 0.2.1 四条 DSH 预发布线及其正式版（上界 `<0.3.0-0`）。已在 **0.2.0-rc.2** 与 **0.1.1-rc.2** 验证工具定义、`execute`、输出 schema、`render`、`presentCall` / `presentResult` 与技能注册。详见 [docs/DSH-COMPAT.md](docs/DSH-COMPAT.md)。

## 特性

- **三个模型工具**：生成设计系统、审查 UX、按领域/技术栈检索。
- **数据完全内置**：4319 行数据库随包发布，零网络、零 Python、零第三方运行时依赖。
- **中文优先**：全中文输出，400+ 中文术语映射 + CJK 二元分词。
- **设计旋钮**：`variance` 大胆度 / `motion` 动效强度（附 GSAP 方案）/ `density` 密度，均为 1-10。
- **纯 JS 重写**：BM25 检索引擎 + 设计系统生成器，Node `^22.19 || >=24`。

## 安装

### 插件市场 / npm

```powershell
dsh plugin --profile desktop add --save-exact dsh-ui-ux-pro-max@1.3.0
dsh plugin --profile web     add --save-exact dsh-ui-ux-pro-max@1.3.0
```

> DSH Desktop 不把 `dsh` 加入 PATH，请新开终端；若仍找不到命令，先 `npm install -g @deepseek-ai/dsh`。

### 源码一键安装

```powershell
git clone https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max.git
cd dsh-ui-ux-pro-max
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

安装脚本按 `files[]` 白名单复制到 profile 的共享 `node_modules`，并幂等追加 `cordis.patch.yml` 注册条目；支持 `-ProfileDir` / `-ProfileName`。

### 手动安装

把包放入 `<profile>\..\node_modules\dsh-ui-ux-pro-max\`，在 profile 的 `cordis.patch.yml` 追加：

```yaml
- insert:
    - id: ui-ux-pro-max
      name: dsh-ui-ux-pro-max
      config: {}
```

重启 DSH Desktop，或运行 `npx @deepseek-ai/dsh web`。

## 工具

| 工具 | 用途 |
|---|---|
| `design_recommend` | 产品类型 + 关键词 → 完整设计系统：风格优先级、HEX 配色与 CSS 变量、字体搭配、落地页模式、UX 要点、反模式、旋钮 |
| `design_review` | 按 UX + 移动端 + React 性能规范审查 UI，按严重度排序，附交付前检查清单 |
| `design_search` | 按领域（style/color/chart/landing/product/ux/typography/icons/gsap/react/web/google-fonts）或 22 个技术栈检索 |

三个工具均返回结构化中文结果；`render` 输出 Markdown，`design_recommend` 另有令牌摘要卡片。

## 内置数据

| 类别 | 内容 |
|---|---|
| 设计素材 | 风格 **88** · 调色板 **192** · 字体搭配 **74** · 图表 **25** · 落地页模式 **34** |
| 组件与动效 | 图标 **105** · GSAP 动效 **17** |
| 审查规范 | UX 规范 **119** · React 性能 **44** · 移动端接口 **32** · 推理规则 **192** |
| 检索支撑 | 产品类型 **192** · 技术栈 **22** · Google 字体 **1934**（懒加载） |

- 风格数据共 88 条，其中 9 条 `deprecated` 默认不参与检索（79 条可检索）。
- 技术栈规范默认排除 `deprecated`；显式查询 `legacy` / `deprecated` 时保留。
- 数据来源：上游 `nextlevelbuilder/ui-ux-pro-max-skill@56ea9cf`（2026-10-15）。溯源字段与统计口径见 [docs/DATA-PROVENANCE.md](docs/DATA-PROVENANCE.md)。

## 示例

```text
design_recommend("金融 SaaS 数据看板", projectName: "金融智控台", stack: "react", variance: 8)
design_review("移动端登录表单", platform: "mobile")
design_search("毛玻璃 深色", domain: "style")
```

两个可离线打开的单文件示例：

- [examples/fintech-dashboard.html](examples/fintech-dashboard.html) — 金融数据看板：KPI、趋势图、环形图、热力图、可排序表格。
- [examples/trip-planner-workbench.html](examples/trip-planner-workbench.html) — 行程编排工作台：时间轴、地图、预算、预订倒计时、四种模式与重排 diff。

## 目录结构

```
dsh-ui-ux-pro-max/
├── index.js                # 薄入口：重导出 plugin 层
├── lib/
│   ├── plugin/             # L5 宿主适配（apply / skill / SchemaSpec 方言）
│   ├── tools/              # L4 三个工具（一工具一文件）
│   ├── presentation/       # L3 Markdown 渲染
│   ├── domain/             # L3 设计系统 / 审查 / 旋钮 / 推理 / 清单
│   ├── search/             # L2 BM25 + 检索门面
│   ├── repo/               # L2 数据访问 + 能力数字
│   ├── i18n/               # L1 中文标签 / 词典 / 查询扩展
│   └── config.js           # L0 横切常量
├── data/                   # 内置数据库
├── skills/ui-ux-pro-max/   # SKILL.md
├── references/             # 交付前检查清单
├── examples/               # 单文件示例
├── tests/                  # 测试（不发布）
├── docs/                   # 贡献者文档（不发布）
├── install.ps1
└── cordis.patch.yml
```

依赖方向：`plugin → tools → presentation/domain → search/repo → i18n → config`。

## 测试

无需网络、无需 DSH 运行时：

```bash
npm test
```

覆盖：清单/数据完整性、离线行为、示例页规范与 DOM 交互、能力数字、中文词典、schema 契约、分层依赖、SchemaSpec 方言。`dom-smoke` 在 jsdom 缺失时自动跳过。

真实宿主验证依赖本机 DSH 路径，不随仓库分发；矩阵与命令见 [docs/DSH-COMPAT.md](docs/DSH-COMPAT.md)。

## 文档

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 分层、依赖铁律、新增代码位置
- [docs/DATA-PROVENANCE.md](docs/DATA-PROVENANCE.md) — 数据来源、计数与口径
- [docs/DSH-COMPAT.md](docs/DSH-COMPAT.md) — 宿主兼容矩阵、SchemaSpec 方言、降级契约
- [docs/refactor-plan.md](docs/refactor-plan.md) — 结构升级方案（历史记录）

## 致谢与许可证

数据与算法移植自 [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)（MIT），针对 DSH 插件形态重写为纯 JS、离线、中文优先。第三方来源详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

[MIT](LICENSE) © ChenYiming-aaa。
