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

export default function DeepTab({ exoplanets, galaxyView, setGalaxyView }) {
  return (
    <>
              <div className="astro-tab-content">
                {/* 系外行星 */}
      <Panel
        title="系外行星与巡天成果"
        source="NASA Exoplanet Archive（已确认行星，default_flag=1）"
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
              <span className="astro-exo-big__label">颗已确认系外行星</span>
            </div>
            <div className="astro-exo-range">
              确认年份跨度 {exoplanets.data?.firstYear ?? '—'} – {exoplanets.data?.lastYear ?? '—'}
            </div>
            <div className="astro-exo-methods">
              {exoplanets.data?.methods?.map((m) => {
                const t = zhMethod(m.name)
                return (
                  <TermTip key={m.name} zh={t.zh} en={t.en} desc={t.desc}>
                    <div className="astro-exo-method">
                      <div className="astro-exo-method__bar">
                        <i style={{ width: `${(m.count / (exoplanets.data?.total || 1)) * 100}%` }} />
                      </div>
                      <span className="astro-exo-method__name">
                        {t.zh}
                        <span className="astro-exo-method__en">{t.en}</span>
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
            <div className="astro-chart__title">最新确认（{exoplanets.data?.lastYear ?? ''} 年）</div>
            {exoplanets.data?.latest?.length ? (
              <div className="astro-exo-list">
                {exoplanets.data.latest.map((p) => {
                  const mt = zhMethod(p.method)
                  return (
                    <div key={p.name} className="astro-exo-item">
                      <div className="astro-exo-item__name">{p.name}</div>
                      <div className="astro-exo-item__host">绕 {p.host}</div>
                      <div className="astro-exo-item__meta">
                        <TermTip zh={mt.zh} en={mt.en} desc={mt.desc}>
                          <Tag bordered={false} className="astro-method-tag">{mt.zh}</Tag>
                        </TermTip>
                        {p.periodDays && <span>周期 {Number(p.periodDays).toFixed(2)} 天</span>}
                        {p.distLy && <span>距地 {p.distLy} 光年</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
            )}
          </div>
        </div>
      </Panel>

      {/* 银河系 */}
      <Panel
        title="银河系结构与太阳的位置"
        source="ESA Gaia DR3 公开数据 / NASA 银河系基础参数"
        icon={<CompassOutlined />}
        extra={
          <Segmented
            size="small"
            value={galaxyView}
            onChange={setGalaxyView}
            options={['结构', '数据']}
          />
        }
      >
        {galaxyView === '结构' ? <GalaxyDiagram /> : <GalaxyFacts />}
      </Panel>
              </div>
    </>
  )
}
