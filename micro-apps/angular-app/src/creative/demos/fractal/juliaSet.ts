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
 * 分形与数学 · 朱利亚集合 —— 复迭代 z² + c
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { clamp, rand } from '../../utils/math'
import { makeFieldBuffer } from '../../utils/canvas'
import { hsl2rgb, makeRgbLut } from '../../utils/color'

const juliaSet = {
  id: 'julia-set',
  title: '朱利亚集合',
  tag: '复迭代 z² + c',
  desc: '把复平面上的每个点代进 `z ← z² + c` 反复迭代：有的点会飞向无穷，有的永远被束缚在一个区域内。束缚点的集合就是朱利亚集，它的边界是一条分形曲线。曼德博集合画的是「哪些 c 能产生连通的朱利亚集」，而这里固定一个 c、画对应的 z 平面 —— 两者是同一件事的两面。',
  bg: '#03040c',
  params: [
    { key: 'cr', label: 'c 实部', min: -1.2, max: 0.6, step: 0.005, value: -0.7269 },
    { key: 'ci', label: 'c 虚部', min: -1.2, max: 1.2, step: 0.005, value: 0.1889 },
    { key: 'zoom', label: '缩放', min: 0.5, max: 6, step: 0.1, value: 1.5 },
    { key: 'iters', label: '迭代上限', min: 20, max: 160, step: 10, value: 80 },
  ],
  actions: [
    { key: 'randomc', label: '随机 c' },
    { key: 'tour', label: '沿边界游走' },
  ],
  create(ctx) {
    const buf = makeFieldBuffer(6)
    const LUT = makeRgbLut(96, (v) => {
      /* 经典「电镀」配色：内部近黑，逃逸越快越偏暖 */
      if (v > 0.985) return [6, 8, 18]
      return hsl2rgb(265 - v * 250, 0.82, 0.1 + v * 0.62)
    })
    let w = 800
    let h = 360
    let cRe = -0.7269
    let cIm = 0.1889
    let zoom = 1.5
    let iters = 80
    let t = 0
    let touring = false

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        buf.resize(w, h)
      },
      frame(ts, dt) {
        if (touring) {
          t += dt * 0.35
          /* 沿曼德博集合边界的经典参数化路线走一圈 */
          cRe = -0.7 + Math.cos(t) * 0.29
          cIm = Math.sin(t) * 0.36
        }
        const d = buf.data
        const gw = buf.width
        const gh = buf.height
        const aspect = w / h
        const spanY = 1.6 / zoom
        for (let gy = 0; gy < gh; gy += 1) {
          const zy0 = ((gy + 0.5) / gh - 0.5) * spanY
          const row = gy * gw
          for (let gx = 0; gx < gw; gx += 1) {
            let zx = ((gx + 0.5) / gw - 0.5) * spanY * aspect
            let zy = zy0
            let i = 0
            let zx2 = zx * zx
            let zy2 = zy * zy
            while (i < iters && zx2 + zy2 < 16) {
              zy = 2 * zx * zy + cIm
              zx = zx2 - zy2 + cRe
              zx2 = zx * zx
              zy2 = zy * zy
              i += 1
            }
            /* 平滑着色：用 log(log|z|) 消掉整数迭代产生的色带 */
            let v
            if (i < iters) {
              const mod = Math.sqrt(zx2 + zy2)
              v = (i + 1 - Math.log2(Math.max(1e-9, Math.log(mod)))) / iters
              v = clamp(v, 0, 1)
            } else {
              v = 1
            }
            const ci = Math.min(95, Math.round((1 - v) * 95)) * 3
            const p = (row + gx) * 4
            d[p] = LUT[ci]
            d[p + 1] = LUT[ci + 1]
            d[p + 2] = LUT[ci + 2]
            d[p + 3] = 255
          }
        }
        buf.blit(ctx, w, h)
        ctx.fillStyle = 'rgba(220, 240, 255, 0.85)'
        ctx.font = '13px ui-monospace, monospace'
        ctx.fillText(`c = ${cRe.toFixed(4)} ${cIm >= 0 ? '+' : '−'} ${Math.abs(cIm).toFixed(4)}i`, 12, 22)
      },
      pointer(kind, x, y) {
        if (kind !== 'down' && kind !== 'move') return
        touring = false
        /* 指针在复平面上直接指定 c */
        cRe = ((x / w) - 0.5) * 2.4
        cIm = ((y / h) - 0.5) * 2.4
      },
      setParam(key, v) {
        if (key === 'cr') { cRe = v; touring = false }
        if (key === 'ci') { cIm = v; touring = false }
        if (key === 'zoom') zoom = v
        if (key === 'iters') iters = v
      },
      action(key) {
        if (key === 'randomc') {
          touring = false
          /* 落在曼德博集合边缘附近才好看 —— 随机取整个范围多半是「全黑」 */
          cRe = rand(-0.9, 0.35)
          cIm = rand(-0.75, 0.75)
        }
        if (key === 'tour') touring = !touring
      },
      destroy() {},
    }
  },
}

export default juliaSet
