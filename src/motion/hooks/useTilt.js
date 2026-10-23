import { useEffect, useRef } from 'react'
import { useReducedMotion } from './useReducedMotion.js'

/**
 * 鼠标跟随的 3D 倾斜微交互（常用于卡片 / 头像 / 徽标）。
 *
 * 直接返回 ref，监听器在 effect 内自绑，调用方只需：
 *   const tiltRef = useTilt({ max: 8 })
 *   <div ref={tiltRef} className="m-tilt">…</div>
 *
 * 为什么不返回 onMouseMove/onMouseLeave：那样每个调用点都要把三个字段搬进
 * JSX，而返回对象里夹着 ref，会被 React Compiler 的 refs 规则判成
 * 「渲染期访问 ref」；自绑监听也让高频 pointermove 能在内部用 rAF 合并。
 *
 * 自动尊重「减少动效」偏好；卸载 / 关闭动效时复位 transform。
 *
 * @param {{ max?: number, scale?: number }} [options] max：最大倾角（度），scale：悬停放大倍数
 * @returns {import('react').RefObject<HTMLElement|null>}
 */
export function useTilt({ max = 10, scale = 1.03 } = {}) {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return undefined

    let frame = 0
    const onMove = (e) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const rect = el.getBoundingClientRect()
        if (!rect.width || !rect.height) return
        const px = (e.clientX - rect.left) / rect.width - 0.5
        const py = (e.clientY - rect.top) / rect.height - 0.5
        el.style.transform =
          `perspective(800px) rotateX(${(-py * max).toFixed(2)}deg)` +
          ` rotateY(${(px * max).toFixed(2)}deg) scale(${scale})`
      })
    }
    const reset = () => {
      cancelAnimationFrame(frame)
      frame = 0
      el.style.transform = ''
    }

    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', reset)
    el.addEventListener('blur', reset)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', reset)
      el.removeEventListener('blur', reset)
      el.style.transform = ''
    }
  }, [max, scale, reduced])

  return ref
}
