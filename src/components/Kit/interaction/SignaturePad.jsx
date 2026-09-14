import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Space, Tooltip } from 'antd'
import { ClearOutlined, DownloadOutlined, UndoOutlined } from '@ant-design/icons'

/**
 * SignaturePad · 电子签名板
 * =====================================================================
 * 移植自 旧移动端项目 `components/Signature.js`，做了四件事：
 *   1. 去掉 `react-canvas-draw` 依赖，改为原生 Canvas 2D 手写实现
 *      （原库依赖 findDOMNode，与 React 19 不兼容）
 *   2. 去掉全部业务耦合：原实现的 `rest.post(urls.userSignature)`、
 *      `storage.signature`、微信命令式挂载（ReactDOM.render）全部移除，
 *      改为标准的 value / onChange 受控接口
 *   3. 屏幕像素比（DPR）高清适配，签名不再发虚
 *   4. 导出时铺白底：Canvas 默认透明，直接 toDataURL 出来的 PNG
 *      在多数看图软件里会显示成黑底
 *
 * 用法：
 *   const [sign, setSign] = useState('')
 *   <SignaturePad value={sign} onChange={setSign} />
 *   // 提交时可直接转 File 交给上传组件
 *   const file = dataURLtoFile(sign, 'sign.png')
 */

const DEFAULT_PEN_COLORS = ['#1f2937', '#4f46e5', '#0ea5e9', '#12a150', '#e5484d']

export default function SignaturePad({
  value = '',
  onChange,
  height = 200,
  lineWidth = 2.4,
  penColors = DEFAULT_PEN_COLORS,
  defaultPenColor = DEFAULT_PEN_COLORS[0],
  showToolbar = true,
  showBaseline = true,
  placeholder = '在此手写签名',
  downloadName = 'signature.png',
  disabled = false,
  className = '',
}) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const strokesRef = useRef([])
  const drawingRef = useRef(false)
  const lastRef = useRef({ x: 0, y: 0 })
  const sizeRef = useRef({ width: 0, height })

  const [penColor, setPenColor] = useState(defaultPenColor)
  const [hasInk, setHasInk] = useState(Boolean(value))

  /* ---------------- canvas 尺寸 / DPR ---------------- */

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    const width = wrap.clientWidth || 600
    sizeRef.current = { width, height }
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.clearRect(0, 0, width, height)
  }, [height])

  /** 全量重绘（撤销 / 容器尺寸变化时用） */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const { width, height: h } = sizeRef.current
    ctx.clearRect(0, 0, width, h)
    strokesRef.current.forEach((stroke) => {
      const points = stroke.points
      if (points.length < 2) {
        // 单点也要能画出一个圆点
        ctx.beginPath()
        ctx.fillStyle = stroke.color
        ctx.arc(points[0].x, points[0].y, stroke.width / 2, 0, Math.PI * 2)
        ctx.fill()
        return
      }
      ctx.beginPath()
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y)
      ctx.stroke()
    })
  }, [])

  useEffect(() => {
    setupCanvas()
    redraw()
    const wrap = wrapRef.current
    if (!wrap || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(() => {
      setupCanvas()
      redraw()
    })
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [setupCanvas, redraw])

  /* ---------------- 外部 value 回显 ---------------- */

  useEffect(() => {
    if (!value) return
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!ctx) return
      const { width, height: h } = sizeRef.current
      ctx.clearRect(0, 0, width, h)
      const ratio = Math.min(width / img.width, h / img.height)
      const w = img.width * ratio
      const hh = img.height * ratio
      ctx.drawImage(img, (width - w) / 2, (h - hh) / 2, w, hh)
    }
    img.src = value
  }, [value])

  /* ---------------- 导出 ---------------- */

  const toDataURL = useCallback((type = 'image/png') => {
    const canvas = canvasRef.current
    if (!canvas) return ''
    const { width, height: h } = sizeRef.current
    const scale = 2
    const out = document.createElement('canvas')
    out.width = Math.round(width * scale)
    out.height = Math.round(h * scale)
    const ctx = out.getContext('2d')
    // 铺白底，避免透明 PNG 在部分看图软件中显示为黑底
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, out.width, out.height)
    ctx.drawImage(canvas, 0, 0, out.width, out.height)
    return out.toDataURL(type)
  }, [])

  const emit = useCallback(() => {
    if (!strokesRef.current.length) {
      onChange?.(null)
      return
    }
    onChange?.(toDataURL())
  }, [onChange, toDataURL])

  /* ---------------- 指针事件（鼠标 + 触屏统一） ---------------- */

  const pointOf = (event) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const handlePointerDown = (event) => {
    if (disabled) return
    event.preventDefault()
    canvasRef.current?.setPointerCapture?.(event.pointerId)
    drawingRef.current = true
    const point = pointOf(event)
    lastRef.current = point
    strokesRef.current = [
      ...strokesRef.current,
      { color: penColor, width: lineWidth, points: [point] },
    ]
    setHasInk(true)
  }

  const handlePointerMove = (event) => {
    if (!drawingRef.current || disabled) return
    const point = pointOf(event)
    const last = lastRef.current
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.strokeStyle = penColor
      ctx.lineWidth = lineWidth
      ctx.moveTo(last.x, last.y)
      ctx.lineTo(point.x, point.y)
      ctx.stroke()
    }
    const strokes = strokesRef.current
    strokes[strokes.length - 1]?.points.push(point)
    lastRef.current = point
  }

  const handlePointerUp = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    emit()
  }

  /* ---------------- 工具栏动作 ---------------- */

  const handleClear = () => {
    strokesRef.current = []
    setHasInk(false)
    setupCanvas()
    onChange?.(null)
  }

  const handleUndo = () => {
    if (!strokesRef.current.length) return
    strokesRef.current = strokesRef.current.slice(0, -1)
    setHasInk(strokesRef.current.length > 0)
    redraw()
    emit()
  }

  const handleDownload = () => {
    const url = toDataURL()
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = downloadName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={`kit-sign ${disabled ? 'kit-sign--disabled' : ''} ${className}`}>
      <div className="kit-sign__canvas-wrap" ref={wrapRef} style={{ height }}>
        <canvas
          ref={canvasRef}
          className="kit-sign__canvas"
          role="img"
          aria-label={placeholder}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        {showBaseline && <div className="kit-sign__baseline" />}
        {!hasInk && <div className="kit-sign__placeholder">{placeholder}</div>}
      </div>

      {showToolbar && (
        <div className="kit-sign__toolbar">
          <div className="kit-sign__colors">
            {penColors.map((color) => (
              <Tooltip key={color} title={color}>
                <button
                  type="button"
                  aria-label={`画笔颜色 ${color}`}
                  className={`kit-sign__swatch ${penColor === color ? 'is-active' : ''}`}
                  style={{ background: color }}
                  onClick={() => setPenColor(color)}
                />
              </Tooltip>
            ))}
          </div>
          <Space size={4}>
            <Button size="small" type="text" icon={<UndoOutlined />} disabled={disabled || !hasInk} onClick={handleUndo}>
              撤销
            </Button>
            <Button size="small" type="text" icon={<ClearOutlined />} disabled={disabled || !hasInk} onClick={handleClear}>
              清空
            </Button>
            <Tooltip title="导出为 PNG（已铺白底）">
              <Button size="small" type="text" icon={<DownloadOutlined />} disabled={!hasInk} onClick={handleDownload}>
                导出
              </Button>
            </Tooltip>
          </Space>
        </div>
      )}
    </div>
  )
}
