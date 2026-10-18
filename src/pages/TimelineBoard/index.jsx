/**
 * 时间版本页（/timeline）——「数据看板」家族的第四页。
 *
 * 深空 / 地球 / 海洋三个看板各自忙着展示「数据是什么」，
 * 这一页回答另一个维度的问题：「数据是什么时候的」——
 * 每个源最近一次抓取时刻、数据本身描述的时刻、轮换周期与当前状态，
 * 让三大看板的公开数据源新鲜度一目了然。
 *
 * 顶部用「三位一体」轨道动画（天·地·海）把三块看板汇成视觉核心：
 * 每颗行星 = 一块看板，半径与描边色折射其实时健康度，点击进入对应看板。
 * 紧接「数据总结」：只汇总深空 / 地球 / 海洋三方的数据现状（源清单、健康度、新旧），
 * 不掺功能版本信息——版本演进另有时间轴页面负责，这一页只讲数据。
 *
 * 数据时刻来自各代理在 withCache 统一盖的 fetchedAt 戳 + 载荷自带的时间字段；
 * 健康度来自 useAstroData / useGeoData / useOceanData 每个源的 data/error/stale 标记。
 */

import { useEffect, useMemo, useState } from 'react'
import { Button, Card, ConfigProvider, Statistic, Table, Tabs, Tag, Tooltip, theme as antdTheme } from 'antd'
import { BulbOutlined, MoonOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAstroData } from '@lib/astro/useAstroData.js'
import { useGeoData } from '@lib/geo/useGeoData.js'
import { useOceanData } from '@lib/ocean/useOceanData.js'
import TrinityOrbit from './components/TrinityOrbit.jsx'
import DataSummary from './components/DataSummary.jsx'
import GlossaryHub from './components/GlossaryHub.jsx'
import ModuleView from './components/ModuleView.jsx'
import { useI18n } from '@i18n/index.js'
import './components/TrinityOrbit.scss'
import './components/DataSummary.scss'
import './index.scss'

/* ---------- 小工具 ---------- */

const pad = (n) => String(n).padStart(2, '0')

/** 主题 localStorage 键。时间版本页默认深色——与深空看板同族。 */
const THEME_KEY = 'timeline.board.theme'

function readTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function useNow(stepMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), stepMs)
    return () => clearInterval(t)
  }, [stepMs])
  return now
}

/** 毫秒戳 → 本地 HH:mm:ss */
function fmtClock(ms) {
  if (!Number.isFinite(ms)) return '--:--:--'
  const d = new Date(ms)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 距今的人话时长 */
function fmtAgo(ms, now) {
  if (!Number.isFinite(ms)) return '—'
  const s = Math.max(0, Math.round((now.getTime() - ms) / 1000))
  if (s < 60) return `${s} 秒前`
  if (s < 3600) return `${Math.floor(s / 60)} 分钟前`
  if (s < 86400) return `${Math.floor(s / 3600)} 小时前`
  return `${Math.floor(s / 86400)} 天前`
}

/** 轮换周期 → 人话 */
function fmtCycle(ms) {
  if (ms < 60_000) return `${Math.round(ms / 1000)} 秒`
  if (ms < 3600_000) return `${Math.round(ms / 60_000)} 分钟`
  return `${Math.round(ms / 3600_000)} 小时`
}

/** 载荷时间字段 → 「YYYY-MM-DD HH:mm（时区）」；缺省返回 null 让列显示 — */
function withZone(v, zone) {
  if (v == null || v === '') return null
  return `${String(v).slice(0, 16).replace('T', ' ')}（${zone}）`
}

function msBJT(ms) {
  if (!Number.isFinite(ms)) return null
  const d = new Date(ms + 8 * 3600_000)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}（北京时）`
}

/* ---------- 数据时刻取法：键为 `${看板}.${源}`，全部安全取值，缺字段就 — ---------- */

const MOMENTS = {
  'astro.spaceWeather': (d) => withZone(d?.kp?.time, 'UTC'),
  'astro.apod': (d) => withZone(d?.date, '发布日'),
  'geo.quakes': (d) => msBJT(d?.quakes?.[0]?.time),
  'geo.epic': (d) => withZone(d?.date, '拍摄日'),
  'geo.env': (d) => withZone(d?.cities?.[0]?.time, '北京时'),
  'geo.eonet': (d) => withZone(d?.time, 'UTC'),
  'geo.ghg': (d) => {
    const arr = d?.gases?.co2
    if (!Array.isArray(arr) || !arr.length) return null
    return withZone(arr[arr.length - 1]?.t, '月均')
  },
  'ocean.waves': (d) => withZone(d?.spots?.[0]?.time, '北京时'),
  'ocean.globalWaves': (d) => withZone(d?.spots?.[0]?.time, 'UTC'),
  'ocean.tides': (d) => withZone(d?.events?.[0]?.t, '当地'),
  /* 以下 8 个源的时间字段均已对照 proxy 实际载荷核过：
     毫秒戳 → msBJT；字符串 / 年月 → withZone。取不到一律 null，表格渲染成「—」。 */
  'geo.bigQuakes': (d) => msBJT(d?.quakes?.[0]?.time),
  'geo.volcanoes': (d) => msBJT(d?.latestUnix),
  'geo.tsunami': (d) => msBJT(d?.latest?.updatedUnix),
  'ocean.cyclones': (d) => withZone(d?.strongest?.lastUpdate, '最近更新'),
  'ocean.oscillations': (d) => withZone(d?.pdo?.latest?.ym, 'PDO 月值'),
  'ocean.ssta': (d) => withZone(d?.latest?.year, '年均'),
  'ocean.stationWeather': (d) => withZone(d?.latest?.t, '当地'),
  'ocean.buoys': (d) => msBJT(d?.updatedAt),
}

/* ---------- 数据源清单：与三个 hook 的键一一对应 ---------- */

const BOARDS = [
  {
    key: 'astro',
    title: '深空',
    icon: '🛰️',
    sources: [
      { key: 'iss', name: 'ISS 实时位置', desc: 'wheretheiss.at 卫星即时坐标', cycle: 5_000 },
      { key: 'stations', name: 'TLE 轨道根数', desc: 'Celestrak 两行轨道根数（SGP4 推算基础）', cycle: 10 * 60_000 },
      { key: 'spaceWeather', name: '太阳风 / 地磁 Kp', desc: 'NOAA SWPC DSCOVR 实时太阳风与行星际磁场', cycle: 60_000 },
      { key: 'solarActivity', name: 'X 射线 / 质子通量', desc: 'GOES 卫星 1 分钟采样（耀斑与质子事件）', cycle: 5 * 60_000 },
      { key: 'aurora', name: '极光椭圆预报', desc: 'NOAA OVATION 极光概率 30 分钟预报', cycle: 10 * 60_000 },
      { key: 'solarCycle', name: '太阳活动周期', desc: 'SILSO 月均黑子数 + NOAA 周期预测带', cycle: 6 * 3600_000 },
      { key: 'neo', name: '近地天体', desc: 'NASA NEO API 未来 7 日接近天体', cycle: 30 * 60_000 },
      { key: 'launches', name: '航天发射任务', desc: 'Launch Library 2 近期全球发射', cycle: 3600_000 },
      { key: 'exoplanets', name: '系外行星档案', desc: 'NASA Exoplanet Archive 累计统计', cycle: 30 * 60_000 },
      { key: 'apod', name: '每日天文一图', desc: 'NASA APOD（DEMO_KEY 限流，6 小时一刷）', cycle: 6 * 3600_000 },
    ],
  },
  {
    key: 'geo',
    title: '地球',
    icon: '🌍',
    sources: [
      { key: 'quakes', name: '地震速报', desc: 'EMSC / USGS 过去 24h M2.5+ 地震', cycle: 2 * 60_000 },
      { key: 'epic', name: '整圆盘地球影像', desc: 'NASA EPIC（DSCOVR 日地 L1 点拍摄）', cycle: 3600_000 },
      { key: 'env', name: '城市天气 / 空气质量', desc: 'Open-Meteo 天气实况 + 欧洲标准 AQI', cycle: 10 * 60_000 },
      { key: 'eonet', name: '自然事件追踪', desc: 'NASA EONET 火灾 / 风暴 / 火山等事件', cycle: 3600_000 },
      { key: 'ghg', name: '温室气体浓度趋势', desc: 'NOAA GML 全球月均 CO₂ / CH₄ / N₂O', cycle: 12 * 3600_000 },
      { key: 'seaIce', name: '南北极海冰范围', desc: 'NSIDC 南北极海冰范围年际序列', cycle: 12 * 3600_000 },
      { key: 'tempAnomaly', name: '全球温度距平', desc: 'NASA GISTEMP 陆海综合温度距平序列', cycle: 12 * 3600_000 },
      { key: 'bigQuakes', name: '强震统计（30 天）', desc: 'EMSC 近 30 天 M5.5+ 强震与日均频次', cycle: 30 * 60_000 },
      { key: 'volcanoes', name: '火山活动警报', desc: 'USGS HANS 火山航空色码 / 地面警报级', cycle: 30 * 60_000 },
      { key: 'tsunami', name: '海啸预警', desc: 'NOAA tsunami.gov 太平洋 + 国家中心双 feed', cycle: 10 * 60_000 },
    ],
  },
  {
    key: 'ocean',
    title: '海洋',
    icon: '🌊',
    sources: [
      { key: 'waves', name: '近海海况', desc: 'Open-Meteo Marine 近岸浪高 / 浪向 / 周期', cycle: 30 * 60_000 },
      { key: 'tides', name: '实测潮位', desc: 'NOAA 潮位站 6 分钟实测（旧金山）', cycle: 6 * 60_000 },
      { key: 'tidePred', name: '高低潮预报', desc: 'NOAA 潮汐预报（当日起 72h）', cycle: 3600_000 },
      { key: 'globalWaves', name: '全球海域浪况', desc: 'Open-Meteo Marine 十大海域逐时浪高', cycle: 3600_000 },
      { key: 'oni', name: 'ENSO 指数', desc: 'NOAA PSL Oceanic Niño Index 序列', cycle: 12 * 3600_000 },
      { key: 'cyclones', name: '热带气旋', desc: 'NOAA NHC 大西洋 / 东太平洋活跃风暴', cycle: 10 * 60_000 },
      { key: 'oscillations', name: '气候振荡 PDO / AMO', desc: 'NOAA PSL 太平洋 / 大西洋年代际振荡月值', cycle: 12 * 3600_000 },
      { key: 'ssta', name: '海表温度距平', desc: 'NOAA NCEI 全球海洋温度距平年际序列', cycle: 12 * 3600_000 },
      { key: 'stationWeather', name: '站点气象（潮位站）', desc: 'NOAA CO-OPS 潮位站逐时气温 / 水温', cycle: 30 * 60_000 },
      { key: 'buoys', name: '浮标实况', desc: 'NOAA NDBC 全球浮标最新观测（浪高 / 水温）', cycle: 20 * 60_000 },
    ],
  },
]

/** 三看板主色，与三位一体动画、数据总结共用 */
const BOARD_COLOR = { astro: '#722ed1', geo: '#13c2c2', ocean: '#1677ff' }

/* ---------- 页面 ---------- */

export default function TimelineBoard() {
  const { t } = useI18n()
  const [theme, setTheme] = useState(readTheme)
  const astro = useAstroData()
  const geo = useGeoData()
  const ocean = useOceanData()
  const now = useNow(1000)

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch { /* 隐私模式忽略 */ }
  }

  const HOOKS = useMemo(() => ({ astro, geo, ocean }), [astro, geo, ocean])

  /** 三块看板的实时健康度（与三位一体动画、数据总结共用） */
  const boardHealth = useMemo(
    () =>
      BOARDS.map((b) => {
        const states = b.sources.map((s) => HOOKS[b.key][s.key])
        const total = states.length
        const ok = states.filter((s) => s.data && !s.error && !s.data.stale).length
        const bad = states.filter((s) => s.error).length
        const wait = states.filter((s) => !s.data && !s.error).length
        return {
          key: b.key,
          title: b.title,
          color: BOARD_COLOR[b.key],
          total,
          ok,
          bad,
          wait,
          // 逐个源的状态，供数据总结列出「这块板在监控什么」
          sources: b.sources.map((s, i) => ({
            name: s.name,
            cycleText: fmtCycle(s.cycle),
            ok: !!(states[i].data && !states[i].error && !states[i].data.stale),
          })),
        }
      }),
    [HOOKS],
  )

  const totalSrc = boardHealth.reduce((n, b) => n + b.total, 0)
  const totalOk = boardHealth.reduce((n, b) => n + b.ok, 0)
  const totalBad = boardHealth.reduce((n, b) => n + b.bad, 0)
  const totalWait = boardHealth.reduce((n, b) => n + b.wait, 0)

  /** 全部 18 个源的扁平视图：{ board, ...src, ...hookState } */
  const rows = useMemo(
    () =>
      BOARDS.flatMap((b) =>
        b.sources.map((s) => ({
          boardKey: b.key,
          boardTitle: b.title,
          ...s,
          ...HOOKS[b.key][s.key],
        })),
      ),
    [HOOKS],
  )

  const reloadAll = () => {
    astro.reloadAll()
    geo.reloadAll()
    ocean.reloadAll()
  }
  const anyLoading = astro.anyLoading || geo.anyLoading || ocean.anyLoading

  /** 最新鲜 / 最陈旧：各源距现在的毫秒数 */
  const stats = useMemo(() => {
    const ages = rows.filter((r) => r.data).map((r) => now.getTime() - r.data.fetchedAt)
    return {
      freshest: ages.length ? Math.min(...ages) : null,
      oldest: ages.length ? Math.max(...ages) : null,
    }
  }, [rows, now])

  /** 每块看板各自的最新鲜 / 最陈旧（已格式化成「3 分钟前」这类文案） */
  const boardAges = useMemo(
    () =>
      Object.fromEntries(
        BOARDS.map((b) => {
          const ts = rows.filter((r) => r.boardKey === b.key && r.data).map((r) => r.data.fetchedAt)
          return [
            b.key,
            {
              freshest: ts.length ? fmtAgo(Math.max(...ts), now) : '—',
              oldest: ts.length ? fmtAgo(Math.min(...ts), now) : '—',
            },
          ]
        }),
      ),
    [rows, now],
  )

  const antdThemeCfg = useMemo(
    () =>
      theme === 'dark'
        ? { algorithm: antdTheme.darkAlgorithm, token: { colorBgBase: '#0b1220', colorTextBase: '#e6edf7', borderRadius: 10 } }
        : { algorithm: antdTheme.defaultAlgorithm, token: { colorBgBase: '#f7f9fc', colorTextBase: '#1c2430', borderRadius: 10 } },
    [theme],
  )

  /** 表格列定义（三块共用） */
  const columns = [
    {
      title: t('timeline.colSource'),
      dataIndex: 'name',
      render: (_, r) => (
        <Tooltip title={r.desc}>
          <span style={{ fontWeight: 600 }}>{r.name}</span>
        </Tooltip>
      ),
    },
    { title: t('timeline.colCycle'), dataIndex: 'cycle', width: 96, render: (v) => fmtCycle(v) },
    {
      title: t('timeline.colFetched'),
      key: 'fetched',
      width: 210,
      render: (_, r) =>
        r.data?.fetchedAt ? (
          <span>
            {fmtClock(r.data.fetchedAt)}
            <Tag style={{ marginLeft: 8 }} bordered={false}>{fmtAgo(r.data.fetchedAt, now)}</Tag>
          </span>
        ) : (
          '—'
        ),
    },
    {
      title: t('timeline.colMoment'),
      key: 'moment',
      width: 250,
      render: (_, r) => {
        const getter = MOMENTS[`${r.boardKey}.${r.key}`]
        const v = getter ? getter(r.data) : null
        return v || '—'
      },
    },
    {
      title: t('timeline.colStatus'),
      key: 'status',
      width: 90,
      render: (_, r) => {
        if (r.error) return <Tag color="red">{t('timeline.statusError')}</Tag>
        if (r.data?.stale) return <Tag color="orange">{t('timeline.statusStale')}</Tag>
        if (!r.data) return <Tag color="processing">{r.loading ? t('timeline.statusWaiting') : t('timeline.statusNone')}</Tag>
        return <Tag color="green">{t('timeline.statusNormal')}</Tag>
      },
    },
    {
      title: t('timeline.colOp'),
      key: 'op',
      width: 70,
      render: (_, r) => (
        <Button size="small" icon={<ReloadOutlined />} onClick={r.reload} loading={r.loading} />
      ),
    },
  ]

  return (
    <ConfigProvider theme={antdThemeCfg}>
      <div style={{ minHeight: '100vh', padding: '28px clamp(16px, 4vw, 48px) 48px' }}>
        {/* 顶部：标题 + 主题切换 + 一键刷新 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(22px, 3vw, 30px)' }}>{t('timeline.title')}</h1>
            <p style={{ margin: '6px 0 0', opacity: 0.72 }}>
              {t('timeline.subtitle')}
            </p>
          </div>
          <Button icon={<ReloadOutlined />} onClick={reloadAll} loading={anyLoading}>
            {t('timeline.refreshAll')}
          </Button>
          <Button
            icon={theme === 'dark' ? <BulbOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
          />
        </div>

        {/* 三大板块收进 tab：概览 / 数据档案 / 名词库，避免长页一路下滑 */}
        <Tabs
          defaultActiveKey="overview"
          className="tl-tabs"
          items={[
            {
              key: 'overview',
              label: t('timeline.tabOverview'),
              children: (
                <>
                  {/* 三位一体动画：天 · 地 · 海 绕核心旋转 */}
                  <Card size="small" style={{ marginTop: 20 }}>
                    <TrinityOrbit
                      boards={boardHealth}
                      totalOk={totalOk}
                      totalSrc={totalSrc}
                      theme={theme}
                    />
                    <p style={{ textAlign: 'center', margin: '4px 0 0', fontSize: 12, opacity: 0.55 }}>
                      {t('timeline.orbitCaption')}
                    </p>
                  </Card>

                  {/* 数据总结：深空 / 地球 / 海洋三方数据现状 */}
                  <DataSummary
                    boards={boardHealth}
                    ages={boardAges}
                    totalOk={totalOk}
                    totalSrc={totalSrc}
                    totalBad={totalBad}
                    totalWait={totalWait}
                    theme={theme}
                  />

                  {/* 三钟：本地 / UTC / 儒略日 */}
                  <Card size="small" style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 48px' }}>
                      <Statistic
                        title={t('timeline.clockLocal')}
                        valueStyle={{ fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(24px, 3vw, 34px)' }}
                        value={fmtClock(now.getTime())}
                      />
                      <Statistic
                        title={t('timeline.clockUtc')}
                        valueStyle={{ fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(24px, 3vw, 34px)' }}
                        value={`${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`}
                      />
                      <Statistic
                        title={t('timeline.clockJulian')}
                        valueStyle={{ fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(24px, 3vw, 34px)' }}
                        value={(now.getTime() / 86400000 + 2440587.5).toFixed(5)}
                      />
                    </div>
                  </Card>

                  {/* 健康度概览 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 16 }}>
                    <Card size="small"><Statistic title={t('timeline.statTotalSrc')} value={rows.length} /></Card>
                    <Card size="small"><Statistic title={t('timeline.statOk')} value={totalOk} valueStyle={{ color: '#52c41a' }} /></Card>
                    <Card size="small"><Statistic title={t('timeline.statError')} value={totalBad} valueStyle={{ color: totalBad ? '#ff4d4f' : undefined }} /></Card>
                    <Card size="small"><Statistic title={t('timeline.statWaiting')} value={totalWait} /></Card>
                    <Card size="small">
                      <Statistic
                        title={t('timeline.statFreshest')}
                        value={stats.freshest == null ? '—' : stats.freshest < 1000 ? t('timeline.justNow') : fmtAgo(stats.freshest, now)}
                      />
                    </Card>
                    <Card size="small">
                      <Statistic title={t('timeline.statOldest')} value={stats.oldest == null ? '—' : fmtAgo(stats.oldest, now)} />
                    </Card>
                  </div>
                </>
              ),
            },
            {
              key: 'sources',
              label: t('timeline.tabSources'),
              children: (
                <Tabs
                  defaultActiveKey={BOARDS[0].key}
                  items={BOARDS.map((b) => ({
                    key: b.key,
                    label: `${b.icon} ${b.title}`,
                    children: (
                      <div style={{ marginTop: 12 }}>
                        <p style={{ margin: '0 0 10px', fontSize: 13, opacity: 0.65 }}>
                          {b.title} · {t('timeline.boardSummary', { count: b.sources.length })}
                        </p>
                        <Table
                          size="small"
                          rowKey="key"
                          columns={columns}
                          dataSource={b.sources.map((s) => ({ ...s, ...HOOKS[b.key][s.key] }))}
                          pagination={false}
                        />
                      </div>
                    ),
                  }))}
                />
              ),
            },
            {
              key: 'glossary',
              label: t('timeline.tabGlossary'),
              children: <GlossaryHub theme={theme} />,
            },
            {
              key: 'modules',
              label: t('timeline.tabModules'),
              children: <ModuleView />,
            },
          ]}
        />

        <footer style={{ marginTop: 36, fontSize: 12, opacity: 0.55 }}>
          {t('timeline.footer')}
        </footer>
      </div>
    </ConfigProvider>
  )
}
