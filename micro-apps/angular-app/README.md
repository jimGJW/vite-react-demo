# micro-apps/angular-app —— Angular 22 子应用（qiankun 微前端）

被主应用（`vite-react-demo`，React + Vite）通过 qiankun 运行时融合的独立 Angular 工程。
使用 Angular 官方新范式：**standalone component + signals + 函数式守卫/解析器 + 官方 Router**，
不含 NgModule，也没有 RxJS 之外的状态库。

- 端口：`7102`（`npm run dev:angular`，或从主应用根目录 `npm run dev:all` 一起起）
- 构建链：Vite + `@analogjs/vite-plugin-angular` + `@angular/build`
- 融合入口：主应用 `/micro-angular`（独立宿主页，每页只加载一个子应用，规避插件 dev 模式竞态）

## 目录结构

```
src/
├── main.ts                        # 入口：zone.js + @angular/compiler（JIT）+ qiankun 生命周期
├── styles.css                     # 全局样式（ng- 前缀工具类：ng-btn / ng-chip / ng-card / ng-table …）
├── utils/index.ts                 # 纯函数工具库（与 vue-app/src/utils 一一对应）
└── app/
    ├── app.component.ts           # 壳层：常驻「子应用内导航条」（融合态也显示）+ router-outlet
    ├── app.config.ts              # ApplicationConfig：provideRouter(hash) + withComponentInputBinding
    ├── app.routes.ts              # 路由表（loadComponent 懒加载 + canActivate + resolve）
    ├── view-state.ts              # MENU_ITEMS / MENU_GROUPS（由路由表自动派生）+ routeLog
    ├── core/                      # 能力层（services / pipes / directives / components / guards / resolvers）
    └── views/                     # 视图组件（standalone，模板内联）
```

## 路由（@angular/router 官方用法）

| 能力 | 落点 |
| --- | --- |
| hash 模式 | `withHashLocation()`：qiankun 融合下不写主应用 URL（等价 Vue 侧 memory history 的意图） |
| 懒加载 | `loadComponent: () => import('./views/x').then((m) => m.X)` |
| 参数绑定 | `withComponentInputBinding()`：路由参数 / query 参数 / `data` / resolve 结果直接绑到组件 `input()` |
| 滚动 | `withInMemoryScrolling({ scrollPositionRestoration: 'top' })` |
| 函数式守卫 | `canActivate: [authGuard]` —— `inject(AuthService)` 读单例登录态；未登录返回 `router.createUrlTree(...)` **改道** |
| 反向守卫 | `canActivate: [guestOnlyGuard]` —— 已登录再进 `/login` 会被弹回首页 |
| 解析器 | `resolve: { snapshot: monitorResolver }` —— 导航激活前预取数据，组件第一帧就有数据 |
| 鉴权闭环 | `/guarded` → 未登录改道 `/login?redirect=/guarded` → 登录写 token → `navigateByUrl(redirect)` 放行 |
| 兜底路由 | `path: '**'` → `NotFoundView` |
| 路由级标题 | `title: '…'`，Router 自动写 `document.title` |

> 为什么登录态必须是**服务**：`canActivate` 在组件创建**之前**执行，此刻没有组件实例，
> 只能通过官方 DI 拿 `AuthService`（`providedIn: 'root'` 单例 + localStorage 持久化）。

## 视图清单

**基础**：组件与模板 `ComponentsView` / 服务注入与管道 `ServicesView`
**能力**：工具函数 `UtilsView` / 自有组件库 `KitView` / 图表中心 `ChartsView` / RxJS 与信号对照 `RxjsView` /
自定义指令与管道 `DirectivesView` / 数据表格 `TableView` / 响应式表单 `FormsAdvancedView` / 模板式表单 `FormsView` /
状态管理与持久化 `StoreView`
**鉴权**：受保护页面 `GuardedView`（守卫 + 解析器）/ 登录 `LoginView`
**创意**（与主应用、Vue 子应用同题同路由）：

| 路由 | 视图 | 内容 |
| --- | --- | --- |
| `/creative` | `creative-lab-view.ts` | 粒子星轨 / 打字机 / 聚光卡片 / 3D 翻转 / 涟漪 / 磁性按钮 |
| `/data-viz` | `data-viz-view.ts` | 力导向关系图 / 螺旋词云 / 热力矩阵（7×24 悬停读数） |
| `/orbit` | `orbit-lab-view.ts` | 八大行星**真实轨道**（数据来自 `scripts/orbit-data.py`）：默认锁定地球常显真实参数面板、比例模式三档、视角 0~80°、倍速 1~10000 天/秒、轨迹/轨道线/名称开关、回到历元 |
| `/playground` | `playground-view.ts` | **32 个算法 demo**（数据源 `src/creative/demos.ts`，由主应用侧同步过来；主应用按主题分了 6 组，本页目前是平铺长列表）：左侧列表切换、右栏 canvas + 参数滑杆 + 动作按钮 + 原理说明、HUD 显示 FPS 与指针坐标 |

> 四页都不引图表库 / 动画库。canvas 与 rAF 的启动放在 `afterNextRender()`（SSR 安全、首帧后才有 DOM），
> 定时器与 `ResizeObserver` 在 `ngOnDestroy` 里清理；重交互数据用 `signal` 持有而非普通字段，
> 否则 computed 会在首轮变更检测时固化成空值。
> `/orbit` 的数据由主仓库根目录的 `scripts/orbit-data.py` 生成到 `src/data/orbit.ts`（带 `OrbitBody` / `OrbitData` 类型）。
> `/playground` 的 demo 实现由 `scripts/sync-creative-demos.mjs` 从主应用的 `src/creative/demos.js`
> 同步到 `src/creative/demos.ts`（**自动生成，别手改**）；本视图只是 ~200 行薄壳。

#### 独立运行时的深链：别用 `navigateByUrl('/默认页')` 兜底

本应用用 `withHashLocation()`（子应用 pushState 不能抢主应用的 path），所以**地址栏里的 `#/xxx` 就是真实初始路由**。
`main.ts` 里那句「bootstrap 完补跳到默认页」如果写成

```ts
await router.navigateByUrl(pendingPath ?? '/components')   // ❌
```

独立运行时 `pendingPath` 永远是 `null`，于是**输什么地址都回到 `/components`** —— 深链 `/#/playground` 直接失效，
而单测和 `tsc` 都发现不了（这是纯运行时行为）。正确做法是按运行模式分流：

```ts
await router.navigateByUrl(pendingPath ?? landingPath())   // ✅
// 融合运行（qiankun 托管）：hash 没有语义 → '/components'
// 独立运行：读 location.hash，非根路径就照走，否则才落默认页
```

#### `/orbit` 的一个 Angular 特有处理：面板快照按 ~8Hz 回写信号

画布用普通字段 `simDays` 逐帧推进，**不碰信号**；面板需要的快照按 ~8Hz `elapsed.set()`。
如果让信号每帧变一次，OnPush 组件会被 60fps 重渲染 —— Angular 的模板（含函数调用）比 Vue/React 更贵，
这里 `periodText()` / `speedText()` / `moonShown()` 都是在模板里直接调用的。
（对照：React 版是 rAF 直写 DOM，Vue 版是节流回写 ref。）

#### `/playground` 的一个 Angular 特有处理：`effect()` 重建 + 就绪标志位

| | 实例怎么挂 | 靠什么重建 | HUD（FPS / 指针） |
| --- | --- | --- | --- |
| React 版 | `useRef` | `useEffect` 依赖 `[demo, nonce]` | `data-live` + 容器 `querySelectorAll` 直写 |
| Vue 版 | 普通变量 | `watch([active, nonce])` | template ref 直写 `textContent` |
| **Angular 版** | **私有字段** | **`effect()` 里读 `active()` / `nonce()`** | **`viewChild` 直写 `textContent`** |

`effect()` 在首轮变更检测里就会跑，那时 `#stage` 可能还没进 DOM，所以有一个 `domReady` 普通字段做闸门：
`afterNextRender` 里先置 `true` 再建第一个实例；此后切 demo 才走 `effect()`。
HUD 每 500ms 写一次 DOM，逐帧数据从不 `set` 信号。

> 三端薄壳上有一组**跨框架统一的 `data-pg="*"` 属性**（`demo` / `canvas` / `title` / `fps` / `ptr` /
> `pause` / `restart` / `param` / `act`），好让 `scripts/playground-probe.mjs` 用一套选择器跑完三端。
> 注意 Angular 侧静态属性写 `data-pg="..."`，动态值必须走 `[attr.data-demo-id]` / `[attr.data-param-key]`
> —— 直接写 `[data-demo-id]` 会被当成属性绑定表达式而报错。

> **Angular 模板拿不到 `Math` 这类全局对象**，所以 `Math.min(body.moons, 4)` 这类算式必须抽成组件方法（`moonShown()`）。
> 这一点和「模板不能写 `new Set()`」是同一类坑：模板只支持表达式子集。

## core 能力层

**服务（DI）**：`ToastService` `StorageService` `ThemeService` `MockApiService` `UndoRedoService` `AuthService`

**管道（8）**：`HighlightPipe` `FileSizePipe` `RelativeTimePipe` `TruncatePipe` `ThousandsPipe`
`AbbrevPipe` `StatusTextPipe` `MyDatePipe`（`PIPES` 数组便于 `imports: [...PIPES]`）

**指令（7）**：`CopyDirective` `DebounceClickDirective` `ThrottleScrollDirective` `LazyDirective`
`ClickOutsideDirective` `DraggableDirective` `LongpressDirective`（`DIRECTIVES` / `DIRECTIVE_REGISTRY`）

**自有组件（10）**：`MiniChartComponent` `StatCardComponent` `ProgressRingComponent` `CountdownComponent`
`MarqueeComponent` `EllipsisComponent` `TimelineComponent` `TagInputComponent` `VirtualListComponent`
`ToastHostComponent`（`NG_COMPONENTS` / `COMPONENT_REGISTRY`）

**守卫 / 解析器**：`authGuard` `guestOnlyGuard` `monitorResolver`（`GUARD_REGISTRY` 供页面渲染目录表）

## 工具函数（`src/utils/index.ts`）

与 `micro-apps/vue-app/src/utils/index.js` **同名同行为 + 泛型签名**，导出面逐一比对通过
（唯一登记在案的差异：Angular 有 `createStore`，Vue 侧对应能力放在 `composables/`）。

| 分组 | 内容 |
| --- | --- |
| 函数控制 / 函数组合 | `debounce` `throttle` `once` `memoize` / `pipe` `compose` `curry` `partial` `negate` |
| 集合 / 对象 / 数据结构 | `uniqBy` `groupBy` `chunk` `sortBy` / `deepClone` `pick` `omit` `merge` / `flattenDeep` `unique` `compact` |
| 数据结构进阶 | 树遍历、LRU 缓存、栈/队列、`moveItem`（拖拽落点计算） |
| 数字与格式化 / 数值统计 | `formatNumber` `abbrevNumber` `formatBytes` / `sumBy` `avgBy` `median` `stdDev` `quantile` `roundTo` |
| 字符串 / 时间 / 时间进阶 | `truncate` `escapeHtml` `highlight` / `formatDate` `relativeTime` / `dayRange` `startOfWeek` `diffDays` |
| 校验 | `isEmail` `isPhoneCN` `isIdCardCN`（ISO 7064:1983 MOD 11-2 校验位）`isUrl` `isStrongPassword` |
| 颜色 | `hexToRgb` `rgbToHex` `mixHex` `lighten` `darken` `hexToRgbaString` `readableTextOn` |
| 导航分组（三端共用口径） | `buildNavGroups<T>` `filterNavGroups` —— 泛型入参，`view-state.ts` 的 `MENU_GROUPS` 由它派生 |

`HighlightPipe` 直接复用 utils 的 `highlight()`，避免同一条高亮逻辑在管道和工具库里各写一遍。

## 与主应用的接口

| 方向 | 接口 | 说明 |
| --- | --- | --- |
| 子 → 主 | `props.registerMenu(MENU_ITEMS)` | `mount` 时把菜单注册到主应用侧边栏 |
| 主 → 子 | `update({ path })` | 主应用菜单点击 → `router.navigateByUrl(path)` |
| 环境 | `qiankunWindow.__POWERED_BY_QIANKUN__` | 判定运行模式（决定导航条模式徽标） |

## 页内导航条（`app.component.ts` 的 `.ng-tabs`）——为什么做得这么"重"

被 qiankun 融合时，子应用的菜单注册在**宿主页之外**的侧边栏，子应用内部看不到任何路由入口，
所以这里常驻一条页内导航条。它同时要解决第二个问题：**"我点了菜单，到底跳没跳？"**

### 两段式布局：先解决"挤"，再解决"看得出"

早期是单条 flex-wrap 平铺，十几条链接换行后层级完全看不出来。现在拆成上下两段：

```text
┌ 顶栏 .ng-tabs__bar ── 不换行，永远只占一行 ──────────────────────────────┐
│ [A] Angular 22 子应用  当前页 · 星际轨道  [过滤菜单（按 / 聚焦）] [融合中] │
└──────────────────────────────────────────────────────────────────────┘
┌ 分组行 .ng-tabs__rows ── 每个分组一行 ──────────────────────────────┐
│  基础  [组件与模板] [服务与管道]                                      │
│  能力  [工具函数] [自有组件库] [图表中心] [RxJS] [指令与管道] [表格] [表单] │
│  创意  [创意实验室] [可视化实验室] [星际轨道] [创意 Playground]         │
└────────────────────────────────────────────────────────────────────┘
```

* **组名定宽左栏**：`.ng-tabs__row-name { flex: 0 0 40px; text-align: right }`
  —— 所有分组的链接从同一条竖线开始，这是"整齐"的可量化定义（探针直接量每条链接的 `left` 是否收敛成单值）。
* **组名对比度**：写 `#606a76` + `font-weight: 600`。浅灰会让分组名几乎看不见 —— 信息不该淡到读不出来。
* **顶栏过滤框**：`@HostListener('window:keydown')` 监听 `/` 聚焦，`Enter` 跳第一条命中，`Esc` 清空；
  分组名与链接文字都参与匹配，空组自动剔除。
* 分组口径走共用纯函数 `buildNavGroups(MENU_ITEMS, { order: MENU_GROUP_ORDER })`，
  与 Vue 子应用同一套实现（同名同行为），`filterNavGroups` 同样共用。

### "当前页"的多层信号

"当前页"靠多层信号叠加而非单一底色
（样式在 `src/styles.css`，全局样式对 `app-root` 里的元素同样生效）：

| 信号 | 实现 |
| --- | --- |
| 实心胶囊 | `.ng-tab.is-active`：品牌色渐变实底 + 白字 + `font-weight: 700` |
| 光晕 + 外圈 | `box-shadow: 0 3px 10px rgba(99,102,241,.45), 0 0 0 2px rgba(99,102,241,.16)` |
| 前置圆点 | `::before` 6×6 白色圆点（纯 CSS，不动模板结构） |
| 弹入动画 | `@keyframes ngTabPop`，点击后 0.28s 回弹 |
| 分组染色 | 命中分组加 `.is-current` → 浅靛底 + 组名加粗变色 |
| 当前页徽标 | `.ng-tabs__current`，文案取菜单注册表；不在菜单里的页面（`**` 兜底 404）退回 ActivatedRoute 最深一层的 `data.title` |

另外两处配套：

- `:active` 态 `scale(0.95)` —— 按下瞬间有物理反馈，区别于 hover。
- Angular 模板**不能**用 Vue 的 `<transition>`（要引 `@angular/animations`），所以换页反馈由
  「胶囊弹入 + 分组染色切换 + 当前页徽标换字」三处共同承担。

> 徽标刻意用**浅底彩字**而不是实色：实色徽标会和实心胶囊抢视觉重心，出现两个"当前页"反而更糊涂。

## 踩过的坑（别重犯）

1. **JIT 需要 `@angular/compiler`**：Vite 下走 JIT（不是 AOT），`main.ts` 必须 `import '@angular/compiler'`，
   否则 `The injectable 'PlatformNavigation' needs to be compiled using the JIT compiler` / 模板编译失败。
2. **模板文本里的裸 `@` 必须写成 `&#64;`**：`@for` / `@if` / `@switch` / `@empty` 是控制流关键字，
   说明文字里写「@angular/router」「@for 列表渲染」会被解析成控制流并报 `Incomplete block "for"`。
3. **`@for` 的集合若是 signal，必须显式调用**：`@for (p of officialPairs(); …)`。
   漏掉 `()` 会得到运行时报错 `TypeError: newCollection[Symbol.iterator] is not a function`
   （signal 是函数对象，本身不可迭代）。**注意 AOT 构建不校验这一点，只有运行时才炸。**
4. **模板表达式不能写 `new Set()`**：Angular 模板只支持表达式子集，`(click)="selected.set(new Set())"`
   会报 `Parser Error: Missing expected )`。这类"构造新对象"的动作要落在组件方法里（如 `clearSelection()`）。
5. **模板字符串（`template: \`…\``）内部不能出现反引号**，会把模板提前截断导致语法错误。
6. **未使用的 import 会被 `tsc --noEmit` 拦下**（`noUnusedLocals`），删干净。
7. **`routerLinkActiveOptions` 别用 `{ exact: true }` 简写**：该简写等价的匹配选项里
   `queryParams: 'exact'`，于是守卫改道到 `/login?redirect=/guarded` 之后，「登录」这一条反而**不高亮**
   （链接上没写 query，和当前 URL 的 query 不相等）。要显式写
   `{ paths: 'exact', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' }`。
8. **`hostProps = props` 会触发 TS2559**：`mount` 的形参类型 `QiankunProps` 是
   `{ container?: HTMLElement; [x: string]: any }`，全可选的 `HostProps` 是"弱类型"，
   两者没有共同具名属性 → `Type 'QiankunProps' has no properties in common with type 'HostProps'`。
   只挑需要的字段收编：`hostProps = { onRouteChange: props.onRouteChange }`。

## 校验命令

```bash
# 类型检查（Vite 的 esbuild 不做类型检查，必须单独跑 tsc）
env -u NODE_OPTIONS ../../node_modules/.bin/tsc -p tsconfig.app.json --noEmit

# 生产构建
env -u NODE_OPTIONS CODEBUDDY_SAFE_DELETE_ENABLED=0 npx vite build
```
