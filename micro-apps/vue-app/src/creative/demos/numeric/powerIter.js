/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 数值与优化 · 幂迭代求主特征值 —— 反复乘同一个矩阵
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { clamp, rand } from '../../utils/math.js'

const powerIter = {
  id: 'power-iteration',
  title: '幂迭代求主特征值',
  tag: '反复乘同一个矩阵',
  desc: '随便拿一个向量反复左乘矩阵 A，每乘一次，各个特征方向上的分量就各自被乘以对应的特征值。绝对值最大的那个特征值分量占的份额越来越重，其它分量按 (λᵢ/λ₁)ⁿ 衰减 —— 于是向量方向会自己对齐到主特征向量上。特征值用瑞利商 λ = xᵀAx / xᵀx 读回来。真正难缠的情况是 |λ₁| ≈ |λ₂|：两个分量衰减得一样慢，收敛会慢到你怀疑程序没在跑，这时得换反幂法或位移技巧。',
  bg: '#04060d',
  params: [
    { key: 'n', label: '维数 N', min: 4, max: 16, step: 1, value: 10 },
    { key: 'gap', label: '特征值间距', min: 1.02, max: 1.6, step: 0.02, value: 1.22 },
    { key: 'speed', label: '迭代步/秒', min: 1, max: 30, step: 1, value: 6 },
  ],
  actions: [
    { key: 'newA', label: '换一个矩阵' },
    { key: 'reset', label: '重置向量' },
  ],
  create(ctx) {
    const MAXN = 16
    let w = 800
    let h = 360
    let N = 10
    let gap = 1.22
    let speed = 6
    const A = new Float64Array(MAXN * MAXN)
    const v = new Float64Array(MAXN)
    const tmp = new Float64Array(MAXN)
    const eig = new Float64Array(MAXN)
    let lambda = 0
    let prevLambda = 0
    let iter = 0
    let acc = 0
    const hist = new Float32Array(200)
    let histLen = 0

    /** 造一个特征值已知的对称矩阵：先凑正交基，再 A = Σ λᵢ vᵢvᵢᵀ */
    const newMatrix = () => {
      const basis = []
      for (let k = 0; k < N; k += 1) {
        const b = new Float64Array(N)
        for (let i = 0; i < N; i += 1) b[i] = rand(-1, 1)
        /* Gram-Schmidt：减掉已经落在这个方向上的分量 */
        for (const q of basis) {
          let d = 0
          for (let i = 0; i < N; i += 1) d += q[i] * b[i]
          for (let i = 0; i < N; i += 1) b[i] -= d * q[i]
        }
        let nn = 0
        for (let i = 0; i < N; i += 1) nn += b[i] * b[i]
        nn = Math.sqrt(nn) || 1
        for (let i = 0; i < N; i += 1) b[i] /= nn
        basis.push(b)
      }
      /* 特征值从 1 按 gap 等比递减，全部为正 —— 这样瑞利商单调收敛，曲线好看 */
      for (let k = 0; k < N; k += 1) eig[k] = Math.pow(gap, -(k / Math.max(1, N - 1)) * 3.2)
      A.fill(0)
      for (let k = 0; k < N; k += 1) {
        const q = basis[k]
        for (let i = 0; i < N; i += 1) {
          for (let j = 0; j < N; j += 1) A[i * N + j] += eig[k] * q[i] * q[j]
        }
      }
      reset()
    }

    const reset = () => {
      for (let i = 0; i < N; i += 1) v[i] = rand(-1, 1)
      normalize()
      iter = 0
      histLen = 0
      lambda = rayleigh()
      prevLambda = lambda
      pushHist(lambda)
      refreshReadout()
    }

    const normalize = () => {
      let s = 0
      for (let i = 0; i < N; i += 1) s += v[i] * v[i]
      s = Math.sqrt(s) || 1
      for (let i = 0; i < N; i += 1) v[i] /= s
    }

    const matVec = () => {
      for (let i = 0; i < N; i += 1) {
        let s = 0
        const row = i * N
        for (let j = 0; j < N; j += 1) s += A[row + j] * v[j]
        tmp[i] = s
      }
      for (let i = 0; i < N; i += 1) v[i] = tmp[i]
    }

    const rayleigh = () => {
      let num = 0
      for (let i = 0; i < N; i += 1) {
        let s = 0
        const row = i * N
        for (let j = 0; j < N; j += 1) s += A[row + j] * v[j]
        num += v[i] * s
      }
      let den = 0
      for (let i = 0; i < N; i += 1) den += v[i] * v[i]
      return num / (den || 1)
    }

    let readout = ''
    const refreshReadout = () => {
      readout = `λ₁ ≈ ${lambda.toFixed(6)}（真值 ${eig[0].toFixed(6)}，误差 ${Math.abs(lambda - eig[0]).toExponential(2)}）`
    }

    const pushHist = (x) => {
      if (histLen < hist.length) { hist[histLen] = x; histLen += 1 } else {
        hist.copyWithin(0, 1)
        hist[hist.length - 1] = x
      }
    }

    const iterateOnce = () => {
      prevLambda = lambda
      matVec()
      normalize()
      lambda = rayleigh()
      iter += 1
      pushHist(lambda)
      refreshReadout()
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        newMatrix()
      },
      frame(ts, dt) {
        acc += dt * speed
        let g = 0
        while (acc >= 1 && g < 40) { acc -= 1; iterateOnce(); g += 1 }
        if (g >= 40) acc = 0

        ctx.fillStyle = '#04060d'
        ctx.fillRect(0, 0, w, h)

        /* — 左：矩阵热力图 — */
        const cell = Math.min(180 / N, 15)
        const mx = w * 0.42
        const my = 48
        let amax = 1e-6
        for (let i = 0; i < N * N; i += 1) amax = Math.max(amax, Math.abs(A[i]))
        for (let i = 0; i < N; i += 1) {
          for (let j = 0; j < N; j += 1) {
            const val = A[i * N + j] / amax
            const s = clamp(val, -1, 1)
            /* 负→蓝、正→暖橙，0 接近底色 */
            const r = s > 0 ? 40 + s * 215 : 24
            const g2 = 30 + Math.abs(s) * 40
            const b = s < 0 ? 40 - s * 215 : 24
            ctx.fillStyle = `rgb(${r | 0}, ${g2 | 0}, ${b | 0})`
            ctx.fillRect(mx + j * cell, my + i * cell, cell - 1, cell - 1)
          }
        }
        ctx.strokeStyle = 'rgba(120, 150, 200, 0.35)'
        ctx.lineWidth = 1
        ctx.strokeRect(mx - 0.5, my - 0.5, N * cell, N * cell)
        ctx.font = '12px ui-monospace, monospace'
        ctx.fillStyle = '#9db4dd'
        ctx.fillText(`对称矩阵 A（${N}×${N}）`, mx, my - 10)

        /* — 右：当前向量 x — */
        const bx = mx + N * cell + 54
        const by = my
        const bh = N * cell
        const bw = Math.min(190, w - bx - 30)
        const mid = by + bh / 2
        ctx.strokeStyle = 'rgba(120, 150, 200, 0.3)'
        ctx.beginPath()
        ctx.moveTo(bx, mid)
        ctx.lineTo(bx + bw, mid)
        ctx.stroke()
        for (let i = 0; i < N; i += 1) {
          const vv = clamp(v[i], -1, 1)
          const bh2 = (bh / 2) * Math.abs(vv)
          ctx.fillStyle = vv >= 0 ? '#5ce1e6' : '#ff9f45'
          ctx.fillRect(bx + 6, vv >= 0 ? mid - bh2 : mid, bw - 12, Math.max(1, bh2))
        }
        ctx.fillStyle = '#9db4dd'
        ctx.fillText('当前迭代向量 x（已归一化）', bx, by - 10)

        /* — 底部：瑞利商收敛曲线 — */
        const cx = 40
        const cy = h - 74
        const cw = w - 80
        const ch = 52
        ctx.strokeStyle = 'rgba(120, 150, 200, 0.25)'
        ctx.strokeRect(cx, cy, cw, ch)
        let lo = Infinity
        let hi = -Infinity
        for (let i = 0; i < histLen; i += 1) { lo = Math.min(lo, hist[i]); hi = Math.max(hi, hist[i]) }
        if (!Number.isFinite(lo)) { lo = 0; hi = 1 }
        if (hi - lo < 1e-9) hi = lo + 1e-9
        if (histLen > 1) {
          ctx.strokeStyle = '#9dffbe'
          ctx.lineWidth = 1.8
          ctx.beginPath()
          for (let i = 0; i < histLen; i += 1) {
            const gx = cx + (i / Math.max(1, histLen - 1)) * cw
            const gy = cy + ch - 4 - ((hist[i] - lo) / (hi - lo)) * (ch - 8)
            if (i === 0) ctx.moveTo(gx, gy)
            else ctx.lineTo(gx, gy)
          }
          ctx.stroke()
        }
        /* 真值参考线 */
        if (eig[0] >= lo && eig[0] <= hi) {
          const gy = cy + ch - 4 - ((eig[0] - lo) / (hi - lo)) * (ch - 8)
          ctx.strokeStyle = 'rgba(255, 159, 69, 0.8)'
          ctx.setLineDash([4, 4])
          ctx.beginPath()
          ctx.moveTo(cx, gy)
          ctx.lineTo(cx + cw, gy)
          ctx.stroke()
          ctx.setLineDash([])
        }

        ctx.font = '12px ui-monospace, monospace'
        ctx.fillStyle = '#dff6ff'
        ctx.fillText(readout, 40, h - 84)
        ctx.fillStyle = '#9db4dd'
        ctx.fillText(`迭代 ${iter} 次 · 上一步 λ = ${prevLambda.toFixed(6)}`, 40, h - 8)
        const conv = Math.abs(lambda - prevLambda) < 1e-7
        ctx.fillStyle = conv ? '#9dffbe' : '#ffd166'
        ctx.fillText(conv ? '✓ 已收敛（步长 < 1e-7）' : `· 收敛中，比值把 |λ₂/λ₁| 压到 ${(1 / gap).toFixed(3)}`,
          w - 380, h - 8)
      },
      pointer() {},
      setParam(key, v2) {
        if (key === 'n') { N = Math.min(MAXN, Math.round(v2)); newMatrix() }
        if (key === 'gap') { gap = v2; newMatrix() }
        if (key === 'speed') speed = Math.round(v2)
      },
      action(key) {
        if (key === 'newA') newMatrix()
        if (key === 'reset') reset()
      },
      destroy() {},
    }
  },
}

export default powerIter
