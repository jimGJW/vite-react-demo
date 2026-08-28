import { useState, useMemo, useId } from 'react'
import {
  useMounted, niceBounds, ChartEmpty, ChartSkeleton, ChartHeader,
  Tooltip, LegendList, PALETTE, DEFAULT_FORMAT,
} from './shared.jsx'

/**
 * 二级柱状图（钻取 Drill-down）：先展示一级柱状图；点击某根柱子后，整图切换为该柱子对应的二级（子级）数据，可通过面包屑返回上一级。
 *
 * 数据约定：
 *   data: [{ label, value, color?, children: [{ label, value, color? }, ...] }]
 *     - 一级每项的 `children` 为进入二级时显示的柱子数据
 *     - 如果某项 `children` 为空，则不可钻取（视觉上有提示）
 *
 * @param {Object} props
 * @param {Array<{label:string,value:number,color?:string,children?:Array}>} props.data 一级数据
 * @param {number} [props.height=300] viewBox 高度
 * @param {string[]} [props.colors=PALETTE] 颜色池（用户自定 color 优先）
 * @param {string} [props.color] 全局单色（优先级最高，覆盖 colors 池）
 * @param {boolean} [props.showLabel=false]  柱子顶部数值标签
 * @param {boolean} [props.showAxis=true]     坐标轴 / 刻度标签
 * @param {boolean} [props.showGrid=true]     横向网格线
 * @param {boolean} [props.showLegend=false]  图例（当前层级各柱子）
 * @param {boolean} [props.showTitle=true]    标题区（面包屑自动合并到 actions）
 * @param {(item:object,index:number,level:number,path:Array)=>void} [props.onPointClick] 点击柱子回调
 * @param {(level:number,path:Array)=>void} [props.onLevelChange] 层级变化回调
 * 其余通用参数：title/subtitle/description/actions/emptyText/loading/formatValue/unit/className
 */
export default function DrilledBarChart({
  data = [], height = 300, colors = PALETTE, color,
  formatValue = DEFAULT_FORMAT, unit = '', className = '',
  title, subtitle, description, actions, emptyText, loading = false,
  showLabel = false, showAxis = true, showGrid = true,
  showLegend = false, showTitle = true,
  onPointClick, onLevelChange,
}) {
  const mounted = useMounted()
  const id = useId()
  const [crumb, setCrumb] = useState([]) // [{index, label}] 长度 0 或 1
  const [hover, setHover] = useState(-1)     // 当前柱子下标
  const [legendHover, setLegendHover] = useState(-1)

  const level = crumb.length + 1

  const currentData = useMemo(() => {
    if (crumb.length === 0) return data
    const parent = data[crumb[0]?.index]
    return (parent && parent.children) || []
  }, [crumb, data])

  const parentLabel = crumb[0]?.label ?? null

  const drillTo = (parentIndex, parentLabel) => {
    const next = [{ index: parentIndex, label: parentLabel }]
    setCrumb(next)
    setHover(-1); setLegendHover(-1)
    onLevelChange && onLevelChange(2, next)
  }
  const goBack = () => {
    setCrumb([])
    setHover(-1); setLegendHover(-1)
    onLevelChange && onLevelChange(1, [])
  }

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
          <button type="button" className="btn" aria-label="返回上一级" onClick={goBack}
            style={{ padding: '0 0.4rem', minWidth: 'auto', height: '1.35rem',
              lineHeight: '1.3rem', fontSize: '0.75rem' }}>
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

  if (loading) return <div className={`chart chart-drilled-bar ${className}`}>{header}<ChartSkeleton height={height} /></div>
  if (!currentData || !currentData.length) {
    return <div className={`chart chart-drilled-bar ${className}`}>{header}<ChartEmpty text={emptyText || (crumb.length ? '该分类暂无子级数据' : '暂无数据')} /></div>
  }

  const W = 600, H = height, padL = 48, padR = 18, padT = 20, padB = 42
  const plotW = W - padL - padR, plotH = H - padT - padB, baseY = padT + plotH

  const allValues = currentData.map((d) => d.value)
  const { niceMin, niceMax, step } = niceBounds(0, Math.max(...allValues))
  const n = currentData.length
  const groupW = plotW / n
  const barW = Math.min(groupW * 0.58, 62)
  const barGap = (groupW - barW) / 2

  const yTicks = []
  for (let v = niceMin; v <= niceMax + 1e-9; v += step) yTicks.push(v)
  const yScale = (v) => baseY - ((v - niceMin) / (niceMax - niceMin || 1)) * plotH

  // 柱子几何 + 颜色
  const bars = currentData.map((d, i) => {
    const x = padL + i * groupW + barGap
    const y = yScale(d.value)
    const hasChildren = crumb.length === 0 && Array.isArray(d.children) && d.children.length > 0
    const c = color || d.color || colors[i % colors.length]
    return {
      ...d, i, x, y, w: barW, h: Math.max(0, baseY - y),
      color: c,
      hasChildren,
      pct: (d.value / ((niceMax - niceMin) || 1)),
    }
  })

  // tooltip：当前 hover 的柱子（图例 hover 也联动显示第一项/对应项）
  const hoverIdx = hover >= 0 ? hover : legendHover
  const tip = hoverIdx >= 0 && bars[hoverIdx]
    ? (() => {
        const b = bars[hoverIdx]
        return {
          ...b,
          tipX: b.x + b.w / 2,
          tipY: b.y - 2,
        }
      })()
    : null

  const legendItems = bars.map((b) => ({
    label: crumb.length === 0 && b.hasChildren ? `${b.label} ▾` : b.label,
    value: formatValue(b.value) + unit,
    color: b.color,
  }))

  const handleBarClick = (b) => {
    onPointClick && onPointClick({ level, parentLabel, crumb, ...b }, b.i)
    if (crumb.length === 0 && b.hasChildren) drillTo(b.i, b.label)
  }

  return (
    <div className={`chart chart-drilled-bar ${className}`}>
      {header}
      <div className="chart-canvas" key={`L${level}`}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img"
          aria-label={level === 1 ? '一级柱状图' : `二级柱状图（${parentLabel}）`}>
          <defs>
            {bars.map((b, i) => (
              <linearGradient key={id + 'g' + i} id={`${id}-bg-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={b.color} stopOpacity="0.95" />
                <stop offset="100%" stopColor={b.color} stopOpacity="0.65" />
              </linearGradient>
            ))}
          </defs>

          {/* 网格线 */}
          {showGrid && yTicks.map((v, i) => {
            const y = yScale(v)
            return (
              <line key={i} x1={padL} x2={W - padR} y1={y} y2={y}
                className="chart-grid-line" strokeDasharray="3 4" />
            )
          })}

          {/* Y 轴刻度 + X/Y 轴线 */}
          {showAxis && (
            <>
              {yTicks.map((v, i) => {
                const y = yScale(v)
                return (
                  <text key={i} x={padL - 8} y={y} className="chart-axis-label"
                    textAnchor="end" dominantBaseline="middle">
                    {formatValue(v)}
                  </text>
                )
              })}
              <line x1={padL} x2={W - padR} y1={baseY} y2={baseY} className="chart-axis" />
              <line x1={padL} x2={padL} y1={padT} y2={baseY} className="chart-axis" />
            </>
          )}

          {/* 柱子 */}
          {bars.map((b) => {
            const isHover = hover === b.i || legendHover === b.i
            // 入场自底向上生长高度
            const growH = mounted ? b.h : 0
            const growY = mounted ? b.y : baseY
            const cxBar = b.x + b.w / 2
            return (
              <g key={b.i}>
                <rect
                  x={b.x} y={growY} width={b.w} height={growH}
                  rx="6" ry="6"
                  fill={`url(#${id}-bg-${b.i})`}
                  className={`chart-bar ${isHover ? 'is-hover' : ''} ${b.hasChildren ? 'is-drillable' : ''}`}
                  style={{
                    transform: isHover ? `translate(0px, -3px)` : 'translate(0,0)',
                    transformBox: 'fill-box',
                    transition: 'y 0.6s ease, height 0.6s ease, transform 0.15s ease',
                    transitionDelay: `${b.i * 40}ms, ${b.i * 40}ms, 0ms`,
                    cursor: (onPointClick || b.hasChildren) ? 'pointer' : 'default',
                  }}
                  onMouseEnter={() => { setHover(b.i); setLegendHover(-1) }}
                  onMouseLeave={() => setHover(-1)}
                  onClick={() => handleBarClick(b)}
                />
                {/* 可钻取提示：柱子顶端一个倒三角 ▾ */}
                {b.hasChildren && mounted && growH > 10 && (
                  <polygon
                    points={`${cxBar - 4},${growY - 6} ${cxBar + 4},${growY - 6} ${cxBar},${growY - 1}`}
                    fill={b.color} stroke="#fff" strokeWidth="0.6"
                    style={{
                      transformOrigin: `${cxBar}px ${growY - 4}px`,
                      animation: 'chart-pulse 1.6s ease-in-out infinite',
                      animationDelay: `${b.i * 70}ms`,
                    }}
                  />
                )}
                {showLabel && (
                  <text x={cxBar} y={growY - 8} className="chart-data-label"
                    textAnchor="middle" dominantBaseline="middle">
                    {formatValue(b.value)}{unit}
                  </text>
                )}
                {showAxis && (
                  <text x={cxBar} y={baseY + 16} className="chart-axis-label"
                    textAnchor="middle">
                    {b.label}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
        {tip && (
          <Tooltip x={tip.tipX} y={tip.tipY} vbW={W} vbH={H}>
            <span className="chart-tip-label">{tip.label}</span>
            <span className="chart-tip-value">{formatValue(tip.value)}{unit}</span>
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
