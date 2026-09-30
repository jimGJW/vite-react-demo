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
 * 元胞自动机与自组织 · 兰顿蚂蚁 —— 两行规则 + 自发筑路
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { makeFieldBuffer } from '../../utils/canvas'

const langtonAnt = {
  id: 'langton-ant',
  title: '兰顿蚂蚁',
  tag: '两行规则 + 自发筑路',
  desc: '规则只有两条：站在白格上就右转、把格子涂黑；站在黑格上就左转、把格子涂白。前一万步看起来杂乱无章，之后它会突然自己修出一条笔直的「高速公路」并永远走下去 —— 一个被证明为图灵完备的极简系统。',
  bg: '#06070f',
  params: [
    { key: 'ants', label: '蚂蚁数', min: 1, max: 12, step: 1, value: 3 },
    { key: 'steps', label: '每帧步数', min: 10, max: 900, step: 10, value: 260 },
    { key: 'cell', label: '格子边长', min: 2, max: 8, step: 1, value: 3 },
  ],
  actions: [
    { key: 'clear', label: '清空' },
    { key: 'turbo', label: '快进 2 万步' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let nAnts = 3
    let steps = 260
    let cell = 3
    const buf = makeFieldBuffer(1)
    let gw = 2
    let gh = 2
    let grid = new Uint8Array(4)
    let ants = []
    let total = 0
    const MAXA = 12

    const clear = () => {
      buf.resize(w, h)
      gw = Math.max(4, Math.floor(w / cell))
      gh = Math.max(4, Math.floor(h / cell))
      grid = new Uint8Array(gw * gh)
      ants = []
      for (let i = 0; i < MAXA; i += 1) {
        ants.push({
          x: Math.floor(gw / 2) + (i % 4) * 3 - 6,
          y: Math.floor(gh / 2) + Math.floor(i / 4) * 3 - 3,
          d: i % 4,
        })
      }
      total = 0
    }

    const stepAnt = (a) => {
      const i = a.y * gw + a.x
      if (i < 0 || i >= grid.length || a.x < 0 || a.y < 0 || a.x >= gw || a.y >= gh) {
        a.x = Math.floor(gw / 2)
        a.y = Math.floor(gh / 2)
        return
      }
      const on = grid[i]
      grid[i] = on ? 0 : 1
      /* 白格右转、黑格左转 —— 两条规则的全部内容 */
      a.d = on ? (a.d + 3) & 3 : (a.d + 1) & 3
      if (a.d === 0) a.y -= 1
      else if (a.d === 1) a.x += 1
      else if (a.d === 2) a.y += 1
      else a.x -= 1
      if (a.x < 0) a.x = gw - 1
      else if (a.x >= gw) a.x = 0
      if (a.y < 0) a.y = gh - 1
      else if (a.y >= gh) a.y = 0
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        clear()
        ctx.fillStyle = '#06070f'
        ctx.fillRect(0, 0, w, h)
      },
      frame() {
        for (let s = 0; s < steps; s += 1) {
          for (let k = 0; k < nAnts; k += 1) stepAnt(ants[k])
        }
        total += steps * nAnts

        /* 逐格重画。格子少（几千个）时这比维护脏矩形简单得多，也够快 */
        const d = buf.data
        const n = gw * gh
        for (let i = 0; i < n; i += 1) {
          const p = i * 4
          if (grid[i]) {
            d[p] = 224; d[p + 1] = 232; d[p + 2] = 255
          } else {
            d[p] = 12; d[p + 1] = 13; d[p + 2] = 24
          }
          d[p + 3] = 255
        }
        for (let k = 0; k < nAnts; k += 1) {
          const a = ants[k]
          if (a.x < 0 || a.y < 0 || a.x >= gw || a.y >= gh) continue
          const p = (a.y * gw + a.x) * 4
          d[p] = 255; d[p + 1] = 96; d[p + 2] = 64
        }
        buf.blit(ctx, w, h)

        ctx.fillStyle = 'rgba(210, 220, 255, 0.8)'
        ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, monospace'
        ctx.textAlign = 'left'
        ctx.fillText(`步数 ${total.toLocaleString()} · 约 1.1 万步后开始「修高速公路」`, 12, 20)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'ants') nAnts = v
        if (key === 'steps') steps = v
        if (key === 'cell') { cell = v; clear() }
      },
      action(key) {
        if (key === 'clear') clear()
        if (key === 'turbo') {
          for (let s = 0; s < 20000; s += 1) {
            for (let k = 0; k < nAnts; k += 1) stepAnt(ants[k])
          }
          total += 20000 * nAnts
        }
      },
      destroy() {},
    }
  },
}

export default langtonAnt
