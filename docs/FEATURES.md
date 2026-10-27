# vite-react-demo 全功能说明

> 本文档是项目**全部功能的权威索引**，覆盖 8 大分组共 51 条路由、可复用模块、四块数据看板、微前端、独立 npm 包、i18n、动效系统与五层验证体系。各模块的深入文档见对应目录下的 `README.md`（本文末尾有清单）。
>
> 更新基准：changelog r8（2026-10-27，commit `8696d6b + 663983d`）。单测 502/502。
>
> <span style="color:#e64545">**红色 = 最近 7 天内新增/修改的内容**（对应 changelog「新」标红窗口，过窗后应摘除红标）。</span>

---

## 目录

1. [项目定位与技术栈](#1-项目定位与技术栈)
2. [功能总览地图](#2-功能总览地图)
3. [AI 助手分组](#3-ai-助手分组)
4. [工具箱分组](#4-工具箱分组)
5. [组件对比中心](#5-组件对比中心)
6. [进阶案例分组](#6-进阶案例分组)
7. [创意分组](#7-创意分组)
8. [数据看板（天 · 地 · 海 · 时间）](#8-数据看板天--地--海--时间)
9. [子应用与微前端（qiankun）](#9-子应用与微前端qiankun)
10. [全站基础设施](#10-全站基础设施)
11. [独立 npm 包（12 个）](#11-独立-npm-包12-个)
12. [五层验证体系](#12-五层验证体系)
13. [工程约定速查](#13-工程约定速查)
14. [功能版本时间轴（r1–r9）](#14-功能版本时间轴r1r9)
15. [模块级文档索引](#15-模块级文档索引)

---

## 1. 项目定位与技术栈

一个**前端能力全景演示 + 可复用资产库**：从两个存量项目（移动端 / 平板端）取材，去业务化后重写为 React 19 生态的可复用组件与工具，并用四块实时数据看板、三端微前端、创意算法演示做集成验证。

| 分类 | 选型 |
| --- | --- |
| 构建 | Vite 8（rolldown）+ React Compiler |
| 主框架 | React 19 + react-router 7 + antd 5 |
| 子应用 | Vue 3 + Element Plus（:7101）· Angular 22 Standalone（:7102），qiankun 融合 |
| 图表 | ECharts 6 + 12 个零依赖纯 SVG 图表组件 |
| 状态/动效 | Context 分频拆分 + `src/motion/` 动效中枢（keyframes + Reveal 等） |
| 离线 AI | @huggingface/transformers + onnxruntime-web（浏览器内 Whisper） |
| 样式 | SCSS + `--c-*` 主题变量（全站不写死颜色） |
| 测试 | 零依赖 node 单测 + SSR/浏览器/看板冒烟 + Playwright E2E |

登录：`/login`（admin / admin），`AuthContext` + localStorage 持久化，`<RequireAuth>` 路由守卫。

---

## 2. 功能总览地图

侧边栏按 8 个分组组织（`src/layouts/Layout.jsx` navItems + `src/i18n/locales/*/nav.json`）：

| 分组 | 页面（路由） |
| --- | --- |
| 首页 | 周天星辰大阵 `/` · 关于 `/about` · 控制台 `/dashboard` |
| AI 助手 | ChatBot `/chatbot` · 分享 `/share` · 语音 `/voice` · Agent `/agent` · <span style="color:#e64545">Agent 实验室 `/agent-lab`</span> |
| 工具箱 | Kit `/kit` · Studio `/studio` · Templates `/templates` · Utils `/utils` · React 核心 API `/react-hooks` · 扫码 `/scan` · 嵌套预览 `/embed` · 配置表单 `/form-builder` · 主题 `/theme` · SVG 图表 `/charts` · ECharts `/echarts` · 命令面板 `/command-palette` · 通知 `/notify` · 高级表格 `/data-table` · 快捷助手 `/assistant-demo` |
| 组件对比中心 | AntD 组件库 `/antd` + 6 个对比专题 `/compare-*` |
| 进阶案例 | 性能实验室 `/perf-lab` · 错误边界 `/error-boundary` · 状态机 `/state-machine` · 浏览器原生能力 `/web-api` |
| 创意 | 创意实验室 `/creative` · 可视化 `/data-viz` · 星际轨道 `/orbit` · 洪荒三阵 `/honghuang` · 周天星辰 `/stars` · Playground `/playground` |
| 数据看板 | 深空 `/astro` · 地球 `/geo` · 海洋 `/ocean` · 时空档案 `/timeline` |
| 子应用 (qiankun) | 融合总览 `/micro-frontend` · Vue `/micro-vue` · Angular `/micro-angular` |
| 其他 | 测试中心 `/test-center` · 星空登录 `/login` · 404 兜底 `/404` · 隐藏页视频轮播 `/not-videos` |

`src/App.jsx` 对全部路由 chunk 做空闲预热（`requestIdleCallback`），跳转零加载延迟。

---

## 3. AI 助手分组

### 3.1 对话助手 ChatBot（`/chatbot` → `src/components/ChatBot/`）

流式 AI 对话的**完整可复用实现**：

- **流式协议**：逐行 JSON（兼容 SSE）。帧类型 `status` / `content` / `steps` / `error`，`stop` 帧权威收口。协议解析在 `chatStream.js`，`classifyFrame` 纯函数可单测。
- **思考态条 ThinkingStrip**（<span style="color:#e64545">r8 · 10/27 新增</span>，移植自 hc-apm-mobile）：回答收口后显示「已完成思考 · 用时 X 秒」，可展开结构化步骤流（每步带耗时）；纯 UI、走 `--c-*` 主题变量、尊重 `prefers-reduced-motion`。计时由 `useMessage.js` 的 `startedAt/finishedAt/elapsedMs/steps` 驱动。
- **四类富卡片**：列表 / 数据表 / 任务表 / 折线图，按 `contentType` 自动分发；表格可切图表、导出 CSV。
- **输入体验**：<span style="color:#e64545">4 行高度上限（r8 收紧）</span>、IME 合成守卫（中文输入回车不误发）。
- **推荐问题**：<span style="color:#e64545">带序号的裸行分隔列表（r8 改版）</span>（窄屏不溢出，整行可点）。
- **历史会话**：分页 / 回读 / 删除 / 清空；赞踩、复制、重新生成、停止生成。
- **可注入后端**：`createHttpApi`（真实接口）与 `createMockApi`（离线演示）同签名互换。
- **性能**：Context 按变化频率拆分 + 全链路 `React.memo`，流式期间只重绘生成中的气泡。

### 3.2 对话分享 QASharing（`/share` → `src/components/ChatBot/sharing/`）

把一段对话变成只读落地页：`request/api/flag/transform` 全外置（零依赖 fetch 兜底）、卡片渲染器可插拔（未注册类型退化 Markdown）、「继续追问」回流主聊天页接上下文、匿名可访问。

### 3.3 语音助手（`/voice` → `src/pages/VoiceAssistant/` + `src/components/VoiceInput/`）

在线 Web Speech API + 离线 Whisper **双引擎**；Whisper 模型（`public/models/`）与 ORT wasm（`public/ort/`）本地运行，浏览器内完成识别。

### 3.4 AI Agent 控制台（`/agent` → `src/pages/Agent/`）与全局 Agent

自然语言驱动页面 DOM 操作（NLP 规则 + DOM 执行层）；`src/components/GlobalAgent/` 提供全局浮动入口，`src/components/Assistants/` 是助手中心 Provider（任意页面 `useAssistants()` 唤起弹窗，含 `/assistant-demo` 演示）。

### 3.5 <span style="color:#e64545">AI Agent 实验室（`/agent-lab` → `src/pages/AgentLab/`，r8 · 10/27 新增）</span>

基于 ChatBot 打造的 Agent 知识中心，复用流式对话 / 富卡片 / 思考态条全部能力；页面拆分为 **KnowledgeTab / FrameworkTab / PromptTab / CompareLab** 四个内聚组件（共享演示引擎 `useSimulatedStream`），index.jsx 只做薄编排：

- **对话注入**：`createMockApi` 新增 `answers` 解析器注入点（`agentAnswers.js`），按问题命中知识域返回框架对比表格卡片 / MCP / RAG / ReAct / 提示词 / 工具调用六类主题回答，带自定义思考步骤流与推荐追问
- **知识点库**：22 个市场主流知识点（前端 6 / 后端 6 / 协议 3 / 框架 7），分类筛选 + 全文搜索 + 详情弹窗，数据在 `agentData.js`（双语 `{ 'zh-CN', en }`）
- **框架对比**：LangGraph / OpenAI Agents SDK / AutoGen / CrewAI / Dify / Vercel AI SDK 六框架横向表
- **提示词模板**：ReAct / 工具调用 / RAG 引用 / 多智能体角色 / 结构化输出 5 套模板一键复制
- **<span style="color:#e64545">对比实验室（r8 新增）</span>**：多方案并排真机演示——① 流式三通道（SSE / fetch ReadableStream / WebSocket 模拟）同文案并排跑 + 五维特性矩阵；② 回答渲染三形态（整段 / 逐字 / 逐词打字机）+ 速度档位；③ 思考链三形态（ThinkingStrip 步骤条 / 脉冲思考点 / 时间线）。页签销毁式切换（`destroyInactiveTabPane`）停表省资源，演示定时器卸载自动清理

---

## 4. 工具箱分组

### 4.1 组件工具箱 Kit（`/kit` → `src/components/Kit/`，18 组件 + 4 Hook）

从存量移动端/平板端项目筛选、去业务化重写（React 19 + antd 5，图表用 ECharts 6）：

- **移动交互**：电子签名（Canvas）、下拉刷新、触底加载、可拖拽悬浮球、拖拽排序、超宽跑马灯
- **数据展示**：多行省略、指标卡（涨红跌绿）、倒计时、通知面板、迷你图表 5 件套
- **表单控件**：标签输入、异步选择器、时段录入（含重叠校验）

### 4.2 组件工坊 Studio（`/studio` → `src/components/Studio/`，24 组件 · 10 分组）

从 80+ 存量项目普查的去业务化组件：可视化大屏（空态/滚动榜/看板/断轴柱状/区域图/自适应表格）、规则编排（条件编排树/对象 diff）、图像标注、schema 表单、组织树、安全报告卡片、锚点导航、多标签工作区、关键词高亮/树表/行内编辑、自由拖拽布局、Canvas 仪表盘、3D 轮播、帧序列播放器、右键菜单、全屏容器等。

### 4.3 开源模板库 Templates（`/templates` → `src/components/Templates/`）

19 个纯上游开源模板（React 7 / Vue 9 / 移动端 1 / 组件库工具 2）的元信息卡片库，可按技术栈过滤、附上游仓库溯源链接。纯数据模块，全链路去敏。

### 4.4 小功能集 Utils（`/utils` → `src/components/Utils/`）—— 通用工具唯一真源

28 个文件 = **19 个纯函数域 + 9 个 Hook 域**（date/async/format/download/collection/tree/url/dom/storage/env/string/number/array/objectPath/dateExtra/color/validate + useFreq/useStorage/useBrowser/useDom/useStateKit/useWatermark/useTiming/useEventKit）。全站新增通用函数一律收口到这里；`utils.js`/`hooks.js` 仅是转发层。水印 Hook 带 MutationObserver 防删除。

### 4.5 React 核心 API（`/react-hooks`）

Context 四件套综合案例（带渲染计数徽标）+ 逐 API 讲解 + React 19 新特性 10 卡（`useOptimistic` / `useActionState` / `use` / `useTransition` / `useDeferredValue` / `useEffectEvent` / ref as prop 等，全部可当场验证）。

### 4.6 其余工具页

| 路由 | 能力 |
| --- | --- |
| `/scan` | 摄像头实时扫码 + 图片识别（qr-scanner） |
| `/embed` | iframe 嵌套探测（dev server `/__frame-check` 检查 X-Frame-Options / CSP） |
| `/form-builder` | JSON 驱动动态表单（antd-form-builder） |
| `/theme` | CSS 变量多主题实时预览 |
| `/charts` | 12 种零依赖纯 SVG 图表（Line/Bar/Pie/Gauge/Radar/Multi*/Stacked/Drilled/Nested/Switchable） |
| `/echarts` | ECharts 6 集成演示 |
| `/command-palette` | ⌘K 全局命令面板 |
| `/notify` | Toast / 分类通知 / 未读数 |
| `/data-table` | 筛选/排序/分页/固定列/行选择 |
| `/test-center` | 浏览器侧即时测试（模块导出/导入/路由完整性） |

---

## 5. 组件对比中心

`/antd`（React 侧 AntD 展示）+ 6 个双栏对比专题（`src/pages/Compare/`，`CompareLayout` 统一容器：双栏演示 + 原理对比表 + 核心代码）：

| 路由 | 对比点 |
| --- | --- |
| `/compare-parent-child` | props+回调 vs defineProps/emit |
| `/compare-two-way` | useState 受控 vs v-model |
| `/compare-provide` | Context vs provide/inject |
| `/compare-state` | Context+useReducer vs reactive |
| `/compare-slot` | children/render props vs slot |
| `/compare-ref` | useRef vs ref/defineExpose |

---

## 6. 进阶案例分组

| 路由 | 模块 | 能力 |
| --- | --- | --- |
| `/perf-lab` | `src/components/PerfLab/` | 虚拟滚动 / 实时帧率 / Web Worker / 重渲染优化四个可验证实验 |
| `/error-boundary` | `src/components/ErrorBoundary/` | 渲染期兜底 + `useAsyncError` 承接异步错误 + resetKeys 自动复位 |
| `/state-machine` | `src/components/StateMachine/` | 纯函数状态机 + 撤销栈（commit/undo/redo/jumpTo），工单流转演示 |
| `/web-api` | `src/components/WebApi/` | 全屏/常亮/定位/通知/分享/网络探测，统一 `supported` 字段 |

---

## 7. 创意分组

| 路由 | 内容 |
| --- | --- |
| `/creative` | 粒子星轨 / 打字机 / 聚光卡片 / 3D 翻转 / 涟漪 / 磁性按钮（canvas 粒子 + CSS 变量，不驱动框架渲染） |
| `/data-viz` | 力导向关系图 / 螺旋词云 / 热力矩阵（手写布局算法，零图表库） |
| `/orbit` | 八大行星**真实轨道要素**：`scripts/orbit-data.py`（零依赖 stdlib）解 Kepler 方程产出数据，前端只做投影与插值；比例模式对照、瞬时速度、倾角可视化 |
| `/honghuang` | 洪荒三阵：周天星斗 / 十二都天神煞 / 九宫八卦联动（点宫亮星区、Esc 收起） |
| `/stars` | 周天星辰：基于真实星表（`public/data/star-catalog.json`，`scripts/build-star-catalog.mjs` 重建）的独立页 |
| `/playground` | **32 个算法 demo · 6 组**（场与流体/元胞自动机/天体力学/几何图案/粒子渲染/数值优化）。唯一真相 `src/creative/demos.js`（零框架 API），Vue/Angular 拷贝由 `npm run sync:demos` 同步，`sync:demos:check` 防漂移 |

> ⛔ `src/creative/` 是独立同步单元：内部禁止 import 目录外模块与路径别名。

---

## 8. 数据看板（天 · 地 · 海 · 时间）

四块看板共用一套架构：数据源经根目录代理脚本（`vite-astro-proxy.mjs` / `vite-geo-proxy.mjs` / `vite-ocean-proxy.mjs`）服务端转发绕 CORS + 缓存；页签支持 `?tab=` URL 直达；页签间通过 `src/lib/boards/relations.js`（87 条关联，含因果 `why` + `detail` + `terms`）互跳，健康度由 `health.js` 汇总；名词解释由共用词典渲染器 `DictView` 承载，主题以 props 传入。

### 8.1 深空数据看板 AstroBoard（`/astro`，11 页签）

🌍 星地（ISS 实时 + 天宫三舱 SGP4 推算 + 过境预报）· 🪐 行星（JPL 根数 + NEO）· ☀️ 太阳（SWPC 空间天气：Kp/F10.7/黑子/X 射线/极光）· ✨ 全天星图（d3-celestial + 真实星表 + 观星窗口）· 🖼 APOD · 🌌 深空（系外行星 + 星系）· 🚀 发射 · ☄️ 彗星 · 🛰 近距接近 · 🔭 观测 · 📚 案例

### 8.2 地球数据看板 GeoBoard（`/geo`，9 页签）

强震（USGS）· EPIC 卫星 · EONET 事件 · 火山 · 气候（温室气体/温度距平）· 空气质量 · 环境气象 · 数据档案 · 📚 案例

### 8.3 海洋数据看板 OceanBoard（`/ocean`，10 页签）

海浪/涌浪（NDBC）· 潮汐 · ENSO/ONI · 气旋（NHC，按编号前缀 al/ep 判洋盆）· **🌀 台风**（<span style="color:#e64545">r6 · 10/22 新增</span>，中央气象台 nmc.cn JSONP，`list_default`/`view_<id>`，CMA 六级与萨菲尔-辛普森口径对照）· 浮标实况 · 海洋 · 海岸 · 海温 · 📚 案例

### 8.4 时空档案 TimelineBoard（`/timeline`，5 页签）

概览 / 数据档案（各看板数据源清单与刷新周期）/ 名词库（聚合词典）/ 模块视图 + **📍 经纬度检查**（<span style="color:#e64545">r7 · 10/23 新增</span>：约 44 国代表城市速查 + `locate(lat,lng)` 反查：边界框优先、最近首都兜底；<span style="color:#e64545">另有 GeoNames 6.3 万城离线词典</span> `src/lib/geo/cities.js`，3MB 按需加载）。

### 8.5 共用词典与阈值

`src/lib/earth/glossary.js`（地/海共用，枚举 + 30 条 KPI 释义 + `lookup`/`bandOf`）与 astro 词典是**阈值唯一真源**——两看板的分档/配色函数都转发它；分档表必须成对给 min/max（单测已钉）。

---

## 9. 子应用与微前端（qiankun）

Vue 3 与 Angular 22 为两个独立工程（`micro-apps/`），主应用不再打包其运行时：

| 宿主页 | 行为 |
| --- | --- |
| `/micro-frontend` | 同页**串行**加载两个子应用（规避 dev 全局单例竞态） |
| `/micro-vue` | 独立宿主页，进入即加载 vue-app（22 条路由） |
| `/micro-angular` | 独立宿主页，进入即加载 angular-app（14 条路由） |

子应用内常驻页内导航条（两段式布局 + 过滤框），选中态约定 `is-active` / `is-current`（诊断脚本依赖）。三端创意分组同题同路由，方便横向对照写法。子应用各自有 README。

---

## 10. 全站基础设施

| 能力 | 位置 / 说明 |
| --- | --- |
| 登录守卫 | `src/contexts/useAuth.js` + `<RequireAuth>`；星空玻璃态登录页 |
| 主题系统 | 全站 `--c-*` CSS 变量（`src/index.scss`），亮暗双主题，组件不写死颜色 |
| 动效中枢 | `src/motion/`：keyframes + `.m-*` 工具类 + `Reveal/Motion/PageTransition/MotionProvider` + `useReveal/useTilt/useCountUp/useReducedMotion`；`animate/` 封装 animate.css 为 `<Animate>` |
| 页面外壳 | `src/components/PageShell/`：统一页头/栅格/分节/KPI 骨架；`BackButton` 无历史回首页；阅读进度条 + 切页回顶 |
| 国际化 | **10 语种**（zh-CN/zh-TW/en/de/fr/th/mn/bo/ja/ko），`src/i18n/`，`useI18n()`；语言切换 `LanguageSwitch`。<span style="color:#e64545">zh-CN（源语言/兜底）同步内置，其余 9 语种切换时按需装载</span>（未就绪自动回退 zh-CN，无闪烁无报错），首屏 i18n chunk 仅约 190KB。治理守卫：非汉藏语种零汉字、ja/ko 相同率门限、zh-TW 简体特征字扫描 |
| ECharts 按需注册 | <span style="color:#e64545">`src/lib/echarts.js` 是全项目唯一注册点（r8 · 10/27）</span>（折线/柱状/饼/雷达/散点 + 所需组件 + Canvas 渲染器）；Kit/Studio/ChatBot 图表统一从此引入，vendor chunk 较全量引入瘦身约四成 |
| 版本时间轴 | `src/components/Changelog/`（`releases.js` 纯数据 + 侧边栏批次着色图标 + `ROUTE_LATEST` 映射） |
| 时钟隔离 | `src/components/Clock.jsx` 自包含秒级自更新，避免看板顶层每秒重渲染 |
| 路径别名 | 唯一真源 `scripts/aliases.mjs`（`@`/`@i18n`/`@components`/`@lib`/`@root`），vite 与 tsconfig 由单测守卫同步 |
| 数据多语化范式 | 文案字段 `{ 'zh-CN':…, en:… }` + `pickText(field, lang)` 兜底链；`localize(item, lang)` 整条解析 |
| Vite 自定义 | `serveOrtAssets`（ORT wasm 服务）· `embedHelpers`（iframe 探测）· 4 个数据源代理中间件 |

---

## 11. 独立 npm 包（12 个）

`packages/@myorg/` 下 6 React + 6 Vue 一一对应，ESM+CJS 双产物 + `style.css` + 类型声明：

| React 包 | 内容 | Vue 对应 |
| --- | --- | --- |
| react-styles-reset | 设计 token + 全局 reset | vue-styles-reset |
| react-core-hooks | AuthProvider / useWebQrScanner / useWhisperRecorder | vue-core-composables |
| react-ui-basic | Theme / Notification / CommandPalette / DataTable / StarArray | vue-ui-basic |
| react-media-tools | QrScanBtn / VoiceInput | vue-media-tools |
| react-admin-shell | AdminLayout / GlobalAgent / TestCenter | vue-admin-shell |
| react-svg-charts | 12 个纯 SVG 图表 | vue-svg-charts |

构建：`npm run pkg:all:build`（或按包 `pkg:<name>:build`）；打包 `pkg:all:pack` 产出 `dist-local/*.tgz`。安装方式（gitpkg / file:）见根 README。

---

## 12. 五层验证体系

| 层 | 命令 | 覆盖（当前） |
| --- | --- | --- |
| ① 单元测试 | `npm test` | **502 用例 / 29 个测试文件**，零依赖 node runner（`scripts/run-tests.mjs`）。覆盖：alias 同步、i18n 10 语种治理、chat-stream 协议、changelog 不变量、agent-lab 数据、看板关联/词典、城市词典、latlng、honghuang/jiugong、motion、page-shell、utils、creative-demos（32 demo 真跑 20 帧）等 |
| ② SSR 冒烟 | `npm run test:ssr` | Vite SSR 管线真实渲染 + 页面文案断言（抓 Hook 误用/浏览器 API 误用） |
| ③ 应用内测试中心 | `/test-center` | 浏览器侧断言（导出完整性/计时/路由注册） |
| ④ 浏览器冒烟 | `npm run test:browser` | CDP 驱动本机 Chrome，从 App.jsx 自动解析路由逐页访问抓 console error（需先起 dev） |
| ⑤ 专项冒烟 + E2E | `test:astro`(73) / `test:earth`(63) / `test:qiankun` / `test:e2e` | 看板逐页签真浏览器断言、qiankun 融合断言、Playwright 交互测试 |

> 不引 vitest/jest：纯函数零依赖，node 直跑更快更省。单测约定：`tests/unit/<模块>.test.mjs`，default 导出 `[用例名, fn][]`。

---

## 13. 工程约定速查

- **构建/起服务必须**：`env -u NODE_OPTIONS CODEBUDDY_SAFE_DELETE_ENABLED=0 npm run build|dev`
- **提交纪律**：禁 commit `.tmptest/`；全项目去敏（含注释内项目代号）；双仓库（GitHub ssh:443 + Gitee）origin 双 pushurl 一次推两边；禁 force-push，先 fetch-merge
- **改功能三同步**：SSR 冒烟文案（`scripts/ssr-smoke.mjs` 钉页面文案）、changelog 断言（`tests/unit/changelog.test.mjs` 的 length/TOTAL_CHANGES/ROUTE_LATEST）、i18n 全 10 语种（新增键走 `node scripts/i18n-set.mjs <ns> <data.json>`）
- **React 19 / eslint 红线**：ref 不进 hook 返回对象（调用方传入）、effect 不同步 setState、手动依赖与推断一致、组件文件不混导出工具函数
- **性能约定**：Context 按变化频率拆分；memo 回调 `useCallback` 引用稳定；高频数据直写 DOM 不进框架渲染循环（Playground/Orbit 三端一致）
- **勿删**：`public/ort/`(21M) + `public/models/`(43M) 运行时必需；`concurrently/sass/typescript/@types/*` 不能因"无 import"判未使用

---

## 14. 功能版本时间轴（r1–r8）

数据：`src/components/Changelog/releases.js`（**41 条变更，共 8 批次**；同一天的多批改动合并为一个批次，批次配色互不相同；近 7 天内的批次在侧边栏 / 时间轴 / 页面内容处统一**红标「新」**）。

| 批次 | 日期 | 主题 | 条数 |
| --- | --- | --- | --- |
| r1 | 9/14 | 四大基础模块上线（Kit/Studio/Templates/Utils/ChatBot/QASharing） | 6 |
| r2 | 9/20 | React 核心 API 演示 + 五层验证体系 | 2 |
| r3 | 9/27 | 四大进阶模块 + Utils 大扩充 | 5 |
| r4 | 9/30 | 微前端三端对称 + 创意分组 + Playground 32 demo | 8 |
| r5 | 10/10 | 数据看板大扩容（天/地/海）+ Agent 拆分 + 案例体系 | 7 |
| r6 | 10/22 | 海洋看板接入中央气象台台风（CMA 分级对照） | 2 |
| <span style="color:#e64545">r7</span> | <span style="color:#e64545">10/23</span> | <span style="color:#e64545">时空档案大更新（经纬度检查 + 6.3 万城城市词典）+ 洪荒三阵/周天星辰 + PageShell 全站外壳（同日两批合并）</span> | <span style="color:#e64545">6</span> |
| <span style="color:#e64545">r8</span> | <span style="color:#e64545">10/27</span> | <span style="color:#e64545">ChatBot 思考态条 + 输入 4 行 + 裸行推荐（移植自 hc-apm-mobile）+ i18n 按需装载 + ECharts 按需注册 + AI Agent 实验室新页面（同日合并批）</span> | <span style="color:#e64545">6</span> |

---

## 15. 模块级文档索引

| 文档 | 内容 |
| --- | --- |
| [src/components/ChatBot/README.md](../src/components/ChatBot/README.md) | 流式协议 / 卡片格式 / 全部 API |
| [src/components/ChatBot/sharing/README.md](../src/components/ChatBot/sharing/README.md) | 分享协议 / 接口契约 / 迁移清单 |
| [src/components/Kit/README.md](../src/components/Kit/README.md) | 选型台账 / 组件 API / 迁移基线 |
| [src/components/Studio/README.md](../src/components/Studio/README.md) | 普查台账 / 10 分组清单 |
| [src/components/Utils/README.md](../src/components/Utils/README.md) | 纯函数 / Hook 全清单 |
| [micro-apps/vue-app/README.md](../micro-apps/vue-app/README.md) | Vue 子应用架构 |
| [micro-apps/angular-app/README.md](../micro-apps/angular-app/README.md) | Angular 子应用架构 |
| [design-system-workbench/DESIGN-SYSTEM.md](../design-system-workbench/DESIGN-SYSTEM.md) | 设计系统工作台说明 |
| [README.md](../README.md) | 版本演进史（v1→v3.2）与三框架架构沿革 |
