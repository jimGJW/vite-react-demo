/**
 * 折线图卡片（contentType = "echart"）
 * ===============================================================
 * 入参二选一：
 *   ① data   —— [[时间, 值], ...] / 纯数值数组 / [{ time, value }, ...]（单序列）
 *   ② series —— { x: string[], list: [{ name, values: number[] }] }（多序列，
 *               由 DataTable 切换图表视图时传入，可一次画出全部数值列）
 *
 * 附带「换个颜色」（7 色轮播）与「保存图片」。
 *
 * 注意：echarts.init 必须依赖「是否已有数据」，不能写成 deps: []。
 * 否则首帧无数据 → 不渲染 canvas 容器 → ref 为空 → 之后有数据时
 * 初始化 effect 不再执行，图表永远画不出来。
 */

import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Space } from 'antd'
import * as echarts from 'echarts'
import { FIELD_LABELS } from '../config.js'
import { toSeries } from './utils.js'

const PALETTE = ['#1677ff', '#722ed1', '#13c2c2', '#52c41a', '#faad14', '#eb2f96', '#fa541c']

export default memo(function LineChart({ data, title, series }) {
  const domRef = useRef(null)
  const chartRef = useRef(null)
  const [colorIdx, setColorIdx] = useState(0)

  /* 统一数据模型：{ x: [...], list: [{ name, values: [...] }] } */
  const model = useMemo(() => {
    if (Array.isArray(series?.list) && series.list.length) {
      return { x: series.x ?? [], list: series.list }
    }
    const points = toSeries(data)
    if (!points.length) return { x: [], list: [] }
    return {
      x: points.map((p) => p.name),
      list: [{ name: FIELD_LABELS[title] || title || '数值', values: points.map((p) => p.value) }],
    }
  }, [series, data, title])

  const hasData = model.list.length > 0 && model.x.length > 0
  const multi = model.list.length > 1
  const cardTitle = multi ? FIELD_LABELS[title] || title || '趋势' : model.list[0]?.name || '数值'

  /* 配色轮播：多序列时整体错位，让「换个颜色」一次换掉一整组 */
  const colors = useMemo(
    () => model.list.map((_, i) => PALETTE[(colorIdx + i) % PALETTE.length]),
    [model.list, colorIdx],
  )

  /* 初始化实例：依赖 hasData，保证有数据后一定会建图 */
  useEffect(() => {
    const el = domRef.current
    if (!hasData || !el) return undefined
    const chart = echarts.init(el)
    chartRef.current = chart

    let ro
    const onResize = () => chart.resize()
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize)
      ro.observe(el)
    } else {
      window.addEventListener('resize', onResize)
    }

    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', onResize)
      chart.dispose()
      chartRef.current = null
    }
  }, [hasData])

  /* 数据 / 配色变化时重绘 */
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    chart.setOption(
      {
        color: colors,
        tooltip: { trigger: 'axis' },
        legend: multi ? { top: 0, right: 8, itemWidth: 12, itemHeight: 8 } : undefined,
        grid: { left: 48, right: 20, top: multi ? 32 : 24, bottom: 32 },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: model.x,
          axisLabel: { hideOverlap: true, fontSize: 11 },
        },
        yAxis: { type: 'value', scale: true, axisLabel: { fontSize: 11 } },
        series: model.list.map((s) => ({
          name: s.name,
          type: 'line',
          smooth: true,
          showSymbol: model.x.length <= 30,
          symbolSize: 6,
          lineStyle: { width: 2 },
          areaStyle: multi ? undefined : { opacity: 0.12 },
          data: s.values,
        })),
      },
      true,
    )
  }, [model, colors, multi])

  if (!hasData) return <div className="cb-empty">暂无可绘制的数据</div>

  const saveImage = () => {
    const url = chartRef.current?.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' })
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `${cardTitle}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="cb-chart">
      <div className="cb-card__head">
        <span className="cb-card__title">{cardTitle}</span>
        <Space size={2}>
          <Button size="small" type="text" aria-label="换个颜色" onClick={() => setColorIdx((i) => i + 1)}>
            换个颜色
          </Button>
          <Button size="small" type="text" aria-label="保存图片" onClick={saveImage}>
            保存图片
          </Button>
        </Space>
      </div>
      <div ref={domRef} className="cb-chart__canvas" />
    </div>
  )
})
