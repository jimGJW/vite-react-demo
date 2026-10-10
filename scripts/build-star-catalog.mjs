/**
 * 生成真实星表静态数据 —— 一次性脚本，产物提交进仓库，运行时不依赖网络。
 *
 * 为什么要有这个脚本：
 *   星图要的是「真实天上的星星」，用随机数造点是糊弄人的。这里从公开星表
 *   d3-celestial（基于 HYG/Hipparcos）抓 6 等以上亮星 + 星座连线 + 梅西耶天体，
 *   压缩成一个紧凑 JSON 落到 public/data/star-catalog.json。
 *
 * 为什么要压缩：
 *   原始 GeoJSON 有 656KB（5044 星 / 89 连线 / 110 梅西耶）。星图每秒刷新一次，
 *   直接吃原始数据会白白吃掉几 MB 传输。这里做三件事：
 *     1. 坐标从「对象 {lon,lat}」压成「扁平数字数组」—— 省 key 名；
 *     2. 星等保留 1 位小数、星表位置保留 2 位小数—— 视觉上根本看不出差别；
 *     3. 只保留 6 等及以上（肉眼极限），但另外**全量保留亮于 3.0 等的恒星名**
 *        （亮星有名字，是观星的文化锚点：织女、天狼、北斗七星）。
 *
 * 用法：node scripts/build-star-catalog.mjs
 *      （需要外网；改了星等阈值之类的重跑即可）
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../public/data/star-catalog.json')

/**
 * jsDelivr 镜像 GitHub raw。直接用 raw.githubusercontent.com 会被本地网络拦掉（实测 000），
 * 所以走 CDN；d3-celestial 是公开仓库，允许这样取。
 */
const CDNS = [
  'https://cdn.jsdelivr.net/gh/ofrohn/d3-celestial@master/data',
  'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data',
]

const FILES = {
  stars: 'stars.6.json',
  constellations: 'constellations.json',
  lines: 'constellations.lines.json',
  messier: 'messier.json',
  starnames: 'starnames.json',
  starnamesCn: 'starnames.cn.json',
}

/** 最暗星等：6.0 是肉眼在暗夜下的极限，再暗的星图上画出来只是噪点 */
const MAG_LIMIT = 6.0
/**
 * 亮于这个星等的恒星要带名字。
 *
 * 取 3.1 而不是 3.0：产物里星等只保留 1 位小数（r1），原始 3.01–3.04 的星
 * 会被舍入成 3.0。若阈值正好卡 3.0，这批星在产物里看起来「正好 3 等却没名字」，
 * 像 bug 其实是舍入边界。留 0.1 余量让阈值与显示精度解耦。
 */
const NAMED_MAG_LIMIT = 3.1

async function loadJSON(name) {
  let lastErr
  for (const base of CDNS) {
    const url = `${base}/${name}`
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 30000)
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'vite-react-demo/star-catalog/1.0 (local dev)' },
      })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`)
      return await res.json()
    } catch (e) {
      lastErr = e
    }
  }
  throw new Error(`拉取 ${name} 失败（已试 ${CDNS.length} 个镜像）: ${lastErr && lastErr.message}`)
}

/** 保留 2 位小数并转回 number，去掉尾随 0，压缩体积 */
const r2 = (n) => Math.round(n * 100) / 100
/** 星等 1 位小数就够了 */
const r1 = (n) => Math.round(n * 10) / 10

/**
 * 赤经归一化到 [0, 360)。
 *
 * 坑：原始 GeoJSON 用 `[-180, 180]` 的经度表示赤经（Arcturus 是 -146.08），
 * 直接当赤经用会让方位角算错几十度、整张星图转 180° 偏掉。
 * 坐标系声明写在 data 目录的 README 里，但 features 本身不带元信息，
 * 只能靠「坐标落在负半区 = 用了 180° 制」这个事实来还原。
 */
const ra360 = (deg) => (((deg % 360) + 360) % 360)

/**
 * 繁→简：星座中文名在数据源里是繁体（寶瓶座/天龍座/大熊座），
 * 而项目其余文案全是简体。这里做最小化字形映射——
 * 刻意不做通用简繁转换库（那会引入依赖，且 88 星座只需覆盖十几个字）。
 *
 * 覆盖范围来自实际数据：把产物里所有星座中文名扫一遍，繁体字就是下面这些。
 *
 * ⚠️ 表里**只能放真正的繁体字**。之前误收了 `蟹`/`豺`/`微`/`矩`/`尺`/`箭`/`罟`
 * 这些简体字，导致 assertNoTraditional 反查时把它们当成「转换没生效」而误报。
 * 维护规则：新增映射 = 在产物里扫到某个繁体字才加，且加完重跑脚本看是否报残留。
 */
const T2S = {
  寶: '宝', 龍: '龙', 馬: '马', 鳥: '鸟', 魚: '鱼', 車: '车', 門: '门', 獅: '狮',
  雙: '双', 鳳: '凤', 鷹: '鹰', 鶴: '鹤', 鵝: '鹅', 鴿: '鸽', 鴉: '鸦',
  鯨: '鲸', 圓: '圆', 規: '规', 髮: '发', 爐: '炉', 織: '织', 繪: '绘',
  獵: '猎', 處: '处', 羅: '罗', 盤: '盘', 網: '网', 儀: '仪', 遠: '远',
  鏡: '镜', 顯: '显', 極: '极', 華: '华', 陽: '阳', 陰: '阴', 雲: '云',
  電: '电', 風: '风', 霧: '雾', 體: '体', 萬: '万', 業: '业', 蟲: '虫',
  蝕: '蚀', 錄: '录', 屬: '属', 廳: '厅', 藝: '艺', 術: '术', 達: '达',
  適: '适', 選: '选', 將: '将', 軍: '军', 觀: '观', 測: '测', 報: '报',
  傳: '传', 輸: '输', 腦: '脑', 絡: '络', 統: '统', 線: '线', 環: '环',
  // 第二轮扫描产物后补齐的漏网字
  蠍: '蝎', 壇: '坛', 烏: '乌', 劍: '剑', 時: '时', 鐘: '钟', 長: '长',
  蒼: '苍', 蠅: '蝇', 戶: '户', 飛: '飞', 鵑: '鹃', 貓: '猫', 門: '门',
}

/** 繁体转简体，逐字映射，未收录的字原样保留 */
function toSimplified(s) {
  let out = ''
  for (const ch of String(s)) out += T2S[ch] || ch
  return out
}

/**
 * 自检：产物里不允许出现任何「映射表里存在的繁体字」。
 *
 * 为什么必须有这一步：漏字是这套「逐字映射」方案的固有风险——
 * 新加一个字映射进去，手写对照表不会报错，但页面会悄悄显示「天龍座」。
 * 与其靠肉眼扫 88 个星座名，不如直接用同一份映射反向断言。
 *
 * @param {string} joined 已拼接的中文字段（星座名 / 星名 / 天体类型名）
 * @param {string} label 出错时的定位标签
 */
function assertNoTraditional(joined, label) {
  const bad = [...new Set([...joined].filter((ch) => T2S[ch]))]
  if (bad.length) {
    throw new Error(
      `繁简转换有遗漏（${label}）：残留繁体字「${bad.join('')}」` +
        `→ 对应简体应为「${bad.map((c) => T2S[c]).join('')}」，检查 T2S 是否漏了这个字`,
    )
  }
}

/**
 * 亮星取名：直接用星表自带的名称数据，不手写对照表。
 *
 * 踩过的坑：星表 features 的 properties 里**只有 mag 和 bv**，
 * 名字在两个独立文件里，且都以 **HIP 星号**（= feature.id）为 key：
 *   starnames.json     → { name: 西文专名, bayer, flam, var, c, desig }
 *   starnames.cn.json  → { name: 中文星名, desig, en, pinyin }
 * 所以「拿到亮星的名字」= 拿 feature.id 去这两个文件查表。
 *
 * 只给 3 等以内（NAMED_MAG_LIMIT）的星挂名字：更暗的星名字没有观星价值，
 * 全量挂上会让产物从 175KB 涨到 400KB+，而星图上根本看不清。
 */
function buildNameLookup(starnames, starnamesCn) {
  const out = new Map()
  for (const [hip, rec] of Object.entries(starnames)) {
    // Bayer 记号（ constellation + 希腊字母，如「π Sco」）是国际天文学界的标准星名，
    // 不是「没有名字」。之前这里 `if (!en) continue` 把这类星整条丢掉，
    // 结果 11 颗 3 等星（π Sco / θ Sco / β Lup 等）在星图上成了无名的点——
    // 它们恰恰是南半球观星者最认得的那些。所以：专名优先，Bayer 兜底。
    const bayer = [rec.c, rec.bayer].filter(Boolean).join(' ')
    const flam = rec.flam || ''
    const en = (rec && rec.name) || ''
    // 三者全空才真的无名
    if (!en && !bayer && !flam) continue
    const cnRec = starnamesCn[hip]
    // 中文星名可能缺失（近现代命名的亮星），也可能有多个：取第一个非空
    let cn = ''
    if (cnRec) {
      cn = Array.isArray(cnRec.name) ? cnRec.name[0] || '' : cnRec.name || ''
    }
    out.set(hip, { en, cn, bayer, flam, con: rec.c || '' })
  }
  return out
}

/**
 * 把 Bayer 记号里的星座缩写换成中文座名：「π Pup」→「船底座 π」。
 *
 * 为什么要换：星图是给中文用户看的，直接显示「Pup π」等于让用户去查缩写表。
 * constellation 数据的 zh 字段是简体（生成时会过一遍 toSimplified），正好可用。
 * 缩写查不到时保留原缩写——宁可显示英文缩写，也不要把名字显示成空。
 */
/**
 * 把 Bayer 记号里的星座缩写换成中文座名：「Pup π」→「船底座 π」。
 *
 * 为什么要换：星图是给中文用户看的，直接显示「Pup π」等于让用户去查缩写表。
 * 输入是 buildNameLookup 拼好的「缩写 + 空格 + 希腊字母」，
 * 缩写查不到时保留原样——宁可显示英文缩写，也不要把名字显示成空。
 */
function localizeBayer(bayer, conZhById) {
  if (!bayer) return ''
  const [abbr, letter] = bayer.split(' ')
  if (!abbr) return bayer
  const zh = conZhById.get(abbr)
  if (!zh) return bayer
  // 「座名 + 希腊字母」；字母为空时只给座名
  return letter ? `${zh} ${letter}` : zh
}

/** 佛兰斯蒂克编号本地化：「Pup 23」→「船底座 23」。缩写查不到则回退英文缩写。 */
function localizeFlam(flam, conAbbr, conZhById) {
  if (!flam || !conAbbr) return ''
  const zh = conZhById.get(conAbbr)
  return zh ? `${zh} ${flam}` : `${conAbbr} ${flam}`
}

/** 梅西耶目录里全部星系（NGC 编号），用于校验类型覆盖表没漏项 */
const KNOWN_GALAXIES = new Set([
  'M31', 'M32', 'M33', 'M51', 'M58', 'M61', 'M63', 'M64', 'M65', 'M66',
  'M74', 'M77', 'M81', 'M82', 'M83', 'M87', 'M88', 'M90', 'M91', 'M94',
  'M95', 'M96', 'M98', 'M99', 'M100', 'M101', 'M102', 'M104', 'M106',
  'M108', 'M109',
])

/**
 * 自检：所有实际存在的星系都必须被标成 `gx`。
 *
 * 为什么值得单独断言：上游 messier.json 把 31 个星系里的 28 个标成 `s`（恒星）、
 * 2 个标成 `e`（发射星云）、1 个标成 `?`。这些错误极其隐蔽——编号、坐标、星等
 * 全对，只有类型标签错，页面上会显示「仙女座星系 · 单颗恒星」这种自相矛盾的内容。
 *
 * 之前手工维护覆盖表时就漏了 M87（室女座 A 星系），靠单测才发现。
 * 这条断言把「人工清单」和「实际产物」绑在一起：清单里多写一个不存在的天体无害，
 * 但真星系漏标会直接让脚本失败。
 */
function assertGalaxiesTyped(outDso) {
  const byId = new Map(outDso.map((d) => [d[0], d]))
  const wrong = []
  for (const id of KNOWN_GALAXIES) {
    const row = byId.get(id)
    // 上游没收录这个编号就跳过（清单可能比数据源新）
    if (!row) continue
    if (row[5] !== 'gx') wrong.push(`${id}(${row[5]})`)
  }
  if (wrong.length) {
    throw new Error(
      `星系类型标错：${wrong.join(' ')}——它们应是 gx（星系）。` +
        '请把它们加进 TYPE_OVERRIDE',
    )
  }
}

/** 梅西耶/深空天体类型 → 中文（与 glossary 的 GALAXY_TYPE 保持一致的措辞风格） */
const DSO_TYPE = {
  gc: ['球状星团', '几十万颗恒星挤在直径约 100 光年的球内，年龄可达百亿年。'],
  oc: ['疏散星团', '年轻恒星松散聚居，年龄通常只有几千万年，是恒星育婴室。'],
  gx: ['星系', '数十亿至上千亿颗恒星组成的巨大系统，可含数万亿颗成员，尺度远大于星团。'],
  s: ['恒星', '单颗恒星。'],
  sfr: ['恒星形成区', '分子云中正在孕育新恒星的高密度区，常伴随强烈的电离辐射。'],
  pn: ['行星状星云', '垂死恒星抛出的气体外壳，被中心白矮星电离后发出的荧光。'],
  dn: ['暗星云', '浓密分子云，背景星光被完全吸收，只在红外波段才看得见。'],
  snr: ['超新星遗迹', '恒星爆碎后扩散的气体与激波，是高能伽马射线的重要来源。'],
  rn: ['反射星云', '自身不发光的尘埃云，靠反射附近亮星的光而发亮。'],
  pos: ['天区标记', '用于标记区域的定位点，本身不是独立天体。'],
  ds: ['双星/聚星', '两颗或多颗恒星靠引力互相绕转，肉眼看似一体的系统。'],
  e: ['发射星云', '被辐射电离而自发光的星云，常是新恒星的摇篮。'],
  '*': ['恒星团', '泛指恒星聚集区。'],
  '?': ['未识别天体', '类型尚未确认。'],
}

/** 修正部分类型描述在星表里缺失的情况 */
const FIX_DESC = {
  gx: '数十亿至上千亿颗恒星组成的巨大系统，可含数万亿颗成员，尺度远大于星团。',
}

/**
 * 类型码覆盖表：修正上游 messier.json 的分类错误。
 *
 * 为什么必须手工修：上游把「不是星云也不是星团」的天体统统塞进 `s`（恒星），
 * 于是 28 个星系（M31 仙女座、M51 涡状星系、M104 草帽星系…）全被标成「单颗恒星」。
 * M82（雪茄星系）更离谱，被标成 `?`（未识别天体）。
 *
 * 症状很隐蔽：条目齐全、编号正确、坐标正确，只有类型标签是错的。
 * 页面上「仙女座星系 · 单颗恒星」这种自相矛盾的文案不会被任何构建工具发现。
 *
 * 判据来自梅西耶天体本身的性质（是否星系/星团/星云），
 * 全部为 NGC/IC 编号的星系，中文名取通行的「XX座星系」叫法。
 */
const TYPE_OVERRIDE = {
  // 星系（NGC 编号，银河系之外）
  M31: 'gx', M33: 'gx', M51: 'gx', M58: 'gx', M61: 'gx', M63: 'gx', M64: 'gx',
  M65: 'gx', M66: 'gx', M74: 'gx', M77: 'gx', M81: 'gx', M82: 'gx', M83: 'gx',
  M87: 'gx',
  M88: 'gx', M90: 'gx', M91: 'gx', M94: 'gx', M95: 'gx', M96: 'gx', M98: 'gx',
  M99: 'gx', M100: 'gx', M101: 'gx', M102: 'gx', M104: 'gx', M106: 'gx',
  M108: 'gx', M109: 'gx',
  // 星系内的亮星云/恒星云（不是星系本身，需与上面区分）
  M32: 'gx',
  // 星云
  M78: 'rn',
  // 星群（视觉成组的疏散星团）
  M73: 'oc',
  // 银河系的一段/定位标记
  M24: 'pos', M40: 'ds', M97: 'pn',
}

/** 星系的中文名（覆盖表的类型相同但名字要各自准确） */
const DSO_NAME_ZH = {
  M31: '仙女座星系', M32: '仙女座星系 M32', M33: '三角座星系',
  M51: '涡状星系', M63: '向日葵星系', M64: '黑眼星系', M77: '鲸鱼座 A 星系',
  M81: '波德星系', M82: '雪茄星系', M83: '南风车星系', M88: 'M88 星系',
  M91: 'M91 星系', M94: '猫眼星系', M101: '风车星系', M102: '纺锤星系',
  M104: '草帽星系', M106: 'M106 星系', M109: 'M109 星系',
  M58: 'M58 星系', M61: 'M61 星系', M65: '狮子座三重星系', M66: '狮子座三重星系',
  M74: 'M74 星系', M95: 'M95 星系', M96: 'M96 星系', M98: 'M98 星系',
  M99: 'M99 星系', M100: 'M100 星系', M108: 'M108 星系',
  M78: '反射星云', M73: '宝瓶座四星星群', M24: '银河系恒星云', M40: '温尼克 4 号双星',
  M97: '猫头鹰星云', M1: '蟹状星云', M42: '猎户座大星云', M43: '猎户座星云',
  M45: '昴星团', M13: '武仙座大星团', M44: '蜂巢星团', M57: '环状星云',
  M27: '哑铃星云', M51: '涡状星系', M64: '黑眼星系', M8: '礁湖星云',
  M20: '三叶星云', M16: '鹰状星云', M17: '欧米伽星云', M11: '野鸭星团',
  M22: '人马座大星团', M4: 'M4 星团', M5: 'M5 星团', M6: '蝴蝶星团',
  M7: '托勒密星团', M3: 'M3 星团', M2: 'M2 星团', M10: 'M10 星团',
  M12: 'M12 星团', M15: 'M15 星团', M92: 'M92 星团',
  M35: 'M35 星团', M36: 'M36 星团', M37: 'M37 星团',
  M41: '大犬座疏散星团', M46: '船底座疏散星团',
  // 上游 alt 字段是纯英文的两个；其余「Mxx 星团/星系」是描述性兜底名，保留即可
  M76: '小哑铃星云', M87: '室女座 A 星系',
}

async function main() {
  console.log('[star-catalog] 开始抓取原始星表…')
  const [stars, consts, lines, messier, starnames, starnamesCn] = await Promise.all(
    Object.values(FILES).map((f) => loadJSON(f)),
  )
  console.log(
    `[star-catalog] 原始：stars=${stars.features.length} constellations=${consts.features.length} lines=${lines.features.length} messier=${messier.features.length} 星名=${Object.keys(starnames).length}(中${Object.keys(starnamesCn).length})`,
  )

  /* ---- 星座（名称 + 中文） ---- */
  const outConsts = []
  // 缩写 → 中文座名。放在亮星之前算，因为亮星的 Bayer 兜底名要用它本地化。
  const conZhById = new Map()
  /**
   * 按 id 去重。
   *
   * 上游 constellations.json 里蛇座（Serpens）出现了两条**完全相同**的记录
   * （头尾两段在几何上是分开的，但条目本身重复），于是 id "Ser" 出现两次。
   * 前端 `useVisibleConstellations` 直接拿 abbr 当 React key，会触发
   * "Encountered two children with the same key" 警告（星图那个 tab 每次渲染必报）。
   *
   * 名字表去重即可：连线表本身按段存储（Ser 有 2 段），不受影响。
   */
  const seenConst = new Set()
  for (const f of consts.features) {
    const p = f.properties || {}
    const id = f.id || p.desig
    if (!id || seenConst.has(id)) continue
    seenConst.add(id)
    const zh = toSimplified(p.zh || '')
    conZhById.set(id, zh)
    outConsts.push([id, p.en || p.name || id, zh, Number(p.rank) || 3])
  }

  /* ---- 亮星 ---- */
  const nameLookup = buildNameLookup(starnames, starnamesCn)
  const outStars = []
  let named = 0
  for (const f of stars.features) {
    const mag = f.properties?.mag
    if (typeof mag !== 'number' || mag > MAG_LIMIT) continue
    const [lon, lat] = f.geometry.coordinates
    // feature.id 就是 HIP 星号，是与星名文件关联的唯一钥匙
    const rec = mag <= NAMED_MAG_LIMIT ? nameLookup.get(String(f.id)) : null
    const cn = rec && rec.cn ? toSimplified(rec.cn) : ''
    if (rec) named++
    // 显示名优先级：西文专名 → 本地化 Bayer 记号（船底座 π）→ 本地化佛兰斯蒂克编号（船底座 23）
    // Bayer 记号不是「将就」：南半球观星者认的就是它。
    const bayerZh = rec ? localizeBayer(rec.bayer, conZhById) : ''
    const flamZh = rec && rec.flam ? localizeFlam(rec.flam, rec.con, conZhById) : ''
    const label = (rec && rec.en) || bayerZh || flamZh || ''
    // [ra, dec, mag, bv, 显示名, 中文名] —— 位置/星等是定长前缀，名字可能为空串
    outStars.push([
      r2(ra360(lon)),
      r2(lat),
      r1(mag),
      f.properties?.bv ? Number(f.properties.bv) : 0,
      label,
      cn,
    ])
  }
  // 按星等排序：亮的在前，前端可以只渲染前 N 个做性能裁剪
  outStars.sort((a, b) => a[2] - b[2])

  /* ---- 星座连线：GeoJSON MultiLineString → 扁平坐标数组 ---- */
  const outLines = []
  for (const f of lines.features) {
    const id = f.id
    if (!id || !f.geometry) continue
    const parts = f.geometry.type === 'MultiLineString'
      ? f.geometry.coordinates
      : [f.geometry.coordinates]
    for (const line of parts) {
      if (!line || line.length < 2) continue
      const flat = []
      for (const [lon, lat] of line) flat.push(r2(ra360(lon)), r2(lat))
      outLines.push([id, flat])
    }
  }

  /* ---- 深空天体（梅西耶 + NGC 编号） ---- */
  const outDso = []
  const overridden = []
  for (const f of messier.features) {
    const p = f.properties || {}
    const [lon, lat] = f.geometry.coordinates
    const id = p.name || ''
    // 上游分类有误时以覆盖表为准（见 TYPE_OVERRIDE 的注释）
    const rawType = p.type || '?'
    const type = TYPE_OVERRIDE[id] || rawType
    if (TYPE_OVERRIDE[id] && TYPE_OVERRIDE[id] !== rawType) {
      overridden.push(`${id}(${rawType}→${type})`)
    }
    const [typeZh, typeDesc] = DSO_TYPE[type] || DSO_TYPE['?']
    // 中文名优先级：手工表 → 上游 alt（若非英文）→ 按类型自动生成「Mxx 星团 / 星系」
    // 最后这档是兜底：上游对多数球状星团/星系只给了 "M13 星团" 这类描述性 alt，
    // 直接透出会让页面看起来一半英文。这里统一用类型中文名兜住。
    const alt = p.alt || ''
    const altIsEnglish = /^[A-Za-z]/.test(alt)
    const zhName =
      DSO_NAME_ZH[id] || (!altIsEnglish ? alt : '') || `${id} ${typeZh}`
    outDso.push([
      id, // M31
      zhName, // 仙女座星系 / M13 球状星团
      r2(ra360(lon)),
      r2(lat),
      typeof p.mag === 'number' ? r1(p.mag) : '',
      type,
      typeZh,
      FIX_DESC[type] || typeDesc,
    ])
  }
  if (overridden.length) {
    console.log(`[star-catalog] 类型修正 ${overridden.length} 项：${overridden.join(' ')}`)
  }

  assertNoTraditional(outConsts.map((c) => c[2]).join(''), '星座名')
  assertNoTraditional(outStars.map((s) => s[5]).join(''), '亮星名')
  assertNoTraditional(outDso.map((d) => d[6]).join(''), '天体类型名')
  assertGalaxiesTyped(outDso)

  const payload = {
    // 元信息：前端可据此判断是否需要重新生成
    meta: {
      magLimit: MAG_LIMIT,
      namedMagLimit: NAMED_MAG_LIMIT,
      source: 'd3-celestial (ofrohn/d3-celestial), 原始星表基于 HYG v3 / Hipparcos',
      generatedAt: new Date().toISOString().slice(0, 10),
      counts: {
        stars: outStars.length,
        namedStars: named,
        constellations: outConsts.length,
        lineSegments: outLines.length,
        dso: outDso.length,
      },
      // 字段含义注释（前端只读 counts/meta，不参与渲染）
      schema: {
        stars: '[ra度, dec度, 星等, 色指数bv, 西文名, 中文名]',
        constellations: '[IAU缩写, 英文名, 中文名, 醒目等级1-3]',
        lines: '[星座缩写, 扁平坐标数组 ra,dec,ra,dec...]',
        dso: '[编号, 英文俗名, ra, dec, 星等, 类型码, 类型中文, 类型释义]',
      },
    },
    stars: outStars,
    constellations: outConsts,
    lines: outLines,
    dso: outDso,
  }

  await mkdir(dirname(OUT), { recursive: true })
  const text = JSON.stringify(payload)
  await writeFile(OUT, text, 'utf8')

  console.log('[star-catalog] 产物统计：')
  console.log(`  亮星 ${outStars.length} 颗（其中 ${named} 颗带名）`)
  console.log(`  星座 ${outConsts.length} 个，连线 ${outLines.length} 段`)
  console.log(`  深空天体 ${outDso.length} 个`)
  console.log(`  体积 ${(text.length / 1024).toFixed(0)} KB（原始约 756 KB）`)
  console.log(`  写入 ${OUT}`)
}

main().catch((e) => {
  console.error('[star-catalog] 失败:', e.message)
  process.exitCode = 1
})
