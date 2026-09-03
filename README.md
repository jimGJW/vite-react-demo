# Vite + React + Vue + Angular 三框架 Demo

![version](https://img.shields.io/badge/version-3.1.0-6366f1) ![status](https://img.shields.io/badge/v3.1%20React%2BVue%2BAngular%20三框架-brightgreen) ![node](https://img.shields.io/badge/node-%E2%89%A521-339933)

一个基于 **Vite 8 + React 19 + Vue 3 + Angular 22 + Ant Design 5 + Element Plus** 的前端能力演示项目。

**v3.1.0 核心亮点**：在 React 主框架中无缝集成 Vue 3 SFC 和 Angular 22 Standalone 页面，通过自研挂载桥（`mountVueBridge` + `mountAngularBridge`）实现三框架共存，并提供 6 个 Ant Design vs Element Plus 同功能对比案例，直观展示组件库的实现差异。

> 项目已启用 [React Compiler](https://react.dev/learn/react-compiler)，构建时自动优化组件渲染。

***

## 目录

* [版本演进](#版本演进)

* [快速开始](#快速开始)

* [技术栈](#技术栈)

* [React + Vue + Angular 三框架架构](#react--vue--angular-三框架架构)

* [页面与路由](#页面与路由)

* [组件对比中心](#组件对比中心)

* [核心能力](#核心能力)

* [项目结构](#项目结构)

* [npm 脚本](#npm-脚本)

* [独立 npm 包](#独立-npm-包)

* [Vite 自定义插件](#vite-自定义插件)

* [测试体系](#测试体系)

* [常见问题](#常见问题)

***

## 版本演进

| <br />     | v1.0.0     | v2.0.0     | v3.0.0                    | **v3.1.0（当前）**                                        |
| ---------- | ---------- | ---------- | ------------------------- | ----------------------------------------------------- |
| 布局         | 顶部导航栏      | 可折叠侧边栏     | 侧边栏 + 对比中心                | 侧边栏 + 「组件对比中心」分组（含 Angular）                           |
| 框架         | React 19   | React 19   | React 19 + Vue 3          | **React 19 + Vue 3 + Angular 22 三框架**                 |
| 组件库        | Ant Design | Ant Design | Ant Design + Element Plus | **Ant Design + Element Plus + Angular Standalone**    |
| 页面数        | 16         | 16         | 23                        | 24（含 6 个对比案例 + 3 个 Vue 页面 + 1 个 Angular 页面）           |
| 侧边栏菜单      | —          | 手风琴分组      | 分组 + 自定义分隔                | 分组 + 自定义分隔标题 + macOS 滚动条强制可见                          |
| Vue 页面     | —          | —          | 真 `.vue` SFC              | 真 `.vue` SFC（VueMenu / VueComponents / StyleShowcase） |
| Angular 页面 | —          | —          | —                         | **真** **`.ts`** **Standalone（AngularComponents）**     |
| npm 包      | 6 个        | 6 个        | 6 个                       | 6 个（同 v2）                                             |

### v3.1.0 变更明细

**1. React + Angular 22 三框架集成**

* Vite 配置增加 `@analogjs/vite-plugin-angular` 插件，一套构建管线同时编译 React、Vue 和 Angular

* 自研挂载桥 [mountAngularBridge.jsx](src/utils/mountAngularBridge.jsx)：在 React 组件树中挂载 Angular 22 Standalone Component，通过 `createApplication()` + `createComponent()` 实现，卸载时 `app.destroy()` + `componentRef.destroy()` 防止内存泄漏

* 挂载桥内置 loading / error 状态：Angular 异步初始化期间显示 spinner（"正在加载 Angular 组件…"），挂载失败显示错误详情，避免空白页

* 必须先 `import '@angular/compiler'`，否则 `PlatformLocation` 等 injectable 报 JIT compilation failed

* Angular 页面为真 `.ts` Standalone Component，使用 Signals + Computed + 依赖注入 + Pipes + ngModel 双向绑定

* tsconfig.json + tsconfig.app.json 配置 Angular 编译选项（`experimentalDecorators` + `strictTemplates`）

* Babel 插件排除 `node_modules` 和 `.ts` 文件，避免大文件（`@angular/compiler` >500KB）transform 超时

**2. 新增页面**

| 文件                                                                       | 说明                                                                                |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| [AngularComponents.ts](src/pages/AngularComponents/AngularComponents.ts) | Angular 22 组件库展示页（Signal 计数器 / ngModel 双向绑定 / \*ngFor 列表 / \*ngIf 条件 / 依赖注入 / 管道） |
| [mountAngularBridge.jsx](src/utils/mountAngularBridge.jsx)               | React→Angular 挂载桥 HOC（含 loading/error 状态）                                         |

**3. 侧边栏新增「Angular 组件库 (.ts)」菜单项**，位于「组件对比中心」分组

**4. 侧边栏滚动条可见性修复**

* macOS 默认不显示滚动条，侧边栏菜单展开后内容溢出但用户看不到滚动提示

* [Layout.scss](src/layouts/Layout.scss) 添加自定义滚动条样式（`scrollbar-width: thin` + `::-webkit-scrollbar` 6px），强制在 macOS 上可见

* 修正 Vue 模式下 `data-ui-mode` CSS 选择器：属性在 `<html>` 元素上而非 `.app-shell` 上，之前的选择器完全不生效，已统一改为 `[data-ui-mode="vue"]`

**5. 测试体系**

* `tests/test_pages.py` 新增 `/angular-components` 路由用例（23 → 24 全覆盖）

* `run_case()` 增加 per-case try/except，单个用例超时不再中断整条测试链

* 等待选择器超时从 10s → 15s，适配 lazy-loaded chunk 首次加载

### v3.0.0 变更明细

**1. React + Vue 3 双框架集成**

* Vite 配置同时加载 `@vitejs/plugin-react` + `@vitejs/plugin-vue`，一套构建管线编译两种 SFC

* 自研挂载桥 [mountVueBridge.jsx](src/utils/mountVueBridge.jsx)：在 React 组件树中挂载 Vue 3 SFC，注入 Element Plus（中文 locale + 全局图标注册），卸载时正确调用 `app.unmount()`

* Vue 页面均为真 `.vue` 单文件组件，非 JSX 包装

**2. 组件对比中心（6 个专题案例）**

每个案例双栏并排展示 Ant Design（React）与 Element Plus（Vue）的同功能实现，附原理对比表和代码片段：

| 案例           | 路由                      | 对比要点                              |
| ------------ | ----------------------- | --------------------------------- |
| 父子组件传值       | `/compare-parent-child` | props vs defineProps / 回调 vs emit |
| 双向绑定         | `/compare-two-way`      | useState+onChange vs v-model      |
| 跨层传值         | `/compare-provide`      | Context vs provide/inject         |
| 全局状态共享       | `/compare-state`        | Context vs reactive               |
| 插槽分发         | `/compare-slot`         | children vs slot                  |
| Ref / DOM 操作 | `/compare-ref`          | useRef vs ref / defineExpose      |

**3. 侧边栏优化**

* 「组件对比中心」分组用自定义分组分隔标题（胶囊标签）替换 Antd Menu 的 `{type:'divider'}`，消除空白感

* Antd 模式（灰蓝）和 Vue 模式（Element Plus 蓝）各有独立配色

* 折叠态自动隐藏分隔标题

**4. Vue 相关文件全部** **`.vue`** **化**

| 文件                                                             | 说明                                                   |
| -------------------------------------------------------------- | ---------------------------------------------------- |
| [VueMenu.vue](src/components/VueMenu/VueMenu.vue)              | Element Plus `ElMenu` 实现的侧边栏，支持图标映射、自定义分隔、路由激活       |
| [VueComponents.vue](src/pages/VueComponents/VueComponents.vue) | Element Plus 组件库展示页                                  |
| [StyleShowcase.vue](src/pages/StyleShowcase/StyleShowcase.vue) | 样式对比展示页                                              |
| [VueMenu/index.jsx](src/components/VueMenu/index.jsx)          | 薄挂载桥 wrapper（仅读取 React Router 状态 → 调 mountVueBridge） |

**5. 工程整理**

* `test-whisper.mjs` 移至 `scripts/` 目录

* `.gitignore` 增加 `.workbuddy/` 等 AI 工具临时文件

* `eslint.config.js` 忽略 `.vue` / `.ts` 文件（由各框架 SFC 编译器处理）

* `tests/test_pages.py` 补充 8 个新路由的 E2E 用例

***

## 快速开始

### 环境要求

* **Node.js ≥ 21**（Vite 8 的 rolldown 依赖 `node:util.styleText`，Node v20 会启动失败）

* 现代浏览器（需支持 WebAssembly / Web Speech API / MediaDevices，建议 Chrome 最新版）

```bash
# 使用 nvm 切换到 Node 21+
nvm use 24

# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 生产构建
npm run build

# 预览构建产物
npm run preview

# 代码检查
npm run lint

# E2E 测试（需先安装 Playwright）
pip install -r tests/requirements.txt
playwright install chromium
npm run test:e2e
```

### 默认登录账号

开发服务器启动后访问 `http://localhost:5173/login`，使用默认账号登录：

* 账号：`admin`

* 密码：`admin`

登录页可选择界面风格：**Ant Design** 或 **Vue 风格**（切换后侧边栏菜单分别用 Antd Menu 或 Element Plus ElMenu 渲染）。

***

## 技术栈

| 分类             | 依赖 / 方案                                                                           | 说明                                  |
| -------------- | --------------------------------------------------------------------------------- | ----------------------------------- |
| 构建工具           | `vite@^8`（rolldown）                                                               | 极速冷启动 + HMR                         |
| **React 框架**   | `react@^19` / `react-dom@^19`                                                     | 启用 React Compiler                   |
| **Vue 框架**     | `vue@^3.5` + `@vitejs/plugin-vue@^6`                                              | Vue 3 SFC，与 React 共存                |
| **Angular 框架** | `@angular/core@^22` + `@analogjs/vite-plugin-angular`                             | Angular 22 Standalone，Signals + zoneless |
| 编译增强           | `@vitejs/plugin-react` + `@rolldown/plugin-babel` + `babel-plugin-react-compiler` | 排除 `.ts` 和 `node_modules` 避免大文件超时        |
| 路由 & 守卫        | `react-router-dom@^7` + [AuthContext](src/contexts/AuthContext.jsx)               | BrowserRouter + localStorage 登录态持久化 |
| **React UI 库** | `antd@^5` + `@ant-design/icons` + `@ant-design/v5-patch-for-react-19`             | React 19 兼容补丁                       |
| **Vue UI 库**   | `element-plus@^2.14` + `@element-plus/icons-vue`                                  | Vue 3 组件库                           |
| 动态表单           | `antd-form-builder@^2.1.4`                                                        | JSON 驱动表单                           |
| 二维码            | `qr-scanner@^1.4.2`                                                               | 摄像头实时扫码 + 图片识别                      |
| 离线语音           | `@huggingface/transformers@^3.8.1` + `onnxruntime-web@^1.22.0`                    | 浏览器内 Whisper 语音识别                   |
| 图表             | `echarts@^6`                                                                      | ECharts 仪表盘                         |
| 主题 & 动画        | SCSS + CSS 变量（全部带 fallback）                                                       | Indigo 玻璃态风格                        |
| 测试             | Playwright（Python）                                                                | 自动启动 dev server、登录、逐页验证             |
| 工具库            | `lodash` / `prop-types`                                                           | <br />                              |
| Lint           | `eslint@^10` + React hooks/refresh 插件                                             | 忽略 `.vue` / `.ts`（由各框架编译器处理）        |

***

## React + Vue + Angular 三框架架构

### 架构概览

```
┌─────────────────────────────────────────────────────┐
│  React 19 主框架                                     │
│  ├── BrowserRouter + Layout（侧边栏 + 内容区）       │
│  ├── AuthContext 路由守卫                             │
│  ├── Ant Design 组件库（React 侧）                   │
│  ├── mountVueBridge 挂载桥 ──────┐                  │
│  │                                ▼                  │
│  │  ┌─────────────────────────────────────────┐    │
│  │  │  Vue 3 SFC（.vue 文件）                  │    │
│  │  │  ├── Element Plus 组件库（Vue 侧）      │    │
│  │  │  ├── VueMenu / VueComponents / Style    │    │
│  │  │  └── 6 个对比案例的 Vue demo-*.vue     │    │
│  │  └─────────────────────────────────────────┘    │
│  │                                                  │
│  └── mountAngularBridge 挂载桥 ───┐                 │
│                                    ▼                 │
│     ┌──────────────────────────────────────────┐    │
│     │  Angular 22 Standalone（.ts 文件）        │    │
│     │  ├── Signals + Computed 响应式           │    │
│     │  ├── Dependency Injection（inject()）    │    │
│     │  ├── ngModel 双向绑定 + Pipes 管道       │    │
│     │  └── AngularComponents.ts 组件展示页     │    │
│     └──────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Vue 挂载桥原理

[mountVueBridge.jsx](src/utils/mountVueBridge.jsx) 是 React 与 Vue 之间的桥梁：

```jsx
// React 侧：用 lazy + mountVueBridge 加载 .vue 文件
const VueComponents = lazy(() =>
  import('./pages/VueComponents/VueComponents.vue').then((mod) => ({
    default: mountVueBridge(mod.default),
  }))
)
```

```javascript
// 挂载桥内部：createApp(VueComponent, props) + use(ElementPlus) + mount(domRef)
// 卸载时调用 app.unmount() 正确销毁，避免内存泄漏
```

**支持三种输入**：

1. 已 resolve 的 Vue 组件对象（推荐，搭配 `import().then`）
2. 动态 import 函数（懒加载）
3. Promise 包装的组件

### Angular 挂载桥原理

[mountAngularBridge.jsx](src/utils/mountAngularBridge.jsx) 是 React 与 Angular 之间的桥梁：

```jsx
// React 侧：用 lazy + mountAngularBridge 加载 .ts Standalone Component
const AngularComponents = lazy(() =>
  import('./pages/AngularComponents/AngularComponents.ts').then((mod) => ({
    default: mountAngularBridge(mod.default),
  }))
)
```

```javascript
// 挂载桥内部：
// 1. import '@angular/compiler'（必须先加载，否则 JIT 报错）
// 2. createApplication({ providers: [] }) 创建 ApplicationRef
// 3. createComponent(AngularComponent, { environmentInjector, hostElement })
// 4. app.attachView(ref.hostView) 挂载视图
// 5. 卸载时 componentRef.destroy() + app.destroy() 防止内存泄漏
// 6. 内置 loading/error 状态：异步初始化期间显示 spinner，失败显示错误
```

**与 Vue 桥的关键差异**：

| 维度     | mountVueBridge            | mountAngularBridge                          |
| ------ | ------------------------- | ------------------------------------------- |
| 框架 API | `createApp()` + `mount()` | `createApplication()` + `createComponent()` |
| 组件格式   | `.vue` SFC                | `.ts` Standalone Component                  |
| 编译插件   | `@vitejs/plugin-vue`      | `@analogjs/vite-plugin-angular`             |
| 编译方式   | 运行时模板编译                   | AOT 模板编译（生成 `ɵɵdefineComponent`）            |
| 响应式    | `ref` / `reactive`        | `signal` / `computed`                       |
| 依赖注入   | Vue `provide`/`inject`    | Angular `inject()` + `@Injectable`          |
| 加载状态   | 无（同步挂载）                   | 有（`loading` + `error` useState）             |
| 卸载     | `app.unmount()`           | `componentRef.destroy()` + `app.destroy()`  |

### Vite 三框架配置

[vite.config.js](vite.config.js) 同时注册 React、Vue 和 Angular 插件：

```javascript
plugins: [
  vue(),      // Vue 3 SFC 编译
  angular(),  // Angular 22 Standalone AOT 编译
  react(),    // React Fast Refresh + SWC
  babel({
    presets: [reactCompilerPreset()],
    // 排除 .ts（由 Angular 插件处理）和 node_modules（已编译，避免大文件超时）
    exclude: [/\.ts$/, /node_modules/],
  }),
  embedHelpers(),    // iframe 嵌套探测
  serveOrtAssets(),  // ONNX wasm 静态服务
],
// 预构建 Angular 运行时依赖（被 mountAngularBridge 动态 import 引用）
optimizeDeps: {
  include: [
    '@angular/compiler', '@angular/platform-browser',
    '@angular/core', '@angular/common', '@angular/forms',
  ],
},
```

***

## 页面与路由

项目采用 [Layout](src/layouts/Layout.jsx) 布局 + 嵌套路由，所有受保护页面通过 [AuthContext](src/contexts/AuthContext.jsx) 做登录态校验。

### 基础页面

| 路由                 | 页面           | 入口文件                                                           | 功能说明                     |
| ------------------ | ------------ | -------------------------------------------------------------- | ------------------------ |
| `/login`           | 星际星空登录页      | [Login](src/pages/Login)                                       | 玻璃态表单 + 星空粒子 + 飞船跃迁动画    |
| `/`                | 首页·周天星辰大阵    | [Home](src/pages/Home) + [StarArray](src/components/StarArray) | 365 颗星辰五重同心环互锁防御         |
| `/about`           | 关于页          | [About](src/pages/About)                                       | 项目技术栈说明                  |
| `/dashboard`       | 控制台          | [Dashboard](src/pages/Dashboard)                               | 模拟异步加载统计卡片               |
| `/scan`            | 二维码扫码        | [ScanDemo](src/pages/ScanDemo)                                 | 摄像头实时扫码 + 图片识别           |
| `/embed`           | iframe 嵌套预览  | [Embed](src/pages/Embed)                                       | 探测目标站点是否允许内嵌             |
| `/agent`           | AI Agent 控制台 | [Agent](src/pages/Agent)                                       | 自然语言驱动 DOM 操作            |
| `/voice`           | 语音助手         | [VoiceAssistant](src/pages/VoiceAssistant)                     | Web Speech + Whisper 双引擎 |
| `/form-builder`    | 配置表单         | [FormBuilderDemo](src/pages/FormBuilderDemo)                   | JSON 驱动动态表单              |
| `/theme`           | 主题切换         | [ThemeDemo](src/pages/ThemeDemo)                               | CSS 变量多主题实时预览            |
| `/charts`          | SVG 图表组件库    | [ChartsDemo](src/pages/ChartsDemo)                             | 12 种纯 SVG 零依赖图表          |
| `/echarts`         | ECharts 仪表盘  | [EChartsDemo](src/pages/EChartsDemo)                           | ECharts 集成演示             |
| `/command-palette` | 命令面板         | [CommandPaletteDemo](src/pages/CommandPaletteDemo)             | ⌘K 全局快捷键面板               |
| `/notify`          | 通知中心         | [NotifyDemo](src/pages/NotifyDemo)                             | Toast / 消息推送 / 全局通知      |
| `/data-table`      | 高级表格         | [DataTableDemo](src/pages/DataTableDemo)                       | 筛选、排序、分页、固定列             |
| `/test-center`     | 测试中心         | [TestCenterDemo](src/pages/TestCenterDemo)                     | 前端测试用例管理                 |
| `/404`             | 未命中兜底        | [NotFound](src/pages/NotFound)                                 | <br />                   |

### 组件对比中心

| 路由                      | 页面                | 入口文件                                                                     | 说明                              |
| ----------------------- | ----------------- | ------------------------------------------------------------------------ | ------------------------------- |
| `/antd`                 | Ant Design 组件库    | [AntdDemo](src/pages/AntdDemo)                                           | React 侧组件展示                     |
| `/vue-components`       | Vue 组件库 (.vue)    | [VueComponents.vue](src/pages/VueComponents/VueComponents.vue)           | Vue 3 SFC + Element Plus        |
| `/angular-components`   | Angular 组件库 (.ts) | [AngularComponents.ts](src/pages/AngularComponents/AngularComponents.ts) | Angular 22 Standalone + Signals |
| `/style-showcase`       | 样式总对比             | [StyleShowcase.vue](src/pages/StyleShowcase/StyleShowcase.vue)           | Vue 3 SFC 样式展示                  |
| `/compare-parent-child` | 父子组件传值            | [Compare/ParentChild](src/pages/Compare/ParentChild)                     | props vs defineProps            |
| `/compare-two-way`      | 双向绑定              | [Compare/TwoWay](src/pages/Compare/TwoWay)                               | useState vs v-model             |
| `/compare-provide`      | 跨层传值              | [Compare/Provide](src/pages/Compare/Provide)                             | Context vs provide/inject       |
| `/compare-state`        | 全局状态共享            | [Compare/State](src/pages/Compare/State)                                 | Context vs reactive             |
| `/compare-slot`         | 插槽 / Children 分发  | [Compare/Slot](src/pages/Compare/Slot)                                   | children vs slot                |
| `/compare-ref`          | Ref / DOM 操作      | [Compare/Ref](src/pages/Compare/Ref)                                     | useRef vs ref                   |

***

## 组件对比中心

### 设计理念

每个对比案例使用统一的 [CompareLayout](src/utils/CompareLayout.jsx) 双栏容器：

```
┌─────────────────────────────────────────────────┐
│  案例标题 + 一句话描述 + 标签                      │
├──────────────────────┬──────────────────────────┤
│  A React · Ant Design│  V Vue 3 · Element Plus   │
│  （React 组件演示）   │  （Vue SFC 演示）          │
├──────────────────────┴──────────────────────────┤
│  原理对比表（对比点 | React 方案 | Vue 方案）      │
├──────────────────────────────────────────────────┤
│  核心代码片段（React 代码 | Vue 代码）             │
└──────────────────────────────────────────────────┘
```

### 6 个对比案例

#### 1. 父子组件传值 (`/compare-parent-child`)

* **React**：`props` 单向数据流 + 回调函数 `onAdd` 子→父传值

* **Vue**：`defineProps` + `defineEmits`，模板 `@add` 监听

* 示例：Todo List 待办列表（添加 / 删除）

#### 2. 双向绑定 (`/compare-two-way`)

* **React**：`useState` + `onChange` 手动同步（受控组件）

* **Vue**：`v-model` 语法糖 = `:value` + `@input`，自定义组件用 `v-model:xxx`

* 示例：计数器 + 表单输入

#### 3. 跨层传值 (`/compare-provide`)

* **React**：`createContext` + `useContext`，Provider 包裹消费者

* **Vue**：`provide` / `inject`，祖先组件 provide 后代任意层级 inject

* 示例：主题色跨 3 层组件传递

#### 4. 全局状态共享 (`/compare-state`)

* **React**：`Context` + `useReducer` 状态提升

* **Vue**：`reactive` / `ref` 响应式对象，或 Pinia store

* 示例：购物车（添加商品 / 数量增减 / 总价计算）

#### 5. 插槽 / Children 分发 (`/compare-slot`)

* **React**：`props.children` + render props 模式

* **Vue**：`<slot>` 默认插槽 / `<slot name="x">` 命名插槽 / `v-slot:default="{ item }"` 作用域插槽

* 示例：卡片容器（默认插槽）+ 页面布局（命名插槽）+ 数据列表（作用域插槽）

#### 6. Ref / DOM 操作 (`/compare-ref`)

* **React**：`useRef` 挂载到 DOM 元素，`ref.current` 访问

* **Vue**：`ref` 绑定 + `defineExpose` 暴露子组件方法，`template ref` 访问

* 示例：视频播放器（播放 / 暂停 / 进度控制 / 全屏）

***

## 核心能力

### 1. 登录与路由守卫

* [AuthContext](src/contexts/AuthContext.jsx)：React Context + localStorage 持久化，`useAuth()` 提供 `login / logout / user / isAuthenticated`

* [App.jsx](src/App.jsx)：`<RequireAuth>` 包裹受保护路由，未登录重定向 `/login`

* [Login](src/pages/Login)：星际玻璃态登录卡片 + 星空粒子 + 飞船跃迁动画

### 2. 365 周天星辰大阵（首页）

* [StarArray.jsx](src/components/StarArray/StarArray.jsx) + [StarArray.scss](src/components/StarArray/StarArray.scss)

* **365 颗真实星辰**：每颗对应实际恒星名，点击弹详情面板

* **五重同心环互锁防御**：5 层圆环反向交错旋转 + 扫描光带

* **环内流动动画** + **径向跨环脉动**

### 3. SVG 图表组件库（12 个可共用组件）

零外部依赖，纯 React + 原生 SVG，所有 `var()` 带 fallback，复制到其他项目可直接使用。

| 类型   | 组件                                             | 说明                                 |
| ---- | ---------------------------------------------- | ---------------------------------- |
| 通用容器 | [shared.jsx](src/components/Charts/shared.jsx) | ChartCard / Tooltip / LegendList 等 |
| 基础图表 | Line / Bar / Pie / Gauge / Radar               | 折线 / 柱状 / 饼图 / 仪表盘 / 雷达            |
| 多维图表 | MultiLine / MultiBar / StackedBar / MultiPie   | 多系列折线 / 分组柱状 / 堆叠柱状 / 多组饼图         |
| 钻取图表 | DrilledBar / NestedPie                         | 二级柱状钻取 / 二级饼图钻取                    |
| 切换图表 | SwitchableChart                                | 一键切换图表类型                           |

**统一出口**：[Charts/index.js](src/components/Charts/index.js)

### 4. 五大主流功能页面

* **命令面板**（`/command-palette`）：⌘K / Ctrl+K 全局搜索式命令面板

* **主题切换**（`/theme`）：CSS 变量多主题实时预览

* **通知中心**（`/notify`）：Toast / 分类通知 / 未读数量

* **高级表格**（`/data-table`）：筛选、排序、分页、固定列、行选择

* **图表演示**（`/charts`）：12 种图表集中演示 + loading 骨架态

### 5. 其他原生化能力

* **语音助手**：在线 Web Speech API + 离线 Whisper 双引擎

* **二维码扫码**：摄像头实时 + 图片上传

* **iframe 嵌套预览**：dev server `/__frame-check` 探测 X-Frame-Options / CSP

* **AI Agent**：自然语言操控页面 DOM（NLP 规则 + DOM 执行层）

* **JSON 驱动表单**：`antd-form-builder` 配置化表单

***

## 项目结构

```
vite-react-demo/
├── scripts/
│   └── test-whisper.mjs              # Whisper 语音识别链路验证脚本
├── packages/@myorg/                  # 12 个可发布的独立 npm 包（6 React + 6 Vue，一一对应）
│   ├── react-styles-reset/           # ① 设计 token + 全局 reset（零依赖）
│   ├── react-core-hooks/             # ② AuthProvider / useWebQrScanner / useWhisperRecorder
│   ├── react-ui-basic/               # ③ Theme / Notification / CommandPalette / DataTable / StarArray
│   ├── react-media-tools/            # ④ QrScanBtn / VoiceInput
│   ├── react-admin-shell/            # ⑤ AdminLayout / GlobalAgent / TestCenter
│   ├── react-svg-charts/             # ⑥ 12 个纯 SVG 零依赖图表
│   ├── vue-styles-reset/             # ①' 设计 token + 全局 reset（Vue 版，零依赖）
│   ├── vue-core-composables/         # ②' createAuth / useAuth / useWhisperRecorder / openQrScanner
│   ├── vue-ui-basic/                 # ③' Theme / Notification / CommandPalette / DataTable / StarArray
│   ├── vue-media-tools/              # ④' QrScanBtn / VoiceInput（在线/离线双引擎）
│   ├── vue-admin-shell/              # ⑤' AdminLayout / GlobalAgent / TestCenter / UniversalPageAgent
│   └── vue-svg-charts/               # ⑥' 12 个纯 SVG 零依赖图表（Vue 版）
├── public/
│   ├── models/Xenova/whisper-tiny/   # Whisper ONNX 模型
│   └── ort/                          # onnxruntime-web wasm 运行时
├── src/
│   ├── components/
│   │   ├── Charts/                   # 12 个 SVG 图表 + shared 共享层
│   │   ├── VueMenu/
│   │   │   ├── VueMenu.vue           # ★ Vue 3 SFC 侧边栏（Element Plus ElMenu）
│   │   │   └── index.jsx             # 薄挂载桥 wrapper（读取 React Router）
│   │   ├── StarArray/                # 365 周天星辰大阵
│   │   ├── GlobalAgent/              # 全局浮动 Agent
│   │   ├── VoiceInput/               # 语音输入（在线/离线双引擎）
│   │   └── ...                       # CommandPalette / DataTable / Notification 等
│   ├── contexts/
│   │   ├── AuthContext.jsx           # 登录状态 + 路由守卫
│   │   └── StyleModeContext.jsx      # antd | vue 样式模式切换
│   ├── hooks/                        # useWebQrScanner / useWhisperRecorder
│   ├── layouts/
│   │   ├── Layout.jsx                # 可折叠侧边栏 + Header + 24 路由菜单
│   │   └── Layout.scss              # 三态侧边栏 + 自定义分组分隔 + macOS 滚动条
│   ├── pages/
│   │   ├── Compare/                  # ★ 6 个对比案例（每个含 index.jsx + *.vue demo）
│   │   │   ├── ParentChild/          # 父子组件传值
│   │   │   ├── TwoWay/              # 双向绑定
│   │   │   ├── Provide/             # 跨层传值
│   │   │   ├── State/               # 全局状态共享
│   │   │   ├── Slot/                # 插槽分发
│   │   │   └── Ref/                 # Ref/DOM 操作
│   │   ├── VueComponents/
│   │   │   └── VueComponents.vue     # ★ Vue 3 SFC 组件展示页
│   │   ├── StyleShowcase/
│   │   │   └── StyleShowcase.vue     # ★ Vue 3 SFC 样式对比页
│   │   ├── AngularComponents/
│   │   │   └── AngularComponents.ts  # ★ Angular 22 Standalone 组件展示页
│   │   └── ...                       # Home / Login / AntdDemo / Charts 等
│   ├── utils/
│   │   ├── mountVueBridge.jsx        # ★ React→Vue 挂载桥 HOC
│   │   ├── mountAngularBridge.jsx    # ★ React→Angular 挂载桥 HOC（含 loading/error）
│   │   ├── CompareLayout.jsx         # 双栏对比页容器
│   │   └── CompareLayout.scss
│   ├── App.jsx                       # 路由表 + RequireAuth 守卫
│   ├── main.jsx                      # 入口：BrowserRouter + AntD React19 补丁
│   └── index.scss / App.scss
├── tests/
│   ├── test_pages.py                 # Playwright E2E（24 路由覆盖）
│   └── requirements.txt
├── vite.config.js                    # React + Vue + Angular 三插件 + 自定义中间件
├── tsconfig.json / tsconfig.app.json  # Angular 编译配置
├── eslint.config.js                  # 忽略 .vue / .ts / dist 产物
└── package.json                     # v3.1.0 · workspaces + 6 包构建脚本
```

***

## npm 脚本

| 命令                         | 说明                                 |
| -------------------------- | ---------------------------------- |
| `npm run dev`              | 启动 Vite 开发服务器（默认 :5173）            |
| `npm run build`            | 生产构建（产物到 `dist/`）                  |
| `npm run preview`          | 预览生产构建                             |
| `npm run lint`             | ESLint 代码检查                        |
| `npm run test:e2e`         | Playwright E2E 测试（自动启动 dev server） |
| `npm run test:whisper`     | Whisper 语音识别链路验证                   |
| `npm run pkg:all:build`    | 一键构建全部 12 个独立 npm 包（6 React + 6 Vue）       |
| `npm run pkg:charts:build` | 单独构建 react-svg-charts 包            |
| `npm run pkg:styles:build` | 单独构建 react-styles-reset 包          |
| `npm run pkg:core:build`   | 单独构建 react-core-hooks 包            |
| `npm run pkg:ui:build`     | 单独构建 react-ui-basic 包              |
| `npm run pkg:media:build`  | 单独构建 react-media-tools 包           |
| `npm run pkg:shell:build`  | 单独构建 react-admin-shell 包           |
| `npm run pkg:vue-styles:build` | 单独构建 vue-styles-reset 包        |
| `npm run pkg:vue-core:build`   | 单独构建 vue-core-composables 包      |
| `npm run pkg:vue-ui:build`     | 单独构建 vue-ui-basic 包              |
| `npm run pkg:vue-media:build`  | 单独构建 vue-media-tools 包           |
| `npm run pkg:vue-charts:build` | 单独构建 vue-svg-charts 包           |
| `npm run pkg:vue-shell:build`  | 单独构建 vue-admin-shell 包           |

***

## 独立 npm 包

本项目将可复用组件拆成 6 个独立 npm 包，打包格式统一：**ESM + CJS 双产物 +** **`style.css`** **+** **`index.d.ts`**，所有 peerDependencies 严格 external。

| 包名                          | dist 大小 | 主要内容                                                          |
| --------------------------- | ------- | ------------------------------------------------------------- |
| `@myorg/react-styles-reset` | 24 KB   | 设计 token + 全局 reset（零依赖）                                      |
| `@myorg/react-core-hooks`   | 1.3 MB  | AuthProvider / useWebQrScanner / useWhisperRecorder           |
| `@myorg/react-ui-basic`     | 164 KB  | Theme / Notification / CommandPalette / DataTable / StarArray |
| `@myorg/react-media-tools`  | 44 KB   | QrScanBtn / VoiceInput                                        |
| `@myorg/react-admin-shell`  | 172 KB  | AdminLayout / GlobalAgent / TestCenter                        |
| `@myorg/react-svg-charts`   | 180 KB  | 12 个纯 SVG 零依赖图表                                               |

> 以上 6 个为 **React** 包。另有 **6 个一一对应的 Vue 3 包**（API 语义对齐，实现为 `<script setup>` SFC + composables），可在纯 Vue 项目中直接 `import`：

| 包名                            | 主要内容（Vue 版）                                                    |
| ----------------------------- | ----------------------------------------------------------------- |
| `@myorg/vue-styles-reset`     | 设计 token + 全局 reset（零依赖）                                        |
| `@myorg/vue-core-composables` | createAuth / useAuth / useWhisperRecorder / openQrScanner / AuthProvider |
| `@myorg/vue-ui-basic`         | Theme / Notification / CommandPalette / DataTable / StarArray       |
| `@myorg/vue-media-tools`      | QrScanBtn / VoiceInput（在线 Web Speech + 离线 Whisper 双引擎）            |
| `@myorg/vue-admin-shell`      | AdminLayout / GlobalAgent / TestCenter / UniversalPageAgent         |
| `@myorg/vue-svg-charts`       | 12 个纯 SVG 零依赖图表（Vue 版）                                        |

### 在其他 React 项目中使用（gitpkg 一键安装）

```bash
npm install react react-dom
for PKG in react-styles-reset react-core-hooks react-ui-basic react-media-tools react-admin-shell react-svg-charts; do
  npm install @myorg/$PKG@"https://gitpkg.vercel.app/jimGJW/vite-react-demo/packages/@myorg/$PKG?main"
done
```

```js
// main.jsx：按顺序引入样式
import '@myorg/react-styles-reset/style.css'
import '@myorg/react-ui-basic/style.css'
import '@myorg/react-svg-charts/style.css'

// 业务组件
import { ThemeProvider, StarArray, DataTable } from '@myorg/react-ui-basic'
import { LineChart, BarChart, SwitchableChart } from '@myorg/react-svg-charts'
```

### 在其他 Vue 3 项目中使用

每个 React 包都有一一对应的 Vue 3 包，API 语义对齐、实现换成 `<script setup>` SFC + composables。核心能力（Auth / 离线语音 / 扫码 / AI Agent）均可在 Vue 项目中直接引入。

```bash
npm install vue vue-router
for PKG in vue-styles-reset vue-core-composables vue-ui-basic vue-media-tools vue-admin-shell vue-svg-charts; do
  npm install @myorg/$PKG@"https://gitpkg.vercel.app/jimGJW/vite-react-demo/packages/@myorg/$PKG?main"
done
```

```js
// main.js：按顺序引入样式（设计 token 需最先引入）
import '@myorg/vue-styles-reset/style.css'
import '@myorg/vue-ui-basic/style.css'
import '@myorg/vue-svg-charts/style.css'
```

```vue
<!-- App.vue：后台外壳 + AI Agent 气泡 + 测试中心 -->
<script setup>
import { AdminLayout, GlobalAgent, TestCenter, UniversalPageAgent } from '@myorg/vue-admin-shell'
import { QrScanBtn, VoiceInput } from '@myorg/vue-media-tools'
import { StarArray } from '@myorg/vue-ui-basic'
</script>

<template>
  <AdminLayout>
    <!-- 业务路由出口（AdminLayout 内部已含 <RouterView/>） -->
  </AdminLayout>

  <!-- 全局浮动 AI 气泡（Ctrl+Shift+A 呼出），内部挂载 UniversalPageAgent -->
  <GlobalAgent />

  <!-- 测试中心：传入用例数组即可批量运行 -->
  <TestCenter :cases="testCases" python-script="..." run-command="pytest" />
</template>
```

```vue
<!-- 扫码 + 语音输入：双引擎（在线 Web Speech / 离线 Whisper） -->
<template>
  <QrScanBtn @scan-success="onScan" />
  <VoiceInput v-model="text" engine="auto" @commit="onChunk" />
</template>
```

> **注意**：`vue-admin-shell` 的 `AdminLayout` / `GlobalAgent` 依赖 `vue-router`（`useRoute` / `useRouter`）与 `@myorg/vue-core-composables` 的 `useAuth`；`UniversalPageAgent` 的离线语音依赖 `@huggingface/transformers` + `onnxruntime-web`（均为可选 peerDependency）。设计 token（`--c-*` / `--glass-*` 等 CSS 变量）来自 `@myorg/vue-styles-reset`，需先行引入。

***

## Vite 自定义插件

[vite.config.js](vite.config.js) 注册了两个自定义插件：

1. **`serveOrtAssets`** — dev 环境直接返回 `public/ort/` 下的 onnxruntime wasm 文件（transformers.js 动态 import 需要）。生产构建时 `public/` 原样复制到 `dist/`，无需此插件。

2. **`embedHelpers`** — 提供 `GET /__frame-check?url=<encoded>` 接口，探测目标站点是否允许 iframe 嵌入（检查 HTTP 状态码 + X-Frame-Options + CSP frame-ancestors），模拟真实 iframe 的 Referer 场景。

***

## 测试体系

### 前端即时测试（`/test-center`）

[TestCenterDemo](src/pages/TestCenterDemo) 内置三类用例：数据完整性校、组件可导入验证（`import()` 动态导入）、路由配置完整性检查。页面内点击「一键运行」即时展示结果。

### Python E2E 自动化测试

[tests/test\_pages.py](tests/test_pages.py) 使用 Playwright 自动化：

```bash
pip install -r tests/requirements.txt
playwright install chromium
npm run test:e2e           # 自动启动 dev server 并跑全部用例
# 或指定已运行 server：BASE_URL=http://localhost:5173 npm run test:e2e
```

* 自动 UI 登录（admin/admin）

* 逐页访问 **24 个路由**并验证关键文本 / DOM 元素

* 代表性交互验证：首页计数器、星辰点击弹详情、命令面板 ⌘K、通知 Toast、测试套件全过

* 输出通过/失败报告，非零退出码便于接 CI

***

## 常见问题

**Q:** **`npm run dev`** **/** **`npm run build`** **报** **`node:util styleText`？**
A: Vite 8 的 rolldown 需要 Node ≥ 21。执行 `nvm use 24` 或安装 Node 21+。

**Q: Vue 页面是怎么在 React 里跑起来的？**
A: 通过 [mountVueBridge.jsx](src/utils/mountVueBridge.jsx) 挂载桥——`createApp(VueComponent, props).use(ElementPlus).mount(domRef)`，在 React 的 `useEffect` 里挂载、`unmount` 时销毁。Vue 页面是真 `.vue` SFC，由 `@vitejs/plugin-vue` 编译。

**Q: Angular 页面是怎么在 React 里跑起来的？**
A: 通过 [mountAngularBridge.jsx](src/utils/mountAngularBridge.jsx) 挂载桥——`createApplication({ providers: [] })` 创建 Angular ApplicationRef，再用 `createComponent(AngularComponent, { environmentInjector, hostElement })` 挂载到 React 提供的 DOM 容器。卸载时 `componentRef.destroy()` + `app.destroy()`。挂载桥内置 loading/error 状态，异步初始化期间显示 spinner，避免空白页。Angular 页面是真 `.ts` Standalone Component，由 `@analogjs/vite-plugin-angular` 做 AOT 编译（生成 `ɵɵdefineComponent` + 模板渲染函数）。

**Q: 为什么 mountAngularBridge 里要先** **`import '@angular/compiler'`**？
A: `createApplication()` 内部会注入 `PlatformLocation` 等 Angular injectable。如果 `@angular/compiler` 未加载，这些 injectable 会在运行时报 `JIT compilation failed`。必须在 `@angular/platform-browser` 之前导入 compiler 模块。

**Q: 为什么 Babel 要排除** **`node_modules`**？
A: `@angular/compiler` 预构建后 >500KB，Babel React Compiler transform 处理大文件会超时，导致 dev server 返回空响应（`ERR_EMPTY_RESPONSE`）。排除 `node_modules` 后只 transform 项目源码，预构建依赖直接由 Vite optimizer 处理。

**Q: Angular 页面首次加载显示空白/加载动画？**
A: 正常现象。Angular 组件挂载是异步的（`createApplication()` 需初始化 Angular 框架），期间挂载桥会显示 spinner + "正在加载 Angular 组件…"。首次访问还需 Vite 编译 `.ts` 文件，可能需 2-3 秒，后续访问有缓存会很快。

**Q: 侧边栏菜单展开后看不到滚动条？**
A: macOS 系统默认"自动基于鼠标或触控板显示滚动条"，不操作时滚动条不可见。[Layout.scss](src/layouts/Layout.scss) 已添加 `scrollbar-width: thin` + `::-webkit-scrollbar` 样式强制显示 6px 宽滚动条。

**Q: 侧边栏的「专题对比案例」分隔标签是怎么做的？**
A: 在 [Layout.jsx](src/layouts/Layout.jsx) 的 navItems 中用一个 disabled 的菜单项 + 自定义 `label`（`<span className="sep-title">`），样式在 [Layout.scss](src/layouts/Layout.scss) 中。Vue 模式下 [VueMenu.vue](src/components/VueMenu/VueMenu.vue) 同样渲染这个分隔标签（`__sep-` 前缀的 key 识别为分隔项）。

**Q: 摄像头/麦克风无法启动？**
A: 确认通过 `localhost` 或 HTTPS 访问，并已授权。

**Q: 离线语音首次加载慢？**
A: Whisper 模型需首次下载并缓存，后续识别在浏览器本地完成。

**Q: 图表组件跨项目使用时样式丢失？**
A: 需在入口 `import '@myorg/react-svg-charts/style.css'`（只需一次）。所有 `var()` 带 fallback，无需定义 CSS 变量。

**Q: 6 个 npm 包和** **`src/components`** **有同名文件是重复吗？**
A: 是。为方便独立发布，packages 目录必须自包含；主项目运行依赖 `src/components/*`，不影响 dev/build。

**Q:** **`packages/@myorg/react-svg-charts`** **与** **`src/components/Charts`** **如何同步？**
A: 主项目运行用 `src/components/Charts`（vite alias 也指向这里）。发布包 src 是复制副本，改动后需 `cp` 再 `npm run pkg:charts:build`。

***

## 版本历史

* **v3.1.0**（2026-08-31）：React + Angular 22 三框架集成，Angular Standalone `.ts` 页面，mountAngularBridge 挂载桥（含 loading/error 状态），侧边栏 macOS 滚动条可见性修复，Vue 模式 `data-ui-mode` CSS 选择器修正

* **v3.0.0**（2026-08-31）：React + Vue 3 双框架集成，6 个对比案例，Vue 文件全部 `.vue` SFC 化，侧边栏分隔优化

* **v2.0.0**（2026-08-30）：可折叠侧边栏布局，工程化修复（eslint 配置、路径修正）

* **v1.0.0**（2026-08-28）：初始版本，16 路由页面，6 个可发布 npm 包，Playwright E2E



<!-- 安全检查门禁集成测试：提交此 PR 用于验证 code-safety-checker workflow 自动触发 -->
## 安全门禁说明

本仓库已接入 [code-safety-checker](https://github.com/jimGJW/code-safety-checker)：

- PR 打开/更新时自动执行全量安全检查
- 检查报告以机器人评论方式展示在 PR 中
- 未通过的 PR 无法合并（分支保护已启用 status check 阻塞）

### 覆盖维度

| 维度 | 说明 |
|------|------|
| 🔑 敏感信息 | gitleaks 全历史 commit 扫描 + 内置正则兜底 |
| 📦 依赖漏洞 | npm audit |
| 🎨 前端安全 | XSS / eval / dangerouslySetInnerHTML 等 |
| 📜 许可证合规 | npm 依赖许可证白名单校验 |

### 跳过方式

给 PR 打标签 **skip-safety-check** 即可临时跳过（仅跑 diff 快速扫描）。

