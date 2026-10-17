import { Panel, Metric } from './ui.jsx'
import { waveLevel } from '../../../lib/earth/glossary.js'
import { getTerm } from '../../../lib/boards/relations.js'
import { useI18n } from '../../../i18n/index.js'
import KeyTermCard from '../../../components/KeyTermCard/KeyTermCard.jsx'

/**
 * 海洋看板「📚 真实案例」页签：用本看板的维度（有效波高分级 / 飓风分级 / ONI 厄尔尼诺指数）
 * 解读真实海洋事件。数值取自 NOAA / NHC / 各国机构的历史通报。
 */

const CASES = [
  {
    id: 'ian-2022',
    icon: '🌀',
    title: 'ocean.case.ian.title',
    date: '2022-09-28',
    source: 'ocean.case.ian.source',
    metrics: [
      { label: 'ocean.case.ian.m1Label', value: 'Cat 5', tone: '#ef4444', info: 'ocean.case.ian.m1Info' },
      { label: 'ocean.case.ian.m2Label', value: 'Cat 4', tone: '#f97316', info: 'ocean.case.ian.m2Info' },
      { label: 'ocean.case.ian.m3Label', value: '> 6 m', tone: waveLevel(6).color, info: 'ocean.case.ian.m3Info' },
    ],
    desc: 'ocean.case.ian.desc',
  },
  {
    id: 'elnino-2023',
    icon: '🌡',
    title: 'ocean.case.elnino.title',
    date: '2023-06 ~ 2024',
    source: 'ocean.case.elnino.source',
    metrics: [
      { label: 'ocean.case.elnino.m1Label', value: '+2.0', tone: '#dc2626', info: 'ocean.case.elnino.m1Info' },
      { label: 'ocean.case.elnino.m2Label', value: '强厄尔尼诺', tone: '#dc2626', info: 'ocean.case.elnino.m2Info' },
      { label: 'ocean.case.elnino.m3Label', value: '全球', info: 'ocean.case.elnino.m3Info' },
    ],
    desc: 'ocean.case.elnino.desc',
  },
  {
    id: 'indian-2004',
    icon: '🌊',
    title: 'ocean.case.indian.title',
    date: '2004-12-26',
    source: 'ocean.case.indian.source',
    metrics: [
      { label: 'ocean.case.indian.m1Label', value: 'M9.1', tone: '#dc2626', info: 'ocean.case.indian.m1Info' },
      { label: 'ocean.case.indian.m2Label', value: '≈23 万', tone: '#dc2626', info: 'ocean.case.indian.m2Info' },
      { label: 'ocean.case.indian.m3Label', value: '数千 km', info: 'ocean.case.indian.m3Info' },
    ],
    desc: 'ocean.case.indian.desc',
  },
]

export default function CaseTab({ theme = 'dark' }) {
  const { t, lang } = useI18n()
  const keyTerm = getTerm('earth', 'waveHeight', lang)
  return (
    <div className="o-case-list">
      <KeyTermCard term={keyTerm} theme={theme} />
      {CASES.map((c, i) => (
        <Panel
          key={c.id}
          icon={c.icon}
          source={t(c.source)}
          title={
            <span className="o-case__title">
              <em className="o-case__no">{t('ocean.case.no', { n: String(i + 1).padStart(2, '0') })}</em>
              <span className="o-case__name">{t(c.title)}</span>
            </span>
          }
        >
          <div className="o-case__date">{t('ocean.case.date', { date: c.date })}</div>
          <div className="o-case__metrics">
            {c.metrics.map((m) => (
              <Metric key={m.label} label={t(m.label)} value={m.value} unit={m.unit} tone={m.tone} info={t(m.info)} />
            ))}
          </div>
          <p className="o-case__desc">{t(c.desc)}</p>
        </Panel>
      ))}
    </div>
  )
}
