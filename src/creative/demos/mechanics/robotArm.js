/**
 * 天体与力学 · 机械臂逆运动学 —— FABRIK 迭代反解
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, rand } from '../../utils/math.js'

const robotArm = {
  id: 'robot-arm',
  title: '机械臂逆运动学',
  tag: 'FABRIK 迭代反解',
  desc: '正运动学（给定各关节角算末端位置）是乘法，反过来（给定末端位置求角度）没有闭式解，只能迭代。FABRIK 的做法很直白：先假设整条臂能伸缩，把末端拉到目标点，再反过来把根节点拉回原位，往复几次，关节位置就收敛了。整个过程只用到「按比例缩放向量的长度」。',
  bg: '#04060e',
  params: [
    { key: 'segments', label: '节数', min: 2, max: 14, step: 1, value: 8 },
    { key: 'reach', label: '总长', min: 0.2, max: 0.95, step: 0.05, value: 0.62 },
    { key: 'iters', label: '迭代次数', min: 1, max: 12, step: 1, value: 6 },
  ],
  actions: [
    { key: 'reach', label: '换目标' },
    { key: 'wave', label: '自动挥动' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let nSeg = 8
    let reach = 0.62
    let iters = 6
    let nodes = []
    let target = { x: 0.7, y: 0.3 }
    let waving = true
    let waveT = 0

    const rootAt = () => ({ x: w * 0.2, y: h * 0.72 })

    const reset = () => {
      const root = rootAt()
      nodes = []
      const seg = (Math.min(w, h) * reach) / nSeg
      for (let i = 0; i < nSeg + 1; i += 1) {
        nodes.push({ x: root.x + Math.cos(i * 0.3) * seg * i, y: root.y - Math.sin(i * 0.3) * seg * i })
      }
    }

    /* FABRIK：正向拉到目标 → 反向拉回根节点，来回几次 */
    const solve = () => {
      const root = rootAt()
      const seg = (Math.min(w, h) * reach) / nSeg
      const last = nodes.length - 1
      const total = seg * nSeg
      const distToTarget = Math.hypot(target.x - root.x, target.y - root.y)
      for (let k = 0; k < iters; k += 1) {
        /* 够不着就把整条臂朝目标拉直 */
        if (distToTarget > total) {
          const dx = (target.x - root.x) / distToTarget
          const dy = (target.y - root.y) / distToTarget
          for (let i = 1; i <= last; i += 1) {
            nodes[i].x = nodes[i - 1].x + dx * seg
            nodes[i].y = nodes[i - 1].y + dy * seg
          }
          break
        }
        /* 正向 */
        nodes[last].x = target.x
        nodes[last].y = target.y
        for (let i = last - 1; i >= 0; i -= 1) {
          const dx = nodes[i].x - nodes[i + 1].x
          const dy = nodes[i].y - nodes[i + 1].y
          const d = Math.hypot(dx, dy) || 1e-6
          const r = seg / d
          nodes[i].x = nodes[i + 1].x + dx * r
          nodes[i].y = nodes[i + 1].y + dy * r
        }
        /* 反向 */
        nodes[0].x = root.x
        nodes[0].y = root.y
        for (let i = 1; i <= last; i += 1) {
          const dx = nodes[i].x - nodes[i - 1].x
          const dy = nodes[i].y - nodes[i - 1].y
          const d = Math.hypot(dx, dy) || 1e-6
          const r = seg / d
          nodes[i].x = nodes[i - 1].x + dx * r
          nodes[i].y = nodes[i - 1].y + dy * r
        }
      }
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        reset()
        ctx.fillStyle = '#04060e'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        if (waving) {
          waveT += dt
          target.x = w * (0.55 + Math.cos(waveT * 0.9) * 0.3)
          target.y = h * (0.42 + Math.sin(waveT * 1.37) * 0.3)
        }
        solve()

        ctx.fillStyle = 'rgba(4, 6, 14, 0.34)'
        ctx.fillRect(0, 0, w, h)

        /* 工作空间圆：臂长总和的界线，超出了就只能拉直指向目标 */
        const root = rootAt()
        ctx.setLineDash([3, 6])
        ctx.strokeStyle = 'rgba(90, 130, 220, 0.35)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(root.x, root.y, Math.min(w, h) * reach, 0, TAU)
        ctx.stroke()
        ctx.setLineDash([])

        /* 目标十字 */
        ctx.strokeStyle = '#ffd166'
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(target.x - 9, target.y)
        ctx.lineTo(target.x + 9, target.y)
        ctx.moveTo(target.x, target.y - 9)
        ctx.lineTo(target.x, target.y + 9)
        ctx.stroke()

        /* 臂：从根到末端的渐变色，关节半径逐节变小 */
        for (let i = 1; i < nodes.length; i += 1) {
          const t = i / nodes.length
          ctx.strokeStyle = `hsla(${196 + t * 90}, 86%, ${62 - t * 10}%, 0.95)`
          ctx.lineWidth = 7.5 - t * 4.4
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(nodes[i - 1].x, nodes[i - 1].y)
          ctx.lineTo(nodes[i].x, nodes[i].y)
          ctx.stroke()
          ctx.fillStyle = '#0a1220'
          ctx.beginPath()
          ctx.arc(nodes[i].x, nodes[i].y, 3.2 - t * 1.6, 0, TAU)
          ctx.fill()
        }
        ctx.fillStyle = '#dff6ff'
        ctx.beginPath()
        ctx.arc(nodes[0].x, nodes[0].y, 6, 0, TAU)
        ctx.fill()
      },
      pointer(kind, x, y) {
        if (kind !== 'down' && kind !== 'move') return
        waving = false
        target.x = x
        target.y = y
      },
      setParam(key, v) {
        if (key === 'segments') { nSeg = v; reset() }
        if (key === 'reach') { reach = v; reset() }
        if (key === 'iters') iters = v
      },
      action(key) {
        if (key === 'reach') {
          waving = false
          target.x = w * rand(0.35, 0.9)
          target.y = h * rand(0.15, 0.85)
        }
        if (key === 'wave') waving = !waving
      },
      destroy() {},
    }
  },
}

export default robotArm
