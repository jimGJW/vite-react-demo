import { Panel, Metric } from './ui.jsx'
import { getTerm } from '../../../lib/boards/relations.js'
import KeyTermCard from '../../../components/KeyTermCard/KeyTermCard.jsx'

/**
 * 深空看板「📚 真实案例」页签：用本看板的维度（发射窗口 / 月相 / 太阳活动周 / 流星雨）
 * 解读真实航天与天象事件。均为公开史料（NASA / CNSA / NOAA SWPC 通报）。
 */

const CASES = [
  {
    id: 'artemis-2022',
    icon: '🚀',
    title: '2022·Artemis I 无人绕月首飞',
    date: '2022-11-16',
    source: 'NASA',
    metrics: [
      { label: '火箭', value: 'SLS', tone: '#a78bfa' },
      { label: '任务', value: '绕月 25 天', tone: '#38bdf8' },
      { label: '飞船', value: 'Orion', tone: '#34d399' },
    ],
    desc:
      '阿尔忒弥斯一号是重返月球计划的第一步，SLS 火箭将猎户座飞船送入绕月轨道，' +
      '验证生命保障与深空通信。它对应本看板「航天发射」页签的发射追踪——每一次发射都是一条可回放的轨道曲线。',
  },
  {
    id: 'change6-2024',
    icon: '🌑',
    title: '2024·嫦娥六号月背采样返回',
    date: '2024-05-03 ~ 06-25',
    source: 'CNSA',
    metrics: [
      { label: '着陆点', value: '南极-艾特肯', tone: '#f472b6' },
      { label: '样本', value: '≈2 kg', tone: '#34d399' },
      { label: '意义', value: '人类首次', tone: '#fbbf24' },
    ],
    desc:
      '嫦娥六号在月球背面南极-艾特肯盆地着陆并采样，经鹊桥二号中继返回地球，' +
      '是人类首次从月背取回样品。它和本看板「今晚星空」里的月相/月球数据呼应：我们关注的卫星，正被一点点揭开。',
  },
  {
    id: 'solar-max-2024',
    icon: '☀️',
    title: '2024–2025·第 25 太阳活动周极大期',
    date: '2024 ~ 2025',
    source: 'NOAA SWPC',
    metrics: [
      { label: '阶段', value: '太阳极大', tone: '#f97316' },
      { label: '典型事件', value: 'X 级耀斑', tone: '#ef4444' },
      { label: '伴随', value: '极光南扩', tone: '#38bdf8' },
    ],
    desc:
      '太阳活动以约 11 年为周期，极大期黑子、耀斑与日冕物质抛射频发。本看板「太阳活动」页签实时绘制黑子数与耀斑等级，' +
      '你在那里能看到活动水平随太阳周的起伏——这也是近年高纬地区频现极光的根因。',
  },
]

export default function CaseTab({ theme = 'dark' }) {
  const keyTerm = getTerm('astro', 'sunspot')
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
              <em className="astro-case__no">案例 {String(i + 1).padStart(2, '0')}</em>
              <span className="astro-case__name">{c.title}</span>
            </span>
          }
        >
          <div className="astro-case__date">📅 {c.date}</div>
          <div className="astro-case__metrics">
            {c.metrics.map((m) => (
              <Metric key={m.label} label={m.label} value={m.value} unit={m.unit} tone={m.tone} />
            ))}
          </div>
          <p className="astro-case__desc">{c.desc}</p>
        </Panel>
      ))}
    </div>
  )
}
