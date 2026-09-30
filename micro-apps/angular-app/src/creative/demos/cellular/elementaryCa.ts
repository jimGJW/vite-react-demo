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
 * 元胞自动机与自组织 · 一维元胞自动机 —— Wolfram 初等规则 0–255
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { clamp } from '../../utils/math'

const elementaryCa = {
  id: 'elementary-ca',
  title: '一维元胞自动机',
  tag: 'Wolfram 初等规则 0–255',
  desc: '一个字节就是一个宇宙：8 个邻域组合各对应一个新状态，规则号 0–255 把它们编码起来。Rule 30 长出伪随机，Rule 90 是谢尔宾斯基三角，Rule 110 甚至被证明是图灵完备的 —— 换个规则号就是了。',
  bg: '#05060f',
  params: [
    { key: 'rule', label: '规则号', min: 0, max: 255, step: 1, value: 30 },
    { key: 'interval', label: '每行间隔(ms)', min: 8, max: 200, step: 2, value: 24 },
  ],
  actions: [
    { key: 'prev', label: '规则 -1' },
    { key: 'next', label: '规则 +1' },
    { key: 'rerun', label: '重播' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let rule = 30
    let intervalMs = 24
    let cols = 0
    let row = null
    let nextRow = null
    let acc = 0
    let gen = 0

    const restart = () => {
      cols = Math.max(16, Math.floor(w))
      row = new Uint8Array(cols)
      nextRow = new Uint8Array(cols)
      row[Math.floor(cols / 2)] = 1
      gen = 0
      ctx.fillStyle = '#05060f'
      ctx.fillRect(0, 0, w, h)
    }

    const advance = () => {
      const r = rule
      for (let i = 0; i < cols; i += 1) {
        const l = row[(i - 1 + cols) % cols]
        const c = row[i]
        const rr = row[(i + 1) % cols]
        nextRow[i] = (r >> ((l << 2) | (c << 1) | rr)) & 1
      }
      const tmp = row
      row = nextRow
      nextRow = tmp
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        if (!row || cols !== Math.floor(w)) restart()
        ctx.fillStyle = '#05060f'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        acc += dt * 1000
        if (acc < intervalMs) return
        acc = 0
        advance()
        gen += 1
        /* 整体上移一格，新的一代画在最底下 —— 比每帧重绘全部历史便宜得多 */
        ctx.drawImage(ctx.canvas, 0, -1)
        const hue = (gen * 2.2) % 360
        ctx.fillStyle = `hsl(${200 + (hue % 120)}, 85%, 62%)`
        for (let i = 0; i < cols; i += 1) {
          if (row[i]) ctx.fillRect(i, h - 1, 1, 1)
        }
        if (gen % (h - 1) === 0) restart()
      },
      pointer(kind, x) {
        if (kind === 'down' && row) {
          row[clamp(Math.floor(x), 0, cols - 1)] = row[clamp(Math.floor(x), 0, cols - 1)] ? 0 : 1
        }
      },
      setParam(k, v) {
        if (k === 'interval') intervalMs = v
        if (k === 'rule') {
          rule = v
          restart()
        }
      },
      action(key) {
        if (key === 'prev') {
          rule = (rule + 255) % 256
          restart()
        }
        if (key === 'next') {
          rule = (rule + 1) % 256
          restart()
        }
        if (key === 'rerun') restart()
      },
      destroy() {},
    }
  },
}

export default elementaryCa
