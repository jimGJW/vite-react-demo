import { useState } from 'react'
import {
  useMounted, polar, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, DEFAULT_FORMAT,
} from './shared.jsx'

/**
 * 雷达图（多维度）。
 * @param {Array<{label:string,value:number,max?:number}>} props.data
 * @param {boolean} [props.showLabel=false] 顶点数值标签
 * @param {boolean} [props.showAxis=true]  维度标签
 * @param {boolean} [props.showGrid=true]   网格环
 * 其余通用参数见 LineChart。
 */
export default function RadarChart({
  data = [], size = 320, color = 'var(--c-primary, #4f46e5)',
  formatValue = DEFAULT_FORMAT, unit = '', className = '',
  title, subtitle, description, actions, emptyText, loading = false,
  onPointClick,
  showLabel = false, showAxis = true, showGrid = true, showTitle = true,
}) {
  const mounted = useMounted()
  const [hover, setHover] = useState(-1)
  const header = <ChartHeader title={title} subtitle={subtitle} description={description} actions={actions} showTitle={showTitle} />

  if (loading) return <div className={`chart chart-radar ${className}`}>{header}<ChartSkeleton height={size} /></div>
  if (!data.length) return <div className={`chart chart-radar ${className}`}>{header}<ChartEmpty text={emptyText} /></div>

  const cx = size / 2, cy = size / 2, R = size * 0.36, n = data.length
  const angleOf = (i) => -90 + (i * 360) / n
  const vertex = (i, ratio) => polar(cx, cy, R * ratio, angleOf(i))
  const rings = [0.25, 0.5, 0.75, 1]
  const ringPolys = rings.map((f) =>
    Array.from({ length: n }, (_, i) => vertex(i, f)).map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '))
  const dataPts = data.map((d, i) => {
    const max = d.max > 0 ? d.max : 1
    return vertex(i, Math.max(0, Math.min(d.value / max, 1)))
  })
  const dataPoly = dataPts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
  const tip = hover >= 0 ? { ...data[hover], pt: dataPts[hover] } : null

  return (
    <div className={`chart chart-radar ${className}`}>
      {header}
      <div className="chart-canvas">
        <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="雷达图">
          {showGrid && ringPolys.map((points, i) => <polygon key={i} points={points} className="chart-radar-grid" />)}
          {showGrid && data.map((_, i) => {
            const p = vertex(i, 1)
            return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(2)} y2={p.y.toFixed(2)} className="chart-radar-axis" />
          })}
          <polygon points={dataPoly} fill={color} fillOpacity={0.18} stroke={color} strokeWidth="2"
            className={`chart-radar-poly ${mounted ? 'is-in' : ''}`} style={{ transformOrigin: `${cx}px ${cy}px` }} />
          {dataPts.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={hover === i ? 5 : 3.5} fill="#fff" stroke={color} strokeWidth="2"
                className="chart-dot" style={{ cursor: onPointClick ? 'pointer' : 'default' }}
                onClick={onPointClick ? () => onPointClick(data[i], i) : undefined} />
              <circle cx={p.x} cy={p.y} r={size * 0.12} fill="transparent"
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(-1)} />
              {showLabel && <text x={p.x} y={p.y - 8} className="chart-data-label" textAnchor="middle">{formatValue(data[i].value)}{unit}</text>}
            </g>
          ))}
          {showAxis && data.map((d, i) => {
            const p = polar(cx, cy, R + size * 0.07, angleOf(i))
            return <text key={i} x={p.x} y={p.y} className="chart-axis-label" textAnchor="middle" dominantBaseline="middle">{d.label}</text>
          })}
        </svg>
        {tip && <Tooltip x={tip.pt.x} y={tip.pt.y} vbW={size} vbH={size}><span className="chart-tip-label">{tip.label}</span><span className="chart-tip-value">{formatValue(tip.value)}{unit}</span></Tooltip>}
      </div>
    </div>
  )
}
