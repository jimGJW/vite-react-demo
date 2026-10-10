/**
 * 天文数据聚合中间件（仅 dev server，生产产物不含）。
 *
 * 页面不直接跨域请求外部天文 API，原因有三：
 *  1. 绝大多数源不发 CORS 头（wheretheiss / Celestrak / NOAA 都实测过，
 *     浏览器直连会被拦），必须服务端转发；
 *  2. 需要在服务端做超时与并发控制，避免某个源慢把整页拖住；
 *  3. 需要「单源失败降级」——任一源挂掉只让对应卡片显示异常，
 *     其余数据照常展示，而不是整页白屏。
 *
 * 每个数据源都被包成独立的 try/catch，失败的源返回 { ok:false, error }，
 * 前端据此把那张卡片标成「暂时不可用」。
 *
 * 源清单（全部为免密钥的权威公开接口）：
 *   ISS 位置     wheretheiss.at          实时经纬高/速度
 *   空间站 TLE   Celestrak stations      ISS + 中国空间站三舱 + 神舟
 *   Kp 指数      NOAA SWPC               行星际磁场活动
 *   太阳风       NOAA SWPC summary       速度/Bt/Bz
 *   F10.7        NOAA SWPC json          太阳射电流量
 *   太阳黑子     NOAA SWPC observed      月均值与 13 个月平滑
 *   系外行星     NASA Exoplanet Archive  TAP/ADQL 查询
 *   近地天体     NASA NeoWs              未来 7 天近地小行星
 *   发射任务     Launch Library 2        近期发射计划
 *   X 射线       NOAA GOES               太阳耀斑分级（自行识别事件）
 *   质子事件     NOAA GOES               高能质子通量（太阳质子事件）
 *   空间天气警报 NOAA SWPC alerts        地磁暴/辐射/无线电警报
 *   极光椭圆     NOAA OVATION            极光可见纬度
 *   太阳周期     NOAA SWPC               第 25 周期观测与预测
 */

/** 统一超时：超过就放弃这个源，不拖累整体 */
const FETCH_TIMEOUT = 12000

/** 内存缓存：TLE 一天才变、系外行星总数一天变一次，没必要每次都打外网 */
const cache = new Map()

/**
 * 带超时的 fetch。Node 18+ 有全局 fetch，用 AbortController 兜住挂起的连接。
 */
async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), opts.timeout || FETCH_TIMEOUT)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        // 部分源（NASA）对空 UA 很敏感，会直接 500
        'User-Agent': 'vite-react-demo/astro-board/1.0 (local dev)',
        Accept: 'application/json, text/plain, */*',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 取一个数据源，命中缓存则直接返回；失败时若有旧缓存则降级返回并标记 stale。
 */
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
    if (hit) {
      // 上游挂了但我们有旧数据：降级返回并告诉前端这是过期数据
      return { ...hit.value, stale: true, error: String(e && e.message) }
    }
    return { __error: String(e && e.message) }
  }
}

/** Celestrak TLE 文本 → 结构化列表 */
function parseTLEBlocks(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim())
  const out = []
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('1 ') && lines[i + 1] && lines[i + 1].startsWith('2 ')) {
      const nameLine = i > 0 ? lines[i - 1] : ''
      out.push({ name: nameLine.trim(), line1: lines[i], line2: lines[i + 1] })
    }
  }
  return out
}

/** 只保留我们关心的在轨目标。match 只在服务端用，不透传给前端。 */
const WANTED = [
  { match: /ISS \(ZARYA\)/i, key: 'iss', label: '国际空间站', country: '多国联合', cn: 'ISS' },
  { match: /CSS \(TIANHE\)/i, key: 'css-tianhe', label: '天和核心舱', country: '中国', cn: '天和' },
  { match: /CSS \(WENTIAN\)/i, key: 'css-wentian', label: '问天实验舱', country: '中国', cn: '问天' },
  { match: /CSS \(MENGTIAN\)/i, key: 'css-mengtian', label: '梦天实验舱', country: '中国', cn: '梦天' },
  { match: /SHENZHOU-2[0-9]/i, key: 'shenzhou', label: '神舟载人飞船', country: '中国', cn: '神舟' },
  { match: /TIANZHOU-\d+/i, key: 'tianzhou', label: '天舟货运飞船', country: '中国', cn: '天舟' },
]

/**
 * GOES 卫星 X 射线耀斑分级（W/m²，0.05–0.4nm 长波段）。
 *
 * A/B/C/M/X 五级，每级 1–9（或 X 级可到 X10+），相邻级差 10 倍。
 * 这套阈值是 NOAA 定的，我们只能按它分级；前端再翻成中文（见 glossary 的 FLARE_CLASSES）。
 */
const FLARE_THRESHOLDS = [
  ['A', 1.0e-8], ['B', 1.0e-7], ['C', 1.0e-6], ['M', 1.0e-5], ['X', 1.0e-4],
]

/**
 * 流量 → GOES 级（如 'C3.4'）。
 * 做法：先定级（找最大的、流量不超过它的那个字母级），
 * 再用「相对该级下限的倍数」算级内数字——X 级上限不封顶，用 0.1 的对数刻度补。
 */
export function flareClass(flux) {
  if (!Number.isFinite(flux) || flux <= 0) return { letter: 'A', level: 0, zh: 'A级以下', tone: '#8c8c8c' }
  let idx = 0
  for (let i = 0; i < FLARE_THRESHOLDS.length; i++) {
    if (flux >= FLARE_THRESHOLDS[i][1]) idx = i
  }
  const [letter, base] = FLARE_THRESHOLDS[idx]
  // 级内数字：M1→1e-5，M5→5e-5，所以 level = flux/base（M 级恰好 1–9）
  let level = flux / base
  if (letter === 'X') {
    // X 级可能到 X20 以上，压到 2 位小数，UI 显示 X3.4 / X12.7 都合理
    level = Math.round(level * 10) / 10
  } else {
    level = Math.floor(level)
  }
  return { letter, level, zh: `${letter}${level} 级` }
}

/**
 * 从 GOES X 射线流量序列里识别「耀斑事件」。
 *
 * 为什么需要自己识别：NOAA 只提供原始 1 分钟流量序列，
 * 没有现成的耀斑事件列表（/json/solar-event.json 是 404）。
 * 但识别逻辑并不复杂：
 *   1. 只取长波段（0.05–0.4nm），短波段（0.1–0.8nm）日面本底太高；
 *   2. 找「过阈连续段」：B 级以上视为一次耀斑的开始，
 *      允许 3 个采样点的间断（GOES 采样偶尔丢点，否则一次耀斑会被切成好几段）；
 *   3. 每段取峰值 → 决定最终等级与持续时间。
 *
 * @param {Array} rows xrays-1-day.json 的记录
 * @param {string} energy 通道名
 * @param {string} minLetter 最低起始等级
 */
export function extractFlareEvents(rows, energy = '0.05-0.4nm', minLetter = 'B') {
  const minFlux = FLARE_THRESHOLDS.find(([l]) => l === minLetter)[1]
  const series = rows
    .filter((r) => r.energy === energy && Number.isFinite(r.flux))
    .sort((a, b) => new Date(a.time_tag) - new Date(b.time_tag))

  const events = []
  let cur = null
  let gap = 0
  const MAX_GAP = 3 // 允许连续 3 分钟采样缺失仍视为同一次耀斑

  const closeEvent = () => {
    if (!cur) return
    const peak = cur.samples.reduce((a, b) => (b.flux > a.flux ? b : a))
    const cls = flareClass(peak.flux)
    // 持续时间 = 采样数 × 1 分钟（GOES 本产品固定 1 分钟采样）
    events.push({
      start: cur.start,
      peak: peak.time_tag,
      durationMin: cur.samples.length,
      flux: peak.flux,
      cls: cls.letter,
      level: cls.level,
      zh: cls.zh,
      tone: FLARE_TONE[cls.letter] || '#8c8c8c',
    })
    cur = null
  }

  for (const r of series) {
    if (r.flux >= minFlux) {
      gap = 0
      if (!cur) cur = { start: r.time_tag, samples: [] }
      cur.samples.push(r)
    } else if (cur) {
      gap++
      if (gap > MAX_GAP) closeEvent()
    }
  }
  closeEvent()

  // 强耀斑优先（同字母比 level），同级按开始时间倒序
  const rank = (e) => FLARE_THRESHOLDS.findIndex(([l]) => l === e.cls)
  events.sort((a, b) => rank(b) - rank(a) || b.level - a.level || new Date(b.start) - new Date(a.start))
  return events
}

/** 各级耀斑配色（与页面 G 级表同一套语义：越强越暖） */
const FLARE_TONE = {
  A: '#52c41a',
  B: '#a0d911',
  C: '#faad14',
  M: '#fa8c16',
  X: '#ff4d4f',
}

/** 把一串自由文本警报解析成结构化条目 */
function parseAlertMessage(text) {
  // NOAA 警报是纯文本，格式固定：首行 "CODE: XXX"、级别行 "WATCH:/WARNING:/ALERT:"、产品号 xxx(如 G2 / S3)
  const lines = String(text).split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const levelLine = lines.find((l) => /^(WATCH|WARNING|ALERT|EXTENDED WATCH|CANCELLATION)/i.test(l))
  const level = levelLine ? levelLine.split(':')[0].trim().toUpperCase() : 'UNKNOWN'
  // 找形如 "Category G2" / "Level S3" / "G3" 的强度标识
  const gMatch = text.match(/\bG([0-6](?:\.\d)?)\b/)
  const sMatch = text.match(/\bS([1-5](?:\.\d)?)\b/)
  const scaleCode = gMatch ? `G${gMatch[1]}` : sMatch ? `S${sMatch[1]}` : ''
  const scaleType = gMatch ? 'G' : sMatch ? 'S' : ''
  const titleLine =
    lines.find((l) => /(Predicted|Watch|Warning|Alert)/i.test(l) && !/^Space Weather Message/i.test(l)) || ''
  // 影响段落：NOAA 会给 "Potential Impacts:" 开头的正文
  const impactsIdx = lines.findIndex((l) => /^Potential Impacts:/i.test(l))
  const impacts = impactsIdx >= 0 ? lines.slice(impactsIdx + 1, impactsIdx + 6).join(' ') : ''
  return { level, scaleCode, scaleType, title: titleLine.slice(0, 160), impacts: impacts.slice(0, 400) }
}

/* ---------- 各数据源实现 ---------- */

const sources = {
  /**
   * ISS 实时位置（wheretheiss）。
   * 这个源实测不稳定（约三次里会挂起一次 10s+），所以：
   *  - 重试一次再放弃
   *  - 前端不必依赖它：ISS 的位置也可以从 TLE 自行 SGP4 推算
   *    （stations 源里已经有 ISS 的 TLE），这个接口只作交叉校验
   */
  async iss() {
    return withCache('iss', 5000, async () => {
      let lastErr
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const txt = await fetchWithTimeout('https://api.wheretheiss.at/v1/satellites/25544', {
            timeout: attempt === 0 ? 6000 : 9000,
          })
          const d = JSON.parse(txt)
          return {
            ok: true,
            name: '国际空间站 (ISS)',
            lat: d.latitude,
            lon: d.longitude,
            alt: d.altitude,
            speedKmh: d.velocity,
            speedKmS: d.velocity / 3600,
            footprint: d.footprint,
            visibility: d.visibility,
            solarLat: d.solar_lat,
            solarLon: d.solar_lon,
            timestamp: d.timestamp * 1000,
          }
        } catch (e) {
          lastErr = e
        }
      }
      throw lastErr
    })
  },

  /** 空间站 TLE（Celestrak stations 组） */
  async stations() {
    return withCache('stations', 3600_000, async () => {
      const txt = await fetchWithTimeout(
        'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle',
      )
      const blocks = parseTLEBlocks(txt)
      const picked = []
      for (const w of WANTED) {
        const b = blocks.find((x) => w.match.test(x.name))
        // 只取前端的字段，去掉 match（RegExp 序列化成 {} 会污染 JSON）
        if (b) picked.push({ key: w.key, label: w.label, country: w.country, cn: w.cn, name: b.name, line1: b.line1, line2: b.line2 })
      }
      return { ok: true, count: picked.length, stations: picked }
    })
  },

  /** 空间天气：Kp / 太阳风 / F10.7 / 黑子，四源并行，任一失败不影响其它 */
  async spaceWeather() {
    const [kp, wind, mag, f107, sunspot] = await Promise.all([
      withCache('kp', 900_000, async () => {
        const txt = await fetchWithTimeout(
          'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
        )
        const rows = JSON.parse(txt)
        const last = rows[rows.length - 1]
        return { ok: true, kp: last.Kp, time: last.time_tag, history: rows.slice(-24) }
      }).catch(() => null),
      withCache('wind', 300_000, async () => {
        const txt = await fetchWithTimeout(
          'https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json',
        )
        const d = JSON.parse(txt)[0]
        return { ok: true, speedKmS: d.proton_speed, time: d.time_tag }
      }).catch(() => null),
      withCache('mag', 300_000, async () => {
        const txt = await fetchWithTimeout(
          'https://services.swpc.noaa.gov/products/summary/solar-wind-mag-field.json',
        )
        const d = JSON.parse(txt)[0]
        return { ok: true, bt: d.bt, bz: d.bz_gsm, time: d.time_tag }
      }).catch(() => null),
      withCache('f107', 3 * 3600_000, async () => {
        const txt = await fetchWithTimeout('https://services.swpc.noaa.gov/json/f107_cm_flux.json')
        const rows = JSON.parse(txt)
        const last = rows[rows.length - 1]
        return {
          ok: true,
          flux: last.flux,
          mean90: last.ninety_day_mean,
          time: last.time_tag,
          history: rows.slice(-30).map((r) => ({ t: r.time_tag, v: r.flux })),
        }
      }).catch(() => null),
      withCache('sunspot', 6 * 3600_000, async () => {
        const txt = await fetchWithTimeout(
          'https://services.swpc.noaa.gov/json/solar-cycle/observed-solar-cycle-indices.json',
        )
        const rows = JSON.parse(txt)
        const last = rows[rows.length - 1]
        return {
          ok: true,
          ss: last.ss,
          smoothed: last.smoothed_ssn,
          f107: last.f10_7,
          time: last.time_tag,
          history: rows.slice(-24).map((r) => ({ t: r.time_tag, ss: r.ss })),
        }
      }).catch(() => null),
    ])
    return { ok: true, kp, wind, mag, f107, sunspot }
  },

  /**
   * 系外行星（NASA Exoplanet Archive，TAP/ADQL）。
   *
   * 两个方言坑（都实测踩过）：
   *  1. 后端是 Oracle，`LIMIT n` 和 `FETCH FIRST n ROWS ONLY` 都会报
   *     ORA-00933，取前 N 行必须用 `where rownum <= n` 包一层子查询；
   *  2. 查询出错时它返回 XML VOTable（内含 ORA- 错误码）而不是 JSON，
   *     直接 JSON.parse 会炸，所以先看首字符是不是 '<'。
   */
  async exoplanets() {
    return withCache('exoplanets', 6 * 3600_000, async () => {
      const base = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync'
      const ask = async (adql) => {
        const url = `${base}?query=${encodeURIComponent(adql)}&format=json`
        const txt = await fetchWithTimeout(url, { timeout: 25000 })
        if (txt.trimStart().startsWith('<')) {
          const m = txt.match(/ORA-\d+: [^<]*/)
          throw new Error(m ? m[0] : 'TAP 返回 XML（查询被拒）')
        }
        return JSON.parse(txt)
      }

      const summary = await ask(
        `select count(*) as total, min(disc_year) as first_year, max(disc_year) as last_year from ps where default_flag=1`,
      )
      const methods = await ask(
        `select discoverymethod, count(*) as c from ps where default_flag=1 group by discoverymethod order by c desc`,
      )
      const latest = await ask(
        `select * from (select pl_name, hostname, discoverymethod, disc_year, pl_orbper, pl_rade, sy_dist from ps where default_flag=1 order by disc_year desc, pl_name asc) where rownum <= 8`,
      )
      return {
        ok: true,
        total: summary[0]?.total ?? null,
        firstYear: summary[0]?.first_year ?? null,
        lastYear: summary[0]?.last_year ?? null,
        methods: methods.slice(0, 6).map((m) => ({ name: m.discoverymethod, count: m.c })),
        latest: latest.map((r) => ({
          name: r.pl_name,
          host: r.hostname,
          method: r.discoverymethod,
          year: r.disc_year,
          periodDays: r.pl_orbper,
          radiusEarth: r.pl_rade,
          distLy: r.sy_dist ? Number((r.sy_dist * 3.26156).toFixed(1)) : null,
        })),
      }
    })
  },

  /**
   * 近地天体（Near Earth Objects）—— NASA NeoWs。
   * DEMO_KEY 限 30 次/小时，数据一天才变一次，缓存 6 小时绰绰有余。
   * 返回未来 7 天内接近地球的小行星/彗星列表。
   */
  async neo() {
    return withCache('neo', 6 * 3600_000, async () => {
      const today = new Date()
      const fmt = (d) => d.toISOString().split('T')[0]
      const start = fmt(today)
      const end = fmt(new Date(today.getTime() + 7 * 86400_000))
      const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${start}&end_date=${end}&api_key=DEMO_KEY`
      const txt = await fetchWithTimeout(url, { timeout: 15000 })
      const d = JSON.parse(txt)

      // 按接近日期展开成扁平列表，只取有接近数据的条目
      const byDate = d.near_earth_objects || {}
      const items = []
      for (const list of Object.values(byDate)) {
        for (const neo of list) {
          const ca = neo.close_approach_data?.[0]
          if (!ca) continue
          const distKm = Number(ca.miss_distance.kilometers)
          const distLunar = distKm / 384400 // 以地月距离为单位
          items.push({
            id: neo.id,
            name: neo.name,
            date: ca.close_approach_date,
            distKm: Math.round(distKm),
            distLunar: +distLunar.toFixed(2),
            velocityKmh: Math.round(Number(ca.relative_velocity.kilometers_per_hour)),
            diameterMin: Math.round(Number(neo.estimated_diameter?.kilometers?.estimated_diameter_min) * 1000),
            diameterMax: Math.round(Number(neo.estimated_diameter?.kilometers?.estimated_diameter_max) * 1000),
            hazardous: neo.is_potentially_hazardous_asteroid,
          })
        }
      }
      // 按距离排序，最近的在前
      items.sort((a, b) => a.distKm - b.distKm)
      return {
        ok: true,
        count: items.length,
        hazardous: items.filter((i) => i.hazardous).length,
        nearest: items[0] || null,
        items: items.slice(0, 12), // 只展示前 12 条
      }
    })
  },

  /**
   * 太阳活动：X 射线耀斑 + 高能质子 + 空间天气警报。
   *
   * 这一组是「太阳活动」页的核心。三个源并行、互不阻塞：
   *   xrays  —— GOES 卫星 1 分钟 X 射线流量（自行识别耀斑事件）
   *   proton —— GOES >10MeV 质子通量（太阳质子事件的判据）
   *   alerts —— NOAA 发布的警报/预警（自由文本，需解析）
   */
  async solarActivity() {
    const [xrays, protons, alerts] = await Promise.all([
      withCache('xrays', 5 * 60_000, async () => {
        const txt = await fetchWithTimeout(
          'https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json',
          { timeout: 20000 },
        )
        const rows = JSON.parse(txt)
        const long = rows.filter((r) => r.energy === '0.05-0.4nm' && Number.isFinite(r.flux))
        if (!long.length) throw new Error('X 射线数据为空')
        long.sort((a, b) => new Date(a.time_tag) - new Date(b.time_tag))
        const peak = long.reduce((a, b) => (b.flux > a.flux ? b : a))
        const current = long[long.length - 1]
        const events = extractFlareEvents(rows)
        const byClass = {}
        for (const e of events) byClass[e.cls] = (byClass[e.cls] || 0) + 1
        return {
          ok: true,
          currentFlux: current.flux,
          currentClass: flareClass(current.flux),
          peakFlux: peak.flux,
          peakClass: flareClass(peak.flux),
          peakTime: peak.time_tag,
          sampleCount: long.length,
          events: events.slice(0, 12),
          total24h: events.length,
          byClass,
          history: long.slice(-180).map((r) => ({ t: r.time_tag, v: r.flux })),
        }
      }).catch((e) => ({ ok: false, error: String(e && e.message) })),

      withCache('protons', 5 * 60_000, async () => {
        const txt = await fetchWithTimeout(
          'https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json',
          { timeout: 20000 },
        )
        const rows = JSON.parse(txt)
        const series = rows.filter((r) => Number.isFinite(r.flux))
        if (!series.length) throw new Error('质子数据为空')
        series.sort((a, b) => new Date(a.time_tag) - new Date(b.time_tag))
        const peak = series.reduce((a, b) => (b.flux > a.flux ? b : a))
        const last = series[series.length - 1]
        // S1–S3 是 NOAA 的太阳质子事件分级（单位 pfu，1 pfu = 1e-6 cm^-2·s^-1）
        const pfu = (v) => (Number.isFinite(v) ? Number(v.toPrecision(3)) : 0)
        const level = (v) =>
          v >= 1e3 ? 'S3' : v >= 1e2 ? 'S2' : v >= 10 ? 'S1' : v >= 1 ? 'S0' : '—'
        // 坑：GOES-16/17/18 三颗卫星各传一份，**同一时间戳会出现多条**。
        // 不去重的话前端画折线会看到同 x 值多根线段、峰值也被重复统计。
        // 这里按时间戳保留最大值（保守：多星合并时取更强的那个）。
        const byTime = new Map()
        for (const r of series) {
          const t = r.time_tag
          if (!byTime.has(t) || r.flux > byTime.get(t).flux) byTime.set(t, r)
        }
        const merged = [...byTime.values()].sort(
          (a, b) => new Date(a.time_tag) - new Date(b.time_tag),
        )
        return {
          ok: true,
          current: pfu(last.flux),
          currentLevel: level(last.flux),
          peak: pfu(peak.flux),
          peakLevel: level(peak.flux),
          peakTime: peak.time_tag,
          rawCount: series.length,
          history: merged.slice(-180).map((r) => ({ t: r.time_tag, v: pfu(r.flux) })),
        }
      }).catch((e) => ({ ok: false, error: String(e && e.message) })),

      withCache('alerts', 3 * 60_000, async () => {
        const txt = await fetchWithTimeout('https://services.swpc.noaa.gov/products/alerts.json')
        const rows = JSON.parse(txt)
        // 只保留最近 72 小时，并把自由文本拆成结构化字段
        const cutoff = Date.now() - 72 * 3600_000
        const items = rows
          .filter((r) => new Date(r.issue_datetime.replace(' ', 'T') + 'Z').getTime() > cutoff)
          .map((r) => ({
            productId: r.product_id,
            issuedAt: r.issue_datetime,
            ...parseAlertMessage(r.message),
          }))
          .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
        return { ok: true, count: items.length, items: items.slice(0, 8) }
      }).catch((e) => ({ ok: false, error: String(e && e.message) })),
    ])

    return { ok: true, xrays, protons, alerts }
  },

  /**
   * 极光椭圆（NOAA OVATION）。
   *
   * ⚠️ 字段顺序踩过的坑：数据自带的 `Data Format` 字段写的是
   * `[Longitude, Latitude, Aurora]` —— **第一维是经度（0–359）**，
   * 第二维才是纬度（−90–90）。一开始按「[纬度, 经度, 强度]」读，
   * 结果算出 bandLat=232 这种不存在的纬度。
   * 所以这里一律按 Data Format 的声明来解，并做范围断言：
   * 纬度必须在 [−90, 90]，否则宁可报「数据格式变化」也不要画错。
   *
   * 数据含义：第 3 维是「光柱功率」(erg/cm²/s)，>0 表示该经纬网格上方有极光。
   * 我们统计北半球，算出极光带所处纬度 → 回答「今晚我国漠河/北京能不能看到极光」。
   */
  async aurora() {
    return withCache('aurora', 10 * 60_000, async () => {
      const txt = await fetchWithTimeout(
        'https://services.swpc.noaa.gov/json/ovation_aurora_latest.json',
        { timeout: 20000 },
      )
      const d = JSON.parse(txt)
      const pts = d.coordinates
      if (!Array.isArray(pts) || !pts.length) throw new Error('极光数据为空')

      // 按 [lon, lat, power] 解，只保留北半球 + 有强度
      const north = pts.filter(
        (p) => Array.isArray(p) && Number.isFinite(p[1]) && p[1] > 0 && Number(p[2]) > 0,
      )
      if (!north.length) throw new Error('北半球无有效极光点')

      // 纬度必须落在合法范围——用来兜住「上游改了字段顺序」这种情况
      const lats = north.map((p) => p[1])
      if (lats.some((v) => v < 0 || v > 90)) {
        throw new Error(
          `纬度越界（${Math.min(...lats)}…${Math.max(...lats)}），上游 Data Format 可能已变更：` +
            `${d['Data Format']}`,
        )
      }

      // 强度加权平均纬度：极光带不是固定纬度，会随磁暴南北扩张
      const totalW = north.reduce((a, p) => a + Number(p[2]), 0)
      const weightedLat = north.reduce((a, p) => a + p[1] * Number(p[2]), 0) / totalW

      // 极光带南界：极光出现的最低地理纬度。低于它就看不到极光。
      const southEdge = Math.floor(Math.min(...lats))

      return {
        ok: true,
        updated: d['Observation Time'] || null,
        forecastTime: d['Forecast Time'] || null,
        pointCount: north.length,
        // 极光带核心纬度（向下取整到 1 度，与预报口径一致）
        bandLat: Math.round(weightedLat),
        // 带的南北跨度
        bandLatMin: Math.round(Math.min(...lats)),
        bandLatMax: Math.round(Math.max(...lats)),
        // 能看到极光的南界（地理纬度）
        southEdge,
        maxPower: Math.max(...north.map((p) => Number(p[2]))),
        // 常见观测点的判据
        cities: [
          { name: '漠河', lat: 52.97 },
          { name: '黑河', lat: 50.25 },
          { name: '满洲里', lat: 49.6 },
          { name: '北京', lat: 39.9 },
          { name: '哈尔滨', lat: 45.8 },
        ].map((c) => ({
          ...c,
          visible: c.lat >= southEdge,
          inBand: c.lat >= Math.min(...lats) && c.lat <= Math.max(...lats),
        })),
      }
    })
  },

  /**
   * 太阳活动周期（第 25 周期）—— 观测实况 + 官方预测区间。
   *
   * 回答「我们现在处于太阳活动周期的什么位置」：
   * 观测是月均值，预测带 high/low 置信区间，正好画成一条带上下界的折线。
   *
   * ⚠️ 两个必须处理的坑：
   *  1. **-1 是占位值不是负数**：NOAA 用 -1 表示「该月无数据」。
   *     不过滤掉的话，页面上会出现「太阳黑子数 -1」和「峰值 -1」这种荒唐值。
   *     同理 `smoothed_ssn` 只有在 13 个月滑动窗口填满后才有意义，
   *     周期末尾几行必然是 -1，所以「最新月份」取的是最后一个**有效**行。
   *  2. 字段名带连字符：`time-tag`（预测源）vs `time-tag`（观测源也是连字符）。
   *     写错成下划线会静默拿到 undefined。
   */
  async solarCycle() {
    return withCache('solarCycle', 12 * 3600_000, async () => {
      const [obsTxt, preTxt] = await Promise.all([
        fetchWithTimeout(
          'https://services.swpc.noaa.gov/json/solar-cycle/observed-solar-cycle-indices.json',
          { timeout: 20000 },
        ),
        fetchWithTimeout(
          'https://services.swpc.noaa.gov/json/solar-cycle/predicted-solar-cycle.json',
          { timeout: 20000 },
        ),
      ])
      const rawObs = JSON.parse(obsTxt)
      const pre = JSON.parse(preTxt)

      // 丢掉 -1 占位行
      const obs = rawObs.filter((r) => Number.isFinite(r.ssn) && r.ssn >= 0)
      if (!obs.length) throw new Error('太阳周期观测数据全部无效')

      // 最新月份 = 最后一个有实测黑子数的月（不是最后一个平滑值）
      const lastObs = obs[obs.length - 1]
      // 平滑值取最近一个有效的（开头周期数据不完整）
      const withSmooth = [...obs].reverse().find((r) => Number.isFinite(r.smoothed_ssn) && r.smoothed_ssn >= 0)
      // 有效平滑值的历史峰值，用来对比「这轮会不会特别强」
      const smoothAll = obs.filter((r) => Number.isFinite(r.smoothed_ssn) && r.smoothed_ssn >= 0)
      if (!smoothAll.length) throw new Error('太阳周期观测无有效平滑值')
      // ⚠️ 必须**限定在第 25 周期内**再取峰值：
      // 观测序列从 1749 年（第 1 周期）开始，全局峰值是 1958 年的 285，
      // 拿它跟第 25 周期比毫无意义（「比历史最高低 2/3」这种结论是错的）。
      // 第 25 周期从 2019-12 开始，第 24 周期在 2019-12 结束。
      const CYCLE25_START = '2019-11'
      const inCycle = smoothAll.filter((r) => r['time-tag'] >= CYCLE25_START)
      const cyclePool = inCycle.length ? inCycle : smoothAll
      let maxObs = cyclePool[0]
      for (const r of cyclePool) if (r.smoothed_ssn > maxObs.smoothed_ssn) maxObs = r

      // 预测值也剔掉 -1（低置信边界可能为 0，那是真的 0，要保留）
      const predicted = pre
        .filter((r) => Number.isFinite(r.predicted_ssn) && r.predicted_ssn >= 0)
        .map((r) => ({
          m: r['time-tag'],
          ssn: r.predicted_ssn,
          low: Number.isFinite(r.low_ssn) && r.low_ssn >= 0 ? r.low_ssn : null,
          high: Number.isFinite(r.high_ssn) && r.high_ssn >= 0 ? r.high_ssn : null,
        }))

      return {
        ok: true,
        current: {
          month: lastObs['time-tag'],
          ss: lastObs.ssn,
          smoothed: withSmooth ? withSmooth.smoothed_ssn : null,
          smoothedMonth: withSmooth ? withSmooth['time-tag'] : null,
          f107: Number.isFinite(lastObs.f10_7) && lastObs.f10_7 >= 0 ? lastObs.f10_7 : null,
        },
        observed: obs.slice(-60).map((r) => ({
          m: r['time-tag'],
          ss: r.ssn,
          smoothed: Number.isFinite(r.smoothed_ssn) && r.smoothed_ssn >= 0 ? r.smoothed_ssn : null,
        })),
        predicted,
        // 峰值只在第 25 周期内统计（poolSize 说明实际参与比较的月份数，便于自查）
        historicalPeak: {
          month: maxObs['time-tag'],
          smoothed: maxObs.smoothed_ssn,
          poolSize: cyclePool.length,
          sinceCycle25: inCycle.length > 0,
        },
      }
    })
  },

  /**
   * NASA 每日天文一图（APOD, Astronomy Picture of the Day）。
   * DEMO_KEY 限 30 次/小时，数据一天一张，缓存 3 小时绰绰有余。
   * media_type 偶尔是 video（YouTube 嵌入），前端需要区分处理。
   */
  async apod() {
    return withCache('apod', 3 * 3600_000, async () => {
      const url = 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&thumbs=true'
      const txt = await fetchWithTimeout(url, { timeout: 15000 })
      const d = JSON.parse(txt)
      return {
        ok: true,
        date: d.date,
        title: d.title,
        explanation: d.explanation,
        // 视频类型时给缩略图（thumbs=true 才有 thumbnail_url）
        mediaType: d.media_type,
        url: d.media_type === 'image' ? d.url : d.thumbnail_url || d.url,
        hdurl: d.hdurl || null,
        copyright: d.copyright || null,
      }
    })
  },

  /**
   * 近期航天发射 —— Launch Library 2（TheSpaceDevs）。
   * 免密钥，匿名限 50 次/小时。缓存 1 小时。
   */
  async launches() {
    return withCache('launches', 3600_000, async () => {
      const url = 'https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10&ordering=net'
      const txt = await fetchWithTimeout(url, { timeout: 15000 })
      const d = JSON.parse(txt)
      const items = (d.results || []).map((l) => ({
        name: l.name,
        provider: l.launch_service_provider?.name || '',
        rocket: l.rocket?.configuration?.name || '',
        pad: l.pad?.name || '',
        location: l.pad?.location?.name || '',
        net: l.net, // ISO 时间
        status: l.status?.name || '',
        statusAbbr: l.status?.abbrev || '',
        mission: l.mission?.name || '',
        missionType: l.mission?.type || '',
        imgUrl: l.image,
      }))
      return { ok: true, count: d.count || 0, items }
    })
  },
}

/** 把 promise 结果里的 __error 转成结构化失败 */
function unwrap(r) {
  if (r && r.__error) return { ok: false, error: r.__error }
  return r
}

export function serveAstroData() {
  return {
    name: 'serve-astro-data',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url || '').split('?')[0]
        const keys = {
          '/api/astro/iss': 'iss',
          '/api/astro/stations': 'stations',
          '/api/astro/space-weather': 'spaceWeather',
          '/api/astro/exoplanets': 'exoplanets',
          '/api/astro/neo': 'neo',
          '/api/astro/launches': 'launches',
          '/api/astro/solar-activity': 'solarActivity',
          '/api/astro/aurora': 'aurora',
          '/api/astro/solar-cycle': 'solarCycle',
          '/api/astro/apod': 'apod',
        }
        const key = keys[url]
        if (!key) return next()

        try {
          const data = unwrap(await sources[key]())
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          // 实时性是这个页面的核心价值，任何缓存都会让「实时」失效
          res.setHeader('Cache-Control', 'no-store')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify(data))
        } catch (e) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify({ ok: false, error: String(e && e.message) }))
        }
      })
    },
  }
}
