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

## 与主应用的接口

| 方向 | 接口 | 说明 |
| --- | --- | --- |
| 子 → 主 | `props.registerMenu(MENU_ITEMS)` | `mount` 时把菜单注册到主应用侧边栏 |
| 主 → 子 | `update({ path })` | 主应用菜单点击 → `router.navigateByUrl(path)` |
| 环境 | `qiankunWindow.__POWERED_BY_QIANKUN__` | 判定运行模式（决定导航条模式徽标） |

## 页内导航条（`app.component.ts` 的 `.ng-tabs`）——为什么做得这么"重"

被 qiankun 融合时，子应用的菜单注册在**宿主页之外**的侧边栏，子应用内部看不到任何路由入口，
所以这里常驻一条页内导航条。它同时要解决第二个问题：**"我点了菜单，到底跳没跳？"**

密集排布是先天劣势（14 条链接换行成 2 行），所以"当前页"靠多层信号叠加而非单一底色
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
