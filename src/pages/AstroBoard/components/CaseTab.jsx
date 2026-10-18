import { Panel, Metric } from './ui.jsx'
import { getTerm } from '@lib/boards/relations.js'
import KeyTermCard from '@components/KeyTermCard/KeyTermCard.jsx'
import { useI18n } from '@i18n/index.js'

/**
 * 深空看板「📚 真实案例」页签：用本看板的维度（发射窗口 / 月相 / 太阳活动周 / 流星雨）
 * 解读真实航天与天象事件。均为公开史料（NASA / CNSA / NOAA SWPC 通报）。
 *
 * CASES 只存「键引用 + 非译值」（型号/缩写等不翻译的字段），
 * 所有面向用户的文字在组件内经 t() 解析，保证切换语言时案例内容随之变化。
 */

const CASES = [
  {
    id: 'artemis-2022',
    icon: '🚀',
    titleKey: 'astro.caseArtemisTitle',
    date: '2022-11-16',
    source: 'NASA',
    metrics: [
      { labelKey: 'astro.caseRocket', value: 'SLS', tone: '#a78bfa' },
      { labelKey: 'astro.caseMission', valueKey: 'astro.caseArtemisMission', tone: '#38bdf8' },
      { labelKey: 'astro.caseSpacecraft', value: 'Orion', tone: '#34d399' },
    ],
    descKey: 'astro.caseArtemisDesc',
  },
  {
    id: 'change6-2024',
    icon: '🌑',
    titleKey: 'astro.caseChange6Title',
    date: '2024-05-03 ~ 06-25',
    source: 'CNSA',
    metrics: [
      { labelKey: 'astro.caseLanding', valueKey: 'astro.caseChange6Landing', tone: '#f472b6' },
      { labelKey: 'astro.caseSample', value: '≈2 kg', tone: '#34d399' },
      { labelKey: 'astro.caseSignificance', valueKey: 'astro.caseChange6Significance', tone: '#fbbf24' },
    ],
    descKey: 'astro.caseChange6Desc',
  },
  {
    id: 'solar-max-2024',
    icon: '☀️',
    titleKey: 'astro.caseSolarMaxTitle',
    date: '2024 ~ 2025',
    source: 'NOAA SWPC',
    metrics: [
      { labelKey: 'astro.casePhase', valueKey: 'astro.caseSolarPhase', tone: '#f97316' },
      { labelKey: 'astro.caseTypicalEvent', valueKey: 'astro.caseSolarEvent', tone: '#ef4444' },
      { labelKey: 'astro.caseCompanion', valueKey: 'astro.caseSolarCompanion', tone: '#38bdf8' },
    ],
    descKey: 'astro.caseSolarMaxDesc',
  },
]

export default function CaseTab({ theme = 'dark' }) {
  const { t, lang } = useI18n()
  const keyTerm = getTerm('astro', 'sunspot', lang)
  return (
    <div className="astro-case-list">
      <KeyTermCard term={keyTerm} theme={theme} />
      {CASES.map((c, i) => (
        <Panel
          key={c.id}
          icon={c.icon}
          source={c.source}
          /* 标题带「案例 0N」编号徽章：案例卡和其他数据面板共用 Panel 外壳，
             标题原本长得一模一样，滚下来分不清哪几张是案例。编号既是序号也是身份标识。 */
          title={
            <span className="astro-case__title">
              <em className="astro-case__no">{t('astro.caseNo', { n: String(i + 1).padStart(2, '0') })}</em>
              <span className="astro-case__name">{t(c.titleKey)}</span>
            </span>
          }
        >
          <div className="astro-case__date">📅 {c.date}</div>
          <div className="astro-case__metrics">
            {c.metrics.map((m) => (
              <Metric
                key={m.labelKey}
                label={t(m.labelKey)}
                value={m.valueKey ? t(m.valueKey) : m.value}
                unit={m.unit}
                tone={m.tone}
              />
            ))}
          </div>
          <p className="astro-case__desc">{t(c.descKey)}</p>
        </Panel>
      ))}
    </div>
  )
}
