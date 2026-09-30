/**
 * 场与流体 · 波的干涉 —— 多源波前叠加
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp, rand } from '../../utils/math.js'
import { makeFieldBuffer } from '../../utils/canvas.js'
import { hsl2rgb, makeRgbLut } from '../../utils/color.js'

const waveInterference = {
  id: 'wave-interference',
  title: '波的干涉',
  tag: '多源波前叠加',
  desc: '两个波源同时振动，波谷遇波谷会加强、波峰遇波谷会抵消 —— 双缝实验里那排明暗条纹就是这个式子。这里每个点源贡献 `sin(k·r − ωt)/√r`，把所有源的贡献加起来再映射成颜色：亮的是相长，暗的是相消，条纹是从公式里自己长出来的。',
  bg: '#03040c',
  params: [
    { key: 'sources', label: '波源数', min: 1, max: 8, step: 1, value: 2 },
    { key: 'wavelength', label: '波长', min: 14, max: 90, step: 2, value: 34 },
    { key: 'speed', label: '频率', min: 0.4, max: 6, step: 0.2, value: 2.2 },
  ],
  actions: [
    { key: 'random', label: '随机布点' },
    { key: 'pair', label: '双缝模式' },
  ],
  create(ctx) {
    const buf = makeFieldBuffer(4)
    let w = 800
    let h = 360
    let nSources = 2
    let wavelength = 34
    let speed = 2.2
    let t = 0

    /* 波源存归一化坐标，resize 后不用重排 */
    const sx = new Float64Array(8)
    const sy = new Float64Array(8)
    const ax = new Float64Array(8)
    const ay = new Float64Array(8)

    /* 亮部偏白、暗部偏蓝的双色带 —— 干涉条纹要「明暗」，不需要彩虹 */
    const LUT = makeRgbLut(96, (v) => hsl2rgb(210 + v * 90, 0.55 + v * 0.35, 0.08 + v * 0.72))

    const layout = (mode) => {
      if (mode === 'pair') {
        nSources = 2
        sx[0] = 0.4; sy[0] = 0.36
        sx[1] = 0.4; sy[1] = 0.64
      } else {
        for (let i = 0; i < 8; i += 1) {
          sx[i] = rand(0.18, 0.82)
          sy[i] = rand(0.16, 0.84)
        }
      }
    }
    layout(0)

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        buf.resize(w, h)
      },
      frame(ts, dt) {
        t += dt * speed
        const d = buf.data
        const gw = buf.width
        const gh = buf.height
        const k = TAU / wavelength
        for (let i = 0; i < nSources; i += 1) {
          ax[i] = sx[i] * w
          ay[i] = sy[i] * h
        }
        const srcN = nSources
        for (let gy = 0; gy < gh; gy += 1) {
          const py = (gy / gh) * h
          const row = gy * gw
          for (let gx = 0; gx < gw; gx += 1) {
            const pxx = (gx / gw) * w
            let sum = 0
            for (let i = 0; i < srcN; i += 1) {
              const dx = pxx - ax[i]
              const dy = py - ay[i]
              /* 1/√r 衰减：二维波的能量按周长摊开，降得比 1/r 慢 */
              sum += Math.sin(k * Math.sqrt(dx * dx + dy * dy) - t * 3) / Math.sqrt(Math.sqrt(dx * dx + dy * dy) + 6)
            }
            const v = clamp((sum / srcN) * 0.5 + 0.5, 0, 1)
            const ci = Math.min(95, Math.round(v * 95)) * 3
            const p = (row + gx) * 4
            d[p] = LUT[ci]
            d[p + 1] = LUT[ci + 1]
            d[p + 2] = LUT[ci + 2]
            d[p + 3] = 255
          }
        }
        buf.blit(ctx, w, h)

        /* 波源本身画成亮点，不然「干涉」没有参照物 */
        for (let i = 0; i < srcN; i += 1) {
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(sx[i] * w, sy[i] * h, 3.2, 0, TAU)
          ctx.fill()
        }
      },
      pointer(kind, x, y) {
        if (kind !== 'down') return
        /* 点哪儿就把最近的那个源挪过去 */
        let best = 0
        let bd = Infinity
        for (let i = 0; i < nSources; i += 1) {
          const dx = sx[i] * w - x
          const dy = sy[i] * h - y
          const d2 = dx * dx + dy * dy
          if (d2 < bd) { bd = d2; best = i }
        }
        sx[best] = x / w
        sy[best] = y / h
      },
      setParam(key, v) {
        if (key === 'sources') nSources = v
        if (key === 'wavelength') wavelength = v
        if (key === 'speed') speed = v
      },
      action(key) {
        if (key === 'random') layout(1)
        if (key === 'pair') layout('pair')
      },
      destroy() {},
    }
  },
}

export default waveInterference
