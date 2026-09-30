/**
 * 天体与力学 · 交通流与幽灵堵车 —— Nagel-Schreckenberg 元胞模型
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */

const traffic = {
  id: 'traffic',
  title: '交通流与幽灵堵车',
  tag: 'Nagel-Schreckenberg 元胞模型',
  desc: '环形路上每辆车只遵守四条规则：尽量加速、看到前车就减速、有概率随机慢一下、然后前进。没有任何「堵车」的规则，但只要密度超过某个值，一圈里就会自己冒出走走停停的波 —— 幽灵堵车就是这么来的。点「制造拥堵」能在车流里插一个急刹，看它怎么长成一整列堵车。',
  bg: '#04060e',
  params: [
    { key: 'density', label: '车辆密度', min: 0.08, max: 0.6, step: 0.02, value: 0.24 },
    { key: 'vmax', label: '最高车速', min: 1, max: 8, step: 1, value: 5 },
    { key: 'brake', label: '随机慢化', min: 0, max: 0.6, step: 0.02, value: 0.24 },
  ],
  actions: [
    { key: 'jam', label: '制造拥堵' },
    { key: 'reset', label: '重新布车' },
  ],
  create(ctx) {
    const MAXN = 340
    const MAXC = 900
    let w = 800
    let h = 360
    let density = 0.24
    let vmax = 5
    let brake = 0.24
    let ncells = MAXC
    let occ = new Int16Array(MAXC)
    let vel = new Int16Array(MAXC)
    let nCars = 0
    let speedHistory = []

    const rebuild = () => {
      occ.fill(-1)
      vel.fill(0)
      nCars = 0
      const want = Math.min(MAXN, Math.round(ncells * density))
      for (let k = 0; k < want; k += 1) {
        const p = Math.floor((k * ncells) / want)
        occ[p] = 0
        vel[p] = (Math.random() * (vmax + 1)) | 0
        nCars += 1
      }
      speedHistory = []
    }

    const stepOnce = () => {
      /* 1) 加速 2) 看前车距离减速 3) 随机慢化 —— 按位置顺序更新，避免同一格撞两次 */
      const order = []
      for (let i = 0; i < ncells; i += 1) if (occ[i] === 0) order.push(i)
      const sum = { v: 0 }
      for (const i of order) {
        let v = Math.min(vmax, vel[i] + 1)
        let gap = 1
        while (gap < ncells && occ[(i + gap) % ncells] !== 0) gap += 1
        v = Math.min(v, gap - 1)
        if (v > 0 && Math.random() < brake) v -= 1
        vel[i] = v
        sum.v += v
      }
      /* 4) 前进：先清空再落位，避免顺序造成偏差 */
      const nxt = new Int16Array(ncells).fill(-1)
      const nv = new Int16Array(ncells)
      for (const i of order) {
        const j = (i + vel[i]) % ncells
        nxt[j] = 0
        nv[j] = vel[i]
      }
      occ = nxt
      vel = nv
      speedHistory.push(nCars ? sum.v / nCars : 0)
      if (speedHistory.length > 240) speedHistory.shift()
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        ncells = Math.max(120, Math.floor(w / 2))
        occ = new Int16Array(ncells)
        vel = new Int16Array(ncells)
        rebuild()
        ctx.fillStyle = '#04060e'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        const n = Math.max(1, Math.min(6, Math.round(6 * Math.min(dt * 60, 2))))
        for (let i = 0; i < n; i += 1) stepOnce()

        ctx.fillStyle = '#04060e'
        ctx.fillRect(0, 0, w, h)

        /* 环路画成一条横向长带（首尾相接，右端接左端） */
        const y0 = h * 0.3
        const rowH = h * 0.2
        ctx.fillStyle = 'rgba(30, 40, 66, 0.55)'
        ctx.fillRect(0, y0, w, rowH)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(0, y0 + rowH / 2)
        ctx.lineTo(w, y0 + rowH / 2)
        ctx.stroke()

        const cw = w / ncells
        for (let i = 0; i < ncells; i += 1) {
          if (occ[i] !== 0) continue
          const v = vel[i]
          const t = vmax ? v / vmax : 0
          /* 慢车偏红、快车偏青：堵车波在画面上一眼可辨 */
          ctx.fillStyle = `hsl(${200 - t * 190}, 88%, ${40 + t * 28}%)`
          ctx.fillRect(i * cw, y0 + rowH * 0.22, Math.max(2, cw * 0.92), rowH * 0.56)
        }

        /* 平均速度曲线：堵车一旦形成，整条线会往下掉一个台阶 */
        const gx = 10
        const gy = h * 0.6
        const gwd = w - 20
        const ght = h * 0.3
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
        ctx.fillRect(gx, gy, gwd, ght)
        ctx.strokeStyle = '#8ee6ff'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        for (let i = 0; i < speedHistory.length; i += 1) {
          const x = gx + (i / 239) * gwd
          const y = gy + ght - (speedHistory[i] / Math.max(1, vmax)) * ght
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.fillStyle = '#dff6ff'
        ctx.font = '12px ui-monospace, monospace'
        const last = speedHistory.length ? speedHistory[speedHistory.length - 1] : 0
        ctx.fillText(`车 ${nCars}  ·  平均车速 ${last.toFixed(2)} / ${vmax}`, gx + 8, gy + 16)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'density') { density = v; rebuild() }
        if (key === 'vmax') vmax = v
        if (key === 'brake') brake = v
      },
      action(key) {
        if (key === 'reset') rebuild()
        if (key === 'jam') {
          /* 随机挑一段连续几辆车一起急刹到底 —— 一个局部扰动就够了 */
          const start = (Math.random() * ncells) | 0
          for (let k = 0; k < 12; k += 1) {
            const i = (start + k) % ncells
            if (occ[i] === 0) vel[i] = 0
          }
        }
      },
      destroy() {},
    }
  },
}

export default traffic
