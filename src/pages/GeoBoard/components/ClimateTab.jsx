/**
 * 「地表与气候」Tab：主要城市环境实况 + 温室气体三兄弟 + 全球温度距平 + 南北极海冰。
 * 数据由 useGeoData 的 env / ghg / tempAnomaly / seaIce 轮询提供。
 */
import { CloudOutlined, LineChartOutlined } from '@ant-design/icons'
import { Empty, Table, Tooltip } from 'antd'
import { Panel, aqiLevel } from './ui.jsx'
import { uvLevel } from '../../../lib/earth/glossary.js'
import { useI18n } from '../../../i18n/index.js'
import GhgTrend from './GhgTrend.jsx'
import TempTrend from './TempTrend.jsx'
import SeaIceTrend from './SeaIceTrend.jsx'

export default function ClimateTab({ env, envData, ghg, ghgData, temp, tempData, seaIce, iceData }) {
  const { t, lang } = useI18n()
  return (
    <div className="geo-tab-content">
      {/* 城市环境 */}
      <Panel
        title={t('geo.climate.envTitle')}
        source={t('geo.climate.envSource')}
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
              { title: t('geo.climate.colCity'), dataIndex: 'name', width: 80, render: (v) => <b>{v}</b> },
              { title: t('geo.climate.colWeather'), dataIndex: 'weather', width: 90 },
              {
                title: t('geo.climate.colTemp'),
                dataIndex: 'temp',
                width: 78,
                align: 'right',
                render: (v, r) => (
                  <Tooltip title={r.feels != null ? t('geo.climate.feels', { v: r.feels.toFixed(1) }) : t('geo.climate.feelsUnknown')}>
                    <span className="is-info">{v != null ? `${v.toFixed(1)} °C` : '—'}</span>
                  </Tooltip>
                ),
              },
              {
                title: t('geo.climate.colHumidity'),
                dataIndex: 'humidity',
                width: 70,
                align: 'right',
                render: (v) => (v != null ? `${v.toFixed(0)}%` : '—'),
              },
              {
                title: t('geo.climate.colPressure'),
                dataIndex: 'pressure',
                width: 84,
                align: 'right',
                render: (v) => (v != null ? `${v.toFixed(0)} hPa` : '—'),
              },
              {
                title: t('geo.climate.colUv'),
                dataIndex: 'uv',
                width: 96,
                align: 'right',
                render: (v) => {
                  const lv = uvLevel(v, lang)
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
                title: t('geo.climate.colPm25'),
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
                title: t('geo.climate.colPm10'),
                dataIndex: 'pm10',
                width: 78,
                align: 'right',
                render: (v) => (v != null ? v.toFixed(0) : '—'),
              },
              {
                title: t('geo.climate.colO3'),
                dataIndex: 'o3',
                width: 78,
                align: 'right',
                render: (v) => (v != null ? v.toFixed(0) : '—'),
              },
              {
                title: t('geo.climate.colAqi'),
                dataIndex: 'aqi',
                width: 104,
                align: 'right',
                render: (v) => {
                  const lv = aqiLevel(v, lang)
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
          <Empty description={t('geo.climate.empty')} />
        )}
      </Panel>

      {/* 温室气体三兄弟 */}
      <Panel
        title={t('geo.climate.ghgTitle')}
        source={t('geo.climate.ghgSource')}
        icon={<LineChartOutlined />}
        loading={ghg.loading}
        error={ghg.error}
      >
        {ghgData ? (
          <GhgTrend gases={ghgData.gases} order={ghgData.order} />
        ) : (
          <Empty description={t('geo.climate.ghgEmpty')} />
        )}
      </Panel>

      {/* 全球温度距平 */}
      <Panel
        title={t('geo.climate.tempTitle')}
        source={t('geo.climate.tempSource')}
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
          <Empty description={t('geo.climate.tempEmpty')} />
        )}
      </Panel>

      {/* 南北极海冰 */}
      <Panel
        title={t('geo.climate.iceTitle')}
        source={t('geo.climate.iceSource')}
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
                  monthLabel={t('geo.climate.month', { n: p.month })}
                />
              </div>
            ))}
          </div>
        ) : (
          <Empty description={t('geo.climate.iceEmpty')} />
        )}
      </Panel>
    </div>
  )
}
