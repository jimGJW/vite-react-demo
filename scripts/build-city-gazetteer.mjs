/**
 * 生成城市经纬度词典 —— 一次性脚本，产物提交进仓库，运行时不依赖网络。
 *
 * 为什么要有这个脚本：
 *   「经纬度检查」页要支持「输入任意一个真实城市 → 输出经纬度」。
 *   在线地理编码接口（Nominatim 等）在本机直连不通（实测 000），且把用户输入
 *   发给第三方既慢又不可控。所以离线取一份**地名 → 经纬度**的词典：
 *   GeoNames `cities1000`（人口 ≥1000 的定居点，17 万余条，公有领域数据）。
 *
 * 为什么要裁剪：
 *   原始 TSV 约 31MB，浏览器一次性吃下没道理。这里做三件事：
 *     1. 只留「人口 ≥1 万」或「带中文别名」的行 —— 前者是任何国家成规模的城市，
 *        后者保证中文用户输入小城市（如 香格里拉 / 景德镇）也能命中；
 *     2. 每行压成竖线分隔的字符串，坐标 4 位小数（≈11m 精度，城市级别足够）；
 *     3. 中文别名只留纯汉字（剔除日文假名/韩文），繁体再补一份简体写法，最多 5 个，
 *        简体在前、短的在前（首位就是界面显示名）。
 *   产物 63,607 城 / 约 3MB（gzip 后 ≈1.5MB），只在用户真正用城市查询时惰性拉取。
 *
 * 国名双语表来自 i18n-iso-countries（zh + en 两份 lang JSON），
 * 用于结果里展示「国家 / 地区」，不必前端再去查 ISO 码表。
 *
 * 用法：node scripts/build-city-gazetteer.mjs
 *      （需要外网 + 系统 `unzip`；改了筛选口径重跑即可。缓存在 scripts/.cache/，不入库）
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CACHE = resolve(__dirname, '.cache')
const OUT = resolve(__dirname, '../public/data/city-gazetteer.json')

const DUMP_URL = 'https://download.geonames.org/export/dump/cities1000.zip'
const DUMP_ENTRY = 'cities1000.txt'
const DUMP_TSV = resolve(CACHE, DUMP_ENTRY)
const CDN = 'https://cdn.jsdelivr.net/npm/i18n-iso-countries@7.7.0/langs'

/**
 * 简繁对照来自 Unihan（Unicode 官方字库）。
 *
 * 为什么需要：GeoNames 的中文别名来自各语言维基，同一个城市可能是繁体
 * （纽约 = 紐約、华沙 = 華沙）。简体用户输入「纽约」时若产物只有「紐約」，
 * 检索会当成「查无此城」—— 这是最容易被忽略又最难自测的一类缺口。
 *
 * 取法：`kTraditionalVariant` 是「简体码位 → 繁体码位列表」，反转即得繁→简，
 * 每个繁体字因此拿到唯一的简体来源字（个别繁体字被多个简体字引用时取先出现的，
 * 城市名里这类歧义极少，且我们**繁简两式都保留**，不会因为转换而丢原别名）。
 */
const UNIHAN_URL = 'https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip'
const UNIHAN_ENTRY = 'Unihan_Variants.txt'
const UNIHAN_FILE = resolve(CACHE, UNIHAN_ENTRY)

/** 人口下限：低于这个数的小聚落，检索价值低且上游数据噪声大 */
const POP_MIN = 10_000
/** 每城最多保留的中文别名个数（北京 / 北京市 这类同义形式留着做匹配用） */
const ZH_ALIAS_MAX = 5

/**
 * 「必须能查到」的样本城市，逐条钉住产物质量。
 * 覆盖四类：中文大城市、中文小城市（靠中文别名入选）、拉丁字母城市、
 * 外国城市的中文别名（纽约/伦敦 —— 验证别名提取链路而不是只验证本国城市）。
 * 任一条查不到 = 筛选口径或别名提取出了问题，直接失败而不是悄悄少一批数据。
 *
 * 踩过的坑：这里原来写的是 'New York'，脚本报「未收录」——
 * GeoNames 2018 年后把这条改成了 'New York City'。样本名要照着数据源的实际写法钉，
 * 不能照着自己的印象钉，否则自检会把正常数据判成坏数据。
 */
const MUST_HIT = [
  '北京', '上海', '成都', '拉萨', '深圳', '景德镇', '香格里拉', '伊宁',
  'Chengdu', 'London', 'Paris', 'New York City', 'Cairo', 'Moscow', 'Sydney', 'Bautzen',
  '纽约', '伦敦',
]

/** 纯汉字（扩展 A 区 + 基本区 + 间隔号），假名/谚文在上一步已被剔除 */
const CJK_ONLY = /^[㐀-䶿一-鿿·]+$/
/** 日文假名 / 韩文谚文 —— 出现即说明这条别名不是中文名 */
const KANA_HANGUL = /[ぁ-ゟァ-ヿ가-힯]/

async function fetchResponse(url, timeoutMs = 60_000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'vite-react-demo/city-gazetteer/1.0 (local dev)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`)
    return res
  } catch (e) {
    if (e?.name === 'AbortError') throw new Error(`下载超时（${Math.round(timeoutMs / 1000)} 秒）：${url}`)
    throw e
  } finally {
    clearTimeout(timer)
  }
}

const fetchText = async (url) => (await fetchResponse(url)).text()

/** zip 必须按字节落盘 —— 用 text() 解码会把二进制数据弄坏（unzip 报 central directory not found） */
const fetchBytes = async (url, timeoutMs) => Buffer.from(await (await fetchResponse(url, timeoutMs)).arrayBuffer())

/**
 * 确保缓存里有 zip 内的某个条目：没有就下载 zip 并用系统 unzip 解出该条目。
 * 缓存存在时直接复用，重跑脚本不再打网络。
 */
async function ensureCachedEntry(url, entry, outPath, zipName, timeoutMs) {
  try {
    await readFile(outPath)
    console.log(`[city-gazetteer] 复用缓存 ${outPath}`)
    return
  } catch {
    /* 没有缓存，往下走下载 */
  }
  await mkdir(CACHE, { recursive: true })
  const zipPath = resolve(CACHE, zipName)
  console.log(`[city-gazetteer] 下载 ${url}`)
  const zip = await fetchBytes(url, timeoutMs)
  // 上游偶尔返回 HTML 错误页；体积对不上就立刻失败，别把坏 zip 塞给 unzip
  if (zip.length < 1_000_000) {
    throw new Error(`下载内容异常（仅 ${zip.length} 字节，疑似错误页），未写入 ${zipPath}`)
  }
  await writeFile(zipPath, zip)
  const r = spawnSync('unzip', ['-o', '-qq', zipPath, entry, '-d', CACHE], { encoding: 'utf8' })
  if (r.error && r.error.code === 'ENOENT') {
    throw new Error(`未找到系统 \`unzip\` 命令；请手动把 ${entry} 放到 ${CACHE} 后重跑`)
  }
  if (r.status !== 0) throw new Error(`unzip ${entry} 失败：${r.stderr || r.status}`)
  console.log(`[city-gazetteer] 解压完成 ${outPath}`)
}

/**
 * 读 Unihan 的 kTraditionalVariant，反转成「繁体字 → 简体字」逐字表。
 * 同一繁体字被多个简体字引用时保留首个来源（城市名里几乎不撞这类歧义）。
 */
async function loadTraditionalToSimplified() {
  const text = await readFile(UNIHAN_FILE, 'utf8')
  const map = new Map()
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue
    const [src, field, targets] = line.split('\t')
    if (field !== 'kTraditionalVariant' || !targets) continue
    const simplified = String.fromCodePoint(parseInt(src.slice(1), 16))
    for (const t of targets.split(' ')) {
      if (!t) continue
      const ch = String.fromCodePoint(parseInt(t.slice(1), 16))
      if (!map.has(ch)) map.set(ch, simplified)
    }
  }
  return map
}

/** 逐字繁→简；未收录的字原样保留 */
function toSimplified(s, map) {
  let out = ''
  for (const ch of s) out += map.get(ch) || ch
  return out
}

/** 解析双语国名表：{ CC: [中文名, 英文名（i18n-iso-countries 少数国家是别名数组）] } */
async function loadCountries() {
  const [zh, en] = await Promise.all([
    fetchText(`${CDN}/zh.json`).then(JSON.parse),
    fetchText(`${CDN}/en.json`).then(JSON.parse),
  ])
  const out = {}
  for (const cc of Object.keys(zh.countries)) {
    out[cc] = [zh.countries[cc], en.countries[cc] || zh.countries[cc]]
  }
  return out
}

/** 上游地名可能带竖线 / 换行，会破坏行格式 —— 统一换成空格 */
const sanitize = (s) => String(s || '').replace(/[|\r\n]+/g, ' ').trim()

/**
 * 取中文别名：纯汉字（假名/谚文剔除）、去重，并为繁体补一份简体写法。
 *
 * 首位就是界面显示名，所以排序规则要挑「这个城市在中文里通常怎么被叫」，
 * 实测三档都不够（只按「简体 + 短」排会把成都排成「天府」、上海排成「沪」）：
 *   1. 上游官方名优先 —— name 字段本身就是汉字时（中国县城常见）最权威；
 *   2. 简体优先 —— 繁体补出来的简体优于繁体原式；
 *   3. 「是其它别名的前缀」优先 —— 成都是「成都市」的前缀，天府不是任何别名的前缀，
 *      这一条专门把别称（天府 / 沪 / 金陵）挤出显示位，同时它们仍留在表里参与匹配；
 *   4. 最后才是短者优先。
 */
function pickZhAliases(nameField, alternatenames, tsMap) {
  const source = sanitize(nameField)
  const pool = [source, ...String(alternatenames || '').split(',')]
  const seen = new Set()
  const zh = []
  for (const raw of pool) {
    const s = sanitize(raw)
    if (!s || seen.has(s)) continue
    if (KANA_HANGUL.test(s)) continue
    if (!CJK_ONLY.test(s)) continue
    seen.add(s)
    zh.push(s)
    const sc = toSimplified(s, tsMap)
    if (sc !== s && !seen.has(sc)) {
      seen.add(sc)
      zh.push(sc)
    }
  }
  const flag = (cond) => (cond ? 0 : 1)
  const isSimplified = (s) => toSimplified(s, tsMap) === s
  const isPrefixOfAnother = (s) => zh.some((o) => o !== s && o.startsWith(s))
  zh.sort(
    (a, b) =>
      flag(a === source) - flag(b === source) ||
      flag(isSimplified(a)) - flag(isSimplified(b)) ||
      flag(isPrefixOfAnother(a)) - flag(isPrefixOfAnother(b)) ||
      a.length - b.length ||
      a.localeCompare(b),
  )
  return zh.slice(0, ZH_ALIAS_MAX)
}

/**
 * 显示名钉板：别名首位必须是「中文里通常怎么叫这个城市」。
 * 左边的 key 可以是任何一个别名（含别称），右边是期望的显示名。
 * 只按长度排序时这里会红：成都曾经显示成「天府」。
 */
const DISPLAY_MUST = {
  成都: '成都',
  天府: '成都',
  上海市: '上海',
  沪: '上海',
  北京: '北京',
  紐約: '纽约',
}

/**
 * 自检：产物结构 + 坐标合法性 + 国家码闭合 + 样本城市命中 + 显示名正确。
 * 数据类问题在浏览器里表现为「搜不到」或「名字奇怪」这种说不清的现象，必须在生成时就拦掉。
 */
function assertGazetteer(rows, countries) {
  if (rows.length < 40_000) throw new Error(`城市行数异常偏少（${rows.length}），筛选口径是不是写错了`)

  const badCoord = []
  const badCc = []
  for (const line of rows) {
    if (line.includes('\n')) throw new Error(`行内含换行：${line.slice(0, 40)}`)
    const f = line.split('|')
    if (f.length < 5) {
      badCoord.push(line)
      continue
    }
    const lat = Number(f[2])
    const lng = Number(f[3])
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      badCoord.push(line)
    }
    if (!countries[f[4]]) badCc.push(line)
  }
  if (badCoord.length) throw new Error(`坐标非法 ${badCoord.length} 行，示例：${badCoord[0]}`)
  if (badCc.length) throw new Error(`国家码缺表 ${badCc.length} 行，示例：${badCc[0]}`)

  const miss = MUST_HIT.filter((q) => !rows.some((line) => line.split('|').slice(0, 2).includes(q) || (line.split('|')[6] || '').split(',').includes(q)))
  if (miss.length) throw new Error(`样本城市未收录：${miss.join(' ')}`)

  // 别名 → 该城显示名（首位别名）
  const displayOf = new Map()
  for (const line of rows) {
    const f = line.split('|')
    const first = (f[6] || '').split(',')[0]
    if (!first) continue
    for (const a of (f[6] || '').split(',')) if (a && !displayOf.has(a)) displayOf.set(a, first)
    if (!displayOf.has(f[0]) && CJK_ONLY.test(f[0])) displayOf.set(f[0], first)
  }
  const badDisplay = Object.entries(DISPLAY_MUST).filter(([alias, want]) => displayOf.get(alias) !== want)
  if (badDisplay.length) {
    throw new Error(`显示名不符：${badDisplay.map(([a, w]) => `${a}→${displayOf.get(a) || '（无别名）'}（应为 ${w}）`).join('；')}`)
  }
}

async function main() {
  await Promise.all([
    ensureCachedEntry(DUMP_URL, DUMP_ENTRY, DUMP_TSV, 'cities1000.zip', 600_000),
    ensureCachedEntry(UNIHAN_URL, UNIHAN_ENTRY, UNIHAN_FILE, 'Unihan.zip', 600_000),
  ])
  const [tsv, countries, tsMap] = await Promise.all([
    readFile(DUMP_TSV, 'utf8'),
    loadCountries(),
    loadTraditionalToSimplified(),
  ])
  // 繁简表只有几千条，解析出几百条说明文件不对或字段名变了
  if (tsMap.size < 2000) throw new Error(`Unihan 繁简表异常（仅 ${tsMap.size} 条），检查 ${UNIHAN_FILE}`)

  const lines = tsv.split('\n')
  let scanned = 0
  let noCoord = 0
  let zhDerived = 0
  const rows = []
  for (const line of lines) {
    if (!line.trim()) continue
    const f = line.split('\t')
    if (f.length < 15) continue
    scanned++
    const name = sanitize(f[1])
    const asci = sanitize(f[2])
    const lat = Number(f[4])
    const lng = Number(f[5])
    const cc = sanitize(f[8]).toUpperCase()
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng) || !cc) {
      noCoord++
      continue
    }
    // 第 15 列才是人口（第 14 列是 admin4，cities1000 里通常为空）
    const pop = Number(f[14]) || 0
    const zh = pickZhAliases(name, f[3], tsMap)
    // 统计「繁体补出来的简体」条数：不在上游别名里、却进了产物的那些
    const upstream = new Set([name, ...String(f[3] || '').split(',').map(sanitize)])
    zhDerived += zh.filter((a) => !upstream.has(a)).length
    // 入选口径：成规模的城市，或任何有中文名的定居点（后者保证中文输入能命中）
    if (pop < POP_MIN && !zh.length) continue
    const fields = [name, asci === name ? '' : asci, lat.toFixed(4), lng.toFixed(4), cc, pop ? String(pop) : '', zh.join(',')]
    rows.push(fields.join('|').replace(/\|+$/, ''))
  }

  rows.sort()
  assertGazetteer(rows, countries)

  const withZh = rows.filter((r) => r.split('|')[6]).length

  const payload = {
    meta: {
      source: 'GeoNames cities1000（公有领域）+ i18n-iso-countries 国名表 + Unihan kTraditionalVariant 繁简对照',
      generatedAt: new Date().toISOString().slice(0, 10),
      rule: `人口 ≥${POP_MIN} 或带中文别名；坐标 4 位小数；中文别名最多 ${ZH_ALIAS_MAX} 个、简体在前短者在前（繁体原式一并保留）`,
      counts: {
        cities: rows.length,
        withZhAlias: withZh,
        zhSimplifiedDerived: zhDerived,
        countries: Object.keys(countries).length,
      },
      schema: {
        cities: 'name|asciiname(同名则留空)|lat|lng|countryCode|population(未知则留空)|中文别名逗号分隔',
        countries: '{ CC: [中文名, 英文名或英文别名数组] }',
      },
    },
    countries,
    cities: rows,
  }

  await mkdir(dirname(OUT), { recursive: true })
  const text = JSON.stringify(payload)
  await writeFile(OUT, text, 'utf8')

  console.log('[city-gazetteer] 产物统计：')
  console.log(`  扫描 ${scanned} 行，丢弃无坐标/无国码 ${noCoord} 行`)
  console.log(`  收录城市 ${rows.length} 个（其中 ${withZh} 个带中文别名，${((withZh / rows.length) * 100).toFixed(1)}%）`)
  console.log(`  繁体补简体 ${zhDerived} 城（繁简表 ${tsMap.size} 字）`)
  console.log(`  国名 ${Object.keys(countries).length} 个`)
  console.log(`  体积 ${(text.length / 1024 / 1024).toFixed(2)} MB（原始 TSV ≈31MB）`)
  console.log(`  写入 ${OUT}`)
}

main().catch((e) => {
  console.error('[city-gazetteer] 失败:', e.message)
  process.exitCode = 1
})
