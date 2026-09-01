import type { DefineComponent, Ref } from 'vue'

/* ================================ 通用类型 ================================ */

/** 通用数据点 */
export interface ChartPoint {
  label: string
  value: number
  color?: string
  max?: number
  [key: string]: any
}

/** 多系列图表的一个系列 */
export interface ChartSeries {
  name: string
  color?: string
  data: ChartPoint[]
}

/** 多组饼图的一组 */
export interface ChartGroup {
  name: string
  data: ChartPoint[]
}

/** 可钻取节点（children 为二级数据） */
export interface ChartDrillNode extends ChartPoint {
  children?: ChartPoint[]
}

/** 图例项 */
export interface LegendItem {
  label?: string
  value?: string
  pct?: string
  color?: string
}

/** 面包屑节点 */
export interface CrumbNode {
  index: number
  label: string
}

/** 所有图表共有的 props */
export interface ChartCommonProps {
  title?: string
  subtitle?: string
  description?: string
  className?: string
  unit?: string
  loading?: boolean
  emptyText?: string
  showTitle?: boolean
  formatValue?: (v: number) => string
}

/** 带坐标轴的图表 props（line / bar / radar） */
export interface AxisChartProps extends ChartCommonProps {
  showLabel?: boolean
  showAxis?: boolean
  showGrid?: boolean
}

/** 事件命名：React 版 onXxx → Vue 版统一 emit 为 kebab-case */
export interface ChartEmits {
  (e: 'point-click', item: ChartPoint & Record<string, any>, index: number): void
}
export interface DrillEmits extends ChartEmits {
  (e: 'level-change', level: number, path: CrumbNode[]): void
}

/* ================================ 通用容器 / 工具 ================================ */

export declare const ChartCard: DefineComponent<{
  title?: string
  subtitle?: string
  description?: string
  className?: string
  bodyClassName?: string
  showTitle?: boolean
}, {}, any>

export declare const ChartHeader: DefineComponent<{
  title?: string
  subtitle?: string
  description?: string
  showTitle?: boolean
}, {}, any>

export declare const ChartEmpty: DefineComponent<{ text?: string }, {}, any>
export declare const ChartSkeleton: DefineComponent<{ height?: number }, {}, any>
export declare const Tooltip: DefineComponent<{ x: number; y: number; vbW: number; vbH: number }, {}, any>
export declare const LegendList: DefineComponent<{ items?: LegendItem[]; hover?: number }, {}, any>
export declare const ChartTypeSwitch: DefineComponent<{ types?: string[]; value?: string; className?: string }, {}, any>

export declare const ChartLineIcon: DefineComponent<Record<string, any>, {}, any>
export declare const ChartBarIcon: DefineComponent<Record<string, any>, {}, any>
export declare const ChartPieIcon: DefineComponent<Record<string, any>, {}, any>
export declare const ChartAreaIcon: DefineComponent<Record<string, any>, {}, any>
export declare const ChartRadarIcon: DefineComponent<Record<string, any>, {}, any>

/* ================================ 工具函数 / 常量 ================================ */

/** 入场动画触发器：挂载后下一帧返回 true */
export declare function useMounted(): Ref<boolean>
/** 取一个近似步长（nice number） */
export declare function niceNum(x: number): number
/** 计算坐标轴友好的上下界与步长 */
export declare function niceBounds(
  min: number, max: number, ticks?: number,
): { niceMin: number; niceMax: number; step: number }
/** 极坐标转笛卡尔（SVG y 向下：0°=右，90°=下，-90°=上） */
export declare function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number }

export declare const PALETTE: string[]
export declare const DEFAULT_FORMAT: (v: number) => string
export declare const DEFAULT_ICON_MAP: Record<string, any>
export declare const DEFAULT_LABEL_MAP: Record<string, string>
export declare const SWITCHABLE_TYPES: string[]

/* ================================ 单系列基础图表 ================================ */

export declare const LineChart: DefineComponent<AxisChartProps & {
  data?: ChartPoint[]
  height?: number
  color?: string
  legend?: boolean
}, {}, any>

export declare const BarChart: DefineComponent<AxisChartProps & {
  data?: ChartPoint[]
  height?: number
  color?: string
  legend?: boolean
}, {}, any>

export declare const PieChart: DefineComponent<ChartCommonProps & {
  data?: ChartPoint[]
  size?: number
  palette?: string[]
  legend?: boolean
  showLabel?: boolean
}, {}, any>

export declare const GaugeChart: DefineComponent<ChartCommonProps & {
  value?: number
  max?: number
  size?: number
  color?: string
  label?: string
}, {}, any>

export declare const RadarChart: DefineComponent<AxisChartProps & {
  data?: ChartPoint[]
  size?: number
  color?: string
}, {}, any>

/* ================================ 多维 / 二级图表 ================================ */

export declare const MultiLineChart: DefineComponent<ChartCommonProps & {
  series?: ChartSeries[]
  colors?: string[]
  height?: number
  showLabel?: boolean
  showLegend?: boolean
}, {}, any>

export declare const MultiBarChart: DefineComponent<ChartCommonProps & {
  series?: ChartSeries[]
  colors?: string[]
  height?: number
  showLabel?: boolean
  showLegend?: boolean
}, {}, any>

export declare const StackedBarChart: DefineComponent<ChartCommonProps & {
  series?: ChartSeries[]
  colors?: string[]
  height?: number
  showLabel?: boolean
  showLegend?: boolean
}, {}, any>

export declare const MultiPieChart: DefineComponent<ChartCommonProps & {
  groups?: ChartGroup[]
  size?: number
  colors?: string[]
  showLabel?: boolean
  showLegend?: boolean
}, {}, any>

export declare const DrilledBarChart: DefineComponent<ChartCommonProps & {
  data?: ChartDrillNode[]
  height?: number
  colors?: string[]
  color?: string
  showLabel?: boolean
  showAxis?: boolean
  showGrid?: boolean
  showLegend?: boolean
}, {}, any>

export declare const NestedPieChart: DefineComponent<ChartCommonProps & {
  data?: ChartDrillNode[]
  size?: number
  colors?: string[]
  donut?: boolean
  showLabel?: boolean
  showLegend?: boolean
}, {}, any>

/** NestedPieChart 的同组件别名，语义更明确 */
export declare const DrilledPieChart: typeof NestedPieChart

/* ================================ 组合组件 ================================ */

export declare const SwitchableChart: DefineComponent<ChartCommonProps & {
  data?: ChartPoint[]
  types?: string[]
  defaultType?: string
  type?: string
  height?: number
  size?: number
  color?: string
  colors?: string[]
  showLabel?: boolean
  showAxis?: boolean
  showGrid?: boolean
  showLegend?: boolean
}, {}, any>
