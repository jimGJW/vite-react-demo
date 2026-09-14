import { useEffect, useRef, useState } from 'react'
import { clamp } from '../utils.js'

/**
 * FloatingBall · 可拖拽悬浮球
 * =====================================================================
 * 移植自 旧移动端项目 `components/floatingBox/FloatingBox.js` —— 那份实现
 * 是本批组件里质量最高的一个，尤其「按比例持久化位置」这一点：
 * 记的不是 left/top 像素，而是 left / (屏宽 - 球宽) 的比值，
 * 于是换设备、转屏、窗口缩放后，球的位置仍然合理。
 *
 * 改造点：
 *   1. 原实现 touch 事件绑在 effect 里且依赖数组为 `[]`，
 *      但事件处理器闭包里读的是**首次渲染**的 fullDrag / space / startX，
 *      改 props 后失效（陈旧闭包 bug）。这里改用 pointer 事件 + React 合成
 *      事件，天然拿到最新 props
 *   2. touch* → pointer*，鼠标也能拖，桌面可直接调试
 *   3. `storage.homePos` 这个业务 key 改成 `storageKey` prop
 *   4. 补键盘可达性（可聚焦、回车/空格触发点击）
 *
 * 用法：
 *   <FloatingBall tooltip="回到顶部" onClick={() => scrollToTop()}>
 *     <ArrowUpOutlined />
 *   </FloatingBall>
 */

const BASE_Z_INDEX = 900

function readStored(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.rx === 'number' && typeof parsed?.ry === 'number') {
      return { rx: clamp(parsed.rx, 0, 1), ry: clamp(parsed.ry, 0, 1) }
    }
  } catch {
    /* 隐私模式 / 脏数据，忽略 */
  }
  return null
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

export default function FloatingBall({
  children,
  size = 52,
  edgeGap = 12,
  storageKey = 'kit.floating-ball',
  defaultRight = 24,
  defaultBottom = 96,
  draggable = true,
  clickThreshold = 4,
  tooltip,
  onClick,
  onPositionChange,
  className = '',
}) {
  const [viewport, setViewport] = useState(() => ({
    w: typeof window === 'undefined' ? 1280 : window.innerWidth,
    h: typeof window === 'undefined' ? 800 : window.innerHeight,
  }))

  const [pos, setPos] = useState(() => {
    const stored = readStored(storageKey)
    if (stored) return stored
    const w = typeof window === 'undefined' ? 1280 : window.innerWidth
    const h = typeof window === 'undefined' ? 800 : window.innerHeight
    const maxLeft = Math.max(1, w - size)
    const maxTop = Math.max(1, h - size)
    return {
      rx: clamp((w - defaultRight - size) / maxLeft, 0, 1),
      ry: clamp((h - defaultBottom - size) / maxTop, 0, 1),
    }
  })

  const [dragging, setDragging] = useState(false)
  const [zIndex, setZIndex] = useState(BASE_Z_INDEX)
  const dragRef = useRef(null)
  // 触摸置顶用的自增层级。放在 ref 里而不是模块级变量，
  // 否则「组件外变量在渲染期被改写」会触发 react-hooks/globals
  const zRef = useRef(BASE_Z_INDEX)

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const maxLeft = Math.max(1, viewport.w - size)
  const maxTop = Math.max(1, viewport.h - size)
  const left = clamp(pos.rx * maxLeft, 0, maxLeft)
  const top = clamp(pos.ry * maxTop, 0, maxTop)

  const bringToFront = () => {
    zRef.current += 1
    setZIndex(zRef.current)
  }

  const handlePointerDown = (event) => {
    if (!draggable) return
    event.preventDefault()
    bringToFront()
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originLeft: left,
      originTop: top,
      moved: false,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDragging(true)
  }

  const handlePointerMove = (event) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (!drag.moved && Math.hypot(dx, dy) < clickThreshold) return
    drag.moved = true
    const nextLeft = clamp(drag.originLeft + dx, 0, maxLeft)
    const nextTop = clamp(drag.originTop + dy, 0, maxTop)
    setPos({ rx: nextLeft / maxLeft, ry: nextTop / maxTop })
  }

  const handlePointerUp = (event) => {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    setDragging(false)

    if (!drag.moved) {
      onClick?.(event)
      return
    }

    // 松手吸附到左右最近边
    const centerX = left + size / 2
    const snappedLeft = centerX < viewport.w / 2 ? edgeGap : viewport.w - size - edgeGap
    const finalLeft = clamp(snappedLeft, 0, maxLeft)
    const next = { rx: finalLeft / maxLeft, ry: clamp(top / maxTop, 0, 1) }
    setPos(next)
    writeStored(storageKey, next)
    onPositionChange?.({ left: Math.round(finalLeft), top: Math.round(top) })
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick?.(event)
    }
  }

  return (
    <button
      type="button"
      className={`kit-ball ${dragging ? 'kit-ball--dragging' : ''} ${className}`}
      style={{ left: `${Math.round(left)}px`, top: `${Math.round(top)}px`, width: size, height: size, zIndex }}
      title={tooltip}
      aria-label={tooltip || '悬浮球'}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      <span className="kit-ball__inner">{children}</span>
    </button>
  )
}
