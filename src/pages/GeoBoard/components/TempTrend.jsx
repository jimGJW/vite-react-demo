/**
 * 全球地表温度距平（NASA GISTEMP）：年度柱状图，红暖蓝冷。
 *
 * 「距平柱状图」比折线更有冲击力：每根柱子是一整年的温度，
 * 一眼就能看到「早年几乎全蓝、近三十年几乎全红」这个结构性转变——
 * 折线图会把这种转变柔化成一条斜线。
 */
import { useI18n } from '../../../i18n/index.js'

export default function TempTrend({ annual, latest12, lastYear, warmest, baseline }) {
  const { t } = useI18n()
  if (!annual?.length) return null
  const W = 640
  const H = 210
  const PAD = { l: 44, r: 14, t: 14, b: 26 }
  const vals = annual.map((a) => a.anom)
  const min = Math.floor(Math.min(...vals) * 2) / 2 - 0.1
  const max = Math.ceil(Math.max(...vals) * 2) / 2 + 0.1
  const bw = (W - PAD.l - PAD.r) / annual.length
  const y = (v) => PAD.t + (1 - (v - min) / (max - min)) * (H - PAD.t - PAD.b)
  const zero = y(0)
  const ticks = [min, 0, max].filter((v, i, arr) => arr.indexOf(v) === i)
  // 暖色（红）/ 冷色（蓝）按距平符号取，透明度按绝对值加深
  const barColor = (v) => {
    const t = Math.min(1, Math.abs(v) / 0.8)
    return v >= 0 ? `rgba(239,68,68,${0.35 + t * 0.6})` : `rgba(59,130,246,${0.35 + t * 0.6})`
  }
  return (
    <div className="geo-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('geo.temp.aria')}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} y1={y(t)} x2={W - PAD.r} y2={y(t)} className="geo-chart__grid" />
            <text x={PAD.l - 6} y={y(t) + 3.5} textAnchor="end" className="geo-chart__tick">
              {t > 0 ? `+${t}` : t.toFixed(1)}
            </text>
          </g>
        ))}
        {/* 零线（= 基准期均值）单独加重 */}
        <line x1={PAD.l} y1={zero} x2={W - PAD.r} y2={zero} className="geo-chart__ref" />
        {annual.map((a, i) => (
          <rect
            key={a.year}
            x={PAD.l + i * bw + 0.5}
            y={Math.min(y(a.anom), zero)}
            width={Math.max(1.6, bw - 1)}
            height={Math.abs(zero - y(a.anom))}
            fill={barColor(a.anom)}
            rx="1"
          >
            <title>{t('geo.temp.barTitle', { year: a.year, val: `${a.anom >= 0 ? '+' : ''}${a.anom.toFixed(2)}` })}</title>
          </rect>
        ))}
        <text x={PAD.l} y={H - 8} className="geo-chart__tick">{annual[0].year}</text>
        <text x={W - PAD.r} y={H - 8} textAnchor="end" className="geo-chart__tick">
          {annual[annual.length - 1].year}
        </text>
      </svg>
      <div className="geo-chart__caption">
        {t('geo.temp.caption', {
          baseline,
          warmestYear: warmest.year,
          warmestAnom: warmest.anom.toFixed(2),
          lastYear: lastYear.year,
          lastAnom: lastYear.anom.toFixed(2),
          latest12: latest12 != null ? latest12.toFixed(2) : '—',
        })}
      </div>
    </div>
  )
}
