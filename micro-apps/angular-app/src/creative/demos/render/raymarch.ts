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
 * 粒子与渲染 · 光线步进 —— SDF 场 + 无网格求交
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { clamp } from '../../utils/math'
import { makeFieldBuffer } from '../../utils/canvas'
import { hsl2rgb } from '../../utils/color'

const raymarch = {
  id: 'raymarch',
  title: '光线步进',
  tag: 'SDF 场 + 无网格求交',
  desc: '不用三角形，也不用求交公式：对每个像素从相机射一条光线，沿着它一步步往前「探」，每一步都问一句「现在离最近的那个物体还有多远」，远就大步走、近就小步走，直到靠得足够近就算命中。物体的形状用一个「到表面的有符号距离」函数描述 —— 球、立方体、圆环都能写成几行式子，取最小值天然得到布尔并集。',
  bg: '#04050c',
  params: [
    { key: 'torus', label: '圆环粗细', min: 0.05, max: 0.5, step: 0.01, value: 0.22 },
    { key: 'spin', label: '旋转速度', min: 0, max: 1.6, step: 0.05, value: 0.5 },
    { key: 'shade', label: '暗部深度', min: 0.2, max: 1.6, step: 0.05, value: 0.9 },
  ],
  actions: [
    { key: 'next', label: '换组合' },
    { key: 'light', label: '换光位' },
  ],
  create(ctx) {
    const buf = makeFieldBuffer(7)
    let w = 800
    let h = 360
    let torusR = 0.22
    let spin = 0.5
    let shade = 0.9
    let t = 0
    let combo = 0
    let lightA = 0.9

    /** 场景的有符号距离场：三个基本体取最小值就是并集 */
    const scene = (x, y, z, ca, sa) => {
      /* 球 */
      let d = Math.hypot(x, y + 0.78, z) - 0.5
      /* 立方体（用 Chebyshev 距离 + 圆角） */
      const bx = Math.abs(x) - 0.72
      const by = Math.abs(y) - 0.1
      const bz = Math.abs(z) - 0.72
      const outside = Math.hypot(Math.max(bx, 0), Math.max(by, 0), Math.max(bz, 0))
      const inside = Math.min(Math.max(bx, by, bz), 0)
      const box = outside + inside - 0.14
      if (combo !== 2) d = Math.min(d, box)
      /* 圆环：先绕 y 轴转到局部坐标再算 */
      const rx = x * ca - z * sa
      const rz = x * sa + z * ca
      const q = Math.hypot(rx, y + 0.1, rz) - 0.92
      const tor = Math.hypot(q, (y + 0.1) * 0 + Math.hypot(0, 0)) // 占位，下面覆盖
      const ringR = 0.9
      const q2 = Math.hypot(Math.hypot(rx, y + 0.1) - ringR, rz)
      const torus = q2 - torusR
      void tor
      if (combo !== 1) d = Math.min(d, torus)
      return d
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        buf.resize(w, h)
      },
      frame(ts, dt) {
        t += dt * spin
        const ca = Math.cos(t)
        const sa = Math.sin(t)
        const lx = Math.cos(lightA)
        const ly = -0.62
        const lz = Math.sin(lightA)
        const d = buf.data
        const gw = buf.width
        const gh = buf.height
        const ITER = 20
        for (let gy = 0; gy < gh; gy += 1) {
          /* 屏幕坐标 → 世界坐标（简单的针孔相机） */
          const sy = (gy / gh - 0.5) * 1.5
          const row = gy * gw
          for (let gx = 0; gx < gw; gx += 1) {
            const sx = (gx / gw - 0.5) * (w / h) * 1.5
            let travel = 0
            let hit = false
            const ox = 0
            const oy = 0
            const oz = -3.1
            for (let i = 0; i < ITER; i += 1) {
              const px = ox + sx * travel
              const py = oy + sy * travel
              const pz = oz + travel
              const dist = scene(px, py, pz, ca, sa)
              /* 命中判定：再近就当作打在表面上 */
              if (dist < 0.004) { hit = true; break }
              travel += Math.max(dist * 0.85, 0.004)
              if (travel > 7) break
            }
            /**
             * 命中后用「距离场的数值梯度」当法线 —— 不用解析求导，
             * 所以这两个体可以随便布尔组合，法线自动是对的。
             */
            let lum = 0.03
            if (hit) {
              const px = ox + sx * travel
              const py = oy + sy * travel
              const pz = oz + travel
              const e = 0.004
              const nx = scene(px + e, py, pz, ca, sa) - scene(px - e, py, pz, ca, sa)
              const ny = scene(px, py + e, pz, ca, sa) - scene(px, py - e, pz, ca, sa)
              const nz = scene(px, py, pz + e, ca, sa) - scene(px, py, pz - e, ca, sa)
              const nl = Math.hypot(nx, ny, nz) || 1
              const dot = clamp((nx * lx + ny * ly + nz * lz) / nl, 0, 1)
              /* 搭一点边缘光：视线与法线越接近垂直越亮 */
              const rim = 1 - clamp(Math.abs(nz / nl), 0, 1)
              lum = clamp(dot * shade + rim * 0.28 + 0.05, 0, 1)
            }
            const ci = (lum * 255) | 0
            const c = hsl2rgb(214 - lum * 60, 0.55 + lum * 0.3, 0.04 + lum * 0.72)
            const p = (row + gx) * 4
            d[p] = Math.min(255, c[0] + ci * 0.06)
            d[p + 1] = Math.min(255, c[1] + ci * 0.06)
            d[p + 2] = Math.min(255, c[2] + ci * 0.06)
            d[p + 3] = 255
          }
        }
        buf.blit(ctx, w, h)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'torus') torusR = v
        if (key === 'spin') spin = v
        if (key === 'shade') shade = v
      },
      action(key) {
        if (key === 'next') combo = (combo + 1) % 3
        if (key === 'light') lightA += 1.1
      },
      destroy() {},
    }
  },
}

export default raymarch
