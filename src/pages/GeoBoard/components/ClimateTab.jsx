/**
 * 「地表与气候」Tab：主要城市环境实况 + 全球 CO₂ 趋势 + 北极海冰年际柱状。
 * 数据由 useGeoData 的 env / co2 / seaIce 轮询提供。
 */
import { CloudOutlined, LineChartOutlined } from '@ant-design/icons'
import { Empty, Table } from 'antd'
import { Panel, aqiLevel } from './ui.jsx'
import Co2Trend from './Co2Trend.jsx'
import SeaIceTrend from './SeaIceTrend.jsx'

export default function ClimateTab({ env, envData, co2, co2Data, seaIce, iceData }) {
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
            columns={[
              { title: '城市', dataIndex: 'name', width: 90, render: (v) => <b>{v}</b> },
              { title: '天气', dataIndex: 'weather', width: 100 },
              {
                title: '温度',
                dataIndex: 'temp',
                width: 84,
                align: 'right',
                render: (v) => (v != null ? `${v.toFixed(1)} °C` : '—'),
              },
              {
                title: '湿度',
                dataIndex: 'humidity',
                width: 76,
                align: 'right',
                render: (v) => (v != null ? `${v.toFixed(0)}%` : '—'),
              },
              {
                title: '风速',
                dataIndex: 'wind',
                width: 84,
                align: 'right',
                render: (v) => (v != null ? `${v.toFixed(0)} km/h` : '—'),
              },
              {
                title: 'PM2.5',
                dataIndex: 'pm25',
                width: 90,
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
                width: 84,
                align: 'right',
                render: (v) => (v != null ? v.toFixed(0) : '—'),
              },
              {
                title: '臭氧 O₃',
                dataIndex: 'o3',
                width: 84,
                align: 'right',
                render: (v) => (v != null ? v.toFixed(0) : '—'),
              },
              {
                title: 'AQI（欧标）',
                dataIndex: 'aqi',
                width: 100,
                align: 'right',
                render: (v) => {
                  const lv = aqiLevel(v)
                  return v != null ? (
                    <span style={{ color: lv.color, fontWeight: 600 }}>
                      {v.toFixed(0)} · {lv.label}
                    </span>
                  ) : '—'
                },
              },
            ]}
          />
        ) : (
          <Empty description="暂无环境数据" />
        )}
      </Panel>

      {/* CO2 趋势 */}
      <Panel
        title="全球 CO₂ 浓度趋势"
        source="NOAA GML（gml.noaa.gov），全球海洋边界层月均值，12 小时刷新"
        icon={<LineChartOutlined />}
        loading={co2.loading}
        error={co2.error}
      >
        {co2Data ? (
          <Co2Trend history={co2Data.history} latest={co2Data.latest} growthPerYear={co2Data.growthPerYear} />
        ) : (
          <Empty description="暂无 CO₂ 数据" />
        )}
      </Panel>

      {/* 北极海冰 */}
      <Panel
        title="北极海冰范围（1979 → 今）"
        source="NSIDC 海冰指数（noaadata.apps.nsidc.org），每年 9 月最小值序列，12 小时刷新"
        icon={<LineChartOutlined />}
        loading={seaIce.loading}
        error={seaIce.error}
      >
        {iceData ? (
          <SeaIceTrend
            history={iceData.history}
            latest={iceData.latest}
            avg1980s={iceData.avg1980s}
            avg2010s={iceData.avg2010s}
            declinePct={iceData.declinePct}
          />
        ) : (
          <Empty description="暂无海冰数据" />
        )}
      </Panel>
    </div>
  )
}
