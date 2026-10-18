/**
 * 海洋数据看板（/ocean）—— 「天上 / 地下 / 海洋」三兄弟的最后一块。
 *
 * 数据（全部免密钥，经 vite-ocean-proxy.mjs 服务端转发，写码前均已 curl 实测）：
 *   · Open-Meteo Marine  近海 5 点浪高/浪向/周期/海表温度 + 未来 24h 浪高预报
 *   · Open-Meteo Marine  涌浪与风浪分量（swell / wind wave），二者叠加成实际海面
 *   · Open-Meteo Marine  全球 10 大海域浪况速览（远海大势，UTC）
 *   · NOAA CO-OPS        旧金山站过去 24h 实测潮位（6 分钟采样）与站点气温
 *   · NOAA CO-OPS        未来 48h 高潮/低潮预报（interval=hilo）
 *   · NOAA CPC           ONI 厄尔尼诺指数（Niño 3.4 区 3 月滑动海温距平）
 *   · NOAA NDBC          全球浮标与岸站实时观测（风/浪/水温/气压，UTC）
 *   · NOAA NHC           活跃热带气旋（大西洋 / 东太平洋）
 *   · NOAA PSL           PDO 太平洋十年涛动 + AMO 大西洋多年代际振荡
 *   · NOAA NCEI          全球海洋温度距平年际序列（基准 1901–2000）
 *
 * 本文件只做「壳」：主题切换 + 时钟 + KPI 指标条 + Tab 编排；
 * 各 Tab 的内容拆在 ./components/ 下的小组件里（ui.jsx 为共用 Panel/Metric/小工具）。
 * 注：NDBC 浮标源在本网络环境被墙（HTTP 000），故浮标实测改用 CO-OPS 潮位站数据。
 */

import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, Tabs, Tooltip, ConfigProvider, theme as antdTheme } from 'antd'
import { ReloadOutlined, CompassOutlined, BulbOutlined, MoonOutlined } from '@ant-design/icons'
import { useI18n } from '@i18n/index.js'
import { useOceanData } from '@lib/ocean/useOceanData.js'
import { Metric, readTheme, THEME_KEY, fmtSiteTime, waveLevel } from './components/ui.jsx'
import WavesTab from './components/WavesTab.jsx'
import TideTab from './components/TideTab.jsx'
import OniTab from './components/OniTab.jsx'
import CycloneTab from './components/CycloneTab.jsx'
import BuoysTab from './components/BuoysTab.jsx'
// DictTab 已集中到 /timeline 聚合名词库（名词解析统一入口），本看板不再单独持有名词页签
import MarineTab from './components/MarineTab.jsx'
import CoastTab from './components/CoastTab.jsx'
import SeaTempTab from './components/SeaTempTab.jsx'
import CaseTab from './components/CaseTab.jsx'
import Clock from '@components/Clock.jsx'
import RelatedData from '@components/RelatedData/index.jsx'
import { TAB_KEYS } from '@lib/boards/relations.js'
import { healthOf } from '@lib/boards/health.js'
import './index.scss'

export default function OceanBoard({ lockedTab = null } = {}) {
  const {
    waves, tides, tidePred, globalWaves, oni, cyclones, oscillations, ssta, stationWeather, buoys, marine, reloadAll,
  } = useOceanData()
  const { t } = useI18n()
  const [theme, setTheme] = useState(readTheme)

  /* 页签与 URL 同步：别处「关联数据」跳 ?tab=xxx 过来时要能直接落到目标页签，
     否则读完关联理由点进去却停在默认页，等于白跳。非法参数回落到默认页签。 */
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab = TAB_KEYS.ocean.includes(tabParam) ? tabParam : 'waves'
  const onTabChange = (k) => setSearchParams({ tab: k }, { replace: true })

  /** 本看板实时健康度：给「关联数据」底部的三方监控条用 */
  const health = healthOf([
    waves, tides, tidePred, globalWaves, oni, cyclones, oscillations, ssta, stationWeather, buoys,
  ])

  const waveData = waves.data?.ok ? waves.data : null
  const tideData = tides.data?.ok ? tides.data : null
  const predData = tidePred.data?.ok ? tidePred.data : null
  const globalWavesData = globalWaves.data?.ok ? globalWaves.data : null
  const oniData = oni.data?.ok ? oni.data : null
  const cycData = cyclones.data?.ok ? cyclones.data : null
  const oscData = oscillations.data?.ok ? oscillations.data : null
  const sstaData = ssta.data?.ok ? ssta.data : null
  const wxData = stationWeather.data?.ok ? stationWeather.data : null
  const buoyData = buoys.data?.ok ? buoys.data : null
  const marineData = marine.data?.ok ? marine.data : null

  // 派生：下次高潮 / 低潮（站点时间轴上「现在」= 最新实测采样时刻，字符串比较即时序比较）
  const nextTides = useMemo(() => {
    if (!predData?.events?.length || !tideData?.latest?.t) return null
    const cur = tideData.latest.t
    const nextH = predData.events.find((e) => e.type === 'H' && e.t > cur)
    const nextL = predData.events.find((e) => e.type === 'L' && e.t > cur)
    const until = (t) =>
      t ? Number(((Date.parse(t) - Date.parse(cur)) / 3600_000).toFixed(1)) : null
    return { nextH, nextL, untilH: until(nextH?.t), untilL: until(nextL?.t) }
  }, [predData, tideData])

  /** antd 主题：默认白昼算法，夜航切 darkAlgorithm 并注入深色 token */
  const antdThemeCfg = useMemo(
    () => ({
      algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: theme === 'dark' ? '#38bdf8' : '#0284c7',
        borderRadius: 10,
        fontSize: 13,
        ...(theme === 'dark'
          ? {
              colorBgContainer: '#0d1a26', // --o-panel
              colorBgElevated: '#122335', // --o-panel-2
              colorBgLayout: '#081018', // --o-bg
              colorBorder: '#1d3346', // --o-line
              colorBorderSecondary: '#1d3346',
              colorSplit: '#1d3346',
              colorText: '#e0effa', // --o-fg
              colorTextHeading: '#ffffff',
              colorTextDescription: '#7f9cb5', // --o-dim
            }
          : {}),
      },
    }),
    [theme],
  )

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try { localStorage.setItem(THEME_KEY, next) } catch { /* ignore */ }
  }

  return (
    <ConfigProvider theme={antdThemeCfg}>
      <div className="o-board" data-ocean-theme={theme}>
        {/* 顶部概览 */}
        <div className="o-hero">
          <div className="o-hero__main">
            <h1><CompassOutlined /> {t('ocean.hero.title')}</h1>
            <p className="o-hero__sub">
              {t('ocean.hero.subPre')}
              <Link to="/astro">{t('ocean.hero.linkAstro')}</Link>
              {t('ocean.hero.subMid')}
              <Link to="/geo">{t('ocean.hero.linkGeo')}</Link>
              {t('ocean.hero.subPost')}
            </p>
          </div>
          <div className="o-hero__side">
            <Clock prefix="o" />
            <Tooltip title={theme === 'dark' ? t('ocean.theme.toDay') : t('ocean.theme.toNight')}>
              <Button
                icon={theme === 'dark' ? <BulbOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                size="small"
                className="o-theme-btn"
              >
                {theme === 'dark' ? t('ocean.theme.day') : t('ocean.theme.night')}
              </Button>
            </Tooltip>
            <Button icon={<ReloadOutlined />} onClick={reloadAll} loading={waves.loading} size="small">
              {t('ocean.refresh')}
            </Button>
          </div>
        </div>

        {/* 关键指标条 */}
        <div className="o-strip">
          <Metric
            label={t('ocean.metric.maxWave.label')}
            value={waveData?.maxWave != null ? waveData.maxWave.toFixed(2) : '—'}
            unit={waveData?.maxWave != null ? 'm' : ''}
            tone="var(--o-accent)"
            info={t('ocean.metric.maxWave.info')}
          />
          <Metric
            label={t('ocean.metric.avgSst.label')}
            value={waveData?.avgSst != null ? waveData.avgSst.toFixed(1) : '—'}
            unit={waveData?.avgSst != null ? '°C' : ''}
            tone="#0d9488"
            info={t('ocean.metric.avgSst.info')}
          />
          <Metric
            label={t('ocean.metric.tideNow.label')}
            value={tideData?.latest?.v != null ? tideData.latest.v.toFixed(2) : '—'}
            unit={tideData?.latest?.v != null ? 'm' : ''}
            tone="#0369a1"
            info={t('ocean.metric.tideNow.info')}
          />
          <Metric
            label={t('ocean.metric.nextHigh.label')}
            value={nextTides?.nextH ? `${fmtSiteTime(nextTides.nextH.t)}` : '—'}
            unit={nextTides?.nextH ? `· ${nextTides.untilH}h 后` : ''}
            tone="#1d4ed8"
            info={t('ocean.metric.nextHigh.info')}
          />
          <Metric
            label={t('ocean.metric.nextLow.label')}
            value={nextTides?.nextL ? `${fmtSiteTime(nextTides.nextL.t)}` : '—'}
            unit={nextTides?.nextL ? `· ${nextTides.untilL}h 后` : ''}
            tone="#0891b2"
            info={t('ocean.metric.nextLow.info')}
          />
          <Metric
            label={t('ocean.metric.cyclone.label')}
            value={cycData ? `${cycData.count}` : '—'}
            unit={cycData ? `个 · 飓风 ${cycData.hurricaneCount}` : ''}
            tone={cycData?.hurricaneCount ? '#ef4444' : 'var(--o-accent)'}
            info={t('ocean.metric.cyclone.info')}
          />
          <Metric
            label={t('ocean.metric.ssta.label')}
            value={sstaData ? `+${sstaData.latest.anom.toFixed(2)}` : '—'}
            unit={sstaData ? `°C · ${sstaData.latest.year}` : ''}
            tone="#ef4444"
            info={t('ocean.metric.ssta.info')}
          />
          <Metric
            label={t('ocean.metric.oni.label')}
            value={oniData ? `${oniData.latest.anom >= 0 ? '+' : ''}${oniData.latest.anom.toFixed(2)}` : '—'}
            unit={oniData ? oniData.state : ''}
            tone={oniData ? (oniData.latest.anom >= 0.5 ? '#dc2626' : oniData.latest.anom <= -0.5 ? '#1d4ed8' : '#64748b') : undefined}
            info={t('ocean.metric.oni.info')}
          />
          <Metric
            label={t('ocean.metric.buoy.label')}
            value={buoyData?.maxWave ? buoyData.maxWave.wvht.toFixed(1) : '—'}
            unit={buoyData?.maxWave ? 'm' : ''}
            tone={buoyData?.maxWave ? waveLevel(buoyData.maxWave.wvht).color : undefined}
            info={t('ocean.metric.buoy.info')}
          />
        </div>

        <Tabs
          className="o-tabs"
          activeKey={lockedTab || activeTab}
          onChange={lockedTab ? () => {} : onTabChange}
          tabBarStyle={lockedTab ? { display: 'none' } : undefined}
          size="large"
          items={[
            {
              key: 'waves',
              label: `🌊 ${t('ocean.tab.waves')}`,
              children: (
                <WavesTab
                  waves={waves}
                  waveData={waveData}
                  globalWaves={globalWaves}
                  globalWavesData={globalWavesData}
                />
              ),
            },
            {
              key: 'tide',
              label: `🌗 ${t('ocean.tab.tide')}`,
              children: (
                <TideTab
                  tides={tides}
                  tideData={tideData}
                  tidePred={tidePred}
                  predData={predData}
                  stationWeather={stationWeather}
                  wxData={wxData}
                />
              ),
            },
            {
              key: 'oni',
              label: `🌡 ${t('ocean.tab.oni')}`,
              children: (
                <OniTab
                  oni={oni}
                  oniData={oniData}
                  oscillations={oscillations}
                  oscData={oscData}
                  ssta={ssta}
                  sstaData={sstaData}
                />
              ),
            },
            {
              key: 'cyclone',
              label: `🌀 ${t('ocean.tab.cyclone')}`,
              children: <CycloneTab cyclones={cyclones} cycData={cycData} />,
            },
            {
              key: 'buoy',
              label: `🛟 ${t('ocean.tab.buoy')}`,
              children: <BuoysTab buoys={buoys} buoyData={buoyData} />,
            },
            {
              key: 'marine',
              label: `🌊 ${t('ocean.tab.marine')}`,
              children: <MarineTab marine={marine} marineData={marineData} />,
            },
            {
              key: 'coast',
              label: `🏖 ${t('ocean.tab.coast')}`,
              children: <CoastTab marine={marine} marineData={marineData} />,
            },
            {
              key: 'seatem',
              label: `🌡 ${t('ocean.tab.seatem')}`,
              children: <SeaTempTab marine={marine} marineData={marineData} />,
            },
            {
              key: 'cases',
              label: `📚 ${t('ocean.tab.cases')}`,
              children: <CaseTab theme={theme} />,
            },
          ]}
        />

        {/* 关联数据：随当前激活页签变化，给出可以对照着读的其他模块（含跨看板） */}
        <RelatedData board="ocean" tab={activeTab} theme={theme} health={health} />

        <footer className="o-foot">
          {t('ocean.footer')}
        </footer>
      </div>
    </ConfigProvider>
  )
}
