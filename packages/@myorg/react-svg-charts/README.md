# @myorg/react-svg-charts

零依赖纯 React + 原生 SVG 图表组件库。12 个组件独立单文件 + 通用容器 + 图标切换组合组件。
样式全部消费 CSS 变量且带 fallback，**其他项目 `npm install` 后无需定义任何 CSS 变量即可正常显示 Indigo 玻璃态风格**。

> 本项目为 monorepo 的 `packages/@myorg/react-svg-charts/` 子包；也可单独拷贝目录作为独立 GitHub 仓库发布。

---

## 安装

```bash
# 发布到 npmjs 后（或 GitHub Package Registry）：
npm install @myorg/react-svg-charts react react-dom

# GitHub 直接引用（私有仓库需配置 .npmrc / auth token）：
npm install <your-org>/react-svg-charts#v1.0.0
```

`peerDependencies`: `react@>=18`、`react-dom@>=18`。

## 使用

### 引入样式（必须）

```js
// main.jsx 或任意全局入口（只需引入一次）
import '@myorg/react-svg-charts/style.css'
```

### 基础组件

```jsx
import {
  ChartCard, LineChart, BarChart, PieChart, GaugeChart, RadarChart,
  MultiLineChart, MultiBarChart, StackedBarChart, MultiPieChart,
  DrilledBarChart, NestedPieChart,  // 二级钻取（点击一级进子级，可返回）
  SwitchableChart,                  // 图标切换 line/bar/pie/radar
  ChartTypeSwitch,
  ChartLineIcon, ChartBarIcon, ChartPieIcon,
} from '@myorg/react-svg-charts'

const daily = [
  { label: '周一', value: 32 },
  { label: '周二', value: 58 },
  { label: '周三', value: 41 },
]

export default function App() {
  return (
    <ChartCard title="访问趋势" subtitle="最近一周">
      <LineChart data={daily} unit=" 次" />
    </ChartCard>
  )
}
```

### 图标来回切换（SwitchableChart）

```jsx
<SwitchableChart
  data={daily}
  types={['line', 'bar', 'pie']}
  defaultType="line"
  title="同数据多视图"
  subtitle="右上角图标一键切换"
  showLabel
  unit=" 次"
/>
```

### 二级饼图 / 柱状图（Drill-down）

```jsx
<NestedPieChart
  title="区域渠道分布"
  subtitle="点击区域扇区进入子级渠道"
  data={[
    { label: '华东', value: 480, children: [
      { label: '搜索', value: 200 },
      { label: '直达', value: 140 },
      { label: '社媒', value: 140 },
    ]},
    { label: '华北', value: 320, children: [
      { label: '搜索', value: 140 },
      { label: '推荐', value: 180 },
    ]},
  ]}
  donut showLabel unit=" 单"
/>

<DrilledBarChart
  title="品类月度" subtitle="点击柱子进入子级"
  data={[
    { label: '3C', value: 640, children: [
      { label: '1月', value: 90 }, { label: '2月', value: 120 },
      { label: '3月', value: 110 }, { label: '4月', value: 160 },
      { label: '5月', value: 90 }, { label: '6月', value: 70 },
    ]},
  ]}
  showLabel unit=" 件"
/>
```

---

## 全部组件

| 组件 | 说明 |
| --- | --- |
| `ChartCard` / `ChartHeader` / `Tooltip` / `LegendList` / `ChartEmpty` / `ChartSkeleton` | 通用容器与辅助 |
| `ChartLineIcon` `ChartBarIcon` `ChartPieIcon` `ChartAreaIcon` `ChartRadarIcon` | 纯 SVG 小图标 |
| `ChartTypeSwitch` | 图标分段按钮组，用于嵌在 header actions 中切图 |
| `LineChart` / `BarChart` / `PieChart` / `GaugeChart` / `RadarChart` | 5 个基础单系列图表 |
| `MultiLineChart` / `MultiBarChart` / `StackedBarChart` / `MultiPieChart` | 4 个多维图表 |
| `DrilledBarChart` / `NestedPieChart` (`DrilledPieChart` 别名) | 2 个二级钻取图表 |
| `SwitchableChart` | 图标一键切换 line/bar/pie/radar 的组合组件 |

所有组件统一开放参数：`title` / `subtitle` / `description` / `actions` / `emptyText` / `loading` / `formatValue` / `unit` / `className` / `onPointClick` / `showLabel` / `showAxis` / `showGrid` / `showLegend` / `showTitle` / `colors` / `color`。

---

## 作为独立 GitHub 仓库发布

```bash
# 拷贝 packages/@myorg/react-svg-charts/ 为独立仓库后：
npm install
npm run build        # 构建 dist/ (index.js + index.cjs + style.css + index.d.ts)
npm pack --dry-run   # 本地预览包内容
npm publish          # 发布到 npm 或 GitHub Package Registry
```

GitHub Package Registry 发布配置示例（`.npmrc`）：
```
@your-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<PERSONAL_ACCESS_TOKEN>
```

## 本地联调（在主项目不发 npm 包直接用）

在主项目根目录的 `vite.config.js` 添加一个 alias：
```js
resolve: {
  alias: {
    '@charts': path.resolve(__dirname, 'packages/@myorg/react-svg-charts/src'),
  }
}
```
然后 `import { SwitchableChart } from '@charts/index.js'`（主项目仍需引入一次 SCSS：`import '@charts/Charts.scss'`）。
