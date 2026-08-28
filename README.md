# Vite + React Demo

一个基于 **Vite 8 + React 19 + React Router 7 + Ant Design 5** 的前端能力演示项目，集中展示了：
星际星空登录 + 365 周天星辰大阵首页、10 个零依赖 SVG 共用图表组件、5 大主流功能页面（命令面板 / 图表演示 / 主题切换 / 通知中心 / 高级表格）、语音识别、二维码扫描、iframe 嵌套预览、JSON 驱动表单、AI Agent 自然语言操控页面，以及前后端一体化的测试体系。

> 项目已启用 [React Compiler](https://react.dev/learn/react-compiler)，构建时会自动优化组件渲染。

---

## 🚀 快速上手 · 上手指南（提交 GitHub + 使用）

> 这一章把两件事一次性讲清楚：**① 如何把本地代码提交到你的 GitHub 仓库**；**② 项目本身如何启动 / 使用，以及 6 个独立 npm 包如何在其他 React 项目里复用**。

---

### 一、如何提交 GitHub 仓库（可复制命令直接执行）

#### 1. 本地一次性准备（只做 1 次）

先在终端里切到项目目录：

```bash
cd /Users/gujiawei/历年资料/learn/vite-react-demo

# 0) 切换 Node 版本（Vite 8 构建需要 ≥ Node 21）
source ~/.nvm/nvm.sh && nvm use 24

# 1) 检查提交身份（如果你第一次用 git，必须先配置）
# 推荐：仓库级配置（只影响本仓库），替换成你自己的信息：
git config user.name  "顾佳炜"            # 或 "JimGJW"
git config user.email "jim_gjw@163.com"   # 必须和 GitHub 账号邮箱一致，否则 commit author 会错

# 2) 初始化 git（只有第一次才需要）
# （如果已经是 git 仓库会报错，跳过即可）
git init -b main

# 3) 强制 Git 使用 HTTP/1.1（彻底规避之前遇到的「HTTP2 framing layer error」）
git config http.version HTTP/1.1

# 4) 绑定远程仓库（只有第一次才需要）
# 推荐 SSH over HTTPS（比 HTTPS + PAT 更稳，不用每次输 Token）：
git remote add origin ssh://git@ssh.github.com:443/jimGJW/vite-react-demo.git
# 备用：如果你偏好 HTTPS + PAT：
#   git remote add origin https://github.com/jimGJW/vite-react-demo.git
# 查看远程确认：
git remote -v
```

> 🔐 **安全提醒（重要）**
> - **不要**在任何聊天框 / Issue / 代码截图里粘贴 GitHub PAT、SSH 私钥、`.npmrc` 里的 `_authToken`。
> - 一旦泄露立刻去 https://github.com/settings/tokens 撤销并重置。
> - PAT 最小权限：**推送源码只需 `repo`**，**发布 GPR 包只需 `write:packages`**。

#### 2. 每次改代码后的提交流程（常用）

```bash
cd /Users/gujiawei/历年资料/learn/vite-react-demo
source ~/.nvm/nvm.sh && nvm use 24

# Step 1：拉取远端最新（避免冲突，先 pull 再改）
git pull --rebase origin main

# Step 2：看一眼改了哪些文件（确认没有误改敏感配置 / dist 大文件）
git status

# Step 3：选择性暂存（推荐），或 git add -A 全部暂存
git add -A
# 想只加某些文件： git add README.md package.json packages/

# Step 4：提交前检查「暂存区里到底有啥」——只看已暂存的，避免把工作区未暂存内容误提交
git diff --cached --stat
git diff --cached README.md package.json  # 按需抽查关键文件

# Step 5：提交（推荐 Conventional Commits 格式）
git commit -m "chore: publish 5 new npm packages (styles-reset/core-hooks/ui-basic/media-tools/admin-shell)"
# 其他常用前缀：feat: xxx 新增功能  fix: xxx 修 bug  docs: xxx 更新文档  refactor: xxx 重构  build: xxx 构建脚本

# Step 6：推送到 GitHub
git push -u origin main
# 如果之前已经 push 过，简化为：
#   git push
```

#### 3. 常见报错与解决办法

| 报错 | 原因 | 解决办法 |
| --- | --- | --- |
| `fatal: not a git repository` | 当前目录没有 `.git/` | 执行 `git init -b main` |
| `fatal: remote origin already exists` | 已绑定过 origin | `git remote remove origin` 再重新 `git remote add origin <URL>`；或直接 `git remote set-url origin <新URL>` |
| `Error in the HTTP2 framing layer` | 之前的 HTTPS 协议网络层问题 | 本仓库已通过 `git config http.version HTTP/1.1` 修复；**优先改用 SSH over HTTPS**：`git remote set-url origin ssh://git@ssh.github.com:443/jimGJW/vite-react-demo.git` |
| `Permission denied (publickey)` | SSH 公钥没加到 GitHub | ① `ls ~/.ssh/id_*.pub` 看是否有公钥；没有就 `ssh-keygen -t ed25519 -C "jim_gjw@163.com"`；② `pbcopy < ~/.ssh/id_ed25519.pub` 复制后粘贴到 https://github.com/settings/keys；③ `ssh -T ssh://git@ssh.github.com:443` 测试连接（会提示欢迎信息） |
| `Support for password authentication was removed. Please use a personal access token instead.` | HTTPS 方式不能用账号密码了 | ① 改成 SSH（推荐，按上一条）；或② 新建 PAT（classic，勾 `repo`）→ 当 Password 被要求时**粘贴 PAT 而非账号密码** |
| `error: failed to push some refs to '...'` | 远端比本地新（别人/另一台电脑 push 过） | `git pull --rebase origin main` 把远端更新合进来 → 如果有冲突手动解决 → `git rebase --continue` → `git push` |
| `Your branch and 'origin/main' have diverged` | 本地 commit 和远端分叉了 | 新手最稳：`git pull --rebase origin main` 然后按提示解决冲突 → `git push` |
| `Nothing to commit, working tree clean` | 没有改动，空提交流程 | 正常现象，跳过 `git add/commit` 直接 `git pull` 即可 |
| 提交后发现 author 名字/邮箱错了（如 committer identity 自动配置提示） | git config 未配置或配置成他人 | 本仓库已配置正确。想修正上一次提交仅改 author：`git commit --amend --reset-author --no-edit` |

---

### 二、项目如何使用（启动 / 构建 / 打包 6 个 npm 包）

#### 1. 运行主项目（Vite React Demo 本地预览）

```bash
cd /Users/gujiawei/历年资料/learn/vite-react-demo
source ~/.nvm/nvm.sh && nvm use 24

# ① 安装依赖（首次或新增依赖时跑）
npm install

# ② 启动开发服务器  http://localhost:5173
npm run dev

# ③ 生产构建（产物到 dist/）
npm run build

# ④ 预览生产构建
npm run preview

# ⑤ 运行 E2E 测试（Playwright Python）
pip install -r tests/requirements.txt
python -m playwright install chromium
python tests/test_pages.py           # 会自动启动 dev server 并跑通 19/19 条用例
```

#### 2. 一键打包 6 个独立 npm 包（和 react-svg-charts 同格式）

```bash
cd /Users/gujiawei/历年资料/learn/vite-react-demo
source ~/.nvm/nvm.sh && nvm use 24

npm run pkg:all:build   # ⭐ 一口气构建 6 个包（ESM + CJS + style.css + index.d.ts）
```

单个包构建：

```bash
npm run pkg:styles:build     npm run pkg:styles:pack   # 打包成 .tgz
npm run pkg:core:build       npm run pkg:core:pack
npm run pkg:ui:build         npm run pkg:ui:pack
npm run pkg:media:build      npm run pkg:media:pack
npm run pkg:shell:build      npm run pkg:shell:pack
npm run pkg:charts:build     npm run pkg:charts:pack
```

构建完每个包的 `dist/` 大小（已验证）：

| 包 | dist 大小 | 说明 |
| --- | --- | --- |
| `@myorg/react-styles-reset` | 24 KB | 设计 token + 全局 reset + mesh 背景，零依赖 |
| `@myorg/react-core-hooks` | 1.3 MB | AuthProvider/useWebQrScanner/useWhisperRecorder；**@huggingface/* 完全 external**，不会把 56MB 模型打进产物 |
| `@myorg/react-ui-basic` | 164 KB | Theme / Notification / CommandPalette / DataTable / **StarArray 365 周天星辰大阵**，纯 react + scss |
| `@myorg/react-media-tools` | 44 KB | QrScanBtn / VoiceInput（在线 + 离线语音） |
| `@myorg/react-admin-shell` | 172 KB | AdminLayout / GlobalAgent / UniversalPageAgent / TestCenter；antd/lodash 全部 external |
| `@myorg/react-svg-charts` | 180 KB | 12 种纯 SVG 零依赖图表 |

---

### 三、6 个 npm 包如何在**其他 React 项目**里使用（两种方式，选一个）

#### 方式 A · 最省心：gitpkg 直接安装（无需 PAT / 无需发布）

> 原理：[gitpkg.vercel.app](https://gitpkg.vercel.app) 把 GitHub monorepo 子目录转成 npm tarball。**只要主项目 push 到 GitHub，就能一条命令装任意包**。

```bash
# 在你的「另一个 React 项目」里执行：
cd /path/to/your-other-react-project

# 1) 安装 peer 依赖（按需裁剪）
npm install react react-dom qr-scanner \
            antd react-router-dom @ant-design/icons @ant-design/v5-patch-for-react-19 lodash

# 2) 安装全部 6 个包（或 for 循环里挑几个）
for PKG in react-styles-reset react-core-hooks react-ui-basic react-media-tools react-admin-shell react-svg-charts; do
  npm install @myorg/$PKG@"https://gitpkg.vercel.app/jimGJW/vite-react-demo/packages/@myorg/$PKG?main"
done
```

**使用示例**：

```js
// ===== main.jsx：按顺序引入样式（用几个引几个） =====
import '@myorg/react-styles-reset/style.css'
import '@myorg/react-ui-basic/style.css'
import '@myorg/react-media-tools/style.css'
import '@myorg/react-admin-shell/style.css'
import '@myorg/react-svg-charts/style.css'

// ===== 业务组件 =====
import { ThemeProvider, ThemeToggle, StarArray, NotificationProvider, DataTable, CommandPalette } from '@myorg/react-ui-basic'
import { AuthProvider, useAuth, useWebQrScanner, useWhisperRecorder }              from '@myorg/react-core-hooks'
import { QrScanBtn, VoiceInput }                                                       from '@myorg/react-media-tools'
import { AdminLayout, GlobalAgent, TestCenter }                                        from '@myorg/react-admin-shell'
import { LineChart, BarChart, PieChart, SwitchableChart, DrilledBarChart, NestedPieChart, ChartCard } from '@myorg/react-svg-charts'

export default function Demo() {
  return (
    <ThemeProvider defaultTheme="auto">
      <NotificationProvider>
        <AuthProvider>
          <ThemeToggle />
          <StarArray radius={280} onStarClick={(s) => alert(`${s.name} ${s.chineseName}`)} />
          <ChartCard title="一键切换图表">
            <SwitchableChart
              types={['line', 'bar', 'pie', 'radar']}
              data={[{ label: '1月', value: 320 }, { label: '2月', value: 280 }, { label: '3月', value: 420 }]}
              showLabel unit=" 单"
            />
          </ChartCard>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  )
}
```

#### 方式 B · 标准发布：GitHub Package Registry（GPR）

适合把其中某个包（比如 `react-svg-charts` 或 `react-ui-basic` 里的 StarArray）作为独立开源项目运营。**6 个包的发布流程完全相同**，只需把目录名换成对应包即可。每个包自带脚本 [publish-gpr.sh](file:///Users/gujiawei/历年资料/learn/vite-react-demo/packages/@myorg/react-svg-charts/scripts/publish-gpr.sh)（交互式，不会记录任何 secrets）。

```bash
cd /Users/gujiawei/历年资料/learn/vite-react-demo
PKG=react-svg-charts   # 其他包替换：react-styles-reset / react-core-hooks / react-ui-basic / react-media-tools / react-admin-shell
cp -R packages/@myorg/$PKG ~/code/$PKG
cd ~/code/$PKG
bash scripts/publish-gpr.sh
```

三种方案的完整对比、升级方式见文末「附录：GitHub 仓库上传与 GPR 发布」。

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

### 7. 独立 npm 包总览（6 个包，和 `react-svg-charts` 一样的打包格式）

本项目除 SVG 图表外，其余可复用组件已按依赖关系拆成 **5 个独立 npm 包**。6 个包的打包/发布格式完全一致：**ESM + CJS 双产物 + `style.css`（SCSS 编译）+ `index.d.ts`（TypeScript 声明）**，所有 CSS 变量带 fallback，peerDependencies 严格按依赖关系 external，不会把 `@huggingface/transformers`（56MB）这类大依赖打进 dist。

```
packages/@myorg/
├── react-styles-reset/        ① 设计 token + 全局 reset 样式（零依赖）
├── react-core-hooks/          ② AuthProvider + useWhisperRecorder + useWebQrScanner（纯 Hooks，peer: qr-scanner，@huggingface/* 完全 external）
├── react-ui-basic/            ③ Theme / Notification / CommandPalette / DataTable / StarArray（纯 react + scss，零外部 UI 库）
├── react-media-tools/         ④ QrScanBtn + VoiceInput（peer: qr-scanner）
├── react-admin-shell/         ⑤ AdminLayout + GlobalAgent + UniversalPageAgent + TestCenter（peer: antd, react-router-dom, lodash, transformers...）
└── react-svg-charts/          ⑥ SVG 图表组件库（12 图表 + shared）
```

| 包名 | 依赖链 | dist 大小 | 主要内容 |
| --- | --- | --- | --- |
| `@myorg/react-styles-reset` | 无 peer（纯 CSS） | 24 KB | `:root` 设计 token + 全局 reset + mesh 背景 |
| `@myorg/react-core-hooks` | peer: react/react-dom / qr-scanner（可选）/ @huggingface（可选、external） | 1.3 MB | AuthProvider / useAuth / useWebQrScanner / useWhisperRecorder |
| `@myorg/react-ui-basic` | peer: react/react-dom | 164 KB | Theme 三态主题 / Notification 通知中心 / CommandPalette ⌘K 命令面板 / DataTable 通用表格 / **StarArray 365 周天星辰大阵** |
| `@myorg/react-media-tools` | peer: react/react-dom / qr-scanner / @myorg/react-core-hooks | 44 KB | QrScanBtn / VoiceInput（在线 Web Speech API + 离线 Whisper 双引擎） |
| `@myorg/react-admin-shell` | peer: antd / react-router-dom / lodash / transformers / onnxruntime-web / @myorg/react-core-hooks | 172 KB | AdminLayout 玻璃态后台外壳 / GlobalAgent 可拖拽 AI 气泡 / UniversalPageAgent 自然语言 DOM 编排 / TestCenter 前端用例中心 |
| `@myorg/react-svg-charts` | peer: react/react-dom | 180 KB | 12 个纯 SVG 零依赖图表（基础/多维/二级钻取/类型切换） |

#### 本 monorepo 工作区快捷脚本（在项目根目录执行）

```bash
npm run pkg:all:build      # 一口气构建 6 个包
# 单独构建：
npm run pkg:styles:build     npm run pkg:styles:pack
npm run pkg:core:build       npm run pkg:core:pack
npm run pkg:ui:build         npm run pkg:ui:pack
npm run pkg:media:build      npm run pkg:media:pack
npm run pkg:shell:build      npm run pkg:shell:pack
npm run pkg:charts:build     npm run pkg:charts:pack
```

#### 推荐：在其他 React 项目里用 gitpkg 一条命令安装所有包（无需 GPR/PAT）

```bash
# 基础必装
npm install react react-dom
npm install \
 'https://gitpkg.vercel.app/jimGJW/vite-react-demo/packages/@myorg/react-styles-reset?main' \
 'https://gitpkg.vercel.app/jimGJW/vite-react-demo/packages/@myorg/react-core-hooks?main'  \
 'https://gitpkg.vercel.app/jimGJW/vite-react-demo/packages/@myorg/react-ui-basic?main'

# 需要扫码/语音则加：
npm install qr-scanner
npm install \
 'https://gitpkg.vercel.app/jimGJW/vite-react-demo/packages/@myorg/react-media-tools?main'

# 需要后台外壳/AI Agent/测试中心则加（务必先装 antd + react-router-dom + lodash）：
npm install antd react-router-dom @ant-design/icons @ant-design/v5-patch-for-react-19 lodash
npm install 'https://gitpkg.vercel.app/jimGJW/vite-react-demo/packages/@myorg/react-admin-shell?main'
```

然后在 `main.jsx` 按顺序引入样式：

```js
import '@myorg/react-styles-reset/style.css'        // 全局设计 token（放最前）
import '@myorg/react-ui-basic/style.css'
import '@myorg/react-media-tools/style.css'         // 按需
import '@myorg/react-admin-shell/style.css'         // 按需
import '@myorg/react-svg-charts/style.css'          // 按需
```

想把 6 个包都发成独立 GitHub 仓库 + GPR 的流程，对每个包**重复下面的 `方案 B` 即可**（或者更省事直接 `方案 C` 一条命令 gitpkg）。

---

### 7.1 独立 npm 包：`@myorg/react-svg-charts`

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
├── packages/@myorg/
│   ├── react-styles-reset/    # ① 设计 token + 全局 reset 样式（零依赖）
│   ├── react-core-hooks/      # ② AuthContext / useWebQrScanner / useWhisperRecorder 纯 hooks 包
│   ├── react-ui-basic/        # ③ Theme / Notification / CommandPalette / DataTable / StarArray（零外部 UI 库）
│   ├── react-media-tools/     # ④ QrScanBtn / VoiceInput（peer: qr-scanner，依赖 react-core-hooks）
│   ├── react-admin-shell/     # ⑤ AdminLayout / GlobalAgent / UniversalPageAgent / TestCenter（peer: antd）
│   └── react-svg-charts/      # ⑥ 独立 npm 包（12 图表 + 通用组件），可发布
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
- **`react-core-hooks` 的 dist 会不会很大（有 Whisper 相关代码）？**：不会。vite.config.js 已把 `@huggingface/*` 全部 external，动态 import 不会被打进 dist；dist 只有纯 hook 逻辑，大小约 1.3 MB（主要是 MediaRecorder + WAV 编码实现）。
- **`react-admin-shell` 用到 antd，为什么 dist 很小？**：antd / react-router-dom / lodash / @ant-design/icons / onnxruntime-web 全部被放进 vite rollupOptions.external，仅保留组合编排代码，所以 CJS 产物约 48 KB / style.css 26.78 KB。
- **5 个新包和主项目 `src/components` 有同名文件是重复吗？**：是——为了方便独立发布（发布用的 packages 目录必须自包含），主项目源码仍在 `src/components/*` 下，不影响 dev/build。如果要统一单源，后续可把主项目 `src/components/*` 全部改为 `import from '@myorg/xxx'` 并通过 workspace 引用。
- **`npm install qr-scanner` 和 `@huggingface/transformers` 必须在使用方安装吗？**：qr-scanner 是 **peerDependencies.optional**，不用扫码功能可不装；`@huggingface/transformers` 是 **optionalDependencies**，不安装也不影响 `react-media-tools / react-admin-shell` 的其他功能（会退回到 Web Speech API 或纯 DOM Agent）。

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

### 方案 B：把 `@myorg/react-svg-charts`（或其余 5 个包任意一个）抽成独立 GitHub 仓库 + 发布到 GitHub Package Registry

适用场景：在**其他 React 项目**里 `npm install` 就能用。推荐搭配一键脚本完成。其余 5 个包（react-styles-reset / react-core-hooks / react-ui-basic / react-media-tools / react-admin-shell）的发布流程**完全相同**——只需把下面目录名换成对应包即可。

1. **把包目录拷贝到独立文件夹**（避免和 monorepo 的 git 搅在一起）：
   ```bash
   PKG=react-svg-charts
   # 其他包替换：PKG=react-styles-reset / react-core-hooks / react-ui-basic / react-media-tools / react-admin-shell
   cp -R packages/@myorg/$PKG ~/code/$PKG
   cd ~/code/$PKG
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

### 方案 C（最轻量 · 强烈推荐）：直接从 `jimGJW/vite-react-demo` 主仓库子目录安装**任意包**

> 不想再建第二个 GitHub 仓库、不想生成 PAT 写 `.npmrc`、不想跑发布脚本？直接用这个方案。
> 其他项目**一条命令**就能安装使用，而且会随 `jimGJW/vite-react-demo` 的 `main` 分支最新代码更新。
> 原理：[gitpkg.vercel.app](https://gitpkg.vercel.app) 是社区通用的开源服务，把 GitHub monorepo 的子目录转换成 npm 可直接下载的 tarball（和 npm registry / GPR 下载的文件格式一致，不会少任何源码/构建脚本）。
> 6 个包都可以这么装，把 URL 末尾的 `react-svg-charts` 换成 `react-styles-reset` / `react-core-hooks` / `react-ui-basic` / `react-media-tools` / `react-admin-shell` 即可。

#### 在其他 React 项目里安装（6 个包一键安装示例）

```bash
npm install react react-dom antd react-router-dom @ant-design/icons @ant-design/v5-patch-for-react-19 lodash qr-scanner
# 6 个包全部安装（@myorg/react-styles-reset / core-hooks / ui-basic / media-tools / admin-shell / svg-charts）
for PKG in react-styles-reset react-core-hooks react-ui-basic react-media-tools react-admin-shell react-svg-charts; do
  npm install @myorg/$PKG@"https://gitpkg.vercel.app/jimGJW/vite-react-demo/packages/@myorg/$PKG?main"
done
```

> 🔧 提示：如果你的 npm 版本太老解析不了带 query 的 URL，换这两个等价写法：
> ```bash
> # 写法 1：用 tarball
> npm install 'https://gitpkg.now.sh/jimGJW/vite-react-demo/packages/@myorg/react-svg-charts?main'
> # 写法 2：单独装每个包
> npm install @myorg/react-ui-basic@'https://gitpkg.vercel.app/jimGJW/vite-react-demo/packages/@myorg/react-ui-basic?main'
> ```

#### 使用

```js
// main.jsx：全局入口按顺序引样式（用几个引几个）
import '@myorg/react-styles-reset/style.css'
import '@myorg/react-ui-basic/style.css'
import '@myorg/react-media-tools/style.css'
import '@myorg/react-admin-shell/style.css'
import '@myorg/react-svg-charts/style.css'

// 业务组件示例
import {
  ThemeProvider, NotificationProvider, CommandPalette, DataTable, StarArray,
} from '@myorg/react-ui-basic'
import { QrScanBtn, VoiceInput } from '@myorg/react-media-tools'
import { AdminLayout, GlobalAgent, TestCenter } from '@myorg/react-admin-shell'
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
npm update @myorg/react-styles-reset @myorg/react-core-hooks @myorg/react-ui-basic \
           @myorg/react-media-tools  @myorg/react-admin-shell @myorg/react-svg-charts
# 或者删掉 node_modules/.package-lock.json 后重新 npm install
```

---

### 三种方案对比

| 维度 | 方案 A · 整个 monorepo 一个 GitHub | 方案 B · 单个包独立 GitHub + 发布 GPR（6 个包都适用） | 方案 C · 直接从主仓库子路径安装 6 个包（推荐） |
| --- | --- | --- | --- |
| 主目的 | 备份、协作、版本管理演示项目 | 把某个包（如图表、星辰大阵）作为独立开源项目运营 | 其他 React 项目一条命令安装**任何包**，最省心 |
| 是否需要第二个仓库 | ❌ 不用 | ✅ 每个包一个空仓库（react-styles-reset、react-core-hooks…）| ❌ 不用 |
| 是否需要 PAT / `.npmrc` | push 代码需要（`repo` 权限即可）| 发布 GPR 需要（`write:packages` + `repo`）| ❌ 完全不需要 |
| 是否需要发布脚本 | ❌ 不用 | ✅ `bash scripts/publish-gpr.sh`（每个包跑 1 次）| ❌ 不用 |
| 安装命令 | N/A | `npm install @YOU/react-svg-charts`（需先配 GPR registry） | 6 包一组 for 循环：`npm install @myorg/$PKG@https://gitpkg.vercel.app/.../$PKG?main` |
| 随主项目更新 | N/A | 需要手动 `npm version && npm publish` 才更新 | 每次 `npm update` 直接拉 `main` 分支最新代码 |
| 适用场景 | 只需要备份和协作演示项目 | 想把单个组件（如 StarArray / Charts）作为独立 npm 库 | 想让自己其他项目能快速复用整套 UI/Hooks/Layout/图表 |


