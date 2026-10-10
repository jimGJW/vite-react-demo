/**
 * 天文术语表与 KPI 词典 · 纯函数单测（零依赖）
 * 覆盖 src/lib/astro/glossary.js。
 *
 * 为什么这值得单测：
 *   术语表是「人工维护 + 上游随时会变」的交界处。最怕两种退化——
 *     ① 上游新增枚举没收录，页面开始显示空白或裸英文；
 *     ② 词典条目缺字段，气泡里出现空行。
 *   两者都不会让构建失败，只会在页面上悄悄坏掉，所以必须用断言钉住。
 */
import {
  DISCOVERY_METHODS,
  MISSION_TYPES,
  LAUNCH_STATUS,
  GALAXY_TYPE,
  FLARE_CLASSES,
  PROTON_SCALES,
  ALERT_LEVELS,
  DSO_TYPES,
  KPI_DEFS,
  KPI_GROUPS,
  zhMethod,
  zhMissionType,
  zhLaunchStatus,
  zhGalaxyType,
  lookup,
} from '../../src/lib/astro/glossary.js'
import { eq, ok } from './harness.mjs'

/**
 * 真实上游枚举快照（2026-10 从接口实抓）。
 * 刻意写死字面量而不是遍历表本身——遍历自己等于没测。
 */
const LIVE_METHODS = [
  'Transit', 'Radial Velocity', 'Microlensing',
  'Imaging', 'Transit Timing Variations', 'Eclipse Timing Variations',
]
const LIVE_MISSION_TYPES = [
  'Communications', 'Resupply', 'Planetary Science',
  'Test Flight', 'Technology', 'Dedicated Rideshare', 'Government/Top Secret',
]
const LIVE_LAUNCH_STATUS = [
  ['Go for Launch', 'Go'],
  ['To Be Determined', 'TBD'],
]

export default [
  /* ---------- 覆盖度：真实枚举必须全部收录 ---------- */
  ['真实发现方法全部有中文译名', () => {
    LIVE_METHODS.forEach((m) => {
      const t = zhMethod(m)
      ok(t, `${m} 查不到`)
      ok(t.zh && t.zh !== m, `${m} 未翻译`)
      ok(t.desc.length > 15, `${m} 释义过短`)
    })
  }],

  ['真实任务类型全部有中文译名', () => {
    LIVE_MISSION_TYPES.forEach((m) => {
      const t = zhMissionType(m)
      ok(t && t.zh !== m, `${m} 未翻译`)
    })
  }],

  ['真实发射状态按缩写优先匹配且带色调', () => {
    LIVE_LAUNCH_STATUS.forEach(([name, abbr]) => {
      const t = zhLaunchStatus(name, abbr)
      ok(t.zh !== name, `${name} 未翻译`)
      ok(/^#[0-9a-f]{6}$/i.test(t.tone), `${name} 缺合法色调`)
    })
  }],

  ['发射状态缩写缺失时退化到全名匹配', () => {
    eq(zhLaunchStatus('Go for Launch', null).zh, '允许发射')
    eq(zhLaunchStatus('Completed', undefined).zh, '已完成')
  }],

  ['银河系类型中文化', () => {
    eq(zhGalaxyType('Barred Spiral').zh, '棒旋星系')
  }],

  /* ---------- 兜底：未收录必须原样透出 ---------- */
  ['未知枚举原样透出而非吞掉', () => {
    const t = zhMethod('Some Brand New NASA Method 2099')
    eq(t.zh, 'Some Brand New NASA Method 2099')
    eq(t.en, 'Some Brand New NASA Method 2099')
  }],

  ['未知发射状态给出兜底描述而非崩溃', () => {
    const t = zhLaunchStatus('Weird New Status', 'WNS')
    ok(t && t.zh && t.desc, '未知状态应有兜底')
  }],

  ['空值与 null 返回 null', () => {
    eq(lookup('', DISCOVERY_METHODS), null)
    eq(zhMethod(null), null)
    eq(zhMethod(undefined), null)
    eq(zhMethod('   '), null)
  }],

  ['查询对大小写与空白敏感时给出原文而非误伤', () => {
    // 上游理论上是规范值，但万一有大小写差异，至少不能返回 undefined
    ok(zhMethod('transit'), '小写也应返回对象')
  }],

  /* ---------- KPI 词典：四要素齐全 ---------- */
  ['每条 KPI 都有中文名/单位/是什么/怎么读/所以呢', () => {
    Object.entries(KPI_DEFS).forEach(([k, d]) => {
      ok(d.zh, `${k} 缺中文名`)
      ok(d.unit, `${k} 缺单位`)
      ok(d.what && d.what.length > 15, `${k} 「是什么」缺失或过短`)
      ok(d.scale, `${k} 缺「怎么读」`)
      ok(d.soWhat && d.soWhat.length > 15, `${k} 「所以呢」缺失或过短`)
    })
  }],

  ['单位字段只放单位，不塞解释', () => {
    Object.entries(KPI_DEFS).forEach(([k, d]) => {
      ok(d.unit.length <= 30, `${k} 单位字段被写成了解释: "${d.unit}"`)
    })
  }],

  ['用户点名的 G 级语义已收录', () => {
    // 用户明确提过「go 代表平静」这类需求，这几条必须钉死
    ok(KPI_DEFS.gscale, '缺 gscale')
    ok(KPI_DEFS.gscale.scale.includes('G0'), 'gscale 未解释 G0')
    ok(KPI_DEFS.gscale.scale.includes('平静'), 'gscale 未说明「平静」')
    ok(KPI_DEFS.kp.what.length > 15, 'kp 未解释')
  }],

  /* ---------- 分组完整性 ---------- */
  ['分组引用的 key 全部存在且无孤儿 KPI', () => {
    const seen = new Set()
    KPI_GROUPS.forEach((g) => {
      ok(g.title, '分组缺标题')
      ok(g.items.length > 0, `分组 ${g.title} 无条目`)
      g.items.forEach(([key, alias]) => {
        ok(KPI_DEFS[key], `分组引用了不存在的 key: ${key}`)
        ok(alias, `${key} 缺展示别名`)
        seen.add(key)
      })
    })
    const orphans = Object.keys(KPI_DEFS).filter((k) => !seen.has(k))
    eq(orphans.length, 0, `有 KPI 未归入分组: ${orphans.join(', ')}`)
  }],

  ['词典规模符合预期（防止误删整段）', () => {
    ok(Object.keys(KPI_DEFS).length >= 18, 'KPI 条目过少，疑似误删')
    // 5 组：卫星与轨道 / 空间天气 / 太阳活动 / 天体尺度与距离 / 星表与观测
    eq(KPI_GROUPS.length, 5, 'KPI 分组数不对，疑似误删整段')
  }],

  ['新增词典表（耀斑/质子/警报/深空天体）条目齐全', () => {
    for (const [dict, label] of [
      [FLARE_CLASSES, '耀斑等级'],
      [PROTON_SCALES, '质子事件等级'],
      [ALERT_LEVELS, '警报级别'],
      [DSO_TYPES, '深空天体类型'],
    ]) {
      ok(Object.keys(dict).length > 0, `${label} 词典为空`)
      for (const [en, item] of Object.entries(dict)) {
        ok(item && item.zh, `${label} 的 ${en} 缺中文名`)
        ok(item.desc && item.desc.length >= 6, `${label} 的 ${en} 释义过短：${item.desc}`)
      }
    }
  }],

  /* ---------- 表本身的自洽 ---------- */
  ['术语表条目字段齐全且释义充分', () => {
    for (const [dict, label] of [
      [DISCOVERY_METHODS, '发现方法'],
      [MISSION_TYPES, '任务类型'],
      [LAUNCH_STATUS, '发射状态'],
      [GALAXY_TYPE, '星系类型'],
    ]) {
      for (const [en, item] of Object.entries(dict)) {
        ok(item && item.zh, `${label} 的 ${en} 缺中文名`)
        // 释义要能独立讲清「这是个啥」，太短（如「不载人的任务。」）没有信息量
        ok(item.desc && item.desc.length > 8, `${label} 的 ${en} 释义过短: "${item.desc}"`)
      }
    }
  }],

  /*
   * 说明：这里刻意**不**断言「同一译名不得出现两次」。
   * LAUNCH_STATUS 里 'Go' 与 'Go for Launch' 是同一状态的缩写/全名两条 key，
   * 译名相同是正确的；同理 TBD 与 To Be Determined。
   * 真正要防的是「两种不同说法并存」（如把 Resupply 同时译成「补给」和「货运补给」），
   * 那属于用词不一致，但靠人工评审比靠断言更合适——枚举表天然会有意合法的重复。
   */
  ['发射状态的缩写与全名成对收录', () => {
    const pairs = [
      ['Go', 'Go for Launch'],
      ['TBD', 'To Be Determined'],
    ]
    pairs.forEach(([abbr, full]) => {
      ok(LAUNCH_STATUS[abbr], `缺缩写 ${abbr}`)
      ok(LAUNCH_STATUS[full], `缺全名 ${full}`)
      eq(LAUNCH_STATUS[abbr].zh, LAUNCH_STATUS[full].zh, `${abbr} 与 ${full} 译名应一致`)
    })
  }],

  ['含空格的枚举 key 已正确加引号（防解析错误复发）', () => {
    // 这个断言看起来多余，但之前真的漏过一次引号导致整个模块 Parsing error
    ok(DISCOVERY_METHODS['Transit Timing Variations'], '多词 key 丢失')
    ok(LAUNCH_STATUS['Go for Launch'], '多词 key 丢失')
    ok(GALAXY_TYPE['Barred Spiral'], '多词 key 丢失')
  }],
]