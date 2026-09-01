/* =====================================================================
 * 图表组件统一出口（Vue 3 版本）
 * - 13 个独立图表组件，各自单文件，便于按需引入
 * - ChartCard / ChartTypeSwitch / SVG 小图标等通用组件从 shared.js 导出
 * 样式全部带 fallback，其他项目无需定义 CSS 变量即可显示 Indigo 风格
 * ===================================================================== */

// 通用容器 / 工具（具名导出）
export {
  ChartCard,
  ChartHeader,
  ChartEmpty,
  ChartSkeleton,
  Tooltip,
  LegendList,
  ChartTypeSwitch,
  ChartLineIcon, ChartBarIcon, ChartPieIcon, ChartAreaIcon, ChartRadarIcon,
  // 工具函数 / composable
  useMounted,
  niceNum,
  niceBounds,
  polar,
  PALETTE,
  DEFAULT_FORMAT,
  DEFAULT_ICON_MAP,
  DEFAULT_LABEL_MAP,
} from './shared.js'

// 单系列基础图表
export { default as LineChart } from './LineChart.vue'
export { default as BarChart } from './BarChart.vue'
export { default as PieChart } from './PieChart.vue'
export { default as GaugeChart } from './GaugeChart.vue'
export { default as RadarChart } from './RadarChart.vue'

// 多维 / 二级图表
export { default as MultiLineChart } from './MultiLineChart.vue'
export { default as MultiBarChart } from './MultiBarChart.vue'
export { default as StackedBarChart } from './StackedBarChart.vue'
export { default as MultiPieChart } from './MultiPieChart.vue'
// 二级钻取（点击一级 → 切换为该项子级数据 → 可返回）
export { default as DrilledBarChart } from './DrilledBarChart.vue'
export { default as NestedPieChart } from './NestedPieChart.vue'   // 二级饼图（钻取 Drill-down）
export { default as DrilledPieChart } from './NestedPieChart.vue'  // 同组件别名，语义更明确

// 组合组件 · 图标来回切换不同图表类型
export { default as SwitchableChart } from './SwitchableChart.vue'

/** SwitchableChart 支持的图表类型 */
export const SWITCHABLE_TYPES = ['line', 'bar', 'pie', 'radar']
