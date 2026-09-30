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
 * 天体与力学 · 双摆混沌 —— RK4 积分 + 相空间发散
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU } from '../../utils/math'
import { makeStepper } from '../../utils/canvas'

const doublePendulum = {
  id: 'double-pendulum',
  title: '双摆混沌',
  tag: 'RK4 积分 + 相空间发散',
  desc: '两个摆球串联，运动方程是刚性的，用 RK4 以固定步长 1/480 s 积分。它既是混沌的（初始 0.001 rad 的差别在十几秒内就完全分道扬镳），又奇妙地守恒 —— 看尾部轨迹一直在同一个有界区域里打转。',
  bg: '#07080f',
  params: [
    { key: 'gravity', label: '重力', min: 300, max: 2600, step: 50, value: 1200 },
    { key: 'damping', label: '阻尼', min: 0, max: 0.4, step: 0.01, value: 0.0 },
  ],
  actions: [
    { key: 'kick', label: '推一下' },
    { key: 'reset', label: '重置' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let g = 1200
    let damping = 0
    let l1 = 120
    let l2 = 120
    let a1 = 2.0
    let a2 = 2.6
    let av1 = 0
    let av2 = 0
    const trace = []

    const reset = () => {
      l1 = Math.min(w, h) * 0.24
      l2 = l1 * 0.86
      a1 = 2.0
      a2 = 2.6
      av1 = 0
      av2 = 0
      trace.length = 0
    }

    /* 等质量双摆的标准方程组；Δ = θ1 - θ2，分母 3 - cos2Δ 在 θ1=θ2 时也不会为 0 */
    const deriv = (s) => {
      const [t1, t2, w1, w2] = s
      const d = t1 - t2
      const den = 3 - Math.cos(2 * d)
      const num1 = -3 * g * Math.sin(t1) - g * Math.sin(t1 - 2 * t2)
        - 2 * Math.sin(d) * (w2 * w2 * l2 + w1 * w1 * l1 * Math.cos(d))
      const num2 = 2 * Math.sin(d) * (2 * w1 * w1 * l1 + 2 * g * Math.cos(t1) + w2 * w2 * l2 * Math.cos(d))
      return [w1, w2, num1 / (l1 * den), num2 / (l2 * den)]
    }
    const integrate = (dt) => {
      const s = [a1, a2, av1, av2]
      const k1 = deriv(s)
      const s2 = s.map((v, i) => v + (k1[i] * dt) / 2)
      const k2 = deriv(s2)
      const s3 = s.map((v, i) => v + (k2[i] * dt) / 2)
      const k3 = deriv(s3)
      const s4 = s.map((v, i) => v + k3[i] * dt)
      const k4 = deriv(s4)
      for (let i = 0; i < 4; i += 1) s[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])
      a1 = s[0]
      a2 = s[1]
      av1 = s[2] * (1 - damping)
      av2 = s[3] * (1 - damping)
    }
    const advance = makeStepper(1 / 480, integrate)

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        reset()
        ctx.fillStyle = '#07080f'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        advance(dt)
        const cx = w / 2
        const cy = h * 0.34
        const x1 = cx + l1 * Math.sin(a1)
        const y1 = cy + l1 * Math.cos(a1)
        const x2 = x1 + l2 * Math.sin(a2)
        const y2 = y1 + l2 * Math.cos(a2)

        trace.push({ x: x2, y: y2 })
        if (trace.length > 900) trace.shift()

        ctx.fillStyle = 'rgba(7, 8, 15, 0.14)'
        ctx.fillRect(0, 0, w, h)

        ctx.strokeStyle = 'rgba(129, 140, 248, 0.6)'
        ctx.lineWidth = 1.4
        ctx.beginPath()
        for (let i = 1; i < trace.length; i += 1) {
          ctx.moveTo(trace[i - 1].x, trace[i - 1].y)
          ctx.lineTo(trace[i].x, trace[i].y)
        }
        ctx.stroke()

        ctx.strokeStyle = '#c7d2fe'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        ctx.fillStyle = '#818cf8'
        ctx.beginPath()
        ctx.arc(x1, y1, 6, 0, TAU)
        ctx.fill()
        ctx.fillStyle = '#f0abfc'
        ctx.beginPath()
        ctx.arc(x2, y2, 8, 0, TAU)
        ctx.fill()
        ctx.fillStyle = '#94a3b8'
        ctx.beginPath()
        ctx.arc(cx, cy, 3, 0, TAU)
        ctx.fill()
      },
      pointer() {},
      setParam(k, v) {
        if (k === 'gravity') g = v
        if (k === 'damping') damping = v
      },
      action(key) {
        if (key === 'reset') reset()
        /* 给角速度加一点点扰动 —— 混沌系统里这一点点会自己放大成完全不同的轨迹 */
        if (key === 'kick') av2 += 2.4
      },
      destroy() {},
    }
  },
}

export default doublePendulum
