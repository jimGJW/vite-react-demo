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
import { useOceanData } from '../../lib/ocean/useOceanData.js'
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
import Clock from '../../components/Clock.jsx'
import RelatedData from '../../components/RelatedData/index.jsx'
import { TAB_KEYS } from '../../lib/boards/relations.js'
import { healthOf } from '../../lib/boards/health.js'
import './index.scss'

export default function OceanBoard({ lockedTab = null } = {}) {
  const {
    waves, tides, tidePred, globalWaves, oni, cyclones, oscillations, ssta, stationWeather, buoys, marine, reloadAll,
  } = useOceanData()
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
            <h1><CompassOutlined /> 海洋数据看板</h1>
            <p className="o-hero__sub">
              「天上 · 地下 · 海洋」的第三块拼图——<Link to="/astro">深空看板</Link>看天、
              <Link to="/geo">地球看板</Link>看地，这里看海：近海的海浪与海温、
              旧金山站的实测潮位与高低潮预报、以及正在发生的厄尔尼诺。
            </p>
          </div>
          <div className="o-hero__side">
            <Clock prefix="o" />
            <Tooltip title={theme === 'dark' ? '切换到白昼' : '切换到夜航'}>
              <Button
                icon={theme === 'dark' ? <BulbOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                size="small"
                className="o-theme-btn"
              >
                {theme === 'dark' ? '白昼' : '夜航'}
              </Button>
            </Tooltip>
            <Button icon={<ReloadOutlined />} onClick={reloadAll} loading={waves.loading} size="small">
              刷新
            </Button>
          </div>
        </div>

        {/* 关键指标条 */}
        <div className="o-strip">
          <Metric
            label="最大浪高（5 站）"
            value={waveData?.maxWave != null ? waveData.maxWave.toFixed(2) : '—'}
            unit={waveData?.maxWave != null ? 'm' : ''}
            tone="var(--o-accent)"
            info="青岛外海/长江口/厦门/珠江口/三亚 5 个近海观测点中的当前最大浪高（Open-Meteo Marine 网格预报）"
          />
          <Metric
            label="平均海表温度"
            value={waveData?.avgSst != null ? waveData.avgSst.toFixed(1) : '—'}
            unit={waveData?.avgSst != null ? '°C' : ''}
            tone="#0d9488"
            info="5 个近海点海表温度（SST）的算术平均；SST 是台风生成与厄尔尼诺的关键变量"
          />
          <Metric
            label="当前潮位"
            value={tideData?.latest?.v != null ? tideData.latest.v.toFixed(2) : '—'}
            unit={tideData?.latest?.v != null ? 'm' : ''}
            tone="#0369a1"
            info="旧金山站最新实测水位（MLLW 基准 = 平均较低低潮面，美国潮位站通用零点）"
          />
          <Metric
            label="下次高潮"
            value={nextTides?.nextH ? `${fmtSiteTime(nextTides.nextH.t)}` : '—'}
            unit={nextTides?.nextH ? `· ${nextTides.untilH}h 后` : ''}
            tone="#1d4ed8"
            info="NOAA 潮汐调和预报（未来 48h）；时间为站点当地时间"
          />
          <Metric
            label="下次低潮"
            value={nextTides?.nextL ? `${fmtSiteTime(nextTides.nextL.t)}` : '—'}
            unit={nextTides?.nextL ? `· ${nextTides.untilL}h 后` : ''}
            tone="#0891b2"
            info="潮差 = 相邻高潮与低潮之差，赶海、进港避浅都看它"
          />
          <Metric
            label="活跃热带气旋"
            value={cycData ? `${cycData.count}` : '—'}
            unit={cycData ? `个 · 飓风 ${cycData.hurricaneCount}` : ''}
            tone={cycData?.hurricaneCount ? '#ef4444' : 'var(--o-accent)'}
            info="NOAA NHC 责任区（北大西洋 + 东北太平洋）当前活跃气旋数；飓风级为 64 kt 以上。西北太平洋台风不在本源内"
          />
          <Metric
            label="海洋温度距平"
            value={sstaData ? `+${sstaData.latest.anom.toFixed(2)}` : '—'}
            unit={sstaData ? `°C · ${sstaData.latest.year}` : ''}
            tone="#ef4444"
            info="全球海洋年均温相对 1901–2000 年基准的偏差；地球滞留热量的九成以上进了海洋"
          />
          <Metric
            label="厄尔尼诺 ONI"
            value={oniData ? `${oniData.latest.anom >= 0 ? '+' : ''}${oniData.latest.anom.toFixed(2)}` : '—'}
            unit={oniData ? oniData.state : ''}
            tone={oniData ? (oniData.latest.anom >= 0.5 ? '#dc2626' : oniData.latest.anom <= -0.5 ? '#1d4ed8' : '#64748b') : undefined}
            info="Niño 3.4 区海温距平 3 月滑动均值；≥ +0.5 厄尔尼诺 / ≤ −0.5 拉尼娜，|ONI|≥2.0 为超强"
          />
          <Metric
            label="浮标最大浪（实测）"
            value={buoyData?.maxWave ? buoyData.maxWave.wvht.toFixed(1) : '—'}
            unit={buoyData?.maxWave ? 'm' : ''}
            tone={buoyData?.maxWave ? waveLevel(buoyData.maxWave.wvht).color : undefined}
            info="NOAA NDBC 全球浮标网当前实测到的最大有效波高（区别于上方「最大浪高」的模式预报值）"
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
              label: '🌊 海浪与海温',
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
              label: '🌗 潮汐',
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
              label: '🌡 气候振荡',
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
              label: '🌀 热带气旋',
              children: <CycloneTab cyclones={cyclones} cycData={cycData} />,
            },
            {
              key: 'buoy',
              label: '🛟 浮标实况',
              children: <BuoysTab buoys={buoys} buoyData={buoyData} />,
            },
            {
              key: 'marine',
              label: '🌊 海况预报',
              children: <MarineTab marine={marine} marineData={marineData} />,
            },
            {
              key: 'coast',
              label: '🏖 海岸榜',
              children: <CoastTab marine={marine} marineData={marineData} />,
            },
            {
              key: 'seatem',
              label: '🌡 海温趋势',
              children: <SeaTempTab marine={marine} marineData={marineData} />,
            },
            {
              key: 'cases',
              label: '📚 真实案例',
              children: <CaseTab theme={theme} />,
            },
          ]}
        />

        {/* 关联数据：随当前激活页签变化，给出可以对照着读的其他模块（含跨看板） */}
        <RelatedData board="ocean" tab={activeTab} theme={theme} health={health} />

        <footer className="o-foot">
          全部数据来自公开免费接口（Open-Meteo Marine / NOAA CO-OPS / NOAA CPC / NOAA NHC / NOAA PSL /
          NOAA NCEI / NOAA NDBC），仅用于科普与可视化展示。海况为网格模式预报而非站点实测；
          潮汐时间为站点当地时间；气候振荡分级依据 NOAA 官方阈值；活跃气旋仅覆盖 NHC 责任区
          （北大西洋与东北太平洋）；浮标为整点后回传的实测值，各站时钟略有先后，缺测以 MM 标记。
        </footer>
      </div>
    </ConfigProvider>
  )
}
