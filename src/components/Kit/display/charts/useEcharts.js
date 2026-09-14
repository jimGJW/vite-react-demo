import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

/**
 * useEcharts · ECharts 实例生命周期
 * =====================================================================
 * 只做三件事，避免每个图表组件重复样板代码：
 *   1. 首次挂载 init，卸载时 dispose
 *   2. 用 ResizeObserver 替代 window.resize —— 容器尺寸变化
 *      （侧栏折叠、抽屉展开、栅格换行）也能自适应
 *   3. option 变化时 setOption
 *
 * 设计取舍：**不把 chart 实例返回给调用方**。
 * 返回 ref 会触发 react-hooks/refs 静态检查（渲染期读取 ref），
 * 且调用方通常在事件回调里才需要实例，用 options.onEvents 传事件更清爽。
 *
 * 调用方约定：
 *   - 容器元素必须**始终渲染**并给出确定高度。若按数据有无决定是否渲染容器，
 *     首次无数据时 elRef.current 为空、init 被跳过，后续有数据也不会重新 init
 *     （这正是原项目 LineChart 卡片「图永远画不出来」的根因）
 *   - option 必须用 useMemo 包一层，否则每次渲染都会 setOption
 */

export function useEcharts(elRef, option, { theme, onEvents, notMerge = false } = {}) {
  const chartRef = useRef(null)
  const onEventsRef = useRef(onEvents)

  useEffect(() => {
    onEventsRef.current = onEvents
  }, [onEvents])

  useEffect(() => {
    const el = elRef.current
    if (!el) return undefined

    const chart = echarts.init(el, theme)
    chartRef.current = chart

    const names = Object.keys(onEventsRef.current || {})
    const bound = names.map((name) => {
      const handler = (params) => onEventsRef.current?.[name]?.(params)
      chart.on(name, handler)
      return { name, handler }
    })

    const resize = () => chart.resize()
    let observer = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(resize)
      observer.observe(el)
    } else {
      window.addEventListener('resize', resize)
    }

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', resize)
      bound.forEach(({ name, handler }) => chart.off(name, handler))
      chart.dispose()
      chartRef.current = null
    }
  }, [elRef, theme])

  useEffect(() => {
    chartRef.current?.setOption(option, notMerge)
  }, [option, notMerge])
}
