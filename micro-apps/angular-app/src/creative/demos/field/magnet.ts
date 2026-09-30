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
 * 场与流体 · 偶极场力线 —— 场线追踪 + 磁镜捕获
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU } from '../../utils/math'

const magnet = {
  id: 'magnet',
  title: '偶极场力线',
  tag: '场线追踪 + 磁镜捕获',
  desc: '把两根磁极的场线一步步积分出来，再让带电粒子沿着力线跑，速度按当地场强 B 缩放。两极之间场强最强、中间最弱，于是粒子会在两端被「弹」回来 —— 地球辐射带里的带电粒子正是这样被地磁场捕获的（磁镜效应）。',
  bg: '#040610',
  params: [
    { key: 'sep', label: '极间距', min: 0.16, max: 0.62, step: 0.01, value: 0.32 },
    { key: 'lines', label: '力线数', min: 8, max: 40, step: 2, value: 18 },
    { key: 'flow', label: '粒子流速', min: 0.15, max: 3, step: 0.05, value: 1 },
  ],
  actions: [{ key: 'kick', label: '踢一脚' }],
  create(ctx) {
    let w = 800
    let h = 360
    let sep = 0.32
    let nLines = 18
    let flow = 1
    let phase = 0
    const M = 170 // 每条力线重采样成 170 个等弧长点
    let lines = []
    let poles = []

    const buildPoles = () => {
      const d = h * sep * 0.5
      /* 归一化坐标：磁场强度只用来定「快慢」，绝对值不重要，所以系数取 1 */
      poles = [
        { x: 0.5, y: 0.5 - (d / h), q: 1 },
        { x: 0.5, y: 0.5 + (d / h), q: -1 },
      ]
    }

    /** 两根磁极叠加的场（归一化坐标下算，避免不同画布尺寸下数值差太多） */
    const field = (ux, uy) => {
      let bx = 0
      let by = 0
      for (const p of poles) {
        const dx = ux - p.x
        const dy = uy - p.y
        const r2 = dx * dx + dy * dy + 1e-6
        const inv = p.q / (r2 * Math.sqrt(r2))
        bx += dx * inv
        by += dy * inv
      }
      return [bx, by]
    }

    const trace = (ux, uy, dir) => {
      const pts = []
      let x = ux
      let y = uy
      const step = 0.004 * dir
      for (let i = 0; i < 900; i += 1) {
        const [bx, by] = field(x, y)
        const bl = Math.hypot(bx, by)
        if (!Number.isFinite(bl) || bl < 1e-9) break
        pts.push([x * w, y * h, bl])
        x += (bx / bl) * step
        y += (by / bl) * step
        if (x < -0.3 || x > 1.3 || y < -0.3 || y > 1.3) break
        /* 走到另一极就停 */
        const dq = Math.hypot(x - poles[1].x, y - poles[1].y)
        if (dir > 0 && dq < 0.012) break
      }
      if (pts.length < 12) return null
      /* 按弧长等距重采样 —— 之后粒子只要按参数 u 取值，不用再算弧长 */
      const cum = [0]
      for (let i = 1; i < pts.length; i += 1) {
        cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
      }
      const total = cum[cum.length - 1]
      if (total < 8) return null
      const lx = new Float32Array(M)
      const ly = new Float32Array(M)
      const lv = new Float32Array(M)
      let j = 0
      for (let i = 0; i < M; i += 1) {
        const target = (i / (M - 1)) * total
        while (j < cum.length - 2 && cum[j + 1] < target) j += 1
        const seg = cum[j + 1] - cum[j] || 1
        const t = (target - cum[j]) / seg
        lx[i] = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * t
        ly[i] = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * t
        lv[i] = pts[j][2]
      }
      /* 场强跨几个数量级，取对数再归一化，否则粒子在极点附近快得看不见 */
      let hi = 0
      for (let i = 0; i < M; i += 1) { lv[i] = Math.log10(lv[i] + 1e-6); if (lv[i] > hi) hi = lv[i] }
      for (let i = 0; i < M; i += 1) lv[i] = (lv[i] - hi + 4) / 4
      return { lx, ly, lv }
    }

    const buildLines = () => {
      buildPoles()
      lines = []
      const [px, py] = [poles[0].x, poles[0].y]
      for (let i = 0; i < nLines; i += 1) {
        /* 围绕上极均匀撒种子；靠近极点的线绕得紧，外侧的线张得开 */
        const a = (i / nLines) * TAU
        const r = 0.014 + (i / nLines) * 0.006
        const line = trace(px + Math.cos(a) * r, py + Math.sin(a) * r, 1)
        if (line) lines.push(line)
      }
      /* 再加几根从外侧出发、绕一大圈的 */
      for (let i = 0; i < 5; i += 1) {
        const a = -Math.PI * (0.25 + i * 0.12)
        const line = trace(px + Math.cos(a) * (0.1 + i * 0.02), py + Math.sin(a) * 0.02, 1)
        if (line) lines.push(line)
      }
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        buildLines()
        ctx.fillStyle = '#040610'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        ctx.fillStyle = 'rgba(4, 6, 16, 0.2)'
        ctx.fillRect(0, 0, w, h)
        phase += dt * flow

        /* 力线本体：极淡的一层，粒子才是主角 */
        ctx.strokeStyle = 'rgba(96, 132, 220, 0.3)'
        ctx.lineWidth = 1
        for (const ln of lines) {
          ctx.beginPath()
          for (let i = 0; i < M; i += 2) {
            if (i === 0) ctx.moveTo(ln.lx[0], ln.ly[0])
            else ctx.lineTo(ln.lx[i], ln.ly[i])
          }
          ctx.lineTo(ln.lx[M - 1], ln.ly[M - 1])
          ctx.stroke()
        }

        /* 粒子：沿弧长参数 u 前进，速度 ∝ 归一化后的 log|B| */
        ctx.fillStyle = '#8fe3ff'
        for (const ln of lines) {
          for (let b = 0; b < 4; b += 1) {
            let u = (phase * 0.14 + b * 0.25) % 1
            for (let k = 0; k < 3; k += 1) {
              const idx = Math.min(M - 2, Math.max(0, Math.floor(u * (M - 1))))
              const f = u * (M - 1) - idx
              const px = ln.lx[idx] + (ln.lx[idx + 1] - ln.lx[idx]) * f
              const py = ln.ly[idx] + (ln.ly[idx + 1] - ln.ly[idx]) * f
              ctx.fillRect(px, py, k === 0 ? 2.4 : 1.4, k === 0 ? 2.4 : 1.4)
              u += 0.004 * (0.35 + ln.lv[idx])
            }
          }
        }
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'sep') { sep = v; buildLines() }
        if (key === 'lines') { nLines = v; buildLines() }
        if (key === 'flow') flow = v
      },
      action(key) {
        /* 踢一脚：把相位随机打乱，看得更清楚粒子是各自独立跑的 */
        if (key === 'kick') phase = Math.random() * TAU
      },
      destroy() {},
    }
  },
}

export default magnet
