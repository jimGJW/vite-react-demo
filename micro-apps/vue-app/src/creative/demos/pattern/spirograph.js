/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 几何与图案 · 万花尺 —— 内摆线 / 外摆线
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp } from '../../utils/math.js'

const spirograph = {
  id: 'spirograph',
  title: '万花尺',
  tag: '内摆线 / 外摆线',
  desc: '小齿轮在大齿轮内圈（或外圈）滚动时，齿轮上某个孔画出的轨迹就是这些曲线。参数只有三个整数：大轮半径 R、小轮半径 r、笔孔偏心率 d。r 与 R 的比值决定了花瓣数，而 d 决定花瓣是胖是瘦 —— 三个数字就能生成一整个图案库。',
  bg: '#04060c',
  params: [
    { key: 'big', label: '大轮 R', min: 12, max: 60, step: 1, value: 31 },
    { key: 'small', label: '小轮 r', min: 3, max: 30, step: 1, value: 11 },
    { key: 'offset', label: '笔孔 d', min: 0.1, max: 1, step: 0.02, value: 0.62 },
    { key: 'speed', label: '落笔速度', min: 0.1, max: 4, step: 0.1, value: 1.4 },
  ],
  actions: [
    { key: 'again', label: '换参数' },
    { key: 'outer', label: '内摆↔外摆' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let big = 31
    let small = 11
    let offset = 0.62
    let speed = 1.4
    let t = 0
    let outer = false
    let hold = 0
    let hue = 0

    /* 一圈走完的 θ 上限：两轮齿数的最小公倍数决定闭合点 */
    const period = () => {
      const g = (a, b) => (b ? g(b, a % b) : a)
      const rr = Math.max(1, Math.round(small))
      return (TAU * rr) / g(Math.max(1, Math.round(big)), rr)
    }

    const clear = () => {
      ctx.fillStyle = '#04060c'
      ctx.fillRect(0, 0, w, h)
    }

    const at = (th) => {
      const R = big
      const r = small
      const d = r * offset
      const k = outer ? R / r + 1 : R / r - 1
      /* 外摆线：圆心在 (R+r)cosθ；内摆线：圆心在 (R−r)cosθ */
      const base = outer ? R + r : R - r
      const x = base * Math.cos(th) - d * Math.cos(k * th)
      const y = base * Math.sin(th) - d * Math.sin(k * th)
      return [x, y]
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        clear()
      },
      frame(ts, dt) {
        if (hold > 0) {
          hold -= dt
          if (hold <= 0) { clear(); t = 0; hue = Math.random() * 360 }
          return
        }
        const total = period()
        const steps = Math.round(240 * speed * clamp(dt * 60, 0.4, 2))
        const S = Math.min(w, h) * 0.42 / (big + small)
        const cx = w / 2
        const cy = h / 2
        let prev = at(t)
        ctx.lineWidth = 1
        ctx.lineCap = 'round'
        for (let i = 0; i < steps; i += 1) {
          t += total / 1600
          if (t > total) { hold = 1.2; break }
          const cur2 = at(t)
          /* 色相随 θ 推进，闭合处与起始处颜色自然接上 */
          ctx.strokeStyle = `hsla(${(hue + (t / total) * 300) % 360}, 86%, 64%, 0.8)`
          ctx.beginPath()
          ctx.moveTo(cx + prev[0] * S, cy + prev[1] * S)
          ctx.lineTo(cx + cur2[0] * S, cy + cur2[1] * S)
          ctx.stroke()
          prev = cur2
        }
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'big') big = v
        if (key === 'small') { small = v; if (small >= big) small = big - 1 }
        if (key === 'offset') offset = v
        if (key === 'speed') speed = v
        clear()
        t = 0
        hold = 0
      },
      action(key) {
        if (key === 'again') {
          big = 12 + ((Math.random() * 49) | 0)
          small = 3 + ((Math.random() * Math.min(28, big - 3)) | 0)
          hue = Math.random() * 360
          clear()
          t = 0
          hold = 0
        }
        if (key === 'outer') { outer = !outer; clear(); t = 0; hold = 0 }
      },
      destroy() {},
    }
  },
}

export default spirograph
