/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 数值与优化 · 高尔顿板 —— 二项分布涌现出正态
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp, rand } from '../../utils/math.js'

const galton = {
  id: 'galton',
  title: '高尔顿板',
  tag: '二项分布涌现出正态',
  desc: '小球从顶上落下，每碰到一根钉子就随机往左或往右弹一格。单看一个小球毫无规律，但几千个球堆到底部之后，落点分布会精确地收敛成钟形曲线 —— 每颗钉子就是一次「+1 或 −1」，而大量独立随机量之和必然趋向正态，这是中心极限定理最直观的证据。',
  bg: '#04060d',
  params: [
    { key: 'rows', label: '钉子层数', min: 4, max: 22, step: 1, value: 14 },
    { key: 'rate', label: '每帧投球', min: 1, max: 40, step: 1, value: 14 },
    { key: 'speed', label: '下落速度', min: 0.2, max: 3, step: 0.1, value: 1.2 },
  ],
  actions: [
    { key: 'clear', label: '清空直方图' },
    { key: 'burst', label: '投一大把' },
  ],
  create(ctx) {
    const MAXB = 900
    let w = 800
    let h = 360
    let rows = 14
    let rate = 14
    let speed = 1.2
    const bx = new Float32Array(MAXB)
    const by = new Float32Array(MAXB)
    /* 每个球用「还剩几步 + 当前横向偏移」表示，走到头直接落进对应的槽 */
    const bStep = new Int16Array(MAXB)
    const bOff = new Int16Array(MAXB)
    const bBias = new Float32Array(MAXB)
    let slots = new Int32Array(64)
    let total = 0

    const boardTop = () => h * 0.1
    const boardBot = () => h * 0.68
    const pegStep = () => (boardBot() - boardTop()) / Math.max(1, rows)

    const dropBall = (i) => {
      bx[i] = w / 2 + rand(-3, 3)
      by[i] = boardTop() - rand(0, 12)
      bStep[i] = 0
      bOff[i] = 0
      bBias[i] = Math.random()
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        slots = new Int32Array(rows + 1)
        total = 0
        for (let i = 0; i < MAXB; i += 1) dropBall(i)
        ctx.fillStyle = '#04060d'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        const step = pegStep()
        const top = boardTop()

        /* 投球：从「当前没在用的」里循环取 */
        const n = Math.max(1, Math.round(rate * Math.min(dt * 60, 2)))
        for (let k = 0; k < n; k += 1) {
          const i = (Math.random() * MAXB) | 0
          if (bStep[i] > rows) continue
          if (bStep[i] === rows && by[i] >= boardBot() - 2) {
            /* 落槽：记账后重生 */
            const slot = clamp(bOff[i] + (rows >> 1), 0, rows)
            slots[slot] += 1
            total += 1
            dropBall(i)
          }
        }

        /* 推进：每到一层留一格时间，横向偏一格 */
        for (let i = 0; i < MAXB; i += 1) {
          if (bStep[i] > rows) continue
          by[i] += 320 * speed * dt * (1 + bStep[i] * 0.12)
          const targetY = top + bStep[i] * step
          if (by[i] >= targetY && bStep[i] < rows) {
            bStep[i] += 1
            bOff[i] += bBias[i] < 0.5 ? -1 : 1
            bBias[i] = Math.random()
          }
        }

        ctx.fillStyle = 'rgba(4, 6, 13, 0.4)'
        ctx.fillRect(0, 0, w, h)

        /* 钉子：第 i 层有 i+1 根，最后一层的槽位由 bOff 范围决定 */
        const maxCols = rows + 1
        const spanX = w * 0.72
        const x0 = (w - spanX) / 2
        const colW = spanX / maxCols
        ctx.fillStyle = '#6f86b8'
        for (let r = 1; r <= rows; r += 1) {
          const y = top + r * step
          for (let c = 0; c <= r; c += 1) {
            const x = w / 2 + (c - r / 2) * colW
            ctx.beginPath()
            ctx.arc(x, y, 1.7, 0, TAU)
            ctx.fill()
          }
        }

        /* 球 */
        ctx.fillStyle = '#ffd166'
        for (let i = 0; i < MAXB; i += 1) {
          if (bStep[i] > rows) continue
          ctx.fillRect(bx[i] - 1.6, by[i] - 1.6, 3.2, 3.2)
        }

        /* 直方图 + 正态拟合曲线 */
        const baseY = h - 14
        const maxH = h * 0.28
        let peak = 1
        for (let s = 0; s <= rows; s += 1) peak = Math.max(peak, slots[s])
        const bw = spanX / (rows + 1)
        ctx.fillStyle = 'rgba(120, 220, 255, 0.75)'
        for (let s = 0; s <= rows; s += 1) {
          const hh = (slots[s] / peak) * maxH
          if (hh <= 0) continue
          ctx.fillRect(x0 + s * bw + 1, baseY - hh, bw - 2, hh)
        }
        ctx.strokeStyle = '#ff9f6e'
        ctx.lineWidth = 1.6
        ctx.beginPath()
        const mean = rows / 2
        const sd = Math.sqrt(rows * 0.25) || 1
        for (let s = 0; s <= rows; s += 1) {
          const g = Math.exp(-((s - mean) ** 2) / (2 * sd * sd))
          const x = x0 + (s + 0.5) * bw
          const y = baseY - g * (maxH * 0.92)
          if (s === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

        ctx.fillStyle = '#dff6ff'
        ctx.font = '13px ui-monospace, monospace'
        ctx.fillText(`投球 ${total} · 层数 ${rows}`, 12, 22)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'rows') { rows = v; slots = new Int32Array(rows + 1); total = 0 }
        if (key === 'rate') rate = v
        if (key === 'speed') speed = v
      },
      action(key) {
        if (key === 'clear') { slots.fill(0); total = 0 }
        if (key === 'burst') {
          /* 直接按二项分布灌一批，曲线立刻成形 */
          for (let k = 0; k < 3000; k += 1) {
            let o = 0
            for (let r = 0; r < rows; r += 1) o += Math.random() < 0.5 ? -1 : 1
            slots[clamp(o + (rows >> 1), 0, rows)] += 1
            total += 1
          }
        }
      },
      destroy() {},
    }
  },
}

export default galton
