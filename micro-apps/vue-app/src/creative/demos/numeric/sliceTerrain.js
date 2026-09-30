/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 数值与优化 · 地形剖切 —— 沿任意方向切一刀看剖面
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { clamp, rand, fbm } from '../../utils/math.js'
import { makeFieldBuffer } from '../../utils/canvas.js'
import { hsl2rgb, makeRgbLut } from '../../utils/color.js'

const sliceTerrain = {
  id: 'slice-terrain',
  title: '地形剖切',
  tag: '沿任意方向切一刀看剖面',
  desc: '把 fbm 噪声当成高度场，俯视图里那条亮线就是「刀口」。沿刀口逐点采样高度，就得到下面那条剖面曲线 —— 地质剖面图、雷达回波图读的都是这种一维切片。关键在于：剖面只反映刀口经过的那一条线，角度一转，看到的地形可能完全换一副样子。所以「一条剖面代表整体」永远是个假设，不是事实。',
  bg: '#04060d',
  params: [
    { key: 'angle', label: '刀口角度', min: 0, max: 360, step: 1, value: 32 },
    { key: 'scale', label: '地形尺度', min: 1, max: 9, step: 0.1, value: 4.2 },
    { key: 'oct', label: '噪声层数', min: 2, max: 6, step: 1, value: 5 },
    { key: 'cut', label: '刀口位置', min: 0.1, max: 0.9, step: 0.01, value: 0.5 },
    { key: 'spin', label: '自动旋转', min: 0, max: 40, step: 1, value: 10 },
  ],
  actions: [
    { key: 'reseed', label: '换一片地形' },
    { key: 'snap', label: '刀口转 45°' },
  ],
  create(ctx) {
    const buf = makeFieldBuffer(4)
    const NS = 220
    const prof = new Float32Array(NS)
    let w = 800
    let h = 360
    let angle = 32
    let scale = 4.2
    let oct = 5
    let cut = 0.5
    let spin = 10
    const seedOff = new Float32Array(2)

    const LUT_N = 96
    const LUT = makeRgbLut(LUT_N, (v) => {
      /* 深水蓝 → 青 → 草绿 → 砂黄 → 雪白 */
      if (v < 0.32) return hsl2rgb(212 - v * 60, 0.55, 0.14 + v * 0.5)
      if (v < 0.5) return hsl2rgb(160 + (v - 0.32) * 90, 0.42, 0.34 + (v - 0.32) * 0.8)
      if (v < 0.68) return hsl2rgb(96 + (v - 0.5) * 60, 0.4, 0.42 + (v - 0.5) * 0.55)
      if (v < 0.86) return hsl2rgb(44 - (v - 0.68) * 30, 0.5, 0.6 + (v - 0.68) * 0.7)
      return hsl2rgb(40, 0.2, 0.86)
    })

    const height = (x, y) => {
      const n = fbm(x * scale + seedOff[0], y * scale * 0.78 + seedOff[1], oct)
      /* fbm 的理论上限不到 1（首项 0.5 起、每层折半），乘 1.9 把它摊回 0..1 */
      return clamp(n * 1.9, 0, 1)
    }

    /** 只挪噪声相位，色表不依赖地形，所以不用重建 */
    const reseed = () => {
      seedOff[0] = rand(0, 500)
      seedOff[1] = rand(0, 500)
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        buf.resize(w, Math.floor(h * 0.6))
        reseed()
      },
      frame(ts, dt) {
        angle = (angle + spin * dt) % 360
        ctx.fillStyle = '#04060d'
        ctx.fillRect(0, 0, w, h)

        const topH = Math.floor(h * 0.6)
        const d = buf.data
        const gw = buf.width
        const gh = buf.height
        for (let gy = 0; gy < gh; gy += 1) {
          const uy = (gy + 0.5) / gh
          const row = gy * gw
          for (let gx = 0; gx < gw; gx += 1) {
            const ux = (gx + 0.5) / gw
            const hv = height(ux, uy)
            const ci = Math.min(LUT_N - 1, (hv * LUT_N) | 0) * 3
            const p = (row + gx) * 4
            d[p] = LUT[ci]
            d[p + 1] = LUT[ci + 1]
            d[p + 2] = LUT[ci + 2]
            d[p + 3] = 255
          }
        }
        buf.blit(ctx, w, topH)

        /* 刀口：过画面中心、按 angle 朝向的一条线，用 cut 控制偏移 */
        const th = (angle * Math.PI) / 180
        const dx = Math.cos(th)
        const dy = Math.sin(th)
        const nx = -dy
        const ny = dx
        const cxp = w * 0.5 + nx * (cut - 0.5) * w * 0.7
        const cyp = topH * 0.5 + ny * (cut - 0.5) * topH * 0.7
        const L = Math.max(w, topH) * 1.2
        ctx.strokeStyle = 'rgba(255, 90, 90, 0.95)'
        ctx.lineWidth = 2
        ctx.setLineDash([9, 6])
        ctx.beginPath()
        ctx.moveTo(cxp - dx * L, cyp - dy * L)
        ctx.lineTo(cxp + dx * L, cyp + dy * L)
        ctx.stroke()
        ctx.setLineDash([])

        /* 沿刀口采样：t 从 -0.6 到 0.6（归一化到画面宽度），得到剖面 */
        let lo = 2
        let hi = -1
        for (let i = 0; i < NS; i += 1) {
          const t = (i / (NS - 1) - 0.5) * 1.2
          const ux = clamp(cxp / w + dx * t * 0.5, 0, 1)
          const uy = clamp(cyp / topH + dy * t * 0.5, 0, 1)
          const hv = height(ux, uy)
          prof[i] = hv
          lo = Math.min(lo, hv)
          hi = Math.max(hi, hv)
        }

        /* 剖面面板 */
        const py0 = topH + 18
        const py1 = h - 24
        const panelH = py1 - py0
        ctx.fillStyle = 'rgba(12, 18, 32, 0.92)'
        ctx.fillRect(0, topH, w, h - topH)
        ctx.strokeStyle = 'rgba(120, 150, 200, 0.28)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(0, py0 + panelH)
        ctx.lineTo(w, py0 + panelH)
        ctx.stroke()

        const span = Math.max(0.02, hi - lo)
        ctx.beginPath()
        ctx.moveTo(0, py0 + panelH)
        for (let i = 0; i < NS; i += 1) {
          const gx = (i / (NS - 1)) * w
          const gy = py0 + panelH - ((prof[i] - lo) / span) * (panelH - 6) - 3
          ctx.lineTo(gx, gy)
        }
        ctx.lineTo(w, py0 + panelH)
        ctx.closePath()
        const grad = ctx.createLinearGradient(0, py0, 0, py0 + panelH)
        grad.addColorStop(0, 'rgba(140, 210, 255, 0.5)')
        grad.addColorStop(1, 'rgba(140, 210, 255, 0.04)')
        ctx.fillStyle = grad
        ctx.fill()
        ctx.strokeStyle = '#8cd2ff'
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < NS; i += 1) {
          const gx = (i / (NS - 1)) * w
          const gy = py0 + panelH - ((prof[i] - lo) / span) * (panelH - 6) - 3
          if (i === 0) ctx.moveTo(gx, gy)
          else ctx.lineTo(gx, gy)
        }
        ctx.stroke()

        ctx.font = '12px ui-monospace, monospace'
        ctx.fillStyle = '#ff8f8f'
        ctx.fillText(`刀口 ${angle.toFixed(1)}°`, 12, 18)
        ctx.fillStyle = '#dff6ff'
        ctx.fillText(`剖面落差 ${(span * 100).toFixed(1)}% · 采样 ${NS} 点`, 130, 18)
        ctx.fillStyle = '#9db4dd'
        ctx.fillText('下面这条曲线只代表刀口那一条线 —— 转个角度就是另一片地形', 12, h - 8)
      },
      pointer(kind, x, y) {
        /* 直接点俯视图：把刀口挪过去 */
        if (kind === 'down' || kind === 'move') {
          const topH = Math.floor(h * 0.6)
          if (y > topH) return
          const th = (angle * Math.PI) / 180
          const nx = -Math.sin(th)
          const ny = Math.cos(th)
          const off = (x / w - 0.5) * w * 0.7 * nx + (y / topH - 0.5) * topH * 0.7 * ny
          cut = clamp(0.5 + off / (w * 0.7), 0.1, 0.9)
        }
      },
      setParam(key, v) {
        if (key === 'angle') angle = v
        if (key === 'scale') scale = v
        if (key === 'oct') oct = Math.round(v)
        if (key === 'cut') cut = v
        if (key === 'spin') spin = v
      },
      action(key) {
        if (key === 'reseed') reseed()
        if (key === 'snap') angle = (Math.round(angle / 45) + 1) * 45 % 360
      },
      destroy() {},
    }
  },
}

export default sliceTerrain
