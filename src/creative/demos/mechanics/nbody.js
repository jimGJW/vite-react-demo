/**
 * 天体与力学 · N 体引力 —— 引力积分 + 引力弹弓
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, rand } from '../../utils/math.js'
import { makePalette } from '../../utils/canvas.js'

const nbody = {
  id: 'nbody',
  title: 'N 体引力',
  tag: '引力积分 + 引力弹弓',
  desc: '每个天体都受其余所有天体的引力，加速度按 1/r² 算，靠近时加一个软化长度避免数值爆炸。看似简单的规则会自发产生旋臂、潮汐尾和「引力弹弓」—— 被甩出去的那个天体反而飞得更快。',
  bg: '#05060f',
  params: [
    { key: 'bodies', label: '天体数', min: 40, max: 320, step: 10, value: 180 },
    { key: 'soften', label: '软化长度', min: 2, max: 30, step: 1, value: 9 },
    { key: 'g', label: '引力常数', min: 20, max: 700, step: 10, value: 240 },
  ],
  actions: [{ key: 'reset', label: '重新坍缩' }],
  create(ctx) {
    let w = 800
    let h = 360
    let count = 180
    let soften = 9
    let G = 240
    const MAXN = 320
    const px = new Float32Array(MAXN)
    const py = new Float32Array(MAXN)
    const vx = new Float32Array(MAXN)
    const vy = new Float32Array(MAXN)
    const ax = new Float32Array(MAXN)
    const ay = new Float32Array(MAXN)
    const mass = new Float32Array(MAXN)
    const hue = new Float32Array(MAXN)
    const palette = makePalette(14, 78, 66, 0.92)

    const seed = () => {
      const cx = w / 2
      const cy = h / 2
      const R = Math.min(w, h) * 0.4
      for (let i = 0; i < MAXN; i += 1) {
        const a = Math.random() * TAU
        const r = Math.sqrt(Math.random()) * R
        px[i] = cx + Math.cos(a) * r
        py[i] = cy + Math.sin(a) * r
        /* 给一个切向速度：不同半径上略有差异 → 自然摊成盘状而不是直接塌成一团 */
        const v = Math.sqrt(G * 90 / (r + 20)) * (0.42 + Math.random() * 0.18)
        vx[i] = -Math.sin(a) * v
        vy[i] = Math.cos(a) * v
        mass[i] = 0.6 + Math.random() * 1.4
        hue[i] = Math.random()
      }
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        seed()
        ctx.fillStyle = '#05060f'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        const step = Math.min(dt, 1 / 30)
        /* 每帧跑 3 个子步 —— 近距离擦肩时一步走太大会直接弹飞 */
        const sub = 3
        const hh = step / sub
        for (let s = 0; s < sub; s += 1) {
          ax.fill(0, 0, count)
          ay.fill(0, 0, count)
          for (let i = 0; i < count; i += 1) {
            for (let j = i + 1; j < count; j += 1) {
              const dx = px[j] - px[i]
              const dy = py[j] - py[i]
              const r2 = dx * dx + dy * dy + soften * soften
              const inv = G / (r2 * Math.sqrt(r2))
              const fx = dx * inv
              const fy = dy * inv
              ax[i] += fx * mass[j]
              ay[i] += fy * mass[j]
              ax[j] -= fx * mass[i]
              ay[j] -= fy * mass[i]
            }
          }
          for (let i = 0; i < count; i += 1) {
            vx[i] += ax[i] * hh
            vy[i] += ay[i] * hh
            px[i] += vx[i] * hh
            py[i] += vy[i] * hh
          }
        }
        /* 出界太远就拉回来，避免跑丢几个之后越跑越远 */
        for (let i = 0; i < count; i += 1) {
          if (px[i] < -w || px[i] > w * 2 || py[i] < -h || py[i] > h * 2) {
            px[i] = w / 2 + rand(-20, 20)
            py[i] = h / 2 + rand(-20, 20)
            vx[i] *= 0.2
            vy[i] *= 0.2
          }
        }

        ctx.fillStyle = 'rgba(5, 6, 15, 0.16)'
        ctx.fillRect(0, 0, w, h)
        ctx.globalAlpha = 0.92
        for (let i = 0; i < count; i += 1) {
          ctx.fillStyle = palette[(hue[i] * 14) | 0]
          const r = 1 + mass[i] * 0.9
          ctx.fillRect(px[i], py[i], r, r)
        }
        ctx.globalAlpha = 1
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'bodies') { count = v; seed() }
        if (key === 'soften') soften = v
        if (key === 'g') { G = v; seed() }
      },
      action(key) {
        if (key === 'reset') seed()
      },
      destroy() {},
    }
  },
}

export default nbody
