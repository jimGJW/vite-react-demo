/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/* eslint-disable */
/**
 * 天体与力学 · 磁摆混沌 —— 多势阱 + 初值敏感
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp, rand } from '../../utils/math'
import { makeStepper } from '../../utils/canvas'

const magneticPendulum = {
  id: 'magnetic-pendulum',
  title: '磁摆混沌',
  tag: '多势阱 + 初值敏感',
  desc: '一个摆锤悬在三块磁铁上方：重力把它往下拉，磁铁把它往各自的中心吸。三个吸引子之间是分水岭，初始位置差一毫米，最终躺到的磁铁可能完全不同 —— 这就是混沌系统的「对初值敏感」。轨迹本身也很有意思：它会在两个磁铁之间来回犹豫好几次才定下来。',
  bg: '#04050d',
  params: [
    { key: 'magnets', label: '磁铁数', min: 2, max: 4, step: 1, value: 3 },
    { key: 'strength', label: '磁力强度', min: 2, max: 26, step: 1, value: 12 },
    { key: 'damp', label: '阻尼', min: 0.02, max: 0.6, step: 0.02, value: 0.12 },
  ],
  actions: [
    { key: 'drop', label: '换个初值' },
    { key: 'clear', label: '清掉轨迹' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let nMag = 3
    let strength = 12
    let damp = 0.12
    const mags = []
    const trail = []
    let bx = 0
    let by = 0
    let vx = 0
    let vy = 0

    const R = () => Math.min(w, h) * 0.3

    const layout = () => {
      mags.length = 0
      const r = R()
      const cx = w / 2
      const cy = h / 2
      for (let i = 0; i < nMag; i += 1) {
        const a = -Math.PI / 2 + (i / nMag) * TAU
        mags.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.62 })
      }
    }

    const drop = () => {
      /* 初值给在中心附近一点点扰动 —— 就是这一丁点差别决定最后落到哪块磁铁 */
      bx = w / 2 + rand(-9, 9)
      by = h / 2 + rand(-9, 9)
      vx = rand(-14, 14)
      vy = rand(-14, 14)
      trail.length = 0
    }

    const accel = (x, y2, out) => {
      let ax = 0
      let ay = 0
      for (const m of mags) {
        const dx = m.x - x
        const dy = m.y - y2
        const d2 = dx * dx + dy * dy + 220
        /* 磁力按 1/r² 吸引，再乘一个磁铁强度 */
        const f = (strength * 900) / (d2 * Math.sqrt(d2))
        ax += dx * f
        ay += dy * f
      }
      out[0] = ax
      out[1] = ay
      return out
    }

    const q = [0, 0]
    const integrate = (dt) => {
      accel(bx, by, q)
      vx += (q[0] - vx * damp * 26) * dt
      vy += (q[1] - vy * damp * 26) * dt
      bx += vx * dt
      by += vy * dt
      if (bx < 4 || bx > w - 4) vx *= -0.6
      if (by < 4 || by > h - 4) vy *= -0.6
      bx = clamp(bx, 4, w - 4)
      by = clamp(by, 4, h - 4)
      trail.push(bx, by)
      if (trail.length > 4000) trail.splice(0, 2)
    }
    const stepper = makeStepper(1 / 240, integrate)

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        layout()
        drop()
        ctx.fillStyle = '#04050d'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        stepper(Math.min(dt, 0.05))

        ctx.fillStyle = 'rgba(4, 5, 13, 0.09)'
        ctx.fillRect(0, 0, w, h)

        /* 磁铁：每个一个颜色，和「最终归属」对应 */
        for (let i = 0; i < mags.length; i += 1) {
          const m = mags[i]
          const hue = 20 + (i * 360) / Math.max(1, mags.length)
          const halo = ctx.createRadialGradient(m.x, m.y, 1, m.x, m.y, 34)
          halo.addColorStop(0, `hsla(${hue}, 90%, 62%, 0.8)`)
          halo.addColorStop(1, `hsla(${hue}, 90%, 62%, 0)`)
          ctx.fillStyle = halo
          ctx.fillRect(m.x - 36, m.y - 36, 72, 72)
          ctx.fillStyle = `hsl(${hue}, 92%, 66%)`
          ctx.beginPath()
          ctx.arc(m.x, m.y, 5, 0, TAU)
          ctx.fill()
        }

        /* 轨迹 */
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)'
        ctx.lineWidth = 1.1
        ctx.beginPath()
        for (let i = 0; i < trail.length; i += 2) {
          if (i === 0) ctx.moveTo(trail[i], trail[i + 1])
          else ctx.lineTo(trail[i], trail[i + 1])
        }
        ctx.stroke()

        /* 摆锤 + 吊线（悬点取画布正上方，纯示意） */
        const pivotX = w / 2
        const pivotY = -h * 0.6
        ctx.strokeStyle = 'rgba(160, 200, 255, 0.18)'
        ctx.beginPath()
        ctx.moveTo(pivotX, pivotY)
        ctx.lineTo(bx, by)
        ctx.stroke()
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(bx, by, 5.5, 0, TAU)
        ctx.fill()
      },
      pointer(kind, x, y2) {
        if (kind !== 'down') return
        bx = x
        by = y2
        vx = 0
        vy = 0
        trail.length = 0
      },
      setParam(key, v2) {
        if (key === 'magnets') { nMag = v2; layout(); drop() }
        if (key === 'strength') strength = v2
        if (key === 'damp') damp = v2
      },
      action(key) {
        if (key === 'drop') drop()
        if (key === 'clear') trail.length = 0
      },
      destroy() {},
    }
  },
}

export default magneticPendulum
