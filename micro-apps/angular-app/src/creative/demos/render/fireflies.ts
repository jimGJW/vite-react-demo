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
 * 粒子与渲染 · 萤火虫同步 —— 脉冲耦合振荡器
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp, rand } from '../../utils/math'

const fireflies = {
  id: 'fireflies',
  title: '萤火虫同步',
  tag: '脉冲耦合振荡器',
  desc: '每只萤火虫都是一个自激振荡器，闪光时把附近同伴的相位往前推一点 —— Mirollo–Strogatz 模型。耦合足够强时，一片随机的闪烁会在几秒内自发锁相。右下角那个数字是序参量 |mean(e^{i2πφ})|，1.00 就是完全同步。',
  bg: '#05080d',
  params: [
    { key: 'couple', label: '耦合强度', min: 0, max: 0.6, step: 0.02, value: 0.22 },
    { key: 'period', label: '闪烁周期(s)', min: 0.8, max: 6, step: 0.2, value: 2.4 },
  ],
  actions: [
    { key: 'scatter', label: '打乱相位' },
    { key: 'burst', label: '全部点亮' },
  ],
  create(ctx) {
    const N = 150
    let w = 800
    let h = 360
    let couple = 0.22
    let period = 2.4
    let radius = 90
    let order = 0
    let bugs = []

    const scatter = () => {
      bugs = Array.from({ length: N }, () => ({
        x: rand(20, w - 20),
        y: rand(20, h - 20),
        vx: rand(-14, 14),
        vy: rand(-14, 14),
        phase: Math.random(),
        glow: 0,
      }))
      radius = Math.min(w, h) * 0.28
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        scatter()
        ctx.fillStyle = '#05080d'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        ctx.fillStyle = 'rgba(5, 8, 13, 0.28)'
        ctx.fillRect(0, 0, w, h)

        /* 相位推进 + 闪光时按距离把邻居相位往前推（脉冲耦合） */
        for (const b of bugs) {
          b.phase += dt / period
          b.glow = Math.max(0, b.glow - dt * 2.6)
          b.x += b.vx * dt
          b.y += b.vy * dt
          if (b.x < 12 || b.x > w - 12) b.vx *= -1
          if (b.y < 12 || b.y > h - 12) b.vy *= -1
          b.x = clamp(b.x, 12, w - 12)
          b.y = clamp(b.y, 12, h - 12)
        }
        for (const b of bugs) {
          if (b.phase < 1) continue
          b.phase -= 1
          b.glow = 1
          for (const o of bugs) {
            if (o === b || o.phase >= 1) continue
            const d = Math.hypot(o.x - b.x, o.y - b.y)
            if (d > radius) continue
            o.phase = Math.min(1, o.phase + couple * (1 - d / radius))
          }
        }

        let sx = 0
        let sy = 0
        for (const b of bugs) {
          sx += Math.cos(b.phase * TAU)
          sy += Math.sin(b.phase * TAU)
          if (b.glow > 0.02) {
            const r = 3 + b.glow * 5
            const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r * 5)
            g.addColorStop(0, `rgba(253, 230, 138, ${0.85 * b.glow})`)
            g.addColorStop(1, 'rgba(253, 230, 138, 0)')
            ctx.fillStyle = g
            ctx.beginPath()
            ctx.arc(b.x, b.y, r * 5, 0, TAU)
            ctx.fill()
          }
          ctx.fillStyle = `rgba(250, 250, 210, ${0.34 + b.glow * 0.66})`
          ctx.beginPath()
          ctx.arc(b.x, b.y, 1.8 + b.glow * 1.6, 0, TAU)
          ctx.fill()
        }
        order = Math.hypot(sx / N, sy / N)

        /* 序参量：0 = 各闪各的，1 = 完全同步 */
        ctx.font = '600 13px -apple-system, "SF Mono", monospace'
        ctx.textAlign = 'right'
        ctx.textBaseline = 'bottom'
        ctx.fillStyle = 'rgba(190, 210, 235, 0.75)'
        ctx.fillText(`同步度 ${order.toFixed(2)}`, w - 14, h - 26)
        ctx.fillStyle = 'rgba(148, 163, 184, 0.25)'
        ctx.fillRect(w - 154, h - 18, 140, 5)
        ctx.fillStyle = order > 0.85 ? '#4ade80' : order > 0.45 ? '#fbbf24' : '#f87171'
        ctx.fillRect(w - 154, h - 18, 140 * order, 5)
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
      },
      pointer() {},
      setParam(k, v) {
        if (k === 'couple') couple = v
        if (k === 'period') period = v
      },
      action(key) {
        if (key === 'scatter') for (const b of bugs) b.phase = Math.random()
        if (key === 'burst') for (const b of bugs) { b.phase = 1; b.glow = 1 }
      },
      destroy() {},
    }
  },
}

export default fireflies
