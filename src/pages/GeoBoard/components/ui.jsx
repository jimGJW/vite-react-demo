import { Spin, Tag, Tooltip } from 'antd'
// 震源深度分带 / AQI 分级 / 震级分档的阈值统一定义在词典里（唯一真源），
// 这里只做转发——否则「名词解释」写的阈值和页面上的颜色会各说各话。
import { depthClass, aqiLevel, magBand } from '../../../lib/earth/glossary.js'
import { useI18n } from '../../../i18n/index.js'

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

/** 震级 → 颜色（沿用分档色阶，M5–6 中震橙、M6+ 强震红） */
function magColor(mag) {
  return magBand(mag).color
}

export { depthClass, aqiLevel }

/** 卡片外壳：与 AstroBoard 的 Panel 同构（class 前缀 g-） */
function Panel({ title, source, icon, loading, error, children, extra }) {
  const { t } = useI18n()
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
            <Tooltip title={t('geo.ui.sourceTip', { source })}>
              <Tag className="geo-src-tag" bordered={false}>{t('geo.ui.sourceTag')}</Tag>
            </Tooltip>
          )}
        </div>
      </header>
      <div className="geo-panel__body">
        {error ? (
          <div className="geo-fail">
            <span className="geo-fail__dot" />
            {t('geo.ui.fail', { error })}
          </div>
        ) : loading ? (
          <div className="geo-loading"><Spin size="small" /> {t('geo.ui.loading')}</div>
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
