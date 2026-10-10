import { Spin, Tag, Tooltip } from 'antd'

/* ---------- 小工具 ---------- */

const pad = (n) => String(n).padStart(2, '0')

/** 主题 localStorage 键。默认白昼——地球看板的底色。 */
const THEME_KEY = 'geoboard.theme'

function readTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return v === 'dark' ? 'dark' : 'light' // 默认 light，与 /astro 的 dark 相对
  } catch {
    return 'light'
  }
}

/** 毫秒时间戳 → 北京时间 HH:mm（地震列表用） */
function fmtBJT(ms) {
  if (!Number.isFinite(ms)) return '—'
  const d = new Date(ms + 8 * 3600_000)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

function fmtUTC(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '--:--:--'
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

/** 地震震源深度分级（USGS 惯例：浅源 <70km，中源 70–300km，深源 >300km） */
export function depthClass(depth) {
  if (depth == null) return { key: 'unknown', label: '未知', color: '#94a3b8' }
  if (depth < 70) return { key: 'shallow', label: '浅源', color: '#ef4444' }
  if (depth <= 300) return { key: 'mid', label: '中源', color: '#f59e0b' }
  return { key: 'deep', label: '深源', color: '#3b82f6' }
}

/** EU AQI 色阶（Open-Meteo 的 european_aqi）：数值越低越好 */
export function aqiLevel(aqi) {
  if (aqi == null) return { label: '—', color: '#94a3b8' }
  if (aqi <= 20) return { label: '优', color: '#0e9f6e' }
  if (aqi <= 40) return { label: '良', color: '#84cc16' }
  if (aqi <= 60) return { label: '轻度', color: '#f59e0b' }
  if (aqi <= 80) return { label: '中度', color: '#f97316' }
  if (aqi <= 100) return { label: '重度', color: '#ef4444' }
  return { label: '严重', color: '#a21caf' }
}

/** 震级 Tag 色阶（沿用地震速报习惯：5+ 红、4 橙、3 黄、其余灰） */
function magColor(mag) {
  if (mag == null) return '#94a3b8'
  if (mag >= 5) return '#ef4444'
  if (mag >= 4) return '#f97316'
  if (mag >= 3) return '#eab308'
  return '#94a3b8'
}

/** 卡片外壳：与 AstroBoard 的 Panel 同构（class 前缀 g-） */
function Panel({ title, source, icon, loading, error, children, extra }) {
  return (
    <section className="geo-panel">
      <header className="geo-panel__head">
        <div className="geo-panel__title">
          {icon}
          <h3>{title}</h3>
        </div>
        <div className="geo-panel__meta">
          {extra}
          {source && (
            <Tooltip title={`数据来源：${source}`}>
              <Tag className="geo-src-tag" bordered={false}>数据源</Tag>
            </Tooltip>
          )}
        </div>
      </header>
      <div className="geo-panel__body">
        {error ? (
          <div className="geo-fail">
            <span className="geo-fail__dot" />
            该数据源暂时不可用：{error}
          </div>
        ) : loading ? (
          <div className="geo-loading"><Spin size="small" /> 正在拉取实时数据…</div>
        ) : children}
      </div>
    </section>
  )
}

/** 数值 + 单位小块；info 直接内联一句释义（比 astro 的 KPI 词典轻量） */
function Metric({ label, value, unit, tone, info }) {
  const labelNode = info ? (
    <Tooltip title={info}>
      <span className="geo-metric__label is-info">{label}</span>
    </Tooltip>
  ) : (
    <span className="geo-metric__label">{label}</span>
  )
  return (
    <div className="geo-metric">
      <div className="geo-metric__val" style={tone ? { color: tone } : undefined}>
        {value}
        {unit && <span className="geo-metric__unit">{unit}</span>}
      </div>
      {labelNode}
    </div>
  )
}


export { Panel, Metric, pad, THEME_KEY, readTheme, fmtBJT, fmtUTC, magColor }
