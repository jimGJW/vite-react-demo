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
 * 场与流体 · 卡门涡街 —— 点涡诱导速度 + 交替脱落
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp, rand } from '../../utils/math'

const vortexStreet = {
  id: 'vortex-street',
  title: '卡门涡街',
  tag: '点涡诱导速度 + 交替脱落',
  desc: '流体绕过圆柱时，尾流里会交替脱落一串方向相反的涡 —— 也就是旗帜为什么抖、电线为什么在风里唱歌。这里把每个涡当成一个点涡：别的涡都会在它那里诱导出速度 `v = Γ/(2πr)`，再把一堆示踪粒子放进这个速度场里，涡街就自己排成了两行。',
  bg: '#040713',
  params: [
    { key: 'shed', label: '脱落频率', min: 0.4, max: 6, step: 0.2, value: 2.2 },
    { key: 'gamma', label: '涡强度', min: 20, max: 260, step: 10, value: 120 },
    { key: 'flow', label: '来流速度', min: 6, max: 70, step: 2, value: 30 },
    { key: 'tracers', label: '示踪粒子', min: 60, max: 900, step: 40, value: 380 },
  ],
  actions: [
    { key: 'clear', label: '清空尾流' },
    { key: 'boost', label: '加速' },
  ],
  create(ctx) {
    const MAXV = 64
    const MAXT = 900
    /* 涡心做了软化（r²+core²），否则 1/r 在圆心处会算出无限速度把粒子甩飞 */
    const CORE = 14
    let w = 800
    let h = 360
    let shedRate = 2.2
    let gamma = 120
    let flow = 30
    let nTracers = 380
    let acc = 0
    let side = 1

    const vx = new Float32Array(MAXV)
    const vy = new Float32Array(MAXV)
    const vg = new Float32Array(MAXV)
    const vage = new Float32Array(MAXV)
    let nV = 0

    const tx = new Float32Array(MAXT)
    const ty = new Float32Array(MAXT)
    const tlife = new Float32Array(MAXT)

    const cylX = () => w * 0.2
    const cylR = () => Math.max(9, h * 0.055)

    const resetTracer = (i) => {
      tx[i] = rand(0, w)
      ty[i] = rand(0, h)
      tlife[i] = rand(0.6, 2.6)
    }

    const shedOne = () => {
      if (nV >= MAXV) {
        /* 满了就把最老的挤掉：数组整体前移代价可接受（64 个） */
        vx.copyWithin(0, 1)
        vy.copyWithin(0, 1)
        vg.copyWithin(0, 1)
        vage.copyWithin(0, 1)
        nV -= 1
      }
      const r = cylR()
      vx[nV] = cylX() + r * 1.6
      vy[nV] = h / 2 + side * r * 0.85
      vg[nV] = gamma * side
      vage[nV] = 0
      side = -side
      nV += 1
    }

    /** 某点处所有点涡 + 来流的总速度 */
    const fieldAt = (x, y, out) => {
      let u = flow
      let v = 0
      for (let i = 0; i < nV; i += 1) {
        const dx = x - vx[i]
        const dy = y - vy[i]
        const d2 = dx * dx + dy * dy + CORE * CORE
        const k = vg[i] / (TAU * d2)
        u += -dy * k
        v += dx * k
      }
      out[0] = u
      out[1] = v
      return out
    }

    const q = [0, 0]

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        nV = 0
        for (let i = 0; i < MAXT; i += 1) resetTracer(i)
        ctx.fillStyle = '#040713'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        const step = Math.min(dt, 1 / 30)
        acc += step * shedRate
        while (acc >= 1) { acc -= 1; shedOne() }

        /* —— 涡自己也被别的涡推动（这就是涡街能相互错开、成对前移的原因） —— */
        for (let i = 0; i < nV; i += 1) {
          let u = flow
          let v = 0
          for (let j = 0; j < nV; j += 1) {
            if (i === j) continue
            const dx = vx[i] - vx[j]
            const dy = vy[i] - vy[j]
            const d2 = dx * dx + dy * dy + CORE * CORE
            const k = vg[j] / (TAU * d2)
            u += -dy * k
            v += dx * k
          }
          vx[i] += u * step
          vy[i] += v * step
          vage[i] += step
        }
        /* 超出右边界的涡消失（保留一点余量，不然右边缘会突然塌掉） */
        while (nV > 0 && vx[0] > w + 60) {
          vx.copyWithin(0, 1)
          vy.copyWithin(0, 1)
          vg.copyWithin(0, 1)
          vage.copyWithin(0, 1)
          nV -= 1
        }

        ctx.fillStyle = 'rgba(4, 7, 19, 0.13)'
        ctx.fillRect(0, 0, w, h)

        /* 圆柱 */
        ctx.fillStyle = '#1b2440'
        ctx.beginPath()
        ctx.arc(cylX(), h / 2, cylR(), 0, TAU)
        ctx.fill()
        ctx.strokeStyle = 'rgba(150, 190, 255, 0.5)'
        ctx.lineWidth = 1.2
        ctx.stroke()

        /* 涡：正负用冷暖两色，一眼看出交替脱落 */
        for (let i = 0; i < nV; i += 1) {
          const f = Math.abs(vg[i]) / (gamma || 1)
          const positive = vg[i] > 0
          ctx.fillStyle = positive
            ? `rgba(255, 150, 120, ${0.18 + f * 0.3})`
            : `rgba(120, 190, 255, ${0.18 + f * 0.3})`
          ctx.beginPath()
          ctx.arc(vx[i], vy[i], 5 + f * 8, 0, TAU)
          ctx.fill()
        }

        /* 示踪粒子：批次推进 + 每粒一个 2×2 点，比画弧便宜一个数量级 */
        for (let i = 0; i < MAXT; i += 1) {
          if (i >= nTracers) break
          tlife[i] -= step
          if (tlife[i] <= 0) resetTracer(i)
          fieldAt(tx[i], ty[i], q)
          tx[i] += q[0] * step
          ty[i] += q[1] * step
          if (tx[i] > w || tx[i] < 0 || ty[i] < 0 || ty[i] > h) resetTracer(i)
        }
        ctx.fillStyle = 'rgba(200, 232, 255, 0.5)'
        for (let i = 0; i < MAXT; i += 1) {
          if (i >= nTracers) break
          ctx.fillRect(tx[i] - 1, ty[i] - 1, 2, 2)
        }
      },
      pointer(kind, x, y) {
        if (kind !== 'down' && kind !== 'move') return
        /* 在指针处塞一个涡 —— 可以手动搅出涡对 */
        if (nV >= MAXV) return
        vx[nV] = x
        vy[nV] = y
        vg[nV] = (Math.random() < 0.5 ? -1 : 1) * gamma
        vage[nV] = 0
        nV += 1
      },
      setParam(key, v) {
        if (key === 'shed') shedRate = v
        if (key === 'gamma') gamma = v
        if (key === 'flow') flow = v
        if (key === 'tracers') nTracers = Math.min(MAXT, v)
      },
      action(key) {
        if (key === 'clear') nV = 0
        if (key === 'boost') flow = clamp(flow * 1.5, 6, 70)
      },
      destroy() {},
    }
  },
}

export default vortexStreet
