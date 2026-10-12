import { clamp } from '../../../components/Utils/index.js'

export { clamp }

/* ============================ 本地数学小工具（本页专用，不进公共模块） ============================ */

export const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1)
export const mapRange = (v, inMin, inMax, outMin, outMax) => (
  inMax === inMin ? outMin : outMin + ((clamp(v, inMin, inMax) - inMin) / (inMax - inMin)) * (outMax - outMin)
)

export const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i
export const hexToRgb = (hex) => {
  const m = HEX_RE.exec(String(hex ?? '').trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const num = parseInt(h, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}
export const rgbToHex = ({ r = 0, g = 0, b = 0 }) => {
  const to2 = (v) => clamp(Math.round(Number(v) || 0), 0, 255).toString(16).padStart(2, '0')
  return `#${to2(r)}${to2(g)}${to2(b)}`
}

/* ============================ 常量数据（模块级，避免每次渲染重建） ============================ */

export const NODES = [
  { id: 'host', label: '主应用', r: 15 },
  { id: 'vue', label: 'Vue 子应用', r: 13 },
  { id: 'ng', label: 'Angular 子应用', r: 13 },
  { id: 'router', label: 'router', r: 9 },
  { id: 'utils', label: 'utils', r: 9 },
  { id: 'kit', label: 'Kit', r: 9 },
  { id: 'charts', label: 'Charts', r: 8 },
  { id: 'store', label: 'store', r: 8 },
  { id: 'http', label: 'http', r: 8 },
]

export const LINKS = [
  ['host', 'vue'], ['host', 'ng'], ['vue', 'router'], ['vue', 'utils'],
  ['vue', 'kit'], ['ng', 'router'], ['ng', 'utils'], ['kit', 'charts'],
  ['vue', 'store'], ['utils', 'http'], ['ng', 'store'],
].map(([a, b]) => ({ a, b }))

export const WORDS = [
  { text: 'React 19', weight: 100 }, { text: 'Hooks', weight: 90 },
  { text: 'qiankun', weight: 80 }, { text: 'Suspense', weight: 72 },
  { text: 'useMemo', weight: 64 }, { text: '并发渲染', weight: 58 },
  { text: 'ECharts', weight: 52 }, { text: 'antd', weight: 48 },
  { text: 'canvas', weight: 44 }, { text: 'React Compiler', weight: 40 },
  { text: 'SSR', weight: 36 }, { text: '微前端', weight: 33 },
  { text: '虚拟滚动', weight: 30 }, { text: 'HMR', weight: 27 },
  { text: 'Runtime', weight: 24 }, { text: 'lazy', weight: 22 },
  { text: '虚拟 DOM', weight: 20 }, { text: 'memo', weight: 18 },
  { text: 'chunk', weight: 16 }, { text: '错误边界', weight: 15 },
]

export const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

/** 热力数据：双峰曲线（上午 10 点 + 下午 15 点），周末整体走低；模块级生成一次 */
export const HEAT = DAYS.map((day, d) => Array.from({ length: 24 }, (_, hour) => {
  const peak = 90 * Math.exp(-((hour - 10) ** 2) / 14) + 76 * Math.exp(-((hour - 15) ** 2) / 18)
  const weekend = d >= 5 ? 0.32 : 1
  const jitter = ((d * 31 + hour * 17) % 9)
  return { day, hour, value: Math.round(peak * weekend + jitter) }
}))

export const HEAT_FLAT = HEAT.flat()
export const HEAT_MAX = Math.max(...HEAT_FLAT.map((c) => c.value), 1)
export const HEAT_TOTAL = HEAT_FLAT.reduce((acc, c) => acc + c.value, 0)
export const HEAT_PEAK = HEAT_FLAT.reduce((best, c) => (c.value > best.value ? c : best), { day: '—', hour: 0, value: 0 })

/** 冷 → 暖色带（与子应用一致：浅蓝 → 靛 → 橙 → 朱） */
export const HEAT_STOPS = [
  { at: 0, hex: '#eef2ff' },
  { at: 0.45, hex: '#93c5fd' },
  { at: 0.72, hex: '#f59e0b' },
  { at: 1, hex: '#dc2626' },
]
export const heatColor = (ratio) => {
  const t = clamp(ratio, 0, 1)
  let lo = HEAT_STOPS[0]
  let hi = HEAT_STOPS[HEAT_STOPS.length - 1]
  for (let i = 0; i < HEAT_STOPS.length - 1; i += 1) {
    if (t >= HEAT_STOPS[i].at && t <= HEAT_STOPS[i + 1].at) {
      lo = HEAT_STOPS[i]
      hi = HEAT_STOPS[i + 1]
      break
    }
  }
  const k = (t - lo.at) / (hi.at - lo.at || 1)
  const a = hexToRgb(lo.hex)
  const b = hexToRgb(hi.hex)
  return rgbToHex({
    r: a.r + (b.r - a.r) * k,
    g: a.g + (b.g - a.g) * k,
    b: a.b + (b.b - a.b) * k,
  })
}
