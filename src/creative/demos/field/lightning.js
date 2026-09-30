/**
 * 场与流体 · 闪电 —— 递归中点位移 + 分叉
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { rand } from '../../utils/math.js'

const lightning = {
  id: 'lightning',
  title: '闪电',
  tag: '递归中点位移 + 分叉',
  desc: '两点之间反复取中点、再垂直偏移一点点，重复六七次就得到一条自然的折线 —— 分形布朗运动的一维版本。在较浅的层上给一个很低的「分叉概率」，枝杈就自己长出来了，不需要任何「画出闪电」的规则。',
  bg: '#05060d',
  params: [
    { key: 'detail', label: '细分次数', min: 4, max: 9, step: 1, value: 7 },
    { key: 'branch', label: '分叉概率', min: 0, max: 0.5, step: 0.02, value: 0.16 },
    { key: 'rate', label: '间隔(ms)', min: 200, max: 2400, step: 100, value: 900 },
  ],
  actions: [{ key: 'strike', label: '劈一道' }],
  create(ctx) {
    let w = 800
    let h = 360
    let detail = 7
    let branch = 0.16
    let rate = 900
    let since = 1e9
    let flash = 0
    let bolts = []

    const grow = (x0, y0, x1, y1, depth, out, allowBranch) => {
      if (depth <= 0 || out.length > 900) {
        out.push([x0, y0, x1, y1])
        return
      }
      const mx = (x0 + x1) / 2 + (y1 - y0) * rand(-0.17, 0.17)
      const my = (y0 + y1) / 2 + (x1 - x0) * rand(-0.17, 0.17)
      /* 只在中间几层分叉：顶层分叉会变成两棵一样大的树，看着很假 */
      if (allowBranch && depth >= 2 && depth <= 4 && Math.random() < branch) {
        const bx = mx + rand(-0.16, 0.16)
        const by = my + rand(0.12, 0.34)
        grow(mx, my, bx, by, Math.min(depth, 5), out, false)
      }
      grow(x0, y0, mx, my, depth - 1, out, allowBranch)
      grow(mx, my, x1, y1, depth - 1, out, allowBranch)
    }

    const strike = () => {
      const segs = []
      const from = rand(0.16, 0.84)
      const to = from + rand(-0.3, 0.3)
      grow(from * w, -4, to * w, h * rand(0.72, 0.98), detail, segs, true)
      bolts.push({ segs, born: 0 })
      if (bolts.length > 3) bolts.shift()
      flash = 1
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        bolts = []
        since = 1e9
        ctx.fillStyle = '#05060d'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        const ms = dt * 1000
        since += ms
        if (since >= rate) { since = 0; strike() }
        flash *= 0.86

        ctx.fillStyle = 'rgba(5, 6, 13, 0.28)'
        ctx.fillRect(0, 0, w, h)
        if (flash > 0.012) {
          ctx.fillStyle = `rgba(150, 190, 255, ${flash * 0.17})`
          ctx.fillRect(0, 0, w, h)
        }

        for (let i = bolts.length - 1; i >= 0; i -= 1) {
          const b = bolts[i]
          b.born += ms
          if (b.born > 3000) { bolts.splice(i, 1); continue }
          /*
           * 最新那道保留一个最低辉光。
           *
           * 不这么做的话，两道闪电之间（默认间隔 900ms，而一道只亮 420ms）画布是全黑的 ——
           * 也就是超过一半的时间页面上什么都没有，用户进来只会以为坏了。
           * 这跟「闪电本来就该是瞬时的」不矛盾：真实的雷电照片也是长曝光下一道亮痕。
           */
          const decay = Math.max(0, 1 - b.born / 420)
          const newest = i === bolts.length - 1
          const life = newest ? 0.2 + decay * 0.8 : decay
          if (life <= 0) continue
          const segs = b.segs
          /* 三层描边叠出辉光：宽而淡 → 中等 → 细而白 */
          ctx.lineCap = 'round'
          ctx.strokeStyle = `rgba(96, 152, 255, ${life * 0.16})`
          ctx.lineWidth = 7
          ctx.beginPath()
          for (const s of segs) { ctx.moveTo(s[0], s[1]); ctx.lineTo(s[2], s[3]) }
          ctx.stroke()
          ctx.strokeStyle = `rgba(150, 200, 255, ${life * 0.42})`
          ctx.lineWidth = 3.1
          ctx.stroke()
          ctx.strokeStyle = `rgba(240, 248, 255, ${life * 0.95})`
          ctx.lineWidth = 1.15
          ctx.stroke()
        }
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'detail') detail = v
        if (key === 'branch') branch = v
        if (key === 'rate') { rate = v; since = v }
      },
      action(key) {
        if (key === 'strike') { since = 0; strike() }
      },
      destroy() {},
    }
  },
}

export default lightning
