import { useMemo, useRef } from 'react'
import { useEcharts } from './useEcharts.js'
import { AXIS_LINE, SPLIT_LINE, baseGrid, tooltipBase } from './chartBase.js'

/**
 * MiniBar · 迷你柱状图
 * =====================================================================
 * 移植自 旧平板端项目 `components/Charts/MiniBar`。原实现里有一行硬编码：
 *   chart.source(frame, { y: { min: 3.5 } })
 * 这是某个具体业务（评分分布）的特例，通用化时已删除，
 * 需要固定下界时传 `min`。
 *
 * 用法：
 *   <MiniBar data={[{ x: '一', y: 8 }, ...]} height={80} showLabel />
 */

export default function MiniBar({
  data = [],
  height = 80,
  color = '#4f46e5',
  showAxis = true,
  showLabel = false,
  showTooltip = true,
  min,
  className = '',
}) {
  const elRef = useRef(null)

  const option = useMemo(
    () => ({
      animationDuration: 600,
      grid: baseGrid({
        left: showAxis ? 30 : 0,
        right: 6,
        top: showLabel ? 20 : 10,
        bottom: showAxis ? 20 : 6,
      }),
      tooltip: showTooltip ? tooltipBase({ axisPointer: { type: 'shadow' } }) : { show: false },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.x),
        show: showAxis,
        axisLine: AXIS_LINE,
        axisTick: { show: false },
        axisLabel: { fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        show: showAxis,
        min,
        splitLine: SPLIT_LINE,
        axisLabel: { fontSize: 10 },
      },
      series: [
        {
          type: 'bar',
          data: data.map((item) => item.y),
          itemStyle: { color, borderRadius: [3, 3, 0, 0] },
          barMaxWidth: 22,
          label: { show: showLabel, position: 'top', fontSize: 10, color },
        },
      ],
    }),
    [data, color, showAxis, showLabel, showTooltip, min],
  )

  useEcharts(elRef, option)

  return <div ref={elRef} className={`kit-chart ${className}`} style={{ height }} />
}
