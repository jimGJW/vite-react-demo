/* =====================================================================
 * 图表组件统一出口
 * - 12 个独立图表组件，各自单文件，便于按需引入
 * - ChartCard / ChartTypeSwitch / SVG 小图标等通用组件从 shared.jsx 导出
 * 样式全部带 fallback，其他项目无需定义 CSS 变量即可显示 Indigo 风格
 * ===================================================================== */

// 通用容器 / 工具（具名导出）
export {
  ChartCard,
  ChartTypeSwitch,
  ChartLineIcon, ChartBarIcon, ChartPieIcon, ChartAreaIcon, ChartRadarIcon,
} from './shared.jsx'

// 单系列基础图表（default export 重命名为具名）
export { default as LineChart } from './LineChart.jsx'
export { default as BarChart } from './BarChart.jsx'
export { default as PieChart } from './PieChart.jsx'
export { default as GaugeChart } from './GaugeChart.jsx'
export { default as RadarChart } from './RadarChart.jsx'

// 多维 / 二级图表
export { default as MultiLineChart } from './MultiLineChart.jsx'
export { default as MultiBarChart } from './MultiBarChart.jsx'
export { default as StackedBarChart } from './StackedBarChart.jsx'
export { default as MultiPieChart } from './MultiPieChart.jsx'
// 二级钻取（点击一级 → 切换为该项子级数据 → 可返回）
export { default as DrilledBarChart } from './DrilledBarChart.jsx'
export { default as NestedPieChart } from './NestedPieChart.jsx'   // 二级饼图（钻取 Drill-down）
export { default as DrilledPieChart } from './NestedPieChart.jsx'  // 同组件别名，语义更明确

// 组合组件 · 图标来回切换不同图表类型
export { default as SwitchableChart } from './SwitchableChart.jsx'
