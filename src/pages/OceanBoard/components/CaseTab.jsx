import { Panel, Metric } from './ui.jsx'
import { waveLevel } from '../../../lib/earth/glossary.js'
import { getTerm } from '../../../lib/boards/relations.js'
import KeyTermCard from '../../../components/KeyTermCard/KeyTermCard.jsx'

/**
 * 海洋看板「📚 案例」页签：用本看板的维度（有效波高分级 / 飓风分级 / ONI 厄尔尼诺指数）
 * 解读真实海洋事件。数值取自 NOAA / NHC / 各国机构的历史通报。
 */

const CASES = [
  {
    id: 'ian-2022',
    icon: '🌀',
    title: '2022·飓风 Ian',
    date: '2022-09-28',
    source: 'NOAA NHC',
    metrics: [
      { label: '峰值强度', value: 'Cat 5', tone: '#ef4444', info: '萨菲尔-辛普森等级最高级，1 分钟持续风速 ≥ 70 m/s' },
      { label: '登陆强度', value: 'Cat 4', tone: '#f97316', info: '以四级强度登陆佛罗里达西南部（Cayo Costa）' },
      { label: '最大浪高', value: '> 6 m', tone: waveLevel(6).color, info: '对应本看板「浮标最大浪」的极端浪档' },
    ],
    desc:
      'Ian 在墨西哥湾暖水区快速增强，仅用一天就从热带风暴跃升为五级飓风，登陆时带来毁灭性风暴潮与内陆洪灾。' +
      '它把「热带气旋」页签里的 NHC 实时数据与本看板「浮标最大浪」的分级联系了起来：飓风既是风灾，也是海况灾难，' +
      '近岸浪高往往叠加风暴潮，放大破坏。',
  },
  {
    id: 'elnino-2023',
    icon: '🌡',
    title: '2023–2024·强厄尔尼诺',
    date: '2023-06 ~ 2024',
    source: 'NOAA CPC / NOAA PSL',
    metrics: [
      { label: 'ONI 峰值', value: '+2.0', tone: '#dc2626', info: 'Niño 3.4 区海温距平，达到「强厄尔尼诺」门槛（|ONI|≥2.0）' },
      { label: '判定', value: '强厄尔尼诺', tone: '#dc2626', info: '本看板「气候振荡」页签对 ONI≥+0.5 标红' },
      { label: '影响', value: '全球', info: '东亚暖冬、美洲西岸洪涝、赤道太平洋渔业减产' },
    ],
    desc:
      '赤道中东太平洋海表温度异常增暖，通过大气桥影响全球天气。本看板「气候振荡」页签实时绘制 ONI 曲线，' +
      '你能在那里看到这次事件如何从 +0.5 一路爬升到 +2.0——这正是厄尔尼诺从「出现」到「强事件」的演化轨迹。',
  },
  {
    id: 'indian-2004',
    icon: '🌊',
    title: '2004·印度洋大地震与海啸',
    date: '2004-12-26',
    source: 'NOAA / 各国海啸中心',
    metrics: [
      { label: '震级', value: 'M9.1', tone: '#dc2626', info: '苏门答腊俯冲带巨型逆冲，释放能量相当于数万颗原子弹' },
      { label: '遇难', value: '≈23 万', tone: '#dc2626', info: '环印度洋 14 国，史上死亡人数最多的海啸之一' },
      { label: '越洋传播', value: '数千 km', info: '海啸横扫印度洋，甚至抵达非洲东岸' },
    ],
    desc:
      '这次灾难直接催生了印度洋海啸预警系统。它说明海啸不只在太平洋（本看板海啸源主要覆盖太平洋中心），' +
      '任何俯冲带强震都可能激发跨洋海啸。理解「地震页签的俯冲带巨震」与「海啸公告」的因果链，是读懂本看板的关键。',
  },
]

export default function CaseTab({ theme = 'dark' }) {
  const keyTerm = getTerm('earth', 'waveHeight')
  return (
    <div className="o-case-list">
      <KeyTermCard term={keyTerm} theme={theme} />
      {CASES.map((c) => (
        <Panel key={c.id} title={c.title} source={c.source} icon={c.icon}>
          <div className="o-case__date">📅 {c.date}</div>
          <div className="o-case__metrics">
            {c.metrics.map((m) => (
              <Metric key={m.label} label={m.label} value={m.value} unit={m.unit} tone={m.tone} info={m.info} />
            ))}
          </div>
          <p className="o-case__desc">{c.desc}</p>
        </Panel>
      ))}
    </div>
  )
}
