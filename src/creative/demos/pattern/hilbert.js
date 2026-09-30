/**
 * 几何与图案 · 希尔伯特曲线 —— 空间填充曲线
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */

const hilbert = {
  id: 'hilbert',
  title: '希尔伯特曲线',
  tag: '空间填充曲线',
  desc: '一条连续不断、不自我交叉、却能无限逼近填满整个正方形的曲线 —— 这听起来不可能，但它确实存在，而且构造规则只有四句递归。它的用处很实在：把二维邻近性映射成一维邻近性，所以数据库的「空间索引」常用它来把地图编码成一段区间。',
  bg: '#04060e',
  params: [
    { key: 'order', label: '阶数', min: 1, max: 7, step: 1, value: 5 },
    { key: 'speed', label: '生长速度', min: 0.1, max: 4, step: 0.1, value: 1.2 },
    { key: 'width', label: '线宽', min: 0.6, max: 4, step: 0.2, value: 1.8 },
  ],
  actions: [
    { key: 'replay', label: '重播' },
    { key: 'full', label: '直接画满' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let order = 5
    let speed = 1.2
    let lineW = 1.8
    let progress = 0
    let total = 0
    let hold = 0

    /** d → (x, y)：希尔伯特曲线的经典位运算映射，不用递归也能按下标取点 */
    const d2xy = (n, d) => {
      let t = d
      let x = 0
      let y = 0
      for (let s = 1; s < n; s *= 2) {
        const rx = 1 & (t >> 1)
        const ry = 1 & (t ^ rx)
        /* 旋转这一格 */
        if (ry === 0) {
          if (rx === 1) { x = s - 1 - x; y = s - 1 - y }
          const tmp = x
          x = y
          y = tmp
        }
        x += s * rx
        y += s * ry
        t = Math.floor(t / 4)
      }
      return [x, y]
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        progress = 0
        hold = 0
        total = 1
        for (let i = 0; i < order; i += 1) total *= 4
        ctx.fillStyle = '#04060e'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        ctx.fillStyle = 'rgba(4, 6, 14, 0.3)'
        ctx.fillRect(0, 0, w, h)
        if (hold > 0) {
          hold -= dt
          if (hold <= 0) progress = 0
        } else {
          progress += speed * total * dt * 0.28
          if (progress >= total) { progress = total; hold = 1.5 }
        }

        const upto = Math.min(total, Math.floor(progress))
        const n = 1 << order
        const S = Math.min(w, h) * 0.86
        const ox = w / 2 - S / 2
        const oy = h / 2 - S / 2
        const stepPx = S / (n - 1 || 1)

        /* 分 24 段彩色：一眼看出「走到的位置」= 一维参数 */
        const SEG = 24
        ctx.lineWidth = lineW
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        for (let s = 0; s < SEG; s += 1) {
          const a = Math.floor((s / SEG) * upto)
          const b2 = Math.floor(((s + 1) / SEG) * upto)
          if (b2 <= a) continue
          ctx.strokeStyle = `hsla(${(s / SEG) * 300}, 86%, 64%, 0.9)`
          ctx.beginPath()
          for (let i = a; i <= b2; i += 1) {
            const p = d2xy(n, i)
            const x = ox + p[0] * stepPx
            const y = oy + p[1] * stepPx
            if (i === a) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
        }
        ctx.fillStyle = '#dff6ff'
        ctx.font = '13px ui-monospace, monospace'
        ctx.fillText(`阶 ${order} · ${n}×${n} · 已走 ${upto}/${total}`, 14, 24)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'order') { order = v; progress = 0; hold = 0 }
        if (key === 'speed') speed = v
        if (key === 'width') lineW = v
      },
      action(key) {
        if (key === 'replay') { progress = 0; hold = 0 }
        if (key === 'full') { progress = total; hold = 1.5 }
      },
      destroy() {},
    }
  },
}

export default hilbert
