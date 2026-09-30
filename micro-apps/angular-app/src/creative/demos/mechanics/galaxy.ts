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
 * 天体与力学 · 螺旋星系 —— 密度波理论
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, rand } from '../../utils/math'
import { makePalette } from '../../utils/canvas'

const galaxy = {
  id: 'galaxy',
  title: '螺旋星系',
  tag: '密度波理论',
  desc: '旋臂不是固定的物质，而是「轨道拥挤处」。每颗星走一个椭圆，椭圆长轴随半径缓慢转动（本轮近似），再按 ω ∝ a^-1.5 的开普勒角速度运行 —— 拥挤图案稳定不动，物质却一直在穿过去。这就是密度波理论。',
  bg: '#05060f',
  params: [
    { key: 'arms', label: '旋臂数', min: 2, max: 6, step: 1, value: 2 },
    { key: 'count', label: '恒星数', min: 600, max: 5200, step: 200, value: 3000 },
  ],
  actions: [{ key: 'reset', label: '重新撒星' }],
  create(ctx) {
    const MAX = 5200
    let w = 800
    let h = 360
    let arms = 2
    let count = 3000
    let t = 0
    let stars = []
    const palette = makePalette(48, 88, 66, 0.9)

    const rebuild = () => {
      const rMax = Math.min(w, h) / 2 - 8
      const rMin = 22
      stars = Array.from({ length: MAX }, (_, i) => {
        const u = Math.pow(i / MAX, 0.62)
        const a = rMin + u * (rMax - rMin)
        return {
          a,
          /* 偏心率随半径略增：内侧近圆、外侧更扁，正是真实旋涡星系的观感 */
          e: 0.18 + u * 0.22,
          phase: Math.random() * TAU,
          /* 开普勒角速度 ω ∝ a^-1.5 —— 内圈转得快 */
          omega: 520 / Math.pow(a, 1.5),
          size: rand(0.5, 1.5),
          hue: Math.round(u * 47),
        }
      })
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        rebuild()
        ctx.fillStyle = '#05060f'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts) {
        t = ts / 1000
        ctx.fillStyle = 'rgba(5, 6, 15, 0.2)'
        ctx.fillRect(0, 0, w, h)
        const cx = w / 2
        const cy = h / 2

        /* 椭圆长轴朝向 φ(a) = k·ln a —— 用对数让旋臂等间距，k 由旋臂数决定 */
        const rSpan = Math.log((Math.min(w, h) / 2 - 8) / 22)
        const twist = (arms * TAU) / (rSpan || 1)

        for (let i = 0; i < count; i += 1) {
          const s = stars[i]
          const theta = s.phase + s.omega * t
          const b = s.a * Math.sqrt(1 - s.e * s.e)
          const x0 = s.a * (Math.cos(theta) - s.e)
          const y0 = b * Math.sin(theta)
          const phi = twist * Math.log(s.a / 22)
          const cosP = Math.cos(phi)
          const sinP = Math.sin(phi)
          const x = x0 * cosP - y0 * sinP
          const y = x0 * sinP + y0 * cosP
          ctx.fillStyle = palette[s.hue]
          ctx.fillRect(cx + x - s.size / 2, cy + y - s.size / 2, s.size, s.size)
        }

        /* 核球：中心一圈更暖更亮的星 */
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26)
        g.addColorStop(0, 'rgba(255, 244, 214, 0.95)')
        g.addColorStop(0.4, 'rgba(255, 214, 140, 0.35)')
        g.addColorStop(1, 'rgba(255, 180, 80, 0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(cx, cy, 26, 0, TAU)
        ctx.fill()
      },
      pointer() {},
      setParam(k, v) {
        if (k === 'arms') arms = v
        if (k === 'count') count = v
      },
      action() { rebuild() },
      destroy() {},
    }
  },
}

export default galaxy
