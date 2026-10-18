import { Panel, Metric } from './ui.jsx'
import { magBand, depthClass } from '@lib/earth/glossary.js'
import { getTerm } from '@lib/boards/relations.js'
import KeyTermCard from '@components/KeyTermCard/KeyTermCard.jsx'
import { useI18n } from '@i18n/index.js'

/**
 * 地球看板「📚 真实案例」页签：用本看板的维度（震级分档色 / 震源深度带 / 火山航空色码）
 * 解读三个真实历史事件，把「名词解释」里冷冰冰的阈值落到具体案例上。
 * 案例均为公开史料（USGS / EMSC / 各国应急机构通报），数值取权威初报/修订值。
 *
 * CASES 只存「键引用 + 非译值」（M7.8 / RED 等），面向用户的文字在组件内经 t() 解析。
 */

const CASES = [
  {
    id: 'turkey-2023',
    icon: '🪨',
    titleKey: 'geo.case.turkeyTitle',
    date: '2023-02-06',
    source: 'USGS / EMSC 历史目录',
    metrics: [
      { labelKey: 'geo.case.magMain', value: 'M7.8', tone: magBand(7.8).color, infoKey: 'geo.case.turkeyMagInfo' },
      { labelKey: 'geo.case.depth', value: '≈18 km', unit: '', tone: depthClass(18).color, infoKey: 'geo.case.depthShallow' },
      { labelKey: 'geo.case.magAftershock', value: 'M7.5', tone: magBand(7.5).color, infoKey: 'geo.case.turkeyAftershockInfo' },
    ],
    descKey: 'geo.case.turkeyDesc',
  },
  {
    id: 'tonga-2022',
    icon: '🌋',
    titleKey: 'geo.case.tongaTitle',
    date: '2022-01-15',
    source: 'USGS HANS / NOAA tsunami.gov',
    metrics: [
      { labelKey: 'geo.case.plumeHeight', value: '≈58 km', infoKey: 'geo.case.tongaPlumeInfo' },
      { labelKey: 'geo.case.transoTsunami', valueKey: 'geo.case.tongaTsunamiVal', tone: '#dc2626', infoKey: 'geo.case.tongaTsunamiInfo' },
      { labelKey: 'geo.case.aviationCode', value: 'RED', tone: '#dc2626', infoKey: 'geo.case.aviationTop' },
    ],
    descKey: 'geo.case.tongaDesc',
  },
  {
    id: 'tohoku-2011',
    icon: '🌊',
    titleKey: 'geo.case.tohokuTitle',
    date: '2011-03-11',
    source: 'JMA / USGS',
    metrics: [
      { labelKey: 'geo.case.magnitude', value: 'M9.0', tone: magBand(9).color, infoKey: 'geo.case.tohokuMagInfo' },
      { labelKey: 'geo.case.depth', value: '≈29 km', tone: depthClass(29).color, infoKey: 'geo.case.tohokuDepthInfo' },
      { labelKey: 'geo.case.maxRunup', value: '≈40 m', tone: '#dc2626', infoKey: 'geo.case.tohokuRunupInfo' },
    ],
    descKey: 'geo.case.tohokuDesc',
  },
]

export default function CaseTab({ theme = 'dark' }) {
  const { t, lang } = useI18n()
  const keyTerm = getTerm('earth', 'depth', lang)
  return (
    <div className="geo-case-list">
      <KeyTermCard term={keyTerm} theme={theme} />
      {CASES.map((c, i) => (
        <Panel
          key={c.id}
          icon={c.icon}
          source={c.source}
          title={
            <span className="geo-case__title">
              <em className="geo-case__no">{t('geo.caseNo', { no: String(i + 1).padStart(2, '0') })}</em>
              <span className="geo-case__name">{t(c.titleKey)}</span>
            </span>
          }
        >
          <div className="geo-case__date">📅 {c.date}</div>
          <div className="geo-case__metrics">
            {c.metrics.map((m) => (
              <Metric
                key={m.labelKey}
                label={t(m.labelKey)}
                value={m.valueKey ? t(m.valueKey) : m.value}
                unit={m.unit}
                tone={m.tone}
                info={m.infoKey ? t(m.infoKey) : undefined}
              />
            ))}
          </div>
          <p className="geo-case__desc">{t(c.descKey)}</p>
        </Panel>
      ))}
    </div>
  )
}
