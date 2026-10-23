/**
 * 全球知名国家 / 地区经纬度参考数据 + 经纬度反查（纯函数，可 node 单测）。
 *
 * 设计要点：
 *   - COUNTRIES：约 44 个知名国家 / 地区，每条含双语名（{ 'zh-CN', en }）、代表城市
 *     （首都 / 首府）经纬度，以及一个**粗略边界框** box = [minLat, minLng, maxLat, maxLng]。
 *   - locate(lat, lng)：先按边界框命中（可能多个），取代表城市最近者；都不命中则退化为
 *     距代表城市最近的国家，并标注里程。边界框为近似主权边界，仅供科普反查。
 *   - distanceKm：haversine 大圆距离（地球平均半径）。
 *   - searchCountries(q)：按国家名 / 首都名 / ISO 码模糊过滤参考表。
 *   - validateCoord：纬度 [-90,90]、经度 [-180,180]。
 *
 * 边界框不计争议边界、岛屿飞地、海外领地，因此反查结果是「大致归属」而非精确主权判定。
 */

/** 地球平均半径（km），haversine 用 */
export const EARTH_RADIUS_KM = 6371.0088

const rad = (deg) => (deg * Math.PI) / 180

/** 两点大圆距离（km） */
export function distanceKm(lat1, lng1, lat2, lng2) {
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** 校验经纬度；返回 { ok, lat, lng, error }，error ∈ 'nan' | 'latRange' | 'lngRange' */
export function validateCoord(lat, lng) {
  // 空串 / 纯空格不能当成 0（Number('') === 0），否则空输入会被误判为 (0,0)
  if (lat == null || lng == null || String(lat).trim() === '' || String(lng).trim() === '') {
    return { ok: false, error: 'nan' }
  }
  const la = Number(lat)
  const lo = Number(lng)
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return { ok: false, error: 'nan' }
  if (la < -90 || la > 90) return { ok: false, error: 'latRange', lat: la, lng: lo }
  if (lo < -180 || lo > 180) return { ok: false, error: 'lngRange', lat: la, lng: lo }
  return { ok: true, lat: la, lng: lo }
}

/** 坐标是否落在某国家边界框内 */
function inBox(lat, lng, box) {
  return lat >= box[0] && lat <= box[2] && lng >= box[1] && lng <= box[3]
}

/**
 * 反查：给定经纬度，返回最近的国家 / 地区。
 * 返回 { found, mode: 'inside' | 'nearest' | 'invalid', country, distKm, lat, lng }
 *   - mode 'inside'：坐标落在至少一个边界框内，country 取其中代表城市最近者。
 *   - mode 'nearest'：未落入任何边界框，country 取全局代表城市最近者（公海 / 邻国交界提示）。
 *   - mode 'invalid'：坐标非法。
 */
export function locate(lat, lng) {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    return { found: false, mode: 'invalid', country: null, distKm: null, lat, lng }
  }
  const la = Number(lat)
  const lo = Number(lng)
  const hits = COUNTRIES.filter((c) => inBox(la, lo, c.box))
  const pool = hits.length ? hits : COUNTRIES
  let best = null
  let bestD = Infinity
  for (const c of pool) {
    const d = distanceKm(la, lo, c.lat, c.lng)
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  return {
    found: true,
    mode: hits.length ? 'inside' : 'nearest',
    country: best,
    distKm: bestD,
    lat: la,
    lng: lo,
  }
}

/** 按国家名 / 首都名 / ISO 码模糊过滤（不区分大小写，支持中文） */
export function searchCountries(q) {
  const s = (q || '').trim().toLowerCase()
  if (!s) return COUNTRIES
  return COUNTRIES.filter((c) =>
    [
      c.name['zh-CN'] || '',
      c.name.en || '',
      c.capital['zh-CN'] || '',
      c.capital.en || '',
      c.code || '',
    ]
      .join(' ')
      .toLowerCase()
      .includes(s),
  )
}

/**
 * 全球知名国家 / 地区经纬度参考表。
 * box = [minLat, minLng, maxLat, maxLng]，为粗略主权边界，仅供反查推断。
 */
export const COUNTRIES = [
  { code: 'CN', name: { 'zh-CN': '中国', en: 'China' }, capital: { 'zh-CN': '北京', en: 'Beijing' }, lat: 39.9042, lng: 116.4074, box: [18, 73, 54, 135] },
  { code: 'US', name: { 'zh-CN': '美国', en: 'United States' }, capital: { 'zh-CN': '华盛顿', en: 'Washington' }, lat: 38.9072, lng: -77.0369, box: [24, -125, 49, -66] },
  { code: 'RU', name: { 'zh-CN': '俄罗斯', en: 'Russia' }, capital: { 'zh-CN': '莫斯科', en: 'Moscow' }, lat: 55.7558, lng: 37.6173, box: [41, 19, 82, 180] },
  { code: 'CA', name: { 'zh-CN': '加拿大', en: 'Canada' }, capital: { 'zh-CN': '渥太华', en: 'Ottawa' }, lat: 45.4215, lng: -75.6972, box: [41, -141, 84, -52] },
  { code: 'BR', name: { 'zh-CN': '巴西', en: 'Brazil' }, capital: { 'zh-CN': '巴西利亚', en: 'Brasília' }, lat: -15.7939, lng: -47.8828, box: [-34, -74, 6, -34] },
  { code: 'IN', name: { 'zh-CN': '印度', en: 'India' }, capital: { 'zh-CN': '新德里', en: 'New Delhi' }, lat: 28.6139, lng: 77.209, box: [6, 68, 37, 98] },
  { code: 'AU', name: { 'zh-CN': '澳大利亚', en: 'Australia' }, capital: { 'zh-CN': '堪培拉', en: 'Canberra' }, lat: -35.2809, lng: 149.13, box: [-44, 112, -10, 154] },
  { code: 'JP', name: { 'zh-CN': '日本', en: 'Japan' }, capital: { 'zh-CN': '东京', en: 'Tokyo' }, lat: 35.6762, lng: 139.6503, box: [24, 122, 46, 146] },
  { code: 'DE', name: { 'zh-CN': '德国', en: 'Germany' }, capital: { 'zh-CN': '柏林', en: 'Berlin' }, lat: 52.52, lng: 13.405, box: [47, 5, 55, 16] },
  { code: 'FR', name: { 'zh-CN': '法国', en: 'France' }, capital: { 'zh-CN': '巴黎', en: 'Paris' }, lat: 48.8566, lng: 2.3522, box: [41, -5, 52, 10] },
  { code: 'GB', name: { 'zh-CN': '英国', en: 'United Kingdom' }, capital: { 'zh-CN': '伦敦', en: 'London' }, lat: 51.5074, lng: -0.1278, box: [49, -9, 61, 2] },
  { code: 'IT', name: { 'zh-CN': '意大利', en: 'Italy' }, capital: { 'zh-CN': '罗马', en: 'Rome' }, lat: 41.9028, lng: 12.4964, box: [35, 6, 47, 19] },
  { code: 'ES', name: { 'zh-CN': '西班牙', en: 'Spain' }, capital: { 'zh-CN': '马德里', en: 'Madrid' }, lat: 40.4168, lng: -3.7038, box: [35, -10, 44, 5] },
  { code: 'MX', name: { 'zh-CN': '墨西哥', en: 'Mexico' }, capital: { 'zh-CN': '墨西哥城', en: 'Mexico City' }, lat: 19.4326, lng: -99.1332, box: [14, -119, 33, -86] },
  { code: 'ID', name: { 'zh-CN': '印度尼西亚', en: 'Indonesia' }, capital: { 'zh-CN': '雅加达', en: 'Jakarta' }, lat: -6.2088, lng: 106.8456, box: [-11, 95, 6, 141] },
  { code: 'EG', name: { 'zh-CN': '埃及', en: 'Egypt' }, capital: { 'zh-CN': '开罗', en: 'Cairo' }, lat: 30.0444, lng: 31.2357, box: [22, 25, 32, 35] },
  { code: 'ZA', name: { 'zh-CN': '南非', en: 'South Africa' }, capital: { 'zh-CN': '比勒陀利亚', en: 'Pretoria' }, lat: -25.7479, lng: 28.2293, box: [-35, 16, -22, 33] },
  { code: 'NG', name: { 'zh-CN': '尼日利亚', en: 'Nigeria' }, capital: { 'zh-CN': '阿布贾', en: 'Abuja' }, lat: 9.0765, lng: 7.3986, box: [4, 2, 14, 15] },
  { code: 'KE', name: { 'zh-CN': '肯尼亚', en: 'Kenya' }, capital: { 'zh-CN': '内罗毕', en: 'Nairobi' }, lat: -1.2921, lng: 36.8219, box: [-5, 34, 5, 42] },
  { code: 'AR', name: { 'zh-CN': '阿根廷', en: 'Argentina' }, capital: { 'zh-CN': '布宜诺斯艾利斯', en: 'Buenos Aires' }, lat: -34.6037, lng: -58.3816, box: [-56, -74, -21, -53] },
  { code: 'CL', name: { 'zh-CN': '智利', en: 'Chile' }, capital: { 'zh-CN': '圣地亚哥', en: 'Santiago' }, lat: -33.4489, lng: -70.6693, box: [-56, -76, -17, -66] },
  { code: 'SA', name: { 'zh-CN': '沙特阿拉伯', en: 'Saudi Arabia' }, capital: { 'zh-CN': '利雅得', en: 'Riyadh' }, lat: 24.7136, lng: 46.6753, box: [16, 34, 33, 56] },
  { code: 'AE', name: { 'zh-CN': '阿联酋', en: 'United Arab Emirates' }, capital: { 'zh-CN': '阿布扎比', en: 'Abu Dhabi' }, lat: 24.4539, lng: 54.3773, box: [22, 51, 27, 57] },
  { code: 'TR', name: { 'zh-CN': '土耳其', en: 'Turkey' }, capital: { 'zh-CN': '安卡拉', en: 'Ankara' }, lat: 39.9334, lng: 32.8597, box: [35, 26, 43, 45] },
  { code: 'IR', name: { 'zh-CN': '伊朗', en: 'Iran' }, capital: { 'zh-CN': '德黑兰', en: 'Tehran' }, lat: 35.6892, lng: 51.389, box: [24, 44, 40, 64] },
  { code: 'TH', name: { 'zh-CN': '泰国', en: 'Thailand' }, capital: { 'zh-CN': '曼谷', en: 'Bangkok' }, lat: 13.7563, lng: 100.5018, box: [5, 97, 21, 106] },
  { code: 'VN', name: { 'zh-CN': '越南', en: 'Vietnam' }, capital: { 'zh-CN': '河内', en: 'Hanoi' }, lat: 21.0278, lng: 105.8342, box: [8, 102, 24, 110] },
  { code: 'KR', name: { 'zh-CN': '韩国', en: 'South Korea' }, capital: { 'zh-CN': '首尔', en: 'Seoul' }, lat: 37.5665, lng: 126.978, box: [33, 124, 39, 132] },
  { code: 'KP', name: { 'zh-CN': '朝鲜', en: 'North Korea' }, capital: { 'zh-CN': '平壤', en: 'Pyongyang' }, lat: 39.0392, lng: 125.7625, box: [37, 124, 43, 131] },
  { code: 'MN', name: { 'zh-CN': '蒙古', en: 'Mongolia' }, capital: { 'zh-CN': '乌兰巴托', en: 'Ulaanbaatar' }, lat: 47.8864, lng: 106.9057, box: [41, 88, 52, 120] },
  { code: 'KZ', name: { 'zh-CN': '哈萨克斯坦', en: 'Kazakhstan' }, capital: { 'zh-CN': '阿斯塔纳', en: 'Astana' }, lat: 51.1694, lng: 71.4491, box: [40, 46, 56, 88] },
  { code: 'PK', name: { 'zh-CN': '巴基斯坦', en: 'Pakistan' }, capital: { 'zh-CN': '伊斯兰堡', en: 'Islamabad' }, lat: 33.6844, lng: 73.0479, box: [23, 60, 37, 78] },
  { code: 'BD', name: { 'zh-CN': '孟加拉国', en: 'Bangladesh' }, capital: { 'zh-CN': '达卡', en: 'Dhaka' }, lat: 23.8103, lng: 90.4125, box: [20, 88, 27, 93] },
  { code: 'PH', name: { 'zh-CN': '菲律宾', en: 'Philippines' }, capital: { 'zh-CN': '马尼拉', en: 'Manila' }, lat: 14.5995, lng: 120.9842, box: [4, 116, 21, 127] },
  { code: 'SG', name: { 'zh-CN': '新加坡', en: 'Singapore' }, capital: { 'zh-CN': '新加坡', en: 'Singapore' }, lat: 1.3521, lng: 103.8198, box: [1.2, 103.6, 1.5, 104.1] },
  { code: 'NZ', name: { 'zh-CN': '新西兰', en: 'New Zealand' }, capital: { 'zh-CN': '惠灵顿', en: 'Wellington' }, lat: -41.2865, lng: 174.7762, box: [-48, 166, -34, 179] },
  { code: 'NO', name: { 'zh-CN': '挪威', en: 'Norway' }, capital: { 'zh-CN': '奥斯陆', en: 'Oslo' }, lat: 59.9139, lng: 10.7522, box: [58, 4, 71, 31] },
  { code: 'SE', name: { 'zh-CN': '瑞典', en: 'Sweden' }, capital: { 'zh-CN': '斯德哥尔摩', en: 'Stockholm' }, lat: 59.3293, lng: 18.0686, box: [55, 10, 70, 25] },
  { code: 'GR', name: { 'zh-CN': '希腊', en: 'Greece' }, capital: { 'zh-CN': '雅典', en: 'Athens' }, lat: 37.9838, lng: 23.7275, box: [34, 19, 42, 27] },
  { code: 'PT', name: { 'zh-CN': '葡萄牙', en: 'Portugal' }, capital: { 'zh-CN': '里斯本', en: 'Lisbon' }, lat: 38.7223, lng: -9.1393, box: [36, -10, 43, -6] },
  { code: 'NL', name: { 'zh-CN': '荷兰', en: 'Netherlands' }, capital: { 'zh-CN': '阿姆斯特丹', en: 'Amsterdam' }, lat: 52.3676, lng: 4.9041, box: [50, 3, 54, 8] },
  { code: 'CH', name: { 'zh-CN': '瑞士', en: 'Switzerland' }, capital: { 'zh-CN': '伯尔尼', en: 'Bern' }, lat: 46.948, lng: 7.4474, box: [45, 6, 48, 11] },
  { code: 'PL', name: { 'zh-CN': '波兰', en: 'Poland' }, capital: { 'zh-CN': '华沙', en: 'Warsaw' }, lat: 52.2297, lng: 21.0122, box: [49, 14, 55, 25] },
  { code: 'UA', name: { 'zh-CN': '乌克兰', en: 'Ukraine' }, capital: { 'zh-CN': '基辅', en: 'Kyiv' }, lat: 50.4501, lng: 30.5234, box: [44, 22, 53, 40] },
  { code: 'AQ', name: { 'zh-CN': '南极洲', en: 'Antarctica' }, capital: { 'zh-CN': '无', en: '—' }, lat: -82, lng: 0, box: [-90, -180, -60, 180] },
]

/** 参考表条目数（便于单测与 UI 计数） */
export const COUNTRY_COUNT = COUNTRIES.length
