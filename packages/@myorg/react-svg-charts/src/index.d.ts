import * as React from 'react'

/* ================================ 通用类型 ================================ */

export interface LegendItem {
  label: React.ReactNode
  value?: React.ReactNode
  pct?: React.ReactNode
  color?: string
}

export interface ChartPointBase {
  label: string
  value: number
  color?: string
  [key: string]: any
}

/* ================================ 通用容器 / 工具 ================================ */

export declare const ChartCard: React.FC<{
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
  bodyClassName?: string
  showTitle?: boolean
}>

export declare const ChartEmpty: React.FC<{ text?: React.ReactNode }>
export declare const ChartSkeleton: React.FC<{ height?: number | string }>

export declare function ChartHeader(props: {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  showTitle?: boolean
}): JSX.Element

export declare function Tooltip(props: {
  x: number; y: number; vbW: number; vbH: number;
  children: React.ReactNode; className?: string;
}): JSX.Element

export declare function LegendList(props: {
  items: LegendItem[]
  hover?: number
  onHover?: (i: number) => void
}): JSX.Element

/* 图表类型切换图标按钮组 */
export declare const ChartLineIcon: React.FC<React.SVGProps<SVGSVGElement>>
export declare const ChartBarIcon: React.FC<React.SVGProps<SVGSVGElement>>
export declare const ChartPieIcon: React.FC<React.SVGProps<SVGSVGElement>>
export declare const ChartAreaIcon: React.FC<React.SVGProps<SVGSVGElement>>
export declare const ChartRadarIcon: React.FC<React.SVGProps<SVGSVGElement>>

export type ChartTypeKey = 'line' | 'bar' | 'pie' | 'area' | 'radar' | string
export declare function ChartTypeSwitch(props: {
  types?: readonly ChartTypeKey[]
  value: ChartTypeKey
  onChange: (t: ChartTypeKey) => void
  iconMap?: Record<ChartTypeKey, React.ComponentType<React.SVGProps<SVGSVGElement>>>
  labelMap?: Record<ChartTypeKey, string>
  className?: string
}): JSX.Element

/* 常量 */
export declare const PALETTE: readonly string[]
export declare const DEFAULT_FORMAT: (v: any) => string

/* ================================ 基础单系列图表 ================================ */

export declare const LineChart: React.FC<{
  data?: readonly ChartPointBase[]
  height?: number
  color?: string
  colors?: readonly string[]
  formatValue?: (v: any) => string
  unit?: string
  className?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  emptyText?: React.ReactNode
  loading?: boolean
  legend?: boolean
  onPointClick?: (item: ChartPointBase, index: number) => void
  showLabel?: boolean
  showAxis?: boolean
  showGrid?: boolean
  showTitle?: boolean
}>

export declare const BarChart: React.FC<{
  data?: readonly ChartPointBase[]
  height?: number
  color?: string
  colors?: readonly string[]
  formatValue?: (v: any) => string
  unit?: string
  className?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  emptyText?: React.ReactNode
  loading?: boolean
  legend?: boolean
  onPointClick?: (item: ChartPointBase, index: number) => void
  showLabel?: boolean
  showAxis?: boolean
  showGrid?: boolean
  showTitle?: boolean
}>

export declare const PieChart: React.FC<{
  data?: readonly ChartPointBase[]
  size?: number
  colors?: readonly string[]
  formatValue?: (v: any) => string
  unit?: string
  className?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  emptyText?: React.ReactNode
  loading?: boolean
  onPointClick?: (item: ChartPointBase, index: number) => void
  showLabel?: boolean
  showLegend?: boolean
  showTitle?: boolean
}>

export declare const GaugeChart: React.FC<{
  value?: number
  max?: number
  size?: number
  color?: string
  colors?: readonly string[]
  label?: React.ReactNode
  formatValue?: (v: any) => string
  unit?: string
  className?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  loading?: boolean
  showTitle?: boolean
}>

export declare const RadarChart: React.FC<{
  data?: readonly (ChartPointBase & { max?: number })[]
  size?: number
  color?: string
  colors?: readonly string[]
  formatValue?: (v: any) => string
  unit?: string
  className?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  emptyText?: React.ReactNode
  loading?: boolean
  legend?: boolean
  onPointClick?: (item: ChartPointBase & { max?: number }, index: number) => void
  showLabel?: boolean
  showAxis?: boolean
  showGrid?: boolean
  showTitle?: boolean
}>

/* ================================ 多维图表 ================================ */

export interface MultiSeries {
  name: string
  color?: string
  data: readonly ChartPointBase[]
}

export declare const MultiLineChart: React.FC<{
  series?: readonly MultiSeries[]
  height?: number
  colors?: readonly string[]
  formatValue?: (v: any) => string
  unit?: string
  className?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  emptyText?: React.ReactNode
  loading?: boolean
  legend?: boolean
  onPointClick?: (item: ChartPointBase & { seriesName?: string }, index: number) => void
  showLabel?: boolean
  showAxis?: boolean
  showGrid?: boolean
  showTitle?: boolean
}>

export declare const MultiBarChart: React.FC<{
  series?: readonly MultiSeries[]
  height?: number
  colors?: readonly string[]
  formatValue?: (v: any) => string
  unit?: string
  className?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  emptyText?: React.ReactNode
  loading?: boolean
  legend?: boolean
  onPointClick?: (item: ChartPointBase & { seriesName?: string }, index: number) => void
  showLabel?: boolean
  showAxis?: boolean
  showGrid?: boolean
  showTitle?: boolean
}>

export declare const StackedBarChart: React.FC<{
  series?: readonly MultiSeries[]
  height?: number
  colors?: readonly string[]
  formatValue?: (v: any) => string
  unit?: string
  className?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  emptyText?: React.ReactNode
  loading?: boolean
  legend?: boolean
  onPointClick?: (item: ChartPointBase & { seriesName?: string }, index: number) => void
  showLabel?: boolean
  showAxis?: boolean
  showGrid?: boolean
  showTitle?: boolean
}>

export interface PieGroup {
  name: string
  data: readonly ChartPointBase[]
}

export declare const MultiPieChart: React.FC<{
  groups?: readonly PieGroup[]
  size?: number
  colors?: readonly string[]
  formatValue?: (v: any) => string
  unit?: string
  className?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  emptyText?: React.ReactNode
  loading?: boolean
  legend?: boolean
  onPointClick?: (item: ChartPointBase & { groupName?: string }, index: number) => void
  showLabel?: boolean
  showTitle?: boolean
}>

/* ================================ 二级 / 钻取图表 ================================ */

export interface DrilledBarPoint extends ChartPointBase {
  children?: readonly ChartPointBase[]
}

export declare const DrilledBarChart: React.FC<{
  data?: readonly DrilledBarPoint[]
  height?: number
  colors?: readonly string[]
  color?: string
  formatValue?: (v: any) => string
  unit?: string
  className?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  emptyText?: React.ReactNode
  loading?: boolean
  showLabel?: boolean
  showAxis?: boolean
  showGrid?: boolean
  showLegend?: boolean
  showTitle?: boolean
  onPointClick?: (item: DrilledBarPoint & { level: number; parentLabel?: string }, index: number) => void
  onLevelChange?: (level: number, path: readonly { index: number; label: string }[]) => void
}>

export interface DrilldownPiePoint extends ChartPointBase {
  children?: readonly ChartPointBase[]
}

export declare const NestedPieChart: React.FC<{
  data?: readonly DrilldownPiePoint[]
  size?: number
  colors?: readonly string[]
  donut?: boolean
  formatValue?: (v: any) => string
  unit?: string
  className?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  emptyText?: React.ReactNode
  loading?: boolean
  showLabel?: boolean
  showLegend?: boolean
  showTitle?: boolean
  onPointClick?: (item: DrilldownPiePoint & { level: number; parentLabel?: string }, index: number) => void
  onLevelChange?: (level: number, path: readonly { index: number; label: string }[]) => void
}>

/** 同 NestedPieChart，语义别名（更贴近「二级饼图 Drill-down」）。 */
export declare const DrilledPieChart: typeof NestedPieChart

/* ================================ 图标切换组合组件 ================================ */

export type SwitchableType = 'line' | 'bar' | 'pie' | 'radar'

export declare const SwitchableChart: React.FC<{
  data?: readonly (ChartPointBase & { max?: number })[]
  types?: readonly SwitchableType[]
  defaultType?: SwitchableType
  type?: SwitchableType
  onTypeChange?: (t: SwitchableType) => void
  onSwitch?: (t: SwitchableType, data: readonly ChartPointBase[]) => void
  height?: number
  size?: number
  color?: string
  colors?: readonly string[]
  formatValue?: (v: any) => string
  unit?: string
  className?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  emptyText?: React.ReactNode
  loading?: boolean
  showLabel?: boolean
  showAxis?: boolean
  showGrid?: boolean
  showLegend?: boolean
  showTitle?: boolean
  onPointClick?: (item: ChartPointBase, index: number) => void
}>

export declare const SWITCHABLE_TYPES: readonly SwitchableType[]
