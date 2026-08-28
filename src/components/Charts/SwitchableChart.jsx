import { useMemo, useState, useId } from 'react'
import {
  useMounted, ChartEmpty, ChartSkeleton, ChartHeader,
  ChartTypeSwitch, PALETTE, DEFAULT_FORMAT,
} from './shared.jsx'
import LineChart from './LineChart.jsx'
import BarChart from './BarChart.jsx'
import PieChart from './PieChart.jsx'
import RadarChart from './RadarChart.jsx'

const SUPPORTED_TYPES = ['line', 'bar', 'pie', 'radar']

/**
 * SwitchableChart · 图标切换 折线图 / 柱状图 / 饼图 / 雷达图 等。
 *
 * - 同一份统一数据 `data: [{ label, value, max?, color? }]`，点击 ChartHeader 右上角的 SVG 小图标按钮即可来回切换显示类型。
 * - 雷达图要求每项带 `max`（可省略，默认取所有 value 的最大值 * 1.1）。
 * - 颜色可传入 `color`（单色统一，line/bar/radar 常用）或 `colors`（数组，pie 多色、或覆盖各点颜色）。
 * - 切换类型时会根据 key 重放各底层图表的入场动画。
 *
 * @param {Object} props
 * @param {Array<{label:string,value:number,max?:number,color?:string}>} [props.data=[]] 统一格式的数据
 * @param {string[]} [props.types=['line','bar','pie']] 允许切换的类型列表（顺序即图标按钮顺序）
 * @param {string}   [props.defaultType='line'] 初始显示类型
 * @param {string}   [props.type]  受控传入时优先使用（受控模式）
 * @param {(t:string)=>void} [props.onTypeChange] 类型变化回调
 * @param {number} [props.height=300] line/bar/radar 高度
 * @param {number} [props.size=300]   pie 尺寸
 * @param {string} [props.color]  单色（line/bar/radar 常用，优先级最高）
 * @param {string[]} [props.colors=PALETTE] 颜色池（pie 多色，或 data[i].color 兜底）
 * @param {boolean} [props.showLabel=false] 数据标签（line/bar 顶部数值、pie 扇区百分比、radar 顶点数值）
 * @param {boolean} [props.showAxis=true]  line/bar 坐标轴标签
 * @param {boolean} [props.showGrid=true]  line/bar/radar 网格线
 * @param {boolean} [props.showLegend=false] 图例
 * @param {boolean} [props.showTitle=true]  标题区（图标切换器自动合并到 actions）
 * @param {(item:object,index:number)=>void} [props.onPointClick] 点击数据点/扇区回调
 * @param {(type:string, data:Array)=>void} [props.onSwitch]  切换完成回调
 * 其余通用参数：title/subtitle/description/actions/emptyText/loading/formatValue/unit/className
 */
export default function SwitchableChart({
  data = [],
  types = ['line', 'bar', 'pie'],
  defaultType = 'line',
  type: controlledType,
  onTypeChange,

  height = 300, size = 300,
  color, colors = PALETTE,

  formatValue = DEFAULT_FORMAT, unit = '', className = '',
  title, subtitle, description, actions, emptyText, loading = false,

  showLabel = false, showAxis = true, showGrid = true,
  showLegend = false, showTitle = true,

  onPointClick, onSwitch,
}) {
  const mounted = useMounted()
  const uid = useId()
  const [internalType, setInternalType] = useState(defaultType)
  const activeType = (controlledType || internalType)
  const safeType = types.includes(activeType) ? activeType : types[0] || defaultType

  // 处理类型切换
  const changeType = (t) => {
    if (t === safeType || !types.includes(t)) return
    setInternalType(t)
    onTypeChange && onTypeChange(t)
    onSwitch && onSwitch(t, data)
  }

  // 根据当前 safeType 自动把统一 data 适配为各底层组件的要求
  const adapted = useMemo(() => {
    const maxVal = Math.max(...data.map((d) => d.value), 0)
    const radarMax = Math.max(
      ...data.map((d) => (typeof d.max === 'number' && isFinite(d.max) ? d.max : Math.ceil(maxVal * 1.1 || 1))),
      1,
    )
    return {
      // LineChart / BarChart 直接接受 [{label, value}]
      base: data.map((d) => ({ label: d.label, value: d.value, color: d.color })),
      // PieChart 同 base
      pie: data.map((d) => ({ label: d.label, value: d.value, color: d.color })),
      // RadarChart 需要 [{label, value, max}]
      radar: data.map((d) => ({
        label: d.label,
        value: d.value,
        max: (typeof d.max === 'number' && isFinite(d.max)) ? d.max : radarMax,
        color: d.color,
      })),
    }
  }, [data])

  // 图标切换器 + 外部 actions 合并
  const mergedActions = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      {actions}
      <ChartTypeSwitch types={types} value={safeType} onChange={changeType} />
    </div>
  )

  const header = (
    <ChartHeader
      title={title} subtitle={subtitle} description={description}
      actions={mergedActions} showTitle={showTitle}
    />
  )

  if (loading) {
    return (
      <div className={`chart chart-switchable ${className}`}>
        {header}
        <ChartSkeleton height={safeType === 'pie' ? size : height} />
      </div>
    )
  }
  if (!data || data.length === 0) {
    return (
      <div className={`chart chart-switchable ${className}`}>
        {header}
        <ChartEmpty text={emptyText} />
      </div>
    )
  }

  const commonProps = {
    formatValue, unit,
    color: color || (safeType === 'pie' ? undefined : colors[0]),
    colors,
    loading: false,
    legend: showLegend,
    showLabel, showAxis, showGrid, showLegend,
    showTitle: false, // 外层 SwitchableChart 已统一显示 header
    onPointClick,
    className: `chart-switchable-inner`,
    __key: uid + '-' + safeType,
  }

  // 用 key 保证类型切换时重挂载各图表组件 -> 重放入场动画
  let inner = null
  switch (safeType) {
    case 'bar':
      inner = (
        <BarChart
          key={commonProps.__key + '-bar'}
          data={adapted.base} height={height}
          {...commonProps}
        />
      )
      break
    case 'pie':
      inner = (
        <PieChart
          key={commonProps.__key + '-pie'}
          data={adapted.pie} size={size}
          {...commonProps}
        />
      )
      break
    case 'radar':
      inner = (
        <RadarChart
          key={commonProps.__key + '-radar'}
          data={adapted.radar} size={size}
          {...commonProps}
        />
      )
      break
    case 'line':
    default:
      inner = (
        <LineChart
          key={commonProps.__key + '-line'}
          data={adapted.base} height={height}
          {...commonProps}
        />
      )
  }

  return (
    <div
      className={`chart chart-switchable ${className}`}
      data-active-type={safeType}
      aria-label={`当前图表类型：${safeType}`}
    >
      {header}
      {/* 仅当 mounted 后渲染内部图表，保证各底层组件 useMounted 入场动画正常 */}
      {mounted && inner}
    </div>
  )
}

// 导出支持的类型常量，方便外部引用
export { SUPPORTED_TYPES as SWITCHABLE_TYPES }
