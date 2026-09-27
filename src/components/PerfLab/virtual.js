/* =====================================================================
   虚拟滚动核心算法（零依赖纯函数）

   只做一件事：给定滚动位置，算出「哪几行真正需要渲染」。
   抽成纯函数的好处是不依赖 DOM / React，可以直接用 node 跑断言
   （见 tests/unit/perf-lab.test.mjs），不用开浏览器验证边界。
   ===================================================================== */

/** 把 n 夹在 [min, max] 区间内；非数字一律回落到 min */
export function clamp(n, min, max) {
  if (typeof n !== 'number' || Number.isNaN(n)) return min
  if (n < min) return min
  if (n > max) return max
  return n
}

/**
 * 计算可见行区间。
 *
 * @param {object}   o
 * @param {number}   o.scrollTop      容器已滚动的距离（px）
 * @param {number}   o.viewportHeight 容器可视高度（px）
 * @param {number}   o.itemHeight     每行固定高度（px）
 * @param {number}   o.total          数据总行数
 * @param {number}  [o.overscan]      上下各多渲染几行做缓冲，防止快速滚动露白
 * @returns {{
 *   start: number,       // 首个渲染行的下标（含）
 *   end: number,         // 末个渲染行的下标（不含）
 *   padTop: number,      // 上方占位高度，撑出正确的滚动条
 *   padBottom: number,   // 下方占位高度
 *   offsetTop: number,   // 渲染块相对滚动内容的 translateY 偏移
 *   totalHeight: number, // 全部行铺开的总高度
 *   rendered: number     // 本次实际渲染行数
 * }}
 */
export function computeVisibleRange(o = {}) {
  const {
    scrollTop = 0,
    viewportHeight = 0,
    itemHeight = 1,
    total = 0,
    overscan = 3,
  } = o

  const h = itemHeight > 0 ? itemHeight : 1          // 防除零
  const count = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0
  const scan = Number.isFinite(overscan) && overscan > 0 ? Math.floor(overscan) : 0
  const totalHeight = count * h

  if (count === 0) {
    return { start: 0, end: 0, padTop: 0, padBottom: 0, offsetTop: 0, totalHeight: 0, rendered: 0 }
  }

  const first = Math.floor(clamp(scrollTop, 0, Math.max(0, totalHeight - 1)) / h)
  const visible = Math.ceil(Math.max(viewportHeight, 0) / h)

  const start = clamp(first - scan, 0, count - 1)
  const end = clamp(first + visible + scan, 0, count)   // 开区间

  const padTop = start * h
  const padBottom = Math.max(0, totalHeight - end * h)

  return {
    start,
    end,
    padTop,
    padBottom,
    offsetTop: padTop,
    totalHeight,
    rendered: Math.max(0, end - start),
  }
}

/**
 * 帧率汇总：把「每帧间隔(ms)」数组折算成可读指标。
 *
 * @param {number[]} durations 每帧间隔（ms）
 * @param {number}  [budget]   单帧预算（ms），默认 16.67（60fps）
 * @returns {{
 *   frames: number, avgFps: number, minFps: number, maxFps: number,
 *   p95Fps: number, jank: number, jankRatio: number, worstFrame: number
 * }}
 */
export function summarizeFrames(durations = [], budget = 1000 / 60) {
  const list = Array.isArray(durations)
    ? durations.filter((d) => typeof d === 'number' && Number.isFinite(d) && d > 0)
    : []
  if (list.length === 0) {
    return {
      frames: 0, avgFps: 0, minFps: 0, maxFps: 0,
      p95Fps: 0, jank: 0, jankRatio: 0, worstFrame: 0,
    }
  }

  const sorted = [...list].sort((a, b) => a - b)
  const sum = list.reduce((s, d) => s + d, 0)
  const avg = sum / list.length
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
  const worst = sorted[sorted.length - 1]
  // 掉帧：单帧耗时超过两帧预算（>33ms），人眼已能察觉卡顿
  const jank = list.filter((d) => d > budget * 2).length

  const toFps = (ms) => Math.round((1000 / ms) * 10) / 10

  return {
    frames: list.length,
    avgFps: toFps(avg),
    minFps: toFps(worst),
    maxFps: toFps(sorted[0]),
    p95Fps: toFps(p95),
    jank,
    jankRatio: Math.round((jank / list.length) * 1000) / 10,
    worstFrame: Math.round(worst * 10) / 10,
  }
}

/**
 * 把 fps 序列映射成 SVG 折线的 points 属性。
 * 纯函数，方便单测：只算坐标，不碰 DOM。
 *
 * @param {number[]} series fps 采样值
 * @param {object}   box    画布尺寸 { width, height }
 * @param {number}  [max]   纵轴上限，默认 60（满帧）
 */
export function toPolylinePoints(series = [], box = { width: 240, height: 48 }, max = 60) {
  const { width = 240, height = 48 } = box
  const list = Array.isArray(series) ? series.filter((n) => typeof n === 'number') : []
  if (list.length === 0) return ''

  const top = max > 0 ? max : 60
  const stepX = list.length > 1 ? width / (list.length - 1) : 0

  return list
    .map((v, i) => {
      const x = Math.round(i * stepX * 10) / 10
      const ratio = clamp(v / top, 0, 1)
      const y = Math.round((height - ratio * height) * 10) / 10
      return `${x},${y}`
    })
    .join(' ')
}
