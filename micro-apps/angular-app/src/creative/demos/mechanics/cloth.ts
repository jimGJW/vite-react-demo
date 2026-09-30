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
 * 天体与力学 · 弹簧布料 —— Verlet 积分 + 距离约束
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp } from '../../utils/math'
import { makeStepper } from '../../utils/canvas'

const cloth = {
  id: 'cloth',
  title: '弹簧布料',
  tag: 'Verlet 积分 + 距离约束',
  desc: '一张点阵，相邻点之间是「必须保持这个距离」的约束，每帧迭代几次把偏差摊回去。顶边钉死，其余自由落体，鼠标能抓住任意一点拖。布料感就来自「约束迭代」而不是真的在算弹簧力。',
  bg: '#08080f',
  params: [
    { key: 'cols', label: '列数', min: 8, max: 40, step: 1, value: 22 },
    { key: 'gravity', label: '重力', min: 0, max: 2200, step: 50, value: 1100 },
  ],
  actions: [
    { key: 'reset', label: '重新悬挂' },
    { key: 'drop', label: '剪断' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let nCols = 22
    let g = 1100
    let spacing = 16
    let pts = []
    let pinned = true
    let drag = null

    const build = () => {
      spacing = Math.min(20, (w * 0.7) / nCols)
      const rows = Math.max(6, Math.floor((h * 0.7) / spacing))
      const x0 = (w - (nCols - 1) * spacing) / 2
      const y0 = h * 0.12
      pts = []
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < nCols; c += 1) {
          pts.push({
            x: x0 + c * spacing,
            y: y0 + r * spacing,
            px: x0 + c * spacing,
            py: y0 + r * spacing,
            fixed: pinned && r === 0,
            r,
            c,
          })
        }
      }
    }
    const at = (r, c) => pts[r * nCols + c]

    const verlet = (dt) => {
      const dt2 = dt * dt
      for (const p of pts) {
        if (p.fixed) continue
        const vx = (p.x - p.px) * 0.996
        const vy = (p.y - p.py) * 0.996
        p.px = p.x
        p.py = p.y
        p.x += vx
        p.y += vy + g * dt2
      }
      /* 约束迭代 4 次：次数越多布料越「不拉伸」，代价是每帧多几遍全网格 */
      for (let k = 0; k < 4; k += 1) {
        for (const p of pts) {
          if (p.fixed) continue
          for (const [dr, dc] of [[0, 1], [1, 0]]) {
            const q = pts[(p.r + dr) * nCols + (p.c + dc)]
            if (!q || q.c !== p.c + dc || q.r !== p.r + dr) continue
            const dx = q.x - p.x
            const dy = q.y - p.y
            const d = Math.hypot(dx, dy) || 1e-6
            const diff = (d - spacing) / d / 2
            const ox = dx * diff
            const oy = dy * diff
            if (!p.fixed) { p.x += ox; p.y += oy }
            if (!q.fixed) { q.x -= ox; q.y -= oy }
          }
        }
      }
      if (drag && !drag.fixed) {
        drag.x = drag.mx
        drag.y = drag.my
      }
    }
    const advance = makeStepper(1 / 120, verlet)

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        build()
        ctx.fillStyle = '#08080f'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        advance(dt)
        ctx.fillStyle = 'rgba(8, 8, 15, 0.42)'
        ctx.fillRect(0, 0, w, h)

        ctx.lineWidth = 1
        for (const p of pts) {
          for (const [dr, dc] of [[0, 1], [1, 0]]) {
            const q = at(p.r + dr, p.c + dc)
            if (!q) continue
            const d = Math.hypot(q.x - p.x, q.y - p.y)
            /* 线色反映拉伸量：绷得越紧越亮，一眼看出力是怎么传下去的 */
            const strain = clamp(Math.abs(d / spacing - 1) * 6, 0, 1)
            ctx.strokeStyle = `hsla(${190 + strain * 120}, 85%, ${34 + strain * 40}%, 0.85)`
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.stroke()
          }
        }
        ctx.fillStyle = 'rgba(148, 197, 255, 0.55)'
        for (const p of pts) {
          if (p.fixed) {
            ctx.fillStyle = '#f87171'
            ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3)
          }
        }
        if (drag) {
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'
          ctx.beginPath()
          ctx.arc(drag.x, drag.y, 9, 0, TAU)
          ctx.stroke()
        }
      },
      pointer(kind, x, y) {
        if (kind === 'down') {
          let best = null
          let bd = 26 * 26
          for (const p of pts) {
            const d = (p.x - x) ** 2 + (p.y - y) ** 2
            if (d < bd) { bd = d; best = p }
          }
          drag = best
        } else if (kind === 'move' && drag) {
          drag.mx = x
          drag.my = y
        } else if (kind === 'up' || kind === 'leave') {
          drag = null
        }
      },
      setParam(k, v) {
        if (k === 'cols') { nCols = v; build() }
        if (k === 'gravity') g = v
      },
      action(key) {
        /* 剪断顶边的钉点：整块布会滑下去 —— 顺带演示了约束系统的稳定性 */
        if (key === 'drop') { pinned = false; for (const p of pts) p.fixed = false }
        if (key === 'reset') { pinned = true; build() }
      },
      destroy() {},
    }
  },
}

export default cloth
