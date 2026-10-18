/**
 * 「自然事件」Tab：NASA EONET 近 30 天进行中的自然事件
 * （野火 / 强风暴 / 火山 / 海冰 / 洪水 / 沙尘等），事件落点地图 + 列表。
 * 数据由 useGeoData 的 eonet 轮询提供（/api/geo/eonet，1 小时刷新）。
 */
import { useMemo } from 'react'
import { FireOutlined } from '@ant-design/icons'
import { Empty, Table, Tag } from 'antd'
import { Panel } from './ui.jsx'
import { useI18n } from '@i18n/index.js'
import { project, landPath, MAP_W, MAP_H } from '@components/AstroBoard/mapProjection.js'

/** EONET 分类 → 落点/标签配色 */
const CAT_COLOR = {
  wildfires: '#ef4444',
  severeStorms: '#a855f7',
  volcanoes: '#f97316',
  seaLakeIce: '#38bdf8',
  floods: '#0ea5e9',
  dustHaze: '#d97706',
}
const CAT_KEYS = {
  wildfires: 'geo.eonet.cat.wildfires',
  severeStorms: 'geo.eonet.cat.severeStorms',
  volcanoes: 'geo.eonet.cat.volcanoes',
  seaLakeIce: 'geo.eonet.cat.seaLakeIce',
  floods: 'geo.eonet.cat.floods',
  dustHaze: 'geo.eonet.cat.dustHaze',
}
const catColor = (id) => CAT_COLOR[id] || '#94a3b8'

/** 事件落点地图：复用地震图的等距圆柱投影与配色变量，点色按事件类别 */
function EonetMap({ events }) {
  const { t } = useI18n()
  const land = useMemo(() => landPath(), [])
  return (
    <div className="geo-quakemap">
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img" aria-label={t('geo.eonet.aria')}>
        <rect x="0" y="0" width={MAP_W} height={MAP_H} className="geo-quakemap__sea" />
        <path d={land} className="geo-quakemap__land" />
        {events.map((e) => {
          const p = project(e.lat, e.lon)
          const catLabel = CAT_KEYS[e.catId] ? t(CAT_KEYS[e.catId]) : e.cat
          return (
            <circle
              key={e.id}
              cx={p.x}
              cy={p.y}
              r="4"
              className="geo-quakemap__dot"
              style={{ '--dot-color': catColor(e.catId) }}
            >
              <title>{`${e.title}（${catLabel}）${e.time ? `\n${e.time.slice(0, 10)}` : ''}`}</title>
            </circle>
          )
        })}
      </svg>
      <div className="geo-quakemap__legend">
        {Object.keys(CAT_COLOR).map((id) => (
          <span key={id}>
            <i style={{ background: CAT_COLOR[id] }} />
            {t(CAT_KEYS[id])}
          </span>
        ))}
        <span className="geo-quakemap__legend-note">{t('geo.eonet.legendNote')}</span>
      </div>
    </div>
  )
}

export default function EonetTab({ eonet, eonetData }) {
  const { t } = useI18n()
  const events = eonetData?.events
  return (
    <div className="geo-tab-content">
      <Panel
        title={t('geo.eonet.mapTitle')}
        source={t('geo.eonet.mapSource')}
        icon={<FireOutlined />}
        loading={eonet.loading}
        error={eonet.error}
      >
        {events?.length ? (
          <EonetMap events={events} />
        ) : (
          <Empty description={t('geo.eonet.empty')} />
        )}
      </Panel>

      <Panel
        title={t('geo.eonet.listTitle')}
        source={t('geo.eonet.listSource')}
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
            pagination={{ pageSize: 10, size: 'small', showTotal: (total) => t('geo.eonet.listTotal', { n: total }) }}
            columns={[
              {
                title: t('geo.eonet.colCat'),
                dataIndex: 'cat',
                width: 110,
                render: (v, r) => <Tag color={catColor(r.catId)}>{CAT_KEYS[r.catId] ? t(CAT_KEYS[r.catId]) : v}</Tag>,
              },
              {
                title: t('geo.eonet.colEvent'),
                dataIndex: 'title',
                render: (v, r) =>
                  r.link ? (
                    <a href={r.link} target="_blank" rel="noreferrer">{v}</a>
                  ) : (
                    v
                  ),
              },
              {
                title: t('geo.eonet.colCoord'),
                key: 'coord',
                width: 140,
                align: 'right',
                render: (_, r) => `${r.lat.toFixed(1)}°, ${r.lon.toFixed(1)}°`,
              },
              {
                title: t('geo.eonet.colDate'),
                dataIndex: 'time',
                width: 110,
                align: 'right',
                render: (v) => (v ? v.slice(0, 10) : '—'),
              },
            ]}
          />
        ) : (
          <Empty description={t('geo.eonet.empty')} />
        )}
      </Panel>
    </div>
  )
}
