/**
 * 地球数据看板（/geo）—— 与「深空数据看板」(/astro) 组成「天上 / 地下」一对。
 *
 * 数据（全部免密钥，经 vite-geo-proxy.mjs 服务端转发）：
 *   · USGS/EMSC      过去 24h M2.5+ 地震（大地脉动：地下）
 *   · NASA EPIC      DSCOVR 日地 L1 点拍摄的整圆盘地球照片（天上拍地下）
 *   · NASA EONET     近 30 天进行中的自然事件（野火/风暴/火山/海冰）
 *   · Open-Meteo     主要城市天气 + 空气质量实况（地表）
 *   · NOAA GML       全球月均 CO2 浓度趋势（气候）
 *   · NSIDC          北极 9 月海冰范围年际序列（冰冻圈）
 *
 * 本文件只做「壳」：主题切换 + 时钟 + KPI 指标条 + Tab 编排；
 * 各 Tab 的内容拆在 ./components/ 下的小组件里（ui.jsx 为共用 Panel/Metric/小工具）。
 */

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Tabs, Tooltip, ConfigProvider, theme as antdTheme } from 'antd'
import { ReloadOutlined, GlobalOutlined, BulbOutlined, MoonOutlined } from '@ant-design/icons'
import { useGeoData } from '../../lib/geo/useGeoData.js'
import { Metric, readTheme, THEME_KEY, fmtUTC, depthClass, magColor } from './components/ui.jsx'
import QuakeTab from './components/QuakeTab.jsx'
import EpicTab from './components/EpicTab.jsx'
import EonetTab from './components/EonetTab.jsx'
import ClimateTab from './components/ClimateTab.jsx'
import './index.scss'

export default function GeoBoard() {
  const { quakes, epic, env, eonet, co2, seaIce, reloadAll } = useGeoData()
  const [theme, setTheme] = useState(readTheme)
  const [now, setNow] = useState(() => new Date())

  // 每秒跳动的时钟（与 astro 同款）
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const quakeData = quakes.data?.ok ? quakes.data : null
  const epicData = epic.data?.ok ? epic.data : null
  const eonetData = eonet.data?.ok ? eonet.data : null
  const envData = env.data?.ok ? env.data : null
  const co2Data = co2.data?.ok ? co2.data : null
  const iceData = seaIce.data?.ok ? seaIce.data : null

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
            <div className="geo-clock">
              <span className="geo-clock__label">UTC</span>
              <span className="geo-clock__val">{fmtUTC(now)}</span>
            </div>
            <div className="geo-clock">
              <span className="geo-clock__label">北京</span>
              <span className="geo-clock__val">
                {fmtUTC(new Date(now.getTime() + 8 * 3600 * 1000))}
              </span>
            </div>
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
            value={co2Data?.latest?.ppm?.toFixed(2) ?? '—'}
            unit={co2Data ? 'ppm' : ''}
            tone="#d97706"
            info="NOAA 全球月均二氧化碳浓度（百万分之一体积比）；工业化前约 280 ppm"
          />
          <Metric
            label="北极 9 月海冰"
            value={iceData?.latest?.extent?.toFixed(2) ?? '—'}
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
        </div>

        <Tabs
          className="geo-tabs"
          defaultActiveKey="quake"
          size="large"
          items={[
            {
              key: 'quake',
              label: '🪨 大地脉动',
              children: <QuakeTab quakes={quakes} quakeData={quakeData} />,
            },
            {
              key: 'epic',
              label: '🖼 地球影像',
              children: <EpicTab epic={epic} epicData={epicData} />,
            },
            {
              key: 'eonet',
              label: '🌋 自然事件',
              children: <EonetTab eonet={eonet} eonetData={eonetData} />,
            },
            {
              key: 'climate',
              label: '🌏 地表与气候',
              children: (
                <ClimateTab
                  env={env}
                  envData={envData}
                  co2={co2}
                  co2Data={co2Data}
                  seaIce={seaIce}
                  iceData={iceData}
                />
              ),
            },
          ]}
        />

        <footer className="geo-foot">
          全部数据来自公开免费接口（USGS / NASA EPIC / NASA EONET / Open-Meteo / NOAA GML / NSIDC），
          仅用于科普与可视化展示。地震参数为自动测定初值，以中国地震台网或 USGS 人工修订为准；
          环境数据为模型插值，不代表监测站实测。
        </footer>
      </div>
    </ConfigProvider>
  )
}
