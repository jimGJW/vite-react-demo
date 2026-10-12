/**
 * 三看板「关联数据」关系表 · 纯函数单测（零依赖）
 * 覆盖 src/lib/boards/relations.js。
 *
 * 为什么这值得单测：关系表是**跨看板**的，键是手写的 `'看板.页签'` 字符串。
 * 写错一个字母不会让构建失败，只会让某个模块底部的关联卡片悄悄消失（或跳到不存在的页签）。
 * 这和此前 /timeline 把 ghg 写成 co2 是同一类错配，必须在 CI 里钉死。
 */
import { BOARD_META, BOARD_SCOPE, TAB_LABELS, TAB_KEYS, getRelated, getTerm } from '../../src/lib/boards/relations.js'
import { healthOf } from '../../src/lib/boards/health.js'
import { eq, ok } from './harness.mjs'

/** 辅助页签：案例本身不参与数据关联，允许没有关联项（名词解释已集中到 /timeline） */
const AUX_TABS = ['cases']

const allTabPairs = () =>
  Object.entries(TAB_LABELS).flatMap(([board, m]) => Object.keys(m).map((tab) => [board, tab]))

export default [
  ['三看板元信息齐全', () => {
    for (const key of ['astro', 'geo', 'ocean']) {
      const m = BOARD_META[key]
      ok(m, `缺看板元信息 ${key}`)
      ok(m.title && m.title.length > 0, `${key} 缺标题`)
      ok(m.icon && m.icon.length > 0, `${key} 缺图标`)
      ok(/^#[0-9a-f]{6}$/i.test(m.color), `${key} 主色必须是 6 位 hex，实际 ${m.color}`)
      ok(m.path.startsWith('/'), `${key} 的 path 应以 / 开头`)
      ok(TAB_LABELS[key][m.defaultTab], `${key} 的 defaultTab(${m.defaultTab}) 不是真实页签`)
    }
  }],

  ['TAB_KEYS 与 TAB_LABELS 覆盖范围一致', () => {
    for (const board of Object.keys(TAB_LABELS)) {
      const expected = Object.keys(TAB_LABELS[board]).sort()
      const actual = [...TAB_KEYS[board]].sort()
      eq(JSON.stringify(actual), JSON.stringify(expected), `${board} 的 TAB_KEYS 与页签表不一致`)
    }
  }],

  ['每条关联都指向真实存在的看板 · 页签', () => {
    for (const [board, tab] of allTabPairs()) {
      for (const it of getRelated(board, tab)) {
        ok(BOARD_META[it.board], `${board}.${tab} 的关联指向未知看板 ${it.board}`)
        ok(
          TAB_LABELS[it.board] && TAB_LABELS[it.board][it.tab],
          `${board}.${tab} 的关联指向不存在的页签 ${it.to}（键名写错？）`,
        )
        // 渲染要用的字段必须都在，否则卡片会出现空白
        ok(it.label && it.label.length > 0, `${it.to} 缺页签显示名`)
        ok(it.icon && it.color && it.path, `${it.to} 缺图标/主色/路径`)
      }
    }
  }],

  ['不出现自关联', () => {
    for (const [board, tab] of allTabPairs()) {
      for (const it of getRelated(board, tab)) {
        ok(it.to !== `${board}.${tab}`, `${board}.${tab} 把自己列为关联，没有意义`)
      }
    }
  }],

  ['关联理由非空、够长，且不只是复述页签名', () => {
    /* 说明：这里**不**用正则去匹配"因为/所以/→"之类的因果词——试过，30 条里 18 条
       正当理由被误杀（假阳性 60%），是个坏测试。因果是否成立只能靠人工评审，
       机器能守住的是：别写空、别把 undefined 渲染出来、别拿页签名当理由充数。 */
    for (const [board, tab] of allTabPairs()) {
      for (const it of getRelated(board, tab)) {
        ok(it.why && it.why.length >= 12, `${it.to} 的关联理由过短：${it.why}`)
        ok(!/undefined|NaN/.test(it.why), `${it.to} 的关联理由里出现 undefined/NaN`)
        ok(it.why !== it.label, `${it.to} 的关联理由只是复述页签名，没有信息量`)
      }
    }
  }],

  ['主内容页签都有关联数据（辅助页签可以没有）', () => {
    /* 下限钉 3：用户要求「每一项至少三个」。当前实际每个主内容页签都 ≥5 条，
       这里不钉 5 是为了避免以后正常增删动辄触发红灯——下限才是契约，数量是现状。 */
    for (const [board, tab] of allTabPairs()) {
      if (AUX_TABS.includes(tab)) continue
      const rel = getRelated(board, tab)
      ok(rel.length >= 3, `${board}.${tab} 是主内容页签，关联项只有 ${rel.length} 条（应 ≥3）`)
    }
  }],

  ['同一页签内不出现重复关联（React key 会撞）', () => {
    for (const [board, tab] of allTabPairs()) {
      const seen = new Set()
      for (const it of getRelated(board, tab)) {
        ok(!seen.has(it.to), `${board}.${tab} 重复关联了 ${it.to}`)
        seen.add(it.to)
      }
    }
  }],

  ['辅助页签不渲染关联（getRelated 返回空）', () => {
    for (const board of Object.keys(TAB_LABELS)) {
      for (const tab of AUX_TABS) {
        eq(getRelated(board, tab).length, 0, `${board}.${tab} 是辅助页签，不该有关联数据`)
      }
    }
  }],

  ['getRelated 对未知输入安全返回空数组', () => {
    eq(getRelated('astro', 'not-a-tab').length, 0, '未知页签应返回空')
    eq(getRelated('nope', 'quake').length, 0, '未知看板应返回空')
    eq(getRelated(undefined, undefined).length, 0, 'undefined 输入应返回空')
    eq(getRelated(null, null).length, 0, 'null 输入应返回空')
  }],

  ['每条关联都带资料解释（展开区不能是空的）', () => {
    /* why 只回答"为什么相关"，detail 才回答"看到了该怎么理解"。
       没有 detail 的关联卡片点开就是一片空白，等于挂了个假按钮。 */
    for (const [board, tab] of allTabPairs()) {
      for (const it of getRelated(board, tab)) {
        ok(it.detail && it.detail.length >= 40, `${it.to} 的资料解释过短或缺失：${it.detail}`)
        ok(!/undefined|NaN/.test(it.detail), `${it.to} 的资料解释里出现 undefined/NaN`)
        ok(it.detail !== it.why, `${it.to} 的资料解释只是把 why 复制了一遍，展开没有新增信息`)
      }
    }
  }],

  ['每条关联的名词都能在词典里查到（含完整释义）', () => {
    /* 名词 key 是手写的字符串，写错不会报错，只会让释义区静默空白。
       这里逐个 getTerm 验证，等价于"词典里真有这个词"。 */
    for (const [board, tab] of allTabPairs()) {
      for (const it of getRelated(board, tab)) {
        ok(it.terms.length >= 1, `${it.to} 没有配任何名词`)
        for (const { b: dictName, k } of it.terms) {
          ok(dictName === 'astro' || dictName === 'earth', `${it.to} 的名词词典名非法：${dictName}`)
          const term = getTerm(dictName, k)
          ok(term, `${it.to} 的名词 ${dictName}.${k} 在词典里查不到（键名写错？）`)
          ok(term.zh && term.zh.length > 0, `${dictName}.${k} 缺中文名`)
          ok(term.what && term.what.length >= 10, `${dictName}.${k} 缺释义正文`)
          ok(BOARD_META[term.board], `${dictName}.${k} 归属看板 ${term.board} 不存在`)
          // 名词现已集中到 /timeline 的聚合名词库（GlossaryHub），不再依赖各看板的 dict 页签；
          // 这里只校验归属看板真实存在即可，跳转统一走 /timeline。
        }
      }
    }
  }],

  ['getTerm 对未知名词返回 null（调用方跳过，不渲染空卡）', () => {
    eq(getTerm('astro', 'nope-not-a-term'), null, '未知名词应返回 null')
    eq(getTerm('earth', 'nope-not-a-term'), null, '未知名词应返回 null')
    eq(getTerm('wrong-dict', 'kp'), null, '未知词典应返回 null')
    eq(getTerm(undefined, undefined), null, 'undefined 输入应返回 null')
  }],

  ['三方监控范围齐全（三方监控条要用）', () => {
    for (const key of ['astro', 'geo', 'ocean']) {
      const s = BOARD_SCOPE[key]
      ok(s, `缺 ${key} 的监控范围`)
      ok(s.scope && s.scope.length >= 8, `${key} 的监控范围描述过短`)
      ok(Array.isArray(s.watch) && s.watch.length >= 4, `${key} 的监控要点少于 4 条`)
      for (const w of s.watch) ok(w && w.length > 0, `${key} 的监控要点里有空字符串`)
    }
  }],

  ['healthOf 统计口径：有数据且未 stale 才算正常', () => {
    const live = { data: { ok: true } }
    const stale = { data: { ok: true, stale: true } }
    const failed = { error: 'boom' }
    const pending = {}
    eq(healthOf([live, live, stale, failed, pending]).ok, 2, '只应统计活的源')
    eq(healthOf([live, live, stale, failed, pending]).total, 5, '总数应包含所有源')
    eq(healthOf([]).ok, 0, '空数组应为 0')
    eq(healthOf([]).total, 0, '空数组总数应为 0')
  }],

  ['关联是双向可达的（避免单向死链）', () => {
    /* 不要求严格对称，但每个"被关联到的"主内容页签自己也该有关联可看，
       否则读者点进去就到了一个没有出路的页面。 */
    const targets = new Set()
    for (const [board, tab] of allTabPairs()) {
      for (const it of getRelated(board, tab)) {
        if (!AUX_TABS.includes(it.tab)) targets.add(it.to)
      }
    }
    for (const to of targets) {
      const [b, t] = to.split('.')
      ok(getRelated(b, t).length > 0, `${to} 被别人关联，但自己没有任何关联（成了死胡同）`)
    }
  }],
]
