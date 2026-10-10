/**
 * 「地表与气候」Tab：主要城市环境实况 + 温室气体三兄弟 + 全球温度距平 + 南北极海冰。
 * 数据由 useGeoData 的 env / ghg / tempAnomaly / seaIce 轮询提供。
 */
import { CloudOutlined, LineChartOutlined } from '@ant-design/icons'
import { Empty, Table, Tooltip } from 'antd'
import { Panel, aqiLevel } from './ui.jsx'
import { uvLevel } from '../../../lib/earth/glossary.js'
import GhgTrend from './GhgTrend.jsx'
import TempTrend from './TempTrend.jsx'
import SeaIceTrend from './SeaIceTrend.jsx'

export default function ClimateTab({ env, envData, ghg, ghgData, temp, tempData, seaIce, iceData }) {
  return (
    <div className="geo-tab-content">
      {/* 城市环境 */}
      <Panel
        title="主要城市环境实况"
        source="Open-Meteo（免密钥），天气与空气质量各一次多城请求，10 分钟刷新；AQI 为欧洲标准"
        icon={<CloudOutlined />}
        loading={env.loading}
        error={env.error}
      >
        {envData ? (
          <Table
            className="geo-env-table"
            size="small"
            rowKey="key"
            dataSource={envData.cities}
            pagination={false}
            scroll={{ x: 980 }}
            columns={[
              { title: '城市', dataIndex: 'name', width: 80, render: (v) => <b>{v}</b> },
              { title: '天气', dataIndex: 'weather', width: 90 },
              {
                title: '温度',
                dataIndex: 'temp',
                width: 78,
                align: 'right',
                render: (v, r) => (
                  <Tooltip title={r.feels != null ? `体感 ${r.feels.toFixed(1)} °C` : '体感未知'}>
                    <span className="is-info">{v != null ? `${v.toFixed(1)} °C` : '—'}</span>
                  </Tooltip>
                ),
              },
              {
                title: '湿度',
                dataIndex: 'humidity',
                width: 70,
                align: 'right',
                render: (v) => (v != null ? `${v.toFixed(0)}%` : '—'),
              },
              {
                title: '气压',
                dataIndex: 'pressure',
                width: 84,
                align: 'right',
                render: (v) => (v != null ? `${v.toFixed(0)} hPa` : '—'),
              },
              {
                title: '紫外',
                dataIndex: 'uv',
                width: 96,
                align: 'right',
                render: (v) => {
                  const lv = uvLevel(v)
                  return v != null ? (
                    <Tooltip title={lv.advice}>
                      <span className="is-info" style={{ color: lv.color, fontWeight: 600 }}>
                        {v.toFixed(0)} · {lv.zh}
                      </span>
                    </Tooltip>
                  ) : '—'
                },
              },
              {
                title: 'PM2.5',
                dataIndex: 'pm25',
                width: 82,
                align: 'right',
                render: (v) => (v != null ? (
                  <span style={{ color: v <= 35 ? '#0e9f6e' : v <= 75 ? '#f59e0b' : '#ef4444' }}>
                    {v.toFixed(1)}
                  </span>
                ) : '—'),
              },
              {
                title: 'PM10',
                dataIndex: 'pm10',
                width: 78,
                align: 'right',
                render: (v) => (v != null ? v.toFixed(0) : '—'),
              },
              {
                title: '臭氧 O₃',
                dataIndex: 'o3',
                width: 78,
                align: 'right',
                render: (v) => (v != null ? v.toFixed(0) : '—'),
              },
              {
                title: 'AQI（欧标）',
                dataIndex: 'aqi',
                width: 104,
                align: 'right',
                render: (v) => {
                  const lv = aqiLevel(v)
                  return v != null ? (
                    <Tooltip title={lv.desc}>
                      <span className="is-info" style={{ color: lv.color, fontWeight: 600 }}>
                        {v.toFixed(0)} · {lv.label}
                      </span>
                    </Tooltip>
                  ) : '—'
                },
              },
            ]}
          />
        ) : (
          <Empty description="暂无环境数据" />
        )}
      </Panel>

      {/* 温室气体三兄弟 */}
      <Panel
        title="温室气体三兄弟：CO₂ / CH₄ / N₂O"
        source="NOAA GML（gml.noaa.gov）全球本底月均，取去季节化趋势，12 小时刷新"
        icon={<LineChartOutlined />}
        loading={ghg.loading}
        error={ghg.error}
      >
        {ghgData ? (
          <GhgTrend gases={ghgData.gases} order={ghgData.order} />
        ) : (
          <Empty description="暂无温室气体数据" />
        )}
      </Panel>

      {/* 全球温度距平 */}
      <Panel
        title="全球地表温度距平"
        source="NASA GISTEMP v4（data.giss.nasa.gov），陆海综合，基准 1951–1980 年，12 小时刷新"
        icon={<LineChartOutlined />}
        loading={temp.loading}
        error={temp.error}
      >
        {tempData ? (
          <TempTrend
            annual={tempData.annual}
            latest12={tempData.latest12}
            lastYear={tempData.lastYear}
            warmest={tempData.warmest}
            baseline={tempData.baseline}
          />
        ) : (
          <Empty description="暂无温度距平数据" />
        )}
      </Panel>

      {/* 南北极海冰 */}
      <Panel
        title="南北极海冰范围（1979 → 今）"
        source="NSIDC 海冰指数（noaadata.apps.nsidc.org），两极各取其极值月：北极 9 月、南极 2 月"
        icon={<LineChartOutlined />}
        loading={seaIce.loading}
        error={seaIce.error}
      >
        {iceData ? (
          <div className="geo-ice-pair">
            {[iceData.north, iceData.south].map((p) => (
              <div key={p.key} className="geo-ice-pair__item">
                <div className="geo-ice-pair__label">{p.zh} · {p.monthLabel}</div>
                <SeaIceTrend
                  history={p.history}
                  latest={p.latest}
                  avg1980s={p.avg1980s}
                  avg2010s={p.avg2010s}
                  declinePct={p.declinePct}
                  zh={p.zh}
                  monthLabel={`${p.month} 月`}
                />
              </div>
            ))}
          </div>
        ) : (
          <Empty description="暂无海冰数据" />
        )}
      </Panel>
    </div>
  )
}
