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
 * 分形与数学 · 曼德博集合 —— 逐行渐进渲染 + 平滑着色
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */

const mandelbrot = {
  id: 'mandelbrot',
  title: '曼德博集合',
  tag: '逐行渐进渲染 + 平滑着色',
  desc: '每一帧只算几行，所以缩到很深处也不会把页面卡死。着色用的是「逃逸时间的平滑版本」——把最后一个 |z| 取对数，色带就不会出现台阶。点画布放大、右键（或点左侧）缩回。',
  bg: '#000000',
  params: [
    { key: 'iter', label: '迭代上限', min: 60, max: 900, step: 20, value: 240 },
  ],
  actions: [
    { key: 'reset', label: '重置视角' },
    { key: 'cycle', label: '换配色' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let maxIter = 240
    let hueShift = 0
    let cx = -0.6
    let cy = 0
    let unit = 0 // 每个像素对应几个复平面单位
    let row = 0
    let img = null
    let needFrame = true

    const reset = () => {
      cx = -0.6
      cy = 0
      unit = 3.2 / Math.min(w, h)
      row = 0
      needFrame = true
    }

    const renderRows = (n) => {
      const d = img.data
      for (let r = 0; r < n && row < h; r += 1, row += 1) {
        const im = cy + (row - h / 2) * unit
        for (let x = 0; x < w; x += 1) {
          const re = cx + (x - w / 2) * unit
          let zr = 0
          let zi = 0
          let i = 0
          let zr2 = 0
          let zi2 = 0
          while (zr2 + zi2 <= 4 && i < maxIter) {
            zi = 2 * zr * zi + im
            zr = zr2 - zi2 + re
            zr2 = zr * zr
            zi2 = zi * zi
            i += 1
          }
          const o = (row * w + x) * 4
          if (i >= maxIter) {
            d[o] = 0
            d[o + 1] = 0
            d[o + 2] = 0
          } else {
            /* 平滑着色：去掉整数迭代次数造成的同心色阶 */
            const smooth = i + 1 - Math.log(Math.log(Math.sqrt(zr2 + zi2) + 1e-9) || 1) / Math.LN2
            const hue = (smooth * 14 + hueShift) % 360
            const light = 46 + 26 * Math.sin(smooth * 0.35)
            const rgb = hslToRgb(hue / 360, 0.85, light / 100)
            d[o] = rgb[0]
            d[o + 1] = rgb[1]
            d[o + 2] = rgb[2]
          }
          d[o + 3] = 255
        }
      }
      ctx.putImageData(img, 0, 0)
    }

    const hslToRgb = (hue, s, l) => {
      const k = (n) => (n + hue * 12) % 12
      const a = s * Math.min(l, 1 - l)
      const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
      return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        img = ctx.createImageData(w, h)
        reset()
      },
      frame() {
        if (row < h) renderRows(7)
        else if (needFrame) needFrame = false
      },
      pointer(kind, x, y) {
        if (kind !== 'down') return
        /* 点左边三分之一视为「缩回」，其余放大 —— 免得还要给右键加菜单 */
        if (x < w * 0.18) {
          unit *= 2.2
        } else {
          cx += (x - w / 2) * unit
          cy += (y - h / 2) * unit
          unit /= 2.4
        }
        row = 0
        needFrame = true
      },
      setParam(k, v) {
        if (k === 'iter') {
          maxIter = v
          row = 0
          needFrame = true
        }
      },
      action(key) {
        if (key === 'reset') reset()
        if (key === 'cycle') {
          hueShift = (hueShift + 60) % 360
          row = 0
          needFrame = true
        }
      },
      destroy() {},
    }
  },
}

export default mandelbrot
