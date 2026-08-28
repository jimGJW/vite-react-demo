import { useEffect, useState } from 'react'
import './Charts.scss'

/* =====================================================================
 * 图表共享层 · 工具函数 + 通用组件
 * 所有图表组件均从本文件引入，样式在此处统一导入一次
 * 样式全部带 fallback，其他项目无需定义 CSS 变量即可显示 Indigo 风格
 * ===================================================================== */

/** 默认数值格式化：千分位 */
export const DEFAULT_FORMAT = (v) =>
  Number.isFinite(v) ? Math.round(v).toLocaleString() : String(v)

/** 默认调色板（多系列图表），全部引用 CSS 变量带 fallback */
export const PALETTE = [
  'var(--c-primary, #4f46e5)',
  'var(--c-accent, #06b6d4)',
  'var(--c-accent-2, #8b5cf6)',
  'var(--c-success, #10b981)',
  'var(--c-warning, #f59e0b)',
  'var(--c-danger, #ef4444)',
  'var(--c-info, #3b82f6)',
]

/** 首次挂载后返回 true，用于触发入场动画。 */
export function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  return mounted
}

/** 取一个近似步长（nice number）。 */
export function niceNum(x) {
  if (x <= 0) return 1
  const exp = Math.floor(Math.log10(x))
  const f = x / 10 ** exp
  let nf
  if (f < 1.5) nf = 1
  else if (f < 3) nf = 2
  else if (f < 7) nf = 5
  else nf = 10
  return nf * 10 ** exp
}

/** 计算坐标轴友好的上下界与步长。 */
export function niceBounds(min, max, ticks = 4) {
  if (min === max) {
    min = min < 0 ? min - 1 : 0
    max = (max || 0) + 1
  }
  const span = max - min
  const step = niceNum(span / ticks) || 1
  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step
  return { niceMin, niceMax, step }
}

/** 极坐标转笛卡尔（SVG y 向下：0°=右，90°=下，-90°=上）。 */
export function polar(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

/** 空状态占位，文案可定制。 */
export function ChartEmpty({ text = '暂无数据' }) {
  return (
    <div className="chart-empty">
      <span>{text}</span>
    </div>
  )
}

/** 加载骨架。 */
export function ChartSkeleton({ height = 300 }) {
  return <div className="chart-skeleton" style={{ height }} aria-hidden="true" />
}

/** 标题区（内部组件，各图表与 ChartCard 复用）。 */
export function ChartHeader({ title, subtitle, description, actions, showTitle = true }) {
  if (!showTitle || (title == null && subtitle == null && description == null && actions == null)) return null
  return (
    <div className="chart-head">
      <div className="chart-head-text">
        {title != null && <h4 className="chart-title">{title}</h4>}
        {subtitle != null && <p className="chart-subtitle">{subtitle}</p>}
        {description != null && <div className="chart-desc">{description}</div>}
      </div>
      {actions != null && <div className="chart-actions">{actions}</div>}
    </div>
  )
}

/** Tooltip 浮层（玻璃态），按 viewBox 坐标百分比定位。 */
export function Tooltip({ x, y, vbW, vbH, children }) {
  return (
    <div className="chart-tip" style={{ left: `${(x / vbW) * 100}%`, top: `${(y / vbH) * 100}%` }}>
      {children}
    </div>
  )
}

/** 通用图例列表（支持每项独立颜色与可选占比）。 */
export function LegendList({ items, hover, onHover }) {
  return (
    <ul className="chart-legend">
      {items.map((it, i) => (
        <li key={i} className={hover === i ? 'is-hover' : ''}
          onMouseEnter={() => onHover(i)} onMouseLeave={() => onHover(-1)}>
          <span className="chart-legend-dot" style={{ background: it.color }} />
          <span className="chart-legend-label">{it.label}</span>
          <span className="chart-legend-value">{it.value}</span>
          {it.pct != null && <span className="chart-legend-pct">{it.pct}</span>}
        </li>
      ))}
    </ul>
  )
}

/* =====================================================================
 * 图表类型 SVG 小图标 · 纯 SVG，零依赖，与 Indigo 玻璃态风格匹配
 * ===================================================================== */

export function ChartLineIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
      <path d="M3 20h18" />
      <path d="M3 16V3h18" />
      <path d="M4 13 l4 -5 l4 3 l4 -8 l4 7" fill="none" />
    </svg>
  )
}

export function ChartBarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
      <path d="M3 20h18" />
      <rect x="4" y="10" width="3.2" height="10" rx="1" />
      <rect x="9.4" y="5" width="3.2" height="15" rx="1" />
      <rect x="14.8" y="13" width="3.2" height="7" rx="1" />
    </svg>
  )
}

export function ChartPieIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
      <path d="M12 3 a9 9 0 0 1 9 9 h -9 z" />
      <path d="M12 3 v9 h 9 a9 9 0 0 1 -9 9 a9 9 0 0 1 -9 -9 a9 9 0 0 1 9 -9" />
    </svg>
  )
}

export function ChartAreaIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
      <path d="M3 20h18" />
      <path d="M3 16V3h18v13" />
      <path d="M4 14 l4 -6 l4 3 l4 -9 l4 10 l-16 2 z" />
    </svg>
  )
}

export function ChartRadarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
      <polygon points="12,3 21,8 18,19 6,19 3,8" />
      <polygon points="12,7 17,10 15.5,16.5 8.5,16.5 7,10" opacity="0.7" />
    </svg>
  )
}

/** 图标类型 -> SVG 组件的默认映射（用户可通过 iconMap 覆盖）。 */
const DEFAULT_ICON_MAP = {
  line: ChartLineIcon,
  bar: ChartBarIcon,
  pie: ChartPieIcon,
  area: ChartAreaIcon,
  radar: ChartRadarIcon,
}

/** 默认类型 -> 标题映射（用于 a11y / tooltip）。 */
const DEFAULT_LABEL_MAP = {
  line: '切换为折线图',
  bar: '切换为柱状图',
  pie: '切换为饼图',
  area: '切换为面积图',
  radar: '切换为雷达图',
}

/**
 * ChartTypeSwitch · 图表类型切换图标按钮组。
 * 纯 SVG 小图标 + 分段按钮；点击切换 activeType，可嵌入 ChartHeader 的 actions 区。
 *
 * @param {Object} props
 * @param {string[]} [props.types=['line','bar','pie']] 允许切换的类型列表
 * @param {string}   props.value   当前激活类型，受控
 * @param {(t:string)=>void} props.onChange 切换回调
 * @param {Object}   [props.iconMap]     自定义图标映射，覆盖/扩展 DEFAULT_ICON_MAP
 * @param {Object}   [props.labelMap]    自定义每个类型的 title（无障碍/悬浮提示）
 * @param {string}   [props.className]   外层额外类名
 */
export function ChartTypeSwitch({
  types = ['line', 'bar', 'pie'],
  value,
  onChange,
  iconMap = DEFAULT_ICON_MAP,
  labelMap = DEFAULT_LABEL_MAP,
  className = '',
}) {
  return (
    <div
      className={`chart-type-switch ${className}`}
      role="tablist"
      aria-label="图表类型切换"
    >
      {types.map((t) => {
        const Icon = iconMap[t] || DEFAULT_ICON_MAP[t] || ChartLineIcon
        const title = labelMap[t] || t
        const active = value === t
        return (
          <button
            type="button"
            key={t}
            role="tab"
            aria-selected={active}
            aria-label={title}
            title={title}
            tabIndex={active ? 0 : -1}
            className={active ? 'is-active' : ''}
            onClick={() => onChange && onChange(t)}
          >
            <Icon />
          </button>
        )
      })}
    </div>
  )
}

/* =====================================================================
 * ChartCard · 通用图表容器（导出）
 * 可包装任意图表，或作为自定义内容卡片使用
 * ===================================================================== */

/**
 * 通用图表容器：标题区 + 内容区。
 * @param {Object} props
 * @param {import('react').ReactNode} [props.title]       标题
 * @param {import('react').ReactNode} [props.subtitle]    副标题
 * @param {import('react').ReactNode} [props.description] 描述
 * @param {import('react').ReactNode} [props.actions]     标题右侧操作区
 * @param {import('react').ReactNode} [props.children]    内容
 * @param {string} [props.className]    外层额外类名
 * @param {string} [props.bodyClassName] 内容区额外类名
 * @param {boolean} [props.showTitle=true] 是否显示标题区
 */
export function ChartCard({
  title, subtitle, description, actions, children,
  className = '', bodyClassName = '', showTitle = true,
}) {
  return (
    <div className={`chart-card ${className}`}>
      <ChartHeader title={title} subtitle={subtitle} description={description} actions={actions} showTitle={showTitle} />
      <div className={`chart-card-body ${bodyClassName}`}>{children}</div>
    </div>
  )
}
