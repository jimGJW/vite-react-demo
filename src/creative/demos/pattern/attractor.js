/**
 * 几何与图案 · 奇异吸引子 —— Clifford 映射 + 加色点云
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { clamp, rand } from '../../utils/math.js'

const attractor = {
  id: 'attractor',
  title: '奇异吸引子',
  tag: 'Clifford 映射 + 加色点云',
  desc: '两个正弦余弦拼出来的迭代式 `x′=sin(ay)+c·cos(ax)`、`y′=sin(bx)+d·cos(by)`，看起来简单得不像能出东西 —— 但把同一个点迭代几十万次、每次都画下来，轨迹会填出一整片有分形结构的图案。吸引子不是曲线，是「点集」：它的维数不是整数。慢慢调那四个系数，图案会连续地变形。',
  bg: '#03040c',
  params: [
    { key: 'a', label: 'a', min: -3.2, max: 3.2, step: 0.02, value: -1.7 },
    { key: 'b', label: 'b', min: -3.2, max: 3.2, step: 0.02, value: 1.8 },
    { key: 'c', label: 'c', min: -3.2, max: 3.2, step: 0.02, value: -1.9 },
    { key: 'd', label: 'd', min: -3.2, max: 3.2, step: 0.02, value: -0.4 },
  ],
  actions: [
    { key: 'random', label: '随机参数' },
    { key: 'clear', label: '清空' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let a = -1.7
    let b = 1.8
    let c = -1.9
    let d = -0.4
    let x = 0.1
    let y = 0.1

    const resetState = () => { x = 0.1; y = 0.1 }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        resetState()
        ctx.fillStyle = '#03040c'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        /* 每帧迭代一批点；加色混合让密度高的地方自己亮起来 */
        const n = Math.round(4000 * clamp(dt * 60, 0.5, 2))
        const s = Math.min(w, h) * 0.31
        const cx = w / 2
        const cy = h / 2
        ctx.globalCompositeOperation = 'lighter'
        const hue = (ts * 0.008) % 360
        ctx.fillStyle = `hsla(${hue}, 90%, 62%, 0.055)`
        for (let i = 0; i < n; i += 1) {
          const nx = Math.sin(a * y) + c * Math.cos(a * x)
          const ny = Math.sin(b * x) + d * Math.cos(b * y)
          x = nx
          y = ny
          /* 直接填 1.3px 的方块，比 arc 快一个数量级，视觉上没差别 */
          ctx.fillRect(cx + x * s, cy + y * s, 1.3, 1.3)
        }
        ctx.globalCompositeOperation = 'source-over'
      },
      pointer(kind, px, py) {
        if (kind !== 'down') return
        /* 点哪儿就以哪儿的坐标为初值重新迭代 —— 同一个吸引子，走位完全不同 */
        x = (px - w / 2) / (Math.min(w, h) * 0.31)
        y = (py - h / 2) / (Math.min(w, h) * 0.31)
      },
      setParam(key, v) {
        if (key === 'a') a = v
        if (key === 'b') b = v
        if (key === 'c') c = v
        if (key === 'd') d = v
        resetState()
      },
      action(key) {
        if (key === 'random') {
          a = rand(-3, 3); b = rand(-3, 3); c = rand(-3, 3); d = rand(-3, 3)
          resetState()
        }
        if (key === 'clear') {
          ctx.fillStyle = '#03040c'
          ctx.fillRect(0, 0, w, h)
        }
      },
      destroy() {},
    }
  },
}

export default attractor
