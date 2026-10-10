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
 * 关于 NDBC：早期尝试的 realtime2/<站号>.txt 单站文件常达 600 KB（45 天逐小时），
 * 多站并行会拖垮首屏，因此改用 latest_obs.txt（全站最新一行，约 100 KB）。
 * 不要用逐站 txt 拼全球视图——那是为了看单站历史曲线准备的。
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
      '&current=wave_height,wave_direction,wave_period,sea_surface_temperature,' +
      // 涌浪（swell）与风浪（wind wave）分开取：这是海浪里最常被混为一谈的两个概念
      'swell_wave_height,swell_wave_period,swell_wave_direction,' +
      'wind_wave_height,wind_wave_period' +
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
        // 涌浪：别处风场生成后传过来的长周期波；风浪：本地风直接吹出来的短周期波
        swellHeight: cur.swell_wave_height ?? null,
        swellPeriod: cur.swell_wave_period ?? null,
        swellDir: cur.swell_wave_direction ?? null,
        swellDirText: dirText(cur.swell_wave_direction),
        windWaveHeight: cur.wind_wave_height ?? null,
        windWavePeriod: cur.wind_wave_period ?? null,
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

/**
 * 活跃热带气旋（NOAA NHC 大西洋 / 东太平洋实时风暴清单）。
 *
 * NHC 的 CurrentStorms.json 免密钥，字段里已经给了 numeric 经纬度，不用解析 '32.8N' 这种串。
 * classification 用的是 NHC 内部缩写（DB/LO/TD/TS/HU/PTC/EX…），前端有术语表翻译。
 * intensity 单位是 **节（kt）**，萨菲尔–辛普森等级按 1 分钟持续风速划分。
 *
 * 覆盖范围要说清楚：NHC 只管北大西洋与东太平洋。
 * 西太平洋（影响我国的台风）由 JTWC / 日本气象厅 / 中央气象台发布，本源不包含。
 */
const CYCLONE_CLASS = {
  DB: '扰动', LO: '低压区', WV: '热带波', TD: '热带低压', TS: '热带风暴',
  SS: '副热带风暴', SD: '副热带低压', HU: '飓风', PTC: '潜在热带气旋',
  EX: '温带气旋', PT: '后热带气旋', PS: '后热带气旋', MD: '季风低压',
}

/** 1 分钟持续风速（kt）→ 萨菲尔–辛普森等级 */
function saffirSimpson(kt) {
  if (!Number.isFinite(kt) || kt < 34) return null
  if (kt <= 63) return { level: 'TS', zh: '热带风暴', cat: 0, color: '#38bdf8' }
  if (kt <= 82) return { level: 'C1', zh: '一级飓风', cat: 1, color: '#22c55e' }
  if (kt <= 95) return { level: 'C2', zh: '二级飓风', cat: 2, color: '#eab308' }
  if (kt <= 112) return { level: 'C3', zh: '三级飓风', cat: 3, color: '#f97316' }
  if (kt <= 136) return { level: 'C4', zh: '四级飓风', cat: 4, color: '#ef4444' }
  return { level: 'C5', zh: '五级飓风', cat: 5, color: '#a21caf' }
}

async function cyclones() {
  return withCache('cyclones', 10 * 60_000, async () => {
    const d = JSON.parse(await fetchWithTimeout('https://www.nhc.noaa.gov/CurrentStorms.json'))
    const raw = d.activeStorms || []
    const storms = raw
      .map((s) => {
        const kt = Number(s.intensity)
        const lat = Number(s.latitudeNumeric)
        const lon = Number(s.longitudeNumeric)
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
        // 洋盆按 NHC 的编号前缀判定（al=北大西洋 / ep=东北太平洋）。
        // 不能用经度硬猜：东太平洋与北大西洋都在西经，边界还在移动。
        const idPre = String(s.id || '').slice(0, 2).toLowerCase()
        const binPre = String(s.binNumber || '').slice(0, 2).toLowerCase()
        const basin = idPre === 'ep' || binPre === 'ep' ? 'EP' : 'AT'
        return {
          basin,
          basinZh: basin === 'EP' ? '东北太平洋' : '北大西洋',
          id: s.id,
          name: s.name || '未命名',
          bin: s.binNumber || '',
          class: s.classification || '—',
          classZh: CYCLONE_CLASS[s.classification] || s.classification || '—',
          intensityKt: Number.isFinite(kt) ? kt : null,
          intensityMs: Number.isFinite(kt) ? Number((kt * 0.5144).toFixed(1)) : null,
          pressure: Number(s.pressure) || null,
          lat,
          lon,
          moveDir: s.movementDir ?? null,
          moveSpeedKt: s.movementSpeed ?? null,
          lastUpdate: s.lastUpdate || null,
          advisory: s.publicAdvisory?.url || null,
          scale: saffirSimpson(kt),
        }
      })
      .filter(Boolean)
      .sort((a, b) => (b.intensityKt || 0) - (a.intensityKt || 0)) // 强的排前面
    const basins = { AT: 0, EP: 0 }
    for (const s of storms) basins[s.basin] = (basins[s.basin] || 0) + 1
    return {
      ok: true,
      source: 'NOAA NHC（大西洋 / 东太平洋）',
      count: storms.length,
      strongest: storms[0] || null,
      hurricaneCount: storms.filter((s) => (s.intensityKt || 0) >= 64).length,
      storms,
      basins,
    }
  })
}

/**
 * 海洋—大气年代际振荡：PDO（太平洋十年涛动）与 AMO（大西洋多年代际振荡）。
 *
 * 两份都是 NOAA PSL 的固定宽度纯文本，格式略有差异但骨架一样：
 *   第 1 行是起始/结束年份；之后每行「YYYY + 12 个月值」；末尾有署名行。
 * 解析只要认「首列是 4 位年份且列数 ≥13」的数据行即可，署名行自然被过滤掉。
 *
 * 为什么和 ONI 放一起讲：三者都是「海温距平的气候模态」，
 * 差别只在时间尺度——ENSO 是 2–7 年，PDO 是 20–30 年（准周期），AMO 是 60–80 年。
 * PDO 的冷暖位相会**调制** ENSO 的影响强度，所以三者要一起看。
 */
const OSC_DEFS = {
  pdo: {
    key: 'pdo',
    zh: '太平洋十年涛动 PDO',
    en: 'Pacific Decadal Oscillation',
    region: '北太平洋（20°N 以北）',
    period: '20–30 年准周期',
    url: 'https://psl.noaa.gov/data/correlation/pdo.data',
    color: '#0ea5e9',
  },
  amo: {
    key: 'amo',
    zh: '大西洋多年代际振荡 AMO',
    en: 'Atlantic Multidecadal Oscillation',
    region: '北大西洋（0–70°N）',
    period: '60–80 年',
    url: 'https://psl.noaa.gov/data/correlation/amon.us.data',
    color: '#f97316',
  },
}

function parsePslMonthly(txt, def) {
  const monthly = []
  for (const line of txt.split('\n')) {
    const p = line.trim().split(/\s+/)
    if (p.length < 13) continue
    if (!/^\d{4}$/.test(p[0])) continue // 首行年份范围与末尾署名行在这里被挡掉
    const year = Number(p[0])
    for (let m = 0; m < 12; m++) {
      const v = Number(p[m + 1])
      // 缺测占位：PDO 用 -9.90，AMO 用 -99.99。真实值都在 ±3 以内，
      // 阈值取 -9 可同时挡住两者——只按 -99 过滤会让 PDO 的 -9.90 混进序列，
      // 把「最近 12 月均值」和年均拉成一条假的暴跌（实测曾算出 -4.3）。
      if (!Number.isFinite(v) || v <= -9) continue
      monthly.push({ ym: `${year}-${String(m + 1).padStart(2, '0')}`, year, month: m + 1, value: Number(v.toFixed(3)) })
    }
  }
  if (!monthly.length) throw new Error(`${def.zh} 解析为空`)
  // 年均值（跳过不满 12 月的年份）
  const byYear = new Map()
  for (const r of monthly) {
    const acc = byYear.get(r.year) || { sum: 0, n: 0 }
    acc.sum += r.value
    acc.n += 1
    byYear.set(r.year, acc)
  }
  const annual = [...byYear.entries()]
    .filter(([, a]) => a.n === 12)
    .map(([year, a]) => ({ year, value: Number((a.sum / a.n).toFixed(3)) }))
  const last12 = monthly.slice(-12)
  return {
    ...def,
    history: monthly.slice(-360), // 近 30 年月值
    annual: annual.slice(-60),
    latest: monthly[monthly.length - 1],
    last12: last12.length ? Number((last12.reduce((s, r) => s + r.value, 0) / last12.length).toFixed(3)) : null,
  }
}

async function oscillations() {
  return withCache('osc', 12 * 3600_000, async () => {
    const [pdoTxt, amoTxt] = await Promise.all([
      fetchWithTimeout(OSC_DEFS.pdo.url),
      fetchWithTimeout(OSC_DEFS.amo.url),
    ])
    return {
      ok: true,
      pdo: parsePslMonthly(pdoTxt, OSC_DEFS.pdo),
      amo: parsePslMonthly(amoTxt, OSC_DEFS.amo),
    }
  })
}

/**
 * 全球海洋温度距平（NOAA NCEI「Climate at a Glance」年度序列，基准 1901–2000）。
 * 返回 JSON：{ description: {...}, data: { "1850": { departure: 0 }, ... } }
 *
 * 这是海洋看板里最有分量的一条长期曲线：海洋吸走了温室气体滞留热量的九成以上，
 * 海洋温度距平几乎是「地球能量失衡」最直接的体温计。
 */
async function ssta() {
  return withCache('ssta', 12 * 3600_000, async () => {
    const d = JSON.parse(
      await fetchWithTimeout(
        'https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/global/time-series/globe/ocean/12/12/1850-2026/data.json',
      ),
    )
    const data = d.data || {}
    const annual = Object.entries(data)
      .map(([year, v]) => ({ year: Number(year), anom: Number(v?.departure) }))
      .filter((r) => Number.isFinite(r.year) && Number.isFinite(r.anom))
      .sort((a, b) => a.year - b.year)
    if (!annual.length) throw new Error('海洋温度距平解析为空')
    const recent = annual.slice(-60)
    const latest = annual[annual.length - 1]
    const warmest = annual.reduce((a, b) => (b.anom > a.anom ? b : a))
    return {
      ok: true,
      baseline: '1901–2000 年均值',
      annual,
      recent,
      latest,
      warmest,
      // 「近 10 年均值」与两个参照期对比：20 世纪均值（≈0，因基准就是它）
      // 没信息量，真正能说明加速的是 1981–2010 这个现代参照期。
      last10: Number((annual.slice(-10).reduce((s, r) => s + r.anom, 0) / 10).toFixed(3)),
      ref1981: (() => {
        const arr = annual.filter((r) => r.year >= 1981 && r.year <= 2010)
        return arr.length ? Number((arr.reduce((s, r) => s + r.anom, 0) / arr.length).toFixed(3)) : null
      })(),
    }
  })
}

/**
 * 潮位站气象实况（NOAA CO-OPS 气温，旧金山站，过去 24h）。
 * CO-OPS 只有部分站点提供水温，本站在实测窗口内无水温数据，故只取气温。
 * 用途：给潮汐页一个「同一站点的海陆温差」上下文——海陆风与雾都源自这个温差。
 */
async function stationWeather() {
  return withCache('stnwx', 30 * 60_000, async () => {
    const begin = fmtDay(new Date(Date.now() - 24 * 3600_000))
    const end = fmtDay(new Date())
    const url =
      `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=air_temperature` +
      `&application=vite-react-demo&begin_date=${begin}&end_date=${end}` +
      `&station=9414290&time_zone=lst_ldt&units=metric&format=json`
    const d = JSON.parse(await fetchWithTimeout(url))
    if (!d.data || !d.data.length) throw new Error('站点气温数据为空')
    const series = d.data.map((r) => ({ t: r.t, v: Number(r.v) })).filter((p) => Number.isFinite(p.v))
    if (!series.length) throw new Error('站点气温解析为空')
    const vals = series.map((s) => s.v)
    return {
      ok: true,
      station: d.metadata?.name || 'San Francisco',
      latest: series[series.length - 1],
      min: Math.min(...vals),
      max: Math.max(...vals),
      series: series.slice(-120),
    }
  })
}

/**
 * NOAA NDBC 浮标实时观测（latest_obs.txt，一次拉全部站点最新一行）。
 *
 * 为什么用 latest_obs.txt 而不是 realtime2/<站号>.txt：
 *   后者单站就要 600 KB（45 天逐小时），拉 10 个站就是 6 MB；
 *   latest_obs 全站合计仅 100 KB 左右，且每行就是该站最新一次观测。
 *
 * 两个必须知道的坑：
 *   1. 缺测不是空值而是字符串 'MM'，直接 Number() 会得到 NaN 混进图表，
 *      必须显式归一成 null。
 *   2. 站号不全是数字，南太平洋有 'NSTP6'、'32ST0' 这类字母站，
 *      按数字站号排序/过滤会整段漏掉。
 *
 * 站点是动态筛选的（按经纬度框），不硬编码站号清单——
 * 浮标会退役、会被海浪打走，写死清单迟早出现空洞。
 */
async function buoys() {
  return withCache('buoys', 20 * 60_000, async () => {
    const txt = await fetchWithTimeout('https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt', {
      timeout: 20000,
    })
    const rows = txt
      .split('\n')
      .filter((l) => l.trim() && !l.startsWith('#'))
      .map(parseBuoyRow)
      .filter(Boolean)
    if (!rows.length) throw new Error('浮标数据解析为空')

    const regions = BUOY_REGIONS.map((r) => {
      const inBox = rows.filter(
        (s) => s.lat >= r.latMin && s.lat <= r.latMax && s.lon >= r.lonMin && s.lon <= r.lonMax,
      )
      // 打分：有浪高的站优先，其次看有效字段数（浮标常在风浪传感器上缺项）
      const scored = inBox
        .map((s) => ({
          ...s,
          // 有实测浪高的站最优先，其次是有水温的，最后才是纯粹的气象站
          score:
            (s.wvht != null ? (s.wvht > 0 ? 120 : 60) : 0) +
            (s.wtmp != null ? 20 : 0) +
            (s.pres != null ? 10 : 0) +
            Object.values(s).filter((v) => v != null).length,
        }))
        .sort((a, b) => b.score - a.score)
      return {
        key: r.key,
        name: r.name,
        stationCount: inBox.length,
        // 每区最多带 2 个站：够看又不至于把表格撑爆
        stations: scored.slice(0, 2).map(({ score, ...rest }) => rest),
      }
    })

    // 「最狂的海」只认真正测到浪的站，避免把 wvht=0 的静稳站当最大值
    const withWaves = rows.filter((s) => s.wvht != null && s.wvht > 0)
    const heights = withWaves.map((s) => s.wvht)
    const wtmp = rows.filter((s) => s.wtmp != null).map((s) => s.wtmp)

    return {
      ok: true,
      source: 'NOAA NDBC',
      totalStations: rows.length,
      waveStations: withWaves.length,
      regions: regions.filter((r) => r.stations.length > 0),
      // 全球浮标网的两个宏观读数：最狂的海在哪、海表温度跨度多大
      maxWave: heights.length
        ? withWaves[heights.indexOf(Math.max(...heights))]
        : null,
      sstRange: wtmp.length
        ? { min: Math.min(...wtmp), max: Math.max(...wtmp), n: wtmp.length }
        : null,
      // 观测时刻以「最新一行为准」，各站时钟略有先后
      updatedAt: rows.reduce((a, b) => (b.timeUnix > a ? b.timeUnix : a), 0),
    }
  })
}

/** latest_obs.txt 的固定列（表头两行已跳过），MM = 缺测 */
function parseBuoyRow(line) {
  const p = line.trim().split(/\s+/)
  if (p.length < 22) return null
  const num = (s) => {
    const v = Number(s)
    return Number.isFinite(v) ? v : null
  }
  const lat = num(p[1])
  const lon = num(p[2])
  if (lat == null || lon == null) return null

  const wvht = num(p[11])
  const dpd = num(p[12])
  const apd = num(p[13])
  const mwd = num(p[14])
  // 「假平静」识别：没有波浪传感器的站（多为岸站或他国气象浮标）会把
  // WVHT / DPD 一律填 0，看起来像「海面如镜」，实际是没测。
  // 判据：波高为 0 且主波周期为 0/空、平均周期与浪向也全空。
  // 真·平静海况会带正常的周期值（DPD 通常 ≥ 2 s），因此不会误杀。
  const noWaveSensor = wvht === 0 && (dpd == null || dpd === 0) && apd == null && mwd == null

  const [yyyy, mo, dd, hh, mm] = [p[3], p[4], p[5], p[6], p[7]]
  const timeUnix = Date.UTC(+yyyy, +mo - 1, +dd, +hh, +mm)
  return {
    id: p[0],
    lat,
    lon,
    timeUtc: Number.isFinite(timeUnix)
      ? `${yyyy}-${mo}-${dd}T${hh}:${mm}Z`
      : null,
    timeUnix: Number.isFinite(timeUnix) ? timeUnix : 0,
    // 风：方向（度，真北）/ 风速 / 阵风，单位 m/s
    wdir: num(p[8]),
    wspd: num(p[9]),
    gst: num(p[10]),
    // 浪：有效波高 m / 主波周期 s / 平均周期 s / 浪向 degT
    wvht: noWaveSensor ? null : wvht,
    dpd: noWaveSensor ? null : dpd,
    apd,
    mwd,
    // 气压 hPa 与 3 小时变压、气温/水温/露点 °C、能见度海里、潮位 ft
    pres: num(p[15]),
    ptdy: num(p[16]),
    atmp: num(p[17]),
    wtmp: num(p[18]),
    dewp: num(p[19]),
    vis: num(p[20]),
    tide: num(p[21]),
  }
}

/** 浮标分区：经纬度框动态筛选，避免硬编码站号清单 */
const BUOY_REGIONS = [
  { key: 'nwPacific', name: '西北太平洋（日韩近海）', latMin: 20, latMax: 50, lonMin: 118, lonMax: 148 },
  { key: 'wPacific', name: '中西太平洋（马里亚纳—密克罗尼西亚）', latMin: 0, latMax: 20, lonMin: 140, lonMax: 180 },
  { key: 'nePacific', name: '东北太平洋（美国西岸）', latMin: 32, latMax: 50, lonMin: -128, lonMax: -115 },
  { key: 'gulfAlaska', name: '阿拉斯加湾', latMin: 50, latMax: 62, lonMin: -165, lonMax: -135 },
  { key: 'hawaii', name: '夏威夷群岛', latMin: 15, latMax: 28, lonMin: -165, lonMax: -152 },
  { key: 'sPacific', name: '南太平洋（萨摩亚—南美西岸）', latMin: -25, latMax: -5, lonMin: -180, lonMax: -80 },
  { key: 'nAtlantic', name: '北大西洋（美国东岸）', latMin: 28, latMax: 45, lonMin: -82, lonMax: -66 },
  { key: 'gulfMexico', name: '墨西哥湾与加勒比', latMin: 18, latMax: 31, lonMin: -98, lonMax: -80 },
  { key: 'eAtlantic', name: '东北大西洋（西欧外海）', latMin: 45, latMax: 62, lonMin: -25, lonMax: 5 },
]

/** dev 中间件：/api/ocean/* → 各数据源 */
export function serveOceanData() {
  const SOURCES = {
    '/api/ocean/waves': waves,
    '/api/ocean/tides': tides,
    '/api/ocean/tide-pred': tidePred,
    '/api/ocean/oni': oni,
    '/api/ocean/global-waves': globalWaves,
    '/api/ocean/cyclones': cyclones,
    '/api/ocean/oscillations': oscillations,
    '/api/ocean/ssta': ssta,
    '/api/ocean/station-weather': stationWeather,
    '/api/ocean/buoys': buoys,
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
