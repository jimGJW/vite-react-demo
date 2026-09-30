/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 几何与图案 · 超公式曲面 —— Gielis 公式点云
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU } from '../../utils/math.js'

const superRadius = (theta, m, n1, n2, n3) => {
  const t1 = Math.abs(Math.cos((m * theta) / 4))
  const t2 = Math.abs(Math.sin((m * theta) / 4))
  const r = Math.pow(Math.pow(t1, n2) + Math.pow(t2, n3), -1 / n1)
  return Number.isFinite(r) ? r : 0
}

const SUPER_PRESETS = [
  { label: '球', m: 1, n1: 1, n2: 1, n3: 1 },
  { label: '六瓣花', m: 6, n1: 0.8, n2: 1.4, n3: 1.4 },
  { label: '四角星', m: 4, n1: 0.4, n2: 2.6, n3: 2.6 },
  { label: '尖刺', m: 9, n1: 0.3, n2: 3.2, n3: 3.2 },
  { label: '近立方', m: 8, n1: 4.2, n2: 4.2, n3: 4.2 },
]

const supershape = {
  id: 'supershape',
  title: '超公式曲面',
  tag: 'Gielis 公式点云',
  desc: '一个公式 r = (|cos(mθ/4)|ⁿ² + |sin(mθ/4)|ⁿ³)^(-1/n¹) 就能同时画出圆、方、星、花、海星 —— 把 θ、φ 两个方向各套一次再相乘，就得到一整族三维曲面。改四个整数，形状在圆润和尖锐之间连续过渡。',
  bg: '#05060f',
  params: [
    { key: 'm', label: '对称数 m', min: 1, max: 14, step: 1, value: 6 },
    { key: 'n1', label: 'n1', min: 0.2, max: 6, step: 0.1, value: 0.8 },
    { key: 'n2', label: 'n2', min: 0.2, max: 6, step: 0.1, value: 1.4 },
    { key: 'n3', label: 'n3', min: 0.2, max: 6, step: 0.1, value: 1.4 },
  ],
  actions: [
    { key: 'spin', label: '换朝向' },
    { key: 'preset', label: '换预设' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let m = 6
    let n1 = 0.8
    let n2 = 1.4
    let n3 = 1.4
    let ay = 0.6
    let presetIdx = 1
    const U = 46
    const V = 96
    const xyz = new Float32Array((U + 1) * (V + 1) * 3)

    /** 采样一次曲面（参数变了才重算），之后每帧只做旋转 + 投影 */
    const build = () => {
      let p = 0
      for (let i = 0; i <= U; i += 1) {
        /* θ 从 0 到 π：上半个球面 */
        const theta = (i / U) * Math.PI - Math.PI / 2
        const r1 = superRadius(theta, m, n1, n2, n3)
        for (let j = 0; j <= V; j += 1) {
          const phi = (j / V) * TAU
          const r2 = superRadius(phi, m, n1, n2, n3)
          xyz[p] = r1 * Math.cos(theta) * r2 * Math.cos(phi)
          xyz[p + 1] = r1 * Math.sin(theta)
          xyz[p + 2] = r1 * Math.cos(theta) * r2 * Math.sin(phi)
          p += 3
        }
      }
    }
    build()

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        ctx.fillStyle = '#05060f'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        ay += dt * 0.5
        ctx.fillStyle = 'rgba(5, 6, 15, 0.28)'
        ctx.fillRect(0, 0, w, h)

        const cx = w / 2
        const cy = h / 2
        const S = Math.min(w, h) * 0.34
        const ca = Math.cos(ay)
        const sa = Math.sin(ay)
        const cb = Math.cos(0.42)
        const sb = Math.sin(0.42)
        const n = (U + 1) * (V + 1)

        /* 手写旋转 + 透视：fov/(fov+z) 让近处的点更大更亮 */
        const fov = 3.2
        for (let i = 0; i < n; i += 1) {
          const p = i * 3
          const X = xyz[p]
          const Y = xyz[p + 1]
          const Z = xyz[p + 2]
          const x1 = X * ca - Z * sa
          const z1 = X * sa + Z * ca
          const y1 = Y * cb - z1 * sb
          const z2 = Y * sb + z1 * cb
          const k = fov / (fov + z2)
          const px = cx + x1 * S * k
          const py = cy + y1 * S * k
          const r = 1.15 * k
          const t = (z2 + 1.6) / 3.2
          ctx.fillStyle = `hsla(${196 + t * 150 - (ts * 0.008) % 360}, 88%, ${38 + t * 34}%, ${0.35 + t * 0.5})`
          ctx.fillRect(px, py, r, r)
        }
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'm') { m = v; build() }
        if (key === 'n1') { n1 = v; build() }
        if (key === 'n2') { n2 = v; build() }
        if (key === 'n3') { n3 = v; build() }
      },
      action(key) {
        if (key === 'spin') ay = Math.random() * TAU
        /* 预设：从「圆球」到「尖星」的几组典型参数 */
        if (key === 'preset') {
          presetIdx = (presetIdx + 1) % SUPER_PRESETS.length
          const p = SUPER_PRESETS[presetIdx]
          m = p.m
          n1 = p.n1
          n2 = p.n2
          n3 = p.n3
          build()
        }
      },
      destroy() {},
    }
  },
}

export default supershape
