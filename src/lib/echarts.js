/**
 * ECharts 共享入口 —— 全项目唯一的 echarts 注册点（性能优化，2026-10-27）。
 *
 * 背景：此前 Kit 的 useEcharts / Studio 的 useChart / ChatBot 的 LineChart 各自
 * `import * as echarts from 'echarts'`，把全部图表类型 + 渲染器打进 vendor-echarts
 * （1.1MB）。改为 `echarts/core` 按需注册后仅包含实际用到的类型。
 *
 * 已注册的能力与用途（新增图表类型前先在这里补，别绕过本文件直接 import 'echarts'）：
 *   折线/柱状/饼/雷达/散点      —— Kit 迷你图与时间轴图、Studio 大屏断轴柱状、
 *                                  ChatBot 卡片折线、EChartsDemo
 *   Grid/Tooltip/AxisPointer    —— 坐标系与悬浮提示
 *   Title/Legend/DataZoom       —— 演示页标题图例、Kit TimelineChart 缩放
 *   MarkLine/Graphic/Toolbox    —— 标线、Studio ScanEmpty 自绘 graphic、演示页工具栏
 *   CanvasRenderer              —— 运行时渲染（按需 SVG 可再补）
 */
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart, RadarChart, ScatterChart } from 'echarts/charts'
import {
  AxisPointerComponent,
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  RadarComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
  AxisPointerComponent,
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  RadarComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  CanvasRenderer,
])

export default echarts
export { echarts }
