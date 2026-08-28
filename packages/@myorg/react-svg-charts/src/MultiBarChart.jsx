import { useState } from 'react'
import {
  useMounted, niceBounds, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, LegendList, PALETTE, DEFAULT_FORMAT,
} from './shared.jsx'

/**
 * 多维分组柱状图（每个类别下多系列柱并排）。
 * @param {Object} props
 * @param {Array<{name:string,color?:string,data:Array<{label:string,value:number}>}>} props.series 多系列
 * @param {string[]} [props.colors=PALETTE] 多系列颜色
 * @param {number} [props.height=300] viewBox 高度
 * @param {boolean} [props.showLabel=false]  柱顶数值标签
 * @param {boolean} [props.showLegend=true]  图例
 * @param {boolean} [props.showTitle=true]    标题区
 * @param {(item:object,index:number)=>void} [props.onPointClick] 点击柱
 * 其余通用参数：title/subtitle/description/actions/emptyText/loading/formatValue/unit/className
 */
export default function MultiBarChart({
  series = [], colors = PALETTE, height = 300,
  formatValue = DEFAULT_FORMAT, unit = '', className = '',
  title, subtitle, description, actions, emptyText, loading = false,
  showLabel = false, showLegend = true, showTitle = true,
  onPointClick,
}) {
  const mounted = useMounted()
  // hover: { s, i } | null；i=-1 表示图例触发（高亮整系列）
  const [hover, setHover] = useState(null)
  const W = 600, H = height, padL = 44, padR = 18, padT = 16, padB = 30
  const plotW = W - padL - padR, plotH = H - padT - padB, baseY = padT + plotH
  const header = (
    <ChartHeader title={title} subtitle={subtitle} description={description} actions={actions} showTitle={showTitle} />
  )

  if (loading) return <div className={`chart chart-multi-bar ${className}`}>{header}<ChartSkeleton height={height} /></div>
  if (!series.length || !series[0]?.data?.length) {
    return <div className={`chart chart-multi-bar ${className}`}>{header}<ChartEmpty text={emptyText} /></div>
  }

  const labels = series[0].data.map((d) => d.label)
  const nCat = labels.length, nSer = series.length
  const allValues = series.flatMap((s) => s.data.map((d) => d.value))
  const { niceMin, niceMax, step } = niceBounds(0, Math.max(...allValues))
  const span = niceMax - niceMin || 1
  const yAt = (v) => padT + plotH - ((v - niceMin) / span) * plotH

  // 每个类别一个分组，组内多系列柱并排
  const band = plotW / nCat
  const groupW = band * 0.8
  // 柱宽：组宽扣去系列间隙后均分；系列间留 2px 间隙
  const gapInGroup = nSer > 1 ? 2 * (nSer - 1) : 0
  const barW = Math.min((groupW - gapInGroup) / nSer, 48)

  const ticks = []
  for (let v = niceMin; v <= niceMax + 1e-9; v += step) ticks.push(v)

  // 展开为 flat bars 数组
  const bars = []
  for (let si = 0; si < nSer; si++) {
    const s = series[si]
    const color = s.color || colors[si % colors.length]
    const sum = s.data.reduce((acc, d) => acc + d.value, 0)
    for (let ci = 0; ci < nCat; ci++) {
      const d = s.data[ci]
      const catX = padL + ci * band + (band - groupW) / 2
      const x = catX + si * (barW + (nSer > 1 ? 2 : 0))
      const y = yAt(d.value)
      const h = baseY - y
      bars.push({ si, ci, color, x, y, h, barW, value: d.value, label: d.label, name: s.name, sum })
    }
  }

  const tip = hover && hover.i >= 0
    ? bars.find((b) => b.si === hover.s && b.ci === hover.i)
    : null

  return (
    <div className={`chart chart-multi-bar ${className}`}>
      {header}
      <div className="chart-canvas">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="多维分组柱状图">
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
            <text key={i} x={padL + i * band + band / 2} y={H - 8} className="chart-axis-label" textAnchor="middle">{lab}</text>
          ))}
          {bars.map((b, idx) => {
            // 图例 hover（i=-1）时高亮整系列；柱 hover 时高亮具体柱
            const isHover = hover && hover.s === b.si && (hover.i === -1 || hover.i === b.ci)
            const dim = hover && !isHover
            return (
              <g key={idx} style={{ opacity: dim ? 0.45 : 1, transition: 'opacity 0.2s ease' }}>
                <rect x={b.x} y={b.y} width={b.barW} height={b.h} rx={4} fill={b.color}
                  className={`chart-bar ${isHover ? 'is-hover' : ''}`}
                  style={{ transform: mounted ? 'scaleY(1)' : 'scaleY(0)', cursor: onPointClick ? 'pointer' : 'default' }}
                  onMouseEnter={() => setHover({ s: b.si, i: b.ci })}
                  onMouseLeave={() => setHover(null)}
                  onClick={onPointClick ? () => onPointClick({ series: b.name, label: b.label, value: b.value }, b.ci) : undefined} />
                {showLabel && (
                  <text x={b.x + b.barW / 2} y={b.y - 6} className="chart-data-label" textAnchor="middle">{formatValue(b.value)}{unit}</text>
                )}
              </g>
            )
          })}
        </svg>
        {tip && (
          <Tooltip x={tip.x + tip.barW / 2} y={tip.y} vbW={W} vbH={H}>
            <span className="chart-tip-label">{tip.name} · {tip.label}</span>
            <span className="chart-tip-value">{formatValue(tip.value)}{unit}</span>
          </Tooltip>
        )}
      </div>
      {showLegend && (
        <LegendList
          items={series.map((s, i) => ({
            label: s.name,
            value: formatValue(bars.find((b) => b.si === i)?.sum || 0) + unit,
            color: s.color || colors[i % colors.length],
          }))}
          hover={hover ? hover.s : -1}
          onHover={(i) => setHover(i >= 0 ? { s: i, i: -1 } : null)}
        />
      )}
    </div>
  )
}
