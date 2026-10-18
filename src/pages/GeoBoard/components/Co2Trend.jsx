import { useI18n } from '@i18n/index.js'

export function Co2Trend({ history, latest, growthPerYear }) {
  const { t } = useI18n()
  if (!history?.length) return null
  const W = 640
  const H = 210
  const PAD = { l: 44, r: 14, t: 14, b: 26 }
  const vals = history.map((h) => h.ppm)
  const min = Math.floor(Math.min(...vals) - 1)
  const max = Math.ceil(Math.max(...vals) + 1)
  const x = (i) => PAD.l + (i / (history.length - 1)) * (W - PAD.l - PAD.r)
  const y = (v) => PAD.t + (1 - (v - min) / (max - min)) * (H - PAD.t - PAD.b)
  const path = history.map((h, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(h.ppm).toFixed(1)}`).join(' ')
  const areaPath = `${path} L${x(history.length - 1).toFixed(1)},${H - PAD.b} L${PAD.l},${H - PAD.b} Z`
  const ticks = [min, (min + max) / 2, max].map((v) => Math.round(v))
  return (
    <div className="geo-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('geo.co2.aria')}>
        {/* 横向网格与 y 轴刻度 */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} y1={y(t)} x2={W - PAD.r} y2={y(t)} className="geo-chart__grid" />
            <text x={PAD.l - 6} y={y(t) + 3.5} textAnchor="end" className="geo-chart__tick">{t}</text>
          </g>
        ))}
        {/* 面积 + 折线 */}
        <path d={areaPath} className="geo-chart__area" />
        <path d={path} className="geo-chart__line" />
        {/* 最新值标注 */}
        <circle cx={x(history.length - 1)} cy={y(latest.ppm)} r="4" className="geo-chart__dot" />
        <text
          x={x(history.length - 1) - 8}
          y={y(latest.ppm) - 8}
          textAnchor="end"
          className="geo-chart__mark"
        >
          {latest.ppm.toFixed(2)} ppm
        </text>
        {/* x 轴起止标签 */}
        <text x={PAD.l} y={H - 8} className="geo-chart__tick">{history[0].ym}</text>
        <text x={W - PAD.r} y={H - 8} textAnchor="end" className="geo-chart__tick">{latest.ym}</text>
      </svg>
      <div className="geo-chart__caption">
        {t('geo.co2.caption', { growth: growthPerYear ?? '—' })}
      </div>
    </div>
  )
}

export default Co2Trend
