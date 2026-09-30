/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 元胞自动机与自组织 · 康威生命游戏 —— 二维元胞自动机
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { BG } from '../../utils/canvas.js'

const life = {
  id: 'life',
  title: '康威生命游戏',
  tag: '二维元胞自动机',
  desc: '四条规则（存活 2/3 个邻居、新生 3 个邻居）就能长出滑翔机、振荡子和脉冲星。这里用半透明覆写背景，死掉的细胞会留下一个渐隐的残影，一眼能看出「哪里正在塌」。',
  bg: BG,
  params: [
    { key: 'interval', label: '步进间隔(ms)', min: 20, max: 400, step: 10, value: 80 },
  ],
  actions: [
    { key: 'random', label: '随机' },
    { key: 'clear', label: '清空' },
    { key: 'step', label: '单步' },
  ],
  create(ctx) {
    const CELL = 7
    let w = 800
    let h = 360
    let cols = 0
    let rows = 0
    let grid = new Uint8Array(0)
    let next = new Uint8Array(0)
    let acc = 0
    let intervalMs = 80

    const build = () => {
      cols = Math.max(8, Math.floor(w / CELL))
      rows = Math.max(8, Math.floor(h / CELL))
      grid = new Uint8Array(cols * rows)
      next = new Uint8Array(cols * rows)
      randomize()
    }
    const randomize = () => {
      for (let i = 0; i < grid.length; i += 1) grid[i] = Math.random() < 0.26 ? 1 : 0
      next.fill(0)
    }
    const advance = () => {
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          let n = 0
          for (let dy = -1; dy <= 1; dy += 1) {
            const yy = y + dy
            for (let dx = -1; dx <= 1; dx += 1) {
              if (!dx && !dy) continue
              const xx = x + dx
              /* 环形边界：滑翔机走到边上会从对面绕回来，不会凭空消失 */
              const nx = ((xx % cols) + cols) % cols
              const ny = ((yy % rows) + rows) % rows
              n += grid[ny * cols + nx]
            }
          }
          const alive = grid[y * cols + x]
          next[y * cols + x] = alive ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0)
        }
      }
      const tmp = grid
      grid = next
      next = tmp
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        build()
        ctx.fillStyle = BG
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        acc += dt * 1000
        if (acc >= intervalMs) {
          acc = 0
          advance()
        }
        ctx.fillStyle = 'rgba(11, 17, 32, 0.26)'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#5eead4'
        for (let y = 0; y < rows; y += 1) {
          const rowBase = y * cols
          for (let x = 0; x < cols; x += 1) {
            if (grid[rowBase + x]) ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2)
          }
        }
      },
      pointer(kind, x, y) {
        if (kind !== 'down' && kind !== 'move') return
        const cx = Math.floor(x / CELL)
        const cy = Math.floor(y / CELL)
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = ((cx + dx) % cols + cols) % cols
            const ny = ((cy + dy) % rows + rows) % rows
            grid[ny * cols + nx] = 1
          }
        }
      },
      setParam(k, v) { if (k === 'interval') intervalMs = v },
      action(key) {
        if (key === 'random') randomize()
        if (key === 'clear') { grid.fill(0); ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h) }
        if (key === 'step') advance()
      },
      destroy() {},
    }
  },
}

export default life
