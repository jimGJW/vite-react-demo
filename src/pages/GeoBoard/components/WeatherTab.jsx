/**
 * 地球看板「🌤 城市天气」页签：各城市此刻的温度 / 风 / 降水 / 天气现象。
 *
 * 与「地表与气候」页签的分工：那边是温室气体浓度与全球温度距平（十年—百年尺度），
 * 这边是此刻的实况（分钟—小时尺度）。两个尺度放在一起看，
 * 才能把「全球在变暖」和「今天穿什么」这两件事分开——
 * 单日冷暖不能用来否认或证明长期趋势。
 *
 * 天气现象文字由服务端按 WMO 4677 码表翻译后下发，前端不重复维护码表。
 */
import { ExperimentOutlined } from '@ant-design/icons'
import { Empty, Tooltip } from 'antd'
import { Panel } from './ui.jsx'
import { useI18n } from '@i18n/index.js'

/** 风向度数 → 八方位 i18n 键 */
const DIR_KEYS = ['geo.wx.dir.n', 'geo.wx.dir.ne', 'geo.wx.dir.e', 'geo.wx.dir.se', 'geo.wx.dir.s', 'geo.wx.dir.sw', 'geo.wx.dir.w', 'geo.wx.dir.nw']
function dirKeyOf(deg) {
  if (deg == null) return null
  return DIR_KEYS[Math.round(deg / 45) % 8]
}

/** "2026-10-13T18:12" → "18:12" */
function hhmm(t) {
  if (!t) return '—'
  const m = String(t).match(/T(\d{2}:\d{2})/)
  return m ? m[1] : t
}

/** 温度 → 冷暖色调（冷蓝 → 暖红），用于卡片上的大数字 */
function tempColor(t) {
  if (t == null) return undefined
  if (t >= 30) return '#ff4d4f'
  if (t >= 22) return '#fa8c16'
  if (t >= 12) return '#52c41a'
  if (t >= 0) return '#1677ff'
  return '#722ed1'
}

export default function WeatherTab({ weather, weatherData }) {
  const { t } = useI18n()
  const items = weatherData?.items || []
  const hottest = items[0]
  const coldest = items.length ? items[items.length - 1] : null

  return (
    <div className="geo-tab-content">
      <Panel
        title={'🌤 ' + t('geo.wx.title')}
        source={t('geo.wx.source')}
        icon={<ExperimentOutlined />}
        loading={weather.loading}
        error={weather.error}
      >
        {!weather.loading && !items.length ? (
          <Empty description={t('geo.wx.empty')} />
        ) : (
          <>
            <p className="geo-wx-lead">
              {t('geo.wx.lead')}
              {hottest && coldest ? t('geo.wx.leadTemp', {
                delta: (hottest.temp - coldest.temp).toFixed(1),
                hot: hottest.name,
                hott: hottest.temp?.toFixed(1),
                cold: coldest.name,
                coldt: coldest.temp?.toFixed(1),
              }) : ''}
              {t('geo.wx.leadFeel')}
            </p>
            <div className="geo-wx-grid">
              {items.map((c) => (
                <div key={c.key} className="geo-wx-card">
                  <div className="geo-wx-head">
                    <b className="geo-wx-city">{c.name}</b>
                    <span className="geo-wx-text">{c.text || '—'}</span>
                  </div>
                  <div className="geo-wx-temp" style={{ color: tempColor(c.temp) }}>
                    {c.temp == null ? '—' : c.temp.toFixed(1)}
                    <em>°C</em>
                  </div>
                  <dl className="geo-wx-rows">
                    <dt>{t('geo.wx.dtFeels')}</dt>
                    <dd>{c.feels == null ? '—' : `${c.feels.toFixed(1)}°C`}</dd>
                    <dt>{t('geo.wx.dtRange')}</dt>
                    <dd>
                      {c.tMin == null || c.tMax == null
                        ? '—'
                        : `${c.tMin.toFixed(0)}° ~ ${c.tMax.toFixed(0)}°`}
                    </dd>
                    <dt>{t('geo.wx.dtWind')}</dt>
                    <dd>
                      <Tooltip title={c.windDir == null ? '' : `${Math.round(c.windDir)}°`}>
                        {c.wind == null ? '—' : `${t(dirKeyOf(c.windDir))} ${c.wind.toFixed(0)} km/h`}
                      </Tooltip>
                    </dd>
                    <dt>{t('geo.wx.dtHumidity')}</dt>
                    <dd>{c.humidity == null ? '—' : `${c.humidity}%`}</dd>
                    <dt>{t('geo.wx.dtSun')}</dt>
                    <dd>
                      {hhmm(c.sunrise)} / {hhmm(c.sunset)}
                    </dd>
                  </dl>
                </div>
              ))}
            </div>
          </>
        )}
      </Panel>
    </div>
  )
}
