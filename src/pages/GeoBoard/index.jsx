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
import { useGeoData } from '../../lib/geo/useGeoData.js'
import { zhTsunamiCategory } from '../../lib/earth/glossary.js'
import { Metric, readTheme, THEME_KEY, depthClass, magColor } from './components/ui.jsx'
import QuakeTab from './components/QuakeTab.jsx'
import EpicTab from './components/EpicTab.jsx'
import EonetTab from './components/EonetTab.jsx'
import ClimateTab from './components/ClimateTab.jsx'
import VolcanoTab from './components/VolcanoTab.jsx'
// DictTab 已集中到 /timeline 聚合名词库（名词解析统一入口），本看板不再单独持有名词页签
import CaseTab from './components/CaseTab.jsx'
import Clock from '../../components/Clock.jsx'
import RelatedData from '../../components/RelatedData/index.jsx'
import { TAB_KEYS } from '../../lib/boards/relations.js'
import { healthOf } from '../../lib/boards/health.js'
import './index.scss'

export default function GeoBoard({ lockedTab = null } = {}) {
  const {
    quakes, epic, env, eonet, ghg, seaIce, tempAnomaly, bigQuakes, volcanoes, tsunami, reloadAll,
  } = useGeoData()
  const [theme, setTheme] = useState(readTheme)

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
    return tsunamiData.events.filter((e) => (zhTsunamiCategory(e.category)?.rank ?? 0) >= 2).length
  }, [tsunamiData])

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
            <h1><GlobalOutlined /> 地球数据看板</h1>
            <p className="geo-hero__sub">
              「天上一个地下」的第二块拼图——<Link to="/astro">深空看板</Link>看天，这里看地：
              地下的大地脉动、地表的城市环境、以及拍自日地 L1 点的整圆盘地球。
            </p>
          </div>
          <div className="geo-hero__side">
            <Clock prefix="geo" />
            <Tooltip title={theme === 'dark' ? '切换到白昼' : '切换到夜航'}>
              <Button
                icon={theme === 'dark' ? <BulbOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                size="small"
                className="geo-theme-btn"
              >
                {theme === 'dark' ? '白昼' : '夜航'}
              </Button>
            </Tooltip>
            <Button icon={<ReloadOutlined />} onClick={reloadAll} loading={quakes.loading} size="small">
              刷新
            </Button>
          </div>
        </div>

        {/* 关键指标条 */}
        <div className="geo-strip">
          <Metric
            label="24h 地震（M2.5+）"
            value={quakeData?.count ?? '—'}
            unit={quakeData ? '次' : ''}
            tone="var(--g-accent)"
            info="过去 24 小时全球震级 2.5 以上的地震次数（USGS 全球台网测定，含微震以下的未计入）"
          />
          <Metric
            label="最大震级"
            value={quakeStats ? `M${quakeStats.strongest.mag?.toFixed(1)}` : '—'}
            tone={quakeStats ? magColor(quakeStats.strongest.mag) : undefined}
            info="24h 内震级最大的一次地震；M5 以上可能造成破坏，M6 以上为强震"
          />
          <Metric
            label="最深震源"
            value={quakeStats ? `${quakeStats.deepest.depth?.toFixed(0)}` : '—'}
            unit={quakeStats ? 'km' : ''}
            tone={quakeStats ? depthClass(quakeStats.deepest.depth).color : undefined}
            info="24h 内震源最深的地震；深源地震发生在俯冲板片内，地表震感通常较弱"
          />
          <Metric
            label="全球 CO₂ 浓度"
            value={ghgData?.gases?.co2?.latest?.value?.toFixed(2) ?? '—'}
            unit={ghgData ? 'ppm' : ''}
            tone="#d97706"
            info="NOAA 全球月均二氧化碳浓度（百万分之一体积比）；工业化前约 278 ppm"
          />
          <Metric
            label="全球 CH₄ 浓度"
            value={ghgData?.gases?.ch4?.latest?.value?.toFixed(1) ?? '—'}
            unit={ghgData ? 'ppb' : ''}
            tone="#8b5cf6"
            info="全球月均甲烷浓度（十亿分之一体积比）；工业化前约 722 ppb，百年增温潜势是 CO₂ 的 28 倍"
          />
          <Metric
            label="温度距平（近 12 月）"
            value={tempData?.latest12 != null ? `+${tempData.latest12.toFixed(2)}` : '—'}
            unit={tempData ? '°C' : ''}
            tone="#ef4444"
            info="NASA GISTEMP 全球陆海综合温度相对 1951–1980 年基准的偏差；《巴黎协定》努力控制在 +1.5 °C 以内"
          />
          <Metric
            label="北极 9 月海冰"
            value={iceData?.north?.latest?.extent?.toFixed(2) ?? '—'}
            unit={iceData ? '百万km²' : ''}
            tone="#3b82f6"
            info="NSIDC 北极海冰范围（每年 9 月为最小值月份），是气候变化经典指标"
          />
          <Metric
            label="城市平均 PM2.5"
            value={avgPm25 ? avgPm25.toFixed(1) : '—'}
            unit={avgPm25 ? 'μg/m³' : ''}
            tone={avgPm25 ? (avgPm25 <= 35 ? '#0e9f6e' : avgPm25 <= 75 ? '#f59e0b' : '#ef4444') : undefined}
            info="本页 5 个样本城市（北京/上海/广州/成都/拉萨）PM2.5 的算术平均，非全国均值"
          />
          <Metric
            label="火山警报"
            value={volcanoData ? `${volcanoData.count}` : '—'}
            unit={volcanoData ? `座（${volcanoData.elevated} 橙+）` : ''}
            tone={volcanoData ? (volcanoData.elevated > 0 ? '#f97316' : '#0e9f6e') : undefined}
            info="USGS HANS 当前处于「正常」级以上的美国火山数；括号为橙色及以上（真正活动的）数量"
          />
          <Metric
            label="海啸公告"
            value={tsunamiThreat ?? '—'}
            unit={tsunamiThreat != null ? `条威胁 / ${tsunamiData.count}` : ''}
            tone={tsunamiThreat != null ? (tsunamiThreat > 0 ? '#dc2626' : '#0e9f6e') : undefined}
            info="NOAA 两个海啸预警中心当前「注意」及以上级别的公告数；其余多为排除威胁的信息声明"
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
              label: '🪨 大地脉动',
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
              label: '🖼 地球影像',
              children: <EpicTab epic={epic} epicData={epicData} />,
            },
            {
              key: 'eonet',
              label: '🛰 自然事件',
              children: <EonetTab eonet={eonet} eonetData={eonetData} />,
            },
            {
              key: 'volcano',
              label: '🌋 火山与海啸',
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
              label: '🌏 地表与气候',
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
              key: 'cases',
              label: '📚 案例',
              children: <CaseTab theme={theme} />,
            },
          ]}
        />

        {/* 关联数据：随当前激活页签变化，给出可以对照着读的其他模块（含跨看板） */}
        <RelatedData board="geo" tab={activeTab} theme={theme} health={health} />

        <footer className="geo-foot">
          全部数据来自公开免费接口（EMSC / NASA EPIC / NASA EONET / Open-Meteo / NOAA GML / NASA GISTEMP /
          NSIDC / USGS HANS / NOAA tsunami.gov），仅用于科普与可视化展示。
          地震参数为自动测定初值，以中国地震台网或 USGS 人工修订为准；
          环境数据为模型插值，不代表监测站实测；温室气体与温度距平为上游月更数据。
          火山与海啸等级为官方业务判定，紧急情况下请以当地政府与应急管理部门的指令为准。
        </footer>
      </div>
    </ConfigProvider>
  )
}
