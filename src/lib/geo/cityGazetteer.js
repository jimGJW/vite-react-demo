/**
 * 城市经纬度词典（纯函数，可 node 直跑断言）。
 *
 * 数据来自 `scripts/build-city-gazetteer.mjs` 的产物 `public/data/city-gazetteer.json`：
 * GeoNames 真实城市 + 中文别名 + ISO 国码，运行时惰性拉取，不发任何网络请求。
 *
 * 设计要点：
 *   - parseGazetteer：把「竖线字符串行」还原成对象表，并**顺手算好匹配键**
 *     （每次检索再归一化 6 万条 × 4 个别名，纯浪费）。
 *   - normalizeCityKey：小写 + 去变音符 + 去掉空格连字符点。
 *     「Bogotá」和「bogota」是同一个城市；「New York」和「newyork」也是。
 *   - searchCities：四档打分（全等 > 输入比别名长 > 别名比输入长 > 包含），
 *     同档按人口降序。「城市, 国家」写法可用第二段过滤，避免同名城市刷屏。
 *   - 同名城市很多（美国 Springfield 几十个），所以返回的是**候选列表**而不是单个结果，
 *     由用户点选具体那一个 —— 这是地理编码行业的标准做法，别自作主张只回一条。
 */

/** 中文地名里常见的通名后缀；用户输入带这些字而别名不带时，仍应命中 */
const ZH_SUFFIXES = ['市', '县', '区', '州', '盟', '旗']

/** 把国码转成旗帜 emoji（区域指示符）；非法国码返回空串 */
export function flagEmoji(cc) {
  const s = String(cc || '').toUpperCase()
  if (!/^[A-Z]{2}$/.test(s)) return ''
  return String.fromCodePoint(...[...s].map((ch) => 0x1f1e6 - 65 + ch.charCodeAt(0)))
}

/**
 * 匹配键归一化：小写、NFD 拆出组合符后丢掉（去变音）、去掉分隔符。
 * 汉字不受影响（本身没有变音符、也不会被 NFD 拆开）。
 */
export function normalizeCityKey(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[ '’.\-_·,，、]/g, '')
}

/** 是否含汉字（决定中文界面下能不能直接用地名原文显示） */
const hasCJK = (s) => /[一-鿿㐀-䶿]/.test(String(s || ''))

/**
 * 解析产物为内存表。
 * @returns {{ countries: Object<string, [string,string]>, cities: Array<Object> }}
 */
export function parseGazetteer(payload) {
  const rows = payload && payload.cities
  if (!Array.isArray(rows)) throw new Error('城市词典结构异常（缺 cities 字段）')
  const cities = []
  for (const line of rows) {
    const f = String(line).split('|')
    if (f.length < 5) continue
    const name = f[0]
    const lat = Number(f[2])
    const lng = Number(f[3])
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const zh = (f[6] || '').split(',').filter(Boolean)
    const asci = f[1] || name
    const pop = f[5] ? Number(f[5]) || 0 : 0
    // 匹配键：拉丁名 + 别名，全部预先归一化；zh 原文也留一份给中文直接比对
    const keys = [...new Set([name, asci, ...zh].map(normalizeCityKey))].filter(Boolean)
    cities.push({ name, asci, lat, lng, cc: f[4], pop, zh, keys })
  }
  return { countries: (payload && payload.countries) || {}, cities }
}

/** 用户爱写但不在 ISO 表里的常用国码别名 */
const CC_ALIASES = { UK: 'GB' }

/**
 * 国名表第二列可能是**英文名数组**（i18n-iso-countries 会同时给官方名与简称，
 * 如 GB → ['United Kingdom', 'UK', 'Great Britain']），直接返回数组会让界面拼出一串。
 * 取「日常最常用」的一个：先排除全大写简称，再取词数最少，剩下按上游原序（官方名在前）。
 */
function bestEnLabel(pair) {
  const list = (Array.isArray(pair[1]) ? pair[1] : [pair[1]])
    .map((s) => String(s || '').trim())
    .filter(Boolean)
  if (!list.length) return String(pair[0] || '')
  const words = (s) => s.split(/\s+/).length
  const isAbbr = (s) => /^[A-Z]{2,5}$/.test(s)
  const order = new Map(list.map((s, i) => [s, i]))
  return [...list].sort(
    (a, b) => (isAbbr(a) ? 1 : 0) - (isAbbr(b) ? 1 : 0) || words(a) - words(b) || order.get(a) - order.get(b),
  )[0]
}

/** 一个国家的所有可匹配写法（中文名 + 全部英文别名），归一化后缓存用 */
function countryAliasKeys(pair) {
  const arr = Array.isArray(pair) ? pair : [pair]
  const out = []
  for (const item of arr) {
    if (Array.isArray(item)) out.push(...countryAliasKeys(item))
    else out.push(normalizeCityKey(item))
  }
  return out.filter(Boolean)
}

/**
 * 「城市, 国家」的第二段 → 允许出现的国码集合。
 *
 * 先把限定解析成国码集合，检索循环里只剩一次 Set.has：
 * 早先是逐城市归一化国家名 + includes，6 万条跑下来 100ms+，改成预算一次 ≈10ms。
 * 限定解析不出任何国家时**忽略它**（宁可多给结果，也不要因为用户写了个
 * 不存在的国家名而显示「查无此城」）。
 */
function resolveCountryFilter(countries, hint) {
  const raw = String(hint || '').trim()
  if (!raw) return null
  if (/^[A-Za-z]{2}$/.test(raw)) return new Set([CC_ALIASES[raw.toUpperCase()] || raw.toUpperCase()])
  const h = normalizeCityKey(raw.replace(/[国地区]$/, ''))
  if (!h) return null
  const codes = new Set()
  for (const [cc, pair] of Object.entries(countries)) {
    if (countryAliasKeys(pair).some((k) => k.includes(h))) codes.add(cc)
  }
  // 「英国」这类在中文里是常用说法、但表里只有「英国 / United Kingdom」的情况已由上面覆盖；
  // 全查不到说明用户写的不是国家名，放弃这一档过滤。
  return codes.size ? codes : null
}

/**
 * 城市名模糊检索。
 *
 * @param {Array} cities parseGazetteer 出来的城市表
 * @param {string} query 用户输入，支持「城市」「城市, 国家」两种写法
 * @param {{ limit?: number, countries?: Object }} [opts]
 * @returns {Array<{ city: Object, score: number, matched: string }>} 按相关性 + 人口排序
 */
export function searchCities(cities, query, opts = {}) {
  const limit = opts.limit ?? 20
  const countries = opts.countries || {}
  const raw = String(query || '').trim()
  if (!raw || !Array.isArray(cities)) return []

  const sep = raw.search(/[,，]/)
  const namePart = sep === -1 ? raw : raw.slice(0, sep)
  const hintPart = sep === -1 ? '' : raw.slice(sep + 1)
  const q = normalizeCityKey(namePart)
  if (!q) return []
  // 中文输入的通名后缀（北京市 → 北京）单独再试一次，命中更干净
  let qBare = q
  for (const s of ZH_SUFFIXES) {
    if (qBare.length > 2 && qBare.endsWith(s)) {
      qBare = qBare.slice(0, -s.length)
      break
    }
  }

  const ccFilter = resolveCountryFilter(countries, hintPart)

  const out = []
  for (const city of cities) {
    if (ccFilter && !ccFilter.has(city.cc)) continue
    let tier = 4
    let matched = ''
    for (const k of city.keys) {
      let s
      if (k === q || k === qBare) s = 0
      // 「输入比别名长」= 用户多打了通名（北京市 ⊃ 北京）。
      // 单字别名不参与这一档：日本真有个城市叫「北」，否则输入「北京市」
      // 会被它按前缀抢走结果。
      else if (k.length >= 2 && (q.startsWith(k) || qBare.startsWith(k))) s = 1
      else if (k.startsWith(q)) s = 2
      else if (k.includes(q)) s = 3
      else continue
      if (s < tier) {
        tier = s
        matched = k
      }
      if (tier === 0) break
    }
    if (tier < 4) out.push({ city, score: tier, matched })
  }

  out.sort((a, b) => a.score - b.score || b.city.pop - a.city.pop || a.city.name.localeCompare(b.city.name))
  return out.slice(0, limit)
}

/**
 * 国家 / 地区显示名：中文族用中文名，其余语种用英文名；查不到回落到 ISO 码。
 * 词典里只有中英两稿（与项目「数据模块多语化」一致），非中英文语种显示英文是有意为之，
 * 而不是渲染成 undefined。
 */
export function countryLabel(countries, cc, lang = 'zh-CN') {
  const pair = countries && countries[cc]
  if (!pair) return cc || ''
  return String(lang || '').startsWith('zh') ? String(pair[0]) : bestEnLabel(pair)
}

/**
 * 城市显示名：中文界面优先用汉字别名，其余界面用拉丁名。
 * 汉字别名缺失时（多数欧美小城镇）就显示拉丁名 —— 不硬造翻译。
 */
export function cityDisplayName(city, lang = 'zh-CN') {
  if (!city) return ''
  if (String(lang || '').startsWith('zh')) {
    if (city.zh && city.zh.length) return city.zh[0]
    return hasCJK(city.name) ? city.name : city.asci || city.name
  }
  return city.asci || city.name
}

/** 人口展示：超过 1 万用「x 万」，其余原样；缺失返回空串让 UI 决定要不要显示 */
export function formatPopulation(pop, lang = 'zh-CN') {
  if (!Number.isFinite(pop) || pop <= 0) return ''
  if (String(lang || '').startsWith('zh')) {
    return pop >= 10_000 ? `${(pop / 10_000).toFixed(pop >= 1_000_000 ? 0 : 1)} 万` : String(pop)
  }
  return pop.toLocaleString('en-US')
}
