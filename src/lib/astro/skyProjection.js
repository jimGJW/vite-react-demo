/**
 * 全天星图投影 —— 把「赤道坐标天体」转成「观测者头顶的方位角/高度角」。
 *
 * 为什么要自己写：
 *   星图要么用 d3-celestial（1MB+ 且要把整个渲染逻辑塞进去），
 *   要么手写。考虑到页面只需要「方位角 + 高度角」的二维图，
 *   手写这三十行换来的是零依赖、可单测、渲染完全可控。
 *
 * 数学链条（三步，每一步都可独立验证）：
 *   1. 儒略日 → 格林尼治平恒星时 GMST（地球自转 = 星空转动）
 *   2. 赤经 → 时角：HA = GMST + 经度 − 赤经
 *   3. 时角 + 赤纬 → 地平坐标：
 *        sin(alt) = sin(dec)sin(lat) + cos(dec)cos(lat)cos(HA)
 *        az       = atan2(−cos(dec)sin(HA), sin(dec)cos(lat) − cos(dec)sin(lat)cos(HA))
 *      方位角 az 自北起顺时针（0=正北，90=正东，180=正南，270=正西）。
 *
 * 精度：GMST 用 Meeus 简化式，误差约 ±1 角分（0.017°），
 * 对「今晚能不能看到某颗星」完全够用；真要做精密观测需接 JPL 星历。
 */

export const DEG = Math.PI / 180
export const RAD = 180 / Math.PI

/** 儒略日（UTC） */
export function julianDay(date) {
  return date.getTime() / 86400000 + 2440587.5
}

/**
 * 格林尼治平恒星时（小时，0–24）。
 *
 * Meeus《Astronomical Algorithms》12.4：
 *   T = (JD − 2451545.0)/36525（儒略世纪）
 *   GMST = 280.46061837 + 360.98564736629·(JD − 2451545.0) + 0.000387933·T²
 * 后一项 T² 在几千年尺度才有 1 秒量级影响，这里保留是为了量级完整。
 */
export function gmstHours(date) {
  const jd = julianDay(date)
  const d = jd - 2451545.0
  const t = d / 36525
  let h = (280.46061837 + 360.98564736629 * d + 0.000387933 * t * t) / 15
  h %= 24
  return h < 0 ? h + 24 : h
}

/**
 * 本地恒星时（小时）= GMST + 东经度数/15。
 * 东经为正（北京时间 120°E 加 8 小时），这是「天空跟着转」的本地基准。
 */
export function lstHours(date, lonDeg) {
  const h = gmstHours(date) + lonDeg / 15
  const m = h % 24
  return m < 0 ? m + 24 : m
}

/**
 * 天体的地平坐标。
 *
 * @param {number} raDeg  赤经（度，0–360）
 * @param {number} decDeg 赤纬（度，−90–90）
 * @param {number} latDeg 观测地纬度（度，北正）
 * @param {number} lonDeg 观测地经度（度，东正）
 * @param {Date}   date    观测时刻
 * @returns {{alt:number, az:number, ha:number}} 高度角/方位角/时角，单位度
 */
export function equatorialToHorizontal(raDeg, decDeg, latDeg, lonDeg, date) {
  const lst = lstHours(date, lonDeg) * 15 // 转回角度
  const ha = ((lst - raDeg) % 360 + 540) % 360 - 180 // 归一到 −180…180

  const haR = ha * DEG
  const decR = decDeg * DEG
  const latR = latDeg * DEG

  const sinAlt =
    Math.sin(decR) * Math.sin(latR) + Math.cos(decR) * Math.cos(latR) * Math.cos(haR)
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)))

  const az = Math.atan2(
    -Math.cos(decR) * Math.sin(haR),
    Math.sin(decR) * Math.cos(latR) - Math.cos(decR) * Math.sin(latR) * Math.cos(haR),
  )

  return {
    alt: alt * RAD,
    az: ((az * RAD) % 360 + 360) % 360,
    ha,
  }
}

/**
 * 极坐标 → 平面像素坐标（星图中心是天顶，向下为半径，右侧为方位角顺时针）。
 *
 * 用极坐标而非经纬网格画「地平投影」，好处是方位角刻度天然均匀——
 * 观测者真正关心的是「东南偏南 15 度」，而不是天球上等经度的某条经线。
 *
 * @param {number} azDeg   方位角（0–360，0=北，顺时针）
 * @param {number} altDeg  高度角（−90…90）
 * @param {number} size    画布边长（像素）
 * @param {number} rimAlt  圆周对应的地平线仰角（默认 0，即圆周就是地平线）
 */
export function skyToPixel(azDeg, altDeg, size, rimAlt = 0) {
  // 天顶(alt=90)→scale 0，圆周(alt=rimAlt)→scale 1
  const scale = (90 - altDeg) / (90 - rimAlt)
  const rad = azDeg * DEG
  const half = size / 2
  return {
    x: half + scale * half * Math.sin(rad),
    y: half - scale * half * Math.cos(rad),
    scale,
  }
}

/**
 * 大气折射修正。
 *
 * 为什么要修：星光穿过大气时被向下折弯，视线越贴近地平折得越厉害。
 * 不修的话，理论上刚好在地平线下的星星（比如刚日落的 Venus）
 * 在星图上会「看不见」，而实际肉眼能看到。
 *
 * 近似式（Bennett 公式，精度 0.1 角分以内）：
 *   R(角分) = 1.02 / tan((alt + 10.3/(alt+5.11))°)
 */
export function refractionDeg(altDeg) {
  if (altDeg < -1) return 0 // 已经远在地平线下，不必修
  const a = altDeg + 10.3 / (altDeg + 5.11)
  if (a <= 0) return 0
  return (1.02 / Math.tan(a * DEG)) / 60
}

/**
 * 星等 → 视圆点半径（像素）。
 *
 * 用指数而不是线性：全天星等跨度约 6 等（天狼 −1.4 到 6 等），
 * 线性映射会让暗星挤成不可见的一个点、天狼大得盖住一片星。
 * 2^(Δmag/2.5) 是「亮度比」，取其立方根后变化平缓且暗星仍可辨。
 */
export function magToRadius(mag, min = 0.6, max = 4.2) {
  const t = Math.max(0, Math.min(1, (6 - mag) / 7.4)) // −1.4 等→1，6 等→0
  return min + (max - min) * t
}

/**
 * 色指数 → 星色（返回 CSS 的 hsl 色相/饱和/亮度的偏置量）。
 *
 * B−V 色指数：−0.3 蓝白（参宿四）→ +1.8 橙红（心宿二）。
 * 人眼在暗夜里其实几乎分辨不出星色，但给一点点偏置能让星图层次更清楚，
 * 也顺带科普「为什么织女是蓝的、心宿二是红的」。
 */
export function bvToHue(bv) {
  const v = Number.isFinite(bv) ? bv : 0.6
  // −0.4 → 色相 210（蓝），+2.0 → 色相 20（橙红）
  return Math.max(20, Math.min(210, 210 - ((v + 0.4) / 2.4) * 190))
}
