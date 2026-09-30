/**
 * 数值与优化 · K 均值聚类 —— 迭代分配 + 均值更新
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { clamp, rand } from '../../utils/math.js'
import { makeFieldBuffer } from '../../utils/canvas.js'
import { hsl2rgb, makeRgbLut } from '../../utils/color.js'

const kMeans = {
  id: 'k-means',
  title: 'K 均值聚类',
  tag: '迭代分配 + 均值更新',
  desc: '把点染成离它最近的那个质心的颜色，再把每个质心挪到它名下所有点的平均位置 —— 重复这两步，区域会自己「长」成一块块拼图。它不保证找到全局最优，只保证每一步都不会变差，所以最后一定停在一个局部最优上；初值选得不好就会卡在奇怪的分割上。',
  bg: '#04060d',
  params: [
    { key: 'k', label: '簇数 K', min: 2, max: 12, step: 1, value: 6 },
    { key: 'points', label: '点数', min: 60, max: 1200, step: 20, value: 420 },
    { key: 'speed', label: '迭代速度', min: 0.2, max: 4, step: 0.2, value: 1.2 },
  ],
  actions: [
    { key: 'reseed', label: '重新撒点' },
    { key: 'shuffle', label: '打乱质心' },
  ],
  create(ctx) {
    const buf = makeFieldBuffer(5)
    const MAXP = 1200
    const MAXK = 12
    let w = 800
    let h = 360
    let k = 6
    let nPoints = 420
    let speed = 1.2
    const px = new Float32Array(MAXP)
    const py = new Float32Array(MAXP)
    const cxs = new Float32Array(MAXK)
    const cys = new Float32Array(MAXK)
    let acc = 0

    const assignColor = () => makeRgbLut(Math.max(2, k), (v) => hsl2rgb(v * 360 + 10, 0.72, 0.55))
    let LUT = assignColor()

    const reseed = () => {
      /* 撒成几个高斯团 + 均匀噪声：比纯均匀更容易看出「聚类」的意义 */
      const clusterCount = Math.max(2, Math.round(k * 0.7))
      for (let i = 0; i < MAXP; i += 1) {
        if (Math.random() < 0.82) {
          const c = (Math.random() * clusterCount) | 0
          const cxx = ((c + 0.5) / clusterCount)
          px[i] = clamp(cxx + rand(-0.05, 0.05), 0, 1)
          py[i] = clamp(0.5 + rand(-0.16, 0.16), 0, 1)
        } else {
          px[i] = Math.random()
          py[i] = Math.random()
        }
      }
      shuffleCentroids()
    }

    const shuffleCentroids = () => {
      LUT = assignColor()
      for (let i = 0; i < MAXK; i += 1) {
        cxs[i] = Math.random()
        cys[i] = Math.random()
      }
    }

    const iterate = () => {
      const sx = new Float64Array(MAXK)
      const sy = new Float64Array(MAXK)
      const cnt = new Int32Array(MAXK)
      for (let i = 0; i < MAXP; i += 1) {
        if (i >= nPoints) break
        let best = 0
        let bd = Infinity
        for (let c = 0; c < k; c += 1) {
          const dd = (px[i] - cxs[c]) ** 2 + (py[i] - cys[c]) ** 2
          if (dd < bd) { bd = dd; best = c }
        }
        sx[best] += px[i]
        sy[best] += py[i]
        cnt[best] += 1
      }
      for (let c = 0; c < k; c += 1) {
        if (!cnt[c]) { cxs[c] = Math.random(); cys[c] = Math.random(); continue }
        cxs[c] = sx[c] / cnt[c]
        cys[c] = sy[c] / cnt[c]
      }
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        buf.resize(w, h)
        reseed()
      },
      frame(ts, dt) {
        acc += dt * speed * 3
        let guard = 0
        while (acc >= 1 && guard < 6) { acc -= 1; iterate(); guard += 1 }
        if (guard >= 6) acc = 0

        /* 区域图：每个像素归给最近的质心 —— 这就是 Voronoi 分割 */
        const d = buf.data
        const gw = buf.width
        const gh = buf.height
        for (let gy = 0; gy < gh; gy += 1) {
          const uy = (gy + 0.5) / gh
          const row = gy * gw
          for (let gx = 0; gx < gw; gx += 1) {
            const ux = (gx + 0.5) / gw
            let best = 0
            let bd = Infinity
            for (let c = 0; c < k; c += 1) {
              const dd = (ux - cxs[c]) ** 2 + (uy - cys[c]) ** 2
              if (dd < bd) { bd = dd; best = c }
            }
            const ci = best * 3
            const p = (row + gx) * 4
            d[p] = LUT[ci] * 0.28
            d[p + 1] = LUT[ci + 1] * 0.28
            d[p + 2] = LUT[ci + 2] * 0.28
            d[p + 3] = 255
          }
        }
        buf.blit(ctx, w, h)

        /* 点与质心 */
        for (let i = 0; i < MAXP; i += 1) {
          if (i >= nPoints) break
          ctx.fillStyle = 'rgba(235, 244, 255, 0.85)'
          ctx.fillRect(px[i] * w - 1, py[i] * h - 1, 2.2, 2.2)
        }
        for (let c = 0; c < k; c += 1) {
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(cxs[c] * w - 7, cys[c] * h)
          ctx.lineTo(cxs[c] * w + 7, cys[c] * h)
          ctx.moveTo(cxs[c] * w, cys[c] * h - 7)
          ctx.lineTo(cxs[c] * w, cys[c] * h + 7)
          ctx.stroke()
        }
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'k') { k = Math.min(MAXK, v); LUT = assignColor(); shuffleCentroids() }
        if (key === 'points') nPoints = Math.min(MAXP, v)
        if (key === 'speed') speed = v
      },
      action(key) {
        if (key === 'reseed') reseed()
        if (key === 'shuffle') shuffleCentroids()
      },
      destroy() {},
    }
  },
}

export default kMeans
