/**
 * 粒子与渲染 · 色散扭曲 —— RGB 分通道偏移
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp, fbm } from '../../utils/math.js'
import { makeFieldBuffer } from '../../utils/canvas.js'

const chromaticWarp = {
  id: 'chromatic-warp',
  title: '色散扭曲',
  tag: 'RGB 分通道偏移',
  desc: '同一个扭曲场分别作用在红、绿、蓝三个通道上，但偏移量各不相同 —— 于是颜色被「撕开」成青边和红边。真实的透镜色差（不同波长的光折射率不同）就是这个机制，游戏里的「幻觉／故障」画面也大量借用了它：只错开几个像素，就能让规则的结构突然显得不稳定。',
  bg: '#04060e',
  params: [
    { key: 'amount', label: '色散强度', min: 0, max: 26, step: 1, value: 9 },
    { key: 'warp', label: '扭曲强度', min: 0, max: 40, step: 1, value: 16 },
    { key: 'speed', label: '流动速度', min: 0, max: 2, step: 0.05, value: 0.6 },
  ],
  actions: [
    { key: 'swap', label: '换图案' },
    { key: 'reset', label: '归零色散' },
  ],
  create(ctx) {
    const buf = makeFieldBuffer(4)
    let w = 800
    let h = 360
    let amount = 9
    let warp = 16
    let speed = 0.6
    let t = 0
    let mode = 0

    /** 底层图案的亮度（三种模式），用归一化坐标取 */
    const base = (u, v) => {
      const x = (u - 0.5) * 2
      const y = (v - 0.5) * 2
      if (mode === 1) {
        /* 同心环 */
        return clamp(Math.sin(Math.hypot(x, y) * 14 - t * 3) * 0.5 + 0.5, 0, 1)
      }
      if (mode === 2) {
        /* 棋盘 + 斜纹 */
        const c = (Math.floor(u * 14) + Math.floor(v * 14)) % 2
        return clamp(c * 0.5 + (Math.sin((x + y) * 6 + t) + 1) * 0.25, 0, 1)
      }
      /* 噪波云 */
      return clamp(fbm(x * 2.2 + t * 0.2, y * 2.2 - t * 0.15, 3) * 1.6 - 0.2, 0, 1)
    }

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
        const k = (TAU / Math.max(20, gw)) * (warp / 4)
        for (let gy = 0; gy < gh; gy += 1) {
          const v = (gy + 0.5) / gh
          const row = gy * gw
          for (let gx = 0; gx < gw; gx += 1) {
            const u = (gx + 0.5) / gw
            /* 扭曲量由两个方向的正弦决定：同一处的三个通道共用这个扭曲，只是偏移不同 */
            const du = Math.sin((v * 8 + t) * 1.7) * k / gw
            const dv = Math.cos((u * 8 - t) * 1.3) * k / gh
            const off = amount * 0.0016
            const r = base(u + du + off, v + dv + off)
            const g = base(u + du, v + dv)
            const b2 = base(u + du - off, v + dv - off)
            const p = (row + gx) * 4
            d[p] = (r * 255) | 0
            d[p + 1] = (g * 255) | 0
            d[p + 2] = (b2 * 255) | 0
            d[p + 3] = 255
          }
        }
        buf.blit(ctx, w, h)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'amount') amount = v
        if (key === 'warp') warp = v
        if (key === 'speed') speed = v
      },
      action(key) {
        if (key === 'swap') mode = (mode + 1) % 3
        if (key === 'reset') amount = 0
      },
      destroy() {},
    }
  },
}

export default chromaticWarp
