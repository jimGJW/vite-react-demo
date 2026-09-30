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
 * 场与流体 · 烟雾平流 —— 浮力 + 速度场推进
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { clamp, rand, fbm } from '../../utils/math'

const smoke = {
  id: 'smoke',
  title: '烟雾平流',
  tag: '浮力 + 速度场推进',
  desc: '每一粒烟只做两件事：被一个缓慢变化的扰动速度场推着走，同时因为「热」而持续上升。速度场用 fbm 噪声现算，没有任何网格和求解器 —— 这类「粒子被场驮着跑」的写法就是最廉价的流体近似，代价是只能看不能量（不守恒）。',
  bg: '#04060d',
  params: [
    { key: 'count', label: '烟量', min: 120, max: 1400, step: 40, value: 560 },
    { key: 'rise', label: '上升力', min: 4, max: 70, step: 2, value: 26 },
    { key: 'swirl', label: '扰动强度', min: 0, max: 120, step: 5, value: 46 },
  ],
  actions: [
    { key: 'puff', label: '喷一口' },
    { key: 'clear', label: '散掉' },
  ],
  create(ctx) {
    const MAXC = 1400
    let w = 800
    let h = 360
    let count = 560
    let rise = 26
    let swirl = 46
    let seed = 0

    const px = new Float32Array(MAXC)
    const py = new Float32Array(MAXC)
    const pvx = new Float32Array(MAXC)
    const pvy = new Float32Array(MAXC)
    const page = new Float32Array(MAXC)
    const plife = new Float32Array(MAXC)

    const spawn = (i, spread = 0.08) => {
      px[i] = w * (0.5 + rand(-spread, spread))
      py[i] = h * rand(0.9, 1.02)
      pvx[i] = rand(-10, 10)
      pvy[i] = rand(-30, -6)
      page[i] = 0
      plife[i] = rand(2.4, 5.2)
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        for (let i = 0; i < MAXC; i += 1) spawn(i)
        ctx.fillStyle = '#04060d'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        seed += dt * 0.12

        /* 拖尾：正常混合把整块压暗一点点，烟过去的轨迹就留下来了 */
        ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = 'rgba(4, 6, 13, 0.14)'
        ctx.fillRect(0, 0, w, h)

        /* 加色混合：烟互相叠在一起会越来越亮，像真的烟柱 */
        ctx.globalCompositeOperation = 'lighter'
        for (let i = 0; i < MAXC; i += 1) {
          if (i >= count) break
          page[i] += dt
          if (page[i] > plife[i] || py[i] < -20) spawn(i)

          const nx = px[i] * 0.0055
          const ny = py[i] * 0.0085 - seed
          /* 两个八度就够：再多也看不出，纯浪费逐帧预算 */
          const u = fbm(nx, ny, 2) - 0.5
          pvx[i] = clamp(pvx[i] + u * swirl * dt * 7, -90, 90)
          pvx[i] *= 0.988
          /* 越老越轻 —— 烟头刚出来时上升最快 */
          pvy[i] += (-rise * (1 - page[i] / plife[i] * 0.45) - pvy[i]) * Math.min(1, dt * 3)
          px[i] += pvx[i] * dt
          py[i] += pvy[i] * dt

          const age = page[i] / plife[i]
          const a = (1 - age) * 0.5
          if (a > 0.01) {
            ctx.fillStyle = `rgba(${140 + age * 70}, ${165 + age * 50}, ${200 + age * 40}, ${a})`
            const r = 1.6 + age * 4.2
            ctx.fillRect(px[i] - r * 0.5, py[i] - r * 0.5, r, r)
          }
        }
        ctx.globalCompositeOperation = 'source-over'
      },
      pointer(kind, x, y) {
        if (kind === 'leave') return
        /* 指针附近给一个横向推力 + 一小股上升：像用手扇了一下 */
        for (let i = 0; i < MAXC; i += 1) {
          if (i >= count) break
          const dx = px[i] - x
          const dy = py[i] - y
          const d2 = dx * dx + dy * dy + 400
          if (d2 > 16000) continue
          const f = 12000 / d2
          pvx[i] += (dx / Math.sqrt(d2)) * f
          pvy[i] -= f * 1.7
        }
      },
      setParam(key, v) {
        if (key === 'count') count = Math.min(MAXC, v)
        if (key === 'rise') rise = v
        if (key === 'swirl') swirl = v
      },
      action(key) {
        if (key === 'puff') {
          for (let i = 0; i < MAXC; i += 1) { if (i < count) spawn(i, 0.16) }
        }
        if (key === 'clear') {
          for (let i = 0; i < MAXC; i += 1) { py[i] = h + 999 }
        }
      },
      destroy() {},
    }
  },
}

export default smoke
