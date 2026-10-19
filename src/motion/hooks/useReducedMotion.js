import { useEffect, useState } from 'react'

/**
 * 监听系统「减少动效」偏好。返回 true 时，调用方应停用 JS 驱动的动画
 * （CSS 动画已由 motion.scss 的媒体查询统一降级）。
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener?.('change', sync)
    return () => mq.removeEventListener?.('change', sync)
  }, [])

  return reduced
}
