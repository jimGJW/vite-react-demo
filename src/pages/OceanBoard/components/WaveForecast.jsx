import { useMemo } from 'react'
import { useI18n } from '../../../i18n/index.js'
import { fmtSiteTime } from './ui.jsx'

/* ---------- 24h 浪高预报（5 站多线，自绘 SVG） ---------- */

const SPOT_COLORS = {
  qingdao: '#0ea5e9',
  yangtze: '#06b6d4',
  xiamen: '#14b8a6',
  shenzhen: '#3b82f6',
  sanya: '#6366f1',
}

export function WaveForecast({ spots }) {
  const { t } = useI18n()
  const series = useMemo(
    () =>
      (spots || [])
        .filter((s) => s.forecast?.length > 1)
        .map((s) => ({ ...s, color: SPOT_COLORS[s.key] || '#0ea5e9' })),
    [spots],
  )
  if (!series.length) return null
  const W = 640
  const H = 220
  const PAD = { l: 40, r: 14, t: 14, b: 26 }
  const max = Math.max(0.5, ...series.flatMap((s) => s.forecast.map((p) => p.h || 0))) * 1.15
  const n = series[0].forecast.length
  const x = (i) => PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r)
  const y = (v) => PAD.t + (1 - Math.max(0, v) / max) * (H - PAD.t - PAD.b)
  const ticks = [0, max / 2, max].map((v) => Number(v.toFixed(1)))
  return (
    <div className="o-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('ocean.chart.waveFcAria')}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.l} y1={y(tick)} x2={W - PAD.r} y2={y(tick)} className="o-chart__grid" />
            <text x={PAD.l - 6} y={y(tick) + 3.5} textAnchor="end" className="o-chart__tick">{tick}</text>
          </g>
        ))}
        {series.map((s) => (
          <path
            key={s.key}
            d={s.forecast.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.h || 0).toFixed(1)}`).join(' ')}
            className="o-chart__line"
            style={{ stroke: s.color }}
          >
            <title>{t('ocean.chart.waveFcBarTitle', { name: s.name })}</title>
          </path>
        ))}
        <text x={PAD.l} y={H - 8} className="o-chart__tick">{fmtSiteTime(series[0].forecast[0].t)}</text>
        <text x={W - PAD.r} y={H - 8} textAnchor="end" className="o-chart__tick">
          {`${fmtSiteTime(series[0].forecast[n - 1].t)}${t('ocean.time.beijing')}`}
        </text>
      </svg>
      <div className="o-chart__legend">
        {series.map((s) => (
          <span key={s.key}>
            <i style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
      <div className="o-chart__caption">
        {t('ocean.chart.waveFcCaption')}
      </div>
    </div>
  )
}

export default WaveForecast
