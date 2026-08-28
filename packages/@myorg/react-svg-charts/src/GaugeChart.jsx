import { useState } from 'react'
import {
  useMounted, polar, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, DEFAULT_FORMAT,
} from './shared.jsx'

/**
 * 进度环（仪表盘）。
 * @param {number} props.value 当前进度
 * @param {number} [props.max=100] 最大值
 * @param {boolean} [props.showTitle=true] 标题区
 * 其余通用参数见 LineChart。
 */
export default function GaugeChart({
  value = 0, max = 100, size = 240, color = 'var(--c-primary, #4f46e5)', label = '',
  formatValue = DEFAULT_FORMAT, unit = '', className = '',
  title, subtitle, description, actions, emptyText, loading = false,
  showTitle = true,
}) {
  const mounted = useMounted()
  const [hover, setHover] = useState(false)
  const header = <ChartHeader title={title} subtitle={subtitle} description={description} actions={actions} showTitle={showTitle} />

  if (loading) return <div className={`chart chart-gauge ${className}`}>{header}<ChartSkeleton height={size} /></div>

  const safeMax = max > 0 ? max : 1
  const ratio = Math.max(0, Math.min(value / safeMax, 1))
  const cx = size / 2, cy = size / 2, r = size * 0.4
  const pctText = `${(ratio * 100).toFixed(0)}%`
  const start = polar(cx, cy, r, -90)
  const endAngle = -90 + ratio * 360
  const end = polar(cx, cy, r, endAngle)
  const largeArc = ratio > 0.5 ? 1 : 0
  const valueArc = ratio <= 0 ? '' : ratio >= 1
    ? `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 1 1 ${cx + 0.01} ${start.y.toFixed(2)}`
    : `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
  const midAngle = -90 + ratio * 180
  const tipPt = polar(cx, cy, r, midAngle)

  return (
    <div className={`chart chart-gauge ${className}`}>
      {header}
      <div className="chart-canvas">
        <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`进度环 ${pctText}`}
          onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--c-border, #e2e8f0)" strokeWidth={size * 0.05} className="chart-gauge-track" />
          {valueArc && (
            <path d={valueArc} fill="none" stroke={color} strokeWidth={size * 0.05} strokeLinecap="round" pathLength={1} className="chart-gauge-value"
              style={{ strokeDasharray: '1 1', strokeDashoffset: mounted ? 0 : -1 }} />
          )}
          <text x={cx} y={cy - 4} className="chart-gauge-pct" textAnchor="middle" dominantBaseline="middle">{pctText}</text>
          {label && <text x={cx} y={cy + size * 0.12} className="chart-gauge-label" textAnchor="middle" dominantBaseline="middle">{label}</text>}
        </svg>
        {hover && <Tooltip x={tipPt.x} y={tipPt.y} vbW={size} vbH={size}><span className="chart-tip-value">{formatValue(value)}{unit} / {formatValue(max)}{unit}</span></Tooltip>}
      </div>
    </div>
  )
}
