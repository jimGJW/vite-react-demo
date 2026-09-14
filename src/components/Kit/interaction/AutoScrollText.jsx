import { useEffect, useRef, useState } from 'react'

/**
 * AutoScrollText · 超宽跑马灯
 * =====================================================================
 * 移植自 旧移动端项目 `components/xautoscroll`。原实现只有 21 行，两个问题：
 *   1. `useEffect` **没有依赖数组**，每次渲染都重新测量并重复加 class
 *   2. 用 `position: absolute` 承载内容，强制要求父容器 position: relative
 *
 * 这里改为：容器不滚动，内部 span 用 transform 位移；只有内容宽度真的超出
 * 容器时才启动动画，否则保持静态（避免短文本也在晃）。
 * 滚动速度可控，动画时长 = 超出的像素 / speed，因此长文本不会滚得更快。
 *
 * 用法：
 *   <AutoScrollText text="很长的标题……" speed={60} />
 */

export default function AutoScrollText({
  text,
  speed = 60,
  gap = 48,
  className = '',
}) {
  const wrapRef = useRef(null)
  const innerRef = useRef(null)
  const [shift, setShift] = useState(0)

  useEffect(() => {
    const wrap = wrapRef.current
    const inner = innerRef.current
    if (!wrap || !inner) return undefined

    let raf = 0
    const measure = () => {
      const overflow = inner.scrollWidth - wrap.clientWidth
      setShift(overflow > 4 ? overflow + gap : 0)
    }
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }

    schedule()

    if (typeof ResizeObserver === 'undefined') return () => cancelAnimationFrame(raf)

    const observer = new ResizeObserver(schedule)
    observer.observe(wrap)
    observer.observe(inner)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [text, gap])

  const running = shift > 0

  return (
    <div
      className={`kit-marquee ${className}`}
      ref={wrapRef}
      title={typeof text === 'string' ? text : undefined}
    >
      <span
        ref={innerRef}
        className={`kit-marquee__inner ${running ? 'is-running' : ''}`}
        style={
          running
            ? { '--kit-marquee-shift': `${shift}px`, animationDuration: `${shift / speed}s` }
            : undefined
        }
      >
        {text}
      </span>
    </div>
  )
}
