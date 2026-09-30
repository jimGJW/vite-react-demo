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
 * 几何与图案 · 最大圆堆积 —— 最优候选 + 相切填充
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp, rand } from '../../utils/math'

const circlePacking = {
  id: 'circle-packing',
  title: '最大圆堆积',
  tag: '最优候选 + 相切填充',
  desc: '每次随机撒几个候选点，算出每个点能放下的最大圆（到已有圆和边界的最短距离），只留最大的那个。就这么「取局部最好」的贪心，几十步之后圆会自动密铺成相切的结构，大小分布还呈现出幂律。这和真实啤酒气泡、细胞堆积的形态很像 —— 它们也是被「不能重叠」这一个约束逼出来的。',
  bg: '#04060d',
  params: [
    { key: 'tries', label: '每轮候选数', min: 4, max: 80, step: 2, value: 26 },
    { key: 'rate', label: '每帧放几个', min: 1, max: 16, step: 1, value: 3 },
    { key: 'maxR', label: '半径上限', min: 6, max: 60, step: 2, value: 26 },
  ],
  actions: [
    { key: 'restart', label: '重排' },
    { key: 'dump', label: '一口气填满' },
  ],
  create(ctx) {
    const MAXC = 1400
    let w = 800
    let h = 360
    let tries = 26
    let rate = 3
    let maxR = 26
    const cx = new Float32Array(MAXC)
    const cy = new Float32Array(MAXC)
    const cr = new Float32Array(MAXC)
    let n = 0

    const radiusAt = (x, y) => {
      let r = Math.min(x, y, w - x, h - y) - 3
      for (let i = 0; i < n; i += 1) {
        const dx = x - cx[i]
        const dy = y - cy[i]
        const d = Math.hypot(dx, dy) - cr[i]
        if (d < r) r = d
      }
      return Math.min(r, maxR)
    }

    const placeOne = () => {
      if (n >= MAXC) return false
      let bx = 0
      let by = 0
      let br = -1
      for (let k = 0; k < tries; k += 1) {
        const x = rand(3, w - 3)
        const y = rand(3, h - 3)
        const r = radiusAt(x, y)
        if (r > br) { br = r; bx = x; by = y }
      }
      /* 半径太小的候选直接丢掉，否则会变成一堆看不见的碎点 */
      if (br < 2.2) return false
      cx[n] = bx
      cy[n] = by
      cr[n] = br
      n += 1
      return true
    }

    const clear = () => {
      n = 0
      ctx.fillStyle = '#04060d'
      ctx.fillRect(0, 0, w, h)
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        clear()
      },
      frame() {
        let placed = 0
        for (let k = 0; k < rate; k += 1) if (placeOne()) placed += 1
        if (!placed) return
        /* 只画新增的那几个 —— 老圆不用重画，省掉每帧上千次 arc */
        ctx.lineWidth = 1.1
        for (let i = n - placed; i < n; i += 1) {
          const t = clamp(cr[i] / (maxR || 1), 0, 1)
          ctx.fillStyle = `hsla(${196 + t * 130}, 82%, ${34 + t * 26}%, 0.5)`
          ctx.beginPath()
          ctx.arc(cx[i], cy[i], cr[i], 0, TAU)
          ctx.fill()
          ctx.strokeStyle = `hsla(${196 + t * 130}, 90%, 72%, 0.9)`
          ctx.stroke()
        }
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.fillRect(8, 8, 132, 24)
        ctx.fillStyle = '#dff6ff'
        ctx.font = '13px ui-monospace, monospace'
        ctx.fillText(`圆 ${n} 个`, 16, 25)
      },
      pointer(kind, x, y) {
        if (kind !== 'down') return
        /* 点哪儿就强制在那儿放一个最大圆 —— 手动指定一个种子 */
        if (n >= MAXC) return
        const r = radiusAt(x, y)
        if (r < 2) return
        cx[n] = x
        cy[n] = y
        cr[n] = r
        n += 1
      },
      setParam(key, v) {
        if (key === 'tries') tries = v
        if (key === 'rate') rate = v
        if (key === 'maxR') maxR = v
      },
      action(key) {
        if (key === 'restart') clear()
        if (key === 'dump') {
          /* 一口气填到放不下为止，让「幂律大小分布」的形状立刻可见 */
          const before = n
          let guard = 0
          while (placeOne() && guard < 4000) guard += 1
          for (let i = before; i < n; i += 1) {
            const t = clamp(cr[i] / (maxR || 1), 0, 1)
            ctx.fillStyle = `hsla(${196 + t * 130}, 82%, ${34 + t * 26}%, 0.5)`
            ctx.beginPath()
            ctx.arc(cx[i], cy[i], cr[i], 0, TAU)
            ctx.fill()
          }
        }
      },
      destroy() {},
    }
  },
}

export default circlePacking
