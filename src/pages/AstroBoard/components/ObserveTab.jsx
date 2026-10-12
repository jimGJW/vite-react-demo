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

/** 分数 → 档位（颜色与建议）。阈值是展示口径，与服务端评分权重配套 */
function bandOf(score) {
  if (score == null) return { zh: '无数据', color: '#94a3b8', advice: '该城市本次未取到实况' }
  if (score >= 80) return { zh: '极佳', color: '#52c41a', advice: '通透少云，肉眼可见银河与深空天体' }
  if (score >= 60) return { zh: '良好', color: '#a0d911', advice: '可以观测，行星与亮星没问题' }
  if (score >= 40) return { zh: '一般', color: '#faad14', advice: '云量偏多，只能看月亮与亮星' }
  if (score >= 20) return { zh: '较差', color: '#fa8c16', advice: '基本被云盖住，建议改天' }
  return { zh: '很差', color: '#ff4d4f', advice: '阴雨或大雾，不适合观测' }
}

/** 日落时间 "2026-10-13T18:12" → "18:12" */
function hhmm(t) {
  if (!t) return '—'
  const m = String(t).match(/T(\d{2}:\d{2})/)
  return m ? m[1] : t
}

export default function ObserveTab({ observe, observeData }) {
  const items = observeData?.items || []

  return (
    <div className="astro-tab-content">
      <Panel
        title="🔭 今晚观测条件"
        source="Open-Meteo 实况（云量 / 能见度 / 降水），每 10 分钟刷新"
        icon={<ExperimentOutlined />}
        loading={observe.loading}
        error={observe.error}
      >
        {!observe.loading && !items.length ? (
          <Empty description="未取到观测条件数据" />
        ) : (
          <>
            <p className="astro-obs-lead">
              评分只反映<b>大气条件</b>，不含月相与光污染：满月时天光本底很亮，
              即便评分 100 也看不到暗弱的星云。要决定今晚去哪，请把它和
              「今晚星空」页签的月相、行星出没一起看。
            </p>
            <div className="astro-obs-grid">
              {items.map((c) => {
                const band = bandOf(c.score)
                return (
                  <div key={c.key} className="astro-obs-card">
                    <div className="astro-obs-head">
                      <b className="astro-obs-city">{c.name}</b>
                      <Tooltip title={band.advice}>
                        <span className="astro-obs-score" style={{ color: band.color }}>
                          {c.score ?? '—'}
                        </span>
                      </Tooltip>
                    </div>
                    <div className="astro-obs-tag" style={{ color: band.color }}>
                      {band.zh}
                    </div>
                    <dl className="astro-obs-rows">
                      <dt>云量</dt>
                      <dd>{c.cloudCover == null ? '—' : `${Math.round(c.cloudCover)}%`}</dd>
                      <dt>能见度</dt>
                      <dd>{c.visibilityM == null ? '—' : `${(c.visibilityM / 1000).toFixed(1)} km`}</dd>
                      <dt>气温</dt>
                      <dd>{c.temp == null ? '—' : `${c.temp.toFixed(1)}°C`}</dd>
                      <dt>风速</dt>
                      <dd>{c.wind == null ? '—' : `${c.wind.toFixed(0)} km/h`}</dd>
                      <dt>日落</dt>
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
