import { useI18n } from '@i18n/index.js'

export function OniChart({ history, latest, state }) {
  const { t } = useI18n()
  if (!history?.length) return null
  const W = 640
  const H = 220
  const PAD = { l: 44, r: 14, t: 14, b: 26 }
  const y = (v) => PAD.t + (1 - (v + 2.5) / 5) * (H - PAD.t - PAD.b) // 值域 -2.5 ~ +2.5
  const zero = y(0)
  const bw = (W - PAD.l - PAD.r) / history.length
  const colorAt = (v) => {
    if (v >= 2) return '#dc2626'
    if (v >= 1.5) return '#ef4444'
    if (v >= 0.5) return '#f87171'
    if (v <= -2) return '#1d4ed8'
    if (v <= -1.5) return '#2563eb'
    if (v <= -0.5) return '#60a5fa'
    return '#94a3b8'
  }
  return (
    <div className="o-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('ocean.chart.oniAria')}>
        {[2, 1, 0, -1, -2].map((tick) => (
          <g key={tick}>
            <line x1={PAD.l} y1={y(tick)} x2={W - PAD.r} y2={y(tick)}
              className={tick === 0 ? 'o-chart__zero' : 'o-chart__grid'} />
            <text x={PAD.l - 6} y={y(tick) + 3.5} textAnchor="end" className="o-chart__tick">
              {tick > 0 ? `+${tick}` : tick}
            </text>
          </g>
        ))}
        {history.map((h, i) => {
          const top = h.anom >= 0 ? y(h.anom) : zero
          const height = Math.abs(y(h.anom) - zero)
          return (
            <rect
              key={`${h.year}-${h.season}`}
              x={PAD.l + i * bw + 0.8}
              y={top}
              width={Math.max(2, bw - 1.6)}
              height={Math.max(1, height)}
              fill={colorAt(h.anom)}
              rx="1.5"
            >
              <title>{t('ocean.chart.oniBarTitle', {
                year: h.year,
                season: h.season,
                anom: `${h.anom >= 0 ? '+' : ''}${h.anom.toFixed(2)}`,
                sst: h.sst.toFixed(2),
              })}</title>
            </rect>
          )
        })}
        <text x={PAD.l} y={H - 8} className="o-chart__tick">{`${history[0].year} ${history[0].season}`}</text>
        <text x={W - PAD.r} y={H - 8} textAnchor="end" className="o-chart__tick">
          {`${latest.year} ${latest.season}`}
        </text>
      </svg>
      <div className="o-chart__caption">
        {t('ocean.chart.oniCaption', { year: latest.year, season: latest.season })}
        <b style={{ color: colorAt(latest.anom) }}> {latest.anom >= 0 ? '+' : ''}{latest.anom.toFixed(2)}（{state}）</b>
      </div>
    </div>
  )
}

export default OniChart
