/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 几何与图案 · 迷宫生成与求解 —— 随机 DFS + BFS 最短路
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */

const maze = {
  id: 'maze',
  title: '迷宫生成与求解',
  tag: '随机 DFS + BFS 最短路',
  desc: '先用随机深度优先「挖」出一棵生成树：从起点开始一路往前凿，撞墙就退回上一个岔口 —— 这样得到的迷宫任意两点之间恰好有一条路，没有死循环。再对这张图跑一遍 BFS，从出口往外的距离场会铺满整个迷宫，最短路径就是顺着距离递减的方向走回去。',
  bg: '#04060e',
  params: [
    { key: 'cell', label: '格子边长', min: 8, max: 32, step: 2, value: 16 },
    { key: 'growth', label: '挖掘速度', min: 1, max: 60, step: 1, value: 14 },
  ],
  actions: [
    { key: 'new', label: '重新生成' },
    { key: 'solve', label: '直接求解' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let cell = 16
    let growth = 14
    let gw = 0
    let gh = 0
    /* 墙用位掩码：1=上 2=右 4=下 8=左 */
    let walls = new Uint8Array(0)
    let visited = new Uint8Array(0)
    let stack = []
    let phase = 'carve'
    let dist = new Int32Array(0)
    let path = []
    let solveT = 0

    const alloc = () => {
      /* 单元格数取奇数边长，四周留一圈墙 */
      gw = Math.max(5, Math.floor(w / cell))
      gh = Math.max(5, Math.floor(h / cell))
      if (gw % 2 === 0) gw -= 1
      if (gh % 2 === 0) gh -= 1
      walls = new Uint8Array(gw * gh)
      visited = new Uint8Array(gw * gh)
      dist = new Int32Array(gw * gh)
      for (let i = 0; i < walls.length; i += 1) {
        const x = i % gw
        const y = (i / gw) | 0
        /* 奇偶网格：奇数格是通道，偶数格是墙（标准做法，天然对称） */
        if (x % 2 === 0 || y % 2 === 0) { visited[i] = 2; continue }
      }
      walls.fill(15)
      stack = []
      const start = 1 * gw + 1
      visited[start] = 1
      stack.push(start)
      phase = 'carve'
      path = []
      dist.fill(-1)
      solveT = 0
    }

    const idx = (x, y) => y * gw + x

    const carveStep = () => {
      if (!stack.length) {
        phase = 'solve'
        return
      }
      const cur = stack[stack.length - 1]
      const x = cur % gw
      const y = (cur / gw) | 0
      const dirs = []
      if (y > 1 && visited[idx(x, y - 2)] === 0) dirs.push(0)
      if (x < gw - 2 && visited[idx(x + 2, y)] === 0) dirs.push(1)
      if (y < gh - 2 && visited[idx(x, y + 2)] === 0) dirs.push(2)
      if (x > 1 && visited[idx(x - 2, y)] === 0) dirs.push(3)
      if (!dirs.length) { stack.pop(); return }
      const d = dirs[(Math.random() * dirs.length) | 0]
      const dx = [0, 1, 0, -1][d]
      const dy = [-1, 0, 1, 0][d]
      const nx = x + dx * 2
      const ny = y + dy * 2
      /* 打通自己这一侧的墙，也打通对面那一侧 */
      walls[cur] &= ~(1 << d)
      const ni = idx(nx, ny)
      walls[ni] &= ~(1 << ((d + 2) % 4))
      visited[ni] = 1
      stack.push(ni)
    }

    const bfs = () => {
      dist.fill(-1)
      const sx = 1
      const sy = 1
      dist[idx(sx, sy)] = 0
      let queue = [idx(sx, sy)]
      while (queue.length) {
        const next = []
        for (const i of queue) {
          const x = i % gw
          const y = (i / gw) | 0
          for (let d = 0; d < 4; d += 1) {
            if (walls[i] & (1 << d)) continue
            const nx = x + [0, 1, 0, -1][d]
            const ny = y + [-1, 0, 1, 0][d]
            if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue
            const ni = idx(nx, ny)
            if (dist[ni] !== -1) continue
            dist[ni] = dist[i] + 1
            next.push(ni)
          }
        }
        queue = next
      }
    }

    const buildPath = () => {
      path = []
      let x = gw - 2
      let y = gh - 2
      if (dist[idx(x, y)] < 0) return
      while (!(x === 1 && y === 1)) {
        path.push([x, y])
        let best = null
        for (let d = 0; d < 4; d += 1) {
          if (walls[idx(x, y)] & (1 << d)) continue
          const nx = x + [0, 1, 0, -1][d]
          const ny = y + [-1, 0, 1, 0][d]
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue
          const d2 = dist[idx(nx, ny)]
          if (d2 >= 0 && (best === null || d2 < best.d)) best = { x: nx, y: ny, d: d2 }
        }
        if (!best) break
        x = best.x
        y = best.y
      }
      path.push([1, 1])
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        alloc()
        ctx.fillStyle = '#04060e'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        if (phase === 'carve') {
          const n = Math.max(1, Math.round(growth * Math.min(dt * 60, 2)))
          for (let i = 0; i < n; i += 1) carveStep()
        } else {
          if (!dist.length || dist[idx(gw - 2, gh - 2)] === -1) { bfs(); buildPath() }
          solveT += dt
          /* 再跑一遍 BFS 把距离场刷新出来（墙没变，其实一次就够；保留是为了「重新生成」后立刻可用） */
          if (solveT > 6) { solveT = 0; path = [] }
        }

        /* 绘制 */
        ctx.fillStyle = '#04060e'
        ctx.fillRect(0, 0, w, h)
        const ox = (w - gw * cell) / 2
        const oy = (h - gh * cell) / 2

        /* 距离场：求解阶段铺一层从远到近的底色，路径一眼可见 */
        if (phase === 'solve') {
          let maxD = 1
          for (let i = 0; i < dist.length; i += 1) if (dist[i] > maxD) maxD = dist[i]
          for (let i = 0; i < dist.length; i += 1) {
            if (dist[i] < 0) continue
            const t = dist[i] / maxD
            ctx.fillStyle = `hsla(${200 - t * 180}, 80%, ${24 + (1 - t) * 10}%, 0.9)`
            ctx.fillRect(ox + (i % gw) * cell, oy + ((i / gw) | 0) * cell, cell, cell)
          }
        }

        ctx.strokeStyle = '#7fa8ff'
        ctx.lineWidth = Math.max(1.2, cell * 0.16)
        ctx.beginPath()
        for (let y = 0; y < gh; y += 1) {
          for (let x = 0; x < gw; x += 1) {
            const i = idx(x, y)
            /* 偶数格（未挖通）一律画成实心墙 */
            if (visited[i] === 2 || (walls[i] === 15 && visited[i] !== 1)) continue
            const px = ox + x * cell
            const py = oy + y * cell
            const m = walls[i]
            if (m & 1) { ctx.moveTo(px, py); ctx.lineTo(px + cell, py) }
            if (m & 2) { ctx.moveTo(px + cell, py); ctx.lineTo(px + cell, py + cell) }
            if (m & 4) { ctx.moveTo(px, py + cell); ctx.lineTo(px + cell, py + cell) }
            if (m & 8) { ctx.moveTo(px, py); ctx.lineTo(px, py + cell) }
          }
        }
        ctx.stroke()

        /* 起点 / 终点 */
        ctx.fillStyle = '#9dffbe'
        ctx.fillRect(ox + cell, oy + cell, cell, cell)
        ctx.fillStyle = '#ffd166'
        ctx.fillRect(ox + (gw - 2) * cell, oy + (gh - 2) * cell, cell, cell)

        /* 最短路径 */
        if (path.length > 1) {
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = Math.max(1.6, cell * 0.22)
          ctx.lineCap = 'round'
          ctx.beginPath()
          for (let i = 0; i < path.length; i += 1) {
            const x = ox + path[i][0] * cell + cell / 2
            const y = oy + path[i][1] * cell + cell / 2
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
        }

        ctx.fillStyle = '#dff6ff'
        ctx.font = '13px ui-monospace, monospace'
        ctx.fillText(phase === 'carve' ? `正在挖墙… 剩余回溯 ${stack.length}` : `最短路 ${Math.max(0, path.length - 1)} 格`, 12, 22)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'cell') { cell = v; alloc() }
        if (key === 'growth') growth = v
      },
      action(key) {
        if (key === 'new') alloc()
        if (key === 'solve') {
          phase = 'solve'
          bfs()
          buildPath()
        }
      },
      destroy() {},
    }
  },
}

export default maze
