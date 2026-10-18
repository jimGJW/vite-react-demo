/**
 * EarthTab —— 「🌍 地球附近」标签页（自 AstroBoard 主壳拆出，原 index.jsx L691-916）。
 * 卫星追踪地图 / 月相 / 中国站过境预报。纯展示组件：数据与回调全部经 props 传入。
 */
import { Menu, Select, Spin, Tag, Tooltip } from 'antd'
import { AimOutlined, MoonOutlined, RocketOutlined } from '@ant-design/icons'
import { useI18n } from '@i18n/index.js'
import { MARK_COLOR, Metric, MoonSVG, Panel, fmtLatLon, pad } from './ui.jsx'
import { OBSERVERS, footprintRadius } from '@lib/astro/orbital.js'
import { getAstroKpi } from '@lib/astro/glossary'
import WorldTrackMap from '@components/AstroBoard/WorldTrackMap.jsx'

export default function EarthTab({
  iss, stations, selected, setSelected, positions, active, track, sun, moon, visibleTo, passes, passCity, setPassCity,
}) {
  const { t, lang } = useI18n()
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
              <span><i className="astro-dot astro-dot--cn" />{t('astro.earthLegendCn')}</span>
              <span><i className="astro-dot astro-dot--intl" />{t('astro.earthLegendIntl')}</span>
              <span><i className="astro-dot astro-dot--track" />{t('astro.earthLegendSunTrack')}</span>
              <span><i className="astro-dot astro-dot--dark" />{t('astro.earthLegendDarkTrack')}</span>
              <span><i className="astro-dot astro-dot--sun" />{t('astro.earthLegendSunPoint')}</span>
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
                  <Metric label={t('astro.earthLat')} value={active.lat.toFixed(2)} unit="°" info="inclination" />
                  <Metric label={t('astro.earthLon')} value={active.lon.toFixed(2)} unit="°" />
                  <Metric label={t('astro.earthOrbitAlt')} value={active.alt.toFixed(0)} unit="km" />
                  <Metric label={t('astro.earthOrbitSpeed')} value={active.speed.toFixed(2)} unit="km/s" info="gyro" />
                  <Metric label={t('astro.earthOrbitPeriod')} value={active.period.toFixed(1)} unit="min" info="period" />
                  <Metric label={t('astro.earthOrbitIncl')} value={active.inclination.toFixed(2)} unit="°" info="inclination" />
                  <Metric
                    label={t('astro.earthFootprint')}
                    value={footprintRadius(active.alt).toFixed(0)}
                    unit="km"
                    info="footprint"
                  />
                  <Metric
                    label={t('astro.earthSunlitStatus')}
                    value={active.sunlit === null ? '—' : active.sunlit ? t('astro.sunlit') : t('astro.shadow')}
                    tone={active.sunlit ? 'var(--a-track)' : 'var(--a-accent-icon)'}
                    info="sunlit"
                  />
                </div>
                <div className="astro-visible">
                  <AimOutlined /> {t('astro.earthVisibleStations')}
                  {visibleTo.length ? (
                    <span className="astro-visible__list">
                      {visibleTo.slice(0, 8).map((v) => (
                        <Tooltip key={v.name} title={`${t('astro.earthElevTip')} ${v.elev.toFixed(1)}° ${getAstroKpi('elevation', lang).what}`}>
                          <Tag bordered={false} className="astro-vis-tag">
                            {v.name} {v.elev.toFixed(0)}°
                          </Tag>
                        </Tooltip>
                      ))}
                    </span>
                  ) : (
                    <span className="astro-visible__none">{t('astro.earthNoVisible')}</span>
                  )}
                </div>
              </div>
            )}

            {iss.data?.ok && (
              <div className="astro-crosscheck">
                <span className="astro-crosscheck__tag">{t('astro.earthIssRealtime')}</span>
                {fmtLatLon(iss.data.lat, iss.data.lon)}
                <span className="astro-crosscheck__dim">
                  · {iss.data.alt.toFixed(0)} km · {(iss.data.speedKmh ?? 0).toFixed(0)} km/h
                  · {iss.data.visibility === 'daylight' ? t('astro.sunlitZone') : t('astro.shadowZone')}
                </span>
              </div>
            )}
          </div>
        </div>
      </Panel>

      {/* 卫星过境预报 */}
      <Panel
        title={t('astro.earthPassTitle')}
        source={t('astro.earthPassSource')}
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
            <Spin size="small" /> {t('astro.earthPassLoading', { city: passCity })}
          </div>
        ) : (
          <div className="astro-pass-list">
            {passes.map((s) => (
              <div key={s.key} className="astro-pass-group">
                <div className="astro-pass-group__head">
                  <span className="astro-target__dot" data-cn={s.country === '中国' ? '1' : '0'} />
                  <strong>{s.label}</strong>
                  <span className="astro-pass-group__cnt">{t('astro.earthPassCount', { n: s.passes.length })}</span>
                </div>
                {s.passes.map((p, i) => {
                  const startT = new Date(p.startTime.getTime() + 8 * 3600 * 1000)
                  const maxT = new Date(p.maxTime.getTime() + 8 * 3600 * 1000)
                  return (
                    <div key={i} className="astro-pass-item">
                      <div className="astro-pass-time">
                        <span className="astro-pass-time__start">
                          {pad(startT.getUTCHours())}:{pad(startT.getUTCMinutes())}
                        </span>
                        <span className="astro-pass-time__arrow">→</span>
                        <span className="astro-pass-time__end">
                          {pad(new Date(startT.getTime() + p.durationMin * 60000).getUTCHours())}:
                          {pad(new Date(startT.getTime() + p.durationMin * 60000).getUTCMinutes())}
                        </span>
                      </div>
                      <div className="astro-pass-detail">
                        <span>{t('astro.earthPassMaxElev')} <strong style={{ color: p.maxElev > 30 ? '#52c41a' : p.maxElev > 10 ? '#faad14' : '#8c8c8c' }}>{p.maxElev.toFixed(0)}°</strong></span>
                        <span>{t('astro.earthPassMaxTime')} {pad(maxT.getUTCHours())}:{pad(maxT.getUTCMinutes())}</span>
                        <span>{t('astro.earthPassDuration', { n: p.durationMin })}</span>
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
