/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 分形与数学 · 逻辑斯蒂映射与倍周期 —— 分叉图 + 混沌窗口
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { clamp } from '../../utils/math.js'

const logisticMap = {
  id: 'logistic-map',
  title: '逻辑斯蒂映射与倍周期',
  tag: '分叉图 + 混沌窗口',
  desc: '`x ← r·x·(1−x)` 是生态学里最简的种群模型。把 r 从 2.4 慢慢调到 4，种群数量会从稳定值 → 二周期 → 四周期 → 八周期……最后进入混沌。混沌区里还嵌着一片片「窗口」，最宽的那个（r≈3.83）是稳定的三周期。整张分叉图是确定性系统能有多复杂的完整地图。',
  bg: '#03040c',
  params: [
    { key: 'rMin', label: 'r 起点', min: 2, max: 3.6, step: 0.01, value: 2.5 },
    { key: 'rMax', label: 'r 终点', min: 3, max: 4, step: 0.01, value: 4 },
    { key: 'warmup', label: '预热步数', min: 20, max: 900, step: 20, value: 300 },
    { key: 'speed', label: '绘制速度', min: 0.1, max: 4, step: 0.1, value: 1.2 },
  ],
  actions: [
    { key: 'redraw', label: '重画' },
    { key: 'zoom', label: '放大混沌区' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let rMin = 2.5
    let rMax = 4
    let warmup = 300
    let speed = 1.2
    let cursor = 0
    let hold = 0
    const COL = 1
    const STRIDE = 4

    const reset = () => {
      cursor = 0
      hold = 0
      ctx.fillStyle = '#03040c'
      ctx.fillRect(0, 0, w, h)
    }

    const drawColumn = (r) => {
      const x = ((r - rMin) / Math.max(1e-6, rMax - rMin)) * w
      let xv = 0.4
      for (let i = 0; i < warmup; i += 1) xv = r * xv * (1 - xv)
      /* 再迭代一批并把落点画出来：吸引子的形状就是这个 r 的「指纹」 */
      for (let i = 0; i < 90; i += 1) {
        xv = r * xv * (1 - xv)
        const y = h - xv * h * 0.96 - 6
        ctx.fillStyle = `hsla(${196 + xv * 120}, 88%, 64%, 0.5)`
        ctx.fillRect(x, y, COL, 1.4)
      }
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        reset()
      },
      frame(ts, dt) {
        if (hold > 0) { hold -= dt; return }
        const span = Math.max(1e-6, rMax - rMin)
        const cols = Math.max(1, Math.round(w / STRIDE))
        const n = Math.max(1, Math.round(speed * 26 * Math.min(dt * 60, 2)))
        for (let i = 0; i < n; i += 1) {
          if (cursor > cols) { hold = 1.4; return }
          /* 每列多画几次，扫得快时也不会有空隙 */
          const r = rMin + (cursor / cols) * span
          drawColumn(r)
          drawColumn(r + span / cols * 0.4)
          cursor += 1
        }
        ctx.fillStyle = 'rgba(3, 4, 12, 0.35)'
        ctx.fillRect(0, 0, 0, 0)
        ctx.fillStyle = '#dff6ff'
        ctx.font = '13px ui-monospace, monospace'
        ctx.fillText(`r ∈ [${rMin.toFixed(2)}, ${rMax.toFixed(2)}]  预热 ${warmup} 步`, 12, 22)
        ctx.fillText(`进度 ${Math.min(100, Math.round((cursor / cols) * 100))}%`, 12, 40)
      },
      pointer(kind, x) {
        if (kind !== 'down') return
        /* 点哪儿就以哪儿的 r 为新区间中点，放大细看分叉结构 */
        const span = Math.max(1e-6, rMax - rMin)
        const rc = rMin + (x / w) * span
        rMin = clamp(rc - span * 0.18, 2, 4)
        rMax = clamp(rc + span * 0.18, 2, 4)
        if (rMax - rMin < 0.002) rMax = rMin + 0.002
        reset()
      },
      setParam(key, v) {
        if (key === 'rMin') rMin = Math.min(v, rMax - 0.02)
        if (key === 'rMax') rMax = Math.max(v, rMin + 0.02)
        if (key === 'warmup') warmup = v
        if (key === 'speed') speed = v
        reset()
      },
      action(key) {
        if (key === 'redraw') reset()
        if (key === 'zoom') { rMin = 3.55; rMax = 3.6; reset() }
        hold = 0
      },
      destroy() {},
    }
  },
}

export default logisticMap
