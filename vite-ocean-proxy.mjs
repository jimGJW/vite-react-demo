/**
 * 海洋数据聚合中间件（仅 dev server，生产产物不含）。
 *
 * 与 vite-astro-proxy.mjs / vite-geo-proxy.mjs 同一套设计约定：
 * 服务端转发解决 CORS、统一超时、单源失败降级、内存缓存控频。
 * 「天上 / 地下 / 海洋」三兄弟：/astro 看天，/geo 看地，/ocean 看海。
 *
 * 源清单（全部为免密钥的权威公开接口，均已在写码前 curl 实测通过）：
 *   海浪海温   Open-Meteo Marine   近海点浪高/浪向/周期/海表温度 + 24h 浪高预报
 *   潮位实测   NOAA CO-OPS         旧金山站过去 24h 水位（6 分钟采样）
 *   高低潮预报 NOAA CO-OPS         未来 48h 高潮/低潮时刻与潮高
 *   厄尔尼诺   NOAA CPC            ONI 海温距平指数（Niño 3.4 区 3 月滑动均值）
 *
 * 曾经的候选 NDBC 浮标（www.ndbc.noaa.gov/data/realtime2/*.txt）在本网络环境
 * 连接被重置（HTTP 000），与 earthquake.usgs.gov 同症，弃用。
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
        'User-Agent': 'vite-react-demo/ocean-board/1.0 (local dev)',
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

/** Date → 'YYYYMMDD'（CO-OPS 的 begin_date/end_date 格式） */
function fmtDay(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
}

/* ---------------- 近海观测点：海浪与海温共用 ---------------- */

const SPOTS = [
  { key: 'qingdao', name: '青岛外海', lat: 36.07, lon: 120.38 },
  { key: 'yangtze', name: '长江口', lat: 31.0, lon: 122.5 },
  { key: 'xiamen', name: '厦门近海', lat: 24.0, lon: 118.6 },
  { key: 'shenzhen', name: '珠江口', lat: 21.8, lon: 113.8 },
  { key: 'sanya', name: '三亚南部', lat: 17.8, lon: 109.5 },
]

const LAT_STR = SPOTS.map((s) => s.lat).join(',')
const LON_STR = SPOTS.map((s) => s.lon).join(',')

/** 浪向角（°）→ 8 方位中文 */
const DIRS = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
function dirText(deg) {
  if (!Number.isFinite(deg)) return '—'
  return DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8]
}

/* ---------------- 数据源实现 ---------------- */

/**
 * 近海海况：Open-Meteo Marine API，多点一次请求。
 * current：浪高/浪向/平均周期/海表温度；hourly：未来 24h 浪高预报。
 * 这是网格化再分析+预报数据，近海点已足够代表该海域。
 */
async function waves() {
  return withCache('waves', 30 * 60_000, async () => {
    const url =
      `https://marine-api.open-meteo.com/v1/marine?latitude=${LAT_STR}&longitude=${LON_STR}` +
      '&current=wave_height,wave_direction,wave_period,sea_surface_temperature' +
      '&hourly=wave_height&forecast_days=2&timezone=Asia%2FShanghai'
    const d = JSON.parse(await fetchWithTimeout(url))
    const list = Array.isArray(d) ? d : [d]
    const spots = SPOTS.map((s, i) => {
      const cur = list[i]?.current || {}
      const hourly = list[i]?.hourly || {}
      // 取「当前时刻起」未来 24h 的浪高预报（time 为本地 ISO 时串，逐点对齐）
      const nowT = String(cur.time || '')
      const series = []
      if (Array.isArray(hourly.time)) {
        const start = hourly.time.findIndex((t) => t >= nowT)
        for (let k = start >= 0 ? start : 0; k < (hourly.time?.length || 0) && series.length < 24; k++) {
          series.push({ t: hourly.time[k], h: hourly.wave_height?.[k] ?? null })
        }
      }
      return {
        ...s,
        waveHeight: cur.wave_height ?? null,
        waveDir: cur.wave_direction ?? null,
        waveDirText: dirText(cur.wave_direction),
        wavePeriod: cur.wave_period ?? null,
        sst: cur.sea_surface_temperature ?? null,
        time: cur.time || null,
        forecast: series,
      }
    })
    const valid = spots.filter((s) => Number.isFinite(s.waveHeight))
    return {
      ok: true,
      spots,
      maxWave: valid.length ? Math.max(...valid.map((s) => s.waveHeight)) : null,
      avgSst: (() => {
        const t = spots.filter((s) => Number.isFinite(s.sst))
        return t.length ? Number((t.reduce((a, s) => a + s.sst, 0) / t.length).toFixed(1)) : null
      })(),
    }
  })
}

/**
 * 潮位实测：NOAA CO-OPS 旧金山站（9414290），过去 24h、6 分钟采样（约 240 点）。
 * datum=MLLW（平均较低低潮面），v 单位米，q='p' 表示预审值（正常可用）。
 * 旧金山潮差约 1.8m，曲线起伏明显，比檀香山（~0.6m）更适合展示。
 */
async function tides() {
  return withCache('tides', 6 * 60_000, async () => {
    const begin = fmtDay(new Date(Date.now() - 24 * 3600_000))
    const end = fmtDay(new Date())
    const url =
      `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=water_level` +
      `&application=vite-react-demo&begin_date=${begin}&end_date=${end}` +
      `&datum=MLLW&station=9414290&time_zone=lst_ldt&units=metric&format=json`
    const d = JSON.parse(await fetchWithTimeout(url))
    if (!d.data || !d.data.length) throw new Error('CO-OPS 水位数据为空')
    const series = d.data
      .map((r) => ({ t: r.t, v: Number(r.v) }))
      .filter((p) => Number.isFinite(p.v))
    const latest = series[series.length - 1]
    return {
      ok: true,
      station: { id: d.metadata?.id, name: d.metadata?.name, lat: d.metadata?.lat, lon: d.metadata?.lon },
      latest,
      series,
    }
  })
}

/**
 * 高低潮预报：NOAA CO-OPS predictions，interval=hilo，未来 48h。
 * type: 'H'=高潮 / 'L'=低潮。页面用它给出「下次高潮/低潮还有多久」。
 */
async function tidePred() {
  return withCache('tidepred', 60 * 60_000, async () => {
    const begin = fmtDay(new Date())
    const end = fmtDay(new Date(Date.now() + 48 * 3600_000))
    const url =
      `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions` +
      `&application=vite-react-demo&begin_date=${begin}&end_date=${end}` +
      `&datum=MLLW&station=9414290&time_zone=lst_ldt&units=metric&interval=hilo&format=json`
    const d = JSON.parse(await fetchWithTimeout(url))
    if (!d.predictions || !d.predictions.length) throw new Error('潮汐预报数据为空')
    const events = d.predictions.map((p) => ({
      t: p.t,
      v: Number(p.v),
      type: p.type === 'H' ? 'H' : 'L',
    }))
    return { ok: true, station: d.metadata?.name || 'San Francisco', events }
  })
}

/**
 * 厄尔尼诺/拉尼娜指数（ONI）：NOAA CPC 官方定义。
 * Niño 3.4 区（5N-5S, 170W-120W）海温距平的 3 个月滑动均值；
 * 连续 5 个滑动季 ≥ +0.5 判厄尔尼诺、≤ −0.5 判拉尼娜。
 * 强度分级：|ONI| 0.5~0.9 弱 / 1.0~1.4 中等 / 1.5~1.9 强 / ≥2.0 超强。
 * 文本列：SEAS YR SST ANOM（空格分隔），取最近 20 季（5 年）。
 */
async function oni() {
  return withCache('oni', 12 * 3600_000, async () => {
    const txt = await fetchWithTimeout('https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt')
    const rows = txt
      .split('\n')
      .filter((l) => l.trim() && !l.startsWith('SEAS'))
      .map((l) => {
        const p = l.trim().split(/\s+/)
        return { season: p[0], year: Number(p[1]), sst: Number(p[2]), anom: Number(p[3]) }
      })
      .filter((r) => Number.isFinite(r.anom))
      .slice(-20)
    if (!rows.length) throw new Error('ONI 解析为空')
    const last = rows[rows.length - 1]
    // 按 NOAA 官方阈值给当前状态
    const a = last.anom
    let state = '中性'
    if (a >= 2.0) state = '超强厄尔尼诺'
    else if (a >= 1.5) state = '强厄尔尼诺'
    else if (a >= 1.0) state = '中等厄尔尼诺'
    else if (a >= 0.5) state = '弱厄尔尼诺'
    else if (a <= -2.0) state = '超强拉尼娜'
    else if (a <= -1.5) state = '强拉尼娜'
    else if (a <= -1.0) state = '中等拉尼娜'
    else if (a <= -0.5) state = '弱拉尼娜'
    return { ok: true, latest: last, state, history: rows }
  })
}

/**
 * 全球 10 海域浪况速览：Open-Meteo Marine 多点一次请求（UTC 时区，海域无本地时）。
 * 覆盖马六甲/好望角/比斯开湾/白令海/几内亚湾/孟加拉湾/加勒比/日本以南/塔斯曼/阿拉斯加湾。
 * 实测白令海冬季浪高可达 5m+，是全球最凶险海域之一。
 */
async function globalWaves() {
  return withCache('gwaves', 30 * 60_000, async () => {
    const SPOT_LIST = [
      { name: '马六甲海峡', lat: 2.5, lon: 101.0 },
      { name: '好望角', lat: -35.0, lon: 20.0 },
      { name: '比斯开湾', lat: 45.5, lon: -5.0 },
      { name: '白令海', lat: 56.0, lon: -170.0 },
      { name: '几内亚湾', lat: 3.0, lon: 5.0 },
      { name: '孟加拉湾', lat: 15.0, lon: 88.0 },
      { name: '加勒比海', lat: 15.0, lon: -70.0 },
      { name: '日本以南海域', lat: 32.0, lon: 135.0 },
      { name: '塔斯曼海', lat: -38.0, lon: 160.0 },
      { name: '阿拉斯加湾', lat: 55.0, lon: -145.0 },
    ]
    const url =
      `https://marine-api.open-meteo.com/v1/marine?latitude=${SPOT_LIST.map((s) => s.lat).join(',')}` +
      `&longitude=${SPOT_LIST.map((s) => s.lon).join(',')}` +
      '&current=wave_height,wave_direction,wave_period&timezone=UTC'
    const d = JSON.parse(await fetchWithTimeout(url))
    const list = Array.isArray(d) ? d : [d]
    const spots = SPOT_LIST.map((s, i) => ({
      ...s,
      waveHeight: list[i]?.current?.wave_height ?? null,
      waveDir: list[i]?.current?.wave_direction ?? null,
      waveDirText: dirText(list[i]?.current?.wave_direction),
      wavePeriod: list[i]?.current?.wave_period ?? null,
      time: list[i]?.current?.time || null,
    }))
      .filter((s) => Number.isFinite(s.waveHeight))
      .sort((a, b) => b.waveHeight - a.waveHeight) // 浪大的排前面，一眼看到全球最凶海域
    return { ok: true, spots }
  })
}

/** dev 中间件：/api/ocean/* → 各数据源 */
export function serveOceanData() {
  const SOURCES = {
    '/api/ocean/waves': waves,
    '/api/ocean/tides': tides,
    '/api/ocean/tide-pred': tidePred,
    '/api/ocean/oni': oni,
    '/api/ocean/global-waves': globalWaves,
  }
  return {
    name: 'serve-ocean-data',
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
