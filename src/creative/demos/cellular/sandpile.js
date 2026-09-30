/**
 * 元胞自动机与自组织 · 沙堆的自组织临界 —— 崩塌 + 幂律雪崩
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { makeFieldBuffer } from '../../utils/canvas.js'

const sandpile = {
  id: 'sandpile',
  title: '沙堆的自组织临界',
  tag: '崩塌 + 幂律雪崩',
  desc: '一格超过 3 粒沙就向四邻各散 1 粒，连锁反应就是一次「雪崩」。系统会自己爬到临界状态：此后雪崩大小的分布严格服从幂律 —— 小崩塌极多、大崩塌罕见但一定会发生。地震、股市闪崩、森林火灾都被认为属于这一类系统。',
  bg: '#0a0806',
  params: [
    { key: 'rate', label: '落沙/帧', min: 1, max: 60, step: 1, value: 12 },
    { key: 'cap', label: '崩塌上限', min: 200, max: 12000, step: 200, value: 4200 },
  ],
  actions: [
    { key: 'dump', label: '倒一大把' },
    { key: 'reset', label: '清空' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let rate = 12
    let cap = 4200
    const buf = makeFieldBuffer(2)
    let gw = 2
    let gh = 2
    let grid = new Int32Array(4)
    const queue = new Int32Array(1 << 16)
    let qh = 0
    let qt = 0
    let avalanches = 0
    let biggest = 0

    /** 颜色表：0~3 粒由暗到亮，>=4（正在崩塌）用醒目的橙色 */
    const SAND = [
      [22, 16, 12], [92, 58, 30], [158, 108, 52], [226, 176, 96],
    ]

    const alloc = () => {
      buf.resize(w, h)
      gw = buf.width
      gh = buf.height
      grid = new Int32Array(gw * gh)
      qh = 0
      qt = 0
      avalanches = 0
      biggest = 0
    }

    /** 把 (i) 入队；队列满就丢弃（宁可不崩，也不能让内存无限涨） */
    const push = (i) => {
      const nx = (qt + 1) & 0xffff
      if (nx === qh) return
      queue[qt] = i
      qt = nx
    }

    const topple = (budget) => {
      let n = 0
      while (n < budget && qh !== qt) {
        const i = queue[qh]
        qh = (qh + 1) & 0xffff
        if (grid[i] < 4) continue
        grid[i] -= 4
        const x = i % gw
        const y = (i / gw) | 0
        if (x > 0) { grid[i - 1] += 1; if (grid[i - 1] >= 4) push(i - 1) }
        if (x < gw - 1) { grid[i + 1] += 1; if (grid[i + 1] >= 4) push(i + 1) }
        if (y > 0) { grid[i - gw] += 1; if (grid[i - gw] >= 4) push(i - gw) }
        if (y < gh - 1) { grid[i + gw] += 1; if (grid[i + gw] >= 4) push(i + gw) }
        n += 1
      }
      return n
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        alloc()
        ctx.fillStyle = '#0a0806'
        ctx.fillRect(0, 0, w, h)
      },
      frame() {
        const d = buf.data
        /* 落沙：随机位置加 1 粒 */
        for (let k = 0; k < rate; k += 1) {
          const i = (Math.random() * gw * gh) | 0
          grid[i] += 1
          if (grid[i] >= 4) push(i)
        }
        const done = topple(cap)
        if (done > 0) { avalanches += 1; if (done > biggest) biggest = done }

        const n = gw * gh
        for (let i = 0; i < n; i += 1) {
          const v = grid[i]
          const p = i * 4
          if (v >= 4) {
            d[p] = 255; d[p + 1] = 132; d[p + 2] = 46
          } else {
            const c = SAND[v < 0 ? 0 : v > 3 ? 3 : v]
            d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]
          }
          d[p + 3] = 255
        }
        buf.blit(ctx, w, h)

        ctx.fillStyle = 'rgba(255, 214, 150, 0.85)'
        ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, monospace'
        ctx.textAlign = 'left'
        ctx.fillText(`雪崩 ${avalanches} 次 · 最大 ${biggest} 次崩塌`, 12, 20)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'rate') rate = v
        if (key === 'cap') cap = v
      },
      action(key) {
        if (key === 'dump') {
          /* 倒一大把：必然引发一次大崩塌，是看幂律最直观的方式 */
          for (let k = 0; k < gw * gh / 6; k += 1) {
            const i = (Math.random() * gw * gh) | 0
            grid[i] += 1
            if (grid[i] >= 4) push(i)
          }
        }
        if (key === 'reset') {
          grid.fill(0)
          qh = 0
          qt = 0
          avalanches = 0
          biggest = 0
        }
      },
      destroy() {},
    }
  },
}

export default sandpile
