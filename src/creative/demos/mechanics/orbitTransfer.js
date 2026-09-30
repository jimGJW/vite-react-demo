/**
 * 天体与力学 · 霍曼转移轨道 —— 两次点火 + 活力公式
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU } from '../../utils/math.js'
import { makeStepper } from '../../utils/canvas.js'

const orbitTransfer = {
  id: 'orbit-transfer',
  title: '霍曼转移轨道',
  tag: '两次点火 + 活力公式',
  desc: '从内圈飞到外圈最省燃料的办法不是「一直往外冲」，而是两次点火：第一次把圆轨道拉成椭圆（近地点在起点、远地点正好落在目标圈上），滑到远地点再点一次把它变回圆。这就是霍曼转移，去火星的探测器走的就是这条。两次点火的速度增量都能用活力公式 v=√(μ(2/r−1/a)) 直接算出来。',
  bg: '#03040c',
  params: [
    { key: 'from', label: '起始半径', min: 0.14, max: 0.45, step: 0.01, value: 0.24 },
    { key: 'to', label: '目标半径', min: 0.5, max: 1, step: 0.01, value: 0.82 },
    { key: 'speed', label: '时间倍速', min: 0.2, max: 3, step: 0.1, value: 1 },
  ],
  actions: [
    { key: 'burn', label: '点火转移' },
    { key: 'reset', label: '回到内圈' },
  ],
  create(ctx) {
    const MU = 1
    let w = 800
    let h = 360
    let r1 = 0.24
    let r2 = 0.82
    let speed = 1
    /* 位置/速度用归一化单位；画布上 r = 1 对应 min(w,h)*0.46 */
    let px = r1
    let py = 0
    let vx = 0
    let vy = Math.sqrt(MU / r1)
    let phase = 'circling' // circling → transfer → done
    let dv1 = 0
    let dv2 = 0
    let dv = 0
    let trail = []

    const S = () => Math.min(w, h) * 0.46

    const circular = (r) => {
      px = r
      py = 0
      /* 圆轨道速度：sqrt(μ/r)，方向与半径垂直 */
      vx = 0
      vy = Math.sqrt(MU / r)
      phase = 'circling'
      dv1 = 0
      dv2 = 0
      dv = 0
      trail = []
    }

    const visViva = (r, a) => Math.sqrt(MU * (2 / r - 1 / a))

    const burn = () => {
      if (phase === 'circling') {
        /* 第一次点火：把圆轨道提速成转移椭圆（半长轴 = (r1+r2)/2） */
        const a = (r1 + r2) / 2
        const want = visViva(r1, a)
        dv1 = want - Math.sqrt(MU / r1)
        dv += Math.abs(dv1)
        const sp = Math.hypot(vx, vy)
        vx *= want / sp
        vy *= want / sp
        phase = 'transfer'
      } else if (phase === 'transfer') {
        /* 第二次点火：在远地点把椭圆速度降到该处的圆轨道速度 */
        const a = (r1 + r2) / 2
        const want = Math.sqrt(MU / r2)
        dv2 = want - visViva(r2, a)
        dv += Math.abs(dv2)
        const sp = Math.hypot(vx, vy)
        vx *= want / sp
        vy *= want / sp
        phase = 'done'
      }
    }

    const step = (dt) => {
      /* 速度 Verlet：中心力场下比显式欧拉稳得多，轨道不会慢慢转成螺旋 */
      const r2i = px * px + py * py
      const r = Math.sqrt(r2i) || 1e-6
      const acc = -MU / (r2i * r)
      const ax = px * acc
      const ay = py * acc
      px += vx * dt + 0.5 * ax * dt * dt
      py += vy * dt + 0.5 * ay * dt * dt
      const r2j = px * px + py * py
      const rj = Math.sqrt(r2j) || 1e-6
      const acc2 = -MU / (r2j * rj)
      vx += 0.5 * (ax + px * acc2) * dt
      vy += 0.5 * (ay + py * acc2) * dt

      if (phase === 'transfer' && rj >= r2) burn()

      trail.push(px, py)
      if (trail.length > 2400) trail.splice(0, 2)
    }

    const stepper = makeStepper(1 / 240, step)

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        ctx.fillStyle = '#03040c'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        stepper(Math.min(dt, 0.05) * speed)
        const cx = w / 2
        const cy = h / 2
        const s = S()

        ctx.fillStyle = 'rgba(3, 4, 12, 0.22)'
        ctx.fillRect(0, 0, w, h)

        /* 中心天体 */
        const halo = ctx.createRadialGradient(cx, cy, 2, cx, cy, 42)
        halo.addColorStop(0, 'rgba(255, 224, 150, 0.9)')
        halo.addColorStop(0.4, 'rgba(255, 170, 60, 0.22)')
        halo.addColorStop(1, 'rgba(255, 170, 60, 0)')
        ctx.fillStyle = halo
        ctx.fillRect(cx - 44, cy - 44, 88, 88)
        ctx.fillStyle = '#fff0c8'
        ctx.beginPath()
        ctx.arc(cx, cy, 8, 0, TAU)
        ctx.fill()

        /* 内外两条参考圆 */
        ctx.setLineDash([4, 5])
        ctx.lineWidth = 1
        ctx.strokeStyle = 'rgba(110, 150, 230, 0.5)'
        ctx.beginPath()
        ctx.arc(cx, cy, r1 * s, 0, TAU)
        ctx.stroke()
        ctx.strokeStyle = 'rgba(120, 230, 190, 0.55)'
        ctx.beginPath()
        ctx.arc(cx, cy, r2 * s, 0, TAU)
        ctx.stroke()
        ctx.setLineDash([])

        /* 转移椭圆的解析形状：长轴沿 x，半长轴 a、焦距 c 各画一段 */
        const a = (r1 + r2) / 2
        const c = r2 - a
        ctx.strokeStyle = 'rgba(255, 190, 120, 0.35)'
        ctx.beginPath()
        ctx.ellipse(cx + c * s, cy, a * s, Math.sqrt(Math.max(0, a * a - c * c)) * s, 0, 0, TAU)
        ctx.stroke()

        /* 轨迹 */
        ctx.strokeStyle = 'rgba(255, 138, 96, 0.85)'
        ctx.lineWidth = 1.6
        ctx.beginPath()
        for (let i = 0; i < trail.length; i += 2) {
          const x = cx + trail[i] * s
          const y = cy + trail[i + 1] * s
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

        /* 探测器 */
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(cx + px * s, cy + py * s, 4, 0, TAU)
        ctx.fill()

        /* 面板：两次点火的速度增量 */
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)'
        ctx.fillRect(8, 8, 232, 66)
        ctx.fillStyle = '#ffd9a8'
        ctx.font = '13px ui-monospace, monospace'
        ctx.fillText(`Δv₁ ${dv1 >= 0 ? '+' : ''}${dv1.toFixed(4)}`, 18, 28)
        ctx.fillText(`Δv₂ ${phase === 'transfer' ? '（待第二次点火）' : `${dv2 >= 0 ? '+' : ''}${dv2.toFixed(4)}`}`, 18, 46)
        ctx.fillStyle = '#8ee6ff'
        ctx.fillText(`合计 Δv ${dv.toFixed(4)}`, 18, 64)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'speed') { speed = v; return }
        if (key === 'from') r1 = Math.min(v, r2 - 0.05)
        if (key === 'to') r2 = Math.max(v, r1 + 0.05)
        circular(r1)
      },
      action(key) {
        if (key === 'burn') burn()
        if (key === 'reset') circular(r1)
      },
      destroy() {},
    }
  },
}

export default orbitTransfer
