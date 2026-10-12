/**
 * 海洋看板「🏖 海岸榜」页签：沿海城市按浪高排序，并给出适航建议。
 *
 * 与「海况预报」页签共用同一份 marine 数据，但视角不同：
 * 那边看的是**时间轴**（这周哪天好），这边看的是**空间对比**（今天哪片海最不平静），
 * 并把浪高翻译成「能不能出海」这类可执行的判断。
 *
 * 适航建议的口径写在这里（展示层口径，不是安全标准）：
 * 浪高 + 周期共同决定体感——同样的 1.5 m，周期 4 s 的短涌很颠，周期 10 s 的长涌则平缓。
 * 所以建议里同时看这两个数，而不是只看浪高。
 */
import { ExperimentOutlined } from '@ant-design/icons'
import { Empty, Tag, Tooltip } from 'antd'
import { Panel } from './ui.jsx'

/**
 * 浪高 + 周期 → 适航建议。
 * 返回值里的 level 只是排序与配色用的序号，真正的中文措辞在 advice 里。
 */
function seaAdvice(h, period) {
  if (h == null) return { level: 0, zh: '无数据', color: '#94a3b8', advice: '该海域本次未取到浪高' }
  // 短周期（<6s）意味着浪陡，同等浪高下更颠簸。
  // 这里不复用 waveLevel 的档位名：那套阈值是「海况等级」的通用分档，
  // 而本页要回答的是「能不能出海」，措辞需要落到可执行判断上，故单独给一套。
  const steep = period != null && period < 6
  if (h < 0.5) {
    return { level: 4, zh: '海况平稳', color: '#52c41a', advice: steep ? '浪不高但周期短、偏碎，近岸玩水无碍，小艇略颠' : '适合近岸活动、潜水与小型船出海' }
  }
  if (h < 1.25) {
    return { level: 3, zh: '轻浪', color: '#a0d911', advice: steep ? '风浪为主、海面碎，小型船需留意颠簸' : '多数船只可正常作业，新手建议跟船' }
  }
  if (h < 2.5) {
    return { level: 2, zh: '中浪', color: '#faad14', advice: steep ? '浪陡且乱，小型船建议取消行程' : '小型船谨慎，大型船正常' }
  }
  return { level: 1, zh: '大浪', color: '#ff4d4f', advice: '不建议出海，港口作业与近岸游玩都应避开' }
}

export default function CoastTab({ marine, marineData }) {
  const items = marineData?.items || []

  return (
    <div className="o-tab-content">
      <Panel
        title="🏖 海岸海况榜"
        source="Open-Meteo Marine（按当前浪高从大到小）"
        icon={<ExperimentOutlined />}
        loading={marine.loading}
        error={marine.error}
      >
        {!marine.loading && !items.length ? (
          <Empty description="未取到海岸海况数据" />
        ) : (
          <>
            <p className="o-coast-lead">
              排序按当前浪高从大到小。同一浪高下，周期越短浪越陡、体感越颠——
              所以建议里把周期一起算了进去，不只看浪高一个数字。
            </p>
            <div className="o-coast-list">
              {items.map((c, i) => {
                const adv = seaAdvice(c.waveH, c.wavePeriod)
                return (
                  <div key={c.key} className="o-coast-row">
                    <span className="o-coast-rank">{i + 1}</span>
                    <span className="o-coast-name">{c.name}</span>
                    <Tooltip title={`${c.swellH == null ? '' : `涌浪 ${c.swellH.toFixed(2)} m / ${c.swellPeriod?.toFixed(1) ?? '—'} s，风浪 ${c.windWaveH?.toFixed(2) ?? '—'} m`}`}>
                      <span className="o-coast-wave" style={{ color: adv.color }}>
                        {c.waveH == null ? '—' : c.waveH.toFixed(2)}
                        <em>m</em>
                      </span>
                    </Tooltip>
                    <span className="o-coast-period">{c.wavePeriod == null ? '—' : `${c.wavePeriod.toFixed(1)} s`}</span>
                    <span className="o-coast-dir">{c.waveDirText || '—'}</span>
                    <Tag bordered={false} color={adv.level >= 3 ? 'green' : adv.level === 2 ? 'orange' : 'red'}>
                      {adv.zh}
                    </Tag>
                    <span className="o-coast-advice">{adv.advice}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Panel>
    </div>
  )
}
