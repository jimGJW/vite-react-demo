import { eq, ok, length, close } from './harness.mjs'
import {
  COUNTRIES,
  COUNTRY_COUNT,
  distanceKm,
  validateCoord,
  locate,
  searchCountries,
} from '../../src/lib/geo/latLng.js'

export default [
  ['COUNTRIES 数据集非空且条目数稳定', () => {
    ok(Array.isArray(COUNTRIES) && COUNTRIES.length > 30, '国家数据应 ≥30 条')
    eq(COUNTRY_COUNT, COUNTRIES.length, 'COUNTRY_COUNT 与实际数组长度一致')
    for (const c of COUNTRIES) {
      ok(typeof c.code === 'string' && c.code.length === 2, `国家 ${c.code} 缺 ISO 码`)
      ok(c.name && typeof c.name === 'object' && typeof c.name['zh-CN'] === 'string', `国家 ${c.code} 缺双语名`)
      ok(Number.isFinite(c.lat) && Number.isFinite(c.lng), `国家 ${c.code} 坐标非法`)
      ok(Array.isArray(c.box) && c.box.length === 4, `国家 ${c.code} 边界框应为 4 元组`)
      const [a, b, c2, d] = c.box
      ok(a <= c2 && b <= d, `国家 ${c.code} 边界框 min>max`)
    }
  }],
  ['validateCoord：合法 / 越界 / 非数', () => {
    ok(validateCoord(39.9, 116.4).ok, '北京坐标应合法')
    eq(validateCoord(91, 0).error, 'latRange', '纬度 >90 报错')
    eq(validateCoord(-91, 0).error, 'latRange', '纬度 <-90 报错')
    eq(validateCoord(0, 181).error, 'lngRange', '经度 >180 报错')
    eq(validateCoord(0, -181).error, 'lngRange', '经度 <-180 报错')
    eq(validateCoord('abc', 0).error, 'nan', '非数报错')
    eq(validateCoord('', '').error, 'nan', '空串报错')
  }],
  ['distanceKm：同点 0 / 伦敦-巴黎约 343km / 半球对跖约 20015km', () => {
    close(distanceKm(0, 0, 0, 0), 0, 1e-6, '同点距离应为 0')
    close(distanceKm(51.5074, -0.1278, 48.8566, 2.3522), 343, 30, '伦敦-巴黎约 343km')
    close(distanceKm(0, 0, 0, 180), 20015, 50, '对跖经度距约 20015km')
  }],
  ['locate：北京落在境内 → 中国；东京落在境内 → 日本', () => {
    const bj = locate(39.9042, 116.4074)
    eq(bj.mode, 'inside', '北京应在某边界框内')
    eq(bj.country.code, 'CN', '北京归属中国')
    const tk = locate(35.6762, 139.6503)
    eq(tk.mode, 'inside', '东京应在某边界框内')
    eq(tk.country.code, 'JP', '东京归属日本')
  }],
  ['locate：太平洋公海点 → 最近国家（nearest）；南极点 → 南极洲', () => {
    const sea = locate(0, -160)
    eq(sea.mode, 'nearest', '中途太平洋不应落入任何边界框')
    ok(sea.found && sea.country, '公海点仍返回最近国家')
    ok(Number.isFinite(sea.distKm) && sea.distKm > 0, '最近距离应 >0')
    const ant = locate(-82, 0)
    eq(ant.mode, 'inside', '南极点应在南极洲边界框内')
    eq(ant.country.code, 'AQ', '南极点归属南极洲')
  }],
  ['locate：非法坐标 → invalid', () => {
    const r = locate('x', 0)
    eq(r.mode, 'invalid', '非法坐标应 invalid')
    eq(r.found, false, '非法坐标 found=false')
  }],
  ['searchCountries：按中英名 / 首都 / ISO 过滤', () => {
    length(searchCountries(''), COUNTRY_COUNT, '空查询返回全部')
    ok(searchCountries('中国').some((c) => c.code === 'CN'), '中文「中国」命中')
    ok(searchCountries('Japan').some((c) => c.code === 'JP'), '英文 Japan 命中')
    ok(searchCountries('Tokyo').some((c) => c.code === 'JP'), '首都 Tokyo 命中')
    ok(searchCountries('fr').some((c) => c.code === 'FR'), 'ISO fr 命中')
    eq(searchCountries('zzzznope').length, 0, '无匹配返回空')
  }],
]
