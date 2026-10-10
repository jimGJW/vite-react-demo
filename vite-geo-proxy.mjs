/**
 * 地球数据聚合中间件（仅 dev server，生产产物不含）。
 *
 * 与 vite-astro-proxy.mjs 同一套设计约定（见该文件头部注释）：
 * 服务端转发解决 CORS、统一超时、单源失败降级、内存缓存控频。
 * 这里不复用 astro 的内部工具，独立实现一份精简版，避免两个页面耦合。
 *
 * 「天上 / 地下」配对：/astro 看天，/geo 看地。
 *
 * 源清单（全部为免密钥的权威公开接口）：
 *   地震速报   USGS FDSN          过去 24h M2.5+ 地震（GeoJSON）
 *   地球影像   NASA EPIC          DSCOVR 卫星整圆盘地球照片（站点自有 API，无 key）
 *   城市环境   Open-Meteo         天气实况 + 空气质量（一次请求查多城）
 *   CO2 趋势   NOAA GML           全球月均二氧化碳浓度（文本解析）
 *   海冰范围   NSIDC/NOAA         北极 9 月海冰范围年际序列（CSV 解析）
 */

const FETCH_TIMEOUT = 12000
const cache = new Map()

async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), opts.timeout || FETCH_TIMEOUT)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'vite-react-demo/geo-board/1.0 (local dev)',
        Accept: 'application/json, text/plain, */*',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

async function withCache(key, ttlMs, fetcher) {
  const hit = cache.get(key)
  const now = Date.now()
  if (hit && now - hit.at < ttlMs) return hit.value
  try {
    const value = await fetcher()
    if (value && typeof value === 'object' && !Array.isArray(value)) value.fetchedAt = now
    cache.set(key, { at: now, value })
    return value
  } catch (e) {
    if (hit) return { ...hit.value, stale: true, error: String(e && e.message) }
    return { __error: String(e && e.message) }
  }
}

/* ---------------- 城市清单：天气与空气共用同一组坐标 ---------------- */

const CITIES = [
  { key: 'beijing', name: '北京', lat: 39.9042, lon: 116.4074 },
  { key: 'shanghai', name: '上海', lat: 31.2304, lon: 121.4737 },
  { key: 'guangzhou', name: '广州', lat: 23.1291, lon: 113.2644 },
  { key: 'chengdu', name: '成都', lat: 30.5728, lon: 104.0668 },
  { key: 'lhasa', name: '拉萨', lat: 29.652, lon: 91.1721 },
]

/** Open-Meteo 多点查询用逗号串；返回数组顺序与传入顺序一致 */
const LAT_STR = CITIES.map((c) => c.lat).join(',')
const LON_STR = CITIES.map((c) => c.lon).join(',')

/** WMO 天气码 → 中文短语（常用子集，其余回落「多云/未知」） */
const WMO_CODE = {
  0: '晴', 1: '基本晴', 2: '局部多云', 3: '阴',
  45: '雾', 48: '雾凇',
  51: '毛毛雨', 53: '毛毛雨', 55: '浓毛毛雨',
  61: '小雨', 63: '中雨', 65: '大雨',
  71: '小雪', 73: '中雪', 75: '大雪',
  80: '阵雨', 81: '阵雨', 82: '强阵雨',
  95: '雷阵雨', 96: '雷阵雨伴冰雹', 99: '雷阵雨伴冰雹',
}

function wmoText(code) {
  return WMO_CODE[code] ?? (code == null ? '—' : '多云')
}

/* ---------------- 数据源实现 ---------------- */

/**
 * 过去 24h 全球地震（M2.5+ 附近）。
 *
 * 主源 EMSC（欧洲地中海地震中心）实时地震目录 fdsnws-event：
 *   https://www.seismicportal.eu/fdsnws/event/1/query?format=text&start=<ISO日期>
 * 返回管道分隔文本（# 开头一行表头），列：
 *   EventID|Time|Latitude|Longitude|Depth/km|Author|Catalog|Contributor|ContributorID|MagType|Magnitude|MagAuthor|EventLocationName
 *
 * 为什么不直接用 USGS：earthquake.usgs.gov 在部分网络环境 SSL 握手被断
 * （实测 exit 35 / fetch failed），EMSC 汇聚全球台网（含 USGS NEIC 贡献），
 * 覆盖面等效且可达。EMSC 失败时仍会尝试 USGS 作为兜底。
 */
async function quakes() {
  return withCache('quakes', 2 * 60_000, async () => {
    const start = new Date(Date.now() - 24 * 3600_000).toISOString().slice(0, 10)
    const parseText = (txt) =>
      txt
        .split('\n')
        .filter((l) => l.trim() && !l.startsWith('#'))
        .map((l) => {
          const p = l.split('|')
          const t = Date.parse(p[1])
          const lat = Number(p[2])
          const lon = Number(p[3])
          const depth = Number(p[4])
          const mag = Number(p[10])
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
          return {
            id: p[0],
            mag: Number.isFinite(mag) ? mag : null,
            place: p[12] || '位置未知',
            time: Number.isFinite(t) ? t : null,
            lon,
            lat,
            depth: Number.isFinite(depth) ? depth : null,
            url: `https://www.seismicportal.eu/eventid/${p[0]}`,
          }
        })
        .filter(Boolean)
        .sort((a, b) => (b.time || 0) - (a.time || 0))

    let list = []
    let src = 'EMSC'
    try {
      list = parseText(
        await fetchWithTimeout(
          `https://www.seismicportal.eu/fdsnws/event/1/query?format=text&start=${start}`,
        ),
      )
    } catch {
      // 兜底：USGS GeoJSON（部分网络不可达，失败则整源报错由前端降级）
      const gj = JSON.parse(
        await fetchWithTimeout(
          'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
        ),
      )
      list = (gj.features || [])
        .map((f) => ({
          id: f.id,
          mag: f.properties?.mag ?? null,
          place: f.properties?.place ?? '位置未知',
          time: f.properties?.time,
          lon: f.geometry?.coordinates?.[0],
          lat: f.geometry?.coordinates?.[1],
          depth: f.geometry?.coordinates?.[2] ?? null,
          url: f.properties?.url ?? null,
        }))
        .filter((q) => Number.isFinite(q.lon) && Number.isFinite(q.lat))
        .sort((a, b) => (b.time || 0) - (a.time || 0))
      src = 'USGS'
    }
    // M2.5 以下事件太多会淹没地图；保留 M2.5+，但不足以淹没时全保留
    const big = list.filter((q) => (q.mag || 0) >= 2.5)
    const finalList = big.length >= 10 ? big : list
    return { ok: true, source: src, count: finalList.length, quakes: finalList }
  })
}

/**
 * NASA EPIC 整圆盘地球影像（DSCOVR 卫星，日地 L1 点拍摄）。
 * epic.gsfc.nasa.gov 是站点自有 API，不需要 api_key（与 api.nasa.gov 不同）。
 * 一天更新一次、每天约 12~22 帧，取最新日期的最后 4 帧（最新一张在最前）。
 */
async function epic() {
  return withCache('epic', 3600_000, async () => {
    const list = JSON.parse(await fetchWithTimeout('https://epic.gsfc.nasa.gov/api/natural'))
    if (!Array.isArray(list) || list.length === 0) throw new Error('EPIC 返回为空')
    const date = list[0].date.slice(0, 10) // '2026-10-09 12:00:00' → 日期
    const [y, m, d] = date.split('-')
    const frames = list
      .slice()
      .reverse() // API 升序 → 倒序取最新
      .slice(0, 4)
      .map((it) => ({
        identifier: it.identifier,
        image: it.image, // 'epic_1b_20261007001752' —— archive 文件名用这个字段
        time: it.date,
        caption: (it.caption || '').trim(),
        // archive 直链实测返回 image/jpeg（约 200KB），浏览器可直接加载；
        // 注意文件名是 image 字段而不是 identifier——用错会 404 出 ORB 拦截报错
        url: `https://epic.gsfc.nasa.gov/archive/natural/${y}/${m}/${d}/jpg/${it.image}.jpg`,
        // thumbs 缩略图（约 6KB）给胶片条用，实测 HTTP 200 image/jpeg
        thumb: `https://epic.gsfc.nasa.gov/archive/natural/${y}/${m}/${d}/thumbs/${it.image}.jpg`,
      }))
    return {
      ok: true,
      date,
      frames,
    }
  })
}

/**
 * 城市环境实况：天气 + 空气质量两条 Open-Meteo 免 key 接口，多城市一次请求。
 * european_aqi 是欧洲标准 AQI（0-20 优 / 20-40 良 / 40-60 轻 / 60-80 中 / 80-100 差 / >100 严重）。
 */
async function env() {
  return withCache('env', 10 * 60_000, async () => {
    const wxUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT_STR}&longitude=${LON_STR}` +
      '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Asia%2FShanghai'
    const aqUrl =
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT_STR}&longitude=${LON_STR}` +
      '&current=pm2_5,pm10,ozone,european_aqi&timezone=Asia%2FShanghai'
    const [wx, aq] = await Promise.all([
      fetchWithTimeout(wxUrl).then((t) => JSON.parse(t)),
      fetchWithTimeout(aqUrl).then((t) => JSON.parse(t)).catch(() => null),
    ])
    const wxList = Array.isArray(wx) ? wx : [wx]
    const aqList = aq ? (Array.isArray(aq) ? aq : [aq]) : []
    const cities = CITIES.map((c, i) => {
      const w = wxList[i]?.current || {}
      const a = aqList[i]?.current || {}
      return {
        ...c,
        temp: w.temperature_2m ?? null,
        humidity: w.relative_humidity_2m ?? null,
        wind: w.wind_speed_10m ?? null,
        weather: wmoText(w.weather_code),
        pm25: a.pm2_5 ?? null,
        pm10: a.pm10 ?? null,
        o3: a.ozone ?? null,
        aqi: a.european_aqi ?? null,
        time: w.time || null,
      }
    })
    return { ok: true, cities }
  })
}

/**
 * NOAA GML 全球 CO2 浓度（co2_trend_gl.txt）。
 * 注意：这是【日值】文件，列：year month day smoothed trend
 * （smoothed = 平滑季节曲线后浓度，trend = 去季节化长期趋势）。
 * 数据行以空格开头，必须先 trim 再切列（否则 p[0] 是空串导致整体错位）。
 * 按月对 trend 取均值 → 最近 60 个月趋势线。
 */
async function co2() {
  return withCache('co2', 12 * 3600_000, async () => {
    const txt = await fetchWithTimeout('https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_trend_gl.txt')
    const byMonth = new Map() // 'YYYY-MM' → { sum, n }
    for (const line of txt.split('\n')) {
      if (line.startsWith('#') || !line.trim()) continue
      const p = line.trim().split(/\s+/)
      if (p.length < 5) continue
      const trend = Number(p[4])
      if (!Number.isFinite(trend) || trend === -99.99) continue // -99.99 是缺测值
      const ym = `${p[0]}-${String(p[1]).padStart(2, '0')}`
      const acc = byMonth.get(ym) || { sum: 0, n: 0 }
      acc.sum += trend
      acc.n += 1
      byMonth.set(ym, acc)
    }
    const history = [...byMonth.entries()]
      .map(([ym, { sum, n }]) => ({ ym, ppm: Number((sum / n).toFixed(2)) }))
      .slice(-60)
    if (history.length === 0) throw new Error('CO2 数据解析为空')
    const latest = history[history.length - 1]
    // 年增幅：与 12 个月前对比
    const yearAgo = history[history.length - 13]
    return {
      ok: true,
      latest: { ...latest },
      growthPerYear: yearAgo ? Number((latest.ppm - yearAgo.ppm).toFixed(2)) : null,
      history,
    }
  })
}

/**
 * NSIDC 北极 9 月海冰范围年际序列（1979–最新）。
 * 每年 9 月是海冰最小值月份，是气候变化最经典的指标之一。
 * CSV 首行表头；列：year mo data-type region extent area。
 */
async function seaIce() {
  return withCache('seaice', 12 * 3600_000, async () => {
    const txt = await fetchWithTimeout(
      'https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/data/N_09_extent_v4.0.csv',
    )
    const lines = txt.trim().split('\n').slice(1)
    const history = []
    for (const line of lines) {
      const p = line.split(',').map((s) => s.trim())
      const year = Number(p[0])
      const extent = Number(p[4]) // 百万平方公里
      if (Number.isFinite(year) && Number.isFinite(extent)) history.push({ year, extent })
    }
    if (history.length === 0) throw new Error('海冰数据解析为空')
    const latest = history[history.length - 1]
    const first = history[0]
    const avg1980s = history.filter((h) => h.year >= 1981 && h.year <= 1990)
    const avg2010s = history.filter((h) => h.year >= 2011 && h.year <= 2020)
    const mean = (arr) => (arr.length ? arr.reduce((s, r) => s + r.extent, 0) / arr.length : null)
    return {
      ok: true,
      latest,
      first,
      declinePct: first ? Number((((latest.extent - first.extent) / first.extent) * 100).toFixed(1)) : null,
      avg1980s: mean(avg1980s) && Number(mean(avg1980s).toFixed(2)),
      avg2010s: mean(avg2010s) && Number(mean(avg2010s).toFixed(2)),
      history,
    }
  })
}

/**
 * NASA EONET 自然事件（近 30 天进行中）：野火/强风暴/火山/海冰等，
 * 免密钥。geometry 取最后一个坐标（事件可能多次更新位置）。
 * 用于「自然事件」页签：世界地图落点 + 事件列表，与地震图同套投影。
 */
async function eonet() {
  return withCache('eonet', 3600_000, async () => {
    const d = JSON.parse(
      await fetchWithTimeout('https://eonet.gsfc.nasa.gov/api/v3/events?days=30&status=open&limit=60'),
    )
    const events = (d.events || [])
      .map((ev) => {
        const geo = ev.geometry || []
        const last = geo[geo.length - 1]
        const c = last?.coordinates || []
        const lon = Number(c[0])
        const lat = Number(c[1])
        return {
          id: ev.id,
          title: ev.title || '未命名事件',
          cat: ev.categories?.[0]?.title || '其他',
          catId: ev.categories?.[0]?.id || 'other',
          lon,
          lat,
          time: last?.date || null,
          link: ev.link || null,
        }
      })
      .filter((e) => Number.isFinite(e.lon) && Number.isFinite(e.lat))
    return { ok: true, count: events.length, events }
  })
}

/** dev 中间件：/api/geo/* → 各数据源 */
export function serveGeoData() {
  const SOURCES = {
    '/api/geo/quakes': quakes,
    '/api/geo/epic': epic,
    '/api/geo/env': env,
    '/api/geo/co2': co2,
    '/api/geo/sea-ice': seaIce,
    '/api/geo/eonet': eonet,
  }
  return {
    name: 'serve-geo-data',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url || '').split('?')[0]
        const fn = SOURCES[pathname]
        if (!fn) return next()
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        try {
          const data = await fn()
          if (data && data.__error) {
            res.statusCode = 502
            res.end(JSON.stringify({ ok: false, error: data.__error }))
          } else {
            res.statusCode = 200
            res.end(JSON.stringify(data))
          }
        } catch (e) {
          res.statusCode = 502
          res.end(JSON.stringify({ ok: false, error: String(e && e.message) }))
        }
      })
    },
  }
}
