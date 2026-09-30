/**
 * 几何与图案 · 林登迈尔系统 —— 字符串重写 + 龟形绘图
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */

const L_RULES = [
  { name: 'X → F[-X][X]F[-X]+FX', axiom: 'X', grow: 'X', rules: { X: 'F[-X][X]F[-X]+FX', F: 'FF' }, angle: 26, step: 5 },
  { name: 'F → F[+F]F[-F][F]', axiom: 'F', grow: 'F', rules: { F: 'F[+F]F[-F][F]' }, angle: 22, step: 4 },
  { name: 'F → FF-[-F+F+F]+[+F-F-F]', axiom: 'F', grow: 'F', rules: { F: 'FF-[-F+F+F]+[+F-F-F]' }, angle: 18, step: 3.4 },
  { name: 'X → F-[[X]+X]+F[+FX]-X', axiom: 'X', grow: 'X', rules: { X: 'F-[[X]+X]+F[+FX]-X', F: 'FF' }, angle: 23, step: 5 },
  { name: 'F → F+F--F+F（科赫曲线）', axiom: 'F', grow: 'F', rules: { F: 'F+F--F+F' }, angle: 60, step: 3 },
]

const lsystem = {
  id: 'l-system',
  title: '林登迈尔系统',
  tag: '字符串重写 + 龟形绘图',
  desc: '把一条字符串按规则反复替换，再把结果当成一支笔的指令（F 前进、+/- 转向、[] 压栈/出栈），就长出了植物、雪花和分形枝杈。整个系统只有「重写」和「画」两件事，却能用五个符号描述真实植物的自相似结构。',
  bg: '#04070c',
  params: [
    { key: 'rule', label: '规则集', min: 0, max: 4, step: 1, value: 0 },
    { key: 'iter', label: '迭代层数', min: 1, max: 5, step: 1, value: 4 },
    { key: 'angle', label: '分叉角', min: 8, max: 72, step: 1, value: 26 },
    { key: 'grow', label: '生长速度', min: 0.1, max: 3, step: 0.1, value: 0.7 },
  ],
  actions: [
    { key: 'restart', label: '重新生长' },
    { key: 'full', label: '直接长满' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let ruleIdx = 0
    let iter = 4
    let angle = 26
    let grow = 0.7
    let progress = 0
    let segs = []
    let totalLen = 0
    let hold = 0
    const MAXSEG = 9000

    /** 生成字符串 + 龟形解释成线段表（只在参数变化时算一次） */
    const compile = () => {
      const rule = L_RULES[ruleIdx] || L_RULES[0]
      let s = rule.axiom
      for (let i = 0; i < iter; i += 1) {
        let out = ''
        for (let j = 0; j < s.length; j += 1) {
          const c = s[j]
          out += rule.rules[c] !== undefined ? rule.rules[c] : c
          /* 长度爆了就提前停 —— 迭代层数调高时字符串会指数级膨胀 */
          if (out.length > 60000) break
        }
        s = out
        if (s.length > 60000) break
      }

      segs = []
      let x = 0
      let y = 0
      let a = -Math.PI / 2
      const stack = []
      let step0 = rule.step
      for (let i = 0; i < s.length; i += 1) {
        const c = s[i]
        if (c === 'F' || c === 'G') {
          const nx = x + Math.cos(a) * step0
          const ny = y + Math.sin(a) * step0
          if (segs.length < MAXSEG) segs.push([x, y, nx, ny, a])
          x = nx
          y = ny
        } else if (c === '+') a += (angle * Math.PI) / 180
        else if (c === '-') a -= (angle * Math.PI) / 180
        else if (c === '[') stack.push([x, y, a])
        else if (c === ']') {
          const p = stack.pop()
          if (p) { x = p[0]; y = p[1]; a = p[2] }
        }
        if (segs.length >= MAXSEG) break
      }

      /* 自适应缩放：把整棵树按包围盒塞进画布，留 10% 边距 */
      let lo = 1e9
      let hi = -1e9
      let top = 1e9
      let bot = -1e9
      for (const g of segs) {
        lo = Math.min(lo, g[0], g[2])
        hi = Math.max(hi, g[0], g[2])
        top = Math.min(top, g[1], g[3])
        bot = Math.max(bot, g[1], g[3])
      }
      const spanX = hi - lo || 1
      const spanY = bot - top || 1
      const k = Math.min((w * 0.88) / spanX, (h * 0.9) / spanY)
      const ox = w / 2 - ((lo + hi) / 2) * k
      const oy = h / 2 - ((top + bot) / 2) * k
      for (const g of segs) {
        g[0] = g[0] * k + ox
        g[1] = g[1] * k + oy
        g[2] = g[2] * k + ox
        g[3] = g[3] * k + oy
      }
      totalLen = segs.length
      progress = 0
    }

    const restart = () => {
      progress = 0
      hold = 0
      ctx.fillStyle = '#04070c'
      ctx.fillRect(0, 0, w, h)
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        compile()
        restart()
      },
      frame(ts, dt) {
        /*
         * ⚠️ 这里必须**每帧把已经长出来的部分整棵重画**，不能像最初那样「只画新增段 + 靠画面残留」。
         *
         * 原因是那个写法有个致命的空窗期：长满之后 hold 一拍再由 `restart()` 清屏重长，
         * 而清屏那一瞬间画面是全黑的；就算不清屏，逐帧 `rgba(bg, 0.06)` 的淡出也会在一两秒内
         * 把不再重绘的树吃掉。实测结果是大约七成时间画布上什么都没有 ——
         * 用户进页面看到一片黑，只会认为这个 demo 坏了。
         *
         * 代价用「分色桶」补回来：线段颜色只取决于它在整棵树里的位置比例，
         * 于是按比例切成 16 桶，每桶一次 beginPath/stroke —— 9000 段也只有 16 次描边调用。
         */
        ctx.fillStyle = '#04070c'
        ctx.fillRect(0, 0, w, h)

        if (hold > 0) {
          hold -= dt
          if (hold <= 0) progress = 0
        } else {
          progress = Math.min(totalLen, progress + grow * 1500 * dt)
          if (totalLen > 0 && progress >= totalLen) hold = 1.3
        }

        const upto = Math.floor(progress)
        ctx.lineWidth = 1.15
        ctx.lineCap = 'round'
        const BUCKETS = 16
        for (let b = 0; b < BUCKETS; b += 1) {
          const lo = Math.floor((b / BUCKETS) * upto)
          const hi = Math.floor(((b + 1) / BUCKETS) * upto)
          if (hi <= lo) continue
          const tt = ((lo + hi) * 0.5) / (totalLen || 1)
          /* 越靠枝梢越暖：整棵树从深绿长到铜红 */
          ctx.strokeStyle = `hsla(${150 - tt * 130}, ${58 + tt * 26}%, ${46 + tt * 22}%, 0.9)`
          ctx.beginPath()
          for (let i = lo; i < hi; i += 1) {
            const g = segs[i]
            if (!g) break
            ctx.moveTo(g[0], g[1])
            ctx.lineTo(g[2], g[3])
          }
          ctx.stroke()
        }
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'rule') { ruleIdx = v; compile() }
        if (key === 'iter') { iter = v; compile() }
        if (key === 'angle') { angle = v; compile() }
        if (key === 'grow') grow = v
      },
      action(key) {
        if (key === 'restart') restart()
        if (key === 'full') { progress = totalLen; hold = 1.3 }
      },
      destroy() {},
    }
  },
}

export default lsystem
