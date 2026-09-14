import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

/**
 * useChart · Studio 内部图表生命周期
 * =====================================================================
 * 与 Kit 的 `useEcharts` 同源，多一个 `onReady(chart)` 回调：断轴柱状图需要
 * 在事件里调用 `chart.dispatchAction` 清空框选，因此必须能拿到实例。
 *
 * **实例不通过返回值暴露**——把 ref 放进返回对象会被 `react-hooks/refs`
 * 判为「渲染期读取 ref」。改由调用方在自己的 ref 里接管，符合本项目约定。
 */

export function useChart(elRef, option, { onEvents, onReady, notMerge = false } = {}) {
  const chartRef = useRef(null)
  const eventsRef = useRef(onEvents)
  const readyRef = useRef(onReady)

  useEffect(() => {
    eventsRef.current = onEvents
    readyRef.current = onReady
  })

  useEffect(() => {
    const el = elRef.current
    if (!el) return undefined

    const chart = echarts.init(el)
    chartRef.current = chart

    const bound = Object.keys(eventsRef.current || {}).map((name) => {
      const handler = (params) => eventsRef.current?.[name]?.(params)
      chart.on(name, handler)
      return { name, handler }
    })

    readyRef.current?.(chart)

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
  }, [elRef])

  useEffect(() => {
    chartRef.current?.setOption(option, notMerge)
  }, [option, notMerge])
}
