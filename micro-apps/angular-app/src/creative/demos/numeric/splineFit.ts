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
 * 数值与优化 · 插值 vs 拟合 —— 穿过所有点 / 只是靠近
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp, rand } from '../../utils/math'

const splineFit = {
  id: 'spline-fit',
  title: '插值 vs 拟合',
  tag: '穿过所有点 / 只是靠近',
  desc: '同一组点，两种态度。Catmull-Rom 样条要「穿过每一个点」：每段三次曲线由相邻四个控制点夹出来，所以拖一个点只影响它附近的两三段，别处纹丝不动。最小二乘则宁可不穿过任何一个点，也要让误差平方和最小 —— 它解一个正规方程组，得到「平均意义上最贴」的那条曲线。把阶数调高，拟合线会开始追着噪声跑，两端还可能甩出去：这就是过拟合的直观样子。',
  bg: '#04060d',
  params: [
    { key: 'n', label: '点数', min: 4, max: 14, step: 1, value: 8 },
    { key: 'deg', label: '拟合阶数', min: 1, max: 5, step: 1, value: 3 },
    { key: 'noise', label: '抖动', min: 0, max: 0.3, step: 0.01, value: 0.12 },
  ],
  actions: [
    { key: 'reseed', label: '重新撒点' },
    { key: 'flatten', label: '拉平噪声' },
  ],
  create(ctx) {
    const MAXP = 14
    let w = 800
    let h = 360
    let nPts = 8
    let deg = 3
    let noise = 0.12
    let drag = -1
    const px = new Float32Array(MAXP)
    const py = new Float32Array(MAXP)

    /** 归一化 x ∈ [0,1] 上「一条平滑的真值」，撒点围绕它上下抖 */
    const truth = (u) => 0.52 + Math.sin(u * 5.4 + 0.7) * 0.19 - Math.cos(u * 11.3) * 0.06

    const seed = () => {
      for (let i = 0; i < MAXP; i += 1) {
        const u = i / (MAXP - 1)
        px[i] = u
        py[i] = clamp(truth(u) + rand(-noise, noise), 0.05, 0.95)
      }
    }

    /** Catmull-Rom：一段曲线 = 相邻四个点的加权和，两端点各被用两次 */
    const cr = (a, b, c, d, t) => {
      const t2 = t * t
      const t3 = t2 * t
      return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3)
    }

    /**
     * 最小二乘多项式：解正规方程 (AᵀA)c = Aᵀy。
     * 自变量先映射到 [-1, 1] —— 直接用 0..1 的话 x⁵ 只有千分之一，
     * 正规方程的条件数会差到「解出来的系数全是垃圾」。
     */
    const polyFit = () => {
      const m = deg + 1
      const M = []
      const rhs = new Float64Array(m)
      for (let i = 0; i < m; i += 1) M.push(new Float64Array(m))
      for (let k = 0; k < nPts; k += 1) {
        const xr = px[k] * 2 - 1
        const pw = new Float64Array(2 * m - 1)
        pw[0] = 1
        for (let e = 1; e < pw.length; e += 1) pw[e] = pw[e - 1] * xr
        for (let i = 0; i < m; i += 1) {
          rhs[i] += pw[i] * py[k]
          for (let j = 0; j < m; j += 1) M[i][j] += pw[i + j]
        }
      }
      /* 高斯消元 + 部分主元 */
      for (let col = 0; col < m; col += 1) {
        let piv = col
        for (let r = col + 1; r < m; r += 1) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r
        if (Math.abs(M[piv][col]) < 1e-12) return null
        if (piv !== col) { const t = M[piv]; M[piv] = M[col]; M[col] = t; const tb = rhs[piv]; rhs[piv] = rhs[col]; rhs[col] = tb }
        for (let r = col + 1; r < m; r += 1) {
          const f = M[r][col] / M[col][col]
          if (!f) continue
          for (let c2 = col; c2 < m; c2 += 1) M[r][c2] -= f * M[col][c2]
          rhs[r] -= f * rhs[col]
        }
      }
      const coef = new Float64Array(m)
      for (let r = m - 1; r >= 0; r -= 1) {
        let s = rhs[r]
        for (let c2 = r + 1; c2 < m; c2 += 1) s -= M[r][c2] * coef[c2]
        coef[r] = s / M[r][r]
      }
      return coef
    }

    const evalPoly = (coef, x) => {
      if (!coef) return 0
      const xr = x * 2 - 1
      let s = 0
      let p = 1
      for (let i = 0; i < coef.length; i += 1) { s += coef[i] * p; p *= xr }
      return s
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        seed()
      },
      frame() {
        ctx.fillStyle = '#04060d'
        ctx.fillRect(0, 0, w, h)

        const X = (u) => 40 + u * (w - 80)
        const Y = (v) => 26 + v * (h - 62)

        /* 网格 */
        ctx.strokeStyle = 'rgba(120, 150, 200, 0.10)'
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let i = 1; i < 6; i += 1) {
          const gx = 40 + (i / 6) * (w - 80)
          ctx.moveTo(gx, 20)
          ctx.lineTo(gx, h - 30)
          ctx.moveTo(36, 26 + (i / 6) * (h - 62))
          ctx.lineTo(w - 36, 26 + (i / 6) * (h - 62))
        }
        ctx.stroke()

        /* 样条：整条一笔一笔描，每段 24 个采样点就够平滑 */
        ctx.strokeStyle = '#5ce1e6'
        ctx.lineWidth = 2.4
        ctx.beginPath()
        for (let i = 0; i < nPts - 1; i += 1) {
          const a = py[Math.max(0, i - 1)]
          const b = py[i]
          const c = py[i + 1]
          const d = py[Math.min(nPts - 1, i + 2)]
          const x0 = px[i]
          const x1 = px[i + 1]
          for (let s = 0; s <= 24; s += 1) {
            const t = s / 24
            const vx = x0 + (x1 - x0) * t
            const vy = cr(a, b, c, d, t)
            if (i === 0 && s === 0) ctx.moveTo(X(vx), Y(vy))
            else ctx.lineTo(X(vx), Y(vy))
          }
        }
        ctx.stroke()

        /* 最小二乘拟合线 */
        const coef = polyFit()
        ctx.strokeStyle = '#ff9f45'
        ctx.lineWidth = 2
        ctx.setLineDash([7, 5])
        ctx.beginPath()
        for (let s = 0; s <= 160; s += 1) {
          const u = s / 160
          const v = evalPoly(coef, u)
          if (s === 0) ctx.moveTo(X(u), Y(v))
          else ctx.lineTo(X(u), Y(v))
        }
        ctx.stroke()
        ctx.setLineDash([])

        /* 残差竖线：拟合有多远，一眼看出「它不穿过点」 */
        ctx.strokeStyle = 'rgba(255, 159, 69, 0.45)'
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let i = 0; i < nPts; i += 1) {
          ctx.moveTo(X(px[i]), Y(py[i]))
          ctx.lineTo(X(px[i]), Y(evalPoly(coef, px[i])))
        }
        ctx.stroke()

        /* 控制点 */
        for (let i = 0; i < nPts; i += 1) {
          ctx.fillStyle = i === drag ? '#ffd166' : '#eaf4ff'
          ctx.beginPath()
          ctx.arc(X(px[i]), Y(py[i]), i === drag ? 6 : 4.2, 0, TAU)
          ctx.fill()
        }

        /* 误差读数 */
        let sse = 0
        let maxDev = 0
        for (let i = 0; i < nPts; i += 1) {
          const dv = evalPoly(coef, px[i]) - py[i]
          sse += dv * dv
          maxDev = Math.max(maxDev, Math.abs(dv))
        }
        ctx.font = '12px ui-monospace, monospace'
        ctx.fillStyle = '#5ce1e6'
        ctx.fillText('Catmull-Rom 插值 · 穿过每一个点', 40, 16)
        ctx.fillStyle = '#ff9f45'
        ctx.fillText(`最小二乘 ${deg} 阶 · SSE ${sse.toFixed(4)} · 最大偏差 ${maxDev.toFixed(3)}`, 40, h - 12)
        if (!coef) {
          ctx.fillStyle = '#ff7b7b'
          ctx.fillText('正规方程奇异（点重合或阶数过高）', w - 300, h - 12)
        }
      },
      pointer(kind, x, y) {
        const X = (u) => 40 + u * (w - 80)
        const Y = (v) => 26 + v * (h - 62)
        if (kind === 'down') {
          let best = -1
          let bd = 26
          for (let i = 0; i < nPts; i += 1) {
            const d = Math.hypot(x - X(px[i]), y - Y(py[i]))
            if (d < bd) { bd = d; best = i }
          }
          drag = best
        }
        if (kind === 'move' && drag >= 0) {
          py[drag] = clamp((y - 26) / (h - 62), 0.02, 0.98)
        }
        if (kind === 'up' || kind === 'leave') drag = -1
      },
      setParam(key, v) {
        if (key === 'n') { nPts = Math.min(MAXP, Math.round(v)); seed() }
        if (key === 'deg') deg = Math.round(v)
        if (key === 'noise') noise = v
      },
      action(key) {
        if (key === 'reseed') seed()
        if (key === 'flatten') {
          for (let i = 0; i < nPts; i += 1) py[i] = truth(px[i])
        }
      },
      destroy() {},
    }
  },
}

export default splineFit
