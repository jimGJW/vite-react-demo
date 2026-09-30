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
 * 分形与数学 · 考拉兹序列 —— 3n+1 的迭代长度
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */

const collatz = {
  id: 'collatz',
  title: '考拉兹序列',
  tag: '3n+1 的迭代长度',
  desc: '规则只有两条：偶数就除以二，奇数就乘三加一。所有已知起点最终都会掉到 1，但**没有人能证明这一点** —— 它是数学里最著名的未解问题之一。把每个起点的「步数」画出来，会看到几条平滑的斜带和明显的分层：明明规则这么简单，结构却复杂得无从下手。',
  bg: '#03040c',
  params: [
    { key: 'maxN', label: '起点上限', min: 200, max: 12000, step: 100, value: 4000 },
    { key: 'speed', label: '绘制速度', min: 0.1, max: 6, step: 0.1, value: 2 },
    { key: 'dot', label: '点大小', min: 0.6, max: 3, step: 0.2, value: 1.4 },
  ],
  actions: [
    { key: 'redraw', label: '重画' },
    { key: 'peaks', label: '只标最高峰' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let maxN = 4000
    let speed = 2
    let dot = 1.4
    let drawn = 0
    let hold = 0
    let peaksOnly = false
    let maxSteps = 1

    const reset = () => {
      drawn = 0
      hold = 0
      maxSteps = 1
      /* 先扫一遍找出最大步数，好把 y 轴归一化 */
      for (let n = 1; n <= maxN; n += 1) {
        let x = n
        let s = 0
        while (x !== 1 && s < 4000) {
          x = x % 2 === 0 ? x / 2 : 3 * x + 1
          s += 1
        }
        if (s > maxSteps) maxSteps = s
      }
      ctx.fillStyle = '#03040c'
      ctx.fillRect(0, 0, w, h)
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        reset()
      },
      frame(ts, dt) {
        if (hold > 0) { hold -= dt; return }
        const stepPx = Math.max(1, Math.round(speed * 60 * Math.min(dt * 60, 2) * 0.4))
        const to = Math.min(maxN, drawn + stepPx)
        for (let n = drawn + 1; n <= to; n += 1) {
          let x = n
          let s = 0
          while (x !== 1 && s < 4000) {
            x = x % 2 === 0 ? x / 2 : 3 * x + 1
            s += 1
          }
          if (peaksOnly && s < maxSteps * 0.42) continue
          const px = (n / maxN) * w
          const py = h - 8 - (s / maxSteps) * (h - 24)
          ctx.fillStyle = `hsla(${200 - (s / maxSteps) * 150}, 88%, 64%, 0.75)`
          ctx.fillRect(px, py, dot, dot)
        }
        drawn = to
        if (drawn >= maxN) hold = 1.4
        ctx.fillStyle = '#dff6ff'
        ctx.font = '13px ui-monospace, monospace'
        ctx.fillText(`起点 1..${maxN} · 最长 ${maxSteps} 步`, 12, 22)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'maxN') { maxN = v; reset() }
        if (key === 'speed') speed = v
        if (key === 'dot') dot = v
      },
      action(key) {
        if (key === 'redraw') reset()
        if (key === 'peaks') { peaksOnly = !peaksOnly; reset() }
      },
      destroy() {},
    }
  },
}

export default collatz
