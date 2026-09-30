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
 * 几何与图案 · 极坐标玫瑰线 —— r = cos(kθ) 族
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU } from '../../utils/math'

const polarRose = {
  id: 'polar-rose',
  title: '极坐标玫瑰线',
  tag: 'r = cos(kθ) 族',
  desc: '一条 `r = cos(kθ)` 在 k 是整数时画出 2k 或 k 片花瓣，而 k 只要带一点小数，曲线就再也闭合不起来 —— 它会慢慢转、层层叠，叠出花边和网格。这里同时画好几条相位错开的曲线，再让 k 极缓慢地漂移，图案就在「花」和「蕾丝」之间来回变形。',
  bg: '#04060e',
  params: [
    { key: 'k', label: 'k', min: 0.1, max: 9, step: 0.01, value: 5.5 },
    { key: 'layers', label: '层数', min: 1, max: 6, step: 1, value: 3 },
    { key: 'drift', label: 'k 漂移速度', min: 0, max: 0.4, step: 0.01, value: 0.06 },
    { key: 'fade', label: '轨迹保留', min: 0.01, max: 0.4, step: 0.01, value: 0.12 },
  ],
  actions: [
    { key: 'snap', label: '取整 k' },
    { key: 'clear', label: '清空' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let k = 5.5
    let layers = 3
    let drift = 0.06
    let fade = 0.12
    let kk = k

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        ctx.fillStyle = '#04060e'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        kk += drift * dt
        if (kk > 9) kk -= 8.9

        ctx.fillStyle = `rgba(4, 6, 14, ${fade})`
        ctx.fillRect(0, 0, w, h)

        const cx = w / 2
        const cy = h / 2
        const R = Math.min(w, h) * 0.45
        ctx.lineWidth = 1
        /* 每层相位错开 2π/layers：花瓣就错落开了 */
        for (let L = 0; L < layers; L += 1) {
          const ph = (L / Math.max(1, layers)) * TAU
          ctx.strokeStyle = `hsla(${200 + L * 42 + kk * 12}, 88%, 66%, 0.6)`
          ctx.beginPath()
          const STEPS = 720
          for (let i = 0; i <= STEPS; i += 1) {
            const th = (i / STEPS) * TAU * 2
            const r = Math.abs(Math.cos(kk * th + ph)) * (1 - L * 0.09)
            const x = cx + Math.cos(th) * r * R
            const y = cy + Math.sin(th) * r * R
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
        }

        ctx.fillStyle = '#dff6ff'
        ctx.font = '13px ui-monospace, monospace'
        ctx.fillText(`k = ${kk.toFixed(3)}`, 14, 24)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'k') { k = v; kk = v }
        if (key === 'layers') layers = v
        if (key === 'drift') drift = v
        if (key === 'fade') fade = v
      },
      action(key) {
        if (key === 'snap') kk = Math.round(kk)
        if (key === 'clear') {
          ctx.fillStyle = '#04060e'
          ctx.fillRect(0, 0, w, h)
        }
      },
      destroy() {},
    }
  },
}

export default polarRose
