import { useState, useMemo } from 'react'
import {
  useMounted, polar, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, LegendList, PALETTE, DEFAULT_FORMAT,
} from './shared.jsx'

/** 生成饼图扇区路径（普通饼图 / donut 饼图通用） */
function sectorPath(cx, cy, rOuter, rInner, a0, a1) {
  const p0 = polar(cx, cy, rOuter, a0)
  const p1 = polar(cx, cy, rOuter, a1)
  const large = a1 - a0 > 180 ? 1 : 0
  if (rInner > 0) {
    const p2 = polar(cx, cy, rInner, a1)
    const p3 = polar(cx, cy, rInner, a0)
    return [
      `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
      `L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
      'Z',
    ].join(' ')
  }
  return [
    `M ${cx} ${cy}`,
    `L ${p0.x.toFixed(2)} ${p0.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}

/**
 * 二级饼图（钻取 Drill-down）：先展示一级饼图；点击某扇区后，整图切换为该扇区对应的二级（子级）数据，可返回上一级。
 *
 * 数据约定：
 *   data: [{ label, value, color?, children: [{ label, value, color? }, ...] }]
 *     - 一级每项的 `children` 为进入二级时显示的扇区数据
 *     - 如果某项 `children` 为空，则不可钻取（视觉上有提示）
 *
 * @param {Object} props
 * @param {Array<{label:string,value:number,color?:string,children?:Array}>} props.data 一级数据
 * @param {number} [props.size=320] viewBox 边长
 * @param {string[]} [props.colors=PALETTE] 颜色池（按每级扇区 index 循环取色；用户自定 color 优先）
 * @param {boolean} [props.donut=false] 是否显示为环形（donut）饼图而非实心饼
 * @param {boolean} [props.showLabel=false]  扇区中央百分比标签
 * @param {boolean} [props.showLegend=true]  图例（仅当前层级）
 * @param {boolean} [props.showTitle=true]    标题区（面包屑会附加到 actions 区，无需自处理）
 * @param {(item:object,index:number,level:number,path:Array)=>void} [props.onPointClick] 点击扇区回调：携带 level=1 一级、level=2 二级
 * @param {(level:number,path:Array)=>void} [props.onLevelChange] 层级变化回调（进入二级 / 返回一级）
 * 其余通用参数：title/subtitle/description/actions/emptyText/loading/formatValue/unit/className
 */
export default function NestedPieChart({
  data = [], size = 320, colors = PALETTE, donut = false,
  formatValue = DEFAULT_FORMAT, unit = '', className = '',
  title, subtitle, description, actions, emptyText, loading = false,
  showLabel = false, showLegend = true, showTitle = true,
  onPointClick, onLevelChange,
}) {
  const mounted = useMounted()
  // 面包屑：[] = 顶层；[parentIndex, parentLabel] = 进入某子级（目前仅支持二级，数组只有 0/1 项）
  const [crumb, setCrumb] = useState([]) // [{index, label}]
  const [hover, setHover] = useState(-1)
  const [legendHover, setLegendHover] = useState(-1)

  const level = crumb.length + 1 // 1 或 2

  // 根据面包屑计算当前显示的数据、以及父级（用于返回提示）
  const currentData = useMemo(() => {
    if (crumb.length === 0) return data
    const parent = data[crumb[0]?.index]
    return (parent && parent.children) || []
  }, [crumb, data])

  const parentLabel = crumb[0]?.label ?? null

  // 进入二级（drill down）
  const drillTo = (parentIndex, parentLabel) => {
    const next = [{ index: parentIndex, label: parentLabel }]
    setCrumb(next)
    setHover(-1)
    setLegendHover(-1)
    onLevelChange && onLevelChange(2, next)
  }

  // 返回上一级
  const goBack = () => {
    setCrumb([])
    setHover(-1)
    setLegendHover(-1)
    onLevelChange && onLevelChange(1, [])
  }

  // actions 区附加面包屑 + 返回按钮（只在二级显示）
  const mergedActions = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      {actions}
      {crumb.length > 0 && (
        <div className="chart-crumb"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            fontSize: '0.8rem', color: 'var(--c-text-2, #475569)',
            background: 'var(--c-primary-soft, rgba(79, 70, 229, 0.08))',
            padding: '0.25rem 0.55rem', borderRadius: '999px',
            border: '1px solid var(--c-primary-softer, rgba(79, 70, 229, 0.15))' }}>
          <button type="button" className="btn" aria-label="返回上一级"
            onClick={goBack}
            style={{ padding: '0 0.4rem', minWidth: 'auto', height: '1.35rem', lineHeight: '1.3rem',
              fontSize: '0.75rem' }}>
            ← 返回
          </button>
          <span style={{ fontWeight: 600, color: 'var(--c-primary-700, #4338ca)' }}>
            {parentLabel}
          </span>
          <span style={{ opacity: 0.6 }}>二级</span>
        </div>
      )}
    </div>
  )

  const header = (
    <ChartHeader
      title={title} subtitle={subtitle} description={description}
      actions={mergedActions} showTitle={showTitle}
    />
  )

  if (loading) return <div className={`chart chart-nested-pie ${className}`}>{header}<ChartSkeleton height={size} /></div>
  if (!currentData || !currentData.length) {
    return <div className={`chart chart-nested-pie ${className}`}>{header}<ChartEmpty text={emptyText || (crumb.length ? '该分类暂无子级数据' : '暂无数据')} /></div>
  }

  const cx = size / 2, cy = size / 2
  const R = size * 0.44
  const rInner = donut ? R * 0.55 : 0

  const total = currentData.reduce((s, d) => s + d.value, 0)
  const safe = total > 0 ? total : 1
  // 起始角 -90°（12 点方向）；用前缀和推算各扇区起止角，避免可变累加器
  const sectors = currentData.map((d, i) => {
    const a0 = -90 + currentData.slice(0, i).reduce((s, p) => s + (p.value / safe) * 360, 0)
    const sweep = (d.value / safe) * 360
    const a1 = a0 + sweep, mid = a0 + sweep / 2
    const path = sweep >= 360
      ? (donut
        ? sectorPath(cx, cy, R, rInner, 0, 359.999)
        : null /* 整饼：用圆兜底 */)
      : sectorPath(cx, cy, R, rInner, a0, a1)
    const hasChildren = crumb.length === 0 && Array.isArray(d.children) && d.children.length > 0
    return {
      ...d, i, a0, a1, mid, path,
      pct: d.value / safe,
      color: d.color || colors[i % colors.length],
      rMid: (R + (rInner || 0)) / 2,
      hasChildren,
    }
  })

  const tipSector = hover >= 0 ? sectors[hover] : (legendHover >= 0 ? sectors[legendHover] : null)
  const tip = tipSector
    ? { ...tipSector, tipPt: polar(cx, cy, tipSector.rMid, tipSector.mid) }
    : null

  const legendItems = sectors.map((s) => ({
    label: (crumb.length === 0 && s.hasChildren ? `${s.label} ▾` : s.label),
    value: formatValue(s.value) + unit,
    pct: `(${(s.pct * 100).toFixed(0)}%)`,
    color: s.color,
  }))

  const handleSectorClick = (s, i) => {
    onPointClick && onPointClick({ level, parentLabel, crumb, ...s }, i)
    // 一级且有 children → 自动钻取进入二级
    if (crumb.length === 0 && s.hasChildren) {
      drillTo(i, s.label)
    }
  }

  return (
    <div className={`chart chart-nested-pie ${className}`}>
      {header}
      <div className="chart-canvas" key={`L${level}`}>
        <svg viewBox={`0 0 ${size} ${size}`} role="img"
          aria-label={level === 1 ? '一级饼图' : `二级饼图（${parentLabel}）`}>
          {/* 整饼兜底（单扇区 100% 时 sectorPath 可能为 null） */}
          {sectors.length === 1 && sectors[0].pct >= 1 && donut && (
            <path d={sectors[0].path} fill={sectors[0].color} className={`chart-pie-sector ${mounted ? 'is-in' : ''}`} />
          )}
          {sectors.map((s) => {
            const offsetPolar = s.hasChildren ? 8 : 6
            const offset = polar(0, 0, offsetPolar, s.mid)
            const labelPt = polar(cx, cy, s.rMid, s.mid)
            const isHover = hover === s.i || legendHover === s.i
            return (
              <g key={s.i}>
                <path d={s.path} fill={s.color}
                  className={`chart-pie-sector ${mounted ? 'is-in' : ''} ${isHover ? 'is-hover' : ''} ${s.hasChildren ? 'is-drillable' : ''}`}
                  style={{
                    transform: isHover ? `translate(${offset.x.toFixed(2)}px, ${offset.y.toFixed(2)}px)` : 'translate(0,0)',
                    transitionDelay: `${s.i * 55}ms`,
                    cursor: (onPointClick || s.hasChildren) ? 'pointer' : 'default',
                  }}
                  onMouseEnter={() => { setHover(s.i); setLegendHover(-1) }}
                  onMouseLeave={() => setHover(-1)}
                  onClick={() => handleSectorClick(s, s.i)}
                />
                {showLabel && s.pct > 0.05 && (
                  <text x={labelPt.x} y={labelPt.y} className="chart-data-label"
                    textAnchor="middle" dominantBaseline="middle">
                    {(s.pct * 100).toFixed(0)}%
                  </text>
                )}
                {/* 一级可钻取的扇区，在边缘加一个小三角提示 */}
                {s.hasChildren && mounted && (() => {
                  const p = polar(cx, cy, R + 10, s.mid)
                  return (
                    <polygon
                      points={`${p.x.toFixed(2)},${(p.y - 4).toFixed(2)} ${(p.x + 4).toFixed(2)},${(p.y + 3).toFixed(2)} ${(p.x - 4).toFixed(2)},${(p.y + 3).toFixed(2)}`}
                      fill={s.color} stroke="#fff" strokeWidth="0.8"
                      style={{ transformOrigin: `${p.x}px ${p.y}px`,
                        animation: 'chart-pulse 1.6s ease-in-out infinite',
                        animationDelay: `${s.i * 80}ms` }}
                    />
                  )
                })()}
              </g>
            )
          })}
          {/* 二级中心显示父级标签（仅 donut 模式效果更好） */}
          {crumb.length > 0 && donut && (
            <>
              <text x={cx} y={cy - 4} className="chart-center-label"
                textAnchor="middle" dominantBaseline="middle">
                {parentLabel}
              </text>
              <text x={cx} y={cy + 14} className="chart-center-sub"
                textAnchor="middle" dominantBaseline="middle">
                {formatValue(total)}{unit}
              </text>
            </>
          )}
        </svg>
        {tip && tip.tipPt && (
          <Tooltip x={tip.tipPt.x} y={tip.tipPt.y} vbW={size} vbH={size}>
            <span className="chart-tip-label">{tip.label}</span>
            <span className="chart-tip-value">
              {formatValue(tip.value)}{unit} · {(tip.pct * 100).toFixed(1)}%
            </span>
            {crumb.length === 0 && tip.hasChildren && (
              <span style={{ fontSize: '0.72rem', opacity: 0.7, display: 'block' }}>点击进入子级 ▸</span>
            )}
          </Tooltip>
        )}
      </div>
      {showLegend && (
        <LegendList
          items={legendItems}
          hover={hover >= 0 ? hover : legendHover}
          onHover={(i) => { setLegendHover(i); setHover(-1) }}
        />
      )}
    </div>
  )
}
