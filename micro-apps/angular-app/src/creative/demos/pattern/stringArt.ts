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
 * 几何与图案 · 弦艺术 —— 模运算连线
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU } from '../../utils/math'

const stringArt = {
  id: 'string-art',
  title: '弦艺术',
  tag: '模运算连线',
  desc: '圆周上均匀放 n 个点，第 i 个点连到 (i×k) mod n 个点 —— 就这么一句话。k=2 画出心形线，k=3 是三尖瓣的内摆线，k=n-1 变成一串平行的弦。数论里最朴素的取模，在几何上变成了不断翻新的花纹。',
  bg: '#04050c',
  params: [
    { key: 'n', label: '定点数 n', min: 60, max: 400, step: 4, value: 220 },
    { key: 'k', label: '倍数 k', min: 2, max: 60, step: 1, value: 2 },
    { key: 'hue', label: '色相基准', min: 0, max: 360, step: 5, value: 190 },
  ],
  actions: [
    { key: 'next', label: 'k + 1' },
    { key: 'auto', label: '自动换 k' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let n = 220
    let k = 2
    let baseHue = 190
    let auto = true
    let autoT = 0

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        ctx.fillStyle = '#04050c'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        if (auto) {
          autoT += dt
          if (autoT > 3.4) { autoT = 0; k = k >= 40 ? 2 : k + 1 }
        }
        ctx.fillStyle = 'rgba(4, 5, 12, 0.2)'
        ctx.fillRect(0, 0, w, h)

        const cx = w / 2
        const cy = h / 2
        const R = Math.min(w, h) * 0.44
        /* 颜色按「起点角度 + 时间」分 6 桶：6 条 path 画完 n 根弦 */
        ctx.lineWidth = 0.9
        for (let b = 0; b < 6; b += 1) {
          ctx.strokeStyle = `hsla(${(baseHue + b * 26 + ts * 0.01) % 360}, 88%, 62%, 0.5)`
          ctx.beginPath()
          for (let i = b; i < n; i += 6) {
            const a0 = (i / n) * TAU
            const j = (i * k) % n
            const a1 = (j / n) * TAU
            ctx.moveTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R)
            ctx.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R)
          }
          ctx.stroke()
        }

        ctx.fillStyle = 'rgba(214, 226, 255, 0.82)'
        ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, monospace'
        ctx.textAlign = 'left'
        ctx.fillText(`n=${n}  k=${k}  ${auto ? '（自动）' : '（手动）'}  弦数 ${n}`, 12, 20)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'n') n = v
        if (key === 'k') { k = v; auto = false }
        if (key === 'hue') baseHue = v
      },
      action(key) {
        if (key === 'next') { k = k >= 80 ? 2 : k + 1; auto = false }
        if (key === 'auto') auto = !auto
      },
      destroy() {},
    }
  },
}

export default stringArt
