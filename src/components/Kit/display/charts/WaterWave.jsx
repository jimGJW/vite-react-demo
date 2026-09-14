import { useEffect, useRef } from 'react'
import { clamp } from '../../utils.js'

/**
 * WaterWave · 水波纹进度球
 * =====================================================================
 * 移植自 旧平板端项目 `components/Charts/WaterWave`。这个组件原本就是**纯 Canvas 2D
 * 手写动画**（正弦波 + 圆形裁剪 + 渐变填充），与 G2 无关，所以逻辑基本保留：
 *   - requestAnimationFrame 循环 + 逐帧逼近目标值（0.08 的缓动系数）
 *   - `destination-over` / `clip()` 保证水位线以下的填充不外溢到圆外
 *
 * 改动点：
 *   1. 原实现用 setState 驱动百分比文字，等于每帧触发一次 React 渲染；
 *      这里文字直接用 props 渲染，动画完全留在 canvas 里，不参与 reconcile
 *   2. `animated={false}` 时只画一帧并停下，给「一屏几十个水波球」的场景省 CPU
 *   3. 注释里的内部域名已清理
 *
 * 用法：
 *   <WaterWave percent={68} title="完成率" />
 */

export default function WaterWave({
  percent = 0,
  size = 160,
  title = '',
  color = '#4f46e5',
  animated = true,
  className = '',
}) {
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const levelRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr

    const radius = size / 2
    const step = Math.max(size / 120, 1.5)
    const target = clamp(Number(percent) || 0, 0, 100) / 100
    let phase = 0

    const drawFrame = () => {
      const level = levelRef.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size, size)

      // 外圈底
      ctx.beginPath()
      ctx.arc(radius, radius, radius - 1, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.save()
      ctx.beginPath()
      ctx.arc(radius, radius, radius - 1, 0, Math.PI * 2)
      ctx.clip()

      const surface = radius * 2 * (1 - level)
      ctx.beginPath()
      ctx.moveTo(0, surface)
      for (let x = 0; x <= size; x += step) {
        const wave = Math.sin(x / (size / 6) + phase) * (size * 0.018)
        ctx.lineTo(x, surface + wave)
      }
      ctx.lineTo(size, size)
      ctx.lineTo(0, size)
      ctx.closePath()

      const gradient = ctx.createLinearGradient(0, surface, 0, size)
      gradient.addColorStop(0, color)
      gradient.addColorStop(1, color)
      ctx.globalAlpha = 0.78
      ctx.fillStyle = gradient
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.restore()
    }

    let stopped = false
    const tick = () => {
      if (stopped) return
      levelRef.current += (target - levelRef.current) * 0.08
      phase += 0.06
      drawFrame()
      if (!animated && Math.abs(target - levelRef.current) < 0.002) {
        levelRef.current = target
        drawFrame()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      stopped = true
      cancelAnimationFrame(rafRef.current)
    }
  }, [percent, size, color, animated])

  return (
    <div className={`kit-wave ${className}`} style={{ width: size, height: size }}>
      <canvas ref={canvasRef} className="kit-wave__canvas" style={{ width: size, height: size }} />
      <div className="kit-wave__label">
        <span className="kit-wave__percent">{clamp(Number(percent) || 0, 0, 100).toFixed(0)}%</span>
        {title && <span className="kit-wave__title">{title}</span>}
      </div>
    </div>
  )
}
