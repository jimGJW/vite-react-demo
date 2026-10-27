/**
 * 功能版本时间轴数据
 * 把"新功能"按上线批次（时间段）归类，每个 release 对应一次集中改动。
 * changes 列出该批次改动的具体页面与说明，changedAt 为改动日期。
 *
 * 字段 schema（10 批已统一，新增批次必须齐备，单测钉死）：
 *   id / short('M/D') / label('YYYY-MM-DD') / date / color / title / commit / changes[]
 *   · 同一天的多批改动合并为一个 release（date 唯一，配色才一一对应）
 *   · color 用 antd 调色板，8 批之间明显区分；r9/r10 等历史 id 已按日期重排
 *   · commit 为该批次的 git 短 hash（跨多提交用 ' + ' 连接），仅资料展示
 *
 * 数据以仓库真实 git 提交批次为依据：
 *   r1  2026-09-14  b776892           四大基础模块上线（Kit/Studio/Templates/Utils/ChatBot/QASharing）
 *   r2  2026-09-20  396587e           React 核心 API 演示 + 五层验证体系
 *   r3  2026-09-27  5f67751           四大进阶模块 + Utils 大扩充
 *   r4  2026-09-30  b0995af           微前端三端对称 + 创意分组 + 创意 Playground 32 demo
 *   r5  2026-10-10  5c86255           数据看板大扩容：地球 / 海洋 / 星空三看板 + Agent 拆分 + 案例体系
 *   r6  2026-10-22  15e51cc           海洋看板接入中央气象台台风
 *   r7  2026-10-23  085de61 + 9c42e8c 时空档案大更新 + 洪荒三阵与全站外壳（同日两批合并）
 *   r8  2026-10-27  8696d6b + 663983d ChatBot 思考态体验 + 全项目性能优化（同日两批合并）
 *
 * 「新」标红窗口：FRESH_DAYS（7 天）内有改动的批次，PeriodTag / NewMark /
 * 时间轴抽屉统一红标展示，过窗自动恢复批次原色。
 *
 * 纯数据文件（无 React），可被单测直接 import。
 *
 * 多语化：title / changes[].title / changes[].desc 是「按语种分键」的双语对象
 *   { 'zh-CN': ..., en: ... }，其余 8 个语种运行时由 pickText 回退到 en → zh-CN。
 * 消费方一律用 pickText(field, lang) 取词，UI 骨架文案（功能版本时间轴 / 全部 / 项…）
 * 走 changelog.json 命名空间，分工见 i18n 约定。
 */

export const RELEASES = [
  {
    id: 'r1',
    short: '9/14',
    label: '2026-09-14',
    date: '2026-09-14',
    color: '#1677ff',
    title: { 'zh-CN': '四大基础模块上线', en: 'Core Modules Launched' },
    commit: 'b776892',
    changes: [
      { route: '/kit', title: { 'zh-CN': '组件工具箱 Kit', en: 'Component Toolbox' }, desc: { 'zh-CN': '从存量项目提炼 18 个通用组件（签名板 / 下拉刷新 / 虚拟列表等）', en: '18 reusable components distilled from legacy projects (signature pad, pull-to-refresh, virtual list…)' }, changedAt: '2026-09-14' },
      { route: '/studio', title: { 'zh-CN': '组件工坊 Studio', en: 'Studio Workshop' }, desc: { 'zh-CN': '24 个去业务化零依赖组件，按能力分组展示', en: '24 dependency-free, business-agnostic components grouped by capability' }, changedAt: '2026-09-14' },
      { route: '/templates', title: { 'zh-CN': '开源模板库', en: 'Open-Source Template Library' }, desc: { 'zh-CN': '识别并归档 19 个纯上游开源模板', en: 'Identified and archived 19 upstream open-source templates' }, changedAt: '2026-09-14' },
      { route: '/utils', title: { 'zh-CN': '小功能集 Utils', en: 'Utility Toolkit' }, desc: { 'zh-CN': '50+ 纯函数 + 20 Hook 统一收口', en: '50+ pure functions and 20 hooks consolidated' }, changedAt: '2026-09-14' },
      { route: '/chatbot', title: { 'zh-CN': '对话助手 ChatBot', en: 'Chat Assistant' }, desc: { 'zh-CN': '从云端文档库复用的流式对话 + 卡片渲染能力', en: 'Reusable streaming chat and card rendering from the cloud doc library' }, changedAt: '2026-09-14' },
      { route: '/share', title: { 'zh-CN': '对话分享 QASharing', en: 'Conversation Sharing' }, desc: { 'zh-CN': '对话分享只读落地页，可跨项目复用', en: 'Read-only sharing landing page, reusable across projects' }, changedAt: '2026-09-14' },
    ],
  },
  {
    id: 'r2',
    short: '9/20',
    label: '2026-09-20',
    date: '2026-09-20',
    color: '#52c41a',
    title: { 'zh-CN': '核心 API 演示 + 验证体系', en: 'Core API Demos + Validation Suite' },
    commit: '396587e',
    changes: [
      { route: '/react-hooks', title: { 'zh-CN': 'React 核心 API 演示', en: 'React Core API Demos' }, desc: { 'zh-CN': 'useContext / useCallback / useMemo / useId 组合案例 + React 19 新特性', en: 'useContext / useCallback / useMemo / useId recipes plus React 19 features' }, changedAt: '2026-09-20' },
      { route: '__infra__', title: { 'zh-CN': '五层验证体系', en: 'Five-Layer Validation Suite' }, desc: { 'zh-CN': '新增 SSR 冒烟 + CDP 浏览器冒烟，dist 剔重 wasm 瘦身（93M→73M）', en: 'Added SSR smoke + CDP browser smoke; de-duplicated wasm in dist (93M→73M)' }, changedAt: '2026-09-20' },
    ],
  },
  {
    id: 'r3',
    short: '9/27',
    label: '2026-09-27',
    date: '2026-09-27',
    color: '#fa8c16',
    title: { 'zh-CN': '四大进阶模块 + Utils 大扩充', en: 'Four Advanced Modules + Big Utils Expansion' },
    commit: '5f67751',
    changes: [
      { route: '/perf-lab', title: { 'zh-CN': '性能实验室', en: 'Performance Lab' }, desc: { 'zh-CN': '虚拟滚动 / FPS / Web Worker / 重渲染优化四实验', en: 'Four experiments: virtual scroll, FPS, Web Worker, re-render optimization' }, changedAt: '2026-09-27' },
      { route: '/error-boundary', title: { 'zh-CN': '错误边界与容错', en: 'Error Boundaries & Fault Tolerance' }, desc: { 'zh-CN': 'ErrorBoundary + useAsyncError 异常治理', en: 'ErrorBoundary + useAsyncError exception handling' }, changedAt: '2026-09-27' },
      { route: '/state-machine', title: { 'zh-CN': '状态机与时间旅行', en: 'State Machine & Time Travel' }, desc: { 'zh-CN': '纯函数状态机 + 撤销栈（commit / undo / redo / jumpTo）', en: 'Pure-function state machine with undo stack (commit / undo / redo / jumpTo)' }, changedAt: '2026-09-27' },
      { route: '/web-api', title: { 'zh-CN': '浏览器原生能力', en: 'Browser Native APIs' }, desc: { 'zh-CN': '全屏 / 常亮 / 定位 / 通知 / 分享 / 网络探测统一收敛', en: 'Unified fullscreen, wake-lock, geolocation, notification, share, network probing' }, changedAt: '2026-09-27' },
      { route: '/utils', title: { 'zh-CN': '小功能集 Utils（扩充）', en: 'Utility Toolkit (Expanded)' }, desc: { 'zh-CN': '+20 纯函数 + 5 Hook，演示页新增 3 个分类', en: '+20 pure functions + 5 hooks; 3 new demo categories' }, changedAt: '2026-09-27' },
    ],
  },
  {
    id: 'r4',
    short: '9/30',
    label: '2026-09-30',
    date: '2026-09-30',
    color: '#eb2f96',
    commit: 'b0995af',
    title: { 'zh-CN': '微前端三端对称 + 创意分组', en: 'Symmetric Micro-Frontend + Creative Groups' },
    changes: [
      { route: '/micro-frontend', title: { 'zh-CN': '微前端融合总览', en: 'Micro-Frontend Overview' }, desc: { 'zh-CN': 'qiankun 装载 Vue / Angular 子应用：宿主页 + 侧边栏菜单注册 + 子应用路由回传', en: 'qiankun hosts Vue / Angular sub-apps: host page, sidebar registration, sub-app route reporting' }, changedAt: '2026-09-30' },
      { route: '/micro-vue', title: { 'zh-CN': 'Vue 子应用', en: 'Vue Sub-App' }, desc: { 'zh-CN': 'Vue 3 + Element Plus，22 条页内导航与主应用同题同路由', en: 'Vue 3 + Element Plus, 22 in-page nav items sharing topics/routes with the host' }, changedAt: '2026-09-30' },
      { route: '/micro-angular', title: { 'zh-CN': 'Angular 子应用', en: 'Angular Sub-App' }, desc: { 'zh-CN': 'Angular 22 standalone + hash 路由，14 条页内导航；独立运行支持深链', en: 'Angular 22 standalone + hash routing, 14 in-page nav items; deep links when standalone' }, changedAt: '2026-09-30' },
      { route: '/creative', title: { 'zh-CN': '创意实验室', en: 'Creative Lab' }, desc: { 'zh-CN': '粒子星轨 / 打字机 / 聚光卡片 / 3D 翻转 / 涟漪按钮 / 磁性按钮', en: 'Particle orbits, typewriter, spotlight card, 3D flip, ripple button, magnetic button' }, changedAt: '2026-09-30' },
      { route: '/data-viz', title: { 'zh-CN': '可视化实验室', en: 'Visualization Lab' }, desc: { 'zh-CN': '力导向关系图 / 螺旋词云 / 热力矩阵，不引图表库手写布局算法', en: 'Force-directed graph, spiral word cloud, heat matrix — hand-written layouts, no chart lib' }, changedAt: '2026-09-30' },
      { route: '/orbit', title: { 'zh-CN': '星际轨道', en: 'Stellar Orbits' }, desc: { 'zh-CN': '八大行星真实轨道要素：Python 算数据，前端只做投影与插值', en: 'Real orbital elements of eight planets: Python computes data, frontend only projects & interpolates' }, changedAt: '2026-09-30' },
      { route: '/playground', title: { 'zh-CN': '创意 Playground 32 demo', en: 'Creative Playground (32 demos)' }, desc: { 'zh-CN': '流场 / 元胞自动机 / 图灵斑图 / 混沌 / 分形 / 分形山脉… 按主题分 6 组', en: 'Flow field, cellular automata, Turing patterns, chaos, fractals, fractal mountains… 6 theme groups' }, changedAt: '2026-09-30' },
      { route: '__infra__', title: { 'zh-CN': 'demo 单一真相 + 三端探针', en: 'Single Source of Truth + Tri-Platform Probes' }, desc: { 'zh-CN': 'create(ctx) 契约一份实现三份薄壳；sync:demos 防漂移 + playground-probe 真浏览器逐项断言', en: 'One create(ctx) contract, three thin shells; sync:demos anti-drift + playground-probe live assertions' }, changedAt: '2026-09-30' },
    ],
  },
  {
    id: 'r5',
    short: '10/10',
    label: '2026-10-10',
    date: '2026-10-10',
    color: '#722ed1',
    commit: '5c86255',
    title: { 'zh-CN': '数据看板大扩容 + Agent 拆分 + 案例体系', en: 'Big Data-Board Expansion + Agent Split + Case System' },
    changes: [
      { route: '/astro', title: { 'zh-CN': '星空看板 AstroBoard', en: 'Astro Board' }, desc: { 'zh-CN': 'd3-celestial 真实星表 + 全天星图 + NOAA/SWPC 空间天气', en: 'd3-celestial real star catalog, all-sky map, NOAA/SWPC space weather' }, changedAt: '2026-10-10' },
      { route: '/geo', title: { 'zh-CN': '地球看板 GeoBoard', en: 'Geo Board' }, desc: { 'zh-CN': '温室气体 / 温度距平 / 双极海冰 / 强震 / 环境气象 / 火山 / 海啸', en: 'Greenhouse gases, temperature anomaly, polar sea ice, major quakes, environment, volcanoes, tsunamis' }, changedAt: '2026-10-10' },
      { route: '/ocean', title: { 'zh-CN': '海洋看板 OceanBoard', en: 'Ocean Board' }, desc: { 'zh-CN': '气旋 / PDO-AMO / SSTA / 潮汐 / 浮标实况 / 海浪 / 涌浪', en: 'Cyclones, PDO-AMO, SSTA, tides, buoy live, waves, swell' }, changedAt: '2026-10-10' },
      { route: '/agent', title: { 'zh-CN': '智能体 Agent', en: 'Agent Module' }, desc: { 'zh-CN': '1319 行巨型页拆为 lib + components，主文件仅留编排；修复 react-hooks v7 合规问题', en: 'Split a 1319-line page into lib + components; only orchestration remains; fixed react-hooks v7 compliance' }, changedAt: '2026-10-10' },
      { route: '/cases', title: { 'zh-CN': '三看板「📚 案例」页签', en: 'Case Studies Tab' }, desc: { 'zh-CN': '土耳其双震 / 飓风 Ian / 嫦娥六号 / 第 25 太阳周极大等真实事件解读', en: 'Turkey double quake, Hurricane Ian, Chang’e-6, solar cycle 25 peak and other real events' }, changedAt: '2026-10-10' },
      { route: '/dict', title: { 'zh-CN': '共用名词解释词典', en: 'Shared Glossary' }, desc: { 'zh-CN': 'Geo/Ocean/Astro 共用 glossary.js：阈值唯一真源 + DictView 渲染器', en: 'Geo/Ocean/Astro share glossary.js: single source of thresholds + DictView renderer' }, changedAt: '2026-10-10' },
      { route: '__infra__', title: { 'zh-CN': '看板性能优化', en: 'Board Performance Tuning' }, desc: { 'zh-CN': '自包含 Clock 组件隔离秒级渲染；Geo/Ocean 看板顶层不再每秒重渲染', en: 'Self-contained Clock isolates per-second rendering; Geo/Ocean no longer re-render every second at top level' }, changedAt: '2026-10-10' },
    ],
  },
  {
    id: 'r6',
    short: '10/22',
    label: '2026-10-22',
    date: '2026-10-22',
    color: '#13c2c2',
    commit: '15e51cc',
    title: { 'zh-CN': '海洋看板新增西北太平洋台风', en: 'Ocean Board Adds W. Pacific Typhoons' },
    changes: [
      { route: '/ocean', title: { 'zh-CN': '「台风」页签接入实时路径与强度', en: 'Typhoon tab: live tracks & intensity' }, desc: { 'zh-CN': '接入中央气象台 nmc.cn 西北太平洋台风（list_default + view_<id> 解析，15 分钟缓存），补充 NHC 不覆盖的影响我国的台风', en: 'Integrates CMA nmc.cn W. Pacific typhoons (list_default + view_<id> parsing, 15-min cache), covering China-affecting storms NHC does not' }, changedAt: '2026-10-22' },
      { route: '__infra__', title: { 'zh-CN': '台风强度分级与 NHC 对照', en: 'CMA typhoon grading vs NHC' }, desc: { 'zh-CN': '按 GB/T 19201 六级（2 分钟平均风）分级并对照萨菲尔–辛普森（1 分钟平均风），提醒跨页比较先辨口径', en: 'GB/T 19201 six-grade (2-min avg wind) grading cross-referenced with Saffir-Simpson (1-min avg); warns to check basis before comparing' }, changedAt: '2026-10-22' },
    ],
  },
  {
    id: 'r7',
    short: '10/23',
    label: '2026-10-23',
    date: '2026-10-23',
    color: '#faad14',
    commit: '085de61 + 9c42e8c',
    title: { 'zh-CN': '时空档案大更新 + 洪荒三阵与全站外壳', en: 'Timeline Overhaul + Honghuang Pages & Site Shell' },
    changes: [
      { route: '/timeline', title: { 'zh-CN': '经纬度检查模块', en: 'Lat/Lng Check module' }, desc: { 'zh-CN': '时空档案新增「经纬度检查」页签：约 44 个知名国家/地区代表城市经纬度速查（可搜索、点行回填），并支持按经纬度反查归属（边界框优先、最近首都兜底）', en: 'Timeline gains a Lat/Lng Check tab: reference coordinates for ~44 countries (searchable, click-to-fill) plus reverse lookup by coordinate (bounding-box first, nearest capital fallback)' }, changedAt: '2026-10-23' },
      { route: '/timeline', title: { 'zh-CN': '城市词典：任意真实城市 → 经纬度', en: 'City gazetteer: any real city to coordinates' }, desc: { 'zh-CN': '离线内置 GeoNames 公有领域数据 6.3 万城，支持中文 / 英文 / 当地写法、繁简体与「城市, 国家」限定；同名城市按人口给出候选列表；3MB 词典按需加载，不拖慢首屏', en: 'Offline gazetteer of 63k settlements from public-domain GeoNames: Chinese/English/local spellings, simplified-traditional tolerance and "city, country" scoping; same-name cities return candidates by population; the 3MB dictionary loads on demand' }, changedAt: '2026-10-23' },
      { route: '/timeline', title: { 'zh-CN': '经纬度检查体验优化', en: 'Lat/Lng check UX polish' }, desc: { 'zh-CN': '点参考行 / 样例 / 城市即出反查结果（少一次点击）；输入错误按字段结构化标红；参考表支持键盘 Enter / Space 操作；卡片悬浮微抬升与焦点环，并尊重系统减少动效设置', en: 'Clicking a reference row, sample or city now runs the reverse lookup instantly; input errors highlight the offending field; the table is keyboard operable; cards lift subtly with focus rings and honor reduced-motion' }, changedAt: '2026-10-23' },
      { route: '/honghuang', title: { 'zh-CN': '洪荒三阵新页面', en: 'Honghuang three-array page' }, desc: { 'zh-CN': '周天星斗 / 十二都天神煞 / 九宫八卦三阵联动演示，考据分层呈现；点宫亮本宫星区并弹出档案，Esc 收起', en: 'Three interlinked array demos (star dipper, twelve ancestral witches, nine palaces); clicking a node lights its star sector and opens a dossier, Esc dismisses' }, changedAt: '2026-10-23' },
      { route: '/stars', title: { 'zh-CN': '周天星辰（真实星表）', en: 'Zhou Tian stars (real catalog)' }, desc: { 'zh-CN': '基于真实星表的星辰大阵独立页，星点可点开详情，与洪荒三阵一虚一实两个入口', en: 'Standalone star array page driven by the real star catalog; stars open detail popups, paired with the fictional Honghuang page' }, changedAt: '2026-10-23' },
      { route: '__infra__', title: { 'zh-CN': '全站页面外壳与导航增强', en: 'Site-wide page shell and navigation' }, desc: { 'zh-CN': 'PageShell 统一全站页面的页头 / 栅格 / 分节 / KPI 骨架（只消费 token、不写死颜色）；BackButton 在无站内历史时回首页兜底；内容区新增阅读进度条与切页回顶', en: 'PageShell unifies page headers, grids, sections and KPI skeletons (token-driven, no hardcoded colors); BackButton falls back to home without in-site history; reading progress bar and scroll-to-top on navigation' }, changedAt: '2026-10-23' },
    ],
  },
  {
    id: 'r8',
    short: '10/27',
    label: '2026-10-27',
    date: '2026-10-27',
    color: '#2f54eb',
    commit: '8696d6b + 663983d',
    title: { 'zh-CN': 'ChatBot 思考态体验 + 全项目性能优化', en: 'ChatBot Thinking UX + Site-wide Performance' },
    changes: [
      { route: '/chatbot', title: { 'zh-CN': '思考态元信息条', en: 'Thinking-state meta strip' }, desc: { 'zh-CN': '移植 hc-apm-mobile 的思考态条：一轮回答收口后显示「已完成思考 · 用时 X 秒」，可展开查看结构化步骤流（理解问题 / 检索数据等耗时）；颜色走主题变量、跟随亮暗主题，并尊重系统减少动效', en: 'Ported the thinking-strip from hc-apm-mobile: after a round finishes it shows "Thought for Xs" with an expandable step flow; colors follow theme tokens and it honors reduced-motion' }, changedAt: '2026-10-27' },
      { route: '/chatbot', title: { 'zh-CN': '输入框体验：四行上限', en: 'Input box: 4-line cap' }, desc: { 'zh-CN': '输入框从五行走高收紧为四行（maxRows 5→4），避免多行时两端被拉成半圆、文字贴弧线；回车发送已带输入法合成守卫，中文输入不误触', en: 'Input auto-grow capped at 4 rows (was 5) so it stays a tidy rectangle; Enter-to-send already guards IME composition so Chinese input is not mis-fired' }, changedAt: '2026-10-27' },
      { route: '/chatbot', title: { 'zh-CN': '推荐问题改为裸行列表', en: 'Recommendations as a bare-line list' }, desc: { 'zh-CN': '推荐问题由胶囊标签改为带序号的裸行分隔列表，窄屏不再换行溢出，点击整行即可追问', en: 'Recommendations switched from pills to a numbered bare-line list that never wraps awkwardly on narrow screens; tap a row to ask' }, changedAt: '2026-10-27' },
      { route: '__infra__', title: { 'zh-CN': 'i18n 语言包按需装载', en: 'On-demand i18n language packs' }, desc: { 'zh-CN': '简体中文（源语言）同步内置，其余 9 个语种改为切换时按需动态装载，装载前自动回退简体中文；首屏 i18n chunk 从 2.3MB（10 语种全量）降至约十分之一', en: 'Simplified Chinese (the source language) stays eager while the other 9 packs load on demand when switched, falling back to Chinese until ready; the first-paint i18n chunk drops from 2.3MB (all ten languages) to roughly a tenth' }, changedAt: '2026-10-27' },
      { route: '__infra__', title: { 'zh-CN': 'ECharts 按需注册', en: 'Modular ECharts registration' }, desc: { 'zh-CN': 'Kit / Studio / ChatBot 三处图表改为共享的 echarts/core 按需注册入口（仅折线/柱状/饼/雷达/散点与所需组件），vendor-echarts 体积下降约四成', en: 'The Kit, Studio and ChatBot charts now share one echarts/core entry registering only line, bar, pie, radar and scatter plus the components they use, cutting the vendor-echarts chunk by roughly 40%' }, changedAt: '2026-10-27' },
      { route: '/agent-lab', title: { 'zh-CN': 'AI Agent 实验室新页面', en: 'AI Agent Lab page' }, desc: { 'zh-CN': '基于 ChatBot 打造的 Agent 知识中心：左侧对话注入 Agent 主题 mock 后端（框架对比表格卡片 + 思考链步骤流），右侧汇总市场主流的前端/后端/协议/框架 22 个知识点（分类筛选+搜索）、6 大框架横向对比表与 5 套常用提示词模板（一键复制）；mock 后端新增 answers 注入点，任意页面可主题化回答', en: 'An agent knowledge center on top of ChatBot: the chat injects an agent-themed mock backend (framework comparison as a table card plus thinking steps) while the right panel curates 22 mainstream frontend/backend/protocol/framework topics with filtering and search, a 6-framework comparison table and 5 copy-ready prompt templates; createMockApi now accepts an answers resolver so any page can theme its replies' }, changedAt: '2026-10-27' },
      { route: '/agent-lab', title: { 'zh-CN': '对比实验室 · 多方案并排演示 + 组件解耦', en: 'Compare Lab demos + component split' }, desc: { 'zh-CN': '页面拆分为 KnowledgeTab / FrameworkTab / PromptTab / CompareLab 四个内聚组件，共享演示引擎 useSimulatedStream；新增「对比实验室」：流式三通道（SSE / fetch 流 / WebSocket）同一文案并排真机演示 + 特性矩阵、回答渲染三形态（整段 / 逐字 / 逐词）、思考链三形态（步骤条 / 脉冲 / 时间线）；页签销毁式切换停表、卡片 memo 化', en: 'The page splits into four cohesive components (KnowledgeTab / FrameworkTab / PromptTab / CompareLab) sharing one demo engine, useSimulatedStream. The new Compare Lab plays three streaming channels (SSE / fetch stream / WebSocket) side by side on the same copy with a trade-off matrix, three render strategies (all-at-once / char / word) and three thinking-UI forms (step strip / pulse / timeline); tab panes destroy on switch to stop demo timers and topic cards are memoized' }, changedAt: '2026-10-27' },
      { route: '/agent-lab', title: { 'zh-CN': '前端技能勾选：默认全选，取消即移除', en: 'Frontend skill checkboxes: all on by default' }, desc: { 'zh-CN': '对比实验室每组演示顶部新增「前端技能」勾选条（共享 SkillPicker 组件，含全选/半选）：默认全部勾选展示所有技能面板，取消勾选即把对应面板与矩阵列整块移除（卸载即停内部定时器），只针对前端演示技能', en: 'Each Compare Lab demo now opens with a "Frontend skills" checkbox bar (shared SkillPicker with select-all/indeterminate): every skill panel is checked by default and unchecking removes its panel — and its matrix column for streaming channels — outright, unmounting inner demo timers; applies to the frontend demos only' }, changedAt: '2026-10-27' },
    ],
  },
]

/** 「新功能」标红窗口：最近 N 天内有改动的批次/路由按「新」红标展示（PeriodTag / NewMark / 时间轴抽屉共用） */
export const FRESH_DAYS = 7

/* 模块加载时刻算一次：避免组件渲染期调用 Date.now()（react-hooks 纯度规则） */
const NOW_MS = Date.now()
const DAY_MS = 24 * 60 * 60 * 1000

const releaseTs = (r) => new Date(`${r.date}T00:00:00`).getTime()

/** 处于「新」窗口内的批次 id 列表 */
export const FRESH_RELEASE_IDS = RELEASES
  .filter((r) => NOW_MS - releaseTs(r) < FRESH_DAYS * DAY_MS)
  .map((r) => r.id)

/** 某批次是否处于「新」窗口内（红标展示） */
export const isFreshRelease = (id) => FRESH_RELEASE_IDS.includes(id)

export const getRelease = (id) => RELEASES.find((r) => r.id === id) || null

/** 路由 → 最近一次改动所属 release（用于侧边栏下标 icon，取最新批次） */
export const ROUTE_LATEST = (() => {
  const map = {}
  for (const r of RELEASES) {
    for (const c of r.changes) {
      if (typeof c.route === 'string' && c.route.startsWith('/')) map[c.route] = r.id
    }
  }
  return map
})()

/** 路由 → 所有包含它的批次 id 数组（用于选中批次时高亮对应侧边栏项） */
export const ROUTE_RELEASES = (() => {
  const map = {}
  for (const r of RELEASES) {
    for (const c of r.changes) {
      if (typeof c.route === 'string' && c.route.startsWith('/')) {
        (map[c.route] ||= []).push(r.id)
      }
    }
  }
  return map
})()

/** 全部改动条目数 */
export const TOTAL_CHANGES = RELEASES.reduce((n, r) => n + r.changes.length, 0)
