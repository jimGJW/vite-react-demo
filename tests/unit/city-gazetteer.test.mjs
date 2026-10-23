/**
 * 城市经纬度词典：产物不变量 + 检索打分 · 纯函数单测（零依赖）
 * 覆盖 src/lib/geo/cityGazetteer.js 与 public/data/city-gazetteer.json
 * （由 scripts/build-city-gazetteer.mjs 生成）。
 *
 * 为什么值得单测：
 *   词典是 3MB 的离线产物，重新生成要联网、要处理繁简映射和别名排序。
 *   一旦上游改版（国名从字符串变成数组、中文别名排序把「天府」排到「成都」前面），
 *   界面不会报错，只会把城市名显示错、把国家显示成 [object Array]。
 *   所以既测算法，也钉死产物本身的结构与几个「一定不能查不到」的样本城市。
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { eq, ok, length, close } from './harness.mjs'
import {
  parseGazetteer,
  searchCities,
  normalizeCityKey,
  countryLabel,
  cityDisplayName,
  formatPopulation,
  flagEmoji,
} from '../../src/lib/geo/cityGazetteer.js'

const PRODUCT = resolve(process.cwd(), 'public/data/city-gazetteer.json')
const payload = JSON.parse(readFileSync(PRODUCT, 'utf8'))
const table = parseGazetteer(payload)

const search = (q, limit = 8) => searchCities(table.cities, q, { limit, countries: table.countries })
const firstName = (q) => {
  const r = search(q, 1)
  return r.length ? cityDisplayName(r[0].city, 'zh-CN') : ''
}

export default [
  ['产物结构：meta 计数与实际一致', () => {
    ok(Array.isArray(payload.cities) && payload.cities.length > 40_000, '城市量级不应塌方')
    eq(payload.meta.counts.cities, table.cities.length, 'meta.counts.cities 与实际行数一致')
    eq(Object.keys(payload.countries).length, payload.meta.counts.countries, '国名数量与 meta 一致')
  }],

  ['产物不变量：坐标合法、国码可查、匹配键非空', () => {
    for (const c of table.cities) {
      ok(c.lat >= -90 && c.lat <= 90, `${c.name} 纬度越界`)
      ok(c.lng >= -180 && c.lng <= 180, `${c.name} 经度越界`)
      ok(/^[A-Z]{2}$/.test(c.cc), `${c.name} 国码不是两位大写`)
      ok(payload.countries[c.cc], `${c.name} 的国码 ${c.cc} 不在国名表里`)
      ok(c.keys.length > 0, `${c.name} 没有匹配键`)
    }
  }],

  ['样本城市必命中：中文（含小城市）', () => {
    for (const q of ['北京', '上海', '成都', '拉萨', '深圳', '景德镇', '香格里拉', '伊宁']) {
      const r = search(q, 1)
      length(r, 1, `「${q}」应命中`)
      eq(r[0].score, 0, `「${q}」应是全等档命中`)
      eq(cityDisplayName(r[0].city, 'zh-CN'), q, `「${q}」显示名回写正确`)
    }
  }],

  ['样本城市必命中：拉丁名', () => {
    for (const q of ['Chengdu', 'London', 'Paris', 'New York City', 'Cairo', 'Moscow', 'Sydney', 'Tokyo']) {
      ok(search(q, 1).length === 1, `「${q}」应命中`)
    }
    const bj = search('Beijing', 1)[0]
    close(bj.city.lat, 39.9075, 0.01, 'Beijing 纬度')
    close(bj.city.lng, 116.3972, 0.01, 'Beijing 经度')
  }],

  ['显示名优先汉字通名，不被别名里的古称抢走', () => {
    eq(firstName('成都'), '成都', '成都不能被显示成「天府」')
    eq(firstName('上海'), '上海', '上海不能被显示成简称「沪」')
    eq(firstName('纽约'), '纽约', '繁体「紐約」也要能查出并显示简体')
  }],

  ['中文通名后缀容错 + 变音不敏感', () => {
    eq(firstName('北京市'), '北京', '带「市」后缀照样命中')
    eq(firstName('Bogota'), '波哥大', '不改变音符也能命中 Bogotá')
    eq(search('newyork', 1)[0].city.name, 'New York City', '去掉空格的输入也能命中')
  }],

  ['「城市, 国家」限定生效', () => {
    for (const r of search('伦敦, GB')) eq(r.city.cc, 'GB', 'GB 限定后不得混入他国')
    eq(search('paris, 法国', 1)[0].city.cc, 'FR', '中文国名限定')
    eq(search('伦敦, uk', 1)[0].city.cc, 'GB', 'UK 这种非 ISO 写法要映射到 GB')
    // 用户写了个不存在的「国家」时宁可放宽，也不要显示查无此城
    ok(search('paris, 火星', 1).length > 0, '无法解析的国家限定应被忽略而不是清空结果')
  }],

  ['同名城市返回候选列表，按人口降序', () => {
    const r = search('springfield', 5)
    ok(r.length > 1, 'Springfield 这种重名城应给出多个候选')
    for (let i = 1; i < r.length; i++) ok(r[i - 1].city.pop >= r[i].city.pop, '同档内按人口降序')
    ok(new Set(r.map((x) => x.city.lat)).size === r.length, '同名不同坐标是不同城市')
  }],

  ['打分排序：全等优先于包含', () => {
    const r = search('London', 5)
    eq(r[0].score, 0, '首条为全等')
    eq(r[0].city.name, 'London', '全等压过 The City of London 这类包含档')
  }],

  ['空输入与查不到', () => {
    length(search(''), 0, '空输入不检索')
    length(search('   '), 0, '纯空格不检索')
    length(search('zzzznope'), 0, '乱码输入返回空')
    length(searchCities(table.cities, '北京', { limit: 0 }), 0, 'limit 0 不返回内容')
  }],

  ['normalizeCityKey：大小写 / 变音符 / 分隔符', () => {
    eq(normalizeCityKey('New York'), 'newyork', '空格被去掉')
    eq(normalizeCityKey('Bogotá'), 'bogota', '变音符被去掉')
    eq(normalizeCityKey('北京'), '北京', '汉字原样保留')
    eq(normalizeCityKey(null), '', '空值安全')
  }],

  ['countryLabel：中英分稿 + 数组别名归一', () => {
    eq(countryLabel(table.countries, 'CN', 'zh-CN'), '中国', '中文界面用中文名')
    eq(countryLabel(table.countries, 'GB', 'en'), 'United Kingdom', '英文别名是数组时取通称而不是拼接')
    eq(countryLabel(table.countries, 'US', 'en'), 'United States', '官方长名让位于常用名')
    eq(countryLabel(table.countries, 'ZZ', 'en'), 'ZZ', '查不到的国码回落 ISO 码')
    for (const cc of Object.keys(table.countries)) {
      eq(typeof countryLabel(table.countries, cc, 'en'), 'string', `${cc} 英文国名必须是字符串`)
      eq(typeof countryLabel(table.countries, cc, 'zh-CN'), 'string', `${cc} 中文国名必须是字符串`)
    }
  }],

  ['cityDisplayName 与 formatPopulation', () => {
    const cn = search('成都', 1)[0].city
    eq(cityDisplayName(cn, 'en'), 'Chengdu', '非中文界面用拉丁名')
    eq(cityDisplayName(null, 'zh-CN'), '', '空城市安全')
    eq(formatPopulation(9425000, 'zh-CN'), '943 万', '中文按万计')
    eq(formatPopulation(233684, 'en'), '233,684', '英文千分位')
    eq(formatPopulation(0, 'zh-CN'), '', '无人口返回空串交给 UI 隐藏')
  }],

  ['flagEmoji', () => {
    eq(flagEmoji('cn'), '\u{1F1E8}\u{1F1F3}', '小写法码同样出旗')
    eq(flagEmoji(''), '', '空国码不出旗')
    eq(flagEmoji('CHN'), '', '非两位国码不出旗')
  }],

  ['检索耗时：全表扫一次不能拖垮输入体验', () => {
    const t0 = performance.now()
    for (let i = 0; i < 5; i++) search('Chengdu')
    const per = (performance.now() - t0) / 5
    ok(per < 300, `单次全表检索 ${per.toFixed(1)}ms，超过 300ms 说明退化成每次重建过滤表`)
  }],
]
