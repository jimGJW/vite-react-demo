import { useCallback, useRef } from 'react'
import { useReducedMotion } from './useReducedMotion.js'

/**
 * 鼠标跟随的 3D 倾斜微交互（常用于卡片 / 头像 / 徽标）。
 * 自动尊重「减少动效」偏好；离开元素时复位。
 *
 * @example
 *   const { ref, onMouseMove, onMouseLeave } = useTilt({ max: 8 })
 *   <div ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>…</div>
 */
export function useTilt({ max = 10, scale = 1.03 } = {}) {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  const onMouseMove = useCallback(
    (e) => {
      if (reduced) return
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      el.style.transform = `perspective(800px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) scale(${scale})`
    },
    [max, scale, reduced],
  )

  const onMouseLeave = useCallback(() => {
    const el = ref.current
    if (el) el.style.transform = ''
  }, [])

  return { ref, onMouseMove, onMouseLeave }
}
