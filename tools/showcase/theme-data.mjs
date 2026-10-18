/**
 * 风格图鉴：人工策划的中文元数据 + 预览主题。
 *
 * - zh / tag / desc：站点展示用的中文名称、适用场景短语、风格描述。
 * - theme：用于渲染「效果示例」的设计令牌。只覆盖与默认推导不同的部分，
 *   缺失字段由 build.mjs 从 data/index.json 自动提取补全。
 *
 * 每个预览都由同一套组件骨架渲染，只更换令牌，因此可以横向比较
 * 色彩、字体、圆角、描边、阴影与材质差异。
 */

export const STYLE_META = {
  'minimalism-and-swiss-style': {
    zh: '极简主义 / 瑞士风格',
    tag: '企业后台 · 文档站 · 专业工具',
    desc: '以网格、留白和字号层级建立秩序，只用黑白灰加一个强调色。信息密度可控、装饰为零，适合需要长期阅读与高频操作的专业界面。',
    theme: { bg: '#FFFFFF', surface: '#FFFFFF', surface2: '#F4F4F2', text: '#0A0A0A', muted: '#6B6B6B', border: '#E2E2DE', accent: '#E2231A', accent2: '#0A0A0A', radius: 0, font: 'grotesk', fw: 700, fx: ['rules', 'minimal'] }
  },
  'neumorphism': {
    zh: '新拟态',
    tag: '智能家居 · 控制面板 · 概念原型',
    desc: '控件从同色底板中「挤」出来：左上受光、右下投影，按下则反过来凹陷。柔和无描边，适合小面积的开关、旋钮与播放控制，不适合大面积正文。',
    theme: { bg: '#E8EDF2', surface: '#E8EDF2', surface2: '#EDF1F5', text: '#3D4852', muted: '#7A8794', border: '#DCE3EA', accent: '#5B7FA6', accent2: '#8FA8BF', radius: 16, font: 'sans', fx: ['neu'] }
  },
  'glassmorphism': {
    zh: '毛玻璃',
    tag: 'SaaS 后台 · 音乐/媒体应用 · 仪表盘浮层',
    desc: '半透明面板叠加背景模糊，用 1px 亮边勾出玻璃厚度。层次感强、氛围轻盈，但文字对比度依赖背景，正文密集处需谨慎。',
    theme: { mode: 'dark', bg: '#241263', surface: 'rgba(255,255,255,0.14)', surface2: 'rgba(255,255,255,0.2)', text: '#FFFFFF', muted: 'rgba(255,255,255,0.74)', border: 'rgba(255,255,255,0.3)', accent: '#A855F7', accent2: '#22D3EE', radius: 20, font: 'sans', fx: ['mesh', 'glass'] }
  },
  'brutalism': {
    zh: '粗野主义',
    tag: '艺术项目 · 独立品牌 · 实验性页面',
    desc: '裸露的结构、纯色块、粗黑描边与巨大字号，拒绝一切修饰。冲击力优先于精致度，适合表达态度，不适合需要信任感的企业界面。',
    theme: { bg: '#FFFFFF', surface: '#FFFFFF', surface2: '#F2F2F2', text: '#000000', muted: '#4A4A4A', border: '#000000', accent: '#FF0000', accent2: '#0000FF', radius: 0, font: 'grotesk', fw: 900, borderW: 3, fx: ['brutal', 'grid'] }
  },
  '3d-and-hyperrealism': {
    zh: '3D 写实',
    tag: '产品发布 · 硬件展示 · 品牌官网',
    desc: '用真实光照、多层阴影与景深制造物理存在感，常配 WebGL 或高质量渲染图。视觉说服力强，但资源开销大，需要降级方案。',
    theme: { mode: 'dark', bg: '#071A2E', surface: '#0E2439', surface2: '#14304A', text: '#F2F6FA', muted: '#9FB3C4', border: 'rgba(255,255,255,0.12)', accent: '#FFD700', accent2: '#228B22', radius: 14, font: 'sans', fx: ['depth', 'glow'] }
  },
  'vibrant-and-block-based': {
    zh: '高饱和色块',
    tag: '创意机构 · 活动页 · 年轻向产品',
    desc: '用 4–6 种高饱和纯色切成大色块，靠面积与对比而非渐变制造节奏。区块间距大、字号大，滚动像翻阅海报。',
    theme: { bg: '#FFFFFF', surface: '#FFFFFF', surface2: '#0A0A0A', text: '#0A0A0A', muted: '#5A5A5A', border: '#0A0A0A', accent: '#FF1493', accent2: '#00E5FF', radius: 6, font: 'grotesk', fw: 800, fx: ['blocks', 'flat'] }
  },
  'dark-mode-oled': {
    zh: 'OLED 深黑',
    tag: '夜间工具 · 开发者产品 · 移动端',
    desc: '纯黑底配高亮强调色，利用 OLED 像素熄灭实现真正省电与无限对比。层次靠 #121212 级的微亮面而非阴影，白色文字需降亮避免眩光。',
    theme: { mode: 'dark', bg: '#000000', surface: '#121212', surface2: '#1A1A1A', text: '#FFFFFF', muted: '#9E9E9E', border: '#262626', accent: '#39FF14', accent2: '#0080FF', radius: 14, font: 'sans', fx: ['glow'] }
  },
  'accessible-and-ethical': {
    zh: '无障碍与伦理设计',
    tag: '公共服务 · 医疗教育 · 政企系统',
    desc: '以 WCAG 增强级对比度为硬约束：正文 7:1、最小字号 16px、3–4px 焦点环、44px 触控区。视觉克制，但可用性优先于风格表达。',
    theme: { bg: '#FFFFFF', surface: '#F7F9FC', surface2: '#EDF2F9', text: '#0B1220', muted: '#44506B', border: '#B9C6D8', accent: '#0B5FFF', accent2: '#0F766E', radius: 10, font: 'sans', fw: 600, fx: ['a11y'] }
  },
  'claymorphism': {
    zh: '黏土拟态',
    tag: '儿童教育 · 消费级 App · 品牌活动',
    desc: '厚圆角、内阴影加外投影，让元素像软陶一样鼓起来；配色以粉彩为主，动效带回弹。亲和力极高，但占空间、难承载高密度信息。',
    theme: { bg: '#F3EDFF', surface: '#FFFFFF', surface2: '#FBF7FF', text: '#3B3355', muted: '#7A7091', border: '#E7DBFF', accent: '#8B5CF6', accent2: '#F9A8D4', radius: 26, font: 'rounded', fw: 800, fx: ['clay'] }
  },
  'aurora-ui': {
    zh: '极光渐变',
    tag: 'AI 产品 · 品牌落地页 · 发布会',
    desc: '大尺度流动渐变色带缓慢呼吸，像极光一样在深底上晕开；常用 screen 混合与 8–12s 循环。氛围强，务必给文字留纯色衬底。',
    theme: { mode: 'dark', bg: '#0A0A18', surface: 'rgba(255,255,255,0.08)', surface2: 'rgba(255,255,255,0.13)', text: '#F4F6FF', muted: '#A9B0D0', border: 'rgba(255,255,255,0.18)', accent: '#FF1493', accent2: '#00FFFF', radius: 18, font: 'sans', fx: ['aurora', 'glass'] }
  },
  'retro-futurism': {
    zh: '复古未来主义',
    tag: '游戏 · 音乐发行 · 潮流品牌',
    desc: '80 年代对未来的想象：霓虹青与品红、CRT 扫描线、轻微故障抖动。情绪浓烈，适合短时沉浸，长时间阅读会疲劳。',
    theme: { mode: 'dark', bg: '#1A1A2E', surface: '#22223C', surface2: '#2C2C4A', text: '#F0F0FF', muted: '#9A9AC4', border: '#3A3A5C', accent: '#FF006E', accent2: '#00FFFF', radius: 4, font: 'mono', fx: ['scanline', 'glow'] }
  },
  'flat-design': {
    zh: '扁平化',
    tag: '工具应用 · 后台系统 · 跨端产品',
    desc: '去掉渐变、阴影与高光，只用纯色、几何图形和清晰的字重区分层级。渲染成本最低、跨端一致，缺点是容易显得缺乏层次。',
    theme: { bg: '#FFFFFF', surface: '#FFFFFF', surface2: '#F5F7F9', text: '#17202A', muted: '#5A6672', border: '#DFE5EB', accent: '#F2542D', accent2: '#1B9AAA', radius: 3, font: 'sans', fx: ['flat'] }
  },
  'skeuomorphism': {
    zh: '拟物化',
    tag: '怀旧产品 · 教育演示 · 品牌彩蛋',
    desc: '木纹、皮革、金属与多层渐变还原真实材质，控件通过高光和倒角提示可按下。识别成本低但风格年代感强，现代产品多用于局部点缀。',
    theme: { bg: '#EFE6D8', surface: '#FBF3E4', surface2: '#E7DAC4', text: '#3B2F22', muted: '#7A6A57', border: '#C9B79C', accent: '#8B5E34', accent2: '#5B7F6B', radius: 10, font: 'serif', fx: ['skeuo', 'grain'] }
  },
  'liquid-glass': {
    zh: '液态玻璃',
    tag: 'iOS / macOS 应用 · 系统级控件',
    desc: '比毛玻璃更进一步：材质随底层内容取色，边缘出现镜面折射与流动形变，转场如液体般连贯。对平台能力依赖强，需准备不透明降级。',
    theme: { bg: '#E9F1FF', surface: 'rgba(255,255,255,0.55)', surface2: 'rgba(255,255,255,0.72)', text: '#0B1220', muted: '#48566B', border: 'rgba(255,255,255,0.85)', accent: '#0071E3', accent2: '#7C3AED', radius: 28, font: 'sans', fx: ['mesh', 'glass', 'gloss'] }
  },
  'motion-driven': {
    zh: '动效驱动',
    tag: '品牌官网 · 产品发布 · 互动叙事',
    desc: '把滚动、悬停与转场当作主要叙事手段：视差分层、入场编排、状态连续过渡。观感流畅，但要为 reduced-motion 与低端设备准备静态版本。',
    theme: { bg: '#FAFAFC', surface: '#FFFFFF', surface2: '#F1F2F7', text: '#14161C', muted: '#5D6472', border: '#E2E4EC', accent: '#F43F5E', accent2: '#6366F1', radius: 14, font: 'sans', fx: ['motion', 'depth'] }
  },
  'micro-interactions': {
    zh: '微交互',
    tag: '表单流程 · 移动应用 · 高频操作工具',
    desc: '在 50–100ms 内用颜色、位移与形变回应用户：按钮回弹、输入校验、加载骨架、手势反馈。单点改动小，累积起来决定产品的手感。',
    theme: { bg: '#FFFFFF', surface: '#FFFFFF', surface2: '#F6F8FA', text: '#161B22', muted: '#5B6572', border: '#E4E9EF', accent: '#22C55E', accent2: '#F59E0B', radius: 12, font: 'sans', fx: ['micro', 'soft'] }
  },
  'inclusive-design': {
    zh: '包容性设计',
    tag: '公共服务 · 医疗健康 · 老龄用户产品',
    desc: '不依赖单一颜色或精细动作传达信息：符号 + 文字 + 图案多重编码，提供动效开关、语音与键盘路径。是规范约束，而非视觉流派。',
    theme: { bg: '#FFFFFF', surface: '#F6F8FB', surface2: '#EAF0F7', text: '#101418', muted: '#46505E', border: '#B7C2D0', accent: '#1D4ED8', accent2: '#B45309', radius: 12, font: 'sans', fw: 600, fx: ['a11y', 'pattern'] }
  },
  'zero-interface': {
    zh: '零界面',
    tag: '智能助手 · 语音设备 · 自动化流程',
    desc: '界面退到幕后：系统基于上下文预测意图，用户用语音、手势或一句话完成任务，只在必要时露出最少的控件。设计重心从屏幕转向流程与信任。',
    theme: { bg: '#FAFAF8', surface: '#FFFFFF', surface2: '#F1F1ED', text: '#23262B', muted: '#6A6F77', border: '#E5E5DF', accent: '#3F8F6B', accent2: '#9B8FBB', radius: 20, font: 'sans', fx: ['minimal', 'soft'] }
  },
  'soft-ui-evolution': {
    zh: '柔和 UI 进化',
    tag: 'SaaS 后台 · 健康应用 · 现代消费产品',
    desc: '新拟态的可用性改良版：保留柔和投影与圆角，但把对比度提到 4.5:1 以上，阴影更浅、层级更明确。温和而不牺牲可读性。',
    theme: { bg: '#F6F9FC', surface: '#FFFFFF', surface2: '#EDF3F9', text: '#1B2733', muted: '#5D6C7B', border: '#DFE8F0', accent: '#5B8DEF', accent2: '#7BC6A8', radius: 14, font: 'sans', fx: ['soft'] }
  },
  'hero-centric-design': {
    zh: '首屏聚焦',
    tag: '品牌落地页 · 产品发布（已弃用）',
    desc: '整屏交给一个主张：超大标题 + 主视觉 + 唯一 CTA，其余内容下沉。转化路径最短，但对文案与视觉质量要求极高。数据标注为已弃用，建议改用 Storytelling 或 Feature-Rich。',
    theme: { bg: '#FFFFFF', surface: '#FFFFFF', surface2: '#F4F6FA', text: '#0B1220', muted: '#586275', border: '#E1E6EF', accent: '#2563EB', accent2: '#0EA5E9', radius: 16, font: 'sans', fw: 800, fx: ['hero', 'grad'] }
  },
  'conversion-optimized': {
    zh: '转化优化',
    tag: '注册落地页 · 电商促销（已弃用）',
    desc: '一切为下一步动作让路：单一高对比 CTA、短表单、紧迫感提示与信任背书紧贴决策点。适合投放页，不适合内容型站点。',
    theme: { bg: '#FFFFFF', surface: '#FFFFFF', surface2: '#FFF4ED', text: '#141414', muted: '#5C5C5C', border: '#E8E8E8', accent: '#FF5A1F', accent2: '#16A34A', radius: 8, font: 'sans', fw: 700, fx: ['cta'] }
  },
  'feature-rich-showcase': {
    zh: '功能全景展示',
    tag: 'B2B SaaS 官网 · 功能对比页（已弃用）',
    desc: '用卡片矩阵把功能、收益与截图铺开，靠图标色与留白分组。信息完整但容易冗长，需严格控制每组卡片数量与文案长度。',
    theme: { bg: '#F8FAFC', surface: '#FFFFFF', surface2: '#EEF2F7', text: '#111827', muted: '#546070', border: '#E2E8F0', accent: '#4F46E5', accent2: '#06B6D4', radius: 16, font: 'sans', fx: ['cards', 'soft'] }
  },
  'minimal-and-direct': {
    zh: '极简直给',
    tag: '单页产品 · 个人作品（已弃用）',
    desc: '单列 680px 内容宽度、18px 正文、几乎无装饰，只保留一个 CTA。阅读体验最好，适合一句话就能说清的产品。',
    theme: { bg: '#FFFFFF', surface: '#FFFFFF', surface2: '#F7F7F5', text: '#1A1A1A', muted: '#666666', border: '#E6E6E2', accent: '#1A1A1A', accent2: '#7C6A58', radius: 2, font: 'serif', fx: ['minimal'] }
  },
  'social-proof-focused': {
    zh: '社会认同',
    tag: '课程/工具落地页 · 订阅转化（已弃用）',
    desc: '把用户评价、客户 Logo、评分与数字指标放在首屏附近，用他人的选择降低决策风险。需要真实素材，否则反噬信任。',
    theme: { bg: '#F9FAFB', surface: '#FFFFFF', surface2: '#F1F5F9', text: '#0F172A', muted: '#5B6678', border: '#E5E9F0', accent: '#2563EB', accent2: '#F59E0B', radius: 14, font: 'sans', fx: ['cards'] }
  },
  'interactive-product-demo': {
    zh: '交互式产品演示',
    tag: '开发者工具 · 试用页（已弃用）',
    desc: '让用户在页面里直接操作真实产品片段，或以分步引导回放关键流程。说服力强，但加载成本与实现复杂度都高。',
    theme: { mode: 'dark', bg: '#0F172A', surface: '#182238', surface2: '#1F2C46', text: '#F1F5F9', muted: '#94A3B8', border: '#2C3A55', accent: '#6366F1', accent2: '#22D3EE', radius: 12, font: 'sans', fx: ['depth', 'glass'] }
  },
  'trust-and-authority': {
    zh: '信任与权威',
    tag: '金融 · 医疗 · 企业采购（已弃用）',
    desc: '深蓝与灰建立专业感，用资质徽章、合规声明、数据背书与客户 Logo 消除疑虑。视觉保守，但每一项装饰都服务于可信度。',
    theme: { bg: '#FFFFFF', surface: '#F8FAFC', surface2: '#EEF3F9', text: '#0B1B33', muted: '#4E5D73', border: '#DCE4EF', accent: '#1E40AF', accent2: '#B45309', radius: 8, font: 'serif', fx: ['cards', 'rules'] }
  },
  'storytelling-driven': {
    zh: '叙事驱动',
    tag: '品牌官网 · 公益传播（已弃用）',
    desc: '按章节推进：每屏一个情绪节点，用滚动触发揭示、配图与渐变过渡串联。适合讲一个完整故事，需要强内容策划支撑。',
    theme: { bg: '#FFF8F1', surface: '#FFFFFF', surface2: '#FBEFE3', text: '#2B1D14', muted: '#6F5B4C', border: '#EADBCB', accent: '#C2410C', accent2: '#0F766E', radius: 14, font: 'serif', fx: ['editorial', 'grad'] }
  },
  'data-dense-dashboard': {
    zh: '高密数据看板',
    tag: '运营后台 · 监控中心 · 内部工具',
    desc: '在有限屏幕内塞入尽可能多的指标：12–14px 字号、36px 行高、8px 栅格、细分割线取代卡片阴影。效率优先，牺牲呼吸感。',
    theme: { bg: '#F5F6F8', surface: '#FFFFFF', surface2: '#EEF1F4', text: '#333333', muted: '#6A737D', border: '#DDE2E7', accent: '#2563EB', accent2: '#22C55E', radius: 6, font: 'sans', fx: ['dense', 'data'] }
  },
  'heat-map-and-heatmap-style': {
    zh: '热力图',
    tag: '行为分析 · 资源调度 · 排班',
    desc: '用冷—暖连续色阶编码数值密度，读者一眼看出热点与空白。需要清晰的色阶图例，并避免用红绿单独承载正负含义。',
    theme: { bg: '#FFFFFF', surface: '#F8FAFC', surface2: '#EDF2F7', text: '#1A202C', muted: '#5A6775', border: '#E2E8F0', accent: '#FF0000', accent2: '#0080FF', radius: 8, font: 'sans', fx: ['heat', 'data'] }
  },
  'executive-dashboard': {
    zh: '高管看板',
    tag: '经营驾驶舱 · 投后管理',
    desc: '第一屏只留 4–6 个核心 KPI 与趋势，细节藏进下钻页。数字大、说明少、结论前置，配合红绿状态与倒计时提醒。',
    theme: { bg: '#F8FAFC', surface: '#FFFFFF', surface2: '#EFF4FA', text: '#0F1B2D', muted: '#5A6B80', border: '#E0E7F0', accent: '#1D4ED8', accent2: '#0F766E', radius: 10, font: 'sans', fx: ['data', 'soft'] }
  },
  'real-time-monitoring': {
    zh: '实时监控',
    tag: '运维大屏 · IoT · 交易风控',
    desc: '数据流持续更新：状态灯、脉冲告警、流式曲线与最新值并列。深色底降低眩光，颜色语义必须严格区分正常/警告/严重。',
    theme: { mode: 'dark', bg: '#0B1220', surface: '#111B2E', surface2: '#16233A', text: '#E8EEF7', muted: '#8FA0B8', border: '#22304A', accent: '#22C55E', accent2: '#EF4444', radius: 10, font: 'sans', fx: ['pulse', 'data'] }
  },
  'drill-down-analytics': {
    zh: '下钻分析',
    tag: 'BI 平台 · 财务分析 · 用户增长',
    desc: '用面包屑、层级缩进与上下文条记录「我在哪一层」，点击图表即进入明细。关键是保持筛选条件可见、可回退。',
    theme: { bg: '#F7F9FC', surface: '#FFFFFF', surface2: '#EDF2F9', text: '#111C2E', muted: '#5A6A7E', border: '#E0E7F1', accent: '#2563EB', accent2: '#7C3AED', radius: 8, font: 'sans', fx: ['dense', 'data'] }
  },
  'comparative-analysis-dashboard': {
    zh: '对比分析看板',
    tag: '竞品分析 · A/B 实验 · 期间对比',
    desc: '同屏并列两组数据：主序列蓝、对照橙/紫，差值用箭头与徽章标注。避免双 Y 轴误导，差异要能被颜色和方向同时读出。',
    theme: { bg: '#F8FAFC', surface: '#FFFFFF', surface2: '#F0F4FA', text: '#101827', muted: '#5B6B80', border: '#E1E8F1', accent: '#2563EB', accent2: '#F97316', radius: 10, font: 'sans', fx: ['data', 'soft'] }
  },
  'predictive-analytics': {
    zh: '预测分析',
    tag: '需求预测 · 风险管理 · 增长建模',
    desc: '历史实线 + 预测虚线 + 置信区间带，异常点高亮。必须标注模型版本与不确定性，否则容易被误读为确定结论。',
    theme: { bg: '#F8FAFC', surface: '#FFFFFF', surface2: '#F1F5FB', text: '#101827', muted: '#5B6B80', border: '#E1E8F1', accent: '#8B5CF6', accent2: '#F59E0B', radius: 10, font: 'sans', fx: ['dashline', 'data'] }
  },
  'user-behavior-analytics': {
    zh: '用户行为分析',
    tag: '增长分析 · 漏斗优化 · 留存',
    desc: '以漏斗、路径图与同期群表格还原用户旅程：每级流失率、分支权重、留存曲线。强化「从哪掉、为什么掉」而非堆砌指标。',
    theme: { bg: '#F8FAFC', surface: '#FFFFFF', surface2: '#F0F5FB', text: '#101827', muted: '#5B6B80', border: '#E1E8F1', accent: '#3B82F6', accent2: '#22C55E', radius: 10, font: 'sans', fx: ['funnel', 'data'] }
  },
  'financial-dashboard': {
    zh: '财务看板',
    tag: '财务系统 · 交易终端 · 预算管理',
    desc: '金额对齐、千分位、正负色与等宽数字是底线；同比/环比与预算差异并列呈现。红色需按财务语义使用，避免与品牌红冲突。',
    theme: { mode: 'dark', bg: '#06182B', surface: '#0C2438', surface2: '#113049', text: '#EAF2FA', muted: '#93A9BE', border: '#1C3A53', accent: '#22C55E', accent2: '#EF4444', radius: 8, font: 'sans', fx: ['data', 'soft'] }
  },
  'sales-intelligence-dashboard': {
    zh: '销售智能看板',
    tag: 'CRM · 销售管理 · 业绩复盘',
    desc: '按阶段呈现管道金额与赢单率，配合排行榜、配额进度与预测准确度。个人与团队视图要能一键切换。',
    theme: { bg: '#F8FAFC', surface: '#FFFFFF', surface2: '#F1F5FB', text: '#101827', muted: '#5B6B80', border: '#E1E8F1', accent: '#F59E0B', accent2: '#22C55E', radius: 10, font: 'sans', fx: ['data', 'cards'] }
  },
  'neubrutalism': {
    zh: '新粗野主义',
    tag: '年轻品牌 · 创作者工具 · 活动页',
    desc: '粗黑描边 + 硬阴影 + 高饱和色块，按下时位移抵消阴影，机械感十足。性格鲜明，但大面积使用会压迫阅读。',
    theme: { bg: '#FFFDF2', surface: '#FFEB3B', surface2: '#FFFFFF', text: '#000000', muted: '#3D3D3D', border: '#000000', accent: '#FF5252', accent2: '#2196F3', radius: 0, font: 'grotesk', fw: 800, borderW: 3, fx: ['brutal'] }
  },
  'bento-box-grid': {
    zh: '便当盒网格',
    tag: '产品官网 · 功能总览 · 个人主页',
    desc: '大小不一的圆角卡片拼成紧密网格，每格承载一个独立信息点。靠尺寸对比而非分割线组织内容，移动端需重排为单列。',
    theme: { bg: '#F5F5F7', surface: '#FFFFFF', surface2: '#FBFBFD', text: '#1D1D1F', muted: '#6E6E73', border: '#E5E5EA', accent: '#4F46E5', accent2: '#FF9F0A', radius: 26, font: 'sans', fx: ['bento'] }
  },
  'y2k-aesthetic': {
    zh: 'Y2K 千禧风',
    tag: '潮流品牌 · 音乐视觉 · 限定活动',
    desc: '银色金属渐变、果冻质感、亮粉与青色霓虹，配像素化与气泡图形。怀旧且高辨识度，仅适合短周期营销场景。',
    theme: { bg: '#F6EDFF', surface: '#FFFFFF', surface2: '#F3E8FF', text: '#2B0B3F', muted: '#6B4A80', border: '#D8B4FE', accent: '#FF69B4', accent2: '#00E5FF', radius: 20, font: 'rounded', fw: 800, fx: ['chrome', 'gloss'] }
  },
  'cyberpunk-ui': {
    zh: '赛博朋克',
    tag: '游戏 HUD · 黑客主题 · 音乐产品',
    desc: '近黑底 + 荧光绿/品红，扫描线、故障抖动、等宽字体与格栅叠加。氛围极强，需严格控制动效频率以免干扰信息读取。',
    theme: { mode: 'dark', bg: '#0D0D0D', surface: '#131313', surface2: '#181C18', text: '#E8FFE8', muted: '#7FA87F', border: '#1F3B1F', accent: '#00FF00', accent2: '#FF00FF', radius: 0, font: 'mono', fx: ['scanline', 'glow', 'grid'] }
  },
  'organic-biophilic': {
    zh: '有机亲自然',
    tag: '健康 · 农业 · 可持续品牌',
    desc: '森林绿、泥土棕与天空蓝，配合不规则圆角、流动曲线与自然纹理。降低压力感，适合长时间停留的陪伴型产品。',
    theme: { bg: '#F5F5DC', surface: '#FFFDF5', surface2: '#EDEFD9', text: '#23301F', muted: '#66765A', border: '#DCE3C9', accent: '#228B22', accent2: '#8B4513', radius: 28, font: 'serif', fx: ['organic'] }
  },
  'ai-native-ui': {
    zh: 'AI 原生界面',
    tag: 'AI 助手 · Copilot · 生成式工具',
    desc: '以对话与生成为核心：流式输出、打字指示、上下文卡片、建议追问。界面需要表达「正在思考」与「可被修正」，而非假装即时准确。',
    theme: { bg: '#F7F7FA', surface: '#FFFFFF', surface2: '#F0F0F6', text: '#16181D', muted: '#5E6373', border: '#E4E4EE', accent: '#6366F1', accent2: '#10B981', radius: 18, font: 'sans', fx: ['ai', 'soft'] }
  },
  'memphis-design': {
    zh: '孟菲斯',
    tag: '活动视觉 · 儿童产品 · 创意工作室',
    desc: '80 年代米兰设计运动：几何色块、波点、锯齿与故意错位的旋转。活泼喧闹，适合小面积与年轻受众。',
    theme: { bg: '#FFF9F0', surface: '#FFFFFF', surface2: '#FFF3E2', text: '#1A1A1A', muted: '#5A5A5A', border: '#1A1A1A', accent: '#FF71CE', accent2: '#FFCE5C', radius: 10, font: 'rounded', fw: 800, fx: ['memphis'] }
  },
  'vaporwave': {
    zh: '蒸汽波',
    tag: '音乐视觉 · 潮流联名 · 亚文化社区',
    desc: '粉紫青三色霓虹、网格地平线、VHS 噪点与日文排版。情绪浓度高，适合作为活动皮肤而非长期界面。',
    theme: { mode: 'dark', bg: '#1A0033', surface: '#2A0B4A', surface2: '#351260', text: '#FFE9FF', muted: '#C39AD8', border: '#4A1F73', accent: '#FF71CE', accent2: '#01CDFE', radius: 6, font: 'mono', fx: ['grid', 'glow', 'scanline'] }
  },
  'dimensional-layering': {
    zh: '层叠维度',
    tag: '设计工具 · 空间型后台 · 卡片流',
    desc: '用四级阴影、模糊与 translateZ 建立清晰的 Z 轴秩序，悬停时图层浮起。层次可读但不过度装饰，适合复杂工作台。',
    theme: { bg: '#F1F3F6', surface: '#FFFFFF', surface2: '#F8FAFC', text: '#171B22', muted: '#5D6573', border: '#E3E7ED', accent: '#3B5BDB', accent2: '#12B886', radius: 16, font: 'sans', fx: ['depth'] }
  },
  'exaggerated-minimalism': {
    zh: '夸张极简',
    tag: '作品集 · 高端品牌 · 概念发布',
    desc: '只留超大字号与巨量留白，单一强调色，字距收紧到 -0.05em。气场强，但信息承载量极低，必须依附强内容。',
    theme: { bg: '#FFFFFF', surface: '#FFFFFF', surface2: '#F5F5F5', text: '#000000', muted: '#5A5A5A', border: '#DEDEDE', accent: '#FF3B00', accent2: '#000000', radius: 0, font: 'grotesk', fw: 900, fx: ['giant'] }
  },
  'kinetic-typography': {
    zh: '动态字体',
    tag: '品牌片头 · 活动页 · 音乐视觉',
    desc: '文字本身即主角：逐字入场、可变字重、渐变填充、跟随滚动的位移。冲击力强，需保证 reduced-motion 下静态可读。',
    theme: { mode: 'dark', bg: '#0A0A0A', surface: '#141414', surface2: '#1C1C1C', text: '#F5F5F5', muted: '#9A9A9A', border: '#2A2A2A', accent: '#FF3D00', accent2: '#00E5FF', radius: 6, font: 'grotesk', fw: 900, fx: ['kinetic', 'glow'] }
  },
  'parallax-storytelling': {
    zh: '视差叙事',
    tag: '品牌故事 · 年度报告 · 展览页面',
    desc: '多层背景以不同速度滚动，配合固定与黏性定位形成纵深，按章节推进叙事。沉浸感强，移动端需降级为静态分层。',
    theme: { mode: 'dark', bg: '#0E1626', surface: '#16213A', surface2: '#1C2A47', text: '#F2F6FF', muted: '#9AA8C4', border: 'rgba(255,255,255,0.12)', accent: '#F59E0B', accent2: '#38BDF8', radius: 12, font: 'serif', fx: ['depth', 'aurora'] }
  },
  'swiss-modernism-2-0': {
    zh: '瑞士现代主义 2.0',
    tag: '设计工作室 · 文化机构 · 产品官网',
    desc: '在经典网格上做现代化处理：12 栏、8px 基准单位、非对称排版、单一强调色。理性、克制、可无限扩展。',
    theme: { bg: '#FFFFFF', surface: '#FFFFFF', surface2: '#F5F5F5', text: '#000000', muted: '#5F5F5F', border: '#DCDCDC', accent: '#FF2D20', accent2: '#000000', radius: 0, font: 'grotesk', fw: 700, fx: ['rules', 'giant'] }
  },
  'hud-sci-fi-fui': {
    zh: '科幻 HUD',
    tag: '游戏界面 · 数据大屏 · 影视概念',
    desc: '虚构飞行器界面语言：细线框、角标、扫描光、等宽读数与网格坐标。信息密度极高，真实产品中多作为装饰层。',
    theme: { mode: 'dark', bg: '#000A14', surface: 'rgba(0,20,36,0.72)', surface2: 'rgba(0,32,52,0.8)', text: '#CFFAFF', muted: '#6FA8B8', border: 'rgba(0,255,255,0.35)', accent: '#00FFFF', accent2: '#0080FF', radius: 0, font: 'mono', fx: ['hud', 'scanline', 'glow'] }
  },
  'pixel-art': {
    zh: '像素风',
    tag: '独立游戏 · 复古社区 · 彩蛋页面',
    desc: '低分辨率网格、有限调色板、硬边与逐帧动画。所有尺寸必须是像素单位的整数倍，否则会被浏览器插值破坏。',
    theme: { mode: 'dark', bg: '#0B0B18', surface: '#1C1C3A', surface2: '#26264F', text: '#F8F8F8', muted: '#A0A0C0', border: '#4A4A8A', accent: '#FFD800', accent2: '#00E436', radius: 0, font: 'pixel', fw: 700, fx: ['pixel'] }
  },
  'bento-grids': {
    zh: '便当网格（旧版）',
    tag: '旧版产品官网（已弃用）',
    desc: '初代便当布局：等大圆角卡片 + 柔和阴影，对比度与排版弹性弱于新版 Bento Box Grid。保留用于复刻旧项目。',
    theme: { bg: '#F5F5F7', surface: '#FFFFFF', surface2: '#FBFBFD', text: '#1D1D1F', muted: '#6E6E73', border: '#E5E5EA', accent: '#0071E3', accent2: '#FF9F0A', radius: 24, font: 'sans', fx: ['bento', 'soft'] }
  },
  'spatial-ui-visionos': {
    zh: '空间界面（visionOS）',
    tag: '空间计算 · AR/VR · 沉浸式应用',
    desc: '悬浮的半透明窗口、深度阴影与视线悬停反馈，材质随环境光变化。布局从平面转向空间层级，注重舒适观看距离。',
    theme: { bg: '#DDE7FF', surface: 'rgba(255,255,255,0.38)', surface2: 'rgba(255,255,255,0.58)', text: '#10131A', muted: '#46506B', border: 'rgba(255,255,255,0.9)', accent: '#0A84FF', accent2: '#AF52DE', radius: 28, font: 'sans', fx: ['mesh', 'glass', 'depth'] }
  },
  'e-ink-paper': {
    zh: '电子墨水 / 纸张',
    tag: '阅读应用 · 笔记工具 · 慢科技产品',
    desc: '纸白底、墨黑字、衬线正文、近乎为零的动效，配轻微纸张噪点。为长时间阅读与低干扰而生。',
    theme: { bg: '#FDFBF7', surface: '#F5F2EA', surface2: '#EFEBE1', text: '#1A1A1A', muted: '#5B564E', border: '#DED8CC', accent: '#1A1A1A', accent2: '#B58B00', radius: 2, font: 'serif', fw: 600, fx: ['paper', 'grain'] }
  },
  'gen-z-chaos-maximalism': {
    zh: 'Z 世代混沌极繁',
    tag: '潮流社区 · 快闪活动 · 亚文化内容',
    desc: '故意冲突的荧光色、贴纸堆叠、抖动与跑马灯，拒绝统一网格。像信息爆炸的社交媒体信息流，适合短时高频刺激。',
    theme: { mode: 'dark', bg: '#0B0B0B', surface: '#171717', surface2: '#222222', text: '#FFFFFF', muted: '#B0B0B0', border: '#FF00FF', accent: '#FF00FF', accent2: '#00FF00', radius: 12, font: 'rounded', fw: 900, fx: ['chaos'] }
  },
  'biomimetic-organic-2-0': {
    zh: '仿生有机 2.0',
    tag: '生物科技 · 未来材料 · 实验品牌',
    desc: '细胞形态、流体形变与呼吸节律，颜色取自生物发光与叶绿素。生长感强，适合表达「活的系统」。',
    theme: { mode: 'dark', bg: '#04121B', surface: '#0A2230', surface2: '#0E2C3D', text: '#EAFBF6', muted: '#8FB8AE', border: 'rgba(255,255,255,0.14)', accent: '#FF9999', accent2: '#00FF41', radius: 42, font: 'sans', fx: ['blob', 'aurora'] }
  },
  'anti-polish-raw-aesthetic': {
    zh: '反抛光 / 原生手作',
    tag: '独立工作室 · 手工品牌 · 纪录片',
    desc: '保留草稿感：手绘边框、纸张纹理、胶带与马克笔标注，甚至故意的不对齐。真实、可亲，但不适合需要精确感的工具。',
    theme: { bg: '#FAFAF8', surface: '#FFFFFF', surface2: '#F2EFE7', text: '#1A1A1A', muted: '#4A4A4A', border: '#C4A77D', accent: '#2D5DA1', accent2: '#C4553D', radius: 4, font: 'sketch', fx: ['sketch', 'grain'] }
  },
  'tactile-digital-deformable-ui': {
    zh: '触感可变形界面',
    tag: '实验性产品 · 品牌互动 · 移动端彩蛋',
    desc: '元素像软胶一样可压、可拉、可回弹，材质高光随位移变化，配合触觉反馈。手感极佳，但性能与可用性风险都高。',
    theme: { bg: '#EAF4FB', surface: '#FFFFFF', surface2: '#F4FAFF', text: '#1B2733', muted: '#61707F', border: '#D7E7F2', accent: '#FF9ECD', accent2: '#87CEEB', radius: 24, font: 'rounded', fw: 800, fx: ['gloss', 'clay'] }
  },
  'nature-distilled': {
    zh: '自然提炼',
    tag: '香氛 · 家居 · 慢生活品牌',
    desc: '陶土、沙色、橄榄绿与奶油白，低饱和、哑光、粗颗粒，圆角柔和。传达手工与土地的质感，配色需避免脏灰。',
    theme: { bg: '#F5F0E1', surface: '#FBF7EE', surface2: '#F0E9D8', text: '#3B322A', muted: '#7A6A5A', border: '#E0D5C0', accent: '#C67B5C', accent2: '#6B7B3C', radius: 20, font: 'serif', fx: ['grain', 'organic'] }
  },
  'interactive-cursor-design': {
    zh: '光标交互',
    tag: '创意工作室 · 互动作品集 · 展览',
    desc: '光标成为界面的一部分：放大、磁吸、形变、拖尾与混合模式反色。趣味性强，但必须保留原生光标可用性与触屏降级。',
    theme: { mode: 'dark', bg: '#0B0B0F', surface: '#16161C', surface2: '#1E1E26', text: '#F5F5F5', muted: '#9A9AA5', border: '#2C2C36', accent: '#22D3EE', accent2: '#F472B6', radius: 12, font: 'sans', fx: ['cursor', 'glow'] }
  },
  'voice-first-multimodal': {
    zh: '语音优先多模态',
    tag: '语音助手 · 车载 · 无障碍产品',
    desc: '以波形、聆听脉冲与状态色表达「在听 / 在想 / 在说」，屏幕只做辅助确认。需要处理无视觉、弱网与打断等边界。',
    theme: { bg: '#FAFAFA', surface: '#FFFFFF', surface2: '#F2F4F7', text: '#26313F', muted: '#6B7785', border: '#E3E8EE', accent: '#6B8FAF', accent2: '#9B8FBB', radius: 22, font: 'sans', fx: ['wave'] }
  },
  '3d-product-preview': {
    zh: '3D 产品预览',
    tag: '电商 · 汽车/家具配置器 · 硬件',
    desc: '可拖拽旋转、缩放、换材质的产品模型，配中性背景与柔和投影。让用户在购买前「转一圈」，加载与降级是主要挑战。',
    theme: { bg: '#F2F2F4', surface: '#FFFFFF', surface2: '#E9E9EC', text: '#17181A', muted: '#666A70', border: '#DEDFE3', accent: '#3B82F6', accent2: '#F59E0B', radius: 18, font: 'sans', fx: ['depth', 'gloss'] }
  },
  'gradient-mesh-aurora-evolved': {
    zh: '渐变网格 / 极光进化',
    tag: 'AI 产品 · Web3 · 品牌视觉',
    desc: '多点渐变相互渗透，形成无方向的光雾底部，色彩可在 10s 内缓慢迁移。适合作为背景层，前景必须加实色遮罩。',
    theme: { mode: 'dark', bg: '#07070E', surface: 'rgba(255,255,255,0.08)', surface2: 'rgba(255,255,255,0.14)', text: '#FFFFFF', muted: '#B4B6CC', border: 'rgba(255,255,255,0.18)', accent: '#FF00FF', accent2: '#00FFFF', radius: 18, font: 'sans', fx: ['mesh', 'glass'] }
  },
  'editorial-grid-magazine': {
    zh: '杂志编辑网格',
    tag: '媒体 · 长报道 · 品牌内容站',
    desc: '非对称分栏、首字下沉、引文与图注构成印刷式阅读节奏；标题用粗黑无衬线，正文用衬线。适合有真实内容量的站点。',
    theme: { bg: '#FBFAF7', surface: '#FFFFFF', surface2: '#F4F2EC', text: '#0A0A0A', muted: '#565656', border: '#DFDCD2', accent: '#B91C1C', accent2: '#1F2937', radius: 0, font: 'serif', fontBody: 'serif', fw: 800, fx: ['editorial', 'rules'] }
  },
  'chromatic-aberration-rgb-split': {
    zh: '色差分离 / RGB 分离',
    tag: '实验视觉 · 音乐封面 · 故障艺术',
    desc: '红绿蓝通道错位叠印，产生 CRT 与镜头色散般的重影，配噪点与扫描线。作为点缀极有张力，大段文字会不可读。',
    theme: { mode: 'dark', bg: '#050505', surface: '#0F0F0F', surface2: '#161616', text: '#F0F0F0', muted: '#A0A0A0', border: '#2A2A2A', accent: '#FF0000', accent2: '#00FFFF', radius: 0, font: 'mono', fx: ['rgb', 'grain'] }
  },
  'vintage-analog-retro-film': {
    zh: '复古胶片',
    tag: '摄影 · 咖啡/餐饮 · 独立出版',
    desc: '低饱和暖调、颗粒、漏光与轻微褪色，边缘暗角模拟老镜头。适合有影像素材的品牌，纯 UI 使用会显得疲软。',
    theme: { bg: '#F5E6C8', surface: '#FBF2DE', surface2: '#F0E0C2', text: '#3A2F25', muted: '#7A6A55', border: '#DCC9A6', accent: '#4A7B7C', accent2: '#C2703E', radius: 6, font: 'serif', fx: ['film', 'grain', 'vignette'] }
  },
  'bauhaus': {
    zh: '包豪斯',
    tag: '文化机构 · 设计展览 · 教育产品',
    desc: '红黄蓝三原色 + 黑白，圆形/三角/方形构成，硬边阴影与无圆角，机械式按下反馈。形式服从功能，几何感强烈。',
    theme: { bg: '#F0F0F0', surface: '#FFFFFF', surface2: '#E6E6E6', text: '#121212', muted: '#4A4A4A', border: '#121212', accent: '#D02020', accent2: '#1040C0', radius: 0, font: 'grotesk', fw: 900, borderW: 2, fx: ['bauhaus'] }
  },
  'minimalist-monochrome': {
    zh: '极简单色',
    tag: '阅读应用 · 高级时装 · 编辑型产品',
    desc: '只有黑白，没有阴影与圆角，靠 1/2/4px 的黑线分级，按下即反色。极致的克制带来极强的排版存在感。',
    theme: { bg: '#FFFFFF', surface: '#FFFFFF', surface2: '#F5F5F5', text: '#000000', muted: '#525252', border: '#000000', accent: '#000000', accent2: '#525252', radius: 0, font: 'serif', fw: 700, fx: ['mono'] }
  },
  'modern-dark-cinema-mobile': {
    zh: '现代暗色影院（移动）',
    tag: '流媒体 · 高端移动应用 · 内容社区',
    desc: '近黑分层（#020203→#0a0a0c）+ 微弱环境光斑，标题用 Inter 紧字距，主色 #5E6AD2。像影院一样把内容推到前景。',
    theme: { mode: 'dark', bg: '#050506', surface: '#0A0A0C', surface2: '#101014', text: '#EDEDEF', muted: '#8A8F98', border: 'rgba(255,255,255,0.09)', accent: '#5E6AD2', accent2: '#A5B4FC', radius: 16, font: 'sans', fx: ['glow', 'glass'] }
  },
  'saas-mobile-high-tech-boutique': {
    zh: 'SaaS 移动精品',
    tag: '移动端 SaaS · 金融科技 · 效率工具',
    desc: '电光蓝渐变按钮 + 纯白卡片 + 克制的弹簧动效，悬浮 FAB 与玻璃导航条。精致、可信，适合高频业务操作。',
    theme: { bg: '#FAFAFA', surface: '#FFFFFF', surface2: '#F1F5F9', text: '#0F172A', muted: '#64748B', border: '#E2E8F0', accent: '#0052FF', accent2: '#4D7CFF', radius: 16, font: 'sans', fx: ['grad', 'soft'] }
  },
  'terminal-cli-mobile': {
    zh: '终端命令行（移动）',
    tag: '开发者工具 · 运维应用 · 极客彩蛋',
    desc: '矩阵绿单色文字、等宽字体、扫描线与块状光标，输入即命令。信息密度高、风格极强，移动端需放大触控目标。',
    theme: { mode: 'dark', bg: '#050505', surface: '#0A0A0A', surface2: '#0F120F', text: '#33FF00', muted: '#6EA86E', border: '#1F4A1F', accent: '#33FF00', accent2: '#FFB000', radius: 0, font: 'mono', fx: ['terminal', 'scanline'] }
  },
  'kinetic-brutalism-mobile': {
    zh: '动感粗野主义（移动）',
    tag: '潮流电商 · 音乐/球鞋 · 活动应用',
    desc: '酸性黄 + 纯黑、2px 硬边、0 圆角，无限跑马灯与按下反色。冲击力极强，适合短时浏览的潮流场景。',
    theme: { mode: 'dark', bg: '#09090B', surface: '#131316', surface2: '#1B1B1F', text: '#FAFAFA', muted: '#A1A1AA', border: '#3F3F46', accent: '#DFE104', accent2: '#FAFAFA', radius: 0, borderW: 2, font: 'grotesk', fw: 900, fx: ['brutal', 'marquee'] }
  },
  'flat-design-mobile-touch-first': {
    zh: '扁平移动（触控优先）',
    tag: '工具类 App · 教育应用 · 轻量服务',
    desc: '零阴影、纯色块、48px 触控区与即时按压反馈，用整块颜色分区代替卡片堆叠。上手快、性能好、老少皆宜。',
    theme: { bg: '#FFFFFF', surface: '#F3F4F6', surface2: '#E9EDF2', text: '#111827', muted: '#5B6472', border: '#E5E7EB', accent: '#3B82F6', accent2: '#10B981', radius: 14, font: 'sans', fw: 700, fx: ['flat'] }
  },
  'material-you-md3-mobile': {
    zh: 'Material 3 表现力',
    tag: 'Android 应用 · 系统工具 · 跨端设计系统',
    desc: '动态取色生成同族色板，用表面色调而非阴影表达层级；胶囊按钮、状态层与强调缓动。规范完整，易于规模化。',
    theme: { bg: '#FFFBFE', surface: '#F3EDF7', surface2: '#E8DEF8', text: '#1C1B1F', muted: '#49454F', border: '#CAC4D0', accent: '#6750A4', accent2: '#7D5260', radius: 24, font: 'sans', fx: ['md3'] }
  },
  'neo-brutalism-mobile': {
    zh: '新粗野移动端',
    tag: '消费品牌 · 社交应用 · 年轻向活动',
    desc: '奶油底 + 4px 黑边 + 硬偏移阴影，卡片轻微倾斜，按下位移模拟物理按键。俏皮但保持可读。',
    theme: { bg: '#FFFDF5', surface: '#FFFFFF', surface2: '#FFF3D6', text: '#000000', muted: '#4A4A4A', border: '#000000', accent: '#FF6B6B', accent2: '#FFD93D', radius: 0, borderW: 4, font: 'grotesk', fw: 800, fx: ['brutal', 'rot'] }
  },
  'bold-typography-mobile-poster': {
    zh: '海报式大字',
    tag: '时尚品牌 · 展览 · 内容型应用',
    desc: '48–72px 标题、-1.5px 字距、贴边排版与大量纵向留白，强调色只用于下划线 CTA。像一张会滚动的海报。',
    theme: { mode: 'dark', bg: '#0A0A0A', surface: '#141414', surface2: '#1C1C1C', text: '#FAFAFA', muted: '#8A8A8A', border: '#262626', accent: '#FF3D00', accent2: '#FAFAFA', radius: 0, font: 'condensed', fw: 900, fx: ['poster'] }
  },
  'academia-scholarly-mobile': {
    zh: '学院派（移动）',
    tag: '阅读/研究应用 · 出版 · 高等教育',
    desc: '深胡桃木底、羊皮纸文字、黄铜与深红点缀，拱形图框与首字下沉，衬线字体贯穿。沉静、博学，加载与可读性需权衡。',
    theme: { mode: 'dark', bg: '#1C1714', surface: '#251E19', surface2: '#2E2620', text: '#E8DFD4', muted: '#9C8B7A', border: '#4A3F35', accent: '#C9A962', accent2: '#8B2635', radius: 4, font: 'serif', fx: ['arch', 'vignette', 'grain'] }
  },
  'cyberpunk-mobile-hud': {
    zh: '赛博 HUD（移动）',
    tag: '游戏伴侣 · 加密应用 · 潮流工具',
    desc: '45° 切角、HUD 角标、扫描线与霓虹脉冲，终端式输入框。信息以仪表读数的形式呈现，氛围优先。',
    theme: { mode: 'dark', bg: '#0A0A0F', surface: '#12121A', surface2: '#1A1A26', text: '#E0E0E0', muted: '#8A8AA0', border: '#2A2A3A', accent: '#00FF88', accent2: '#FF00FF', radius: 0, font: 'mono', fx: ['hud', 'scanline', 'glow'] }
  },
  'bitcoin-defi-mobile': {
    zh: '比特币 DeFi（移动）',
    tag: '加密钱包 · 交易应用 · Web3',
    desc: '深空黑 + 比特币橙金渐变，等宽数字、发光胶囊按钮与账本时间线。强调精确与资产安全感。',
    theme: { mode: 'dark', bg: '#030304', surface: '#0F1115', surface2: '#16191F', text: '#FFFFFF', muted: '#94A3B8', border: 'rgba(148,163,184,0.2)', accent: '#F7931A', accent2: '#FFD600', radius: 24, font: 'sans', fx: ['glow', 'grad'] }
  },
  'claymorphism-mobile': {
    zh: '黏土拟态（移动）',
    tag: '儿童/教育 App · 冥想 · 生活服务',
    desc: '大圆角、多层黏土阴影与粉紫渐变按钮，配缓慢漂浮的光斑。柔软友好，触控目标大，适合低压力场景。',
    theme: { bg: '#F4F1FA', surface: 'rgba(255,255,255,0.82)', surface2: '#FFFFFF', text: '#332F3A', muted: '#635F69', border: 'rgba(255,255,255,0.9)', accent: '#7C3AED', accent2: '#DB2777', radius: 34, font: 'rounded', fw: 800, fx: ['clay', 'blob'] }
  },
  'enterprise-saas-mobile': {
    zh: '企业级 SaaS（移动）',
    tag: '企业移动办公 · CRM · 审批流',
    desc: '靛蓝到紫的渐变主色、白卡片 + 极浅彩色投影、底部全宽 CTA 与骨架屏。专业、稳重，强调流程完整性。',
    theme: { bg: '#F8FAFC', surface: '#FFFFFF', surface2: '#F1F5F9', text: '#0F172A', muted: '#64748B', border: '#E2E8F0', accent: '#4F46E5', accent2: '#7C3AED', radius: 18, font: 'sans', fx: ['grad', 'soft'] }
  },
  'sketch-hand-drawn-mobile': {
    zh: '手绘草图（移动）',
    tag: '教育 · 手账/笔记 · 创意工具',
    desc: '每个角圆度都不同、虚线描边、硬偏移阴影，配马克笔红与圆珠笔蓝。像写在便签上的界面，亲切但精度低。',
    theme: { bg: '#FDFBF7', surface: '#FFFFFF', surface2: '#FFF9C4', text: '#2D2D2D', muted: '#6B6459', border: '#2D2D2D', accent: '#FF4D4D', accent2: '#2D5DA1', radius: 16, font: 'sketch', borderW: 3, fx: ['sketch'] }
  },
  'neumorphism-mobile': {
    zh: '新拟态（移动）',
    tag: '智能硬件 App · 车载控制 · 概念稿',
    desc: '单一 #E0E5EC 底色上做凸起与凹陷，紫罗兰作为唯一强调色。柔和统一，但需谨慎处理对比度与边界识别。',
    theme: { bg: '#E0E5EC', surface: '#E0E5EC', surface2: '#E6EBF1', text: '#3D4852', muted: '#6B7280', border: '#D3DAE3', accent: '#6C63FF', accent2: '#8B84FF', radius: 24, font: 'sans', fx: ['neu'] }
  },
  'fluent-2': {
    zh: 'Fluent 2',
    tag: 'Microsoft 365 · Windows 应用 · 企业产品',
    desc: '微软设计系统：8px 圆角、层级化中性色、克制的深度与流畅转场，强调可访问性与跨平台一致。',
    theme: { bg: '#FAFAFA', surface: '#FFFFFF', surface2: '#F0F0F0', text: '#242424', muted: '#616161', border: '#E0E0E0', accent: '#0078D4', accent2: '#8764B8', radius: 8, font: 'sans', fx: ['soft', 'a11y'] }
  },
  'shopify-polaris': {
    zh: 'Shopify Polaris',
    tag: '电商后台 · 商家管理 · 运营工具',
    desc: '为长时间运营工作设计：中性灰底、8px 圆角、清晰的状态色与帮助性文案，信息密度与可扫读性平衡。',
    theme: { bg: '#F1F1F1', surface: '#FFFFFF', surface2: '#F7F7F7', text: '#303030', muted: '#616161', border: '#E1E3E5', accent: '#008060', accent2: '#2C6ECB', radius: 8, font: 'sans', fx: ['soft', 'dense'] }
  },
  'spectrum-design-system': {
    zh: 'Adobe Spectrum',
    tag: '创意软件 · 专业工具 · 跨端套件',
    desc: 'Adobe 设计系统：语义色 + 中性灰阶、克制的层次与专业动效，优先保证复杂工具中的可读与可预期。',
    theme: { bg: '#F8F8F8', surface: '#FFFFFF', surface2: '#F0F0F0', text: '#2C2C2C', muted: '#6E6E6E', border: '#E1E1E1', accent: '#0265DC', accent2: '#D7373F', radius: 8, font: 'sans', fx: ['soft'] }
  },
  'spectrum-2': {
    zh: 'Adobe Spectrum 2',
    tag: 'Creative Cloud · 新一代 Adobe 界面',
    desc: 'Spectrum 的进化版：更灵活的语义主题、更强对比与个性化，加入表现力插图与自适应动效。',
    theme: { bg: '#FFFFFF', surface: '#F5F5F5', surface2: '#EBEBEB', text: '#2C2C2C', muted: '#616161', border: '#DADADA', accent: '#2680EB', accent2: '#9B59B6', radius: 10, font: 'sans', fx: ['soft', 'grad'] }
  }
};
