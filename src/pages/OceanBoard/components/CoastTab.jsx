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
import { useI18n } from '@i18n/index.js'
import { Panel } from './ui.jsx'

/**
 * 浪高 + 周期 → 适航建议。
 * 返回值里的 level 只是排序与配色用的序号，真正的中文措辞在 i18n 键里。
 */
function seaAdvice(h, period) {
  if (h == null) return { level: 0, color: '#94a3b8', zhKey: 'ocean.coast.level.nodata.zh', adviceKey: 'ocean.coast.level.nodata.advice' }
  // 短周期（<6s）意味着浪陡，同等浪高下更颠簸。
  // 这里不复用 waveLevel 的档位名：那套阈值是「海况等级」的通用分档，
  // 而本页要回答的是「能不能出海」，措辞需要落到可执行判断上，故单独给一套。
  const steep = period != null && period < 6
  if (h < 0.5) {
    return { level: 4, color: '#52c41a', zhKey: 'ocean.coast.level.4.zh', adviceKey: steep ? 'ocean.coast.level.4.adviceSteep' : 'ocean.coast.level.4.adviceNormal' }
  }
  if (h < 1.25) {
    return { level: 3, color: '#a0d911', zhKey: 'ocean.coast.level.3.zh', adviceKey: steep ? 'ocean.coast.level.3.adviceSteep' : 'ocean.coast.level.3.adviceNormal' }
  }
  if (h < 2.5) {
    return { level: 2, color: '#faad14', zhKey: 'ocean.coast.level.2.zh', adviceKey: steep ? 'ocean.coast.level.2.adviceSteep' : 'ocean.coast.level.2.adviceNormal' }
  }
  return { level: 1, color: '#ff4d4f', zhKey: 'ocean.coast.level.1.zh', adviceKey: 'ocean.coast.level.1.advice' }
}

export default function CoastTab({ marine, marineData }) {
  const { t } = useI18n()
  const items = marineData?.items || []

  return (
    <div className="o-tab-content">
      <Panel
        title={`🏖 ${t('ocean.coast.panel')}`}
        source={t('ocean.coast.src')}
        icon={<ExperimentOutlined />}
        loading={marine.loading}
        error={marine.error}
      >
        {!marine.loading && !items.length ? (
          <Empty description={t('ocean.coast.empty')} />
        ) : (
          <>
            <p className="o-coast-lead">
              {t('ocean.coast.lead')}
            </p>
            <div className="o-coast-list">
              {items.map((c, i) => {
                const adv = seaAdvice(c.waveH, c.wavePeriod)
                return (
                  <div key={c.key} className="o-coast-row">
                    <span className="o-coast-rank">{i + 1}</span>
                    <span className="o-coast-name">{c.name}</span>
                    <Tooltip title={t('ocean.coast.tooltip', {
                      swellH: c.swellH == null ? '—' : c.swellH.toFixed(2),
                      swellP: c.swellPeriod?.toFixed(1) ?? '—',
                      windH: c.windWaveH?.toFixed(2) ?? '—',
                    })}>
                      <span className="o-coast-wave" style={{ color: adv.color }}>
                        {c.waveH == null ? '—' : c.waveH.toFixed(2)}
                        <em>m</em>
                      </span>
                    </Tooltip>
                    <span className="o-coast-period">{c.wavePeriod == null ? '—' : `${c.wavePeriod.toFixed(1)} s`}</span>
                    <span className="o-coast-dir">{c.waveDirText || '—'}</span>
                    <Tag bordered={false} color={adv.level >= 3 ? 'green' : adv.level === 2 ? 'orange' : 'red'}>
                      {t(adv.zhKey)}
                    </Tag>
                    <span className="o-coast-advice">{t(adv.adviceKey)}</span>
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
