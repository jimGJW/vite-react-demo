/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 数值与优化 · 模拟退火解 TSP —— Metropolis + 2-opt
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { rand } from '../../utils/math.js'

const anneal = {
  id: 'anneal',
  title: '模拟退火解 TSP',
  tag: 'Metropolis + 2-opt',
  desc: '随机交换路径上的两个位置，变短就接受，变长则以 exp(-Δ/T) 的概率接受。温度高时敢走「坏棋」以跳出局部最优，温度降下来后逐渐锁死在一条很短的环上 —— 这是最经典的元启发式，也是「接受次优」为什么有价值的直观演示。',
  bg: '#05070f',
  params: [
    { key: 'cities', label: '城市数', min: 12, max: 160, step: 4, value: 64 },
    { key: 'temp', label: '当前温度', min: 0.05, max: 12, step: 0.05, value: 4 },
    { key: 'moves', label: '尝试/帧', min: 200, max: 12000, step: 200, value: 4000 },
  ],
  actions: [
    { key: 'reset', label: '重新撒点' },
    { key: 'reheat', label: '重新升温' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let nCities = 64
    let temp = 4
    let moves = 4000
    let best = 0
    const MAXC = 160
    const cx = new Float64Array(MAXC)
    const cy = new Float64Array(MAXC)
    let tour = []
    let len = 0

    const dist = (a, b) => Math.hypot(cx[a] - cx[b], cy[a] - cy[b])

    const tourLen = () => {
      let s = 0
      for (let i = 0; i < nCities; i += 1) s += dist(tour[i], tour[(i + 1) % nCities])
      return s
    }

    const scatter = () => {
      for (let i = 0; i < MAXC; i += 1) {
        cx[i] = rand(w * 0.05, w * 0.95)
        cy[i] = rand(h * 0.14, h * 0.94)
      }
      tour = Array.from({ length: nCities }, (_, i) => i)
      /* 从一个随机排列出发 —— 顺序排列会让前期「看起来」已经很整齐，不容易看出退火在做工 */
      for (let i = nCities - 1; i > 0; i -= 1) {
        const j = (Math.random() * (i + 1)) | 0
        const t = tour[i]
        tour[i] = tour[j]
        tour[j] = t
      }
      len = tourLen()
      best = len
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        scatter()
        ctx.fillStyle = '#05070f'
        ctx.fillRect(0, 0, w, h)
      },
      frame() {
        for (let k = 0; k < moves; k += 1) {
          /* 2-opt 的「交换两点」形式：改动小、接受率高，适合演示 */
          const i = (Math.random() * nCities) | 0
          let j = (Math.random() * nCities) | 0
          if (i === j) j = (j + 1) % nCities
          const a = tour[i]
          const b = tour[(i + 1) % nCities]
          const c = tour[j]
          const d = tour[(j + 1) % nCities]
          if (a === c || b === d) continue
          const delta = dist(a, c) + dist(b, d) - dist(a, b) - dist(c, d)
          if (delta <= 0 || Math.random() < Math.exp(-delta / (temp * 40))) {
            /* 反转 i+1..j 这一段 —— 比交换两点正确，长度变化正好是 delta */
            let lo = (i + 1) % nCities
            let hi = j
            let guard = 0
            while (lo !== hi && guard < nCities) {
              const t = tour[lo]
              tour[lo] = tour[hi]
              tour[hi] = t
              lo = (lo + 1) % nCities
              hi = (hi - 1 + nCities) % nCities
              guard += 1
            }
            len += delta
          }
        }
        if (len < best) best = len

        ctx.fillStyle = 'rgba(5, 7, 15, 0.42)'
        ctx.fillRect(0, 0, w, h)

        /* 路径：一条 path 画完；越长的边越红，一眼看出「还差哪几根连线」 */
        ctx.lineWidth = 1
        for (let i = 0; i < nCities; i += 1) {
          const a = tour[i]
          const b = tour[(i + 1) % nCities]
          const seg = dist(a, b)
          const t = Math.min(1, seg / 160)
          ctx.strokeStyle = `hsla(${200 - t * 190}, 90%, ${58 - t * 8}%, 0.62)`
          ctx.beginPath()
          ctx.moveTo(cx[a], cy[a])
          ctx.lineTo(cx[b], cy[b])
          ctx.stroke()
        }
        ctx.fillStyle = '#dbe8ff'
        for (let i = 0; i < nCities; i += 1) ctx.fillRect(cx[i] - 1.6, cy[i] - 1.6, 3.2, 3.2)

        ctx.fillStyle = 'rgba(210, 226, 255, 0.85)'
        ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, monospace'
        ctx.textAlign = 'left'
        ctx.fillText(`T=${temp.toFixed(2)}  当前 ${len.toFixed(0)}  最好 ${best.toFixed(0)}`, 12, 20)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'cities') { nCities = v; scatter() }
        if (key === 'temp') temp = v
        if (key === 'moves') moves = v
      },
      action(key) {
        if (key === 'reset') scatter()
        /* 「重新升温」是退火的标准用法：卡在局部最优时重新加热再退 */
        if (key === 'reheat') temp = Math.max(temp, 4)
      },
      destroy() {},
    }
  },
}

export default anneal
