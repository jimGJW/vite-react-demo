/**
 * 「自然事件」Tab：NASA EONET 近 30 天进行中的自然事件
 * （野火 / 强风暴 / 火山 / 海冰 / 洪水 / 沙尘等），事件落点地图 + 列表。
 * 数据由 useGeoData 的 eonet 轮询提供（/api/geo/eonet，1 小时刷新）。
 */
import { useMemo } from 'react'
import { FireOutlined } from '@ant-design/icons'
import { Empty, Table, Tag } from 'antd'
import { Panel } from './ui.jsx'
import { project, landPath, MAP_W, MAP_H } from '../../../components/AstroBoard/mapProjection.js'

/** EONET 分类 → 落点/标签配色 */
const CAT_COLOR = {
  wildfires: '#ef4444',
  severeStorms: '#a855f7',
  volcanoes: '#f97316',
  seaLakeIce: '#38bdf8',
  floods: '#0ea5e9',
  dustHaze: '#d97706',
}
const CAT_LABEL = {
  wildfires: '野火',
  severeStorms: '强风暴',
  volcanoes: '火山',
  seaLakeIce: '海冰',
  floods: '洪水',
  dustHaze: '沙尘',
}
const catColor = (id) => CAT_COLOR[id] || '#94a3b8'

/** 事件落点地图：复用地震图的等距圆柱投影与配色变量，点色按事件类别 */
function EonetMap({ events }) {
  const land = useMemo(() => landPath(), [])
  return (
    <div className="geo-quakemap">
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img" aria-label="近 30 天全球自然事件分布图">
        <rect x="0" y="0" width={MAP_W} height={MAP_H} className="geo-quakemap__sea" />
        <path d={land} className="geo-quakemap__land" />
        {events.map((e) => {
          const p = project(e.lat, e.lon)
          return (
            <circle
              key={e.id}
              cx={p.x}
              cy={p.y}
              r="4"
              className="geo-quakemap__dot"
              style={{ '--dot-color': catColor(e.catId) }}
            >
              <title>{`${e.title}（${CAT_LABEL[e.catId] || e.cat}）${e.time ? `\n${e.time.slice(0, 10)}` : ''}`}</title>
            </circle>
          )
        })}
      </svg>
      <div className="geo-quakemap__legend">
        {Object.keys(CAT_COLOR).map((id) => (
          <span key={id}>
            <i style={{ background: CAT_COLOR[id] }} />
            {CAT_LABEL[id]}
          </span>
        ))}
        <span className="geo-quakemap__legend-note">仅显示可定位到经纬度的进行中事件</span>
      </div>
    </div>
  )
}

export default function EonetTab({ eonet, eonetData }) {
  const events = eonetData?.events
  return (
    <div className="geo-tab-content">
      <Panel
        title="近 30 天自然事件分布"
        source="NASA EONET（eonet.gsfc.nasa.gov），进行中的自然事件，1 小时刷新"
        icon={<FireOutlined />}
        loading={eonet.loading}
        error={eonet.error}
      >
        {events?.length ? (
          <EonetMap events={events} />
        ) : (
          <Empty description="暂无事件数据" />
        )}
      </Panel>

      <Panel
        title="自然事件列表"
        source="NASA EONET；点击事件标题跳转官方详情页"
        icon={<FireOutlined />}
        loading={eonet.loading}
        error={eonet.error}
      >
        {events?.length ? (
          <Table
            className="geo-quake-table"
            size="small"
            rowKey="id"
            dataSource={events}
            pagination={{ pageSize: 10, size: 'small', showTotal: (t) => `共 ${t} 起` }}
            columns={[
              {
                title: '分类',
                dataIndex: 'cat',
                width: 110,
                render: (v, r) => <Tag color={catColor(r.catId)}>{CAT_LABEL[r.catId] || v}</Tag>,
              },
              {
                title: '事件',
                dataIndex: 'title',
                render: (v, r) =>
                  r.link ? (
                    <a href={r.link} target="_blank" rel="noreferrer">{v}</a>
                  ) : (
                    v
                  ),
              },
              {
                title: '坐标',
                key: 'coord',
                width: 140,
                align: 'right',
                render: (_, r) => `${r.lat.toFixed(1)}°, ${r.lon.toFixed(1)}°`,
              },
              {
                title: '日期',
                dataIndex: 'time',
                width: 110,
                align: 'right',
                render: (v) => (v ? v.slice(0, 10) : '—'),
              },
            ]}
          />
        ) : (
          <Empty description="暂无事件数据" />
        )}
      </Panel>
    </div>
  )
}
