/**
 * 功能版本时间轴数据
 * 把"新功能"按上线批次（时间段）归类，每个 release 对应一次集中改动。
 * changes 列出该批次改动的具体页面与说明，changedAt 为改动日期。
 *
 * 数据以仓库真实 git 提交批次为依据：
 *   r1  2026-09-14  b776892  四大基础模块上线（Kit/Studio/Templates/Utils/ChatBot/QASharing）
 *   r2  2026-09-20  396587e  React 核心 API 演示 + 五层验证体系
 *   r3  2026-09-27  5f67751  四大进阶模块 + Utils 大扩充
 *   r4  2026-09-30           微前端三端对称 + 创意分组 + 创意 Playground 32 demo
 *                            （r4 的 commit 暂未回填：它是「本次提交」，无从预知 hash；
 *                            该字段目前只作资料展示，没有代码读它）
 *   r5  2026-10-10           数据看板大扩容：地球 / 海洋 / 星空三看板 + Agent 拆分 + 案例体系
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
]

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
