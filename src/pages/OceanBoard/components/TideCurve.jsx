import { useI18n } from '@i18n/index.js'
import { fmtSiteDay, fmtSiteTime } from './ui.jsx'

export function TideCurve({ series, latest, station }) {
  const { t } = useI18n()
  if (!series?.length) return null
  const W = 640
  const H = 220
  const PAD = { l: 44, r: 14, t: 14, b: 26 }
  const vals = series.map((p) => p.v)
  const min = Math.floor(Math.min(...vals) * 2) / 2 - 0.25
  const max = Math.ceil(Math.max(...vals) * 2) / 2 + 0.25
  const x = (i) => PAD.l + (i / (series.length - 1)) * (W - PAD.l - PAD.r)
  const y = (v) => PAD.t + (1 - (v - min) / (max - min)) * (H - PAD.t - PAD.b)
  const path = series.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')
  const areaPath = `${path} L${x(series.length - 1).toFixed(1)},${H - PAD.b} L${PAD.l},${H - PAD.b} Z`
  const ticks = [min, (min + max) / 2, max].map((v) => Number(v.toFixed(2)))
  const stName = station?.name || t('ocean.station.sf')
  return (
    <div className="o-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('ocean.chart.tideAria')}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.l} y1={y(tick)} x2={W - PAD.r} y2={y(tick)} className="o-chart__grid" />
            <text x={PAD.l - 6} y={y(tick) + 3.5} textAnchor="end" className="o-chart__tick">{tick}</text>
          </g>
        ))}
        {/* MLLW 零潮位基准线（平均较低低潮面，美国潮位站通用基准） */}
        {min < 0 && max > 0 && (
          <line x1={PAD.l} y1={y(0)} x2={W - PAD.r} y2={y(0)} className="o-chart__ref" strokeDasharray="5 4" />
        )}
        <path d={areaPath} className="o-chart__area" />
        <path d={path} className="o-chart__line" />
        <circle cx={x(series.length - 1)} cy={y(latest.v)} r="4" className="o-chart__dot" />
        <text
          x={x(series.length - 1) - 8}
          y={y(latest.v) - 8}
          textAnchor="end"
          className="o-chart__mark"
        >
          {latest.v.toFixed(2)} m · {fmtSiteTime(latest.t)}
        </text>
        <text x={PAD.l} y={H - 8} className="o-chart__tick">{fmtSiteDay(series[0].t)}</text>
        <text x={W - PAD.r} y={H - 8} textAnchor="end" className="o-chart__tick">
          {`${fmtSiteDay(latest.t)}${t('ocean.time.site')}`}
        </text>
      </svg>
      <div className="o-chart__caption">
        {t('ocean.chart.tideCaption', { station: stName })}
      </div>
    </div>
  )
}

export default TideCurve
