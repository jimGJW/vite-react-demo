/**
 * 几何与图案 · 沃罗诺伊图 —— 最近站点距离场
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU } from '../../utils/math.js'
import { makeFieldBuffer } from '../../utils/canvas.js'

const HSV6 = [
  [255, 62, 78], [255, 178, 48], [206, 232, 62],
  [62, 226, 152], [58, 172, 242], [152, 100, 236],
]

const voronoi = {
  id: 'voronoi',
  title: '沃罗诺伊图',
  tag: '最近站点距离场',
  desc: '每个像素归属离它最近的那个站点 —— 这就是沃罗诺伊图。它默默出现在肥皂泡、蜻蜓翅膀、手机信号分区和晶体长大的形状里。站点一动，整张图立刻重排，是「局部规则决定全局形状」最直白的例子。',
  bg: '#05060e',
  params: [
    { key: 'sites', label: '站点数', min: 6, max: 60, step: 1, value: 26 },
    { key: 'speed', label: '漂移速度', min: 0, max: 70, step: 2, value: 24 },
    { key: 'edge', label: '描边宽度', min: 0, max: 12, step: 1, value: 5 },
  ],
  actions: [{ key: 'reset', label: '重新撒点' }],
  create(ctx) {
    let w = 800
    let h = 360
    let nSites = 26
    let speed = 24
    let edge = 5
    const MAXS = 60
    const buf = makeFieldBuffer(5)
    const sx = new Float64Array(MAXS)
    const sy = new Float64Array(MAXS)
    const vx = new Float64Array(MAXS)
    const vy = new Float64Array(MAXS)
    const hue = new Float64Array(MAXS)

    const scatter = () => {
      for (let i = 0; i < MAXS; i += 1) {
        sx[i] = Math.random()
        sy[i] = Math.random()
        const a = Math.random() * TAU
        vx[i] = Math.cos(a)
        vy[i] = Math.sin(a)
        hue[i] = Math.random()
      }
    }
    scatter()

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        buf.resize(w, h)
        ctx.fillStyle = '#05060e'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        const asp = w / h
        for (let i = 0; i < nSites; i += 1) {
          sx[i] += vx[i] * speed * dt / w
          sy[i] += vy[i] * speed * dt / h
          if (sx[i] < 0.02) { sx[i] = 0.02; vx[i] = Math.abs(vx[i]) }
          else if (sx[i] > 0.98) { sx[i] = 0.98; vx[i] = -Math.abs(vx[i]) }
          if (sy[i] < 0.02) { sy[i] = 0.02; vy[i] = Math.abs(vy[i]) }
          else if (sy[i] > 0.98) { sy[i] = 0.98; vy[i] = -Math.abs(vy[i]) }
        }

        const gw = buf.width
        const gh = buf.height
        const d = buf.data
        /* 最近站点 + 次近站点：F2 - F1 小于阈值就是边界，比单独做边缘检测省一半事 */
        for (let gy = 0; gy < gh; gy += 1) {
          const uy = (gy + 0.5) / gh
          for (let gx = 0; gx < gw; gx += 1) {
            const ux = ((gx + 0.5) / gw) * asp
            let b1 = 1e9
            let b2 = 1e9
            let win = 0
            for (let i = 0; i < nSites; i += 1) {
              const dx = sx[i] * asp - ux
              const dy = sy[i] - uy
              const d2 = dx * dx + dy * dy
              if (d2 < b1) { b2 = b1; b1 = d2; win = i }
              else if (d2 < b2) b2 = d2
            }
            const gap = Math.sqrt(b2) - Math.sqrt(b1)
            const p = (gy * gw + gx) * 4
            if (gap * gw * asp < edge) {
              /* F2 - F1 足够小 → 这里就是两个站点的分界 */
              d[p] = 236
              d[p + 1] = 240
              d[p + 2] = 255
            } else {
              const hh = hue[win] * 6
              const k = hh | 0
              const fr = hh - k
              const c0 = HSV6[k % 6]
              const c1 = HSV6[(k + 1) % 6]
              /* 越靠进单元格中心越亮，视觉上自然分出「隆起」 */
              const shade = Math.min(1, 0.42 + Math.sqrt(b1) * 1.35)
              d[p] = (c0[0] + (c1[0] - c0[0]) * fr) * shade
              d[p + 1] = (c0[1] + (c1[1] - c0[1]) * fr) * shade
              d[p + 2] = (c0[2] + (c1[2] - c0[2]) * fr) * shade
            }
            d[p + 3] = 255
          }
        }
        buf.blit(ctx, w, h)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'sites') { nSites = v; scatter() }
        if (key === 'speed') speed = v
        if (key === 'edge') edge = v
      },
      action(key) {
        if (key === 'reset') scatter()
      },
      destroy() {},
    }
  },
}

export default voronoi
