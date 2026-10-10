import { Spin, Tag, Tooltip } from 'antd'

/* ---------- 小工具 ---------- */

const pad = (n) => String(n).padStart(2, '0')

/** 主题 localStorage 键。默认白昼——与 /astro 的 dark 相对。 */
const THEME_KEY = 'oceanboard.theme'

function readTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return v === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function fmtUTC(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '--:--:--'
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

/** '2026-10-10 05:19' → '05:19'（潮汐数据为站点当地时间，直接取串尾） */
function fmtSiteTime(t) {
  return typeof t === 'string' && t.length >= 16 ? t.slice(11, 16) : '—'
}

/** '2026-10-10 05:19' → '10-10 05:19' */
function fmtSiteDay(t) {
  return typeof t === 'string' && t.length >= 16 ? t.slice(5, 16) : '—'
}

/** 浪高分级（近海通行观感：0.5m 以下平靜，2m 以上需要警惕） */
export function waveLevel(h) {
  if (h == null) return { label: '—', color: '#94a3b8' }
  if (h < 0.3) return { label: '平静', color: '#0e9f6e' }
  if (h < 0.8) return { label: '轻浪', color: '#0ea5e9' }
  if (h < 1.5) return { label: '中浪', color: '#f59e0b' }
  if (h < 2.5) return { label: '大浪', color: '#f97316' }
  return { label: '巨浪', color: '#ef4444' }
}

/** 卡片外壳：与 GeoBoard 的 Panel 同构（class 前缀 o-） */
function Panel({ title, source, icon, loading, error, children, extra }) {
  return (
    <section className="o-panel">
      <header className="o-panel__head">
        <div className="o-panel__title">
          {icon}
          <h3>{title}</h3>
        </div>
        <div className="o-panel__meta">
          {extra}
          {source && (
            <Tooltip title={`数据来源：${source}`}>
              <Tag className="o-src-tag" bordered={false}>数据源</Tag>
            </Tooltip>
          )}
        </div>
      </header>
      <div className="o-panel__body">
        {error ? (
          <div className="o-fail">
            <span className="o-fail__dot" />
            该数据源暂时不可用：{error}
          </div>
        ) : loading ? (
          <div className="o-loading"><Spin size="small" /> 正在拉取实时数据…</div>
        ) : children}
      </div>
    </section>
  )
}

/** 数值 + 单位小块；info 内联一句释义 */
function Metric({ label, value, unit, tone, info }) {
  const labelNode = info ? (
    <Tooltip title={info}>
      <span className="o-metric__label is-info">{label}</span>
    </Tooltip>
  ) : (
    <span className="o-metric__label">{label}</span>
  )
  return (
    <div className="o-metric">
      <div className="o-metric__val" style={tone ? { color: tone } : undefined}>
        {value}
        {unit && <span className="o-metric__unit">{unit}</span>}
      </div>
      {labelNode}
    </div>
  )
}


export { Panel, Metric, pad, THEME_KEY, readTheme, fmtUTC, fmtSiteTime, fmtSiteDay }
