/**
 * 几何与图案 · 谐振记录仪 —— 阻尼正交振动
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { clamp } from '../../utils/math.js'

const harmonograph = {
  id: 'harmonograph',
  title: '谐振记录仪',
  tag: '阻尼正交振动',
  desc: '十九世纪有人把两支摆固定在纸上、各自带一支笔，让两个方向的振动互相正交 —— 画出来的就是这种花。数学上它只是两个方向的阻尼简谐振动：`x = Σ sin(f t + φ)·e^(−d t)`，`y` 同理。频率之比是有理数就闭合，是无理数就永远不闭合；阻尼让线条一层层往里收。',
  bg: '#05040c',
  params: [
    { key: 'ratio', label: '频率比', min: 1, max: 9, step: 0.01, value: 3.01 },
    { key: 'damp', label: '阻尼', min: 0.01, max: 0.2, step: 0.005, value: 0.045 },
    { key: 'phase', label: '相位差', min: 0, max: 3.14, step: 0.02, value: 1.22 },
    { key: 'speed', label: '落笔速度', min: 0.4, max: 6, step: 0.2, value: 2.2 },
  ],
  actions: [
    { key: 'again', label: '换一张' },
    { key: 'fix', label: '定住画面' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let ratio = 3.01
    let damp = 0.045
    let phase = 1.22
    let speed = 2.2
    let t = 0
    let drifting = true
    let lastHue = 0

    const clear = () => {
      ctx.fillStyle = '#05040c'
      ctx.fillRect(0, 0, w, h)
    }

    const at = (tt) => {
      const e = Math.exp(-damp * tt * 0.16)
      const x = (Math.sin(tt) * 0.6 + Math.sin(tt * ratio + phase) * 0.4) * e
      const y = (Math.sin(tt * 0.997 + phase * 0.6) * 0.6 + Math.sin(tt * (ratio + 0.5)) * 0.4) * e
      return [x, y]
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        clear()
      },
      frame(ts, dt) {
        if (!drifting) return
        /* 一次画一小段：t 走得越密，曲线越圆滑 */
        const steps = Math.round(60 * speed * clamp(dt * 60, 0.4, 2))
        const s = Math.min(w, h) * 0.44
        const cx = w / 2
        const cy = h / 2
        let prev = at(t)
        ctx.lineWidth = 1.1
        ctx.lineCap = 'round'
        for (let i = 1; i <= steps; i += 1) {
          t += 0.02
          const cur2 = at(t)
          /* 色相跟着参数走 —— 一次「换一张」就是一次变色 */
          ctx.strokeStyle = `hsla(${(lastHue + t * 3) % 360}, 84%, 62%, 0.72)`
          ctx.beginPath()
          ctx.moveTo(cx + prev[0] * s, cy + prev[1] * s)
          ctx.lineTo(cx + cur2[0] * s, cy + cur2[1] * s)
          ctx.stroke()
          prev = cur2
          /* 振幅衰减到看不见了就换一张 —— 不然笔尖会在中心点抖不动 */
          if (Math.hypot(cur2[0], cur2[1]) < 0.004) {
            clear()
            t = 0
            lastHue = Math.random() * 360
            break
          }
        }
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'ratio') ratio = v
        if (key === 'damp') damp = v
        if (key === 'phase') phase = v
        if (key === 'speed') speed = v
        clear()
        t = 0
      },
      action(key) {
        if (key === 'again') { clear(); t = 0; lastHue = Math.random() * 360 }
        if (key === 'fix') drifting = !drifting
      },
      destroy() {},
    }
  },
}

export default harmonograph
