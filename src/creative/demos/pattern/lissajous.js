/**
 * 几何与图案 · 李萨如图形 —— 正交简谐振动
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU } from '../../utils/math.js'

const lissajous = {
  id: 'lissajous',
  title: '李萨如图形',
  tag: '正交简谐振动',
  desc: 'x 和 y 各按一个频率振动，合起来的轨迹就是李萨如曲线。频率比是有理数时曲线闭合、比是无理数时永远不闭合且会逐渐填满整个矩形。上世纪的示波器操作员正是靠这个图形来判断两路信号频率比。',
  bg: '#04060f',
  params: [
    { key: 'fx', label: 'x 频率', min: 1, max: 11, step: 1, value: 3 },
    { key: 'fy', label: 'y 频率', min: 1, max: 11, step: 1, value: 4 },
    { key: 'phase', label: '相位差', min: 0, max: 360, step: 5, value: 0 },
    { key: 'trail', label: '拖尾长度', min: 0.85, max: 0.995, step: 0.005, value: 0.955 },
  ],
  actions: [{ key: 'reset', label: '清空重画' }],
  create(ctx) {
    let w = 800
    let h = 360
    let fx = 3
    let fy = 4
    let ph = 0
    let trail = 0.955
    let t = 0

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        t = 0
        ctx.fillStyle = '#04060f'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        ctx.fillStyle = `rgba(4, 6, 15, ${1 - trail})`
        ctx.fillRect(0, 0, w, h)
        const cx = w / 2
        const cy = h / 2
        const rx = w * 0.42
        const ry = h * 0.42
        const om = 0.9
        const phRad = (ph * Math.PI) / 180

        /* 画一小段弧：dt 里走过的相位只有零点几度，所以每步细分 6 个点 */
        const steps = 6
        ctx.lineWidth = 1.4
        ctx.lineCap = 'round'
        for (let i = 0; i < steps; i += 1) {
          const t0 = t + (dt * om * i) / steps
          const t1 = t + (dt * om * (i + 1)) / steps
          const x0 = cx + Math.cos(t0 * fx + phRad) * rx
          const y0 = cy + Math.cos(t0 * fy) * ry
          const x1 = cx + Math.cos(t1 * fx + phRad) * rx
          const y1 = cy + Math.cos(t1 * fy) * ry
          /* 用相位当色相，看得清「哪一段是哪一段」，闭合曲线也不会糊成一团 */
          ctx.strokeStyle = `hsla(${(t0 * 40) % 360}, 90%, 64%, 0.85)`
          ctx.beginPath()
          ctx.moveTo(x0, y0)
          ctx.lineTo(x1, y1)
          ctx.stroke()
        }
        t += dt * om

        /* 参考点：两个方向上的投影点，一眼看出频率比 */
        const px = cx + Math.cos(t * fx + phRad) * rx
        const py = cy + Math.cos(t * fy) * ry
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.fillRect(px - 0.5, 0, 1, h)
        ctx.fillRect(0, py - 0.5, w, 1)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(px, py, 3, 0, TAU)
        ctx.fill()

        ctx.fillStyle = 'rgba(212, 226, 255, 0.82)'
        ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, monospace'
        ctx.textAlign = 'left'
        const g = (a, b) => (b ? g(b, a % b) : a)
        const d = g(fx, fy)
        ctx.fillText(`x:y = ${fx / d}:${fy / d}  相位 ${ph}°  ${d === 1 && fx !== fy ? '（互质，闭合成李萨如曲线）' : ''}`, 12, 20)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'fx') fx = v
        if (key === 'fy') fy = v
        if (key === 'phase') ph = v
        if (key === 'trail') trail = v
      },
      action(key) {
        if (key === 'reset') {
          t = 0
          ctx.fillStyle = '#04060f'
          ctx.fillRect(0, 0, w, h)
        }
      },
      destroy() {},
    }
  },
}

export default lissajous
