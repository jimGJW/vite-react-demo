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
 * 粒子与渲染 · 分形山脉 —— 中点位移 + 视差滚动
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU } from '../../utils/math'

const terrain = {
  id: 'terrain',
  title: '分形山脉',
  tag: '中点位移 + 视差滚动',
  desc: '中点位移法：反复把区间对半砍、把中点抬高或压低一个随机量，幅度每次按固定比例衰减。一次生成的剖面自带「大结构套小结构」的分形特征，首尾接上就能无缝循环；叠几层以不同速度滚动，就是视差。',
  bg: '#0a0f1e',
  params: [
    { key: 'rough', label: '粗糙度', min: 0.36, max: 0.74, step: 0.01, value: 0.52 },
    { key: 'layers', label: '层数', min: 2, max: 6, step: 1, value: 4 },
    { key: 'speed', label: '视差速度', min: 0, max: 120, step: 4, value: 34 },
  ],
  actions: [{ key: 'reset', label: '换一座山' }],
  create(ctx) {
    const N = 256
    const MAXL = 6
    let w = 800
    let h = 360
    let rough = 0.52
    let nLayers = 4
    let speed = 34
    let hs = []
    const stars = Array.from({ length: 130 }, () => ({
      nx: Math.random(),
      ny: Math.random() * 0.55,
      r: Math.random() * 1.5 + 0.4,
      a: Math.random() * 0.6 + 0.25,
    }))

    const build = () => {
      hs = []
      for (let L = 0; L < MAXL; L += 1) {
        const arr = new Float32Array(N + 1)
        arr[0] = Math.random()
        arr[N] = arr[0] // 首尾同值 → 左右无缝接上
        let stepN = N
        let scale = 1
        while (stepN > 1) {
          const half = stepN >> 1
          for (let i = half; i < N; i += stepN) {
            arr[i] = (arr[i - half] + arr[i + half]) / 2 + (Math.random() - 0.5) * scale
          }
          stepN = half
          scale *= rough
        }
        /* 归一到 0~1，各层振幅才能单独控制 */
        let lo = arr[0]
        let hi = arr[0]
        for (let i = 1; i <= N; i += 1) { if (arr[i] < lo) lo = arr[i]; if (arr[i] > hi) hi = arr[i] }
        const span = hi - lo || 1
        for (let i = 0; i <= N; i += 1) arr[i] = (arr[i] - lo) / span
        hs.push(arr)
      }
    }
    build()

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        ctx.fillStyle = '#0a0f1e'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts) {
        const g = ctx.createLinearGradient(0, 0, 0, h)
        g.addColorStop(0, '#0a0f1e')
        g.addColorStop(0.55, '#141a33')
        g.addColorStop(1, '#1b2242')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)

        /* 星空（归一化坐标存，resize 后不用重排） */
        for (const s of stars) {
          ctx.fillStyle = `rgba(220, 232, 255, ${s.a})`
          ctx.fillRect(s.nx * w, s.ny * h, s.r, s.r)
        }

        /* 月亮 + 呼吸光晕 */
        const mx = w * 0.78
        const my = h * 0.2
        const pulse = 1 + Math.sin(ts * 0.0011) * 0.06
        const halo = ctx.createRadialGradient(mx, my, 2, mx, my, 62 * pulse)
        halo.addColorStop(0, 'rgba(226, 236, 255, 0.5)')
        halo.addColorStop(1, 'rgba(226, 236, 255, 0)')
        ctx.fillStyle = halo
        ctx.fillRect(mx - 70, my - 70, 140, 140)
        ctx.fillStyle = '#e6edff'
        ctx.beginPath()
        ctx.arc(mx, my, 17 * pulse, 0, TAU)
        ctx.fill()

        /* 从远到近叠山脉：远层振幅小、基线高、滚得慢 */
        const t = ts * 0.001
        for (let L = nLayers - 1; L >= 0; L -= 1) {
          const depth = 1 - L / Math.max(1, nLayers)
          const base = h * (0.4 + 0.13 * L)
          const amp = h * (0.055 + 0.085 * depth)
          const off = (t * speed * (0.14 + 0.26 * L)) % N
          const cr = Math.round(16 + depth * 22)
          const cg = Math.round(20 + depth * 26)
          const cb = Math.round(42 + depth * 34)
          ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`
          ctx.beginPath()
          ctx.moveTo(0, h)
          for (let x = 0; x <= w; x += 2) {
            const s = (((x / w) * N) + off) % N
            const i0 = Math.floor(s)
            const fr = s - i0
            const y = hs[L][i0] * (1 - fr) + hs[L][i0 + 1] * fr
            ctx.lineTo(x, base - y * amp)
          }
          ctx.lineTo(w, h)
          ctx.closePath()
          ctx.fill()
          /* 山脊高光一条：一眼能看出层与层的前后关系 */
          ctx.strokeStyle = `rgba(${140 + depth * 80}, ${170 + depth * 60}, 235, ${0.18 + depth * 0.3})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'rough') { rough = v; build() }
        if (key === 'layers') nLayers = v
        if (key === 'speed') speed = v
      },
      action(key) {
        if (key === 'reset') build()
      },
      destroy() {},
    }
  },
}

export default terrain
