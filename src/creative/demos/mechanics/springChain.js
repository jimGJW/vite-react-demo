/**
 * 天体与力学 · 弹簧链振动 —— 耦合振子 + 波传播
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp } from '../../utils/math.js'
import { makeStepper } from '../../utils/canvas.js'

const springChain = {
  id: 'spring-chain',
  title: '弹簧链振动',
  tag: '耦合振子 + 波传播',
  desc: '一串用弹簧连起来的质点，只有相邻两个之间有作用力，但推动一端会看到波沿着链传播 —— 宏观的「波」不需要任何宏观的波方程，它是局部耦合规则的集体行为。刚度调高波速变快、阻尼调低尾波拖得更长，色相直接编码每个质点的位移。',
  bg: '#04070e',
  params: [
    { key: 'nodes', label: '质点数', min: 12, max: 120, step: 4, value: 54 },
    { key: 'stiff', label: '刚度', min: 4, max: 90, step: 2, value: 34 },
    { key: 'damp', label: '阻尼', min: 0, max: 1, step: 0.02, value: 0.12 },
    { key: 'drive', label: '驱动频率', min: 0, max: 6, step: 0.1, value: 2.4 },
  ],
  actions: [
    { key: 'pluck', label: '拨一下' },
    { key: 'calm', label: '静止' },
  ],
  create(ctx) {
    const MAXN = 120
    let w = 800
    let h = 360
    let n = 54
    let stiff = 34
    let damp = 0.12
    let drive = 2.4
    let t = 0
    const y = new Float32Array(MAXN)
    const v = new Float32Array(MAXN)

    const integrate = (dt) => {
      /* 固定左端，右端不驱动；激励加在左起第二个质点上 */
      for (let i = 1; i < n - 1; i += 1) {
        const left = y[i - 1]
        const right = y[i + 1]
        const acc = (left + right - 2 * y[i]) * stiff
        v[i] += (acc - v[i] * damp * 12) * dt
      }
      for (let i = 1; i < n; i += 1) y[i] += v[i] * dt
      y[0] = 0
      v[0] = 0
      /* 左起第二个质点做受迫振动 —— 这就是「摇绳子」的那只手 */
      y[1] = Math.sin(t * drive) * 26
      v[1] = 0
    }
    const stepper = makeStepper(1 / 480, integrate)

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        y.fill(0)
        v.fill(0)
        ctx.fillStyle = '#04070e'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        t += dt
        stepper(Math.min(dt, 0.05))

        ctx.fillStyle = 'rgba(4, 7, 14, 0.2)'
        ctx.fillRect(0, 0, w, h)

        const mid = h * 0.5
        const span = w * 0.9
        const x0 = w * 0.05
        const gap = n > 1 ? span / (n - 1) : span

        /* 弹簧：按拉伸量着色（色相编码位移方向与大小） */
        ctx.lineWidth = 1.6
        ctx.beginPath()
        for (let i = 0; i < n - 1; i += 1) {
          ctx.moveTo(x0 + i * gap, mid + y[i])
          ctx.lineTo(x0 + (i + 1) * gap, mid + y[i + 1])
        }
        ctx.strokeStyle = 'rgba(110, 150, 220, 0.5)'
        ctx.stroke()

        /* 质点：位移当色相，越偏越亮 */
        for (let i = 0; i < n; i += 1) {
          const d = clamp(y[i] / 30, -1, 1)
          ctx.fillStyle = `hsl(${200 - d * 160}, 88%, ${44 + Math.abs(d) * 30}%)`
          ctx.beginPath()
          ctx.arc(x0 + i * gap, mid + y[i], 3.4, 0, TAU)
          ctx.fill()
        }

        /* 平衡位置基准线 */
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x0, mid)
        ctx.lineTo(x0 + span, mid)
        ctx.stroke()
      },
      pointer(kind, x, y2) {
        if (kind !== 'down' && kind !== 'move') return
        /* 直接拽住最近的质点 —— 手动拨弦 */
        const span = w * 0.9
        const x0 = w * 0.05
        const gap = n > 1 ? span / (n - 1) : span
        const i = clamp(Math.round((x - x0) / gap), 1, n - 1)
        y[i] = y2 - h * 0.5
      },
      setParam(key, v2) {
        if (key === 'nodes') { n = Math.min(MAXN, Math.max(4, v2)); y.fill(0); v.fill(0) }
        if (key === 'stiff') stiff = v2
        if (key === 'damp') damp = v2
        if (key === 'drive') drive = v2
      },
      action(key) {
        if (key === 'pluck') {
          /* 在半长处给一个三角波初位移，松手后左右各走一趟 */
          for (let i = 0; i < n; i += 1) {
            y[i] = Math.sin((i / n) * Math.PI) * 30
            v[i] = 0
          }
        }
        if (key === 'calm') { y.fill(0); v.fill(0) }
      },
      destroy() {},
    }
  },
}

export default springChain
