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
 * 几何与图案 · 克拉尼图形 —— 驻波节点 + 沙粒堆积
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { makeFieldBuffer } from '../../utils/canvas'

const plateMode = (u, v, n, m) => {
  const a = Math.cos(n * Math.PI * u) * Math.cos(m * Math.PI * v)
  const b = Math.cos(m * Math.PI * u) * Math.cos(n * Math.PI * v)
  return Math.abs(a - b)
}

const chladni = {
  id: 'chladni',
  title: '克拉尼图形',
  tag: '驻波节点 + 沙粒堆积',
  desc: '方形薄板被某个频率驱动时形成驻波，波节线上的振幅恒为零。撒在上面的沙粒被振到波节线上就停住，于是「看不见的振动模式」被沙子画了出来 —— 这就是克拉尼 1787 年做的实验。亮线是板子不动的地方。',
  bg: '#07070c',
  params: [
    { key: 'n', label: '模式 n', min: 1, max: 12, step: 1, value: 3 },
    { key: 'm', label: '模式 m', min: 1, max: 12, step: 1, value: 5 },
    { key: 'sand', label: '沙粒数', min: 300, max: 2600, step: 100, value: 1400 },
  ],
  actions: [{ key: 'next', label: '下一组 (n,m)' }],
  create(ctx) {
    let w = 800
    let h = 360
    let n = 3
    let m = 5
    let count = 1400
    const MAXS = 2600
    const buf = makeFieldBuffer(3)
    const sx = new Float32Array(MAXS)
    const sy = new Float32Array(MAXS)

    const scatter = () => {
      for (let i = 0; i < MAXS; i += 1) {
        sx[i] = Math.random() * w
        sy[i] = Math.random() * h
      }
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        buf.resize(w, h)
        scatter()
        ctx.fillStyle = '#07070c'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        const gw = buf.width
        const gh = buf.height
        const d = buf.data
        /* 底层：把 |f| 映射成暗蓝底上的亮度，节线最亮 */
        for (let gy = 0; gy < gh; gy += 1) {
          const v = (gy + 0.5) / gh
          for (let gx = 0; gx < gw; gx += 1) {
            const f = plateMode((gx + 0.5) / gw, v, n, m)
            const a = Math.exp(-f * 16)
            const p = (gy * gw + gx) * 4
            d[p] = 46 + a * 122
            d[p + 1] = 44 + a * 88
            d[p + 2] = 62 + a * 60
            d[p + 3] = 255
          }
        }
        buf.blit(ctx, w, h)

        /* 沙粒：沿 -∇|f| 走（往振幅更小的方向），带一点随机抖动 */
        const step = Math.min(dt, 1 / 30)
        const lr = 5.5
        const e = 1.6
        ctx.fillStyle = 'rgba(255, 236, 190, 0.9)'
        for (let i = 0; i < count; i += 1) {
          const px = sx[i]
          const py = sy[i]
          const u = px / w
          const v = py / h
          const gx = (
            plateMode((px + e) / w, v, n, m) - plateMode((px - e) / w, v, n, m)
          ) / (2 * e)
          const gy = (
            plateMode(u, (py + e) / h, n, m) - plateMode(u, (py - e) / h, n, m)
          ) / (2 * e)
          const gl = Math.hypot(gx, gy) || 1
          const k = (lr * step * 60) / gl
          let nx = px - gx * k + (Math.random() - 0.5) * 1.6
          let ny = py - gy * k + (Math.random() - 0.5) * 1.6
          if (nx < 0) nx = 0
          else if (nx > w) nx = w
          if (ny < 0) ny = 0
          else if (ny > h) ny = h
          sx[i] = nx
          sy[i] = ny
          ctx.fillRect(nx, ny, 1.6, 1.6)
        }
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'n') { n = v; scatter() }
        if (key === 'm') { m = v; scatter() }
        if (key === 'sand') count = v
      },
      action(key) {
        if (key !== 'next') return
        /* 在半径 12 的网格上找下一组「互质且不重复」的模式 */
        let nn = n
        let mm = m + 1
        if (mm > 12) { mm = 2; nn = nn >= 12 ? 2 : nn + 1 }
        if (mm === nn) mm += 1
        if (mm > 12) mm = 2
        n = nn
        m = mm
        scatter()
      },
      destroy() {},
    }
  },
}

export default chladni
