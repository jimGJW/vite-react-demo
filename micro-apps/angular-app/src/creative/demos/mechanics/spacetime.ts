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
 * 天体与力学 · 时空网格 —— 势阱扭曲 + 测地线
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU } from '../../utils/math'

const spacetime = {
  id: 'spacetime',
  title: '时空网格',
  tag: '势阱扭曲 + 测地线',
  desc: '把时空画成一张网格，质量让网格下陷（下陷深度正比于 m/r）。天体在凹陷处绕着中心走，网格被它们拽着一起晃。这不是广义相对论的严格解，但「质量告诉时空怎么弯，时空告诉物质怎么走」这层意思一目了然。',
  bg: '#03040b',
  params: [
    { key: 'mass', label: '中心质量', min: 0, max: 3, step: 0.05, value: 1.4 },
    { key: 'wells', label: '伴星数', min: 0, max: 4, step: 1, value: 2 },
    { key: 'depth', label: '下陷深度', min: 10, max: 220, step: 5, value: 90 },
  ],
  actions: [{ key: 'reset', label: '重新入轨' }],
  create(ctx) {
    let w = 800
    let h = 360
    let mass = 1.4
    let nWells = 2
    let depth = 90
    const MAXW = 4
    const wx = new Float64Array(MAXW)
    const wy = new Float64Array(MAXW)
    const wvx = new Float64Array(MAXW)
    const wvy = new Float64Array(MAXW)
    const wm = new Float64Array(MAXW)

    const reset = () => {
      for (let i = 0; i < MAXW; i += 1) {
        /* 归一化坐标（-1..1 的平面），跟画布尺寸解耦 */
        const a = (i / MAXW) * TAU + 0.4
        const r = 0.42 + i * 0.1
        wx[i] = Math.cos(a) * r
        wy[i] = Math.sin(a) * r
        const v = Math.sqrt(mass * 0.32 / r)
        wvx[i] = -Math.sin(a) * v
        wvy[i] = Math.cos(a) * v
        wm[i] = 0.35 + Math.random() * 0.3
      }
    }
    reset()

    /* 只算「万有引力」，不是真正的测地线 —— 但轨迹形状对得上 */
    const orbit = (dt) => {
      for (let i = 0; i < nWells; i += 1) {
        const r2 = wx[i] * wx[i] + wy[i] * wy[i] + 0.004
        const r3 = r2 * Math.sqrt(r2)
        const f = (-mass * 0.32) / r3
        wvx[i] += wx[i] * f * dt
        wvy[i] += wy[i] * f * dt
        wx[i] += wvx[i] * dt
        wy[i] += wvy[i] * dt
      }
    }

    /** 势阱：Σ m/(r+ε)，中心质量 + 各伴星 */
    const wellAt = (x, y) => {
      let s = mass * 0.5 / (Math.sqrt(x * x + y * y) + 0.1)
      for (let i = 0; i < nWells; i += 1) {
        const dx = x - wx[i]
        const dy = y - wy[i]
        s += wm[i] * 0.2 / (Math.sqrt(dx * dx + dy * dy) + 0.06)
      }
      return s
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        ctx.fillStyle = '#03040b'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        const step = Math.min(dt, 1 / 30)
        for (let s = 0; s < 4; s += 1) orbit(step / 4)

        ctx.fillStyle = 'rgba(3, 4, 11, 0.34)'
        ctx.fillRect(0, 0, w, h)

        const cx = w / 2
        const cy = h * 0.42
        const S = Math.min(w, h) * 0.46
        const tilt = 0.72
        const yAt = (x, y) => (
          cy + y * S * tilt + (wellAt(x, y) * depth * 0.35)
        )

        /* 网格：每轴 33 条线、每条 61 个点 —— 共约 4000 点，够密也够快 */
        const N = 16
        ctx.lineWidth = 1
        for (let axis = 0; axis < 2; axis += 1) {
          for (let g = -N; g <= N; g += 1) {
            ctx.strokeStyle = axis
              ? 'rgba(96, 140, 232, 0.34)'
              : 'rgba(72, 116, 208, 0.26)'
            ctx.beginPath()
            for (let s = 0; s <= 60; s += 1) {
              const t = -1 + (s / 60) * 2
              const x = axis ? g / N : t
              const y = axis ? t : g / N
              const px = cx + x * S
              const py = yAt(x, y)
              if (s === 0) ctx.moveTo(px, py)
              else ctx.lineTo(px, py)
            }
            ctx.stroke()
          }
        }

        /* 中心质量：一个亮核 + 光晕 */
        const cyp = yAt(0, 0)
        const halo = ctx.createRadialGradient(cx, cyp, 2, cx, cyp, 74)
        halo.addColorStop(0, 'rgba(255, 226, 160, 0.85)')
        halo.addColorStop(0.35, 'rgba(255, 176, 80, 0.28)')
        halo.addColorStop(1, 'rgba(255, 176, 80, 0)')
        ctx.fillStyle = halo
        ctx.fillRect(cx - 80, cyp - 80, 160, 160)
        ctx.fillStyle = '#fff3d0'
        ctx.beginPath()
        ctx.arc(cx, cyp, 5.5 + mass * 2, 0, TAU)
        ctx.fill()

        /* 伴星 + 它们的轨迹（画成小点串，省掉维护历史数组） */
        ctx.fillStyle = '#8ee6ff'
        for (let i = 0; i < nWells; i += 1) {
          for (let t = 0; t < 14; t += 1) {
            const back = t * 18
            const x = wx[i] - wvx[i] * 0.0006 * back
            const y = wy[i] - wvy[i] * 0.0006 * back
            ctx.globalAlpha = 0.6 - t * 0.04
            ctx.fillRect(cx + x * S - 1.5, yAt(x, y) - 1.5, 3, 3)
          }
          ctx.globalAlpha = 1
          ctx.fillStyle = '#dff6ff'
          ctx.beginPath()
          ctx.arc(cx + wx[i] * S, yAt(wx[i], wy[i]), 3.4, 0, TAU)
          ctx.fill()
          ctx.fillStyle = '#8ee6ff'
        }
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'mass') mass = v
        if (key === 'wells') { nWells = v; reset() }
        if (key === 'depth') depth = v
      },
      action(key) {
        if (key === 'reset') reset()
      },
      destroy() {},
    }
  },
}

export default spacetime
