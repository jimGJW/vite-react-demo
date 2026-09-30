/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 粒子与渲染 · ASCII 渲染 —— 亮度 → 字符映射
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { clamp } from '../../utils/math.js'

const asciiArt = {
  id: 'ascii-art',
  title: 'ASCII 渲染',
  tag: '亮度 → 字符映射',
  desc: '把画面切成小格，每格算一个平均亮度，再根据亮度挑一个字符 —— 从 `.` 到 `@` 的字符表按「视觉密度」排好，于是文字自己拼出了图像。这就是终端里那些 logo 的做法，也是「用最低的带宽传递灰阶」的老办法。点的密度不匀，反而自带一种老式打印机的颗粒感。',
  bg: '#03060c',
  params: [
    { key: 'cols', label: '横向字符数', min: 40, max: 130, step: 4, value: 86 },
    { key: 'speed', label: '变化速度', min: 0.2, max: 3, step: 0.1, value: 1 },
    { key: 'ramp', label: '字符密度', min: 0, max: 2, step: 1, value: 1 },
  ],
  actions: [
    { key: 'invert', label: '反色' },
    { key: 'form', label: '换形状' },
  ],
  create(ctx) {
    const RAMPS = [' .:-=+*#%@', ' .·˙∙○●◉', ' ._-,;:!?/\\|()[]{}<>']
    let w = 800
    let h = 360
    let cols = 86
    let speed = 1
    let rampIdx = 1
    let invert = false
    let t = 0
    let form = 0

    const bright = (u, v) => {
      /* u/v 是 0..1 的归一化坐标；三种「形状」供切换 */
      const x = (u - 0.5) * 2
      const y = (v - 0.5) * 2
      if (form === 0) {
        /* 环面结似的三维点云投影到 2D 的密度分布 */
        const r = Math.hypot(x, y)
        return clamp(Math.sin(r * 3 - t * 2) * 0.5 + 0.5, 0, 1) * clamp(1.6 - r, 0, 1)
      }
      if (form === 1) {
        /* 旋转的立方体剪影（用切比雪夫距离做） */
        const a = t * 0.7
        const rx = x * Math.cos(a) - y * Math.sin(a)
        const ry = x * Math.sin(a) + y * Math.cos(a)
        const box = Math.max(Math.abs(rx), Math.abs(ry))
        return clamp(1.25 - box * 1.9, 0, 1)
      }
      /* 等离子花纹 */
      return clamp(
        (Math.sin(x * 3 + t) + Math.sin(y * 3.4 - t * 0.8) + Math.sin((x + y) * 2.2 + t * 0.5)) * 0.25 + 0.5,
        0, 1,
      )
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        ctx.fillStyle = '#03060c'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        t += dt * speed
        const cw = w / cols
        /* 字符单元通常是高比宽大，纵向按 1.9 倍行高，画面才不变形 */
        const rows = Math.max(6, Math.floor(h / (cw * 1.9)))
        const ch = h / rows
        const ramp = RAMPS[rampIdx % RAMPS.length]

        ctx.fillStyle = '#03060c'
        ctx.fillRect(0, 0, w, h)
        ctx.font = `${(ch * 0.98).toFixed(1)}px ui-monospace, "SF Mono", Menlo, monospace`
        ctx.textBaseline = 'top'

        /* 按亮度分 4 档色：省掉逐字符拼色相字符串的开销 */
        const COLORS = ['#1d4a66', '#2f7f8f', '#63b7a8', '#c7f0d8']
        for (let gy = 0; gy < rows; gy += 1) {
          for (let gx = 0; gx < cols; gx += 1) {
            const v = bright((gx + 0.5) / cols, (gy + 0.5) / rows)
            const b = invert ? 1 - v : v
            const idx = Math.min(ramp.length - 1, Math.floor(b * ramp.length))
            if (b < 0.06) continue
            ctx.fillStyle = COLORS[Math.min(3, (b * 4) | 0)]
            ctx.fillText(ramp[idx], gx * cw, gy * ch)
          }
        }
        ctx.fillStyle = 'rgba(160, 230, 255, 0.75)'
        ctx.font = '12px ui-monospace, monospace'
        ctx.fillText(`${cols}×${rows} 字符`, 10, 8)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'cols') cols = v
        if (key === 'speed') speed = v
        if (key === 'ramp') rampIdx = v
      },
      action(key) {
        if (key === 'invert') invert = !invert
        if (key === 'form') form = (form + 1) % 3
      },
      destroy() {},
    }
  },
}

export default asciiArt
