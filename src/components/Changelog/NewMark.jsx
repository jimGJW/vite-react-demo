import { useI18n } from '@i18n/index.js'
import { ROUTE_LATEST, getRelease, isFreshRelease } from './releases.js'
import './Changelog.scss'

/**
 * 「新」红标 —— 钉在页面上**具体的新功能内容处**（不只是侧边栏和时间轴）。
 *
 * 用法：把 <NewMark route="/chatbot" /> 放在新功能块的标题/容器旁。
 * 判定逻辑与 PeriodTag 完全一致：该路由最近一次改动所属批次处于
 * FRESH_DAYS（7 天）窗口内才渲染（红色「新」徽标 + 修改日期 tooltip），
 * 过窗后自动消失——页面代码无需回头摘除。
 *
 * props:
 *  - route: 功能所在路由（据此查最近批次与日期）
 *  - releaseId: 直接指定批次 id（可选，覆盖 route 推导）
 *  - inline: true 时渲染为行内小徽标（默认块级，适合标题旁）
 */
export function NewMark({ route, releaseId, inline = false }) {
  const { t } = useI18n()
  const id = releaseId || (route ? ROUTE_LATEST[route] : undefined)
  if (!id) return null
  const r = getRelease(id)
  if (!r || !isFreshRelease(id)) return null

  return (
    <span
      className={`new-mark${inline ? ' new-mark--inline' : ''}`}
      title={t('changelog.batchTip', { date: r.label, title: t('changelog.newMark') })}
    >
      <span className="new-mark__dot" />
      {t('changelog.newMark')}
      <span className="new-mark__date">{r.short}</span>
    </span>
  )
}
