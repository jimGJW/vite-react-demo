import { useId, useState } from 'react'
import {
  useMounted, niceBounds, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, LegendList, PALETTE, DEFAULT_FORMAT,
} from './shared.jsx'

/**
 * 多维折线图（多系列，首系列渐变面积填充）。
 * @param {Object} props
 * @param {Array<{name:string,color?:string,data:Array<{label:string,value:number}>}>} props.series 多系列
 * @param {string[]} [props.colors=PALETTE] 多系列颜色（按系列下标取）
 * @param {number} [props.height=300] viewBox 高度
 * @param {boolean} [props.showLabel=false]  数据点旁数值标签
 * @param {boolean} [props.showLegend=true]  图例
 * @param {boolean} [props.showTitle=true]    标题区
 * @param {(item:object,index:number)=>void} [props.onPointClick] 点击数据点
 * 其余通用参数：title/subtitle/description/actions/emptyText/loading/formatValue/unit/className
 */
export default function MultiLineChart({
  series = [], colors = PALETTE, height = 300,
  formatValue = DEFAULT_FORMAT, unit = '', className = '',
  title, subtitle, description, actions, emptyText, loading = false,
  showLabel = false, showLegend = true, showTitle = true,
  onPointClick,
}) {
  const mounted = useMounted()
  // hover: { s, i } | null；i=-1 表示由图例触发（仅高亮系列，不显示具体点 tooltip）
  const [hover, setHover] = useState(null)
  const uid = useId().replace(/:/g, '')
  const W = 600, H = height, padL = 44, padR = 18, padT = 16, padB = 30
  const plotW = W - padL - padR, plotH = H - padT - padB, baseY = padT + plotH
  const header = (
    <ChartHeader title={title} subtitle={subtitle} description={description} actions={actions} showTitle={showTitle} />
  )

  if (loading) return <div className={`chart chart-multi-line ${className}`}>{header}<ChartSkeleton height={height} /></div>
  if (!series.length || !series[0]?.data?.length) {
    return <div className={`chart chart-multi-line ${className}`}>{header}<ChartEmpty text={emptyText} /></div>
  }

  // 所有系列共享同一组 X 标签（取 series[0].data）
  const labels = series[0].data.map((d) => d.label)
  const n = labels.length
  const allValues = series.flatMap((s) => s.data.map((d) => d.value))
  const { niceMin, niceMax, step } = niceBounds(Math.min(...allValues), Math.max(...allValues))
  const span = niceMax - niceMin || 1
  const xAt = (i) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const yAt = (v) => padT + plotH - ((v - niceMin) / span) * plotH

  // 每个系列预计算点序列、折线路径、面积路径、线长
  const lines = series.map((s, si) => {
    const color = s.color || colors[si % colors.length]
    const pts = s.data.map((d, i) => ({ x: xAt(i), y: yAt(d.value), ...d }))
    const linePath = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ')
    const areaPath = pts.length > 1
      ? `${linePath} L${pts[pts.length - 1].x.toFixed(2)},${baseY} L${pts[0].x.toFixed(2)},${baseY} Z`
      : ''
    const lineLen = pts.reduce(
      (acc, p, i) => (i === 0 ? 0 : acc + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)),
      0,
    )
    const sum = pts.reduce((acc, p) => acc + p.value, 0)
    return { si, name: s.name, color, pts, linePath, areaPath, lineLen, sum }
  })

  const ticks = []
  for (let v = niceMin; v <= niceMax + 1e-9; v += step) ticks.push(v)
  const band = plotW / Math.max(n, 1)

  // tooltip 仅在具体点 hover（hover.i >= 0）时显示
  const tip = hover && hover.i >= 0
    ? (() => {
        const l = lines[hover.s]
        const p = l.pts[hover.i]
        return { ...p, color: l.color, sName: l.name }
      })()
    : null

  const gradIds = lines.map((_, i) => `mlc-fill-${uid}-${i}`)

  return (
    <div className={`chart chart-multi-line ${className}`}>
      {header}
      <div className="chart-canvas">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="多维折线图">
          <defs>
            {lines.map((l, i) => (
              <linearGradient key={i} id={gradIds[i]} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={l.color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={l.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {ticks.map((v, i) => {
            const y = yAt(v)
            return (
              <g key={i}>
                <line x1={padL} y1={y} x2={W - padR} y2={y} className="chart-grid" />
                <text x={padL - 8} y={y} className="chart-axis-label" textAnchor="end" dominantBaseline="middle">{formatValue(v)}</text>
              </g>
            )
          })}
          {labels.map((lab, i) => (
            <text key={i} x={xAt(i)} y={H - 8} className="chart-axis-label" textAnchor="middle">{lab}</text>
          ))}
          {/* 仅首系列渐变面积填充，避免多系列互相遮挡 */}
          {lines.length > 0 && lines[0].areaPath && (
            <path d={lines[0].areaPath} fill={`url(#${gradIds[0]})`} className={`chart-area ${mounted ? 'is-in' : ''}`} />
          )}
          {lines.map((l) => {
            const seriesHovered = hover && hover.s === l.si
            const dim = hover && !seriesHovered
            return (
              <g key={l.si} style={{ opacity: dim ? 0.45 : 1, transition: 'opacity 0.2s ease' }}>
                <path d={l.linePath} fill="none" stroke={l.color} className="chart-line-path"
                  style={{ strokeDasharray: l.lineLen || 1, strokeDashoffset: mounted ? 0 : l.lineLen || 1 }} />
                {showLabel && l.pts.map((p, i) => (
                  <text key={i} x={p.x} y={p.y - 10} className="chart-data-label" textAnchor="middle">{formatValue(p.value)}{unit}</text>
                ))}
                {l.pts.map((p, i) => {
                  const isHover = hover && hover.s === l.si && hover.i === i
                  return (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r={isHover ? 5 : 3.5} fill="#fff" stroke={l.color} strokeWidth="2"
                        className="chart-dot" style={{ cursor: onPointClick ? 'pointer' : 'default' }}
                        onClick={onPointClick ? () => onPointClick({ series: l.name, ...p }, i) : undefined} />
                      <rect x={p.x - band / 2} y={padT} width={band} height={plotH} fill="transparent"
                        onMouseEnter={() => setHover({ s: l.si, i })}
                        onMouseLeave={() => setHover(null)} />
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>
        {tip && (
          <Tooltip x={tip.x} y={tip.y} vbW={W} vbH={H}>
            <span className="chart-tip-label">{tip.sName} · {tip.label}</span>
            <span className="chart-tip-value">{formatValue(tip.value)}{unit}</span>
          </Tooltip>
        )}
      </div>
      {showLegend && (
        <LegendList
          items={lines.map((l) => ({ label: l.name, value: formatValue(l.sum) + unit, color: l.color }))}
          hover={hover ? hover.s : -1}
          onHover={(i) => setHover(i >= 0 ? { s: i, i: -1 } : null)}
        />
      )}
    </div>
  )
}
