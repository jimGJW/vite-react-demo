/**
 * SolarTab —— 「🪐 太阳系」标签页（自 AstroBoard 主壳拆出，原 index.jsx L921-1040）。
 * 太阳系行星实时位置 / 近地天体（NEO）。纯展示组件：数据与回调全部经 props 传入。
 */
import { Table, Tag, Tooltip } from 'antd'
import { AlertOutlined, CompassOutlined } from '@ant-design/icons'
import { KpiHint, Panel } from './ui.jsx'
import { AU_LIGHT_MINUTES } from '../../../lib/astro/orbital.js'
import { getAstroKpi } from '../../../lib/astro/glossary'
import SolarSystemView from '../../../components/AstroBoard/SolarSystemView.jsx'
import { useI18n } from '../../../i18n/index.js'

export default function SolarTab({
  stations, selected, setSelected, neo, neoData, planets,
}) {
  const { t, lang } = useI18n()
  return (
    <>
              <div className="astro-tab-content">
                {/* 太阳系 */}
      <Panel
        title={t('astro.solarTitle')}
        source={t('astro.solarSource')}
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
                title: t('astro.solarColPlanet'),
                dataIndex: 'name',
                render: (_, p) => (
                  <span className="astro-pt-name">
                    <i className="astro-pt-dot" style={{ background: p.color }} />
                    {p.name}
                  </span>
                ),
              },
              {
                title: t('astro.solarColHelioLon'),
                dataIndex: 'heliocentricLon',
                align: 'right',
                render: (v) => `${Number(v).toFixed(1)}°`,
              },
              {
                title: t('astro.solarColGeoDist'),
                dataIndex: 'geoDist',
                align: 'right',
                render: (v, p) => (p.key === 'earth' ? '—' : `${Number(v).toFixed(3)} AU`),
              },
              {
                title: t('astro.solarColOrbitR'),
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
            {t('astro.solarFoot', { min: AU_LIGHT_MINUTES.toFixed(1) })}
          </div>
        </div>
      </Panel>

      {/* 近地小行星 */}
      <Panel
        title={t('astro.neoTitle')}
        source={t('astro.neoSource')}
        icon={<AlertOutlined />}
        loading={neo.loading}
        error={neo.error}
        extra={neoData?.hazardous ? <Tag bordered={false} className="astro-hazard-tag">{t('astro.neoHazardTag', { n: neoData.hazardous })}</Tag> : undefined}
      >
        <div className="astro-neo-layout">
          {neoData?.nearest && (
            <div className="astro-neo-nearest">
              <div className="astro-neo-nearest__label">{t('astro.neoNearest')}</div>
              <div className="astro-neo-nearest__name">{neoData.nearest.name}</div>
              <div className="astro-neo-nearest__dist">
                {neoData.nearest.distKm.toLocaleString()} km
              </div>
              <div className="astro-neo-nearest__lunar">
                {t('astro.neoLunarDist', { n: neoData.nearest.distLunar })}
                <KpiHint kpiKey="distLunar" />
              </div>
              <div className="astro-neo-nearest__meta">
                <span>
                  {t('astro.neoDiameter', { min: neoData.nearest.diameterMin, max: neoData.nearest.diameterMax })}
                  <KpiHint kpiKey="diameter" />
                </span>
                <span>{t('astro.neoVelocity', { v: neoData.nearest.velocityKmh.toLocaleString() })}</span>
                <span>{t('astro.neoApproachTime', { time: neoData.nearest.date.replace('T', ' ').slice(0, 16) })}</span>
                {neoData.nearest.hazardous && (
                  <Tooltip title={getAstroKpi('hz', lang).what}>
                    <span className="astro-neo-hazard">{t('astro.neoHazardLabel')}</span>
                  </Tooltip>
                )}
              </div>
            </div>
          )}
          <div className="astro-neo-table">
            <div className="astro-neo-thead">
              <span>{t('astro.neoColName')}</span><span>{t('astro.neoColDist')}</span><span>{t('astro.neoColLunar')}</span><span>{t('astro.neoColVel')}</span><span>{t('astro.neoColDiam')}</span><span>{t('astro.neoColHazard')}</span>
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
