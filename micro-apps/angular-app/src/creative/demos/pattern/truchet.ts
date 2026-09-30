/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/* eslint-disable */
/**
 * 几何与图案 · 特鲁谢瓷砖 —— 随机铺陈 + 连续通路
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU } from '../../utils/math'

const truchet = {
  id: 'truchet',
  title: '特鲁谢瓷砖',
  tag: '随机铺陈 + 连续通路',
  desc: '只用一种瓷砖：一个方块里画两条四分之一圆弧，接缝处恰好能对上。把它随机旋转着铺满平面，就自动出现迷宫、波浪和打结的曲线 —— 因为每块砖的端口位置是固定的，随机旋转后「路」自然就接上了。这是最便宜的「用随机造秩序」。',
  bg: '#04070d',
  params: [
    { key: 'cell', label: '格子边长', min: 14, max: 80, step: 2, value: 40 },
    { key: 'width', label: '线宽', min: 1, max: 10, step: 0.5, value: 3.5 },
    { key: 'flip', label: '换砖频率(秒)', min: 0.1, max: 4, step: 0.1, value: 0.7 },
  ],
  actions: [
    { key: 'shake', label: '重排一次' },
    { key: 'hold', label: '定住' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let cell = 40
    let lineW = 3.5
    let flipRate = 0.7
    let cols = 0
    let rows = 0
    let bits = new Uint8Array(0)
    let acc = 0
    let frozen = false

    const alloc = () => {
      cols = Math.max(2, Math.ceil(w / cell))
      rows = Math.max(2, Math.ceil(h / cell))
      bits = new Uint8Array(cols * rows)
      for (let i = 0; i < bits.length; i += 1) bits[i] = Math.random() < 0.5 ? 0 : 1
    }

    const paint = () => {
      ctx.fillStyle = '#04070d'
      ctx.fillRect(0, 0, w, h)
      ctx.lineWidth = lineW
      ctx.lineCap = 'round'
      const r = cell / 2
      for (let gy = 0; gy < rows; gy += 1) {
        for (let gx = 0; gx < cols; gx += 1) {
          const x = gx * cell
          const y = gy * cell
          const two = bits[gy * cols + gx] === 1
          ctx.strokeStyle = `hsla(${186 + gy * 4 + gx * 2}, 80%, 62%, 0.9)`
          ctx.beginPath()
          if (two) {
            /* 两段对角的四分之一弧 */
            ctx.moveTo(x, y + r)
            ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5)
            ctx.moveTo(x + cell, y + r)
            ctx.arc(x + r, y + r, r, Math.PI * 1.5, TAU)
          } else {
            ctx.moveTo(x + r, y)
            ctx.arc(x + r, y + r, r, -Math.PI / 2, 0)
            ctx.moveTo(x + r, y + cell)
            ctx.arc(x + r, y + r, r, Math.PI / 2, Math.PI)
          }
          ctx.stroke()
        }
      }
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        alloc()
        paint()
      },
      frame(ts, dt) {
        if (frozen) return
        acc += dt
        if (acc < flipRate) return
        acc = 0
        /* 每次只翻一小撮砖，所以看到的是「图案在缓慢重排」而不是整屏闪一下 */
        const n = Math.max(1, Math.floor(bits.length * 0.05))
        for (let i = 0; i < n; i += 1) {
          const j = (Math.random() * bits.length) | 0
          bits[j] = bits[j] ? 0 : 1
        }
        paint()
      },
      pointer(kind, x, y) {
        if (kind !== 'down' && kind !== 'move') return
        const gx = Math.floor(x / cell)
        const gy = Math.floor(y / cell)
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const xx = gx + dx
            const yy = gy + dy
            if (xx < 0 || yy < 0 || xx >= cols || yy >= rows) continue
            bits[yy * cols + xx] = bits[yy * cols + xx] ? 0 : 1
          }
        }
        paint()
      },
      setParam(key, v) {
        if (key === 'cell') { cell = v; alloc(); paint() }
        if (key === 'width') { lineW = v; paint() }
        if (key === 'flip') flipRate = v
      },
      action(key) {
        if (key === 'shake') {
          for (let i = 0; i < bits.length; i += 1) bits[i] = Math.random() < 0.5 ? 0 : 1
          paint()
        }
        if (key === 'hold') frozen = !frozen
      },
      destroy() {},
    }
  },
}

export default truchet
