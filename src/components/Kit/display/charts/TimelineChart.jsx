import { useMemo, useRef } from 'react'
import { useEcharts } from './useEcharts.js'
import { AXIS_LINE, SPLIT_LINE, tooltipBase } from './chartBase.js'

/**
 * TimelineChart · 双折线时间趋势（带时间轴缩放滑块）
 * =====================================================================
 * 移植自 旧平板端项目 `components/Charts/TimelineChart`（原实现基于 G2 +
 * `g2-plugin-slider`）。迁移到 ECharts 反而是**升级**：
 *   - G2 需要额外引一个 slider 插件、手写 domId，且 domId 用 Math.random()
 *     生成（React 19 严格模式下双调用会不一致）→ ECharts 的 `dataZoom`
 *     是内置能力，slider + inside 一次配好
 *   - 原实现用 timeCat 轴 + mask 'HH:MM' 格式化，ECharts 用 category 轴
 *     直接给标签即可
 *
 * 用法：
 *   <TimelineChart
 *     data={[{ x: '09:00', y1: 12, y2: 8 }, ...]}
 *     seriesNames={['入库', '出库']}
 *   />
 */

const LEGEND_COLOR = '#94a3b8'

export default function TimelineChart({
  data = [],
  height = 260,
  seriesNames = ['系列 A', '系列 B'],
  colors = ['#4f46e5', '#22d3ee'],
  smooth = true,
  showZoom = true,
  showLegend = true,
  className = '',
}) {
  const elRef = useRef(null)

  const option = useMemo(() => {
    const build = (index, key) => ({
      name: seriesNames[index] || `系列 ${index + 1}`,
      type: 'line',
      smooth,
      symbol: 'none',
      data: data.map((item) => item[key]),
      lineStyle: { width: 2, color: colors[index] },
      itemStyle: { color: colors[index] },
      areaStyle: { opacity: 0.08, color: colors[index] },
    })

    return {
      animationDuration: 700,
      grid: {
        left: 46,
        right: 18,
        top: showLegend ? 36 : 14,
        bottom: showZoom ? 56 : 26,
      },
      legend: showLegend
        ? {
            top: 0,
            itemWidth: 10,
            itemHeight: 10,
            textStyle: { fontSize: 11, color: LEGEND_COLOR },
          }
        : { show: false },
      tooltip: tooltipBase(),
      xAxis: {
        type: 'category',
        data: data.map((item) => item.x),
        boundaryGap: false,
        axisLine: AXIS_LINE,
        axisTick: { show: false },
        axisLabel: { fontSize: 10, color: LEGEND_COLOR },
      },
      yAxis: {
        type: 'value',
        splitLine: SPLIT_LINE,
        axisLabel: { fontSize: 10, color: LEGEND_COLOR },
      },
      ...(showZoom
        ? {
            dataZoom: [
              { type: 'inside' },
              { type: 'slider', height: 16, bottom: 8, borderColor: 'transparent' },
            ],
          }
        : {}),
      series: [build(0, 'y1'), build(1, 'y2')],
    }
  }, [data, seriesNames, colors, smooth, showZoom, showLegend])

  useEcharts(elRef, option)

  return <div ref={elRef} className={`kit-chart ${className}`} style={{ height }} />
}
