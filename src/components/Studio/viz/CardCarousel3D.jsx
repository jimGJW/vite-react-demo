import { useEffect, useRef, useState } from 'react'

/**
 * 3D 卡片轮播：手势方向判定（|dy|/|dx| 夹角 > 45° 让位给页面纵向滚动），
 * 卡片按相对位置做 Z 轴景深与旋转切换。思路来自某资讯项目的卡片轮播，去 ReactDOM.render 重写。
 */
export default function CardCarousel3D({ items = [], autoPlay = false, interval = 3500, height = 220 }) {
  const [index, setIndex] = useState(0)
  const [offset, setOffset] = useState(0)
  const originRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!autoPlay || items.length === 0) return undefined
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), interval)
    return () => clearInterval(t)
  }, [autoPlay, interval, items.length])

  const onDown = (e) => {
    originRef.current = { x: e.clientX, y: e.clientY }
  }
  const onMove = (e) => {
    const o = originRef.current
    if (!o) return
    const dx = e.clientX - o.x
    const dy = e.clientY - o.y
    if (Math.atan(Math.abs(dy) / Math.abs(dx || 1)) <= Math.PI / 4) {
      if (containerRef.current) containerRef.current.style.touchAction = 'none'
      setOffset(dx)
    }
  }
  const onUp = (e) => {
    const o = originRef.current
    if (!o) return
    const dx = e.clientX - o.x
    originRef.current = null
    setOffset(0)
    if (Math.abs(dx) > 50) {
      setIndex((i) => (i + (dx < 0 ? 1 : -1) + items.length) % items.length)
    }
    if (containerRef.current) containerRef.current.style.touchAction = ''
  }

  const total = items.length
  return (
    <div
      className="st-3dcarousal"
      ref={containerRef}
      style={{ height }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
    >
      <div className="st-3dcarousal__stage" style={{ transform: `translateX(${offset}px)` }}>
        {items.map((item, i) => {
          let pos = i - index
          if (pos > total / 2) pos -= total
          if (pos < -total / 2) pos += total
          const abs = Math.abs(pos)
          const style = {
            transform: `translateX(${pos * 62}%) translateZ(${-abs * 120}px) rotateY(${pos * -12}deg)`,
            opacity: abs > 2 ? 0 : 1 - abs * 0.18,
            zIndex: 10 - abs,
            pointerEvents: abs === 0 ? 'auto' : 'none',
          }
          return (
            <div key={i} className="st-3dcarousal__card" style={style}>
              {item}
            </div>
          )
        })}
      </div>
      <div className="st-3dcarousal__dots">
        {items.map((_, i) => (
          <span key={i} className={i === index ? 'is-active' : ''} onClick={() => setIndex(i)} />
        ))}
      </div>
    </div>
  )
}
