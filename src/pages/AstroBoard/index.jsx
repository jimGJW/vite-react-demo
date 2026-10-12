/**
 * 深空数据看板 —— 把国内外权威免费天文/航天数据源汇总到一个页面。
 *
 * 数据源（全部免密钥，经 vite-astro-proxy.mjs 服务端转发以绕开 CORS）：
 *   · ISS 实时位置      wheretheiss.at
 *   · 空间站轨道根数    Celestrak（ISS / 天宫三舱 / 神舟 / 天舟）
 *   · 空间天气          NOAA SWPC（Kp / 太阳风 / F10.7 / 黑子）
 *   · 系外行星          NASA Exoplanet Archive（TAP）
 *   · 行星轨道位置      JPL Standish 近似根数（本地计算，见 lib/astro/orbital.js）
 *
 * 定位分工要说清楚：
 *   ISS 有权威实时接口 → 用接口；天宫三舱没有任何公开实时接口 → 用 TLE + SGP4 自行推算。
 *   页面里两者都会标出数据来源，避免把「推算」误当「实测」。
 */

import { useMemo, useState } from 'react'
import { Button, Tooltip, Tabs, ConfigProvider, theme as antdTheme } from 'antd'
import {
  ReloadOutlined,
  RocketOutlined,
  MoonOutlined,
  BulbOutlined,
} from '@ant-design/icons'

import { useStarCatalog } from '../../lib/astro/useStarCatalog.js'
import { useVisibleConstellations } from '../../components/AstroBoard/skyHelpers.js'
import { equatorialToHorizontal } from '../../lib/astro/skyProjection.js'
import { useAstroData } from '../../lib/astro/useAstroData.js'
import {
  parseTLESet,
  propagateAt,
  groundTrack,
  lookElevation,
  subsolarPoint,
  planetPositions,
  kpLevel,
  f107Level,
  solarWindLevel,
  OBSERVERS,
  moonInfo,
  moonEquatorial,
  planetEquatorial,
  predictPasses,
  METEOR_SHOWERS,
  meteorShowerStatus,
  stargazingWindow,
} from '../../lib/astro/orbital.js'
import { useSearchParams } from 'react-router-dom'
import './index.scss'

import { useNow, useTheme, fmtUTC, Metric } from './components/ui.jsx'
import EarthTab from './components/EarthTab.jsx'
import SolarTab from './components/SolarTab.jsx'
import SunTab from './components/SunTab.jsx'
import SkyTab from './components/SkyTab.jsx'
import ApodTab from './components/ApodTab.jsx'
import DeepTab from './components/DeepTab.jsx'
// DictTab 已集中到 /timeline 的聚合名词库，本看板不再单独持有名词页签
import LaunchTab from './components/LaunchTab.jsx'
import CometTab from './components/CometTab.jsx'
import ApproachTab from './components/ApproachTab.jsx'
import ObserveTab from './components/ObserveTab.jsx'
import CaseTab from './components/CaseTab.jsx'
import RelatedData from '../../components/RelatedData/index.jsx'
import { TAB_KEYS } from '../../lib/boards/relations.js'
import { healthOf } from '../../lib/boards/health.js'

export default function AstroBoard({ lockedTab = null } = {}) {
  const { iss, stations, spaceWeather, exoplanets, neo, launches, solarActivity, aurora, solarCycle, apod, comet, approach, observe, reloadAll } = useAstroData()
  const [selected, setSelected] = useState('css-tianhe')
  const [galaxyView, setGalaxyView] = useState('结构')
  const [passCity, setPassCity] = useState('北京')
  const [theme, setTheme] = useTheme()

  /* 页签与 URL 同步：别处「关联数据」跳 ?tab=xxx 过来时要能直接落到目标页签，
     否则读完关联理由点进去却停在默认页，等于白跳。非法参数回落到默认页签。 */
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab = TAB_KEYS.astro.includes(tabParam) ? tabParam : 'earth'
  const onTabChange = (k) => setSearchParams({ tab: k }, { replace: true })

  /** 本看板实时健康度：给「关联数据」底部的三方监控条用 */
  const health = healthOf([
    iss, stations, spaceWeather, exoplanets, neo, launches, solarActivity, aurora, solarCycle, apod,
  ])
  // 星图状态
  const [skyCity, setSkyCity] = useState('北京')
  const [magLimit, setMagLimit] = useState(4.5)
  const [showLines, setShowLines] = useState(true)
  const [showDso, setShowDso] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const { catalog, error: catalogError } = useStarCatalog()

  // 当前时刻。刻意每秒走一次，让轨道标记平滑移动——
  // 轨道位置是时间的函数，不重算就等于把地图冻住。
  const now = useNow(1000)

  // 把 stations 的 TLE 解析成可传播对象
  const parsed = useMemo(() => {
    const list = stations.data?.stations
    if (!Array.isArray(list)) return []
    return list
      .map((s) => {
        try {
          const { satrec } = parseTLESet(s.name, s.line1, s.line2)
          return { ...s, satrec }
        } catch {
          return null
        }
      })
      .filter(Boolean)
  }, [stations.data])

  // 各目标当前位置（每次渲染按 now 重算，保证与时钟同步）
  const positions = useMemo(
    () =>
      parsed
        .map((p) => {
          const pos = propagateAt(p.satrec, now)
          return pos ? { ...p, ...pos } : null
        })
        .filter(Boolean),
    [parsed, now],
  )

  const active = useMemo(
    () => positions.find((p) => p.key === selected) || positions[0],
    [positions, selected],
  )

  const track = useMemo(
    () => (active ? groundTrack(active.satrec, now, 46, 46, 4) : []),
    [active, now],
  )

  const sun = useMemo(() => subsolarPoint(now), [now])
  const planets = useMemo(() => planetPositions(now), [now])
  // 月球信息：纯本地计算，每分钟更新一次足够（月相变化极慢）
  const moon = useMemo(() => moonInfo(now), [now])

  // 观测地标：谁能看到当前选中的目标
  const visibleTo = useMemo(() => {
    if (!active) return []
    return OBSERVERS.map((o) => ({
      ...o,
      elev: lookElevation(active, o.lat, o.lon),
    })).filter((o) => o.elev > 0).sort((a, b) => b.elev - a.elev)
  }, [active])

  // 卫星过境预报：对选中城市计算 ISS + 天和未来 6 小时可见过境
  // 每 30 秒重算一次（不需要每秒——过境时间以分钟为单位）
  const passCity30 = useMemo(() => {
    const t = Math.floor(now.getTime() / 30000)
    return { t, city: passCity }
  }, [now, passCity])
  const passes = useMemo(() => {
    const obs = OBSERVERS.find((o) => o.name === passCity30.city)
    if (!obs || !parsed.length) return []
    const baseTime = new Date(passCity30.t * 30000)
    return parsed
      .filter((p) => p.key === 'iss' || p.country === '中国')
      .map((p) => ({
        ...p,
        passes: predictPasses(p.satrec, obs.lat, obs.lon, baseTime, 6),
      }))
      .filter((p) => p.passes.length > 0)
  }, [parsed, passCity30])

  const sw = spaceWeather.data
  const kp = sw?.kp?.ok ? sw.kp.kp : null
  const kpInfo = kpLevel(kp)

  const Chinese = positions.filter((p) => p.country === '中国')
  const neoData = neo.data
  const launchData = launches.data

  /* ---- 星图：把太阳/月亮/行星从赤道坐标转到观测地的地平坐标 ---- */

  const skyObs = useMemo(
    () => OBSERVERS.find((o) => o.name === skyCity) || OBSERVERS[0],
    [skyCity],
  )
  // 观测地 + 当前时刻 → 天球的「转了多少」，星图每帧都依赖它
  const skyNow = useMemo(() => new Date(Math.floor(now.getTime() / 30000) * 30000), [now])

  /** 赤道坐标 → 地平坐标的小封装（行星数据是赤道坐标，星图要方位/高度） */
  const toHorizon = useMemo(
    () => (ra, dec) => equatorialToHorizontal(ra, dec, skyObs.lat, skyObs.lon, skyNow),
    [skyObs.lat, skyObs.lon, skyNow],
  )

  // 太阳：subsolarPoint 返回的是地理经纬度，等价于「太阳在天球上的位置」
  const sunHorizon = useMemo(
    () => (sun ? { ...toHorizon(sun.lat, sun.lon), lat: sun.lat, lon: sun.lon } : null),
    [sun, toHorizon],
  )

  // 月亮：赤道坐标（moonInfo 只管月相，这里补位置供星图用）
  const moonHorizon = useMemo(() => {
    if (!moon) return null
    const eq = moonEquatorial(skyNow)
    return { ...toHorizon(eq.ra, eq.dec), phaseName: moon.phaseName, phaseFraction: moon.phaseFraction, illumination: moon.illumination }
  }, [moon, toHorizon, skyNow])

  // 行星：黄道 → 赤道 → 地平（开普勒根数是黄道系，星表是赤道系）
  const planetHorizon = useMemo(
    () =>
      (planets || [])
        .filter((p) => p.key !== 'earth')
        .map((p) => {
          const eq = planetEquatorial(p)
          return {
            name: p.name,
            en: p.en,
            color: p.color,
            geoDist: p.geoDist,
            ...toHorizon(eq.ra, eq.dec),
          }
        }),
    [planets, toHorizon],
  )

  // 今晚已升起的星座（最高点高于 15°）
  const visibleConsts = useVisibleConstellations(catalog, skyObs.lat, skyObs.lon, skyNow, 15)

  /* ---- 今晚观星条件：观星窗口（本地采样太阳高度）+ 观星指数（月光/黑夜/地磁融合） ---- */

  const stargazing = useMemo(
    () => stargazingWindow(skyNow, skyObs.lat, skyObs.lon),
    [skyNow, skyObs.lat, skyObs.lon],
  )

  const stargazingScore = useMemo(() => {
    // ① 月光（权重 40%）：照亮度 0（新月）→ 满分，1（满月）→ 0 分
    const moonScore = moon ? (1 - moon.illumination) : 0.5
    // ② 黑夜时长（权重 35%）：天文黑夜 ≥ 9h 满分，0h 零分（高纬夏季极昼时确实为 0）
    const darkScore = Math.min(1, stargazing.darknessMin / 540)
    // ③ 地磁环境（权重 25%）：Kp 低 = 干扰少、大气稳定倾向好；但 Kp ≥ 5 意味着可能有极光（对高纬观测者反而是加分项，这里保守按"扰动"计）
    const kpForScore = kp ?? 0
    const geoScore = Math.max(0, 1 - kpForScore / 9)
    const total = Math.round((moonScore * 0.4 + darkScore * 0.35 + geoScore * 0.25) * 100)
    let grade, tone, advice
    if (total >= 80) { grade = '极佳'; tone = '#52c41a'; advice = '今晚条件非常好，抓紧观测或拍摄' }
    else if (total >= 60) { grade = '良好'; tone = '#a0d911'; advice = '条件不错，适合目视观测' }
    else if (total >= 40) { grade = '一般'; tone = '#faad14'; advice = '月光或扰动偏强，建议选择暗天体' }
    else if (total >= 20) { grade = '较差'; tone = '#fa8c16'; advice = '条件不利，观测效果会打折扣' }
    else { grade = '糟糕'; tone = '#ff4d4f'; advice = '月光/黑夜条件太差，改天再看吧' }
    return {
      total, grade, tone, advice,
      factors: [
        { name: '月光', score: Math.round(moonScore * 100), detail: moon ? `照亮度 ${(moon.illumination * 100).toFixed(0)}%（${moon.phaseName}）` : '—', weight: 40 },
        { name: '黑夜时长', score: Math.round(darkScore * 100), detail: `${(stargazing.darknessMin / 60).toFixed(1)} 小时天文黑夜`, weight: 35 },
        { name: '地磁环境', score: Math.round(geoScore * 100), detail: kp != null ? `Kp ${kp.toFixed(1)}（${kpInfo.label}）` : '数据缺失', weight: 25 },
      ],
    }
  }, [moon, stargazing, kp, kpInfo])

  // 流星雨年历：8 场年度流星雨 + 各自状态
  const nowHour = Math.floor(now.getTime() / 3600_000)
  const showers = useMemo(
    () => METEOR_SHOWERS.map((s) => ({ ...s, ...meteorShowerStatus(s, now) })),
    // now 每秒变，但状态以「天」为单位，取整到小时重算即可
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nowHour],
  )

  const apodData = apod.data?.ok ? apod.data : null

  // 太阳活动数据
  const solar = solarActivity.data
  const xr = solar?.xrays?.ok ? solar.xrays : null
  const proton = solar?.protons?.ok ? solar.protons : null
  const alertData = solar?.alerts?.ok ? solar.alerts : null
  const auroraData = aurora.data?.ok ? aurora.data : null
  const cycleData = solarCycle.data?.ok ? solarCycle.data : null
  const cometData = comet.data?.ok ? comet.data : null
  const approachData = approach.data?.ok ? approach.data : null
  const observeData = observe.data?.ok ? observe.data : null

  /* ---- antd 全局主题：跟 data-astro-theme 同源切换 ----
     之前 Tabs/Tag 靠 SCSS 逐个覆盖颜色，Select/Slider/Menu/Table 一多就罩不住。
     现在用 ConfigProvider 的 algorithm 切换 dark/light，颜色 token 与 CSS 变量
     保持同一套值（--a-panel/--a-line/--a-fg...），所有 antd 控件自动统一。 */
  const antdThemeCfg = useMemo(
    () => ({
      algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: theme === 'dark' ? '#4a9eff' : '#1668d6',
        borderRadius: 10,
        fontSize: 13,
        ...(theme === 'dark'
          ? {
              colorBgContainer: '#0d1428', // --a-panel
              colorBgElevated: '#111a33', // --a-panel-2
              colorBgLayout: '#060b18', // --a-bg
              colorBorder: '#1e2c4d', // --a-line
              colorBorderSecondary: '#1e2c4d',
              colorSplit: '#1e2c4d',
              colorText: '#e8eefc', // --a-fg
              colorTextHeading: '#ffffff', // --a-fg-strong
              colorTextDescription: '#8fa3c8', // --a-dim
            }
          : {}),
      },
    }),
    [theme],
  )

  return (
    <ConfigProvider theme={antdThemeCfg}>
    <div className="astro-board" data-astro-theme={theme}>
      {/* 顶部概览 */}
      <div className="astro-hero">
        <div className="astro-hero__main">
          <h1><RocketOutlined /> 深空数据看板</h1>
        </div>
        <div className="astro-hero__side">
          <div className="astro-clock">
            <span className="astro-clock__label">UTC</span>
            <span className="astro-clock__val">{fmtUTC(now)}</span>
          </div>
          <div className="astro-clock">
            <span className="astro-clock__label">北京</span>
            <span className="astro-clock__val">
              {fmtUTC(new Date(now.getTime() + 8 * 3600 * 1000))}
            </span>
          </div>
          <Tooltip title={theme === 'dark' ? '切换到白昼（浅色）' : '切换到深空（深色）'}>
            <Button
              icon={theme === 'dark' ? <BulbOutlined /> : <MoonOutlined />}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              size="small"
              className="astro-theme-btn"
            >
              {theme === 'dark' ? '白昼' : '深空'}
            </Button>
          </Tooltip>
          <Button icon={<ReloadOutlined />} onClick={reloadAll} loading={iss.loading} size="small">
            刷新
          </Button>
        </div>
      </div>

      {/* 关键指标条 */}
      <div className="astro-strip">
        <Metric label="在轨目标" value={positions.length} unit="个" />
        <Metric label="中国空间站舱段" value={Chinese.length} unit="个" />
        <Metric label="当前月相" value={moon.phaseName} tone="var(--a-track)" info="moonPhase" />
        <Metric
          label="月球照亮度"
          value={(moon.illumination * 100).toFixed(0)}
          unit="%"
          tone="var(--a-track)"
          info="moonPhase"
        />
        <Metric label="空间天气等级" value={kpInfo.level} tone={kpInfo.color} info="gscale" />
        <Metric
          label="太阳风速度"
          value={sw?.wind?.ok ? sw.wind.speedKmS : '—'}
          unit={sw?.wind?.ok ? 'km/s' : ''}
          tone={solarWindLevel(sw?.wind?.ok ? sw.wind.speedKmS : null).color}
          info="wind"
        />
        <Metric
          label="近地小行星(7天)"
          value={neoData?.count ?? '—'}
          unit={neoData?.count ? '颗' : ''}
          tone={neoData?.hazardous ? '#ff7a45' : 'var(--a-accent)'}
          info="hz"
        />
        <Metric
          label="已确认系外行星"
          value={exoplanets.data?.total ? exoplanets.data.total.toLocaleString() : '—'}
          unit={exoplanets.data?.total ? '颗' : ''}
        />
        <Metric
          label="太阳 F10.7 流量"
          value={sw?.f107?.ok ? sw.f107.flux : '—'}
          tone={f107Level(sw?.f107?.ok ? sw.f107.flux : null).color}
          info="f107"
        />
        <Metric
          label="待发射任务"
          value={launchData?.items?.length ?? '—'}
          unit={launchData?.items?.length ? '项' : ''}
          tone="var(--a-ok)"
        />
      </div>

      <Tabs
        className="astro-tabs"
        activeKey={lockedTab || activeTab}
        onChange={lockedTab ? () => {} : onTabChange}
        tabBarStyle={lockedTab ? { display: 'none' } : undefined}
        size="large"
        items={[
          { key: 'earth', label: '🌍 地球附近', children: <EarthTab iss={iss} stations={stations} selected={selected} setSelected={setSelected} positions={positions} active={active} track={track} sun={sun} moon={moon} visibleTo={visibleTo} passes={passes} passCity={passCity} setPassCity={setPassCity} /> },
          { key: 'solar', label: '🪐 太阳系', children: <SolarTab iss={iss} stations={stations} selected={selected} setSelected={setSelected} neo={neo} neoData={neoData} planets={planets} solar={solar} active={active} /> },
          { key: 'sun', label: '☀️ 太阳活动', children: <SunTab spaceWeather={spaceWeather} solarActivity={solarActivity} aurora={aurora} solarCycle={solarCycle} sw={sw} kp={kp} kpInfo={kpInfo} solar={solar} xr={xr} proton={proton} alertData={alertData} auroraData={auroraData} cycleData={cycleData} active={active} track={track} sun={sun} /> },
          { key: 'sky', label: '✨ 今晚星空', children: <SkyTab skyCity={skyCity} setSkyCity={setSkyCity} magLimit={magLimit} setMagLimit={setMagLimit} showLines={showLines} setShowLines={setShowLines} showDso={showDso} setShowDso={setShowDso} showLabels={showLabels} setShowLabels={setShowLabels} catalog={catalog} catalogError={catalogError} now={now} planets={planets} moon={moon} sun={sun} active={active} skyObs={skyObs} skyNow={skyNow} sunHorizon={sunHorizon} moonHorizon={moonHorizon} planetHorizon={planetHorizon} visibleConsts={visibleConsts} stargazing={stargazing} stargazingScore={stargazingScore} showers={showers} /> },
          { key: 'apod', label: '🖼 天文一图', children: <ApodTab apod={apod} apodData={apodData} /> },
          { key: 'deep', label: '🌌 深空', children: <DeepTab exoplanets={exoplanets} galaxyView={galaxyView} setGalaxyView={setGalaxyView} /> },
          { key: 'launch', label: '🚀 航天发射', children: <LaunchTab launches={launches} launchData={launchData} /> },
          { key: 'comet', label: '☄️ 小天体档案', children: <CometTab comet={comet} cometData={cometData} /> },
          { key: 'approach', label: '🛰 近地交会', children: <ApproachTab approach={approach} approachData={approachData} /> },
          { key: 'observe', label: '🔭 观测条件', children: <ObserveTab observe={observe} observeData={observeData} /> },
          { key: 'cases', label: '📚 真实案例', children: <CaseTab theme={theme} /> },
        ]}
      />

      {/* 关联数据：随当前激活页签变化，给出可以对照着读的其他模块（含跨看板） */}
      <RelatedData board="astro" tab={activeTab} theme={theme} health={health} />

      <footer className="astro-foot">
        全部数据来自公开免费接口（wheretheiss / Celestrak / NOAA SWPC / NASA NEO / NASA Exoplanet Archive / Launch Library 2），仅用于科普与可视化展示，不适用于导航或工程用途。
        空间站与卫星过境位置为 TLE + SGP4 推算值，与实测存在偏差；月相为本地天文算法计算。
      </footer>
    </div>
    </ConfigProvider>
  )
}
