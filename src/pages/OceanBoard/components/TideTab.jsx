/**
 * 「潮汐」Tab：旧金山站过去 24h 实测潮位曲线 + 未来 48h 高低潮预报表。
 * 数据由 useOceanData 的 tides / tidePred 轮询提供。
 */
import { DotChartOutlined, LineChartOutlined } from '@ant-design/icons'
import { Empty, Table, Tag } from 'antd'
import { Panel, fmtSiteDay } from './ui.jsx'
import TideCurve from './TideCurve.jsx'

export default function TideTab({ tides, tideData, tidePred, predData }) {
  return (
    <div className="o-tab-content">
      <Panel
        title="实测潮位（过去 24 小时）"
        source="NOAA CO-OPS 潮位站 9414290（旧金山），6 分钟采样，6 分钟刷新"
        icon={<LineChartOutlined />}
        loading={tides.loading}
        error={tides.error}
      >
        {tideData ? (
          <TideCurve series={tideData.series} latest={tideData.latest} station={tideData.station} />
        ) : (
          <Empty description="暂无潮位数据" />
        )}
      </Panel>

      <Panel
        title="高低潮预报（未来 48 小时）"
        source="NOAA CO-OPS 调和预报（interval=hilo），1 小时刷新；时间为站点当地时间"
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
            pagination={{ pageSize: 8, size: 'small', showTotal: (t) => `共 ${t} 个潮候` }}
            columns={[
              {
                title: '时刻（站点）',
                dataIndex: 't',
                width: 140,
                render: (t) => fmtSiteDay(t),
              },
              {
                title: '类型',
                dataIndex: 'type',
                width: 100,
                render: (t) =>
                  t === 'H' ? <Tag color="blue">高潮</Tag> : <Tag color="cyan">低潮</Tag>,
              },
              {
                title: '预报潮高',
                dataIndex: 'v',
                align: 'right',
                render: (v) => `${v.toFixed(2)} m（MLLW）`,
              },
            ]}
          />
        ) : (
          <Empty description="暂无潮汐预报" />
        )}
      </Panel>
    </div>
  )
}
