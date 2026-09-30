/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 元胞自动机与自组织 · 伊辛模型相变 —— Metropolis 采样
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { makeFieldBuffer } from '../../utils/canvas.js'

const ising = {
  id: 'ising',
  title: '伊辛模型相变',
  tag: 'Metropolis 采样',
  desc: '每个格子只有上/下两个自旋，随机挑一个尝试翻转：能量变低就接受，变高就以 exp(-ΔE/T) 的概率接受。温度高于 2.27 时磁畴瞬间碎掉，低于它则慢慢长成大块 — 一个只有两行代码的规则，却做出了真实的相变。',
  bg: '#05060e',
  params: [
    { key: 'temp', label: '温度 T', min: 0.4, max: 4, step: 0.02, value: 2.1 },
    { key: 'tries', label: '尝试/帧', min: 500, max: 40000, step: 500, value: 12000 },
  ],
  actions: [
    { key: 'reset', label: '随机重排' },
    { key: 'quench', label: '急冷到 1.2' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let temp = 2.1
    let tries = 12000
    const buf = makeFieldBuffer(3)
    let gw = 2
    let gh = 2
    let spin = new Int8Array(4)

    const alloc = () => {
      buf.resize(w, h)
      gw = buf.width
      gh = buf.height
      spin = new Int8Array(gw * gh)
      for (let i = 0; i < spin.length; i += 1) spin[i] = Math.random() < 0.5 ? 1 : -1
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        alloc()
        ctx.fillStyle = '#05060e'
        ctx.fillRect(0, 0, w, h)
      },
      frame() {
        /* Metropolis：温度越低越倾向「跟邻居一致」，于是就长出大磁畴 */
        for (let k = 0; k < tries; k += 1) {
          const i = (Math.random() * spin.length) | 0
          const x = i % gw
          const y = (i / gw) | 0
          const s = spin[i]
          let sum = 0
          if (x > 0) sum += spin[i - 1]
          if (x < gw - 1) sum += spin[i + 1]
          if (y > 0) sum += spin[i - gw]
          if (y < gh - 1) sum += spin[i + gw]
          /* ΔE = 2·s·Σ邻居；ΔE ≤ 0 直接接受 */
          const dE = 2 * s * sum
          if (dE <= 0 || Math.random() < Math.exp(-dE / temp)) spin[i] = -s
        }

        const d = buf.data
        const n = gw * gh
        for (let i = 0; i < n; i += 1) {
          const p = i * 4
          if (spin[i] > 0) {
            d[p] = 255; d[p + 1] = 128; d[p + 2] = 92    /* 上旋：暖色 */
          } else {
            d[p] = 76; d[p + 1] = 156; d[p + 2] = 255    /* 下旋：冷色 */
          }
          d[p + 3] = 255
        }
        buf.blit(ctx, w, h)

        /* 实时磁化强度 |M|：相变点附近会看到它剧烈抖动 */
        let m = 0
        for (let i = 0; i < n; i += 1) m += spin[i]
        const mag = Math.abs(m / n)
        ctx.fillStyle = 'rgba(220, 232, 255, 0.85)'
        ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, monospace'
        ctx.textAlign = 'left'
        ctx.fillText(`T=${temp.toFixed(2)} · |M|=${mag.toFixed(3)} · 临界温度≈2.27`, 12, 20)
        ctx.fillStyle = 'rgba(255,255,255,0.14)'
        ctx.fillRect(12, 26, 150, 3)
        ctx.fillStyle = mag > 0.5 ? '#ff8050' : '#4c9cff'
        ctx.fillRect(12, 26, 150 * mag, 3)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'temp') temp = v
        if (key === 'tries') tries = v
      },
      action(key) {
        if (key === 'reset') {
          for (let i = 0; i < spin.length; i += 1) spin[i] = Math.random() < 0.5 ? 1 : -1
        }
        if (key === 'quench') temp = 1.2
      },
      destroy() {},
    }
  },
}

export default ising
