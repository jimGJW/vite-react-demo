/**
 * 地球看板「📈 气候档案」页签：单座城市近十年的年均温与年降水（ERA5 再分析）。
 *
 * 为什么单列一页：「地表与气候」页签给的是**全球**温度距平与温室气体浓度，
 * 讲的是全球背景；这里把尺度收到**一座城市**，让人看到十年尺度在自己家门口的样子。
 * 十年年均温的起伏是天气噪声与长期趋势的叠加——单看两三年容易误判，
 * 连成十年一串才有意义。
 *
 * 数据口径：Open-Meteo Archive 的 ERA5 再分析逐日值，服务端已聚合成年均值，
 * 前端拿到的就是 10 个点。有效年份判定为该年有 ≥300 天观测（不足的年不纳入，
 * 否则当年未过完会把年均温拉低）。
 */
import { ExperimentOutlined } from '@ant-design/icons'
import { Empty, Statistic } from 'antd'
import { Panel } from './ui.jsx'
import { useI18n } from '@i18n/index.js'

/** 年均温 → 条形宽度与配色：以 10 年区间为标尺，冷暖用蓝红区分 */
function barOf(v, min, max) {
  if (v == null || max === min) return { width: '0%', color: '#94a3b8' }
  const pct = ((v - min) / (max - min)) * 100
  return {
    width: `${Math.max(4, pct)}%`,
    color: v >= (min + max) / 2 ? '#fa541c' : '#1677ff',
  }
}

export default function ArchiveTab({ archive, archiveData }) {
  const { t } = useI18n()
  const years = archiveData?.years || []
  const city = archiveData?.city || ''
  const temps = years.map((y) => y.tempMean).filter((v) => v != null)
  const min = temps.length ? Math.min(...temps) : 0
  const max = temps.length ? Math.max(...temps) : 0
  const first = years[0]
  const last = years[years.length - 1]
  const delta = first && last && first.tempMean != null && last.tempMean != null
    ? last.tempMean - first.tempMean
    : null

  return (
    <div className="geo-tab-content">
      <Panel
        title={'📈 ' + t('geo.archive.title')}
        source={t('geo.archive.source')}
        icon={<ExperimentOutlined />}
        loading={archive.loading}
        error={archive.error}
      >
        {!archive.loading && !years.length ? (
          <Empty description={t('geo.archive.empty')} />
        ) : (
          <>
            <div className="geo-arch-summary">
              <Statistic title={t('geo.archive.statCity')} value={city} />
              <Statistic
                title={t('geo.archive.statSpan')}
                value={max - min}
                precision={2}
                suffix="°C"
              />
              <Statistic
                title={t('geo.archive.statChange', { from: first?.year, to: last?.year })}
                value={delta}
                precision={2}
                suffix="°C"
                valueStyle={{ color: delta == null ? undefined : delta > 0 ? '#cf1322' : '#3f8600' }}
              />
            </div>
            <p className="geo-arch-lead">
              {t('geo.archive.lead', { delta: delta == null ? '—' : delta.toFixed(1) })}
            </p>
            <div className="geo-arch-table">
              {years.map((y) => {
                const bar = barOf(y.tempMean, min, max)
                const precipBar = (() => {
                  const ps = years.map((v) => v.precip).filter((v) => v != null)
                  const pMax = ps.length ? Math.max(...ps) : 0
                  return pMax ? `${Math.max(4, (y.precip / pMax) * 100)}%` : '0%'
                })()
                return (
                  <div key={y.year} className="geo-arch-row">
                    <span className="geo-arch-year">{y.year}</span>
                    <div className="geo-arch-barWrap">
                      <div className="geo-arch-bar" style={{ width: bar.width, background: bar.color }} />
                      <span className="geo-arch-val">{y.tempMean?.toFixed(2)}°C</span>
                    </div>
                    <div className="geo-arch-barWrap">
                      <div className="geo-arch-bar is-precip" style={{ width: precipBar }} />
                      <span className="geo-arch-val">{y.precip} mm</span>
                    </div>
                    <span className="geo-arch-days">{t('geo.archive.days', { n: y.days })}</span>
                  </div>
                )
              })}
            </div>
            <div className="geo-arch-legend">
              <span><i className="geo-arch-dot is-temp" />{t('geo.archive.legendTemp')}</span>
              <span><i className="geo-arch-dot is-precip" />{t('geo.archive.legendPrecip')}</span>
            </div>
          </>
        )}
      </Panel>
    </div>
  )
}
