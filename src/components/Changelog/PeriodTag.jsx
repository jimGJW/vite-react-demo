import { ROUTE_LATEST, getRelease } from './releases.js'
import './Changelog.scss'

/**
 * 时间段下标 icon：展示某个功能「最近一次改动所属批次」。
 * 多用于侧边栏导航项 label 之后，以「上标」形式呈现。
 *
 * props:
 *  - route:      路由 key（如 '/perf-lab'），自动查 ROUTE_LATEST
 *  - releaseId:  也可直接传批次 id 覆盖
 *  - showLabel: 是否显示简短日期文字（如 9/27），默认 true
 *  - as:        'subscript'（上标，默认）| 'inline'（行内药丸）
 */
export function PeriodTag({ route, releaseId, showLabel = true, as = 'subscript' }) {
  const id = releaseId || (route ? ROUTE_LATEST[route] : undefined)
  if (!id) return null
  const r = getRelease(id)
  if (!r) return null

  return (
    <span
      className={`period-tag period-tag--${as}`}
      style={{ '--pt-color': r.color }}
      title={`改动批次：${r.label} · ${r.title}`}
    >
      <span className="period-tag__dot" />
      {showLabel && <span className="period-tag__label">{r.short}</span>}
    </span>
  )
}
