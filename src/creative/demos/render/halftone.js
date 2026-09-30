/**
 * 粒子与渲染 · 半调网点 —— 亮度 → 圆点半径
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp } from '../../utils/math.js'

const halftone = {
  id: 'halftone',
  title: '半调网点',
  tag: '亮度 → 圆点半径',
  desc: '报纸只能印纯黑或纯白，那灰阶从哪来？把图像切成一格一格，每格印一个点，点的大小按该格的暗度决定 —— 远看就混成了连续灰阶。这个「用面积换亮度」的思路一直用到今天的喷墨打印机。这里把点排成正方形网格，再用旋转的图案当输入，就能看到网点如何随明暗胀缩。',
  bg: '#0a0b10',
  params: [
    { key: 'pitch', label: '网点间距', min: 6, max: 26, step: 1, value: 13 },
    { key: 'speed', label: '图案速度', min: 0.2, max: 3, step: 0.1, value: 1 },
    { key: 'gain', label: '对比强度', min: 0.4, max: 2.4, step: 0.1, value: 1.2 },
  ],
  actions: [
    { key: 'swap', label: '换图案' },
    { key: 'invert', label: '反相' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let pitch = 13
    let speed = 1
    let gain = 1.2
    let t = 0
    let mode = 0
    let invert = false

    /** 输入图案的灰度（0=黑 1=白）—— 解析式给，不用真的去采样一张图 */
    const field = (u, v) => {
      const x = (u - 0.5) * 2
      const y = (v - 0.5) * 2
      if (mode === 1) {
        const r = Math.hypot(x, y)
        return clamp(1.1 - r * 1.3, 0, 1)
      }
      if (mode === 2) {
        return clamp((Math.sin(x * 3.1 + t) + Math.sin(y * 3.6 - t * 0.7) + 2) / 4, 0, 1)
      }
      /* 默认：旋转的斜条纹 */
      const a = t * 0.5
      return clamp((Math.sin((x * Math.cos(a) + y * Math.sin(a)) * 4.4 + t) + 1) / 2, 0, 1)
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        ctx.fillStyle = '#0a0b10'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        t += dt * speed
        ctx.fillStyle = '#0a0b10'
        ctx.fillRect(0, 0, w, h)

        const cols = Math.ceil(w / pitch)
        const rows = Math.ceil(h / pitch)
        const half = pitch * 0.5
        /* 一次 path、一次 fill：几千个圆点只用一次填充调用 */
        ctx.fillStyle = '#eaf2ff'
        ctx.beginPath()
        for (let gy = 0; gy < rows; gy += 1) {
          for (let gx = 0; gx < cols; gx += 1) {
            const u = (gx + 0.5) / cols
            const v = (gy + 0.5) / rows
            let g = field(u, v)
            if (invert) g = 1 - g
            const dark = clamp((1 - g) * gain, 0, 1)
            const r = dark * half * 1.42
            if (r < 0.35) continue
            const cx = (gx + 0.5) * pitch
            const cy = (gy + 0.5) * pitch
            ctx.moveTo(cx + r, cy)
            ctx.arc(cx, cy, r, 0, TAU)
          }
        }
        ctx.fill()
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'pitch') pitch = v
        if (key === 'speed') speed = v
        if (key === 'gain') gain = v
      },
      action(key) {
        if (key === 'swap') mode = (mode + 1) % 3
        if (key === 'invert') invert = !invert
      },
      destroy() {},
    }
  },
}

export default halftone
