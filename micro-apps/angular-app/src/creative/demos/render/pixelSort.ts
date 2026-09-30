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
 * 粒子与渲染 · 像素排序故障 —— 按亮度排序的 glitch
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { clamp, fbm } from '../../utils/math'
import { makeFieldBuffer } from '../../utils/canvas'

const pixelSort = {
  id: 'pixel-sort',
  title: '像素排序故障',
  tag: '按亮度排序的 glitch',
  desc: '把一行（或一列）里落在某个亮度区间内的像素挑出来，按亮度从小到大重新排回去 —— 图像的结构就被「拉」成了条纹，而亮度区间之外的部分原样保留。这个手法来自 glitch art：它不破坏像素，只重排像素，所以画面同时保留了原图的形和一种机械的断裂感。',
  bg: '#04060e',
  params: [
    { key: 'low', label: '区间下限', min: 0, max: 1, step: 0.02, value: 0.12 },
    { key: 'high', label: '区间上限', min: 0, max: 1, step: 0.02, value: 0.72 },
    { key: 'vertical', label: '方向(0横1纵)', min: 0, max: 1, step: 1, value: 0 },
    { key: 'scale', label: '图案尺度', min: 0.6, max: 4, step: 0.1, value: 1.8 },
  ],
  actions: [
    { key: 'shuffle', label: '换图案' },
    { key: 'reset', label: '收窄区间' },
  ],
  create(ctx) {
    const buf = makeFieldBuffer(3)
    let w = 800
    let h = 360
    let low = 0.12
    let high = 0.72
    let vertical = 0
    let scale = 1.8
    let t = 0
    let seed = 0

    const lumAt = (u, v) => {
      const x = (u - 0.5) * 2 * scale
      const y = (v - 0.5) * 2 * scale
      const a = fbm(x * 1.4 + seed + t * 0.2, y * 1.4 - t * 0.1, 3)
      const b = Math.sin(x * 2.1 + t) * Math.cos(y * 2.6 - t * 0.7)
      return clamp(a * 0.72 + (b + 1) * 0.14, 0, 1)
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        buf.resize(w, h)
      },
      frame(ts, dt) {
        t += dt * 0.7
        const d = buf.data
        const gw = buf.width
        const gh = buf.height
        const L = new Float32Array(gw * gh)
        for (let gy = 0; gy < gh; gy += 1) {
          for (let gx = 0; gx < gw; gx += 1) {
            L[gy * gw + gx] = lumAt((gx + 0.5) / gw, (gy + 0.5) / gh)
          }
        }

        const lo = low
        const hi = high
        const run = new Float32Array(Math.max(gw, gh))
        const lines = vertical ? gw : gh
        const lineLen = vertical ? gh : gw
        for (let ln = 0; ln < lines; ln += 1) {
          /* 收集这一行/列里落在区间内的亮度 */
          let n = 0
          for (let i = 0; i < lineLen; i += 1) {
            const idx = vertical ? i * gw + ln : ln * gw + i
            const v = L[idx]
            if (v >= lo && v <= hi) run[n++] = v
          }
          if (n < 2) continue
          /* 排序后写回 —— 只动区间内的像素，其余位置不变 */
          const chunk = run.slice(0, n)
          chunk.sort()
          let k = 0
          for (let i = 0; i < lineLen; i += 1) {
            const idx = vertical ? i * gw + ln : ln * gw + i
            const v = L[idx]
            if (v >= lo && v <= hi) L[idx] = chunk[k++]
          }
        }

        for (let i = 0; i < gw * gh; i += 1) {
          const v = L[i]
          const p = i * 4
          /* 紫→青的双色阶，排序后出现的长条会更明显 */
          d[p] = (v * 210 + 18) | 0
          d[p + 1] = (v * 120 + 30) | 0
          d[p + 2] = (v * 60 + 120) | 0
          d[p + 3] = 255
        }
        buf.blit(ctx, w, h)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'low') low = Math.min(v, high - 0.02)
        if (key === 'high') high = Math.max(v, low + 0.02)
        if (key === 'vertical') vertical = v
        if (key === 'scale') scale = v
      },
      action(key) {
        if (key === 'shuffle') seed += 21.3
        if (key === 'reset') { low = 0.3; high = 0.5 }
      },
      destroy() {},
    }
  },
}

export default pixelSort
