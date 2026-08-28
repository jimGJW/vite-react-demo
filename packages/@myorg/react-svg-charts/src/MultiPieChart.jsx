import { useState } from 'react'
import {
  useMounted, polar, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, LegendList, PALETTE, DEFAULT_FORMAT,
} from './shared.jsx'

/** 扇区路径（饼图，从中心放射）。 */
function sectorPath(cx, cy, r, a0, a1) {
  const start = polar(cx, cy, r, a0)
  const end = polar(cx, cy, r, a1)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`
}

/**
 * 多维饼图（多组并列对比）。
 * @param {Object} props
 * @param {Array<{name:string,data:Array<{label:string,value:number,color?:string}>}>} props.groups 多组饼图
 * @param {number} [props.size=240] 单个饼图边长
 * @param {string[]} [props.colors=PALETTE] 颜色
 * @param {boolean} [props.showLabel=false]  扇区百分比标签
 * @param {boolean} [props.showLegend=true]  共享图例
 * @param {boolean} [props.showTitle=true]    标题区
 * @param {(item:object,index:number)=>void} [props.onPointClick] 点击扇区
 * 其余通用参数：title/subtitle/description/actions/emptyText/loading/formatValue/unit/className
 */
export default function MultiPieChart({
  groups = [], size = 240, colors = PALETTE,
  formatValue = DEFAULT_FORMAT, unit = '', className = '',
  title, subtitle, description, actions, emptyText, loading = false,
  showLabel = false, showLegend = true, showTitle = true,
  onPointClick,
}) {
  const mounted = useMounted()
  // sectorHover: { g, i } | null；legendHover: number（图例项下标，-1 表示无）
  const [sectorHover, setSectorHover] = useState(null)
  const [legendHover, setLegendHover] = useState(-1)
  const header = (
    <ChartHeader title={title} subtitle={subtitle} description={description} actions={actions} showTitle={showTitle} />
  )

  if (loading) return <div className={`chart chart-multi-pie ${className}`}>{header}<ChartSkeleton height={size} /></div>
  if (!groups.length || !groups[0]?.data?.length) {
    return <div className={`chart chart-multi-pie ${className}`}>{header}<ChartEmpty text={emptyText} /></div>
  }

  const cx = size / 2, cy = size / 2, r = size * 0.4

  // 每组饼图扇区
  const pies = groups.map((g, gi) => {
    const total = g.data.reduce((s, d) => s + d.value, 0)
    const safeTotal = total > 0 ? total : 1
    let angle = -90
    const sectors = g.data.map((d, i) => {
      const sweep = (d.value / safeTotal) * 360
      const a0 = angle, a1 = angle + sweep, mid = a0 + sweep / 2
      const path = sweep >= 360 ? null : sectorPath(cx, cy, r, a0, a1)
      angle = a1
      return {
        ...d, i, a0, a1, mid, path,
        pct: d.value / safeTotal,
        color: d.color || colors[i % colors.length],
      }
    })
    return { gi, name: g.name, sectors, total, single: sectors.length === 1 }
  })

  // 共享图例：取所有组 label 的并集（按出现顺序），颜色以首组对应下标为准
  const legendItems = []
  const seen = new Set()
  pies.forEach((gp) => {
    gp.sectors.forEach((s) => {
      if (!seen.has(s.label)) {
        seen.add(s.label)
        legendItems.push({ label: s.label, color: s.color })
      }
    })
  })
  // 按图例下标聚合各组的同 label 数值合计
  const legendTotals = legendItems.map((it) => {
    const total = groups.reduce((sum, g) => {
      const found = g.data.find((d) => d.label === it.label)
      return sum + (found ? found.value : 0)
    }, 0)
    return { ...it, value: formatValue(total) + unit }
  })

  // 当前 hover 的扇区（用于 tooltip）；图例 hover 时高亮所有组同 label 扇区
  const tip = sectorHover
    ? (() => {
        const gp = pies[sectorHover.g]
        const s = gp.sectors[sectorHover.i]
        const tipPt = polar(cx, cy, r * 0.6, s.mid)
        return { ...s, groupName: gp.name, tipPt }
      })()
    : null

  return (
    <div className={`chart chart-multi-pie ${className}`}>
      {header}
      <div className="chart-canvas">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
          {pies.map((gp) => (
            <div key={gp.gi} style={{ position: 'relative', flex: `0 1 ${size}px`, maxWidth: size, minWidth: 180 }}>
              <div style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--c-text-2, #475569)', marginBottom: '0.3rem' }}>{gp.name}</div>
              <div className="chart-canvas">
                <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${gp.name} 饼图`}>
                  {gp.single ? (
                    <circle cx={cx} cy={cy} r={r} fill={gp.sectors[0].color} className="chart-pie-sector" />
                  ) : (
                    gp.sectors.map((s) => {
                      const offset = polar(0, 0, 6, s.mid)
                      const labelPt = polar(cx, cy, r * 0.7, s.mid)
                      const isSectorHover = sectorHover && sectorHover.g === gp.gi && sectorHover.i === s.i
                      const isLegendHover = legendHover >= 0 && legendItems[legendHover].label === s.label
                      const isHover = isSectorHover || isLegendHover
                      return (
                        <g key={s.i}>
                          <path d={s.path} fill={s.color}
                            className={`chart-pie-sector ${mounted ? 'is-in' : ''} ${isHover ? 'is-hover' : ''}`}
                            style={{
                              transform: isHover ? `translate(${offset.x.toFixed(2)}px, ${offset.y.toFixed(2)}px)` : 'translate(0,0)',
                              transitionDelay: `${s.i * 50}ms`,
                              cursor: onPointClick ? 'pointer' : 'default',
                            }}
                            onMouseEnter={() => { setSectorHover({ g: gp.gi, i: s.i }); setLegendHover(-1) }}
                            onMouseLeave={() => setSectorHover(null)}
                            onClick={onPointClick ? () => onPointClick({ group: gp.name, ...s }, s.i) : undefined} />
                          {showLabel && s.pct > 0.06 && (
                            <text x={labelPt.x} y={labelPt.y} className="chart-data-label" textAnchor="middle" dominantBaseline="middle">{(s.pct * 100).toFixed(0)}%</text>
                          )}
                        </g>
                      )
                    })
                  )}
                </svg>
                {tip && sectorHover && sectorHover.g === gp.gi && (
                  <Tooltip x={tip.tipPt.x} y={tip.tipPt.y} vbW={size} vbH={size}>
                    <span className="chart-tip-label">{tip.groupName} · {tip.label}</span>
                    <span className="chart-tip-value">{formatValue(tip.value)}{unit} · {(tip.pct * 100).toFixed(1)}%</span>
                  </Tooltip>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {showLegend && (
        <LegendList
          items={legendTotals}
          hover={sectorHover
            ? legendItems.findIndex((it) => it.label === pies[sectorHover.g].sectors[sectorHover.i].label)
            : legendHover}
          onHover={(i) => { setLegendHover(i); setSectorHover(null) }}
        />
      )}
    </div>
  )
}
