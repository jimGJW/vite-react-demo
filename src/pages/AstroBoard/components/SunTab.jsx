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

export default function SunTab({
  spaceWeather, solarActivity, aurora, solarCycle, sw, kp, kpInfo, solar, xr, proton, alertData, auroraData, cycleData, active, track, sun,
}) {
  return (
    <>
              <div className="astro-tab-content">
                {/* 空间天气 */}
      <Panel
        title="太阳与空间天气"
        source="NOAA SWPC（美国海洋和大气管理局空间天气预报中心）"
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
                <span className="astro-kp__unit">Kp 指数</span>
              </div>
              <div className="astro-kp__info">
                <Tag bordered={false} style={{ background: kpInfo.color, color: '#fff' }}>
                  {kpInfo.level}
                </Tag>
                <strong>{kpInfo.label}</strong>
                <p>{kpInfo.desc}</p>
                <div className="astro-kp__glossary">
                  <Tooltip title={<KpiCard kpiKey="kp" />}>
                    <Tag bordered={false} className="astro-gloss-tag">Kp 是什么</Tag>
                  </Tooltip>
                  <Tooltip title={<KpiCard kpiKey="gscale" />}>
                    <Tag bordered={false} className="astro-gloss-tag">G0–G5 分级</Tag>
                  </Tooltip>
                </div>
                {sw?.kp?.time && <span className="astro-sw-time">观测时间 {sw.kp.time.replace('T', ' ')} UTC</span>}
              </div>
            </div>

            {/* Kp 24 小时走势 */}
            {sw?.kp?.ok && sw.kp.history?.length > 2 && (
              <div className="astro-chart">
                <div className="astro-chart__title">
                  Kp 指数近 24 小时
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
              <div className="astro-chart__title">G 级对照表（NOAA 标准）</div>
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
                太阳风速度
                <KpiHint kpiKey="wind" />
              </span>
              <strong style={{ color: solarWindLevel(sw?.wind?.ok ? sw.wind.speedKmS : null).color }}>
                {sw?.wind?.ok ? `${sw.wind.speedKmS} km/s` : '—'}
              </strong>
            </div>
            <div className="astro-sw-row">
              <span>
                行星际磁场 Bz
                <KpiHint kpiKey="bz" />
              </span>
              <strong style={{ color: (sw?.mag?.ok && sw.mag.bz < 0) ? 'var(--a-danger)' : undefined }}>
                {sw?.mag?.ok ? `${sw.mag.bz} nT` : '—'}
              </strong>
            </div>
            <div className="astro-sw-row">
              <span>
                行星际磁场 Bt
                <KpiHint kpiKey="bt" />
              </span>
              <strong>{sw?.mag?.ok ? `${sw.mag.bt} nT` : '—'}</strong>
            </div>
            <div className="astro-sw-row">
              <span>
                F10.7 太阳射电流量
                <KpiHint kpiKey="f107" />
              </span>
              <strong style={{ color: f107Level(sw?.f107?.ok ? sw.f107.flux : null).color }}>
                {sw?.f107?.ok ? `${sw.f107.flux}` : '—'}
              </strong>
            </div>
            <div className="astro-sw-row">
              <span>90 天平均</span>
              <strong>{sw?.f107?.ok ? `${sw.f107.mean90 ?? '—'}` : '—'}</strong>
            </div>
            <div className="astro-sw-row">
              <span>
                太阳黑子数（月均）
                <KpiHint kpiKey="sunspot" />
              </span>
              <strong>{sw?.sunspot?.ok ? sw.sunspot.ss : '—'}</strong>
            </div>
            <div className="astro-sw-note">
              <b>Bz 为负值</b>时太阳风更易引发地磁暴，此时 GPS 与电网风险上升。
              判定链条是：<b>Bz 转负 + 太阳风提速</b> → 磁层被压缩 → 能量灌入 →
              Kp 抬升 → G 级告警。
            </div>
          </div>
        </div>
      </Panel>

      {/* 太阳耀斑 */}
      <Panel
        title="太阳耀斑监测（GOES X 射线）"
        source="NOAA SWPC GOES 1 分钟长波段（0.05–0.4nm）X 射线流量，耀斑事件由本地算法识别"
        icon={<ThunderboltOutlined />}
        loading={solarActivity.loading}
        error={solarActivity.error || solar?.xrays?.error}
      >
        {!xr ? (
          <Empty description="X 射线数据暂不可用" />
        ) : (
          <>
            <div className="astro-flare-kpis">
              <div className="astro-flare-kpi">
                <span>当前等级</span>
                <strong style={{ color: FLARE_TONE[xr.currentClass.letter] }}>
                  {zhFlareClass(xr.currentClass.letter).zh}
                  <KpiHint kpiKey="flare" />
                </strong>
                <em>{xr.currentFlux.toExponential(2)} W/m²</em>
              </div>
              <div className="astro-flare-kpi">
                <span>24h 峰值</span>
                <strong style={{ color: FLARE_TONE[xr.peakClass.letter] }}>
                  {zhFlareClass(xr.peakClass.letter).zh}
                </strong>
                <em>{new Date(xr.peakTime).toLocaleString('zh-CN', { hour12: false })}</em>
              </div>
              <div className="astro-flare-kpi">
                <span>24h 耀斑次数</span>
                <strong>{xr.total24h}</strong>
                <em>
                  {Object.entries(xr.byClass)
                    .map(([k, v]) => `${k}${v}`)
                    .join(' · ') || '无'}
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
                  const t = zhFlareClass(e.cls)
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
                      <span className="astro-flare-item__dur">{e.durationMin} 分钟</span>
                      <TermTip zh={t.zh} en={t.en} desc={t.desc}>
                        <span className="astro-flare-item__desc">{t.desc.slice(0, 26)}…</span>
                      </TermTip>
                    </div>
                  )
                })
              ) : (
                <Empty description="过去 24 小时无 B 级及以上耀斑（太阳很安静）" />
              )}
            </div>
          </>
        )}
      </Panel>

      {/* 太阳质子事件 */}
      <Panel
        title="太阳质子事件（>10 MeV）"
        source="NOAA SWPC GOES 积分质子通量，多星同源数据已按时间戳取最大值合并"
        icon={<AlertOutlined />}
        loading={solarActivity.loading}
      >
        {!proton ? (
          <Empty description="质子数据暂不可用" />
        ) : (
          <>
            <div className="astro-proton-row">
              <div className="astro-proton-stat">
                <span>当前通量</span>
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
                <span>24h 峰值</span>
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
        title="极光椭圆与我国可见性"
        source="NOAA SWPC OVATION 极光模型反演（多颗卫星融合观测）"
        icon={<CompassOutlined />}
        loading={aurora.loading}
        error={aurora.error}
      >
        {!auroraData ? (
          <Empty description="极光数据暂不可用" />
        ) : (
          <>
            <div className="astro-aurora-head">
              <div className="astro-aurora-band">
                <span className="astro-aurora-band__label">极光带纬度范围</span>
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
                    {c.visible ? '可见极光' : '不可见'}
                  </Tag>
                </div>
              ))}
            </div>
            <div className="astro-sw-note">
              判据是地理纬度与极光带南界（<b>{auroraData.southEdge}°</b>）比较。
              漠河位于 {auroraData.southEdge}° 以北，活动期有机会看到；
              北京（40°N）低于此纬度，需 G4 以上强地磁暴才可能南扩到。
            </div>
          </>
        )}
      </Panel>

      {/* 太阳活动周期 */}
      <Panel
        title="太阳活动周期（第 25 周期）"
        source="NOAA SWPC 观测实况 + 官方预测区间（含 25%/75% 置信界）"
        icon={<ThunderboltOutlined />}
        loading={solarCycle.loading}
        error={solarCycle.error}
      >
        {!cycleData ? (
          <Empty description="太阳周期数据暂不可用" />
        ) : (
          <>
            <div className="astro-cycle-kpis">
              <div className="astro-cycle-kpi">
                <span>最新实测月</span>
                <strong>{cycleData.current.month}</strong>
                <em>黑子数 {cycleData.current.ss}</em>
              </div>
              <div className="astro-cycle-kpi">
                <span>平滑黑子数</span>
                <strong>{cycleData.current.smoothed ?? '—'}</strong>
                <em>{cycleData.current.smoothedMonth || ''}（13 个月滑动平均）</em>
                <KpiHint kpiKey="solarCycle" />
              </div>
              <div className="astro-cycle-kpi">
                <span>本周期已观测峰值</span>
                <strong>{cycleData.historicalPeak.smoothed}</strong>
                <em>{cycleData.historicalPeak.month}</em>
              </div>
            </div>
            <SolarCycleChart data={cycleData} />
            <div className="astro-sw-note">
              太阳活动有约 11 年周期。当前第 25 周期自 2019 年末开始，
              已观测平滑峰值 <b>{cycleData.historicalPeak.smoothed}</b>（{cycleData.historicalPeak.month}）。
              曲线上的带状区域是 NOAA 官方预测区间，越窄表示预测越有把握。
            </div>
          </>
        )}
      </Panel>

      {/* 空间天气警报 */}
      <Panel
        title="官方空间天气警报（近 72 小时）"
        source="NOAA SWPC alerts 产品，文本已解析为级别/强度/影响"
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
                          ? `地磁 ${a.scaleCode} 级`
                          : `辐射 ${a.scaleCode} 级`}
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
          <Empty description="近 72 小时无空间天气警报（平静期）" />
        )}
      </Panel>
              </div>
    </>
  )
}
