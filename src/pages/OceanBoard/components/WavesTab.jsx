/**
 * 「海浪与海温」Tab：近海 5 站海况实况 + 24h 浪高预报 + 全球 10 海域速览。
 * 数据由 useOceanData 的 waves / globalWaves 轮询提供。
 */
import { CompassOutlined, LineChartOutlined, TableOutlined } from '@ant-design/icons'
import { Empty, Table, Tooltip } from 'antd'
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
            scroll={{ x: 1080 }}
            columns={[
              { title: '海域', dataIndex: 'name', width: 100, render: (v) => <b>{v}</b> },
              {
                title: '有效波高',
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
                title: '涌浪',
                dataIndex: 'swellHeight',
                width: 130,
                align: 'right',
                render: (v, r) => (
                  <Tooltip title="别处风暴生成后传播过来的长周期波；本地没风却有大浪就是它">
                    <span className="is-info">
                      {v != null ? `${v.toFixed(2)} m / ${r.swellPeriod?.toFixed(0) ?? '—'} s` : '—'}
                    </span>
                  </Tooltip>
                ),
              },
              {
                title: '风浪',
                dataIndex: 'windWaveHeight',
                width: 110,
                align: 'right',
                render: (v, r) => (
                  <Tooltip title="本地风当场吹出来的短周期波；风停即消散">
                    <span className="is-info">
                      {v != null ? `${v.toFixed(2)} m / ${r.windWavePeriod?.toFixed(0) ?? '—'} s` : '—'}
                    </span>
                  </Tooltip>
                ),
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
                width: 92,
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
              { title: '观测时刻', dataIndex: 'time', align: 'right', width: 130, render: (v) => (v ? `${v.slice(11, 16)}（北京）` : '—') },
            ]}
          />
        ) : (
          <Empty description="暂无海况数据" />
        )}
      </Panel>

      <Panel
        title="涌浪与风浪：同一片海的两股波"
        source="科普说明（静态）"
        icon={<CompassOutlined />}
      >
        <div className="o-prose">
          <p>
            海面其实是两股波的叠加：<b>风浪</b>由本地风当场吹出来，波形杂乱、周期短（3–8 s），
            风一停很快就散；<b>涌浪</b>是别处的风暴生成的波跨越上千公里传过来，波形规则、
            周期长（8–20 s），能在无风的晴天继续拍岸。
          </p>
          <p>
            分开看这两项才解释得了一个常见现象：本地风和日丽，却涌起大浪——那就是远洋风暴的
            <strong>先兆涌浪</strong>，比风暴本身早到好几天。冲浪者等的就是它，
            而港口系泊断裂、船舶剧烈横摇的元凶也往往是它。表格里的「有效波高」是二者合成后
            按最大 1/3 取平均的结果，<b>不是最大浪高</b>——实际最大波可达它的 1.6–1.9 倍。
          </p>
        </div>
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
