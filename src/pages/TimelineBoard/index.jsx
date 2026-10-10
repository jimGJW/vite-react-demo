/**
 * 时间版本页（/timeline）——「数据看板」家族的第四页。
 *
 * 深空 / 地球 / 海洋三个看板各自忙着展示「数据是什么」，
 * 这一页回答的是另一个维度的问题：「数据是什么时候的」——
 * 每个源最近一次抓取时刻、数据本身描述的时刻、轮换周期与当前状态，
 * 让 18 个免费公开数据源的新鲜度一目了然。
 *
 * 完全复用三个看板现有的 useAstroData / useGeoData / useOceanData，
 * 数据时刻来自各代理在 withCache 统一盖的 fetchedAt 戳 + 载荷自带的时间字段。
 */

import { useEffect, useMemo, useState } from 'react'
import { Button, Card, ConfigProvider, Statistic, Table, Tag, Tooltip, theme as antdTheme } from 'antd'
import { BulbOutlined, MoonOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAstroData } from '../../lib/astro/useAstroData.js'
import { useGeoData } from '../../lib/geo/useGeoData.js'
import { useOceanData } from '../../lib/ocean/useOceanData.js'

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
  'ocean.waves': (d) => withZone(d?.spots?.[0]?.time, '北京时'),
  'ocean.globalWaves': (d) => withZone(d?.spots?.[0]?.time, 'UTC'),
  'ocean.tides': (d) => withZone(d?.events?.[0]?.t, '当地'),
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
      { key: 'co2', name: 'CO₂ 浓度趋势', desc: 'NOAA GML 全球月均二氧化碳', cycle: 12 * 3600_000 },
      { key: 'seaIce', name: '北极海冰范围', desc: 'NSIDC 9 月海冰范围年际序列', cycle: 12 * 3600_000 },
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
    ],
  },
]

/* ---------- 页面 ---------- */

export default function TimelineBoard() {
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

  const stats = useMemo(() => {
    const ok = rows.filter((r) => !r.error && !r.data?.stale && r.data)
    const bad = rows.filter((r) => r.error)
    const wait = rows.filter((r) => !r.data && !r.error)
    const ages = ok.map((r) => now.getTime() - r.data?.fetchedAt).filter(Number.isFinite)
    const freshest = ages.length ? Math.min(...ages) : null
    const oldest = ages.length ? Math.max(...ages) : null
    return { ok: ok.length, bad: bad.length, wait: wait.length, freshest, oldest }
  }, [rows, now])

  const reloadAll = () => {
    astro.reloadAll()
    geo.reloadAll()
    ocean.reloadAll()
  }
  const anyLoading = astro.anyLoading || geo.anyLoading || ocean.anyLoading

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
      title: '数据源',
      dataIndex: 'name',
      render: (_, r) => (
        <Tooltip title={r.desc}>
          <span style={{ fontWeight: 600 }}>{r.name}</span>
        </Tooltip>
      ),
    },
    { title: '轮换周期', dataIndex: 'cycle', width: 96, render: (v) => fmtCycle(v) },
    {
      title: '抓取时刻',
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
      title: '数据时刻',
      key: 'moment',
      width: 250,
      render: (_, r) => {
        const getter = MOMENTS[`${r.boardKey}.${r.key}`]
        const v = getter ? getter(r.data) : null
        return v || '—'
      },
    },
    {
      title: '状态',
      key: 'status',
      width: 90,
      render: (_, r) => {
        if (r.error) return <Tag color="red">出错</Tag>
        if (r.data?.stale) return <Tag color="orange">过期</Tag>
        if (!r.data) return <Tag color="processing">{r.loading ? '等待' : '无数据'}</Tag>
        return <Tag color="green">正常</Tag>
      },
    },
    {
      title: '操作',
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
            <h1 style={{ margin: 0, fontSize: 'clamp(22px, 3vw, 30px)' }}>🕰️ 时间版本</h1>
            <p style={{ margin: '6px 0 0', opacity: 0.72 }}>
              深空 · 地球 · 海洋三大看板 18 个数据源的时间档案——抓取时刻、数据时刻与轮换周期。
            </p>
          </div>
          <Button icon={<ReloadOutlined />} onClick={reloadAll} loading={anyLoading}>
            全部刷新
          </Button>
          <Button
            icon={theme === 'dark' ? <BulbOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
          />
        </div>

        {/* 三钟：本地 / UTC / 儒略日 */}
        <Card size="small" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 48px' }}>
            <Statistic
              title="本地时间"
              valueStyle={{ fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(24px, 3vw, 34px)' }}
              value={fmtClock(now.getTime())}
            />
            <Statistic
              title="UTC"
              valueStyle={{ fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(24px, 3vw, 34px)' }}
              value={`${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`}
            />
            <Statistic
              title="儒略日 JD"
              valueStyle={{ fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(24px, 3vw, 34px)' }}
              value={(now.getTime() / 86400000 + 2440587.5).toFixed(5)}
            />
          </div>
        </Card>

        {/* 健康度概览 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 16 }}>
          <Card size="small"><Statistic title="数据源总数" value={rows.length} /></Card>
          <Card size="small"><Statistic title="正常" value={stats.ok} valueStyle={{ color: '#52c41a' }} /></Card>
          <Card size="small"><Statistic title="出错" value={stats.bad} valueStyle={{ color: stats.bad ? '#ff4d4f' : undefined }} /></Card>
          <Card size="small"><Statistic title="等待中" value={stats.wait} /></Card>
          <Card size="small">
            <Statistic
              title="最新鲜"
              value={stats.freshest == null ? '—' : stats.freshest < 1000 ? '刚刚' : fmtAgo(now.getTime() - stats.freshest, now)}
            />
          </Card>
          <Card size="small">
            <Statistic title="最陈旧" value={stats.oldest == null ? '—' : fmtAgo(now.getTime() - stats.oldest, now)} />
          </Card>
        </div>

        {/* 三大看板的数据源时间档案 */}
        {BOARDS.map((b) => (
          <section key={b.key} style={{ marginTop: 28 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>
              {b.icon} {b.title}
              <span style={{ marginLeft: 10, fontSize: 13, opacity: 0.6 }}>
                {b.sources.length} 个源 · {b.sources.map((s) => s.name).join(' / ')}
              </span>
            </h2>
            <Table
              size="small"
              rowKey="key"
              columns={columns}
              dataSource={b.sources.map((s) => ({ ...s, ...HOOKS[b.key][s.key] }))}
              pagination={false}
            />
          </section>
        ))}

        <footer style={{ marginTop: 36, fontSize: 12, opacity: 0.55 }}>
          「抓取时刻」是本站代理最近一次成功拉取该源的时间（dev server 内存缓存到期后自动重抓）；
          「数据时刻」是载荷自身声明的时间字段，因源而异（发布日 / 采样时刻 / 观测时刻），
          没有自然时间字段的源（如轨道根数、统计档案）以「—」表示。全部数据来自公开免费接口，仅用于科普展示。
        </footer>
      </div>
    </ConfigProvider>
  )
}
