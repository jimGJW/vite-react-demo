/**
 * 地球数据看板（/geo）—— 与「深空数据看板」(/astro) 组成「天上 / 地下」一对。
 *
 * 数据（全部免密钥，经 vite-geo-proxy.mjs 服务端转发）：
 *   · EMSC/USGS         过去 24h M2.5+ 地震（大地脉动：地下）
 *   · EMSC              近 30 天 M5.5+ 强震（月尺度活动水平）
 *   · NASA EPIC         DSCOVR 日地 L1 点拍摄的整圆盘地球照片（天上拍地下）
 *   · NASA EONET        近 30 天进行中的自然事件（野火/风暴/火山/海冰）
 *   · Open-Meteo        主要城市天气 + 空气质量 + 紫外线实况（地表）
 *   · NOAA GML          CO₂ / CH₄ / N₂O 三种温室气体月均浓度
 *   · NASA GISTEMP      全球地表温度距平（陆海综合，基准 1951–1980）
 *   · NSIDC             南北极海冰范围年际序列（北极 9 月、南极 2 月）
 *   · USGS HANS         火山警报（仅返回高于「正常」的火山，两套分级并列展示）
 *   · NOAA tsunami.gov  海啸公告（太平洋中心 PHEB + 国家中心 PAAQ）
 *
 * 本文件只做「壳」：主题切换 + 时钟 + KPI 指标条 + Tab 编排；
 * 各 Tab 的内容拆在 ./components/ 下的小组件里（ui.jsx 为共用 Panel/Metric/小工具）。
 */

import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, Tabs, Tooltip, ConfigProvider, theme as antdTheme } from 'antd'
import { ReloadOutlined, GlobalOutlined, BulbOutlined, MoonOutlined } from '@ant-design/icons'
import { useGeoData } from '@lib/geo/useGeoData.js'
import { zhTsunamiCategory } from '@lib/earth/glossary.js'
import { Metric, readTheme, THEME_KEY, depthClass, magColor } from './components/ui.jsx'
import QuakeTab from './components/QuakeTab.jsx'
import EpicTab from './components/EpicTab.jsx'
import EonetTab from './components/EonetTab.jsx'
import ClimateTab from './components/ClimateTab.jsx'
import VolcanoTab from './components/VolcanoTab.jsx'
// DictTab 已集中到 /timeline 聚合名词库（名词解析统一入口），本看板不再单独持有名词页签
import AirTab from './components/AirTab.jsx'
import WeatherTab from './components/WeatherTab.jsx'
import ArchiveTab from './components/ArchiveTab.jsx'
import CaseTab from './components/CaseTab.jsx'
import Clock from '@components/Clock.jsx'
import RelatedData from '@components/RelatedData/index.jsx'
import { TAB_KEYS } from '@lib/boards/relations.js'
import { healthOf } from '@lib/boards/health.js'
import { useI18n } from '@i18n/index.js'
import './index.scss'

export default function GeoBoard({ lockedTab = null } = {}) {
  const {
    quakes, epic, env, eonet, ghg, seaIce, tempAnomaly, bigQuakes, volcanoes, tsunami, air, weather, archive, reloadAll,
  } = useGeoData()
  const [theme, setTheme] = useState(readTheme)
  const { t, lang } = useI18n()

  /* 页签与 URL 同步：别处「关联数据」跳 ?tab=xxx 过来时要能直接落到目标页签，
     否则读完关联理由点进去却停在默认页，等于白跳。非法参数回落到默认页签。 */
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab = TAB_KEYS.geo.includes(tabParam) ? tabParam : 'quake'
  const onTabChange = (k) => setSearchParams({ tab: k }, { replace: true })

  /** 本看板实时健康度：给「关联数据」底部的三方监控条用 */
  const health = healthOf([
    quakes, epic, env, eonet, ghg, seaIce, tempAnomaly, bigQuakes, volcanoes, tsunami,
  ])

  const quakeData = quakes.data?.ok ? quakes.data : null
  const epicData = epic.data?.ok ? epic.data : null
  const eonetData = eonet.data?.ok ? eonet.data : null
  const envData = env.data?.ok ? env.data : null
  const ghgData = ghg.data?.ok ? ghg.data : null
  const iceData = seaIce.data?.ok ? seaIce.data : null
  const tempData = tempAnomaly.data?.ok ? tempAnomaly.data : null
  const bigData = bigQuakes.data?.ok ? bigQuakes.data : null
  const volcanoData = volcanoes.data?.ok ? volcanoes.data : null
  const tsunamiData = tsunami.data?.ok ? tsunami.data : null
  const airData = air.data?.ok ? air.data : null
  const weatherData = weather.data?.ok ? weather.data : null
  const archiveData = archive.data?.ok ? archive.data : null

  // 派生统计：最大震级 / 最深震源 / 城市平均 PM2.5
  const quakeStats = useMemo(() => {
    if (!quakeData?.quakes?.length) return null
    const list = quakeData.quakes
    const strongest = list.reduce((a, b) => ((b.mag || 0) > (a.mag || 0) ? b : a))
    const deepest = list.reduce((a, b) => ((b.depth ?? -1) > (a.depth ?? -1) ? b : a))
    return { strongest, deepest }
  }, [quakeData])

  const avgPm25 = useMemo(() => {
    if (!envData?.cities?.length) return null
    const vals = envData.cities.map((c) => c.pm25).filter((v) => v != null)
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
  }, [envData])

  // 海啸威胁数：服务端只给 Category 原文，等级 rank 由词典判定（唯一真源）
  const tsunamiThreat = useMemo(() => {
    if (!tsunamiData?.events) return null
    return tsunamiData.events.filter((e) => (zhTsunamiCategory(e.category, lang)?.rank ?? 0) >= 2).length
  }, [tsunamiData, lang])

  /** antd 主题：默认白昼算法，夜航时切 darkAlgorithm 并注入深色 token */
  const antdThemeCfg = useMemo(
    () => ({
      algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: theme === 'dark' ? '#34d399' : '#0e9f6e',
        borderRadius: 10,
        fontSize: 13,
        ...(theme === 'dark'
          ? {
              colorBgContainer: '#0f1c15', // --g-panel
              colorBgElevated: '#132418', // --g-panel-2
              colorBgLayout: '#0a120d', // --g-bg
              colorBorder: '#1f3628', // --g-line
              colorBorderSecondary: '#1f3628',
              colorSplit: '#1f3628',
              colorText: '#e5f2e9', // --g-fg
              colorTextHeading: '#ffffff',
              colorTextDescription: '#8fa89a', // --g-dim
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
      <div className="geo-board" data-geo-theme={theme}>
        {/* 顶部概览 */}
        <div className="geo-hero">
          <div className="geo-hero__main">
            <h1><GlobalOutlined /> {t('geo.hero.title')}</h1>
            <p className="geo-hero__sub">
              {t('geo.hero.sub1')}<Link to="/astro">{t('geo.hero.deepSpace')}</Link>{t('geo.hero.sub2')}
            </p>
          </div>
          <div className="geo-hero__side">
            <Clock prefix="geo" />
            <Tooltip title={theme === 'dark' ? t('geo.theme.toLight') : t('geo.theme.toDark')}>
              <Button
                icon={theme === 'dark' ? <BulbOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                size="small"
                className="geo-theme-btn"
              >
                {theme === 'dark' ? t('geo.theme.light') : t('geo.theme.dark')}
              </Button>
            </Tooltip>
            <Button icon={<ReloadOutlined />} onClick={reloadAll} loading={quakes.loading} size="small">
              {t('geo.refresh')}
            </Button>
          </div>
        </div>

        {/* 关键指标条 */}
        <div className="geo-strip">
          <Metric
            label={t('geo.m.quake24h')}
            value={quakeData?.count ?? '—'}
            unit={quakeData ? t('geo.unit.times') : ''}
            tone="var(--g-accent)"
            info={t('geo.m.quake24hInfo')}
          />
          <Metric
            label={t('geo.m.maxMag')}
            value={quakeStats ? `M${quakeStats.strongest.mag?.toFixed(1)}` : '—'}
            tone={quakeStats ? magColor(quakeStats.strongest.mag, lang) : undefined}
            info={t('geo.m.maxMagInfo')}
          />
          <Metric
            label={t('geo.m.maxDepth')}
            value={quakeStats ? `${quakeStats.deepest.depth?.toFixed(0)}` : '—'}
            unit={quakeStats ? 'km' : ''}
            tone={quakeStats ? depthClass(quakeStats.deepest.depth, lang).color : undefined}
            info={t('geo.m.maxDepthInfo')}
          />
          <Metric
            label={t('geo.m.co2')}
            value={ghgData?.gases?.co2?.latest?.value?.toFixed(2) ?? '—'}
            unit={ghgData ? 'ppm' : ''}
            tone="#d97706"
            info={t('geo.m.co2Info')}
          />
          <Metric
            label={t('geo.m.ch4')}
            value={ghgData?.gases?.ch4?.latest?.value?.toFixed(1) ?? '—'}
            unit={ghgData ? 'ppb' : ''}
            tone="#8b5cf6"
            info={t('geo.m.ch4Info')}
          />
          <Metric
            label={t('geo.m.tempAnomaly')}
            value={tempData?.latest12 != null ? `+${tempData.latest12.toFixed(2)}` : '—'}
            unit={tempData ? '°C' : ''}
            tone="#ef4444"
            info={t('geo.m.tempAnomalyInfo')}
          />
          <Metric
            label={t('geo.m.arcticIce')}
            value={iceData?.north?.latest?.extent?.toFixed(2) ?? '—'}
            unit={iceData ? t('geo.unit.millionKm2') : ''}
            tone="#3b82f6"
            info={t('geo.m.arcticIceInfo')}
          />
          <Metric
            label={t('geo.m.pm25')}
            value={avgPm25 ? avgPm25.toFixed(1) : '—'}
            unit={avgPm25 ? 'μg/m³' : ''}
            tone={avgPm25 ? (avgPm25 <= 35 ? '#0e9f6e' : avgPm25 <= 75 ? '#f59e0b' : '#ef4444') : undefined}
            info={t('geo.m.pm25Info')}
          />
          <Metric
            label={t('geo.m.volcano')}
            value={volcanoData ? `${volcanoData.count}` : '—'}
            unit={volcanoData ? t('geo.unit.volcanoElevated', { n: volcanoData.elevated }) : ''}
            tone={volcanoData ? (volcanoData.elevated > 0 ? '#f97316' : '#0e9f6e') : undefined}
            info={t('geo.m.volcanoInfo')}
          />
          <Metric
            label={t('geo.m.tsunami')}
            value={tsunamiThreat ?? '—'}
            unit={tsunamiThreat != null ? t('geo.unit.tsunamiThreat', { n: tsunamiData.count }) : ''}
            tone={tsunamiThreat != null ? (tsunamiThreat > 0 ? '#dc2626' : '#0e9f6e') : undefined}
            info={t('geo.m.tsunamiInfo')}
          />
        </div>

        <Tabs
          className="geo-tabs"
          activeKey={lockedTab || activeTab}
          onChange={lockedTab ? () => {} : onTabChange}
          tabBarStyle={lockedTab ? { display: 'none' } : undefined}
          size="large"
          items={[
            {
              key: 'quake',
              label: `🪨 ${t('geo.tab.quake')}`,
              children: (
                <QuakeTab
                  quakes={quakes}
                  quakeData={quakeData}
                  bigQuakes={bigQuakes}
                  bigData={bigData}
                />
              ),
            },
            {
              key: 'epic',
              label: `🖼 ${t('geo.tab.epic')}`,
              children: <EpicTab epic={epic} epicData={epicData} />,
            },
            {
              key: 'eonet',
              label: `🛰 ${t('geo.tab.eonet')}`,
              children: <EonetTab eonet={eonet} eonetData={eonetData} />,
            },
            {
              key: 'volcano',
              label: `🌋 ${t('geo.tab.volcano')}`,
              children: (
                <VolcanoTab
                  volcanoes={volcanoes}
                  volcanoData={volcanoData}
                  tsunami={tsunami}
                  tsunamiData={tsunamiData}
                />
              ),
            },
            {
              key: 'climate',
              label: `🌏 ${t('geo.tab.climate')}`,
              children: (
                <ClimateTab
                  env={env}
                  envData={envData}
                  ghg={ghg}
                  ghgData={ghgData}
                  temp={tempAnomaly}
                  tempData={tempData}
                  seaIce={seaIce}
                  iceData={iceData}
                />
              ),
            },
            {
              key: 'air',
              label: `🌫 ${t('geo.tab.air')}`,
              children: <AirTab air={air} airData={airData} />,
            },
            {
              key: 'weather',
              label: `🌤 ${t('geo.tab.weather')}`,
              children: <WeatherTab weather={weather} weatherData={weatherData} />,
            },
            {
              key: 'archive',
              label: `📈 ${t('geo.tab.archive')}`,
              children: <ArchiveTab archive={archive} archiveData={archiveData} />,
            },
            {
              key: 'cases',
              label: `📚 ${t('geo.tab.cases')}`,
              children: <CaseTab theme={theme} />,
            },
          ]}
        />

        {/* 关联数据：随当前激活页签变化，给出可以对照着读的其他模块（含跨看板） */}
        <RelatedData board="geo" tab={activeTab} theme={theme} health={health} />

        <footer className="geo-foot">
          {t('geo.footer')}
        </footer>
      </div>
    </ConfigProvider>
  )
}
