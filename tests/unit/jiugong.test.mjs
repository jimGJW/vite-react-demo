/**
 * 九宫八卦阵 · 数据底座单测（零依赖）
 *
 * 为什么值得单测：这一阵的全部诚实都压在两件事上 ——
 * 「洛书九宫是一个真幻方」和「卦位确实按《说卦》」。前者是数学，
 * 后者是配位表；两者一旦被改坏，页面上「八条线各十五」「可核」的说法
 * 就当场变成假话，而盘面看起来一切正常。八门八风八卦符这些肉眼更难核对，
 * 索性全部交给断言。
 */
import { deepEq, eq, length, ok } from './harness.mjs'
import {
  CLASSICS,
  GRID,
  LENSES,
  LINES,
  LUCK_LABEL,
  MAGIC_SUM,
  PALACES,
  PALACE_COUNT,
  TOUR,
} from '../../src/components/Honghuang/jiugong-data.js'

const BY_NUM = PALACES.reduce((acc, p) => { acc[p.num] = p; return acc }, {})
const uniq = (arr) => [...new Set(arr)]

/** 后天八卦标准序（Unicode 卦符 U+2630 起即按此序排列） */
const GUA_ORDER = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤']
const LINES_YAO = { 乾: '111', 兑: '110', 离: '101', 震: '100', 巽: '011', 坎: '010', 艮: '001', 坤: '000' }
/** 《说卦》后天方位：震东、巽东南、离南、坤西南、兑西、乾西北、坎北、艮东北 */
const GUA_DIR = { 坎: '北', 坤: '西南', 震: '东', 巽: '东南', 乾: '西北', 兑: '西', 艮: '东北', 离: '南' }
/** 卦气说：四正卦主二分二至，四维卦主四立 */
const GUA_JIEQI = { 坎: '冬至', 震: '春分', 离: '夏至', 兑: '秋分', 艮: '立春', 巽: '立夏', 坤: '立秋', 乾: '立冬' }

export default [
  ['九宫数本身是三阶幻方：八条线、每线十五', () => {
    length(GRID, 3)
    deepEq(GRID.flat().sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9])
    length(LINES, 8)
    for (const l of LINES) {
      length(l.cells, 3)
      eq(l.sum, MAGIC_SUM, `一条线相加 ${l.sum} ≠ ${MAGIC_SUM}`)
    }
    /* 八条线必须互不重复（3 行 + 3 列 + 2 对角），否则「八条线」是虚数 */
    const keys = uniq(LINES.map((l) => l.cells.map((c) => `${c.r}${c.c}`).join('-')))
    length(keys, 8)
  }],

  ['宫数与盘面格位一一对应，且由 GRID 单一真源推出', () => {
    eq(PALACE_COUNT, 9)
    length(uniq(PALACES.map((p) => p.num)), 9)
    for (const p of PALACES) {
      eq(GRID[p.r][p.c], p.num, `洛书${p.num} 的格位 (${p.r},${p.c}) 与 GRID 不符`)
    }
    const slots = uniq(PALACES.map((p) => `${p.r},${p.c}`))
    length(slots, 9)
  }],

  ['北在上盘面的方位自洽（古图南上、本盘旋转 180°）', () => {
    const got = PALACES.map((p) => `${p.r},${p.c}=${p.direction}`).sort()
    deepEq(got, [
      '0,0=西北', '0,1=北', '0,2=东北',
      '1,0=西', '1,1=中央', '1,2=东',
      '2,0=西南', '2,1=南', '2,2=东南',
    ].sort())
  }],

  ['八卦各配一宫、中五无卦（卦位依《周易·说卦》）', () => {
    const withGua = PALACES.filter((p) => p.gua)
    length(withGua, 8)
    length(uniq(withGua.map((p) => p.gua)), 8)
    eq(BY_NUM[5].gua, null, '中宫不该有卦')
    for (const p of withGua) {
      eq(p.direction, GUA_DIR[p.gua], `${p.gua} 卦位不是${GUA_DIR[p.gua]}`)
    }
  }],

  ['卦符 Unicode 序与三爻皆正确（自下而上，1 为阳爻）', () => {
    for (const p of PALACES.filter((x) => x.gua)) {
      eq(p.symbol, String.fromCodePoint(0x2630 + GUA_ORDER.indexOf(p.gua)), `${p.gua} 的卦符不对`)
      eq(p.lines, LINES_YAO[p.gua], `${p.gua} 三爻应为 ${LINES_YAO[p.gua]}`)
      ok(/^[01]{3}$/.test(p.lines), `${p.gua} 三爻必须是三位 0/1`)
    }
    length(uniq(PALACES.filter((x) => x.gua).map((p) => p.lines)), 8)
  }],

  ['八门：八宫各得一门、中宫无门，三吉门恰是开休生', () => {
    const gates = PALACES.filter((p) => !p.isCenter).map((p) => p.gate)
    length(gates, 8)
    length(uniq(gates), 8)
    ok(gates.every((g) => g.endsWith('门')), '八门名应以「门」结尾')
    eq(BY_NUM[5].gate, '中军', '中宫不配门')
    deepEq(uniq(PALACES.filter((p) => p.luck === '吉').map((p) => p.gate)).sort(),
      ['休门', '开门', '生门'].sort(), '三吉门不是开、休、生')
    deepEq(PALACES.filter((p) => p.luck === '平').map((p) => p.gate), ['景门'])
    length(PALACES.filter((p) => p.luck === '凶'), 4)
    /* 页面上写的「三吉门／四凶门」必须与数据的实际门数一致 —— 数字对不上就是假话 */
    eq(LUCK_LABEL['吉'], '三吉门')
    eq(LUCK_LABEL['凶'], '四凶门')
    length(PALACES.filter((p) => p.luck !== '—'), 8)
  }],

  ['八风与八方一一对应，中宫无风', () => {
    const winds = PALACES.filter((p) => !p.isCenter)
    length(uniq(winds.map((p) => p.wind)), 8)
    ok(winds.every((p) => p.wind.endsWith('风') && p.wind !== '—'), '八风名应以「风」结尾')
    ok(winds.every((p) => p.wind !== '—' && p.direction !== '—'), '八风须配八方')
    eq(BY_NUM[5].wind, '—', '中宫不该有风')
    eq(BY_NUM[5].direction, '中央')
  }],

  ['八节：四正卦主二分二至，四维卦主四立', () => {
    for (const p of PALACES.filter((x) => x.gua)) {
      eq(p.jieqi, GUA_JIEQI[p.gua], `${p.gua} 所配八节应为 ${GUA_JIEQI[p.gua]}`)
    }
    length(uniq(PALACES.filter((x) => x.gua).map((p) => p.jieqi)), 8)
    eq(BY_NUM[5].jieqi, '—')
  }],

  ['地支配宫：四正卦一支、四维卦双支，与十二宫不相撞', () => {
    deepEq(['坎', '震', '兑', '离'].map((g) => PALACES.find((p) => p.gua === g).branches),
      ['子', '卯', '酉', '午'])
    for (const g of ['艮', '巽', '坤', '乾']) {
      const b = PALACES.find((p) => p.gua === g).branches
      eq(b.length, 2, `${g} 应配两支地支`)
    }
    const all = PALACES.filter((p) => p.gua).flatMap((p) => [...p.branches])
    length(uniq(all), 12)
  }],

  ['巡宫序走满九宫且不重复、末宫归中五', () => {
    length(TOUR, 9)
    deepEq(uniq(TOUR).sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9])
    eq(TOUR[TOUR.length - 1], 5, '巡宫应以中五收尾')
  }],

  ['五层标注对每一宫都能取到可渲染文本', () => {
    length(uniq(LENSES.map((l) => l.key)), LENSES.length)
    for (const l of LENSES) {
      eq(typeof l.pick, 'function', `${l.key} 透镜缺 pick`)
      ok(l.label && l.hint, `${l.key} 透镜缺 label / hint`)
      for (const p of PALACES) {
        const shown = l.pick(p)
        ok(typeof shown === 'string' && shown.length > 0, `${l.key} 透镜在洛书${p.num} 上取到空值`)
      }
    }
  }],

  ['原典列表只允许「原文可核 / 字句待核」两档', () => {
    ok(CLASSICS.length >= 5, `原典只列了 ${CLASSICS.length} 条`)
    for (const c of CLASSICS) {
      ok(c.src && c.text && c.note, `${c.src} 缺字段`)
      ok(c.rank === 1 || c.rank === 2, `${c.src} 档位 ${c.rank} 不在 1/2 内`)
    }
    ok(CLASSICS.some((c) => c.text.includes('帝出乎震')), '《说卦》祖本原文不见了')
    ok(CLASSICS.some((c) => c.src.includes('大戴礼记') && c.text.includes('七五三')), '九宫数表原文不见了')
  }],
]
