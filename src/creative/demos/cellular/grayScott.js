/**
 * 元胞自动机与自组织 · 反应扩散图灵斑图 —— Gray-Scott 模型
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { rand } from '../../utils/math.js'
import { makeFieldBuffer } from '../../utils/canvas.js'

const RD_RAMP = (() => {
  const r = new Uint8Array(256)
  const g = new Uint8Array(256)
  const b = new Uint8Array(256)
  for (let i = 0; i < 256; i += 1) {
    const t = i / 255
    const k1 = Math.min(t * 2.1, 1)
    const k2 = Math.max(t * 2.1 - 1, 0)
    r[i] = 8 + k1 * 38 + k2 * 190
    g[i] = 10 + k1 * 182 + k2 * 54
    b[i] = 26 + k1 * 188 + k2 * 41
  }
  return { r, g, b }
})()

const grayScott = {
  id: 'gray-scott',
  title: '反应扩散图灵斑图',
  tag: 'Gray-Scott 模型',
  desc: '两种虚拟化学物质一边扩散一边反应：A + 2B → 3B，B 同时以 k 的速率衰变。参数落在特定区间时，本来均匀的状态会自己裂成斑点、条纹和迷宫 —— 图灵 1952 年预言的「化学怎么长出图案」，豹纹与热带鱼的条纹就是这个机制。',
  bg: '#05060d',
  params: [
    { key: 'feed', label: '供给率 f', min: 0.014, max: 0.084, step: 0.001, value: 0.037 },
    { key: 'kill', label: '衰变率 k', min: 0.045, max: 0.068, step: 0.001, value: 0.062 },
    { key: 'speed', label: '迭代/帧', min: 2, max: 16, step: 1, value: 8 },
  ],
  actions: [
    { key: 'seed', label: '重新播种' },
    { key: 'clear', label: '抹平' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let f = 0.037
    let k = 0.062
    let iters = 8
    const buf = makeFieldBuffer(4)
    let gw = 2
    let gh = 2
    let a = new Float32Array(4)
    let b = new Float32Array(4)
    let na = new Float32Array(4)
    let nb = new Float32Array(4)

    const alloc = () => {
      buf.resize(w, h)
      gw = buf.width
      gh = buf.height
      a = new Float32Array(gw * gh)
      b = new Float32Array(gw * gh)
      na = new Float32Array(gw * gh)
      nb = new Float32Array(gw * gh)
      seed()
    }

    /** 播下若干块 B 的斑点 —— 均匀态是稳定的，必须给点扰动才会长图案 */
    const seed = () => {
      a.fill(1)
      b.fill(0)
      const blobs = Math.max(6, Math.round(gw * gh / 2600))
      for (let n = 0; n < blobs; n += 1) {
        const cx = Math.floor(rand(gw * 0.1, gw * 0.9))
        const cy = Math.floor(rand(gh * 0.1, gh * 0.9))
        for (let dy = -4; dy <= 4; dy += 1) {
          for (let dx = -4; dx <= 4; dx += 1) {
            if (dx * dx + dy * dy > 18) continue
            const gx = cx + dx
            const gy = cy + dy
            if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) continue
            b[gy * gw + gx] = 1
            a[gy * gw + gx] = 0.5
          }
        }
      }
    }

    /** 一次显式欧拉推进：9 点拉普拉斯 + 反应项。DA=1.0 / DB=0.5 是常用的稳定取值 */
    const tickOnce = () => {
      for (let y = 1; y < gh - 1; y += 1) {
        for (let x = 1; x < gw - 1; x += 1) {
          const i = y * gw + x
          const A = a[i]
          const B = b[i]
          const lapA = (a[i - 1] + a[i + 1] + a[i - gw] + a[i + gw]) * 0.2
            + (a[i - gw - 1] + a[i - gw + 1] + a[i + gw - 1] + a[i + gw + 1]) * 0.05 - A
          const lapB = (b[i - 1] + b[i + 1] + b[i - gw] + b[i + gw]) * 0.2
            + (b[i - gw - 1] + b[i - gw + 1] + b[i + gw - 1] + b[i + gw + 1]) * 0.05 - B
          const rate = A * B * B
          na[i] = A + (lapA - rate + f * (1 - A))
          nb[i] = B + (lapB * 0.5 + rate - (k + f) * B)
        }
      }
      /* 交换双缓冲（原地换引用，不拷贝数组） */
      const ta = a
      const tb = b
      a = na
      b = nb
      na = ta
      nb = tb
      /* 边界直接抄相邻内侧一行/一列（零梯度边界）：既省掉两套边界公式，也不会在边缘留下两帧前的旧值 */
      for (let x = 0; x < gw; x += 1) {
        a[x] = a[x + gw]
        a[(gh - 1) * gw + x] = a[(gh - 2) * gw + x]
        b[x] = b[x + gw]
        b[(gh - 1) * gw + x] = b[(gh - 2) * gw + x]
      }
      for (let y = 0; y < gh; y += 1) {
        a[y * gw] = a[y * gw + 1]
        a[y * gw + gw - 1] = a[y * gw + gw - 2]
        b[y * gw] = b[y * gw + 1]
        b[y * gw + gw - 1] = b[y * gw + gw - 2]
      }
    }

    const render = () => {
      const d = buf.data
      const { r, g, b: bl } = RD_RAMP
      const n = gw * gh
      for (let i = 0; i < n; i += 1) {
        let v = b[i] * 4.2
        if (v > 1) v = 1
        else if (v < 0) v = 0
        const c = (v * 255) | 0
        const p = i * 4
        d[p] = r[c]
        d[p + 1] = g[c]
        d[p + 2] = bl[c]
        d[p + 3] = 255
      }
      buf.blit(ctx, w, h)
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        alloc()
        ctx.fillStyle = '#05060d'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        /* 掉帧时不补跑 —— 这类 PDE 少跑几步只是慢一点，补跑反而卡成幻灯片 */
        const n = Math.max(1, Math.min(iters, Math.round(iters * Math.min(dt * 60, 2))))
        for (let i = 0; i < n; i += 1) tickOnce()
        render()
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'feed') f = v
        if (key === 'kill') k = v
        if (key === 'speed') iters = v
      },
      action(key) {
        if (key === 'seed') seed()
        if (key === 'clear') { a.fill(1); b.fill(0) }
      },
      destroy() {},
    }
  },
}

export default grayScott
