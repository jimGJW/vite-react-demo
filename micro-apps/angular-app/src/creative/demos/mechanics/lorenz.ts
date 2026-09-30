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
 * 天体与力学 · 洛伦兹吸引子 —— 混沌 ODE + RK4
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { rand } from '../../utils/math'

const lorenz = {
  id: 'lorenz',
  title: '洛伦兹吸引子',
  tag: '混沌 ODE + RK4',
  desc: '三个耦合的非线性方程，轨迹却永远落回同一只「蝴蝶」。相邻两条轨迹以指数速度分开，所以吸引子的形状完全确定、具体走到哪一步却不可预测 —— 这就是混沌。换个初值，蝴蝶一模一样，走位完全不同。',
  bg: '#04060f',
  params: [
    { key: 'sigma', label: 'σ', min: 4, max: 18, step: 0.5, value: 10 },
    { key: 'rho', label: 'ρ', min: 12, max: 42, step: 0.5, value: 28 },
    { key: 'beta', label: 'β', min: 1.4, max: 4, step: 0.05, value: 2.67 },
    { key: 'speed', label: '推进/帧', min: 2, max: 60, step: 1, value: 14 },
  ],
  actions: [{ key: 'reset', label: '换个初值' }],
  create(ctx) {
    let w = 800
    let h = 360
    let sigma = 10
    let rho = 28
    let beta = 2.67
    let speed = 14
    const MAXT = 2600
    const tx = new Float32Array(MAXT)
    const ty = new Float32Array(MAXT)
    const tz = new Float32Array(MAXT)
    let head = 0
    let len = 0
    const k1 = [0, 0, 0]
    const k2 = [0, 0, 0]
    const k3 = [0, 0, 0]
    const k4 = [0, 0, 0]
    const tmp = [0, 0, 0]
    const q1 = [0, 0, 0]
    const q2 = [0, 0, 0]
    const q3 = [0, 0, 0]

    const restart = () => {
      head = 0
      len = 0
      /* 初值随机一点，才能看出「同样形状、不同走位」 */
      tx[0] = rand(-12, 12)
      ty[0] = rand(-16, 16)
      tz[0] = rand(6, 32)
      head = 1
      len = 1
      ctx.fillStyle = '#04060f'
      ctx.fillRect(0, 0, w, h)
    }

    const deriv = (p, out) => {
      out[0] = sigma * (p[1] - p[0])
      out[1] = p[0] * (rho - p[2]) - p[1]
      out[2] = p[0] * p[1] - beta * p[2]
    }

    /** RK4 固定步长 0.0035：洛伦兹系统在默认参数下不算刚性，这个步长足够准 */
    const advance = () => {
      const H = 0.0035
      tmp[0] = tx[head]
      tmp[1] = ty[head]
      tmp[2] = tz[head]
      deriv(tmp, k1)
      for (let i = 0; i < 3; i += 1) q1[i] = tmp[i] + k1[i] * H * 0.5
      deriv(q1, k2)
      for (let i = 0; i < 3; i += 1) q2[i] = tmp[i] + k2[i] * H * 0.5
      deriv(q2, k3)
      for (let i = 0; i < 3; i += 1) q3[i] = tmp[i] + k3[i] * H
      deriv(q3, k4)
      const nx = tmp[0] + (H / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])
      const ny = tmp[1] + (H / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])
      const nz = tmp[2] + (H / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])
      head = (head + 1) % MAXT
      tx[head] = nx
      ty[head] = ny
      tz[head] = nz
      if (len < MAXT) len += 1
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        restart()
      },
      frame(ts, dt) {
        const steps = Math.min(Math.round(speed * Math.min(dt * 60, 2)), 140)
        for (let i = 0; i < steps; i += 1) advance()

        /* 半透明覆写做残影：转动时能看到「上一秒的蝴蝶」淡淡地留在后面 */
        ctx.fillStyle = 'rgba(4, 6, 15, 0.07)'
        ctx.fillRect(0, 0, w, h)

        const cx = w / 2
        const cy = h / 2
        const scale = Math.min(w, h) / 62
        const ay = ts * 0.00022
        const ca = Math.cos(ay)
        const sa = Math.sin(ay)
        const tilt = 0.42
        const ct = Math.cos(tilt)
        const stt = Math.sin(tilt)
        const hue = (ts * 0.012) % 360

        /**
         * 投影基准固定在吸引子的几何中心 (0, 0, 25) 上 ——
         * 如果改成「跟着轨迹头部走」，整只蝴蝶会随头部抖动，看着很晕。
         */
        const px = (i) => cx + (tx[i] * ca - (tz[i] - 25) * sa) * scale
        const py = (i) => cy + ty[i] * scale * ct - (tx[i] * sa + (tz[i] - 25) * ca) * scale * stt * 0.16

        /* 整条轨迹一笔画完：2600 个点、一次 stroke，比按段画省太多 */
        ctx.beginPath()
        for (let i = 0; i < len; i += 1) {
          const idx = (head - i + MAXT) % MAXT
          if (i === 0) ctx.moveTo(px(idx), py(idx))
          else ctx.lineTo(px(idx), py(idx))
        }
        ctx.strokeStyle = `hsla(${hue}, 88%, 62%, 0.5)`
        ctx.lineWidth = 1.15
        ctx.lineJoin = 'round'
        ctx.stroke()

        /* 头部亮点 */
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(px(head) - 1.6, py(head) - 1.6, 3.2, 3.2)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'sigma') sigma = v
        if (key === 'rho') rho = v
        if (key === 'beta') beta = v
        if (key === 'speed') speed = v
        /* 换参数等于换了一个动力系统，轨迹没有可比性，直接重新起跑 */
        if (key !== 'speed') restart()
      },
      action(key) {
        if (key === 'reset') restart()
      },
      destroy() {},
    }
  },
}

export default lorenz
