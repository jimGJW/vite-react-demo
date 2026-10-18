/**
 * SkyTab —— 「✨ 今晚星空」标签页（自 AstroBoard 主壳拆出，原 index.jsx L1436-1658）。
 * 观星条件 / 全天星图 / 行星地平高度 / 流星雨 /梅西耶天体表。数据与回调经 props 传入。
 */
import { Button, Empty, Segmented, Slider, Spin, Tag } from 'antd'
import { BookOutlined, BulbOutlined, CompassOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useI18n } from '@i18n/index.js'
import { Panel, fmtLocal, pad } from './ui.jsx'
import { MessierTable, SkyBodyRow } from './SkyTools.jsx'
import { OBSERVERS } from '@lib/astro/orbital.js'
import SkyChart from '@components/AstroBoard/SkyChart.jsx'

export default function SkyTab({
  skyCity, setSkyCity, magLimit, setMagLimit, showLines, setShowLines, showDso, setShowDso, showLabels, setShowLabels, catalog, catalogError, moon, skyObs, skyNow, sunHorizon, moonHorizon, planetHorizon, visibleConsts, stargazing, stargazingScore,   showers,
}) {
  const { t } = useI18n()
  const GRADE = {
    excellent: t('astro.gradeExcellent'),
    good: t('astro.gradeGood'),
    fair: t('astro.gradeFair'),
    poor: t('astro.gradePoor'),
    bad: t('astro.gradeBad'),
  }
  const ADVICE = {
    excellent: t('astro.adviceExcellent'),
    good: t('astro.adviceGood'),
    fair: t('astro.adviceFair'),
    poor: t('astro.advicePoor'),
    bad: t('astro.adviceBad'),
  }
  const FACTOR = { moon: t('astro.factorMoon'), dark: t('astro.factorDark'), geo: t('astro.factorGeo') }
  return (
    <>
              <div className="astro-tab-content">
                {/* 今晚观星条件 */}
      <Panel
        title={t('astro.skyCondTitle')}
        source={t('astro.skyCondSource')}
        icon={<BulbOutlined />}
      >
        <div className="astro-stargaze">
          <div className="astro-stargaze__score">
            <div
              className="astro-stargaze__ring"
              style={{ '--score-color': stargazingScore.tone, '--sp': stargazingScore.total }}
            >
              <span className="astro-stargaze__num">{stargazingScore.total}</span>
              <span className="astro-stargaze__grade">{GRADE[stargazingScore.grade]}</span>
            </div>
            <div className="astro-stargaze__advice">{ADVICE[stargazingScore.adviceKey]}</div>
          </div>
          <div className="astro-stargaze__factors">
            {stargazingScore.factors.map((f) => (
              <div key={f.name} className="astro-stargaze__factor">
                <div className="astro-stargaze__factor-head">
                  <span>{FACTOR[f.name]} <em>{t('astro.weight', { n: f.weight })}</em></span>
                  <b>{f.score}</b>
                </div>
                <div className="astro-stargaze__factor-bar">
                  <i style={{ width: `${f.score}%`, background: f.score >= 60 ? '#52c41a' : f.score >= 40 ? '#faad14' : '#ff4d4f' }} />
                </div>
                <div className="astro-stargaze__factor-detail">{f.detail}</div>
              </div>
            ))}
          </div>
          <div className="astro-stargaze__window">
            <div className="astro-stargaze__window-item">
              <span>{t('astro.skySunset')}</span>
              <b>{fmtLocal(stargazing.sunset)}</b>
            </div>
            <div className="astro-stargaze__window-item">
              <span>{t('astro.skyAstroEnd')}</span>
              <b>{fmtLocal(stargazing.astroStart)}</b>
            </div>
            <div className="astro-stargaze__window-item is-now">
              <span>{t('astro.skySunAltNow')}</span>
              <b>{stargazing.nowAlt.toFixed(1)}°</b>
            </div>
            <div className="astro-stargaze__window-item">
              <span>{t('astro.skyAstroDawn')}</span>
              <b>{fmtLocal(stargazing.astroEnd)}</b>
            </div>
            <div className="astro-stargaze__window-item">
              <span>{t('astro.skySunrise')}</span>
              <b>{fmtLocal(stargazing.sunrise)}</b>
            </div>
            <div className="astro-stargaze__window-item is-best">
              <span>{t('astro.skyBestWindow')}</span>
              <b>{t('astro.hours', { n: (stargazing.darknessMin / 60).toFixed(1) })}</b>
            </div>
          </div>
        </div>
      </Panel>

      {/* 全天星图 */}
      <Panel
        title={t('astro.skyChartTitle')}
        source={t('astro.skyChartSource')}
        icon={<CompassOutlined />}
        extra={
          <div className="astro-sky-tools">
            <Segmented
              size="small"
              value={skyCity}
              onChange={setSkyCity}
              options={OBSERVERS.map((o) => o.name)}
            />
            <Button
              size="small"
              type={showLines ? 'primary' : 'default'}
              onClick={() => setShowLines((v) => !v)}
            >
              {t('astro.skyBtnLines')}
            </Button>
            <Button
              size="small"
              type={showDso ? 'primary' : 'default'}
              onClick={() => setShowDso((v) => !v)}
            >
              {t('astro.skyBtnDso')}
            </Button>
            <Button
              size="small"
              type={showLabels ? 'primary' : 'default'}
              onClick={() => setShowLabels((v) => !v)}
            >
              {t('astro.skyBtnLabels')}
            </Button>
          </div>
        }
      >
        {catalogError ? (
          <Empty description={t('astro.skyCatalogError', { msg: catalogError })} />
        ) : !catalog ? (
          <div className="astro-sky-loading"><Spin /> {t('astro.skyLoading')}</div>
        ) : (
          <div className="astro-sky-layout">
            <div className="astro-sky-main">
              <SkyChart
                catalog={catalog}
                now={skyNow}
                lat={skyObs.lat}
                lon={skyObs.lon}
                sun={sunHorizon}
                moon={moonHorizon}
                planets={planetHorizon}
                magLimit={magLimit}
                showLines={showLines}
                showDso={showDso}
                showLabels={showLabels}
                size={560}
              />
              <div className="astro-sky-ctrl">
                <span className="astro-sky-ctrl__label">
                  {t('astro.magLimit')} <b>{magLimit.toFixed(1)}</b>
                </span>
                <Slider
                  className="astro-sky-ctrl__slider"
                  min={1}
                  max={6}
                  step={0.5}
                  value={magLimit}
                  onChange={setMagLimit}
                  tooltip={{ formatter: (v) => t('astro.magUnit', { n: v?.toFixed(1) }) }}
                />
                <span className="astro-sky-ctrl__hint">
                  {t('astro.skyStarHint', {
                    total: catalog.meta.counts.stars,
                    drawn: Math.min(catalog.meta.counts.stars, Math.round((catalog.meta.counts.stars * (6 - magLimit)) / 7.4)),
                  })}
                </span>
              </div>
            </div>
            <div className="astro-sky-side">
              <div className="astro-sky-info">
                <div className="astro-sky-info__title">{t('astro.skyObsTitle')}</div>
                <div className="astro-sky-info__row">
                  <span>{t('astro.skyCityLabel')}</span>
                  <strong>{skyObs.name}</strong>
                </div>
                <div className="astro-sky-info__row">
                  <span>{t('astro.skyLatLon')}</span>
                  <strong>{skyObs.lat.toFixed(2)}°, {skyObs.lon.toFixed(2)}°</strong>
                </div>
                <div className="astro-sky-info__title">{t('astro.skyVisibleConst')}</div>
                <div className="astro-sky-consts">
                  {visibleConsts.length ? (
                    visibleConsts.slice(0, 24).map((c) => (
                      <span key={c.abbr} className="astro-sky-const" title={t('astro.skyMaxAlt', { n: c.maxAlt.toFixed(0) })}>
                        {c.zh || c.en}
                        <i>{c.maxAlt.toFixed(0)}°</i>
                      </span>
                    ))
                  ) : (
                    <span className="astro-sky-consts__empty">{t('astro.skyNoConst')}</span>
                  )}
                </div>
                <div className="astro-sky-info__title">{t('astro.skyBodyPos')}</div>
                <div className="astro-sky-bodies">
                  <SkyBodyRow name={t('astro.bodySun')} h={sunHorizon} />
                  <SkyBodyRow name={t('astro.bodyMoon')} h={moonHorizon} extra={moon?.phaseName} />
                  {planetHorizon.map((p) => (
                    <SkyBodyRow key={p.name} name={p.name} h={p} color={p.color} extra={`${p.geoDist.toFixed(2)} AU`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Panel>

      {/* 深空天体目录 */}
      <Panel
        title={t('astro.skyMessierTitle')}
        source={t('astro.skyMessierSource')}
        icon={<BookOutlined />}
      >
        {catalog ? <MessierTable catalog={catalog} lat={skyObs.lat} lon={skyObs.lon} now={skyNow} /> : <Spin />}
      </Panel>

      {/* 流星雨年历 */}
      <Panel
        title={t('astro.skyMeteorTitle')}
        source={t('astro.skyMeteorSource')}
        icon={<ThunderboltOutlined />}
      >
        <div className="astro-meteors">
          {showers.map((s) => (
            <div key={s.key} className={`astro-meteor${s.status === 'active' ? ' is-active' : ''}`}>
              <div className="astro-meteor__head">
                <b>{s.zh}</b>
                {s.status === 'active' ? (
                  <Tag color="green" className="astro-meteor__tag">{t('astro.skyMeteorActive')}</Tag>
                ) : s.status === 'upcoming' ? (
                  <Tag color="blue" className="astro-meteor__tag">{t('astro.skyMeteorDaysPeak', { n: Math.max(0, s.daysToPeak) })}</Tag>
                ) : (
                  <Tag className="astro-meteor__tag">{t('astro.skyMeteorPast')}</Tag>
                )}
              </div>
              <div className="astro-meteor__row">
                峰值 <b>{pad(s.peakDate.getUTCMonth() + 1)}-{pad(s.peakDate.getUTCDate())}</b>
                <span className="astro-meteor__sep">·</span>ZHR <b className={s.zhr >= 100 ? 'is-strong' : ''}>{s.zhr}</b>
                {s.strong && <Tag color="gold" className="astro-meteor__tag">{t('astro.skyMeteorBig3')}</Tag>}
              </div>
              <div className="astro-meteor__bar" title={t('astro.skyMeteorZhrTitle', { n: s.zhr })}>
                <i style={{ width: `${Math.min(100, (s.zhr / 150) * 100)}%` }} />
              </div>
              <div className="astro-meteor__row is-dim">{t('astro.skyMeteorRadiant', { name: s.radiant })}</div>
              <div className="astro-meteor__row is-dim">{t('astro.skyMeteorParent', { name: s.parent })}</div>
              <div className="astro-meteor__moon" style={{ color: s.moonTone }}>
                {t('astro.skyMeteorMoon', { label: s.moonLabel, pct: (s.moonInterference * 100).toFixed(0) })}
              </div>
            </div>
          ))}
        </div>
      </Panel>
              </div>
    </>
  )
}
