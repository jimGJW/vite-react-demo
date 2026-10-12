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

/** 风向度数 → 八方位中文 */
function dirText(deg) {
  if (deg == null) return '—'
  const names = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  return names[Math.round(deg / 45) % 8]
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
  const items = weatherData?.items || []
  const hottest = items[0]
  const coldest = items.length ? items[items.length - 1] : null

  return (
    <div className="geo-tab-content">
      <Panel
        title="🌤 城市天气实况"
        source="Open-Meteo Forecast（WMO 4677 天气码），每 10 分钟刷新"
        icon={<ExperimentOutlined />}
        loading={weather.loading}
        error={weather.error}
      >
        {!weather.loading && !items.length ? (
          <Empty description="未取到城市天气数据" />
        ) : (
          <>
            <p className="geo-wx-lead">
              按当前气温从高到低排列。
              {hottest && coldest ? ` 此刻南北温差约 ${(hottest.temp - coldest.temp).toFixed(1)}°C（${hottest.name} ${hottest.temp?.toFixed(1)}°C vs ${coldest.name} ${coldest.temp?.toFixed(1)}°C）。` : ''}
              「体感温度」综合了湿度与风速，比干球温度更接近人的实际感受。
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
                    <dt>体感</dt>
                    <dd>{c.feels == null ? '—' : `${c.feels.toFixed(1)}°C`}</dd>
                    <dt>今日区间</dt>
                    <dd>
                      {c.tMin == null || c.tMax == null
                        ? '—'
                        : `${c.tMin.toFixed(0)}° ~ ${c.tMax.toFixed(0)}°`}
                    </dd>
                    <dt>风</dt>
                    <dd>
                      <Tooltip title={c.windDir == null ? '' : `${Math.round(c.windDir)}°`}>
                        {c.wind == null ? '—' : `${dirText(c.windDir)} ${c.wind.toFixed(0)} km/h`}
                      </Tooltip>
                    </dd>
                    <dt>湿度</dt>
                    <dd>{c.humidity == null ? '—' : `${c.humidity}%`}</dd>
                    <dt>日出 / 日落</dt>
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
