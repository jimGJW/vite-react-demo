/**
 * 「海浪与海温」Tab：近海 5 站海况实况 + 24h 浪高预报 + 全球 10 海域速览。
 * 数据由 useOceanData 的 waves / globalWaves 轮询提供。
 */
import { CompassOutlined, LineChartOutlined, TableOutlined } from '@ant-design/icons'
import { Empty, Table } from 'antd'
import { Panel, waveLevel } from './ui.jsx'
import WaveForecast from './WaveForecast.jsx'
import GlobalWavesTable from './GlobalWavesTable.jsx'

export default function WavesTab({ waves, waveData, globalWaves, globalWavesData }) {
  return (
    <div className="o-tab-content">
      <Panel
        title="近海海况实况"
        source="Open-Meteo Marine（免密钥），5 个近海点一次请求，30 分钟刷新；浪向为来向"
        icon={<TableOutlined />}
        loading={waves.loading}
        error={waves.error}
      >
        {waveData ? (
          <Table
            className="o-wave-table"
            size="small"
            rowKey="key"
            dataSource={waveData.spots}
            pagination={false}
            columns={[
              { title: '海域', dataIndex: 'name', width: 100, render: (v) => <b>{v}</b> },
              {
                title: '浪高',
                dataIndex: 'waveHeight',
                width: 130,
                align: 'right',
                render: (v) => {
                  const lv = waveLevel(v)
                  return v != null ? (
                    <span style={{ color: lv.color, fontWeight: 600 }}>
                      {v.toFixed(2)} m · {lv.label}
                    </span>
                  ) : '—'
                },
              },
              {
                title: '浪向',
                dataIndex: 'waveDirText',
                width: 110,
                align: 'right',
                render: (v, r) => (v !== '—' ? `${v}（${r.waveDir?.toFixed(0)}°）` : '—'),
              },
              {
                title: '平均周期',
                dataIndex: 'wavePeriod',
                width: 100,
                align: 'right',
                render: (v) => (v != null ? `${v.toFixed(1)} s` : '—'),
              },
              {
                title: '海表温度',
                dataIndex: 'sst',
                width: 100,
                align: 'right',
                render: (v) => (v != null ? `${v.toFixed(1)} °C` : '—'),
              },
              { title: '观测时刻', dataIndex: 'time', align: 'right', render: (v) => (v ? `${v.slice(11, 16)}（北京）` : '—') },
            ]}
          />
        ) : (
          <Empty description="暂无海况数据" />
        )}
      </Panel>

      <Panel
        title="未来 24 小时浪高预报"
        source="Open-Meteo Marine，逐小时浪高（网格再分析 + 预报模式），30 分钟刷新"
        icon={<LineChartOutlined />}
        loading={waves.loading}
        error={waves.error}
      >
        {waveData ? (
          <WaveForecast spots={waveData.spots} />
        ) : (
          <Empty description="暂无预报数据" />
        )}
      </Panel>

      {/* 全球海域速览：与近海 5 站互补，看远海大势 */}
      <Panel
        title="全球 10 大海域浪况速览"
        source="Open-Meteo Marine，全球代表海域一次多点请求，1 小时刷新；时刻为 UTC"
        icon={<CompassOutlined />}
        loading={globalWaves.loading}
        error={globalWaves.error}
      >
        {globalWavesData ? (
          <GlobalWavesTable spots={globalWavesData.spots} />
        ) : (
          <Empty description="暂无全球海域数据" />
        )}
      </Panel>
    </div>
  )
}
