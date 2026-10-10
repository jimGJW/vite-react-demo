import { ORBIT_DATA } from '../orbitData.js'

export const { meta, sun: SUN, planets: BODIES } = ORBIT_DATA
export const SAMPLES = meta.samples
export const AU_KM = 149597870.7
export const DAY_MS = 86400000
export const EPOCH_MS = Date.parse(meta.epoch)
export const TAU = Math.PI * 2
export const DEG = Math.PI / 180

/** 默认锁定地球（它在数据里是第 3 项，下标 2） */
export const DEFAULT_PICK = 2

/* ============================ 纯函数 ============================ */

export const clamp = (n, min, max) => Math.min(Math.max(n, min), max)
export const lerp = (a, b, t) => a + (b - a) * t

/** #rrggbb → rgba(...) */
export const withAlpha = (hex, alpha) => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex ?? '').trim())
  if (!m) return hex
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/** 星体绘制半径：真实半径取对数压缩，否则木星要画成水星的 29 倍 */
export const sizeOf = (radiusKm) => Math.max(2.8, 3.0 + 2.6 * Math.log10(radiusKm / 2400))

/**
 * 径向压缩：把「日心距 r」映射成「画布半径 r'」。
 * 三个模式是刻意并列的对照 —— 越往下的模式把内侧拉开得越多，但相对间距就越不真实。
 */
export const COMPRESS = {
  /* r → r：1:1。海王星撑满画布时，水星只有 3.5px */
  linear: (r) => r,
  /* r → √r：折中，内行星能看清，外行星间距仍接近真实排序 */
  sqrt: (r) => Math.sqrt(r),
  /* r → log₁₀(1 + r/0.2)：最狠，八条轨道几乎等间距 */
  log: (r) => Math.log10(1 + r / 0.2),
}

export const SCALE_MODES = [
  { key: 'linear', label: '真实比例', hint: '1 : 1 线性 —— 内行星会挤进太阳的光晕里，这就是「真实比例下地球只有一个像素」' },
  { key: 'sqrt', label: '平方根', hint: 'r → √r —— 内行星拉开到看得见，外行星的相对间距还保留' },
  { key: 'log', label: '对数', hint: 'r → log₁₀(1 + r/0.2) —— 压缩最狠，八条轨道几乎等间距' },
]

/** 每种压缩模式下「最外圈」（海王星远日点）的压缩半径 —— 只跟模式有关，与画布尺寸无关 */
export const MAX_COMPRESSED = Object.fromEntries(
  SCALE_MODES.map(({ key }) => [key, COMPRESS[key](BODIES[BODIES.length - 1].aphelionAU)]),
)

/**
 * 按周期比例取当前位置（线性插值）。
 * 采样点下标 k 对应平近点角 M = meanAnomaly + 360·k/SAMPLES，而 M 与时间成正比，
 * 所以「按时间均匀」=「按下标均匀」，插值误差在屏幕上小于 0.04px。
 */
export const positionAt = (body, phase) => {
  const { x, y, z } = body.orbit
  const f = (((phase % 1) + 1) % 1) * SAMPLES
  const i0 = Math.floor(f) % SAMPLES
  const i1 = (i0 + 1) % SAMPLES
  const t = f - Math.floor(f)
  return {
    x: lerp(x[i0], x[i1], t),
    y: lerp(y[i0], y[i1], t),
    z: lerp(z[i0], z[i1], t),
  }
}

export const radiusOf = (p) => Math.hypot(p.x, p.y, p.z)

/**
 * 瞬时速度（km/s）：对 Python 给的相邻采样点做数值微分。
 * 相邻采样点的间隔恒为 P/SAMPLES 天，所以这就是 |Δr|/Δt，不需要再解任何方程。
 */
export const instantSpeed = (body, phase) => {
  const a = positionAt(body, phase)
  const b = positionAt(body, phase + 1 / SAMPLES)
  const dr = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)
  const dt = (body.periodDays / SAMPLES) * 86400
  return (dr * AU_KM) / dt
}

/** 由日心距判断跑到轨道哪一段了 */
export const phaseTextOf = (body, phase) => {
  const r = radiusOf(positionAt(body, phase))
  const mid = (body.perihelionAU + body.aphelionAU) / 2
  if (r < lerp(body.perihelionAU, mid, 0.34)) return '近日点附近（最快）'
  if (r < mid) return '离开近日点'
  if (r < lerp(mid, body.aphelionAU, 0.66)) return '接近远日点'
  return '远日点附近（最慢）'
}

/** 模拟时钟：起始历元 + 已流逝天数 */
export const simDate = (days) => {
  const d = new Date(EPOCH_MS + days * DAY_MS)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

export const formatDays = (days) => {
  const d = Math.max(0, days)
  if (d < 1000) return `${d.toFixed(1)} 天`
  if (d < 365250) return `${(d / 365.25).toFixed(2)} 年`
  return `${(d / 365250).toFixed(2)} 千年`
}

/** 命中测试：从最外层往回找（外层后画，压在上层） */
export function hitTest(el, screen, e) {
  if (!el) return -1
  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  for (let i = BODIES.length - 1; i >= 0; i -= 1) {
    const p = screen[i]
    if (!p) continue
    if (Math.hypot(p.x - x, p.y - y) <= sizeOf(BODIES[i].radiusKm) + 9) return i
  }
  return -1
}
