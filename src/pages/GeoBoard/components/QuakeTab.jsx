/**
 * 「大地脉动」Tab：过去 24h 全球地震分布地图 + 地震列表。
 * 数据由 useGeoData 的 quakes 轮询提供，本组件只负责展示。
 */
import { AimOutlined } from '@ant-design/icons'
import { Empty, Table, Tag } from 'antd'
import { Panel, depthClass, fmtBJT, magColor } from './ui.jsx'
import QuakeMap from './QuakeMap.jsx'

export default function QuakeTab({ quakes, quakeData }) {
  return (
    <div className="geo-tab-content">
      {/* 地震世界地图 */}
      <Panel
        title="过去 24 小时全球地震分布"
        source="USGS 地震危害计划（earthquake.usgs.gov），M2.5+，2 分钟刷新"
        icon={<AimOutlined />}
        loading={quakes.loading}
        error={quakes.error}
      >
        {quakeData ? (
          <QuakeMap quakes={quakeData.quakes} />
        ) : (
          <Empty description="暂无地震数据" />
        )}
      </Panel>

      {/* 地震列表 */}
      <Panel
        title="地震列表（按时间倒序）"
        source="USGS；点击震级列可按震级排序"
        icon={<AimOutlined />}
        loading={quakes.loading}
        error={quakes.error}
      >
        {quakeData ? (
          <Table
            className="geo-quake-table"
            size="small"
            rowKey="id"
            dataSource={quakeData.quakes}
            pagination={{ pageSize: 12, size: 'small', showTotal: (t) => `共 ${t} 条` }}
            columns={[
              {
                title: '北京时间',
                dataIndex: 'time',
                width: 96,
                render: (t) => fmtBJT(t),
              },
              {
                title: '震级',
                dataIndex: 'mag',
                width: 90,
                sorter: (a, b) => (a.mag || 0) - (b.mag || 0),
                defaultSortOrder: null,
                render: (m) => (
                  <Tag color={magColor(m) === '#94a3b8' ? 'default' : undefined}
                    style={magColor(m) === '#94a3b8' ? undefined : { color: magColor(m), borderColor: magColor(m) }}>
                    M{m?.toFixed(1) ?? '?'}
                  </Tag>
                ),
              },
              { title: '地点', dataIndex: 'place', ellipsis: true },
              {
                title: '深度',
                dataIndex: 'depth',
                width: 120,
                align: 'right',
                render: (d) => (
                  <span style={{ color: depthClass(d).color }}>
                    {d?.toFixed(0)} km · {depthClass(d).label}
                  </span>
                ),
              },
            ]}
          />
        ) : (
          <Empty description="暂无地震数据" />
        )}
      </Panel>
    </div>
  )
}
