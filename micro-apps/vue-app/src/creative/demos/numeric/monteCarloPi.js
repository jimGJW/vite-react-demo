/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 数值与优化 · 蒙特卡洛求 π —— 随机撒点 + 面积比
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { clamp } from '../../utils/math.js'

const monteCarloPi = {
  id: 'monte-carlo-pi',
  title: '蒙特卡洛求 π',
  tag: '随机撒点 + 面积比',
  desc: '往单位正方形里随机撒点，落在四分之一圆内的比例就是 π/4 —— 于是数一数比例、乘四，就得到 π。这个算法慢得离谱（每多一位精度要多 100 倍样本），但它不依赖任何几何公式，只依赖「面积 = 概率」这一件事。当解析解写不出来的时候，这种「用随机数硬算」的办法往往是唯一出路。',
  bg: '#04060d',
  params: [
    { key: 'rate', label: '每帧撒点', min: 10, max: 2000, step: 10, value: 300 },
    { key: 'keep', label: '保留已撒点(0/1)', min: 0, max: 1, step: 1, value: 1 },
  ],
  actions: [
    { key: 'reset', label: '重来' },
    { key: 'million', label: '灌十万点' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let rate = 300
    let keep = 1
    let inside = 0
    let total = 0
    let est = 0
    const hist = []
    const pts = []

    const sq = () => {
      const s = Math.min(w * 0.46, h * 0.84)
      return { x: w * 0.34 - s / 2, y: (h - s) / 2, s }
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        inside = 0
        total = 0
        est = 0
        hist.length = 0
        pts.length = 0
        ctx.fillStyle = '#04060d'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        const n = Math.max(1, Math.round(rate * Math.min(dt * 60, 2)))
        for (let i = 0; i < n; i += 1) {
          const x = Math.random()
          const y = Math.random()
          const hit = x * x + y * y <= 1
          if (hit) inside += 1
          total += 1
          if (keep && pts.length < 12000) pts.push(x, y, hit ? 1 : 0)
        }
        est = total ? (inside / total) * 4 : 0
        hist.push(est)
        if (hist.length > 400) hist.shift()

        ctx.fillStyle = 'rgba(4, 6, 13, 0.35)'
        ctx.fillRect(0, 0, w, h)

        const { x: ox, y: oy, s } = sq()
        /* 正方形与四分之一圆 */
        ctx.strokeStyle = 'rgba(140, 180, 255, 0.6)'
        ctx.lineWidth = 1.4
        ctx.strokeRect(ox, oy, s, s)
        ctx.strokeStyle = 'rgba(255, 190, 120, 0.75)'
        ctx.beginPath()
        ctx.arc(ox, oy + s, s, -Math.PI / 2, 0)
        ctx.stroke()

        /* 落点：命中偏青、未命中偏灰紫 */
        for (let i = 0; i < pts.length; i += 3) {
          ctx.fillStyle = pts[i + 2] ? 'rgba(110, 240, 210, 0.7)' : 'rgba(140, 140, 200, 0.45)'
          ctx.fillRect(ox + pts[i] * s, oy + (1 - pts[i + 1]) * s, 1.6, 1.6)
        }

        /* 收敛曲线：以真 π 为基准，画估值的偏差 */
        const gx = w * 0.6
        const gy = oy
        const gwd = w * 0.36
        const ght = s
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.fillRect(gx, gy, gwd, ght)
        const lo = Math.PI - 0.9
        const hi = Math.PI + 0.9
        const yOf = (v) => gy + ght - ((clamp(v, lo, hi) - lo) / (hi - lo)) * ght
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
        ctx.beginPath()
        ctx.moveTo(gx, yOf(Math.PI))
        ctx.lineTo(gx + gwd, yOf(Math.PI))
        ctx.stroke()
        ctx.strokeStyle = '#8ee6ff'
        ctx.lineWidth = 1.4
        ctx.beginPath()
        for (let i = 0; i < hist.length; i += 1) {
          const x = gx + (i / 399) * gwd
          const y = yOf(hist[i])
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

        ctx.fillStyle = '#dff6ff'
        ctx.font = '13px ui-monospace, monospace'
        ctx.fillText(`估算 π = ${est.toFixed(5)}`, gx + 8, gy + 20)
        ctx.fillText(`样本 ${total}`, gx + 8, gy + 38)
        ctx.fillText(`真值 π = 3.14159`, gx + 8, gy + 56)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'rate') rate = v
        if (key === 'keep') { keep = v; if (!v) pts.length = 0 }
      },
      action(key) {
        if (key === 'reset') {
          inside = 0
          total = 0
          est = 0
          hist.length = 0
          pts.length = 0
        }
        if (key === 'million') {
          for (let i = 0; i < 100000; i += 1) {
            const x = Math.random()
            const y = Math.random()
            if (x * x + y * y <= 1) inside += 1
            total += 1
          }
          est = (inside / total) * 4
          hist.push(est)
        }
      },
      destroy() {},
    }
  },
}

export default monteCarloPi
