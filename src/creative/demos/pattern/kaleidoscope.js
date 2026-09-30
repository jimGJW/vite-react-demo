/**
 * 几何与图案 · 万花筒 —— n 重旋转对称
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU } from '../../utils/math.js'
import { BG } from '../../utils/canvas.js'

const kaleidoscope = {
  id: 'kaleidoscope',
  title: '万花筒',
  tag: 'n 重旋转对称',
  desc: '在画布上按住拖一笔，然后把这笔按 n 个角度旋转 + 镜像复写。对称数是可调的：这里的 8 表示 16 重对称（8 个旋转 × 各自镜像）。',
  bg: BG,
  params: [
    { key: 'segs', label: '对称扇区', min: 2, max: 16, step: 1, value: 8 },
  ],
  actions: [
    { key: 'undo', label: '撤销一笔' },
    { key: 'clear', label: '清空' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let segs = 8
    const strokes = []
    let current = null

    /** 三段小弧当种子笔画：进页面就有东西可看，而不是一块空画布 */
    const seedStroke = () => {
      const cx = w / 2
      const cy = h / 2
      const r = Math.min(w, h) * 0.33
      const pts = []
      for (let i = 0; i <= 16; i += 1) {
        const a = -1.1 + (i / 16) * 1.9
        pts.push({ x: cx + Math.cos(a) * r * (1 - i * 0.012), y: cy + Math.sin(a) * r })
      }
      return pts
    }

    const paintAll = () => {
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, w, h)
      const cx = w / 2
      const cy = h / 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      strokes.forEach((s, si) => {
        const hue = (si * 37) % 360
        for (let k = 0; k < segs; k += 1) {
          /* 每个扇区画两遍：正常 + 沿竖直轴镜像 → 2×segs 重对称 */
          for (const mirror of [1, -1]) {
            ctx.save()
            ctx.translate(cx, cy)
            ctx.rotate((k * TAU) / segs)
            ctx.scale(mirror, 1)
            ctx.strokeStyle = `hsla(${(hue + k * 12) % 360}, 85%, 64%, 0.85)`
            ctx.lineWidth = 2.4
            ctx.beginPath()
            for (let i = 0; i < s.length; i += 1) {
              const px = s[i].x - cx
              const py = s[i].y - cy
              if (i === 0) ctx.moveTo(px, py)
              else ctx.lineTo(px, py)
            }
            ctx.stroke()
            ctx.restore()
          }
        }
      })
      if (current && current.length > 1) {
        ctx.save()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.beginPath()
        current.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
        ctx.stroke()
        ctx.restore()
      }
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        strokes.length = 0
        current = null
        /* 空画布会让人以为页面坏了 —— 先自动画一笔，进来就能看到 2×segs 重对称 */
        strokes.push(seedStroke())
        paintAll()
      },
      frame() { paintAll() },
      pointer(kind, x, y) {
        if (kind === 'down') {
          current = [{ x, y }]
        } else if (kind === 'move' && current) {
          current.push({ x, y })
        } else if (kind === 'up' && current) {
          if (current.length > 1) strokes.push(current)
          if (strokes.length > 24) strokes.shift()
          current = null
        } else if (kind === 'leave' && current) {
          if (current.length > 1) strokes.push(current)
          current = null
        }
      },
      setParam(k, v) { if (k === 'segs') segs = v },
      action(key) {
        if (key === 'undo') strokes.pop()
        if (key === 'clear') strokes.length = 0
      },
      destroy() {},
    }
  },
}

export default kaleidoscope
