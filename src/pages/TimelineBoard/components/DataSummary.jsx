/**
 * 数据总结区块 —— 只总结深空 / 地球 / 海洋三方的数据现状，不含功能版本信息。
 *
 * 每方一列，回答三件事：
 *   1. 这块板在监控什么（源清单，逐个标状态点）
 *   2. 现在的数据活不活（正常 / 故障 / 等待 + 进度条）
 *   3. 数据新不新（该方最新鲜与最陈旧的一条距今多久）
 *
 * 纯展示组件：数据由父组件算好（boards / ages / 四个总数），这里不做数据加工。
 */

const ICON = { astro: '🛰️', geo: '🌍', ocean: '🌊' }

import { useI18n } from '@i18n/index.js'

export default function DataSummary({
  boards,
  ages = {},
  totalOk,
  totalSrc,
  totalBad,
  totalWait,
  theme = 'dark',
}) {
  const { t } = useI18n()
  const isDark = theme !== 'light'

  return (
    <div className={`tl-summary${isDark ? '' : ' light'}`}>
      <div className="tl-summary__head">
        <h3 className="tl-summary__title">{t('timeline.summaryTitle')}</h3>
        <div className="tl-summary__meta">
          <span>{t('timeline.summaryDataSource')} <b>{totalSrc}</b></span>
          <span className="ok">{t('timeline.summaryOk')} <b>{totalOk}</b></span>
          <span className="bad">{t('timeline.summaryFault')} <b>{totalBad}</b></span>
          <span className="wait">{t('timeline.summaryWait')} <b>{totalWait}</b></span>
        </div>
      </div>

      <div className="tl-summary__cols">
        {boards.map((b) => {
          const pct = b.total ? Math.round((b.ok / b.total) * 100) : 0
          const age = ages[b.key] || {}
          return (
            <section key={b.key} className="tl-summary__col" style={{ '--tl-accent': b.color }}>
              <header className="tl-summary__chd">
                <span className="tl-summary__bicon" aria-hidden>{ICON[b.key]}</span>
                <span className="tl-summary__bname">{b.title}</span>
                <span className="tl-summary__bnum">{b.ok}/{b.total}</span>
              </header>

              <div className="tl-summary__bar">
                <span className="tl-summary__bar-fill" style={{ width: `${pct}%`, background: b.color }} />
              </div>

              <ul className="tl-summary__srcs">
                {(b.sources || []).map((s) => (
                  <li key={s.name} className={s.ok ? 'is-ok' : 'is-down'}>
                    <span className="tl-summary__dot" />
                    <span className="tl-summary__sname">{s.name}</span>
                    <span className="tl-summary__scycle">{s.cycleText}</span>
                  </li>
                ))}
              </ul>

              <footer className="tl-summary__cft">
                <span>{t('timeline.summaryNewest')} <b>{age.freshest || '—'}</b></span>
                <span>{t('timeline.summaryOldest')} <b>{age.oldest || '—'}</b></span>
              </footer>
            </section>
          )
        })}
      </div>
    </div>
  )
}
