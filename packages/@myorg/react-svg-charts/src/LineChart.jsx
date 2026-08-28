import { useId, useState } from 'react'
import {
  useMounted, niceBounds, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, LegendList, DEFAULT_FORMAT,
} from './shared.jsx'

/**
 * 折线图（单系列，渐变面积填充）。
 * @param {Object} props
 * @param {Array<{label:string,value:number}>} props.data 数据点
 * @param {number} [props.height=300] viewBox 高度
 * @param {string} [props.color] 折线颜色
 * @param {boolean} [props.showLabel=false]  数据标签（点上方数值）
 * @param {boolean} [props.showAxis=true]     坐标轴标签
 * @param {boolean} [props.showGrid=true]     网格线
 * @param {boolean} [props.showLegend=false]  图例
 * @param {boolean} [props.showTitle=true]    标题区
 * @param {(item:object,index:number)=>void} [props.onPointClick]
 * 其余通用参数：title/subtitle/description/actions/emptyText/loading/formatValue/unit/className
 */
export default function LineChart({
  data = [], height = 300, color = 'var(--c-primary, #4f46e5)',
  formatValue = DEFAULT_FORMAT, unit = '', className = '',
  title, subtitle, description, actions, emptyText, loading = false,
  legend = false, onPointClick,
  showLabel = false, showAxis = true, showGrid = true, showTitle = true,
}) {
  const mounted = useMounted()
  const [hover, setHover] = useState(-1)
  const uid = useId().replace(/:/g, '')
  const gradId = `lc-fill-${uid}`
  const W = 600, H = height, padL = 44, padR = 18, padT = 16, padB = 30
  const plotW = W - padL - padR, plotH = H - padT - padB, baseY = padT + plotH
  const header = <ChartHeader title={title} subtitle={subtitle} description={description} actions={actions} showTitle={showTitle} />

  if (loading) return <div className={`chart chart-line ${className}`}>{header}<ChartSkeleton height={height} /></div>
  if (!data.length) return <div className={`chart chart-line ${className}`}>{header}<ChartEmpty text={emptyText} /></div>

  const values = data.map((d) => d.value)
  const { niceMin, niceMax, step } = niceBounds(Math.min(...values), Math.max(...values))
  const span = niceMax - niceMin || 1
  const xAt = (i) => padL + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW)
  const yAt = (v) => padT + plotH - ((v - niceMin) / span) * plotH
  const pts = data.map((d, i) => ({ x: xAt(i), y: yAt(d.value), ...d }))
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
  const areaPath = pts.length > 1 ? `${linePath} L${pts[pts.length - 1].x.toFixed(2)},${baseY} L${pts[0].x.toFixed(2)},${baseY} Z` : ''
  const lineLen = pts.reduce((s, p, i) => (i === 0 ? 0 : s + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)), 0)
  const band = plotW / Math.max(data.length, 1)
  const ticks = []
  for (let v = niceMin; v <= niceMax + 1e-9; v += step) ticks.push(v)
  const tip = hover >= 0 ? pts[hover] : null

  return (
    <div className={`chart chart-line ${className}`}>
      {header}
      <div className="chart-canvas">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="折线图">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.34" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {showGrid && ticks.map((v, i) => { const y = yAt(v); return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} className="chart-grid" />
              {showAxis && <text x={padL - 8} y={y} className="chart-axis-label" textAnchor="end" dominantBaseline="middle">{formatValue(v)}</text>}
            </g>
          ) })}
          {showAxis && pts.map((p, i) => <text key={i} x={p.x} y={H - 8} className="chart-axis-label" textAnchor="middle">{p.label}</text>)}
          {areaPath && <path d={areaPath} fill={`url(#${gradId})`} className={`chart-area ${mounted ? 'is-in' : ''}`} />}
          {linePath && <path d={linePath} fill="none" stroke={color} className="chart-line-path" style={{ strokeDasharray: lineLen || 1, strokeDashoffset: mounted ? 0 : lineLen || 1 }} />}
          {showLabel && pts.map((p, i) => <text key={`l${i}`} x={p.x} y={p.y - 10} className="chart-data-label" textAnchor="middle">{formatValue(p.value)}{unit}</text>)}
          {pts.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={hover === i ? 5 : 3.5} fill="#fff" stroke={color} strokeWidth="2" className="chart-dot" style={{ cursor: onPointClick ? 'pointer' : 'default' }} onClick={onPointClick ? () => onPointClick(p, i) : undefined} />
              <rect x={p.x - band / 2} y={padT} width={band} height={plotH} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(-1)} onClick={onPointClick ? () => onPointClick(p, i) : undefined} />
            </g>
          ))}
        </svg>
        {tip && <Tooltip x={tip.x} y={tip.y} vbW={W} vbH={H}><span className="chart-tip-label">{tip.label}</span><span className="chart-tip-value">{formatValue(tip.value)}{unit}</span></Tooltip>}
      </div>
      {legend && <LegendList items={data.map((d) => ({ label: d.label, value: formatValue(d.value) + unit, color }))} hover={hover} onHover={setHover} />}
    </div>
  )
}
