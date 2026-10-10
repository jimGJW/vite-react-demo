/**
 * 天文算法：坐标系换算 · 纯函数单测（零依赖）
 * 覆盖 src/lib/astro/orbital.js 里新增的三个换算函数。
 *
 * 为什么值得单测：
 *   这三个函数是「手写近似公式」，没有权威实现可对照，只能靠已知的物理基准点验证。
 *   基准点选错会让星图上的行星月亮整体偏位，而页面不会报任何错。
 */
import {
  eclipticToEquatorial,
  planetPositions,
  planetEquatorial,
  moonEquatorial,
  AU_TO_LY,
  LY_TO_AU,
  AU_LIGHT_MINUTES,
} from '../../src/lib/astro/orbital.js'
import { ok, eq, close } from './harness.mjs'

/** 黄赤交角（度）—— 地球轨道倾角，天文标准值 23.4393 */
const OBLIQUITY = 23.4393

export default [
  ['eclipticToEquatorial：春分点（λ=0, β=0）→ 赤经 0°、赤纬 0°', () => {
    const r = eclipticToEquatorial(0, 0)
    close(r.ra, 0, 0.001, '春分点赤经')
    close(r.dec, 0, 0.001, '春分点赤纬')
  }],

  ['eclipticToEquatorial：夏至点（λ=90°）→ 赤纬 = 黄赤交角', () => {
    const r = eclipticToEquatorial(90, 0)
    close(r.ra, 90, 0.001, '夏至点赤经')
    close(r.dec, OBLIQUITY, 0.01, '夏至点赤纬应等于黄赤交角')
  }],

  ['eclipticToEquatorial：冬至点（λ=270°）→ 赤纬 = −黄赤交角', () => {
    const r = eclipticToEquatorial(270, 0)
    close(r.ra, 270, 0.001, '冬至点赤经')
    close(r.dec, -OBLIQUITY, 0.01, '冬至点赤纬')
  }],

  ['eclipticToEquatorial：北天极（λ=90°, β=90−黄赤交角）→ 赤纬 90°', () => {
    // 北天极在黄道坐标里的黄纬恰好是 90−23.44 = 66.56°
    const r = eclipticToEquatorial(90, 90 - OBLIQUITY)
    close(r.dec, 90, 0.01, '北天极赤纬应为 90°')
  }],

  ['eclipticToEquatorial：南天极 → 赤纬 −90°', () => {
    const r = eclipticToEquatorial(270, -(90 - OBLIQUITY))
    close(r.dec, -90, 0.01, '南天极赤纬应为 −90°')
  }],

  ['eclipticToEquatorial：赤经始终归一化到 0–360', () => {
    for (let lon = -720; lon <= 720; lon += 17) {
      const r = eclipticToEquatorial(lon, 0)
      ok(r.ra >= 0 && r.ra < 360, `λ=${lon}° 得到越界赤经 ${r.ra}`)
      ok(r.dec >= -90.001 && r.dec <= 90.001, `λ=${lon}° 得到越界赤纬 ${r.dec}`)
    }
  }],

  ['eclipticToEquatorial：沿黄道一圈赤纬不超过黄赤交角', () => {
    // 黄道上的点投影到赤纬，理论上永远落在 ±23.44° 之内
    for (let lon = 0; lon < 360; lon += 5) {
      const r = eclipticToEquatorial(lon, 0)
      ok(
        Math.abs(r.dec) <= OBLIQUITY + 0.01,
        `λ=${lon}° 赤纬 ${r.dec.toFixed(2)}° 超出黄道带`,
      )
    }
  }],

  ['planetPositions：返回 8 颗行星（含地球），地球地心距恒为 0', () => {
    const planets = planetPositions(new Date('2026-10-10T00:00:00Z'))
    eq(planets.length, 8, '应返回水金地火木土天海 8 颗（含地球）')
    for (const p of planets) {
      ok(p.name && p.name.length > 0, '行星应有中文名')
      ok(Number.isFinite(p.geoLon), `${p.name} 黄经非数`)
    }
    // 地球到自己的地心距必然是 0，页面靠这一点显示「—」而不是 0.000 AU
    const earth = planets.find((p) => p.key === 'earth')
    ok(earth, '缺少地球')
    close(earth.geoDist, 0, 1e-9, '地球地心距应为 0')
    // 其余行星地心距下限是近日点，上限不超海王星远日点 + 地球远日点
    for (const p of planets) {
      if (p.key === 'earth') continue
      ok(p.geoDist > 0.3 && p.geoDist < 32, `${p.name} 地心距 ${p.geoDist} AU 超范围`)
    }
  }],

  ['planetEquatorial：水星地心距区间应覆盖真实近日/远日点', () => {
    // 真实值：水星近日点 0.307 AU、远日点 0.467 AU。
    // 因为「地心距」还叠加了地球的相对位置，全年扫到的极值约 0.56–1.45 AU。
    // 断言放宽到这个区间即可——它的作用是抓住「把日心距当日心距返回」这类错误。
    let min = Infinity
    let max = 0
    for (let d = 0; d < 365; d += 5) {
      const merc = planetPositions(new Date(Date.UTC(2026, 0, 1 + d))).find(
        (p) => p.key === 'mercury',
      )
      if (!merc) continue
      min = Math.min(min, merc.geoDist)
      max = Math.max(max, merc.geoDist)
    }
    ok(min > 0.45 && min < 0.70, `水星地心距最小值 ${min.toFixed(3)} AU 偏离真实值 0.56 太多`)
    ok(max > 1.2 && max < 1.60, `水星地心距最大值 ${max.toFixed(3)} AU 偏离真实值 1.44 太多`)
  }],

  ['planetEquatorial：行星赤纬应落在黄道带内', () => {
    for (const p of planetPositions(new Date('2026-10-10T00:00:00Z'))) {
      const eqc = planetEquatorial(p)
      ok(
        Number.isFinite(eqc.ra) && Number.isFinite(eqc.dec),
        `${p.name} 赤道坐标非数`,
      )
      ok(eqc.ra >= 0 && eqc.ra < 360, `${p.name} 赤经越界 ${eqc.ra}`)
      // 行星本身在黄道附近，但轨道倾角（如冥王星）会让赤纬略微超出；
      // 内行星用低精度开普勒近似，偏差在 1° 内足够用
      ok(
        Math.abs(eqc.dec) < 30,
        `${p.name} 赤纬 ${eqc.dec.toFixed(1)}° 偏离黄道带过多，可能算错了`,
      )
    }
  }],

  ['moonEquatorial：月球赤纬始终在 ±28.6° 内', () => {
    // 黄白交角约 28.6°，月球赤纬不可能超出这个范围
    for (let d = 0; d < 400; d += 7) {
      const m = moonEquatorial(new Date(Date.UTC(2026, 0, 1 + d)))
      ok(
        Math.abs(m.dec) <= 28.7,
        `${d} 天后月球赤纬 ${m.dec.toFixed(2)}° 超出黄白交角`,
      )
    }
  }],

  ['moonEquatorial：恒星月（27.32 天）后赤经回到原位', () => {
    const t0 = moonEquatorial(new Date('2026-01-01T00:00:00Z'))
    const t1 = moonEquatorial(new Date('2026-01-28T07:40:00Z'))
    // 角差归一化到 −180…180
    const diff = ((t1.ra - t0.ra + 540) % 360) - 180
    close(diff, 0, 3, '恒星月后赤经应回到原位（残差应 < 3°）')
  }],

  ['moonEquatorial：新月时月球靠近太阳（赤经差小）', () => {
    // 2026-01-18 前后是新月：日月的黄经差应接近 0
    let minDiff = 360
    for (let d = 0; d < 32; d++) {
      const date = new Date(Date.UTC(2026, 0, 1 + d))
      const sun = eclipticToEquatorial(dateToEclipticLon(date), 0)
      const moon = moonEquatorial(date)
      const diff = Math.abs(((moon.ra - sun.ra + 540) % 360) - 180)
      minDiff = Math.min(minDiff, 180 - diff)
    }
    ok(minDiff < 15, `整个月里日月赤经最小差 ${minDiff.toFixed(1)}°，说明找月算法有误`)
  }],

  ['AU_TO_LY：1 天文单位 = 1.58e-5 光年（不是 63241）', () => {
    // 1 AU = 1.495978707e8 km，1 光年 = 9.4607e12 km
    close(AU_TO_LY, 1.495978707e8 / 9.4607e12, 1e-12, 'AU → 光年')
    close(AU_TO_LY, 1.5813e-5, 1e-8, 'AU → 光年量级')
    // LY_TO_AU 是它的倒数，约 63241——曾经把这两个数搞反过
    close(LY_TO_AU, 63241, 5, '1 光年 = 63241 AU')
  }],

  ['AU_LIGHT_MINUTES：阳光走完 1 AU 约 8.3 分钟', () => {
    close(AU_LIGHT_MINUTES, 8.32, 0.05, '光行时间')
  }],
]

/** 太阳的地心黄经（几何近似，精度对本测试足够） */
function dateToEclipticLon(date) {
  const jd = date.getTime() / 86400000 + 2440587.5
  const n = jd - 2451545.0
  const L = (280.46 + 0.9856474 * n) % 360
  return L < 0 ? L + 360 : L
}