/**
 * 「海浪与海温」Tab：近海 5 站海况实况 + 24h 浪高预报 + 全球 10 海域速览。
 * 数据由 useOceanData 的 waves / globalWaves 轮询提供。
 */
import { CompassOutlined, LineChartOutlined, TableOutlined } from '@ant-design/icons'
import { Empty, Table, Tooltip } from 'antd'
import { useI18n } from '@i18n/index.js'
import { Panel, waveLevel } from './ui.jsx'
import WaveForecast from './WaveForecast.jsx'
import GlobalWavesTable from './GlobalWavesTable.jsx'

export default function WavesTab({ waves, waveData, globalWaves, globalWavesData }) {
  const { t, lang } = useI18n()
  return (
    <div className="o-tab-content">
      <Panel
        title={t('ocean.waves.panelNearshore')}
        source={t('ocean.waves.srcNearshore')}
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
              { title: t('ocean.col.sea'), dataIndex: 'name', width: 100, render: (v) => <b>{v}</b> },
              {
                title: t('ocean.col.waveHeight'),
                dataIndex: 'waveHeight',
                width: 130,
                align: 'right',
                render: (v) => {
                  const lv = waveLevel(v, lang)
                  return v != null ? (
                    <span style={{ color: lv.color, fontWeight: 600 }}>
                      {v.toFixed(2)} m · {lv.label}
                    </span>
                  ) : '—'
                },
              },
              {
                title: t('ocean.col.swell'),
                dataIndex: 'swellHeight',
                width: 130,
                align: 'right',
                render: (v, r) => (
                  <Tooltip title={t('ocean.waves.tipSwell')}>
                    <span className="is-info">
                      {v != null ? `${v.toFixed(2)} m / ${r.swellPeriod?.toFixed(0) ?? '—'} s` : '—'}
                    </span>
                  </Tooltip>
                ),
              },
              {
                title: t('ocean.col.windWave'),
                dataIndex: 'windWaveHeight',
                width: 110,
                align: 'right',
                render: (v, r) => (
                  <Tooltip title={t('ocean.waves.tipWindWave')}>
                    <span className="is-info">
                      {v != null ? `${v.toFixed(2)} m / ${r.windWavePeriod?.toFixed(0) ?? '—'} s` : '—'}
                    </span>
                  </Tooltip>
                ),
              },
              {
                title: t('ocean.col.waveDir'),
                dataIndex: 'waveDirText',
                width: 110,
                align: 'right',
                render: (v, r) => (v !== '—' ? `${v}（${r.waveDir?.toFixed(0)}°）` : '—'),
              },
              {
                title: t('ocean.col.period'),
                dataIndex: 'wavePeriod',
                width: 92,
                align: 'right',
                render: (v) => (v != null ? `${v.toFixed(1)} s` : '—'),
              },
              {
                title: t('ocean.col.sst'),
                dataIndex: 'sst',
                width: 100,
                align: 'right',
                render: (v) => (v != null ? `${v.toFixed(1)} °C` : '—'),
              },
              { title: t('ocean.col.observeTime'), dataIndex: 'time', align: 'right', width: 130, render: (v) => (v ? `${v.slice(11, 16)}${t('ocean.time.beijing')}` : '—') },
            ]}
          />
        ) : (
          <Empty description={t('ocean.empty.noWaveData')} />
        )}
      </Panel>

      <Panel
        title={t('ocean.waves.panelSwellWind')}
        source={t('ocean.srcIntro')}
        icon={<CompassOutlined />}
      >
        <div className="o-prose">
          <p>{t('ocean.waves.prose1')}</p>
          <p>{t('ocean.waves.prose2')}</p>
        </div>
      </Panel>

      <Panel
        title={t('ocean.waves.panelForecast')}
        source={t('ocean.waves.srcForecast')}
        icon={<LineChartOutlined />}
        loading={waves.loading}
        error={waves.error}
      >
        {waveData ? (
          <WaveForecast spots={waveData.spots} />
        ) : (
          <Empty description={t('ocean.empty.noForecast')} />
        )}
      </Panel>

      {/* 全球海域速览：与近海 5 站互补，看远海大势 */}
      <Panel
        title={t('ocean.waves.panelGlobal')}
        source={t('ocean.waves.srcGlobal')}
        icon={<CompassOutlined />}
        loading={globalWaves.loading}
        error={globalWaves.error}
      >
        {globalWavesData ? (
          <GlobalWavesTable spots={globalWavesData.spots} />
        ) : (
          <Empty description={t('ocean.empty.noGlobal')} />
        )}
      </Panel>
    </div>
  )
}
