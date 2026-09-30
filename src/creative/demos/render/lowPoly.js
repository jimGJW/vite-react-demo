/**
 * 粒子与渲染 · 低多边形地形 —— 顶点着色 + 面法线光照
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp, fbm } from '../../utils/math.js'

const lowPoly = {
  id: 'low-poly',
  title: '低多边形地形',
  tag: '顶点着色 + 面法线光照',
  desc: '低多边形风格的关键不是「面少」，而是每个面只有一种颜色 —— 于是棱角被显式化了。做法是：网格高度取自 fbm，每个小三角面的法线决定明暗，同一高度再用色带映射成草地／岩石／雪线。所有三角形一次性填完，比逐面描边快得多，而效果反而更「有形状」。',
  bg: '#050810',
  params: [
    { key: 'grid', label: '网格密度', min: 8, max: 34, step: 2, value: 20 },
    { key: 'amp', label: '起伏高度', min: 20, max: 160, step: 5, value: 78 },
    { key: 'speed', label: '飞行速度', min: 0.1, max: 3, step: 0.1, value: 0.8 },
    { key: 'sun', label: '光照方向', min: -1, max: 1, step: 0.05, value: 0.45 },
  ],
  actions: [
    { key: 'relief', label: '换地貌' },
    { key: 'flat', label: '压平' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let N = 20
    let amp = 78
    let speed = 0.8
    let sun = 0.45
    let t = 0
    let seed = 0
    let flat = false
    const hs = new Float32Array((34 + 2) * (34 + 2))

    const hAt = (gx, gy) => {
      if (flat) return 0
      const v = fbm(gx * 0.22 + seed, gy * 0.22 + seed * 0.7, 4)
      /* 两条山脊：让远山有层次而不是一片起伏 */
      return v * 0.7 + Math.pow(fbm(gx * 0.07 + seed, gy * 0.07, 2), 2) * 0.6
    }

    const shadeColor = (lum, height) => {
      /* 按高度分三段：低处草青、中部岩灰、高处雪白 */
      if (height > 0.78) return `hsl(210, 22%, ${38 + lum * 46}%)`
      if (height > 0.5) return `hsl(206, 16%, ${24 + lum * 40}%)`
      return `hsl(${148 + lum * 22}, 34%, ${16 + lum * 44}%)`
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        ctx.fillStyle = '#050810'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        t += dt * speed
        const rows = N + 1
        const cols = N + 2
        for (let gy = 0; gy < rows; gy += 1) {
          for (let gx = 0; gx < cols; gx += 1) {
            hs[gy * cols + gx] = hAt(gx, gy + t * 6)
          }
        }

        /* 天幕渐变（每帧一次，比逐帧重绘背景便宜） */
        const sky = ctx.createLinearGradient(0, 0, 0, h)
        sky.addColorStop(0, '#0a1226')
        sky.addColorStop(0.45, '#182242')
        sky.addColorStop(1, '#2a3358')
        ctx.fillStyle = sky
        ctx.fillRect(0, 0, w, h)

        const horizon = h * 0.34
        const depth = (h - horizon) * 0.92
        const projX = (gx) => (gx / (cols - 1)) * w * 1.12 - w * 0.06
        /* 透视：越远的行（gy 小）越靠上、越窄 */
        const projY = (gy, hgt) => {
          const persp = Math.pow(gy / (rows - 1), 1.9)
          return horizon + perspectiveBase(gy) + persp * depth - hgt * amp * (0.28 + persp * 0.9)
        }
        function perspectiveBase(gy) {
          return Math.pow(gy / (rows - 1), 2.4) * 0
        }

        for (let gy = 0; gy < rows - 1; gy += 1) {
          for (let gx = 0; gx < cols - 1; gx += 1) {
            const a = hs[gy * cols + gx]
            const b = hs[gy * cols + gx + 1]
            const c = hs[(gy + 1) * cols + gx]
            const d = hs[(gy + 1) * cols + gx + 1]
            /* 用两个高度的平均差当「坡度」，近似面法线的朝向 */
            const slope = (c + d - a - b) * 0.5
            const lum = clamp(0.5 + slope * 3.4 * sun, 0.06, 1)
            const hAvg = clamp((a + b + c + d) * 0.25, 0, 1)
            const x0 = projX(gx)
            const x1 = projX(gx + 1)
            const yTop = projY(gy, (a + b) * 0.5)
            const yBot = projY(gy + 1, (c + d) * 0.5)
            ctx.fillStyle = shadeColor(lum, hAvg)
            ctx.beginPath()
            ctx.moveTo(x0, yTop)
            ctx.lineTo(x1, yTop)
            ctx.lineTo(x1, yBot)
            ctx.closePath()
            ctx.fill()
            ctx.beginPath()
            ctx.moveTo(x0, yTop)
            ctx.lineTo(x1, yBot)
            ctx.lineTo(x0, yBot)
            ctx.closePath()
            ctx.fill()
          }
        }

        /* 太阳 */
        ctx.fillStyle = 'rgba(255, 226, 170, 0.85)'
        ctx.beginPath()
        ctx.arc(w * 0.74, horizon - 34, 22, 0, TAU)
        ctx.fill()
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'grid') N = v
        if (key === 'amp') amp = v
        if (key === 'speed') speed = v
        if (key === 'sun') sun = v
      },
      action(key) {
        if (key === 'relief') { seed += 13.7; flat = false }
        if (key === 'flat') flat = !flat
      },
      destroy() {},
    }
  },
}

export default lowPoly
