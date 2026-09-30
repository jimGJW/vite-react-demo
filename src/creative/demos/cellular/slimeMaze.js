/**
 * 元胞自动机与自组织 · 黏菌迷宫 —— 趋化 + 避障
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, rand } from '../../utils/math.js'

const slimeMaze = {
  id: 'slime-maze',
  title: '黏菌迷宫',
  tag: '趋化 + 避障',
  desc: '把一群智能体放进迷宫里，它们只做两件事：朝气味最浓的方向偏一点点、走过的路留下痕迹，同时躲避墙壁。气味从出口向外扩散，于是「跟着味道走」自然会挤出不撞墙的路线。真黏菌找迷宫出口用的就是这套：没有地图，只有局部浓度差。',
  bg: '#04060c',
  params: [
    { key: 'agents', label: '智能体', min: 40, max: 600, step: 20, value: 240 },
    { key: 'sense', label: '转向幅度', min: 0.05, max: 0.9, step: 0.05, value: 0.35 },
    { key: 'speed', label: '速度', min: 20, max: 150, step: 5, value: 62 },
  ],
  actions: [
    { key: 'newmaze', label: '换一个迷宫' },
    { key: 'flush', label: '清掉痕迹' },
  ],
  create(ctx) {
    const MAXA = 600
    let w = 800
    let h = 360
    let nAgents = 240
    let sense = 0.35
    let speed = 62
    let gw = 0
    let gh = 0
    let walls = new Uint8Array(0)
    let scent = new Float32Array(0)
    let tmpScent = new Float32Array(0)
    const ax = new Float32Array(MAXA)
    const ay = new Float32Array(MAXA)

    const goal = { x: 0.9, y: 0.5 }

    const alloc = () => {
      const c = 8
      gw = Math.max(8, Math.floor(w / c))
      gh = Math.max(8, Math.floor(h / c))
      walls = new Uint8Array(gw * gh)
      scent = new Float32Array(gw * gh)
      tmpScent = new Float32Array(gw * gh)
      buildMaze()
      for (let i = 0; i < MAXA; i += 1) resetAgent(i)
    }

    const buildMaze = () => {
      walls.fill(0)
      /* 竖墙 + 缺口：简单的「梳子」迷宫，足够体现绕行 */
      for (let k = 1; k <= 4; k += 1) {
        const x = Math.floor((gw * k) / 5)
        const gap = Math.floor(gh * rand(0.15, 0.85))
        for (let y = 1; y < gh - 1; y += 1) {
          if (Math.abs(y - gap) < 3) continue
          walls[y * gw + x] = 1
          if (x + 1 < gw) walls[y * gw + x + 1] = 1
        }
      }
    }

    const resetAgent = (i) => {
      ax[i] = w * rand(0.03, 0.09)
      ay[i] = h * rand(0.1, 0.9)
    }

    const cAt = (x, y) => {
      const xi = Math.floor(x)
      const yi = Math.floor(y)
      if (xi < 0 || yi < 0 || xi >= gw || yi >= gh) return -1
      return yi * gw + xi
    }

    const isWall = (x, y) => {
      const i = cAt(x / 8, y / 8)
      return i < 0 ? true : walls[i] === 1
    }

    const scentAt = (x, y) => {
      const i = cAt(x / 8, y / 8)
      return i < 0 ? 0 : scent[i]
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        alloc()
        ctx.fillStyle = '#04060c'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        const step = Math.min(dt, 1 / 30)
        /* 气味：从出口往外扩散 + 缓慢衰减 */
        const gx = Math.floor(goal.x * gw)
        const gy = Math.floor(goal.y * gh)
        scent[gy * gw + gx] = 1
        for (let y = 1; y < gh - 1; y += 1) {
          for (let x = 1; x < gw - 1; x += 1) {
            const i = y * gw + x
            if (walls[i]) { tmpScent[i] = 0; continue }
            tmpScent[i] = (scent[i] * 4 + scent[i - 1] + scent[i + 1] + scent[i - gw] + scent[i + gw]) / 8
          }
        }
        const t = scent
        scent = tmpScent
        tmpScent = t

        /* 智能体：朝「前 / 左前 / 右前」三个方向里气味最浓的一侧转 */
        for (let i = 0; i < MAXA; i += 1) {
          if (i >= nAgents) break
          const cur = Math.atan2(gy * 8 - ay[i], gx * 8 - ax[i])
          const a1 = cur - sense
          const a2 = cur + sense
          let best = cur
          let bv = scentAt(ax[i] + Math.cos(cur) * 14, ay[i] + Math.sin(cur) * 14)
          const v1 = scentAt(ax[i] + Math.cos(a1) * 14, ay[i] + Math.sin(a1) * 14)
          const v2 = scentAt(ax[i] + Math.cos(a2) * 14, ay[i] + Math.sin(a2) * 14)
          if (v1 > bv) { bv = v1; best = a1 }
          if (v2 > bv) best = a2
          const nx = ax[i] + Math.cos(best) * speed * step
          const ny = ay[i] + Math.sin(best) * speed * step
          if (isWall(nx, ny)) {
            /* 撞墙就随机弹开一点，别卡死在墙角 */
            ay[i] += rand(-24, 24)
            continue
          }
          ax[i] = nx
          ay[i] = ny
          if (ax[i] > w - 6) ax[i] = 6
          if (ax[i] < 6) ax[i] = 6
          if (ay[i] < 6) ay[i] = 6
          if (ay[i] > h - 6) ay[i] = h - 6
        }

        /* 重画：墙面 + 气味浓度 + 智能体 */
        ctx.fillStyle = '#04060c'
        ctx.fillRect(0, 0, w, h)
        const c = 8
        for (let y = 0; y < gh; y += 1) {
          for (let x = 0; x < gw; x += 1) {
            const i = y * gw + x
            if (walls[i]) {
              ctx.fillStyle = '#2a3350'
              ctx.fillRect(x * c, y * c, c, c)
            } else {
              const v = Math.min(1, scent[i] * 3)
              if (v > 0.03) {
                ctx.fillStyle = `rgba(90, 200, 255, ${v * 0.24})`
                ctx.fillRect(x * c, y * c, c, c)
              }
            }
          }
        }
        ctx.fillStyle = '#ffe27a'
        ctx.beginPath()
        ctx.arc(goal.x * w, goal.y * h, 7, 0, TAU)
        ctx.fill()
        ctx.fillStyle = '#9dffbe'
        for (let i = 0; i < MAXA; i += 1) {
          if (i >= nAgents) break
          ctx.fillRect(ax[i] - 1.2, ay[i] - 1.2, 2.4, 2.4)
        }
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'agents') nAgents = Math.min(MAXA, v)
        if (key === 'sense') sense = v
        if (key === 'speed') speed = v
      },
      action(key) {
        if (key === 'newmaze') { buildMaze(); scent.fill(0) }
        if (key === 'flush') scent.fill(0)
      },
      destroy() {},
    }
  },
}

export default slimeMaze
