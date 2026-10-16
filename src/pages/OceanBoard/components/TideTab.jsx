/**
 * 「潮汐」Tab：旧金山站过去 24h 实测潮位曲线 + 未来 48h 高低潮预报表。
 * 数据由 useOceanData 的 tides / tidePred 轮询提供。
 */
import { CloudOutlined, DotChartOutlined, LineChartOutlined } from '@ant-design/icons'
import { Empty, Table, Tag, Tooltip } from 'antd'
import { useI18n } from '../../../i18n/index.js'
import { Panel, fmtSiteDay } from './ui.jsx'
import TideCurve from './TideCurve.jsx'
import { zhTideDatum } from '../../../lib/earth/glossary.js'

/** 站点气温概况条（与潮位同站，给「海陆温差」一个上下文） */
function StationWeather({ wx }) {
  const { t } = useI18n()
  if (!wx) return null
  return (
    <div className="o-stnwx">
      <span>
        {t('ocean.tide.wxLabel')}{' '}
        <b>
          {wx.latest.v.toFixed(1)} °C
        </b>
        <span className="o-stnwx__sub">（{wx.latest.t.slice(11, 16)} {t('ocean.time.site')}）</span>
      </span>
      <span>
        {t('ocean.tide.wxRange')} <b>{wx.min.toFixed(1)}</b> ~ <b>{wx.max.toFixed(1)}</b> °C
      </span>
      <Tooltip title={t('ocean.tide.wxTipTitle')}>
        <span className="is-info">{t('ocean.tide.wxTipText')}</span>
      </Tooltip>
    </div>
  )
}

export default function TideTab({ tides, tideData, tidePred, predData, stationWeather, wxData }) {
  const { t } = useI18n()
  return (
    <div className="o-tab-content">
      <Panel
        title={t('ocean.tide.panelObs')}
        source={t('ocean.tide.srcObs')}
        icon={<LineChartOutlined />}
        loading={tides.loading}
        error={tides.error}
      >
        {tideData ? (
          <TideCurve series={tideData.series} latest={tideData.latest} station={tideData.station} />
        ) : (
          <Empty description={t('ocean.tide.emptyObs')} />
        )}
      </Panel>

      <Panel
        title={t('ocean.tide.panelPred')}
        source={t('ocean.tide.srcPred')}
        icon={<DotChartOutlined />}
        loading={tidePred.loading}
        error={tidePred.error}
      >
        {predData ? (
          <Table
            className="o-tide-table"
            size="small"
            rowKey={(r) => r.t}
            dataSource={predData.events}
            pagination={{ pageSize: 8, size: 'small', showTotal: (n) => t('ocean.tide.total', { n }) }}
            columns={[
              {
                title: t('ocean.tide.colTime'),
                dataIndex: 't',
                width: 140,
                render: (tt) => fmtSiteDay(tt),
              },
              {
                title: t('ocean.tide.colType'),
                dataIndex: 'type',
                width: 100,
                render: (tt) =>
                  tt === 'H' ? <Tag color="blue">{t('ocean.tide.high')}</Tag> : <Tag color="cyan">{t('ocean.tide.low')}</Tag>,
              },
              {
                title: t('ocean.tide.colLevel'),
                dataIndex: 'v',
                align: 'right',
                render: (v) => `${v.toFixed(2)} m（MLLW）`,
              },
            ]}
          />
        ) : (
          <Empty description={t('ocean.tide.emptyPred')} />
        )}
      </Panel>

      <Panel
        title={t('ocean.tide.panelWx')}
        source={t('ocean.tide.srcWx')}
        icon={<CloudOutlined />}
        loading={stationWeather.loading}
        error={stationWeather.error}
      >
        {wxData ? <StationWeather wx={wxData} /> : <Empty description={t('ocean.tide.emptyWx')} />}
      </Panel>

      <Panel
        title={t('ocean.tide.panelDatum')}
        source={t('ocean.srcIntro')}
        icon={<LineChartOutlined />}
      >
        <div className="o-prose">
          <p>
            {t('ocean.tide.prose1a')}
            <Tooltip title={zhTideDatum('MLLW')?.desc}>
              <b className="is-info">MLLW（{t('ocean.tide.mllw')}）</b>
            </Tooltip>
            {t('ocean.tide.prose1b')}
          </p>
          <p>
            {t('ocean.tide.prose2')}
          </p>
        </div>
      </Panel>
    </div>
  )
}
