/**
 * 天体与力学 · 理想气体与麦克斯韦分布 —— 弹性碰撞 + 速率直方图
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp, rand } from '../../utils/math.js'
import { makeStepper } from '../../utils/canvas.js'

const idealGas = {
  id: 'ideal-gas',
  title: '理想气体与麦克斯韦分布',
  tag: '弹性碰撞 + 速率直方图',
  desc: '一盒分子各飞各的，撞墙反弹、互相弹性碰撞。单个分子完全不可预测，但速率的分布会自己收敛到麦克斯韦-玻尔兹曼分布那条曲线 —— 这就是「温度」的微观含义：它就是分布宽度的量度。右侧那根可拖动的活塞压缩体积时，分子撞得更频繁、平均动能上升，温度自己就升高了。',
  bg: '#03050d',
  params: [
    { key: 'count', label: '分子数', min: 40, max: 420, step: 20, value: 180 },
    { key: 'temp', label: '温度', min: 0.2, max: 3, step: 0.1, value: 1 },
    { key: 'piston', label: '活塞位置', min: 0.35, max: 0.98, step: 0.01, value: 0.98 },
  ],
  actions: [
    { key: 'heat', label: '加热' },
    { key: 'cool', label: '冷却' },
  ],
  create(ctx) {
    const MAXP = 420
    const BINS = 26
    let w = 800
    let h = 360
    let count = 180
    let temp = 1
    let piston = 0.98
    const px = new Float32Array(MAXP)
    const py = new Float32Array(MAXP)
    const vx = new Float32Array(MAXP)
    const vy = new Float32Array(MAXP)
    const hist = new Int32Array(BINS)

    const boxL = () => w * 0.04
    const boxR = () => w * piston
    const boxT = () => h * 0.06
    const boxB = () => h * 0.94

    const reset = () => {
      const base = Math.sqrt(temp) * 150
      for (let i = 0; i < MAXP; i += 1) {
        px[i] = rand(boxL(), boxR())
        py[i] = rand(boxT(), boxB())
        const a = Math.random() * TAU
        const sp = base * rand(0.4, 1.7)
        vx[i] = Math.cos(a) * sp
        vy[i] = Math.sin(a) * sp
      }
    }

    const step = (dt) => {
      const L = boxL()
      const R = boxR()
      const T = boxT()
      const B = boxB()
      for (let i = 0; i < MAXP; i += 1) {
        if (i >= count) break
        px[i] += vx[i] * dt
        py[i] += vy[i] * dt
        if (px[i] < L) { px[i] = L; vx[i] = Math.abs(vx[i]) }
        if (px[i] > R) { px[i] = R; vx[i] = -Math.abs(vx[i]) }
        if (py[i] < T) { py[i] = T; vy[i] = Math.abs(vy[i]) }
        if (py[i] > B) { py[i] = B; vy[i] = -Math.abs(vy[i]) }
      }
    }
    const stepper = makeStepper(1 / 240, step)

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        reset()
        ctx.fillStyle = '#03050d'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        stepper(Math.min(dt, 0.05))

        ctx.fillStyle = '#03050d'
        ctx.fillRect(0, 0, w, h)

        const L = boxL()
        const R = boxR()
        const T = boxT()
        const B = boxB()

        /* 容器 */
        ctx.strokeStyle = 'rgba(120, 165, 240, 0.6)'
        ctx.lineWidth = 2
        ctx.strokeRect(L, T, R - L, B - T)
        /* 活塞 */
        ctx.fillStyle = 'rgba(255, 190, 120, 0.75)'
        ctx.fillRect(R, T - 6, 6, B - T + 12)

        /* 分子 + 直方图累加 */
        hist.fill(0)
        let sumSp = 0
        let live = 0
        for (let i = 0; i < MAXP; i += 1) {
          if (i >= count) break
          const sp = Math.hypot(vx[i], vy[i])
          sumSp += sp
          live += 1
          const rel = sp / 500
          if (rel < 1) hist[Math.min(BINS - 1, (rel * BINS) | 0)] += 1
          /* 速率映射成色相：慢的偏红、快的偏青 —— 「温度」直接看得见 */
          ctx.fillStyle = `hsl(${210 - clamp(sp / 500, 0, 1) * 200}, 88%, 66%)`
          ctx.fillRect(px[i] - 1.2, py[i] - 1.2, 2.4, 2.4)
        }
        const meanSp = live ? sumSp / live : 0

        /* 直方图（画在盒子右上角的浮层里，不占额外宽度） */
        const gx = L + 10
        const gy = T + 12
        const gwd = Math.min(240, (R - L) * 0.42)
        const ght = 68
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
        ctx.fillRect(gx - 4, gy - 4, gwd + 8, ght + 22)
        let peak = 1
        for (let b = 0; b < BINS; b += 1) peak = Math.max(peak, hist[b])
        const bw = gwd / BINS
        for (let b = 0; b < BINS; b += 1) {
          const hh = (hist[b] / peak) * ght
          /* 理论曲线：麦克斯韦分布在 2D 下就是瑞利分布，峰值在 σ 处 */
          ctx.fillStyle = `hsla(${200 - (b / BINS) * 160}, 85%, 62%, 0.85)`
          ctx.fillRect(gx + b * bw, gy + ght - hh, Math.max(1, bw - 1.4), hh)
        }
        ctx.fillStyle = '#dff6ff'
        ctx.font = '12px ui-monospace, monospace'
        ctx.fillText(`平均速率 ${meanSp.toFixed(0)}  ·  分子数 ${live}`, gx, gy + ght + 15)
      },
      pointer(kind, x) {
        if (kind !== 'down' && kind !== 'move') return
        /* 拖活塞：往左压 = 绝热压缩，温度自己升上去 */
        if (x > w * 0.3) piston = clamp(x / w, 0.35, 0.98)
      },
      setParam(key, v) {
        if (key === 'count') count = Math.min(MAXP, v)
        if (key === 'temp') { temp = v; reset() }
        if (key === 'piston') piston = v
      },
      action(key) {
        if (key === 'heat') {
          temp = clamp(temp + 0.3, 0.2, 3)
          for (let i = 0; i < MAXP; i += 1) { vx[i] *= 1.4; vy[i] *= 1.4 }
        }
        if (key === 'cool') {
          temp = clamp(temp - 0.3, 0.2, 3)
          for (let i = 0; i < MAXP; i += 1) { vx[i] *= 0.7; vy[i] *= 0.7 }
        }
      },
      destroy() {},
    }
  },
}

export default idealGas
