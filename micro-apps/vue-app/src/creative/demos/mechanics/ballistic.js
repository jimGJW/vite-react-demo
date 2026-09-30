/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 天体与力学 · 弹道与空气阻力 —— 二次阻力积分 + 安全包络
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp } from '../../utils/math.js'
import { makeStepper } from '../../utils/canvas.js'

const ballistic = {
  id: 'ballistic',
  title: '弹道与空气阻力',
  tag: '二次阻力积分 + 安全包络',
  desc: '真空中炮弹走抛物线，有空气阻力时轨道会被压成不对称的「前陡后缓」形状 —— 上升段被拖慢、下降段几乎垂直坠落。把所有发射角都射一遍，轨迹的上边界就是「安全包络」（也叫安全抛物面）：包络之内任何一点都能打到，之外任何角度都够不着。',
  bg: '#03060e',
  params: [
    { key: 'speed', label: '初速度', min: 120, max: 620, step: 20, value: 400 },
    { key: 'drag', label: '空气阻力', min: 0, max: 2, step: 0.05, value: 0.5 },
    { key: 'angle', label: '发射角', min: -80, max: 80, step: 2, value: 49 },
  ],
  actions: [
    { key: 'fan', label: '齐射一遍' },
    { key: 'clear', label: '清空' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let speed = 400
    let drag = 0.5
    let angle = 49
    let shots = []

    const G = 220
    const originX = () => w * 0.11
    const originY = () => h * 0.86
    const SCALE = 0.9

    const fire = (deg, hue) => {
      const a = (deg * Math.PI) / 180
      const v = speed * SCALE
      shots.push({
        x: 0, y: 0, vx: Math.cos(a) * v, vy: -Math.sin(a) * v, hue, pts: [0, 0], done: false,
      })
      if (shots.length > 90) shots.shift()
    }
    /* 单个弹丸推进：a = -g ŷ − k·|v|·v（二次阻力，最常用也最像真实的模型） */
    const advance = (s, dt) => {
      if (s.done) return
      const sp = Math.hypot(s.vx, s.vy)
      const k = drag * 0.0016
      const ax = -k * sp * s.vx
      const ay = G - k * sp * s.vy
      s.vx += ax * dt
      s.vy += ay * dt
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.pts.push(s.x, s.y)
      if (s.pts.length > 3000) s.pts.splice(0, 2)
      if (s.y >= 0) s.done = true
    }

    const inner = makeStepper(1 / 240, (dt) => { for (const s of shots) advance(s, dt) })

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        shots = []
        ctx.fillStyle = '#03060e'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        inner(Math.min(dt, 0.05))

        const ox = originX()
        const oy = originY()

        ctx.fillStyle = 'rgba(3, 6, 14, 0.16)'
        ctx.fillRect(0, 0, w, h)

        /* 地面 */
        ctx.strokeStyle = 'rgba(110, 160, 230, 0.5)'
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(0, oy)
        ctx.lineTo(w, oy)
        ctx.stroke()

        /* 轨迹：未落地的画亮一点，落地的压暗 —— 齐射时「还在飞」的一眼可辨 */
        for (const s of shots) {
          ctx.strokeStyle = `hsla(${s.hue}, 85%, 62%, ${s.done ? 0.42 : 0.82})`
          ctx.lineWidth = s.done ? 1 : 1.6
          ctx.beginPath()
          for (let k = 0; k < s.pts.length; k += 2) {
            const x = ox + s.pts[k]
            const y = oy + s.pts[k + 1]
            if (k === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
        }

        /* 炮口 */
        ctx.fillStyle = '#cfe4ff'
        ctx.beginPath()
        ctx.arc(ox, oy, 5, 0, TAU)
        ctx.fill()
        ctx.strokeStyle = '#9dffbe'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(ox, oy)
        const ra = (-angle * Math.PI) / 180
        ctx.lineTo(ox + Math.cos(ra) * 30, oy + Math.sin(ra) * 30)
        ctx.stroke()

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.fillRect(8, 8, 196, 44)
        ctx.fillStyle = '#ffd9a8'
        ctx.font = '13px ui-monospace, monospace'
        ctx.fillText(`发射角 ${angle}°`, 18, 26)
        ctx.fillText(`阻力 k = ${drag.toFixed(2)}`, 18, 44)
      },
      pointer(kind, x, y) {
        if (kind !== 'down' && kind !== 'move') return
        /* 指针位置决定发射角：直接朝指针方向射 */
        const dx = x - originX()
        const dy = y - originY()
        angle = clamp(Math.round((-Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI), -80, 80)
      },
      setParam(key, v) {
        if (key === 'speed') speed = v
        if (key === 'drag') drag = v
        if (key === 'angle') angle = v
      },
      action(key) {
        if (key === 'fan') {
          shots = []
          /* 从 5° 到 85° 全扫一遍：把所有轨迹的上边界连起来就是安全包络 */
          for (let d = 5; d <= 85; d += 4) fire(d, 40 + d * 2.4)
        }
        if (key === 'clear') shots = []
      },
      destroy() {},
    }
  },
}

export default ballistic
