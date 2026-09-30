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

密集排布是先天劣势（22 条链接换行成 3 行），所以"当前页"靠四层信号叠加而非单一底色：

| 信号 | 实现 |
| --- | --- |
| 实心胶囊 | `.app-nav__link.is-active`：框架色渐变实底 + 白字 + `font-weight: 700` |
| 光晕 + 外圈 | `box-shadow: 0 3px 10px rgba(66,184,131,.45), 0 0 0 2px rgba(66,184,131,.16)` |
| 前置圆点 | `::before` 6×6 白色圆点（纯 CSS，不需要模板改结构） |
| 弹入动画 | `@keyframes navPop`，点击后 0.28s 回弹，给出"动作发生了"的瞬时反馈 |
| 分组染色 | 命中分组加 `.is-current` → 浅绿底 + 组名加粗变色，回答"我在哪一组" |
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
