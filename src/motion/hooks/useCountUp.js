import { useEffect, useRef, useState } from 'react'

/**
 * 数字滚动增长动画（用于统计卡 / KPI 数字）。
 * 减少动效偏好下直接显示终值，不跑动画。
 *
 * @param {number} target    目标数值
 * @param {Object} options
 * @param {number} options.duration 时长 ms（默认 1200）
 * @param {number} options.decimals 小数位（默认 0）
 * @param {boolean} options.start   是否开始（默认 true）
 */
export function useCountUp(target, { duration = 1200, decimals = 0, start = true } = {}) {
  const [value, setValue] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!start) return
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setValue(target)
      return
    }
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      setValue(Number((target * eased).toFixed(decimals)))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration, decimals, start])

  return value
}
