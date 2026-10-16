/**
 * SunTab —— 「☀️ 太阳活动」标签页（自 AstroBoard 主壳拆出，原 index.jsx L1045-1431）。
 * 太阳风 / 地磁 Kp / 耀斑质子事件 / 极光 / 活动周期图。纯展示组件：数据经 props 传入。
 */
import { Empty, Tag, Tooltip } from 'antd'
import { AlertOutlined, CompassOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { FLARE_TONE, G_SCALE_ROWS, KpiCard, KpiHint, Panel, TermTip, flareLevelOf } from './ui.jsx'
import SolarCycleChart from './SolarCycleChart.jsx'
import Sparkline from './Sparkline.jsx'
import { f107Level, solarWindLevel } from '../../../lib/astro/orbital.js'
import { zhAlertLevel, zhFlareClass, zhProtonScale } from '../../../lib/astro/glossary'
import { useI18n } from '../../../i18n/index.js'

export default function SunTab({
  spaceWeather, solarActivity, aurora, solarCycle, sw, kp, kpInfo, solar, xr, proton, alertData, auroraData, cycleData,
}) {
  const { t } = useI18n()
  return (
    <>
              <div className="astro-tab-content">
                {/* 空间天气 */}
      <Panel
        title={t('astro.sunTitle')}
        source={t('astro.sunSource')}
        icon={<ThunderboltOutlined />}
        loading={spaceWeather.loading}
        error={spaceWeather.error}
      >
        <div className="astro-sw-grid">
          <div className="astro-sw-main">
            <div className="astro-kp">
              <div className="astro-kp__dial" style={{ borderColor: kpInfo.color }}>
                <span className="astro-kp__val" style={{ color: kpInfo.color }}>
                  {kp == null ? '—' : kp.toFixed(2)}
                </span>
                <span className="astro-kp__unit">{t('astro.sunKpIndex')}</span>
              </div>
              <div className="astro-kp__info">
                <Tag bordered={false} style={{ background: kpInfo.color, color: '#fff' }}>
                  {kpInfo.level}
                </Tag>
                <strong>{kpInfo.label}</strong>
                <p>{kpInfo.desc}</p>
                <div className="astro-kp__glossary">
                  <Tooltip title={<KpiCard kpiKey="kp" />}>
                    <Tag bordered={false} className="astro-gloss-tag">{t('astro.sunKpWhat')}</Tag>
                  </Tooltip>
                  <Tooltip title={<KpiCard kpiKey="gscale" />}>
                    <Tag bordered={false} className="astro-gloss-tag">{t('astro.sunGScale')}</Tag>
                  </Tooltip>
                </div>
                {sw?.kp?.time && <span className="astro-sw-time">{t('astro.sunObsTime', { time: sw.kp.time.replace('T', ' ') })}</span>}
              </div>
            </div>

            {/* Kp 24 小时走势 */}
            {sw?.kp?.ok && sw.kp.history?.length > 2 && (
              <div className="astro-chart">
                <div className="astro-chart__title">
                  {t('astro.sunKp24h')}
                  <KpiHint kpiKey="kpHistory" />
                </div>
                <Sparkline
                  data={sw.kp.history.map((h) => h.Kp)}
                  max={9}
                  color={kpInfo.color}
                  format={(v) => v.toFixed(1)}
                />
              </div>
            )}

            {/* G 级对照表：把「G0 = 平静」这类含义直接摊开 */}
            <div className="astro-gscale">
              <div className="astro-chart__title">{t('astro.sunGTable')}</div>
              <div className="astro-gscale-grid">
                {G_SCALE_ROWS.map((r) => (
                  <Tooltip key={r.level} title={r.desc}>
                    <div
                      className={`astro-gscale-cell${kpInfo.level === r.level ? ' is-active' : ''}`}
                      style={{ borderColor: r.color }}
                    >
                      <span className="astro-gscale-cell__lv" style={{ color: r.color }}>{r.level}</span>
                      <span className="astro-gscale-cell__lb">{r.label}</span>
                      <span className="astro-gscale-cell__kp">Kp {r.range}</span>
                    </div>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>

          <div className="astro-sw-side">
            <div className="astro-sw-row">
              <span>
                {t('astro.sunWindSpeed')}
                <KpiHint kpiKey="wind" />
              </span>
              <strong style={{ color: solarWindLevel(sw?.wind?.ok ? sw.wind.speedKmS : null).color }}>
                {sw?.wind?.ok ? `${sw.wind.speedKmS} km/s` : '—'}
              </strong>
            </div>
            <div className="astro-sw-row">
              <span>
                {t('astro.sunBz')}
                <KpiHint kpiKey="bz" />
              </span>
              <strong style={{ color: (sw?.mag?.ok && sw.mag.bz < 0) ? 'var(--a-danger)' : undefined }}>
                {sw?.mag?.ok ? `${sw.mag.bz} nT` : '—'}
              </strong>
            </div>
            <div className="astro-sw-row">
              <span>
                {t('astro.sunBt')}
                <KpiHint kpiKey="bt" />
              </span>
              <strong>{sw?.mag?.ok ? `${sw.mag.bt} nT` : '—'}</strong>
            </div>
            <div className="astro-sw-row">
              <span>
                {t('astro.sunF107')}
                <KpiHint kpiKey="f107" />
              </span>
              <strong style={{ color: f107Level(sw?.f107?.ok ? sw.f107.flux : null).color }}>
                {sw?.f107?.ok ? `${sw.f107.flux}` : '—'}
              </strong>
            </div>
            <div className="astro-sw-row">
              <span>{t('astro.sun90avg')}</span>
              <strong>{sw?.f107?.ok ? `${sw.f107.mean90 ?? '—'}` : '—'}</strong>
            </div>
            <div className="astro-sw-row">
              <span>
                {t('astro.sunSunspot')}
                <KpiHint kpiKey="sunspot" />
              </span>
              <strong>{sw?.sunspot?.ok ? sw.sunspot.ss : '—'}</strong>
            </div>
            <div className="astro-sw-note">
              {t('astro.sunSwNote')}
            </div>
          </div>
        </div>
      </Panel>

      {/* 太阳耀斑 */}
      <Panel
        title={t('astro.sunFlareTitle')}
        source={t('astro.sunFlareSource')}
        icon={<ThunderboltOutlined />}
        loading={solarActivity.loading}
        error={solarActivity.error || solar?.xrays?.error}
      >
        {!xr ? (
          <Empty description={t('astro.sunXrayEmpty')} />
        ) : (
          <>
            <div className="astro-flare-kpis">
              <div className="astro-flare-kpi">
                <span>{t('astro.sunFlareCurLevel')}</span>
                <strong style={{ color: FLARE_TONE[xr.currentClass.letter] }}>
                  {zhFlareClass(xr.currentClass.letter).zh}
                  <KpiHint kpiKey="flare" />
                </strong>
                <em>{xr.currentFlux.toExponential(2)} W/m²</em>
              </div>
              <div className="astro-flare-kpi">
                <span>{t('astro.sun24hPeak')}</span>
                <strong style={{ color: FLARE_TONE[xr.peakClass.letter] }}>
                  {zhFlareClass(xr.peakClass.letter).zh}
                </strong>
                <em>{new Date(xr.peakTime).toLocaleString('zh-CN', { hour12: false })}</em>
              </div>
              <div className="astro-flare-kpi">
                <span>{t('astro.sunFlareCount24')}</span>
                <strong>{xr.total24h}</strong>
                <em>
                  {Object.entries(xr.byClass)
                    .map(([k, v]) => `${k}${v}`)
                    .join(' · ') || t('astro.sunFlareNone')}
                </em>
                <KpiHint kpiKey="flareCount" />
              </div>
            </div>

            {xr.history?.length > 2 && (
              <Sparkline
                data={xr.history.map((h) => h.v)}
                max={Math.max(xr.peakFlux, 1e-8) * 1.1}
                color="var(--a-sun)"
                format={(v) => zhFlareClass(flareLevelOf(v)).zh}
              />
            )}

            <div className="astro-flare-list">
              {xr.events?.length ? (
                xr.events.slice(0, 8).map((e, i) => {
                  const fc = zhFlareClass(e.cls)
                  return (
                    <div key={`${e.start}-${i}`} className="astro-flare-item">
                      <span className="astro-flare-item__cls" style={{ background: e.tone }}>
                        {e.zh}
                      </span>
                      <span className="astro-flare-item__time">
                        {new Date(e.start).toLocaleString('zh-CN', {
                          month: '2-digit', day: '2-digit', hour: '2-digit',
                          minute: '2-digit', hour12: false,
                        })}
                      </span>
                      <span className="astro-flare-item__dur">{t('astro.sunFlareDur', { min: e.durationMin })}</span>
                      <TermTip zh={fc.zh} en={fc.en} desc={fc.desc}>
                        <span className="astro-flare-item__desc">{fc.desc.slice(0, 26)}…</span>
                      </TermTip>
                    </div>
                  )
                })
              ) : (
                <Empty description={t('astro.sunFlareEmpty')} />
              )}
            </div>
          </>
        )}
      </Panel>

      {/* 太阳质子事件 */}
      <Panel
        title={t('astro.sunProtonTitle')}
        source={t('astro.sunProtonSource')}
        icon={<AlertOutlined />}
        loading={solarActivity.loading}
      >
        {!proton ? (
          <Empty description={t('astro.sunProtonEmpty')} />
        ) : (
          <>
            <div className="astro-proton-row">
              <div className="astro-proton-stat">
                <span>{t('astro.sunProtonCur')}</span>
                <strong>{proton.current}</strong>
                <em>pfu</em>
              </div>
              <TermTip
                zh={zhProtonScale(proton.currentLevel).zh}
                en={proton.currentLevel}
                desc={zhProtonScale(proton.currentLevel).desc}
              >
                <Tag bordered={false} color={zhProtonScale(proton.currentLevel).tone}>
                  {zhProtonScale(proton.currentLevel).zh}
                  <KpiHint kpiKey="proton" />
                </Tag>
              </TermTip>
              <div className="astro-proton-stat">
                <span>{t('astro.sun24hPeak')}</span>
                <strong style={{ color: zhProtonScale(proton.peakLevel).tone }}>
                  {proton.peak} <em>pfu · {zhProtonScale(proton.peakLevel).zh}</em>
                </strong>
              </div>
            </div>
            {proton.history?.length > 2 && (
              <Sparkline
                data={proton.history.map((h) => h.v)}
                max={Math.max(proton.peak, 1)}
                color="var(--a-track)"
                format={(v) => `${v} pfu`}
              />
            )}
          </>
        )}
      </Panel>

      {/* 极光 */}
      <Panel
        title={t('astro.sunAuroraTitle')}
        source={t('astro.sunAuroraSource')}
        icon={<CompassOutlined />}
        loading={aurora.loading}
        error={aurora.error}
      >
        {!auroraData ? (
          <Empty description={t('astro.sunAuroraEmpty')} />
        ) : (
          <>
            <div className="astro-aurora-head">
              <div className="astro-aurora-band">
                <span className="astro-aurora-band__label">{t('astro.sunAuroraBand')}</span>
                <strong>
                  {auroraData.bandLatMin}° – {auroraData.bandLatMax}°
                </strong>
                <div className="astro-aurora-scale">
                  <div
                    className="astro-aurora-scale__zone"
                    style={{
                      left: `${((auroraData.southEdge - 35) / 55) * 100}%`,
                      width: `${((auroraData.bandLatMax - auroraData.southEdge) / 55) * 100}%`,
                    }}
                  />
                  {[{ lat: 39.9, name: '北京' }, { lat: 45.8, name: '哈尔滨' }, { lat: 52.97, name: '漠河' }].map((c) => (
                    <div key={c.name} className="astro-aurora-scale__mark" style={{ left: `${((c.lat - 35) / 55) * 100}%` }}>
                      {c.name}
                    </div>
                  ))}
                </div>
                <KpiHint kpiKey="aurora" />
              </div>
            </div>
            <div className="astro-aurora-cities">
              {auroraData.cities?.map((c) => (
                <div key={c.name} className={`astro-aurora-city${c.visible ? ' is-yes' : ''}`}>
                  <span className="astro-aurora-city__name">{c.name}</span>
                  <span className="astro-aurora-city__lat">{c.lat}°N</span>
                  <Tag bordered={false} color={c.visible ? '#52c41a' : '#8c8c8c'}>
                    {c.visible ? t('astro.auroraVisible') : t('astro.auroraInvisible')}
                  </Tag>
                </div>
              ))}
            </div>
            <div className="astro-sw-note">
              {t('astro.sunAuroraNote', { edge: auroraData.southEdge })}
            </div>
          </>
        )}
      </Panel>

      {/* 太阳活动周期 */}
      <Panel
        title={t('astro.sunCycleTitle')}
        source={t('astro.sunCycleSource')}
        icon={<ThunderboltOutlined />}
        loading={solarCycle.loading}
        error={solarCycle.error}
      >
        {!cycleData ? (
          <Empty description={t('astro.sunCycleEmpty')} />
        ) : (
          <>
            <div className="astro-cycle-kpis">
              <div className="astro-cycle-kpi">
                <span>{t('astro.sunCycleCurMonth')}</span>
                <strong>{cycleData.current.month}</strong>
                <em>{t('astro.sunCycleSs', { n: cycleData.current.ss })}</em>
              </div>
              <div className="astro-cycle-kpi">
                <span>{t('astro.sunCycleSmoothed')}</span>
                <strong>{cycleData.current.smoothed ?? '—'}</strong>
                <em>{t('astro.sunCycleSmoothNote', { m: cycleData.current.smoothedMonth || '' })}</em>
                <KpiHint kpiKey="solarCycle" />
              </div>
              <div className="astro-cycle-kpi">
                <span>{t('astro.sunCyclePeak')}</span>
                <strong>{cycleData.historicalPeak.smoothed}</strong>
                <em>{cycleData.historicalPeak.month}</em>
              </div>
            </div>
            <SolarCycleChart data={cycleData} />
            <div className="astro-sw-note">
              {t('astro.sunCycleNote', { smoothed: cycleData.historicalPeak.smoothed, month: cycleData.historicalPeak.month })}
            </div>
          </>
        )}
      </Panel>

      {/* 空间天气警报 */}
      <Panel
        title={t('astro.sunAlertTitle')}
        source={t('astro.sunAlertSource')}
        icon={<AlertOutlined />}
        loading={solarActivity.loading}
      >
        {alertData?.items?.length ? (
          <div className="astro-alert-list">
            {alertData.items.map((a, i) => {
              const lv = zhAlertLevel(a.level)
              return (
                <div key={`${a.productId}-${i}`} className="astro-alert-item">
                  <div className="astro-alert-item__head">
                    <Tag bordered={false} color={lv.tone}>{lv.zh}</Tag>
                    {a.scaleCode && (
                      <Tag bordered={false} color={a.scaleType === 'G' ? kpInfo.color : '#fa8c16'}>
                        {a.scaleType === 'G'
                          ? t('astro.sunAlertGeo', { code: a.scaleCode })
                          : t('astro.sunAlertRad', { code: a.scaleCode })}
                      </Tag>
                    )}
                    <span className="astro-alert-item__time">
                      {a.issuedAt.replace('T', ' ')}
                    </span>
                    <span className="astro-alert-item__code">{a.productId}</span>
                  </div>
                  <div className="astro-alert-item__title">{a.title}</div>
                  {a.impacts && <div className="astro-alert-item__impacts">{a.impacts}</div>}
                </div>
              )
            })}
          </div>
        ) : (
          <Empty description={t('astro.sunAlertEmpty')} />
        )}
      </Panel>
              </div>
    </>
  )
}
