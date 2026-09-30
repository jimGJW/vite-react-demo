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
 * 粒子与渲染 · 鸟群 Boids —— 三条规则涌现出群体
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU } from '../../utils/math'
import { makePalette } from '../../utils/canvas'

const boids = {
  id: 'boids',
  title: '鸟群 Boids',
  tag: '三条规则涌现出群体',
  desc: 'Reynolds 1987 年的三条规则 —— 分离、对齐、聚合 —— 加起来就能让一堆点看起来像鸟群。没有任何一只鸟知道「群」在哪、要飞向哪，群体是局部规则的副产品。把权重调乱，群会立刻散掉。',
  bg: '#060a16',
  params: [
    { key: 'count', label: '个体数', min: 40, max: 460, step: 20, value: 220 },
    { key: 'align', label: '对齐', min: 0, max: 3, step: 0.05, value: 1.1 },
    { key: 'cohere', label: '聚合', min: 0, max: 3, step: 0.05, value: 0.75 },
    { key: 'sep', label: '分离', min: 0, max: 5, step: 0.1, value: 2.2 },
  ],
  actions: [{ key: 'burst', label: '惊飞' }],
  create(ctx) {
    let w = 800
    let h = 360
    let count = 220
    let wA = 1.1
    let wC = 0.75
    let wS = 2.2
    const MAXN = 460
    const R = 54
    const SPEED = 68
    const xs = new Float32Array(MAXN)
    const ys = new Float32Array(MAXN)
    const vxs = new Float32Array(MAXN)
    const vys = new Float32Array(MAXN)
    const palette = makePalette(5, 82, 64, 0.9)

    const seed = () => {
      for (let i = 0; i < MAXN; i += 1) {
        const a = Math.random() * TAU
        xs[i] = Math.random() * w
        ys[i] = Math.random() * h
        vxs[i] = Math.cos(a) * SPEED
        vys[i] = Math.sin(a) * SPEED
      }
    }
    seed()

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        seed()
        ctx.fillStyle = '#060a16'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        const boost = Math.min(dt * 60, 1)
        ctx.fillStyle = 'rgba(6, 10, 22, 0.15)'
        ctx.fillRect(0, 0, w, h)
        const R2 = R * R
        const SR2 = 0.34 * R2
        for (let i = 0; i < count; i += 1) {
          let ax = 0
          let ay = 0
          let cx = 0
          let cy = 0
          let sx = 0
          let sy = 0
          let n = 0
          for (let j = 0; j < count; j += 1) {
            if (j === i) continue
            const dx = xs[j] - xs[i]
            const dy = ys[j] - ys[i]
            const d2 = dx * dx + dy * dy
            if (d2 > R2) continue
            n += 1
            ax += vxs[j]
            ay += vys[j]
            cx += xs[j]
            cy += ys[j]
            /* 1/d² 而不是 1/d —— 凑得太近时斥力会迅速压过其它两项 */
            if (d2 < SR2 && d2 > 0.01) {
              sx -= dx / d2
              sy -= dy / d2
            }
          }
          let dx = 0
          let dy = 0
          if (n > 0) {
            dx += (ax / n - vxs[i]) * 0.045 * wA
            dy += (ay / n - vys[i]) * 0.045 * wA
            dx += (cx / n - xs[i]) * 0.0009 * wC
            dy += (cy / n - ys[i]) * 0.0009 * wC
          }
          dx += sx * 26 * wS
          dy += sy * 26 * wS
          vxs[i] += dx * boost
          vys[i] += dy * boost
          /* 限速：允许 ±14% 的浮动，否则要么僵直要么散架 */
          const sp = Math.hypot(vxs[i], vys[i]) || 1
          const k = Math.min(Math.max(SPEED / sp, 0.86), 1.14)
          vxs[i] *= k
          vys[i] *= k
          xs[i] += vxs[i] * dt
          ys[i] += vys[i] * dt
          if (xs[i] < -6) xs[i] += w + 12
          else if (xs[i] > w + 6) xs[i] -= w + 12
          if (ys[i] < -6) ys[i] += h + 12
          else if (ys[i] > h + 6) ys[i] -= h + 12
        }
        /* 按序号分 5 桶着色：5 条 path 就画完整群，比逐个 stroke 快一个数量级 */
        ctx.lineWidth = 1.7
        ctx.lineCap = 'round'
        for (let b = 0; b < 5; b += 1) {
          ctx.strokeStyle = palette[b]
          ctx.beginPath()
          for (let i = b; i < count; i += 5) {
            ctx.moveTo(xs[i], ys[i])
            ctx.lineTo(xs[i] - vxs[i] * 0.075, ys[i] - vys[i] * 0.075)
          }
          ctx.stroke()
        }
      },
      pointer() {},
      setParam(k, v) {
        if (k === 'count') { count = v; seed() }
        if (k === 'align') wA = v
        if (k === 'cohere') wC = v
        if (k === 'sep') wS = v
      },
      action(key) {
        /* 惊飞：给每个个体一个随机方向的冲量，然后看它多久重新聚成一群 */
        if (key !== 'burst') return
        for (let i = 0; i < count; i += 1) {
          const a = Math.random() * TAU
          vxs[i] = Math.cos(a) * SPEED * 3.4
          vys[i] = Math.sin(a) * SPEED * 3.4
        }
      },
      destroy() {},
    }
  },
}

export default boids
