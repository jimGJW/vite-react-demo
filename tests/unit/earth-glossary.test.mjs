/**
 * 地球 / 海洋术语表与 KPI 词典 · 纯函数单测（零依赖）
 * 覆盖 src/lib/earth/glossary.js。
 *
 * 为什么这值得单测：
 *   这份词典同时被 /geo 与 /ocean 两页消费，且**阈值就是页面上数字的颜色来源**。
 *   最典型的退化有两种，都不会让构建失败：
 *     ① 分档表漏写 min（只有 max），末档渲染出「> undefined」——
 *        这个问题在浏览器冒烟里真的出现过一次，所以这里钉死所有分档表必须成对给 min/max；
 *     ② 词典条目缺字段或分组引用了不存在的 key，页面出现空白卡片。
 */
import {
  CYCLONE_CLASSES,
  SAFFIR_SIMPSON,
  AQI_LEVELS,
  UV_LEVELS,
  MAGNITUDE_BANDS,
  DEPTH_ZONES,
  WAVE_STATES,
  TIDE_DATUMS,
  OSCILLATIONS,
  GREENHOUSE_GASES,
  EARTH_KPI_DEFS,
  EARTH_KPI_GROUPS,
  VOLCANO_ALERTS,
  AVIATION_CODES,
  TSUNAMI_CATEGORIES,
  lookup,
  bandOf,
  aqiLevel,
  uvLevel,
  magBand,
  depthClass,
  waveLevel,
  zhCycloneClass,
  zhCycloneScale,
  zhTideDatum,
  zhOscillation,
  zhGreenhouseGas,
  zhVolcanoAlert,
  zhAviationCode,
  zhTsunamiCategory,
  getEarthKpi,
  getEarthKpiGroups,
} from '../../src/lib/earth/glossary.js'
import { eq, ok, notEq } from './harness.mjs'
import { pickText } from '../../src/i18n/translate.mjs'

/** 真实上游枚举快照（2026-10 从 NHC CurrentStorms.json 实抓） */
const LIVE_CYCLONE_CLASSES = ['HU', 'TS', 'PTC', 'TD', 'LO']

/** 需要成对校验 min/max 的分档表（缺 min 会让末档渲染成「> undefined」） */
const BAND_TABLES = {
  AQI_LEVELS,
  UV_LEVELS,
  MAGNITUDE_BANDS,
  DEPTH_ZONES,
  WAVE_STATES,
}

export default [
  /* ---------- lookup 的兜底契约 ---------- */
  ['未收录枚举原样透出而非返回空', () => {
    const miss = lookup('ZZZ_NOT_EXIST', CYCLONE_CLASSES)
    eq(miss.zh, 'ZZZ_NOT_EXIST', '未收录枚举应原样透出 zh')
    eq(miss.en, 'ZZZ_NOT_EXIST', '未收录枚举应保留原文 en')
    ok(pickText(miss.desc, 'zh-CN').length > 0, '未收录枚举也要有非空 desc，避免 UI 出现空行')
  }],

  ['null / 空串直接返回 null', () => {
    eq(lookup(null, CYCLONE_CLASSES), null, 'null 应返回 null')
    eq(lookup('', CYCLONE_CLASSES), null, '空串应返回 null')
    eq(lookup('  ', CYCLONE_CLASSES), null, '纯空格应返回 null')
  }],

  /* ---------- 分档函数的边界值 ---------- */
  ['AQI 分档边界', () => {
    eq(bandOf(15, AQI_LEVELS).zh, '优', 'AQI 15 应落「优」')
    eq(aqiLevel(35).zh, '良', 'AQI 35 应落「良」')
    eq(aqiLevel(128).zh, '严重', 'AQI 128 应落「严重」')
    eq(aqiLevel(null).zh, '—', 'AQI 缺失应给占位而非抛错')
    ok(aqiLevel(35).label, '分档结果必须带 label（页面历史字段）')
    ok(aqiLevel(35).color.startsWith('#'), '分档结果必须带颜色')
  }],

  ['紫外线分档边界', () => {
    eq(uvLevel(0).zh, '低', 'UVI 0 应为「低」')
    eq(uvLevel(11).zh, '极高', 'UVI 11 应为「极高」')
  }],

  ['震级分档边界', () => {
    eq(magBand(3.2).zh, '轻震', 'M3.2 应为轻震')
    eq(magBand(7.7).zh, '大震', 'M7.7 应为大震')
    eq(magBand(8.5).zh, '巨大震', 'M8.5 应为巨大震')
    eq(magBand(null).zh, '未知', '震级缺失应为未知')
  }],

  ['震源深度分带边界', () => {
    eq(depthClass(10).zh, '浅源', '10km 应为浅源')
    eq(depthClass(300).zh, '中源', '300km 应落在中源（上界闭区间）')
    eq(depthClass(600).zh, '深源', '600km 应为深源')
    eq(depthClass(null).label, '未知', '深度缺失时也要有 label')
  }],

  ['海况分档边界', () => {
    eq(waveLevel(0.14).zh, '平静', '0.14m 应为平静')
    eq(waveLevel(2.8).zh, '巨浪', '2.8m 应为巨浪')
  }],

  /* ---------- 分档表结构自检 ---------- */
  /**
   * 这条来自一次真实事故：AQI_LEVELS 只写 max 没写 min，
   * DictTab 渲染末档时算出「> undefined」并显示在页面上。
   * 构建、lint、类型检查全都发现不了，只有这条断言能抓到。
   */
  ['分档表的 min/max 必须成对且 max 递增', () => {
    for (const [name, bands] of Object.entries(BAND_TABLES)) {
      const entries = Object.entries(bands)
      ok(entries.length >= 3, `${name} 分档数量过少`)
      for (const [key, b] of entries) {
        ok(pickText(b.zh, 'zh-CN').length > 0, `${name}.${key} 缺 zh`)
        ok(/^#[0-9a-f]{6}$/i.test(b.color), `${name}.${key} 的 color 必须是 6 位 hex，实际 ${b.color}`)
        ok(b.min !== undefined, `${name}.${key} 缺 min（末档会渲染成「> undefined」）`)
        ok(b.max !== undefined, `${name}.${key} 缺 max`)
      }
      // max 必须严格递增，否则 bandOf「命中第一个」的语义会失效
      const maxes = entries.map(([, b]) => b.max)
      for (let i = 1; i < maxes.length; i++) {
        ok(maxes[i] > maxes[i - 1], `${name} 第 ${i} 档的 max 未递增：${maxes[i - 1]} → ${maxes[i]}`)
      }
    }
  }],

  /* ---------- 枚举表 ---------- */
  ['NHC 真实分类全部有译名', () => {
    LIVE_CYCLONE_CLASSES.forEach((c) => {
      const t = zhCycloneClass(c)
      ok(t && t.zh && t.zh !== c, `${c} 未翻译`)
      ok(t.desc.length > 5, `${c} 释义过短`)
    })
    eq(zhCycloneClass('HU').zh, '飓风', 'HU 应译为飓风')
    eq(zhCycloneClass('PTC').zh, '潜在热带气旋', 'PTC 译名固定')
    notEq(zhCycloneClass('XYZ').zh, '', '未收录的 NHC 分类不应为空')
  }],

  ['萨菲尔–辛普森等级', () => {
    eq(zhCycloneScale('C4').zh, '四级飓风', 'C4 应为四级飓风')
    eq(zhCycloneScale('C5').cat, 5, 'C5 的 cat 应为 5')
    eq(SAFFIR_SIMPSON.TS.cat, 0, '热带风暴的 cat 应为 0（未达飓风）')
    Object.entries(SAFFIR_SIMPSON).forEach(([k, s]) => {
      ok(s.kt && s.ms && s.desc, `${k} 字段不全`)
    })
  }],

  ['潮位基准面与气候振荡译名', () => {
    eq(zhTideDatum('MLLW').zh, '平均较低低潮面', 'MLLW 译名固定')
    ok(TIDE_DATUMS.MSL && TIDE_DATUMS.MHHW, '基准面表应含 MSL 与 MHHW')
    ok(zhOscillation('pdo').period.includes('20'), 'PDO 周期应为 20–30 年量级')
    ok(zhOscillation('amo').period.includes('60'), 'AMO 周期应为 60–80 年量级')
    Object.values(OSCILLATIONS).forEach((o) => ok(o.region && o.desc, `${o.zh} 字段不全`))
  }],

  ['温室气体的单位与增温潜势', () => {
    eq(zhGreenhouseGas('co2').unit, 'ppm', 'CO₂ 单位应为 ppm')
    eq(zhGreenhouseGas('ch4').unit, 'ppb', 'CH₄ 单位应为 ppb')
    ok(zhGreenhouseGas('ch4').gwp100 > 20, 'CH₄ 的百年增温潜势应大于 20')
    ok(
      zhGreenhouseGas('n2o').gwp100 > zhGreenhouseGas('ch4').gwp100,
      'N₂O 的 GWP 应高于 CH₄',
    )
    // 缺 preIndustrial 会让「相对工业化前倍数」算出 Infinity
    Object.entries(GREENHOUSE_GASES).forEach(([k, g]) => {
      ok(g.preIndustrial > 0, `${k} 缺工业化前本底值`)
      ok(g.gwp100 >= 1, `${k} 的 GWP 应 ≥1（以 CO₂ 为 1）`)
    })
  }],

  /* ---------- 火山 / 海啸等级表 ---------- */
  /**
   * 这三张表是**离散的业务等级**，不是数值分档，因此没有 min/max，
   * 靠 rank 表达轻重。rank 的取值被两处逻辑直接依赖，改错就会静默出错：
   *   · 页面 threatCount 用 rank >= 2 判断「是否构成威胁」
   *   · 火山 elevated 计数用 ORANGE/RED 判断「是否真在动」
   * 所以这里把 rank 的相对顺序钉死。
   */
  ['火山与海啸等级表的 rank 必须严格递增', () => {
    const TABLES = { VOLCANO_ALERTS, AVIATION_CODES, TSUNAMI_CATEGORIES }
    for (const [name, dict] of Object.entries(TABLES)) {
      const entries = Object.entries(dict)
      eq(entries.length, 4, `${name} 应为 4 级`)
      const ranks = []
      for (const [key, b] of entries) {
        ok(pickText(b.zh, 'zh-CN').length > 0, `${name}.${key} 缺 zh`)
        ok(pickText(b.desc, 'zh-CN').length > 5, `${name}.${key} 释义过短`)
        ok(/^#[0-9a-f]{6}$/i.test(b.color), `${name}.${key} 的 color 必须是 6 位 hex`)
        ok(Number.isFinite(b.rank), `${name}.${key} 的 rank 必须是数字`)
        ranks.push(b.rank)
      }
      for (let i = 1; i < ranks.length; i++) {
        ok(ranks[i] > ranks[i - 1], `${name} 第 ${i} 级 rank 未递增：${ranks[i - 1]} → ${ranks[i]}`)
      }
    }
  }],

  ['海啸等级：信息声明必须是最低档', () => {
    // 页面用 rank>=2 统计「构成威胁」，Information 若不是 1 就会被误算成威胁
    eq(zhTsunamiCategory('Information').rank, 1, '信息声明 rank 必须为 1')
    eq(zhTsunamiCategory('Warning').rank, 4, '海啸警报 rank 必须为 4')
    ok(
      zhTsunamiCategory('Warning').rank > zhTsunamiCategory('Advisory').rank,
      '警报应比建议更严重',
    )
    eq(zhTsunamiCategory('Warning').zh, '海啸警报', 'Warning 译名固定')
  }],

  ['火山色码与警报级是两套独立体系', () => {
    eq(zhAviationCode('ORANGE').zh, '橙色', 'ORANGE 译名固定')
    eq(zhAviationCode('RED').rank, 4, 'RED 应为最高级')
    eq(zhVolcanoAlert('WARNING').zh, '警告', 'WARNING 译名固定')
    // 「橙及以上才算真在动」是页面 elevated 的判据，ORANGE 必须 >= 3
    ok(zhAviationCode('ORANGE').rank >= 3, 'ORANGE 的 rank 应 ≥3，否则 elevated 计数口径会变')
    // 未收录值要有兜底，不能让页面渲染出空 Tag
    eq(zhAviationCode('PURPLE').zh, 'PURPLE', '未收录色码应原样透出')
  }],

  /* ---------- KPI 词典完整性 ---------- */
  ['KPI 分组引用的 key 都存在且字段齐全', () => {
    const keys = Object.keys(EARTH_KPI_DEFS)
    ok(keys.length >= 25, `KPI 词条数量偏少：${keys.length}`)
    const seen = new Set()
    for (const g of EARTH_KPI_GROUPS) {
      // title / alias 已是 { 'zh-CN':…, en:… }，取原文再校验
      const title = pickText(g.title, 'zh-CN')
      ok(title && g.icon, `分组「${title}」缺标题或图标`)
      ok(g.items.length > 0, `分组「${title}」为空`)
      for (const [key, alias] of g.items) {
        const d = EARTH_KPI_DEFS[key]
        ok(d, `分组「${title}」引用了不存在的词条 key：${key}`)
        ok(pickText(alias, 'zh-CN').length > 0, `${key} 缺别名`)
        seen.add(key)
        for (const field of ['zh', 'unit', 'what', 'scale', 'soWhat']) {
          ok(pickText(d[field], 'zh-CN').length > 0, `${key} 缺字段 ${field}`)
        }
        // 释义里混进 undefined / NaN 说明模板串拼错
        const prose = ['what', 'scale', 'soWhat'].map((f) => pickText(d[f], 'zh-CN')).join('')
        ok(!/undefined|NaN/.test(prose), `${key} 的释义里出现 undefined/NaN`)
      }
    }
    // 每个词条至少被一个分组引用，否则它在页面上永远看不到
    for (const k of keys) ok(seen.has(k), `词条 ${k} 没有被任何分组引用`)
  }],

  ['海洋看板过滤出的分组都能取到', () => {
    const OCEAN_TITLES = ['海浪', '潮汐', '海温与气候振荡', '热带气旋', '冰冻圈']
    const ocean = EARTH_KPI_GROUPS.filter((g) => OCEAN_TITLES.includes(pickText(g.title, 'zh-CN')))
    eq(ocean.length, OCEAN_TITLES.length, '海洋看板过滤出的分组数量应与清单一致')
    const n = ocean.reduce((s, g) => s + g.items.length, 0)
    ok(n >= 15, `海洋词典条目偏少：${n}`)
    // 浮标页签的科普引用了这条，分组里删掉它页面就会出现空白卡
    ok(
      ocean.some((g) => g.items.some(([k]) => k === 'buoy')),
      '海洋分组应含「海洋浮标观测」',
    )
  }],

  ['火山与海啸分组能取到', () => {
    const g = EARTH_KPI_GROUPS.find((x) => pickText(x.title, 'zh-CN') === '火山与海啸')
    ok(g, '应存在「火山与海啸」分组')
    for (const key of ['volcanoAlert', 'aviationColor', 'tsunami', 'tsunamiSpeed']) {
      ok(g.items.some(([k]) => k === key), `火山与海啸分组应含 ${key}`)
    }
  }],

  ['枚举 / 分档表的文案字段都有中英两稿', () => {
    const TABLES = {
      CYCLONE_CLASSES, SAFFIR_SIMPSON, AQI_LEVELS, UV_LEVELS, MAGNITUDE_BANDS,
      DEPTH_ZONES, WAVE_STATES, TIDE_DATUMS, OSCILLATIONS,
      VOLCANO_ALERTS, AVIATION_CODES, TSUNAMI_CATEGORIES,
    }
    for (const [name, dict] of Object.entries(TABLES)) {
      for (const [key, b] of Object.entries(dict)) {
        ok(pickText(b.zh, 'en').length > 0, `${name}.${key} 缺英文译名`)
        ok(pickText(b.zh, 'en') !== pickText(b.zh, 'zh-CN'), `${name}.${key} 英文与中文相同（漏译？）`)
        if (b.desc !== undefined) ok(pickText(b.desc, 'en').length > 0, `${name}.${key} 缺英文释义`)
        if (b.advice !== undefined) ok(pickText(b.advice, 'en').length > 0, `${name}.${key} 缺英文建议`)
      }
    }
  }],

  ['切英文时取值函数返回英文，且字段是字符串不是对象', () => {
    const b = aqiLevel(35, 'en')
    eq(typeof b.zh, 'string', 'zh 必须是字符串，不能是 {lang} 对象（否则 React 会抛错）')
    ok(b.zh.length > 0 && !/[一-鿿]/.test(b.zh), 'AQI 等级应为英文')
    ok(aqiLevel(35, 'en').desc.length > 0, 'desc 应为非空字符串')
    ok(magBand(7.7, 'en').zh.length > 0, '震级分档英文非空')
    ok(depthClass(10, 'en').zh.length > 0, '深度分带英文非空')
    ok(waveLevel(2.8, 'en').zh.length > 0, '海况等级英文非空')
    ok(uvLevel(11, 'en').advice.length > 0, '紫外线建议英文非空')
    ok(zhCycloneClass('HU', 'en').zh.length > 0, 'NHC 分类英文非空')
    ok(!/[一-鿿]/.test(zhCycloneClass('HU', 'en').zh), 'NHC 分类英文不应残留中文')
    ok(zhTsunamiCategory('Warning', 'en').zh.length > 0, '海啸等级英文非空')
    // 未收录枚举在英文下也要有兜底释义，不能渲染出空
    ok(zhAviationCode('PURPLE', 'en').desc.length > 0, '未收录色码的英文兜底释义非空')
    // KPI 词典
    const kpi = getEarthKpi('oni', 'en')
    ok(kpi && kpi.what.length > 0 && !/[一-鿿]/.test(kpi.what), 'ONI 英文释义非空且无中文残留')
    ok(kpi.zh.length > 0, 'ONI 英文名称非空')
    const groups = getEarthKpiGroups('en')
    ok(groups.length > 0 && typeof groups[0].title === 'string', '分组标题必须是字符串')
    ok(
      groups.every((g) => g.items.every(([, a]) => typeof a === 'string' && a.length > 0)),
      '分组别名必须是非空字符串',
    )
    // 未翻译语种（如 de）应落英文而不是落中文
    ok(!/[一-鿿]/.test(aqiLevel(35, 'de').zh), '未翻译语种应回退英文，而不是回退中文')
    // zh-TW 未单独翻译时应回退简体中文
    ok(/[一-鿿]/.test(aqiLevel(35, 'zh-TW').zh), 'zh-TW 应回退简体中文')
  }],
]
