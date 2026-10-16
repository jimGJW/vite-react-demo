/**
 * 「大地脉动」Tab：过去 24h 全球地震分布地图 + 地震列表。
 * 数据由 useGeoData 的 quakes 轮询提供，本组件只负责展示。
 */
import { AimOutlined } from '@ant-design/icons'
import { Empty, Table, Tag } from 'antd'
import { Panel, depthClass, fmtBJT, magColor } from './ui.jsx'
import { useI18n } from '../../../i18n/index.js'
import QuakeMap from './QuakeMap.jsx'
import StrongQuakes from './StrongQuakes.jsx'

export default function QuakeTab({ quakes, quakeData, bigQuakes, bigData }) {
  const { t } = useI18n()
  return (
    <div className="geo-tab-content">
      {/* 地震世界地图 */}
      <Panel
        title={t('geo.quake.mapTitle')}
        source={t('geo.quake.mapSource')}
        icon={<AimOutlined />}
        loading={quakes.loading}
        error={quakes.error}
      >
        {quakeData ? (
          <QuakeMap quakes={quakeData.quakes} />
        ) : (
          <Empty description={t('geo.quake.empty')} />
        )}
      </Panel>

      {/* 地震列表 */}
      <Panel
        title={t('geo.quake.listTitle')}
        source={t('geo.quake.listSource')}
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
            pagination={{ pageSize: 12, size: 'small', showTotal: (total) => t('geo.quake.pageTotal', { n: total }) }}
            columns={[
              {
                title: t('geo.quake.colBJT'),
                dataIndex: 'time',
                width: 96,
                render: (v) => fmtBJT(v),
              },
              {
                title: t('geo.quake.colMag'),
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
              { title: t('geo.quake.colPlace'), dataIndex: 'place', ellipsis: true },
              {
                title: t('geo.quake.colDepth'),
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
          <Empty description={t('geo.quake.empty')} />
        )}
      </Panel>

      {/* 近 30 天强震：与上面「此刻的脉动」互补，看的是月尺度活动水平 */}
      <Panel
        title={t('geo.quake.strongTitle')}
        source={t('geo.quake.strongSource')}
        icon={<AimOutlined />}
        loading={bigQuakes.loading}
        error={bigQuakes.error}
      >
        {bigData ? (
          <StrongQuakes
            byDay={bigData.byDay}
            quakes={bigData.quakes}
            count={bigData.count}
            perDay={bigData.perDay}
            strongest={bigData.strongest}
            windowDays={bigData.windowDays}
          />
        ) : (
          <Empty description={t('geo.quake.strongEmpty')} />
        )}
      </Panel>
    </div>
  )
}
