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
 * 粒子与渲染 · 3D 点云环面结 —— 手写透视投影
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp } from '../../utils/math'

const pointCloud = {
  id: 'point-cloud',
  title: '3D 点云环面结',
  tag: '手写透视投影',
  desc: '不引 three.js：一条 (p, q) = (2, 3) 环面结采样 1200 个点，绕两个轴旋转后做透视投影，按深度调大小与透明度，再沿投影方向连成线。核心就一行 f/(f+z)。',
  bg: '#05060e',
  params: [
    { key: 'spin', label: '自转', min: 0, max: 2.4, step: 0.05, value: 0.6 },
    { key: 'fov', label: '焦距', min: 320, max: 1600, step: 20, value: 780 },
  ],
  actions: [],
  create(ctx) {
    const N = 1200
    let w = 800
    let h = 360
    let spin = 0.6
    let fov = 780
    let ax = 0.35
    let ay = 0

    const pts = Array.from({ length: N }, (_, i) => {
      const u = (i / N) * TAU * 2 // 绕两圈，画出 (2,3) 结的双重缠绕
      const r = Math.cos(3 * u) + 2
      return { x: r * Math.cos(2 * u), y: r * Math.sin(2 * u), z: -Math.sin(3 * u) }
    })

    const shape = (n) => `hsl(${190 + n * 90}, 88%, ${52 + n * 16}%)`

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        ax = 0.35
        ctx.fillStyle = '#05060e'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        ay += dt * spin
        ctx.fillStyle = 'rgba(5, 6, 14, 0.3)'
        ctx.fillRect(0, 0, w, h)
        const cx = w / 2
        const cy = h / 2
        const scale = Math.min(w, h) * 0.19
        const cosY = Math.cos(ay)
        const sinY = Math.sin(ay)
        const cosX = Math.cos(ax)
        const sinX = Math.sin(ax)

        ctx.lineWidth = 1
        let prev = null
        for (let i = 0; i <= N; i += 1) {
          const p = pts[i % N]
          /* 先绕 Y 轴转，再绕 X 轴转（顺序固定，否则模型会翻滚） */
          const x1 = p.x * cosY - p.z * sinY
          const z1 = p.x * sinY + p.z * cosY
          const y1 = p.y * cosX - z1 * sinX
          const z2 = p.y * sinX + z1 * cosX
          const d = fov / (fov + z2 * scale)
          const sx = cx + x1 * scale * d
          const sy = cy + y1 * scale * d
          const depth = clamp((d - 0.6) / 0.9, 0, 1)
          if (prev) {
            ctx.strokeStyle = shape(depth)
            ctx.globalAlpha = 0.18 + depth * 0.5
            ctx.beginPath()
            ctx.moveTo(prev.x, prev.y)
            ctx.lineTo(sx, sy)
            ctx.stroke()
          }
          ctx.globalAlpha = 1
          if (i % 3 === 0) {
            ctx.fillStyle = shape(depth)
            ctx.fillRect(sx - 1, sy - 1, 2.2, 2.2)
          }
          prev = { x: sx, y: sy }
        }
        ctx.globalAlpha = 1
      },
      pointer() {},
      setParam(k, v) {
        if (k === 'spin') spin = v
        if (k === 'fov') fov = v
      },
      action() {},
      destroy() {},
    }
  },
}

export default pointCloud
