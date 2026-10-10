/**
 * SolarTab —— 「🪐 太阳系」标签页（自 AstroBoard 主壳拆出，原 index.jsx L921-1040）。
 * 太阳系行星实时位置 / 近地天体（NEO）。纯展示组件：数据与回调全部经 props 传入。
 */
import { Table, Tag, Tooltip } from 'antd'
import { AlertOutlined, CompassOutlined } from '@ant-design/icons'
import { KpiHint, Panel } from './ui.jsx'
import { AU_LIGHT_MINUTES } from '../../../lib/astro/orbital.js'
import { KPI_DEFS } from '../../../lib/astro/glossary'
import SolarSystemView from '../../../components/AstroBoard/SolarSystemView.jsx'

export default function SolarTab({
  stations, selected, setSelected, neo, neoData, planets,
}) {
  return (
    <>
              <div className="astro-tab-content">
                {/* 太阳系 */}
      <Panel
        title="太阳系行星实时位置"
        source="JPL Standish 轨道近似根数（本地解算），历元 J2000，适用 1800–2050"
        icon={<CompassOutlined />}
        loading={stations.loading}
        error={stations.error}
      >
        <div className="astro-solar-layout">
          <SolarSystemView
            planets={planets}
            selected={selected.startsWith('css') || selected === 'iss' ? null : selected}
            onSelect={(k) => setSelected(k)}
          />
          <Table
            className="astro-planet-table"
            size="small"
            pagination={false}
            rowKey="key"
            dataSource={planets}
            columns={[
              {
                title: '行星',
                dataIndex: 'name',
                render: (_, p) => (
                  <span className="astro-pt-name">
                    <i className="astro-pt-dot" style={{ background: p.color }} />
                    {p.name}
                  </span>
                ),
              },
              {
                title: '日心黄经',
                dataIndex: 'heliocentricLon',
                align: 'right',
                render: (v) => `${Number(v).toFixed(1)}°`,
              },
              {
                title: '地心距离',
                dataIndex: 'geoDist',
                align: 'right',
                render: (v, p) => (p.key === 'earth' ? '—' : `${Number(v).toFixed(3)} AU`),
              },
              {
                title: '轨道半径',
                dataIndex: 'a',
                align: 'right',
                render: (v) => `${Number(v).toFixed(2)} AU`,
              },
            ]}
            onRow={(p) => ({
              onClick: () => setSelected(p.key),
              style: { cursor: 'pointer' },
            })}
            rowClassName={(p) => (selected === p.key ? 'is-active' : '')}
          />
          <div className="astro-pt-foot">
            阳光走完 1 AU 需要 {AU_LIGHT_MINUTES.toFixed(1)} 分钟（8 分 20 秒）·
            地球轨道内行星的「地心距离」随相位变化，近日点约 0.983 AU、远日点约 1.017 AU
          </div>
        </div>
      </Panel>

      {/* 近地小行星 */}
      <Panel
        title="近地天体（NEO）监视"
        source="NASA NeoWs（Near Earth Object Web Service，DEMO_KEY）"
        icon={<AlertOutlined />}
        loading={neo.loading}
        error={neo.error}
        extra={neoData?.hazardous ? <Tag bordered={false} className="astro-hazard-tag">⚠ {neoData.hazardous} 颗潜在危险</Tag> : undefined}
      >
        <div className="astro-neo-layout">
          {neoData?.nearest && (
            <div className="astro-neo-nearest">
              <div className="astro-neo-nearest__label">最近接近</div>
              <div className="astro-neo-nearest__name">{neoData.nearest.name}</div>
              <div className="astro-neo-nearest__dist">
                {neoData.nearest.distKm.toLocaleString()} km
              </div>
              <div className="astro-neo-nearest__lunar">
                {neoData.nearest.distLunar} 倍地月距离
                <KpiHint kpiKey="distLunar" />
              </div>
              <div className="astro-neo-nearest__meta">
                <span>
                  直径 {neoData.nearest.diameterMin}–{neoData.nearest.diameterMax} m
                  <KpiHint kpiKey="diameter" />
                </span>
                <span>速度 {neoData.nearest.velocityKmh.toLocaleString()} km/h</span>
                <span>接近时间 {neoData.nearest.date.replace('T', ' ').slice(0, 16)} UTC</span>
                {neoData.nearest.hazardous && (
                  <Tooltip title={KPI_DEFS.hz.what}>
                    <span className="astro-neo-hazard">⚠ 潜在危险小行星</span>
                  </Tooltip>
                )}
              </div>
            </div>
          )}
          <div className="astro-neo-table">
            <div className="astro-neo-thead">
              <span>名称</span><span>距离(万km)</span><span>地月倍数</span><span>速度(km/h)</span><span>直径(m)</span><span>危险</span>
            </div>
            {neoData?.items?.map((n) => (
              <div key={n.id} className={`astro-neo-row${n.hazardous ? ' is-hazard' : ''}`}>
                <span>{n.name}</span>
                <span>{(n.distKm / 10000).toFixed(1)}</span>
                <span>{n.distLunar}</span>
                <span>{n.velocityKmh.toLocaleString()}</span>
                <span>{n.diameterMin}–{n.diameterMax}</span>
                <span>{n.hazardous ? '⚠' : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>
              </div>
    </>
  )
}
