/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 元胞自动机与自组织 · 循环元胞自动机 —— 三种群循环竞争
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { makeFieldBuffer } from '../../utils/canvas.js'
import { hsl2rgb, makeRgbLut } from '../../utils/color.js'

const cyclicCA = {
  id: 'cyclic-ca',
  title: '循环元胞自动机',
  tag: '三种群循环竞争',
  desc: '每个格子属于 N 个物种之一，规则只有一条：只要邻域里出现「我的猎食者」（编号加一），我就变成它。石头剪子布式的循环压制会自己转出螺旋波 —— 这不是设计出来的图案，是「谁都赢不了谁」这件事在二维网格上的必然结果。',
  bg: '#04050c',
  params: [
    { key: 'species', label: '物种数', min: 3, max: 24, step: 1, value: 12 },
    { key: 'radius', label: '邻域半径', min: 1, max: 3, step: 1, value: 1 },
    { key: 'rate', label: '推进/帧', min: 1, max: 10, step: 1, value: 3 },
  ],
  actions: [
    { key: 'random', label: '随机重铺' },
    { key: 'patch', label: '铺成圆盘' },
  ],
  create(ctx) {
    const buf = makeFieldBuffer(3)
    let w = 800
    let h = 360
    let species = 12
    let radius = 1
    let rate = 3
    let gw = 0
    let gh = 0
    let cells = new Uint8Array(0)
    let LUT = makeRgbLut(24, (v) => hsl2rgb(v * 360, 0.78, 0.56))

    const rebuildLut = () => {
      LUT = makeRgbLut(species, (v) => hsl2rgb(v * 360, 0.78, 0.56))
    }

    const alloc = () => {
      gw = buf.width
      gh = buf.height
      cells = new Uint8Array(gw * gh)
      for (let i = 0; i < cells.length; i += 1) cells[i] = (Math.random() * species) | 0
      rebuildLut()
    }

    const tickOnce = () => {
      for (let y = 0; y < gh; y += 1) {
        for (let x = 0; x < gw; x += 1) {
          const i = y * gw + x
          const me = cells[i]
          const predator = (me + 1) % species
          let pred = 0
          for (let dy = -radius; dy <= radius; dy += 1) {
            const yy = ((y + dy) % gh + gh) % gh
            for (let dx = -radius; dx <= radius; dx += 1) {
              if (!dx && !dy) continue
              const xx = ((x + dx) % gw + gw) % gw
              if (cells[yy * gw + xx] === predator) { pred = 1; break }
            }
            if (pred) break
          }
          if (pred) cells[i] = predator
        }
      }
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
        const d = buf.data
        for (let i = 0; i < cells.length; i += 1) {
          const ci = cells[i] * 3
          const p = i * 4
          d[p] = LUT[ci]
          d[p + 1] = LUT[ci + 1]
          d[p + 2] = LUT[ci + 2]
          d[p + 3] = 255
        }
        buf.blit(ctx, w, h)
      },
      pointer(kind, x, y) {
        if (kind !== 'down' && kind !== 'move') return
        /* 手动涂一块「物种 0」，会立刻被邻居吃掉、边缘卷成螺旋 */
        const cx = Math.floor((x / w) * gw)
        const cy = Math.floor((y / h) * gh)
        for (let dy = -3; dy <= 3; dy += 1) {
          for (let dx = -3; dx <= 3; dx += 1) {
            const xx = ((cx + dx) % gw + gw) % gw
            const yy = ((cy + dy) % gh + gh) % gh
            cells[yy * gw + xx] = 0
          }
        }
      },
      setParam(key, v) {
        if (key === 'species') { species = v; alloc() }
        if (key === 'radius') radius = v
        if (key === 'rate') rate = v
      },
      action(key) {
        if (key === 'random') {
          for (let i = 0; i < cells.length; i += 1) cells[i] = (Math.random() * species) | 0
        }
        if (key === 'patch') {
          /* 同心圆盘：从中心往外一圈比一圈小的编号，会自己滚成螺旋 */
          const cx = gw / 2
          const cy = gh / 2
          for (let y = 0; y < gh; y += 1) {
            for (let x = 0; x < gw; x += 1) {
              const r = Math.hypot(x - cx, y - cy)
              cells[y * gw + x] = ((Math.floor(r * 0.5)) % species + species) % species
            }
          }
        }
      },
      destroy() {},
    }
  },
}

export default cyclicCA
