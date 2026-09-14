import { useEffect, useRef, useState } from 'react'

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/**
 * 自由拖拽 + 缩放布局：卡片以百分比定位，可拖动移动、拖角缩放，落位自动限制在容器内。
 * 思路来自某大屏搭建项目的自由拖拽布局，去 dva / ReactDOM.render 重写。
 * 适合做轻量「低代码仪表盘」或可视化编辑场景。
 */
export default function DragLayout({ items = [], editable = true, gap = 8, onLayoutChange }) {
  const [cards, setCards] = useState(() => items.map((c) => ({ ...c })))
  const containerRef = useRef(null)
  const dragRef = useRef(null)
  const sizeRef = useRef({ w: 0, h: 0 })
  const cardsRef = useRef(cards)
  const onLayoutRef = useRef(onLayoutChange)

  useEffect(() => {
    cardsRef.current = cards
  }, [cards])
  useEffect(() => {
    onLayoutRef.current = onLayoutChange
  }, [onLayoutChange])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined
    const measure = () => {
      sizeRef.current = { w: el.clientWidth, h: el.clientHeight }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const move = (e) => {
      const d = dragRef.current
      if (!d) return
      const rect = d.rect
      const dx = ((e.clientX - d.startX) / rect.width) * 100
      const dy = ((e.clientY - d.startY) / rect.height) * 100
      setCards((cs) =>
        cs.map((c) => {
          if (c.id !== d.id) return c
          if (d.mode === 'move') {
            return {
              ...c,
              x: clamp(d.orig.x + dx, 0, 100 - d.orig.w),
              y: clamp(d.orig.y + dy, 0, 100 - d.orig.h),
            }
          }
          return {
            ...c,
            w: clamp(d.orig.w + dx, 10, 100 - d.orig.x),
            h: clamp(d.orig.h + dy, 10, 100 - d.orig.y),
          }
        }),
      )
    }
    const up = () => {
      if (dragRef.current) {
        dragRef.current = null
        onLayoutRef.current?.(cardsRef.current)
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  const begin = (e, id, mode) => {
    if (!editable) return
    e.preventDefault()
    const rect = containerRef.current.getBoundingClientRect()
    const card = cards.find((c) => c.id === id)
    dragRef.current = {
      id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      rect,
      orig: { x: card.x, y: card.y, w: card.w, h: card.h },
    }
  }

  return (
    <div className="st-draglayout" ref={containerRef} style={{ '--st-gap': `${gap}px` }}>
      {cards.map((c) => (
        <div
          key={c.id}
          className="st-draglayout__card"
          style={{ left: `${c.x}%`, top: `${c.y}%`, width: `${c.w}%`, height: `${c.h}%` }}
        >
          <div
            className="st-draglayout__head"
            onPointerDown={(e) => begin(e, c.id, 'move')}
            style={{ cursor: editable ? 'move' : 'default' }}
          >
            {c.title}
          </div>
          <div className="st-draglayout__body">{c.content ?? c.children}</div>
          {editable && (
            <span
              className="st-draglayout__resize"
              onPointerDown={(e) => begin(e, c.id, 'resize')}
            />
          )}
        </div>
      ))}
    </div>
  )
}
