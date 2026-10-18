/**
 * 三块数据看板（深空 / 地球 / 海洋）的「关联数据」关系表。
 *
 * 为什么单独一个文件：关联是**跨看板**的（太阳活动 → 海温距平、地震 → 海啸 → DART 浮标），
 * 放在任一单看板里都会变成别的看板反向依赖它。这里做唯一真源，组件只负责渲染。
 *
 * 关联必须是**真实的物理或业务逻辑**，不是"看起来都跟海有关"就算：
 *   - 太阳风/耀斑 → 大气加热 → 近地轨道衰减（真因果，不是巧合）
 *   - 强震 → 海啸 → DART 浮标（同一条链上的三个观测手段）
 *   - ENSO → 气旋生成频数（气候学里公认的调制关系）
 *
 * 每条关联两层信息：
 *   - why    一句话因果（列表里直接显示，回答「为什么要一起看」）
 *   - detail 展开后的资料解释（讲清机制、量级、怎么读，回答「看到了该怎么理解」）
 *   - terms  相关名词，指向各看板词典（astro → KPI_DEFS，geo/ocean → EARTH_KPI_DEFS），
 *            由组件取出 zh/what/scale/soWhat 完整释义，不用在这里复制一份文字。
 *
 * 多语：所有展示类文案字段写成 { 'zh-CN': …, en: … }，取值函数按 lang 解析成字符串后
 * 再交给组件，组件永远拿到可直接渲染的字符串。
 */

import { KPI_DEFS } from '@lib/astro/glossary.js'
import { EARTH_KPI_DEFS } from '@lib/earth/glossary.js'
import { pickText, localize } from '@i18n/translate.mjs'

/** 三块看板的元信息：主色与 TimelineBoard/三位一体动画共用同一套 */
export const BOARD_META = {
  astro: { key: 'astro', title: { 'zh-CN': '深空', en: 'Deep Space' }, icon: '🛰️', color: '#722ed1', defaultTab: 'earth', path: '/astro' },
  geo: { key: 'geo', title: { 'zh-CN': '地球', en: 'Earth' }, icon: '🌍', color: '#13c2c2', defaultTab: 'quake', path: '/geo' },
  ocean: { key: 'ocean', title: { 'zh-CN': '海洋', en: 'Ocean' }, icon: '🌊', color: '#1677ff', defaultTab: 'waves', path: '/ocean' },
}

/**
 * 三方监控范围 —— 每块看板到底在「监控」什么。
 * 用于关联模块顶部的三方态势条：没去过某块看板的人也能一眼知道它管哪一段。
 */
export const BOARD_SCOPE = {
  astro: {
    scope: {
      'zh-CN': '日地空间 · 行星与卫星 · 深空天体 · 发射任务',
      en: 'Sun–Earth space · Planets and satellites · Deep-sky objects · Launch missions',
    },
    watch: [
      { 'zh-CN': '太阳风暴与地磁', en: 'Solar storms and geomagnetic activity' },
      { 'zh-CN': '在轨卫星与空间站过境', en: 'Satellites in orbit and station passes' },
      { 'zh-CN': '行星位置与月相', en: 'Planetary positions and lunar phases' },
      { 'zh-CN': '流星雨与观星条件', en: 'Meteor showers and observing conditions' },
    ],
  },
  geo: {
    scope: {
      'zh-CN': '岩石圈 · 大气与气候 · 地表环境',
      en: 'Lithosphere · Atmosphere and climate · Surface environment',
    },
    watch: [
      { 'zh-CN': '地震与板块运动', en: 'Earthquakes and plate motion' },
      { 'zh-CN': '火山与海啸预警', en: 'Volcanoes and tsunami warnings' },
      { 'zh-CN': '温室气体与温度距平', en: 'Greenhouse gases and temperature anomalies' },
      { 'zh-CN': '极地海冰与自然事件', en: 'Polar sea ice and natural events' },
    ],
  },
  ocean: {
    scope: {
      'zh-CN': '海浪 · 潮汐 · 海温与气候振荡 · 热带气旋',
      en: 'Waves · Tides · Sea temperature and climate oscillations · Tropical cyclones',
    },
    watch: [
      { 'zh-CN': '近岸与全球浪况', en: 'Coastal and global wave conditions' },
      { 'zh-CN': '实测潮位与预报', en: 'Observed tide levels and forecasts' },
      { 'zh-CN': 'ENSO / PDO / AMO 相位', en: 'ENSO / PDO / AMO phases' },
      { 'zh-CN': '气旋路径与浮标实测', en: 'Cyclone tracks and buoy observations' },
    ],
  },
}

/** 页签 key → 展示名（去掉 emoji，组件里单独配图标，避免重复） */
export const TAB_LABELS = {
  astro: {
    earth: { 'zh-CN': '地球附近', en: 'Near Earth' },
    solar: { 'zh-CN': '太阳系', en: 'Solar System' },
    sun: { 'zh-CN': '太阳活动', en: 'Solar Activity' },
    sky: { 'zh-CN': '今晚星空', en: "Tonight's Sky" },
    apod: { 'zh-CN': '天文一图', en: 'Astronomy Picture' },
    deep: { 'zh-CN': '深空', en: 'Deep Sky' },
    launch: { 'zh-CN': '航天发射', en: 'Space Launches' },
    comet: { 'zh-CN': '小天体档案', en: 'Small-Body Archive' },
    approach: { 'zh-CN': '近地交会', en: 'Close Approaches' },
    observe: { 'zh-CN': '观测条件', en: 'Observing Conditions' },
    cases: { 'zh-CN': '真实案例', en: 'Real Cases' },
  },
  geo: {
    quake: { 'zh-CN': '大地脉动', en: "Earth's Pulse" },
    epic: { 'zh-CN': '地球影像', en: 'Earth Imagery' },
    eonet: { 'zh-CN': '自然事件', en: 'Natural Events' },
    volcano: { 'zh-CN': '火山与海啸', en: 'Volcanoes & Tsunamis' },
    climate: { 'zh-CN': '地表与气候', en: 'Surface & Climate' },
    air: { 'zh-CN': '空气质量', en: 'Air Quality' },
    weather: { 'zh-CN': '城市天气', en: 'City Weather' },
    archive: { 'zh-CN': '气候档案', en: 'Climate Archive' },
    cases: { 'zh-CN': '真实案例', en: 'Real Cases' },
  },
  ocean: {
    waves: { 'zh-CN': '海浪与海温', en: 'Waves & SST' },
    tide: { 'zh-CN': '潮汐', en: 'Tides' },
    oni: { 'zh-CN': '气候振荡', en: 'Climate Oscillations' },
    cyclone: { 'zh-CN': '热带气旋', en: 'Tropical Cyclones' },
    buoy: { 'zh-CN': '浮标实况', en: 'Live Buoys' },
    marine: { 'zh-CN': '海况预报', en: 'Marine Forecast' },
    coast: { 'zh-CN': '海岸榜', en: 'Coastal Ranking' },
    seatem: { 'zh-CN': '海温趋势', en: 'SST Trends' },
    cases: { 'zh-CN': '真实案例', en: 'Real Cases' },
  },
}

/**
 * 关联表。键 = `${看板}.${页签}`，值 = 若干条关联。
 * 每条：{ to, why, detail, terms }
 *   to     '看板.页签'（必须真实存在，单测会钉）
 *   why    一句话因果
 *   detail 展开后的资料解释：机制 + 量级 + 怎么读
 *   terms  [{ b, k }]，b 决定查哪本词典（astro 用 KPI_DEFS，geo/ocean 用 EARTH_KPI_DEFS）
 */
export const RELATIONS = {
  /* ---------- 深空 ---------- */
  'astro.earth': [
    {
      to: 'astro.solar',
      why: {
        'zh-CN': '近地轨道的推算就在太阳系力学框架内，行星位置是同一套历元',
        en: 'Near-Earth orbit computation sits inside the solar-system dynamics framework; planetary positions share the same epoch',
      },
      detail: {
        'zh-CN': '本页签的卫星过境、空间站轨迹都建立在同一个历元与同一套开普勒根数上。行星位置不是装饰——它决定了「此刻太阳系长什么样」，也是深空任务转移轨道的参照系。看到某颗卫星轨道倾角异常时，往往能在发射窗口与行星几何里找到原因。',
        en: 'The satellite passes and space-station tracks on this tab are all built on the same epoch and the same set of Keplerian elements. Planetary positions are not decoration — they determine "what the solar system looks like right now", and they are also the reference frame for the transfer trajectories of deep-space missions. When you see a satellite with an unusual orbital inclination, the explanation can usually be found in the launch window and the planetary geometry.',
      },
      terms: [{ b: 'astro', k: 'inclination' }, { b: 'astro', k: 'period' }],
    },
    {
      to: 'astro.launch',
      why: {
        'zh-CN': '在轨的每一颗卫星都来自某次发射任务，发射窗口决定入轨倾角',
        en: 'Every satellite in orbit came from a launch mission; the launch window determines the injection inclination',
      },
      detail: {
        'zh-CN': '轨道倾角下限等于发射场纬度：从库鲁（5°N）打地球同步轨道省燃料，从拜科努尔（46°N）就打不了。所以「某颗星为什么是这个倾角」答案在发射场与任务目标里。反过来，看到一列即将发射的任务，就能预判未来几周会新增哪些可追踪目标。',
        en: 'The lower bound on orbital inclination equals the latitude of the launch site: a geosynchronous launch from Kourou (5°N) saves propellant, while from Baikonur (46°N) it is simply not feasible. So the answer to "why does this satellite have this inclination" lies in the launch site and the mission objective. Conversely, when you see a list of upcoming launches, you can anticipate which new trackable objects will appear over the next few weeks.',
      },
      terms: [{ b: 'astro', k: 'inclination' }],
    },
    {
      to: 'astro.sun',
      why: {
        'zh-CN': '太阳活动加热大气 → 阻力增大 → 低轨卫星轨道衰减加快',
        en: 'Solar activity heats the atmosphere → drag increases → low-orbit satellites decay faster',
      },
      detail: {
        'zh-CN': 'X 级耀斑伴随的极紫外辐射会在数小时内加热高层大气，热层密度可上升一个量级，400 km 高度的大气阻力随之激增。2000 年以来多次观测到：大耀斑后低轨目标的实际衰减率远超预报，需要额外抬轨。国际空间站在太阳活动极大年的补推频次明显高于极小年，就是这个机制。',
        en: 'The extreme-ultraviolet radiation that accompanies an X-class flare heats the upper atmosphere within hours; thermospheric density can rise by an order of magnitude, and the atmospheric drag at 400 km altitude surges accordingly. Since 2000 this has been observed repeatedly: after a large flare the actual decay rate of low-orbit objects far exceeds predictions, and extra reboosts are required. The International Space Station performs reboosts markedly more often at solar maximum than at solar minimum — that is this very mechanism.',
      },
      terms: [{ b: 'astro', k: 'flare' }, { b: 'astro', k: 'solarCycle' }],
    },
    {
      to: 'geo.epic',
      why: {
        'zh-CN': '拍整圆盘地球的 DSCOVR 就在日地 L1 点，同时兼任太阳风监测站',
        en: 'DSCOVR, which images the full-disk Earth, sits at the Sun–Earth L1 point and doubles as a solar-wind monitor',
      },
      detail: {
        'zh-CN': 'DSCOVR 停在日地连线 L1 点（距地约 150 万 km），它的 EPIC 相机拍的是永远被太阳照亮的地球昼面；同一颗卫星上的 PlasMag 仪器则在测太阳风速度、密度与磁场。所以「整圆盘地球影像」和「太阳风到达地球前的最后一道哨兵」是同一颗星的两个身份——太阳风读数比影像早约 15–60 分钟预警地磁扰动。',
        en: 'DSCOVR is stationed at the L1 point of the Sun–Earth line (about 1.5 million km from Earth); its EPIC camera photographs the perpetually sunlit dayside of Earth, while the PlasMag instrument on the same spacecraft measures solar-wind speed, density and magnetic field. So "full-disk Earth imagery" and "the last sentinel before the solar wind reaches Earth" are two identities of one spacecraft — the solar-wind readings give about 15–60 minutes of advance warning of geomagnetic disturbance.',
      },
      terms: [{ b: 'astro', k: 'wind' }, { b: 'astro', k: 'bz' }],
    },
    {
      to: 'astro.sky',
      why: {
        'zh-CN': '国际空间站与明亮卫星的过境预报就在今晚星空页签里，肉眼可见',
        en: "Pass predictions for the ISS and bright satellites are on the Tonight's Sky tab — visible to the naked eye",
      },
      detail: {
        'zh-CN': '国际空间站是全天最亮的人造天体，满相时可达 −3.9 等，比天狼星还亮。它只在日出前与日落后约两小时内可见——因为那时地面已入夜、而几百公里高处仍被阳光照亮。本页签算的是轨道根数，今晚星空算的是「从你所在位置几点能看到它掠过哪片天区」，两者是同一件事的两个视角。',
        en: "The ISS is the brightest artificial object in the sky, reaching magnitude −3.9 at full phase, brighter than Sirius. It is visible only within roughly two hours before sunrise or after sunset — because the ground is already in darkness while altitudes of a few hundred kilometres are still sunlit. This tab computes the orbital elements; Tonight's Sky computes at what time and across which part of the sky you can watch it pass from your location. The two are two viewpoints on the same thing.",
      },
      terms: [{ b: 'astro', k: 'altitude' }, { b: 'astro', k: 'magnitude' }],
    },
  ],
  'astro.solar': [
    {
      to: 'astro.earth',
      why: {
        'zh-CN': '近地轨道是太阳系最内层，行星位置与轨道推算同源',
        en: 'Near-Earth orbit is the innermost region of the solar system; planetary positions and orbit computation share the same origin',
      },
      detail: {
        'zh-CN': '太阳系页签给出的行星黄经、地心距，与近地轨道页签的卫星星下点用的是同一套时间基准（UTC 与儒略日）和同一族历表。理解「行星位置怎么算」之后，再看卫星过境预报就不会把它当成黑盒。',
        en: 'The planetary ecliptic longitudes and geocentric distances given on the Solar System tab use the same time base (UTC and Julian date) and the same family of ephemerides as the satellite sub-points on the Near Earth tab. Once you understand how planetary positions are computed, satellite pass predictions stop being a black box.',
      },
      terms: [{ b: 'astro', k: 'au' }, { b: 'astro', k: 'period' }],
    },
    {
      to: 'astro.sky',
      why: {
        'zh-CN': '行星在星空中的位置由本页签的行星历算给出',
        en: 'The positions of the planets in the sky come from the planetary ephemeris computation on this tab',
      },
      detail: {
        'zh-CN': '今晚星空里那几颗「特别亮还不眨眼」的，多半就是金星、木星、土星。它们此刻的赤经赤纬直接来自本页签的行星位置推算。冲日前后行星最亮（地心距最小、相位角最大），合日前后则淹没在日光里看不见——亮度变化是几何效应，不是行星本身在变。',
        en: "Those few objects in tonight's sky that are unusually bright and do not twinkle are most likely Venus, Jupiter and Saturn. Their current right ascension and declination come directly from the planetary position computation on this tab. Planets are brightest near opposition (minimum geocentric distance, maximum phase angle) and lost in sunlight near conjunction — the brightness change is a geometric effect, not the planet itself changing.",
      },
      terms: [{ b: 'astro', k: 'magnitude' }, { b: 'astro', k: 'au' }],
    },
    {
      to: 'astro.deep',
      why: {
        'zh-CN': '把太阳系放进银河系尺度对照，才知道本地泡有多小',
        en: 'Only by setting the solar system against the scale of the Galaxy do you see how small our local bubble is',
      },
      detail: {
        'zh-CN': '太阳系直径按海王星轨道算约 60 AU，折合不到 0.001 光年；而最近的恒星在 4.2 光年外，银河系直径约 10 万光年。对照之后会发现：深空页签里那些「几十光年」的天体其实都在太阳系的近邻，只是相对尺度仍然压倒性巨大。',
        en: "Measured by Neptune's orbit, the solar system is about 60 AU across, i.e. less than 0.001 light-year; the nearest star lies 4.2 light-years away, and the Milky Way is roughly 100,000 light-years in diameter. The comparison shows that the objects listed as a few tens of light-years away on the Deep Sky tab are in fact close neighbours of the solar system — their relative scale is still overwhelmingly large.",
      },
      terms: [{ b: 'astro', k: 'au' }, { b: 'astro', k: 'distLunar' }],
    },
    {
      to: 'astro.launch',
      why: {
        'zh-CN': '行星际转移轨道与发射窗口完全由行星几何决定',
        en: 'Interplanetary transfer trajectories and launch windows are entirely determined by planetary geometry',
      },
      detail: {
        'zh-CN': '去火星的霍曼转移窗口每 26 个月一次，因为要等地球与火星到达合适的相对相位；去外行星则常借木星引力弹弓，窗口更稀有（旅行者号的 1977 年木土连线排布要 176 年才重现一次）。所以发射页签里那些「为什么是这个日期」的安排，答案都写在太阳系页签的行星位置上。',
        en: 'The Hohmann transfer window to Mars opens once every 26 months, because one must wait for Earth and Mars to reach the right relative phase; missions to the outer planets often borrow a gravitational slingshot from Jupiter, and those windows are rarer still (the 1977 Jupiter–Saturn alignment exploited by the Voyagers recurs only once every 176 years). So the answer to every "why this date" on the Space Launches tab is written in the planetary positions on the Solar System tab.',
      },
      terms: [{ b: 'astro', k: 'au' }, { b: 'astro', k: 'period' }],
    },
    {
      to: 'ocean.tide',
      why: {
        'zh-CN': '引潮力就来自本页签的日月位置，潮汐是天体力学在地球上的直接后果',
        en: 'The tide-generating force comes directly from the Sun and Moon positions on this tab; tides are a direct consequence of celestial mechanics on Earth',
      },
      detail: {
        'zh-CN': '潮汐的驱动项是月球与太阳的引潮力，月球贡献约为太阳的 2.2 倍（虽然太阳质量大得多，但引潮力按距离三次方衰减）。所以「为什么每月有两次大潮」的答案在日月黄经差上：朔望时两者同向叠加，上下弦时相互抵消。海洋页签的潮位曲线，本质是这里行星位置的时间导数。',
        en: 'The driving term of the tides is the tide-generating force of the Moon and the Sun; the Moon contributes about 2.2 times as much as the Sun (the Sun is far more massive, but the tide-generating force falls off as the cube of distance). So the answer to why there are two spring tides each month lies in the difference in ecliptic longitude between Sun and Moon: at new and full moon the two add in the same direction, at the quarters they partly cancel. The tide curve on the Ocean tab is, in essence, the time derivative of the Sun–Moon positions computed here.',
      },
      terms: [{ b: 'astro', k: 'moonPhase' }, { b: 'earth', k: 'springNeap' }],
    },
  ],
  'astro.sun': [
    {
      to: 'astro.sky',
      why: {
        'zh-CN': '极光概率与地磁 Kp 直接决定高纬度观星之外的「天象」',
        en: 'Aurora probability and the geomagnetic Kp index directly decide the sky event that matters most at high latitudes, beyond ordinary stargazing',
      },
      detail: {
        'zh-CN': 'Kp ≥ 5 时极光卵向低纬扩张，北欧、加拿大、阿拉斯加在晴夜就能肉眼看到；同一时刻中低纬度观星者看到的则是「没什么变化」。所以安排极地观星行程时，Kp 预报比云量预报更早决定成败。反过来说，极光本身也是一种光污染——它会抬高天光背景，压低暗弱天体的反差。',
        en: 'When Kp ≥ 5 the auroral oval expands toward lower latitudes, and on clear nights the aurora becomes visible to the naked eye in northern Europe, Canada and Alaska; at that same moment observers at middle and low latitudes see nothing has changed. So when planning a polar observing trip, the Kp forecast decides success or failure earlier than the cloud forecast does. Conversely, the aurora is itself a form of light pollution — it raises the sky background brightness and reduces the contrast of faint objects.',
      },
      terms: [{ b: 'astro', k: 'kp' }, { b: 'astro', k: 'aurora' }],
    },
    {
      to: 'astro.earth',
      why: {
        'zh-CN': '耀斑加热高层大气，低轨卫星阻力上升、寿命缩短',
        en: 'Flares heat the upper atmosphere, drag on low-orbit satellites rises and their lifetime shortens',
      },
      detail: {
        'zh-CN': '这是太阳活动对工程最直接的后果：热层被加热后膨胀，卫星所在高度的大气密度上升，阻力系数随之变大。Starlink 在 2022 年 2 月一次地磁扰动中一次性损失约 40 颗刚入轨卫星——它们正处于极低轨道、尚未抬升，被抬高的阻力直接拽回大气层。看太阳页签的 Kp/耀斑，实际是在看近地轨道的「天气」。',
        en: "This is the most direct engineering consequence of solar activity: once the thermosphere is heated it expands, the atmospheric density at the satellite's altitude increases, and the drag grows accordingly. In a geomagnetic disturbance in February 2022, Starlink lost about 40 freshly launched satellites in one event — they were still in a very low orbit and had not yet been raised, and the enhanced drag pulled them straight back into the atmosphere. Reading Kp and flare levels on the Sun tab is really reading the weather of low Earth orbit.",
      },
      terms: [{ b: 'astro', k: 'kp' }, { b: 'astro', k: 'flare' }],
    },
    {
      to: 'geo.climate',
      why: {
        'zh-CN': '太阳辐照长期变化是气候自然强迫项之一（与温室气体区分开）',
        en: 'Long-term variation in solar irradiance is one of the natural climate forcings (to be distinguished from greenhouse gases)',
      },
      detail: {
        'zh-CN': '太阳总辐照（TSI）在 11 年周期里的起伏只有约 0.1%，折算成全球平均温度的辐射强迫约 0.05 W/m²；而工业化以来温室气体造成的强迫约 2.7 W/m²，差了五十倍。所以近半世纪的变暖不能归因于太阳周期——把两者并列看，正是为了把这个量级差摆在一起。',
        en: 'Total solar irradiance (TSI) varies by only about 0.1% over the 11-year cycle, which translates into a radiative forcing of roughly 0.05 W/m² in terms of global mean temperature; the forcing from greenhouse gases since industrialisation is about 2.7 W/m² — a factor of fifty. The warming of the past half century therefore cannot be attributed to the solar cycle; putting the two side by side is exactly what makes that difference in magnitude visible.',
      },
      terms: [{ b: 'earth', k: 'tempAnomaly' }, { b: 'astro', k: 'solarCycle' }],
    },
    {
      to: 'ocean.oni',
      why: {
        'zh-CN': '太阳周期与海洋年代际振荡都属气候自然变率，解读海温时要排除',
        en: 'Both the solar cycle and oceanic decadal oscillations belong to natural climate variability and must be excluded when interpreting sea temperature',
      },
      detail: {
        'zh-CN': '判断某年海温距平是「长期增暖的一部分」还是「自然变率的一次波动」，需要先把 ENSO、PDO 这类内部振荡的贡献从序列里剥离。太阳周期贡献更小但周期固定易识别。三者并存时，短序列（10 年以内）的趋势极易被振荡相位主导——这正是气候学要求至少 30 年才算趋势的原因。',
        en: 'To decide whether a given year of sea-temperature anomaly is part of long-term warming or a fluctuation of natural variability, one must first strip the contribution of internal oscillations such as ENSO and PDO out of the series. The solar-cycle contribution is smaller but has a fixed period and is easy to identify. With all three present, the trend of a short record (under 10 years) is easily dominated by the phase of an oscillation — which is exactly why climatology requires at least 30 years before calling something a trend.',
      },
      terms: [{ b: 'earth', k: 'oni' }, { b: 'earth', k: 'pdo' }, { b: 'earth', k: 'ssta' }],
    },
    {
      to: 'astro.apod',
      why: {
        'zh-CN': '极光与太阳事件的经典影像常被 APOD 选登，需要本页签的术语才读得懂',
        en: 'Classic images of aurorae and solar events are often featured by APOD, and the terminology on this tab is needed to read them',
      },
      detail: {
        'zh-CN': 'APOD 里的极光照片常标注拍摄时的 Kp 值、是否伴随 CME、用的是哪颗卫星的日面观测。带着本页签的 Kp / 耀斑等级去看，就能把一张漂亮的照片还原成一次有编号、有时刻、有等级的真实空间天气事件，而不只是「好看的绿光」。',
        en: "Aurora photographs on APOD usually note the Kp value at the time of exposure, whether a CME accompanied the event, and which spacecraft's solar observations are being used. Armed with the Kp and flare classifications from this tab, you can turn a pretty picture back into a real space-weather event with a designation, a timestamp and a class — rather than just pretty green light.",
      },
      terms: [{ b: 'astro', k: 'aurora' }, { b: 'astro', k: 'kp' }],
    },
  ],
  'astro.sky': [
    {
      to: 'astro.solar',
      why: {
        'zh-CN': '今晚可见的行星位置来自太阳系页签的行星历算',
        en: 'The positions of the planets visible tonight come from the planetary ephemeris computation on the Solar System tab',
      },
      detail: {
        'zh-CN': '星空页签里的行星标记不是独立算的，它调用同一套行星历表。若发现某颗行星在今天的位置与星图软件差了几度，先检查历元与观测地经纬度，而不是怀疑数据错了——绝大多数偏差来自时区或站址设置。',
        en: "The planet markers on the Sky tab are not computed independently; they call the same set of planetary ephemerides. If you find that a planet's position today differs from your star-chart software by a few degrees, check the epoch and the latitude/longitude of the observing site first rather than suspecting bad data — most discrepancies come from time-zone or site settings.",
      },
      terms: [{ b: 'astro', k: 'au' }, { b: 'astro', k: 'magnitude' }],
    },
    {
      to: 'astro.sun',
      why: {
        'zh-CN': '极光与地磁活动会盖过高纬度地区的暗弱天体',
        en: 'Aurorae and geomagnetic activity can drown out faint objects at high latitudes',
      },
      detail: {
        'zh-CN': '强极光时天光背景亮度可上升数倍，等效于在城市近郊观星。对深空摄影来说，极光既是拍摄目标，也是同晚拍星系的干扰——绿色极光带扫过天区时叠加在目标上几乎无法后期分离。安排拍摄计划要同时看 Kp 预报和月相。',
        en: 'During a strong aurora the sky background brightness can rise several-fold, equivalent to observing from the outer suburbs of a city. For deep-sky imaging, the aurora is both a target and a nuisance: on the same night, a green auroral band sweeping across the field superimposes on the target object and can barely be separated in post-processing. Planning a session requires looking at both the Kp forecast and the lunar phase.',
      },
      terms: [{ b: 'astro', k: 'aurora' }, { b: 'astro', k: 'moonPhase' }],
    },
    {
      to: 'astro.deep',
      why: {
        'zh-CN': '流星雨的母体彗星与小行星同属太阳系小天体族群',
        en: 'The parent comets and asteroids of meteor showers belong to the same solar-system small-body population',
      },
      detail: {
        'zh-CN': '每年固定日期出现的流星雨，是地球穿过某颗彗星（少数是小行星）留下的尘埃带。双子座流星雨的母体是 3200 Phaethon（被归入「岩石彗星」），象限仪座流星雨的母体是 2003 EH1。所以「流星雨」本质上是可预报轨道的小天体遗迹，与深空页签的小天体数据是同一族对象。',
        en: 'The meteor showers that recur on fixed dates each year occur when Earth crosses the dust trail left by a comet (a few by an asteroid). The parent of the Geminids is 3200 Phaethon (classified as a rock comet), and the parent of the Quadrantids is 2003 EH1. So a meteor shower is essentially the debris of a small body with a predictable orbit — the same family of objects catalogued on the Deep Sky tab.',
      },
      terms: [{ b: 'astro', k: 'period' }],
    },
    {
      to: 'astro.apod',
      why: {
        'zh-CN': '今晚要找的天区，很多都有 APOD 的经典影像可对照',
        en: 'Many of the sky regions you will hunt for tonight have classic APOD images to compare against',
      },
      detail: {
        'zh-CN': '把今晚星空里某个天区与 APOD 的经典影像对照，是最快建立「星图坐标 ↔ 实际画面」直觉的方法。注意差别：APOD 多是长时间曝光叠加，亮度与色彩远超肉眼——先用今晚星空确认「它在不在、在哪」，再看照片，不容易产生「肉眼应该也能看到这样」的误解。',
        en: "Matching a sky region from Tonight's Sky against a classic APOD image is the fastest way to build an intuition for the mapping between chart coordinates and what the object actually looks like. Mind the difference: APOD images are usually long stacked exposures whose brightness and colour far exceed what the eye can see — confirm with Tonight's Sky first whether the object is up and where it is, then look at the photograph, and you are less likely to come away with the misconception that the naked eye should see it that way too.",
      },
      terms: [{ b: 'astro', k: 'dsoMag' }, { b: 'astro', k: 'magnitude' }],
    },
    {
      to: 'astro.earth',
      why: {
        'zh-CN': '国际空间站与明亮卫星的过境是星空页签里最容易被忽略的动态目标',
        en: "Passes of the ISS and bright satellites are the most easily overlooked moving targets on the Tonight's Sky tab",
      },
      detail: {
        'zh-CN': '星空里绝大多数东西千年不动，唯有人造天体几分钟就横穿天区。国际空间站过境常持续 2–6 分钟，最亮时 −3.9 等。若在星图上看到一个「不在任何星表里」的移动光点，多半就是它——地球附近页签给出它此刻的星下点，星空页签给出你抬头能看到它的时刻。',
        en: 'Almost everything in the sky stays put for a thousand years; only artificial objects cross the field within minutes. An ISS pass typically lasts 2–6 minutes and peaks at magnitude −3.9. If you see a moving point of light that is in no catalogue, it is most likely the station — the Near Earth tab gives its sub-satellite point right now, and the Sky tab gives the moment you can look up and see it.',
      },
      terms: [{ b: 'astro', k: 'altitude' }, { b: 'astro', k: 'footprint' }],
    },
  ],
  'astro.apod': [
    {
      to: 'astro.deep',
      why: {
        'zh-CN': 'APOD 绝大多数是深空天体，本页签给出它们的身份卡',
        en: 'Most APOD entries are deep-sky objects, and the Deep Sky tab provides their identity cards',
      },
      detail: {
        'zh-CN': '天文一图里的星云、星系、星团，绝大多数能在深空页签查到类型、距离、视星等。知道 M42 距我们约 1344 光年、视星等 4.0（肉眼可见），再看那张照片的感受完全不同——它不是一个「好看的图案」，而是一个直径十几光年的恒星育婴室。',
        en: 'Most of the nebulae, galaxies and clusters featured as the astronomy picture can be looked up on the Deep Sky tab for type, distance and apparent magnitude. Knowing that M42 lies about 1,344 light-years away with an apparent magnitude of 4.0 (visible to the naked eye) completely changes how you look at that photograph — it is not a pretty pattern but a stellar nursery a dozen-odd light-years across.',
      },
      terms: [{ b: 'astro', k: 'dsoMag' }, { b: 'astro', k: 'magnitude' }],
    },
    {
      to: 'astro.sun',
      why: {
        'zh-CN': '偶尔是太阳或极光，需要太阳活动页签的术语才读得懂',
        en: 'Occasionally the subject is the Sun or an aurora, and the terminology on the Solar Activity tab is needed to read it',
      },
      detail: {
        'zh-CN': 'APOD 也会选登太阳黑子群、日冕物质抛射、极光弧。这时标题里的 CME、filament、coronal hole 就不再是陌生词——太阳活动页签解释了它们与地磁扰动的关系，能帮你判断这张图是在讲「一次事件的成因」还是「它到达地球后的效果」。',
        en: 'APOD also features sunspot groups, coronal mass ejections and auroral arcs. At that point CME, filament and coronal hole in the caption stop being unfamiliar words — the Solar Activity tab explains how they relate to geomagnetic disturbance and helps you judge whether the image is about the cause of an event or about its effects after it reaches Earth.',
      },
      terms: [{ b: 'astro', k: 'sunspot' }, { b: 'astro', k: 'flare' }],
    },
    {
      to: 'astro.sky',
      why: {
        'zh-CN': '想知道照片里的天区今晚在不在天上、升到多高，看今晚星空',
        en: "To know whether the region in the photo is up tonight and how high it climbs, look at Tonight's Sky",
      },
      detail: {
        'zh-CN': 'APOD 不告诉你「能不能看到」，它只给一张图。今晚星空补上另一半：该天区此刻的地平高度、方位、以及月亮是否来捣乱。很多经典深空照拍摄于南半球或冬季，北半球夏季的观星者即使设备再好也看不到——先看今晚星空，能省掉一次无效熬夜。',
        en: "APOD does not tell you whether an object is observable; it only gives you a picture. Tonight's Sky supplies the other half: the current altitude and azimuth of that region, and whether the Moon will interfere. Many classic deep-sky images were taken from the southern hemisphere or in winter, so observers in the northern summer cannot see them no matter how good their equipment — check Tonight's Sky first and you can save yourself a wasted night.",
      },
      terms: [{ b: 'astro', k: 'altitude' }, { b: 'astro', k: 'moonPhase' }],
    },
    {
      to: 'astro.solar',
      why: {
        'zh-CN': '月球特写与行星题材的 APOD，其相位与位置由太阳系页签解释',
        en: 'For APOD images of close-up lunar features or planets, the phase and position are explained on the Solar System tab',
      },
      detail: {
        'zh-CN': 'APOD 常登月球某地形的特写、或行星冲日时的影像。图注里的「 libration（天平动）」「冲日」「合日」都是几何描述：天平动让我们能看到月球背面约 59% 的区域，冲日则意味着地外行星整夜可见且最亮。这些词在太阳系页签里有对应的位置与距离数据。',
        en: 'APOD often publishes close-ups of lunar terrain or images taken at planetary opposition. Terms in the caption such as libration, opposition and conjunction are all geometric descriptions: libration lets us see about 59% of the lunar far side, while opposition means a superior planet is visible all night and at its brightest. The Solar System tab carries the corresponding position and distance data for each of these.',
      },
      terms: [{ b: 'astro', k: 'moonPhase' }, { b: 'astro', k: 'au' }],
    },
    {
      to: 'astro.earth',
      why: {
        'zh-CN': '「蓝色弹珠」这类地球影像是 APOD 的经典题材，拍摄平台就在地球附近页签',
        en: 'Earth images such as the Blue Marble are a classic APOD subject, and the platform that took them is listed on the Near Earth tab',
      },
      detail: {
        'zh-CN': '阿波罗 17 号的「蓝色弹珠」（1972）、DSCOVR 的 EPIC 整圆盘影像，都是 APOD 的高频题材。前者是宇航员在距地约 2.9 万 km 处手持相机拍的，后者是 L1 点卫星的固定视角。知道拍摄平台在哪、距地多远，才能读懂影像里为什么只看到半个地球、为什么南极总在画面边缘。',
        en: "Apollo 17's Blue Marble (1972) and DSCOVR's EPIC full-disk images are both frequent APOD subjects. The former was shot by hand by an astronaut about 29,000 km from Earth; the latter is the fixed viewpoint of a spacecraft at L1. Knowing where the platform is and how far it is from Earth is what lets you read why only half the globe is visible, and why Antarctica always sits at the edge of the frame.",
      },
      terms: [{ b: 'astro', k: 'footprint' }, { b: 'astro', k: 'altitude' }],
    },
  ],
  'astro.deep': [
    {
      to: 'astro.solar',
      why: {
        'zh-CN': '系外行星的统计要和太阳系对照才有意义',
        en: 'Exoplanet statistics only make sense when compared against the solar system',
      },
      detail: {
        'zh-CN': '「超级地球」「热木星」这类分类全部以太阳系为标尺：比地球大、比海王星小叫超级地球；轨道周期只有几天的巨行星叫热木星。没有太阳系做基准，这些数字就是孤立的。反过来，太阳系至今没找到热木星，这本身也是个需要解释的观测事实。',
        en: 'Classifications such as super-Earth and hot Jupiter all use the solar system as their yardstick: larger than Earth but smaller than Neptune is a super-Earth; a giant planet with an orbital period of only a few days is a hot Jupiter. Without the solar system as a baseline those numbers stand alone. Conversely, the fact that no hot Jupiter has been found in the solar system is itself an observational fact that needs explaining.',
      },
      terms: [{ b: 'astro', k: 'hz' }, { b: 'astro', k: 'au' }],
    },
    {
      to: 'astro.apod',
      why: {
        'zh-CN': '天文一图常取材于深空天体',
        en: 'The astronomy picture is often drawn from deep-sky objects',
      },
      detail: {
        'zh-CN': '日更的 APOD 是深空天体的一个「随机采样器」：看到一张没见过的天体，回深空页签查它的距离与星等，是最快的把图片变成知识的方式。',
        en: 'The daily APOD is a random sampler of deep-sky objects: when you come across an unfamiliar object, looking up its distance and magnitude on the Deep Sky tab is the fastest way to turn a picture into knowledge.',
      },
      terms: [{ b: 'astro', k: 'dsoMag' }],
    },
    {
      to: 'astro.sky',
      why: {
        'zh-CN': '深空天体的距离与星等要落到「今晚能不能看到」才有意义',
        en: 'The distance and magnitude of a deep-sky object only matter once they translate into whether you can see it tonight',
      },
      detail: {
        'zh-CN': '深空页签给的是天体的距离、类型、视星等；今晚星空把这些换算成「现在它在哪、有多高、你的极限星等够不够」。视星等是肉眼可见性的直接指标：6 等是裸眼极限（无光污染），所以 8 等的星系用眼睛永远看不到，需要望远镜加长曝光。',
        en: "The Deep Sky tab gives an object's distance, type and apparent magnitude; Tonight's Sky converts these into where it is now, how high it is, and whether your limiting magnitude reaches it. Apparent magnitude is the direct indicator of naked-eye visibility: magnitude 6 is the unaided-eye limit under a pristine sky, so a magnitude-8 galaxy can never be seen with the eye alone — it needs a telescope and a long exposure.",
      },
      terms: [{ b: 'astro', k: 'dsoMag' }, { b: 'astro', k: 'altitude' }],
    },
    {
      to: 'astro.sun',
      why: {
        'zh-CN': '日球层是深空探测的物理边界，旅行者号穿越它靠的就是太阳风数据',
        en: 'The heliosphere is the physical boundary of deep-space exploration, and the Voyagers crossed it using solar-wind data',
      },
      detail: {
        'zh-CN': '太阳风向外吹出一个巨大的气泡叫日球层，边界在约 120 AU 处。旅行者 1 号 2012 年穿越日球层顶的判据，正是本页签监测的那些量：太阳风粒子密度骤降、宇宙射线通量陡升。所以「星际空间」的起点不是某个距离，而是太阳风再也压不住星际介质的那个界面。',
        en: 'The solar wind blows a huge bubble called the heliosphere, whose boundary lies at about 120 AU. The criteria by which Voyager 1 was declared to have crossed the heliopause in 2012 are precisely the quantities monitored on the Sun tab: a sharp drop in solar-wind particle density and a steep rise in cosmic-ray flux. So the start of interstellar space is not a particular distance, but the interface where the solar wind can no longer hold back the interstellar medium.',
      },
      terms: [{ b: 'astro', k: 'wind' }, { b: 'astro', k: 'proton' }],
    },
    {
      to: 'astro.launch',
      why: {
        'zh-CN': '深空天体的观测能力本身就是发射任务堆出来的（JWST / 钱德拉 / 哈勃）',
        en: 'Our ability to observe deep-sky objects is itself built up launch by launch (JWST / Chandra / Hubble)',
      },
      detail: {
        'zh-CN': '人类对深空的认知深度几乎与望远镜的发射历史同步：哈勃（1990）把深空天体的测光精度提到前所未有的水平，钱德拉（1999）补上 X 射线窗口，JWST（2021，日地 L2 点）把红外观测推到早期宇宙。看到某个天体的数据时留意它的观测设备与年份，常能解释「为什么这个参数测得很准而那个只有量级估计」。',
        en: 'The depth of our knowledge of the deep sky tracks the launch history of telescopes almost exactly: Hubble (1990) pushed the photometric precision of deep-sky objects to unprecedented levels, Chandra (1999) added the X-ray window, and JWST (2021, at the Sun–Earth L2 point) carried infrared observation back to the early universe. When you look at the data for an object, noting which facility observed it and in what year often explains why one parameter is measured precisely while another is only an order-of-magnitude estimate.',
      },
      terms: [{ b: 'astro', k: 'distLunar' }, { b: 'astro', k: 'period' }],
    },
  ],
  'astro.launch': [
    {
      to: 'astro.earth',
      why: {
        'zh-CN': '发射入轨后就在地球附近页签里变成一颗可追踪的卫星',
        en: 'After injection into orbit, a launch becomes a trackable satellite on the Near Earth tab',
      },
      detail: {
        'zh-CN': '发射页签是「入口」，地球附近页签是「归宿」：一颗星从任务清单变成 TLE 里的一行根数，通常要等入轨后数小时到数天（需要被跟踪网确认轨道）。所以刚发射完的卫星未必能立刻在轨道页签里查到，这是正常的流程延迟而非数据缺失。',
        en: 'The Space Launches tab is the entrance and the Near Earth tab is the destination: for a spacecraft to go from a mission list to a line of elements in a TLE usually takes hours to days after injection, because the tracking network has to confirm the orbit. So a satellite that has just launched may not appear on the orbit tab immediately — that is a normal processing delay, not missing data.',
      },
      terms: [{ b: 'astro', k: 'inclination' }, { b: 'astro', k: 'period' }],
    },
    {
      to: 'astro.solar',
      why: {
        'zh-CN': '深空探测任务的转移轨道靠太阳系页签的行星位置理解',
        en: 'The transfer trajectories of deep-space missions are understood through the planetary positions on the Solar System tab',
      },
      detail: {
        'zh-CN': '去火星的窗口每 26 个月才开一次，因为要靠霍曼转移让飞船「追上」火星当前位置。理解行星此刻在哪、下次会合在什么时候，才能看懂为什么某些任务必须准时发射、错过就要等两年。',
        en: 'The window to Mars opens only once every 26 months, because a Hohmann transfer is used to let the spacecraft catch up with Mars at its current position. Only by understanding where the planets are now and when the next conjunction falls can you see why some missions must launch on time and why missing the window means waiting two years.',
      },
      terms: [{ b: 'astro', k: 'au' }, { b: 'astro', k: 'period' }],
    },
    {
      to: 'astro.deep',
      why: {
        'zh-CN': '深空探测任务的目标就是深空页签里那些天体',
        en: 'The targets of deep-space missions are exactly the objects listed on the Deep Sky tab',
      },
      detail: {
        'zh-CN': '新视野号飞冥王星、朱诺号进木星轨道、欧罗巴快船去木卫二——发射任务清单与深空天体目录是「手段」与「目标」的关系。看到一次发射任务时去深空页签查目标天体的距离与类型，才能理解为什么它要飞九年（新视野号）而不是九个月：不是技术慢，是目标远。',
        en: "New Horizons to Pluto, Juno into Jupiter orbit, Europa Clipper to Europa — the launch manifest and the deep-sky catalogue are related as means and ends. When you see a launch mission, look up its target's distance and type on the Deep Sky tab, and you will understand why it has to fly for nine years (New Horizons) rather than nine months: not because the technology is slow, but because the target is far.",
      },
      terms: [{ b: 'astro', k: 'au' }, { b: 'astro', k: 'distLunar' }],
    },
    {
      to: 'astro.sun',
      why: {
        'zh-CN': '发射有空间天气约束：高能粒子事件期间会推迟载人发射与关键机动',
        en: 'Launches are subject to space-weather constraints: crewed launches and critical manoeuvres are postponed during energetic particle events',
      },
      detail: {
        'zh-CN': 'NASA 对载人发射与卫星入轨关键段设有空间天气约束——太阳质子事件会抬高低轨辐射剂量，对舱外活动与电子设备都是风险。所以「发射推迟」的原因除了技术故障与天气（雷暴、高空风），还有一类是空间天气。看发射状态为 TBD 时，太阳活动页签的质子通量与 Kp 值得同步看一眼。',
        en: 'NASA imposes space-weather constraints on crewed launches and on the critical phases of satellite injection — solar proton events raise the radiation dose in low orbit and are a risk both to extravehicular activity and to electronics. So besides technical failures and weather (thunderstorms, upper-level winds), launch postponed has a third cause: space weather. When a launch status reads TBD, it is worth glancing at the proton flux and Kp on the Solar Activity tab at the same time.',
      },
      terms: [{ b: 'astro', k: 'proton' }, { b: 'astro', k: 'kp' }],
    },
    {
      to: 'astro.apod',
      why: {
        'zh-CN': '重大发射与在轨里程碑常被 APOD 选登，配图说明里往往有任务细节',
        en: 'Major launches and in-orbit milestones are often featured by APOD, and the captions usually carry mission details',
      },
      detail: {
        'zh-CN': 'APOD 会登发射的轨迹云、火箭残骸的螺旋光、以及韦布望远镜首批彩图这类里程碑。它给的通常是「这一刻看起来什么样」，而发射页签给的是「这次任务要去哪、现在什么状态」。两者对照看，能把一张奇妙的照片定位到具体某次任务。',
        en: "APOD publishes launch vapour trails, the spiral glow of rocket bodies, and milestones such as Webb's first colour images. It usually provides what this moment looked like, while the Space Launches tab provides where this mission is going and what state it is in now. Comparing the two lets you pin a curious photograph to one specific mission.",
      },
      terms: [{ b: 'astro', k: 'period' }],
    },
  ],

  'astro.comet': [
    {
      to: 'astro.deep',
      why: {
        'zh-CN': '彗星是太阳系自己的化石，深空页签看的是别的行星系统，两者同属起源问题',
        en: "Comets are the solar system's own fossils, while the Deep Sky tab looks at other planetary systems — both belong to the question of origins",
      },
      detail: {
        'zh-CN': '深空页签给的是系外行星与星系的统计图景（远、大、多数），小天体档案给的是太阳系形成残余的实物参数（近、小、少数）。两类对象回答同一个问题的不同侧面：行星系统的物质从哪来、怎么演化。彗星保留着 46 亿年前的原初挥发分，是唯一能被直接采样的那一类物质。',
        en: 'The Deep Sky tab offers a statistical picture of exoplanets and galaxies (far, large, numerous), while the small-body archive gives the physical parameters of the leftovers of solar-system formation (near, small, few). The two kinds of objects answer different sides of the same question: where does the material of planetary systems come from and how does it evolve. Comets retain primordial volatiles from 4.6 billion years ago and are the only such material we can sample directly.',
      },
      terms: [{ b: 'astro', k: 'period' }],
    },
    {
      to: 'astro.approach',
      why: {
        'zh-CN': '同一批小天体的两种读法：这里看轨道要素，近地交会按掠地距离排序',
        en: 'Two ways of reading the same population: orbital elements here, close approaches sorted by miss distance there',
      },
      detail: {
        'zh-CN': '轨道要素决定了一颗小天体会不会接近地球：近日距小于 1 AU、远日距略大于 1 AU 的轨道，才有可能与地球轨道相交。所以「会不会掠地」这件事，答案就写在近日距与远日距这两个数里——先看要素表，再看交会清单，因果关系就通了。',
        en: "Orbital elements determine whether a small body can approach Earth: only an orbit with perihelion below 1 AU and aphelion slightly above 1 AU can intersect Earth's orbit. So the answer to whether it will make a close approach is written in just two numbers, perihelion and aphelion — read the elements table first, then the close-approach list, and the causal chain becomes clear.",
      },
      terms: [{ b: 'astro', k: 'au' }, { b: 'astro', k: 'distLunar' }],
    },
    {
      to: 'astro.launch',
      why: {
        'zh-CN': '表里多个小天体是人类探测器专程造访过的目标，发射页签能看到现在的任务排期',
        en: 'Several objects in this table have been visited by dedicated spacecraft; the Space Launches tab shows the current mission schedule',
      },
      detail: {
        'zh-CN': '隼鸟、隼鸟 2 号、罗塞塔、OSIRIS-REx 等任务把小天体从望远镜里的一个光点，变成有直径、有反照率、甚至被采样带回的实体。表里那些直径实测值正是这么来的。想知道下一发飞向小天体的是哪枚火箭，看发射页签。',
        en: 'Missions such as Hayabusa, Hayabusa2, Rosetta and OSIRIS-REx turned small bodies from a point of light in a telescope into real objects with a measured diameter, an albedo, and in some cases a returned sample. The measured diameters in this table came from exactly those missions. To find out which rocket will next head for a small body, look at the Space Launches tab.',
      },
      terms: [{ b: 'astro', k: 'diameter' }],
    },
  ],
  'astro.approach': [
    {
      to: 'astro.comet',
      why: {
        'zh-CN': '交会是结果、轨道要素是原因：这里按掠地距离排序，原因写在小天体档案里',
        en: 'Close approaches are the result, orbital elements the cause: sorted here by miss distance, the cause is written in the small-body archive',
      },
      detail: {
        'zh-CN': '近地交会清单上的每个编号，背后都有一组轨道要素决定它为什么会来、多久再来一次。交会表看的是「什么时候最近」，要素表看的是「为什么是它」。两个方向合起来才构成完整的小天体监测链条。',
        en: 'Behind every designation on the close-approach list lies a set of orbital elements that determines why it comes and how often it returns. The approach table asks when it is closest, the elements table asks why this one. Only the two directions together make up the complete small-body monitoring chain.',
      },
      terms: [{ b: 'astro', k: 'au' }, { b: 'astro', k: 'inclination' }],
    },
    {
      to: 'astro.solar',
      why: {
        'zh-CN': '掠地小行星是太阳系小天体族群的一部分，太阳系页签给出它与行星的空间关系',
        en: "Earth-approaching asteroids are part of the solar system's small-body population, and the Solar System tab shows their spatial relationship with the planets",
      },
      detail: {
        'zh-CN': '多数近地天体来自火星与木星之间的主带，受引力扰动后进入与地球交叉的轨道。太阳系页签的行星位置图能帮助理解这些轨道在空间里怎么分布、为什么主带天体会被引力「踢」到内太阳系来。',
        en: "Most near-Earth objects come from the main belt between Mars and Jupiter and enter Earth-crossing orbits after gravitational perturbation. The planet-position diagram on the Solar System tab helps you see how these orbits are distributed in space and why main-belt objects get gravitationally kicked into the inner solar system.",
      },
      terms: [{ b: 'astro', k: 'au' }],
    },
    {
      to: 'geo.volcano',
      why: {
        'zh-CN': '都是小概率高后果、需要长期持续监测的事件，监测思路相通',
        en: 'Both are low-probability, high-consequence events requiring sustained long-term monitoring, and the monitoring philosophy is the same',
      },
      detail: {
        'zh-CN': '近地天体靠巡天编目与轨道精测来压低不确定性，火山与海啸靠台网与浮标实时监测。共同点是：都很难预测到具体某一天，但都必须尽可能提前预警——前者的不确定度随时间收敛，后者则靠前兆异常识别。',
        en: 'Near-Earth objects are handled by survey cataloguing and precise orbit determination to shrink the uncertainty; volcanoes and tsunamis by station networks and buoys for real-time monitoring. The common point: neither can be predicted to a specific day, yet both must be warned about as early as possible — in the former case the uncertainty converges with time, in the latter the warning relies on recognising precursory anomalies.',
      },
      terms: [{ b: 'earth', k: 'volcanoAlert' }],
    },
  ],
  'astro.observe': [
    {
      to: 'astro.sky',
      why: {
        'zh-CN': '今晚星空算的是天体在哪，这里给的是云让不让你看，合起来才决定今晚出不出门',
        en: "Tonight's Sky computes where the objects are; this tab tells you whether the cloud lets you see them — together they decide whether you go out tonight",
      },
      detail: {
        'zh-CN': '观测条件 = 几何 × 大气。行星合月、流星雨极大这些「天时」由今晚星空页签给出；云量与能见度决定这些天时能不能兑现。需要提醒的是：本页评分只反映大气，不含月相与光污染——满月时天光本底很亮，评分 100 也看不到暗弱星云。',
        en: 'Observing conditions = geometry × atmosphere. The heavenly timing of events such as a planet–Moon conjunction or a meteor-shower maximum comes from Tonight\'s Sky; cloud cover and visibility decide whether that timing can be cashed in. One caveat: the score on this tab reflects the atmosphere only and excludes lunar phase and light pollution — at full moon the sky background is bright, and even a score of 100 will not show you a faint nebula.',
      },
      terms: [{ b: 'astro', k: 'moonPhase' }, { b: 'astro', k: 'magnitude' }],
    },
    {
      to: 'geo.weather',
      why: {
        'zh-CN': '两个页签打的是同一个 Open-Meteo 源，一个取云量能见度，一个取温度风雨',
        en: 'Both tabs draw on the same Open-Meteo source: one takes cloud cover and visibility, the other temperature, wind and rain',
      },
      detail: {
        'zh-CN': '同一份实况数据，观星关心的是云量与能见度（大气透明度），城市天气关心的是温度降水与风。并排看能解释一个常见现象：正在下雨的城市，观星评分通常也接近 0——这不是巧合，是同一份数据的两种投影。',
        en: 'From the same set of current conditions, stargazing cares about cloud cover and visibility (atmospheric transparency), while city weather cares about temperature, precipitation and wind. Viewed side by side, this explains a common observation: a city that is raining usually also scores close to 0 for stargazing — not a coincidence, but two projections of the same data.',
      },
      terms: [{ b: 'astro', k: 'sunlit' }],
    },
    {
      to: 'geo.air',
      why: {
        'zh-CN': '空气质量差意味着气溶胶多，即便无云，星点也会发糊、天空底色发亮',
        en: 'Poor air quality means more aerosol: even with no cloud, star images blur and the sky background brightens',
      },
      detail: {
        'zh-CN': 'PM2.5 浓度高时大气透明度显著下降，肉眼可见的极限星等随之降低，深空天体最先消失。所以空气质量页签的读数可以当作观星评分的补充参考——AQI 爆表的城市，大气条件通常也好不了。',
        en: 'When PM2.5 concentration is high, atmospheric transparency drops noticeably, the naked-eye limiting magnitude falls with it, and deep-sky objects are the first to disappear. So the readings on the Air Quality tab work as a supplementary reference for the observing score — a city with an off-the-scale AQI rarely has good atmospheric conditions either.',
      },
      terms: [{ b: 'earth', k: 'aqi' }],
    },
  ],

  /* ---------- 地球 ---------- */
  'geo.quake': [
    {
      to: 'geo.volcano',
      why: {
        'zh-CN': '地震与火山同受板块运动驱动；海底强震还是海啸的主要触发源',
        en: 'Earthquakes and volcanoes are both driven by plate motion; strong submarine earthquakes are also the main trigger of tsunamis',
      },
      detail: {
        'zh-CN': '全球约 90% 的地震和 75% 的活火山都落在板块边界上，本质上是同一套构造运动的两种表现。判别海啸风险时，震源深度比震级更关键：浅源（< 70 km）海底大震能把海底整块抬升，把水体一起推起来；深源地震能量传到海床已大幅衰减，几乎不产生海啸。',
        en: 'About 90% of the world’s earthquakes and 75% of its active volcanoes lie on plate boundaries — in essence two expressions of the same tectonic motion. When judging tsunami risk, focal depth matters more than magnitude: a shallow (less than 70 km) great submarine earthquake can uplift the seafloor as a block and push the water column with it, whereas the energy of a deep event has largely attenuated by the time it reaches the seabed and generates almost no tsunami.',
      },
      terms: [{ b: 'earth', k: 'depth' }, { b: 'earth', k: 'plateBoundary' }, { b: 'earth', k: 'tsunami' }],
    },
    {
      to: 'ocean.buoy',
      why: {
        'zh-CN': '海啸预警依赖 DART 深海压力浮标，与地震速报是同一条链',
        en: 'Tsunami warning depends on deep-ocean DART pressure buoys — the same chain as the earthquake bulletin',
      },
      detail: {
        'zh-CN': '完整链条是：地震台网几十秒内定出震级与位置 → 判断是否有海啸潜力 → 深海外由 DART 浮标实测水位异常来确认「到底有没有生成海啸」→ 发布或解除警报。地震速报只是第一环，DART 是唯一能在海啸抵达海岸前给出实测确认的手段，避免仅凭震级就误报。',
        en: 'The full chain is: seismic networks determine magnitude and location within tens of seconds, then assess tsunami potential, then in the deep ocean DART buoys measure the water-level anomaly to confirm whether a tsunami was actually generated, and finally the warning is issued or cancelled. The earthquake bulletin is only the first link; DART is the only means of giving measured confirmation before the tsunami reaches the coast, which prevents false alarms based on magnitude alone.',
      },
      terms: [{ b: 'earth', k: 'buoy' }, { b: 'earth', k: 'tsunamiSpeed' }],
    },
    {
      to: 'geo.eonet',
      why: {
        'zh-CN': 'EONET 把地震与火灾、风暴等并列为自然事件',
        en: 'EONET lists earthquakes alongside fires, storms and other natural events',
      },
      detail: {
        'zh-CN': 'EONET 的价值在于「同一时间轴上并列不同灾害」。一次强震往往伴随次生灾害（滑坡、火灾、海啸），单看地震目录看不到全貌；EONET 把 NASA 多颗卫星观测到的事件归到统一条目下，适合做复合事件的时间线复盘。',
        en: 'The value of EONET lies in placing different hazards side by side on one timeline. A strong earthquake is often accompanied by secondary disasters (landslides, fires, tsunamis) that a pure earthquake catalogue never shows; EONET gathers events observed by multiple NASA satellites into unified entries, which suits timeline reviews of compound events.',
      },
      terms: [{ b: 'earth', k: 'magnitude' }],
    },
    {
      to: 'ocean.tide',
      why: {
        'zh-CN': '潮汐与地震的触发关系有长期统计争议，但海啸危害确实与潮位叠加',
        en: 'The tidal triggering of earthquakes is a long-standing statistical controversy, but tsunami damage does compound with tide level',
      },
      detail: {
        'zh-CN': '「潮汐触发地震」至今是弱效应、有争议的课题（相关系数很小），不要把单次地震归因于大潮。真正确定的是另一侧：海啸抵达时的天文潮位决定了淹没范围——2011 年日本海啸在部分岸段恰逢高潮位，实际水位比天文潮低时高出数米。所以潮汐页签对地震的意义在减灾，不在预测。',
        en: 'Earthquakes triggered by tides remains a weak and contested effect (the correlation coefficient is tiny), so do not attribute a single earthquake to a spring tide. What is firmly established is the other side: the astronomical tide level when a tsunami arrives determines the inundation extent — in the 2011 Japan tsunami, some coastal segments happened to be at high tide, and the actual water level was several metres higher than it would have been at low astronomical tide. So the Tides tab matters to earthquakes for mitigation, not for prediction.',
      },
      terms: [{ b: 'earth', k: 'tsunami' }, { b: 'earth', k: 'tideLevel' }],
    },
    {
      to: 'ocean.cyclone',
      why: {
        'zh-CN': '台风过境与慢滑移事件的相关性是被实测记录到的真实关联',
        en: 'The correlation between typhoon passage and slow-slip events is a real association recorded by observations',
      },
      detail: {
        'zh-CN': '台湾与日本的记录显示：台风经过时气压骤降会降低海底的正应力，可触发慢地震（低频滑移事件），这类事件在应变与 GPS 记录里清晰可见。它释放的是缓慢的无震滑移，与破坏性地震不同。这条关联说明的是观测事实，不代表台风能「引发」大地震——不要外推。',
        en: 'Records from Taiwan and Japan show that the sharp pressure drop as a typhoon passes reduces the normal stress on the seafloor and can trigger slow earthquakes (low-frequency slip events), which are clearly visible in strain and GPS records. What is released is slow aseismic slip, different from a destructive earthquake. This relation documents an observational fact; it does not mean a typhoon can cause a major earthquake — do not extrapolate.',
      },
      terms: [{ b: 'earth', k: 'pressure' }, { b: 'earth', k: 'magnitude' }],
    },
  ],
  'geo.epic': [
    {
      to: 'geo.climate',
      why: {
        'zh-CN': '整圆盘影像里的云量、气溶胶正是气候变化的观测面',
        en: 'The cloud cover and aerosols in the full-disk imagery are precisely the observables of climate change',
      },
      detail: {
        'zh-CN': 'EPIC 一天拍十几次全昼面，能看出云系分布、沙尘输送、烟羽跨洋传输。这些短时过程累加起来才构成气候页签里的长期量：气溶胶直接辐射强迫、云反馈、反照率变化。看影像是在看「过程」，看气候曲线是在看「结果」。',
        en: 'EPIC photographs the entire dayside a dozen-odd times a day, revealing cloud-system distribution, dust transport and the transoceanic transport of smoke plumes. These short-lived processes accumulate into the long-term quantities on the Surface & Climate tab: aerosol direct radiative forcing, cloud feedback and albedo change. Looking at imagery is looking at the process; looking at the climate curves is looking at the result.',
      },
      terms: [{ b: 'earth', k: 'tempAnomaly' }, { b: 'earth', k: 'albedoFeedback' }],
    },
    {
      to: 'geo.eonet',
      why: {
        'zh-CN': '影像中可见的烟羽、沙尘对应 EONET 的火灾与沙尘暴事件',
        en: 'The smoke plumes and dust visible in the imagery correspond to EONET fire and dust-storm events',
      },
      detail: {
        'zh-CN': 'EPIC 影像里横扫大洋的褐色羽流，通常能在 EONET 里找到对应的野火或沙尘暴条目。影像给的是直观证据（看得到），EONET 给的是结构化记录（可检索、有时间范围），两者对照才能确认「那团东西是什么、从哪来、持续多久」。',
        en: 'The brown plumes sweeping across an ocean in EPIC imagery can usually be matched to a wildfire or dust-storm entry in EONET. Imagery gives direct evidence (you can see it); EONET gives a structured record (searchable, with a time range). Only by comparing the two can you establish what that patch of material is, where it came from and how long it lasted.',
      },
      terms: [{ b: 'earth', k: 'aqi' }],
    },
    {
      to: 'astro.sun',
      why: {
        'zh-CN': '拍摄平台 DSCOVR 同时是太阳风实时监测站',
        en: 'The imaging platform, DSCOVR, is also a real-time solar-wind monitoring station',
      },
      detail: {
        'zh-CN': 'DSCOVR 停在日地 L1 点，是全人类唯一能在太阳风抵达地球前约 15–60 分钟测到它的哨位。所以它拍的地球影像和太阳风读数天然同源：同一颗星、同一时刻、互为上下游。看到太阳风读数跳变时，EPIC 影像就是那次事件「地球侧」的同步画面。',
        en: 'DSCOVR sits at the Sun–Earth L1 point, the only vantage from which humanity can measure the solar wind about 15–60 minutes before it reaches Earth. So the Earth imagery it takes and the solar-wind readings it returns are naturally from the same source: one spacecraft, one moment, upstream and downstream of each other. When the solar-wind readings jump, the EPIC image is the synchronous Earth-side view of that event.',
      },
      terms: [{ b: 'astro', k: 'wind' }, { b: 'astro', k: 'bz' }],
    },
    {
      to: 'astro.sky',
      why: {
        'zh-CN': '影像里的晨昏线就是日出日落的位置，与观星的昏影时刻同源',
        en: 'The terminator in the imagery marks where sunrise and sunset are — the same geometry as twilight times for stargazing',
      },
      detail: {
        'zh-CN': '整圆盘影像最醒目的那条明暗分界就是晨昏线。它的位置由太阳直射点决定，与「你所在位置几点天黑」是同一套几何：天文昏影结束（太阳在地平下 18°）才是深空摄影的开始。所以 EPIC 影像能告诉你地球这一侧现在是白天还是黑夜，而今晚星空告诉你什么时候足够黑。',
        en: 'The most striking feature of a full-disk image, the boundary between light and dark, is the terminator. Its position is set by the subsolar point and is the same geometry that answers what time it gets dark where you are: only when astronomical twilight ends (Sun 18 degrees below the horizon) can deep-sky imaging begin. So EPIC imagery tells you which side of Earth is in day or night right now, while Tonight\'s Sky tells you when it will be dark enough.',
      },
      terms: [{ b: 'astro', k: 'sunlit' }, { b: 'astro', k: 'altitude' }],
    },
    {
      to: 'geo.volcano',
      why: {
        'zh-CN': '大喷发的火山灰与 SO₂ 羽流在整圆盘影像里肉眼可见',
        en: 'Ash and SO₂ plumes from large eruptions are visible to the naked eye in full-disk imagery',
      },
      detail: {
        'zh-CN': '大型喷发会把火山灰与二氧化硫送进平流层，形成可跨洋输送的羽流，在整圆盘影像里表现为一条灰白色的带子。2019 年 Raikoke、2022 年 Hunga Tonga 的羽流都被清楚记录。影像告诉你「烟飘到哪」，火山页签告诉你「源头是谁、警报几级」——两者合起来才算完整事件。',
        en: 'A large eruption injects ash and sulfur dioxide into the stratosphere, forming a plume that can be transported across oceans and appears in full-disk imagery as a grey-white band. The plumes from Raikoke in 2019 and Hunga Tonga in 2022 were both clearly recorded. The imagery tells you where the smoke has drifted; the Volcanoes & Tsunamis tab tells you which volcano it came from and what alert level it carries — only together do they make a complete event.',
      },
      terms: [{ b: 'earth', k: 'aviationColor' }, { b: 'earth', k: 'volcanoAlert' }],
    },
  ],
  'geo.eonet': [
    {
      to: 'geo.quake',
      why: {
        'zh-CN': '地震是 EONET 追踪的自然事件之一',
        en: 'Earthquakes are one of the natural events tracked by EONET',
      },
      detail: {
        'zh-CN': 'EONET 的事件覆盖面比地震目录宽得多（野火、风暴、火山、沙尘、洪水、冰山）。用它做「今天地球上发生了什么」的总览，再用地震页签做深度钻取，是这套看板最顺手的读法。',
        en: 'EONET covers a far wider range of events than an earthquake catalogue (wildfires, storms, volcanoes, dust, floods, icebergs). Using it as an overview of what happened on Earth today and then drilling down with the Earth\'s Pulse tab is the most natural way to read these dashboards.',
      },
      terms: [{ b: 'earth', k: 'magnitude' }],
    },
    {
      to: 'geo.volcano',
      why: {
        'zh-CN': '火山喷发与海啸同在 EONET 事件清单里',
        en: 'Volcanic eruptions and tsunamis are both on the EONET event list',
      },
      detail: {
        'zh-CN': 'EONET 的火山条目来自卫星观测（热异常、SO₂ 烟羽），而火山页签用的是 USGS 地面台网的警报级别。两套体系角度不同：卫星看「喷了什么、飘到哪」，地面看「当地威胁等级」。两者不一致时通常意味着喷发规模大但人口稀少，或反之。',
        en: 'EONET volcano entries come from satellite observations (thermal anomalies, SO₂ plumes), while the Volcanoes & Tsunamis tab uses alert levels from USGS ground networks. The two systems take different angles: satellites see what was erupted and where it drifted, ground networks see the local threat level. When the two disagree it usually means the eruption is large but in an unpopulated area, or the reverse.',
      },
      terms: [{ b: 'earth', k: 'volcanoAlert' }, { b: 'earth', k: 'aviationColor' }],
    },
    {
      to: 'geo.climate',
      why: {
        'zh-CN': '干旱、野火等事件与气候长期趋势互为因果',
        en: 'Events such as drought and wildfire and long-term climate trends are mutually causative',
      },
      detail: {
        'zh-CN': '气候页签给出的是缓慢上升的背景态（温度距平 +1.2 °C、海冰下降），EONET 给出的是叠在这个背景上的极端事件。背景每升高一点，极端事件的频率不是线性增加而是尾部变厚——少数几度的高温区会成倍放大火险天数。',
        en: 'The Surface & Climate tab gives the slowly rising background state (temperature anomaly +1.2 °C, declining sea ice); EONET gives the extreme events superimposed on that background. As the background rises a little, the frequency of extremes does not increase linearly — the tail of the distribution thickens: a few degrees of extra heat multiply the number of high fire-danger days.',
      },
      terms: [{ b: 'earth', k: 'tempAnomaly' }, { b: 'earth', k: 'seaIceExtent' }],
    },
    {
      to: 'ocean.cyclone',
      why: {
        'zh-CN': '热带气旋是 EONET 追踪的高影响事件之一，与气旋页签互为补充',
        en: 'Tropical cyclones are among the high-impact events tracked by EONET and complement the Tropical Cyclones tab',
      },
      detail: {
        'zh-CN': 'EONET 的风暴条目来自卫星观测（覆盖范围广、更新频率低），气旋页签来自 NHC 的业务预报（路径与强度有明确预报时效）。前者适合看「过去一周全球有哪些风暴」，后者适合看「这一场接下来会去哪」。做复盘用 EONET，做当下决策用气旋页签。',
        en: 'EONET storm entries come from satellite observation (wide coverage, low update frequency), while the Tropical Cyclones tab carries NHC operational forecasts (with explicit track and intensity forecast periods). The former suits which storms occurred worldwide in the past week; the latter suits where this one will go next. Use EONET for reviews and the cyclone tab for decisions in the moment.',
      },
      terms: [{ b: 'earth', k: 'cycloneClass' }, { b: 'earth', k: 'saffir' }],
    },
    {
      to: 'ocean.buoy',
      why: {
        'zh-CN': '风暴与洪水事件期间，浮标给出的是唯一的原位实测',
        en: 'During storms and floods, buoys provide the only in-situ measurements',
      },
      detail: {
        'zh-CN': '卫星能看出风暴的范围与云系，但测不到海面上的真实风速、气压、浪高。浮标补的正是这一层原位数据。风暴警报发出后判断「实际有多严重」，靠的是浮标记录而非卫星影像——影像看形态，浮标看数值。',
        en: 'Satellites can show the extent and cloud structure of a storm, but they cannot measure the true wind speed, pressure and wave height at the sea surface. Buoys supply exactly that layer of in-situ data. Once a storm warning is issued, judging how bad it actually is depends on buoy records rather than satellite imagery — imagery shows the shape, buoys show the numbers.',
      },
      terms: [{ b: 'earth', k: 'buoy' }, { b: 'earth', k: 'pressure' }],
    },
  ],
  'geo.volcano': [
    {
      to: 'geo.quake',
      why: {
        'zh-CN': '海底强震是海啸主要触发源，火山喷发也可触发；两者共享地震台网',
        en: 'Strong submarine earthquakes are the main tsunami trigger and eruptions can trigger them too; both share the seismic network',
      },
      detail: {
        'zh-CN': 'USGS 的火山警报与地震目录共用同一套台网与速报流程，所以火山页签的「近期地震活动」与地震页签同源。判断一次火山动荡是否会升级，地震频次与震群迁移是最可靠的先行指标——远早于地表可见的变化。',
        en: 'USGS volcano alerts and the earthquake catalogue share the same station network and the same rapid-reporting workflow, so the recent seismic activity on the Volcanoes & Tsunamis tab has the same source as the Earth\'s Pulse tab. In judging whether volcanic unrest will escalate, earthquake frequency and swarm migration are the most reliable leading indicators — far earlier than any change visible at the surface.',
      },
      terms: [{ b: 'earth', k: 'volcanoAlert' }, { b: 'earth', k: 'depth' }],
    },
    {
      to: 'ocean.buoy',
      why: {
        'zh-CN': '海啸波经过时由 DART 浮标实测水位异常，是预警的地面真值',
        en: 'DART buoys measure the water-level anomaly as a tsunami wave passes — the ground truth for warnings',
      },
      detail: {
        'zh-CN': 'DART 浮标坐沉在深海（常达数千米），用海底压力计测上方水柱重量的微小变化——海啸波经过时，几厘米的水位变化就能被分辨出来。它测得的是「开阔大洋里的真实波高」，通常只有几十厘米，但这几十厘米抵达浅海后会被放大成数米。千万别用深海外波高去想象岸上的破坏。',
        en: 'A DART buoy sits on the deep seafloor (often several kilometres down) and uses a bottom pressure recorder to measure tiny changes in the weight of the water column above: as a tsunami wave passes, a water-level change of a few centimetres can be resolved. What it measures is the true wave height in the open ocean, usually only a few tens of centimetres — but those tens of centimetres are amplified into several metres once they reach shallow water. Never use the open-ocean wave height to imagine the destruction on shore.',
      },
      terms: [{ b: 'earth', k: 'buoy' }, { b: 'earth', k: 'tsunamiSpeed' }],
    },
    {
      to: 'geo.eonet',
      why: {
        'zh-CN': 'EONET 独立追踪火山事件，可与 USGS 警报交叉验证',
        en: 'EONET tracks volcanic events independently and can be cross-checked against USGS alerts',
      },
      detail: {
        'zh-CN': '两套数据源独立：USGS 依赖地面台网与当地观测员，EONET 依赖卫星热异常与气溶胶。偏远火山（如南太平洋岛链）常常是卫星先发现——地面台网稀疏的地方，EONET 反而是更早的那一环。',
        en: 'The two data sources are independent: USGS relies on ground networks and local observers, EONET on satellite thermal anomalies and aerosols. Remote volcanoes (for instance those on South Pacific island chains) are often detected by satellite first — where ground networks are sparse, EONET is the earlier link in the chain.',
      },
      terms: [{ b: 'earth', k: 'aviationColor' }],
    },
    {
      to: 'geo.climate',
      why: {
        'zh-CN': '大喷发把硫酸盐气溶胶送进平流层，会造成 1–2 年的全球降温',
        en: 'Large eruptions inject sulfate aerosol into the stratosphere, causing one to two years of global cooling',
      },
      detail: {
        'zh-CN': '这是火山对气候最确定的影响路径：SO₂ 在平流层转成硫酸盐气溶胶，反射入射阳光，地表降温而平流层升温。1991 年皮纳图博喷发后全球平均气温下降了约 0.5 °C，持续近两年。所以气候页签的温度距平曲线上，大喷发后的凹陷是真实信号，不是数据噪声。',
        en: 'This is the best-established pathway by which volcanoes affect climate: SO₂ is converted in the stratosphere into sulfate aerosol, which reflects incoming sunlight, cooling the surface while warming the stratosphere. After the 1991 Pinatubo eruption, global mean temperature fell by about 0.5 °C and stayed depressed for nearly two years. So the dip after a large eruption in the temperature-anomaly curve on the Surface & Climate tab is a real signal, not data noise.',
      },
      terms: [{ b: 'earth', k: 'tempAnomaly' }, { b: 'earth', k: 'volcanoAlert' }],
    },
    {
      to: 'geo.epic',
      why: {
        'zh-CN': '火山灰羽流的跨洋输送在整圆盘影像里看得最直观',
        en: 'The transoceanic transport of ash plumes is most directly visible in full-disk imagery',
      },
      detail: {
        'zh-CN': '火山页签给的是源头状态（警报级别、航空色码），EPIC 影像给的是扩散结果：灰羽往哪个方向飘、覆盖多大范围、几天后被稀释。航空安全的决策依据（禁飞区）正是这两者的结合——没有影像，你只知道「喷了」；有了影像，才知道「哪条航线要绕」。',
        en: 'The Volcanoes & Tsunamis tab gives the state at the source (alert level, aviation colour code); EPIC imagery gives the dispersal result: which way the ash plume drifts, how large an area it covers, and after how many days it dilutes. Aviation-safety decisions (no-fly zones) rest on combining the two — without imagery you only know that it erupted; with imagery you know which routes must be diverted.',
      },
      terms: [{ b: 'earth', k: 'aviationColor' }, { b: 'earth', k: 'aqi' }],
    },
  ],
  'geo.climate': [
    {
      to: 'ocean.oni',
      why: {
        'zh-CN': '全球温度距平的一半在海洋：海温距平与 ENSO 是同一枚硬币',
        en: 'Half of the global temperature anomaly lies in the ocean: sea-temperature anomaly and ENSO are two sides of the same coin',
      },
      detail: {
        'zh-CN': '海洋吸收了气候系统 90% 以上的多余热量，所以全球温度距平曲线里「海温部分」占了一半权重。ENSO 是年际波动的最大单一来源：强厄尔尼诺年能把全球均温顶高 0.1–0.2 °C，拉尼娜年则压低。看任何一年的温度距平时，先问当年 ENSO 是什么相位——否则会把一次波动误读成趋势加速。',
        en: 'The ocean absorbs more than 90% of the excess heat in the climate system, so the ocean part carries about half the weight in the global temperature-anomaly curve. ENSO is the largest single source of interannual variability: a strong El Niño year can push the global mean up by 0.1–0.2 °C, while La Niña pulls it down. Before reading any single year of temperature anomaly, ask what phase ENSO was in that year — otherwise you will mistake one fluctuation for an acceleration of the trend.',
      },
      terms: [{ b: 'earth', k: 'oni' }, { b: 'earth', k: 'ssta' }, { b: 'earth', k: 'tempAnomaly' }],
    },
    {
      to: 'ocean.buoy',
      why: {
        'zh-CN': '浮标实测海表温度是全球海温序列的现场校验点',
        en: 'Buoy-measured sea-surface temperature is the in-situ validation point for global SST series',
      },
      detail: {
        'zh-CN': '卫星反演的海表温度覆盖范围广但有系统偏差（云、气溶胶、皮肤层效应），浮标的原位测量是订正这些偏差的锚点。两者长期差通常在零点几摄氏度内，一旦某片海域系统性偏离，往往意味着反演算法或浮标传感器出了问题。',
        en: 'Satellite-retrieved SST has broad coverage but systematic biases (cloud, aerosol, skin-layer effects); in-situ buoy measurements are the anchor used to correct them. The long-term difference between the two is usually within a few tenths of a degree Celsius — if a region deviates systematically, it usually means something is wrong with the retrieval algorithm or with a buoy sensor.',
      },
      terms: [{ b: 'earth', k: 'sst' }, { b: 'earth', k: 'buoy' }],
    },
    {
      to: 'astro.sun',
      why: {
        'zh-CN': '太阳辐照是气候自然强迫项，解读升温时要与温室气体区分',
        en: 'Solar irradiance is a natural climate forcing and must be distinguished from greenhouse gases when interpreting warming',
      },
      detail: {
        'zh-CN': '常见的误解是「变暖是太阳周期造成的」。量化对比很干脆：太阳 11 年周期的辐射强迫约 0.05 W/m²，温室气体约 2.7 W/m²，相差约五十倍。而且 1980 年以来太阳总辐照实际略有下降，同期温度却持续上升——方向与归因都不支持太阳主导说。',
        en: 'A common misconception is that the warming is caused by the solar cycle. The quantitative comparison is blunt: the radiative forcing of the 11-year solar cycle is about 0.05 W/m², that of greenhouse gases about 2.7 W/m² — a factor of about fifty. Moreover, total solar irradiance has actually declined slightly since 1980 while temperature kept rising: neither the sign nor the attribution supports a solar-dominated explanation.',
      },
      terms: [{ b: 'earth', k: 'tempAnomaly' }, { b: 'astro', k: 'solarCycle' }],
    },
    {
      to: 'geo.epic',
      why: {
        'zh-CN': '云量、气溶胶、冰雪反照率这些气候变量，都要靠整圆盘影像来观测',
        en: 'Climate variables such as cloud cover, aerosols and ice/snow albedo all rely on full-disk imagery for observation',
      },
      detail: {
        'zh-CN': '气候页签的数字背后是卫星观测，而 EPIC 提供的是同一套观测的直观形态：云系如何分布、沙尘与烟羽如何跨洋输送、极地冰盖边缘在哪。看到温度距平曲线上某段异常时，回影像看那几天的云量与气溶胶，常能判断是观测问题还是真实变化。',
        en: 'Behind the numbers on the Surface & Climate tab lies satellite observation, and EPIC provides the intuitive form of that same observation: how cloud systems are distributed, how dust and smoke plumes cross oceans, where the polar ice-sheet edge lies. When a segment of the temperature-anomaly curve looks anomalous, going back to the imagery to check cloud cover and aerosols for those days often tells you whether it is an observational artefact or a real change.',
      },
      terms: [{ b: 'earth', k: 'albedoFeedback' }, { b: 'earth', k: 'seaIceExtent' }],
    },
    {
      to: 'ocean.cyclone',
      why: {
        'zh-CN': '暖海面是气旋的能量来源，海温升高直接影响强气旋的比例',
        en: 'A warm sea surface is the energy source of cyclones; rising SST directly affects the proportion of intense cyclones',
      },
      detail: {
        'zh-CN': '热带气旋本质上是把海洋热量转成风的热机，海表温度高于约 26.5 °C 是生成的必要条件。观测显示近几十年强气旋（4–5 级）占比上升、总频数未必增加。所以气候变暖对气旋的影响更可能表现为「强度分布右移」而非「数量变多」——这是个容易被媒体讲错的细节。',
        en: 'A tropical cyclone is essentially a heat engine that converts ocean heat into wind; SST above about 26.5 °C is a necessary condition for genesis. Observations show that in recent decades the proportion of intense cyclones (Category 4–5) has risen while the total count has not necessarily increased. So the effect of warming on cyclones shows up more as the intensity distribution shifting right than as more of them — a detail the media frequently get wrong.',
      },
      terms: [{ b: 'earth', k: 'sst' }, { b: 'earth', k: 'saffir' }],
    },
  ],

  'geo.air': [
    {
      to: 'geo.weather',
      why: {
        'zh-CN': '风把污染物吹散、雨把颗粒物洗下来，天气是空气质量最直接的驱动因素',
        en: 'Wind disperses pollutants and rain washes particles out — weather is the most direct driver of air quality',
      },
      detail: {
        'zh-CN': '同样的排放量下，静稳天气（风速小、湿度高、有逆温层）会让 PM2.5 在几小时内累积成重污染；一场雨或一阵大风则能把浓度降一个量级。所以看 AQI 时一定要同时看风：数值高低往往不是排放变了，而是扩散条件变了。',
        en: 'For the same emissions, stable weather (light wind, high humidity, a temperature inversion) lets PM2.5 build into heavy pollution within hours; a shower or a strong wind can drop the concentration by an order of magnitude. So when reading AQI you must look at the wind as well: high or low values usually reflect changed dispersion conditions, not changed emissions.',
      },
      terms: [{ b: 'earth', k: 'aqi' }],
    },
    {
      to: 'astro.observe',
      why: {
        'zh-CN': '颗粒物多寡决定大气透明度，是观星评分里能见度那一项的物理来源',
        en: 'The amount of particulate matter determines atmospheric transparency — the physical source of the visibility term in the observing score',
      },
      detail: {
        'zh-CN': 'PM2.5 与气溶胶光学厚度正相关，浓度高时地面看到的天空更亮、星点更糊。观星评分里的「能见度」本质上就是被这些颗粒物压低的。两个页签对照，能解释为什么重污染天即便万里无云，也拍不到深空天体。',
        en: 'PM2.5 correlates positively with aerosol optical depth: at high concentration the sky seen from the ground is brighter and star images blurrier. The visibility term in the observing score is essentially what these particles depress. Comparing the two tabs explains why, on a heavily polluted day, deep-sky objects cannot be imaged even under a cloudless sky.',
      },
      terms: [{ b: 'earth', k: 'pm25' }],
    },
    {
      to: 'geo.climate',
      why: {
        'zh-CN': '温室气体是全球长期背景值，PM2.5 是局地短期量，两者时间空间尺度完全不同',
        en: 'Greenhouse gases are a global long-term background quantity while PM2.5 is local and short-lived; their temporal and spatial scales are entirely different',
      },
      detail: {
        'zh-CN': 'CO₂ 在全球均匀混合、存留上百年，浓度只缓慢上升；PM2.5 生命期只有几天，浓度随城市与天气剧烈波动。把两者分开看，才能理解为什么减碳是跨越几十年的工程，而一次重污染却能靠几天的应急减排明显缓解。',
        en: 'CO₂ is well mixed globally and persists for a century, so its concentration only rises slowly; PM2.5 has a lifetime of just days and its concentration swings sharply with city and weather. Keeping the two separate explains why decarbonisation is a project spanning decades, while a single heavy-pollution episode can be visibly relieved by a few days of emergency emission cuts.',
      },
      terms: [{ b: 'earth', k: 'tempAnomaly' }],
    },
  ],
  'geo.weather': [
    {
      to: 'geo.air',
      why: {
        'zh-CN': '风的输送与降水的冲刷决定污染物浓度，是空气质量的驱动变量',
        en: 'Transport by wind and scavenging by precipitation determine pollutant concentration — the driving variables of air quality',
      },
      detail: {
        'zh-CN': '风速决定污染物被稀释的速率，降水决定湿清除的强度，湿度影响颗粒物吸湿增长。这三项都在这张卡上。所以天气页签不只是「穿什么」的参考，它同时解释了空气质量页签上那些数字为什么会变。',
        en: 'Wind speed determines the rate at which pollutants are diluted, precipitation determines the strength of wet scavenging, and humidity affects the hygroscopic growth of particles. All three are on this card. So the City Weather tab is not just a guide to what to wear — it also explains why the numbers on the Air Quality tab move.',
      },
      terms: [{ b: 'earth', k: 'pm25' }, { b: 'earth', k: 'pressure' }],
    },
    {
      to: 'ocean.marine',
      why: {
        'zh-CN': '海上的浪主要由风生成，看沿海风场就能预判近岸浪高会怎么变',
        en: 'Ocean waves are generated mainly by wind, so the coastal wind field lets you anticipate how nearshore wave height will change',
      },
      detail: {
        'zh-CN': '风浪的波高随风时、风距增长：风越大、吹得越久、吹过的海面越长，浪越高。所以天气页签的风速读数是海况预报页签里浪高变化的先行指标——风先起，浪后高，这个时间差就是预警窗口。',
        en: 'Wind-wave height grows with wind duration and fetch: the stronger the wind, the longer it blows and the longer the stretch of sea it blows over, the higher the waves. So the wind-speed reading on the City Weather tab is a leading indicator of wave-height change on the Marine Forecast tab — the wind rises first and the waves follow, and that lag is the warning window.',
      },
      terms: [{ b: 'earth', k: 'waveHeight' }],
    },
    {
      to: 'astro.observe',
      why: {
        'zh-CN': '两个页签取自同一份实况数据，一个看温湿风雨，一个看云量与能见度',
        en: 'Both tabs take the same current-conditions data: one looks at temperature, humidity, wind and rain, the other at cloud cover and visibility',
      },
      detail: {
        'zh-CN': '同一座城市、同一时刻的实况，关心的字段不同而已。观星看云量与能见度（能不能看见天），城市天气看温度降水与风（人在地面舒不舒服）。两者并排看，能把「今天天气不错」这句话拆成可量化的几项。',
        en: 'It is the same city at the same moment, only different fields of interest. Stargazing looks at cloud cover and visibility (can you see the sky), city weather at temperature, precipitation and wind (is it comfortable on the ground). Putting the two side by side breaks the sentence that the weather is nice today into a few quantifiable items.',
      },
      terms: [{ b: 'astro', k: 'sunlit' }],
    },
  ],
  'geo.archive': [
    {
      to: 'geo.climate',
      why: {
        'zh-CN': '气候档案是单站十年的年均温，地表与气候给的是全球温度距平，两个尺度互为印证',
        en: 'The climate archive is a single station’s ten-year mean temperature, while the Surface & Climate tab gives the global temperature anomaly — the two scales corroborate each other',
      },
      detail: {
        'zh-CN': '全球温度距平把各地异常做面积加权平均，抹掉了区域差异；单站档案保留了一座城市自己的起伏。长期趋势一致、年际波动不同，这正是「全球在变暖」不等于「每年都更热」的直观演示——单站曲线上那些波谷，正是全球曲线被平均掉的部分。',
        en: 'The global temperature anomaly area-weights local anomalies into an average, erasing regional differences; a single-station archive preserves one city’s own ups and downs. The long-term trends agree while the interannual wiggles differ — a direct demonstration that the globe is warming does not mean every year is hotter. The troughs in a single-station curve are exactly the parts averaged away in the global curve.',
      },
      terms: [{ b: 'earth', k: 'tempAnomaly' }],
    },
    {
      to: 'ocean.oni',
      why: {
        'zh-CN': '十年年均温的上下起伏，很大程度上来自厄尔尼诺与拉尼娜的年际振荡',
        en: 'Much of the up-and-down in a ten-year record of mean temperature comes from the interannual oscillation of El Niño and La Niña',
      },
      detail: {
        'zh-CN': '强厄尔尼诺年往往对应次年的偏暖，拉尼娜年则相反，这种影响通过大气桥传到中纬度。看单站年均温的波峰波谷时，对照气候振荡页签的 ONI 曲线，就能分清哪些波动是 ENSO 造成的噪声、哪些是真正的长期趋势。',
        en: 'A strong El Niño year is often followed by warmth in the following year, La Niña by the opposite, with the influence carried to mid-latitudes through atmospheric bridges. When you look at the peaks and troughs of a single station’s annual mean temperature, comparing them against the ONI curve on the Climate Oscillations tab lets you separate the fluctuations that are ENSO noise from those that are genuine long-term trend.',
      },
      terms: [{ b: 'earth', k: 'oni' }],
    },
    {
      to: 'ocean.seatem',
      why: {
        'zh-CN': '海洋吸收了绝大部分额外热量，海温与陆上气温的长期升高同源',
        en: 'The ocean absorbs most of the extra heat; long-term warming of SST and of land air temperature share the same origin',
      },
      detail: {
        'zh-CN': '海洋热容量比大气大三个数量级，全球变暖增加的能量九成以上储存在海洋里。海温趋势页签逐年抬升的曲线，与陆上城市年均温的升高，是同一个能量收支失衡的两种表现——一个在海上，一个在陆上，但驱动源相同。',
        en: 'The heat capacity of the ocean is three orders of magnitude larger than that of the atmosphere, and more than 90% of the energy added by global warming is stored in the ocean. The year-by-year rising curve on the SST Trends tab and the rise in land city annual mean temperature are two expressions of the same energy-budget imbalance — one at sea, one on land, driven by the same source.',
      },
      terms: [{ b: 'earth', k: 'sst' }],
    },
  ],

  /* ---------- 海洋 ---------- */
  'ocean.waves': [
    {
      to: 'ocean.buoy',
      why: {
        'zh-CN': '浮标实测浪高是数值预报的现场校验，两者口径常差 10–20%',
        en: 'Buoy-measured wave height is the in-situ check on numerical forecasts; the two definitions commonly differ by 10–20%',
      },
      detail: {
        'zh-CN': '数值模式算的是网格平均的有效波高，浮标测的是单点时间序列——尺度不同必然有差。系统性偏差超过 20% 时，通常说明模式在该海域的地形或风场输入有问题。读法：预报给趋势与量级，浮标给真实瞬时值，两者并用才好判断「今天能不能出海」。',
        en: 'A numerical model computes the grid-averaged significant wave height, while a buoy measures a single-point time series — different scales necessarily give different values. When the systematic bias exceeds 20%, it usually indicates a problem with the model’s bathymetry or wind forcing in that area. How to read them: the forecast gives the trend and the order of magnitude, the buoy gives the true instantaneous value — use both to judge whether you can put to sea today.',
      },
      terms: [{ b: 'earth', k: 'waveHeight' }, { b: 'earth', k: 'buoy' }],
    },
    {
      to: 'ocean.cyclone',
      why: {
        'zh-CN': '热带气旋是极端巨浪的主因，涌浪可先于风暴抵达',
        en: 'Tropical cyclones are the main cause of extreme wave heights, and their swell can arrive ahead of the storm',
      },
      detail: {
        'zh-CN': '长周期涌浪的传播速度远快于风暴本身的移动速度，所以气旋还在千里之外时，它的涌浪已经抵达海岸——这就是「风暴未到、巨浪先行」。冲浪者追的正是这种提前抵达的干净涌浪，但对港口作业来说，它是没有预警窗口的危险。',
        en: 'Long-period swell propagates much faster than the storm itself moves, so while the cyclone is still a thousand miles away its swell has already reached the coast — the storm has not arrived, but the swell has. Surfers chase exactly this clean, early swell; for harbour operations, however, it is a hazard with no warning window.',
      },
      terms: [{ b: 'earth', k: 'swellVsWind' }, { b: 'earth', k: 'wavePeriod' }, { b: 'earth', k: 'saffir' }],
    },
    {
      to: 'ocean.tide',
      why: {
        'zh-CN': '近岸浪高要在潮位基准上读，涨落潮改变破碎带位置',
        en: 'Nearshore wave height must be read against the tide level; the rising and falling tide shifts where waves break',
      },
      detail: {
        'zh-CN': '同一个浪在高潮时打上防波堤，在低潮时可能只在远处破碎。近岸作业关心的是「绝对水位」= 天文潮 + 风暴增水 + 浪高，三者叠加。所以评估越浪风险时，必须把潮汐页签的潮位与这里的浪高合起来看，单看任一项都会低估。',
        en: 'The same wave washes over the breakwater at high tide but may break far out at low tide. What nearshore operations care about is the absolute water level = astronomical tide + storm surge + wave height, all three stacked. So when assessing overtopping risk you must combine the tide level from the Tides tab with the wave height here — looking at either one alone underestimates it.',
      },
      terms: [{ b: 'earth', k: 'tideLevel' }, { b: 'earth', k: 'stormSurge' }],
    },
    {
      to: 'ocean.oni',
      why: {
        'zh-CN': 'ENSO 相位会改变常年风场，从而改变各海域的常浪向与涌浪',
        en: 'The ENSO phase alters the prevailing wind field and thereby the dominant wave direction and swell of each sea area',
      },
      detail: {
        'zh-CN': '厄尔尼诺年赤道太平洋信风减弱、西风爆发位置东移，直接改变涌浪的生成区与传播路径。对夏威夷的北岸巨浪、秘鲁沿岸的浪况都有可统计的年度差异。所以浪况预报是「天气尺度」的，而 ENSO 决定的是这一整年的「背景浪况」偏哪种类型。',
        en: 'In an El Niño year the equatorial Pacific trade winds weaken and the location of westerly wind bursts shifts east, directly changing the swell generation region and propagation path. This produces statistically detectable year-to-year differences for the big North Shore waves of Hawaii and for the wave climate off Peru. So the wave forecast is a weather-scale product, while ENSO decides which type of background wave climate dominates the whole year.',
      },
      terms: [{ b: 'earth', k: 'oni' }, { b: 'earth', k: 'swellVsWind' }],
    },
    {
      to: 'geo.climate',
      why: {
        'zh-CN': '长期变暖改变风场，全球浪况的长期趋势正在被观测到',
        en: 'Long-term warming is changing the wind field, and long-term trends in global wave climate are now being observed',
      },
      detail: {
        'zh-CN': '卫星高度计三十多年的记录显示：南半球高纬海域的有效波高与极端浪高有上升趋势，与西风带增强、南半球环状模偏正相关。这不是某一年的异常，而是气候信号在海洋动力学里的体现。看浪况时区分「今天的风浪」与「三十年的趋势」，正是这两个页签的差别。',
        en: 'More than thirty years of satellite altimeter records show a rising trend in significant and extreme wave heights in the high-latitude seas of the Southern Hemisphere, correlated with a strengthening of the westerlies and a positive phase of the Southern Annular Mode. This is not an anomaly of one particular year but a climate signal showing up in ocean dynamics. Distinguishing today’s wind waves from the thirty-year trend is precisely the difference between these two tabs.',
      },
      terms: [{ b: 'earth', k: 'waveHeight' }, { b: 'earth', k: 'tempAnomaly' }],
    },
  ],
  'ocean.tide': [
    {
      to: 'astro.solar',
      why: {
        'zh-CN': '引潮力来自日月的天体位置，本质是个太阳系力学问题',
        en: 'The tide-generating force comes from the celestial positions of the Sun and Moon — essentially a problem in solar-system mechanics',
      },
      detail: {
        'zh-CN': '潮汐是月球与太阳引潮力的合成：月球贡献约两倍于太阳。朔望（新月/满月）时两者叠加成「大潮」，上下弦时相互抵消成「小潮」。所以潮差大小完全可以由月相与日月的相对位置预测——它首先是个天体力学问题，其次才是海洋学问题。',
        en: 'Tides are the resultant of the tide-generating forces of the Moon and the Sun, with the Moon contributing roughly twice as much as the Sun. At syzygy (new or full moon) the two add to produce a spring tide; at the quarters they partly cancel to produce a neap tide. So the size of the tidal range can be predicted entirely from the lunar phase and the relative positions of Sun and Moon — it is a problem in celestial mechanics first and oceanography second.',
      },
      terms: [{ b: 'earth', k: 'springNeap' }, { b: 'astro', k: 'moonPhase' }, { b: 'earth', k: 'tideRange' }],
    },
    {
      to: 'ocean.waves',
      why: {
        'zh-CN': '总水位 = 天文潮 + 风暴增水 + 浪，二者叠加才叫水位',
        en: 'Total water level = astronomical tide + storm surge + waves; only their sum is the water level',
      },
      detail: {
        'zh-CN': '防灾上真正致命的往往不是高潮位本身，而是「高潮位恰好撞上风暴增水」——2005 年卡特里娜、2013 年海燕都是这种叠加。所以看潮汐页签时要问：如果再来一场风暴，这个潮位还留有多少余量？',
        en: 'What actually kills in disaster terms is often not a high tide by itself but a high tide coinciding with storm surge — Katrina in 2005 and Haiyan in 2013 were both such superpositions. So when reading the Tides tab, ask: if another storm came, how much headroom does this tide level leave?',
      },
      terms: [{ b: 'earth', k: 'stormSurge' }, { b: 'earth', k: 'tideLevel' }],
    },
    {
      to: 'ocean.buoy',
      why: {
        'zh-CN': '潮位站与浮标互为近岸水位的独立观测手段',
        en: 'Tide gauges and buoys are independent observation methods for nearshore water level',
      },
      detail: {
        'zh-CN': '潮位站固定在岸边验潮井里，测的是相对当地基准的水位；浮标在开阔水域随波起伏，测的是绝对海面高度。二者物理原理不同、误差来源不同，互为校验。当两者都出现同向异常时，才敢断定海面真的发生了异常变化。',
        en: 'A tide gauge is fixed in a stilling well on shore and measures water level relative to a local datum; a buoy rides the waves in open water and measures absolute sea-surface height. The two rest on different physical principles with different error sources, and they validate each other. Only when both show anomalies in the same direction can one conclude that the sea surface really did change.',
      },
      terms: [{ b: 'earth', k: 'buoy' }, { b: 'earth', k: 'tideRange' }],
    },
    {
      to: 'geo.climate',
      why: {
        'zh-CN': '海平面上升抬高基准，同样的天文潮现在更容易造成「晴天淹没」',
        en: 'Sea-level rise raises the baseline, so the same astronomical tide now causes sunny-day flooding more easily',
      },
      detail: {
        'zh-CN': '这是潮汐与气候最实际的交叉点：天文潮本身没变，但平均海平面上升使高潮位更容易越过高程阈值。美国东海岸多个验潮站的「 nuisance flooding（无风暴也淹水）」天数近几十年成倍增加，主因就是海平面上升叠加天文大潮。判断风险时看的是「超过阈值的次数」，不是潮差有没有变大。',
        en: 'This is the most practical intersection between tides and climate: the astronomical tide itself has not changed, but mean sea-level rise makes high waters exceed elevation thresholds more often. At many tide gauges on the US east coast, the number of nuisance flooding days — flooding with no storm at all — has multiplied in recent decades, mainly because sea-level rise is superimposed on spring tides. When judging the risk, what matters is how often the threshold is exceeded, not whether the tidal range has grown.',
      },
      terms: [{ b: 'earth', k: 'tideLevel' }, { b: 'earth', k: 'stormSurge' }],
    },
    {
      to: 'geo.quake',
      why: {
        'zh-CN': '海啸抵达时的天文潮位决定淹没范围，两者叠加才是实际水位',
        en: 'The astronomical tide level when a tsunami arrives determines the inundation extent; the two together give the actual water level',
      },
      detail: {
        'zh-CN': '2011 年日本海啸、2004 年印度洋海啸的灾情都有明显的潮位调制：同一波高在高潮位岸段的淹没深度显著更大。海啸预警发布后，沿岸应急要看「海啸波高 + 当时天文潮位」，这也是为什么潮汐页签在减灾链条里并非可有可无。',
        en: 'The damage from both the 2011 Japan tsunami and the 2004 Indian Ocean tsunami was clearly modulated by tide level: for the same wave height, inundation depth was significantly greater on coastal segments at high tide. Once a tsunami warning is issued, coastal emergency response has to look at tsunami wave height plus the astronomical tide at that moment, which is why the Tides tab is not optional in the mitigation chain.',
      },
      terms: [{ b: 'earth', k: 'tsunami' }, { b: 'earth', k: 'tsunamiSpeed' }],
    },
  ],
  'ocean.oni': [
    {
      to: 'geo.climate',
      why: {
        'zh-CN': 'ENSO 是全球温度距平年际波动的最大单一来源',
        en: 'ENSO is the largest single source of interannual variability in the global temperature anomaly',
      },
      detail: {
        'zh-CN': 'ONI 定义为 Niño 3.4 区海表温度距平的 3 个月滑动平均，连续 5 个月 ≥ +0.5 °C 判定厄尔尼诺、≤ −0.5 °C 判定拉尼娜。它解释了全球温度距平曲线上大部分「忽高忽低」——2023–24 年那次创纪录升温，就有强厄尔尼诺的直接贡献。',
        en: 'The ONI is defined as the three-month running mean of SST anomaly in the Niño 3.4 region; five consecutive months at or above +0.5 °C define El Niño, at or below −0.5 °C define La Niña. It explains most of the ups and downs in the global temperature-anomaly curve — the record warming of 2023–24 had a direct contribution from a strong El Niño.',
      },
      terms: [{ b: 'earth', k: 'oni' }, { b: 'earth', k: 'tempAnomaly' }],
    },
    {
      to: 'ocean.cyclone',
      why: {
        'zh-CN': '厄尔尼诺/拉尼娜显著调制各大洋盆的气旋生成频数与路径',
        en: 'El Niño and La Niña significantly modulate cyclone genesis frequency and tracks in each ocean basin',
      },
      detail: {
        'zh-CN': '调制方向因洋盆而异：厄尔尼诺年大西洋因垂直风切变增强而气旋减少，东太平洋与西北太平洋则往往增多。所以「今年台风多不多」不能只看总量，要看洋盆——ENSO 是在重分配，不是简单地在加总。',
        en: 'The direction of modulation differs by basin: in an El Niño year the Atlantic sees fewer cyclones because vertical wind shear increases, while the eastern Pacific and western North Pacific often see more. So whether there are more typhoons this year cannot be answered from the total alone — you have to look basin by basin. ENSO redistributes rather than simply adding up.',
      },
      terms: [{ b: 'earth', k: 'cycloneClass' }, { b: 'earth', k: 'oni' }],
    },
    {
      to: 'ocean.buoy',
      why: {
        'zh-CN': '浮标海表温度是 ENSO 监测网的现场数据来源之一',
        en: 'Buoy SST is one of the in-situ data sources of the ENSO observing network',
      },
      detail: {
        'zh-CN': '赤道太平洋的 TAO/TRITON 锚系浮标阵列是 ENSO 监测的骨干：它们沿赤道布设，实时回传海表与次表层温度。ONI 指数虽然在气候页签以曲线呈现，其底层数据相当一部分就来自这类浮标阵列的连续观测。',
        en: 'The TAO/TRITON moored buoy array in the equatorial Pacific is the backbone of ENSO monitoring: the buoys are strung along the equator and return surface and subsurface temperature in real time. Although the ONI index appears as a curve on the climate tab, a substantial part of the underlying data comes from the continuous observations of arrays like this one.',
      },
      terms: [{ b: 'earth', k: 'sst' }, { b: 'earth', k: 'buoy' }],
    },
    {
      to: 'ocean.waves',
      why: {
        'zh-CN': 'ENSO 改变常年风场，进而改变各海域的主浪向与涌浪类型',
        en: 'ENSO alters the prevailing wind field and thereby the dominant wave direction and swell type of each sea area',
      },
      detail: {
        'zh-CN': '厄尔尼诺年赤道太平洋信风减弱，涌浪的生成区与传播方向随之改变。对浪况而言，ENSO 不决定「明天浪多大」，而决定「这一整年这片海以哪种浪为主」。把气候振荡页签的相位与海浪页签的浪向、周期结合看，能分辨某次异常是天气尺度还是年际背景变了。',
        en: 'In an El Niño year the equatorial Pacific trade winds weaken, and the swell generation region and propagation direction change accordingly. For wave conditions, ENSO does not decide how big the waves are tomorrow, but which type of wave dominates this sea for the whole year. Combining the phase on the Climate Oscillations tab with the wave direction and period on the Waves & SST tab lets you tell whether an anomaly is weather-scale or a shift in the interannual background.',
      },
      terms: [{ b: 'earth', k: 'swellVsWind' }, { b: 'earth', k: 'wavePeriod' }],
    },
    {
      to: 'geo.eonet',
      why: {
        'zh-CN': '厄尔尼诺/拉尼娜重分配全球干旱与野火风险，能在自然事件清单里看到后果',
        en: 'El Niño and La Niña redistribute global drought and wildfire risk, and the consequences show up in the natural-event list',
      },
      detail: {
        'zh-CN': 'ENSO 的陆上后果非常具体：厄尔尼诺年印尼与澳洲偏干（火险上升）、秘鲁与厄瓜多尔偏涝；拉尼娜年则大致相反。所以看 EONET 里的野火与干旱事件分布时，先确认当年 ENSO 相位，很多「异常」其实是标准配置。这条链路从海温一路影响到陆面灾害。',
        en: 'The terrestrial consequences of ENSO are quite specific: in an El Niño year Indonesia and Australia tend to be dry (higher fire risk) while Peru and Ecuador tend to be wet; in a La Niña year it is roughly the reverse. So when looking at the distribution of wildfire and drought events in EONET, first establish the ENSO phase of that year — many apparent anomalies are standard configuration. This chain runs all the way from sea temperature to land-surface disasters.',
      },
      terms: [{ b: 'earth', k: 'oni' }, { b: 'earth', k: 'pdo' }],
    },
  ],
  'ocean.cyclone': [
    {
      to: 'ocean.waves',
      why: {
        'zh-CN': '气旋是极端浪高的主因，风暴浪预报直接依赖强度与路径',
        en: 'Cyclones are the main cause of extreme wave heights; storm-wave forecasts depend directly on intensity and track',
      },
      detail: {
        'zh-CN': '最大浪高与风速、风时、风区三者相关：风越强、吹得越久、吹过的海面越长，浪越高。气旋恰好同时满足这三条，所以它能制造十几米的巨浪。预报浪高时，气旋中心距离比强度更关键——离得近时即使强度一般也能掀起大浪。',
        en: 'Maximum wave height depends on three things — wind speed, wind duration and fetch: the stronger the wind, the longer it blows and the longer the stretch of sea it crosses, the higher the waves. A cyclone satisfies all three at once, which is why it can generate waves of ten-plus metres. When forecasting wave height, the distance to the cyclone centre matters more than its intensity — a nearby but only moderate system can still raise big seas.',
      },
      terms: [{ b: 'earth', k: 'saffir' }, { b: 'earth', k: 'waveHeight' }],
    },
    {
      to: 'ocean.oni',
      why: {
        'zh-CN': 'ENSO 相位决定当年气旋偏多还是偏少、偏强还是偏弱',
        en: 'The ENSO phase determines whether the year’s cyclones are more or fewer, stronger or weaker',
      },
      detail: {
        'zh-CN': '季度预报文里「今年台风预计偏多/偏少」的依据主要就是 ENSO 相位加海温距平。需要注意的是这是个概率性调制，不是确定性预测——拉尼娜年也可能出现超强台风，只是统计上概率更高。',
        en: 'When a seasonal outlook says that there will be more or fewer typhoons than normal this year, the basis is mainly the ENSO phase plus SST anomalies. Note that this is a probabilistic modulation, not a deterministic forecast — a La Niña year can still produce a super typhoon; it is only statistically more likely.',
      },
      terms: [{ b: 'earth', k: 'oni' }, { b: 'earth', k: 'cycloneClass' }],
    },
    {
      to: 'ocean.buoy',
      why: {
        'zh-CN': '浮标在风暴过境时给出实测浪高与气压，用于订正预报',
        en: 'Buoys give measured wave height and pressure as a storm passes, used to correct forecasts',
      },
      detail: {
        'zh-CN': '气旋中心气压是判断强度的核心量，而开阔洋面上几乎只有浮标能给出原位气压。风暴过境时浮标记录到的气压骤降曲线，常被用来反推气旋中心位置与强度——卫星云图看形态，浮标看数值，二者缺一不可。注意：极端海况下浮标可能漂移或停发，缺测本身就是危险信号。',
        en: 'Central pressure is the core quantity for judging cyclone intensity, and over the open ocean almost only buoys can supply in-situ pressure. The pressure-drop curve recorded by a buoy as the storm passes is often used to infer the position and intensity of the centre — satellite imagery shows the shape, buoys give the numbers, and neither can be dispensed with. Note that in extreme sea states a buoy may drift or stop transmitting; missing data is itself a danger signal.',
      },
      terms: [{ b: 'earth', k: 'buoy' }, { b: 'earth', k: 'pressure' }],
    },
    {
      to: 'ocean.tide',
      why: {
        'zh-CN': '风暴增水叠在高潮位上才致命：登陆时刻的潮位决定淹没深度',
        en: 'Storm surge stacked on a high tide is what kills: the tide at landfall determines inundation depth',
      },
      detail: {
        'zh-CN': '卡特里娜（2005）与新奥尔良、海燕（2013）与塔克洛班的共同点是风暴峰值恰逢天文高潮位。风暴增水本身两米，若撞上两米的天文大潮，实际水位就是四米。所以评估气旋影响时，必须把潮汐页签的潮位曲线叠到登陆时刻上——这是防灾里最常被人忽略的一步。',
        en: 'What New Orleans and Katrina (2005) had in common with Tacloban and Haiyan (2013) is that the storm peak coincided with an astronomical high tide. If the storm surge itself is two metres and it meets a two-metre astronomical high tide, the actual water level is four metres. So when assessing a cyclone’s impact, the tide curve from the Tides tab must be overlaid on the landfall time — the step most often overlooked in disaster preparedness.',
      },
      terms: [{ b: 'earth', k: 'stormSurge' }, { b: 'earth', k: 'springNeap' }],
    },
    {
      to: 'geo.eonet',
      why: {
        'zh-CN': 'EONET 以卫星视角记录风暴的完整生命史，适合过后复盘',
        en: 'EONET records the full life cycle of a storm from the satellite perspective, which suits after-the-fact review',
      },
      detail: {
        'zh-CN': '气旋页签给的是预报（路径锥、强度等级、未来 5 天），EONET 给的是记录（卫星看到了什么、什么时候、多大范围）。做复盘时两者互补：先看 EONET 确认事件，再对照当时的预报路径，能看出预报偏了多远。',
        en: 'The Tropical Cyclones tab gives forecasts (track cone, intensity category, next five days); EONET gives the record (what the satellite saw, when, and over how large an area). The two complement each other in a review: confirm the event in EONET first, then compare it with the forecast track issued at the time, and you can see how far off the forecast was.',
      },
      terms: [{ b: 'earth', k: 'cycloneClass' }, { b: 'earth', k: 'saffir' }],
    },
    {
      to: 'geo.climate',
      why: {
        'zh-CN': '暖海面提供能量；气候变暖更可能改变强度分布而非气旋总数',
        en: 'A warm sea surface supplies the energy; warming is more likely to change the intensity distribution than the total number of cyclones',
      },
      detail: {
        'zh-CN': '观测与理论都指向：全球气旋总频数未必增加，但强气旋（4–5 级）占比在上升，且快速增强事件变多——后者是预报上最棘手的一类。所以「气候变暖让台风变多」是不准确的说法，准确的是「变强的概率上升、变强的速度变快」。',
        en: 'Both observations and theory point the same way: the global total count of cyclones has not necessarily increased, but the share of intense cyclones (Category 4–5) is rising and rapid-intensification events are becoming more common — the latter being the hardest kind to forecast. So saying that warming makes more typhoons is inaccurate; the accurate statement is that the probability of becoming intense is rising, and intensification is happening faster.',
      },
      terms: [{ b: 'earth', k: 'sst' }, { b: 'earth', k: 'ssta' }],
    },
  ],
  'ocean.buoy': [
    {
      to: 'ocean.waves',
      why: {
        'zh-CN': '浮标浪高是海浪预报的现场真值，可看出预报偏大还是偏小',
        en: 'Buoy wave height is the in-situ ground truth for wave forecasts and shows whether they run high or low',
      },
      detail: {
        'zh-CN': '对比时要用同一统计量：浮标报的通常是有效波高（最高的 1/3 个波的均值），不是「最大浪高」。肉眼看海面觉得「浪比预报大」，往往是因为人眼记住的是偶尔出现的最大浪，而非有效波高——后者约是前者的 0.6–0.7 倍。',
        en: 'When comparing, use the same statistic: buoys usually report significant wave height (the mean of the highest one-third of waves), not the maximum wave height. People feel that the waves are bigger than forecast because the eye remembers the occasional largest wave rather than the significant height — the latter is roughly 0.6–0.7 times the former.',
      },
      terms: [{ b: 'earth', k: 'waveHeight' }, { b: 'earth', k: 'wavePeriod' }],
    },
    {
      to: 'ocean.cyclone',
      why: {
        'zh-CN': '风暴过境时浮标记录到极端浪高与气压骤降',
        en: 'As a storm passes, buoys record extreme wave heights and a sharp pressure drop',
      },
      detail: {
        'zh-CN': '典型记录形态是：气压缓慢下降 → 浪高同步攀升 → 气旋眼墙过境时出现峰值 → 眼区经过时短暂回落 → 另一侧眼墙再次峰值。这条双峰曲线是判断气旋是否正面通过浮标的判据。极端海况下浮标可能断链，此时缺测比异常值更值得警惕。',
        en: 'The typical record looks like this: pressure falls slowly, wave height climbs in step, a peak as the eyewall passes, a brief lull as the eye passes, then a second peak at the opposite eyewall. This double-peaked curve is the criterion for judging whether the cyclone passed directly over the buoy. In extreme sea states the buoy may break its mooring, and in that case missing data deserves more attention than an anomalous value.',
      },
      terms: [{ b: 'earth', k: 'pressure' }, { b: 'earth', k: 'saffir' }],
    },
    {
      to: 'geo.volcano',
      why: {
        'zh-CN': '同属浮标家族的 DART 深海压力计专用于海啸预警',
        en: 'The DART deep-ocean pressure recorder, another member of the buoy family, is dedicated to tsunami warning',
      },
      detail: {
        'zh-CN': '浮标页签里的 NDBC 站测的是海面气象与波浪（浮在海面）；DART 测的是深海压力（坐沉海底）。两者名字都叫浮标，原理与用途完全不同：前者服务航海与预报，后者服务海啸预警。混淆它们是看板使用者最常见的误会。',
        en: 'The NDBC stations on the Live Buoys tab measure marine weather and waves at the surface (floating on it); DART measures deep-ocean pressure (resting on the seabed). Both are called buoys, but the principle and purpose are entirely different: the former serves navigation and forecasting, the latter tsunami warning. Confusing the two is the most common misunderstanding among users of these dashboards.',
      },
      terms: [{ b: 'earth', k: 'buoy' }, { b: 'earth', k: 'tsunami' }],
    },
    {
      to: 'ocean.oni',
      why: {
        'zh-CN': '赤道太平洋的锚系浮标阵列正是 ONI 指数的骨干数据源',
        en: 'The moored buoy array in the equatorial Pacific is the backbone data source of the ONI index',
      },
      detail: {
        'zh-CN': 'TAO/TRITON 阵列沿赤道布设约 70 个锚系浮标，实时回传海表与次表层温度，是 ENSO 监测与预报的核心输入。所以气候振荡页签那条 ONI 曲线，底层很大一部分就是浮标页签这类设备的连续观测——浮标不是只在近岸测浪，它在气候监测里同样是关键基础设施。',
        en: 'The TAO/TRITON array deploys about 70 moored buoys along the equator, returning surface and subsurface temperature in real time as a core input to ENSO monitoring and prediction. So a large part of the ONI curve on the Climate Oscillations tab rests on continuous observations from devices like those on the Live Buoys tab — buoys do not only measure waves near the coast; they are equally critical infrastructure for climate monitoring.',
      },
      terms: [{ b: 'earth', k: 'oni' }, { b: 'earth', k: 'sst' }],
    },
    {
      to: 'geo.climate',
      why: {
        'zh-CN': '浮标原位海温用来订正卫星反演，是全球温度序列的校准锚点',
        en: 'In-situ buoy SST is used to correct satellite retrievals and is the calibration anchor of global temperature series',
      },
      detail: {
        'zh-CN': '卫星反演的海表温度覆盖广但有系统偏差（云污染、皮肤层效应、气溶胶订正残差），浮标的原位测量是消除这些偏差的基准。全球温度距平曲线之所以能跨几十年可比，靠的正是这类独立观测的持续交叉校验。',
        en: 'Satellite-retrieved SST has wide coverage but systematic biases (cloud contamination, skin-layer effects, residual aerosol correction); in-situ buoy measurements are the reference used to remove them. The reason global temperature-anomaly curves remain comparable across decades is precisely this kind of continuous cross-validation against independent observations.',
      },
      terms: [{ b: 'earth', k: 'sst' }, { b: 'earth', k: 'tempAnomaly' }],
    },
    {
      to: 'ocean.tide',
      why: {
        'zh-CN': '潮位站测相对基准的水位，浮标测绝对海面高度，二者互为独立校验',
        en: 'Tide gauges measure level relative to a datum while buoys measure absolute sea-surface height — independent cross-checks on each other',
      },
      detail: {
        'zh-CN': '潮位站固定在岸边验潮井内，测的是相对当地基准的水位；浮标在开阔水域随波起伏，测的是绝对海面高度。原理不同、误差来源不同。当两者出现同向异常时，才敢断定海面真的发生了异常（而非某一套设备故障）。判断海平面异常与风暴增水时，这个交叉验证是标准做法。',
        en: 'A tide gauge is installed in a stilling well on shore and measures level relative to a local datum; a buoy rides the waves in open water and measures absolute sea-surface height. The principles differ and so do the error sources. Only when both show an anomaly in the same direction can one conclude that the sea surface really did change (rather than one instrument failing). This cross-validation is standard practice when judging sea-level anomalies and storm surge.',
      },
      terms: [{ b: 'earth', k: 'buoy' }, { b: 'earth', k: 'tideLevel' }],
    },
  ],
  'ocean.marine': [
    {
      to: 'ocean.waves',
      why: {
        'zh-CN': '同一片海的两种时间分辨率：这里看未来 7 天逐日浪高，那边看未来 24 小时逐时变化',
        en: 'Two time resolutions for the same sea: seven days of daily wave height here, 24 hours of hourly change there',
      },
      detail: {
        'zh-CN': '24 小时曲线回答「现在能不能下水」，7 天逐日表回答「这周哪天适合出海」。前者是短期的连续变化，后者是中期的日峰值序列。安排行程用这张表，临场判断用那条曲线。',
        en: 'The 24-hour curve answers whether you can get in the water now; the seven-day daily table answers which day this week is good for going out. The former is a short-term continuous variation, the latter a medium-term series of daily peaks. Use this table to plan the trip and that curve to decide on the spot.',
      },
      terms: [{ b: 'earth', k: 'waveHeight' }, { b: 'earth', k: 'wavePeriod' }],
    },
    {
      to: 'geo.weather',
      why: {
        'zh-CN': '风是浪的主要能量来源，沿海风场的变化领先于浪高的变化',
        en: 'Wind is the main energy source of waves; changes in the coastal wind field lead changes in wave height',
      },
      detail: {
        'zh-CN': '风浪由本地风直接生成，风起在前、浪高在后，中间有数小时的滞后。所以天气页签的风速风向是海况预报的先行指标：风持续增强时，即便此刻浪还不大，也该预期第二天浪会明显抬高。',
        en: 'Wind waves are generated directly by the local wind: the wind rises first and the waves follow, with a lag of several hours. So the wind speed and direction on the City Weather tab are a leading indicator for the marine forecast — if the wind keeps strengthening, expect a marked rise in wave height the next day even if the sea is still calm now.',
      },
      terms: [{ b: 'earth', k: 'waveHeight' }, { b: 'earth', k: 'wavePeriod' }],
    },
    {
      to: 'ocean.coast',
      why: {
        'zh-CN': '同一份数据，这里按时间看一整周，海岸榜按空间比今天哪片海最不平静',
        en: 'Same data: this tab looks at a whole week in time, the Coastal Ranking compares which sea is roughest today in space',
      },
      detail: {
        'zh-CN': '两张表来自同一次请求：海况预报的横轴是日期，海岸榜的横轴是海域。要决定「哪天去」看前者，要决定「去哪片海」看后者。把两者合起来，就能在一周的每一格里挑出相对最平静的海域。',
        en: 'Both tables come from the same request: the marine forecast has dates on its x-axis, the coastal ranking has sea areas. To decide which day to go, look at the former; to decide which sea to go to, look at the latter. Combining them lets you pick the relatively calmest sea area in each slot of the week.',
      },
      terms: [{ b: 'earth', k: 'swellVsWind' }],
    },
  ],
  'ocean.coast': [
    {
      to: 'ocean.marine',
      why: {
        'zh-CN': '同一份数据的空间视角：这里比今天哪片海最不平静，那边看某片海这一周怎么变',
        en: 'The spatial view of the same data: here we compare which sea is roughest today, there we see how one sea changes over the week',
      },
      detail: {
        'zh-CN': '榜单按当前浪高从大到小排序，适合横向对比不同海域；海况预报按日期展开，适合纵向跟踪某一海域。两者共用同一个数据源，不需要分别理解两套口径。',
        en: 'The ranking sorts sea areas by current wave height from largest to smallest, which suits cross-sectional comparison between sea areas; the marine forecast unfolds by date, which suits tracking one area over time. Both share the same data source, so there is no need to master two separate definitions.',
      },
      terms: [{ b: 'earth', k: 'waveHeight' }],
    },
    {
      to: 'ocean.buoy',
      why: {
        'zh-CN': '榜单用的是模式预报值，浮标是实测真值，两者偏差变大说明天气系统在快速变化',
        en: 'The ranking uses model forecast values while buoys are measured truth; a growing gap between them means the weather system is changing fast',
      },
      detail: {
        'zh-CN': '模式预报平滑、覆盖全球；浮标实测有毛刺、只覆盖有站位的水域。把海岸榜的浪高与浮标实测对照，能判断当前预报是否可信——偏差持续增大，通常意味着有快速增强的风暴正在靠近。',
        en: 'Model forecasts are smooth and global; buoy measurements are noisy and only cover waters where a station exists. Comparing the wave height in the coastal ranking against buoy measurements tells you whether the current forecast is trustworthy — a steadily growing discrepancy usually means a rapidly intensifying storm is approaching.',
      },
      terms: [{ b: 'earth', k: 'buoy' }, { b: 'earth', k: 'waveHeight' }],
    },
    {
      to: 'ocean.cyclone',
      why: {
        'zh-CN': '榜单上排在最前面的大浪，多半是热带气旋或强温带气旋外围传来的涌浪',
        en: 'The biggest waves at the top of the ranking are mostly swell radiated outward by tropical or intense extratropical cyclones',
      },
      detail: {
        'zh-CN': '台风中心附近浪高可达 10 米以上，其涌浪能传播上千公里——即使本地风和日丽，远处风暴也能让近岸浪高明显抬升，这正是「无风三尺浪」的来源。所以海岸榜出现异常大浪时，第一件事是去气旋页签确认有没有风暴。',
        en: 'Wave heights near a typhoon centre can exceed 10 m, and its swell can travel more than a thousand kilometres — even when local conditions are calm and sunny, a distant storm can markedly raise nearshore wave height, which is exactly where the saying that there are three-foot waves with no wind comes from. So when an unusually large wave appears in the coastal ranking, the first thing to do is check the Tropical Cyclones tab for a storm.',
      },
      terms: [{ b: 'earth', k: 'cycloneClass' }, { b: 'earth', k: 'saffir' }],
    },
  ],
  'ocean.seatem': [
    {
      to: 'ocean.cyclone',
      why: {
        'zh-CN': '海温高于 26.5°C 是台风生成与维持的必要条件，本页那条阈值线就是为它画的',
        en: 'SST above 26.5 °C is a necessary condition for typhoon genesis and maintenance — that is what the threshold line on this tab is drawn for',
      },
      detail: {
        'zh-CN': '台风需要从暖海面摄取水汽与潜热来维持暖心结构。海温低于 26.5°C 的水域，即便有扰动也很难发展成台风；暖水层越厚，快速增强的可能性越大。所以看海温趋势能预判哪些海域具备生成条件、哪些不具备。',
        en: 'A typhoon needs to draw water vapour and latent heat from a warm sea surface to maintain its warm-core structure. In waters below 26.5 °C even a disturbance struggles to develop into a typhoon; the thicker the warm layer, the greater the chance of rapid intensification. So following SST trends lets you anticipate which sea areas meet the genesis conditions and which do not.',
      },
      terms: [{ b: 'earth', k: 'sst' }, { b: 'earth', k: 'cycloneClass' }],
    },
    {
      to: 'ocean.oni',
      why: {
        'zh-CN': '厄尔尼诺本质上就是赤道太平洋海温的持续异常偏暖，与本页是同一个物理量',
        en: 'El Niño is essentially a persistent warm SST anomaly in the equatorial Pacific — the same physical quantity as on this tab',
      },
      detail: {
        'zh-CN': 'ONI 取的是 Niño 3.4 区海表温度距平的三个月滑动平均，本页给的是我国近海的实际海温。前者是气候信号（距平、赤道、季节尺度），后者是局地状态（绝对值、近海、日尺度），两者通过大气桥相互联系。',
        en: 'The ONI is the three-month running mean of SST anomaly in the Niño 3.4 region, while this tab gives the actual SST in China’s coastal seas. The former is a climate signal (anomaly, equatorial, seasonal scale), the latter a local state (absolute value, coastal, daily scale), and the two are connected through atmospheric bridges.',
      },
      terms: [{ b: 'earth', k: 'oni' }, { b: 'earth', k: 'ssta' }],
    },
    {
      to: 'geo.archive',
      why: {
        'zh-CN': '海气耦合使海温与陆上气温长期同步上升，两个页签是同一失衡的两种表现',
        en: 'Air–sea coupling makes SST and land air temperature rise together over the long term; the two tabs are two expressions of the same imbalance',
      },
      detail: {
        'zh-CN': '海洋吸收了绝大部分额外热量，海温与陆温的长期升高同源。气候档案页签给的是单站年均温的十年序列，本页给的是近海海温的当前状态与一周趋势——一个在陆上看长期，一个在海上盯当下。',
        en: 'The ocean absorbs most of the extra heat, so the long-term rise in SST and in land temperature share the same origin. The Climate Archive tab gives a ten-year series of annual mean temperature for a single station; this tab gives the current state and one-week trend of coastal SST — one looks at the long term on land, the other watches the present at sea.',
      },
      terms: [{ b: 'earth', k: 'sst' }, { b: 'earth', k: 'tempAnomaly' }],
    },
  ],
}

/**
 * 取某个看板页签的关联数据（已解析成可直接渲染的结构）。
 * 找不到关联（名词解释/案例这类辅助页签）返回空数组，由组件决定是否整块不渲染。
 *
 * @param {string} board 看板 key
 * @param {string} tab 页签 key
 * @param {string} [lang] 语种，缺省 zh-CN
 * @returns {Array<object>} why / detail / label / title 均已按语种解析成字符串
 */
export function getRelated(board, tab, lang = 'zh-CN') {
  const list = RELATIONS[`${board}.${tab}`]
  if (!list || !list.length) return []
  return list
    .map(({ to, why, detail, terms }) => {
      const [b, t] = to.split('.')
      const meta = BOARD_META[b]
      const label = TAB_LABELS[b]?.[t]
      if (!meta || !label) return null
      return {
        board: b,
        tab: t,
        to,
        why: pickText(why, lang),
        detail: pickText(detail, lang) || '',
        terms: terms || [],
        ...localize(meta, lang),
        label: pickText(label, lang),
      }
    })
    .filter(Boolean)
}

/**
 * 取某个页签的展示名（已解析成字符串）。
 * @param {string} board 看板 key
 * @param {string} tab 页签 key
 * @param {string} [lang] 语种
 */
export function getTabLabel(board, tab, lang = 'zh-CN') {
  return pickText(TAB_LABELS[board]?.[tab], lang)
}

/**
 * 取三块看板的元信息（title 已解析成字符串）。
 * @param {string} [lang] 语种
 */
export function getBoardMeta(lang = 'zh-CN') {
  return Object.fromEntries(Object.entries(BOARD_META).map(([k, m]) => [k, localize(m, lang)]))
}

/**
 * 取某块看板的监控范围（scope 与 watch 均已解析成字符串）。
 * @param {string} board 看板 key
 * @param {string} [lang] 语种
 */
export function getBoardScope(board, lang = 'zh-CN') {
  const s = BOARD_SCOPE[board]
  if (!s) return null
  return { scope: pickText(s.scope, lang), watch: s.watch.map((w) => pickText(w, lang)) }
}

/** 某看板的全部页签 key（用于校验 URL ?tab= 参数合法性） */
export const TAB_KEYS = Object.fromEntries(
  Object.entries(TAB_LABELS).map(([b, m]) => [b, Object.keys(m)]),
)

/* ------------------------------------------------------------------ */
/* 名词查询                                                            */
/* ------------------------------------------------------------------ */

/**
 * 两本词典：深空用 astro 的 KPI_DEFS，地球与海洋共用 earth 的 EARTH_KPI_DEFS。
 * terms 里的 b 指的是「查哪本词典」（astro / earth），不是看板 key。
 */
const TERM_DICTS = { astro: KPI_DEFS, earth: EARTH_KPI_DEFS }

/** 名词归属的看板（决定点名词时跳哪块看板的名词解释页签） */
const TERM_BOARD = { astro: 'astro', earth: 'geo' }

/**
 * 取一条名词的完整释义。查不到返回 null（调用方跳过，不渲染空卡）。
 * 返回 { zh, unit, what, scale, soWhat, board, key }，文案字段已按语种解析成字符串。
 *
 * @param {string} b 词典（astro / earth）
 * @param {string} k 名词 key
 * @param {string} [lang] 语种
 */
export function getTerm(b, k, lang = 'zh-CN') {
  const dict = TERM_DICTS[b]
  const item = dict?.[k]
  if (!item) return null
  const t = localize(item, lang)
  return {
    key: k,
    board: TERM_BOARD[b] || 'geo',
    zh: t.zh || k,
    unit: t.unit || '',
    what: t.what || '',
    scale: t.scale || '',
    soWhat: t.soWhat || '',
  }
}
