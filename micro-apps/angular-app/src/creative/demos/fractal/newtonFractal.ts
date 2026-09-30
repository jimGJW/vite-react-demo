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
 * 分形与数学 · 牛顿分形 —— 三根盆域 + 数值求根
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp, rand } from '../../utils/math'
import { makeFieldBuffer } from '../../utils/canvas'
import { hsl2rgb } from '../../utils/color'

const newtonFractal = {
  id: 'newton-fractal',
  title: '牛顿分形',
  tag: '三根盆域 + 数值求根',
  desc: '用牛顿法在复平面上解 `z³ − 1 = 0`：从每个点出发迭代 `z ← z − p(z)/p′(z)`，看它最后落在三个根中的哪一个 —— 按归属染色，就得到三片互相咬合的「盆域」。最反直觉的是：三片盆域的交界处是分形的，随便多小的一块区域里都同时存在三个根的点。',
  bg: '#04050c',
  params: [
    { key: 'power', label: '方程幂次', min: 2, max: 6, step: 1, value: 3 },
    { key: 'iters', label: '迭代上限', min: 6, max: 50, step: 2, value: 20 },
    { key: 'relax', label: '松弛系数', min: 0.4, max: 1, step: 0.02, value: 1 },
    { key: 'zoom', label: '缩放', min: 0.5, max: 6, step: 0.1, value: 1.6 },
  ],
  actions: [
    { key: 'shift', label: '挪一下中心' },
    { key: 'reset', label: '回到中心' },
  ],
  create(ctx) {
    const buf = makeFieldBuffer(6)
    let w = 800
    let h = 360
    let power = 3
    let iters = 20
    let relax = 1
    let zoom = 1.6
    let ox = 0
    let oy = 0
    /* 每个根的色相：p 次单位根均分色环 */
    const rootHue = (k, p) => (k / Math.max(1, p)) * 360 + 20

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        buf.resize(w, h)
      },
      frame() {
        const d = buf.data
        const gw = buf.width
        const gh = buf.height
        const aspect = w / h
        const spanY = 2.6 / zoom
        const p = Math.max(2, Math.round(power))
        for (let gy = 0; gy < gh; gy += 1) {
          const y0 = ((gy + 0.5) / gh - 0.5) * spanY + oy
          const row = gy * gw
          for (let gx = 0; gx < gw; gx += 1) {
            let zx = ((gx + 0.5) / gw - 0.5) * spanY * aspect + ox
            let zy = y0
            let i = 0
            let best = 0
            let bestD = Infinity
            for (; i < iters; i += 1) {
              /* p(z) = z^p − 1，p'(z) = p·z^(p−1)：用极坐标算幂最省事 */
              const r = Math.hypot(zx, zy)
              if (r < 1e-7) break
              const th = Math.atan2(zy, zx)
              const rp = Math.pow(r, p)
              const thp = th * p
              const pr = rp * Math.cos(thp) - 1
              const pi2 = rp * Math.sin(thp)
              const dr = p * Math.pow(r, p - 1)
              const dth = th * (p - 1)
              const qr = dr * Math.cos(dth)
              const qi = dr * Math.sin(dth)
              const den = qr * qr + qi * qi
              if (den < 1e-12) break
              /* z ← z − relax · p/p' */
              const sr = (pr * qr + pi2 * qi) / den
              const si = (pi2 * qr - pr * qi) / den
              zx -= relax * sr
              zy -= relax * si
            }
            /* 找到最近的那个根 */
            for (let k = 0; k < p; k += 1) {
              const a = (TAU * k) / p
              const rx = Math.cos(a)
              const ry = Math.sin(a)
              const dd = (zx - rx) ** 2 + (zy - ry) ** 2
              if (dd < bestD) { bestD = dd; best = k }
            }
            /* 迭代次数越多说明越靠近盆域边界，画成暗色 → 边界自然显影 */
            const conv = clamp(i / iters, 0, 1)
            const c = hsl2rgb(rootHue(best, p), 0.78, 0.16 + (1 - conv) * 0.56)
            const shade = 0.35 + (1 - conv) * 0.65
            const pp = (row + gx) * 4
            d[pp] = c[0] * shade
            d[pp + 1] = c[1] * shade
            d[pp + 2] = c[2] * shade
            d[pp + 3] = 255
          }
        }
        buf.blit(ctx, w, h)
        ctx.fillStyle = 'rgba(220, 240, 255, 0.85)'
        ctx.font = '13px ui-monospace, monospace'
        ctx.fillText(`z^${p} = 1 · 迭代上限 ${iters}`, 12, 22)
      },
      pointer(kind, x, y) {
        if (kind !== 'down' && kind !== 'move') return
        const spanY = 2.6 / zoom
        const aspect = w / h
        ox = ((x / w) - 0.5) * spanY * aspect
        oy = ((y / h) - 0.5) * spanY
      },
      setParam(key, v) {
        if (key === 'power') power = v
        if (key === 'iters') iters = v
        if (key === 'relax') relax = v
        if (key === 'zoom') zoom = v
      },
      action(key) {
        if (key === 'shift') { ox += rand(-0.3, 0.3); oy += rand(-0.3, 0.3) }
        if (key === 'reset') { ox = 0; oy = 0 }
      },
      destroy() {},
    }
  },
}

export default newtonFractal
