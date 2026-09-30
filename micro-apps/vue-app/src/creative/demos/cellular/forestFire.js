/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 元胞自动机与自组织 · 森林火灾 —— 自组织临界三态模型
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { makeFieldBuffer } from '../../utils/canvas.js'
import { makeRgbLut } from '../../utils/color.js'

const forestFire = {
  id: 'forest-fire',
  title: '森林火灾',
  tag: '自组织临界三态模型',
  desc: '三种状态就够：空地、树、火。空地上按概率长出树，树被闪电劈中就燃，火把相邻的树点着然后自己变成空地。树长得越密，一场火能连着烧越远 —— 系统自己爬到「一点就着」的临界状态，所以火灾规模的分布是幂律而不是正态：小火烧不完就灭了，大火能烧掉半片林子。',
  bg: '#050704',
  params: [
    { key: 'growth', label: '生长概率', min: 0.001, max: 0.03, step: 0.001, value: 0.008 },
    { key: 'strike', label: '雷击概率', min: 0, max: 200, step: 5, value: 40 },
    { key: 'rate', label: '推进/帧', min: 1, max: 12, step: 1, value: 5 },
  ],
  actions: [
    { key: 'ignite', label: '点一把火' },
    { key: 'reset', label: '重新造林' },
  ],
  create(ctx) {
    const buf = makeFieldBuffer(3)
    const LUT = makeRgbLut(3, (v) => {
      if (v < 0.34) return [14, 18, 12]
      if (v < 0.67) return [46, 138, 62]
      return [248, 128, 44]
    })
    let w = 800
    let h = 360
    let growth = 0.008
    let strike = 40
    let rate = 5
    let gw = 0
    let gh = 0
    let cells = new Uint8Array(0)
    let burned = 0

    const alloc = () => {
      gw = buf.width
      gh = buf.height
      cells = new Uint8Array(gw * gh)
      for (let i = 0; i < cells.length; i += 1) cells[i] = Math.random() < 0.4 ? 1 : 0
      burned = 0
    }

    const tickOnce = () => {
      let alive = 0
      for (let y = 0; y < gh; y += 1) {
        for (let x = 0; x < gw; x += 1) {
          const i = y * gw + x
          const s = cells[i]
          if (s === 2) { cells[i] = 0; burned += 1; continue }
          if (s === 1) {
            alive += 1
            /* 四邻有火 → 被点着 */
            if ((x > 0 && cells[i - 1] === 2) || (x < gw - 1 && cells[i + 1] === 2)
              || (y > 0 && cells[i - gw] === 2) || (y < gh - 1 && cells[i + gw] === 2)) {
              cells[i] = 2
            } else if (Math.random() < strike / 1e6) {
              cells[i] = 2
            }
          } else if (Math.random() < growth) {
            cells[i] = 1
          }
        }
      }
      /* 树烧光了就自动补一把火，不然动画会彻底停住 */
      if (alive === 0) {
        const k = (Math.random() * cells.length) | 0
        cells[k] = 2
      }
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        buf.resize(w, h)
        alloc()
      },
      frame(ts, dt) {
        const n = Math.max(1, Math.min(rate, Math.round(rate * Math.min(dt * 60, 2))))
        for (let i = 0; i < n; i += 1) tickOnce()

        const d = buf.data
        for (let i = 0; i < cells.length; i += 1) {
          const ci = cells[i] * 3
          const p = i * 4
          d[p] = LUT[ci]
          d[p + 1] = LUT[ci + 1]
          d[p + 2] = LUT[ci + 2]
          d[p + 3] = 255
        }
        buf.blit(ctx, w, h)

        /* 累计烧毁格数：火灾规模是幂律，这个数字会以不规则的节奏往下跳 */
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
        ctx.fillRect(w - 132, 8, 124, 24)
        ctx.fillStyle = '#ffd7a8'
        ctx.font = '13px ui-monospace, monospace'
        ctx.fillText(`累计烧毁 ${burned}`, w - 124, 25)
      },
      pointer(kind, x, y) {
        if (kind !== 'down' && kind !== 'move') return
        const cx = Math.floor((x / w) * gw)
        const cy = Math.floor((y / h) * gh)
        for (let dy = -2; dy <= 2; dy += 1) {
          for (let dx = -2; dx <= 2; dx += 1) {
            const xx = cx + dx
            const yy = cy + dy
            if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue
            cells[yy * gw + xx] = 2
          }
        }
      },
      setParam(key, v) {
        if (key === 'growth') growth = v
        if (key === 'rate') rate = v
        /* strike 用 0~200 的滑杆，内部换算成「每格每步的雷击概率」 */
        if (key === 'strike') strike = v
      },
      action(key) {
        if (key === 'ignite') {
          for (let k = 0; k < 6; k += 1) cells[(Math.random() * cells.length) | 0] = 2
        }
        if (key === 'reset') alloc()
      },
      destroy() {},
    }
  },
}

export default forestFire
