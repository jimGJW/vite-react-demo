/**
 * 元胞自动机与自组织 · 树枝状晶体 —— 各向异性扩散限制凝聚
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp, rand } from '../../utils/math.js'
import { makeFieldBuffer } from '../../utils/canvas.js'
import { hsl2rgb, makeRgbLut } from '../../utils/color.js'

const crystalGrowth = {
  id: 'crystal-growth',
  title: '树枝状晶体',
  tag: '各向异性扩散限制凝聚',
  desc: '和「扩散限制凝聚」同一个规则（随机行走的粒子贴住簇就停下），只加了一件事：附着概率跟方向有关。六个主方向的附着概率设为最高，粒子就优先长成六条主枝，再从主枝分出侧枝 —— 雪花的六角形不是画出来的，是晶格各向异性自己「选」出来的。',
  bg: '#04060d',
  params: [
    { key: 'bias', label: '各向异性', min: 1, max: 12, step: 0.5, value: 5 },
    { key: 'walkers', label: '随机粒子', min: 20, max: 400, step: 10, value: 160 },
    { key: 'steps', label: '每帧步数', min: 1, max: 20, step: 1, value: 6 },
  ],
  actions: [
    { key: 'restart', label: '重新结晶' },
    { key: 'shatter', label: '打碎重来' },
  ],
  create(ctx) {
    const buf = makeFieldBuffer(3)
    const LUT = makeRgbLut(64, (v) => hsl2rgb(210 - v * 150, 0.75, 0.3 + v * 0.6))
    let w = 800
    let h = 360
    let bias = 5
    let nWalkers = 160
    let stepsPer = 6
    let gw = 0
    let gh = 0
    let grid = new Uint8Array(0)
    let wx = new Float32Array(0)
    let wy = new Float32Array(0)
    const MAXW = 400

    const alloc = () => {
      gw = buf.width
      gh = buf.height
      grid = new Uint8Array(gw * gh)
      wx = new Float32Array(MAXW)
      wy = new Float32Array(MAXW)
      grid[(gh >> 1) * gw + (gw >> 1)] = 1
      for (let i = 0; i < MAXW; i += 1) spawn(i)
    }

    const spawn = (i) => {
      const a = Math.random() * TAU
      const r = Math.min(gw, gh) * rand(0.34, 0.5)
      wx[i] = gw / 2 + Math.cos(a) * r
      wy[i] = gh / 2 + Math.sin(a) * r
    }

    /** 六方各向异性：与六个主方向的夹角越小，附着概率越高 */
    const stickProb = (x, y) => {
      const cx = x - gw / 2
      const cy = y - gh / 2
      const a = Math.atan2(cy, cx)
      /* 六重对称的「方向因子」：cos(6θ) 在 0 / 60 / 120… 处取最大 */
      const dir = (Math.cos(a * 6) + 1) * 0.5
      return (0.12 + dir * 0.88) * bias * 0.16
    }

    const attached = (x, y) => {
      const xi = Math.floor(x)
      const yi = Math.floor(y)
      if (xi < 1 || yi < 1 || xi >= gw - 1 || yi >= gh - 1) return false
      const i = yi * gw + xi
      return grid[i - 1] || grid[i + 1] || grid[i - gw] || grid[i + gw]
    }

    const walk = (i) => {
      for (let s = 0; s < stepsPer; s += 1) {
        wx[i] += rand(-1, 1)
        wy[i] += rand(-1, 1)
        if (wx[i] < 1 || wy[i] < 1 || wx[i] >= gw - 1 || wy[i] >= gh - 1) { spawn(i); return }
        if (attached(wx[i], wy[i])) {
          if (Math.random() < stickProb(wx[i], wy[i])) {
            grid[Math.floor(wy[i]) * gw + Math.floor(wx[i])] = 1
            spawn(i)
            return
          }
          /* 概率不够就顺着半径往外退一点，避免粒子卡在簇表面空转 */
          const dx = wx[i] - gw / 2
          const dy = wy[i] - gh / 2
          const d = Math.hypot(dx, dy) || 1
          wx[i] += (dx / d) * 2.2
          wy[i] += (dy / d) * 2.2
        }
      }
    }

    const render = () => {
      const d = buf.data
      const cx = gw / 2
      const cy = gh / 2
      for (let i = 0; i < grid.length; i += 1) {
        const p = i * 4
        if (grid[i]) {
          const x = i % gw
          const y = (i / gw) | 0
          const r = Math.hypot(x - cx, y - cy) / (Math.min(gw, gh) * 0.5)
          const ci = Math.min(63, Math.round(clamp(r, 0, 1) * 63)) * 3
          d[p] = LUT[ci]
          d[p + 1] = LUT[ci + 1]
          d[p + 2] = LUT[ci + 2]
        } else {
          d[p] = 4; d[p + 1] = 6; d[p + 2] = 13
        }
        d[p + 3] = 255
      }
      buf.blit(ctx, w, h)
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        buf.resize(w, h)
        alloc()
      },
      frame() {
        for (let i = 0; i < MAXW; i += 1) { if (i < nWalkers) walk(i) }
        render()
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'bias') bias = v
        if (key === 'walkers') nWalkers = Math.min(MAXW, v)
        if (key === 'steps') stepsPer = v
      },
      action(key) {
        if (key === 'restart' || key === 'shatter') alloc()
      },
      destroy() {},
    }
  },
}

export default crystalGrowth
