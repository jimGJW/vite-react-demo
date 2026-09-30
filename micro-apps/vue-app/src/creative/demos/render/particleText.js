/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 粒子与渲染 · 粒子文字 —— 点阵采样 + 弹簧回归
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { rand } from '../../utils/math.js'

const particleText = {
  id: 'particle-text',
  title: '粒子文字',
  tag: '点阵采样 + 弹簧回归',
  desc: '把文字画到离屏 canvas 上取样，得到一堆目标点；粒子用弹簧飞向自己的目标，鼠标经过时被推开、离开后自己找回去。「换个词」会在两套目标点之间来回收敛。',
  bg: '#080a14',
  params: [
    { key: 'stiff', label: '弹力', min: 1, max: 22, step: 1, value: 7 },
    { key: 'push', label: '排斥半径', min: 20, max: 160, step: 5, value: 70 },
  ],
  actions: [{ key: 'next', label: '换个词' }],
  create(ctx) {
    const WORDS = ['创意', 'DEMO', '星系', 'Flux']
    let wordIdx = 0
    let w = 800
    let h = 360
    let stiff = 7
    let pushR = 70
    let parts = []
    let mx = -9999
    let my = -9999
    let off = null
    let offCtx = null
    let tries = 0

    const targetsFor = (text) => {
      const fs = Math.min(h * 0.62, (w * 0.86) / Math.max(2, text.length) * 1.5)
      off.width = w
      off.height = h
      offCtx.clearRect(0, 0, w, h)
      offCtx.fillStyle = '#fff'
      offCtx.font = `900 ${fs}px -apple-system, "PingFang SC", sans-serif`
      offCtx.textAlign = 'center'
      offCtx.textBaseline = 'middle'
      offCtx.fillText(text, w / 2, h / 2)
      const data = offCtx.getImageData(0, 0, w, h).data
      const gap = 3
      const pts = []
      for (let y = 0; y < h; y += gap) {
        for (let x = 0; x < w; x += gap) {
          if (data[(y * w + x) * 4 + 3] > 128) pts.push({ x, y })
        }
      }
      return pts
    }

    const assign = () => {
      const pts = targetsFor(WORDS[wordIdx])
      if (!pts.length) return
      if (parts.length !== pts.length) {
        const old = parts
        parts = pts.map((p, i) => {
          const o = old[i]
          return {
            x: o ? o.x : rand(0, w),
            y: o ? o.y : rand(0, h),
            vx: o ? o.vx : 0,
            vy: o ? o.vy : 0,
            tx: p.x,
            ty: p.y,
          }
        })
      } else {
        parts.forEach((p, i) => {
          p.tx = pts[i].x
          p.ty = pts[i].y
        })
      }
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        if (!off) {
          off = document.createElement('canvas')
          offCtx = off.getContext('2d', { willReadFrequently: true })
        }
        assign()
        ctx.fillStyle = '#080a14'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        /**
         * 首帧可能撞上「画布还没尺寸」的时序（此时取样为 0 点），重试几次。
         * 不重试的话这个 demo 会永远停在空画布上 —— 因为 assign() 只在 resize 里被调。
         */
        if (!parts.length && tries < 6) { tries += 1; assign() }
        const push = Math.min(dt * 60, 1)
        ctx.fillStyle = 'rgba(8, 10, 20, 0.24)'
        ctx.fillRect(0, 0, w, h)
        /**
         * 弹簧增益 `k` 以「每帧」为单位 —— **这里不能再乘 dt**。
         * 离散弹簧的稳定条件是增益 < 约 4.3（阻尼 0.88 时特征值模 ≤ 1）。
         * 早先写成 `stiff * 60 * dt` 再让位置乘 `dt * 60`，等效增益飙到 400+，
         * 粒子两三帧就飞到几千像素外，画布上干干净净 —— 这个 bug 只有真跑起来才看得见。
         */
        const k = stiff * 0.12
        for (const p of parts) {
          p.vx += (p.tx - p.x) * k
          p.vy += (p.ty - p.y) * k
          const dx = p.x - mx
          const dy = p.y - my
          const d2 = dx * dx + dy * dy
          if (d2 < pushR * pushR && d2 > 0.01) {
            const d = Math.sqrt(d2)
            const f = ((1 - d / pushR) * 30 * push) / d
            p.vx += dx * f
            p.vy += dy * f
          }
          p.vx *= 0.88
          p.vy *= 0.88
          p.x += p.vx
          p.y += p.vy
          ctx.fillStyle = '#7dd3fc'
          ctx.fillRect(p.x, p.y, 2, 2)
        }
      },
      pointer(kind, x, y) {
        mx = x
        my = y
        if (kind === 'leave') {
          mx = -9999
          my = -9999
        }
      },
      setParam(k, v) {
        if (k === 'stiff') stiff = v
        if (k === 'push') pushR = v
      },
      action(key) {
        if (key === 'next') {
          wordIdx = (wordIdx + 1) % WORDS.length
          assign()
        }
      },
      destroy() {},
    }
  },
}

export default particleText
