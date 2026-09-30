/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 粒子与渲染 · 抖动与二值化 —— Bayer 有序 + Floyd–Steinberg
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { clamp } from '../../utils/math.js'
import { makeFieldBuffer } from '../../utils/canvas.js'

const dithering = {
  id: 'dithering',
  title: '抖动与二值化',
  tag: 'Bayer 有序 + Floyd–Steinberg',
  desc: '只有黑白两颗墨，怎么表现连续灰阶？除了「点的大小」，还可以「点的疏密」：用一个反复出现的阈值矩阵去比较亮度，超过就印黑 —— 有序抖动。Floyd–Steinberg 更聪明：把量化误差分给还没处理的右边和下边邻居，于是渐变处会自动排成细密的花纹。两种算法的差别一眼可辨。',
  bg: '#0b0b0f',
  params: [
    { key: 'scale', label: '图案尺度', min: 0.5, max: 5, step: 0.1, value: 1.6 },
    { key: 'speed', label: '速度', min: 0.1, max: 2.5, step: 0.1, value: 0.8 },
    { key: 'algo', label: '算法(0有序1误差扩散)', min: 0, max: 1, step: 1, value: 1 },
  ],
  actions: [
    { key: 'swap', label: '换图案' },
    { key: 'invert', label: '反相' },
  ],
  create(ctx) {
    const buf = makeFieldBuffer(4)
    /* Bayer 8×8 阈值矩阵：把 0..63 的序号按位交错排开，得到「均匀但看起来随机」的排序 */
    const BAYER = new Uint8Array(64)
    for (let i = 0; i < 64; i += 1) {
      let v = 0
      let bit = 0
      let x = i & 7
      let y = (i >> 3) & 7
      for (let b = 0; b < 3; b += 1) {
        v |= ((x & 1) ^ (y & 1)) << bit
        bit += 1
        x >>= 1
        y >>= 1
        /* 标准构造：交叉位再加上自身位 */
        v |= (x & 1) << bit
        bit += 1
        x >>= 1
        y >>= 1
      }
      BAYER[i] = (v & 63) * 4
    }
    let w = 800
    let h = 360
    let scale = 1.6
    let speed = 0.8
    let algo = 1
    let t = 0
    let mode = 0
    let invert = false

    const gray = (u, v) => {
      const x = (u - 0.5) * 2 * scale
      const y = (v - 0.5) * 2 * scale
      if (mode === 1) return clamp(1.05 - Math.hypot(x, y) * 1.2, 0, 1)
      if (mode === 2) return clamp((Math.sin(x * 2.4 + t) + Math.cos(y * 2.9 - t * 0.6) + 2) / 4, 0, 1)
      return clamp((Math.sin(x * 1.9 + t * 0.9) * Math.cos(y * 2.3 - t * 0.5) + 1) / 2, 0, 1)
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
        /* 先算一张灰阶图（0..255），再按选中的算法二值化 */
        const g = new Float32Array(gw * gh)
        for (let gy = 0; gy < gh; gy += 1) {
          for (let gx = 0; gx < gw; gx += 1) {
            let val = gray((gx + 0.5) / gw, (gy + 0.5) / gh) * 255
            if (invert) val = 255 - val
            g[gy * gw + gx] = val
          }
        }

        if (algo === 0) {
          for (let gy = 0; gy < gh; gy += 1) {
            for (let gx = 0; gx < gw; gx += 1) {
              const i = gy * gw + gx
              const th = BAYER[(gy & 7) * 8 + (gx & 7)]
              g[i] = g[i] > th ? 255 : 0
            }
          }
        } else {
          /* Floyd–Steinberg：把量化误差按 7/16、3/16、5/16、1/16 分给四个邻居 */
          for (let gy = 0; gy < gh; gy += 1) {
            for (let gx = 0; gx < gw; gx += 1) {
              const i = gy * gw + gx
              const old = g[i]
              const nv = old > 127 ? 255 : 0
              g[i] = nv
              const err = old - nv
              if (gx + 1 < gw) g[i + 1] += (err * 7) / 16
              if (gy + 1 < gh) {
                if (gx > 0) g[i + gw - 1] += (err * 3) / 16
                g[i + gw] += (err * 5) / 16
                if (gx + 1 < gw) g[i + gw + 1] += err / 16
              }
            }
          }
        }

        for (let i = 0; i < gw * gh; i += 1) {
          const v = g[i] > 127 ? 236 : 12
          const p = i * 4
          d[p] = v
          d[p + 1] = v
          d[p + 2] = v + (v > 128 ? 12 : 6)
          d[p + 3] = 255
        }
        buf.blit(ctx, w, h)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'scale') scale = v
        if (key === 'speed') speed = v
        if (key === 'algo') algo = v
      },
      action(key) {
        if (key === 'swap') mode = (mode + 1) % 3
        if (key === 'invert') invert = !invert
      },
      destroy() {},
    }
  },
}

export default dithering
