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
 */

/* ============ 枚举 → 中文 ============ */

/** NHC 热带气旋分类缩写（CurrentStorms.json 的 classification 字段） */
export const CYCLONE_CLASSES = {
  DB: { zh: '扰动', desc: '一团有组织的雷暴，尚未形成闭合环流。' },
  LO: { zh: '低压区', desc: '有闭合等压线但风力未达热带风暴，仍在组织阶段。' },
  WV: { zh: '热带波', desc: '沿信风带西行的波动，是多数大西洋飓风的胚胎。' },
  TD: { zh: '热带低压', desc: '已有闭合环流，持续风速 ≤ 33 kt（17 m/s）。' },
  TS: { zh: '热带风暴', desc: '持续风速 34–63 kt，达到此级就会被正式命名。' },
  SS: { zh: '副热带风暴', desc: '兼具热带与温带特征，核心对流常偏离中心。' },
  SD: { zh: '副热带低压', desc: '副热带气旋的低压阶段。' },
  HU: { zh: '飓风', desc: '持续风速 ≥ 64 kt（33 m/s），北大西洋与东北太平洋的称呼。' },
  PTC: { zh: '潜在热带气旋', desc: '尚未形成闭合中心，但预计 48 小时内会影响陆地，NHC 提前发布警报。' },
  EX: { zh: '温带气旋', desc: '已转性为温带系统，能量来源从海温转为斜压能。' },
  PT: { zh: '后热带气旋', desc: '失去热带特征但仍具相当风力，常伴随大范围强降雨。' },
  PS: { zh: '后热带气旋', desc: '同 PT，NHC 新旧缩写并存。' },
  MD: { zh: '季风低压', desc: '季风槽内的大型低压系统，结构松散、雨区极广。' },
}

/** 萨菲尔–辛普森飓风等级（按 1 分钟持续风速，单位 kt） */
export const SAFFIR_SIMPSON = {
  TS: { zh: '热带风暴', cat: 0, kt: '34–63', ms: '17–32', color: '#38bdf8', desc: '树木摇动，简易房屋受损，海上小艇需回港。' },
  C1: { zh: '一级飓风', cat: 1, kt: '64–82', ms: '33–42', color: '#22c55e', desc: '屋顶瓦片脱落、树枝折断，沿海可出现 1–1.5 m 风暴潮。' },
  C2: { zh: '二级飓风', cat: 2, kt: '83–95', ms: '43–49', color: '#eab308', desc: '门窗破损、移动房屋可毁，风暴潮 1.8–2.4 m，停电可达数周。' },
  C3: { zh: '三级飓风', cat: 3, kt: '96–112', ms: '50–58', color: '#f97316', desc: '达到「强台风」量级，砖木结构房屋严重损毁，风暴潮 2.7–3.7 m。' },
  C4: { zh: '四级飓风', cat: 4, kt: '113–136', ms: '58–70', color: '#ef4444', desc: '屋顶整体掀飞、海岸侵蚀显著，风暴潮 4–5.5 m，内陆亦可受灾。' },
  C5: { zh: '五级飓风', cat: 5, kt: '≥137', ms: '≥70', color: '#a21caf', desc: '最高等级，风暴潮 > 5.5 m，灾区可长期不宜居住。' },
}

/** 欧洲标准 AQI（Open-Meteo 的 european_aqi）：数值越低越好 */
export const AQI_LEVELS = {
  good: { zh: '优', min: -Infinity, max: 20, color: '#0e9f6e', desc: '空气质量令人满意，各类人群可正常活动。' },
  fair: { zh: '良', min: 20, max: 40, color: '#84cc16', desc: '可接受，极少数异常敏感人群应减少户外活动。' },
  moderate: { zh: '轻度', min: 40, max: 60, color: '#f59e0b', desc: '易感人群（儿童、老人、心肺病患者）症状会加剧。' },
  poor: { zh: '中度', min: 60, max: 80, color: '#f97316', desc: '健康人群也可能出现症状，一般人群应减少长时间户外锻炼。' },
  veryPoor: { zh: '重度', min: 80, max: 100, color: '#ef4444', desc: '健康人群普遍出现症状，应避免户外活动。' },
  severe: { zh: '严重', min: 100, max: Infinity, color: '#a21caf', desc: '所有人群健康明显受损，需留在室内并关闭门窗。' },
}

/** 世界卫生组织紫外线指数 UVI 分级 */
export const UV_LEVELS = {
  low: { zh: '低', min: -Infinity, max: 2, color: '#0e9f6e', advice: '无需防护。' },
  moderate: { zh: '中等', min: 2, max: 5, color: '#eab308', advice: '正午尽量待在阴凉处，可戴帽与墨镜。' },
  high: { zh: '高', min: 5, max: 7, color: '#f97316', advice: '需涂 SPF15+ 防晒，正午减少外出。' },
  veryHigh: { zh: '很高', min: 7, max: 10, color: '#ef4444', advice: '必须防晒 + 遮阳，10–16 时避免暴晒。' },
  extreme: { zh: '极高', min: 10, max: Infinity, color: '#a21caf', advice: '皮肤可 15 分钟内晒伤，尽量避免外出。' },
}

/** 震级分档（中国地震台网习惯用语） */
export const MAGNITUDE_BANDS = {
  micro: { zh: '极微震', min: -Infinity, max: 2, color: '#94a3b8', desc: '人无感觉，仅仪器记录。' },
  veryMinor: { zh: '微震', min: 2, max: 3, color: '#a3a3a3', desc: '个别敏感者可感，无破坏。' },
  minor: { zh: '轻震', min: 3, max: 4.5, color: '#eab308', desc: '室内多数人有感，悬挂物摆动。' },
  moderate: { zh: '中震', min: 4.5, max: 6, color: '#f97316', desc: '墙体可出现裂缝，老旧房屋受损。' },
  strong: { zh: '强震', min: 6, max: 7, color: '#ef4444', desc: '房屋倒塌，可造成人员伤亡。' },
  major: { zh: '大震', min: 7, max: 8, color: '#dc2626', desc: '大范围严重破坏，可引发海啸。' },
  great: { zh: '巨大震', min: 8, max: Infinity, color: '#7f1d1d', desc: '毁灭性，地表可出现断裂带，全球可测。' },
}

/** 震源深度分带（USGS 惯例） */
export const DEPTH_ZONES = {
  shallow: { zh: '浅源', min: -Infinity, max: 70, color: '#ef4444', desc: '发生在地壳脆性地层内，地表震感最强、破坏最大——绝大多数灾害性地震都是浅源。' },
  middle: { zh: '中源', min: 70, max: 300, color: '#f59e0b', desc: '多位于俯冲板片上部，震感中等。' },
  deep: { zh: '深源', min: 300, max: Infinity, color: '#3b82f6', desc: '发生在俯冲板片内部（最深约 700 km），能量衰减多，地表通常震感弱但波及范围广。' },
}

/** 海况等级（近海通行观感分级，非蒲福风级） */
export const WAVE_STATES = {
  calm: { zh: '平静', min: -Infinity, max: 0.3, color: '#0e9f6e', desc: '海面如镜，小艇可安全出港。' },
  light: { zh: '轻浪', min: 0.3, max: 0.8, color: '#0ea5e9', desc: '波峰开始破碎，近海作业正常。' },
  moderate: { zh: '中浪', min: 0.8, max: 1.5, color: '#f59e0b', desc: '小船需谨慎，晕船概率上升。' },
  rough: { zh: '大浪', min: 1.5, max: 2.5, color: '#f97316', desc: '渔业作业受限，小型客轮可能停航。' },
  veryRough: { zh: '巨浪', min: 2.5, max: Infinity, color: '#ef4444', desc: '港口可能封港，船舶需避风。' },
}

/** 潮位基准面（NOAA CO-OPS datum） */
export const TIDE_DATUMS = {
  MLLW: { zh: '平均较低低潮面', desc: '取每日两次低潮中较低者的长期平均。美国海图与潮位表的通用零点，本站潮位以此为 0。' },
  MLW: { zh: '平均低潮面', desc: '所有低潮的长期平均，比 MLLW 略高。' },
  MSL: { zh: '平均海平面', desc: '所有水位的长期平均，是海平面上升研究的基准。' },
  MHHW: { zh: '平均较高高潮面', desc: '每日两次高潮中较高者的长期平均，常用于标定防潮堤高程。' },
  NAVD88: { zh: '北美垂直基准 1988', desc: '陆地高程基准，与潮位基准之间的换算需查站点的基准转换表。' },
}

/** 气候振荡模态 */
export const OSCILLATIONS = {
  enso: { zh: 'ENSO 厄尔尼诺-南方涛动', period: '2–7 年', region: '赤道太平洋', desc: '海气耦合最强的年际信号，ONI 是它的官方指数。' },
  pdo: { zh: 'PDO 太平洋十年涛动', period: '20–30 年准周期', region: '北太平洋 20°N 以北', desc: '北太平洋海温的低频模态，暖位相时阿拉斯加湾偏暖、北美西海岸生态与渔业随之改变。' },
  amo: { zh: 'AMO 大西洋多年代际振荡', period: '60–80 年', region: '北大西洋 0–70°N', desc: '北大西洋海温的低频模态，暖位相与大西洋飓风活跃期、萨赫勒降水增多相关。' },
  nao: { zh: 'NAO 北大西洋涛动', period: '无严格周期', region: '冰岛低压—亚速尔高压', desc: '气压差驱动的大气模态，决定欧洲冬季冷暖干湿。' },
}

/** 温室气体（与 vite-geo-proxy.mjs 的 GHG_DEFS 对应） */
export const GREENHOUSE_GASES = {
  co2: { zh: '二氧化碳', formula: 'CO₂', unit: 'ppm', gwp100: 1, preIndustrial: 278, desc: '最主要的人为温室气体，来自化石燃料、水泥与土地利用变化。大气寿命长达数百年，是最难逆转的那一个。' },
  ch4: { zh: '甲烷', formula: 'CH₄', unit: 'ppb', gwp100: 28, preIndustrial: 722, desc: '百年尺度增温潜势约为 CO₂ 的 28 倍。大气寿命仅约 12 年——减排它见效最快，是短期控温的关键抓手。' },
  n2o: { zh: '氧化亚氮', formula: 'N₂O', unit: 'ppb', gwp100: 265, preIndustrial: 270, desc: '增温潜势约 265 倍，且是当前平流层臭氧消耗的首要物质。主要来自氮肥施用，随化肥用量同步上升。' },
}

/**
 * 火山地面警报级（USGS HANS，面向地面危险度）。
 * 与 AVIATION_CODES 是两套并行但不等价的体系，页面必须分开显示。
 */
export const VOLCANO_ALERTS = {
  NORMAL: { zh: '正常', rank: 1, color: '#0e9f6e', desc: '典型背景活动，或处于已知的非喷发期。' },
  ADVISORY: { zh: '注意', rank: 2, color: '#eab308', desc: '活动高于已知背景，或监测数据出现异常，但没有明确的喷发前兆。' },
  WATCH: { zh: '警戒', rank: 3, color: '#f97316', desc: '活动升级、喷发可能性增大，或正在喷发但火山灰与熔岩影响仍局限在火山口附近。' },
  WARNING: { zh: '警告', rank: 4, color: '#dc2626', desc: '危险喷发正在进行或即将发生，火山灰、碎屑流或熔岩流已威胁到周边地区。' },
}

/** 航空色码（USGS HANS，面向飞行安全） */
export const AVIATION_CODES = {
  GREEN: { zh: '绿色', rank: 1, color: '#0e9f6e', desc: '典型背景、非喷发状态。' },
  YELLOW: { zh: '黄色', rank: 2, color: '#eab308', desc: '活动迹象高于已知背景。' },
  ORANGE: { zh: '橙色', rank: 3, color: '#f97316', desc: '喷发在即并可能释放火山灰，或喷发中灰柱影响有限。' },
  RED: { zh: '红色', rank: 4, color: '#dc2626', desc: '即将或正在发生重大喷发，灰柱将显著影响航线。' },
}

/** NOAA 海啸公告四级（rank 越大越危险） */
export const TSUNAMI_CATEGORIES = {
  Information: { zh: '信息声明', rank: 1, color: '#0ea5e9', desc: '地震已发生但不构成海啸威胁，或仅为告知他处海域的通报。' },
  Watch: { zh: '海啸注意', rank: 2, color: '#eab308', desc: '远处强震可能引发海啸，保持警惕并等待进一步通报。' },
  Advisory: { zh: '海啸建议', rank: 3, color: '#f97316', desc: '预计有强海流与危险波浪，远离海水、沙滩、港口与码头。' },
  Warning: { zh: '海啸警报', rank: 4, color: '#dc2626', desc: '危险海啸已发生或即将到达，立即撤离海岸与海滩、前往高地或内陆。' },
}

/* ============ 通用查表 ============ */

/**
 * 通用查表：查不到就原样返回英文。
 * 返回的字段形状与表内条目一致，调用点不必防 undefined。
 */
export function lookup(key, dict) {
  if (key == null) return null
  const raw = String(key).trim()
  if (!raw) return null
  const hit = dict[raw]
  if (hit) return { en: raw, ...hit }
  return { zh: raw, en: raw, desc: '上游新增的枚举值，术语表暂未收录。' }
}

/**
 * 数值 → 落在哪个分档。
 * 分档表按 max 从小到大排列，命中第一个 `value <= max` 即返回（半开区间语义）。
 * 返回对象额外带 `label`，与各看板 ui.jsx 的历史字段名保持一致。
 */
export function bandOf(value, bands) {
  if (!Number.isFinite(value)) return null
  const list = Object.entries(bands)
  for (const [key, b] of list) {
    if (value <= b.max) return { key, label: b.zh, ...b }
  }
  const last = list[list.length - 1]
  return { key: last[0], label: last[1].zh, ...last[1] }
}

/** NHC 分类缩写 → 中文 */
export function zhCycloneClass(code) {
  return lookup(code, CYCLONE_CLASSES)
}

/** 萨菲尔–辛普森等级码（C1–C5 / TS）→ 中文 */
export function zhCycloneScale(level) {
  return lookup(level, SAFFIR_SIMPSON)
}

/** 欧标 AQI 数值 → 等级 */
export function aqiLevel(v) {
  if (!Number.isFinite(v)) return { zh: '—', color: '#94a3b8', desc: '无数据' }
  return bandOf(v, AQI_LEVELS)
}

/** 紫外线指数 → 等级 */
export function uvLevel(v) {
  if (!Number.isFinite(v)) return { zh: '—', color: '#94a3b8', advice: '无数据' }
  return bandOf(v, UV_LEVELS)
}

/** 震级 → 分档 */
export function magBand(m) {
  if (!Number.isFinite(m)) return { key: 'unknown', zh: '未知', label: '未知', color: '#94a3b8', desc: '震级未测定' }
  return bandOf(m, MAGNITUDE_BANDS)
}

/** 震源深度（km）→ 分带 */
export function depthClass(d) {
  if (!Number.isFinite(d)) return { key: 'unknown', zh: '未知', label: '未知', color: '#94a3b8', desc: '深度未测定' }
  return bandOf(d, DEPTH_ZONES)
}

/** 浪高（m）→ 海况等级 */
export function waveLevel(h) {
  if (!Number.isFinite(h)) return { zh: '—', color: '#94a3b8', desc: '无数据' }
  return bandOf(h, WAVE_STATES)
}

/** 潮位基准面 → 中文 */
export function zhTideDatum(code) {
  return lookup(code, TIDE_DATUMS)
}

/** 气候振荡 key → 中文 */
export function zhOscillation(key) {
  return lookup(key, OSCILLATIONS)
}

/** 温室气体 key → 中文 */
export function zhVolcanoAlert(key) {
  return lookup(key, VOLCANO_ALERTS)
}

export function zhAviationCode(key) {
  return lookup(key, AVIATION_CODES)
}

export function zhTsunamiCategory(key) {
  return lookup(key, TSUNAMI_CATEGORIES)
}

export function zhGreenhouseGas(key) {
  return lookup(key, GREENHOUSE_GASES)
}

/* ============ KPI 术语解释表 ============ */

export const EARTH_KPI_DEFS = {
  /* —— 大气与温室气体 —— */
  co2: {
    zh: '二氧化碳浓度',
    unit: 'ppm（百万分之一体积比）',
    what: 'NOAA 全球本底站网络测得的全球月均 CO₂，取去季节化后的 trend 列。',
    scale: '工业化前约 278 ppm；2024 年已超过 420 ppm；年增幅约 2–3 ppm。',
    soWhat: '这是「气候变化」这条因果链的起点。它不随季节或经济波动短期回落——大气寿命数百年，意味着今天排放的 CO₂ 会影响几个世代。',
  },
  ch4: {
    zh: '甲烷浓度',
    unit: 'ppb（十亿分之一体积比）',
    what: '全球本底月均甲烷，同样取去季节化趋势。',
    scale: '工业化前约 722 ppb，当前已接近 1940 ppb，约为工业化前的 2.7 倍。',
    soWhat: '大气寿命只有约 12 年，是「减排见效最快」的那一个。近年的反弹主要来自油气泄漏与湿地排放增强，是学界争议最大的一环。',
  },
  n2o: {
    zh: '氧化亚氮浓度',
    unit: 'ppb',
    what: '全球本底月均 N₂O，取去季节化趋势。',
    scale: '工业化前约 270 ppb，当前约 340 ppb，增速约 0.8–1.3 ppb/年。',
    soWhat: '量少而极强：增温潜势是 CO₂ 的 265 倍，还顺带消耗臭氧层。几乎全部增量来自农业氮肥，是「粮食生产」与「气候」正面相撞的那个点。',
  },
  tempAnomaly: {
    zh: '全球地表温度距平',
    unit: '°C（相对 1951–1980 年均值）',
    what: 'NASA GISTEMP 的陆海综合温度（LOTI），把全球网格气温与海温合成一条曲线，再减去基准期均值。',
    scale: '1880 年代约 −0.3 °C；2020 年代已稳定在 +1.2 °C 上下；单月最高纪录出现在 2023–2024 年。',
    soWhat: '「距平」比绝对温度有用得多：全球平均气温的空间差异（赤道 vs 极地）远大于年际变化，只有减掉基准才能看清趋势。+1.5 °C 是《巴黎协定》的长期目标线。',
  },
  seaIceExtent: {
    zh: '海冰范围',
    unit: '百万 km²（阈值法：网格海冰密集度 ≥15% 即计入）',
    what: '卫星微波遥感反演的「有冰覆盖的海面面积」，与「海冰面积」（把每格的冰占比乘进去）不是一回事。',
    scale: '北极 9 月从 1980 年代的约 7 百万 km² 降到近年 4–5；南极 2 月近年约 2.5–3。',
    soWhat: '范围比面积数值更大也更常用于业务，因为密集度反演在边缘误差大，阈值法更稳健。两极要用各自的极值月比：北极 9 月最小、南极 2 月最小。',
  },
  albedoFeedback: {
    zh: '冰-反照率正反馈',
    unit: '无量纲（反照率 0–1）',
    what: '海冰反照率约 0.6–0.8，开阔海水只有约 0.06。冰一融化，同一片海面吸收的太阳辐射增加近十倍。',
    scale: '这是北极放大效应（北极升温速度约为全球平均的 3–4 倍）的主因之一。',
    soWhat: '解释了为什么北极海冰的下降速度比线性外推更快——它是一个自我加速的过程，而非被动响应温度。',
  },
  /* —— 地震与地球内部 —— */
  magnitude: {
    zh: '震级',
    unit: 'M（矩震级，对数）',
    what: '由地震矩反推的能量标度。每差 1 级，能量相差约 31.6 倍；差 2 级约 1000 倍。',
    scale: '< 3 微震；3–4.5 轻震；4.5–6 中震；6–7 强震；7–8 大震；≥ 8 巨大震。',
    soWhat: '震级衡量的是「震源释放了多少能量」，不是「你这里晃得多厉害」——后者是烈度。一个 M7 深震可能几乎无感，一个 M5 浅震却能倒塌房屋。',
  },
  depth: {
    zh: '震源深度',
    unit: 'km',
    what: '震源（破裂起始点）到地表的垂直距离。',
    scale: '浅源 < 70 km；中源 70–300 km；深源 > 300 km（最深约 700 km）。',
    soWhat: '决定破坏力的关键变量之一。深源地震发生在俯冲板片内部，能量传到地表已大幅衰减——2013 年鄂霍次克海 M8.3 深震（609 km）几乎无人受伤。',
  },
  intensity: {
    zh: '烈度',
    unit: '度（中国 GB/T 17742 分 I–XII 度）',
    what: '衡量「某地实际受到的影响」：人的感觉、器物反应、房屋损坏、地面破坏。',
    scale: '与震级无一一对应关系，取决于震级、深度、距离、场地条件。',
    soWhat: '震级是「一个地震一个数」，烈度是「一个地震一张图」。救灾调度看的是烈度图，不是震级。',
  },
  plateBoundary: {
    zh: '板块边界类型',
    unit: '分类枚举',
    what: '离散（拉张，如大西洋中脊）/ 汇聚（挤压，如俯冲带）/ 转换（走滑，如圣安地列斯）。全球 90% 以上的地震集中在板块边界。',
    scale: '俯冲带孕育了全部 M9 级地震，走滑断层一般不超过 M8。',
    soWhat: '看地震发生的位置比看震级更能判断成因。日本海沟、智利海沟这类俯冲带也是海啸的源头。',
  },
  /* —— 地表环境 —— */
  pm25: {
    zh: 'PM2.5',
    unit: 'μg/m³',
    what: '空气动力学直径 ≤ 2.5 μm 的颗粒物。小到能穿过肺泡进入血液。',
    scale: '中国二级标准日均 35、年均 15（μg/m³）；WHO 全球空气质量指导值日均 15、年均 5。',
    soWhat: '在所有常规空气污染物里，PM2.5 与心血管疾病、肺癌的关联证据最充分。数值相同但成分不同（扬尘 vs 燃煤 vs 机动车）健康风险也不同。',
  },
  aqi: {
    zh: '空气质量指数 AQI',
    unit: '无量纲（本页为欧洲标准）',
    what: '把 PM2.5、PM10、O₃、NO₂、SO₂、CO 六种污染物各自的浓度分别折算成分指数，取最高者作为最终 AQI。',
    scale: '欧标：0–20 优 / 20–40 良 / 40–60 轻度 / 60–80 中度 / 80–100 重度 / >100 严重。',
    soWhat: 'AQI 是「取最差的那一项」，所以 AQI 优不等于所有污染物都低。中美标准阈值也不同，跨国产口径比对会失真。',
  },
  uvIndex: {
    zh: '紫外线指数 UVI',
    unit: '无量纲（WHO 标准）',
    what: '按红斑（晒伤）作用光谱加权后的紫外辐照度，再乘 40 归一化。',
    scale: '1–2 低 / 3–5 中 / 6–7 高 / 8–10 很高 / 11+ 极高。',
    soWhat: '正午前后、高海拔、雪面与水面反射都会显著抬高实际暴露量。本页显示的是模型预报值，云量与气溶胶会让它和体感有偏差。',
  },
  feelsLike: {
    zh: '体感温度',
    unit: '°C',
    what: '在气温基础上综合湿度、风速与辐射后的「人体感受到的冷热」。高温高湿时高于气温（散热受阻），大风低温时低于气温（风寒效应）。',
    scale: '无统一标准，各家模型（apparent temperature / humidex / wind chill）算法不同。',
    soWhat: '中暑与冻伤风险看的是体感而非气温。湿度 80% 时 32 °C 的体感可以接近 40 °C，这是「桑拿天」致命的原因。',
  },
  pressure: {
    zh: '地面气压',
    unit: 'hPa（百帕）',
    what: '测站所在高度的大气压，未做海平面订正。',
    scale: '海平面标准 1013.25 hPa；< 1000 常对应低压/风暴系统；> 1025 多为晴好高压。',
    soWhat: '看的是「变化率」而非绝对值：3 小时内下降 3 hPa 以上通常预示天气转坏。高原城市（如拉萨）常年只有 650 hPa 左右，属正常。',
  },
  /* —— 海洋：海浪 —— */
  waveHeight: {
    zh: '有效波高 Hs',
    unit: 'm',
    what: '把一段时间内的波按大小排序，取最大的 1/3 取平均——它接近一个有经验观测者目测报出的浪高。',
    scale: '单次最大波约为 Hs 的 1.6–1.9 倍；Hs 3 m 时可能出现 5 m 的巨浪。',
    soWhat: '所有海况预报说的「浪高」都是 Hs，不是最大浪。设计船舶与平台时却必须按最大浪校核，差这一倍多会出事。',
  },
  wavePeriod: {
    zh: '波周期',
    unit: 's',
    what: '相邻两个波峰通过同一点的间隔。周期越长，波长越长、传播越远、携带能量越大。',
    scale: '风浪 3–8 s；涌浪 8–20 s；长周期涌浪 > 12 s 即提示远处有强风暴。',
    soWhat: '周期比浪高更能决定「晃不晃船」。长周期涌浪是晕船和系泊断裂的主因，也是冲浪者最看重的那个数。',
  },
  swellVsWind: {
    zh: '涌浪 vs 风浪',
    unit: 'm（分别给出）',
    what: '风浪由本地风当场吹出，波形杂乱、周期短；涌浪是别处风暴生成的波传播过来，波形规则、周期长。二者叠加成实际海面。',
    scale: '风停后风浪很快消散，涌浪却能跨越上千公里继续传播。',
    soWhat: '「本地没风却有大浪」就是涌浪在起作用。远洋航行与港口作业必须分开看这两项——涌浪提前数天就到，是风暴的先兆。',
  },
  /* —— 潮汐 —— */
  tideLevel: {
    zh: '潮位',
    unit: 'm（相对 MLLW 基准面）',
    what: '站点实测水位。由天文潮（天体引潮力）与气象潮（风、气压）叠加而成。',
    scale: '本站（旧金山）潮差约 1.8 m；芬迪湾可达 16 m，是全球最大。',
    soWhat: '实测值高于预报值的部分就是「风暴增水」——台风或强低压过境时的增水叠加在天文高潮上，是沿海淹没的主要成因。',
  },
  tideRange: {
    zh: '潮差',
    unit: 'm',
    what: '相邻高潮与低潮的水位之差。',
    scale: '大潮（朔望）与小潮（上下弦）相差可达 2 倍以上，每月循环两次。',
    soWhat: '赶海、进港避浅、潮汐发电都看它。潮差大的海域（如芬迪湾、钱塘江口）还会形成涌潮。',
  },
  springNeap: {
    zh: '大潮与小潮',
    unit: '分类',
    what: '朔（新月）与望（满月）时日月引潮力同向叠加，潮差最大，称大潮；上下弦时二者部分抵消，潮差最小，称小潮。',
    scale: '一个朔望月 29.53 天内各有两次大潮与小潮。',
    soWhat: '大潮叠加风暴增水才是最危险的时刻。天文大潮本身可以准确预报到数年之后，危险来自不可预报的气象部分。',
  },
  /* —— 海温与气候 —— */
  sst: {
    zh: '海表温度 SST',
    unit: '°C',
    what: '海面以下几微米到几米（取决于卫星或浮标的观测深度）的水温。',
    scale: '热带约 26–30 °C；> 26.5 °C 且厚度足够是热带气旋生成的必要条件。',
    soWhat: '海洋热容量是大气的约 1000 倍，SST 的异常比气温异常「更顽固」，因而也更适合做气候预测的前兆因子。',
  },
  ssta: {
    zh: '海洋温度距平',
    unit: '°C（相对 1901–2000 年均值）',
    what: '全球海洋表面温度减去基准期均值后的年均值。',
    scale: '20 世纪大部分年份在 ±0.2 内；2010 年代起稳定在 +0.6 以上，2023–2024 年接近 +0.9。',
    soWhat: '地球因温室气体滞留的多余热量，九成以上进了海洋。这条曲线几乎是「地球能量失衡」最直接的体温计——比气温距平更少受年际噪声干扰。',
  },
  oni: {
    zh: 'ONI 厄尔尼诺指数',
    unit: '°C（Niño 3.4 区海温距平的 3 个月滑动均值）',
    what: 'Niño 3.4 区（5°N–5°S, 170°W–120°W）的海温距平做 3 个月滑动平均。',
    scale: '≥ +0.5 判厄尔尼诺、≤ −0.5 判拉尼娜；|ONI| 1.0–1.4 中等、1.5–1.9 强、≥2.0 超强。',
    soWhat: '全球气候预测最重要的单一指数。我国容易出现暖冬与南涝北旱，澳大利亚与东南亚易发干旱，而大西洋飓风反而被抑制。',
  },
  pdo: {
    zh: 'PDO 太平洋十年涛动',
    unit: '无量纲（北太平洋海温距平的主分量）',
    what: '北太平洋（20°N 以北）月均海温距平做 EOF 后的第一主分量，正值称暖位相。',
    scale: '准周期 20–30 年；数值多在 ±2 之间，持续同号数年才有意义。',
    soWhat: '它**调制** ENSO 的影响：同样强度的厄尔尼诺，在 PDO 暖位相下对北美的影响会更强。也可以理解为 ENSO 的「背景音量旋钮」。',
  },
  amo: {
    zh: 'AMO 大西洋多年代际振荡',
    unit: '°C（北大西洋海温距平，去线性趋势）',
    what: '北大西洋（0–70°N）海温距平去掉长期增暖趋势后的低频振荡。',
    scale: '周期 60–80 年，振幅约 ±0.4 °C。',
    soWhat: '暖位相与大西洋飓风活跃期、萨赫勒降水增多、印度季风增强相关；冷位相反之。注意它是「去趋势后」的，不能拿它否认全球增暖。',
  },
  thermohaline: {
    zh: '温盐环流',
    unit: 'Sv（1 Sv = 10⁶ m³/s）',
    what: '由温度与盐度差异驱动的深海环流，北大西洋深层水下沉是其中关键一支。',
    scale: '全球经向翻转环流约 15–20 Sv；有研究认为近几十年有所减弱，但幅度争议很大。',
    soWhat: '被通俗地称作「大洋输送带」，它把赤道的热量送到高纬。它若显著减弱，欧洲西北部会明显变冷——这是气候临界点讨论里最常被提及的一项。',
  },
  /* —— 热带气旋 —— */
  cycloneClass: {
    zh: '热带气旋分类',
    unit: '分类枚举（NHC）',
    what: 'NHC 按结构与强度给出的业务分类：扰动 → 低压 → 热带低压 → 热带风暴（命名）→ 飓风。',
    scale: '达到热带风暴（34 kt）即正式命名；达到飓风（64 kt）进入萨菲尔–辛普森分级。',
    soWhat: '「潜在热带气旋」（PTC）这个级别值得留意：中心还没闭合，但 NHC 判断 48 小时内会影响陆地，因此提前发布警报——避难准备的时间从这里开始算，而不是等它升级。',
  },
  saffir: {
    zh: '萨菲尔–辛普森等级',
    unit: 'C1–C5（按 1 分钟持续风速）',
    what: '只按风速把飓风分五级的公开分级：C1 33–42 m/s，C5 ≥ 70 m/s。',
    scale: '三级（C3）以上称「强飓风」，是灾害量级的分水岭。',
    soWhat: '它**只看风**，不看雨和风暴潮——而历史上致死最多的恰恰是风暴潮与内陆洪水（如 2017 年哈维）。把它当成唯一危险指标会严重低估风险。',
  },
  volcanoAlert: {
    zh: '火山警报等级',
    unit: 'NORMAL / ADVISORY / WATCH / WARNING',
    what: 'USGS 火山灾害警报系统（HANS）面向地面危险度的四级判定，由观测台依地震、形变、气体与目视综合评定。',
    scale: '正常 → 注意 → 警戒 → 警告。页面只显示「高于正常」的火山，列表为空即全网无异常。',
    soWhat: '警报级跳一级，往往意味着地震群频次或二氧化硫排放在几天内翻倍——它是「岩浆正在上移」的最直接业务信号，也是周边航线与居民预警的依据。',
  },
  aviationColor: {
    zh: '航空色码',
    unit: 'GREEN / YELLOW / ORANGE / RED',
    what: 'USGS 专门为航空制定的色码，只关心火山灰对飞机的威胁（火山灰可熔穿发动机叶片导致空中停车）。',
    scale: '红 = 灰柱将显著影响航线；橙 = 喷发在即或灰柱影响有限。',
    soWhat: '它与地面警报级**不同步**：一次安静的熔岩溢流（地面 WARNING）可以保持绿色码，而一次灰柱不高的爆发却可能升橙。看火山状态时两套都要看，只看一套会读错风险对象。',
  },
  tsunami: {
    zh: '海啸预警等级',
    unit: '信息声明 / 注意 / 建议 / 警报',
    what: 'NOAA 两个海啸预警中心（太平洋中心 PHEB 与国家中心 PAAQ）按地震参数与实测水位发布的四级通报。',
    scale: '警报（Warning）= 危险海啸将至；建议（Advisory）= 强流与危险浪；注意（Watch）= 可能但待确认；信息声明 = 已排除。',
    soWhat: '绝大多数公告都是「信息声明」——这恰恰说明预警在正常工作：一次 M7+ 海底地震发生后，中心在几分钟内就判定它会不会推起水柱，把「虚惊」提前消解掉。真正确认的警报每年只有个位数。',
  },
  tsunamiSpeed: {
    zh: '海啸波速',
    unit: 'km/h（深海）',
    what: '海啸波长可达上百公里，整个水柱都在动，因此属于浅水波，速度只由水深决定：v = √(g·h)。',
    scale: '4000 m 深的大洋约 700–800 km/h，接近喷气客机巡航速度；到 10 m 深的近岸降到约 36 km/h。',
    soWhat: '两个反直觉的后果：一是深海海啸只有几十厘米高，船只几乎察觉不到，它的杀伤力全在能量而不在浪高；二是速度骤降导致能量挤压，波长被压缩、水墙被抬升——「退潮露出海床」就是它到达前几分钟的征兆。',
  },
  buoy: {
    zh: '海洋浮标观测',
    unit: '波高 m / 周期 s / 风速 m·s⁻¹ / 水温 °C / 气压 hPa',
    what: 'NOAA NDBC 锚系浮标与岸站的实时观测，一小时回传一次。本页取全站最新一行（latest_obs），按海域分组。',
    scale: '全球约 870 个在岗站点，其中仅约四分之一配备波浪传感器。缺测以 MM 标记，不是 0。',
    soWhat: '浮标是模式预报的**真值来源**——Open-Meteo 的浪高预报之所以可信，是因为它长期被这些浮标校准。反过来看，浮标实测与预报出现偏差时，说明天气尺度系统正在快速变化。',
  },
  stormSurge: {
    zh: '风暴增水 / 风暴潮',
    unit: 'm（高于天文潮位的额外水位）',
    what: '强风把海水堆向岸边（风应力）加低压吸抬海面（气压）造成的水位异常升高。',
    scale: '强台风可造成 3–5 m 增水；若叠加天文大潮，总水位可再高 1–2 m。',
    soWhat: '热带气旋致死的头号原因。它取决于风场、水深与海岸形状，与风速等级不同步——一个 C1 的慢速大风暴可以造成比 C4 更严重的增水。',
  },
}

/** 名词解释页的分组顺序（key 与 EARTH_KPI_DEFS 对应） */
export const EARTH_KPI_GROUPS = [
  {
    title: '大气与温室气体',
    icon: '🌫',
    items: [
      ['co2', 'CO₂ 浓度'],
      ['ch4', 'CH₄ 浓度'],
      ['n2o', 'N₂O 浓度'],
      ['tempAnomaly', '温度距平'],
    ],
  },
  {
    title: '冰冻圈',
    icon: '🧊',
    items: [
      ['seaIceExtent', '海冰范围'],
      ['albedoFeedback', '冰-反照率反馈'],
    ],
  },
  {
    title: '地震与地球内部',
    icon: '🪨',
    items: [
      ['magnitude', '震级'],
      ['depth', '震源深度'],
      ['intensity', '烈度'],
      ['plateBoundary', '板块边界'],
    ],
  },
  {
    title: '地表环境',
    icon: '🏙',
    items: [
      ['pm25', 'PM2.5'],
      ['aqi', 'AQI'],
      ['uvIndex', '紫外线指数'],
      ['feelsLike', '体感温度'],
      ['pressure', '地面气压'],
    ],
  },
  {
    title: '海浪',
    icon: '🌊',
    items: [
      ['waveHeight', '有效波高'],
      ['wavePeriod', '波周期'],
      ['swellVsWind', '涌浪 vs 风浪'],
      ['buoy', '海洋浮标观测'],
    ],
  },
  {
    title: '潮汐',
    icon: '🌗',
    items: [
      ['tideLevel', '潮位'],
      ['tideRange', '潮差'],
      ['springNeap', '大潮与小潮'],
    ],
  },
  {
    title: '海温与气候振荡',
    icon: '🌡',
    items: [
      ['sst', '海表温度'],
      ['ssta', '海洋温度距平'],
      ['oni', 'ONI 指数'],
      ['pdo', 'PDO'],
      ['amo', 'AMO'],
      ['thermohaline', '温盐环流'],
    ],
  },
  {
    title: '热带气旋',
    icon: '🌀',
    items: [
      ['cycloneClass', '气旋分类'],
      ['saffir', '萨菲尔–辛普森'],
      ['stormSurge', '风暴增水'],
    ],
  },
  {
    title: '火山与海啸',
    icon: '🌋',
    items: [
      ['volcanoAlert', '火山警报等级'],
      ['aviationColor', '航空色码'],
      ['tsunami', '海啸预警等级'],
      ['tsunamiSpeed', '海啸波速'],
    ],
  },
]
