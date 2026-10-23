/* =====================================================================
   周天星斗大阵 · 星位数据
   ---------------------------------------------------------------------
   骨架是真的：二十八宿宿度取自《汉书·律历志》所载汉制古度，四方相加
   恰为三百六十五度（东方另有一又四分之一度之奇零，故周天 365.25）。
   每度布一星 → 365 星，且各宿在圆周上占的弧长与其宿度成正比：
   井宿 33 度铺得很开，觜宿 2 度只占窄窄一条 —— 这是「周天」二字的原意，
   不是均分的装饰圈。

   分层诚实原则：
   - MANSIONS / du  → 古籍可核（历法事实）
   - 大阵形制（365 星为基、日月为二主星、河图洛书镇眼） → 洪荒流小说设定
   - 星 ↔ 妖兽配位  → 本项目演绎，《山海经》并无星辰体系（全书未出现 365，
     「星辰」仅两处），故 UI 明确标「配位为演绎」
   ===================================================================== */

import { BEASTS } from './beasts-data.js'

/** 四象：颜色走 --c-* 之外的独立星色，暗底更透亮 */
export const QUADRANTS = {
  东: { key: 'east', name: '东方苍龙', color: '#22d3ee', sum: 75 },
  北: { key: 'north', name: '北方玄武', color: '#818cf8', sum: 98 },
  西: { key: 'west', name: '西方白虎', color: '#e2e8f0', sum: 80 },
  南: { key: 'south', name: '南方朱雀', color: '#fb7185', sum: 112 },
}

const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九',
  '三十', '三十一', '三十二', '三十三', '三十四', '三十五']

/**
 * [宿名, 宿禽（五行配）, 宿度, 一句话说明]
 * 宿度来源：《汉书·律历志》「角一十二，亢九，氐十五，房五，心五，尾十八，箕十一……」
 */
const RAW = [
  // 东方苍龙七宿 · 合 75 度
  ['角', '角木蛟', 12, '苍龙之角，二月二「龙抬头」抬的就是它'],
  ['亢', '亢金龙', 9, '龙颈，主疾与死丧'],
  ['氐', '氐土貉', 15, '龙胸，古称「天根」'],
  ['房', '房日兔', 5, '龙腹，又名「天驷」，掌车马与布政'],
  ['心', '心月狐', 5, '龙心，内含「大火」，古以定农时'],
  ['尾', '尾火虎', 18, '龙尾，主九子与后宫'],
  ['箕', '箕水豹', 11, '龙尾摆动处，古语「月丽于箕则多风」'],
  // 北方玄武七宿 · 合 98 度
  ['斗', '斗木獬', 26, '南斗六星，主爵禄与寿数'],
  ['牛', '牛金牛', 8, '牵牛，七夕故事里的银河西岸'],
  ['女', '女土蝠', 12, '须女，主布帛与裁制'],
  ['虚', '虚日鼠', 10, '玄武之虚，主丧事与冢宰'],
  ['危', '危月燕', 17, '龟甲，主盖屋与架梁'],
  ['室', '室火猪', 16, '营室，主营造与军粮'],
  ['壁', '壁水貐', 9, '东壁，主文章图书'],
  // 西方白虎七宿 · 合 80 度
  ['奎', '奎木狼', 16, '虎尾，主沟渎与武库'],
  ['娄', '娄金狗', 12, '虎身，主聚众与牧养'],
  ['胃', '胃土雉', 14, '虎腹，主仓库与五谷'],
  ['昴', '昴日鸡', 11, '昴星团（七姐妹），古以「昴昏中」定仲冬'],
  ['毕', '毕月乌', 16, '虎爪，主边兵与狩猎'],
  ['觜', '觜火猴', 2, '虎首，宿度最小的一宿，仅两度'],
  ['参', '参水猿', 9, '猎户腰带，主斩刈与杀伐'],
  // 南方朱雀七宿 · 合 112 度
  ['井', '井木犴', 33, '雀首，宿度最大的一宿，达三十三度'],
  ['鬼', '鬼金羊', 4, '舆鬼，主祀事与视祲'],
  ['柳', '柳土獐', 15, '雀喙，主草木与风雨'],
  ['星', '星日马', 7, '七星，雀颈，古以「星昏中」定仲春'],
  ['张', '张月鹿', 18, '雀嗉，主宴饮与赏赐'],
  ['翼', '翼火蛇', 18, '雀翅，主乐府与五音'],
  ['轸', '轸水蚓', 17, '雀尾，主车骑与疆場'],
]

/** 二十八宿表（含累计起始度，用于求每宿在圆周上的真实弧段） */
export const MANSIONS = (() => {
  let acc = 0
  return RAW.map(([name, bird, du, note], i) => {
    const quadrant = i < 7 ? '东' : i < 14 ? '北' : i < 21 ? '西' : '南'
    const start = acc
    acc += du
    return {
      idx: i,
      name,
      bird,
      du,
      note,
      start,
      quadrant,
      quadrantName: QUADRANTS[quadrant].name,
      color: QUADRANTS[quadrant].color,
    }
  })
})()

/** 周天总度数：365（与《汉书·律历志》四方之和一致） */
export const TOTAL_DU = MANSIONS.reduce((s, m) => s + m.du, 0)

/** 阵眼：河图洛书（小说设定）+ 日月二主星 */
export const ARRAY_EYE = {
  name: '河图洛书',
  kind: '阵眼',
  origin: '小说设定',
  note: '洪荒流里帝俊、东皇太一自河图洛书悟得此阵，以三百六十五周天星为基、太阳太阴为二主星，故阵眼不是星而是「书」。',
}

export const MAIN_STARS = [
  {
    id: 'sun',
    name: '太阳星',
    en: '阵眼主星 · 日',
    color: '#fbbf24',
    origin: '《大荒南经》',
    quote: '有女子名曰羲和，方日浴于甘渊。羲和者，帝俊之妻，生十日。',
    note: '十日之母浴日于甘渊 —— 这是「日以十数为纲」的唯一古籍影子；把它当星斗大阵主星，是小说的取用。',
  },
  {
    id: 'moon',
    name: '太阴星',
    en: '阵眼主星 · 月',
    color: '#a5b4fc',
    origin: '《大荒西经》',
    quote: '有女子方浴月。帝俊妻常羲，生月十有二，此始浴之。',
    note: '十二月之母。「十二」在古书本是岁时之数，洪荒流把它派作大阵的骨架数字之一。',
  },
]

/**
 * 地支十二宫：盘面以「子」为正上（北），每 30° 一宫，顺时针 子丑寅卯…，
 * 与十二祖巫的外环盘位共用同一套角度。
 */
export const BRANCH = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

/** 屏幕角 → 所属宫（+15 使 0° 正上落在子宫中央，而非宫界上） */
export const branchOf = (screenAngle) =>
  BRANCH[Math.floor((((screenAngle + 15) % 360) + 360) % 360 / 30)]

/**
 * 365 星位：每度一星。
 * angle    = 该星在周天上的真实占比 × 360°（故各宿弧长不等）
 * ring     = 该星在本宿内的序取模 5 → 五重环，视觉上把宽宿「编」成辫状
 * radius   = 0.34 + ring × 0.14（相对半径，交给 CSS --sa-r-max 换算）
 * beast    = 与 BEASTS 1:1 对位（同序切段：角宿得前 12 条，亢宿接 9 条……）
 */
export const STARS = (() => {
  let beastCursor = 0
  const out = []
  MANSIONS.forEach((m) => {
    for (let d = 0; d < m.du; d++) {
      const duInMansion = d + 1
      const absolute = m.start + duInMansion
      const angle = ((absolute - 0.5) / TOTAL_DU) * 360
      const ring = d % 5
      const beast = BEASTS[beastCursor]
      beastCursor += 1
      const screenAngle = (((90 - angle) % 360) + 360) % 360
      out.push({
        id: out.length,
        name: `${m.name}${CN[duInMansion]}度`,
        mansion: m.name,
        mansionIdx: m.idx,
        bird: m.bird,
        du: duInMansion,
        absoluteDu: absolute,
        quadrant: m.quadrant,
        quadrantName: m.quadrantName,
        color: m.color,
        angle,
        /* 盘面屏幕角：0°=正上方（子·北），顺时针增大。
           取 θ = 90° − 周天色角，于是角宿（周天 0 度）落在卯位正东 ——
           「春分昏，苍龙见东」；虚危近北、七星近南、奎娄近西，四宫各得其方。 */
        screenAngle,
        /* 所属地支宫：与 STARS_BY_BRANCH、外盘祖巫同源一次算出，
           渲染时只需 s.branch，不再每颗星重复求模 */
        branch: branchOf(screenAngle),
        ring,
        radius: 0.34 + ring * 0.14,
        isMansionHead: duInMansion === 1,
        beast,
      })
    }
  })
  return out
})()

/** 五重环（保留原 StarArray 的多环互锁语汇，但环由宿度决定而非平均分配） */
export const RINGS = [0, 1, 2, 3, 4].map((r) => ({
  ring: r,
  radius: 0.34 + r * 0.14,
  dir: r % 2 === 0 ? 1 : -1,
}))

/** 按宿分组，供「点宿亮一片」与四象着色使用 */
export const STARS_BY_MANSION = MANSIONS.map((m) =>
  STARS.filter((s) => s.mansionIdx === m.idx))

/** 十二宫分组：直接按星上预算好的 branch 归位，与盘面角度同一真源 */
export const STARS_BY_BRANCH = BRANCH.reduce((acc, b) => {
  acc[b] = STARS.filter((s) => s.branch === b)
  return acc
}, {})

/**
 * 四象在盘缘的标注角度：取该象宿度跨度的中点，换算成屏幕角。
 * 东 75 / 北 98 / 西 80 / 南 112 度，故四个标记的间距并不相等 ——
 * 这正是「南方朱雀最阔」的直接可见。
 */
export const QUAD_ARCS = ['东', '北', '西', '南'].map((q) => {
  const list = MANSIONS.filter((m) => m.quadrant === q)
  const start = list[0].start
  const sum = list.reduce((s, m) => s + m.du, 0)
  const centerAngle = ((start + sum / 2) / TOTAL_DU) * 360
  return {
    quadrant: q,
    name: QUADRANTS[q].name,
    color: QUADRANTS[q].color,
    du: sum,
    screenAngle: (((90 - centerAngle) % 360) + 360) % 360,
  }
})

export const STAR_COUNT = STARS.length
