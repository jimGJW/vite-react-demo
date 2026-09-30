/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 几何与图案 · 莫尔条纹 —— 两组细密光栅叠加
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU } from '../../utils/math.js'

const moire = {
  id: 'moire',
  title: '莫尔条纹',
  tag: '两组细密光栅叠加',
  desc: '两组很密的同心圆（或平行线）稍微错开一点点，就会看到一层尺度大得多的宽条纹 —— 这就是莫尔条纹。它的周期放大了两个光栅的「差频」，所以两套精密栅格之间哪怕只有千分之几的误差，也会被放大成肉眼可见的花纹。精密测量和防伪印刷用的都是这个原理。',
  bg: '#03050e',
  params: [
    { key: 'layers', label: '层数', min: 2, max: 5, step: 1, value: 3 },
    { key: 'spacing', label: '栅距', min: 3, max: 22, step: 0.5, value: 7 },
    { key: 'speed', label: '错开速度', min: 0, max: 1.2, step: 0.02, value: 0.22 },
    { key: 'kind', label: '图案(0圆1线)', min: 0, max: 1, step: 1, value: 0 },
  ],
  actions: [
    { key: 'spin', label: '换个错开量' },
    { key: 'swap', label: '圆↔直线' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let layers = 3
    let spacing = 7
    let speed = 0.22
    let kind = 0
    let t = 0

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        ctx.fillStyle = '#03050e'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        t += dt * speed
        ctx.fillStyle = '#03050e'
        ctx.fillRect(0, 0, w, h)

        const cx = w / 2
        const cy = h / 2
        const reach = Math.hypot(w, h) * 0.55
        ctx.lineWidth = 1.4
        for (let L = 0; L < layers; L += 1) {
          /* 每层只差一点点角度与偏移；差频就是莫尔条纹的周期 */
          const rot = L * 0.026 + t * 0.02 * (L % 2 ? 1 : -1)
          const shift = Math.sin(t + L) * spacing * 1.6
          ctx.save()
          ctx.translate(cx + shift * Math.cos(rot), cy + shift * Math.sin(rot))
          ctx.rotate(rot)
          ctx.strokeStyle = `hsla(${190 + L * 40}, 88%, 62%, 0.5)`
          ctx.beginPath()
          if (kind) {
            for (let x = -reach; x <= reach; x += spacing) {
              ctx.moveTo(x, -reach)
              ctx.lineTo(x, reach)
            }
          } else {
            for (let r = spacing; r <= reach; r += spacing) {
              ctx.moveTo(r, 0)
              ctx.arc(0, 0, r, 0, TAU)
            }
          }
          ctx.stroke()
          ctx.restore()
        }
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'layers') layers = v
        if (key === 'spacing') spacing = v
        if (key === 'speed') speed = v
        if (key === 'kind') kind = v
      },
      action(key) {
        if (key === 'spin') t += 37
        if (key === 'swap') kind = kind ? 0 : 1
      },
      destroy() {},
    }
  },
}

export default moire
