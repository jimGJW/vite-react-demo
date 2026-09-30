/**
 * 场与流体 · 水波方程 —— 二维波动方程数值解
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { clamp, rand } from '../../utils/math.js'

const water = {
  id: 'water',
  title: '水波方程',
  tag: '二维波动方程数值解',
  desc: '两个高度场交替当「当前 / 上一帧」，用 h[n+1] = (邻域和)/2 - h[n-1] 迭代 —— 这就是离散化的二维波动方程。点一下加一个波源，波会真的反射、干涉、衰减。',
  bg: '#04060f',
  params: [
    { key: 'damp', label: '阻尼', min: 0.9, max: 0.999, step: 0.001, value: 0.986 },
    { key: 'drop', label: '落点强度', min: 40, max: 400, step: 10, value: 180 },
  ],
  actions: [
    { key: 'rain', label: '随便下点雨' },
    { key: 'calm', label: '静下来' },
  ],
  create(ctx) {
    /* 半分辨率网格：一半的像素，四分之一的计算量，放大后反而更柔和 */
    const RES = 2
    let w = 800
    let h = 360
    let gw = 0
    let gh = 0
    let cur = null
    let prev = null
    let damp = 0.986
    let drop = 180
    let off = null
    let offCtx = null
    let img = null

    const alloc = () => {
      gw = Math.floor(w / RES)
      gh = Math.floor(h / RES)
      cur = new Float32Array(gw * gh)
      prev = new Float32Array(gw * gh)
      off.width = gw
      off.height = gh
      offCtx = off.getContext('2d')
      img = offCtx.createImageData(gw, gh)
    }

    const splash = (gx, gy, amp, r) => {
      for (let y = -r; y <= r; y += 1) {
        for (let x = -r; x <= r; x += 1) {
          const xx = gx + x
          const yy = gy + y
          if (xx < 1 || yy < 1 || xx >= gw - 1 || yy >= gh - 1) continue
          const d = Math.hypot(x, y)
          if (d > r) continue
          cur[yy * gw + xx] -= amp * (1 - d / r)
        }
      }
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        if (!off) off = document.createElement('canvas')
        alloc()
        ctx.fillStyle = '#04060f'
        ctx.fillRect(0, 0, w, h)
        ctx.imageSmoothingEnabled = true
      },
      frame() {
        /* 波在边上反射而不是被吸收 —— 角落会出现漂亮的干涉条纹 */
        for (let y = 1; y < gh - 1; y += 1) {
          const row = y * gw
          for (let x = 1; x < gw - 1; x += 1) {
            const i = row + x
            const v = (cur[i - 1] + cur[i + 1] + cur[i - gw] + cur[i + gw]) * 0.5 - prev[i]
            prev[i] = v * damp
          }
        }
        const tmp = cur
        cur = prev
        prev = tmp

        const d = img.data
        for (let y = 1; y < gh - 1; y += 1) {
          const row = y * gw
          for (let x = 1; x < gw - 1; x += 1) {
            const i = row + x
            const v = cur[i]
            /* 用横向斜率当高光：波面朝向光源时才亮，看上去有水感 */
            const slope = cur[i + 1] - cur[i - 1]
            const lit = clamp(Math.abs(slope) * 0.09, 0, 1)
            const t = clamp(v * 0.012 + 0.5, 0, 1)
            const o = i * 4
            d[o] = clamp(12 + t * 40 + lit * 210, 0, 255)
            d[o + 1] = clamp(34 + t * 96 + lit * 225, 0, 255)
            d[o + 2] = clamp(74 + t * 150 + lit * 240, 0, 255)
            d[o + 3] = 255
          }
        }
        offCtx.putImageData(img, 0, 0)
        ctx.drawImage(off, 0, 0, w, h)
      },
      pointer(kind, x, y) {
        if (kind === 'down' || kind === 'move') splash(Math.round(x / RES), Math.round(y / RES), drop, 4)
      },
      setParam(k, v) {
        if (k === 'damp') damp = v
        if (k === 'drop') drop = v
      },
      action(key) {
        if (key === 'rain') {
          for (let i = 0; i < 14; i += 1) {
            splash(Math.round(rand(2, gw - 3)), Math.round(rand(2, gh - 3)), drop, 3)
          }
        }
        if (key === 'calm') {
          cur.fill(0)
          prev.fill(0)
        }
      },
      destroy() {},
    }
  },
}

export default water
