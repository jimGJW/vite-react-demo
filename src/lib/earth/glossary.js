/**
 * 地球与海洋术语词典 —— /geo（地球看板）与 /ocean（海洋看板）共用。
 *
 * 与 src/lib/astro/glossary.js 是同一套设计：
 *   1. 纯函数、无副作用，可直接 `node` 跑断言（tests/unit/earth-glossary.test.mjs）
 *   2. 未收录的枚举**原样透出**而不是返回空——上游随时可能加新值
 *   3. 每个词条回答三件事：是什么（量纲）/ 怎么读（阈值）/ 所以呢（意味着什么）
 *
 * 为什么拆成独立文件而不是塞进各看板的 ui.jsx：
 *   看板里那些「数值 → 颜色/中文」的映射函数（震源深度、AQI、浪级…）
 *   必须和词典里写的阈值保持一致，否则会出现「气泡里写着轻度污染、数字却是绿色」的静默矛盾。
 *   现在 ui.jsx 只做转发，阈值唯一真源在这里。
 *
 * 多语：文案字段统一为 { 'zh-CN': '…', en: '…' }，取值函数末尾加 lang 参数并走 localize，
 *       调用方拿到的永远是字符串（zh 族落简体、其余落英文）。
 */

import { pickText, localize } from '@i18n/translate.mjs'

/* ============ 枚举 → 中文 ============ */

/** NHC 热带气旋分类缩写（CurrentStorms.json 的 classification 字段） */
export const CYCLONE_CLASSES = {
  DB: { zh: { 'zh-CN': '扰动', en: 'Disturbance' }, desc: { 'zh-CN': '一团有组织的雷暴，尚未形成闭合环流。', en: 'An organized cluster of thunderstorms that has not yet developed a closed circulation.' } },
  LO: { zh: { 'zh-CN': '低压区', en: 'Low-pressure area' }, desc: { 'zh-CN': '有闭合等压线但风力未达热带风暴，仍在组织阶段。', en: 'Has closed isobars but winds have not yet reached tropical-storm strength; still in the organizing stage.' } },
  WV: { zh: { 'zh-CN': '热带波', en: 'Tropical wave' }, desc: { 'zh-CN': '沿信风带西行的波动，是多数大西洋飓风的胚胎。', en: 'A wave travelling westward along the trade-wind belt; the embryo of most Atlantic hurricanes.' } },
  TD: { zh: { 'zh-CN': '热带低压', en: 'Tropical depression' }, desc: { 'zh-CN': '已有闭合环流，持续风速 ≤ 33 kt（17 m/s）。', en: 'A closed circulation is already present, with sustained winds ≤ 33 kt (17 m/s).' } },
  TS: { zh: { 'zh-CN': '热带风暴', en: 'Tropical storm' }, desc: { 'zh-CN': '持续风速 34–63 kt，达到此级就会被正式命名。', en: 'Sustained winds of 34–63 kt; a system is officially named once it reaches this stage.' } },
  SS: { zh: { 'zh-CN': '副热带风暴', en: 'Subtropical storm' }, desc: { 'zh-CN': '兼具热带与温带特征，核心对流常偏离中心。', en: 'Has both tropical and extratropical characteristics; its core convection is often displaced from the centre.' } },
  SD: { zh: { 'zh-CN': '副热带低压', en: 'Subtropical depression' }, desc: { 'zh-CN': '副热带气旋的低压阶段。', en: 'The depression stage of a subtropical cyclone.' } },
  HU: { zh: { 'zh-CN': '飓风', en: 'Hurricane' }, desc: { 'zh-CN': '持续风速 ≥ 64 kt（33 m/s），北大西洋与东北太平洋的称呼。', en: 'Sustained winds ≥ 64 kt (33 m/s); the term used in the North Atlantic and the eastern North Pacific.' } },
  PTC: { zh: { 'zh-CN': '潜在热带气旋', en: 'Potential tropical cyclone' }, desc: { 'zh-CN': '尚未形成闭合中心，但预计 48 小时内会影响陆地，NHC 提前发布警报。', en: 'A closed centre has not yet formed, but it is expected to affect land within 48 hours, so the NHC issues warnings in advance.' } },
  EX: { zh: { 'zh-CN': '温带气旋', en: 'Extratropical cyclone' }, desc: { 'zh-CN': '已转性为温带系统，能量来源从海温转为斜压能。', en: 'Has transitioned into an extratropical system; its energy source switches from sea-surface heat to baroclinic energy.' } },
  PT: { zh: { 'zh-CN': '后热带气旋', en: 'Post-tropical cyclone' }, desc: { 'zh-CN': '失去热带特征但仍具相当风力，常伴随大范围强降雨。', en: 'Has lost its tropical characteristics but still carries considerable winds, often accompanied by widespread heavy rain.' } },
  PS: { zh: { 'zh-CN': '后热带气旋', en: 'Post-tropical cyclone' }, desc: { 'zh-CN': '同 PT，NHC 新旧缩写并存。', en: 'Same as PT; the NHC keeps both the old and the new abbreviation in use.' } },
  MD: { zh: { 'zh-CN': '季风低压', en: 'Monsoon depression' }, desc: { 'zh-CN': '季风槽内的大型低压系统，结构松散、雨区极广。', en: 'A large low-pressure system within the monsoon trough, with a loose structure and an extremely broad rain area.' } },
}

/** 萨菲尔–辛普森飓风等级（按 1 分钟持续风速，单位 kt） */
export const SAFFIR_SIMPSON = {
  TS: { zh: { 'zh-CN': '热带风暴', en: 'Tropical storm' }, cat: 0, kt: '34–63', ms: '17–32', color: '#38bdf8', desc: { 'zh-CN': '树木摇动，简易房屋受损，海上小艇需回港。', en: 'Trees sway and poorly built homes suffer damage; small craft at sea should return to port.' } },
  C1: { zh: { 'zh-CN': '一级飓风', en: 'Category 1 hurricane' }, cat: 1, kt: '64–82', ms: '33–42', color: '#22c55e', desc: { 'zh-CN': '屋顶瓦片脱落、树枝折断，沿海可出现 1–1.5 m 风暴潮。', en: 'Roof tiles are blown off and branches snap; a storm surge of 1–1.5 m may occur along the coast.' } },
  C2: { zh: { 'zh-CN': '二级飓风', en: 'Category 2 hurricane' }, cat: 2, kt: '83–95', ms: '43–49', color: '#eab308', desc: { 'zh-CN': '门窗破损、移动房屋可毁，风暴潮 1.8–2.4 m，停电可达数周。', en: 'Doors and windows are broken and mobile homes can be destroyed; storm surge of 1.8–2.4 m, with power outages lasting up to several weeks.' } },
  C3: { zh: { 'zh-CN': '三级飓风', en: 'Category 3 hurricane' }, cat: 3, kt: '96–112', ms: '50–58', color: '#f97316', desc: { 'zh-CN': '达到「强台风」量级，砖木结构房屋严重损毁，风暴潮 2.7–3.7 m。', en: 'Reaches "major hurricane" magnitude; brick and timber houses are severely damaged, with storm surge of 2.7–3.7 m.' } },
  C4: { zh: { 'zh-CN': '四级飓风', en: 'Category 4 hurricane' }, cat: 4, kt: '113–136', ms: '58–70', color: '#ef4444', desc: { 'zh-CN': '屋顶整体掀飞、海岸侵蚀显著，风暴潮 4–5.5 m，内陆亦可受灾。', en: 'Whole roofs are torn off and coastal erosion is pronounced; storm surge of 4–5.5 m, with damage extending inland.' } },
  C5: { zh: { 'zh-CN': '五级飓风', en: 'Category 5 hurricane' }, cat: 5, kt: '≥137', ms: '≥70', color: '#a21caf', desc: { 'zh-CN': '最高等级，风暴潮 > 5.5 m，灾区可长期不宜居住。', en: 'The highest category; storm surge > 5.5 m, and affected areas may remain uninhabitable for a long time.' } },
}

/**
 * 中国气象局（CMA）热带气旋等级（GB/T 19201-2006），按 2 分钟平均近中心最大风速划分。
 * 与 NHC 萨菲尔–辛普森（1 分钟平均）不是一套口径，颜色刻意与 SAFFIR_SIMPSON 对齐便于对照。
 * 注意 nmc 路径点里出现的强度码：TD / TS / STS / TY / STY / SuperTY。
 */
export const CMA_TYPHOON_GRADES = {
  TD: { zh: { 'zh-CN': '热带低压', en: 'Tropical depression' }, cat: 0, ms: '≤17', color: '#36cfc9', desc: { 'zh-CN': '近中心最大风速 ≤ 17.1 m/s，尚未达到热带风暴，是最弱的命名前阶段。', en: 'Maximum sustained wind ≤ 17.1 m/s; below tropical-storm strength, the weakest pre-naming stage.' } },
  TS: { zh: { 'zh-CN': '热带风暴', en: 'Tropical storm' }, cat: 1, ms: '17–24', color: '#22c55e', desc: { 'zh-CN': '近中心最大风速 17.2–24.4 m/s，达到此级才会被正式编号命名。', en: 'Maximum sustained wind of 17.2–24.4 m/s; a system is officially numbered and named once it reaches this stage.' } },
  STS: { zh: { 'zh-CN': '强热带风暴', en: 'Severe tropical storm' }, cat: 2, ms: '25–32', color: '#eab308', desc: { 'zh-CN': '近中心最大风速 24.5–32.6 m/s，风雨明显增强，沿海需防风防浪。', en: 'Maximum sustained wind of 24.5–32.6 m/s; wind and rain strengthen markedly, coastal wind and wave precautions are needed.' } },
  TY: { zh: { 'zh-CN': '台风', en: 'Typhoon' }, cat: 3, ms: '33–41', color: '#f97316', desc: { 'zh-CN': '近中心最大风速 32.7–41.4 m/s，对应 NHC 的一到二级飓风量级。', en: 'Maximum sustained wind of 32.7–41.4 m/s, comparable to a Category 1–2 hurricane on the NHC scale.' } },
  STY: { zh: { 'zh-CN': '强台风', en: 'Severe typhoon' }, cat: 4, ms: '42–50', color: '#ef4444', desc: { 'zh-CN': '近中心最大风速 41.5–50.9 m/s，具有严重破坏力，需停工停课转移。', en: 'Maximum sustained wind of 41.5–50.9 m/s; capable of severe damage, work and school suspensions and evacuations are warranted.' } },
  SuperTY: { zh: { 'zh-CN': '超强台风', en: 'Super typhoon' }, cat: 5, ms: '≥51', color: '#a21caf', desc: { 'zh-CN': '近中心最大风速 ≥ 51.0 m/s，是 CMA 等级里的最高级，灾情可极重。', en: 'Maximum sustained wind ≥ 51.0 m/s, the highest CMA category; destruction can be extreme.' } },
}

/** CMA 强度等级码（TD / TS / STS / TY / STY / SuperTY）→ 中文 + 风速区间 + 颜色 */
export function zhTyphoonGrade(code, lang = 'zh-CN') {
  return localize(lookup(code, CMA_TYPHOON_GRADES), lang)
}

/** 欧洲标准 AQI（Open-Meteo 的 european_aqi）：数值越低越好 */
export const AQI_LEVELS = {
  good: { zh: { 'zh-CN': '优', en: 'Good' }, min: -Infinity, max: 20, color: '#0e9f6e', desc: { 'zh-CN': '空气质量令人满意，各类人群可正常活动。', en: 'Air quality is satisfactory and all groups can carry on their normal activities.' } },
  fair: { zh: { 'zh-CN': '良', en: 'Fair' }, min: 20, max: 40, color: '#84cc16', desc: { 'zh-CN': '可接受，极少数异常敏感人群应减少户外活动。', en: 'Acceptable; a very small number of unusually sensitive people should reduce outdoor activity.' } },
  moderate: { zh: { 'zh-CN': '轻度', en: 'Moderate' }, min: 40, max: 60, color: '#f59e0b', desc: { 'zh-CN': '易感人群（儿童、老人、心肺病患者）症状会加剧。', en: 'Sensitive groups (children, the elderly, and people with heart or lung disease) may have their symptoms aggravated.' } },
  poor: { zh: { 'zh-CN': '中度', en: 'Poor' }, min: 60, max: 80, color: '#f97316', desc: { 'zh-CN': '健康人群也可能出现症状，一般人群应减少长时间户外锻炼。', en: 'Healthy people may also develop symptoms; the general population should cut back on prolonged outdoor exercise.' } },
  veryPoor: { zh: { 'zh-CN': '重度', en: 'Very poor' }, min: 80, max: 100, color: '#ef4444', desc: { 'zh-CN': '健康人群普遍出现症状，应避免户外活动。', en: 'Symptoms become widespread among healthy people; outdoor activities should be avoided.' } },
  severe: { zh: { 'zh-CN': '严重', en: 'Severe' }, min: 100, max: Infinity, color: '#a21caf', desc: { 'zh-CN': '所有人群健康明显受损，需留在室内并关闭门窗。', en: 'The health of every group is clearly affected; stay indoors and keep windows and doors closed.' } },
}

/** 世界卫生组织紫外线指数 UVI 分级 */
export const UV_LEVELS = {
  low: { zh: { 'zh-CN': '低', en: 'Low' }, min: -Infinity, max: 2, color: '#0e9f6e', advice: { 'zh-CN': '无需防护。', en: 'No protection needed.' } },
  moderate: { zh: { 'zh-CN': '中等', en: 'Moderate' }, min: 2, max: 5, color: '#eab308', advice: { 'zh-CN': '正午尽量待在阴凉处，可戴帽与墨镜。', en: 'Stay in the shade around midday where possible; a hat and sunglasses help.' } },
  high: { zh: { 'zh-CN': '高', en: 'High' }, min: 5, max: 7, color: '#f97316', advice: { 'zh-CN': '需涂 SPF15+ 防晒，正午减少外出。', en: 'Apply SPF15+ sunscreen and limit time outdoors around midday.' } },
  veryHigh: { zh: { 'zh-CN': '很高', en: 'Very high' }, min: 7, max: 10, color: '#ef4444', advice: { 'zh-CN': '必须防晒 + 遮阳，10–16 时避免暴晒。', en: 'Sunscreen and shade are essential; avoid direct exposure between 10:00 and 16:00.' } },
  extreme: { zh: { 'zh-CN': '极高', en: 'Extreme' }, min: 10, max: Infinity, color: '#a21caf', advice: { 'zh-CN': '皮肤可 15 分钟内晒伤，尽量避免外出。', en: 'Skin can burn within 15 minutes; avoid going outdoors as much as possible.' } },
}

/** 震级分档（中国地震台网习惯用语） */
export const MAGNITUDE_BANDS = {
  micro: { zh: { 'zh-CN': '极微震', en: 'Micro' }, min: -Infinity, max: 2, color: '#94a3b8', desc: { 'zh-CN': '人无感觉，仅仪器记录。', en: 'Not felt by people; recorded by instruments only.' } },
  veryMinor: { zh: { 'zh-CN': '微震', en: 'Very minor' }, min: 2, max: 3, color: '#a3a3a3', desc: { 'zh-CN': '个别敏感者可感，无破坏。', en: 'Felt by a few sensitive individuals; no damage.' } },
  minor: { zh: { 'zh-CN': '轻震', en: 'Minor' }, min: 3, max: 4.5, color: '#eab308', desc: { 'zh-CN': '室内多数人有感，悬挂物摆动。', en: 'Felt by most people indoors; hanging objects swing.' } },
  moderate: { zh: { 'zh-CN': '中震', en: 'Moderate' }, min: 4.5, max: 6, color: '#f97316', desc: { 'zh-CN': '墙体可出现裂缝，老旧房屋受损。', en: 'Walls can develop cracks and older buildings suffer damage.' } },
  strong: { zh: { 'zh-CN': '强震', en: 'Strong' }, min: 6, max: 7, color: '#ef4444', desc: { 'zh-CN': '房屋倒塌，可造成人员伤亡。', en: 'Buildings collapse and casualties can result.' } },
  major: { zh: { 'zh-CN': '大震', en: 'Major' }, min: 7, max: 8, color: '#dc2626', desc: { 'zh-CN': '大范围严重破坏，可引发海啸。', en: 'Severe damage over a wide area; can generate a tsunami.' } },
  great: { zh: { 'zh-CN': '巨大震', en: 'Great' }, min: 8, max: Infinity, color: '#7f1d1d', desc: { 'zh-CN': '毁灭性，地表可出现断裂带，全球可测。', en: 'Devastating; surface rupture may appear and the event is recorded worldwide.' } },
}

/** 震源深度分带（USGS 惯例） */
export const DEPTH_ZONES = {
  shallow: { zh: { 'zh-CN': '浅源', en: 'Shallow' }, min: -Infinity, max: 70, color: '#ef4444', desc: { 'zh-CN': '发生在地壳脆性地层内，地表震感最强、破坏最大——绝大多数灾害性地震都是浅源。', en: 'Occurs within the brittle layers of the crust; ground shaking is strongest and damage greatest—the vast majority of damaging earthquakes are shallow.' } },
  middle: { zh: { 'zh-CN': '中源', en: 'Intermediate' }, min: 70, max: 300, color: '#f59e0b', desc: { 'zh-CN': '多位于俯冲板片上部，震感中等。', en: 'Usually located in the upper part of the subducting slab; shaking is moderate.' } },
  deep: { zh: { 'zh-CN': '深源', en: 'Deep' }, min: 300, max: Infinity, color: '#3b82f6', desc: { 'zh-CN': '发生在俯冲板片内部（最深约 700 km），能量衰减多，地表通常震感弱但波及范围广。', en: 'Occurs inside the subducting slab (to a maximum depth of about 700 km); energy is strongly attenuated, so surface shaking is usually weak but the felt area is wide.' } },
}

/** 海况等级（近海通行观感分级，非蒲福风级） */
export const WAVE_STATES = {
  calm: { zh: { 'zh-CN': '平静', en: 'Calm' }, min: -Infinity, max: 0.3, color: '#0e9f6e', desc: { 'zh-CN': '海面如镜，小艇可安全出港。', en: 'The sea surface is like a mirror; small boats can leave port safely.' } },
  light: { zh: { 'zh-CN': '轻浪', en: 'Light' }, min: 0.3, max: 0.8, color: '#0ea5e9', desc: { 'zh-CN': '波峰开始破碎，近海作业正常。', en: 'Crests begin to break; nearshore operations proceed normally.' } },
  moderate: { zh: { 'zh-CN': '中浪', en: 'Moderate' }, min: 0.8, max: 1.5, color: '#f59e0b', desc: { 'zh-CN': '小船需谨慎，晕船概率上升。', en: 'Small craft should take care; the chance of seasickness rises.' } },
  rough: { zh: { 'zh-CN': '大浪', en: 'Rough' }, min: 1.5, max: 2.5, color: '#f97316', desc: { 'zh-CN': '渔业作业受限，小型客轮可能停航。', en: 'Fishing operations are restricted and small passenger ferries may be suspended.' } },
  veryRough: { zh: { 'zh-CN': '巨浪', en: 'Very rough' }, min: 2.5, max: Infinity, color: '#ef4444', desc: { 'zh-CN': '港口可能封港，船舶需避风。', en: 'Ports may be closed and vessels should seek shelter.' } },
}

/** 潮位基准面（NOAA CO-OPS datum） */
export const TIDE_DATUMS = {
  MLLW: { zh: { 'zh-CN': '平均较低低潮面', en: 'Mean lower low water' }, desc: { 'zh-CN': '取每日两次低潮中较低者的长期平均。美国海图与潮位表的通用零点，本站潮位以此为 0。', en: 'The long-term average of the lower of the two daily low waters. The common zero reference for US nautical charts and tide tables, and the datum this station uses as its zero.' } },
  MLW: { zh: { 'zh-CN': '平均低潮面', en: 'Mean low water' }, desc: { 'zh-CN': '所有低潮的长期平均，比 MLLW 略高。', en: 'The long-term average of all low waters, slightly higher than MLLW.' } },
  MSL: { zh: { 'zh-CN': '平均海平面', en: 'Mean sea level' }, desc: { 'zh-CN': '所有水位的长期平均，是海平面上升研究的基准。', en: 'The long-term average of all water levels, and the reference for sea-level-rise studies.' } },
  MHHW: { zh: { 'zh-CN': '平均较高高潮面', en: 'Mean higher high water' }, desc: { 'zh-CN': '每日两次高潮中较高者的长期平均，常用于标定防潮堤高程。', en: 'The long-term average of the higher of the two daily high waters; commonly used to set the crest elevation of flood defences.' } },
  NAVD88: { zh: { 'zh-CN': '北美垂直基准 1988', en: 'North American Vertical Datum 1988' }, desc: { 'zh-CN': '陆地高程基准，与潮位基准之间的换算需查站点的基准转换表。', en: 'A land elevation datum; converting between it and tidal datums requires the station-specific datum conversion table.' } },
}

/** 气候振荡模态 */
export const OSCILLATIONS = {
  enso: {
    zh: { 'zh-CN': 'ENSO 厄尔尼诺-南方涛动', en: 'ENSO (El Niño–Southern Oscillation)' },
    period: { 'zh-CN': '2–7 年', en: '2–7 years' },
    region: { 'zh-CN': '赤道太平洋', en: 'Equatorial Pacific' },
    desc: { 'zh-CN': '海气耦合最强的年际信号，ONI 是它的官方指数。', en: 'The strongest interannual air–sea coupled signal; ONI is its official index.' },
  },
  pdo: {
    zh: { 'zh-CN': 'PDO 太平洋十年涛动', en: 'PDO (Pacific Decadal Oscillation)' },
    period: { 'zh-CN': '20–30 年准周期', en: 'Quasi-period of 20–30 years' },
    region: { 'zh-CN': '北太平洋 20°N 以北', en: 'North Pacific, north of 20°N' },
    desc: { 'zh-CN': '北太平洋海温的低频模态，暖位相时阿拉斯加湾偏暖、北美西海岸生态与渔业随之改变。', en: 'A low-frequency mode of North Pacific sea-surface temperature; in its warm phase the Gulf of Alaska is anomalously warm and the ecosystems and fisheries of the North American west coast change accordingly.' },
  },
  amo: {
    zh: { 'zh-CN': 'AMO 大西洋多年代际振荡', en: 'AMO (Atlantic Multidecadal Oscillation)' },
    period: { 'zh-CN': '60–80 年', en: '60–80 years' },
    region: { 'zh-CN': '北大西洋 0–70°N', en: 'North Atlantic, 0–70°N' },
    desc: { 'zh-CN': '北大西洋海温的低频模态，暖位相与大西洋飓风活跃期、萨赫勒降水增多相关。', en: 'A low-frequency mode of North Atlantic sea-surface temperature; its warm phase is associated with active Atlantic hurricane periods and increased rainfall in the Sahel.' },
  },
  nao: {
    zh: { 'zh-CN': 'NAO 北大西洋涛动', en: 'NAO (North Atlantic Oscillation)' },
    period: { 'zh-CN': '无严格周期', en: 'No fixed period' },
    region: { 'zh-CN': '冰岛低压—亚速尔高压', en: 'Icelandic Low–Azores High' },
    desc: { 'zh-CN': '气压差驱动的大气模态，决定欧洲冬季冷暖干湿。', en: 'An atmospheric mode driven by a pressure difference; it governs how warm, cold, wet or dry European winters are.' },
  },
}

/** 温室气体（与 vite-geo-proxy.mjs 的 GHG_DEFS 对应） */
export const GREENHOUSE_GASES = {
  co2: {
    zh: { 'zh-CN': '二氧化碳', en: 'Carbon dioxide' },
    formula: 'CO₂',
    unit: 'ppm',
    gwp100: 1,
    preIndustrial: 278,
    desc: { 'zh-CN': '最主要的人为温室气体，来自化石燃料、水泥与土地利用变化。大气寿命长达数百年，是最难逆转的那一个。', en: 'The dominant anthropogenic greenhouse gas, from fossil fuels, cement production and land-use change. Its atmospheric lifetime spans several centuries, making it the hardest one to reverse.' },
  },
  ch4: {
    zh: { 'zh-CN': '甲烷', en: 'Methane' },
    formula: 'CH₄',
    unit: 'ppb',
    gwp100: 28,
    preIndustrial: 722,
    desc: { 'zh-CN': '百年尺度增温潜势约为 CO₂ 的 28 倍。大气寿命仅约 12 年——减排它见效最快，是短期控温的关键抓手。', en: 'Its 100-year global warming potential is about 28 times that of CO₂. Its atmospheric lifetime is only about 12 years—cutting it delivers results the fastest, making it the key lever for near-term temperature control.' },
  },
  n2o: {
    zh: { 'zh-CN': '氧化亚氮', en: 'Nitrous oxide' },
    formula: 'N₂O',
    unit: 'ppb',
    gwp100: 265,
    preIndustrial: 270,
    desc: { 'zh-CN': '增温潜势约 265 倍，且是当前平流层臭氧消耗的首要物质。主要来自氮肥施用，随化肥用量同步上升。', en: 'Its global warming potential is about 265 times that of CO₂, and it is now the leading stratospheric ozone-depleting substance. It comes mainly from nitrogen fertiliser application and rises in step with fertiliser use.' },
  },
}

/**
 * 火山地面警报级（USGS HANS，面向地面危险度）。
 * 与 AVIATION_CODES 是两套并行但不等价的体系，页面必须分开显示。
 */
export const VOLCANO_ALERTS = {
  NORMAL: { zh: { 'zh-CN': '正常', en: 'Normal' }, rank: 1, color: '#0e9f6e', desc: { 'zh-CN': '典型背景活动，或处于已知的非喷发期。', en: 'Typical background activity, or a known non-eruptive period.' } },
  ADVISORY: { zh: { 'zh-CN': '注意', en: 'Advisory' }, rank: 2, color: '#eab308', desc: { 'zh-CN': '活动高于已知背景，或监测数据出现异常，但没有明确的喷发前兆。', en: 'Activity is elevated above known background, or monitoring data are anomalous, but there are no clear eruption precursors.' } },
  WATCH: { zh: { 'zh-CN': '警戒', en: 'Watch' }, rank: 3, color: '#f97316', desc: { 'zh-CN': '活动升级、喷发可能性增大，或正在喷发但火山灰与熔岩影响仍局限在火山口附近。', en: 'Activity is escalating and the likelihood of eruption is increasing, or an eruption is under way but the effects of ash and lava remain confined to the vicinity of the vent.' } },
  WARNING: { zh: { 'zh-CN': '警告', en: 'Warning' }, rank: 4, color: '#dc2626', desc: { 'zh-CN': '危险喷发正在进行或即将发生，火山灰、碎屑流或熔岩流已威胁到周边地区。', en: 'A hazardous eruption is under way or imminent; ash, pyroclastic flows or lava flows now threaten surrounding areas.' } },
}

/** 航空色码（USGS HANS，面向飞行安全） */
export const AVIATION_CODES = {
  GREEN: { zh: { 'zh-CN': '绿色', en: 'Green' }, rank: 1, color: '#0e9f6e', desc: { 'zh-CN': '典型背景、非喷发状态。', en: 'Typical background, non-eruptive state.' } },
  YELLOW: { zh: { 'zh-CN': '黄色', en: 'Yellow' }, rank: 2, color: '#eab308', desc: { 'zh-CN': '活动迹象高于已知背景。', en: 'Signs of activity above known background.' } },
  ORANGE: { zh: { 'zh-CN': '橙色', en: 'Orange' }, rank: 3, color: '#f97316', desc: { 'zh-CN': '喷发在即并可能释放火山灰，或喷发中灰柱影响有限。', en: 'An eruption is imminent and may release ash, or an eruption is under way with only limited impact from the ash column.' } },
  RED: { zh: { 'zh-CN': '红色', en: 'Red' }, rank: 4, color: '#dc2626', desc: { 'zh-CN': '即将或正在发生重大喷发，灰柱将显著影响航线。', en: 'A major eruption is imminent or under way; the ash column will significantly affect air routes.' } },
}

/** NOAA 海啸公告四级（rank 越大越危险） */
export const TSUNAMI_CATEGORIES = {
  Information: { zh: { 'zh-CN': '信息声明', en: 'Information statement' }, rank: 1, color: '#0ea5e9', desc: { 'zh-CN': '地震已发生但不构成海啸威胁，或仅为告知他处海域的通报。', en: 'An earthquake has occurred but poses no tsunami threat, or the bulletin merely reports conditions in another ocean basin.' } },
  Watch: { zh: { 'zh-CN': '海啸注意', en: 'Tsunami watch' }, rank: 2, color: '#eab308', desc: { 'zh-CN': '远处强震可能引发海啸，保持警惕并等待进一步通报。', en: 'A distant strong earthquake may generate a tsunami; stay alert and await further bulletins.' } },
  Advisory: { zh: { 'zh-CN': '海啸建议', en: 'Tsunami advisory' }, rank: 3, color: '#f97316', desc: { 'zh-CN': '预计有强海流与危险波浪，远离海水、沙滩、港口与码头。', en: 'Strong currents and dangerous waves are expected; stay away from the water, beaches, harbours and marinas.' } },
  Warning: { zh: { 'zh-CN': '海啸警报', en: 'Tsunami warning' }, rank: 4, color: '#dc2626', desc: { 'zh-CN': '危险海啸已发生或即将到达，立即撤离海岸与海滩、前往高地或内陆。', en: 'A dangerous tsunami has occurred or is about to arrive; evacuate coasts and beaches immediately and move to high ground or inland.' } },
}

/* ============ 通用查表 ============ */

/**
 * 通用查表：查不到就原样返回英文。
 * 返回的字段形状与表内条目一致，调用点不必防 undefined。
 * 注意：这里返回的是**原始条目**（文案字段仍是 {lang:text} 对象），
 *       对外取值函数会再套一层 localize 把对象解析成字符串。
 */
export function lookup(key, dict) {
  if (key == null) return null
  const raw = String(key).trim()
  if (!raw) return null
  const hit = dict[raw]
  if (hit) return { en: raw, ...hit }
  return {
    zh: raw,
    en: raw,
    desc: { 'zh-CN': '上游新增的枚举值，术语表暂未收录。', en: 'An enum value newly added upstream; not yet covered by this glossary.' },
  }
}

/**
 * 数值 → 落在哪个分档。
 * 分档表按 max 从小到大排列，命中第一个 `value <= max` 即返回（半开区间语义）。
 * 返回对象额外带 `label`，与各看板 ui.jsx 的历史字段名保持一致。
 */
export function bandOf(value, bands, lang = 'zh-CN') {
  if (!Number.isFinite(value)) return null
  const list = Object.entries(bands)
  for (const [key, b] of list) {
    if (value <= b.max) return { key, ...localize(b, lang), label: pickText(b.zh, lang) }
  }
  const last = list[list.length - 1]
  return { key: last[0], ...localize(last[1], lang), label: pickText(last[1].zh, lang) }
}

/** NHC 分类缩写 → 中文 */
export function zhCycloneClass(code, lang = 'zh-CN') {
  return localize(lookup(code, CYCLONE_CLASSES), lang)
}

/** 萨菲尔–辛普森等级码（C1–C5 / TS）→ 中文 */
export function zhCycloneScale(level, lang = 'zh-CN') {
  return localize(lookup(level, SAFFIR_SIMPSON), lang)
}

/** 欧标 AQI 数值 → 等级 */
export function aqiLevel(v, lang = 'zh-CN') {
  if (!Number.isFinite(v)) {
    return localize({ zh: { 'zh-CN': '—', en: '—' }, color: '#94a3b8', desc: { 'zh-CN': '无数据', en: 'No data' } }, lang)
  }
  return bandOf(v, AQI_LEVELS, lang)
}

/** 紫外线指数 → 等级 */
export function uvLevel(v, lang = 'zh-CN') {
  if (!Number.isFinite(v)) {
    return localize({ zh: { 'zh-CN': '—', en: '—' }, color: '#94a3b8', advice: { 'zh-CN': '无数据', en: 'No data' } }, lang)
  }
  return bandOf(v, UV_LEVELS, lang)
}

/** 震级 → 分档 */
export function magBand(m, lang = 'zh-CN') {
  if (!Number.isFinite(m)) {
    return localize({
      key: 'unknown',
      zh: { 'zh-CN': '未知', en: 'Unknown' },
      label: { 'zh-CN': '未知', en: 'Unknown' },
      color: '#94a3b8',
      desc: { 'zh-CN': '震级未测定', en: 'Magnitude not determined' },
    }, lang)
  }
  return bandOf(m, MAGNITUDE_BANDS, lang)
}

/** 震源深度（km）→ 分带 */
export function depthClass(d, lang = 'zh-CN') {
  if (!Number.isFinite(d)) {
    return localize({
      key: 'unknown',
      zh: { 'zh-CN': '未知', en: 'Unknown' },
      label: { 'zh-CN': '未知', en: 'Unknown' },
      color: '#94a3b8',
      desc: { 'zh-CN': '深度未测定', en: 'Depth not determined' },
    }, lang)
  }
  return bandOf(d, DEPTH_ZONES, lang)
}

/** 浪高（m）→ 海况等级 */
export function waveLevel(h, lang = 'zh-CN') {
  if (!Number.isFinite(h)) {
    return localize({ zh: { 'zh-CN': '—', en: '—' }, color: '#94a3b8', desc: { 'zh-CN': '无数据', en: 'No data' } }, lang)
  }
  return bandOf(h, WAVE_STATES, lang)
}

/** 潮位基准面 → 中文 */
export function zhTideDatum(code, lang = 'zh-CN') {
  return localize(lookup(code, TIDE_DATUMS), lang)
}

/** 气候振荡 key → 中文 */
export function zhOscillation(key, lang = 'zh-CN') {
  return localize(lookup(key, OSCILLATIONS), lang)
}

/** 温室气体 key → 中文 */
export function zhVolcanoAlert(key, lang = 'zh-CN') {
  return localize(lookup(key, VOLCANO_ALERTS), lang)
}

export function zhAviationCode(key, lang = 'zh-CN') {
  return localize(lookup(key, AVIATION_CODES), lang)
}

export function zhTsunamiCategory(key, lang = 'zh-CN') {
  return localize(lookup(key, TSUNAMI_CATEGORIES), lang)
}

export function zhGreenhouseGas(key, lang = 'zh-CN') {
  return localize(lookup(key, GREENHOUSE_GASES), lang)
}

/* ============ KPI 术语解释表 ============ */

export const EARTH_KPI_DEFS = {
  /* —— 大气与温室气体 —— */
  co2: {
    zh: { 'zh-CN': '二氧化碳浓度', en: 'CO₂ concentration' },
    unit: { 'zh-CN': 'ppm（百万分之一体积比）', en: 'ppm (parts per million by volume)' },
    what: { 'zh-CN': 'NOAA 全球本底站网络测得的全球月均 CO₂，取去季节化后的 trend 列。', en: 'The global monthly mean CO₂ measured by the NOAA global background station network, taken from the de-seasonalised trend column.' },
    scale: { 'zh-CN': '工业化前约 278 ppm；2024 年已超过 420 ppm；年增幅约 2–3 ppm。', en: 'About 278 ppm before industrialisation; it exceeded 420 ppm in 2024; the annual increase is about 2–3 ppm.' },
    soWhat: { 'zh-CN': '这是「气候变化」这条因果链的起点。它不随季节或经济波动短期回落——大气寿命数百年，意味着今天排放的 CO₂ 会影响几个世代。', en: 'This is the starting point of the causal chain of "climate change". It does not fall back in the short term with the seasons or with economic fluctuations—with an atmospheric lifetime of several centuries, the CO₂ emitted today will affect generations to come.' },
  },
  ch4: {
    zh: { 'zh-CN': '甲烷浓度', en: 'Methane concentration' },
    unit: { 'zh-CN': 'ppb（十亿分之一体积比）', en: 'ppb (parts per billion by volume)' },
    what: { 'zh-CN': '全球本底月均甲烷，同样取去季节化趋势。', en: 'The global monthly mean methane at background sites, likewise taken from the de-seasonalised trend.' },
    scale: { 'zh-CN': '工业化前约 722 ppb，当前已接近 1940 ppb，约为工业化前的 2.7 倍。', en: 'About 722 ppb before industrialisation; currently close to 1940 ppb, roughly 2.7 times the pre-industrial level.' },
    soWhat: { 'zh-CN': '大气寿命只有约 12 年，是「减排见效最快」的那一个。近年的反弹主要来自油气泄漏与湿地排放增强，是学界争议最大的一环。', en: 'With an atmospheric lifetime of only about 12 years, it is the one where emission cuts pay off the fastest. The recent rebound comes mainly from oil and gas leaks and stronger wetland emissions, and is the most hotly debated link in the chain.' },
  },
  n2o: {
    zh: { 'zh-CN': '氧化亚氮浓度', en: 'Nitrous oxide concentration' },
    unit: 'ppb',
    what: { 'zh-CN': '全球本底月均 N₂O，取去季节化趋势。', en: 'The global monthly mean N₂O at background sites, taken from the de-seasonalised trend.' },
    scale: { 'zh-CN': '工业化前约 270 ppb，当前约 340 ppb，增速约 0.8–1.3 ppb/年。', en: 'About 270 ppb before industrialisation; currently about 340 ppb, growing at roughly 0.8–1.3 ppb per year.' },
    soWhat: { 'zh-CN': '量少而极强：增温潜势是 CO₂ 的 265 倍，还顺带消耗臭氧层。几乎全部增量来自农业氮肥，是「粮食生产」与「气候」正面相撞的那个点。', en: 'Small in quantity but extremely potent: its global warming potential is 265 times that of CO₂, and it also depletes the ozone layer. Almost all of its growth comes from agricultural nitrogen fertiliser—the point where "food production" and "climate" collide head-on.' },
  },
  tempAnomaly: {
    zh: { 'zh-CN': '全球地表温度距平', en: 'Global surface temperature anomaly' },
    unit: { 'zh-CN': '°C（相对 1951–1980 年均值）', en: '°C (relative to the 1951–1980 mean)' },
    what: { 'zh-CN': 'NASA GISTEMP 的陆海综合温度（LOTI），把全球网格气温与海温合成一条曲线，再减去基准期均值。', en: 'NASA GISTEMP land–ocean combined temperature (LOTI): gridded global air temperature and sea-surface temperature are merged into a single curve, from which the baseline-period mean is subtracted.' },
    scale: { 'zh-CN': '1880 年代约 −0.3 °C；2020 年代已稳定在 +1.2 °C 上下；单月最高纪录出现在 2023–2024 年。', en: 'About −0.3 °C in the 1880s; it has settled at around +1.2 °C in the 2020s; the record for a single month was set in 2023–2024.' },
    soWhat: { 'zh-CN': '「距平」比绝对温度有用得多：全球平均气温的空间差异（赤道 vs 极地）远大于年际变化，只有减掉基准才能看清趋势。+1.5 °C 是《巴黎协定》的长期目标线。', en: 'The "anomaly" is far more useful than absolute temperature: the spatial spread of global mean temperature (equator vs poles) far exceeds its year-to-year variation, so the trend becomes visible only after subtracting the baseline. +1.5 °C is the long-term target line of the Paris Agreement.' },
  },
  seaIceExtent: {
    zh: { 'zh-CN': '海冰范围', en: 'Sea-ice extent' },
    unit: { 'zh-CN': '百万 km²（阈值法：网格海冰密集度 ≥15% 即计入）', en: 'million km² (threshold method: a grid cell counts once its ice concentration reaches ≥15%)' },
    what: { 'zh-CN': '卫星微波遥感反演的「有冰覆盖的海面面积」，与「海冰面积」（把每格的冰占比乘进去）不是一回事。', en: 'The "area of ice-covered sea surface" retrieved from satellite microwave remote sensing; not the same thing as "sea-ice area" (which multiplies in each cell\'s ice fraction).' },
    scale: { 'zh-CN': '北极 9 月从 1980 年代的约 7 百万 km² 降到近年 4–5；南极 2 月近年约 2.5–3。', en: 'In the Arctic, the September value has fallen from about 7 million km² in the 1980s to 4–5 in recent years; in the Antarctic, the February value has recently been about 2.5–3.' },
    soWhat: { 'zh-CN': '范围比面积数值更大也更常用于业务，因为密集度反演在边缘误差大，阈值法更稳健。两极要用各自的极值月比：北极 9 月最小、南极 2 月最小。', en: 'Extent gives larger values than area and is preferred in operations, because concentration retrievals have large errors at the ice edge and the threshold method is more robust. Compare the two poles at their respective extreme months: the Arctic is at its minimum in September and the Antarctic in February.' },
  },
  albedoFeedback: {
    zh: { 'zh-CN': '冰-反照率正反馈', en: 'Ice–albedo positive feedback' },
    unit: { 'zh-CN': '无量纲（反照率 0–1）', en: 'Dimensionless (albedo 0–1)' },
    what: { 'zh-CN': '海冰反照率约 0.6–0.8，开阔海水只有约 0.06。冰一融化，同一片海面吸收的太阳辐射增加近十倍。', en: 'Sea ice has an albedo of about 0.6–0.8, whereas open water has only about 0.06. Once the ice melts, the same patch of sea surface absorbs nearly ten times as much solar radiation.' },
    scale: { 'zh-CN': '这是北极放大效应（北极升温速度约为全球平均的 3–4 倍）的主因之一。', en: 'This is one of the main drivers of Arctic amplification (the Arctic is warming about 3–4 times faster than the global average).' },
    soWhat: { 'zh-CN': '解释了为什么北极海冰的下降速度比线性外推更快——它是一个自我加速的过程，而非被动响应温度。', en: 'It explains why Arctic sea ice declines faster than a linear extrapolation would suggest—it is a self-accelerating process, not a passive response to temperature.' },
  },
  /* —— 地震与地球内部 —— */
  magnitude: {
    zh: { 'zh-CN': '震级', en: 'Magnitude' },
    unit: { 'zh-CN': 'M（矩震级，对数）', en: 'M (moment magnitude, logarithmic)' },
    what: { 'zh-CN': '由地震矩反推的能量标度。每差 1 级，能量相差约 31.6 倍；差 2 级约 1000 倍。', en: 'An energy scale derived from the seismic moment. Each one-unit step means about 31.6 times the energy; a two-unit step, about 1000 times.' },
    scale: { 'zh-CN': '< 3 微震；3–4.5 轻震；4.5–6 中震；6–7 强震；7–8 大震；≥ 8 巨大震。', en: '< 3 micro; 3–4.5 minor; 4.5–6 moderate; 6–7 strong; 7–8 major; ≥ 8 great.' },
    soWhat: { 'zh-CN': '震级衡量的是「震源释放了多少能量」，不是「你这里晃得多厉害」——后者是烈度。一个 M7 深震可能几乎无感，一个 M5 浅震却能倒塌房屋。', en: 'Magnitude measures "how much energy the source released", not "how hard it shook where you are"—the latter is intensity. An M7 deep earthquake may be barely felt, while a shallow M5 can bring houses down.' },
  },
  depth: {
    zh: { 'zh-CN': '震源深度', en: 'Focal depth' },
    unit: 'km',
    what: { 'zh-CN': '震源（破裂起始点）到地表的垂直距离。', en: 'The vertical distance from the hypocentre (the point where rupture begins) to the surface.' },
    scale: { 'zh-CN': '浅源 < 70 km；中源 70–300 km；深源 > 300 km（最深约 700 km）。', en: 'Shallow < 70 km; intermediate 70–300 km; deep > 300 km (to a maximum of about 700 km).' },
    soWhat: { 'zh-CN': '决定破坏力的关键变量之一。深源地震发生在俯冲板片内部，能量传到地表已大幅衰减——2013 年鄂霍次克海 M8.3 深震（609 km）几乎无人受伤。', en: 'One of the key variables determining destructive power. Deep earthquakes occur inside the subducting slab, and their energy is strongly attenuated by the time it reaches the surface—the 2013 M8.3 deep earthquake beneath the Sea of Okhotsk (609 km) caused virtually no injuries.' },
  },
  intensity: {
    zh: { 'zh-CN': '烈度', en: 'Intensity' },
    unit: { 'zh-CN': '度（中国 GB/T 17742 分 I–XII 度）', en: 'Degree (China GB/T 17742, graded I–XII)' },
    what: { 'zh-CN': '衡量「某地实际受到的影响」：人的感觉、器物反应、房屋损坏、地面破坏。', en: 'Measures "the actual impact at a given place": what people felt, how objects responded, damage to buildings, and ground failure.' },
    scale: { 'zh-CN': '与震级无一一对应关系，取决于震级、深度、距离、场地条件。', en: 'There is no one-to-one correspondence with magnitude; it depends on magnitude, depth, distance and site conditions.' },
    soWhat: { 'zh-CN': '震级是「一个地震一个数」，烈度是「一个地震一张图」。救灾调度看的是烈度图，不是震级。', en: 'Magnitude is "one earthquake, one number"; intensity is "one earthquake, one map". Disaster relief is dispatched using intensity maps, not magnitude.' },
  },
  plateBoundary: {
    zh: { 'zh-CN': '板块边界类型', en: 'Plate boundary type' },
    unit: { 'zh-CN': '分类枚举', en: 'Categorical enumeration' },
    what: { 'zh-CN': '离散（拉张，如大西洋中脊）/ 汇聚（挤压，如俯冲带）/ 转换（走滑，如圣安地列斯）。全球 90% 以上的地震集中在板块边界。', en: 'Divergent (extensional, e.g. the Mid-Atlantic Ridge) / convergent (compressional, e.g. subduction zones) / transform (strike-slip, e.g. the San Andreas Fault). More than 90% of the world\'s earthquakes are concentrated along plate boundaries.' },
    scale: { 'zh-CN': '俯冲带孕育了全部 M9 级地震，走滑断层一般不超过 M8。', en: 'Subduction zones produce all M9 earthquakes, while strike-slip faults generally do not exceed M8.' },
    soWhat: { 'zh-CN': '看地震发生的位置比看震级更能判断成因。日本海沟、智利海沟这类俯冲带也是海啸的源头。', en: 'Where an earthquake occurs tells you more about its cause than its magnitude does. Subduction zones such as the Japan Trench and the Chile Trench are also the sources of tsunamis.' },
  },
  /* —— 地表环境 —— */
  pm25: {
    zh: { 'zh-CN': 'PM2.5', en: 'PM2.5' },
    unit: 'μg/m³',
    what: { 'zh-CN': '空气动力学直径 ≤ 2.5 μm 的颗粒物。小到能穿过肺泡进入血液。', en: 'Particles with an aerodynamic diameter ≤ 2.5 μm. Small enough to pass through the alveoli and enter the bloodstream.' },
    scale: { 'zh-CN': '中国二级标准日均 35、年均 15（μg/m³）；WHO 全球空气质量指导值日均 15、年均 5。', en: 'China\'s Grade II standard: 35 (μg/m³) for the 24-hour mean and 15 for the annual mean; the WHO global air quality guidelines: 15 for the 24-hour mean and 5 for the annual mean.' },
    soWhat: { 'zh-CN': '在所有常规空气污染物里，PM2.5 与心血管疾病、肺癌的关联证据最充分。数值相同但成分不同（扬尘 vs 燃煤 vs 机动车）健康风险也不同。', en: 'Among all criteria air pollutants, PM2.5 has the strongest evidence linking it to cardiovascular disease and lung cancer. The same numerical value can carry different health risks depending on composition (fugitive dust vs coal combustion vs motor vehicles).' },
  },
  aqi: {
    zh: { 'zh-CN': '空气质量指数 AQI', en: 'Air Quality Index (AQI)' },
    unit: { 'zh-CN': '无量纲（本页为欧洲标准）', en: 'Dimensionless (the European standard is used on this page)' },
    what: { 'zh-CN': '把 PM2.5、PM10、O₃、NO₂、SO₂、CO 六种污染物各自的浓度分别折算成分指数，取最高者作为最终 AQI。', en: 'The concentrations of six pollutants—PM2.5, PM10, O₃, NO₂, SO₂ and CO—are each converted into a sub-index, and the highest of them becomes the final AQI.' },
    scale: { 'zh-CN': '欧标：0–20 优 / 20–40 良 / 40–60 轻度 / 60–80 中度 / 80–100 重度 / >100 严重。', en: 'European standard: 0–20 good / 20–40 fair / 40–60 moderate / 60–80 poor / 80–100 very poor / >100 severe.' },
    soWhat: { 'zh-CN': 'AQI 是「取最差的那一项」，所以 AQI 优不等于所有污染物都低。中美标准阈值也不同，跨国产口径比对会失真。', en: 'AQI "takes the worst single pollutant", so a good AQI does not mean every pollutant is low. Chinese and US standards also use different thresholds, so cross-border comparisons distort the picture.' },
  },
  uvIndex: {
    zh: { 'zh-CN': '紫外线指数 UVI', en: 'Ultraviolet Index (UVI)' },
    unit: { 'zh-CN': '无量纲（WHO 标准）', en: 'Dimensionless (WHO standard)' },
    what: { 'zh-CN': '按红斑（晒伤）作用光谱加权后的紫外辐照度，再乘 40 归一化。', en: 'The ultraviolet irradiance weighted by the erythema (sunburn) action spectrum, then multiplied by 40 for normalisation.' },
    scale: { 'zh-CN': '1–2 低 / 3–5 中 / 6–7 高 / 8–10 很高 / 11+ 极高。', en: '1–2 low / 3–5 moderate / 6–7 high / 8–10 very high / 11+ extreme.' },
    soWhat: { 'zh-CN': '正午前后、高海拔、雪面与水面反射都会显著抬高实际暴露量。本页显示的是模型预报值，云量与气溶胶会让它和体感有偏差。', en: 'Solar noon, high altitude, and reflection from snow and water all markedly increase actual exposure. This page shows model forecasts, so cloud cover and aerosols can make them differ from what you actually feel.' },
  },
  feelsLike: {
    zh: { 'zh-CN': '体感温度', en: 'Apparent temperature' },
    unit: '°C',
    what: { 'zh-CN': '在气温基础上综合湿度、风速与辐射后的「人体感受到的冷热」。高温高湿时高于气温（散热受阻），大风低温时低于气温（风寒效应）。', en: 'The "hotness or coldness felt by the human body" after combining humidity, wind speed and radiation with air temperature. It is higher than air temperature in hot, humid conditions (heat dissipation is impeded) and lower in cold, windy conditions (wind chill).' },
    scale: { 'zh-CN': '无统一标准，各家模型（apparent temperature / humidex / wind chill）算法不同。', en: 'There is no unified standard; the various models (apparent temperature / humidex / wind chill) use different algorithms.' },
    soWhat: { 'zh-CN': '中暑与冻伤风险看的是体感而非气温。湿度 80% 时 32 °C 的体感可以接近 40 °C，这是「桑拿天」致命的原因。', en: 'Heat stroke and frostbite risks depend on apparent temperature, not air temperature. At 80% humidity, 32 °C can feel close to 40 °C—this is what makes "sauna days" lethal.' },
  },
  pressure: {
    zh: { 'zh-CN': '地面气压', en: 'Surface pressure' },
    unit: { 'zh-CN': 'hPa（百帕）', en: 'hPa (hectopascals)' },
    what: { 'zh-CN': '测站所在高度的大气压，未做海平面订正。', en: 'The atmospheric pressure at the station\'s own elevation, without reduction to sea level.' },
    scale: { 'zh-CN': '海平面标准 1013.25 hPa；< 1000 常对应低压/风暴系统；> 1025 多为晴好高压。', en: 'The sea-level standard is 1013.25 hPa; below 1000 usually indicates a low-pressure or storm system; above 1025 is mostly a fair-weather high.' },
    soWhat: { 'zh-CN': '看的是「变化率」而非绝对值：3 小时内下降 3 hPa 以上通常预示天气转坏。高原城市（如拉萨）常年只有 650 hPa 左右，属正常。', en: 'What matters is the "rate of change", not the absolute value: a fall of more than 3 hPa within 3 hours usually signals deteriorating weather. Plateau cities (such as Lhasa) sit at around 650 hPa year-round, which is normal.' },
  },
  /* —— 海洋：海浪 —— */
  waveHeight: {
    zh: { 'zh-CN': '有效波高 Hs', en: 'Significant wave height Hs' },
    unit: 'm',
    what: { 'zh-CN': '把一段时间内的波按大小排序，取最大的 1/3 取平均——它接近一个有经验观测者目测报出的浪高。', en: 'Sort the waves in a record by height and average the largest one-third—it is close to the wave height an experienced observer would report by eye.' },
    scale: { 'zh-CN': '单次最大波约为 Hs 的 1.6–1.9 倍；Hs 3 m 时可能出现 5 m 的巨浪。', en: 'The single largest wave is about 1.6–1.9 times Hs; with an Hs of 3 m, a 5 m wave may occur.' },
    soWhat: { 'zh-CN': '所有海况预报说的「浪高」都是 Hs，不是最大浪。设计船舶与平台时却必须按最大浪校核，差这一倍多会出事。', en: 'Every "wave height" in a sea-state forecast is Hs, not the maximum wave. Ships and platforms, however, must be designed against the maximum wave—ignoring that factor of more than two leads to accidents.' },
  },
  wavePeriod: {
    zh: { 'zh-CN': '波周期', en: 'Wave period' },
    unit: 's',
    what: { 'zh-CN': '相邻两个波峰通过同一点的间隔。周期越长，波长越长、传播越远、携带能量越大。', en: 'The interval between two successive crests passing the same point. The longer the period, the longer the wavelength, the farther it travels and the more energy it carries.' },
    scale: { 'zh-CN': '风浪 3–8 s；涌浪 8–20 s；长周期涌浪 > 12 s 即提示远处有强风暴。', en: 'Wind waves 3–8 s; swell 8–20 s; long-period swell above 12 s indicates a strong storm far away.' },
    soWhat: { 'zh-CN': '周期比浪高更能决定「晃不晃船」。长周期涌浪是晕船和系泊断裂的主因，也是冲浪者最看重的那个数。', en: 'Period matters more than height in determining "how much the ship rolls". Long-period swell is the main cause of seasickness and of mooring lines parting, and it is the number surfers care about most.' },
  },
  swellVsWind: {
    zh: { 'zh-CN': '涌浪 vs 风浪', en: 'Swell vs wind waves' },
    unit: { 'zh-CN': 'm（分别给出）', en: 'm (given separately)' },
    what: { 'zh-CN': '风浪由本地风当场吹出，波形杂乱、周期短；涌浪是别处风暴生成的波传播过来，波形规则、周期长。二者叠加成实际海面。', en: 'Wind waves are generated on the spot by local wind: chaotic in form and short in period. Swell is generated by a storm elsewhere and travels in: regular in form and long in period. The two superpose to form the actual sea surface.' },
    scale: { 'zh-CN': '风停后风浪很快消散，涌浪却能跨越上千公里继续传播。', en: 'Wind waves die away quickly once the wind stops, whereas swell can keep travelling for over a thousand kilometres.' },
    soWhat: { 'zh-CN': '「本地没风却有大浪」就是涌浪在起作用。远洋航行与港口作业必须分开看这两项——涌浪提前数天就到，是风暴的先兆。', en: '"Big waves with no local wind" is swell at work. Ocean navigation and port operations must treat the two separately—swell arrives days in advance and is the harbinger of a storm.' },
  },
  /* —— 潮汐 —— */
  tideLevel: {
    zh: { 'zh-CN': '潮位', en: 'Tide level' },
    unit: { 'zh-CN': 'm（相对 MLLW 基准面）', en: 'm (relative to the MLLW datum)' },
    what: { 'zh-CN': '站点实测水位。由天文潮（天体引潮力）与气象潮（风、气压）叠加而成。', en: 'The water level observed at the station, formed by the superposition of the astronomical tide (celestial tide-generating force) and the meteorological tide (wind and pressure).' },
    scale: { 'zh-CN': '本站（旧金山）潮差约 1.8 m；芬迪湾可达 16 m，是全球最大。', en: 'The tidal range at this station (San Francisco) is about 1.8 m; the Bay of Fundy reaches 16 m, the largest in the world.' },
    soWhat: { 'zh-CN': '实测值高于预报值的部分就是「风暴增水」——台风或强低压过境时的增水叠加在天文高潮上，是沿海淹没的主要成因。', en: 'The part of the observed level that exceeds the prediction is the "storm surge"—the rise added on top of the astronomical high tide as a typhoon or an intense low passes, and the main cause of coastal inundation.' },
  },
  tideRange: {
    zh: { 'zh-CN': '潮差', en: 'Tidal range' },
    unit: 'm',
    what: { 'zh-CN': '相邻高潮与低潮的水位之差。', en: 'The difference in water level between the adjacent high and low tide.' },
    scale: { 'zh-CN': '大潮（朔望）与小潮（上下弦）相差可达 2 倍以上，每月循环两次。', en: 'Spring tides (syzygy) and neap tides (quadrature) can differ by a factor of more than two, cycling twice each month.' },
    soWhat: { 'zh-CN': '赶海、进港避浅、潮汐发电都看它。潮差大的海域（如芬迪湾、钱塘江口）还会形成涌潮。', en: 'It is what matters for clam digging, for entering port without grounding, and for tidal power. Seas with a large range (such as the Bay of Fundy and the Qiantang River estuary) also produce tidal bores.' },
  },
  springNeap: {
    zh: { 'zh-CN': '大潮与小潮', en: 'Spring and neap tides' },
    unit: { 'zh-CN': '分类', en: 'Categorical' },
    what: { 'zh-CN': '朔（新月）与望（满月）时日月引潮力同向叠加，潮差最大，称大潮；上下弦时二者部分抵消，潮差最小，称小潮。', en: 'At new moon and full moon the tide-generating forces of the sun and moon align and reinforce each other, giving the largest range—spring tides; at the first and last quarters they partly cancel, giving the smallest range—neap tides.' },
    scale: { 'zh-CN': '一个朔望月 29.53 天内各有两次大潮与小潮。', en: 'Within one synodic month of 29.53 days there are two spring-tide periods and two neap-tide periods.' },
    soWhat: { 'zh-CN': '大潮叠加风暴增水才是最危险的时刻。天文大潮本身可以准确预报到数年之后，危险来自不可预报的气象部分。', en: 'A spring tide combined with a storm surge is the most dangerous moment. Astronomical spring tides themselves can be predicted accurately years ahead; the danger comes from the unpredictable meteorological part.' },
  },
  /* —— 海温与气候 —— */
  sst: {
    zh: { 'zh-CN': '海表温度 SST', en: 'Sea-surface temperature (SST)' },
    unit: '°C',
    what: { 'zh-CN': '海面以下几微米到几米（取决于卫星或浮标的观测深度）的水温。', en: 'The water temperature a few micrometres to a few metres below the sea surface, depending on the observing depth of the satellite or buoy.' },
    scale: { 'zh-CN': '热带约 26–30 °C；> 26.5 °C 且厚度足够是热带气旋生成的必要条件。', en: 'About 26–30 °C in the tropics; above 26.5 °C with sufficient layer thickness is a necessary condition for tropical cyclogenesis.' },
    soWhat: { 'zh-CN': '海洋热容量是大气的约 1000 倍，SST 的异常比气温异常「更顽固」，因而也更适合做气候预测的前兆因子。', en: 'The ocean\'s heat capacity is about 1000 times that of the atmosphere, so SST anomalies are "more persistent" than air-temperature anomalies and are therefore better precursors for climate prediction.' },
  },
  ssta: {
    zh: { 'zh-CN': '海洋温度距平', en: 'Ocean temperature anomaly' },
    unit: { 'zh-CN': '°C（相对 1901–2000 年均值）', en: '°C (relative to the 1901–2000 mean)' },
    what: { 'zh-CN': '全球海洋表面温度减去基准期均值后的年均值。', en: 'The annual mean of global sea-surface temperature after subtracting the baseline-period mean.' },
    scale: { 'zh-CN': '20 世纪大部分年份在 ±0.2 内；2010 年代起稳定在 +0.6 以上，2023–2024 年接近 +0.9。', en: 'Most years of the 20th century fell within ±0.2; since the 2010s it has held above +0.6, approaching +0.9 in 2023–2024.' },
    soWhat: { 'zh-CN': '地球因温室气体滞留的多余热量，九成以上进了海洋。这条曲线几乎是「地球能量失衡」最直接的体温计——比气温距平更少受年际噪声干扰。', en: 'More than 90% of the excess heat trapped on Earth by greenhouse gases has gone into the ocean. This curve is virtually the most direct thermometer of "Earth\'s energy imbalance"—less contaminated by interannual noise than the air-temperature anomaly.' },
  },
  oni: {
    zh: { 'zh-CN': 'ONI 厄尔尼诺指数', en: 'ONI (Oceanic Niño Index)' },
    unit: { 'zh-CN': '°C（Niño 3.4 区海温距平的 3 个月滑动均值）', en: '°C (3-month running mean of the SST anomaly in the Niño 3.4 region)' },
    what: { 'zh-CN': 'Niño 3.4 区（5°N–5°S, 170°W–120°W）的海温距平做 3 个月滑动平均。', en: 'The 3-month running mean of the SST anomaly in the Niño 3.4 region (5°N–5°S, 170°W–120°W).' },
    scale: { 'zh-CN': '≥ +0.5 判厄尔尼诺、≤ −0.5 判拉尼娜；|ONI| 1.0–1.4 中等、1.5–1.9 强、≥2.0 超强。', en: '≥ +0.5 defines El Niño and ≤ −0.5 defines La Niña; |ONI| of 1.0–1.4 is moderate, 1.5–1.9 is strong and ≥2.0 is very strong.' },
    soWhat: { 'zh-CN': '全球气候预测最重要的单一指数。我国容易出现暖冬与南涝北旱，澳大利亚与东南亚易发干旱，而大西洋飓风反而被抑制。', en: 'The single most important index in global climate prediction. China tends to see warm winters with flooding in the south and drought in the north; Australia and Southeast Asia are prone to drought; Atlantic hurricanes, by contrast, are suppressed.' },
  },
  pdo: {
    zh: { 'zh-CN': 'PDO 太平洋十年涛动', en: 'PDO (Pacific Decadal Oscillation)' },
    unit: { 'zh-CN': '无量纲（北太平洋海温距平的主分量）', en: 'Dimensionless (principal component of North Pacific SST anomalies)' },
    what: { 'zh-CN': '北太平洋（20°N 以北）月均海温距平做 EOF 后的第一主分量，正值称暖位相。', en: 'The first principal component after EOF analysis of monthly SST anomalies in the North Pacific (north of 20°N); positive values are the warm phase.' },
    scale: { 'zh-CN': '准周期 20–30 年；数值多在 ±2 之间，持续同号数年才有意义。', en: 'A quasi-period of 20–30 years; values mostly lie within ±2 and are meaningful only when the same sign persists for several years.' },
    soWhat: { 'zh-CN': '它**调制** ENSO 的影响：同样强度的厄尔尼诺，在 PDO 暖位相下对北美的影响会更强。也可以理解为 ENSO 的「背景音量旋钮」。', en: 'It **modulates** the influence of ENSO: an El Niño of equal strength has a stronger impact on North America under the warm phase of the PDO. It can also be understood as ENSO\'s "background volume knob".' },
  },
  amo: {
    zh: { 'zh-CN': 'AMO 大西洋多年代际振荡', en: 'AMO (Atlantic Multidecadal Oscillation)' },
    unit: { 'zh-CN': '°C（北大西洋海温距平，去线性趋势）', en: '°C (North Atlantic SST anomaly, linearly detrended)' },
    what: { 'zh-CN': '北大西洋（0–70°N）海温距平去掉长期增暖趋势后的低频振荡。', en: 'The low-frequency oscillation of SST anomalies in the North Atlantic (0–70°N) after removing the long-term warming trend.' },
    scale: { 'zh-CN': '周期 60–80 年，振幅约 ±0.4 °C。', en: 'A period of 60–80 years with an amplitude of about ±0.4 °C.' },
    soWhat: { 'zh-CN': '暖位相与大西洋飓风活跃期、萨赫勒降水增多、印度季风增强相关；冷位相反之。注意它是「去趋势后」的，不能拿它否认全球增暖。', en: 'The warm phase is associated with active Atlantic hurricane periods, increased rainfall in the Sahel and a stronger Indian monsoon; the cold phase the opposite. Note that it is "detrended", so it cannot be used to deny global warming.' },
  },
  thermohaline: {
    zh: { 'zh-CN': '温盐环流', en: 'Thermohaline circulation' },
    unit: { 'zh-CN': 'Sv（1 Sv = 10⁶ m³/s）', en: 'Sv (1 Sv = 10⁶ m³/s)' },
    what: { 'zh-CN': '由温度与盐度差异驱动的深海环流，北大西洋深层水下沉是其中关键一支。', en: 'The deep-ocean circulation driven by differences in temperature and salinity; the sinking of North Atlantic Deep Water is a key branch of it.' },
    scale: { 'zh-CN': '全球经向翻转环流约 15–20 Sv；有研究认为近几十年有所减弱，但幅度争议很大。', en: 'The global meridional overturning circulation is about 15–20 Sv; some studies suggest it has weakened in recent decades, though the magnitude is highly disputed.' },
    soWhat: { 'zh-CN': '被通俗地称作「大洋输送带」，它把赤道的热量送到高纬。它若显著减弱，欧洲西北部会明显变冷——这是气候临界点讨论里最常被提及的一项。', en: 'Popularly called the "great ocean conveyor belt", it carries heat from the equator to high latitudes. If it weakened substantially, northwestern Europe would cool markedly—one of the most frequently cited items in discussions of climate tipping points.' },
  },
  /* —— 热带气旋 —— */
  cycloneClass: {
    zh: { 'zh-CN': '热带气旋分类', en: 'Tropical cyclone classification' },
    unit: { 'zh-CN': '分类枚举（NHC）', en: 'Categorical enumeration (NHC)' },
    what: { 'zh-CN': 'NHC 按结构与强度给出的业务分类：扰动 → 低压 → 热带低压 → 热带风暴（命名）→ 飓风。', en: 'The NHC operational classification by structure and intensity: disturbance → low → tropical depression → tropical storm (named) → hurricane.' },
    scale: { 'zh-CN': '达到热带风暴（34 kt）即正式命名；达到飓风（64 kt）进入萨菲尔–辛普森分级。', en: 'It is officially named upon reaching tropical storm (34 kt); upon reaching hurricane (64 kt) it enters the Saffir–Simpson scale.' },
    soWhat: { 'zh-CN': '「潜在热带气旋」（PTC）这个级别值得留意：中心还没闭合，但 NHC 判断 48 小时内会影响陆地，因此提前发布警报——避难准备的时间从这里开始算，而不是等它升级。', en: 'The "potential tropical cyclone" (PTC) category deserves attention: the centre is not yet closed, but the NHC judges it will affect land within 48 hours and issues warnings in advance—evacuation preparation time is counted from here, not from when it is upgraded.' },
  },
  saffir: {
    zh: { 'zh-CN': '萨菲尔–辛普森等级', en: 'Saffir–Simpson scale' },
    unit: { 'zh-CN': 'C1–C5（按 1 分钟持续风速）', en: 'C1–C5 (by 1-minute sustained wind speed)' },
    what: { 'zh-CN': '只按风速把飓风分五级的公开分级：C1 33–42 m/s，C5 ≥ 70 m/s。', en: 'A public five-category ranking of hurricanes based on wind speed alone: C1 33–42 m/s, C5 ≥ 70 m/s.' },
    scale: { 'zh-CN': '三级（C3）以上称「强飓风」，是灾害量级的分水岭。', en: 'Category 3 (C3) and above are called "major hurricanes"—the dividing line for disaster magnitude.' },
    soWhat: { 'zh-CN': '它**只看风**，不看雨和风暴潮——而历史上致死最多的恰恰是风暴潮与内陆洪水（如 2017 年哈维）。把它当成唯一危险指标会严重低估风险。', en: 'It **looks only at wind**, not at rain or storm surge—yet storm surge and inland flooding have historically caused the most deaths (for example, Harvey in 2017). Treating it as the sole danger indicator seriously underestimates the risk.' },
  },
  volcanoAlert: {
    zh: { 'zh-CN': '火山警报等级', en: 'Volcano alert level' },
    unit: 'NORMAL / ADVISORY / WATCH / WARNING',
    what: { 'zh-CN': 'USGS 火山灾害警报系统（HANS）面向地面危险度的四级判定，由观测台依地震、形变、气体与目视综合评定。', en: 'The four-level USGS Volcano Hazards Alert-Notification System (HANS) for ground-based hazards, assessed holistically by the observatory from seismicity, deformation, gas and visual observations.' },
    scale: { 'zh-CN': '正常 → 注意 → 警戒 → 警告。页面只显示「高于正常」的火山，列表为空即全网无异常。', en: 'Normal → Advisory → Watch → Warning. The page lists only volcanoes "above normal"; an empty list means nothing is anomalous anywhere.' },
    soWhat: { 'zh-CN': '警报级跳一级，往往意味着地震群频次或二氧化硫排放在几天内翻倍——它是「岩浆正在上移」的最直接业务信号，也是周边航线与居民预警的依据。', en: 'A jump of one alert level usually means earthquake-swarm frequency or SO₂ emission has doubled within days—the most direct operational signal that "magma is on the move", and the basis for warnings to nearby air routes and residents.' },
  },
  aviationColor: {
    zh: { 'zh-CN': '航空色码', en: 'Aviation colour code' },
    unit: 'GREEN / YELLOW / ORANGE / RED',
    what: { 'zh-CN': 'USGS 专门为航空制定的色码，只关心火山灰对飞机的威胁（火山灰可熔穿发动机叶片导致空中停车）。', en: 'A colour code devised by the USGS specifically for aviation; it concerns only the threat of volcanic ash to aircraft (ash can melt through turbine blades and cause engines to flame out in flight).' },
    scale: { 'zh-CN': '红 = 灰柱将显著影响航线；橙 = 喷发在即或灰柱影响有限。', en: 'Red = the ash column will significantly affect air routes; orange = an eruption is imminent or the ash column has only limited impact.' },
    soWhat: { 'zh-CN': '它与地面警报级**不同步**：一次安静的熔岩溢流（地面 WARNING）可以保持绿色码，而一次灰柱不高的爆发却可能升橙。看火山状态时两套都要看，只看一套会读错风险对象。', en: 'It is **not synchronised** with the ground alert level: a quiet lava flow (a ground WARNING) can remain at green, while an eruption with a modest ash column may be raised to orange. When assessing a volcano\'s state you must read both systems—reading only one will misidentify what is at risk.' },
  },
  tsunami: {
    zh: { 'zh-CN': '海啸预警等级', en: 'Tsunami warning level' },
    unit: { 'zh-CN': '信息声明 / 注意 / 建议 / 警报', en: 'Information / Watch / Advisory / Warning' },
    what: { 'zh-CN': 'NOAA 两个海啸预警中心（太平洋中心 PHEB 与国家中心 PAAQ）按地震参数与实测水位发布的四级通报。', en: 'The four-level bulletins issued by NOAA\'s two tsunami warning centres (the Pacific centre PHEB and the national centre PAAQ) based on earthquake parameters and observed water levels.' },
    scale: { 'zh-CN': '警报（Warning）= 危险海啸将至；建议（Advisory）= 强流与危险浪；注意（Watch）= 可能但待确认；信息声明 = 已排除。', en: 'Warning = a dangerous tsunami is coming; Advisory = strong currents and dangerous waves; Watch = possible but unconfirmed; Information = a tsunami has been ruled out.' },
    soWhat: { 'zh-CN': '绝大多数公告都是「信息声明」——这恰恰说明预警在正常工作：一次 M7+ 海底地震发生后，中心在几分钟内就判定它会不会推起水柱，把「虚惊」提前消解掉。真正确认的警报每年只有个位数。', en: 'The great majority of bulletins are "information statements"—which is precisely evidence that the warning system works: after an M7+ undersea earthquake, the centre decides within minutes whether it will displace a water column, defusing "false alarms" in advance. Genuinely confirmed warnings number only single digits each year.' },
  },
  tsunamiSpeed: {
    zh: { 'zh-CN': '海啸波速', en: 'Tsunami wave speed' },
    unit: { 'zh-CN': 'km/h（深海）', en: 'km/h (in the deep ocean)' },
    what: { 'zh-CN': '海啸波长可达上百公里，整个水柱都在动，因此属于浅水波，速度只由水深决定：v = √(g·h)。', en: 'Tsunami wavelengths reach hundreds of kilometres and the entire water column is in motion, so they behave as shallow-water waves whose speed depends only on water depth: v = √(g·h).' },
    scale: { 'zh-CN': '4000 m 深的大洋约 700–800 km/h，接近喷气客机巡航速度；到 10 m 深的近岸降到约 36 km/h。', en: 'About 700–800 km/h in a 4000 m deep ocean, close to the cruising speed of a jet airliner; falling to about 36 km/h in 10 m of water near the coast.' },
    soWhat: { 'zh-CN': '两个反直觉的后果：一是深海海啸只有几十厘米高，船只几乎察觉不到，它的杀伤力全在能量而不在浪高；二是速度骤降导致能量挤压，波长被压缩、水墙被抬升——「退潮露出海床」就是它到达前几分钟的征兆。', en: 'Two counter-intuitive consequences: first, a tsunami in the deep ocean is only tens of centimetres high and ships barely notice it—its destructive power lies entirely in its energy, not its height; second, the abrupt slowdown compresses the energy, shortening the wavelength and raising the water wall—"the tide receding to expose the seabed" is the sign that it will arrive within minutes.' },
  },
  buoy: {
    zh: { 'zh-CN': '海洋浮标观测', en: 'Ocean buoy observations' },
    unit: { 'zh-CN': '波高 m / 周期 s / 风速 m·s⁻¹ / 水温 °C / 气压 hPa', en: 'wave height m / period s / wind speed m·s⁻¹ / water temperature °C / pressure hPa' },
    what: { 'zh-CN': 'NOAA NDBC 锚系浮标与岸站的实时观测，一小时回传一次。本页取全站最新一行（latest_obs），按海域分组。', en: 'Real-time observations from NOAA NDBC moored buoys and coastal stations, transmitted once an hour. This page takes the latest row (latest_obs) from every station and groups them by sea area.' },
    scale: { 'zh-CN': '全球约 870 个在岗站点，其中仅约四分之一配备波浪传感器。缺测以 MM 标记，不是 0。', en: 'About 870 active stations worldwide, of which only about a quarter carry wave sensors. Missing values are flagged as MM, not 0.' },
    soWhat: { 'zh-CN': '浮标是模式预报的**真值来源**——Open-Meteo 的浪高预报之所以可信，是因为它长期被这些浮标校准。反过来看，浮标实测与预报出现偏差时，说明天气尺度系统正在快速变化。', en: 'Buoys are the **source of truth** for model forecasts—Open-Meteo\'s wave-height forecasts are credible precisely because they have long been calibrated against these buoys. Conversely, when buoy observations diverge from the forecast, a synoptic-scale system is changing rapidly.' },
  },
  stormSurge: {
    zh: { 'zh-CN': '风暴增水 / 风暴潮', en: 'Storm surge' },
    unit: { 'zh-CN': 'm（高于天文潮位的额外水位）', en: 'm (additional water level above the astronomical tide)' },
    what: { 'zh-CN': '强风把海水堆向岸边（风应力）加低压吸抬海面（气压）造成的水位异常升高。', en: 'The anomalous rise in water level caused by strong winds piling water against the shore (wind stress) plus low pressure lifting the sea surface (the inverse barometer effect).' },
    scale: { 'zh-CN': '强台风可造成 3–5 m 增水；若叠加天文大潮，总水位可再高 1–2 m。', en: 'A severe typhoon can produce a surge of 3–5 m; if it coincides with an astronomical spring tide, the total water level can be another 1–2 m higher.' },
    soWhat: { 'zh-CN': '热带气旋致死的头号原因。它取决于风场、水深与海岸形状，与风速等级不同步——一个 C1 的慢速大风暴可以造成比 C4 更严重的增水。', en: 'The leading cause of death from tropical cyclones. It depends on the wind field, water depth and coastal shape, and does not track the wind-speed category—a slow-moving, large C1 storm can produce a worse surge than a C4.' },
  },
}

/** 名词解释页的分组顺序（key 与 EARTH_KPI_DEFS 对应） */
export const EARTH_KPI_GROUPS = [
  {
    title: { 'zh-CN': '大气与温室气体', en: 'Atmosphere & Greenhouse Gases' },
    icon: '🌫',
    items: [
      ['co2', { 'zh-CN': 'CO₂ 浓度', en: 'CO₂ concentration' }],
      ['ch4', { 'zh-CN': 'CH₄ 浓度', en: 'CH₄ concentration' }],
      ['n2o', { 'zh-CN': 'N₂O 浓度', en: 'N₂O concentration' }],
      ['tempAnomaly', { 'zh-CN': '温度距平', en: 'Temperature anomaly' }],
    ],
  },
  {
    title: { 'zh-CN': '冰冻圈', en: 'Cryosphere' },
    icon: '🧊',
    items: [
      ['seaIceExtent', { 'zh-CN': '海冰范围', en: 'Sea-ice extent' }],
      ['albedoFeedback', { 'zh-CN': '冰-反照率反馈', en: 'Ice–albedo feedback' }],
    ],
  },
  {
    title: { 'zh-CN': '地震与地球内部', en: 'Earthquakes & Earth\'s Interior' },
    icon: '🪨',
    items: [
      ['magnitude', { 'zh-CN': '震级', en: 'Magnitude' }],
      ['depth', { 'zh-CN': '震源深度', en: 'Focal depth' }],
      ['intensity', { 'zh-CN': '烈度', en: 'Intensity' }],
      ['plateBoundary', { 'zh-CN': '板块边界', en: 'Plate boundaries' }],
    ],
  },
  {
    title: { 'zh-CN': '地表环境', en: 'Surface Environment' },
    icon: '🏙',
    items: [
      ['pm25', { 'zh-CN': 'PM2.5', en: 'PM2.5' }],
      ['aqi', { 'zh-CN': 'AQI', en: 'AQI' }],
      ['uvIndex', { 'zh-CN': '紫外线指数', en: 'UV index' }],
      ['feelsLike', { 'zh-CN': '体感温度', en: 'Apparent temperature' }],
      ['pressure', { 'zh-CN': '地面气压', en: 'Surface pressure' }],
    ],
  },
  {
    title: { 'zh-CN': '海浪', en: 'Waves' },
    icon: '🌊',
    items: [
      ['waveHeight', { 'zh-CN': '有效波高', en: 'Significant wave height' }],
      ['wavePeriod', { 'zh-CN': '波周期', en: 'Wave period' }],
      ['swellVsWind', { 'zh-CN': '涌浪 vs 风浪', en: 'Swell vs wind waves' }],
      ['buoy', { 'zh-CN': '海洋浮标观测', en: 'Ocean buoy observations' }],
    ],
  },
  {
    title: { 'zh-CN': '潮汐', en: 'Tides' },
    icon: '🌗',
    items: [
      ['tideLevel', { 'zh-CN': '潮位', en: 'Tide level' }],
      ['tideRange', { 'zh-CN': '潮差', en: 'Tidal range' }],
      ['springNeap', { 'zh-CN': '大潮与小潮', en: 'Spring & neap tides' }],
    ],
  },
  {
    title: { 'zh-CN': '海温与气候振荡', en: 'SST & Climate Oscillations' },
    icon: '🌡',
    items: [
      ['sst', { 'zh-CN': '海表温度', en: 'Sea-surface temperature' }],
      ['ssta', { 'zh-CN': '海洋温度距平', en: 'Ocean temperature anomaly' }],
      ['oni', { 'zh-CN': 'ONI 指数', en: 'ONI' }],
      ['pdo', { 'zh-CN': 'PDO', en: 'PDO' }],
      ['amo', { 'zh-CN': 'AMO', en: 'AMO' }],
      ['thermohaline', { 'zh-CN': '温盐环流', en: 'Thermohaline circulation' }],
    ],
  },
  {
    title: { 'zh-CN': '热带气旋', en: 'Tropical Cyclones' },
    icon: '🌀',
    items: [
      ['cycloneClass', { 'zh-CN': '气旋分类', en: 'Cyclone classification' }],
      ['saffir', { 'zh-CN': '萨菲尔–辛普森', en: 'Saffir–Simpson' }],
      ['stormSurge', { 'zh-CN': '风暴增水', en: 'Storm surge' }],
    ],
  },
  {
    title: { 'zh-CN': '火山与海啸', en: 'Volcanoes & Tsunamis' },
    icon: '🌋',
    items: [
      ['volcanoAlert', { 'zh-CN': '火山警报等级', en: 'Volcano alert level' }],
      ['aviationColor', { 'zh-CN': '航空色码', en: 'Aviation colour code' }],
      ['tsunami', { 'zh-CN': '海啸预警等级', en: 'Tsunami warning level' }],
      ['tsunamiSpeed', { 'zh-CN': '海啸波速', en: 'Tsunami wave speed' }],
    ],
  },
]

/** 单个 KPI 术语（key 不存在时返回 null） */
export function getEarthKpi(key, lang = 'zh-CN') {
  const d = EARTH_KPI_DEFS[key]
  return d ? localize(d, lang) : null
}

/** 名词解释页的分组顺序，文案字段已解析为当前语种字符串 */
export function getEarthKpiGroups(lang = 'zh-CN') {
  return EARTH_KPI_GROUPS.map((g) => ({
    ...g,
    title: pickText(g.title, lang),
    items: g.items.map(([k, alias]) => [k, pickText(alias, lang)]),
  }))
}
