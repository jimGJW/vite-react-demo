/**
 * SkyTab —— 「✨ 今晚星空」标签页（自 AstroBoard 主壳拆出，原 index.jsx L1436-1658）。
 * 观星条件 / 全天星图 / 行星地平高度 / 流星雨 /梅西耶天体表。数据与回调经 props 传入。
 */
import { Button, Empty, Segmented, Slider, Spin, Tag } from 'antd'
import { BookOutlined, BulbOutlined, CompassOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Panel, fmtLocal, pad } from './ui.jsx'
import { MessierTable, SkyBodyRow } from './SkyTools.jsx'
import { OBSERVERS } from '../../../lib/astro/orbital.js'
import SkyChart from '../../../components/AstroBoard/SkyChart.jsx'

export default function SkyTab({
  skyCity, setSkyCity, magLimit, setMagLimit, showLines, setShowLines, showDso, setShowDso, showLabels, setShowLabels, catalog, catalogError, now, planets, moon, sun, active, skyObs, skyNow, sunHorizon, moonHorizon, planetHorizon, visibleConsts, stargazing, stargazingScore, showers,
}) {
  return (
    <>
              <div className="astro-tab-content">
                {/* 今晚观星条件 */}
      <Panel
        title="今晚观星条件"
        source="太阳高度由日下点几何本地采样（−18° 为天文黑夜边界，IAU 定义）；观星指数 = 月光 40% + 黑夜时长 35% + 地磁 25%"
        icon={<BulbOutlined />}
      >
        <div className="astro-stargaze">
          <div className="astro-stargaze__score">
            <div
              className="astro-stargaze__ring"
              style={{ '--score-color': stargazingScore.tone, '--sp': stargazingScore.total }}
            >
              <span className="astro-stargaze__num">{stargazingScore.total}</span>
              <span className="astro-stargaze__grade">{stargazingScore.grade}</span>
            </div>
            <div className="astro-stargaze__advice">{stargazingScore.advice}</div>
          </div>
          <div className="astro-stargaze__factors">
            {stargazingScore.factors.map((f) => (
              <div key={f.name} className="astro-stargaze__factor">
                <div className="astro-stargaze__factor-head">
                  <span>{f.name} <em>权重 {f.weight}%</em></span>
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
              <span>日落</span>
              <b>{fmtLocal(stargazing.sunset)}</b>
            </div>
            <div className="astro-stargaze__window-item">
              <span>天文昏影终</span>
              <b>{fmtLocal(stargazing.astroStart)}</b>
            </div>
            <div className="astro-stargaze__window-item is-now">
              <span>当前太阳高度</span>
              <b>{stargazing.nowAlt.toFixed(1)}°</b>
            </div>
            <div className="astro-stargaze__window-item">
              <span>晨光始</span>
              <b>{fmtLocal(stargazing.astroEnd)}</b>
            </div>
            <div className="astro-stargaze__window-item">
              <span>日出</span>
              <b>{fmtLocal(stargazing.sunrise)}</b>
            </div>
            <div className="astro-stargaze__window-item is-best">
              <span>最佳观测窗口</span>
              <b>{(stargazing.darknessMin / 60).toFixed(1)} 小时</b>
            </div>
          </div>
        </div>
      </Panel>

      {/* 全天星图 */}
      <Panel
        title="全天星图（地平投影 · 真实星表）"
        source="星表 d3-celestial（HYG/Hipparcos，5044 颗 6 等以内亮星 + 89 星座连线 + 110 个梅西耶天体），位置由本地天文算法实时算出"
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
              星座连线
            </Button>
            <Button
              size="small"
              type={showDso ? 'primary' : 'default'}
              onClick={() => setShowDso((v) => !v)}
            >
              深空天体
            </Button>
            <Button
              size="small"
              type={showLabels ? 'primary' : 'default'}
              onClick={() => setShowLabels((v) => !v)}
            >
              标注
            </Button>
          </div>
        }
      >
        {catalogError ? (
          <Empty description={`星表加载失败：${catalogError}`} />
        ) : !catalog ? (
          <div className="astro-sky-loading"><Spin /> 正在加载星表…</div>
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
                  星等上限 <b>{magLimit.toFixed(1)}</b>
                </span>
                <Slider
                  className="astro-sky-ctrl__slider"
                  min={1}
                  max={6}
                  step={0.5}
                  value={magLimit}
                  onChange={setMagLimit}
                  tooltip={{ formatter: (v) => `${v?.toFixed(1)} 等` }}
                />
                <span className="astro-sky-ctrl__hint">
                  共 {catalog.meta.counts.stars} 颗亮星，当前绘制 {Math.min(catalog.meta.counts.stars, Math.round((catalog.meta.counts.stars * (6 - magLimit)) / 7.4))} 颗
                </span>
              </div>
            </div>
            <div className="astro-sky-side">
              <div className="astro-sky-info">
                <div className="astro-sky-info__title">观测地</div>
                <div className="astro-sky-info__row">
                  <span>城市</span>
                  <strong>{skyObs.name}</strong>
                </div>
                <div className="astro-sky-info__row">
                  <span>经纬度</span>
                  <strong>{skyObs.lat.toFixed(2)}°, {skyObs.lon.toFixed(2)}°</strong>
                </div>
                <div className="astro-sky-info__title">今夜可见星座</div>
                <div className="astro-sky-consts">
                  {visibleConsts.length ? (
                    visibleConsts.slice(0, 24).map((c) => (
                      <span key={c.abbr} className="astro-sky-const" title={`最高高度 ${c.maxAlt.toFixed(0)}°`}>
                        {c.zh || c.en}
                        <i>{c.maxAlt.toFixed(0)}°</i>
                      </span>
                    ))
                  ) : (
                    <span className="astro-sky-consts__empty">当前无高度 &gt; 15° 的星座</span>
                  )}
                </div>
                <div className="astro-sky-info__title">太阳系天体方位</div>
                <div className="astro-sky-bodies">
                  <SkyBodyRow name="太阳" h={sunHorizon} />
                  <SkyBodyRow name="月亮" h={moonHorizon} extra={moon?.phaseName} />
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
        title="梅西耶天体目录（今晚可见部分）"
        source="梅西耶星表（Charles Messier，1764–1781），110 个天体"
        icon={<BookOutlined />}
      >
        {catalog ? <MessierTable catalog={catalog} lat={skyObs.lat} lon={skyObs.lon} now={skyNow} /> : <Spin />}
      </Panel>

      {/* 流星雨年历 */}
      <Panel
        title="流星雨年历（年度八大）"
        source="IMO 国际流星组织年历通用参数（本地数据）；月光干扰按峰值当晚月相照亮度本地计算"
        icon={<ThunderboltOutlined />}
      >
        <div className="astro-meteors">
          {showers.map((s) => (
            <div key={s.key} className={`astro-meteor${s.status === 'active' ? ' is-active' : ''}`}>
              <div className="astro-meteor__head">
                <b>{s.zh}</b>
                {s.status === 'active' ? (
                  <Tag color="green" className="astro-meteor__tag">活跃中</Tag>
                ) : s.status === 'upcoming' ? (
                  <Tag color="blue" className="astro-meteor__tag">{Math.max(0, s.daysToPeak)} 天后峰值</Tag>
                ) : (
                  <Tag className="astro-meteor__tag">已过峰值</Tag>
                )}
              </div>
              <div className="astro-meteor__row">
                峰值 <b>{pad(s.peakDate.getUTCMonth() + 1)}-{pad(s.peakDate.getUTCDate())}</b>
                <span className="astro-meteor__sep">·</span>ZHR <b className={s.zhr >= 100 ? 'is-strong' : ''}>{s.zhr}</b>
                {s.strong && <Tag color="gold" className="astro-meteor__tag">三大流星雨</Tag>}
              </div>
              <div className="astro-meteor__bar" title={`ZHR ${s.zhr}（理想条件天顶小时率）`}>
                <i style={{ width: `${Math.min(100, (s.zhr / 150) * 100)}%` }} />
              </div>
              <div className="astro-meteor__row is-dim">辐射点：{s.radiant}</div>
              <div className="astro-meteor__row is-dim">母体：{s.parent}</div>
              <div className="astro-meteor__moon" style={{ color: s.moonTone }}>
                峰值月光：{s.moonLabel}（照亮 {(s.moonInterference * 100).toFixed(0)}%）
              </div>
            </div>
          ))}
        </div>
      </Panel>
              </div>
    </>
  )
}
