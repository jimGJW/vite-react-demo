/**
 * EarthTab —— 「🌍 地球附近」标签页（自 AstroBoard 主壳拆出，原 index.jsx L691-916）。
 * 卫星追踪地图 / 月相 / 中国站过境预报。纯展示组件：数据与回调全部经 props 传入。
 */
import { Menu, Select, Spin, Tag, Tooltip } from 'antd'
import { AimOutlined, MoonOutlined, RocketOutlined } from '@ant-design/icons'
import { useI18n } from '../../../i18n/index.js'
import { MARK_COLOR, Metric, MoonSVG, Panel, fmtLatLon, pad } from './ui.jsx'
import { OBSERVERS, footprintRadius } from '../../../lib/astro/orbital.js'
import { KPI_DEFS } from '../../../lib/astro/glossary'
import WorldTrackMap from '../../../components/AstroBoard/WorldTrackMap.jsx'

export default function EarthTab({
  iss, stations, selected, setSelected, positions, active, track, sun, moon, visibleTo, passes, passCity, setPassCity,
}) {
  const { t } = useI18n()
  return (
    <>
              <div className="astro-tab-content">
                {/* 月球 */}
      <Panel
        title={t('astro.earthMoonTitle')}
        source={t('astro.earthMoonSource')}
        icon={<MoonOutlined />}
      >
        <div className="astro-moon-layout">
          <div className="astro-moon-visual">
            <MoonSVG phaseFraction={moon.phaseFraction} />
            <div className="astro-moon-phase">{moon.phaseName}</div>
            <div className="astro-moon-illum">{t('astro.earthMoonIllum')} {(moon.illumination * 100).toFixed(1)}%</div>
          </div>
          <div className="astro-moon-data">
            <div className="astro-moon-rows">
              <div className="astro-moon-row">
                <span>{t('astro.earthMoonAge')}</span>
                <strong>{moon.age.toFixed(2)} 天</strong>
              </div>
              <div className="astro-moon-row">
                <span>{t('astro.earthMoonDist')}</span>
                <strong>{moon.dist.toLocaleString()} km</strong>
                <span className="astro-moon-delta" style={{ color: moon.distPct > 0 ? '#ff7a45' : '#52c41a' }}>
                  {moon.distPct > 0 ? '+' : ''}{moon.distPct.toFixed(2)}%
                </span>
              </div>
              <div className="astro-moon-row">
                <span>{t('astro.earthMoonDiameter')}</span>
                <strong>{moon.angularDiam.toFixed(2)} 角分</strong>
              </div>
              <div className="astro-moon-row">
                <span>{t('astro.earthMoonDistState')}</span>
                <strong style={{ color: moon.distLabel === '近地点附近' ? '#ff4d4f' : moon.distLabel === '远地点附近' ? '#4a9eff' : undefined }}>
                  {moon.distLabel}
                </strong>
              </div>
              <div className="astro-moon-row">
                <span>{t('astro.earthMoonNextFull')}</span>
                <strong>{moon.daysToFullMoon.toFixed(1)} 天</strong>
              </div>
              <div className="astro-moon-row">
                <span>{t('astro.earthMoonNextNew')}</span>
                <strong>{moon.daysToNewMoon.toFixed(1)} 天</strong>
              </div>
            </div>
            <div className="astro-moon-note">
              {t('astro.earthMoonNote')}
            </div>
          </div>
        </div>
      </Panel>

      {/* 空间站 */}
      <Panel
        title={t('astro.earthStationTitle')}
        source={t('astro.earthStationSource')}
        icon={<RocketOutlined />}
        loading={stations.loading}
        error={stations.error}
        extra={<Tag bordered={false} className="astro-live-tag">{t('astro.earthLiveTag')}</Tag>}
      >
        <div className="astro-station-layout">
          <div className="astro-station-map">
            <WorldTrackMap
              track={track}
              markers={positions.map((p) => ({
                key: p.key,
                label: p.cn,
                lat: p.lat,
                lon: p.lon,
                color: MARK_COLOR(p.country),
              }))}
              subsolar={sun}
              observers={OBSERVERS}
              selected={selected}
              onSelect={setSelected}
            />
            <div className="astro-map-legend">
              <span><i className="astro-dot astro-dot--cn" />中国</span>
              <span><i className="astro-dot astro-dot--intl" />国际</span>
              <span><i className="astro-dot astro-dot--track" />日照段轨迹</span>
              <span><i className="astro-dot astro-dot--dark" />阴影段轨迹</span>
              <span><i className="astro-dot astro-dot--sun" />太阳直射点</span>
            </div>
          </div>

          <div className="astro-station-side">
            <Menu
              mode="inline"
              className="astro-target-menu"
              selectedKeys={[selected]}
              onClick={({ key }) => setSelected(key)}
              items={positions.map((p) => ({
                key: p.key,
                label: (
                  <span className="astro-target">
                    <span className="astro-target__dot" data-cn={p.country === '中国' ? '1' : '0'} />
                    <span className="astro-target__name">{p.label}</span>
                    <span className="astro-target__pos">{fmtLatLon(p.lat, p.lon)}</span>
                    <span className="astro-target__alt">{p.alt.toFixed(0)} km</span>
                  </span>
                ),
              }))}
            />

            {active && (
              <div className="astro-detail">
                <div className="astro-detail__head">
                  <strong>{active.label}</strong>
                  <Tag bordered={false} className="astro-cn-tag">{active.country}</Tag>
                </div>
                <div className="astro-detail__grid">
                  <Metric label="纬度" value={active.lat.toFixed(2)} unit="°" info="inclination" />
                  <Metric label="经度" value={active.lon.toFixed(2)} unit="°" />
                  <Metric label="轨道高度" value={active.alt.toFixed(0)} unit="km" />
                  <Metric label="轨道速度" value={active.speed.toFixed(2)} unit="km/s" info="gyro" />
                  <Metric label="轨道周期" value={active.period.toFixed(1)} unit="min" info="period" />
                  <Metric label="轨道倾角" value={active.inclination.toFixed(2)} unit="°" info="inclination" />
                  <Metric
                    label="覆盖半径"
                    value={footprintRadius(active.alt).toFixed(0)}
                    unit="km"
                    info="footprint"
                  />
                  <Metric
                    label="日照状态"
                    value={active.sunlit === null ? '—' : active.sunlit ? '受照' : '阴影'}
                    tone={active.sunlit ? 'var(--a-track)' : 'var(--a-accent-icon)'}
                    info="sunlit"
                  />
                </div>
                <div className="astro-visible">
                  <AimOutlined /> 当前可见地面站
                  {visibleTo.length ? (
                    <span className="astro-visible__list">
                      {visibleTo.slice(0, 8).map((v) => (
                        <Tooltip key={v.name} title={`观测仰角 ${v.elev.toFixed(1)}° ${KPI_DEFS.elevation.what}`}>
                          <Tag bordered={false} className="astro-vis-tag">
                            {v.name} {v.elev.toFixed(0)}°
                          </Tag>
                        </Tooltip>
                      ))}
                    </span>
                  ) : (
                    <span className="astro-visible__none">此刻所有站点均在背面</span>
                  )}
                </div>
              </div>
            )}

            {iss.data?.ok && (
              <div className="astro-crosscheck">
                <span className="astro-crosscheck__tag">ISS 接口实测</span>
                {fmtLatLon(iss.data.lat, iss.data.lon)}
                <span className="astro-crosscheck__dim">
                  · {iss.data.alt.toFixed(0)} km · {(iss.data.speedKmh ?? 0).toFixed(0)} km/h
                  · {iss.data.visibility === 'daylight' ? '日照区' : '阴影区'}
                </span>
              </div>
            )}
          </div>
        </div>
      </Panel>

      {/* 卫星过境预报 */}
      <Panel
        title="卫星可见过境预报（未来 6 小时）"
        source="TLE + SGP4 本地推算（与空间站面板同一套轨道根数）"
        icon={<AimOutlined />}
        extra={
          <Select
            size="small"
            className="astro-pass-select"
            value={passCity}
            onChange={setPassCity}
            style={{ width: 96 }}
            options={OBSERVERS.map((o) => ({ value: o.name, label: o.name }))}
          />
        }
      >
        {passes.length === 0 ? (
          <div className="astro-loading">
            <Spin size="small" /> 正在计算未来 6 小时内 {passCity} 的可见过境…
            （若无结果说明该时段内目标均在背面或地平线下）
          </div>
        ) : (
          <div className="astro-pass-list">
            {passes.map((s) => (
              <div key={s.key} className="astro-pass-group">
                <div className="astro-pass-group__head">
                  <span className="astro-target__dot" data-cn={s.country === '中国' ? '1' : '0'} />
                  <strong>{s.label}</strong>
                  <span className="astro-pass-group__cnt">{s.passes.length} 次可见过境</span>
                </div>
                {s.passes.map((p, i) => {
                  const t = new Date(p.startTime.getTime() + 8 * 3600 * 1000)
                  const mt = new Date(p.maxTime.getTime() + 8 * 3600 * 1000)
                  return (
                    <div key={i} className="astro-pass-item">
                      <div className="astro-pass-time">
                        <span className="astro-pass-time__start">
                          {pad(t.getUTCHours())}:{pad(t.getUTCMinutes())}
                        </span>
                        <span className="astro-pass-time__arrow">→</span>
                        <span className="astro-pass-time__end">
                          {pad(new Date(t.getTime() + p.durationMin * 60000).getUTCHours())}:
                          {pad(new Date(t.getTime() + p.durationMin * 60000).getUTCMinutes())}
                        </span>
                      </div>
                      <div className="astro-pass-detail">
                        <span>峰值仰角 <strong style={{ color: p.maxElev > 30 ? '#52c41a' : p.maxElev > 10 ? '#faad14' : '#8c8c8c' }}>{p.maxElev.toFixed(0)}°</strong></span>
                        <span>峰值时间 {pad(mt.getUTCHours())}:{pad(mt.getUTCMinutes())}</span>
                        <span>持续 {p.durationMin} 分钟</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </Panel>
              </div>
    </>
  )
}
