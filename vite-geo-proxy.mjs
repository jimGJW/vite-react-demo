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
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code,' +
      'surface_pressure,precipitation,uv_index,cloud_cover&timezone=Asia%2FShanghai'
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
        feels: w.apparent_temperature ?? null,
        humidity: w.relative_humidity_2m ?? null,
        wind: w.wind_speed_10m ?? null,
        weather: wmoText(w.weather_code),
        pressure: w.surface_pressure ?? null,
        precip: w.precipitation ?? null,
        uv: w.uv_index ?? null,
        cloud: w.cloud_cover ?? null,
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
 * 三种主要温室气体的全球本底浓度（NOAA GML 全球月均，去季节化 trend 列）。
 *
 * 三份文件列定义完全一致（文件头最后一行写明）：
 *   year  month  decimal  average  average_unc  trend  trend_unc
 * 我们取 **trend**（去季节化长期趋势）而非 average（含季节波动的月均值），
 * 这样三条曲线都是平滑的、可直接做「年增幅」比较。
 * 缺测占位为 -9.99 / -999.99，必须过滤，否则会画出一条直插到底的假谷。
 *
 * 工业化前（1750 年）本底值取自 IPCC AR6：CO₂ 278 ppm、CH₄ 722 ppb、N₂O 270 ppb，
 * 用来算「相对工业化前的倍数」——这是比绝对浓度更有传播力的量。
 */
const GHG_DEFS = {
  co2: {
    key: 'co2',
    zh: '二氧化碳 CO₂',
    formula: 'CO₂',
    unit: 'ppm',
    url: 'https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_gl.txt',
    preIndustrial: 278,
    digits: 2,
    color: '#f97316',
    note: '最主要的长寿命温室气体，来自化石燃料燃烧与土地利用变化。',
  },
  ch4: {
    key: 'ch4',
    zh: '甲烷 CH₄',
    formula: 'CH₄',
    unit: 'ppb',
    url: 'https://gml.noaa.gov/webdata/ccgg/trends/ch4/ch4_mm_gl.txt',
    preIndustrial: 722,
    digits: 1,
    color: '#8b5cf6',
    note: '单位质量增温潜势是 CO₂ 的约 28 倍（百年尺度），来自油气泄漏、稻田、反刍动物与湿地。',
  },
  n2o: {
    key: 'n2o',
    zh: '氧化亚氮 N₂O',
    formula: 'N₂O',
    unit: 'ppb',
    url: 'https://gml.noaa.gov/webdata/ccgg/trends/n2o/n2o_mm_gl.txt',
    preIndustrial: 270,
    digits: 2,
    color: '#0ea5e9',
    note: '增温潜势约为 CO₂ 的 265 倍，同时是当前平流层臭氧消耗的首要物质，主要来自化肥施用。',
  },
}

/** NOAA GML 月均文件 → { history:[{ym,value}], latest, growthPerYear, vsPreIndustrial } */
function parseGmlMonthly(txt, def) {
  const history = []
  for (const line of txt.split('\n')) {
    if (line.startsWith('#') || !line.trim()) continue
    const p = line.trim().split(/\s+/)
    if (p.length < 6) continue
    const trend = Number(p[5])
    // -9.99 / -999.99 是缺测占位，直接丢弃
    if (!Number.isFinite(trend) || trend === -9.99 || trend === -999.99) continue
    const ym = `${p[0]}-${String(p[1]).padStart(2, '0')}`
    history.push({ ym, value: Number(trend.toFixed(def.digits)) })
  }
  if (!history.length) throw new Error(`${def.formula} 数据解析为空`)
  const latest = history[history.length - 1]
  const yearAgo = history[history.length - 13] // 与 12 个月前对比
  return {
    ...def,
    history: history.slice(-60),
    latest,
    growthPerYear: yearAgo ? Number((latest.value - yearAgo.value).toFixed(def.digits + 1)) : null,
    vsPreIndustrial: Number((latest.value / def.preIndustrial).toFixed(3)),
  }
}

async function ghg() {
  return withCache('ghg', 12 * 3600_000, async () => {
    const keys = Object.keys(GHG_DEFS)
    const texts = await Promise.all(keys.map((k) => fetchWithTimeout(GHG_DEFS[k].url)))
    const gases = {}
    for (let i = 0; i < keys.length; i++) gases[keys[i]] = parseGmlMonthly(texts[i], GHG_DEFS[keys[i]])
    return { ok: true, gases, order: ['co2', 'ch4', 'n2o'] }
  })
}

/**
 * 全球地表温度距平（NASA GISTEMP v4，陆海综合 LOTI）。
 *
 * CSV 前两行是标题与表头，之后每行一年：
 *   Year,Jan..Dec,J-D,D-N,DJF,MAM,JJA,SON
 * 距平基准为 1951–1980 年均值；缺失月用 '***' 占位（当年未过完的月份）。
 * 年度列取 J-D（1–12 月均值），这是被引用最多的「全球年均温距平」。
 */
async function tempAnomaly() {
  return withCache('temp', 12 * 3600_000, async () => {
    const txt = await fetchWithTimeout(
      'https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv',
    )
    const lines = txt.split('\n').filter((l) => l.trim())
    const annual = []
    const monthly = []
    for (let i = 2; i < lines.length; i++) {
      const p = lines[i].split(',')
      const year = Number(p[0])
      if (!Number.isFinite(year)) continue
      const jd = Number(p[13]) // J-D 年均
      if (Number.isFinite(jd)) annual.push({ year, anom: jd })
      for (let m = 0; m < 12; m++) {
        const v = Number(p[m + 1])
        if (Number.isFinite(v)) monthly.push({ ym: `${year}-${String(m + 1).padStart(2, '0')}`, anom: v })
      }
    }
    if (!annual.length) throw new Error('温度距平解析为空')
    // 最近 12 个「有效月」的滑动均值：比单月更稳，也不受当年未过完的影响
    const last12 = monthly.slice(-12)
    const warmest = annual.reduce((a, b) => (b.anom > a.anom ? b : a))
    return {
      ok: true,
      baseline: '1951–1980 年均值',
      annual,
      monthly: monthly.slice(-120),
      latest12: last12.length
        ? Number((last12.reduce((s, r) => s + r.anom, 0) / last12.length).toFixed(2))
        : null,
      lastYear: annual[annual.length - 1],
      warmest,
    }
  })
}

/**
 * 南北极海冰范围年际序列（NSIDC 海冰指数 v4）。
 *
 * 两极的「代表月」不同，取错月就没有可比性：
 *   · 北极最小值在 **9 月**（夏末）—— N_09_extent_v4.0.csv
 *   · 南极最小值在 **2 月**（南半球夏末）—— S_02_extent_v4.0.csv
 * CSV 首行表头；列：year, mo, source_dataset, region, extent, area（extent 单位百万 km²）。
 *
 * 两极趋势方向相反这件事本身就值得展示：北极急剧缩减，
 * 南极在 2014 年前甚至略有增长，2016 年后才开始快速下滑——
 * 说明海冰变化不是简单的「全球变暖 → 冰都化了」，还受风场与洋流支配。
 */
const ICE_POLES = {
  north: {
    key: 'north',
    zh: '北极',
    month: 9,
    monthLabel: '9 月（夏末最小）',
    url: 'https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/data/N_09_extent_v4.0.csv',
  },
  south: {
    key: 'south',
    zh: '南极',
    month: 2,
    monthLabel: '2 月（夏末最小）',
    url: 'https://noaadata.apps.nsidc.org/NOAA/G02135/south/monthly/data/S_02_extent_v4.0.csv',
  },
}

function parseIceCsv(txt, pole) {
  const history = []
  for (const line of txt.trim().split('\n').slice(1)) {
    const p = line.split(',').map((s) => s.trim())
    const year = Number(p[0])
    const extent = Number(p[4])
    if (Number.isFinite(year) && Number.isFinite(extent)) history.push({ year, extent })
  }
  if (!history.length) throw new Error(`${pole.zh}海冰数据解析为空`)
  const latest = history[history.length - 1]
  const first = history[0]
  const mean = (arr) => (arr.length ? arr.reduce((s, r) => s + r.extent, 0) / arr.length : null)
  const avg1980s = mean(history.filter((h) => h.year >= 1981 && h.year <= 1990))
  const avg2010s = mean(history.filter((h) => h.year >= 2011 && h.year <= 2020))
  return {
    ...pole,
    latest,
    first,
    history,
    declinePct: first ? Number((((latest.extent - first.extent) / first.extent) * 100).toFixed(1)) : null,
    avg1980s: avg1980s && Number(avg1980s.toFixed(2)),
    avg2010s: avg2010s && Number(avg2010s.toFixed(2)),
  }
}

async function seaIce() {
  return withCache('seaice', 12 * 3600_000, async () => {
    const [northTxt, southTxt] = await Promise.all([
      fetchWithTimeout(ICE_POLES.north.url),
      fetchWithTimeout(ICE_POLES.south.url),
    ])
    return {
      ok: true,
      north: parseIceCsv(northTxt, ICE_POLES.north),
      south: parseIceCsv(southTxt, ICE_POLES.south),
    }
  })
}

/**
 * 近 30 天全球强震（M5.5+，EMSC FDSN，minmag 参数由服务端过滤）。
 *
 * 与首页的「24h M2.5+」互补：那条看的是**此刻的脉动**，这条看的是**月尺度活动水平**。
 * 按自然日聚合成柱状，用来判断「最近地震是不是变多了」——
 * 注意全球 M5.5+ 平均约每天 1 次，短期波动属正常，不能据此预报。
 */
async function bigQuakes() {
  return withCache('bigquakes', 30 * 60_000, async () => {
    const start = new Date(Date.now() - 30 * 24 * 3600_000).toISOString().slice(0, 10)
    const txt = await fetchWithTimeout(
      `https://www.seismicportal.eu/fdsnws/event/1/query?format=text&start=${start}&minmag=5.5`,
    )
    const list = txt
      .split('\n')
      .filter((l) => l.trim() && !l.startsWith('#'))
      .map((l) => {
        const p = l.split('|')
        const mag = Number(p[10])
        const lat = Number(p[2])
        const lon = Number(p[3])
        const t = Date.parse(p[1])
        if (!Number.isFinite(mag) || !Number.isFinite(lat) || !Number.isFinite(lon)) return null
        return {
          id: p[0],
          mag,
          place: p[12] || '位置未知',
          time: Number.isFinite(t) ? t : null,
          lat,
          lon,
          depth: Number(p[4]) || null,
          url: `https://www.seismicportal.eu/eventid/${p[0]}`,
        }
      })
      .filter(Boolean)
      .sort((a, b) => (b.time || 0) - (a.time || 0))
    if (!list.length) throw new Error('强震数据为空')
    // 按 UTC 自然日聚合
    const byDay = new Map()
    for (const q of list) {
      const day = new Date(q.time).toISOString().slice(0, 10)
      byDay.set(day, (byDay.get(day) || 0) + 1)
    }
    const days = [...byDay.entries()].map(([day, count]) => ({ day, count })).sort((a, b) => a.day.localeCompare(b.day))
    return {
      ok: true,
      source: 'EMSC',
      windowDays: 30,
      count: list.length,
      perDay: Number((list.length / 30).toFixed(2)),
      strongest: list.reduce((a, b) => (b.mag > a.mag ? b : a)),
      byDay: days,
      quakes: list.slice(0, 30),
    }
  })
}

/**
 * USGS 火山警报（HANS 系统）。
 *
 * 接口只返回「当前警报级高于正常」的火山（YELLOW 及以上），
 * 所以列表为空 = 全美监测网无异常，这本身就是一个有意义的读数。
 *
 * 两套并行的分级，千万别混：
 *   · alert_level  NORMAL / ADVISORY / WATCH / WARNING   —— 面向地面的危险度
 *   · color_code   GREEN / YELLOW / ORANGE / RED         —— 面向航空的色码
 * 两者通常同步，但确实存在不同步的情况，因此分开统计而不是用其中一套推另一套。
 */
async function volcanoes() {
  return withCache('volcanoes', 30 * 60_000, async () => {
    const txt = await fetchWithTimeout(
      'https://volcanoes.usgs.gov/hans-public/api/volcano/getElevatedVolcanoes',
    )
    const raw = JSON.parse(txt)
    if (!Array.isArray(raw)) throw new Error('火山数据格式异常')

    const list = raw
      .map((v) => ({
        name: v.volcano_name || '未知火山',
        cn: VOLCANO_CN[v.volcano_name] || null,
        vnum: v.vnum || null,
        obs: v.obs_fullname || '',
        obsAbbr: v.obs_abbr || '',
        // 观测台中文名，页面要显示「谁在管」
        obsCn: OBS_CN[v.obs_abbr] || v.obs_fullname || '',
        colorCode: v.color_code || null,
        alertLevel: v.alert_level || null,
        noticeType: v.notice_type_cd || null,
        sentUnix: v.sent_unixtime ? v.sent_unixtime * 1000 : null,
        sentUtc: v.sent_utc || null,
        url: v.notice_url || null,
      }))
      .sort((a, b) => (b.sentUnix || 0) - (a.sentUnix || 0))

    const tally = (arr, get) =>
      arr.reduce((acc, x) => {
        const k = get(x)
        if (k) acc[k] = (acc[k] || 0) + 1
        return acc
      }, {})

    // 按观测台聚合：AVO/HVO/CVO 三家分管阿拉斯加、夏威夷、美国本土
    const obsMap = new Map()
    for (const v of list) {
      const cur = obsMap.get(v.obsAbbr) || { abbr: v.obsAbbr, cn: v.obsCn, count: 0 }
      cur.count += 1
      obsMap.set(v.obsAbbr, cur)
    }

    return {
      ok: true,
      source: 'USGS HANS',
      count: list.length,
      byColor: tally(list, (v) => v.colorCode),
      byLevel: tally(list, (v) => v.alertLevel),
      // 有 ORANGE/RED 才算「真在动」，YELLOW 多数只是监测数据偏离背景
      elevated: list.filter((v) => v.colorCode === 'ORANGE' || v.colorCode === 'RED').length,
      // reduce 的初值不能用 null：回调第一次就会读 a.colorCode 直接崩
      highest: list.length
        ? list.reduce((a, b) => (aviationRank(b.colorCode) > aviationRank(a.colorCode) ? b : a))
        : null,
      latestUnix: list.length ? list[0].sentUnix : null,
      byObs: [...obsMap.values()].sort((a, b) => b.count - a.count),
      volcanoes: list,
    }
  })
}

/** 航空色码排序权重：RED > ORANGE > YELLOW > GREEN */
function aviationRank(code) {
  return { RED: 4, ORANGE: 3, YELLOW: 2, GREEN: 1 }[code] || 0
}

/** USGS 三大火山观测台简称 → 中文 */
const OBS_CN = {
  avo: '阿拉斯加火山观测台',
  hvo: '夏威夷火山观测台',
  cvo: '喀斯喀特火山观测台',
  yvo: '黄石火山观测台',
  nmi: '北马里亚纳群岛火山观测台',
}

/** 常见火山名中译（只覆盖高频出现的，其余回落英文原名） */
const VOLCANO_CN = {
  'Great Sitkin': '大锡特金',
  Shishaldin: '希沙尔丁',
  Kilauea: '基拉韦阿',
  'Kīlauea': '基拉韦阿',
  'Mauna Loa': '冒纳罗亚',
  'Mauna Kea': '冒纳凯阿',
  Hualalai: '华拉莱',
  Haleakala: '哈莱阿卡拉',
  Loihi: '罗希',
  Augustine: '奥古斯丁',
  Cleveland: '克利夫兰',
  Okmok: '奥克莫克',
  Bogoslof: '博戈斯洛夫',
  Semisopochnoi: '谢米索波奇诺伊',
  Aniakchak: '阿尼亚克恰克',
  Wrangell: '兰格尔山',
  Redoubt: '里道特',
  Spurr: '斯珀山',
  Novarupta: '诺瓦鲁普塔',
  Katmai: '卡特迈',
  Iliamna: '伊利安纳',
  Veniaminof: '韦尼阿米诺夫',
  Pavlof: '帕夫洛夫',
  Gareloi: '加雷洛伊',
  Tanaga: '塔纳加',
  Atka: '阿特卡',
  Korovin: '科罗温',
  Davidof: '达维多夫',
  Seguam: '塞瓜姆',
  'Mount St. Helens': '圣海伦斯火山',
  'Mt St. Helens': '圣海伦斯火山',
  'Saint Helens': '圣海伦斯火山',
  'Mount Rainier': '雷尼尔山',
  'Mount Hood': '胡德山',
  'Mount Shasta': '沙斯塔山',
  'Lassen Volcanic Center': '拉森火山中心',
  'Long Valley': '长谷火山',
  Yellowstone: '黄石',
  'Mount Baker': '贝克山',
  'Glacier Peak': '冰川峰',
  'Mount Adams': '亚当斯山',
  Newberry: '纽伯里',
  'Medicine Lake': '药湖',
}

/**
 * NOAA 海啸预警公告（tsunami.gov 的 Atom feed）。
 *
 * 两个中心各一个 feed，职责不重叠，必须都拉：
 *   · PHEB  太平洋海啸预警中心（檀香山）—— 负责太平洋及国际水域
 *   · PAAQ  国家海啸预警中心（Palmer, AK）—— 负责美加本土、大西洋与加勒比
 *
 * 一次强震常会同时出现在两个 feed 里（如 M7.7 巴拿马地震），
 * 因此按「中心 + 震级 + 坐标」去重，避免同一事件重复展示。
 *
 * 这里**只输出 Category 原文**（Information / Watch / Advisory / Warning），
 * 不翻译、不分级、不算「威胁数」——等级的中译、颜色与 rank 全部交给前端词典
 * src/lib/earth/glossary.js 的 TSUNAMI_CATEGORIES。
 * 否则同一套分级在服务端和前端各写一份，改一处忘一处必然漂移。
 */
async function tsunami() {
  return withCache('tsunami', 10 * 60_000, async () => {
    const CENTERS = [
      { code: 'PHEB', name: '太平洋海啸预警中心（檀香山）', url: 'https://www.tsunami.gov/events/xml/PHEBAtom.xml' },
      { code: 'PAAQ', name: '国家海啸预警中心（Palmer, 阿拉斯加）', url: 'https://www.tsunami.gov/events/xml/PAAQAtom.xml' },
    ]
    const centers = []
    const events = []

    for (const c of CENTERS) {
      let txt
      try {
        txt = await fetchWithTimeout(c.url, { timeout: 15000 })
      } catch (e) {
        centers.push({ ...c, ok: false, error: String(e && e.message), entryCount: 0 })
        continue
      }
      const entries = [...txt.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => m[1])
      centers.push({
        code: c.code,
        name: c.name,
        url: c.url,
        ok: true,
        entryCount: entries.length,
        title: stripTags(pick(txt, /<title>([\s\S]*?)<\/title>/)).trim(),
        updated: pick(txt, /<updated>([\s\S]*?)<\/updated>/),
      })
      for (const e of entries) {
        const ev = parseTsunamiEntry(e, c.code)
        if (ev) events.push(ev)
      }
    }

    if (!centers.some((c) => c.ok)) throw new Error('两个海啸中心均无响应')

    // 去重：同一中心 + 同震级 + 同坐标视为同一条
    const seen = new Set()
    const uniq = events.filter((ev) => {
      const k = `${ev.center}|${ev.magnitude}|${ev.lat}|${ev.lon}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    // 服务端按时间倒序即可；「哪个更危险」由前端词典的 rank 决定
    uniq.sort((a, b) => (b.updatedUnix || 0) - (a.updatedUnix || 0))

    return {
      ok: true,
      source: 'NOAA tsunami.gov',
      centers,
      count: uniq.length,
      latest: uniq[0] || null,
      events: uniq.slice(0, 12),
    }
  })
}

/** 从 Atom 的 <entry> 文本里抽出结构化海啸事件 */
function parseTsunamiEntry(xml, center) {
  const category = stripTags(pick(xml, /<strong>Category:<\/strong>([\s\S]*?)<br\/>/)).trim()
  const region = stripTags(pick(xml, /<title>([\s\S]*?)<\/title>/)).trim()
  const lat = Number(pick(xml, /<geo:lat>([\s\S]*?)<\/geo:lat>/))
  const lon = Number(pick(xml, /<geo:long>([\s\S]*?)<\/geo:long>/))
  const updated = pick(xml, /<updated>([\s\S]*?)<\/updated>/)
  const magRaw = stripTags(pick(xml, /<strong>Preliminary Magnitude: ?<\/strong>([\s\S]*?)<br\/>/)).trim()
  const depthRaw = stripTags(pick(xml, /<strong>Preliminary(?:\s+)Depth: ?<\/strong>([\s\S]*?)<br\/>/)).trim()
  const areaRaw = stripTags(pick(xml, /<strong>Affected Region: ?<\/strong>([\s\S]*?)<br\/>/)).trim()
  const bulletinRaw = stripTags(pick(xml, /<strong>Bulletin Issue Time: ?<\/strong>([\s\S]*?)<br\/>/)).trim()
  const noteRaw = stripTags(pick(xml, /<b>Note:<\/b>([\s\S]*?)<br\/>/)).trim()
  const definition = stripTags(pick(xml, /<strong>Definition: ?<\/strong>([\s\S]*?)<a /)).trim()
  const bulletinUrl = pick(xml, /href="([^"]*\.txt)"/)

  if (!category && !region && !Number.isFinite(lat)) return null
  return {
    center,
    centerCn: center === 'PHEB' ? '太平洋中心' : '国家中心',
    category,
    // Affected Region 与 entry title 都常带 "in " 前缀（如 "in Panama"），统一去掉
    region: (areaRaw || region || '未注明区域').replace(/^in\s+/i, ''),
    lat: Number.isFinite(lat) ? lat : null,
    lon: Number.isFinite(lon) ? lon : null,
    magnitude: magRaw || null,
    depth: depthRaw || null,
    bulletinTime: bulletinRaw || null,
    note: noteRaw || null,
    definition: definition || null,
    bulletinUrl: bulletinUrl || null,
    updated: updated || null,
    updatedUnix: updated ? Date.parse(updated) : null,
  }
}

/** 正则取第一个捕获组，取不到返回空串 */
function pick(text, re) {
  const m = String(text || '').match(re)
  return m ? m[1].trim() : ''
}

/** 去掉 HTML 标签并压缩空白（Atom 的 summary 是 xhtml 片段） */
function stripTags(s) {
  return String(s || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
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
    '/api/geo/ghg': ghg,
    '/api/geo/co2': ghg, // 旧路径别名：CO₂ 已并入温室气体三兄弟
    '/api/geo/temp-anomaly': tempAnomaly,
    '/api/geo/sea-ice': seaIce,
    '/api/geo/big-quakes': bigQuakes,
    '/api/geo/volcanoes': volcanoes,
    '/api/geo/tsunami': tsunami,
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
