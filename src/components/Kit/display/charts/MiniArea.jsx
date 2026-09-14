import { useMemo, useRef } from 'react'
import { useEcharts } from './useEcharts.js'
import { AXIS_LINE, SPLIT_LINE, baseGrid, tooltipBase } from './chartBase.js'

/**
 * MiniArea · 迷你面积图
 * =====================================================================
 * 移植自 旧平板端项目 `components/Charts/MiniArea`（原实现基于 AntV G2），
 * 这里用 ECharts 6 重写：
 *   - G2 的 `forceFit` → ECharts 由容器决定尺寸 + ResizeObserver
 *   - G2 的 `view.area()` + `view2.line()` 双图层 → 单 series 的
 *     `areaStyle` + `lineStyle`，少一个图层
 *
 * 用法：
 *   <MiniArea data={[{ x: '1月', y: 12 }, ...]} height={60} />
 */

export default function MiniArea({
  data = [],
  height = 60,
  color = '#4f46e5',
  smooth = true,
  showAxis = false,
  showTooltip = true,
  opacity = 0.18,
  className = '',
}) {
  const elRef = useRef(null)

  const option = useMemo(
    () => ({
      animationDuration: 600,
      grid: baseGrid({
        left: showAxis ? 30 : 0,
        right: showAxis ? 6 : 0,
        top: showAxis ? 10 : 6,
        bottom: showAxis ? 20 : 0,
      }),
      tooltip: showTooltip ? tooltipBase() : { show: false },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.x),
        show: showAxis,
        boundaryGap: false,
        axisLine: AXIS_LINE,
        axisTick: { show: false },
        axisLabel: { fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        show: showAxis,
        scale: true,
        splitLine: SPLIT_LINE,
        axisLabel: { fontSize: 10 },
      },
      series: [
        {
          type: 'line',
          data: data.map((item) => item.y),
          smooth,
          symbol: 'none',
          lineStyle: { width: 2, color },
          areaStyle: { opacity, color },
        },
      ],
    }),
    [data, color, smooth, showAxis, showTooltip, opacity],
  )

  useEcharts(elRef, option)

  return <div ref={elRef} className={`kit-chart ${className}`} style={{ height }} />
}
