import { useI18n, pickText } from '@i18n/index.js'
import { ROUTE_LATEST, getRelease, isFreshRelease } from './releases.js'
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
 *
 * 「新」标红：批次处于 FRESH_DAYS 窗口内时，tag 整体转为红色（--c-danger）+
 * 圆点脉冲动画，过窗自动恢复批次原色（配色见 releases.js，8 批互不相同）。
 */
export function PeriodTag({ route, releaseId, showLabel = true, as = 'subscript' }) {
  const { lang, t } = useI18n()
  const id = releaseId || (route ? ROUTE_LATEST[route] : undefined)
  if (!id) return null
  const r = getRelease(id)
  if (!r) return null
  const fresh = isFreshRelease(id)

  return (
    <span
      className={`period-tag period-tag--${as}${fresh ? ' period-tag--fresh' : ''}`}
      style={{ '--pt-color': r.color }}
      title={t('changelog.batchTip', { date: r.label, title: pickText(r.title, lang) })}
    >
      <span className="period-tag__dot" />
      {showLabel && <span className="period-tag__label">{r.short}</span>}
    </span>
  )
}
