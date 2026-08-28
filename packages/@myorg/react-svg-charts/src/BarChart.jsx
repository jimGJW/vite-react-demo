import { useState } from 'react'
import {
  useMounted, niceBounds, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, LegendList, DEFAULT_FORMAT,
} from './shared.jsx'

/**
 * 柱状图（单系列）。
 * @param {Array<{label:string,value:number}>} props.data
 * @param {boolean} [props.showLabel=false] 柱顶数值标签
 * @param {boolean} [props.showAxis=true]   坐标轴标签
 * @param {boolean} [props.showGrid=true]   网格线
 * 其余通用参数见 LineChart。
 */
export default function BarChart({
  data = [], height = 300, color = 'var(--c-primary, #4f46e5)',
  formatValue = DEFAULT_FORMAT, unit = '', className = '',
  title, subtitle, description, actions, emptyText, loading = false,
  legend = false, onPointClick,
  showLabel = false, showAxis = true, showGrid = true, showTitle = true,
}) {
  const mounted = useMounted()
  const [hover, setHover] = useState(-1)
  const W = 600, H = height, padL = 44, padR = 18, padT = 16, padB = 30
  const plotW = W - padL - padR, plotH = H - padT - padB, baseY = padT + plotH
  const header = <ChartHeader title={title} subtitle={subtitle} description={description} actions={actions} showTitle={showTitle} />

  if (loading) return <div className={`chart chart-bar ${className}`}>{header}<ChartSkeleton height={height} /></div>
  if (!data.length) return <div className={`chart chart-bar ${className}`}>{header}<ChartEmpty text={emptyText} /></div>

  const values = data.map((d) => d.value)
  const { niceMin, niceMax, step } = niceBounds(0, Math.max(...values))
  const span = niceMax - niceMin || 1
  const yAt = (v) => padT + plotH - ((v - niceMin) / span) * plotH
  const n = data.length, band = plotW / n, barW = Math.min(band * 0.56, 46)
  const ticks = []
  for (let v = niceMin; v <= niceMax + 1e-9; v += step) ticks.push(v)
  const tip = hover >= 0 ? { ...data[hover], x: padL + hover * band + band / 2, y: yAt(data[hover].value) } : null

  return (
    <div className={`chart chart-bar ${className}`}>
      {header}
      <div className="chart-canvas">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="柱状图">
          {showGrid && ticks.map((v, i) => { const y = yAt(v); return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} className="chart-grid" />
              {showAxis && <text x={padL - 8} y={y} className="chart-axis-label" textAnchor="end" dominantBaseline="middle">{formatValue(v)}</text>}
            </g>
          ) })}
          {data.map((d, i) => {
            const x = padL + i * band + (band - barW) / 2
            const y = yAt(d.value)
            const h = baseY - y
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={h} rx={5} fill={color}
                  className={`chart-bar ${hover === i ? 'is-hover' : ''}`}
                  style={{ transform: mounted ? 'scaleY(1)' : 'scaleY(0)', cursor: onPointClick ? 'pointer' : 'default' }}
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(-1)}
                  onClick={onPointClick ? () => onPointClick(d, i) : undefined} />
                {showAxis && <text x={x + barW / 2} y={H - 8} className="chart-axis-label" textAnchor="middle">{d.label}</text>}
                {showLabel && <text x={x + barW / 2} y={y - 6} className="chart-data-label" textAnchor="middle">{formatValue(d.value)}{unit}</text>}
              </g>
            )
          })}
        </svg>
        {tip && <Tooltip x={tip.x} y={tip.y} vbW={W} vbH={H}><span className="chart-tip-label">{tip.label}</span><span className="chart-tip-value">{formatValue(tip.value)}{unit}</span></Tooltip>}
      </div>
      {legend && <LegendList items={data.map((d) => ({ label: d.label, value: formatValue(d.value) + unit, color }))} hover={hover} onHover={setHover} />}
    </div>
  )
}
