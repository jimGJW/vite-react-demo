# micro-apps/vue-app —— Vue 3 子应用（qiankun 微前端）

被主应用（`vite-react-demo`，React + Vite）通过 qiankun 运行时融合的独立 Vue 3 工程。
也可以脱离主应用独立运行，用于单独开发 / 调试。

- 端口：`7101`（`npm run dev:vue`，或从主应用根目录 `npm run dev:all` 一起起）
- 技术栈：Vue 3（SFC + `<script setup>`）+ vue-router 4 + Element Plus + 自研零依赖组件库
- 融合入口：主应用 `/micro-vue`（独立宿主页，每页只加载一个子应用，规避插件 dev 模式竞态）

## 目录结构

```
src/
├── main.js              # 入口：qiankun 生命周期 + 独立挂载；Element Plus / 指令 / 全局样式装配
├── router.js            # 路由表 + MENU_ITEMS + 全局守卫 + scrollBehavior（history 双模式）
├── App.vue              # 壳层：常驻「子应用内导航条」（融合态也显示，解决"看不到路由入口"）
├── style.css            # 全局基础样式（含各页共用的 .page-header-vue）
├── store/index.js       # 轻量状态管理（defineStore + readonly 出口 + 持久化 + 变更日志）
├── utils/index.js       # 纯函数工具库（集合/对象/数字/字符串/日期/存储/校验器…）
├── composables/index.js # 组合式函数（逻辑复用）
├── directives/index.js  # 8 个自定义指令 + 注册器 + 目录清单
├── components/          # 自研组件库（m- 前缀）+ styles.css + index.js 统一出口
└── pages/               # 页面（含 pages/nested 嵌套子路由、pages/patterns 通信模式示例）
```

## 路由（vue-router 官方用法）

| 能力 | 落点 |
| --- | --- |
| history 双模式 | 独立运行 `createWebHistory()`（URL 可刷新/可分享）；qiankun 融合 `createMemoryHistory()`（不抢主应用 URL） |
| 路由级懒加载 | `const lazy = (loader) => () => loader()`，每个 `import()` 独立 chunk |
| 嵌套路由 | `/nested`（`NestedLayout` 自带 `<router-view />`）+ `''` / `detail/:id` 子路由 |
| 动态段 | `/nested/detail/:id`，`route.params` 响应式，`watch` 计数演示"参数变但组件不重挂" |
| 全局前置守卫 | `router.beforeEach`：鉴权（`meta.requiresAuth`）+ 反向拦截（已登录再进 `/login`）+ 记账 |
| 路由级守卫 | `/nested/detail/:id` 的 `beforeEnter` |
| 鉴权闭环 | `/admin`（受保护）→ 未登录改道 `/login?redirect=/admin` → 登录写 token → `router.replace(redirect)` 放行 |
| 兜底路由 | `/:pathMatch(.*)*` → `NotFound`（页面内提供"404 演示"入口） |
| scrollBehavior | `savedPosition` 优先，带 `hash` 时平滑滚动，否则回顶 |
| afterEach | 写 `document.title`（`meta.title`） |

> 守卫的登录态来自 `store/useAuthStore`（localStorage 持久化），不是组件局部 state —— 因为守卫在组件创建前执行。

## 页内导航条（`App.vue` 的 `.app-nav`）——为什么做得这么"重"

被 qiankun 融合时，子应用的菜单注册在**宿主页之外**的侧边栏，子应用内部看不到任何路由入口，
所以这里常驻一条页内导航条。它同时要解决第二个问题：**"我点了菜单，到底跳没跳？"**

### 两段式布局：先解决"挤"，再解决"看得出"

菜单有二十多条，早期是单条 flex-wrap 平铺，换行成 3 行、层级完全看不出来。现在拆成上下两段：

```text
┌ 顶栏 .app-nav__bar ── 不换行，永远只占一行 ───────────────────────────────┐
│ [V] Vue 3 子应用   当前页 · 星际轨道   [过滤菜单（按 / 聚焦）] [融合中] [404] │
└────────────────────────────────────────────────────────────────────────┘
┌ 分组行 .app-nav__rows ── 每个分组一行 ────────────────────────────────┐
│  基础  [首页] [关于] [登录]                                          │
│  能力  [组件库] [工具函数] [表格] [图表] [表单] [反馈] [指令] [状态管理]      │
│  创意  [创意实验室] [可视化实验室] [星际轨道] [创意 Playground]           │
└────────────────────────────────────────────────────────────────────┘
```

* **组名定宽左栏**：`.app-nav__row-name { flex: 0 0 40px; text-align: right }`
  —— 所有分组的链接都从同一条竖线开始，这是"整齐"的可量化定义（探针直接量每条链接的 `left` 是否收敛成单值）。
* **组名对比度**：写 `#5f6f68` + `font-weight: 600`。早先用浅灰（`#b7c2bc`）导致分组名几乎看不见 —— 信息不该淡到读不出来。
* **顶栏过滤框**：`/` 全局聚焦、`Enter` 跳第一条命中、`Esc` 清空；分组名与链接文字都参与匹配，空组自动剔除。
  过滤只作用在分组行内的链接上，顶栏的「404 演示」是常驻入口、不参与过滤。
* 分组口径走共用纯函数 `buildNavGroups(items, { order })` / `filterNavGroups(groups, keyword)`，与 Angular 子应用同一套实现。

### "当前页"的四层信号

密集排布是先天劣势，所以"当前页"靠四层信号叠加而非单一底色：

| 信号 | 实现 |
| --- | --- |
| 实心胶囊 | `.app-nav__link.is-active`：框架色渐变实底 + 白字 + `font-weight: 700` |
| 光晕 + 外圈 | `box-shadow: 0 3px 10px rgba(66,184,131,.45), 0 0 0 2px rgba(66,184,131,.16)` |
| 前置圆点 | `::before` 6×6 白色圆点（纯 CSS，不需要模板改结构） |
| 弹入动画 | `@keyframes navPop`，点击后 0.28s 回弹，给出"动作发生了"的瞬时反馈 |
| 分组染色 | 命中分组加 `.is-current` → 左侧框架色竖条 + 组名变色，回答"我在哪一组" |
| 当前页徽标 | 品牌右侧 `当前页 · <标题>`，文案取 `route.meta.title` |

另外两处配套：

- `:active` 态 `scale(0.95)` —— 按下瞬间有物理反馈，区别于 hover。
- `<router-view v-slot>` + 内置 `<transition name="view-fade" mode="out-in">` + `:key="route.path"`
  —— 换页时内容区淡入，让"确实换了页"这件事在视觉上无法忽略；`:key` 保证嵌套子路由之间也重播动画。

> 徽标刻意用**浅底彩字**而不是实色：实色徽标会和实心胶囊抢视觉重心，出现两个"当前页"反而更糊涂。

## 页面清单

**基础**：组件库展示 `ComponentsPage` / 样式对比 `StyleShowcasePage` / 嵌套路由 `NestedLayout`(+2 子路由)
**能力**：工具函数 `UtilsPage` / 组合式函数 `ComposablesPage` / 组件工具箱 `KitPage` / 图表中心 `ChartsPage` /
数据表格 `TablePage` / 表单与校验 `FormPage` / 反馈与加载 `FeedbackPage` / 自定义指令 `DirectivesPage` / 状态管理 `StorePage`
**鉴权**：受保护页面 `AdminPage`（守卫日志）/ 登录 `LoginPage`（带回跳）
**通信**：通信模式索引 `PatternsIndex` + 6 个独立示例（父子传值 / 双向绑定 / 跨层传值 / 全局状态 / 插槽 / 模板引用）
**创意**（与主应用、Angular 子应用同题同路由）：

| 路由 | 页面 | 内容 |
| --- | --- | --- |
| `/creative` | `CreativeLab.vue` | ⌘/Ctrl+K 命令面板（命令集由 `MENU_ITEMS` 派生）/ 粒子星轨 / 打字机 / 聚光卡片 / 3D 翻转 / 涟漪 |
| `/data-viz` | `DataVizLab.vue` | 力导向关系图（弹簧 + 斥力 + 向心，可拖节点）/ 螺旋词云 / 热力矩阵（7×24 悬停读数） |
| `/orbit` | `OrbitLab.vue` | 八大行星**真实轨道**（数据来自 `scripts/orbit-data.py`）：默认锁定地球常显真实参数面板、比例模式三档、视角 0~80°、倍速 1~10000 天/秒、轨迹/轨道线/名称开关、回到历元 |
| `/playground` | `Playground.vue` | **32 个算法 demo**（数据源 `src/creative/demos.js`，由主应用侧同步过来；主应用按主题分了 6 组，本页目前是平铺长列表）：左侧列表切换、右栏 canvas + 参数滑杆 + 动作按钮 + 原理说明、HUD 显示 FPS 与指针坐标 |

> 四页都不引图表库 / 动画库。高频交互（`pointermove`）只改 CSS 变量或 canvas，不驱动 Vue 渲染。
> `/orbit` 的数据由主仓库根目录的 `scripts/orbit-data.py` 生成到 `src/data/orbit.js`（Python 算天文，前端只做压缩/投影/插值）。
> `/playground` 的 demo 实现由 `scripts/sync-creative-demos.mjs` 从主应用的 `src/creative/demos.js`
> 同步到 `src/creative/demos.js`（**自动生成，别手改**）；本页只是 ~180 行薄壳。

#### `/orbit` 的一个 Vue 特有处理：面板快照按 ~8Hz 回写

画布用普通变量 `simDays` 逐帧推进，**不放进响应式系统**；面板需要的 `elapsed` ref 按 ~8Hz 回写。
原因是模板里挂着 `el-slider` / `el-radio-group` 这些 Element Plus 组件 ——
如果让 `elapsed` 每帧变一次，整个模板会被 60fps 重渲染，CPU 全烧在 vnode 上。
时钟显示 8Hz 完全够用，画布仍是 60fps。（对照：React 版是 rAF 直写 DOM，Angular 版是节流 `set` 信号。）

#### `/playground` 的一个 Vue 特有处理：demo 实例挂普通变量 + template ref 直写 HUD

同类思路，换了个位置：

| | 实例怎么挂 | 靠什么重建 | HUD（FPS / 指针） |
| --- | --- | --- | --- |
| React 版 | `useRef` | `useEffect` 依赖 `[demo, nonce]` | `data-live` + 容器 `querySelectorAll` 直写 |
| **Vue 版** | **`let inst = null`（普通变量，不进响应式）** | **`watch([active, nonce])`** | **template ref 直写 `textContent`** |
| Angular 版 | 私有字段 | `effect()` 读 signal | `viewChild` 直写 `textContent` |

HUD 每 500ms 才写一次 DOM（汇总 FPS），逐帧数据从不进响应式系统 —— 所以 `reconciliation` 是 0 次/秒。

> 三端薄壳上有一组**跨框架统一的 `data-pg="*"` 属性**（`demo` / `canvas` / `title` / `fps` / `ptr` /
> `pause` / `restart` / `param` / `act`），好让 `scripts/playground-probe.mjs` 用一套选择器跑完三端：
> 逐个点开列表里的每个 demo，断言标题切换、画布真有像素输出、参数控件数量与 `demos.js` 完全一致、零 console error。
>
> ⚠️ **本页的「权威」是 `src/creative/demos.js`，它由主应用侧同步过来。** 主应用已把 demo 扩到
> 32 个并按主题分了 6 组，本页列表**会自动跟着变成 32 项**（数据同源），但**分组标题只有主应用有** ——
> 也就是说这里会是 32 项的长列表。这不是 bug，是「新增 demo 只在主应用验收」这个当前约定的结果；
> 哪天要给子应用也加分组，从 `demos.js` 里一并 `import { DEMO_GROUPS }` 即可，分组表本来就放在同一份文件里。

## 自研组件库（`src/components/`，m- 前缀，14 个）

`MChart` `MStatCard` `ProgressRing` `Countdown` `Marquee` `Ellipsis` `Timeline` `TagInput`
`AsyncSelect` `VirtualList` `PullRefresh` `InfiniteScroll` `DraggableList` `SignaturePad`

全部零第三方依赖（只用 Vue 官方 API），样式统一在 `components/styles.css`。
该文件在 `main.js` 里**全局引入**，因此 `m-btn` / `m-chip` 这类工具类在任何页面都可用。

## 组合式函数（`src/composables/`）

`useCounter` `useToggle` `useLocalStorage` `useSessionStorage` `useNow` `useDebouncedRef`
`useCountdown` `usePolling` `useMouse` `useEventListener` `useIntersection` `useMediaQuery`
`useClipboard` `useAsync` `useTableState` `useStream` `useUndoRedo` `useDragList` `useStepper`
`createStore` `useToast`

## 自定义指令（`src/directives/`）

`v-focus` `v-copy` `v-debounce` `v-throttle` `v-lazy` `v-draggable` `v-permission` `v-longpress`
（`installDirectives(app)` 在 `main.js` 里统一注册；`DIRECTIVE_REGISTRY` 供页面渲染目录表）

## 工具函数（`src/utils/index.js`，123 个值导出）

| 分组 | 内容 |
| --- | --- |
| 函数控制 / 函数组合 | `debounce` `throttle` `once` `memoize` / `pipe` `compose` `curry` `partial` `negate` |
| 集合 / 对象 / 数据结构 | `uniqBy` `groupBy` `chunk` `sortBy` / `deepClone` `pick` `omit` `merge` / `flattenDeep` `unique` `compact` |
| 数据结构进阶 | 树遍历（`treeToFlat` / `flatToTree` / `findNode`）、LRU 缓存、栈/队列、`moveItem`（拖拽落点计算） |
| 数字与格式化 / 数值统计 | `formatNumber` `abbrevNumber` `formatBytes` / `sumBy` `avgBy` `median` `stdDev` `quantile` `roundTo` |
| 字符串 / 时间 / 时间进阶 | `truncate` `escapeHtml` `highlight` `camelCase` / `formatDate` `relativeTime` / `dayRange` `startOfWeek` `diffDays` |
| 校验 | `isEmail` `isPhoneCN` `isIdCardCN`（ISO 7064:1983 MOD 11-2 校验位）`isUrl` `isStrongPassword` |
| 颜色 | `hexToRgb` `rgbToHex` `mixHex` `lighten` `darken` `hexToRgbaString` `readableTextOn`（相对亮度阈值） |
| 导航分组（三端共用口径） | `buildNavGroups` `filterNavGroups` —— 与 Angular 子应用**同名同行为**，仅各自传入本端的 `MENU_GROUP_ORDER` |

> 与 Angular 端的导出面对齐情况由 `/tmp/utils-assert.mjs` 断言（97 条）：
> 唯一登记在案的差异是 Angular 有 `createStore` 而 Vue 侧放在 `composables/`，其余逐一比对通过。

## 与主应用的接口

| 方向 | 接口 | 说明 |
| --- | --- | --- |
| 子 → 主 | `props.registerMenu(MENU_ITEMS)` | `mount` 时把菜单注册到主应用侧边栏 |
| 主 → 子 | `update({ path })` | 主应用菜单点击 → `router.push(path)` |
| 环境 | `qiankunWindow.__POWERED_BY_QIANKUN__` | 判定运行模式（决定 history 类型、导航条模式徽标） |

## 注意

- `vite-plugin-qiankun` **必须从 `vite-plugin-qiankun/es/helper` 子路径导入** `renderWithQiankun` / `qiankunWindow`；
  包入口只导出 default（htmlPlugin），从包名导入会报 `does not provide an export named 'qiankunWindow'`。
- `vite.config.js` 的 `server.host: true` 必开，否则主应用从 `localhost` 加载子应用会因 IPv6/IPv4 不通而失败。
- 构建需要剥离 WorkBuddy 注入的 `NODE_OPTIONS`：`env -u NODE_OPTIONS CODEBUDDY_SAFE_DELETE_ENABLED=0 npx vite build`。
