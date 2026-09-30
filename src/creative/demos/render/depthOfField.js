/**
 * 粒子与渲染 · 景深与散景光斑 —— 圆盘采样 + 加色混合
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp } from '../../utils/math.js'

const depthOfField = {
  id: 'depth-of-field',
  title: '景深与散景光斑',
  tag: '圆盘采样 + 加色混合',
  desc: '真实相机只能在一个距离上完全合焦，离这个距离越远就越模糊；而模糊的亮光不会变成灰点，会变成一个小圆盘 —— 这就是散景光斑（bokeh）。这里给每个光点按「离焦程度」撒一圈采样点再加色叠加，于是合焦的灯是尖的、离焦的灯是圆的，缩光圈（减小采样圆）就能让所有灯都变清晰。',
  bg: '#04050c',
  params: [
    { key: 'focus', label: '对焦距离', min: 0, max: 1, step: 0.02, value: 0.5 },
    { key: 'aperture', label: '光圈大小', min: 0, max: 26, step: 1, value: 12 },
    { key: 'count', label: '光点数', min: 20, max: 200, step: 10, value: 90 },
  ],
  actions: [
    { key: 'rearrange', label: '重新布光' },
    { key: 'pulse', label: '呼吸' },
  ],
  create(ctx) {
    const MAXL = 200
    let w = 800
    let h = 360
    let focus = 0.5
    let aperture = 12
    let count = 90
    const lx = new Float32Array(MAXL)
    const ly = new Float32Array(MAXL)
    const ld = new Float32Array(MAXL)
    const lh = new Float32Array(MAXL)
    let pulse = 1

    const arrange = () => {
      for (let i = 0; i < MAXL; i += 1) {
        lx[i] = Math.random()
        ly[i] = Math.random()
        ld[i] = Math.random()
        lh[i] = 20 + Math.random() * 300
      }
    }
    arrange()

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        ctx.fillStyle = '#04050c'
        ctx.fillRect(0, 0, w, h)
      },
      frame() {
        ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = '#04050c'
        ctx.fillRect(0, 0, w, h)
        ctx.globalCompositeOperation = 'lighter'

        /* 背景：一排暗淡的远灯，给景深一个参照 */
        for (let i = 0; i < MAXL; i += 1) {
          if (i >= count) break
          const cx = lx[i] * w
          const cy = ly[i] * h
          /* 离焦量 = |深度 − 对焦面|，乘光圈得到弥散圆半径 */
          const coc = Math.abs(ld[i] - focus) * aperture * 1.5
          const hue = lh[i]
          const bright = (0.35 + (1 - Math.abs(ld[i] - focus)) * 0.65) * pulse
          const samples = coc < 1.2 ? 1 : clamp(Math.round(coc * 1.6), 2, 26)
          ctx.fillStyle = `hsla(${hue}, 92%, 66%, ${clamp(bright / samples * 2.4, 0.02, 0.95)})`
          for (let s = 0; s < samples; s += 1) {
            /* 在弥散圆里均匀撒点：sqrt 让点在圆面积上均匀而不是挤在圆心 */
            const a = Math.random() * TAU
            const r = Math.sqrt(Math.random()) * coc
            const x = cx + Math.cos(a) * r
            const y = cy + Math.sin(a) * r
            const sz = 1.1 + Math.abs(ld[i] - focus) * 2.2
            ctx.fillRect(x - sz * 0.5, y - sz * 0.5, sz, sz)
          }
        }
        ctx.globalCompositeOperation = 'source-over'

        /* 对焦面的指示条 */
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
        ctx.fillRect(0, h - 22, w, 22)
        ctx.fillStyle = 'rgba(140, 230, 255, 0.9)'
        ctx.fillRect(focus * w - 1, h - 22, 2, 22)
        ctx.font = '11px ui-monospace, monospace'
        ctx.fillText('近', 6, h - 8)
        ctx.fillText('远', w - 22, h - 8)
      },
      pointer(kind, x) {
        if (kind !== 'down' && kind !== 'move') return
        focus = clamp(x / w, 0, 1)
      },
      setParam(key, v) {
        if (key === 'focus') focus = v
        if (key === 'aperture') aperture = v
        if (key === 'count') count = Math.min(MAXL, v)
      },
      action(key) {
        if (key === 'rearrange') arrange()
        if (key === 'pulse') pulse = pulse > 0.9 ? 0.55 : 1
      },
      destroy() {},
    }
  },
}

export default depthOfField
