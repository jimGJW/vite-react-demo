import { useCallback, useMemo, useRef, useState } from 'react'
import { Button, Space, Tag, Typography } from 'antd'
import { useChart } from './useChart.js'

const { Text } = Typography

/**
 * AxisBreakBar · 断轴柱状图
 * =====================================================================
 * 移植自存量监控中台里的 `EChartsBarWithAxisBreak`。这是一个少见的能力：
 * 同一组指标里既有「个位数」又有「上万」，普通单轴柱状图会把小值压成一条线。
 * 解决办法是把低值系列挪到次 Y 轴，并在主 Y 轴的中段**折叠掉一段空白区间**
 * （ECharts 6 的 `yAxis.breaks`），让高低值同屏且都可读。
 *
 * 原实现用 `getZr().on('mousedown/mousemove')` + `echarts.graphic.Rect` 手写
 * 框选，代码量大且要自己处理像素↔数据换算。这里改用 ECharts 内置的
 * `brush`（`brushType: 'lineY'`）——同样的「横向拖拽选一条 Y 区间」交互，
 * 但坐标换算交给图表本身，代码量下降一个量级。
 *
 * 用法：
 *   <AxisBreakBar categories={months} values={amounts} unit="万" threshold={100} />
 *
 * 交互：横向拖拽图表 → 把选中的 Y 区间折叠成断轴；点「重置断轴」恢复。
 */

export default function AxisBreakBar({
  categories = [],
  values = [],
  threshold,
  height = 300,
  unit = '',
  title,
  autoBreak = true,
  maxBreaks = 3,
  className = '',
}) {
  const elRef = useRef(null)
  const chartRef = useRef(null)
  const [userBreaks, setUserBreaks] = useState([])

  /** 高低值分组 + 自动断轴区间 */
  const { low, high, autoBreaks } = useMemo(() => {
    const nums = values.filter((v) => typeof v === 'number' && Number.isFinite(v))
    if (nums.length === 0) {
      return { low: [], high: [], autoBreaks: [] }
    }
    const min = Math.min(...nums)
    const max = Math.max(...nums)
    const cut = typeof threshold === 'number' ? threshold : (min + max) / 2

    const lowArr = values.map((v) => (typeof v === 'number' && v < cut ? v : '-'))
    const highArr = values.map((v) => (typeof v === 'number' && v >= cut ? v : '-'))

    const lows = nums.filter((v) => v < cut)
    const highs = nums.filter((v) => v >= cut)
    const lowMax = lows.length ? Math.max(...lows) : null
    const highMin = highs.length ? Math.min(...highs) : null

    const auto =
      lowMax != null && highMin != null && highMin > lowMax
        ? [{ start: lowMax, end: highMin, gap: '2%' }]
        : []

    return { low: lowArr, high: highArr, autoBreaks: auto }
  }, [values, threshold])

  const breaks = useMemo(() => {
    const all = (autoBreak ? autoBreaks : []).concat(userBreaks)
    return all.slice(0, maxBreaks)
  }, [autoBreak, autoBreaks, userBreaks, maxBreaks])

  /** 框选结束 → 追加一条断轴（解析失败时静默忽略，不影响自动断轴） */
  const handleBrushEnd = useCallback((params) => {
    const area = params?.areas?.[0]
    if (!area) return

    let lo
    let hi
    const coord = area.coordRange
    if (Array.isArray(coord) && coord.length === 2) {
      lo = coord[0]?.[1]
      hi = coord[1]?.[1]
    } else if (Array.isArray(area.range) && area.range.length === 2) {
      ;[lo, hi] = area.range
    }
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return

    const start = Math.min(lo, hi)
    const end = Math.max(lo, hi)
    if (end - start <= 0) return

    setUserBreaks((prev) => prev.concat({ start, end, gap: '2%' }))
    // 清空框选遮罩，避免与断轴视觉重复；放到下一帧避免重入
    setTimeout(() => chartRef.current?.dispatchAction({ type: 'brush', command: 'clear', areas: [] }), 0)
  }, [])

  const option = useMemo(
    () => ({
      animationDuration: 420,
      grid: { left: 58, right: 62, top: title ? 46 : 22, bottom: 30 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (v) => (v === '-' || v == null ? '—' : `${v}${unit}`),
      },
      brush: {
        brushType: 'lineY',
        brushMode: 'single',
        transformable: false,
        throttleType: 'debounce',
        throttleDelay: 240,
      },
      xAxis: { type: 'category', data: categories, axisTick: { alignWithLabel: true } },
      yAxis: [
        {
          type: 'value',
          name: '高值区间',
          nameTextStyle: { color: '#8c8c8c' },
          breaks,
          axisLabel: { formatter: `{value}${unit}` },
        },
        {
          type: 'value',
          name: '低值区间',
          nameTextStyle: { color: '#8c8c8c' },
          splitLine: { show: false },
          axisLabel: { formatter: `{value}${unit}` },
        },
      ],
      series: [
        {
          name: '低值',
          type: 'bar',
          yAxisIndex: 1,
          barMaxWidth: 26,
          barGap: '-100%',
          itemStyle: { color: '#8b9dc3', borderRadius: [3, 3, 0, 0] },
          data: low,
        },
        {
          name: '高值',
          type: 'bar',
          yAxisIndex: 0,
          barMaxWidth: 26,
          itemStyle: { color: '#1677ff', borderRadius: [3, 3, 0, 0] },
          data: high,
        },
      ],
    }),
    [categories, low, high, breaks, unit, title],
  )

  useChart(elRef, option, {
    onEvents: useMemo(() => ({ brushEnd: handleBrushEnd }), [handleBrushEnd]),
    onReady: useCallback((chart) => {
      chartRef.current = chart
    }, []),
  })

  const reset = () => {
    setUserBreaks([])
    chartRef.current?.dispatchAction({ type: 'brush', command: 'clear', areas: [] })
  }

  return (
    <div className={`st-axisbreak ${className}`}>
      {(title || breaks.length > 0) && (
        <div className="st-axisbreak__bar">
          {title != null && <Text strong>{title}</Text>}
          <Space size={6}>
            <Tag color={breaks.length ? 'processing' : 'default'}>断轴 {breaks.length}</Tag>
            <Button size="small" onClick={reset} disabled={userBreaks.length === 0}>
              重置断轴
            </Button>
          </Space>
        </div>
      )}
      <div ref={elRef} className="st-axisbreak__canvas" style={{ height }} />
      <div className="st-axisbreak__hint">在图上横向拖拽可选择要折叠的数值区间</div>
    </div>
  )
}
