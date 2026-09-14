import { useEffect, useRef, useState } from 'react'

/**
 * Canvas 仪表盘：requestAnimationFrame 缓动到目标值，DPR 高清适配，容器尺寸自适应。
 * 思路来自某大屏项目的 Canvas 仪表盘（原用第三方动画库），改为零依赖。
 */
export default function CanvasGauge({
  value = 0,
  max = 100,
  title,
  unit = '',
  color = '#1677ff',
  height = 200,
}) {
  const canvasRef = useRef(null)
  const [display, setDisplay] = useState(0)
  const displayRef = useRef(0)

  useEffect(() => {
    let raf = 0
    const step = () => {
      const cur = displayRef.current
      const next = cur + (value - cur) * 0.12
      displayRef.current = Math.abs(value - next) < 0.5 ? value : next
      setDisplay(displayRef.current)
      if (displayRef.current !== value) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const draw = () => {
      const parent = canvas.parentElement
      const L = Math.max(120, Math.min(parent.clientWidth, height))
      const dpr = window.devicePixelRatio || 1
      canvas.style.width = `${L}px`
      canvas.style.height = `${L}px`
      canvas.width = L * dpr
      canvas.height = L * dpr
      const ctx = canvas.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, L, L)
      const cx = L / 2
      const cy = L / 2
      const r = L * 0.4
      const start = Math.PI * 0.75
      const end = Math.PI * 2.25
      ctx.lineWidth = L * 0.08
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#eef0f5'
      ctx.beginPath()
      ctx.arc(cx, cy, r, start, end)
      ctx.stroke()
      const ratio = Math.min(1, Math.max(0, display / max))
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.arc(cx, cy, r, start, start + (end - start) * ratio)
      ctx.stroke()
      ctx.fillStyle = '#1f2330'
      ctx.textAlign = 'center'
      ctx.font = `${L * 0.18}px sans-serif`
      ctx.fillText(Math.round(display).toString(), cx, cy + L * 0.02)
      ctx.fillStyle = '#8a93a6'
      ctx.font = `${L * 0.08}px sans-serif`
      ctx.fillText(unit, cx, cy + L * 0.16)
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(canvas.parentElement)
    return () => ro.disconnect()
  }, [display, color, height, max, unit])

  return (
    <div className="st-gauge" style={{ height }}>
      <canvas ref={canvasRef} />
      {title && <div className="st-gauge__title">{title}</div>}
    </div>
  )
}
