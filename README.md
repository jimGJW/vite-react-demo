# Vite + React Demo

一个基于 **Vite 8 + React 19 + React Router 7 + Ant Design 5** 的前端能力演示项目，集中展示了：
星际星空登录 + 365 周天星辰大阵首页、10 个零依赖 SVG 共用图表组件、5 大主流功能页面（命令面板 / 图表演示 / 主题切换 / 通知中心 / 高级表格）、语音识别、二维码扫描、iframe 嵌套预览、JSON 驱动表单、AI Agent 自然语言操控页面，以及前后端一体化的测试体系。

> 项目已启用 [React Compiler](https://react.dev/learn/react-compiler)，构建时会自动优化组件渲染。

---

## 技术栈

| 分类 | 依赖 / 方案 | 说明 |
| --- | --- | --- |
| 构建工具 | `vite@^8`（rolldown） | 极速冷启动 + HMR |
| 框架 | `react@^19` / `react-dom@^19` | 启用 React Compiler |
| 编译增强 | `@vitejs/plugin-react` + `@rolldown/plugin-babel` + `babel-plugin-react-compiler` | |
| 路由 & 守卫 | `react-router-dom@^7` + [AuthContext](src/contexts/AuthContext.jsx) | BrowserRouter + localStorage 登录态持久化 |
| UI 组件库 | `antd@^5` + `@ant-design/icons` + `@ant-design/v5-patch-for-react-19` | React 19 兼容补丁 |
| 动态表单 | `antd-form-builder@^2.1.4` | JSON 驱动表单 |
| 二维码 | `qr-scanner@^1.4.2` | 摄像头实时扫码 + 图片识别 |
| 离线语音 | `@huggingface/transformers@^3.8.1` + `onnxruntime-web@^1.22.0` | 浏览器内 Whisper 语音识别 |
| **主题 & 动画** | SCSS + CSS 变量（全部带 fallback） | Indigo 玻璃态风格，所有 `var()` 带默认值，可移植到其他项目 |
| **测试** | Playwright（Python）+ 前端自定义用例 | 自动启动 dev server、登录、逐页渲染与交互验证 |
| 工具库 | `lodash` / `prop-types` | |
| 样式 | `sass` | |
| Lint | `eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` | |

---

## 快速开始

### 环境要求

- **Node.js ≥ 21**（Vite 8 的 rolldown 依赖 `node:util.styleText`，Node v20 会启动失败；项目内 `.nvm` 已安装 v24.7.0）
- 现代浏览器（需支持 WebAssembly / Web Speech API / MediaDevices，建议 Chrome 最新版）

```bash
# 推荐使用 nvm 切换到 Node 21+
nvm use 24
```

### 安装与运行

```bash
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
```

### 摄像头 / 麦克风权限

扫码、语音相关页面需要浏览器授权摄像头与麦克风权限。本地开发时请通过 `localhost` 或 HTTPS 访问。

---

## 页面与路由

项目采用 [Layout](src/layouts/Layout.jsx) 布局 + 嵌套路由，所有受保护页面通过 [AuthContext](src/contexts/AuthContext.jsx) 做登录态校验与重定向；未登录会自动跳转 `/login`。

| 路由 | 页面 | 入口文件 | 功能说明 |
| --- | --- | --- | --- |
| `/login` | 星际星空登录页 | [Login/index.jsx](src/pages/Login/index.jsx) | 玻璃态表单 + 星空粒子动画 + 飞船跃迁特效；默认账号 `admin / admin` |
| `/` | 首页·周天星辰大阵 | [Home/index.jsx](src/pages/Home/index.jsx) + [StarArray](src/components/StarArray) | 365 颗星辰组成五重同心环互锁防御规则：各环反向交错旋转、环内流动动画 + 径向跨环脉动、每颗星可点击查看详情 |
| `/about` | 关于页 | [About](src/pages/About) | 项目技术栈与说明 |
| `/dashboard` | 控制台 | [Dashboard](src/pages/Dashboard) | 模拟异步加载统计卡片 |
| `/scan` | 二维码扫码 | [ScanDemo](src/pages/ScanDemo) | 摄像头实时扫码 + 图片上传识别 |
| `/embed` | iframe 嵌套预览 | [Embed](src/pages/Embed) | 自动探测目标站点是否允许被内嵌 |
| `/agent` | AI Agent 控制台 | [Agent](src/pages/Agent) | 自然语言驱动页面 DOM 操作 |
| `/voice` | 语音助手 | [VoiceAssistant](src/pages/VoiceAssistant) | 在线 Web Speech API + 离线 Whisper 双引擎 |
| `/form-builder` | 配置表单 | [FormBuilderDemo](src/pages/FormBuilderDemo) | JSON 驱动动态表单 |
| `/theme` | 主题切换 | [ThemeDemo](src/pages/ThemeDemo) | 实时切换 CSS 变量，预览玻璃态 / 配色变化 |
| `/charts` | SVG 图表组件库 | [ChartsDemo](src/pages/ChartsDemo) | 10 种纯 SVG 零依赖图表演示（含多维/二级） |
| `/command-palette` | 命令面板 | [CommandPaletteDemo](src/pages/CommandPaletteDemo) | ⌘K / Ctrl+K 唤起的全局快捷键命令面板 |
| `/notify` | 通知中心 | [NotifyDemo](src/pages/NotifyDemo) | Toast / 消息推送 / 全局通知中心 |
| `/data-table` | 高级表格 | [DataTableDemo](src/pages/DataTableDemo) | 筛选、排序、分页、固定列、行选择 |
| `/test-center` | 测试中心 | [TestCenterDemo](src/pages/TestCenterDemo) | 前端测试用例管理、即时运行并展示结果 |
| `/404` | 未命中兜底 | [NotFound](src/pages/NotFound) | |

未匹配的路径会自动重定向到 `/404`。

---

## 核心能力说明

### 1. 登录与路由守卫

- [AuthContext.jsx](src/contexts/AuthContext.jsx)：基于 React Context + localStorage 持久化的登录状态管理；`useAuth()` hook 提供 `login / logout / user / isAuthenticated`。
- [App.jsx](src/App.jsx)：路由层用 `<RequireAuth>` 包裹受保护路由，未登录自动重定向 `/login`；登出后同样返回登录页。
- [Login/index.jsx](src/pages/Login/index.jsx)：星际玻璃态登录卡片 + 星空粒子 + 飞船从地球跃迁太阳系边界的入场动画。

### 2. 365 周天星辰大阵（首页）

- 组件：[StarArray.jsx](src/components/StarArray/StarArray.jsx) + [StarArray.scss](src/components/StarArray/StarArray.scss)
- **365 颗真实星辰**：每颗星对应实际恒星名（取自星表常量），点击弹详情面板查看赤经/赤纬/星等/光谱等。
- **五重同心环互锁防御**：由内到外 5 层圆环按相反方向、不同转速交错旋转（相邻环反向形成互锁效果），叠加旋转扫描光带。
- **环内流动动画**：每颗星按交错 `animation-delay` 沿环内位置做流动，避免整环呈现静止感。
- **径向跨环脉动**：周期性 `transform` 缩放动画让星点从内到外、从外到内的层级位置发生规律性迁移。

### 3. SVG 图表组件库（10 个可共用组件）

> 零外部依赖，纯 React + 原生 SVG；样式消费 CSS 变量全部带 fallback，**复制到其他项目可直接使用**。

所有组件统一开放参数：`title / subtitle / description / actions / emptyText / loading / formatValue / unit / className / onPointClick / showLabel / showAxis / showGrid / showLegend / showTitle / colors` 等。

| 类型 | 组件文件 | 说明 | 特殊参数 |
| --- | --- | --- | --- |
| 通用容器 | [Charts/shared.jsx](src/components/Charts/shared.jsx) | `ChartCard / ChartHeader / Tooltip / LegendList / ChartEmpty / ChartSkeleton`；工具 `PALETTE / DEFAULT_FORMAT / useMounted / niceBounds / polar` | |
| 折线图（单系列） | [LineChart.jsx](src/components/Charts/LineChart.jsx) | 渐变面积填充 + 描边入场 | `color / showLabel / showAxis / showGrid` |
| 柱状图（单系列） | [BarChart.jsx](src/components/Charts/BarChart.jsx) | 自底向上生长入场 | `color / showLabel / showAxis / showGrid` |
| 饼图（单组） | [PieChart.jsx](src/components/Charts/PieChart.jsx) | 扇区外推 + 图例联动 | `size / colors / showLabel` |
| 进度环 / 仪表盘 | [GaugeChart.jsx](src/components/Charts/GaugeChart.jsx) | 环形刻度背景 + 进度描边 | `value / max / color / size / label` |
| 雷达图 | [RadarChart.jsx](src/components/Charts/RadarChart.jsx) | 网格环 + 数据多边形缩放 | `size / color / showLabel / showGrid` |
| **多维折线图** | [MultiLineChart.jsx](src/components/Charts/MultiLineChart.jsx) | 多系列折线，首系列渐变面积 | `series / colors / showLabel` |
| **分组柱状图** | [MultiBarChart.jsx](src/components/Charts/MultiBarChart.jsx) | 同类别多系列并列，悬停高亮整系列 | `series / colors / showLabel` |
| **堆叠柱状图** | [StackedBarChart.jsx](src/components/Charts/StackedBarChart.jsx) | 多系列自底向上累计堆叠 | `series / colors / showLabel` |
| **多组饼图** | [MultiPieChart.jsx](src/components/Charts/MultiPieChart.jsx) | 多个独立饼图并列，共享图例 | `groups / size / colors / showLabel` |
| **二级柱状图（钻取）** | [DrilledBarChart.jsx](src/components/Charts/DrilledBarChart.jsx) | 点击一级柱子 → 切为该柱子的子级数据，面包屑返回；可钻取柱顶有 ▾ 提示 | `data / colors / showLabel / showAxis / showGrid` |
| **二级饼图（钻取）** | [NestedPieChart.jsx](src/components/Charts/NestedPieChart.jsx)（别名 `DrilledPieChart`） | 点击一级扇区 → 切为该扇区 children 二级饼图，返回按钮回到一级；可钻取扇区边缘有 ▾ 脉动提示 | `data / donut / size / colors / showLabel` |

> 二级钻取数据约定：`data: [{ label, value, color?, children: [{ label, value, color? }, ...] }]`，`children` 为空即不可钻取。

**统一出口**：[Charts/index.js](src/components/Charts/index.js)
```js
import {
  ChartCard, LineChart, BarChart, PieChart, GaugeChart, RadarChart,
  MultiLineChart, MultiBarChart, StackedBarChart, MultiPieChart,
  DrilledBarChart, NestedPieChart, // 或 DrilledPieChart 别名
} from './src/components/Charts'
```

### 4. 五大主流功能页面

- **命令面板**（`/command-palette`）：⌘K / Ctrl+K 唤起的全局搜索式命令面板，支持模糊搜索、分组、快捷键执行。
- **主题切换**（`/theme`）：基于 CSS 变量的多主题切换，实时预览颜色 / 玻璃效果 / 投影变化。
- **通知中心**（`/notify`）：全局消息队列，支持 Toast / 分类通知 / 未读数量 / 一键清空。
- **高级表格**（`/data-table`）：服务端/前端筛选、排序、分页、固定列、行选择、批量操作。
- **图表演示**（`/charts`）：上文 10 种图表组件的集中演示，含 loading 骨架态、实时刷新重放动画、点击选中数据点。

### 5. 其他原生化能力（详见旧章节）

- 语音助手（在线 Web Speech API + 离线 Whisper 双引擎）
- 二维码扫码（摄像头实时 + 图片上传）
- iframe 嵌套预览（dev server `/__frame-check` 探测 X-Frame-Options / CSP）
- AI Agent 自然语言操控页面（内置 NLP 规则 + DOM 执行层）
- JSON 驱动动态表单（`antd-form-builder`）

### 6. 测试体系（TestCenter + Playwright E2E）

**前端即时测试**（`/test-center`，[TestCenterDemo/index.jsx](src/pages/TestCenterDemo/index.jsx)）：
- 内置三类用例：数据完整性校验、组件可导入验证（`import()` 动态导入）、路由配置完整性检查。
- 页面内点击「一键运行」即时展示通过/失败列表、进度条、失败明细。

**Python E2E 自动化测试**（[tests/test_pages.py](tests/test_pages.py)）：
```bash
pip install -r tests/requirements.txt
playwright install chromium
python tests/test_pages.py           # 自动启动 dev server
# 或指定已运行 server：BASE_URL=http://localhost:5173 python tests/test_pages.py
```
- 自动用 UI 流程登录（admin/admin），依次访问全部 14 个路由页面并验证关键文本 / 元素。
- 代表性交互验证：首页计数器自增、周天星辰点弹详情、命令面板 ⌘K 唤起、通知 Toast 弹出、前端测试套件全过。
- 输出 `19/19 通过` 报告，非零退出码便于接 CI。

### 7. 独立 npm 包：`@myorg/react-svg-charts`

所有 SVG 图表组件已拆分打包为 **可发布的独立 npm 包**，位于 `packages/@myorg/react-svg-charts/`，可直接 `npm install` 至任意 React 项目。

- 包内提供 **ESM + CJS** 双构建产物 + `style.css`（SCSS 编译后）+ **完整 TypeScript 类型声明** `index.d.ts`
- `peerDependencies`: `react@>=18`、`react-dom@>=18`
- 样式消费 CSS 变量全部带 fallback，**其它项目无需定义任何 CSS 变量即可正常显示 Indigo 玻璃态**

```
packages/@myorg/react-svg-charts/
├── package.json        # exports: ./ + ./style.css + ./styles
├── vite.config.js      # 库模式：ES/CJS 双格式，peerDeps react/react-dom external
├── tsconfig.build.json
├── README.md           # 安装/使用/发布文档
├── src/                # 源码（11 个图表 + shared + index.js/style 入口）
└── dist/               # npm run build 产物
    ├── index.js        # ESM  72.99 KB（gzip 13.9 KB）
    ├── index.cjs       # CJS  42.43 KB（gzip 11.2 KB）
    ├── style.css       # CSS   6.39 KB（gzip 1.95 KB）
    └── index.d.ts      # 完整类型声明
```

**其他项目安装使用：**
```bash
npm install @myorg/react-svg-charts react react-dom
```
```js
// main.jsx 全局引入一次样式
import '@myorg/react-svg-charts/style.css'
// 组件按需使用
import {
  ChartCard, LineChart, BarChart, PieChart, SwitchableChart,
  DrilledBarChart, NestedPieChart, ChartTypeSwitch,
} from '@myorg/react-svg-charts'

export default () => (
  <ChartCard title="一键切换图表">
    <SwitchableChart
      types={['line', 'bar', 'pie', 'radar']}
      data={[{ label: '1月', value: 320 }, { label: '2月', value: 280 }]}
      showLabel unit=" 单"
    />
  </ChartCard>
)
```

**作为 GitHub Package 发布：**
```bash
cd packages/@myorg/react-svg-charts
npm run build        # 构建 dist/
npm pack --dry-run   # 预览发布内容
# 配置 .npmrc 指向 npm.pkg.github.com 后
npm publish
```

**本 monorepo 工作区快捷脚本**（在项目根目录执行）：
```bash
npm run pkg:charts:build   # 等价于进入包目录 npm run build
npm run pkg:charts:pack    # 打包 tgz 到 dist-local/，便于本地安装测试
```

---

## 项目结构

```
vite-react-demo/
├── packages/
│   └── @myorg/react-svg-charts/   # 独立 npm 包（12 图表 + 通用组件），可发布
│       ├── src/             # 与 src/components/Charts 保持源码同步
│       ├── vite.config.js   # 库模式（ES/CJS + style.css）
│       ├── package.json / README.md
│       └── dist/            # npm run build 构建产物
├── public/
│   ├── models/Xenova/whisper-tiny/   # Whisper ONNX 模型及词表
│   └── ort/                          # onnxruntime-web 的 wasm 运行时
├── src/
│   ├── components/
│   │   ├── Charts/                   # 11 个 SVG 图表（独立文件）+ 共享层 shared.jsx
│   │   │   ├── shared.jsx
│   │   │   ├── LineChart.jsx / BarChart.jsx / PieChart.jsx
│   │   │   ├── GaugeChart.jsx / RadarChart.jsx
│   │   │   ├── MultiLineChart.jsx / MultiBarChart.jsx / StackedBarChart.jsx
│   │   │   ├── MultiPieChart.jsx / NestedPieChart.jsx  # NestedPieChart = 二级钻取饼图（别名 DrilledPieChart）
│   │   │   ├── DrilledBarChart.jsx   # 二级钻取柱状图
│   │   │   ├── Charts.scss           # 图表样式（全部 var() 带 fallback）
│   │   │   └── index.js              # 统一出口
│   │   ├── StarArray/                # 365 周天星辰大阵核心组件
│   │   ├── GlobalAgent/              # 全局浮动 Agent 入口
│   │   ├── VoiceInput/               # 语音输入组件（在线/离线双引擎）
│   │   └── QrScanBtn.jsx             # 通用扫码按钮
│   ├── contexts/
│   │   └── AuthContext.jsx           # 登录状态 + 路由守卫
│   ├── hooks/
│   │   ├── useWebQrScanner.jsx       # 摄像头扫码 hook
│   │   └── useWhisperRecorder.jsx    # Whisper 录音 + 转写 hook
│   ├── layouts/
│   │   └── Layout.jsx                # 顶部导航 + 分组下拉 + 页脚 + 登出
│   ├── pages/                        # 16 个路由页面（含 login/test-center）
│   ├── App.jsx                       # 路由表 + RequireAuth 守卫
│   ├── main.jsx                      # 入口：BrowserRouter + AntD React19 补丁
│   └── index.scss / App.scss
├── tests/
│   ├── test_pages.py                 # Playwright E2E 脚本（自动启动 dev server）
│   └── requirements.txt
├── vite.config.js                    # serveOrtAssets + embedHelpers 自定义插件
├── eslint.config.js
└── package.json
```

---

## Vite 自定义插件说明

[vite.config.js](vite.config.js) 除 `@vitejs/plugin-react` 与 React Compiler 的 babel 预设外，还注册了两个自定义插件：

1. **`serveOrtAssets`** — 开发环境下直接返回 `public/ort/` 下的 onnxruntime wasm 运行时文件。生产构建时 `public/` 会被原样复制到 `dist/`，无需该插件。
2. **`embedHelpers`** — 提供 `GET /__frame-check?url=<encoded>` 接口，用于 iframe 嵌套预览页探测目标站点是否允许被内嵌（dev 专用，生产需自己实现）。

---

## 生产构建

```bash
# 务必在 Node 21+ 下执行
npm run build
```

产物输出到 `dist/`，包含：
- `index.html` 与打包后的 JS / CSS
- 从 `public/` 原样复制的 `models/`、`ort/`、`favicon.svg`、`icons.svg`

生产环境需通过静态服务器（Nginx / 对象存储 / `vite preview` 等）对外提供 `dist/` 服务。

---

## 常见问题

- **`npm run dev` / `npm run build` 报 `node:util styleText`**：Vite 8 的 rolldown 需要 Node ≥ 21。
  解决：`nvm use 24` 或其他 Node 21+ 版本。
- **摄像头/麦克风无法启动**：确认通过 `localhost` 或 HTTPS 访问，并已授予权限。
- **离线语音首次加载慢**：Whisper 模型需首次下载并缓存，后续识别在浏览器本地完成。
- **`import /ort/xxx.mjs` 报 500**：仅在 dev 环境出现，确认 `serveOrtAssets` 插件已正确加载、`public/ort/` 目录存在。
- **Web Speech API 不可用**：在线语音引擎依赖浏览器原生支持，Firefox / Safari 支持有限，建议 Chrome。
- **图表组件跨项目使用时报样式丢失**：所有图表样式在 [Charts/Charts.scss](src/components/Charts/Charts.scss) 中（shared.jsx 会自动引入一次），且所有 `var()` 均带 fallback 默认值；复制整个 `src/components/Charts/` 目录即可，无需定义 CSS 变量。
- **Playwright 测试无法启动 dev server**：确认当前 shell 已切到 Node 21+（如 `nvm use 24`），或用 `BASE_URL=http://127.0.0.1:5173` 指向已在 Node 21+ 下启动的 server。
- **从 npm 安装图表包后样式丢失**：需要在入口 `import '@myorg/react-svg-charts/style.css'`（只需引入一次）。如使用 monorepo alias 直接引入源码需改为 `import '@myorg/react-svg-charts/style.css'` 走 vite alias 映射的 SCSS。
- **`packages/@myorg/react-svg-charts` 与 `src/components/Charts` 如何更新？**：当前 workspace 包的 src/ 是从 `src/components/Charts` 复制而来（发布包用），主项目运行仍依赖本地 `src/components/Charts`。每次改动本地源码后若要更新发布包，重新 `cp` 后再 `npm run pkg:charts:build`；也可把 Charts 包 src 设置为主路径（在根 `package.json` 加 `imports` 字段 + vite alias 做双向统一）。

---

## 附录：GitHub 仓库上传与 GPR 发布

本项目当前尚未初始化 git。你可以按需选择以下两种方案之一，或两者都做。

> 🔐 **安全提示**：GitHub Personal Access Token (PAT)、SSH 私钥、`.npmrc` 中的 `_authToken` 都是机密。
> - 绝不把它们粘贴到聊天窗口、绝不提交到 git、绝不截图分享。
> - 一旦不小心泄露，立刻去 https://github.com/settings/tokens 撤销并重置。
> - 推荐 PAT 只勾最小权限（发布到 GPR 只需 `write:packages`）、并设置较短有效期。

---

### 方案 A：把 vite-react-demo 整个项目作为 monorepo 上传到你的 GitHub

适用场景：备份主项目、在多台电脑同步、在 GitHub 做 Issue/PR 协作。

1. **在 GitHub 新建空仓库**：打开 https://github.com/new → Repository name 如 `vite-react-demo` → 选 Public/Private → **不要**勾选 Initialize README / .gitignore。
2. **初始化本地 git 并提交**（在项目根目录 `/Users/gujiawei/历年资料/learn/vite-react-demo` 执行）：
   ```bash
   # （可选但强烈推荐）提交身份配置（只用你自己的信息）
   git config user.name "你的 GitHub 用户名"
   git config user.email "你的邮箱（建议和 GitHub 保持一致）"

   git init -b main
   git add -A
   git commit -m "chore: initial commit"
   ```
3. **绑定远程并推送**：把下面的 `<你的用户名>` 和 `<仓库名>` 替换成你第 1 步的值。
   ```bash
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```
   如果 push 时要求输入 Password，把它换成**你的 GitHub PAT**（classic，勾选 `repo` 权限）而不是账号密码。

---

### 方案 B：把 `@myorg/react-svg-charts` 抽成独立 GitHub 仓库 + 发布到 GitHub Package Registry

适用场景：在**其他 React 项目**里 `npm install` 就能用。推荐搭配一键脚本完成。

1. **把包目录拷贝到独立文件夹**（避免和 monorepo 的 git 搅在一起）：
   ```bash
   cp -R packages/@myorg/react-svg-charts ~/code/react-svg-charts
   cd ~/code/react-svg-charts
   ```
2. **执行一键发布脚本**（它会交互式引导你完成 7 步，不记录任何 secrets）：
   ```bash
   bash scripts/publish-gpr.sh
   ```
   脚本会依次询问：仓库 URL → 提示你生成 PAT 并写入 `~/.npmrc` → 自动把 `package.json#name` 改成 `@你的用户名/你的仓库名` → git init 提交 → `npm run build` → 打 `v1.0.0` tag → push 到 GitHub → `npm publish` 发布到 GPR。

3. **手动替代脚本发布（不跑脚本也可以）**：
   ```bash
   # 1) GitHub 新建空仓库，假设地址是 https://github.com/YOU/react-svg-charts

   # 2) ~/.npmrc 写入两行（把 ghp_xx 换成你的 PAT，权限勾 write:packages）
   #    @YOU:registry=https://npm.pkg.github.com
   #    //npm.pkg.github.com/:_authToken=ghp_xx

   # 3) 修改包元信息
   cd ~/code/react-svg-charts
   node -e "
     const fs=require('fs');
     const p=JSON.parse(fs.readFileSync('./package.json','utf8'));
     p.name='@YOU/react-svg-charts';
     p.repository={type:'git',url:'https://github.com/YOU/react-svg-charts'};
     p.publishConfig={access:'public',registry:'https://npm.pkg.github.com'};
     fs.writeFileSync('./package.json', JSON.stringify(p,null,2)+'\n');
   "

   # 4) git 初始化 + 构建 + 发版
   git init -b main && git add -A && git commit -m "chore: release v1.0.0"
   git remote add origin https://github.com/YOU/react-svg-charts.git
   nvm use 24 && npm install --legacy-peer-deps && npm run build
   git tag -a v1.0.0 -m "release v1.0.0" && git push -u origin main --tags
   npm publish
   ```

4. **其他项目安装使用**：
   ```bash
   # 在 ~/.npmrc 配置好 @YOU registry 和 PAT 后：
   npm install @YOU/react-svg-charts react react-dom
   ```
   ```js
   // main.jsx：只需全局引入一次样式
   import '@YOU/react-svg-charts/style.css'
   // 业务组件
   import { SwitchableChart, DrilledBarChart, NestedPieChart, ChartCard }
     from '@YOU/react-svg-charts'
   ```

5. **后续升级版本号并重新发布**：`npm version patch|minor|major`（会自动改 package.json 并打 git tag）→ `git push --follow-tags` → `npm run build && npm publish`。

---

### 方案 C（最轻量 · 强烈推荐）：直接从 `jimGJW/vite-react-demo` 主仓库子目录安装图表包

> 不想再建第二个 GitHub 仓库、不想生成 PAT 写 `.npmrc`、不想跑发布脚本？直接用这个方案。
> 其他项目**一条命令**就能安装使用，而且会随 `jimGJW/vite-react-demo` 的 `main` 分支最新代码更新。
> 原理：[gitpkg.vercel.app](https://gitpkg.vercel.app) 是社区通用的开源服务，把 GitHub monorepo 的子目录转换成 npm 可直接下载的 tarball（和 npm registry / GPR 下载的文件格式一致，不会少任何源码/构建脚本）。

#### 在其他 React 项目里安装

```bash
npm install react react-dom                 # peerDependencies 自己的项目要先装
npm install 'https://gitpkg.vercel.app/jimGJW/vite-react-demo/packages/@myorg/react-svg-charts?main'
```

> 🔧 提示：如果你的 npm 版本太老解析不了带 query 的 URL，换这两个等价写法：
> ```bash
> # 写法 1：用 tarball
> npm install 'https://gitpkg.now.sh/jimGJW/vite-react-demo/packages/@myorg/react-svg-charts?main'
> # 写法 2：加个 package 别名更直观
> npm install @myorg/react-svg-charts@'https://gitpkg.vercel.app/jimGJW/vite-react-demo/packages/@myorg/react-svg-charts?main'
> ```

#### 使用

```js
// main.jsx：全局入口只引一次样式
import '@myorg/react-svg-charts/style.css'

// 业务组件
import {
  LineChart, BarChart, PieChart, RadarChart, AreaChart,
  MultiLineChart, MultiBarChart, MultiPieChart, MultiRadarChart, StackedAreaChart,
  DrilledBarChart, NestedPieChart,
  SwitchableChart, ChartCard, ChartTypeSwitch,
  chartColors, adaptData
} from '@myorg/react-svg-charts'
```

#### 升级到最新代码

```bash
npm update @myorg/react-svg-charts
# 或者删掉 node_modules/.package-lock.json 后重新 npm install
```

---

### 三种方案对比

| 维度 | 方案 A · 整个 monorepo 一个 GitHub | 方案 B · 图表包独立 GitHub + 发布 GPR | 方案 C · 直接从主仓库子路径安装（推荐） |
| --- | --- | --- | --- |
| 主目的 | 备份、协作、版本管理演示项目 | 其他 React 项目 `npm install` 即用图表组件 | 其他 React 项目**一条命令**安装图表组件，最省心 |
| 是否需要第二个仓库 | ❌ 不用 | ✅ 需要新建 react-svg-charts 空仓库 | ❌ 不用 |
| 是否需要 PAT / `.npmrc` | push 代码需要（`repo` 权限即可）| 发布 GPR 需要（`write:packages` + `repo`）| ❌ 完全不需要 |
| 是否需要发布脚本 | ❌ 不用 | ✅ `bash scripts/publish-gpr.sh` | ❌ 不用 |
| 安装命令 | N/A | `npm install @YOU/react-svg-charts`（需先配 GPR registry） | `npm install 'https://gitpkg.vercel.app/jimGJW/vite-react-demo/packages/@myorg/react-svg-charts?main'` |
| 随主项目更新 | N/A | 需要手动 `npm version && npm publish` 才更新 | 每次 `npm update` 直接拉 `main` 分支最新代码 |
| 适用场景 | 只需要备份和协作演示项目 | 想把图表包像 `antd` 一样作为独立开源项目运营发布 | 只想让自己其他项目能快速复用图表 |


