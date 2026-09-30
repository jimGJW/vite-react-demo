/**
 * 场与流体 · 湍流丝带 —— 多倍频噪声 + 变宽描边
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, rand, fbm } from '../../utils/math.js'

const turbulence = {
  id: 'turbulence',
  title: '湍流丝带',
  tag: '多倍频噪声 + 变宽描边',
  desc: '和「流场丝绸」同一个思路（粒子沿场飘、半透明覆写留痕），区别在两点：速度场用 4 个倍频的 fbm 而不是单一正弦，所以流线有大小嵌套的旋涡；线宽和亮度随局部速度变化，慢的地方粗而暗、快的地方细而亮 —— 视觉上就有了「湍流」该有的层次。',
  bg: '#03060e',
  params: [
    { key: 'count', label: '丝带数', min: 80, max: 900, step: 20, value: 340 },
    { key: 'speed', label: '流速', min: 20, max: 260, step: 10, value: 110 },
    { key: 'detail', label: '细节层数', min: 1, max: 5, step: 1, value: 3 },
    { key: 'width', label: '线宽', min: 0.4, max: 3, step: 0.2, value: 1.2 },
  ],
  actions: [
    { key: 'reset', label: '重播' },
    { key: 'swirl', label: '换个流场' },
  ],
  create(ctx) {
    const MAXC = 900
    let w = 800
    let h = 360
    let count = 340
    let speed = 110
    let detail = 3
    let lineW = 1.2
    let seed = 0

    const px = new Float32Array(MAXC)
    const py = new Float32Array(MAXC)
    const BUCKETS = 12
    const bx = Array.from({ length: BUCKETS }, () => [])

    const respawn = (i) => {
      px[i] = rand(0, w)
      py[i] = rand(0, h)
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        for (let i = 0; i < MAXC; i += 1) respawn(i)
        ctx.fillStyle = '#03060e'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        ctx.fillStyle = 'rgba(3, 6, 14, 0.055)'
        ctx.fillRect(0, 0, w, h)

        for (let b = 0; b < BUCKETS; b += 1) bx[b].length = 0
        ctx.lineCap = 'round'

        for (let i = 0; i < MAXC; i += 1) {
          if (i >= count) break
          const x = px[i]
          const y = py[i]
          /* 角度直接由噪声给 —— 不用算梯度，流线一样连续 */
          const ang = fbm(x * 0.0035 + seed, y * 0.0055 - seed * 0.6, detail) * TAU * 2.4
          const nx = x + Math.cos(ang) * speed * dt
          const ny = y + Math.sin(ang) * speed * dt
          px[i] = nx
          py[i] = ny
          if (nx < -4 || nx > w + 4 || ny < -4 || ny > h + 4) { respawn(i); continue }
          /* 桶号由「方向」决定：同色线段攒一桶，一次 stroke 画完 */
          const bi = ((Math.round((ang / TAU) * BUCKETS) % BUCKETS) + BUCKETS) % BUCKETS
          bx[bi].push(x, y, nx, ny)
        }

        for (let b = 0; b < BUCKETS; b += 1) {
          const arr = bx[b]
          if (!arr.length) continue
          ctx.strokeStyle = `hsla(${192 + b * 14}, 88%, ${56 + (b % 3) * 6}%, 0.5)`
          ctx.lineWidth = lineW
          ctx.beginPath()
          for (let k = 0; k < arr.length; k += 4) {
            ctx.moveTo(arr[k], arr[k + 1])
            ctx.lineTo(arr[k + 2], arr[k + 3])
          }
          ctx.stroke()
        }
      },
      pointer(kind, x, y) {
        if (kind === 'leave') return
        for (let i = 0; i < MAXC; i += 1) {
          if (i >= count) break
          const dx = px[i] - x
          const dy = py[i] - y
          const d2 = dx * dx + dy * dy
          if (d2 < 9000 && d2 > 1) {
            const f = 240 / d2
            px[i] += dx * f * 24
            py[i] += dy * f * 24
          }
        }
      },
      setParam(key, v) {
        if (key === 'count') count = Math.min(MAXC, v)
        if (key === 'speed') speed = v
        if (key === 'detail') detail = v
        if (key === 'width') lineW = v
      },
      action(key) {
        if (key === 'reset') {
          for (let i = 0; i < MAXC; i += 1) respawn(i)
          ctx.fillStyle = '#03060e'
          ctx.fillRect(0, 0, w, h)
        }
        if (key === 'swirl') seed += 7.3
      },
      destroy() {},
    }
  },
}

export default turbulence
