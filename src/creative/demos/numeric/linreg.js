/**
 * 数值与优化 · 梯度下降拟合直线 —— 沿负梯度一小步一小步走
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { clamp, rand } from '../../utils/math.js'

const linreg = {
  id: 'lin-regression',
  title: '梯度下降拟合直线',
  tag: '沿负梯度一小步一小步走',
  desc: '散点背后藏了一条真直线，但拟合时不许用解析解，只许沿着「损失对参数的负梯度」一点点挪。损失取均方误差，它对斜率和截距的偏导都很干净，每步更新一次。学习率是最要命的旋钮：太小则慢得像原地踏步，太大会在极小值两侧来回弹甚至直接飞出去 —— 右边那条损失曲线就是判决书，它应该在稳稳地往下掉。',
  bg: '#04060d',
  params: [
    { key: 'lr', label: '学习率 ×100', min: 1, max: 120, step: 1, value: 18 },
    { key: 'noise', label: '噪声', min: 0.02, max: 0.45, step: 0.01, value: 0.16 },
    { key: 'points', label: '点数', min: 20, max: 400, step: 10, value: 140 },
    { key: 'steps', label: '每帧步数', min: 1, max: 60, step: 1, value: 6 },
  ],
  actions: [
    { key: 'reseed', label: '重新采样' },
    { key: 'reset', label: '重置参数' },
    { key: 'train', label: '一口气训 400 步' },
  ],
  create(ctx) {
    const MAXN = 400
    let w = 800
    let h = 360
    let lr = 0.18
    let noise = 0.16
    let nPts = 140
    let stepsPer = 6
    const sx = new Float32Array(MAXN)
    const sy = new Float32Array(MAXN)
    let trueA = 0.62
    let trueB = 0.2
    let wa = 0
    let wb = 0
    let step = 0
    let loss = 0
    const hist = new Float32Array(240)
    let histLen = 0

    const pushLoss = (v) => {
      if (histLen < hist.length) { hist[histLen] = v; histLen += 1 } else {
        hist.copyWithin(0, 1)
        hist[hist.length - 1] = v
      }
    }

    const mse = () => {
      let s = 0
      for (let i = 0; i < nPts; i += 1) {
        const e = wa * sx[i] + wb - sy[i]
        s += e * e
      }
      return s / nPts
    }

    const seed = () => {
      trueA = rand(0.25, 0.85)
      trueB = rand(-0.05, 0.45)
      for (let i = 0; i < MAXN; i += 1) {
        const u = Math.random()
        sx[i] = u
        sy[i] = clamp(trueA * u + trueB + rand(-noise, noise) * 0.5, -0.2, 1.2)
      }
      reset()
    }

    const reset = () => {
      wa = 0
      wb = 0
      step = 0
      histLen = 0
      loss = mse()
      pushLoss(loss)
    }

    const trainOnce = () => {
      /* 批量梯度：两个偏导 = 2 × 平均残差 × (x 或 1) */
      let ga = 0
      let gb = 0
      for (let i = 0; i < nPts; i += 1) {
        const e = wa * sx[i] + wb - sy[i]
        ga += e * sx[i]
        gb += e
      }
      ga = (2 * ga) / nPts
      gb = (2 * gb) / nPts
      wa -= lr * ga
      wb -= lr * gb
      /* 发散保护：学习率过大会让参数指数爆掉，钳一下至少还能看见画面 */
      wa = clamp(wa, -6, 6)
      wb = clamp(wb, -6, 6)
      step += 1
      loss = mse()
      pushLoss(loss)
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        seed()
      },
      frame() {
        /* 每帧走 stepsPer 步梯度 —— 调小能看清「一步步挪」的过程 */
        for (let k = 0; k < stepsPer; k += 1) trainOnce()

        ctx.fillStyle = '#04060d'
        ctx.fillRect(0, 0, w, h)

        const padL = 40
        const padR = 200
        const padT = 24
        const padB = 30
        const X = (u) => padL + u * (w - padL - padR)
        const Y = (v) => padT + (1.15 - v) / 1.45 * (h - padT - padB)

        /* 数据点 */
        ctx.fillStyle = 'rgba(180, 205, 255, 0.55)'
        for (let i = 0; i < nPts; i += 1) ctx.fillRect(X(sx[i]) - 1, Y(sy[i]) - 1, 2.4, 2.4)

        /* 真值线 */
        ctx.strokeStyle = 'rgba(120, 150, 200, 0.5)'
        ctx.lineWidth = 1.4
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(X(0), Y(trueB))
        ctx.lineTo(X(1), Y(trueA + trueB))
        ctx.stroke()
        ctx.setLineDash([])

        /* 当前拟合线 */
        ctx.strokeStyle = '#5ce1e6'
        ctx.lineWidth = 2.6
        ctx.beginPath()
        ctx.moveTo(X(0), Y(wb))
        ctx.lineTo(X(1), Y(wa + wb))
        ctx.stroke()

        /* 梯度箭头：画在真值线中点，指向「下一步要去的方向」的负梯度 */
        const ga = wa - trueA
        const gb = wb - trueB
        const ax = X(0.82)
        const ay = Y(wa * 0.82 + wb)
        const gl = Math.hypot(ga, gb)
        if (gl > 1e-4) {
          ctx.strokeStyle = '#ffd166'
          ctx.lineWidth = 1.6
          ctx.beginPath()
          ctx.moveTo(ax, ay)
          ctx.lineTo(ax - ga * 26, ay + gb * 26)
          ctx.stroke()
        }

        /* 参数读数 */
        ctx.font = '12px ui-monospace, monospace'
        ctx.fillStyle = '#dff6ff'
        ctx.fillText(`第 ${step} 步`, padL, 15)
        ctx.fillStyle = '#9db4dd'
        ctx.fillText(`真值  k=${trueA.toFixed(3)} b=${trueB.toFixed(3)}`, padL + 80, 15)
        ctx.fillStyle = '#5ce1e6'
        ctx.fillText(`拟合  k=${wa.toFixed(3)} b=${wb.toFixed(3)}`, padL + 300, 15)
        ctx.fillStyle = loss > 0.2 ? '#ff7b7b' : '#9dffbe'
        ctx.fillText(`MSE ${loss.toFixed(5)}`, padL + 520, 15)

        /* 损失曲线（右栏）：纵轴自动缩放到历史最大值 */
        const lx = w - padR + 18
        const ly = padT + 10
        const lw = padR - 40
        const lh = 110
        ctx.strokeStyle = 'rgba(120, 150, 200, 0.25)'
        ctx.lineWidth = 1
        ctx.strokeRect(lx, ly, lw, lh)
        let mx = 1e-9
        for (let i = 0; i < histLen; i += 1) mx = Math.max(mx, hist[i])
        if (histLen > 1) {
          ctx.strokeStyle = '#ff9f45'
          ctx.lineWidth = 1.8
          ctx.beginPath()
          for (let i = 0; i < histLen; i += 1) {
            const gx = lx + (i / Math.max(1, histLen - 1)) * lw
            const gy = ly + lh - clamp(hist[i] / mx, 0, 1) * (lh - 6) - 3
            if (i === 0) ctx.moveTo(gx, gy)
            else ctx.lineTo(gx, gy)
          }
          ctx.stroke()
        }
        ctx.fillStyle = '#9db4dd'
        ctx.fillText('损失曲线', lx, ly + lh + 16)
        ctx.fillText(`峰值 ${mx.toFixed(4)}`, lx, ly + lh + 32)
        ctx.fillStyle = mx > 4 ? '#ff7b7b' : '#9dffbe'
        ctx.fillText(mx > 4 ? '⚠ 学习率过大，已在发散' : '✓ 稳定下降', lx, ly + lh + 48)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'lr') lr = v / 100
        if (key === 'noise') { noise = v; seed() }
        if (key === 'points') nPts = Math.min(MAXN, Math.round(v))
        if (key === 'steps') stepsPer = Math.round(v)
      },
      action(key) {
        if (key === 'reseed') seed()
        if (key === 'reset') reset()
        if (key === 'train') { for (let i = 0; i < 400; i += 1) trainOnce() }
      },
      destroy() {},
    }
  },
}

export default linreg
