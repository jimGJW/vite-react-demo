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
 *   4. **文案字段按语种分键**：每条条目的 `zh` / `desc` / `unit` 等是
 *      `{ 'zh-CN': '…', en: '…' }` 两稿。取值函数统一多一个 `lang` 末参数并走
 *      `localize()`，因此调用方拿到的永远是「可直接渲染的字符串」而不是 {lang:text} 对象。
 */

import { pickText, localize } from '../../i18n/translate.mjs'

/** 系外行星发现方法（NASA Exoplanet Archive 的 discoverymethod 字段） */
export const DISCOVERY_METHODS = {
  Transit: {
    zh: { 'zh-CN': '凌日法', en: 'Transit method' },
    desc: {
      'zh-CN': '行星从恒星前方经过，导致亮度周期性下降。最常用，可测行星半径与轨道周期。',
      en: 'The planet passes in front of its host star, causing a periodic dip in brightness. The most widely used technique; it yields the planet radius and the orbital period.',
    },
  },
  'Radial Velocity': {
    zh: { 'zh-CN': '视向速度法', en: 'Radial velocity method' },
    desc: {
      'zh-CN': '恒星受行星引力拉扯产生多普勒位移。只能测质量，不能定半径，但可测到很远的行星。',
      en: 'The star is tugged by the planet’s gravity, producing a Doppler shift. It measures mass only, not radius, but works for planets at great distances.',
    },
  },
  Microlensing: {
    zh: { 'zh-CN': '引力微透镜法', en: 'Gravitational microlensing' },
    desc: {
      'zh-CN': '前景恒星引力放大背景恒星，行星作为微小折痕改变亮度。可探测极冷矮星与自由漂浮行星。',
      en: 'The gravity of a foreground star magnifies a background star, and the planet imprints a small kink on the light curve. Sensitive to very cool dwarfs and to free-floating planets.',
    },
  },
  Imaging: {
    zh: { 'zh-CN': '直接成像法', en: 'Direct imaging' },
    desc: {
      'zh-CN': '用望远镜直接拍到行星本身（通常是遮日冕仪）。样本少，但能测大气成分与轨道运动。',
      en: 'The planet itself is photographed directly with a telescope, usually through a coronagraph. Few targets, but it allows measuring atmospheric composition and orbital motion.',
    },
  },
  'Transit Timing Variations': {
    zh: { 'zh-CN': '凌日时差法', en: 'Transit timing variations' },
    desc: {
      'zh-CN': '凌日时刻出现微小偏移，暗示系统内还有未直接观测到的行星。',
      en: 'Small shifts in the transit times hint at additional planets in the system that have not been observed directly.',
    },
  },
  'Eclipse Timing Variations': {
    zh: { 'zh-CN': '食变时差法', en: 'Eclipse timing variations' },
    desc: {
      'zh-CN': '双星互相遮挡的时刻偏移，暗示存在第三天体牵动轨道。',
      en: 'Shifts in the timing of mutual eclipses in a binary pair suggest a third body perturbing the orbit.',
    },
  },
  'Pulsar Timing': {
    zh: { 'zh-CN': '脉冲星计时法', en: 'Pulsar timing' },
    desc: {
      'zh-CN': '毫秒脉冲星计时精度极高，可探测行星尺度天体对脉冲信号的引力影响。',
      en: 'Millisecond pulsars are timed with extreme precision, revealing the gravitational influence of planet-mass bodies on the pulse signal.',
    },
  },
  'Disk Kinematics': {
    zh: { 'zh-CN': '盘运动学法', en: 'Disk kinematics' },
    desc: {
      'zh-CN': '从恒星/气体运动反推盘内天体质量，已退役的成果较多。',
      en: 'The mass of a body inside a disk is inferred from the motion of stars and gas; many of these results have since been retired.',
    },
  },
  'Astrometry': {
    zh: { 'zh-CN': '天体测量法', en: 'Astrometry' },
    desc: {
      'zh-CN': '测量恒星视位置变化推算伴星质量，Gaia 任务的主要手段。',
      en: 'The companion mass is derived from changes in the apparent position of the star; the main method employed by the Gaia mission.',
    },
  },
  'Gaia Broad-band': {
    zh: { 'zh-CN': '盖亚宽带测光法', en: 'Gaia broad-band photometry' },
    desc: {
      'zh-CN': '依盖亚巡天测光与自行数据识别候选体。',
      en: 'Candidates are identified from Gaia survey photometry and proper-motion data.',
    },
  },
  'Gaia DR2': {
    zh: { 'zh-CN': '盖亚 DR2 候选法', en: 'Gaia DR2 candidate' },
    desc: {
      'zh-CN': '依盖亚 DR2 数据识别的候选行星，待后续确认。',
      en: 'Candidate planets identified from Gaia DR2 data, pending later confirmation.',
    },
  },
  'Radial Velocity Magnitude': {
    zh: { 'zh-CN': '视向速度+光度法', en: 'Radial velocity + magnitude' },
    desc: {
      'zh-CN': '结合视向速度与视亮度信息联合推断。',
      en: 'A joint inference combining radial velocity with apparent-brightness information.',
    },
  },
  'Eclipse': {
    zh: { 'zh-CN': '掩食法', en: 'Eclipse method' },
    desc: {
      'zh-CN': '观测恒星被伴星或行星遮挡导致的亮度变化。',
      en: 'Observes the brightness change as a star is occulted by a companion star or by a planet.',
    },
  },
  'Projected Retrograde': {
    zh: { 'zh-CN': '投影逆行法', en: 'Projected retrograde' },
    desc: {
      'zh-CN': '仅测得存在，轨道参数（质量、距离）尚不确定。',
      en: 'Only the existence is established; the orbital parameters (mass, distance) are still undetermined.',
    },
  },
}

/** 发射任务类型（Launch Library 2 的 mission.type） */
export const MISSION_TYPES = {
  Communications: {
    zh: { 'zh-CN': '通信卫星', en: 'Communications satellite' },
    desc: {
      'zh-CN': '把数据链路搬上天——电视、宽带、卫星电话。',
      en: 'Moves data links into orbit — television, broadband and satellite telephony.',
    },
  },
  Resupply: {
    zh: { 'zh-CN': '货运补给', en: 'Cargo resupply' },
    desc: {
      'zh-CN': '给空间站送物资、燃料，返程带样品下行。',
      en: 'Delivers supplies and propellant to a space station, and can bring samples back down on the return leg.',
    },
  },
  'Human Exploration': {
    zh: { 'zh-CN': '载人探索', en: 'Human exploration' },
    desc: {
      'zh-CN': '运送航天员往返近地轨道或月球，实践中以载人天地往返与深空载人两类为主。',
      en: 'Carries crews to and from low Earth orbit or the Moon; in practice it splits into two kinds of flight: crewed Earth-to-orbit shuttle missions and deep-space crewed missions.',
    },
  },
  'Earth Science': {
    zh: { 'zh-CN': '地球科学', en: 'Earth science' },
    desc: {
      'zh-CN': '观测地球系统：大气、海洋、陆面、磁层。',
      en: 'Observes the Earth system: atmosphere, ocean, land surface and magnetosphere.',
    },
  },
  'Planetary Science': {
    zh: { 'zh-CN': '行星科学', en: 'Planetary science' },
    desc: {
      'zh-CN': '赴其他行星或深空做科学考察。',
      en: 'Scientific investigation of other planets or of deep space.',
    },
  },
  'Space Science': {
    zh: { 'zh-CN': '空间科学', en: 'Space science' },
    desc: {
      'zh-CN': '非地球系天体物理/宇宙学观测。',
      en: 'Astrophysical or cosmological observations that are not aimed at the Earth system.',
    },
  },
  'Earth Resources': {
    zh: { 'zh-CN': '地球资源', en: 'Earth resources' },
    desc: {
      'zh-CN': '遥感勘查矿产、植被、灾害。',
      en: 'Remote sensing for mineral deposits, vegetation and disasters.',
    },
  },
  'Space Development': {
    zh: { 'zh-CN': '空间技术试验', en: 'Space technology development' },
    desc: {
      'zh-CN': '验证在轨新装置或新平台。',
      en: 'Validates new devices or new platforms in orbit.',
    },
  },
  'Technology': {
    zh: { 'zh-CN': '技术试验', en: 'Technology demonstration' },
    desc: {
      'zh-CN': '非科学目的的在轨技术验证。',
      en: 'In-orbit technical validation with no scientific objective.',
    },
  },
  'Test Flight': {
    zh: { 'zh-CN': '试飞', en: 'Test flight' },
    desc: {
      'zh-CN': '首次入轨验证运载与平台能力。',
      en: 'First orbital insertion, validating the launch vehicle and the platform.',
    },
  },
  'Dedicated Rideshare': {
    zh: { 'zh-CN': '拼车专享', en: 'Dedicated rideshare' },
    desc: {
      'zh-CN': '一箭多星，为小卫星客户提供搭车发射。',
      en: 'Many satellites on one rocket, offering small-satellite customers a ride to orbit.',
    },
  },
  'Hosted Payload': {
    zh: { 'zh-CN': '搭载载荷', en: 'Hosted payload' },
    desc: {
      'zh-CN': '随主载荷发射的次要载荷。',
      en: 'A secondary payload launched alongside the primary one.',
    },
  },
  'Government/Top Secret': {
    zh: { 'zh-CN': '政府/涉密任务', en: 'Government / classified' },
    desc: {
      'zh-CN': '发射方未公开任务细节。',
      en: 'The launch provider has not disclosed the mission details.',
    },
  },
  'Unknown': {
    zh: { 'zh-CN': '未公开', en: 'Undisclosed' },
    desc: {
      'zh-CN': '任务类型未披露，通常因商业保密或发射方尚未公布细节。',
      en: 'The mission type is not disclosed, usually for commercial confidentiality or because the provider has not yet published the details.',
    },
  },
  'Crewed': {
    zh: { 'zh-CN': '载人', en: 'Crewed' },
    desc: {
      'zh-CN': '运送航天员的任务。',
      en: 'A mission that carries astronauts.',
    },
  },
  'Uncrewed': {
    zh: { 'zh-CN': '无人', en: 'Uncrewed' },
    desc: {
      'zh-CN': '不运送航天员的任务，多数为卫星部署或技术验证。',
      en: 'A mission with no astronauts aboard, mostly satellite deployment or technology validation.',
    },
  },
  'Space Tourism': {
    zh: { 'zh-CN': '太空旅游', en: 'Space tourism' },
    desc: {
      'zh-CN': '商业载人飞行任务。',
      en: 'Commercial crewed spaceflight missions.',
    },
  },
  'Weather': {
    zh: { 'zh-CN': '气象观测', en: 'Weather' },
    desc: {
      'zh-CN': '气象卫星相关任务。',
      en: 'Missions related to meteorological satellites.',
    },
  },
  'Navigation': {
    zh: { 'zh-CN': '导航定位', en: 'Navigation' },
    desc: {
      'zh-CN': '导航星座组网发射。',
      en: 'Launches that build out navigation constellations.',
    },
  },
  'Earth Observation': {
    zh: { 'zh-CN': '对地观测', en: 'Earth observation' },
    desc: {
      'zh-CN': '以地球为观测目标的卫星。',
      en: 'Satellites whose observation target is the Earth.',
    },
  },
  'Amateur': {
    zh: { 'zh-CN': '业余天文', en: 'Amateur / hobbyist' },
    desc: {
      'zh-CN': '民间主导的小卫星/火箭项目。',
      en: 'Grassroots small-satellite or rocket projects.',
    },
  },
  'Military': {
    zh: { 'zh-CN': '军事用途', en: 'Military' },
    desc: {
      'zh-CN': '军用或军民两用平台。',
      en: 'Military or dual-use platforms.',
    },
  },
}

/** 发射任务状态（Launch Library 2 的 status.name / abbrev） */
export const LAUNCH_STATUS = {
  Go: {
    zh: { 'zh-CN': '允许发射', en: 'Go for launch' },
    desc: {
      'zh-CN': '已完成发射许可，可以按计划执行。',
      en: 'Launch clearance has been granted and the flight may proceed as planned.',
    },
    tone: '#52c41a',
  },
  'Go for Launch': {
    zh: { 'zh-CN': '允许发射', en: 'Go for launch' },
    desc: {
      'zh-CN': '已完成发射许可，可以按计划执行。',
      en: 'Launch clearance has been granted and the flight may proceed as planned.',
    },
    tone: '#52c41a',
  },
  'TBD': {
    zh: { 'zh-CN': '待定', en: 'To be determined' },
    desc: {
      'zh-CN': '发射时间尚未确定，通常在等待发射窗口或评审结果。',
      en: 'The launch time is not yet fixed, usually while waiting for a launch window or a review outcome.',
    },
    tone: '#8c8c8c',
  },
  'To Be Determined': {
    zh: { 'zh-CN': '待定', en: 'To be determined' },
    desc: {
      'zh-CN': '发射时间尚未确定，通常在等待窗口或评审结果。',
      en: 'The launch time is not yet fixed, usually while waiting for a window or a review outcome.',
    },
    tone: '#8c8c8c',
  },
  'In Hold': {
    zh: { 'zh-CN': '暂停', en: 'Hold' },
    desc: {
      'zh-CN': '发射暂缓，等待条件满足。',
      en: 'The launch is on hold, waiting for conditions to be met.',
    },
    tone: '#faad14',
  },
  Hold: {
    zh: { 'zh-CN': '暂停', en: 'Hold' },
    desc: {
      'zh-CN': '发射暂缓，等待条件满足。',
      en: 'The launch is on hold, waiting for conditions to be met.',
    },
    tone: '#faad14',
  },
  'Delayed': {
    zh: { 'zh-CN': '推迟', en: 'Delayed' },
    desc: {
      'zh-CN': '原定日期不可行，另择时间。',
      en: 'The originally scheduled date is no longer feasible; another time will be chosen.',
    },
    tone: '#faad14',
  },
  'Pre-Launch': {
    zh: { 'zh-CN': '发射前', en: 'Pre-launch' },
    desc: {
      'zh-CN': '已就位，正在做发射前检查。',
      en: 'In position and undergoing pre-launch checks.',
    },
    tone: '#4a9eff',
  },
  'Post-Launch': {
    zh: { 'zh-CN': '发射后', en: 'Post-launch' },
    desc: {
      'zh-CN': '已入轨，等后续数据确认。',
      en: 'In orbit, awaiting confirmation from follow-on data.',
    },
    tone: '#4a9eff',
  },
  'Date Pending': {
    zh: { 'zh-CN': '日期待定', en: 'Date pending' },
    desc: {
      'zh-CN': '已排期但未公布确切时间。',
      en: 'Scheduled, but the exact time has not been published.',
    },
    tone: '#8c8c8c',
  },
  'Completed': {
    zh: { 'zh-CN': '已完成', en: 'Completed' },
    desc: {
      'zh-CN': '任务按计划执行完毕并确认达成预定目标。',
      en: 'The mission was executed as planned and the intended objectives are confirmed as achieved.',
    },
    tone: '#52c41a',
  },
  Success: {
    zh: { 'zh-CN': '成功', en: 'Success' },
    desc: {
      'zh-CN': '载荷已确认入轨或任务目标全部达成。',
      en: 'The payload is confirmed in orbit, or all mission objectives were met.',
    },
    tone: '#52c41a',
  },
  Failure: {
    zh: { 'zh-CN': '失败', en: 'Failure' },
    desc: {
      'zh-CN': '任务未能达成目标。',
      en: 'The mission failed to achieve its objectives.',
    },
    tone: '#ff4d4f',
  },
  Partial: {
    zh: { 'zh-CN': '部分成功', en: 'Partial success' },
    desc: {
      'zh-CN': '主要目标达成但有次要目标未及，或部分载荷未能正常工作。',
      en: 'The primary objectives were met but some secondary ones were missed, or part of the payload is not working properly.',
    },
    tone: '#faad14',
  },
  'Launch Failure': {
    zh: { 'zh-CN': '发射失败', en: 'Launch failure' },
    desc: {
      'zh-CN': '运载未能把载荷送入目标轨道，通常伴随载荷损失。',
      en: 'The vehicle failed to deliver the payload to the target orbit, usually with the loss of the payload.',
    },
    tone: '#ff4d4f',
  },
  'Unconfirmed': {
    zh: { 'zh-CN': '未确认', en: 'Unconfirmed' },
    desc: {
      'zh-CN': '发射或入轨结果尚未得到官方确认，需等待后续遥测数据。',
      en: 'The launch or insertion outcome has not yet been officially confirmed; follow-on telemetry data are required.',
    },
    tone: '#8c8c8c',
  },
  'In Flight': {
    zh: { 'zh-CN': '飞行中', en: 'In flight' },
    desc: {
      'zh-CN': '已发射，正在飞行。',
      en: 'Launched and currently in flight.',
    },
    tone: '#4a9eff',
  },
}

/** 银河系类型等描述性枚举 */
export const GALAXY_TYPE = {
  'Barred Spiral': {
    zh: { 'zh-CN': '棒旋星系', en: 'Barred spiral galaxy' },
    desc: {
      'zh-CN': '中心有棒状恒星核，四臂从棒两端伸出。银河系即属此类（SBbc）。',
      en: 'A bar-shaped stellar core at the centre, with arms extending from the two ends of the bar. The Milky Way belongs to this class (SBbc).',
    },
  },
  Spiral: {
    zh: { 'zh-CN': '旋涡星系', en: 'Spiral galaxy' },
    desc: {
      'zh-CN': '中心为球状核，旋臂由内向外缠绕。',
      en: 'A spheroidal core at the centre, with spiral arms winding outward from it.',
    },
  },
  Elliptical: {
    zh: { 'zh-CN': '椭圆星系', en: 'Elliptical galaxy' },
    desc: {
      'zh-CN': '近似椭球，几乎无冷气体与年轻恒星，多为红矮老星。',
      en: 'Roughly ellipsoidal in shape, with almost no cold gas or young stars; dominated by old red stars.',
    },
  },
  Lenticular: {
    zh: { 'zh-CN': '透镜星系', en: 'Lenticular galaxy' },
    desc: {
      'zh-CN': '介于旋涡与椭圆之间，有盘但旋臂已退化。',
      en: 'Intermediate between spiral and elliptical: it has a disk, but the spiral arms have faded.',
    },
  },
  Irregular: {
    zh: { 'zh-CN': '不规则星系', en: 'Irregular galaxy' },
    desc: {
      'zh-CN': '无明显对称结构，多为矮星系。',
      en: 'No clear symmetric structure; mostly dwarf galaxies.',
    },
  },
}

/**
 * GOES 太阳耀斑分级（0.05–0.04nm 长波段 X 射线流量）。
 *
 * 五级强度是**每级差 10 倍**的物理分级，不是主观等级：
 * A 级 1e-8 → B 级 1e-7 → C 级 1e-6 → M 级 1e-5 → X 级 1e-4 W/m²。
 * M 级（Medium）才开始对地球有实际影响，X 级（Extreme）能直接损伤卫星。
 */
export const FLARE_CLASSES = {
  A: {
    zh: { 'zh-CN': 'A 级（微弱）', en: 'Class A (very weak)' },
    desc: {
      'zh-CN': '流量 1e-8 W/m² 级。太阳背面或边缘的微弱活动，对地球无任何影响，地球上连仪器都测不到。',
      en: 'A flux of order 1e-8 W/m². Faint activity on the far side or at the limb of the Sun; no effect on Earth whatsoever — not even detectable by instruments on the ground.',
    },
  },
  B: {
    zh: { 'zh-CN': 'B 级（小）', en: 'Class B (minor)' },
    desc: {
      'zh-CN': '流量 1e-7 W/m² 级。太阳黑子附近的常规活动，日面上几乎每天都有，对地球无影响。',
      en: 'A flux of order 1e-7 W/m². Routine activity near sunspots; it occurs on the solar disk almost every day and has no effect on Earth.',
    },
  },
  C: {
    zh: { 'zh-CN': 'C 级（中）', en: 'Class C (moderate)' },
    desc: {
      'zh-CN': '流量 1e-6 W/m² 级。日面中部出现，X 射线Background 略升，可能引起极光微弱变化。',
      en: 'A flux of order 1e-6 W/m². It appears near the centre of the disk, the X-ray background rises slightly, and it may cause weak changes in the aurora.',
    },
  },
  M: {
    zh: { 'zh-CN': 'M 级（中强）', en: 'Class M (moderate to strong)' },
    desc: {
      'zh-CN': '流量 1e-5 W/m² 级。**开始对地球有实际影响**：高纬电网可能感应电流，极光南扩到中纬度，卫星可能需姿态修正。',
      en: 'A flux of order 1e-5 W/m². **This is where real effects on Earth begin**: high-latitude power grids may see induced currents, the aurora expands equatorward to mid-latitudes, and satellites may need attitude corrections.',
    },
  },
  X: {
    zh: { 'zh-CN': 'X 级（极强）', en: 'Class X (extreme)' },
    desc: {
      'zh-CN': '流量 1e-4 W/m² 级。**会直接损伤卫星**：可能触发卫星表面充电、姿控失效、无线电中断，强烈时伴随质子事件。',
      en: 'A flux of order 1e-4 W/m². **It can directly damage satellites**: it may trigger surface charging, attitude-control failure and radio blackouts, and strong events are accompanied by proton events.',
    },
  },
}

/**
 * 太阳质子事件等级（GOES >10MeV 质子通量，单位 pfu = 10⁻⁶ cm⁻²·s⁻¹）。
 *
 * 质子事件比耀斑更危险的地方在于：高能质子会打到航天器上，
 * 单个高能质子的电离能力远超电子，可导致芯片翻转（单粒子翻转）。
 */
export const PROTON_SCALES = {
  S1: {
    zh: { 'zh-CN': 'S1 级（轻微）', en: 'Class S1 (minor)' },
    desc: {
      'zh-CN': '通量 ≥10 pfu。航天员需进入舱避险，对卫星影响有限。',
      en: 'Flux ≥ 10 pfu. Crew members need to move into the sheltered modules; the impact on satellites is limited.',
    },
    tone: '#a0d911',
  },
  S2: {
    zh: { 'zh-CN': 'S2 级（中度）', en: 'Class S2 (moderate)' },
    desc: {
      'zh-CN': '通量 ≥100 pfu。乘员需全部避险，卫星可能需调整姿态或进入安全模式。',
      en: 'Flux ≥ 100 pfu. All crew members must take shelter; satellites may need to reorient or enter safe mode.',
    },
    tone: '#fa8c16',
  },
  S3: {
    zh: { 'zh-CN': 'S3 级（强）', en: 'Class S3 (strong)' },
    desc: {
      'zh-CN': '通量 ≥1000 pfu。强烈干扰无线电与导航，短波通信可能中断数小时。',
      en: 'Flux ≥ 1000 pfu. Severe disruption to radio and navigation; shortwave communications may be interrupted for several hours.',
    },
    tone: '#ff4d4f',
  },
  S0: {
    zh: { 'zh-CN': 'S0 级（背景）', en: 'Class S0 (background)' },
    desc: {
      'zh-CN': '通量 1–10 pfu，仍在正常背景波动范围，偶发早期预警。',
      en: 'Flux of 1–10 pfu, still within the normal range of background variability; early warnings are issued occasionally.',
    },
    tone: '#52c41a',
  },
  '—': {
    zh: { 'zh-CN': '无事件', en: 'No event' },
    desc: {
      'zh-CN': '通量低于 1 pfu，属正常太阳风本底水平。',
      en: 'Flux below 1 pfu, i.e. the normal background level of the solar wind.',
    },
    tone: '#52c41a',
  },
}

/**
 * NOAA 空间天气警报级别（WATCH / WARNING / ALERT）。
 *
 * 三级是**概率递进**关系，不是强度递进：
 *   WATCH（注意）= 可能性 ≥50%；WARNING（警告）= 已发生；ALERT（警报）= 已严重影响。
 */
export const ALERT_LEVELS = {
  WATCH: {
    zh: { 'zh-CN': '注意', en: 'Watch' },
    desc: {
      'zh-CN': '预计有 50% 以上概率发生该级别事件，进入准备状态。',
      en: 'An event of this level is estimated to have a probability above 50%; move into a state of preparedness.',
    },
    tone: '#faad14',
  },
  WARNING: {
    zh: { 'zh-CN': '警告', en: 'Warning' },
    desc: {
      'zh-CN': '该级别事件已经发生，需要采取防护措施。',
      en: 'An event of this level has already occurred; protective measures are required.',
    },
    tone: '#fa8c16',
  },
  ALERT: {
    zh: { 'zh-CN': '警报', en: 'Alert' },
    desc: {
      'zh-CN': '该级别事件已发生并造成严重影响，正在持续。',
      en: 'An event of this level has occurred, is causing serious effects, and is still ongoing.',
    },
    tone: '#ff4d4f',
  },
  'EXTENDED WATCH': {
    zh: { 'zh-CN': '延长注意', en: 'Extended watch' },
    desc: {
      'zh-CN': '在原注意基础上延长时效，持续关注。',
      en: 'The validity period has been extended beyond the original watch; keep monitoring.',
    },
    tone: '#faad14',
  },
  CANCELLATION: {
    zh: { 'zh-CN': '取消', en: 'Cancellation' },
    desc: {
      'zh-CN': '此前的警报已撤销。',
      en: 'The previous alert has been withdrawn.',
    },
    tone: '#8c8c8c',
  },
  UNKNOWN: {
    zh: { 'zh-CN': '未分类', en: 'Unclassified' },
    desc: {
      'zh-CN': '未能识别警报级别（上游格式可能已变更）。',
      en: 'The alert level could not be recognised (the upstream format may have changed).',
    },
    tone: '#8c8c8c',
  },
}

/** 深空天体类型（梅西耶目录 d3-celestial 的 type 码） */
export const DSO_TYPES = {
  gc: {
    zh: { 'zh-CN': '球状星团', en: 'Globular cluster' },
    desc: {
      'zh-CN': '几十万颗恒星挤在直径约 100 光年的球内，年龄可达百亿年。银河系约 150 个。',
      en: 'Hundreds of thousands of stars packed into a sphere roughly 100 light-years across, with ages up to ten billion years. The Milky Way has about 150 of them.',
    },
  },
  oc: {
    zh: { 'zh-CN': '疏散星团', en: 'Open cluster' },
    desc: {
      'zh-CN': '年轻恒星松散聚居，年龄通常只有几千万年，是恒星育婴室。',
      en: 'A loose gathering of young stars, typically only a few tens of millions of years old — stellar nurseries.',
    },
  },
  s: {
    zh: { 'zh-CN': '恒星', en: 'Star' },
    desc: {
      'zh-CN': '单颗恒星（多见于双星或聚星团中的成员）。',
      en: 'A single star (often a member of a double or multiple system).',
    },
  },
  sfr: {
    zh: { 'zh-CN': '恒星形成区', en: 'Star-forming region' },
    desc: {
      'zh-CN': '分子云中正在孕育新恒星的高密度区，常伴随强烈电离辐射。',
      en: 'A high-density region inside a molecular cloud where new stars are being born, usually accompanied by intense ionizing radiation.',
    },
  },
  pn: {
    zh: { 'zh-CN': '行星状星云', en: 'Planetary nebula' },
    desc: {
      'zh-CN': '垂死恒星抛出的气体外壳，被中心白矮星电离后发出的荧光。已发现约 3000 个。',
      en: 'The gas shell ejected by a dying star, fluorescing after being ionized by the central white dwarf. About 3,000 have been found.',
    },
  },
  snr: {
    zh: { 'zh-CN': '超新星遗迹', en: 'Supernova remnant' },
    desc: {
      'zh-CN': '恒星爆碎后扩散的气体与激波，是高能伽马射线的重要来源。',
      en: 'The expanding gas and shock wave left after a star blew apart; an important source of high-energy gamma rays.',
    },
  },
  rn: {
    zh: { 'zh-CN': '反射星云', en: 'Reflection nebula' },
    desc: {
      'zh-CN': '自身不发光的尘埃云，靠反射附近亮星的光而发亮。',
      en: 'A dust cloud that emits no light of its own and shines only by scattering the light of nearby bright stars.',
    },
  },
  e: {
    zh: { 'zh-CN': '发射星云', en: 'Emission nebula' },
    desc: {
      'zh-CN': '被辐射电离而自发光的星云，常是新恒星的摇篮。猎户座大星云即属此类。',
      en: 'A nebula ionized by radiation and glowing on its own; often the cradle of new stars. The Orion Nebula belongs to this class.',
    },
  },
  dn: {
    zh: { 'zh-CN': '暗星云', en: 'Dark nebula' },
    desc: {
      'zh-CN': '浓密分子云，背景星光被完全吸收，只在红外波段才看得见。',
      en: 'A dense molecular cloud that completely absorbs the background starlight and is visible only at infrared wavelengths.',
    },
  },
  gx: {
    zh: { 'zh-CN': '星系', en: 'Galaxy' },
    desc: {
      'zh-CN': '数十亿至上千亿颗恒星组成的巨大系统，尺度远大于星团。',
      en: 'A vast system of billions to hundreds of billions of stars, far larger in scale than a star cluster.',
    },
  },
  pos: {
    zh: { 'zh-CN': '天区标记', en: 'Position marker' },
    desc: {
      'zh-CN': '用于标记区域的定位点，非真实天体。',
      en: 'A marker point used to flag a region; not a real celestial object.',
    },
  },
  ds: {
    zh: { 'zh-CN': '双星/聚星', en: 'Double / multiple star' },
    desc: {
      'zh-CN': '两颗或多颗恒星靠引力互相绕转，肉眼看似一体的系统。',
      en: 'Two or more stars orbiting each other under gravity, appearing as a single point to the unaided eye.',
    },
  },
  '*': {
    zh: { 'zh-CN': '恒星团', en: 'Star cluster' },
    desc: {
      'zh-CN': '泛指恒星聚集区。',
      en: 'A generic term for a concentration of stars.',
    },
  },
  '?': {
    zh: { 'zh-CN': '未识别天体', en: 'Unidentified object' },
    desc: {
      'zh-CN': '类型尚未确认。',
      en: 'The type has not yet been confirmed.',
    },
  },
}

/**
 * 通用查表：查不到就原样返回英文。
 *
 * 刻意保证返回对象的字段形状与表内条目一致（zh / en / desc 都有值）——
 * 否则每个调用点都要防一手「desc 可能是 undefined」，
 * 渲染出来就是气泡里一行空白。单测里有一条断言专门钉这个不变量。
 *
 * 返回的是**原始条目**：zh / desc 仍是 { 'zh-CN': …, en: … } 对象，
 * 需要可渲染字符串的调用方走下面的 zhXxx(…, lang) 包装（内部 localize）。
 *
 * @param {string} key 原始枚举值
 * @param {object} dict 术语表
 * @returns {{zh:Record<string,string>|string,en:string,desc:Record<string,string>|string,tone?:string}|null}
 */
export function lookup(key, dict) {
  if (key == null) return null
  const raw = String(key).trim()
  if (!raw) return null
  const hit = dict[raw]
  if (hit) return { en: raw, ...hit }
  // 未收录：原样透出（zh / en 保持字符串）。desc 用固定文案而非空串，避免 UI 出现空行。
  return {
    zh: raw,
    en: raw,
    desc: {
      'zh-CN': '上游新增的枚举值，术语表暂未收录。',
      en: 'A newly added upstream enum value; the glossary does not cover it yet.',
    },
  }
}

/** 系外行星发现方法 → 中文 */
export function zhMethod(name, lang = 'zh-CN') {
  return localize(lookup(name, DISCOVERY_METHODS), lang)
}

/** 任务类型 → 中文 */
export function zhMissionType(name, lang = 'zh-CN') {
  return localize(lookup(name, MISSION_TYPES), lang)
}

/** 发射状态 → 中文（优先按缩写查，退化到全名） */
export function zhLaunchStatus(statusName, statusAbbr, lang = 'zh-CN') {
  const hit = lookup(statusAbbr, LAUNCH_STATUS) || lookup(statusName, LAUNCH_STATUS)
  if (hit) return localize(hit, lang)
  // 两个 key 都没命中：给灰色兜底，保证 UI 有可读的色调
  return localize(
    {
      zh: statusName || statusAbbr || { 'zh-CN': '未知', en: 'Unknown' },
      en: statusName || statusAbbr || '',
      desc: {
        'zh-CN': '上游新增的状态值，术语表暂未收录。',
        en: 'A newly added upstream status value; the glossary does not cover it yet.',
      },
      tone: '#8c8c8c',
    },
    lang,
  )
}

/** 银河系类型 → 中文 */
export function zhGalaxyType(type, lang = 'zh-CN') {
  return localize(lookup(type, GALAXY_TYPE), lang)
}

/** 耀斑等级（A/B/C/M/X）→ 中文 */
export function zhFlareClass(cls, lang = 'zh-CN') {
  return localize(lookup(cls, FLARE_CLASSES), lang)
}

/** 太阳质子事件等级（S0–S3）→ 中文 */
export function zhProtonScale(level, lang = 'zh-CN') {
  return localize(lookup(level, PROTON_SCALES), lang)
}

/** NOAA 警报级别（WATCH/WARNING/ALERT）→ 中文 */
export function zhAlertLevel(level, lang = 'zh-CN') {
  return localize(lookup(level, ALERT_LEVELS), lang)
}

/** 深空天体类型码（gc/oc/pn/snr…）→ 中文 */
export function zhDsoType(type, lang = 'zh-CN') {
  return localize(lookup(type, DSO_TYPES), lang)
}

/* ============ KPI 术语解释表 ============ */

/**
 * 空间天气面板里每个 KPI 的含义、量纲、阈值与「所以呢」。
 *
 * 为什么要单独解释：这些指标对非专业读者全是天书——「Bz = -5.3 nT」本身没有信息量，
 * 必须说清「负值意味着什么」「多少算危险」，才知道该不该关心。
 *
 * 量纲字段 unit 只在含说明文字时才是 { 'zh-CN': …, en: … }；
 * 纯符号单位（'km' / 'nT' / 'mag' / 'sfu' / 'pfu' …）保持字符串。
 */
export const KPI_DEFS = {
  kp: {
    zh: { 'zh-CN': '行星际指数 Kp', en: 'Planetary index Kp' },
    unit: { 'zh-CN': '无量纲（0–9，步长 1/3）', en: 'Dimensionless (0–9, in steps of 1/3)' },
    what: {
      'zh-CN': '由中纬度地面磁力计测得的「地磁扰动水平」，每 3 小时一个值。它是全球空间天气的核心指标。',
      en: 'The "level of geomagnetic disturbance" measured by mid-latitude ground magnetometers, giving one value every 3 hours. It is the core indicator of global space weather.',
    },
    scale: {
      'zh-CN': '0–9 等分为 G0–G5 六个等级；5 以下算平静，5 以上算风暴。',
      en: 'The 0–9 range is divided into six levels, G0–G5; below 5 counts as quiet and above 5 counts as a storm.',
    },
    soWhat: {
      'zh-CN': 'Kp 决定卫星是否需要启动抗扰动姿态控制、是否要做机动避轨，也是电网与通信风险的前置指标。',
      en: 'Kp determines whether a satellite must switch on disturbance-tolerant attitude control or perform a collision-avoidance manoeuvre, and it is a leading indicator of power-grid and communications risk.',
    },
  },
  gscale: {
    zh: { 'zh-CN': '空间天气等级 G 级', en: 'Space weather level G' },
    unit: { 'zh-CN': 'G0–G5（由 Kp 换算）', en: 'G0–G5 (derived from Kp)' },
    what: {
      'zh-CN': 'NOAA 把 Kp 映射成面向公众/运营商的六级告警，G 越高影响越严重。',
      en: 'NOAA maps Kp onto a six-level warning scale aimed at the public and at operators: the higher the G level, the more severe the impact.',
    },
    scale: {
      'zh-CN': 'G0 平静 < Kp 4；G1 轻微 < 5；G2 < 6；G3 中等 < 7；G4 强 < 8；G5 极强 < 9；Kp 9 记为 G6+ 极端。',
      en: 'G0 quiet < Kp 4; G1 minor < 5; G2 < 6; G3 moderate < 7; G4 strong < 8; G5 extreme < 9; Kp 9 is recorded as G6+ extreme.',
    },
    soWhat: {
      'zh-CN': '卫星运营方按等级决定是否进入保护模式；宇航员在轨作业在高等级时段会被推迟。',
      en: 'Satellite operators decide whether to enter safe mode based on the level, and crew on-orbit activities are postponed during high-level intervals.',
    },
  },
  wind: {
    zh: { 'zh-CN': '太阳风速度', en: 'Solar wind speed' },
    unit: { 'zh-CN': 'km/s（典型 300–800）', en: 'km/s (typically 300–800)' },
    what: {
      'zh-CN': '太阳外层大气吹出的高速带电粒子流的速度，由等离子体探测器原位测量。',
      en: 'The speed of the fast stream of charged particles blown out from the Sun’s outer atmosphere, measured in situ by plasma instruments.',
    },
    scale: {
      'zh-CN': '< 400 缓慢；400–600 正常；600–800 偏快；> 800 高速。',
      en: '< 400 slow; 400–600 normal; 600–800 fast; > 800 high-speed.',
    },
    soWhat: {
      'zh-CN': '高速太阳风撞上地球磁场会压缩磁层，抬高辐射带内粒子通量——这正是范艾伦辐射带的「补货」机制，宇航员在轨累积剂量会上升。',
      en: 'When fast solar wind strikes Earth’s magnetic field it compresses the magnetosphere and raises the particle flux inside the radiation belts — this is precisely the "restocking" mechanism of the Van Allen belts, and the cumulative radiation dose received by crew on orbit rises with it.',
    },
  },
  bz: {
    zh: { 'zh-CN': '行星际磁场 Bz 分量', en: 'Interplanetary magnetic field, Bz component' },
    unit: { 'zh-CN': 'nT（纳特斯拉，±25 量级）', en: 'nT (nanotesla, of order ±25)' },
    what: {
      'zh-CN': '行星际磁场在日地坐标系「南北」方向的分量。Bz 为负表示磁场方向与地球磁场「同向重合」，太阳风能更有效地把能量灌进磁层。',
      en: 'The north–south component of the interplanetary magnetic field in the Sun–Earth coordinate system. A negative Bz means the field is aligned with Earth’s own field in the reconnecting sense, so the solar wind can pump energy into the magnetosphere far more efficiently.',
    },
    scale: {
      'zh-CN': '0 ~ -5 属强南向；<-10 为强耦合，磁层被明显压缩。',
      en: '0 to −5 counts as strongly southward; below −10 is strong coupling, and the magnetosphere is visibly compressed.',
    },
    soWhat: {
      'zh-CN': '这是地磁暴最主要的触发因子。Bz 持续负值 + 高速太阳风 = 高强度能量注入，GPS、电网、短波通信风险显著上升。',
      en: 'This is the main trigger of geomagnetic storms. A sustained negative Bz plus fast solar wind means a high rate of energy input, and the risk to GPS, power grids and shortwave communications rises markedly.',
    },
  },
  bt: {
    zh: { 'zh-CN': '行星际磁场总强度 Bt', en: 'Total interplanetary magnetic field Bt' },
    unit: 'nT',
    what: {
      'zh-CN': '行星际磁场的合强度，即 Bz 与 By 的矢量和。',
      en: 'The resultant strength of the interplanetary magnetic field, i.e. the vector sum of Bz and By.',
    },
    scale: {
      'zh-CN': '典型 5–15 nT；> 25 nT 属强事件。',
      en: 'Typically 5–15 nT; above 25 nT counts as a strong event.',
    },
    soWhat: {
      'zh-CN': 'Bt 决定进入的磁场「总量」，与 Bz 方向配合才能判断耦合强度。',
      en: 'Bt sets the "total amount" of magnetic field arriving; only together with the Bz direction can the coupling strength be judged.',
    },
  },
  f107: {
    zh: { 'zh-CN': 'F10.7 太阳射电流量', en: 'F10.7 solar radio flux' },
    unit: 'sfu',
    what: {
      'zh-CN': '太阳在 10.7 cm 波长（2.8 GHz）上的射电强度，反映整个太阳活动区的总活动量，是太阳活动水平的标准代理量。1 sfu = 10⁻²² W·m⁻²·Hz⁻¹。',
      en: 'The Sun’s radio intensity at a wavelength of 10.7 cm (2.8 GHz). It reflects the total activity of all solar active regions and is the standard proxy for the level of solar activity. 1 sfu = 10⁻²² W·m⁻²·Hz⁻¹.',
    },
    scale: {
      'zh-CN': '< 70 极低；< 100 低；< 150 活跃；> 150 高。',
      en: '< 70 extremely low; < 100 low; < 150 active; > 150 high.',
    },
    soWhat: {
      'zh-CN': '与 Kp 不同步：F10.7 反映「太阳那边有多活跃」，Kp 反映「地球这边受多大影响」。二者结合才能判断一次太阳事件的能量投放。',
      en: 'It is not synchronous with Kp: F10.7 reflects "how active the Sun is", while Kp reflects "how strongly Earth is affected". Only by combining the two can the energy delivery of a solar event be judged.',
    },
  },
  sunspot: {
    zh: { 'zh-CN': '太阳黑子数', en: 'Sunspot number' },
    unit: { 'zh-CN': '无量纲（月均值，SSN）', en: 'Dimensionless (monthly mean, SSN)' },
    what: {
      'zh-CN': '按太阳上黑子（含umbra + penumbra）的等效面积加权计数，由国际太阳黑子数据中心维护。',
      en: 'A count weighted by the equivalent area of the sunspots on the Sun (umbra + penumbra), maintained by the international sunspot data centre.',
    },
    scale: {
      'zh-CN': '太阳活动周期约 11 年，典型区间 0–300+；当前第 25 周期正在上升段。',
      en: 'The solar activity cycle lasts about 11 years, with a typical range of 0–300+; Cycle 25 is currently in its rising phase.',
    },
    soWhat: {
      'zh-CN': '是太阳活动的「长期背景值」。黑子周期峰值通常对应太阳整体磁活动增强与日冕物质抛射（CME）频发。',
      en: 'It is the "long-term background level" of solar activity. Sunspot cycle maxima usually coincide with enhanced overall solar magnetic activity and frequent coronal mass ejections (CMEs).',
    },
  },
  footprint: {
    zh: { 'zh-CN': '覆盖半径 / 可见范围', en: 'Coverage radius / visibility footprint' },
    unit: { 'zh-CN': 'km（地面站可见的地表半径）', en: 'km (radius of the ground area visible from the station)' },
    what: {
      'zh-CN': '由卫星轨道高度与地球曲率决定的地表可见圆半径，卫星飞过时地面站能直接用肉眼或光学设备看到的最远地面距离。',
      en: 'The radius of the visible circle on the ground, set by the satellite’s orbital altitude and Earth’s curvature: the maximum ground distance at which a station can still see the satellite with the unaided eye or with optical equipment during a pass.',
    },
    scale: {
      'zh-CN': 'ISS（约 420 km）约 2000 km；天宫（约 390 km）约 1900 km。',
      en: 'The ISS (about 420 km) roughly 2000 km; Tiangong (about 390 km) roughly 1900 km.',
    },
    soWhat: {
      'zh-CN': '过境预报的可见性上限。仰角越低，因大气视宁度与地平线遮挡，肉眼可见概率越差。',
      en: 'The upper bound on visibility in pass predictions. The lower the elevation, the poorer the chance of naked-eye visibility, because of atmospheric seeing and horizon obstructions.',
    },
  },
  sunlit: {
    zh: { 'zh-CN': '日照 / 阴影状态', en: 'Sunlit / shadow status' },
    unit: { 'zh-CN': '布尔', en: 'Boolean' },
    what: {
      'zh-CN': '判断卫星当前是否处于地球阴影（或被地球遮挡）内。',
      en: 'Whether the satellite is currently inside Earth’s shadow (or occulted by Earth).',
    },
    scale: {
      'zh-CN': '受照 → 太阳翼发电正常、载荷可直接对地观测；阴影 → 靠蓄电池供电。',
      en: 'Sunlit → the solar arrays generate power normally and the payload can observe Earth directly; in shadow → power comes from the batteries.',
    },
    soWhat: {
      'zh-CN': '阴影段地面无法光学跟踪，需要用红外/雷达跟踪；也是遥感任务最看重的时间窗口。',
      en: 'Ground stations cannot track the satellite optically during the shadow segment and must use infrared or radar tracking; it is also the time window most valued by remote-sensing missions.',
    },
  },
  elevation: {
    zh: { 'zh-CN': '观测仰角', en: 'Observation elevation angle' },
    unit: { 'zh-CN': '度（0 = 地平线，90 = 天顶）', en: 'degrees (0 = horizon, 90 = zenith)' },
    what: {
      'zh-CN': '目标相对观测地平面的仰角，由卫星位置与观测点地心角用平面近似算出。',
      en: 'The elevation of the target above the observer’s horizon, computed from the satellite position and the geocentric angle of the observing site using a planar approximation.',
    },
    scale: {
      'zh-CN': '> 30° 跟踪条件良好；10–30° 受地平线遮挡与大气影响；< 10° 基本无法观测。',
      en: '> 30° good tracking conditions; 10–30° affected by horizon obstructions and the atmosphere; < 10° essentially unobservable.',
    },
    soWhat: {
      'zh-CN': '决定一次过境能不能拍到/听到，是过境预报里最实用的那个数。',
      en: 'It decides whether a pass can be imaged or heard at all — the single most practical number in a pass prediction.',
    },
  },
  kpHistory: {
    zh: { 'zh-CN': 'Kp 24 小时走势', en: 'Kp over the last 24 hours' },
    unit: { 'zh-CN': '同上', en: 'Same as above' },
    what: {
      'zh-CN': '近 24 个 3 小时时段的 Kp 序列（约 8 个点/天）。',
      en: 'The Kp series over the last 24 three-hour intervals (about 8 points per day).',
    },
    scale: {
      'zh-CN': '同一 Kp 量纲。',
      en: 'The same scale as Kp.',
    },
    soWhat: {
      'zh-CN': '看的是「趋势」而非绝对值：持续高位说明扰动未平息；单点尖峰多为一次短时脉冲事件。',
      en: 'What matters is the "trend" rather than the absolute value: a sustained high level means the disturbance has not subsided, while a single spike is usually one short-lived impulsive event.',
    },
  },
  diameter: {
    zh: { 'zh-CN': '小行星直径估计', en: 'Estimated asteroid diameter' },
    unit: { 'zh-CN': 'm（绝对光度 H 与反照率推算）', en: 'm (derived from the absolute magnitude H and the albedo)' },
    what: {
      'zh-CN': '由视星等（H）结合假设反照率区间反推的直径范围，因此给出区间而非定值。',
      en: 'A diameter range back-derived from the absolute magnitude (H) combined with an assumed albedo interval, which is why a range is given rather than a single value.',
    },
    scale: {
      'zh-CN': '< 50 m 多为碎石堆；> 1 km 足以造成全球级长期影响。',
      en: '< 50 m is mostly rubble piles; > 1 km is enough to cause long-term global-scale effects.',
    },
    soWhat: {
      'zh-CN': '直径直接决定撞击能量与「撞击频率」——小行星撞地球的频率随直径下降极快，所以大直径目标的数量才值得持续监视。',
      en: 'Diameter directly determines the impact energy and the "impact frequency" — the frequency of asteroid impacts falls off extremely fast as the diameter grows, which is why the population of large-diameter objects is what warrants continuous monitoring.',
    },
  },
  distLunar: {
    zh: { 'zh-CN': '距地月距离倍数', en: 'Distance in lunar-distance units' },
    unit: { 'zh-CN': '倍（月地平均距离 ≈ 384,400 km）', en: 'multiples (mean Earth–Moon distance ≈ 384,400 km)' },
    what: {
      'zh-CN': '目标当前地心距除以地月平均距离。',
      en: 'The target’s current geocentric distance divided by the mean Earth–Moon distance.',
    },
    scale: {
      'zh-CN': '< 1 倍已进入月球轨道内；> 2 倍远离地球。',
      en: '< 1 means it has come inside the Moon’s orbit; > 2 means it is far from Earth.',
    },
    soWhat: {
      'zh-CN': '比「多少 km」更直观——「还不到一个月亮那么远」比「38 万公里」容易判断威胁与否。',
      en: 'More intuitive than "how many km": "not even as far away as the Moon" is far easier to judge as a threat than "380,000 km".',
    },
  },
  hz: {
    zh: { 'zh-CN': '潜在危险（PHA）', en: 'Potentially hazardous asteroid (PHA)' },
    unit: { 'zh-CN': '布尔', en: 'Boolean' },
    what: {
      'zh-CN': '小行星地球威胁协调机构（CNEOS）的判定：撞击地球的动能超过「摧毁建筑物」阈值，且撞击概率在 50 年尺度上不低于 1%。',
      en: 'The criterion used by the Center for Near Earth Object Studies (CNEOS): the kinetic energy of an Earth impact exceeds the "building-destroying" threshold, and the impact probability over a 50-year horizon is no less than 1%.',
    },
    scale: {
      'zh-CN': '布尔判定，无分级。',
      en: 'A Boolean determination, with no gradations.',
    },
    soWhat: {
      'zh-CN': '被标为 PHA 不代表一定会撞，而是「必须持续监测」——概率极低但后果无法接受。',
      en: 'Being flagged as a PHA does not mean an impact is certain; it means "must be monitored continuously" — the probability is extremely low but the consequences are unacceptable.',
    },
  },
  gyro: {
    zh: { 'zh-CN': '轨道速度 / 周期', en: 'Orbital speed / period' },
    unit: 'km/s、min',
    what: {
      'zh-CN': '由 TLE 轨道根数经 SGP4 传播得到的瞬时速度与轨道周期。',
      en: 'The instantaneous velocity and orbital period obtained by propagating the TLE orbital elements with SGP4.',
    },
    scale: {
      'zh-CN': 'LEO 典型 7.7 km/s、90–93 min。',
      en: 'Typical LEO values: 7.7 km/s and 90–93 min.',
    },
    soWhat: {
      'zh-CN': '周期决定「多久转一圈」，也就是同一地点每隔多久能再过一次——决定过境预报的疏密。',
      en: 'The period determines "how long one revolution takes", that is, how often the same site is passed again — it sets the spacing of pass predictions.',
    },
  },
  inclination: {
    zh: { 'zh-CN': '轨道倾角', en: 'Orbital inclination' },
    unit: { 'zh-CN': '度（0 = 赤道面，90 = 过极点）', en: 'degrees (0 = equatorial plane, 90 = over the poles)' },
    what: {
      'zh-CN': '轨道面与赤道面的夹角，等于卫星能达到的最高地理纬度。',
      en: 'The angle between the orbital plane and the equatorial plane, which equals the highest geographic latitude the satellite can reach.',
    },
    scale: {
      'zh-CN': 'ISS 51.6°（覆盖 ±52°）；天宫 41.5°。',
      en: 'The ISS 51.6° (covering ±52°); Tiangong 41.5°.',
    },
    soWhat: {
      'zh-CN': '倾角决定地面覆盖范围。倾角 51.6° 意味着 ISS 永远飞不到俄罗斯北部、也不覆盖南北极。',
      en: 'Inclination determines the ground coverage. An inclination of 51.6° means the ISS never flies over northern Russia and does not cover the north or south pole.',
    },
  },
  au: {
    zh: { 'zh-CN': '天文单位 AU', en: 'Astronomical unit (AU)' },
    unit: { 'zh-CN': '1 AU ≈ 1.496 亿 km', en: '1 AU ≈ 149.6 million km' },
    what: {
      'zh-CN': '日地平均距离，作为「太阳系里的米」使用。',
      en: 'The mean Sun–Earth distance, used as "the metre of the Solar System".',
    },
    scale: {
      'zh-CN': '1 AU ≈ 63241 光年 ≈ 8.317 光分。',
      en: '1 AU ≈ 63,241 light-years ≈ 8.317 light-minutes.',
    },
    soWhat: {
      'zh-CN': '跨量级对比用；1 AU 也正是日地光照时间（8 分 19 秒）的定义基准。',
      en: 'Used for comparisons across orders of magnitude; 1 AU is also the defining basis of the Sun–Earth light-travel time (8 min 19 s).',
    },
  },
  moonPhase: {
    zh: { 'zh-CN': '月相与月龄', en: 'Moon phase and age' },
    unit: { 'zh-CN': '天 / 角分', en: 'days / arcminutes' },
    what: {
      'zh-CN': '月相由地-月-日夹角决定，月龄为自新月起算的天数（约 29.53 天一个朔望月）。',
      en: 'The phase is set by the Earth–Moon–Sun angle, and the age of the Moon is the number of days counted from new moon (one synodic month is about 29.53 days).',
    },
    scale: {
      'zh-CN': '朔望月 29.53 天；照亮率 0%–100%。',
      en: 'The synodic month is 29.53 days; the illuminated fraction runs from 0% to 100%.',
    },
    soWhat: {
      'zh-CN': '满月时月光最强，暗弱目标最易观测；但月面高反照率会让低轨目标更难分辨。',
      en: 'Moonlight is strongest at full moon, when faint targets are easiest to observe; but the high albedo of the lunar surface makes low-orbit targets harder to resolve.',
    },
  },
  period: {
    zh: { 'zh-CN': '轨道周期', en: 'Orbital period' },
    unit: { 'zh-CN': '分钟', en: 'minutes' },
    what: {
      'zh-CN': '绕地球一周所需时间，由平均运动（圈/天）反算。',
      en: 'The time needed for one revolution around Earth, back-computed from the mean motion (revolutions per day).',
    },
    scale: {
      'zh-CN': 'ISS 约 93 min；天宫约 92.6 min。',
      en: 'The ISS about 93 min; Tiangong about 92.6 min.',
    },
    soWhat: {
      'zh-CN': '决定同一观测点的过境间隔与连续可见时长上限。',
      en: 'It determines the interval between passes over the same observing site and the maximum duration of continuous visibility.',
    },
  },
  flare: {
    zh: { 'zh-CN': '太阳耀斑等级', en: 'Solar flare class' },
    unit: { 'zh-CN': 'X 射线流量 W/m²（0.05–0.4nm）', en: 'X-ray flux, W/m² (0.05–0.4 nm)' },
    what: {
      'zh-CN': 'GOES 卫星测量的太阳 X 射线爆发强度，按 A/B/C/M/X 五级划分，**每级差 10 倍**（A 级 1e-8 → X 级 1e-4）。级内再分 1–9。',
      en: 'The intensity of solar X-ray bursts measured by the GOES satellites, graded into five classes A/B/C/M/X, **each class ten times the previous one** (class A 1e-8 → class X 1e-4). Within a class it is further subdivided from 1 to 9.',
    },
    scale: {
      'zh-CN': 'A 微弱（日背活动）；B 小（日面黑子）；C 中；M 中强（开始影响地球）；X 极强（可损伤卫星）。',
      en: 'A very weak (activity on the far side of the Sun); B minor (sunspots on the disk); C moderate; M moderate to strong (begins to affect Earth); X extreme (can damage satellites).',
    },
    soWhat: {
      'zh-CN': '分级阈值是物理量纲而非主观评价。M 级起高纬电网可能出现感应电流、卫星姿态扰动；X 级可直接触发卫星表面充电与芯片单粒子翻转。',
      en: 'The class thresholds are physical magnitudes, not subjective ratings. From class M upward, induced currents may appear in high-latitude power grids and satellite attitude may be disturbed; class X can directly trigger satellite surface charging and single-event upsets in chips.',
    },
  },
  flareCount: {
    zh: { 'zh-CN': '24 小时耀斑次数', en: 'Number of flares in 24 hours' },
    unit: { 'zh-CN': '次（B 级及以上）', en: 'events (class B and above)' },
    what: {
      'zh-CN': '在 GOES 1 分钟 X 射线序列上做事件识别：流量越过 B 级阈值即开始，持续到回落为止（允许 3 分钟采样间断，避免一次耀斑被切碎），每段取峰值定级。',
      en: 'Events are identified on the GOES 1-minute X-ray series: an event begins when the flux crosses the class B threshold and lasts until it falls back (a 3-minute sampling gap is tolerated so that a single flare is not chopped into pieces), and each segment is graded by its peak.',
    },
    scale: {
      'zh-CN': '太阳活动低年常见 0–3 次 B 级；活动高年可达数十次，含 M/X 级。',
      en: 'At solar minimum, 0–3 class B flares are common; at solar maximum the count can reach several dozen, including M and X classes.',
    },
    soWhat: {
      'zh-CN': '频率比单次强度更能反映太阳整体活跃程度。频繁的 B 级说明太阳处于「热闹」状态，但只要没有 M/X 级，对地球影响仍有限。',
      en: 'Frequency reflects the overall activity level of the Sun better than the strength of any single event. Frequent class B flares mean the Sun is in a "busy" state, but as long as no M or X flares occur, the impact on Earth remains limited.',
    },
  },
  proton: {
    zh: { 'zh-CN': '太阳质子事件（>10 MeV 通量）', en: 'Solar proton event (>10 MeV flux)' },
    unit: 'pfu（10⁻⁶ cm⁻²·s⁻¹）',
    what: {
      'zh-CN': '太阳耀斑或日冕物质抛射（CME）加速出的高能质子，到达地球轨道附近。NOAA 按 S1（10 pfu）/ S2（100）/ S3（1000）分级。',
      en: 'High-energy protons accelerated by solar flares or coronal mass ejections (CMEs), arriving near Earth’s orbit. NOAA grades them as S1 (10 pfu) / S2 (100) / S3 (1000).',
    },
    scale: {
      'zh-CN': '< 1 pfu 本底；S1 需航天员进舱避险；S3 短波通信可中断数小时。',
      en: '< 1 pfu is background; at S1 crew members must move into the sheltered modules; at S3 shortwave communications can be interrupted for several hours.',
    },
    soWhat: {
      'zh-CN': '质子比 X 射线更难躲：高能质子电离能力强，可使航天器芯片发生单粒子翻转（SEU）。所以载人航天即使在轨道安全期也要盯着这个值。',
      en: 'Protons are harder to shield against than X-rays: high-energy protons are strongly ionizing and can cause single-event upsets (SEUs) in spacecraft chips. That is why human spaceflight has to keep watching this value even during quiet orbital periods.',
    },
  },
  aurora: {
    zh: { 'zh-CN': '极光带纬度', en: 'Auroral oval latitude' },
    unit: { 'zh-CN': '度（地理纬度）', en: 'degrees (geographic latitude)' },
    what: {
      'zh-CN': '由 OVATION 模型反演得到的极光卵形带所处纬度。极光沿磁力线沉降发光，随磁暴强度南北扩张——平静期在 65°–70°，强磁暴时可南扩到 50° 甚至更低。',
      en: 'The latitude at which the auroral oval sits, as retrieved from the OVATION model. Auroral emission is produced by particles precipitating along magnetic field lines, and the oval expands equatorward with storm strength: 65°–70° in quiet times, reaching down to 50° or even lower during strong geomagnetic storms.',
    },
    scale: {
      'zh-CN': '≥ 60° 高纬；50°–60° 中纬（罕见但可见）；< 45° 极罕见，需强 G 级地磁暴。',
      en: '≥ 60° high latitude; 50°–60° mid-latitude (rare but visible); < 45° extremely rare, requiring a strong G-level geomagnetic storm.',
    },
    soWhat: {
      'zh-CN': '判断「今晚能不能看到极光」的唯一实用判据。中国境内漠河（约 53°N）、黑河（约 50°N）在活跃期有机会，北京（40°N）基本无望。',
      en: 'The only practical criterion for judging "can I see the aurora tonight". Within China, Mohe (about 53°N) and Heihe (about 50°N) have a chance during active periods, while Beijing (40°N) has essentially none.',
    },
  },
  solarCycle: {
    zh: { 'zh-CN': '太阳活动周期位置', en: 'Position within the solar cycle' },
    unit: { 'zh-CN': '平滑黑子数（SSN，13 个月滑动平均）', en: 'Smoothed sunspot number (SSN, 13-month moving average)' },
    what: {
      'zh-CN': '太阳活动有约 11 年周期，黑子数从低到高再回落。NOAA 同步发布观测值与官方预测区间（置信上下界）。',
      en: 'Solar activity follows a cycle of about 11 years, with the sunspot number climbing from low to high and then falling back. NOAA publishes the observed values together with the official prediction interval (upper and lower confidence bounds).',
    },
    scale: {
      'zh-CN': '第 25 周期于 2019 年末开始，2024 年前后达峰值；SSN 从个位数到 200+。',
      en: 'Cycle 25 began in late 2019 and peaked around 2024; the SSN runs from single digits up to 200+.',
    },
    soWhat: {
      'zh-CN': '周期位置是「长期背景值」：处于上升/峰值段意味着 CME 与耀斑整体更频繁，地磁暴概率上升——但不保证某一天一定剧烈。',
      en: 'Cycle position is the "long-term background": being in the rising or peak phase means CMEs and flares are more frequent overall and the probability of geomagnetic storms is higher — but it does not guarantee that any given day will be violent.',
    },
  },
  magnitude: {
    zh: { 'zh-CN': '视星等', en: 'Apparent magnitude' },
    unit: { 'zh-CN': 'mag（无量纲）', en: 'mag (dimensionless)' },
    what: {
      'zh-CN': '古希腊按亮度分级，等级每差 1 级亮度差约 2.512 倍。数值越小越亮：太阳 −26.7，满月 −12.7，天狼 −1.46，肉眼极限约 +6。',
      en: 'A brightness scale inherited from the ancient Greeks, in which a difference of 1 magnitude corresponds to a brightness ratio of about 2.512. The smaller the value, the brighter the object: the Sun −26.7, the full Moon −12.7, Sirius −1.46, and the naked-eye limit about +6.',
    },
    scale: {
      'zh-CN': '< 0 一等星以上；0–1 亮星；1–3 中等；3–6 暗星（暗夜可见）；> 6 需望远镜。',
      en: '< 0 first magnitude and brighter; 0–1 bright stars; 1–3 moderate; 3–6 faint (visible on a dark night); > 6 requires a telescope.',
    },
    soWhat: {
      'zh-CN': '星图里的「大小」直接来自星等。亮星看起来大不是画错，而是它真的把周围暗星的光「压」下去了——这是感知对比度而非恒星物理大小。',
      en: 'The "size" of a star in a star chart comes directly from its magnitude. Drawing bright stars larger is not an error: their glare really does "overwhelm" the light of the surrounding faint stars — this is perceptual contrast, not the physical size of the star.',
    },
  },
  altitude: {
    zh: { 'zh-CN': '高度角（地平高度）', en: 'Altitude (height above the horizon)' },
    unit: { 'zh-CN': '度（0 = 地平线，90 = 天顶）', en: 'degrees (0 = horizon, 90 = zenith)' },
    what: {
      'zh-CN': '天体相对观测地平面的仰角，由时角与赤纬按球面三角公式算出。',
      en: 'The elevation of a celestial object above the observer’s horizon, computed from the hour angle and the declination using spherical trigonometry.',
    },
    scale: {
      'zh-CN': '> 45° 最佳（大气路径短、视宁度好）；20°–45° 可观测；5°–20° 低空（受楼房树木遮挡、光害渐强）；< 5° 几乎必被遮挡。',
      en: '> 45° best (short atmospheric path, good seeing); 20°–45° observable; 5°–20° low in the sky (obstructed by buildings and trees, with increasing light pollution); < 5° almost certainly blocked.',
    },
    soWhat: {
      'zh-CN': '判断「现在能不能看到」的核心指标。同一颗星，高度角 60° 时看得清，10° 时往往只见光害雾。注意真实高度还要加大气折射修正（地平线上约 +0.5°）。',
      en: 'The core indicator for judging "can I see it right now". The same star is clear at an altitude of 60°, but at 10° you often see nothing but the haze of light pollution. Note that the true altitude still needs an atmospheric refraction correction (about +0.5° at the horizon).',
    },
  },
  colorIndex: {
    zh: { 'zh-CN': '色指数 B−V', en: 'Colour index B−V' },
    unit: { 'zh-CN': 'mag（无量纲）', en: 'mag (dimensionless)' },
    what: {
      'zh-CN': '恒星蓝色波段与可见光波段亮度之差，反映表面温度。负值偏蓝白（B 型，如参宿四 −0.03），正值偏橙红（M 型，如心宿二 +1.8）。',
      en: 'The difference between a star’s brightness in the blue band and in the visual band, which reflects its surface temperature. Negative values are blue-white (B-type, e.g. Betelgeuse −0.03) and positive values orange-red (M-type, e.g. Antares +1.8).',
    },
    scale: {
      'zh-CN': '< 0.0 O/B 型 高温蓝星；0–0.5 A 型 白星（织女星）；0.5–0.8 F/G 型 黄白（太阳 0.65）；> 1.5 K/M 型 橙红矮星。',
      en: '< 0.0 O/B-type hot blue stars; 0–0.5 A-type white stars (Vega); 0.5–0.8 F/G-type yellow-white (the Sun 0.65); > 1.5 K/M-type orange-red dwarfs.',
    },
    soWhat: {
      'zh-CN': '目视夜空其实分辨不出颜色（暗适应下视网膜只对亮度敏感），色指数是**恒星温度的代理量**——用它能反推恒星演化阶段与质量。',
      en: 'The unaided eye cannot really distinguish colours in the night sky (under dark adaptation the retina is sensitive only to brightness), so the colour index is **a proxy for stellar temperature** — it lets us infer a star’s evolutionary stage and mass.',
    },
  },
  dsoMag: {
    zh: { 'zh-CN': '深空天体星等', en: 'Deep-sky object magnitude' },
    unit: 'mag',
    what: {
      'zh-CN': '星云、星团、星系的整体亮度，按其总发光量折算成「如果是一个点源有多亮」。因此深空天体常「比看上去更亮」——猎户座大星云肉眼只见暗淡一角，实际可达到 4 等。',
      en: 'The integrated brightness of a nebula, star cluster or galaxy, expressed as "how bright it would be if it were a point source". For this reason deep-sky objects are often "brighter than they look" — the Orion Nebula appears to the unaided eye as only a faint patch, yet actually reaches magnitude 4.',
    },
    scale: {
      'zh-CN': 'M31 约 3.4 等（肉眼极限）；M42 约 4.0；多数梅西耶天体在 6–11 等。',
      en: 'M31 about magnitude 3.4 (at the naked-eye limit); M42 about 4.0; most Messier objects lie between magnitude 6 and 11.',
    },
    soWhat: {
      'zh-CN': '星等 vs 视直径共同决定「需要什么设备」：小而亮的用望远镜，大而暗的必须用大口径或长曝光。',
      en: 'Magnitude together with apparent size determines "what equipment you need": small and bright objects work with a telescope, while large and faint ones require a large aperture or long exposures.',
    },
  },
}

/**
 * KPI 解释卡片组件的分组顺序。
 * key 与 KPI_DEFS 对应，title / alias 是 { 'zh-CN': …, en: … }，取值走 getAstroKpiGroups(lang)。
 */
export const KPI_GROUPS = [
  {
    title: {
      'zh-CN': '空间天气（太阳活动如何影响地球）',
      en: 'Space weather (how solar activity affects Earth)',
    },
    icon: '⚡',
    items: [
      ['kp', { 'zh-CN': 'Kp 指数', en: 'Kp index' }],
      ['gscale', { 'zh-CN': 'G 等级', en: 'G level' }],
      ['wind', { 'zh-CN': '太阳风速度', en: 'Solar wind speed' }],
      ['bz', { 'zh-CN': 'Bz 分量', en: 'Bz component' }],
      ['bt', { 'zh-CN': 'Bt 总强度', en: 'Total Bt' }],
      ['f107', { 'zh-CN': 'F10.7 流量', en: 'F10.7 flux' }],
      ['sunspot', { 'zh-CN': '太阳黑子数', en: 'Sunspot number' }],
    ],
  },
  {
    title: {
      'zh-CN': '轨道与可见性（目标此刻的状态）',
      en: 'Orbit and visibility (the state of the target right now)',
    },
    icon: '🛰',
    items: [
      ['inclination', { 'zh-CN': '轨道倾角', en: 'Orbital inclination' }],
      ['period', { 'zh-CN': '轨道周期', en: 'Orbital period' }],
      ['gyro', { 'zh-CN': '轨道速度', en: 'Orbital speed' }],
      ['footprint', { 'zh-CN': '覆盖半径', en: 'Coverage radius' }],
      ['sunlit', { 'zh-CN': '日照 / 阴影', en: 'Sunlit / shadow' }],
      ['elevation', { 'zh-CN': '观测仰角', en: 'Elevation angle' }],
      ['kpHistory', { 'zh-CN': 'Kp 走势', en: 'Kp trend' }],
    ],
  },
  {
    title: {
      'zh-CN': '天体尺度与距离',
      en: 'Object size and distance',
    },
    icon: '📏',
    items: [
      ['diameter', { 'zh-CN': '小行星直径', en: 'Asteroid diameter' }],
      ['distLunar', { 'zh-CN': '地月距离倍数', en: 'Lunar-distance multiples' }],
      ['hz', { 'zh-CN': '潜在危险 PHA', en: 'Potentially hazardous (PHA)' }],
      ['au', { 'zh-CN': '天文单位 AU', en: 'Astronomical unit (AU)' }],
    ],
  },
  {
    title: {
      'zh-CN': '太阳活动（太阳此刻在做什么）',
      en: 'Solar activity (what the Sun is doing right now)',
    },
    icon: '☀️',
    items: [
      ['flare', { 'zh-CN': '耀斑等级', en: 'Flare class' }],
      ['flareCount', { 'zh-CN': '24h 耀斑次数', en: 'Flares in 24 h' }],
      ['proton', { 'zh-CN': '质子事件', en: 'Proton events' }],
      ['aurora', { 'zh-CN': '极光带纬度', en: 'Auroral oval latitude' }],
      ['solarCycle', { 'zh-CN': '太阳周期位置', en: 'Solar cycle position' }],
    ],
  },
  {
    title: {
      'zh-CN': '观测条件（能不能看到、看到什么）',
      en: 'Observing conditions (whether you can see it, and what you will see)',
    },
    icon: '🔭',
    items: [
      ['magnitude', { 'zh-CN': '视星等', en: 'Apparent magnitude' }],
      ['altitude', { 'zh-CN': '高度角', en: 'Altitude' }],
      ['colorIndex', { 'zh-CN': '色指数 B−V', en: 'Colour index B−V' }],
      ['dsoMag', { 'zh-CN': '深空天体星等', en: 'Deep-sky object magnitude' }],
      ['moonPhase', { 'zh-CN': '月相与月龄', en: 'Moon phase and age' }],
    ],
  },
]

/**
 * 单条 KPI 释义（已解析成当前语种的字符串）。
 *
 * @param {string} key KPI_DEFS 的键
 * @param {string} [lang] 目标语种，缺省 zh-CN
 * @returns {object|null}
 */
export function getAstroKpi(key, lang = 'zh-CN') {
  const d = KPI_DEFS[key]
  return d ? localize(d, lang) : null
}

/**
 * KPI 分组（title / alias 已解析成当前语种的字符串，item 仍是 [key, alias] 二元组）。
 *
 * @param {string} [lang] 目标语种，缺省 zh-CN
 * @returns {Array<{title:string,icon:string,items:Array<[string,string]>}>}
 */
export function getAstroKpiGroups(lang = 'zh-CN') {
  return KPI_GROUPS.map((g) => ({
    ...g,
    title: pickText(g.title, lang),
    items: g.items.map(([k, alias]) => [k, pickText(alias, lang)]),
  }))
}
