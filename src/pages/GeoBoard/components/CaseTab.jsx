import { Panel, Metric } from './ui.jsx'
import { magBand, depthClass } from '../../../lib/earth/glossary.js'
import { getTerm } from '../../../lib/boards/relations.js'
import KeyTermCard from '../../../components/KeyTermCard/KeyTermCard.jsx'

/**
 * 地球看板「📚 真实案例」页签：用本看板的维度（震级分档色 / 震源深度带 / 火山航空色码）
 * 解读三个真实历史事件，把「名词解释」里冷冰冰的阈值落到具体案例上。
 * 案例均为公开史料（USGS / EMSC / 各国应急机构通报），数值取权威初报/修订值。
 */

const CASES = [
  {
    id: 'turkey-2023',
    icon: '🪨',
    title: '2023·土耳其–叙利亚双震',
    date: '2023-02-06',
    source: 'USGS / EMSC 历史目录',
    metrics: [
      { label: '主震震级', value: 'M7.8', tone: magBand(7.8).color, info: '东安纳托利亚断裂带走滑破裂，属本看板「M6+ 强震」红档' },
      { label: '震源深度', value: '≈18 km', unit: '', tone: depthClass(18).color, info: '浅源：能量直达地表，破坏半径大' },
      { label: '最强余震', value: 'M7.5', tone: magBand(7.5).color, info: '主震后约 9 小时发生在另一段断层' },
    ],
    desc:
      '两次大震在一天内沿两条近平行断层相继破裂，浅源 + 人口稠密 + 建筑抗震不足三者叠加，' +
      '造成两国逾 5 万人遇难。它直观演示了本看板两个核心维度：震级决定能量量级（M7.8 已是巨震），' +
      '而深度决定能量有多少能传到地表——同样震级，深源地震的地面感受往往弱得多。',
  },
  {
    id: 'tonga-2022',
    icon: '🌋',
    title: '2022·汤加海底火山大喷发',
    date: '2022-01-15',
    source: 'USGS HANS / NOAA tsunami.gov',
    metrics: [
      { label: '喷发柱高度', value: '≈58 km', info: '突破对流层顶进入平流层，近年最强火山爆发之一' },
      { label: '越洋海啸', value: '环太平洋', tone: '#dc2626', info: '火山口塌陷触发，日本/美洲西岸均录得 1m+ 涌浪' },
      { label: '火山航空色码', value: 'RED', tone: '#dc2626', info: '对应本看板火山页的最高航空警戒级别' },
    ],
    desc:
      '洪阿哈阿帕伊岛（Hunga Tonga–Hunga Haʻapai）是一座海底火山，喷发引发跨洋海啸，' +
      '连 1 万公里外的秘鲁都因异常涌浪发生原油泄漏。这个案例把「火山警报」与「海啸公告」两个页签串了起来：' +
      '海底火山不仅能喷发，还能像海底地震一样激发海啸，且更难预警。',
  },
  {
    id: 'tohoku-2011',
    icon: '🌊',
    title: '2011·东日本大震与海啸',
    date: '2011-03-11',
    source: 'JMA / USGS',
    metrics: [
      { label: '震级', value: 'M9.0', tone: magBand(9).color, info: '俯冲带巨型逆冲，史上观测到的最大震级之一' },
      { label: '震源深度', value: '≈29 km', tone: depthClass(29).color, info: '板块界面浅部闭锁段突然错动' },
      { label: '最大涌高', value: '≈40 m', tone: '#dc2626', info: '宫城/岩手沿岸，远超海啸预警基准' },
    ],
    desc:
      '太平洋板块在 Japan Trench 俯冲时突然回弹，释放的能量相当于数千颗原子弹。' +
      '巨大海啸越过防波堤，并引发福岛第一核电站事故。它提醒我们：本看板的「24h 地震」只是全球活动的冰山一角，' +
      '真正的巨震往往来自俯冲带，且破坏主要来自伴随的海啸而非震动本身。',
  },
]

export default function CaseTab({ theme = 'dark' }) {
  const keyTerm = getTerm('earth', 'depth')
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
              <em className="geo-case__no">案例 {String(i + 1).padStart(2, '0')}</em>
              <span className="geo-case__name">{c.title}</span>
            </span>
          }
        >
          <div className="geo-case__date">📅 {c.date}</div>
          <div className="geo-case__metrics">
            {c.metrics.map((m) => (
              <Metric key={m.label} label={m.label} value={m.value} unit={m.unit} tone={m.tone} info={m.info} />
            ))}
          </div>
          <p className="geo-case__desc">{c.desc}</p>
        </Panel>
      ))}
    </div>
  )
}
