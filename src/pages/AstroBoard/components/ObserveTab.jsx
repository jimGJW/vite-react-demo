/**
 * 深空看板「🔭 观测条件」页签：各城市此刻的云量 / 能见度 / 日落时间。
 *
 * 与「今晚星空」页签的分工：那边算的是**天体在哪**（几何，纯本地计算，永远准确），
 * 这边给的是**大气让不让你看**（天气，来自 Open-Meteo 实况）。
 * 月相再好、行星再亮，云量 100% 也什么都看不见——两个页签合起来才回答得了
 * 「今晚值不值得出门」。
 *
 * 评分口径（服务端算好下发，0–100）：云量 60% + 能见度 20% + 降水 15% + 大风 5%。
 * 这里只负责把分数翻译成颜色和一句话建议，不重新算分。
 */
import { ExperimentOutlined } from '@ant-design/icons'
import { Empty, Tooltip } from 'antd'
import { Panel } from './ui.jsx'
import { useI18n } from '@i18n/index.js'

/** 分数 → 档位 key（颜色与建议经 t() 查找）。阈值是展示口径，与服务端评分权重配套 */
function bandOf(score) {
  if (score == null) return { key: 'nodata', color: '#94a3b8' }
  if (score >= 80) return { key: 'excellent', color: '#52c41a' }
  if (score >= 60) return { key: 'good', color: '#a0d911' }
  if (score >= 40) return { key: 'fair', color: '#faad14' }
  if (score >= 20) return { key: 'poor', color: '#fa8c16' }
  return { key: 'bad', color: '#ff4d4f' }
}

const BAND_LABEL = {
  nodata: 'astro.obsNodata', excellent: 'astro.obsExcellent', good: 'astro.obsGood',
  fair: 'astro.obsFair', poor: 'astro.obsPoor', bad: 'astro.obsBad',
}
const BAND_ADVICE = {
  nodata: 'astro.obsAdviceNodata', excellent: 'astro.obsAdviceExcellent', good: 'astro.obsAdviceGood',
  fair: 'astro.obsAdviceFair', poor: 'astro.obsAdvicePoor', bad: 'astro.obsAdviceBad',
}

/** 日落时间 "2026-10-13T18:12" → "18:12" */
function hhmm(t) {
  if (!t) return '—'
  const m = String(t).match(/T(\d{2}:\d{2})/)
  return m ? m[1] : t
}

export default function ObserveTab({ observe, observeData }) {
  const { t } = useI18n()
  const items = observeData?.items || []

  return (
    <div className="astro-tab-content">
      <Panel
        title={`🔭 ${t('astro.obsTitle')}`}
        source={t('astro.obsSource')}
        icon={<ExperimentOutlined />}
        loading={observe.loading}
        error={observe.error}
      >
        {!observe.loading && !items.length ? (
          <Empty description={t('astro.obsEmpty')} />
        ) : (
          <>
            <p className="astro-obs-lead">
              {t('astro.obsLead1')}<b>{t('astro.obsLeadBold')}</b>{t('astro.obsLead2')}
            </p>
            <div className="astro-obs-grid">
              {items.map((c) => {
                const band = bandOf(c.score)
                return (
                  <div key={c.key} className="astro-obs-card">
                    <div className="astro-obs-head">
                      <b className="astro-obs-city">{c.name}</b>
                      <Tooltip title={t(BAND_ADVICE[band.key])}>
                        <span className="astro-obs-score" style={{ color: band.color }}>
                          {c.score ?? '—'}
                        </span>
                      </Tooltip>
                    </div>
                    <div className="astro-obs-tag" style={{ color: band.color }}>
                      {t(BAND_LABEL[band.key])}
                    </div>
                    <dl className="astro-obs-rows">
                      <dt>{t('astro.obsCloud')}</dt>
                      <dd>{c.cloudCover == null ? '—' : `${Math.round(c.cloudCover)}%`}</dd>
                      <dt>{t('astro.obsVisibility')}</dt>
                      <dd>{c.visibilityM == null ? '—' : `${(c.visibilityM / 1000).toFixed(1)} km`}</dd>
                      <dt>{t('astro.obsTemp')}</dt>
                      <dd>{c.temp == null ? '—' : `${c.temp.toFixed(1)}°C`}</dd>
                      <dt>{t('astro.obsWind')}</dt>
                      <dd>{c.wind == null ? '—' : `${c.wind.toFixed(0)} km/h`}</dd>
                      <dt>{t('astro.obsSunset')}</dt>
                      <dd>{hhmm(c.sunset)}</dd>
                    </dl>
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
