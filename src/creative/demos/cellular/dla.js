/**
 * 元胞自动机与自组织 · 扩散限制凝聚 —— 随机行走 + 附着
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU } from '../../utils/math.js'
import { makeFieldBuffer } from '../../utils/canvas.js'

const dla = {
  id: 'dla',
  title: '扩散限制凝聚',
  tag: '随机行走 + 附着',
  desc: '一堆粒子从远处随机行走，一旦碰到已有的凝聚体就粘住不动。没有生长方向、没有能量最低原理，只靠「先到先粘」就长出了枝晶和珊瑚状的团簇 —— 电解沉积、闪电纹路、烟灰颗粒都是这么长出来的。',
  bg: '#04070e',
  params: [
    { key: 'walkers', label: '行走者', min: 1, max: 60, step: 1, value: 24 },
    { key: 'stick', label: '附着概率', min: 0.1, max: 1, step: 0.05, value: 1 },
    { key: 'step', label: '每帧步数', min: 1, max: 60, step: 1, value: 14 },
  ],
  actions: [
    { key: 'clear', label: '清空重长' },
    { key: 'burst', label: '一次撒开' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let nWalkers = 24
    let stick = 1
    let steps = 14
    const buf = makeFieldBuffer(3)
    let gw = 2
    let gh = 2
    let grid = new Uint8Array(4)
    const MAXW = 60
    const wx = new Float64Array(MAXW)
    const wy = new Float64Array(MAXW)
    let cluster = 1

    const spawn = (i) => {
      /* 出发点半径跟着团簇长大 —— 贴着长出来的枝梢撒点，效率高得多 */
      const r = Math.max(14, cluster * 1.25)
      const a = Math.random() * TAU
      wx[i] = gw / 2 + Math.cos(a) * r
      wy[i] = gh / 2 + Math.sin(a) * r
    }

    const clear = () => {
      buf.resize(w, h)
      gw = buf.width
      gh = buf.height
      grid = new Uint8Array(gw * gh)
      const cx = Math.floor(gw / 2)
      const cy = Math.floor(gh / 2)
      grid[cy * gw + cx] = 1
      cluster = 1
      for (let i = 0; i < MAXW; i += 1) spawn(i)
    }

    /** 一次随机行走步进；返回是否刚粘住 */
    const walk = (i) => {
      const dx = Math.random() < 0.5 ? -1 : 1
      const dy = Math.random() < 0.5 ? -1 : 1
      wx[i] += dx
      wy[i] += dy
      const gx = wx[i] | 0
      const gy = wy[i] | 0
      if (gx < 1 || gy < 1 || gx >= gw - 1 || gy >= gh - 1) { spawn(i); return false }
      /* 四邻里有已凝聚的就粘住 */
      const j = gy * gw + gx
      if (grid[j]) { spawn(i); return false }
      if (grid[j - 1] || grid[j + 1] || grid[j - gw] || grid[j + gw]) {
        if (Math.random() > stick) return false
        grid[j] = 1
        cluster += 1
        spawn(i)
        return true
      }
      return false
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        clear()
        ctx.fillStyle = '#04070e'
        ctx.fillRect(0, 0, w, h)
      },
      frame() {
        for (let s = 0; s < steps; s += 1) {
          for (let i = 0; i < nWalkers; i += 1) walk(i)
        }

        const d = buf.data
        const n = gw * gh
        for (let i = 0; i < n; i += 1) {
          const p = i * 4
          if (grid[i]) {
            /* 按到中心的距离着色：内核偏白、外围偏青，枝晶的层次感就出来了 */
            const x = i % gw
            const y = (i / gw) | 0
            const rr = Math.hypot(x - gw / 2, y - gh / 2) / (gw * 0.5)
            const t = Math.min(1, rr * 1.5)
            d[p] = 236 - t * 170
            d[p + 1] = 246 - t * 90
            d[p + 2] = 255 - t * 110
          } else {
            d[p] = 4; d[p + 1] = 7; d[p + 2] = 14
          }
          d[p + 3] = 255
        }
        buf.blit(ctx, w, h)

        ctx.fillStyle = 'rgba(190, 230, 255, 0.8)'
        ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, monospace'
        ctx.textAlign = 'left'
        ctx.fillText(`凝聚粒子 ${cluster} · 枝晶半径约 ${(cluster * 1.25).toFixed(0)} 格`, 12, 20)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'walkers') nWalkers = v
        if (key === 'stick') stick = v
        if (key === 'step') steps = v
      },
      action(key) {
        if (key === 'clear') clear()
        /* 一次多跑 400 步：看得清枝晶是怎么分叉的 */
        if (key === 'burst') {
          for (let s = 0; s < 400; s += 1) {
            for (let i = 0; i < nWalkers; i += 1) walk(i)
          }
        }
      },
      destroy() {},
    }
  },
}

export default dla
