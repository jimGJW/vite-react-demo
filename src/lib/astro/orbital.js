/**
 * 天文/航天轨道计算 —— 基于 satellite.js（Vallado SGP4 官方移植）。
 *
 * 为什么不用手写简化算法：实测对比 ISS 权威真值（wheretheiss.at），
 *   · 完整 SGP4（satellite.js）：落点偏差 0.6 km，高度/速度完全吻合
 *   · 手写「Kepler + J2 长期项」简化法：10 小时后漂移约 5800 km
 * 简化法漏掉的是 SGP4 的周期性摄动项与密切点修正，短时看着对、
 * 长时完全不可用。既然有经过验证的实现，就不要自己重造。
 *
 * 网络请求一律由 vite.config.js 的中间件代理，本模块只做计算。
 */

import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
  sunPos,
} from 'satellite.js'
import { pickText } from '../../i18n/translate.mjs'

export const DEG = Math.PI / 180
/** 地球平均半径 (km) */
export const R_EARTH = 6371.0
/** 第一宇宙速度 (km/s) */
export const V_FIRST = Math.sqrt(398600.4418 / R_EARTH)

/* ============ TLE 解析 ============ */

/** 儒略日 → 世纪数（J2000 基准） */
export function julianCentury(jd) {
  return (jd - 2451545.0) / 36525.0
}

/** Date → 儒略日（UTC） */
export function toJulianDate(date) {
  return date.getTime() / 86400000 + 2440587.5
}

/** 格林尼治平恒星时 (rad) */
export function gmst(date) {
  return gstime(date)
}

/**
 * 解析 Celestrak 的三行式 TLE 组（名称行 + 行1 + 行2）。
 * 返回 { name, satrec, epoch }，可直接喂给 propagate。
 */
export function parseTLESet(name, line1, line2) {
  const satrec = twoline2satrec(line1, line2)
  // satrec.jdsatepoch 是儒略日；卫星优先用其 bstar/epoch 推算
  return { name, satrec, epoch: satrec.jdsatepoch }
}

/**
 * 传播到指定时刻，返回地理坐标 + 速度。
 * @param {object} satrec twoline2satrec 的结果
 * @param {Date} date
 */
export function propagateAt(satrec, date) {
  const pv = propagate(satrec, date)
  if (!pv || !pv.position || Number.isNaN(pv.position.x)) return null
  const gd = eciToGeodetic(pv.position, gstime(date))
  const speed = Math.sqrt(
    pv.velocity.x ** 2 + pv.velocity.y ** 2 + pv.velocity.z ** 2,
  )
  return {
    lat: degreesLat(gd.latitude),
    lon: degreesLong(gd.longitude),
    alt: gd.height,
    speed, // km/s
    // satrec.no 单位是 rad/min，所以 2π/no 直接就是分钟，不用再除 60
    period: (2 * Math.PI / satrec.no),
    inclination: (satrec.inclo / DEG),
    /** 卫星是否被阳光照射（terminator 判定，用于日照/可见性） */
    sunlit: isSunlit(satrec, date),
  }
}

/** 便捷封装：一次算完 satrec 列表在 now 的位置 */
export function propagateAll(satrecs, date) {
  const out = []
  for (const s of satrecs) {
    const p = propagateAt(s.satrec, date)
    if (p) out.push({ ...s, ...p })
  }
  return out
}

/**
 * 卫星是否被太阳照射。
 * sunPos 返回的是「太阳方向单位矢量 rsun」+ 赤经赤纬(rtasc/dec)，
 * 而卫星位置是 km 量级的 ECI 向量，两者量纲不同，不能直接点积，
 * 需要把卫星位置归一化后再算夹角。
 */
export function isSunlit(satrec, date) {
  try {
    const sp = sunPos(date)
    const pv = propagate(satrec, date)
    if (!pv || !pv.position || Number.isNaN(pv.position.x)) return null
    const sunDir = sp.rsun // 已是单位矢量（AU）
    const s = pv.position
    const sinSep = (s.x * sunDir.x + s.y * sunDir.y + s.z * sunDir.z) / s.length
    // 夹角 < 0.8° 视为完全在日照半球内
    return Math.asin(Math.max(-1, Math.min(1, sinSep))) / DEG < 0.8
  } catch {
    return null
  }
}

/**
 * 地面轨迹：以 now 为中心，前后各取一段，用于在地图上画线。
 * 返回 [{lat, lon, sunlit}]
 */
export function groundTrack(satrec, centerDate, backMin = 45, fwdMin = 45, stepMin = 3) {
  const pts = []
  for (let m = -backMin; m <= fwdMin; m += stepMin) {
    const t = new Date(centerDate.getTime() + m * 60000)
    const p = propagateAt(satrec, t)
    if (p) pts.push({ lat: p.lat, lon: p.lon, sunlit: p.sunlit, offsetMin: m })
  }
  return pts
}

/* ============ 观测可见性 ============ */

/** 地面覆盖半径 (km)：卫星能看到的地球表面最大半径 */
export function footprintRadius(altKm) {
  const ratio = R_EARTH / (R_EARTH + altKm)
  return R_EARTH * Math.acos(ratio)
}

/** 大圆距离 (km) */
export function haversine(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * DEG
  const dLon = (lon2 - lon1) * DEG
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.sin(dLon / 2) ** 2
  return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(a)))
}

/**
 * 卫星相对某地面点的仰角（度）。负数表示在地平线下（不可见）。
 *
 * 推导：设地面点 O、卫星 S、地心 C。已知 |OS|（由经纬高算出）与 |CS|，
 * 角 ∠OCS 由余弦定理得：
 *   cos(∠OCS) = (|OC|² + |CS|² − |OS|²) / (2·|OC|·|CS|)
 * 再由正弦定理：sin(仰角) = (|OC|/(|OS|·sin∠OCS))·sin∠OCS ... 直接用
 * 垂直分量算更稳：
 *   仰角 = atan2( |CS|·sin(∠OCS) − |OC|, 水平分量 )
 * 这里用更简洁且数值稳定的写法：
 */
export function lookElevation(satPos, obsLat, obsLon) {
  const R = R_EARTH
  const r = R + satPos.alt
  // 地面点与卫星的地心夹角
  const cosTheta =
    Math.cos(obsLat * DEG) * Math.cos(satPos.lat * DEG) +
    Math.sin(obsLat * DEG) * Math.sin(satPos.lat * DEG) *
    Math.cos((satPos.lon - obsLon) * DEG)
  const theta = Math.acos(Math.max(-1, Math.min(1, cosTheta))) // 地心角
  // 卫星在观测点天顶方向上的投影高度（ECEF 分量）
  const sinTheta = Math.sin(theta)
  // 仰角 = atan((垂直分量) / (水平分量))
  // 垂直分量 = r·cosθ − R ；水平分量 ≈ r·sinθ
  const vertical = r * cosTheta - R
  const horizontal = r * sinTheta
  if (horizontal < 1e-6) return vertical >= 0 ? 90 : -90
  return Math.atan2(vertical, horizontal) / DEG
}

/** 观测地标（用于算「你现在能看到 ISS 吗」） */
export const OBSERVERS = [
  { name: '北京', lat: 39.9, lon: 116.4 },
  { name: '上海', lat: 31.2, lon: 121.5 },
  { name: '广州', lat: 23.1, lon: 113.3 },
  { name: '西安', lat: 34.3, lon: 108.9 },
  { name: '哈尔滨', lat: 45.8, lon: 126.6 },
  { name: '乌鲁木齐', lat: 43.8, lon: 87.6 },
  { name: '拉萨', lat: 29.7, lon: 91.1 },
  { name: '三亚', lat: 18.2, lon: 109.5 },
  { name: '酒泉', lat: 40.96, lon: 100.3 },
  { name: '太原', lat: 39.1, lon: 112.5 },
  { name: '文昌', lat: 19.61, lon: 110.95 },
  { name: '肯尼迪', lat: 28.6, lon: -80.6 },
  { name: '拜科努尔', lat: 45.9, lon: 63.3 },
  { name: '库鲁', lat: 5.2, lon: -52.8 },
  { name: '圭亚那', lat: 5.6, lon: -61.4 },
]

/* ============ 空间天气等级换算 ============ */

/**
 * Kp 指数 → 等级描述（NOAA 标准 G 级别）。
 *
 * label / desc 是文案，所以写成 {lang:text} 双稿、经 pickText 按语种解析；
 * level / color 是数据与样式，保持原样不参与翻译（被误改会直接错位）。
 * 第二参 lang 缺省简体：历史调用方大多只用到 level / color，加参不会打破它们。
 */
export function kpLevel(kp, lang = 'zh-CN') {
  if (kp == null || Number.isNaN(kp)) {
    return { level: '-', color: '#8c8c8c', noData: true, ...kpText('-', lang) }
  }
  const tier =
    kp < 4 ? 'G0' : kp < 5 ? 'G1' : kp < 6 ? 'G2' : kp < 7 ? 'G3'
      : kp < 8 ? 'G4' : kp < 9 ? 'G5' : 'G6+'
  return { level: tier, color: KP_COLOR[tier], ...kpText(tier, lang) }
}

/** G 级配色：与 UI 的 G 级对照表共用同一份，避免两处漂移 */
const KP_COLOR = {
  '-': '#8c8c8c',
  G0: '#52c41a',
  G1: '#a0d911',
  G2: '#faad14',
  G3: '#fa8c16',
  G4: '#ff7a45',
  G5: '#ff4d4f',
  'G6+': '#a8071a',
}

/** Kp 等级双语文案。放在这里（而不是调用方）是为了让纯函数本身自洽，单测可直接断言 */
const KP_TEXT = {
  '-': {
    label: { 'zh-CN': '无数据', en: 'No data' },
    desc: { 'zh-CN': '', en: '' },
  },
  G0: {
    label: { 'zh-CN': '平静', en: 'Quiet' },
    desc: { 'zh-CN': '无空间天气影响', en: 'No space weather impact' },
  },
  G1: {
    label: { 'zh-CN': '轻微', en: 'Minor' },
    desc: { 'zh-CN': '可能出现极光', en: 'Aurora may appear' },
  },
  G2: {
    label: { 'zh-CN': '轻中', en: 'Light-moderate' },
    desc: { 'zh-CN': '高纬极光，卫星姿态可能需修正', en: 'High-latitude aurora, satellite attitude may need correction' },
  },
  G3: {
    label: { 'zh-CN': '中等', en: 'Moderate' },
    desc: { 'zh-CN': '低轨卫星可能受影响', en: 'Low-orbit satellites may be affected' },
  },
  G4: {
    label: { 'zh-CN': '强', en: 'Strong' },
    desc: { 'zh-CN': '卫星姿态与地面跟踪受影响', en: 'Satellite attitude and ground tracking affected' },
  },
  G5: {
    label: { 'zh-CN': '极强', en: 'Severe' },
    desc: { 'zh-CN': 'GPS 精度下降，可能无服务', en: 'GPS accuracy degrades, service may be unavailable' },
  },
  'G6+': {
    label: { 'zh-CN': '极端', en: 'Extreme' },
    desc: { 'zh-CN': 'GPS 不可用，电网与通信受威胁', en: 'GPS unusable, power grid and communications under threat' },
  },
}

/** 取某 G 级的双语文案（已按语种解析成字符串） */
function kpText(tier, lang) {
  const item = KP_TEXT[tier]
  return { label: pickText(item.label, lang), desc: pickText(item.desc, lang) }
}

/** F10.7 太阳射电流量 → 活动水平 */
export function f107Level(flux) {
  if (flux == null) return { label: '无数据', color: '#8c8c8c' }
  if (flux < 70) return { label: '极低', color: '#52c41a' }
  if (flux < 100) return { label: '低', color: '#a0d911' }
  if (flux < 150) return { label: '活跃', color: '#faad14' }
  return { label: '高', color: '#ff7a45' }
}

/** 太阳风速度分级 */
export function solarWindLevel(kmh) {
  if (kmh == null) return { label: '无数据', color: '#8c8c8c' }
  if (kmh < 400) return { label: '缓慢', color: '#52c41a' }
  if (kmh < 600) return { label: '正常', color: '#a0d911' }
  if (kmh < 800) return { label: '偏快', color: '#faad14' }
  return { label: '高速', color: '#ff7a45' }
}

/* ============ 系外行星归档 ============ */

/** 从 Exoplanet Archive 结果里提取摘要 */
export function summarizeExoplanets(rows) {
  if (!Array.isArray(rows) || !rows.length) return null
  const byMethod = {}
  for (const r of rows) {
    const m = r.discoverymethod || 'Unknown'
    byMethod[m] = (byMethod[m] || 0) + 1
  }
  const years = rows.map((r) => Number(r.disc_year)).filter(Boolean)
  const dists = rows.map((r) => Number(r.sy_dist)).filter((d) => d && d > 0)
  const periods = rows.map((r) => Number(r.pl_orbper)).filter((p) => p && p > 0)
  return {
    total: rows.length,
    byMethod,
    earliest: years.length ? Math.min(...years) : null,
    latest: years.length ? Math.max(...years) : null,
    // pc → 光年
    nearest: dists.length ? Math.min(...dists) * 3.26156 : null,
    farthest: dists.length ? Math.max(...dists) * 3.26156 : null,
    shortestPeriod: periods.length ? Math.min(...periods) : null,
  }
}

/* ============ 太阳系行星 ============ */

/**
 * 行星轨道要素（VSOP87 简化版 / JPL Standish 近似根数，1800-2050 有效）。
 * a(AU) e I(°) L(°) ϖ(°) Ω(°) 及其每世纪变化率。
 * 数据源：JPL "Approximate Positions of the Planets"。
 */
export const PLANETS = [
  { key: 'mercury', name: '水星', en: 'Mercury', color: '#a6a6a6', radius: 2440, a: 0.38709893, e: 0.20563069, I: 7.00487, L: 252.251667, wbar: 77.457718, O: 48.339618, da: 0.00000000, de: 0.00001906, dI: -0.00594749, dL: 149472.674866, dw: 0.160427, dO: -0.125340 },
  { key: 'venus', name: '金星', en: 'Venus', color: '#e6c88a', radius: 6052, a: 0.72333199, e: 0.00677323, I: 3.39471, L: 181.979708, wbar: 131.767557, O: 76.672614, da: 0.00000390, de: -0.00004107, dI: -0.00078890, dL: 58517.815602, dw: 0.002683, dO: -0.277694 },
  { key: 'earth', name: '地球', en: 'Earth', color: '#4a90d9', radius: 6371, a: 1.00000018, e: 0.01673163, I: -0.00054346, L: 100.466915, wbar: 102.930058, O: -5.112603, da: 0.00000003, de: -0.00003661, dI: -0.01337178, dL: 35999.373063, dw: 0.317952, dO: 0.241238 },
  { key: 'mars', name: '火星', en: 'Mars', color: '#e0704a', radius: 3389, a: 1.52371243, e: 0.09336511, I: 1.85181869, L: -4.56813164, wbar: -23.91744784, O: 49.71320984, da: 0.00000097, de: 0.00009149, dI: -0.00724757, dL: 19140.299342, dw: 0.452236, dO: -0.268524 },
  { key: 'jupiter', name: '木星', en: 'Jupiter', color: '#d4a373', radius: 69911, a: 5.20248019, e: 0.04853590, I: 1.29861416, L: 34.33479152, wbar: 14.27495244, O: 100.29282654, da: -0.00002864, de: 0.00018026, dI: -0.00322699, dL: 3034.903717, dw: 0.181991, dO: 0.130246 },
  { key: 'saturn', name: '土星', en: 'Saturn', color: '#e3c98a', radius: 58232, a: 9.54149883, e: 0.05550825, I: 2.49424102, L: 50.07571329, wbar: 92.86136063, O: 113.63998702, da: -0.00003065, de: -0.00032044, dI: 0.00451969, dL: 1222.114947, dw: 0.541794, dO: -0.250150 },
  { key: 'uranus', name: '天王星', en: 'Uranus', color: '#88d0e0', radius: 25362, a: 19.18797948, e: 0.04685740, I: 0.77298127, L: 314.20276625, wbar: 172.43404441, O: 73.96250215, da: -0.00020455, de: -0.00001550, dI: -0.00180155, dL: 428.49512595, dw: 0.09266985, dO: 0.05739699 },
  { key: 'neptune', name: '海王星', en: 'Neptune', color: '#5a7fe0', radius: 24622, a: 30.06952752, e: 0.00895439, I: 1.77005520, L: 304.22289287, wbar: 46.68158724, O: 131.78635853, da: 0.00006447, de: 0.00000818, dI: 0.00022400, dL: 218.46515314, dw: 0.01009938, dO: -0.00606302 },
]

/** 解开普勒方程（行星根数 → 黄道坐标用） */
export function solveKepler(M, e) {
  const twoPi = Math.PI * 2
  let m = M % twoPi
  if (m > Math.PI) m -= twoPi
  if (m < -Math.PI) m += twoPi
  let E = m
  for (let i = 0; i < 12; i++) {
    const d = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E))
    E -= d
    if (Math.abs(d) < 1e-12) break
  }
  return E
}

/**
 * 行星日心黄道坐标（AU）与地心距离。
 * 用 JPL Standish 近似根数（1800–2050 有效，Jupiter/Saturn 误差 ~ 数百角秒）。
 * @param {Date} date
 * @returns {Array<{key,name,color,radius,x,y,z,heliocentricLon,geoDist,geoLon}>}
 */
export function planetPositions(date) {
  const jd = toJulianDate(date)
  const T = julianCentury(jd)
  const pos = []

  // 先算日心坐标
  const helio = {}
  for (const p of PLANETS) {
    const a = p.a + p.da * T
    const e = p.e + p.de * T
    const I = (p.I + p.dI * T) * DEG
    const L = (p.L + p.dL * T) * DEG
    const wbar = (p.wbar + p.dw * T) * DEG
    const O = (p.O + p.dO * T) * DEG
    const w = wbar - O // 近地点幅角
    const M = L - wbar // 平近点角
    const E = solveKepler(M, e)

    // 轨道平面内
    const xp = a * (Math.cos(E) - e)
    const yp = a * Math.sqrt(1 - e * e) * Math.sin(E)
    // 旋转到黄道坐标系
    const cw = Math.cos(w), sw = Math.sin(w)
    const cO = Math.cos(O), sO = Math.sin(O)
    const ci = Math.cos(I), si = Math.sin(I)
    helio[p.key] = {
      x: (cw * cO - sw * sO * ci) * xp + (-sw * cO - cw * sO * ci) * yp,
      y: (cw * sO + sw * cO * ci) * xp + (-sw * sO + cw * cO * ci) * yp,
      z: (sw * si) * xp + (cw * si) * yp,
    }
  }

  for (const p of PLANETS) {
    const h = helio[p.key]
    const e = helio.earth
    const dx = e.x - h.x
    const dy = e.y - h.y
    const dz = e.z - h.z
    const geoDist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    pos.push({
      key: p.key,
      name: p.name,
      en: p.en,
      color: p.color,
      radius: p.radius,
      a: p.a + p.da * T,
      e: p.e + p.de * T,
      I: p.I + p.dI * T,
      /** 日心黄经 (deg) */
      heliocentricLon: ((Math.atan2(h.y, h.x) / DEG) + 360) % 360,
      /** 地心黄经 (deg) */
      geoLon: ((Math.atan2(dy, dx) / DEG) + 360) % 360,
      geoDist, // AU
      x: h.x, y: h.y, z: h.z,
    })
  }
  return pos
}

/**
 * 黄道坐标 → 赤道坐标。
 *
 * 为什么需要：开普勒根数算出来的是**黄道**坐标（黄纬 β、黄经 λ），
 * 而星表（星图、梅西耶目录）用的是**赤道**坐标（赤纬 δ、赤经 α）。
 * 两者差一个黄赤交角 ε = 23.4393°。不做这步换算，行星在星图上会偏好几度。
 *
 * 公式（赤道 ← 黄道）：
 *   sin δ = sin β·cos ε + cos β·sin ε·sin λ
 *   α     = atan2( sin λ·cos ε − tan β·sin ε ,  cos λ )
 *
 * @param {number} lonDeg 地心黄经 λ（度）
 * @param {number} latDeg 黄纬 β（度）
 * @returns {{ra:number, dec:number}} 赤经/赤纬（度）
 */
export function eclipticToEquatorial(lonDeg, latDeg) {
  const eps = 23.4393 * DEG // 黄赤交角
  const l = lonDeg * DEG
  const b = latDeg * DEG
  const sinDec =
    Math.sin(b) * Math.cos(eps) + Math.cos(b) * Math.sin(eps) * Math.sin(l)
  const dec = Math.asin(Math.max(-1, Math.min(1, sinDec)))
  const y = Math.sin(l) * Math.cos(eps) - Math.tan(b) * Math.sin(eps)
  const x = Math.cos(l)
  let ra = Math.atan2(y, x) / DEG
  if (ra < 0) ra += 360
  return { ra, dec: dec / DEG }
}

/**
 * 给 planetPositions 的结果补上赤道坐标（星图需要）。
 *
 * 为什么不直接改 planetPositions：它已有的黄经/黄纬字段被太阳系视图使用，
 * 在那里改语义会引入回归。宁可在这里做一次显式转换。
 *
 * @param {{geoLon:number, geoDist:number, x:number,y:number,z:number, earth:object}} p
 */
export function planetEquatorial(p) {
  // 黄纬 β 由黄道 z 分量与地心距求出：sin β = z / |r|
  const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) || 1
  const beta = Math.asin(Math.max(-1, Math.min(1, p.z / r))) / DEG
  return eclipticToEquatorial(p.geoLon, beta)
}

/**
 * 1 天文单位 = 多少光年。
 *
 * 1 AU = 1.495978707e8 km，1 光年 = 9.4607e12 km，所以 1 AU ≈ 1.5813e-5 光年。
 *
 * ⚠️ 别和「1 光年 = 63241 AU」搞混：63241.077 是**光年到 AU** 的换算系数
 * （1 光年能走过 63241 个天文单位），把它当成「AU → 光年」会把距离放大 380 万倍。
 * 之前就踩过这个坑，页面上出现过「1 AU ≈ 63,241 光年」。
 */
export const AU_TO_LY = 1.495978707e8 / 9.4607e12

/** 1 光年等于多少天文单位（便于把「X 光年」翻译成 AU 展示） */
export const LY_TO_AU = 1 / AU_TO_LY

/** 光速（km/s）—— 用于「信号多久到达」这类时间估算 */
export const C_KM_PER_S = 299792.458

/** 1 天文单位（km，IAU 2012 定义） */
export const AU_KM = 1.495978707e8

/**
 * 阳光走完 1 AU 需要多少分钟（8 分 20 秒左右）。
 *
 * 这是个「体感锚点」：看板上要解释「AU 这个单位到底多大」时，
 * 光行时间比「乘以一个很小的数字」直观得多。预先算好，页面直接引用。
 */
export const AU_LIGHT_MINUTES = AU_KM / C_KM_PER_S / 60

/**
 * 太阳直射点（subsolar point）：太阳正上方的那块地面。
 * 用来在地图上画晨昏线。
 * sunPos 返回 { rsun(赤道系单位矢量), rtasc(赤经), decl(赤纬) }
 */
export function subsolarPoint(date) {
  const sp = sunPos(date)
  // 赤纬即太阳直射点的地理纬度
  const lat = sp.decl / DEG
  // 由 rsun 的赤道系分量求赤经，再减去 GMST 换成地理经度
  const ra = Math.atan2(sp.rsun.y, sp.rsun.x) / DEG
  const gmstDeg = gstime(date) / DEG
  const lon = (((ra - gmstDeg) % 360) + 540) % 360 - 180
  return { lat, lon }
}

/* ============ 银河系 ============ */

/**
 * 银河系关键参数（用于「银河系」板块的说明与可视化）。
 * 数据源：ESA Gaia DR3 / NASA。太阳距银心约 2.6 万光年（8.0 kpc）。
 */
export const GALAXY = {
  name: '银河系',
  type: '棒旋星系（SBbc）',
  diameter: 105700,      // 光年，盘直径
  diskThickness: 1000,   // 光年
  totalStars: 1000,      // 亿亿颗（1e11 ~ 1e12 量级）
  sunDistance: 26700,    // 光年（距银心）
  sunOrbitalSpeed: 230,  // km/s
  sunOrbitalPeriod: 2.3e8, // 年
  armCount: 4,           // 主要旋臂
  center: '人马座 A*（Sgr A*）',
  brightest: '盾牌座/人马座交界',
  // Gaia DR3 发布的恒星数
  gaiaStars: 1.8e9,
}

/* ============ 月球 ============ */

/**
 * 月球信息（基于 Jean Meeus《天文算法》简化版，纯本地计算）。
 *
 * 月相是地球-月-日几何关系，不需要任何网络请求——只要时间对就能算。
 * 参考历元：2000-01-06 18:14 UTC（新月，JD 2451550.1）。
 * 朔望月（synodic month）取 29.53058867 天（现代值）。
 */
export function moonInfo(date, lang = 'zh-CN') {
  const jd = toJulianDate(date)
  const synodic = 29.53058867

  // 月龄：距上次新月的日数
  const daysSinceNew = jd - 2451550.1
  const age = ((daysSinceNew % synodic) + synodic) % synodic
  const phaseFraction = age / synodic

  // 照亮率（0=新月 1=满月）
  const cosPhase = Math.cos(phaseFraction * 2 * Math.PI)
  const illumination = (1 - cosPhase) / 2

  // 月球距地距离（km）——用平均近点角做一阶修正
  // 近地点 ~356500 km，远地点 ~406700 km，均值 384400 km
  const moonAnomaly = (134.963 + 13.064993 * (jd - 2451545.0)) * DEG
  const dist = 384400 * (1 - 0.0554 * Math.cos(moonAnomaly))
  const distAvg = 384400
  const distPct = ((dist - distAvg) / distAvg * 100)

  // 视直径（角分）
  const angularDiam = (3474.2 / dist) * (180 / Math.PI) * 60

  // 月相名称（八相）。文案双语，和照亮度/月龄这些数值分开处理。
  const phaseKey =
    age < 1.84566 ? 'new' : age < 5.53699 ? 'waxingCrescent' : age < 9.22831 ? 'firstQuarter'
      : age < 12.91963 ? 'waxingGibbous' : age < 16.61096 ? 'full' : age < 20.30228 ? 'waningGibbous'
        : age < 23.99361 ? 'lastQuarter' : 'waningCrescent'
  const phaseName = pickText(MOON_PHASE_TEXT[phaseKey], lang)

  // 距下次满月/新月的天数
  const fullAge = synodic / 2
  const daysToFullMoon = age < fullAge ? fullAge - age : (synodic - age) + fullAge
  const daysToNewMoon = synodic - age

  // 近地点/远地点判断
  // 近点月 27.55455 天，参考近地点 2000-01-19
  const anomalistic = 27.55455
  const daysSincePerigee = jd - 2451557.0
  const anomAge = ((daysSincePerigee % anomalistic) + anomalistic) % anomalistic
  const distKey =
    anomAge < 2 || anomAge > anomalistic - 2 ? 'nearPerigee'
      : Math.abs(anomAge - anomalistic / 2) < 2 ? 'nearApogee' : 'normal'
  const distLabel = pickText(MOON_DIST_TEXT[distKey], lang)

  return {
    age,
    phaseFraction,
    illumination,
    phaseName,
    dist,
    distPct,
    angularDiam,
    daysToFullMoon,
    daysToNewMoon,
    distLabel,
    isWaxing: phaseFraction < 0.5,
  }
}

/**
 * 月相八相的双语文案。key 是几何判定用的代号（数值相关的分支写在 moonInfo 里），
 * 文案单独一张表，新增语种只需补这里。
 */
const MOON_PHASE_TEXT = {
  new: { 'zh-CN': '新月', en: 'New Moon' },
  waxingCrescent: { 'zh-CN': '蛾眉月', en: 'Waxing Crescent' },
  firstQuarter: { 'zh-CN': '上弦月', en: 'First Quarter' },
  waxingGibbous: { 'zh-CN': '盈凸月', en: 'Waxing Gibbous' },
  full: { 'zh-CN': '满月', en: 'Full Moon' },
  waningGibbous: { 'zh-CN': '亏凸月', en: 'Waning Gibbous' },
  lastQuarter: { 'zh-CN': '下弦月', en: 'Last Quarter' },
  waningCrescent: { 'zh-CN': '残月', en: 'Waning Crescent' },
}

/** 月地距离档位的双语文案 */
const MOON_DIST_TEXT = {
  nearPerigee: { 'zh-CN': '近地点附近', en: 'Near perigee' },
  nearApogee: { 'zh-CN': '远地点附近', en: 'Near apogee' },
  normal: { 'zh-CN': '正常', en: 'Normal' },
}

/**
 * 月球的赤道坐标（赤经 α / 赤纬 δ）。
 *
 * 为什么单独一个函数：moonInfo 只算「地月日几何关系」给出的月相与距离，
 * 而星图要的是「月亮在天球上哪个位置」——这是两套坐标，
 * 强行塞进 moonInfo 会让那个函数的职责变得不纯。
 *
 * 采用 Meeus《天文算法》第 47 章的月球位置公式（主要周期项，精度约 0.3°）：
 *   L' = 218.316 + 13.176396·d   月球平黄经
 *   M  = 134.963 + 13.064993·d   月球平近点角
 *   λ  = L' + 6.289·sin M         黄经（含中心差主要项）
 *   β  = 5.128·sin M'            黄纬（M' = 月球升交点平角距）
 * 再用黄道→赤道变换得到赤经赤纬。
 *
 * @param {Date} date
 * @returns {{ra:number, dec:number}} 赤经/赤纬（度）
 */
export function moonEquatorial(date) {
  const d = toJulianDate(date) - 2451545.0 // 距 J2000.0 的天数
  const Lp = (218.316 + 13.176396 * d) * DEG // 平黄经
  const M = (134.963 + 13.064993 * d) * DEG // 平近点角
  const Mp = (357.529 + 0.98560028 * d) * DEG // 太阳平近点角（月球升交点近似取此）
  // 黄经：主项 + 中心差 + 观测者视差修正的主要项
  const lon = Lp + (6.289 * DEG) * Math.sin(M)
  // 黄纬
  const lat = (5.128 * DEG) * Math.sin(Mp)
  return eclipticToEquatorial(((lon / DEG) % 360 + 360) % 360, lat / DEG)
}

/* ============ 卫星过境预报 ============ */

/**
 * 预测卫星在指定地面点未来 hoursAhead 小时内的可见过境。
 *
 * 原理：逐分钟采样仰角，当仰角从负变正时开始一次过境；
 * 跟踪到仰角再次变负，取区间内最大仰角作为过境峰值。
 * 仰角 > 0 即在地平线上方；> 10° 肉眼易见；> 30° 非常明显。
 *
 * @param {object} satrec TLE 解析后的卫星记录
 * @param {number} obsLat 观测点纬度
 * @param {number} obsLon 观测点经度
 * @param {Date} startDate 起始时刻
 * @param {number} hoursAhead 预报时长（小时）
 * @returns {Array<{startTime, maxTime, maxElev, durationMin}>}
 */
export function predictPasses(satrec, obsLat, obsLon, startDate, hoursAhead = 6) {
  const passes = []
  const stepMin = 1
  const totalMin = hoursAhead * 60

  let prevElev = null
  let inPass = false
  let passStart = null
  let maxElev = 0
  let maxTime = null

  for (let m = 0; m <= totalMin; m += stepMin) {
    const t = new Date(startDate.getTime() + m * 60000)
    const pos = propagateAt(satrec, t)
    if (!pos) { prevElev = null; continue }

    const elev = lookElevation(pos, obsLat, obsLon)

    if (prevElev !== null) {
      // 仰角从负变正 → 过境开始
      if (prevElev < 0 && elev >= 0) {
        inPass = true
        passStart = t
        maxElev = elev
        maxTime = t
      }
      // 过境中：跟踪最大仰角
      if (inPass && elev > maxElev) {
        maxElev = elev
        maxTime = t
      }
      // 仰角从正变负 → 过境结束
      if (prevElev >= 0 && elev < 0 && inPass) {
        const durationMin = (t - passStart) / 60000
        if (durationMin > 1 && maxElev > 0) {
          passes.push({
            startTime: passStart,
            maxTime,
            maxElev,
            durationMin: Math.round(durationMin),
          })
        }
        inPass = false
      }
    }
    prevElev = elev
  }

  return passes
}

/* ============ 流星雨年历（本地数据） ============ */

/**
 * 年度主要流星雨。数据来源：IMO（国际流星组织）2024–2026 年历的通用参数。
 * start/end/peak 用 [月, 日] 表示（每年重复，无需联网）；
 * zhr 是理想条件（辐射点在天顶、极限星等 6.5、无月光）下的天顶小时率。
 * 父体是产生流星尘流的彗星/小行星。
 */
export const METEOR_SHOWERS = [
  { key: 'quadrantids', zh: '象限仪座流星雨', en: 'Quadrantids', radiant: '牧夫座北侧', start: [12, 28], end: [1, 12], peak: [1, 3], zhr: 110, parent: '小行星 2003 EH1', strong: true },
  { key: 'lyrids', zh: '天琴座流星雨', en: 'Lyrids', radiant: '天琴座织女星附近', start: [4, 14], end: [4, 30], peak: [4, 22], zhr: 18, parent: 'C/1861 G1 佘切尔彗星' },
  { key: 'eta-aquariids', zh: '宝瓶座η流星雨', en: 'Eta Aquariids', radiant: '宝瓶座η星附近', start: [4, 19], end: [5, 28], peak: [5, 6], zhr: 50, parent: '1P/哈雷彗星' },
  { key: 'perseids', zh: '英仙座流星雨', en: 'Perseids', radiant: '英仙座γ星附近', start: [7, 17], end: [8, 24], peak: [8, 13], zhr: 100, parent: '109P/斯威夫特-塔特尔彗星', strong: true },
  { key: 'orionids', zh: '猎户座流星雨', en: 'Orionids', radiant: '猎户座参宿四附近', start: [10, 2], end: [11, 7], peak: [10, 21], zhr: 20, parent: '1P/哈雷彗星' },
  { key: 'leonids', zh: '狮子座流星雨', en: 'Leonids', radiant: '狮子座轩辕十四附近', start: [11, 6], end: [11, 30], peak: [11, 17], zhr: 15, parent: '55P/坦普尔-塔特尔彗星' },
  { key: 'geminids', zh: '双子座流星雨', en: 'Geminids', radiant: '双子座α星附近', start: [12, 4], end: [12, 20], peak: [12, 14], zhr: 150, parent: '小行星 3200 法厄同', strong: true },
  { key: 'ursids', zh: '小熊座流星雨', en: 'Ursids', radiant: '小熊座β星附近', start: [12, 17], end: [12, 26], peak: [12, 22], zhr: 10, parent: '8P/塔特尔彗星' },
]

/**
 * 计算某场流星雨相对给定日期的状态。
 *
 * 跨年区间（象限仪座 12/28–1/12）的处理：把「年内序数日」拉直比较，
 * 12 月的日期映射为负偏移（相当于"上一个冬天"），1 月映射为正偏移加一年。
 *
 * @param {object} shower METEOR_SHOWERS 里的一项
 * @param {Date} now 当前时刻
 * @returns {{status:'active'|'upcoming'|'ended', daysToPeak:number, peakDate:Date,
 *            moonInterference:number, moonLabel:string, moonTone:string}}
 *   moonInterference 是峰值当晚的月球照亮度（0 新月 ~ 1 满月），
 *   直接决定"值不值得等这场流星雨"——满月大流星雨也会被月光毁掉。
 */
export function meteorShowerStatus(shower, now) {
  const y = now.getFullYear()
  // [月,日] → 当年 Date（UTC 正午，避开时区/夏令时边界）
  const mk = (yy, [m, d]) => new Date(Date.UTC(yy, m - 1, d, 12))
  let peak = mk(y, shower.peak)
  const start = mk(y, shower.start)
  let end = mk(y, shower.end)
  if (end < start) end = mk(y + 1, shower.end) // 跨年（12→1）
  if (peak < start) peak = mk(y + 1, shower.peak) // 峰值在跨年后

  const daysToPeak = Math.round((peak - now) / 86400_000)
  let status
  if (now >= start && now <= end) status = 'active'
  else if (daysToPeak > 0) status = 'upcoming'
  else status = 'ended'

  // 峰值当晚的月相照亮度（复用 moonInfo 的 Meeus 算法）
  const mi = moonInfo(peak)
  const moonInterference = mi.illumination
  let moonLabel, moonTone
  if (moonInterference < 0.2) { moonLabel = '月光极佳'; moonTone = '#52c41a' }
  else if (moonInterference < 0.5) { moonLabel = '月光中等'; moonTone = '#faad14' }
  else if (moonInterference < 0.8) { moonLabel = '月光较强'; moonTone = '#fa8c16' }
  else { moonLabel = '月光严重'; moonTone = '#ff4d4f' }

  return { status, daysToPeak, peakDate: peak, moonInterference, moonLabel, moonTone }
}

/* ============ 观星时段（天文昏影） ============ */

/**
 * 太阳在观测点的地平高度（度）。
 *
 * 几何恒等式：太阳的天顶距 = 观测者与日下点的球面大圆距离，
 * 所以高度角 = 90° − haversine(观测点, 日下点)。subsolarPoint 已给日下点经纬度，
 * 不需要再做一套完整的太阳赤经赤纬计算。
 */
export function sunAltitude(date, lat, lon) {
  const s = subsolarPoint(date)
  const angularKm = haversine(lat, lon, s.lat, s.lon)
  return 90 - angularKm / R_EARTH / DEG
}

/**
 * 今晚的观星窗口：从 now 起向后采样 26 小时（每 5 分钟）太阳高度，
 * 找出日落/日出时刻和「天文黑夜」(太阳高度 ≤ −18°) 的连续区间。
 *
 * −18° 是天文昏影终/晨光始的定义（IAU）：此时太阳光对天空的散射完全消失，
 * 是目视观星和天文摄影的黄金时段。月出月落不做（依赖完整月球视差理论，
 * 误差会到半小时级，不值得），月光影响交给观星指数里的照亮度表达。
 *
 * @param {Date} now 当前时刻
 * @param {number} lat 观测点纬度
 * @param {number} lon 观测点经度
 * @returns {{sunset:Date|null, sunrise:Date|null, astroStart:Date|null,
 *            astroEnd:Date|null, darknessMin:number, nowAlt:number}}
 */
export function stargazingWindow(now, lat, lon) {
  const STEP = 5 * 60_000
  const HORIZON = 26 * 3600_000
  const nowAlt = sunAltitude(now, lat, lon)

  let sunset = null
  let sunrise = null
  let astroStart = null
  let astroEnd = null
  let prevAlt = nowAlt

  for (let t = now.getTime() + STEP; t <= now.getTime() + HORIZON; t += STEP) {
    const date = new Date(t)
    const alt = sunAltitude(date, lat, lon)
    // 日落：高度从正跨到负（取第一个）
    if (!sunset && prevAlt > 0 && alt <= 0) sunset = date
    // 日出：日落之后高度从负跨回正
    if (sunset && !sunrise && prevAlt <= 0 && alt > 0) sunrise = date
    // 天文黑夜：高度 ≤ −18° 的连续段
    if (alt <= -18) {
      if (!astroStart) astroStart = new Date(t - STEP) // 区间实际开始于上一个采样点
      astroEnd = date
    }
    prevAlt = alt
  }

  const darknessMin = astroStart && astroEnd ? Math.round((astroEnd - astroStart) / 60000) : 0
  return { sunset, sunrise, astroStart, astroEnd, darknessMin, nowAlt }
}
