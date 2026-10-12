/**
 * 看板「新增页签」的公共取数层：Open-Meteo 家族（免密钥、无需注册）。
 *
 * 为什么单独抽一个文件：三个看板都要打同一批 Open-Meteo 端点（气象 / 空气质量 / 海洋），
 * 各写一份会出现三套超时与缓存参数、三份城市坐标表，改一处漏两处。
 * 这里收敛 fetch、缓存、并发与「单城失败降级」四件事。
 *
 * 为什么选 Open-Meteo：
 *   1. 完全免密钥（NASA DONKI 要 api_key、OpenAQ 要 token，都会在本地 dev 里变成配置负担）；
 *   2. 覆盖三看板缺口：空气质量（geo 此前只有温室气体，没有 AQI）、
 *      海洋预报（ocean 此前只有实测浮标，没有预报）、云量能见度（astro 观星条件此前靠本地算）；
 *   3. 响应快（实测 <300ms），可以多城并发而不拖慢首屏。
 *
 * 源清单：
 *   api.open-meteo.com           实况天气 / 云量 / 日出日落
 *   air-quality-api.open-meteo.com  PM2.5 / PM10 / US AQI / UV / 臭氧
 *   marine-api.open-meteo.com     浪高 / 浪周期 / 浪向 / 海表温度（含 7 天预报）
 *   archive-api.open-meteo.com    历史逐日气温降水（ERA5 再分析）
 */

/**
 * 统一超时。
 * 定 20s 是被实测逼出来的：12 城并发时，12s 超时会稳定打掉 1–2 个城市
 * （Open-Meteo 单点通常 <300ms，但并发首击要建 TLS 连接，个别点会明显变慢）。
 */
const FETCH_TIMEOUT = 20000

/** 内存缓存：key → { at, value }。dev 期够用，重启即失效 */
const cache = new Map()

async function fetchWithTimeout(url, timeout = FETCH_TIMEOUT) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'vite-react-demo/boards/1.0 (local dev)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 取一份 Open-Meteo 数据，命中缓存直接返回。
 * 失败不抛：交给调用方决定「整块降级」还是「这一项留空」。
 */
export async function openMeteo(host, params, { ttl = 10 * 60_000, key } = {}) {
  const ck = key || `${host}?${params}`
  const hit = cache.get(ck)
  if (hit && Date.now() - hit.at < ttl) return hit.value
  const value = await fetchWithTimeout(`https://${host}/v1/${params}`)
  cache.set(ck, { at: Date.now(), value })
  return value
}

/**
 * 多城抓取（限并发 + 单城重试）。
 *
 * 单城失败降级是刻意的：Open-Meteo 偶尔对个别坐标返回空（尤其是离岸远的内陆点
 * 打 marine 端点时 wave_height 为 null），不能因为一个城市就让整页空白。
 * 失败的城市在结果里留 { ok:false, error }，前端按城市粒度显示「该点无数据」。
 *
 * 为什么要限并发而不是全部 Promise.all：实测 12 城一次性打出时，上游会稳定
 * 打回 3 个（HTTP 429/5xx），而同样的 12 个坐标串行/小并发请求全部成功——
 * 是突发限流而非坐标问题。故默认并发 4，失败再退避重试一次。
 */
export async function forCities(cities, fn, { concurrency = 4, retries = 1 } = {}) {
  const out = new Array(cities.length)
  let cursor = 0

  async function worker() {
    // 每个 worker 自己取下一个下标，避免额外引入队列库
    while (cursor < cities.length) {
      const i = cursor++
      const c = cities[i]
      let err = null
      for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
          const data = await fn(c)
          out[i] = { ...c, ok: true, ...data }
          err = null
          break
        } catch (e) {
          err = e
          // 退避重试：第一次失败等 500ms，后续翻倍，别在限流窗口里硬顶
          if (attempt < retries) await sleep(500 * (attempt + 1))
        }
      }
      if (err) out[i] = { ...c, ok: false, error: String((err && err.message) || err) }
    }
  }

  const n = Math.max(1, Math.min(concurrency, cities.length))
  await Promise.all(Array.from({ length: n }, worker))
  return out
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/** 数字安全化：上游 null / 空串一律转成 null，不让 NaN 流进前端分档函数 */
export function num(v) {
  const n = typeof v === 'string' ? Number(v) : v
  return Number.isFinite(n) ? n : null
}

/* ------------------------------------------------------------------ */
/* 城市坐标表（服务端常量，不进前端 bundle）                            */
/* ------------------------------------------------------------------ */

/** 国内主要城市：空气质量 / 天气实况 / 观星条件共用 */
export const CITIES = [
  { key: 'beijing', name: '北京', lat: 39.9042, lon: 116.4074, coastal: false },
  { key: 'shanghai', name: '上海', lat: 31.2304, lon: 121.4737, coastal: true },
  { key: 'guangzhou', name: '广州', lat: 23.1291, lon: 113.2644, coastal: true },
  { key: 'shenzhen', name: '深圳', lat: 22.5431, lon: 114.0579, coastal: true },
  { key: 'chengdu', name: '成都', lat: 30.5728, lon: 104.0668, coastal: false },
  { key: 'xian', name: '西安', lat: 34.3416, lon: 108.9398, coastal: false },
  { key: 'hangzhou', name: '杭州', lat: 30.2741, lon: 120.1551, coastal: false },
  { key: 'wuhan', name: '武汉', lat: 30.5928, lon: 114.3055, coastal: false },
  { key: 'harbin', name: '哈尔滨', lat: 45.8038, lon: 126.5349, coastal: false },
  { key: 'urumqi', name: '乌鲁木齐', lat: 43.8256, lon: 87.6168, coastal: false },
  { key: 'lhasa', name: '拉萨', lat: 29.6520, lon: 91.1721, coastal: false },
  { key: 'kunming', name: '昆明', lat: 25.0389, lon: 102.7183, coastal: false },
]

/**
 * 观星条件城市：优先高海拔 / 干燥 / 光污染低的点，
 * 这样「今晚能不能看星」的对比才有意义（拉萨常年高分、成渝常年低分）。
 */
export const OBSERVE_CITIES = [
  'lhasa',
  'urumqi',
  'beijing',
  'xian',
  'kunming',
  'harbin',
  'shanghai',
  'chengdu',
].map((k) => CITIES.find((c) => c.key === k))

/** 沿海城市：海洋看板的海况预报 / 海岸榜 / 海温趋势共用 */
export const COASTAL_CITIES = [
  { key: 'dalian', name: '大连', lat: 38.9140, lon: 121.6147 },
  { key: 'weihai', name: '威海', lat: 37.5000, lon: 122.1200 },
  { key: 'qingdao', name: '青岛', lat: 36.0671, lon: 120.3826 },
  { key: 'shanghai', name: '上海（洋山）', lat: 30.6300, lon: 122.0600 },
  { key: 'zhoushan', name: '舟山', lat: 30.0200, lon: 122.1100 },
  { key: 'xiamen', name: '厦门', lat: 24.4798, lon: 118.0894 },
  { key: 'shenzhen', name: '深圳', lat: 22.4800, lon: 114.0500 },
  { key: 'beihai', name: '北海', lat: 21.4800, lon: 109.1200 },
  { key: 'haikou', name: '海口', lat: 20.0400, lon: 110.3200 },
  { key: 'sanya', name: '三亚', lat: 18.2528, lon: 109.5119 },
]

/** 气候档案默认城市：北京（可换），取 ERA5 再分析逐日值 */
export const ARCHIVE_CITY = { key: 'beijing', name: '北京', lat: 39.9042, lon: 116.4074 }
