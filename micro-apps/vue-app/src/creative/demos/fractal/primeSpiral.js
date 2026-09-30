/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 分形与数学 · 素数螺旋 —— 乌拉姆螺旋的对角线
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { clamp } from '../../utils/math.js'

const primeSpiral = {
  id: 'prime-spiral',
  title: '素数螺旋',
  tag: '乌拉姆螺旋的对角线',
  desc: '把自然数按方形螺旋往外排，再标出素数 —— 它们会诡异地聚成一条条斜线。这些斜线对应的是形如 `4n²+bn+c` 的二次多项式，而二次多项式恰好是最容易「连续取到素数」的一类。素数分布没有简单规律，但这条现象说明：没有规律 ≠ 没有结构。',
  bg: '#03050c',
  params: [
    { key: 'side', label: '边长(每边格数)', min: 20, max: 220, step: 10, value: 120 },
    { key: 'speed', label: '填充速度', min: 0.2, max: 6, step: 0.2, value: 2 },
    { key: 'dot', label: '点大小', min: 0.6, max: 3.6, step: 0.2, value: 1.4 },
  ],
  actions: [
    { key: 'redraw', label: '重画' },
    { key: 'big', label: '一次画满' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let side = 120
    let speed = 2
    let dot = 1.4
    let filled = 0
    let hold = 0
    let primes = null
    let limit = 0

    const sieve = (n) => {
      const isP = new Uint8Array(n + 1)
      isP.fill(1)
      isP[0] = 0
      isP[1] = 0
      for (let i = 2; i * i <= n; i += 1) {
        if (!isP[i]) continue
        for (let j = i * i; j <= n; j += i) isP[j] = 0
      }
      return isP
    }

    const rebuild = () => {
      limit = side * side
      primes = sieve(limit)
      filled = 0
      hold = 0
      ctx.fillStyle = '#03050c'
      ctx.fillRect(0, 0, w, h)
    }

    /**
     * 第 n 个数在乌拉姆螺旋里的坐标（n 从 1 开始，1 在中心）。
     * 用「环号 + 该环上的位置」直接解析求，不需要一个个走。
     */
    const spiralAt = (n) => {
      const r = Math.floor((Math.sqrt(n - 1) + 1) / 2)
      /* 第 r 环的边长 2r，四个角上的数分别是 (2r+1)² 之类 */
      const side2 = 2 * r + 1
      const maxN = side2 * side2
      const edge = 2 * r
      const pos = maxN - n
      const leg = Math.floor(pos / edge)
      const off = pos % edge
      switch (leg) {
        case 0: return [r, r - off]
        case 1: return [r - off, -r]
        case 2: return [-r, -r + off]
        default: return [-r + off, r]
      }
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        rebuild()
      },
      frame(ts, dt) {
        if (hold > 0) { hold -= dt; return }
        const total = side * side
        const n = Math.max(1, Math.round(speed * total * 0.022 * Math.min(dt * 60, 2)))
        const cell = Math.min(w * 0.92, h * 0.92) / side
        const cx = w / 2
        const cy = h / 2
        const from = filled + 1
        filled = Math.min(total, filled + n)
        for (let i = from; i <= filled; i += 1) {
          if (!primes[i]) continue
          const p = spiralAt(i)
          /* 按「到中心的距离」上色：越外圈越暖，斜线会一段段连起来 */
          const rr = Math.hypot(p[0], p[1]) / (side * 0.72)
          ctx.fillStyle = `hsla(${210 - clamp(rr, 0, 1) * 130}, 88%, 64%, 0.92)`
          ctx.fillRect(cx + p[0] * cell - dot * 0.5, cy + p[1] * cell - dot * 0.5, dot, dot)
        }
        if (filled >= total) hold = 1.6
        ctx.fillStyle = '#dff6ff'
        ctx.font = '13px ui-monospace, monospace'
        ctx.fillText(`边长 ${side} · 已排 ${filled}/${total}`, 12, 22)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'side') { side = v; rebuild() }
        if (key === 'speed') speed = v
        if (key === 'dot') dot = v
      },
      action(key) {
        if (key === 'redraw') rebuild()
        if (key === 'big') filled = side * side
      },
      destroy() {},
    }
  },
}

export default primeSpiral
