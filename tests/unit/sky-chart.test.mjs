/**
 * 全天星图：投影数学 + 星表产物完整性 · 纯函数单测（零依赖）
 * 覆盖 src/lib/astro/skyProjection.js、src/lib/astro/skyHelpers.js
 * 以及 public/data/star-catalog.json（由 scripts/build-star-catalog.mjs 生成）。
 *
 * 为什么这值得单测：
 *   星表是一份 175KB 的静态产物，生成脚本要联网、要处理繁简映射和坐标归一化。
 *   一旦哪次重新生成时数据源改版（比如赤经变负数、星座名改回繁体），
 *   页面不会报错，只会把星星画到错误的位置、把「天龍座」显示在「宝瓶座」旁边。
 *   所以要对「产物本身」钉死不变量，而不只是测算法。
 */
import fs from 'node:fs'
import path from 'node:path'
import {
  gmstHours,
  lstHours,
  equatorialToHorizontal,
  skyToPixel,
  refractionDeg,
  magToRadius,
  bvToHue,
  DEG,
} from '../../src/lib/astro/skyProjection.js'
import {
  azToCompass,
  raToConstellation,
  observability,
} from '../../src/components/AstroBoard/skyHelpers.js'
import { ok, eq, close, length } from './harness.mjs'

const ROOT = path.resolve(import.meta.dirname, '..', '..')
const catalog = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'public', 'data', 'star-catalog.json'), 'utf8'),
)

/** 北京：用于所有地平坐标断言 */
const BJ = { lat: 39.9042, lon: 116.4074 }
/** 2026-10-10 14:00Z = 北京时间 22:00，夜深适合观星 */
const D = new Date('2026-10-10T14:00:00Z')

export default [
  ['gmstHours：GMST 应落在 0–24 小时区间且随时间单调推进', () => {
    const g1 = gmstHours(D)
    ok(g1 >= 0 && g1 < 24, `GMST 应在 [0,24)，实际 ${g1}`)
    // 一恒星日 ≈ 23h56m，10 分钟后 GMST 应增加约 10 分钟
    const g2 = gmstHours(new Date(D.getTime() + 10 * 60_000))
    close(g2 - g1, 10 / 60, 0.02, 'GMST 增量应约 10/60 小时')
  }],

  ['lstHours：东经观测点的 LST 应晚于 GMST', () => {
    const g = gmstHours(D)
    const l = lstHours(D, BJ.lon)
    // 116.4°E → 快 7.76 小时；再对 24 取模
    const expect = (g + BJ.lon / 15) % 24
    close(l, expect, 0.02, 'LST = GMST + 经度/15')
    ok(l > g || g > 12, '东经观测点 LST 应领先于 GMST（或跨过 24 点回绕）')
  }],

  ['equatorialToHorizontal：天顶方向的天体高度角应为 90°', () => {
    const lst = lstHours(D, BJ.lon) * 15
    // 赤经 = LST 且赤纬 = 纬度 → 该天体正在天顶
    const z = equatorialToHorizontal(lst, BJ.lat, BJ.lat, BJ.lon, D)
    close(z.alt, 90, 0.001, '天顶天体高度角')
  }],

  ['equatorialToHorizontal：北极星高度角应约等于观测纬度', () => {
    // 北极星 RA≈37.95°、Dec≈+89.26°（J2000）
    const pol = equatorialToHorizontal(37.95, 89.26, BJ.lat, BJ.lon, D)
    // 含大气折射会比理论纬度略高一点点
    close(pol.alt, BJ.lat, 0.7, '北极星高度角 ≈ 纬度')
    // 正北（允许 0/360 归一化差异）
    ok(
      Math.abs(pol.az - 0) < 1.5 || Math.abs(pol.az - 360) < 1.5 || Math.abs(pol.az - 180) < 1.5,
      `北极星应在正北附近，实际方位 ${pol.az.toFixed(2)}°`,
    )
  }],

  ['equatorialToHorizontal：赤纬 0 且位于上中天时高度角 = 90 − 纬度', () => {
    const lst = lstHours(D, BJ.lon) * 15
    // 赤经 = LST → 时角 0 → 上中天；赤纬 0 → 高度 = 90 − 纬度
    const m = equatorialToHorizontal(lst, 0, BJ.lat, BJ.lon, D)
    close(m.alt, 90 - BJ.lat, 0.001, '上中天高度角')
  }],

  ['equatorialToHorizontal：地平线下的天体高度角为负', () => {
    const lst = lstHours(D, BJ.lon) * 15
    // 赤纬 0、时角 180（下中天）→ 北半球必然在地平线下
    const ra = (((lst + 180) % 360) + 360) % 360
    const m = equatorialToHorizontal(ra, 0, BJ.lat, BJ.lon, D)
    ok(m.alt < 0, `下中天赤纬 0 应在地平线下，实际 ${m.alt.toFixed(2)}°`)
  }],

  ['skyToPixel：天顶在地平投影中心，地平线在圆周', () => {
    const size = 520
    const center = skyToPixel(0, 90, size)
    close(center.x, size / 2, 0.001, '天顶 x')
    close(center.y, size / 2, 0.001, '天顶 y')

    // 高度 0 → scale = 1 → 落在圆周上（不缩放）
    const n = skyToPixel(0, 0, size)
    close(n.scale, 1, 0.001, '地平线处 scale 应为 1')
    close(n.y, size / 2 - size / 2, 0.001, '正北地平线 y')
    close(n.x, size / 2, 0.001, '正北地平线 x')

    // 正东地平线
    const e = skyToPixel(90, 0, size)
    close(e.x, size / 2 + size / 2, 0.001, '正东地平线 x')
    close(e.y, size / 2, 0.001, '正东地平线 y')
  }],

  ['skyToPixel：方位角顺时针展开（东在右、南在下）', () => {
    const size = 400
    const east = skyToPixel(90, 45, size)
    const south = skyToPixel(180, 45, size)
    const west = skyToPixel(270, 45, size)
    const north = skyToPixel(0, 45, size)
    ok(east.x > north.x, '东应在天顶北的右侧')
    ok(south.y > north.y, '南应在天顶北的下方')
    ok(west.x < north.x, '西应在天顶北的左侧')
  }],

  ['refractionDeg：地平附近折射最强，随高度角增大迅速减弱', () => {
    const r0 = refractionDeg(0)
    const r30 = refractionDeg(30)
    const r80 = refractionDeg(80)
    ok(r0 > 0.4, `地平折射应约 0.5°，实际 ${r0}`)
    ok(r30 < r0 && r80 < r30, '折射应随高度角递减')
    ok(Math.abs(refractionDeg(45) - 0.5 * r30) < 0.05, '45° 折射应约为 30° 处的一半')
  }],

  ['magToRadius：星等越亮半径越大，且最亮星仍在画布内', () => {
    const sirius = magToRadius(-1.46)
    const vega = magToRadius(0.03)
    const faint = magToRadius(6)
    ok(sirius > vega && vega > faint, '星等越小（越亮）半径应越大')
    ok(faint > 0, '最暗星半径不应为 0，否则看不见')
    ok(sirius < 12, `最亮星半径 ${sirius} 不应过大，否则糊成一团`)
  }],

  ['bvToHue：B−V 负（偏蓝）→ 偏冷色；B−V 正（偏红）→ 偏暖色', () => {
    const blue = bvToHue(-0.3)
    const red = bvToHue(1.8)
    ok(blue !== red, '蓝星与红星色相应不同')
    // 用色相数值判定冷暖：蓝在 200–280°（青蓝），红在 0–60°
    ok(blue > 180 && blue < 300, `蓝星色相应在青蓝区间，实际 ${Math.round(blue)}`)
    ok(red < 90 || red > 320, `红星色相应在暖色区间，实际 ${Math.round(red)}`)
  }],

  ['azToCompass：16 方位罗盘换算正确', () => {
    eq(azToCompass(0), '北', '0° 应为北')
    eq(azToCompass(90), '东', '90° 应为东')
    eq(azToCompass(180), '南', '180° 应为南')
    eq(azToCompass(270), '西', '270° 应为西')
    eq(azToCompass(45), '东北', '45° 应为东北')
    eq(azToCompass(360), '北', '360° 应归一化为北')
    eq(azToCompass(-90), '西', '负角度应归一化')
    eq(azToCompass(225), '西南', '225° 应为西南')
  }],

  ['raToConstellation：赤经 0° 落在白羊座区间', () => {
    // 太阳春分点 RA≈0 → 白羊座（占黄经 0–30°）
    const zh = raToConstellation(15)
    ok(zh.includes('白羊'), `RA 15° 应归白羊座，实际「${zh}」`)
    // 归一化：RA 360+15 与 15 同结果
    eq(raToConstellation(375), zh, '超 360° 应归一化')
  }],

  ['observability：高度角分档单调，各档配色可区分', () => {
    const lv = [80, 30, 10, 0, -5].map((alt) => observability(alt).level)
    eq(lv.join(','), 'good,ok,low,edge,down', '分档顺序不对')
    // 颜色是「绿 → 黄绿 → 黄 → 橙 → 灰」的梯度，允许重复但不应全同
    const colors = [80, 30, 10, 0, -5].map((alt) => observability(alt).color)
    ok(new Set(colors).size >= 3, `各档配色区分度不足：${colors.join(',')}`)
  }],

  ['星表产物：基础结构与 meta 计数自洽', () => {
    ok(Array.isArray(catalog.stars), 'stars 应为数组')
    ok(Array.isArray(catalog.constellations), 'constellations 应为数组')
    ok(Array.isArray(catalog.lines), 'lines 应为数组')
    ok(Array.isArray(catalog.dso), 'dso 应为数组')
    const c = catalog.meta.counts
    eq(c.stars, catalog.stars.length, 'meta.stars 与实际条数不符')
    eq(c.constellations, catalog.constellations.length, 'meta.constellations 不符')
    // 连线按「折线段」计数，一条 MultiLineString 会拆成多段
    eq(c.lineSegments, catalog.lines.length, 'meta.lineSegments 不符')
    eq(c.dso, catalog.dso.length, 'meta.dso 不符')
    eq(
      c.namedStars,
      catalog.stars.filter((s) => s[4]).length,
      'meta.namedStars 与实际带名数不符',
    )
  }],

  ['星表产物：亮星数量足够绘制出可辨认的星图', () => {
    // 6 等以内约 5000 颗；低于 1000 颗会让夜空明显空旷
    ok(catalog.stars.length > 3000, `亮星数 ${catalog.stars.length} 偏少`)
    // 88 个星座。上游 constellations.json 里蛇座（Serpens）有两条完全相同的记录
    // （头尾两段在几何上分开，但条目重复），生成脚本按 id 去重后才落成 88 条。
    // 这条断言同时保证「没有重复 id」——重复 id 会让前端 React key 撞车。
    eq(catalog.constellations.length, 88, '星座应为 88 条（蛇座已去重）')
    eq(new Set(catalog.constellations.map((c) => c[0])).size, 88, '星座 id 不得重复')
    ok(catalog.dso.length >= 100, `深空天体数 ${catalog.dso.length} 偏少`)
  }],

  ['星表产物：赤经已归一化到 0–360（数据源会给出负值）', () => {
    for (const s of catalog.stars) {
      ok(
        s[0] >= 0 && s[0] < 360,
        `赤经越界：${s[0]}（星 ${s[4]}）`,
      )
    }
  }],

  ['星表产物：赤纬在 −90–90、星等为有限数', () => {
    for (const s of catalog.stars) {
      ok(s[1] >= -90.001 && s[1] <= 90.001, `赤纬越界：${s[1]}`)
      ok(Number.isFinite(s[2]), `星等非数：${s[2]}`)
    }
  }],

  ['星表产物：亮星按星等升序（前端依赖此顺序做性能裁剪）', () => {
    for (let i = 1; i < catalog.stars.length; i++) {
      ok(
        catalog.stars[i][2] >= catalog.stars[i - 1][2],
        `第 ${i} 颗星亮度排序错误：${catalog.stars[i][2]} < ${catalog.stars[i - 1][2]}`,
      )
    }
  }],

  ['星表产物：天狼星应在最亮列表首位且带中文名', () => {
    const first = catalog.stars[0]
    // 产物里星等只保留 1 位小数（−1.46 → −1.4），不要按原始精度断言
    close(first[2], -1.4, 0.05, '第一颗应是星等约 −1.4 的天狼星')
    eq(first[4], 'Sirius', '第一颗应是天狼星')
    eq(first[5], '天狼', '天狼星中文名')
  }],

  ['星表产物：3 等以内亮星必须都有名字（专名或 Bayer 记号）', () => {
    const bright = catalog.stars.filter((s) => s[2] <= 3)
    const missing = bright.filter((s) => !s[4] && !s[5])
    eq(
      missing.length,
      0,
      `${missing.length} 颗 3 等星无名字：` +
        missing.slice(0, 5).map((s) => `ra${s[0]}dec${s[1]}mag${s[2]}`).join(' '),
    )
    // 带中文名的应该占多数（190 颗里绝大多数有中文名）
    const withCn = bright.filter((s) => s[5])
    ok(withCn.length > bright.length * 0.7, `3 等星里只有 ${withCn.length}/${bright.length} 有中文名`)
  }],

  ['星表产物：Bayer 兜底名已本地化为中文座名', () => {
    // 无西文专名但有 Bayer 记号的星（南半球亮星居多）应显示成「船底座 θ」而非「Pup θ」
    const bayerCn = catalog.stars.filter(
      (s) => s[4] && /^(船底座|船帆座|船尾座|半人马座|南三角座|苍蝇座|水蛇座|豺狼座|大熊座|长蛇座|天坛座|英仙座|杜鹃座)\s[αβγδεζηθικλμνξοπρστυφχψω]$/.test(s[4]),
    )
    ok(bayerCn.length >= 10, `Bayer 本地化名只有 ${bayerCn.length} 个，Bayer 兜底可能没生效`)
    // 不该再有「英文缩写 + 希腊字母」的裸缩写（Cor Caroli 之类的专名不算）
    const rawAbbr = catalog.stars.filter(
      (s) => s[4] && /^[A-Z][a-z]{1,3}\s[αβγδεζηθικλμνξοπρστυφχψω]$/.test(s[4]),
    )
    eq(rawAbbr.length, 0, `仍有未本地化的星座缩写：${rawAbbr.map((s) => s[4]).join(' ')}`)
  }],

  ['星表产物：星座中文名齐全且无繁体残留', () => {
    // 繁体字表（与生成脚本 T2S 的键一致）——任何一个出现都说明转换漏了
    const TRAD = new Set(
      '寶龍馬鳥魚車門獅雙鳳鷹鶴鵝鴉鯨圓規髮爐針織繪獵處羅盤儀遠鏡顯極蠍壇衛齒烏劍時鐘長蒼蠅戶飛鵑輕輛較轉辦鯉鯊貓鬥庫廚廟廣慶應該論識譯護讀變讓讚豐貴買費資賓賣質贊農遙遷鄭鄰醬釀鋁錄鎮鏡鐵銀錢鑄鑰閉閃閒閣陝際隨險隱雜雞難電霧靜韻顏願養餘駕騎驗體鬥魯鴻鵬鶴麥黃黑齊齡龜'.split(''),
    )
    for (const c of catalog.constellations) {
      const zh = c[2]
      ok(zh && zh.length > 0, `星座 ${c[0]} 缺中文名`)
      for (const ch of zh) {
        ok(!TRAD.has(ch), `星座「${zh}」含繁体字「${ch}」`)
      }
      ok(zh.endsWith('座'), `星座中文名「${zh}」应以「座」结尾`)
    }
  }],

  ['星表产物：星座 id 唯一（React key 依赖它）', () => {
    const ids = catalog.constellations.map((c) => c[0])
    const dup = ids.filter((x, i) => ids.indexOf(x) !== i)
    // 蛇座在上游是两条重复记录，生成脚本已去重。若这里再出现重复，
    // 前端 useVisibleConstellations 拿 abbr 当 key 会刷 React 重复 key 警告。
    eq(dup.length, 0, `星座 id 重复：${[...new Set(dup)].join(' ')}`)
  }],

  ['星表产物：连线 id 都能在星座表里找到', () => {
    const ids = new Set(catalog.constellations.map((c) => c[0]))
    for (const [id, flat] of catalog.lines) {
      ok(ids.has(id), `连线引用了未定义的星座 id：${id}`)
      ok(flat.length >= 4, `星座 ${id} 的连线点数不足`)
      // 折线坐标偶数个
      eq(flat.length % 2, 0, `星座 ${id} 连线坐标应为成对的 (ra,dec)`)
    }
  }],

  ['星表产物：北斗七星连线存在（大熊座应是 7 条独立线段）', () => {
    const uma = catalog.lines.filter((l) => l[0] === 'UMa')
    ok(uma.length >= 3, `大熊座连线仅 ${uma.length} 条，北斗七星应至少 3 段`)
  }],

  ['星表产物：深空天体中英文与类型翻译齐全', () => {
    for (const d of catalog.dso) {
      ok(d[0], `深空天体缺编号：${JSON.stringify(d).slice(0, 60)}`)
      // 字段序：[编号, 西文名, 赤经, 赤纬, 星等, 类型码, 类型中文, 释义]
      ok(d[2] >= 0 && d[2] < 360, `${d[0]} 赤经越界：${d[2]}`)
      ok(d[3] >= -90 && d[3] <= 90, `${d[0]} 赤纬越界：${d[3]}`)
      ok(d[6], `${d[0]} 缺类型中文名`)
      ok(d[7] && d[7].length >= 4, `${d[0]} 的类型释义过短：${d[7]}`)
    }
    // M31 仙女座星系必须存在（最著名的深空天体）
    const m31 = catalog.dso.find((d) => d[0] === 'M31')
    ok(m31, '缺少 M31')
    eq(m31[6], '星系', 'M31 应归类为星系')
    // M1 蟹状星云：超新星遗迹
    const m1 = catalog.dso.find((d) => d[0] === 'M1')
    eq(m1[6], '超新星遗迹', 'M1 应归类为超新星遗迹')
  }],

  ['星表产物：中文名不含英文残留', () => {
    for (const d of catalog.dso) {
      // 释义里的单位记号（×、/）和希腊字母（γ）允许，纯英文单词不允许
      ok(!/\bbillions\b/i.test(d[7]), `${d[0]} 释义残留英文 billions`)
    }
    for (const c of catalog.constellations) {
      ok(!/[A-Za-z]{3,}/.test(c[2]), `星座中文名「${c[2]}」含英文`)
    }
  }],

  ['DEG 常量：弧度/角度换算基准', () => {
    close(180 * DEG, Math.PI, 1e-12, '180° 应等于 π 弧度')
  }],
]