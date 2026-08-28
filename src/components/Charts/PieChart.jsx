import { useState } from 'react'
import {
  useMounted, polar, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, PALETTE, DEFAULT_FORMAT,
} from './shared.jsx'

function sectorPath(cx, cy, r, a0, a1) {
  const start = polar(cx, cy, r, a0)
  const end = polar(cx, cy, r, a1)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`
}

/**
 * 饼图（扇区 + 图例）。
 * @param {Array<{label:string,value:number,color?:string}>} props.data
 * @param {boolean} [props.showLabel=false] 扇区百分比标签
 * @param {boolean} [props.showLegend=true] 图例
 * 其余通用参数见 LineChart。
 */
export default function PieChart({
  data = [], size = 320, palette = PALETTE,
  formatValue = DEFAULT_FORMAT, unit = '', className = '',
  title, subtitle, description, actions, emptyText, loading = false,
  legend = true, onPointClick,
  showLabel = false, showTitle = true,
}) {
  const mounted = useMounted()
  const [hover, setHover] = useState(-1)
  const header = <ChartHeader title={title} subtitle={subtitle} description={description} actions={actions} showTitle={showTitle} />

  if (loading) return <div className={`chart chart-pie ${className}`}>{header}<ChartSkeleton height={size} /></div>
  if (!data.length) return <div className={`chart chart-pie ${className}`}>{header}<ChartEmpty text={emptyText} /></div>

  const total = data.reduce((s, d) => s + d.value, 0)
  const safeTotal = total > 0 ? total : 1
  const cx = size / 2, cy = size / 2, r = size * 0.4
  let angle = -90
  const sectors = data.map((d, i) => {
    const sweep = (d.value / safeTotal) * 360
    const a0 = angle, a1 = angle + sweep, mid = a0 + sweep / 2
    const path = sweep >= 360 ? null : sectorPath(cx, cy, r, a0, a1)
    angle = a1
    return { ...d, i, a0, a1, mid, path, pct: d.value / safeTotal, color: d.color || palette[i % palette.length] }
  })
  const single = sectors.length === 1
  const tip = hover >= 0 ? sectors[hover] : null
  const tipPt = tip ? polar(cx, cy, r * 0.6, tip.mid) : null

  return (
    <div className={`chart chart-pie ${className}`}>
      {header}
      <div className="chart-pie-canvas">
        <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="饼图">
          {single ? (
            <circle cx={cx} cy={cy} r={r} fill={sectors[0].color} className="chart-pie-sector" />
          ) : (
            sectors.map((s) => {
              const offset = polar(0, 0, 8, s.mid)
              const labelPt = polar(cx, cy, r * 0.7, s.mid)
              return (
                <g key={s.i}>
                  <path d={s.path} fill={s.color}
                    className={`chart-pie-sector ${mounted ? 'is-in' : ''} ${hover === s.i ? 'is-hover' : ''}`}
                    style={{ transform: hover === s.i ? `translate(${offset.x}px, ${offset.y}px)` : 'translate(0,0)', transitionDelay: `${s.i * 70}ms`, cursor: onPointClick ? 'pointer' : 'default' }}
                    onMouseEnter={() => setHover(s.i)} onMouseLeave={() => setHover(-1)}
                    onClick={onPointClick ? () => onPointClick(s, s.i) : undefined} />
                  {showLabel && s.pct > 0.04 && (
                    <text x={labelPt.x} y={labelPt.y} className="chart-data-label" textAnchor="middle" dominantBaseline="middle">{(s.pct * 100).toFixed(0)}%</text>
                  )}
                </g>
              )
            })
          )}
        </svg>
        {tip && tipPt && (
          <Tooltip x={tipPt.x} y={tipPt.y} vbW={size} vbH={size}>
            <span className="chart-tip-label">{tip.label}</span>
            <span className="chart-tip-value">{formatValue(tip.value)}{unit} · {(tip.pct * 100).toFixed(1)}%</span>
          </Tooltip>
        )}
      </div>
      {legend && (
        <ul className="chart-legend">
          {sectors.map((s) => (
            <li key={s.i} className={hover === s.i ? 'is-hover' : ''} onMouseEnter={() => setHover(s.i)} onMouseLeave={() => setHover(-1)}>
              <span className="chart-legend-dot" style={{ background: s.color }} />
              <span className="chart-legend-label">{s.label}</span>
              <span className="chart-legend-value">{formatValue(s.value)}{unit}</span>
              <span className="chart-legend-pct">{(s.pct * 100).toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
