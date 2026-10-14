# examples/ — 设计系统落地示例

两个示例都是**单文件、零第三方依赖、可离线直接打开**的 HTML，用来证明
`design_recommend` 输出的设计系统被真正遵守，而不是只写在文档里。

- `fintech-dashboard.html` — 金融数据看板（Data-Dense Dashboard + Heat Map）
- `trip-planner-workbench.html` — 行程编排工作台（三栏 + 四种模式）

## 为什么有两个「重复」的文件

两示例**有意**各自自包含：README 对用户的承诺是「单文件、双击即开、离线可看」，
引入外部 CSS/JS 或构建链都会违背这一承诺（也无法再单个文件转发）。

代价是两者共享一部分脚手架代码。当前共享/曾共享的部分：

| 类别 | 内容 |
|---|---|
| JS 工具 | `$` / `$$` / `applyTheme` / `stamp` / `downloadCsv`（CSV 导出带 BOM+CRLF） |
| CSS 基座 | 盒模型重置、`body` 基型、`:focus-visible`、`.sr-only`、`.skip-link` |
| 组件 | `.btn` 系列、`.segmented`（radiogroup 语义）、`.badge`、`.skeleton`/`.state` |
| 行为 | 主题切换（localStorage + 系统偏好 + FOUC 前移）、触摸目标热区、`prefers-reduced-motion` 降级 |

**同步修改约定**：修改上表任何一项时，**必须同步改另一个示例**，并跑：

```bash
node tests/check-example.mjs   # 含跨示例一致性断言（共享工具函数 + 主题键）
node tests/dom-smoke.mjs       # 两个示例的真实 DOM 交互回归
```

`check-example.mjs` 会校验两个文件都定义了共享核心工具
（`$`/`$$`/`applyTheme`/`stamp`/`downloadCsv`）且使用同一主题键
（`uiux-demo-theme`）——这是防漂移的底线，不是完整的一致性检查，
**语义层面的同步仍依赖Review**。

## 关于「不建构建链」的决策

曾评估用 `scripts/build-examples.mjs` 从 `examples/src/` 模板 + 共享片段
生成单文件（CI 校验生成物与提交物一致），最终**否决**：

1. 两个示例的令牌值、字体、组件集已显著分化（Fira Sans vs Inter、
   天空蓝 vs 信任蓝、看板 vs 工作台），真正共享的是「通用工具」而非「设计」；
2. 生成器会引入模板条件分支，可读性低于直接的重复；
3. 仓库坚持零工具链（CI 只跑 `node tests/`），构建器与气质冲突。

若未来增加到**三个以上**示例、或共享部分继续膨胀，再重新评估该方案。

## 修改示例时的自查

- [ ] 跑四个测试（见 README.md「测试与验证」）
- [ ] 涉及令牌/文字时，用 Chrome headless 实际渲染截图核对（SVG 内
      `font-size` 是 viewBox 用户单位，不是屏幕像素——踩过坑）
- [ ] 改动设计系统宣称时，同步 CSS 头部注释的「与工具真实输出差异」清单
