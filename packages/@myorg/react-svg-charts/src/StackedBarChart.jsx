import { useState } from 'react'
import {
  useMounted, niceBounds, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, LegendList, PALETTE, DEFAULT_FORMAT,
} from './shared.jsx'

/**
 * 堆叠柱状图（每个类别多系列自底向上累计堆叠）。
 * @param {Object} props
 * @param {Array<{name:string,color?:string,data:Array<{label:string,value:number}>}>} props.series 多系列
 * @param {string[]} [props.colors=PALETTE] 多系列颜色
 * @param {number} [props.height=300] viewBox 高度
 * @param {boolean} [props.showLabel=false]  各段中央数值标签
 * @param {boolean} [props.showLegend=true]  图例
 * @param {boolean} [props.showTitle=true]    标题区
 * @param {(item:object,index:number)=>void} [props.onPointClick] 点击段
 * 其余通用参数：title/subtitle/description/actions/emptyText/loading/formatValue/unit/className
 */
export default function StackedBarChart({
  series = [], colors = PALETTE, height = 300,
  formatValue = DEFAULT_FORMAT, unit = '', className = '',
  title, subtitle, description, actions, emptyText, loading = false,
  showLabel = false, showLegend = true, showTitle = true,
  onPointClick,
}) {
  const mounted = useMounted()
  // hover: { ci, si? } | null；hover.si 为段索引；图例 hover 时 si=-1 高亮整系列
  const [hover, setHover] = useState(null)
  const W = 600, H = height, padL = 44, padR = 18, padT = 16, padB = 30
  const plotW = W - padL - padR, plotH = H - padT - padB, baseY = padT + plotH
  const header = (
    <ChartHeader title={title} subtitle={subtitle} description={description} actions={actions} showTitle={showTitle} />
  )

  if (loading) return <div className={`chart chart-stacked-bar ${className}`}>{header}<ChartSkeleton height={height} /></div>
  if (!series.length || !series[0]?.data?.length) {
    return <div className={`chart chart-stacked-bar ${className}`}>{header}<ChartEmpty text={emptyText} /></div>
  }

  const labels = series[0].data.map((d) => d.label)
  const nCat = labels.length, nSer = series.length
  // 每个类别的累计值（堆叠顶部）
  const totals = labels.map((_, ci) =>
    series.reduce((s, ser) => s + (ser.data[ci]?.value || 0), 0))
  const { niceMin, niceMax, step } = niceBounds(0, Math.max(...totals))
  const span = niceMax - niceMin || 1
  const yAt = (v) => padT + plotH - ((v - niceMin) / span) * plotH

  const band = plotW / nCat
  const barW = Math.min(band * 0.56, 46)
  const ticks = []
  for (let v = niceMin; v <= niceMax + 1e-9; v += step) ticks.push(v)

  // 自底向上累计，生成各段几何
  const segs = []
  const seriesSums = new Array(nSer).fill(0)
  for (let ci = 0; ci < nCat; ci++) {
    let cum = 0
    for (let si = 0; si < nSer; si++) {
      const s = series[si]
      const d = s.data[ci]
      const color = s.color || colors[si % colors.length]
      const v = d.value
      seriesSums[si] += v
      const yTop = yAt(cum + v)
      const yBot = yAt(cum)
      const segH = yBot - yTop
      const x = padL + ci * band + (band - barW) / 2
      segs.push({
        si, ci, color, x, y: yTop, h: segH, barW,
        value: v, label: d.label, name: s.name,
        cumTop: cum + v, cumBot: cum,
      })
      cum += v
    }
  }

  // hover tooltip：仅在段 hover（ci>=0）时显示整段（按类别 ci）
  const tip = hover && hover.ci >= 0
    ? (() => {
        const ci = hover.ci
        const catX = padL + ci * band + band / 2
        const segsOfCat = segs.filter((s) => s.ci === ci)
        return {
          x: catX,
          y: yAt(totals[ci]) - 4,
          label: labels[ci],
          total: totals[ci],
          segments: segsOfCat.map((s) => ({ name: s.name, value: s.value, color: s.color })),
        }
      })()
    : null

  return (
    <div className={`chart chart-stacked-bar ${className}`}>
      {header}
      <div className="chart-canvas">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="堆叠柱状图">
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
          {segs.map((s, idx) => {
            // 段 hover：同类别同段；图例 hover（ci=-1）：高亮整系列所有段
            const isHover = hover && (
              (hover.ci >= 0 && hover.ci === s.ci && (hover.si === -1 || hover.si === s.si)) ||
              (hover.ci === -1 && hover.si === s.si)
            )
            const dim = hover && !isHover
            return (
              <g key={idx} style={{ opacity: dim ? 0.45 : 1, transition: 'opacity 0.2s ease' }}>
                <rect x={s.x} y={s.y} width={s.barW} height={s.h} fill={s.color}
                  className={`chart-bar ${isHover ? 'is-hover' : ''}`}
                  style={{ transform: mounted ? 'scaleY(1)' : 'scaleY(0)', cursor: onPointClick ? 'pointer' : 'default' }}
                  onMouseEnter={() => setHover({ ci: s.ci, si: s.si })}
                  onMouseLeave={() => setHover(null)}
                  onClick={onPointClick ? () => onPointClick({ series: s.name, label: s.label, value: s.value }, s.ci) : undefined} />
                {showLabel && s.h > 14 && (
                  <text x={s.x + s.barW / 2} y={s.y + s.h / 2} className="chart-data-label"
                    textAnchor="middle" dominantBaseline="middle">{formatValue(s.value)}{unit}</text>
                )}
              </g>
            )
          })}
        </svg>
        {tip && (
          <Tooltip x={tip.x} y={tip.y} vbW={W} vbH={H}>
            <span className="chart-tip-label">{tip.label}</span>
            {tip.segments.map((seg, i) => (
              <span key={i} className="chart-tip-value" style={{ color: seg.color, fontWeight: 600 }}>
                {seg.name}: {formatValue(seg.value)}{unit}
              </span>
            ))}
            <span className="chart-tip-value">合计: {formatValue(tip.total)}{unit}</span>
          </Tooltip>
        )}
      </div>
      {showLegend && (
        <LegendList
          items={series.map((s, i) => ({
            label: s.name,
            value: formatValue(seriesSums[i] || 0) + unit,
            color: s.color || colors[i % colors.length],
          }))}
          hover={hover ? hover.si : -1}
          onHover={(i) => setHover(i >= 0 ? { ci: -1, si: i } : null)}
        />
      )}
    </div>
  )
}
