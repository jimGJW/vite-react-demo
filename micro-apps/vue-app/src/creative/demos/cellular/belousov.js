/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 元胞自动机与自组织 · BZ 振荡反应 —— 激发介质 + 不应期
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { makeFieldBuffer } from '../../utils/canvas.js'
import { hsl2rgb, makeRgbLut } from '../../utils/color.js'

const belousov = {
  id: 'belousov',
  title: 'BZ 振荡反应',
  tag: '激发介质 + 不应期',
  desc: 'Belousov-Zhabotinsky 反应是真的会在培养皿里自己转出螺旋波的化学振荡。模型只要三个状态：静息、激发、不应期 —— 静息细胞被足够多「激发中」的邻居带进激发态，激发完进入一段不应期，期间谁也点不着它。就是这个「应期」让波只能前进不能倒退，于是从随机噪声里长出同心圆和螺旋。',
  bg: '#04060f',
  params: [
    { key: 'refractory', label: '不应期', min: 4, max: 40, step: 2, value: 16 },
    { key: 'rate', label: '推进/帧', min: 1, max: 12, step: 1, value: 5 },
    { key: 'noise', label: '自发激发', min: 0, max: 0.004, step: 0.0002, value: 0.0008 },
  ],
  actions: [
    { key: 'seed', label: '重新播种' },
    { key: 'clear', label: '回到静息' },
  ],
  create(ctx) {
    const buf = makeFieldBuffer(3)
    /* 深蓝静息 → 青绿不应 → 橙红激发：三段色，一眼看出波在哪 */
    const LUT = makeRgbLut(64, (v) => {
      if (v < 0.18) return hsl2rgb(230 - v * 90, 0.7, 0.06 + v * 1.2)
      if (v < 0.55) return hsl2rgb(170 - (v - 0.18) * 180, 0.85, 0.3 + (v - 0.18) * 0.5)
      return hsl2rgb(45 - (v - 0.55) * 30, 0.95, 0.55 + (v - 0.55) * 0.42)
    })
    let w = 800
    let h = 360
    let refractory = 16
    let rate = 5
    let noise = 0.0008
    let gw = 0
    let gh = 0
    let cur = new Uint8Array(0)
    let nxt = new Uint8Array(0)

    const alloc = () => {
      gw = buf.width
      gh = buf.height
      cur = new Uint8Array(gw * gh)
      nxt = new Uint8Array(gw * gh)
      seedRandom()
    }
    const seedRandom = () => {
      cur.fill(0)
      for (let i = 0; i < cur.length; i += 1) {
        if (Math.random() < 0.012) cur[i] = refractory
      }
      if (cur.length) cur[(gh >> 1) * gw + (gw >> 1)] = refractory
    }

    const tickOnce = () => {
      const fresh = Math.max(1, refractory - 2)
      for (let y = 0; y < gh; y += 1) {
        for (let x = 0; x < gw; x += 1) {
          const i = y * gw + x
          const s = cur[i]
          if (s > 0) { nxt[i] = s - 1; continue }
          /* 八邻域里「正在激发」的个数达到阈值就点火 */
          let hit = 0
          for (let dy = -1; dy <= 1; dy += 1) {
            const yy = y + dy
            if (yy < 0 || yy >= gh) continue
            for (let dx = -1; dx <= 1; dx += 1) {
              if (!dx && !dy) continue
              const xx = x + dx
              if (xx < 0 || xx >= gw) continue
              if (cur[yy * gw + xx] >= fresh) hit += 1
            }
          }
          nxt[i] = hit >= 2 || Math.random() < noise ? refractory : 0
        }
      }
      const t = cur
      cur = nxt
      nxt = t
    }

    const render = () => {
      const d = buf.data
      const n = gw * gh
      const R = refractory || 1
      for (let i = 0; i < n; i += 1) {
        const s = cur[i]
        /* 0 → 0（静息），R → 1（刚激发），中间是不应期的斜坡 */
        const v = s === 0 ? 0 : 0.2 + (s / R) * 0.8
        const ci = Math.min(63, Math.max(0, Math.round((1 - v) * 63))) * 3
        const p = i * 4
        d[p] = LUT[ci]
        d[p + 1] = LUT[ci + 1]
        d[p + 2] = LUT[ci + 2]
        d[p + 3] = 255
      }
      buf.blit(ctx, w, h)
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        buf.resize(w, h)
        alloc()
      },
      frame(ts, dt) {
        const n = Math.max(1, Math.min(rate, Math.round(rate * Math.min(dt * 60, 2))))
        for (let i = 0; i < n; i += 1) tickOnce()
        render()
      },
      pointer(kind, x, y) {
        if (kind !== 'down' && kind !== 'move') return
        const cx = Math.floor((x / w) * gw)
        const cy = Math.floor((y / h) * gh)
        for (let dy = -4; dy <= 4; dy += 1) {
          for (let dx = -4; dx <= 4; dx += 1) {
            const xx = cx + dx
            const yy = cy + dy
            if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue
            if (dx * dx + dy * dy <= 16) cur[yy * gw + xx] = refractory
          }
        }
      },
      setParam(key, v) {
        if (key === 'refractory') { refractory = v; alloc() }
        if (key === 'rate') rate = v
        if (key === 'noise') noise = v
      },
      action(key) {
        if (key === 'seed') seedRandom()
        if (key === 'clear') cur.fill(0)
      },
      destroy() {},
    }
  },
}

export default belousov
