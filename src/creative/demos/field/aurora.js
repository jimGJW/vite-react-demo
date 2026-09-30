/**
 * 场与流体 · 极光 —— 噪声幕帘 + 加色混合
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { rand, fbm } from '../../utils/math.js'

const aurora = {
  id: 'aurora',
  title: '极光',
  tag: '噪声幕帘 + 加色混合',
  desc: '把极光理解成几层「竖直的幕帘」：每一层的上边界由 fbm 噪声决定，向下延伸成一个渐变透明的填充，再用加色混合叠起来。两层不同速度的幕帘错开飘动，就会看到极光特有的那种「波纹掠过」的错觉 —— 其实只是噪声在平移。',
  bg: '#02040a',
  params: [
    { key: 'bands', label: '幕帘层数', min: 1, max: 5, step: 1, value: 3 },
    { key: 'speed', label: '飘动速度', min: 0.05, max: 1.2, step: 0.05, value: 0.35 },
    { key: 'height', label: '幕帘高度', min: 0.15, max: 0.95, step: 0.05, value: 0.55 },
    { key: 'glow', label: '辉光强度', min: 0.1, max: 1, step: 0.05, value: 0.6 },
  ],
  actions: [
    { key: 'newsly', label: '换一片天' },
    { key: 'star', label: '星空开关' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let bands = 3
    let speed = 0.35
    let bandH = 0.55
    let glow = 0.6
    let t = 0
    let seedPhase = 0
    let showStars = true
    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random(), y: Math.random(), r: rand(0.5, 1.4), a: rand(0.25, 0.9),
    }))

    /** 取 x 处幕帘上边界（0..1 归一化高度，越大越高） */
    const topAt = (nx, layer) => {
      const n = fbm(nx * 2.4 + seedPhase + layer * 3.7, layer * 1.9 + t * speed * 0.6, 4)
      return 0.72 - n * 0.42
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        ctx.fillStyle = '#02040a'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts) {
        t = ts / 1000
        /* 星空用半透明覆写慢慢淡出，幕帘再叠上来；这样底图不会每帧重画 150 个点 */
        ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = 'rgba(2, 4, 10, 0.3)'
        ctx.fillRect(0, 0, w, h)
        if (showStars) {
          for (const s of stars) {
            ctx.fillStyle = `rgba(214, 228, 255, ${s.a * 0.7})`
            ctx.fillRect(s.x * w, s.y * h * 0.7, s.r, s.r)
          }
        }

        ctx.globalCompositeOperation = 'lighter'
        const STEPS = 26
        for (let L = 0; L < bands; L += 1) {
          const hue = 140 + L * 26
          const y0 = h * (0.24 + L * 0.03)
          const grad = ctx.createLinearGradient(0, y0 - 20, 0, y0 + h * bandH)
          grad.addColorStop(0, `hsla(${hue}, 92%, 72%, ${0.34 * glow})`)
          grad.addColorStop(0.45, `hsla(${hue + 30}, 90%, 58%, ${0.2 * glow})`)
          grad.addColorStop(1, `hsla(${hue + 60}, 88%, 46%, 0)`)
          ctx.fillStyle = grad
          ctx.beginPath()
          /* 上边界：沿 x 密集采样噪声；下边界直着收 —— 极光就是「上缘抖动、下缘化开」 */
          for (let i = 0; i <= STEPS; i += 1) {
            const nx = i / STEPS
            const y = y0 + topAt(nx, L) * h * 0.3
            const x = nx * w
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          for (let i = STEPS; i >= 0; i -= 1) {
            const nx = i / STEPS
            ctx.lineTo(nx * w, y0 + h * bandH)
          }
          ctx.closePath()
          ctx.fill()
        }
        ctx.globalCompositeOperation = 'source-over'

        /* 地平线：没有它极光会显得是悬空的 */
        ctx.fillStyle = 'rgba(6, 12, 22, 0.9)'
        ctx.fillRect(0, h * 0.94, w, h * 0.06)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'bands') bands = v
        if (key === 'speed') speed = v
        if (key === 'height') bandH = v
        if (key === 'glow') glow = v
      },
      action(key) {
        if (key === 'newsly') seedPhase += 11.37
        if (key === 'star') showStars = !showStars
      },
      destroy() {},
    }
  },
}

export default aurora
