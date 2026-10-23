/**
 * 洪荒双阵 · 数据底座单测（零依赖）
 * 覆盖 src/components/Honghuang/{xingdou-data,beasts-data,zuwu-data}.js。
 *
 * 为什么值得单测：这一模块的全部说服力都建立在「数字对得上」上 ——
 * 宿度合计必须正好 365，星位与妖兽必须正好 1:1 且不重名，祖巫必须 12 位且
 * 地支不撞。任何一个被改坏，页面上「周天」「三百六十五」的说法就当场变成假话，
 * 而这些恰恰是肉眼看不出来的错。
 */
import { eq, length, ok } from './harness.mjs'
import {
  ARRAY_EYE,
  BRANCH,
  MAIN_STARS,
  MANSIONS,
  QUADRANTS,
  QUAD_ARCS,
  branchOf,
  RINGS,
  STARS,
  STARS_BY_BRANCH,
  STARS_BY_MANSION,
  STAR_COUNT,
  TOTAL_DU,
} from '../../src/components/Honghuang/xingdou-data.js'
import {
  BEASTS,
  BEAST_NAME_DUPLICATES,
  BEAST_ORIGIN_COUNT,
  PROVENANCE,
  RANK_LABEL,
} from '../../src/components/Honghuang/beasts-data.js'
import { BRANCHES, SKY_GATE, ZUWU_BY_BRANCH, ZUWU_COUNT, ZUWU_LIST } from '../../src/components/Honghuang/zuwu-data.js'

export default [
  ['汉制二十八宿宿度合计正好 365', () => {
    length(MANSIONS, 28)
    eq(TOTAL_DU, 365)
    eq(TOTAL_DU, MANSIONS.reduce((s, m) => s + m.du, 0))
  }],

  ['四方宿度与《汉书·律历志》所载一致（东 75 / 北 98 / 西 80 / 南 112）', () => {
    const sum = MANSIONS.reduce((acc, m) => {
      acc[m.quadrant] = (acc[m.quadrant] || 0) + m.du
      return acc
    }, {})
    eq(sum.东, 75)
    eq(sum.北, 98)
    eq(sum.西, 80)
    eq(sum.南, 112)
    for (const q of Object.keys(QUADRANTS)) eq(QUADRANTS[q].sum, sum[q])
  }],

  ['宿名唯一、宿禽齐备、每宿度数至少 2', () => {
    const ELEMENTS = '木金土水火日月'
    const names = new Set()
    for (const m of MANSIONS) {
      ok(!names.has(m.name), `宿名重复：${m.name}`)
      names.add(m.name)
      // 宿禽 = 宿名 + 五行 + 禽兽（角木蛟 / 井木犴 / 轸水蚓…），固定三字
      ok(m.bird.length === 3 && m.bird.startsWith(m.name), `${m.name} 宿禽格式异常：${m.bird}`)
      ok(ELEMENTS.includes(m.bird[1]), `${m.name} 宿禽五行错位：${m.bird}`)
      ok(m.du >= 2, `${m.name} 宿度应 ≥2（实际 ${m.du}）`)
      ok(m.note && m.note.length > 4, `${m.name} 缺一句说明`)
      ok(typeof m.start === 'number' && m.start >= 0)
    }
  }],

  ['星位正好 365，且每宿星数 = 该宿宿度', () => {
    eq(STAR_COUNT, 365)
    length(STARS, TOTAL_DU)
    MANSIONS.forEach((m, i) => eq(STARS_BY_MANSION[i].length, m.du))
    eq(STARS_BY_MANSION.reduce((s, arr) => s + arr.length, 0), 365)
    STARS.forEach((s, i) => {
      eq(s.id, i)
      eq(s.absoluteDu, i + 1)
      ok(s.du >= 1 && s.du <= 35, `${s.name} 宿内序号越界`)
    })
  }],

  ['宿首星各一颗，共 28 颗（盘面上「点宿」的锚点）', () => {
    const heads = STARS.filter((s) => s.isMansionHead)
    length(heads, 28)
    eq(new Set(heads.map((s) => s.mansionIdx)).size, 28)
  }],

  ['角度合法：色角与屏幕角都在 [0,360)，且屏幕角 = 90 − 色角', () => {
    for (const s of STARS) {
      ok(s.angle >= 0 && s.angle < 360, `${s.name} angle 越界：${s.angle}`)
      ok(s.screenAngle >= 0 && s.screenAngle < 360, `${s.name} screenAngle 越界`)
      const expect = (((90 - s.angle) % 360) + 360) % 360
      ok(Math.abs(s.screenAngle - expect) < 1e-9, `${s.name} 屏幕角与色角不互推`)
    }
  }],

  ['盘面定向：角宿（周天起点）落在卯位正东，四象各得其方', () => {
    // 角宿起始 → 屏幕角 ≈ 90°（正东）；虚宿在北方（顶部附近）、井宿在南方（下半盘）
    eq(Math.round(STARS[0].screenAngle), 90)
    const head = (name) => STARS_BY_MANSION[MANSIONS.findIndex((m) => m.name === name)][0].screenAngle
    ok(head('虚') > 315 || head('虚') < 45, `虚宿应近正北，实际 ${head('虚')}`)
    ok(head('井') > 135 && head('井') < 270, `井宿应近正南，实际 ${head('井')}`)
    ok(head('奎') > 225 && head('奎') < 315, `奎宿应近正西，实际 ${head('奎')}`)
  }],

  ['十二宫扇区：不重不漏，合计 365，每宫 30 或 31 星', () => {
    length(BRANCH, 12)
    eq(Object.keys(STARS_BY_BRANCH).length, 12)
    eq(Object.values(STARS_BY_BRANCH).reduce((s, arr) => s + arr.length, 0), 365)
    for (const b of BRANCH) {
      ok(STARS_BY_BRANCH[b].length === 30 || STARS_BY_BRANCH[b].length === 31,
        `${b} 宫星数应为 30/31，实际 ${STARS_BY_BRANCH[b].length}`)
    }
    // 每颗星恰好属于一宫
    eq(new Set(Object.values(STARS_BY_BRANCH).flat().map((s) => s.id)).size, 365)
  }],

  ['星 ↔ 妖兽 1:1 且无一颗星缺兽', () => {
    for (const s of STARS) {
      ok(s.beast && s.beast.name, `${s.name} 没有配兽`)
      ok(s.beast.quote && s.beast.lore, `${s.name} 的配兽 ${s.beast.name} 缺原文或今译`)
    }
    eq(new Set(BEASTS.map((b) => b.name)).size, BEASTS.length)
    eq(BEAST_NAME_DUPLICATES.join(','), '')
  }],

  ['五环层：半径递增、转向交替', () => {
    length(RINGS, 5)
    RINGS.forEach((r, i) => {
      eq(r.ring, i)
      ok(i === 0 || r.radius > RINGS[i - 1].radius, `第 ${i} 环半径未递增`)
      eq(r.dir, i % 2 === 0 ? 1 : -1)
    })
    ok(RINGS[4].radius <= 1, '最外环半径不得超过盘面基准')
  }],

  ['妖兽总表 365 条，来源三档计数钉死（323 / 25 / 17）', () => {
    length(BEASTS, 365)
    eq(BEAST_ORIGIN_COUNT.shanhaijing, 323)
    eq(BEAST_ORIGIN_COUNT.later, 25)
    eq(BEAST_ORIGIN_COUNT.star, 17)
    eq(Object.keys(PROVENANCE).sort().join(','), ['later', 'shanhaijing', 'star'].sort().join(','))
  }],

  ['每条妖兽字段齐备，档位只能是 1/2/3，来源只能是三档之一', () => {
    for (const b of BEASTS) {
      ok(b.name && b.src && b.quote && b.kind && b.lore, `字段缺失：${b.name || '(无名条目)'}`)
      ok([1, 2, 3].includes(b.rank), `${b.name} rank 非法：${b.rank}`)
      ok(['shanhaijing', 'later', 'star'].includes(b.from), `${b.name} from 非法：${b.from}`)
      ok(RANK_LABEL[b.rank] && PROVENANCE[b.from].label, `${b.name} 缺档位或来源标签`)
    }
  }],

  ['《山海经》条目不得标为后世/星官，反之亦然（防止来源串档）', () => {
    const SHAN = /(山经|海外|海内|大荒)/
    for (const b of BEASTS) {
      if (b.from === 'shanhaijing') ok(SHAN.test(b.src), `${b.name} 标为山海经，出处却写 ${b.src}`)
      else ok(!SHAN.test(b.src), `${b.name} 出处 ${b.src} 属《山海经》，来源档却标 ${b.from}`)
    }
  }],

  ['阵眼与二主星：河图洛书为阵眼、日月各一，且都带原文', () => {
    eq(ARRAY_EYE.name, '河图洛书')
    eq(ARRAY_EYE.kind, '阵眼')
    length(MAIN_STARS, 2)
    eq(MAIN_STARS.map((m) => m.id).join(','), 'sun,moon')
    for (const m of MAIN_STARS) ok(m.quote && m.origin && m.color, `${m.name} 缺原文/出处/星色`)
  }],

  ['星上 branch 与 screenAngle 同一真源：branchOf 重算必须一致，分组表由该字段导出', () => {
    for (const s of STARS) eq(s.branch, branchOf(s.screenAngle), `${s.name} 宫位与角度不自洽`)
    for (const b of BRANCH) {
      const fromField = STARS.filter((s) => s.branch === b).map((s) => s.id).join(',')
      eq(STARS_BY_BRANCH[b].map((s) => s.id).join(','), fromField, `${b}宫分组与星上字段不一致`)
    }
  }],

  ['四象盘缘标注：四方相加=周天，且每枚标注正落在本象弧段中央', () => {
    length(QUAD_ARCS, 4)
    eq(QUAD_ARCS.reduce((s, q) => s + q.du, 0), TOTAL_DU)
    eq(new Set(QUAD_ARCS.map((q) => q.quadrant)).size, 4)
    for (const q of QUAD_ARCS) {
      ok(q.screenAngle >= 0 && q.screenAngle < 360, `${q.name} 标注角越界`)
      eq(q.color, QUADRANTS[q.quadrant].color)
      const hit = STARS.find(
        (s) =>
          s.quadrant === q.quadrant &&
          Math.abs((((s.screenAngle - q.screenAngle + 540) % 360) - 180)) < 1,
      )
      ok(hit, `${q.name} 的盘缘角度没有压在本象任何一度上，标错了方位`)
    }
  }],

  ['十二祖巫：地支互不重复、不含戌（天门虚位）、齐 12 位', () => {
    eq(ZUWU_COUNT, 12)
    length(ZUWU_LIST, 12)
    const branches = ZUWU_LIST.map((z) => z.branch)
    eq(new Set(branches).size, 12)
    ok(!branches.includes('戌'), '戌位必须留给天门，不能排祖巫')
    eq(branches.filter((b) => b === '中宫').length, 1, '中宫（帝江）应恰好一位')
    eq(BRANCHES.length, 12)
    eq(BRANCHES.join(''), '子丑寅卯辰巳午未申酉戌亥')
  }],

  ['每位祖巫都写清「小说设定」与「原典实际」', () => {
    for (const z of ZUWU_LIST) {
      ok(z.name && z.office && z.image && z.title, `${z.name} 缺司职/形象/称号`)
      ok(z.quote && z.origin, `${z.name} 缺古籍原文或出处`)
      ok(z.blurb && z.lore, `${z.name} 缺白话与阵法取用`)
      ok(z.reality && z.reality.length > 10, `${z.name} 缺「与原典的差别」说明`)
      ok(z.color && /^#/.test(z.color), `${z.name} 缺配色`)
      eq(ZUWU_BY_BRANCH[z.branch], z)
    }
    eq(SKY_GATE.branch, '戌')
    ok(!ZUWU_BY_BRANCH['戌'], '戌位不应被祖巫占住')
  }],

  ['帝江居中、余十一位按地支排布', () => {
    const center = ZUWU_LIST.find((z) => z.branch === '中宫')
    eq(center.name, '帝江')
    eq(center.direction, '中')
    const map = ZUWU_LIST.reduce((acc, z) => {
      if (z.branch !== '中宫') acc[z.branch] = z.name
      return acc
    }, {})
    eq(map['子'], '玄冥')
    eq(map['午'], '祝融')
    eq(map['卯'], '句芒')
    eq(map['酉'], '蓐收')
  }],
]
