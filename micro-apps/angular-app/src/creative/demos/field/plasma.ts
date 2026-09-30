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
 * 场与流体 · 等离子云 —— 正弦叠加 + 调色板映射
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, clamp } from '../../utils/math'
import { makeFieldBuffer } from '../../utils/canvas'
import { hsl2rgb, makeRgbLut } from '../../utils/color'

const plasma = {
  id: 'plasma',
  title: '等离子云',
  tag: '正弦叠加 + 调色板映射',
  desc: '上世纪 demoscene 的经典「等离子」效果：把四组不同频率、不同方向的正弦波加在一起，再喂给一条色带去索引颜色。它没有任何物理含义 —— 但只要频率之间存在无理数比，叠出来的图案就永远不重复，看起来像在缓慢流动的等离子体。',
  bg: '#05040d',
  params: [
    { key: 'scale', label: '空间频率', min: 0.5, max: 8, step: 0.25, value: 2.5 },
    { key: 'speed', label: '流速', min: 0, max: 4, step: 0.2, value: 1.2 },
    { key: 'hue', label: '色相偏移', min: 0, max: 360, step: 10, value: 200 },
  ],
  actions: [
    { key: 'phase', label: '打乱相位' },
    { key: 'wave', label: '换波形' },
  ],
  create(ctx) {
    const buf = makeFieldBuffer(4)
    let w = 800
    let h = 360
    let scale = 2.5
    let speed = 1.2
    let hue = 200
    let t = 0
    let shape = 0
    /* 四组相位：每组的系数取无理数附近的值，周期才不容易对齐 */
    const ph = [0, 1.7, 3.1, 5.4]

    /* 128 档 RGB 查色表；hue 改变时重建一次，逐像素只做数组索引 */
    let LUT = makeRgbLut(128, (v) => hsl2rgb(hue + v * 300, 0.72 + v * 0.2, 0.26 + v * 0.46))
    const rebuildLut = () => {
      LUT = makeRgbLut(128, (v) => hsl2rgb(hue + v * 300, 0.72 + v * 0.2, 0.26 + v * 0.46))
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        buf.resize(w, h)
      },
      frame(ts, dt) {
        t += dt * speed
        const d = buf.data
        const gw = buf.width
        const gh = buf.height
        const s = scale / 100
        const c1 = Math.sin(t * 1.1 + ph[0])
        const c2 = Math.sin(t * 1.7 + ph[1])
        const c3 = Math.sin(t * 0.7 + ph[2])
        const c4 = Math.sin(t * 2.3 + ph[3])
        for (let gy = 0; gy < gh; gy += 1) {
          const py = gy * s
          const row = gy * gw
          for (let gx = 0; gx < gw; gx += 1) {
            const pxx = gx * s
            let v = Math.sin(pxx * 2 + c1)
            v += Math.sin(py * 2.4 - c2)
            v += Math.sin((pxx + py) * 1.6 + c3)
            v += Math.sin(Math.sqrt(pxx * pxx + py * py) * 2.1 - c4)
            /* 换成绝对值就折出尖角 —— 同一套相位能画出完全不同的图案 */
            v = shape ? Math.abs(v) * 0.5 : v * 0.25
            const ci = clamp(Math.round((v + 1) * 63.5), 0, 127) * 3
            const p = (row + gx) * 4
            d[p] = LUT[ci]
            d[p + 1] = LUT[ci + 1]
            d[p + 2] = LUT[ci + 2]
            d[p + 3] = 255
          }
        }
        buf.blit(ctx, w, h)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'scale') scale = v
        if (key === 'speed') speed = v
        if (key === 'hue') { hue = v; rebuildLut() }
      },
      action(key) {
        if (key === 'phase') {
          for (let i = 0; i < 4; i += 1) ph[i] = Math.random() * TAU
        }
        if (key === 'wave') shape = shape ? 0 : 1
      },
      destroy() {},
    }
  },
}

export default plasma
