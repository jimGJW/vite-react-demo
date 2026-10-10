/**
 * 天文术语中英对照表 —— 把各数据源返回的英文枚举/缩写翻成中文。
 *
 * 为什么单独抽一个模块：
 *   这些字符串全都来自外部 API（NASA / NOAA / Launch Library），我们无法控制上游措辞，
 *   只能在前端做一层映射。放在组件里会让 JSX 塞满三元表达式，且没法单测。
 *
 * 设计原则：
 *   1. **不丢失原文**。译名后仍可展示英文（Tooltip 里给），专业场景下用户可能要检索原文。
 *   2. **未收录的枚举原样透出**，绝不吞掉——上游随时可能加新值，静默显示空白比显示英文更糟。
 *   3. **纯函数、无副作用**，可直接 node 跑断言。
 */

/** 系外行星发现方法（NASA Exoplanet Archive 的 discoverymethod 字段） */
export const DISCOVERY_METHODS = {
  Transit: { zh: '凌日法', desc: '行星从恒星前方经过，导致亮度周期性下降。最常用，可测行星半径与轨道周期。' },
  'Radial Velocity': { zh: '视向速度法', desc: '恒星受行星引力拉扯产生多普勒位移。只能测质量，不能定半径，但可测到很远的行星。' },
  Microlensing: { zh: '引力微透镜法', desc: '前景恒星引力放大背景恒星，行星作为微小折痕改变亮度。可探测极冷矮星与自由漂浮行星。' },
  Imaging: { zh: '直接成像法', desc: '用望远镜直接拍到行星本身（通常是遮日冕仪）。样本少，但能测大气成分与轨道运动。' },
  'Transit Timing Variations': { zh: '凌日时差法', desc: '凌日时刻出现微小偏移，暗示系统内还有未直接观测到的行星。' },
  'Eclipse Timing Variations': { zh: '食变时差法', desc: '双星互相遮挡的时刻偏移，暗示存在第三天体牵动轨道。' },
  'Pulsar Timing': { zh: '脉冲星计时法', desc: '毫秒脉冲星计时精度极高，可探测行星尺度天体对脉冲信号的引力影响。' },
  'Disk Kinematics': { zh: '盘运动学法', desc: '从恒星/气体运动反推盘内天体质量，已退役的成果较多。' },
  'Astrometry': { zh: '天体测量法', desc: '测量恒星视位置变化推算伴星质量，Gaia 任务的主要手段。' },
  'Gaia Broad-band': { zh: '盖亚宽带测光法', desc: '依盖亚巡天测光与自行数据识别候选体。' },
  'Gaia DR2': { zh: '盖亚 DR2 候选法', desc: '依盖亚 DR2 数据识别的候选行星，待后续确认。' },
  'Radial Velocity Magnitude': { zh: '视向速度+光度法', desc: '结合视向速度与视亮度信息联合推断。' },
  'Eclipse': { zh: '掩食法', desc: '观测恒星被伴星或行星遮挡导致的亮度变化。' },
  'Projected Retrograde': { zh: '投影逆行法', desc: '仅测得存在，轨道参数（质量、距离）尚不确定。' },
}

/** 发射任务类型（Launch Library 2 的 mission.type） */
export const MISSION_TYPES = {
  Communications: { zh: '通信卫星', desc: '把数据链路搬上天——电视、宽带、卫星电话。' },
  Resupply: { zh: '货运补给', desc: '给空间站送物资、燃料，返程带样品下行。' },
  'Human Exploration': { zh: '载人探索', desc: '运送航天员往返近地轨道或月球，实践中以载人天地往返与深空载人两类为主。' },
  'Earth Science': { zh: '地球科学', desc: '观测地球系统：大气、海洋、陆面、磁层。' },
  'Planetary Science': { zh: '行星科学', desc: '赴其他行星或深空做科学考察。' },
  'Space Science': { zh: '空间科学', desc: '非地球系天体物理/宇宙学观测。' },
  'Earth Resources': { zh: '地球资源', desc: '遥感勘查矿产、植被、灾害。' },
  'Space Development': { zh: '空间技术试验', desc: '验证在轨新装置或新平台。' },
  'Technology': { zh: '技术试验', desc: '非科学目的的在轨技术验证。' },
  'Test Flight': { zh: '试飞', desc: '首次入轨验证运载与平台能力。' },
  'Dedicated Rideshare': { zh: '拼车专享', desc: '一箭多星，为小卫星客户提供搭车发射。' },
  'Hosted Payload': { zh: '搭载载荷', desc: '随主载荷发射的次要载荷。' },
  'Government/Top Secret': { zh: '政府/涉密任务', desc: '发射方未公开任务细节。' },
  'Unknown': { zh: '未公开', desc: '任务类型未披露，通常因商业保密或发射方尚未公布细节。' },
  'Crewed': { zh: '载人', desc: '运送航天员的任务。' },
  'Uncrewed': { zh: '无人', desc: '不运送航天员的任务，多数为卫星部署或技术验证。' },
  'Space Tourism': { zh: '太空旅游', desc: '商业载人飞行任务。' },
  'Weather': { zh: '气象观测', desc: '气象卫星相关任务。' },
  'Navigation': { zh: '导航定位', desc: '导航星座组网发射。' },
  'Earth Observation': { zh: '对地观测', desc: '以地球为观测目标的卫星。' },
  'Amateur': { zh: '业余天文', desc: '民间主导的小卫星/火箭项目。' },
  'Military': { zh: '军事用途', desc: '军用或军民两用平台。' },
}

/** 发射任务状态（Launch Library 2 的 status.name / abbrev） */
export const LAUNCH_STATUS = {
  Go: { zh: '允许发射', desc: '已完成发射许可，可以按计划执行。', tone: '#52c41a' },
  'Go for Launch': { zh: '允许发射', desc: '已完成发射许可，可以按计划执行。', tone: '#52c41a' },
  'TBD': { zh: '待定', desc: '发射时间尚未确定，通常在等待发射窗口或评审结果。', tone: '#8c8c8c' },
  'To Be Determined': { zh: '待定', desc: '发射时间尚未确定，通常在等待窗口或评审结果。', tone: '#8c8c8c' },
  'In Hold': { zh: '暂停', desc: '发射暂缓，等待条件满足。', tone: '#faad14' },
  Hold: { zh: '暂停', desc: '发射暂缓，等待条件满足。', tone: '#faad14' },
  'Delayed': { zh: '推迟', desc: '原定日期不可行，另择时间。', tone: '#faad14' },
  'Pre-Launch': { zh: '发射前', desc: '已就位，正在做发射前检查。', tone: '#4a9eff' },
  'Post-Launch': { zh: '发射后', desc: '已入轨，等后续数据确认。', tone: '#4a9eff' },
  'Date Pending': { zh: '日期待定', desc: '已排期但未公布确切时间。', tone: '#8c8c8c' },
  'Completed': { zh: '已完成', desc: '任务按计划执行完毕并确认达成预定目标。', tone: '#52c41a' },
  Success: { zh: '成功', desc: '载荷已确认入轨或任务目标全部达成。', tone: '#52c41a' },
  Failure: { zh: '失败', desc: '任务未能达成目标。', tone: '#ff4d4f' },
  Partial: { zh: '部分成功', desc: '主要目标达成但有次要目标未及，或部分载荷未能正常工作。', tone: '#faad14' },
  'Launch Failure': { zh: '发射失败', desc: '运载未能把载荷送入目标轨道，通常伴随载荷损失。', tone: '#ff4d4f' },
  'Unconfirmed': { zh: '未确认', desc: '发射或入轨结果尚未得到官方确认，需等待后续遥测数据。', tone: '#8c8c8c' },
  'In Flight': { zh: '飞行中', desc: '已发射，正在飞行。', tone: '#4a9eff' },
}

/** 银河系类型等描述性枚举 */
export const GALAXY_TYPE = {
  'Barred Spiral': { zh: '棒旋星系', desc: '中心有棒状恒星核，四臂从棒两端伸出。银河系即属此类（SBbc）。' },
  Spiral: { zh: '旋涡星系', desc: '中心为球状核，旋臂由内向外缠绕。' },
  Elliptical: { zh: '椭圆星系', desc: '近似椭球，几乎无冷气体与年轻恒星，多为红矮老星。' },
  Lenticular: { zh: '透镜星系', desc: '介于旋涡与椭圆之间，有盘但旋臂已退化。' },
  Irregular: { zh: '不规则星系', desc: '无明显对称结构，多为矮星系。' },
}

/**
 * GOES 太阳耀斑分级（0.05–0.04nm 长波段 X 射线流量）。
 *
 * 五级强度是**每级差 10 倍**的物理分级，不是主观等级：
 * A 级 1e-8 → B 级 1e-7 → C 级 1e-6 → M 级 1e-5 → X 级 1e-4 W/m²。
 * M 级（Medium）才开始对地球有实际影响，X 级（Extreme）能直接损伤卫星。
 */
export const FLARE_CLASSES = {
  A: { zh: 'A 级（微弱）', desc: '流量 1e-8 W/m² 级。太阳背面或边缘的微弱活动，对地球无任何影响，地球上连仪器都测不到。' },
  B: { zh: 'B 级（小）', desc: '流量 1e-7 W/m² 级。太阳黑子附近的常规活动，日面上几乎每天都有，对地球无影响。' },
  C: { zh: 'C 级（中）', desc: '流量 1e-6 W/m² 级。日面中部出现，X 射线Background 略升，可能引起极光微弱变化。' },
  M: { zh: 'M 级（中强）', desc: '流量 1e-5 W/m² 级。**开始对地球有实际影响**：高纬电网可能感应电流，极光南扩到中纬度，卫星可能需姿态修正。' },
  X: { zh: 'X 级（极强）', desc: '流量 1e-4 W/m² 级。**会直接损伤卫星**：可能触发卫星表面充电、姿控失效、无线电中断，强烈时伴随质子事件。' },
}

/**
 * 太阳质子事件等级（GOES >10MeV 质子通量，单位 pfu = 10⁻⁶ cm⁻²·s⁻¹）。
 *
 * 质子事件比耀斑更危险的地方在于：高能质子会打到航天器上，
 * 单个高能质子的电离能力远超电子，可导致芯片翻转（单粒子翻转）。
 */
export const PROTON_SCALES = {
  S1: { zh: 'S1 级（轻微）', desc: '通量 ≥10 pfu。航天员需进入舱避险，对卫星影响有限。', tone: '#a0d911' },
  S2: { zh: 'S2 级（中度）', desc: '通量 ≥100 pfu。乘员需全部避险，卫星可能需调整姿态或进入安全模式。', tone: '#fa8c16' },
  S3: { zh: 'S3 级（强）', desc: '通量 ≥1000 pfu。强烈干扰无线电与导航，短波通信可能中断数小时。', tone: '#ff4d4f' },
  S0: { zh: 'S0 级（背景）', desc: '通量 1–10 pfu，仍在正常背景波动范围，偶发早期预警。', tone: '#52c41a' },
  '—': { zh: '无事件', desc: '通量低于 1 pfu，属正常太阳风本底水平。', tone: '#52c41a' },
}

/**
 * NOAA 空间天气警报级别（WATCH / WARNING / ALERT）。
 *
 * 三级是**概率递进**关系，不是强度递进：
 *   WATCH（注意）= 可能性 ≥50%；WARNING（警告）= 已发生；ALERT（警报）= 已严重影响。
 */
export const ALERT_LEVELS = {
  WATCH: { zh: '注意', desc: '预计有 50% 以上概率发生该级别事件，进入准备状态。', tone: '#faad14' },
  WARNING: { zh: '警告', desc: '该级别事件已经发生，需要采取防护措施。', tone: '#fa8c16' },
  ALERT: { zh: '警报', desc: '该级别事件已发生并造成严重影响，正在持续。', tone: '#ff4d4f' },
  'EXTENDED WATCH': { zh: '延长注意', desc: '在原注意基础上延长时效，持续关注。', tone: '#faad14' },
  CANCELLATION: { zh: '取消', desc: '此前的警报已撤销。', tone: '#8c8c8c' },
  UNKNOWN: { zh: '未分类', desc: '未能识别警报级别（上游格式可能已变更）。', tone: '#8c8c8c' },
}

/** 深空天体类型（梅西耶目录 d3-celestial 的 type 码） */
export const DSO_TYPES = {
  gc: { zh: '球状星团', desc: '几十万颗恒星挤在直径约 100 光年的球内，年龄可达百亿年。银河系约 150 个。' },
  oc: { zh: '疏散星团', desc: '年轻恒星松散聚居，年龄通常只有几千万年，是恒星育婴室。' },
  s: { zh: '恒星', desc: '单颗恒星（多见于双星或聚星团中的成员）。' },
  sfr: { zh: '恒星形成区', desc: '分子云中正在孕育新恒星的高密度区，常伴随强烈电离辐射。' },
  pn: { zh: '行星状星云', desc: '垂死恒星抛出的气体外壳，被中心白矮星电离后发出的荧光。已发现约 3000 个。' },
  snr: { zh: '超新星遗迹', desc: '恒星爆碎后扩散的气体与激波，是高能伽马射线的重要来源。' },
  rn: { zh: '反射星云', desc: '自身不发光的尘埃云，靠反射附近亮星的光而发亮。' },
  e: { zh: '发射星云', desc: '被辐射电离而自发光的星云，常是新恒星的摇篮。猎户座大星云即属此类。' },
  dn: { zh: '暗星云', desc: '浓密分子云，背景星光被完全吸收，只在红外波段才看得见。' },
  gx: { zh: '星系', desc: '数十亿至上千亿颗恒星组成的巨大系统，尺度远大于星团。' },
  pos: { zh: '天区标记', desc: '用于标记区域的定位点，非真实天体。' },
  ds: { zh: '双星/聚星', desc: '两颗或多颗恒星靠引力互相绕转，肉眼看似一体的系统。' },
  '*': { zh: '恒星团', desc: '泛指恒星聚集区。' },
  '?': { zh: '未识别天体', desc: '类型尚未确认。' },
}

/**
 * 通用查表：查不到就原样返回英文。
 *
 * 刻意保证返回对象的字段形状与表内条目一致（zh / en / desc 都有值）——
 * 否则每个调用点都要防一手「desc 可能是 undefined」，
 * 渲染出来就是气泡里一行空白。单测里有一条断言专门钉这个不变量。
 *
 * @param {string} key 原始枚举值
 * @param {object} dict 术语表
 * @returns {{zh:string,en:string,desc:string,tone?:string}|null}
 */
export function lookup(key, dict) {
  if (key == null) return null
  const raw = String(key).trim()
  if (!raw) return null
  const hit = dict[raw]
  if (hit) return { en: raw, ...hit }
  // 未收录：原样透出。desc 用固定文案而非空串，避免 UI 出现空行。
  return {
    zh: raw,
    en: raw,
    desc: '上游新增的枚举值，术语表暂未收录。',
  }
}

/** 系外行星发现方法 → 中文 */
export function zhMethod(name) {
  return lookup(name, DISCOVERY_METHODS)
}

/** 任务类型 → 中文 */
export function zhMissionType(name) {
  return lookup(name, MISSION_TYPES)
}

/** 发射状态 → 中文（优先按缩写查，退化到全名） */
export function zhLaunchStatus(statusName, statusAbbr) {
  const hit = lookup(statusAbbr, LAUNCH_STATUS) || lookup(statusName, LAUNCH_STATUS)
  if (hit) return hit
  // 两个 key 都没命中：给灰色兜底，保证 UI 有可读的色调
  return {
    zh: statusName || statusAbbr || '未知',
    en: statusName || statusAbbr || '',
    desc: '上游新增的状态值，术语表暂未收录。',
    tone: '#8c8c8c',
  }
}

/** 银河系类型 → 中文 */
export function zhGalaxyType(type) {
  return lookup(type, GALAXY_TYPE)
}

/** 耀斑等级（A/B/C/M/X）→ 中文 */
export function zhFlareClass(cls) {
  return lookup(cls, FLARE_CLASSES)
}

/** 太阳质子事件等级（S0–S3）→ 中文 */
export function zhProtonScale(level) {
  return lookup(level, PROTON_SCALES)
}

/** NOAA 警报级别（WATCH/WARNING/ALERT）→ 中文 */
export function zhAlertLevel(level) {
  return lookup(level, ALERT_LEVELS)
}

/** 深空天体类型码（gc/oc/pn/snr…）→ 中文 */
export function zhDsoType(type) {
  return lookup(type, DSO_TYPES)
}

/* ============ KPI 术语解释表 ============ */

/**
 * 空间天气面板里每个 KPI 的含义、量纲、阈值与「所以呢」。
 *
 * 为什么要单独解释：这些指标对非专业读者全是天书——「Bz = -5.3 nT」本身没有信息量，
 * 必须说清「负值意味着什么」「多少算危险」，才知道该不该关心。
 */
export const KPI_DEFS = {
  kp: {
    zh: '行星际指数 Kp',
    unit: '无量纲（0–9，步长 1/3）',
    what: '由中纬度地面磁力计测得的「地磁扰动水平」，每 3 小时一个值。它是全球空间天气的核心指标。',
    scale: '0–9 等分为 G0–G5 六个等级；5 以下算平静，5 以上算风暴。',
    soWhat: 'Kp 决定卫星是否需要启动抗扰动姿态控制、是否要做机动避轨，也是电网与通信风险的前置指标。',
  },
  gscale: {
    zh: '空间天气等级 G 级',
    unit: 'G0–G5（由 Kp 换算）',
    what: 'NOAA 把 Kp 映射成面向公众/运营商的六级告警，G 越高影响越严重。',
    scale: 'G0 平静 < Kp 4；G1 轻微 < 5；G2 < 6；G3 中等 < 7；G4 强 < 8；G5 极强 < 9；Kp 9 记为 G6+ 极端。',
    soWhat: '卫星运营方按等级决定是否进入保护模式；宇航员在轨作业在高等级时段会被推迟。',
  },
  wind: {
    zh: '太阳风速度',
    unit: 'km/s（典型 300–800）',
    what: '太阳外层大气吹出的高速带电粒子流的速度，由等离子体探测器原位测量。',
    scale: '< 400 缓慢；400–600 正常；600–800 偏快；> 800 高速。',
    soWhat: '高速太阳风撞上地球磁场会压缩磁层，抬高辐射带内粒子通量——这正是范艾伦辐射带的「补货」机制，宇航员在轨累积剂量会上升。',
  },
  bz: {
    zh: '行星际磁场 Bz 分量',
    unit: 'nT（纳特斯拉，±25 量级）',
    what: '行星际磁场在日地坐标系「南北」方向的分量。Bz 为负表示磁场方向与地球磁场「同向重合」，太阳风能更有效地把能量灌进磁层。',
    scale: '0 ~ -5 属强南向；<-10 为强耦合，磁层被明显压缩。',
    soWhat: '这是地磁暴最主要的触发因子。Bz 持续负值 + 高速太阳风 = 高强度能量注入，GPS、电网、短波通信风险显著上升。',
  },
  bt: {
    zh: '行星际磁场总强度 Bt',
    unit: 'nT',
    what: '行星际磁场的合强度，即 Bz 与 By 的矢量和。',
    scale: '典型 5–15 nT；> 25 nT 属强事件。',
    soWhat: 'Bt 决定进入的磁场「总量」，与 Bz 方向配合才能判断耦合强度。',
  },
  f107: {
    zh: 'F10.7 太阳射电流量',
    unit: 'sfu',
    what: '太阳在 10.7 cm 波长（2.8 GHz）上的射电强度，反映整个太阳活动区的总活动量，是太阳活动水平的标准代理量。1 sfu = 10⁻²² W·m⁻²·Hz⁻¹。',
    scale: '< 70 极低；< 100 低；< 150 活跃；> 150 高。',
    soWhat: '与 Kp 不同步：F10.7 反映「太阳那边有多活跃」，Kp 反映「地球这边受多大影响」。二者结合才能判断一次太阳事件的能量投放。',
  },
  sunspot: {
    zh: '太阳黑子数',
    unit: '无量纲（月均值，SSN）',
    what: '按太阳上黑子（含umbra + penumbra）的等效面积加权计数，由国际太阳黑子数据中心维护。',
    scale: '太阳活动周期约 11 年，典型区间 0–300+；当前第 25 周期正在上升段。',
    soWhat: '是太阳活动的「长期背景值」。黑子周期峰值通常对应太阳整体磁活动增强与日冕物质抛射（CME）频发。',
  },
  footprint: {
    zh: '覆盖半径 / 可见范围',
    unit: 'km（地面站可见的地表半径）',
    what: '由卫星轨道高度与地球曲率决定的地表可见圆半径，卫星飞过时地面站能直接用肉眼或光学设备看到的最远地面距离。',
    scale: 'ISS（约 420 km）约 2000 km；天宫（约 390 km）约 1900 km。',
    soWhat: '过境预报的可见性上限。仰角越低，因大气视宁度与地平线遮挡，肉眼可见概率越差。',
  },
  sunlit: {
    zh: '日照 / 阴影状态',
    unit: '布尔',
    what: '判断卫星当前是否处于地球阴影（或被地球遮挡）内。',
    scale: '受照 → 太阳翼发电正常、载荷可直接对地观测；阴影 → 靠蓄电池供电。',
    soWhat: '阴影段地面无法光学跟踪，需要用红外/雷达跟踪；也是遥感任务最看重的时间窗口。',
  },
  elevation: {
    zh: '观测仰角',
    unit: '度（0 = 地平线，90 = 天顶）',
    what: '目标相对观测地平面的仰角，由卫星位置与观测点地心角用平面近似算出。',
    scale: '> 30° 跟踪条件良好；10–30° 受地平线遮挡与大气影响；< 10° 基本无法观测。',
    soWhat: '决定一次过境能不能拍到/听到，是过境预报里最实用的那个数。',
  },
  kpHistory: {
    zh: 'Kp 24 小时走势',
    unit: '同上',
    what: '近 24 个 3 小时时段的 Kp 序列（约 8 个点/天）。',
    scale: '同一 Kp 量纲。',
    soWhat: '看的是「趋势」而非绝对值：持续高位说明扰动未平息；单点尖峰多为一次短时脉冲事件。',
  },
  diameter: {
    zh: '小行星直径估计',
    unit: 'm（绝对光度 H 与反照率推算）',
    what: '由视星等（H）结合假设反照率区间反推的直径范围，因此给出区间而非定值。',
    scale: '< 50 m 多为碎石堆；> 1 km 足以造成全球级长期影响。',
    soWhat: '直径直接决定撞击能量与「撞击频率」——小行星撞地球的频率随直径下降极快，所以大直径目标的数量才值得持续监视。',
  },
  distLunar: {
    zh: '距地月距离倍数',
    unit: '倍（月地平均距离 ≈ 384,400 km）',
    what: '目标当前地心距除以地月平均距离。',
    scale: '< 1 倍已进入月球轨道内；> 2 倍远离地球。',
    soWhat: '比「多少 km」更直观——「还不到一个月亮那么远」比「38 万公里」容易判断威胁与否。',
  },
  hz: {
    zh: '潜在危险（PHA）',
    unit: '布尔',
    what: '小行星地球威胁协调机构（CNEOS）的判定：撞击地球的动能超过「摧毁建筑物」阈值，且撞击概率在 50 年尺度上不低于 1%。',
    scale: '布尔判定，无分级。',
    soWhat: '被标为 PHA 不代表一定会撞，而是「必须持续监测」——概率极低但后果无法接受。',
  },
  gyro: {
    zh: '轨道速度 / 周期',
    unit: 'km/s、min',
    what: '由 TLE 轨道根数经 SGP4 传播得到的瞬时速度与轨道周期。',
    scale: 'LEO 典型 7.7 km/s、90–93 min。',
    soWhat: '周期决定「多久转一圈」，也就是同一地点每隔多久能再过一次——决定过境预报的疏密。',
  },
  inclination: {
    zh: '轨道倾角',
    unit: '度（0 = 赤道面，90 = 过极点）',
    what: '轨道面与赤道面的夹角，等于卫星能达到的最高地理纬度。',
    scale: 'ISS 51.6°（覆盖 ±52°）；天宫 41.5°。',
    soWhat: '倾角决定地面覆盖范围。倾角 51.6° 意味着 ISS 永远飞不到俄罗斯北部、也不覆盖南北极。',
  },
  au: {
    zh: '天文单位 AU',
    unit: '1 AU ≈ 1.496 亿 km',
    what: '日地平均距离，作为「太阳系里的米」使用。',
    scale: '1 AU ≈ 63241 光年 ≈ 8.317 光分。',
    soWhat: '跨量级对比用；1 AU 也正是日地光照时间（8 分 19 秒）的定义基准。',
  },
  moonPhase: {
    zh: '月相与月龄',
    unit: '天 / 角分',
    what: '月相由地-月-日夹角决定，月龄为自新月起算的天数（约 29.53 天一个朔望月）。',
    scale: '朔望月 29.53 天；照亮率 0%–100%。',
    soWhat: '满月时月光最强，暗弱目标最易观测；但月面高反照率会让低轨目标更难分辨。',
  },
  period: {
    zh: '轨道周期',
    unit: '分钟',
    what: '绕地球一周所需时间，由平均运动（圈/天）反算。',
    scale: 'ISS 约 93 min；天宫约 92.6 min。',
    soWhat: '决定同一观测点的过境间隔与连续可见时长上限。',
  },
  flare: {
    zh: '太阳耀斑等级',
    unit: 'X 射线流量 W/m²（0.05–0.4nm）',
    what: 'GOES 卫星测量的太阳 X 射线爆发强度，按 A/B/C/M/X 五级划分，**每级差 10 倍**（A 级 1e-8 → X 级 1e-4）。级内再分 1–9。',
    scale: 'A 微弱（日背活动）；B 小（日面黑子）；C 中；M 中强（开始影响地球）；X 极强（可损伤卫星）。',
    soWhat: '分级阈值是物理量纲而非主观评价。M 级起高纬电网可能出现感应电流、卫星姿态扰动；X 级可直接触发卫星表面充电与芯片单粒子翻转。',
  },
  flareCount: {
    zh: '24 小时耀斑次数',
    unit: '次（B 级及以上）',
    what: '在 GOES 1 分钟 X 射线序列上做事件识别：流量越过 B 级阈值即开始，持续到回落为止（允许 3 分钟采样间断，避免一次耀斑被切碎），每段取峰值定级。',
    scale: '太阳活动低年常见 0–3 次 B 级；活动高年可达数十次，含 M/X 级。',
    soWhat: '频率比单次强度更能反映太阳整体活跃程度。频繁的 B 级说明太阳处于「热闹」状态，但只要没有 M/X 级，对地球影响仍有限。',
  },
  proton: {
    zh: '太阳质子事件（>10 MeV 通量）',
    unit: 'pfu（10⁻⁶ cm⁻²·s⁻¹）',
    what: '太阳耀斑或日冕物质抛射（CME）加速出的高能质子，到达地球轨道附近。NOAA 按 S1（10 pfu）/ S2（100）/ S3（1000）分级。',
    scale: '< 1 pfu 本底；S1 需航天员进舱避险；S3 短波通信可中断数小时。',
    soWhat: '质子比 X 射线更难躲：高能质子电离能力强，可使航天器芯片发生单粒子翻转（SEU）。所以载人航天即使在轨道安全期也要盯着这个值。',
  },
  aurora: {
    zh: '极光带纬度',
    unit: '度（地理纬度）',
    what: '由 OVATION 模型反演得到的极光卵形带所处纬度。极光沿磁力线沉降发光，随磁暴强度南北扩张——平静期在 65°–70°，强磁暴时可南扩到 50° 甚至更低。',
    scale: '≥ 60° 高纬；50°–60° 中纬（罕见但可见）；< 45° 极罕见，需强 G 级地磁暴。',
    soWhat: '判断「今晚能不能看到极光」的唯一实用判据。中国境内漠河（约 53°N）、黑河（约 50°N）在活跃期有机会，北京（40°N）基本无望。',
  },
  solarCycle: {
    zh: '太阳活动周期位置',
    unit: '平滑黑子数（SSN，13 个月滑动平均）',
    what: '太阳活动有约 11 年周期，黑子数从低到高再回落。NOAA 同步发布观测值与官方预测区间（置信上下界）。',
    scale: '第 25 周期于 2019 年末开始，2024 年前后达峰值；SSN 从个位数到 200+。',
    soWhat: '周期位置是「长期背景值」：处于上升/峰值段意味着 CME 与耀斑整体更频繁，地磁暴概率上升——但不保证某一天一定剧烈。',
  },
  magnitude: {
    zh: '视星等',
    unit: 'mag（无量纲）',
    what: '古希腊按亮度分级，等级每差 1 级亮度差约 2.512 倍。数值越小越亮：太阳 −26.7，满月 −12.7，天狼 −1.46，肉眼极限约 +6。',
    scale: '< 0 一等星以上；0–1 亮星；1–3 中等；3–6 暗星（暗夜可见）；> 6 需望远镜。',
    soWhat: '星图里的「大小」直接来自星等。亮星看起来大不是画错，而是它真的把周围暗星的光「压」下去了——这是感知对比度而非恒星物理大小。',
  },
  altitude: {
    zh: '高度角（地平高度）',
    unit: '度（0 = 地平线，90 = 天顶）',
    what: '天体相对观测地平面的仰角，由时角与赤纬按球面三角公式算出。',
    scale: '> 45° 最佳（大气路径短、视宁度好）；20°–45° 可观测；5°–20° 低空（受楼房树木遮挡、光害渐强）；< 5° 几乎必被遮挡。',
    soWhat: '判断「现在能不能看到」的核心指标。同一颗星，高度角 60° 时看得清，10° 时往往只见光害雾。注意真实高度还要加大气折射修正（地平线上约 +0.5°）。',
  },
  colorIndex: {
    zh: '色指数 B−V',
    unit: 'mag（无量纲）',
    what: '恒星蓝色波段与可见光波段亮度之差，反映表面温度。负值偏蓝白（B 型，如参宿四 −0.03），正值偏橙红（M 型，如心宿二 +1.8）。',
    scale: '< 0.0 O/B 型 高温蓝星；0–0.5 A 型 白星（织女星）；0.5–0.8 F/G 型 黄白（太阳 0.65）；> 1.5 K/M 型 橙红矮星。',
    soWhat: '目视夜空其实分辨不出颜色（暗适应下视网膜只对亮度敏感），色指数是**恒星温度的代理量**——用它能反推恒星演化阶段与质量。',
  },
  dsoMag: {
    zh: '深空天体星等',
    unit: 'mag',
    what: '星云、星团、星系的整体亮度，按其总发光量折算成「如果是一个点源有多亮」。因此深空天体常「比看上去更亮」——猎户座大星云肉眼只见暗淡一角，实际可达到 4 等。',
    scale: 'M31 约 3.4 等（肉眼极限）；M42 约 4.0；多数梅西耶天体在 6–11 等。',
    soWhat: '星等 vs 视直径共同决定「需要什么设备」：小而亮的用望远镜，大而暗的必须用大口径或长曝光。',
  },
}

/**
 * KPI 解释卡片组件的分组顺序。
 * key 与 KPI_DEFS 对应，zh 字段可覆盖（部分场景下叫法略有差异）。
 */
export const KPI_GROUPS = [
  {
    title: '空间天气（太阳活动如何影响地球）',
    icon: '⚡',
    items: [
      ['kp', 'Kp 指数'],
      ['gscale', 'G 等级'],
      ['wind', '太阳风速度'],
      ['bz', 'Bz 分量'],
      ['bt', 'Bt 总强度'],
      ['f107', 'F10.7 流量'],
      ['sunspot', '太阳黑子数'],
    ],
  },
  {
    title: '轨道与可见性（目标此刻的状态）',
    icon: '🛰',
    items: [
      ['inclination', '轨道倾角'],
      ['period', '轨道周期'],
      ['gyro', '轨道速度'],
      ['footprint', '覆盖半径'],
      ['sunlit', '日照 / 阴影'],
      ['elevation', '观测仰角'],
      ['kpHistory', 'Kp 走势'],
    ],
  },
  {
    title: '天体尺度与距离',
    icon: '📏',
    items: [
      ['diameter', '小行星直径'],
      ['distLunar', '地月距离倍数'],
      ['hz', '潜在危险 PHA'],
      ['au', '天文单位 AU'],
    ],
  },
  {
    title: '太阳活动（太阳此刻在做什么）',
    icon: '☀️',
    items: [
      ['flare', '耀斑等级'],
      ['flareCount', '24h 耀斑次数'],
      ['proton', '质子事件'],
      ['aurora', '极光带纬度'],
      ['solarCycle', '太阳周期位置'],
    ],
  },
  {
    title: '观测条件（能不能看到、看到什么）',
    icon: '🔭',
    items: [
      ['magnitude', '视星等'],
      ['altitude', '高度角'],
      ['colorIndex', '色指数 B−V'],
      ['dsoMag', '深空天体星等'],
      ['moonPhase', '月相与月龄'],
    ],
  },
]