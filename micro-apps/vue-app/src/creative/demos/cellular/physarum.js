/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 元胞自动机与自组织 · 黏菌网络 —— 迹线正反馈 + 三重感知
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU } from '../../utils/math.js'
import { makeFieldBuffer } from '../../utils/canvas.js'

const physarum = {
  id: 'physarum',
  title: '黏菌网络',
  tag: '迹线正反馈 + 三重感知',
  desc: '每个智能体只看前方三个角度上的「信息素浓度」，然后朝最浓的一侧转一点点、并原地留下一点信息素；信息素同时缓慢扩散与蒸发。没有全局规划，却会长出连接各食物源的运输网络 —— 真黏菌求解迷宫用的也是这套机制。',
  bg: '#04070d',
  params: [
    { key: 'agents', label: '智能体', min: 600, max: 6000, step: 200, value: 3200 },
    { key: 'sense', label: '感知角', min: 8, max: 70, step: 1, value: 26 },
    { key: 'decay', label: '蒸发率', min: 0.85, max: 0.99, step: 0.005, value: 0.94 },
    { key: 'turn', label: '转向速度', min: 1, max: 8, step: 0.1, value: 3.2 },
  ],
  actions: [
    { key: 'reset', label: '重来' },
    { key: 'blob', label: '中间抹一把' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let count = 3200
    let sense = 26
    let decay = 0.94
    let turn = 3.2
    const buf = makeFieldBuffer(4)
    let gw = 2
    let gh = 2
    let trail = new Float32Array(4)
    let blur = new Float32Array(4)
    const MAXA = 6000
    const ax = new Float32Array(MAXA)
    const ay = new Float32Array(MAXA)
    const aa = new Float32Array(MAXA)

    const scatter = () => {
      for (let i = 0; i < MAXA; i += 1) {
        ax[i] = Math.random() * gw
        ay[i] = Math.random() * gh
        aa[i] = Math.random() * TAU
      }
      trail.fill(0)
    }

    const alloc = () => {
      buf.resize(w, h)
      gw = buf.width
      gh = buf.height
      trail = new Float32Array(gw * gh)
      blur = new Float32Array(gw * gh)
      scatter()
    }

    const sample = (x, y) => {
      const gx = ((x | 0) % gw + gw) % gw
      const gy = ((y | 0) % gh + gh) % gh
      return trail[gy * gw + gx]
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        alloc()
        ctx.fillStyle = '#04070d'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        const sp = 0.9
        const sd = (sense * Math.PI) / 180
        for (let i = 0; i < count; i += 1) {
          const a = aa[i]
          const x = ax[i]
          const y = ay[i]
          /* 三个探针：正前、左偏、右偏，谁最浓就往那边转 */
          const f = sample(x + Math.cos(a) * sp * 3, y + Math.sin(a) * sp * 3)
          const l = sample(x + Math.cos(a - sd) * sp * 3, y + Math.sin(a - sd) * sp * 3)
          const r = sample(x + Math.cos(a + sd) * sp * 3, y + Math.sin(a + sd) * sp * 3)
          if (f >= l && f >= r) {
            /* 直行（什么都不做） */
          } else if (l > r) aa[i] = a - turn * dt
          else aa[i] = a + turn * dt
          const nx = x + Math.cos(aa[i]) * sp * 60 * dt
          const ny = y + Math.sin(aa[i]) * sp * 60 * dt
          ax[i] = nx < 0 ? gw - 1 : nx >= gw ? 0 : nx
          ay[i] = ny < 0 ? gh - 1 : ny >= gh ? 0 : ny
          const gx = ax[i] | 0
          const gy = ay[i] | 0
          trail[gy * gw + gx] += 1
        }

        /* 扩散：一个 5 点均值 + 蒸发，用独立缓冲避免「边读边写」的次序依赖 */
        for (let y = 0; y < gh; y += 1) {
          const up = ((y - 1 + gh) % gh) * gw
          const dn = ((y + 1) % gh) * gw
          const cu = y * gw
          for (let x = 0; x < gw; x += 1) {
            const l = (x - 1 + gw) % gw
            const r = (x + 1) % gw
            blur[cu + x] = (
              trail[cu + x] * 0.4
              + (trail[cu + l] + trail[cu + r] + trail[up + x] + trail[dn + x]) * 0.15
            ) * decay
          }
        }
        const t = trail
        trail = blur
        blur = t

        const d = buf.data
        const n = gw * gh
        for (let i = 0; i < n; i += 1) {
          let v = trail[i] * 0.5
          if (v > 1) v = 1
          const p = i * 4
          /* 用一条冷色带：低浓度近黑，高浓度偏青白 —— 网络的主干一眼可见 */
          d[p] = 6 + v * 150
          d[p + 1] = 16 + v * 226
          d[p + 2] = 30 + v * 225
          d[p + 3] = 255
        }
        buf.blit(ctx, w, h)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'agents') count = v
        if (key === 'sense') sense = v
        if (key === 'decay') decay = v
        if (key === 'turn') turn = v
      },
      action(key) {
        if (key === 'reset') scatter()
        /* 中间抹一把：网络会自己重新长出一条绕过空白的通路，最能看出它是「活的」 */
        if (key === 'blob') {
          const c = Math.floor(gh / 2)
          for (let y = c - 12; y <= c + 12; y += 1) {
            if (y < 0 || y >= gh) continue
            for (let x = 0; x < gw; x += 1) trail[y * gw + x] = 0
          }
        }
      },
      destroy() {},
    }
  },
}

export default physarum
