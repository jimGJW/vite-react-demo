/**
 * DeepTab —— 「🌌 深空」标签页（自 AstroBoard 主壳拆出，原 index.jsx L1715-1804）。
 * 银河系结构示意 / 系外行星统计。纯展示组件：数据经 props 传入。
 */
import { Empty, Segmented, Tag } from 'antd'
import { AimOutlined, CompassOutlined } from '@ant-design/icons'
import { Panel, TermTip } from './ui.jsx'
import { zhMethod } from '../../../lib/astro/glossary'
import GalaxyDiagram from './GalaxyDiagram.jsx'
import GalaxyFacts from './GalaxyFacts.jsx'
import { useI18n } from '../../../i18n/index.js'

export default function DeepTab({ exoplanets, galaxyView, setGalaxyView }) {
  const { t } = useI18n()
  return (
    <>
              <div className="astro-tab-content">
                {/* 系外行星 */}
      <Panel
        title={t('astro.deepExoTitle')}
        source={t('astro.deepExoSource')}
        icon={<AimOutlined />}
        loading={exoplanets.loading}
        error={exoplanets.error}
      >
        <div className="astro-exo">
          <div className="astro-exo-sum">
            <div className="astro-exo-big">
              <span className="astro-exo-big__num">
                {exoplanets.data?.total ? exoplanets.data.total.toLocaleString() : '—'}
              </span>
              <span className="astro-exo-big__label">{t('astro.deepExoCount')}</span>
            </div>
            <div className="astro-exo-range">
              {t('astro.deepExoYearRange', { first: exoplanets.data?.firstYear ?? '—', last: exoplanets.data?.lastYear ?? '—' })}
            </div>
            <div className="astro-exo-methods">
              {exoplanets.data?.methods?.map((m) => {
                const zm = zhMethod(m.name)
                return (
                  <TermTip key={m.name} zh={zm.zh} en={zm.en} desc={zm.desc}>
                    <div className="astro-exo-method">
                      <div className="astro-exo-method__bar">
                        <i style={{ width: `${(m.count / (exoplanets.data?.total || 1)) * 100}%` }} />
                      </div>
                      <span className="astro-exo-method__name">
                        {zm.zh}
                        <span className="astro-exo-method__en">{zm.en}</span>
                      </span>
                      <span className="astro-exo-method__cnt">
                        {m.count} · {((m.count / (exoplanets.data?.total || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </TermTip>
                )
              })}
            </div>
          </div>

          <div className="astro-exo-latest">
            <div className="astro-chart__title">{t('astro.deepExoLatest', { year: exoplanets.data?.lastYear ?? '' })}</div>
            {exoplanets.data?.latest?.length ? (
              <div className="astro-exo-list">
                {exoplanets.data.latest.map((p) => {
                  const mt = zhMethod(p.method)
                  return (
                    <div key={p.name} className="astro-exo-item">
                      <div className="astro-exo-item__name">{p.name}</div>
                      <div className="astro-exo-item__host">{t('astro.deepExoOrbit', { host: p.host })}</div>
                      <div className="astro-exo-item__meta">
                        <TermTip zh={mt.zh} en={mt.en} desc={mt.desc}>
                          <Tag bordered={false} className="astro-method-tag">{mt.zh}</Tag>
                        </TermTip>
                        {p.periodDays && <span>{t('astro.deepExoPeriod', { n: Number(p.periodDays).toFixed(2) })}</span>}
                        {p.distLy && <span>{t('astro.deepExoDist', { n: p.distLy })}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('astro.deepEmpty')} />
            )}
          </div>
        </div>
      </Panel>

      {/* 银河系 */}
      <Panel
        title={t('astro.deepGalaxyTitle')}
        source={t('astro.deepGalaxySource')}
        icon={<CompassOutlined />}
        extra={
          <Segmented
            size="small"
            value={galaxyView}
            onChange={setGalaxyView}
            options={[
              { label: t('astro.galaxyViewStruct'), value: '结构' },
              { label: t('astro.galaxyViewData'), value: '数据' },
            ]}
          />
        }
      >
        {galaxyView === '结构' ? <GalaxyDiagram /> : <GalaxyFacts />}
      </Panel>
              </div>
    </>
  )
}
