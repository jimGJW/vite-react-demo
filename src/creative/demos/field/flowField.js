/**
 * 场与流体 · 流场丝绸 —— 噪声流场 + 长拖尾
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp } from '../../utils/math.js'
import { BG, makePalette } from '../../utils/canvas.js'

const flowField = {
  id: 'flow-field',
  title: '流场丝绸',
  tag: '噪声流场 + 长拖尾',
  desc: '一千多个粒子沿一个伪噪声速度场飘移，每个粒子每帧只画一小段线。无数短线段叠出丝绸质感 —— 这是可视化「场」最省力的做法：不画箭头，让粒子替你把场走一遍。',
  bg: BG,
  params: [
    { key: 'count', label: '粒子数', min: 200, max: 3000, step: 100, value: 1300 },
    { key: 'speed', label: '流速', min: 10, max: 140, step: 5, value: 52 },
  ],
  actions: [{ key: 'reset', label: '重播' }],
  create(ctx) {
    let w = 800
    let h = 360
    let t = 0
    let count = 1300
    let speed = 52
    const MAX = 3000
    const BUCKETS = 36
    const palette = makePalette(BUCKETS, 80, 62, 0.34)
    const seeds = new Float32Array(MAX * 2)
    const segs = new Float32Array(BUCKETS * MAX * 4)

    const seedAll = () => {
      for (let i = 0; i < MAX; i += 1) {
        seeds[i * 2] = Math.random() * w
        seeds[i * 2 + 1] = Math.random() * h
      }
    }
    const angleAt = (x, y) => (
      Math.sin(x * 0.0062 + t * 0.00022) * 2.1
      + Math.cos(y * 0.0051 - t * 0.00017) * 1.9
      + Math.sin((x + y) * 0.0034) * 1.4
    )

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        seedAll()
        ctx.fillStyle = BG
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        t = ts
        /* 半透明覆写而不是 clearRect —— 这一行就是「长拖尾」的全部秘密 */
        ctx.fillStyle = 'rgba(11, 17, 32, 0.05)'
        ctx.fillRect(0, 0, w, h)

        const counts = new Int32Array(BUCKETS)
        const step = speed * dt
        for (let i = 0; i < count; i += 1) {
          const x = seeds[i * 2]
          const y = seeds[i * 2 + 1]
          const a = angleAt(x, y)
          const nx = x + Math.cos(a) * step
          const ny = y + Math.sin(a) * step
          /* 色相跟着流向走：同一个场，用颜色把方向也编码进去 */
          const b = clamp(Math.round(((a + Math.PI) / TAU) * BUCKETS), 0, BUCKETS - 1)
          const n = counts[b]
          const o = (b * MAX + n) * 4
          segs[o] = x
          segs[o + 1] = y
          segs[o + 2] = nx
          segs[o + 3] = ny
          counts[b] = n + 1

          if (nx < -4 || nx > w + 4 || ny < -4 || ny > h + 4) {
            seeds[i * 2] = Math.random() * w
            seeds[i * 2 + 1] = Math.random() * h
          } else {
            seeds[i * 2] = nx
            seeds[i * 2 + 1] = ny
          }
        }

        /* 按色相分桶，36 次 stroke 画完 1300 条线（逐条 stroke 会慢一个数量级） */
        ctx.lineWidth = 1
        for (let b = 0; b < BUCKETS; b += 1) {
          const n = counts[b]
          if (!n) continue
          ctx.strokeStyle = palette[b]
          ctx.beginPath()
          const base = b * MAX
          for (let i = 0; i < n; i += 1) {
            const o = (base + i) * 4
            ctx.moveTo(segs[o], segs[o + 1])
            ctx.lineTo(segs[o + 2], segs[o + 3])
          }
          ctx.stroke()
        }
      },
      pointer() {},
      setParam(k, v) {
        if (k === 'count') count = Math.min(v, MAX)
        if (k === 'speed') speed = v
      },
      action() { seedAll() },
      destroy() {},
    }
  },
}

export default flowField
